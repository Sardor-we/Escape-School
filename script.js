'use strict';
/* =====================================================================
   ESCAPE SCHOOL 3D
   1. Sozlamalar   2. Labirint   3. 3D sahna   4. Xonalar
   5. Boshqaruv    6. Jumboqlar  7. Maxluq     8. Tarmoq (do'stlar)
   9. O'yin sikli  10. Menyu
   ===================================================================== */

/* ---------- 1. SOZLAMALAR ---------- */
const CELL = 10, H = 4, DOOR = 3, T = .4, RAD = .45, LOAD = 2, EYE = 1.6;
const $ = id => document.getElementById(id);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

let N = 100, seed = 1, cols = 10, rows = 10, maze, dist, keyRoom = 0;
let running = false, hasKey = false, puzzleOpen = false, curRoom = -1, curCx = 0, curCz = 0;
let last = 0, sendT = 0, msgT = 0, reviveT = 0, bob = 0;
const solved = new Set();
const rooms = new Map();
const me = { x: 0, z: 0, yaw: 0, pitch: 0, dead: false, inv: 0 };
const mon = { x: 0, z: 0, tx: 0, tz: 0 };

function rng(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ---------- 2. LABIRINT ---------- */
// bitlar: 1=shimol, 2=sharq, 4=janub, 8=g'arb
function genMaze() {
  cols = Math.ceil(Math.sqrt(N)); rows = Math.ceil(N / cols);
  maze = new Uint8Array(N); dist = new Int32Array(N);
  const r = rng(seed), seen = new Uint8Array(N), st = [0];
  const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
  seen[0] = 1;
  while (st.length) {
    const i = st[st.length - 1], x = i % cols, z = (i / cols) | 0;
    const o = D.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz, j = nz * cols + nx;
      return nx >= 0 && nx < cols && nz >= 0 && j < N && !seen[j]; });
    if (!o.length) { st.pop(); continue; }
    const [dx, dz, b, ob] = o[(r() * o.length) | 0], j = (z + dz) * cols + x + dx;
    maze[i] |= b; maze[j] |= ob; seen[j] = 1; dist[j] = dist[i] + 1; st.push(j);
  }
  let best = 0; for (let i = 0; i < N; i++) if (dist[i] > dist[best]) best = i;
  keyRoom = best; // kalit eng uzoq xonada, chiqish esa 0-xonada
}

/* ---------- 3. 3D SAHNA ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, .1);
const cam = new THREE.PerspectiveCamera(75, 1, .1, 80);
cam.rotation.order = 'YXZ'; scene.add(cam);
scene.add(new THREE.AmbientLight(0x404050, .5));
const spot = new THREE.SpotLight(0xfff2cc, 2.2, 30, .55, .5, 1);
const aim = new THREE.Object3D(); aim.position.set(0, 0, -5);
cam.add(spot, aim); spot.target = aim;
const glow = new THREE.PointLight(0x8888ff, .6, 9); cam.add(glow);

function resize() { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const lam = c => new THREE.MeshLambertMaterial({ color: c }), bas = c => new THREE.MeshBasicMaterial({ color: c });
const M = { w: lam(0x6b705f), f1: lam(0x4a4640), f2: lam(0x3d3a35), ceil: lam(0x2a2a2a), desk: lam(0x6b4a2b),
  door: lam(0x7a1a1a), blood: bas(0x3a0000), term: bas(0x2288ff), key: bas(0xffd700), exit: bas(0x22ff66) };
const BOX = new THREE.BoxGeometry(1, 1, 1), PLANE = new THREE.PlaneGeometry(1, 1);

/* ---------- 4. XONALAR (faqat yaqindagilari yuklanadi) ---------- */
function loadRoom(i) {
  const cx = i % cols, cz = (i / cols) | 0, gx = cx * CELL, gz = cz * CELL, m = maze[i];
  const r = rng(seed * 7919 + i * 131), g = new THREE.Group(); g.position.set(gx, 0, gz);
  const room = { g, cols: [], block: [], bm: [], locked: false, puzzle: i > 0 && i !== keyRoom && r() < .13 };

  const box = (mat, w, h, d, x, y, z, col, list = room.cols) => {
    const b = new THREE.Mesh(BOX, mat); b.scale.set(w, h, d); b.position.set(x, y, z); g.add(b);
    if (col) list.push({ x0: gx + x - w / 2, x1: gx + x + w / 2, z0: gz + z - d / 2, z1: gz + z + d / 2 });
    return b;
  };
  // pol va shift
  const f = new THREE.Mesh(PLANE, (cx + cz) % 2 ? M.f1 : M.f2); f.rotation.x = -Math.PI / 2; f.scale.set(CELL, CELL, 1); g.add(f);
  const c = new THREE.Mesh(PLANE, M.ceil); c.rotation.x = Math.PI / 2; c.position.y = H; c.scale.set(CELL, CELL, 1); g.add(c);

  // devor (eshik bo'lsa — teshik qoldiriladi)
  const wall = (vert, x, z, open) => {
    if (!open) { vert ? box(M.w, T, H, CELL, x, H / 2, z, 1) : box(M.w, CELL, H, T, x, H / 2, z, 1); return; }
    const s = (CELL - DOOR) / 2, c = (CELL + DOOR) / 4;
    [-c, c].forEach(o => vert ? box(M.w, T, H, s, x, H / 2, z + o, 1) : box(M.w, s, H, T, x + o, H / 2, z, 1));
    vert ? box(M.w, T, H - 3, DOOR, x, 3.5, z, 0) : box(M.w, DOOR, H - 3, T, x, 3.5, z, 0);
  };
  wall(false, 0, -5, m & 1); wall(true, -5, 0, m & 8);
  if (cx === cols - 1 || i + 1 >= N) wall(true, 5, 0, 0);
  if (cz === rows - 1 || i + cols >= N) wall(false, 0, 5, 0);

  // partalar, qon izlari
  const n = 2 + (r() * 4 | 0);
  for (let k = 0; k < n; k++) {
    const x = (r() < .5 ? -1 : 1) * (2.2 + r() * 2), z = (r() < .5 ? -1 : 1) * (2.2 + r() * 2);
    if (Math.hypot(x - 3.4, z - 3.4) > 1.8 && Math.hypot(x + 3.4, z - 3.4) > 1.8) box(M.desk, 1.4, .8, .8, x, .4, z, 1);
  }
  if (r() < .4) { const s = new THREE.Mesh(PLANE, M.blood); s.rotation.x = -Math.PI / 2; s.position.set((r() - .5) * 6, .02, (r() - .5) * 6); s.scale.set(1 + r() * 2, 1 + r() * 2, 1); g.add(s); }

  // jumboq xonasi: terminal + yopiladigan eshiklar
  if (room.puzzle) {
    room.term = box(M.term, .8, 1.2, .8, 3.4, .6, 3.4, 1); room.tx = gx + 3.4; room.tz = gz + 3.4;
    [[1, 0, -5, 0], [2, 5, 0, 1], [4, 0, 5, 0], [8, -5, 0, 1]].forEach(([b, x, z, v]) => {
      if (!(m & b)) return;
      const bl = v ? box(M.door, .3, 3, DOOR, x, 1.5, z, 1, room.block) : box(M.door, DOOR, 3, .3, x, 1.5, z, 1, room.block);
      bl.visible = false; room.bm.push(bl);
    });
  }
  // kalit
  if (i === keyRoom && !hasKey) {
    room.key = box(M.key, .35, .35, .35, -3.4, 1.1, 3.4, 0); room.kx = gx - 3.4; room.kz = gz + 3.4;
    const l = new THREE.PointLight(0xffd700, 1, 8); l.position.set(-3.4, 1.4, 3.4); g.add(l);
  }
  // chiqish eshigi (0-xona)
  if (i === 0) box(M.exit, .1, 3, DOOR, -4.75, 1.5, 0, 0);

  scene.add(g); rooms.set(i, room);
}
function updateRooms(ci) {
  const cx = ci % cols, cz = (ci / cols) | 0, want = new Set();
  for (let dz = -LOAD; dz <= LOAD; dz++) for (let dx = -LOAD; dx <= LOAD; dx++) {
    const x = cx + dx, z = cz + dz, j = z * cols + x;
    if (x >= 0 && x < cols && z >= 0 && j < N) want.add(j);
  }
  want.forEach(j => rooms.has(j) || loadRoom(j));
  rooms.forEach((r, j) => { if (!want.has(j)) { scene.remove(r.g); rooms.delete(j); } });
}
function clearRooms() { rooms.forEach(r => scene.remove(r.g)); rooms.clear(); curRoom = -1; }

function blocked(x, z) {
  for (const [i, r] of rooms) {
    if (Math.abs(i % cols - curCx) > 1 || Math.abs(((i / cols) | 0) - curCz) > 1) continue;
    const hit = b => x > b.x0 - RAD && x < b.x1 + RAD && z > b.z0 - RAD && z < b.z1 + RAD;
    if (r.cols.some(hit) || (r.locked && r.block.some(hit))) return true;
  }
  return false;
}
function setLock(room, on) { room.locked = on; room.bm.forEach(b => b.visible = on); }

/* ---------- 5. BOSHQARUV ---------- */
const keys = {}, stick = { x: 0, y: 0 };
let actHeld = false;
addEventListener('keydown', e => { keys[e.code] = 1; if (e.code === 'KeyE' && !e.repeat) interact(); });
addEventListener('keyup', e => keys[e.code] = 0);
$('c').addEventListener('click', () => { if (running && !isTouch && !puzzleOpen && !me.dead) $('c').requestPointerLock?.(); });
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== $('c')) return;
  me.yaw -= e.movementX * .002; me.pitch = Math.max(-1.3, Math.min(1.3, me.pitch - e.movementY * .002));
});
// telefon: joystik va qarash
let lookId = null, lx = 0, ly = 0;
const stk = $('stick'), knob = $('knob');
function stickMove(t) {
  const b = stk.getBoundingClientRect(), dx = t.clientX - (b.left + 60), dy = t.clientY - (b.top + 60), l = Math.min(1, Math.hypot(dx, dy) / 45) || 0, a = Math.atan2(dy, dx);
  stick.x = Math.cos(a) * l; stick.y = Math.sin(a) * l;
  knob.style.transform = `translate(${stick.x * 40}px,${stick.y * 40}px)`;
}
stk.addEventListener('touchstart', e => { e.preventDefault(); stickMove(e.changedTouches[0]); stk._id = e.changedTouches[0].identifier; }, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === stk._id) stickMove(t);
    else if (t.identifier === lookId) { me.yaw -= (t.clientX - lx) * .006; me.pitch = Math.max(-1.3, Math.min(1.3, me.pitch - (t.clientY - ly) * .006)); lx = t.clientX; ly = t.clientY; }
  }
}, { passive: true });
addEventListener('touchstart', e => {
  if (!running) return;
  for (const t of e.changedTouches) if (t.clientX > innerWidth * .4 && lookId === null && !t.target.closest('button,#puzzle')) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
}, { passive: true });
addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === stk._id) { stk._id = null; stick.x = stick.y = 0; knob.style.transform = ''; }
    if (t.identifier === lookId) lookId = null;
  }
});
$('act').addEventListener('touchstart', e => { e.preventDefault(); actHeld = true; interact(); }, { passive: false });
$('act').addEventListener('touchend', () => actHeld = false);

function say(t, ms = 2200) { $('msg').textContent = t; msgT = ms / 1000; }
function flash() { const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 120); navigator.vibrate?.(200); }

/* ---------- 6. JUMBOQLAR ---------- */
const RIDDLES = [
  ['Doim keladi, lekin hech qachon yetib kelmaydi. Bu nima?', 'Ertaga', ['Ertaga', 'Kecha', 'Soya']],
  ['Ko‘zi bor, lekin ko‘rmaydi. Bu nima?', 'Igna', ['Igna', 'Quloq', 'Eshik']],
  ['Qancha ko‘p quritsang, shuncha ho‘l bo‘ladi. Bu nima?', 'Sochiq', ['Sochiq', 'Quyosh', 'Shamol']],
  ['Og‘zi yo‘q, lekin gapiradi. Qulog‘i yo‘q, lekin eshitadi. Bu nima?', 'Aks-sado', ['Aks-sado', 'Radio', 'Tosh']],
  ['Qancha ko‘p olsang, shuncha ko‘p qoladi. Bu nima?', 'Iz', ['Pul', 'Iz', 'Vaqt']],
  ['Uyi bor, lekin yashamaydi. Eshigi bor, lekin kirmaydi. Bu nima?', 'Shaxmat doskasi', ['Shaxmat doskasi', 'Qo‘ng‘iroq', 'Kitob']]
];
let curPuzzle = -1;
function makeQuestion() {
  if (Math.random() < .5) { const q = RIDDLES[Math.random() * RIDDLES.length | 0]; return [q[0], q[1], [...q[2]].sort(() => Math.random() - .5)]; }
  const a = 3 + Math.random() * 9 | 0, b = 2 + Math.random() * 8 | 0, c = 2 + Math.random() * 6 | 0, ans = a + b * c;
  const o = new Set([ans]); while (o.size < 4) o.add(ans + (Math.random() * 12 | 0) - 6);
  return [`Doskada yozilgan: ${a} + ${b} × ${c} = ?`, String(ans), [...o].map(String).sort(() => Math.random() - .5)];
}
function openPuzzle(i) {
  curPuzzle = i; puzzleOpen = true; document.exitPointerLock?.();
  const [q, ans, opts] = makeQuestion();
  $('pq').textContent = q; $('pa').innerHTML = '';
  opts.forEach(o => { const b = document.createElement('button'); b.textContent = o;
    b.onclick = () => { if (o === ans) { closePuzzle(); solve(i, true); } else { flash(); say('Xato! U yaqinlashmoqda…', 2500); mon.x = me.x + 14; mon.z = me.z + 14; closePuzzle(); } };
    $('pa').appendChild(b); });
  $('puzzle').classList.remove('hidden');
}
function closePuzzle() { puzzleOpen = false; $('puzzle').classList.add('hidden'); }
$('pclose').onclick = closePuzzle;
function solve(i, emit) {
  solved.add(i); const r = rooms.get(i); if (r) setLock(r, false);
  if (emit) { say('Eshiklar ochildi!'); send({ t: 'solve', i }); }
}

function interact() {
  if (!running || me.dead || puzzleOpen) return;
  const r = rooms.get(curRoom);
  if (r && r.puzzle && !solved.has(curRoom) && Math.hypot(me.x - r.tx, me.z - r.tz) < 2.4) return openPuzzle(curRoom);
  if (curRoom === 0 && Math.hypot(me.x + 4.6, me.z) < 3) {
    if (hasKey) return win(true);
    say('Eshik qulflangan. Kalitni top!');
  }
}

/* ---------- 7. MAXLUQ ---------- */
const monster = new THREE.Group();
{
  const b = new THREE.Mesh(BOX, bas(0x1a1a22)); b.scale.set(.8, 2.2, .5); b.position.y = 1.1; monster.add(b);
  [-.18, .18].forEach(x => { const e = new THREE.Mesh(BOX, bas(0xff0000)); e.scale.set(.12, .08, .05); e.position.set(x, 1.8, -.26); monster.add(e); });
  const l = new THREE.PointLight(0xff0000, 1, 7); l.position.y = 1.5; monster.add(l);
}
scene.add(monster);

function placeMonster(px, pz) {
  const a = Math.random() * 6.28, d = 40;
  mon.x = Math.max(-15, Math.min(cols * CELL + 15, px + Math.cos(a) * d));
  mon.z = Math.max(-15, Math.min(rows * CELL + 15, pz + Math.sin(a) * d));
}
function monsterAI(dt) {
  if (Net.mode === 'client') { mon.x += (mon.tx - mon.x) * Math.min(1, dt * 8); mon.z += (mon.tz - mon.z) * Math.min(1, dt * 8); return; }
  const list = [];
  if (!me.dead) list.push({ id: Net.id, x: me.x, z: me.z, inv: me.inv });
  for (const id in Net.players) { const p = Net.players[id]; if (!p.dead) list.push({ id: +id, x: p.x, z: p.z, inv: p.inv || 0 }); }
  if (!list.length) return;
  let t = list[0], bd = 1e9;
  list.forEach(p => { const d = Math.hypot(p.x - mon.x, p.z - mon.z); if (d < bd) { bd = d; t = p; } });
  const sp = Math.min(4.6, 2.3 + solved.size * .15);
  if (bd > 75) placeMonster(t.x, t.z);
  else if (bd > .01) { mon.x += (t.x - mon.x) / bd * sp * dt; mon.z += (t.z - mon.z) / bd * sp * dt; }
  if (bd < 1.1 && t.inv <= 0) { if (t.id === Net.id) die(); else { send({ t: 'kill', id: t.id }); Net.players[t.id].dead = true; } }
}

function die() {
  if (me.dead) return; me.dead = true; flash(); stick.x = stick.y = 0;
  document.exitPointerLock?.();
  if (Net.mode === 'solo') return endGame(false);
  say('O‘ldingiz! Do‘stingiz sizni tiriltirishi mumkin…', 6000);
}
function revive() {
  me.dead = false; me.inv = 4; say('Siz tirildingiz! Qoching!', 3000);
}
function allDead() { return me.dead && Object.values(Net.players).every(p => p.dead); }

/* ---------- 8. TARMOQ (do'stlar bilan) ---------- */
const Net = { mode: 'solo', peer: null, conns: [], host: null, id: 0, nid: 0, players: {} };
const COLORS = [0x66ccff, 0xffaa33, 0x77ee77, 0xee66ee, 0xffee55];
function mkPlayer(col) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.2, 8), bas(col)); b.position.y = .7;
  const h = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 8), bas(col)); h.position.y = 1.5;
  g.add(b, h, new THREE.PointLight(col, .5, 6)); scene.add(g); return g;
}
function send(m) {
  if (Net.mode === 'host') Net.conns.forEach(c => c.open && c.send(m));
  else if (Net.mode === 'client' && Net.host && Net.host.open) Net.host.send(m);
}
function onData(m, from) {
  handle(m);
  if (Net.mode === 'host') Net.conns.forEach(c => c !== from && c.open && c.send(m));
}
function handle(m) {
  switch (m.t) {
    case 'welcome': Net.id = m.id; break;
    case 'start': N = m.N; seed = m.seed; startGame(); break;
    case 'p': {
      if (m.id === Net.id) break;
      const p = Net.players[m.id] || (Net.players[m.id] = { x: m.x, z: m.z, yaw: 0, dead: false, inv: 0, mesh: mkPlayer(COLORS[m.id % 5]) });
      p.tx = m.x; p.tz = m.z; p.yaw = m.yaw; p.dead = m.d; break;
    }
    case 'm': mon.tx = m.x; mon.tz = m.z; break;
    case 'key': hasKey = true; refreshKey(); rooms.forEach(r => { if (r.key) { r.g.remove(r.key); r.key = null; } }); break;
    case 'solve': solve(m.i, false); break;
    case 'kill': if (m.id === Net.id) die(); else if (Net.players[m.id]) Net.players[m.id].dead = true; break;
    case 'revive':
      if (m.id === Net.id) revive(); else if (Net.players[m.id]) { Net.players[m.id].dead = false; Net.players[m.id].inv = 4; }
      if (Net.mode === 'host') { const p = Net.players[m.id], px = m.id === Net.id ? me.x : p && p.x, pz = m.id === Net.id ? me.z : p && p.z; placeMonster(px || 0, pz || 0); }
      break;
    case 'win': win(false); break;
    case 'over': endGame(false); break;
  }
}
function setupHostPeer() {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  Net.peer = new Peer('esc-' + code);
  Net.peer.on('open', () => { Net.mode = 'host'; $('status').textContent = `Xona kodi: ${code} — do‘stlaringizga ayting. Qo‘shilganlar: 0`; $('btnGo').classList.remove('hidden'); });
  Net.peer.on('error', e => e.type === 'unavailable-id' ? setupHostPeer() : $('status').textContent = 'Xato: ' + e.type);
  Net.peer.on('connection', c => {
    Net.conns.push(c);
    c.on('open', () => { c.send({ t: 'welcome', id: ++Net.nid });
      $('status').textContent = $('status').textContent.replace(/\d+$/, Net.conns.filter(x => x.open).length); });
    c.on('data', d => onData(d, c));
    c.on('close', () => { Net.conns = Net.conns.filter(x => x !== c); });
  });
}
function joinGame(code) {
  Net.peer = new Peer(); Net.mode = 'client';
  Net.peer.on('open', () => {
    Net.host = Net.peer.connect('esc-' + code.toUpperCase(), { reliable: true });
    Net.host.on('open', () => $('status').textContent = 'Ulandi! Xona egasi o‘yinni boshlashini kuting…');
    Net.host.on('data', handle);
    Net.host.on('close', () => say('Host chiqib ketdi', 4000));
  });
  Net.peer.on('error', e => { $('status').textContent = 'Ulanib bo‘lmadi (' + e.type + '). Kodni tekshiring.'; });
}

/* ---------- 9. O'YIN SIKLI ---------- */
function refreshKey() { const k = $('keyInfo'); k.textContent = hasKey ? '🔑 Kalit: BOR ✅ — chiqishga qayt!' : '🔑 Kalit: YO‘Q'; k.classList.toggle('ok', hasKey); }

function startGame() {
  clearRooms(); solved.clear(); Object.values(Net.players).forEach(p => p.mesh && scene.remove(p.mesh)); Net.players = {};
  hasKey = false; me.x = me.z = 0; me.yaw = 0; me.pitch = 0; me.dead = false; me.inv = 3; reviveT = 0;
  genMaze(); placeMonster(0, 0); mon.tx = mon.x; mon.tz = mon.z;
  ['menu', 'end'].forEach(i => $(i).classList.add('hidden'));
  $('hud').classList.remove('hidden'); $('touch').classList.toggle('hidden', !isTouch);
  refreshKey(); running = true;
  say(isTouch ? 'Kalitni top va chiqishga qayt!' : 'Ekranni bosing — sichqoncha ishga tushadi. Kalitni top!', 4500);
  startAudio(); last = performance.now();
}
function endGame(won) {
  running = false; closePuzzle(); document.exitPointerLock?.();
  $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); $('end').classList.remove('hidden');
  $('endTitle').textContent = won ? 'QUTULDINGIZ!' : 'SIZ O‘LDINGIZ';
  $('endText').textContent = won ? 'Maktabdan sog‘-salomat chiqdingiz.' : 'Maktab sizni qoldirmadi…';
  if (gn) gn.gain.value = 0;
}
function win(emit) { if (emit) send({ t: 'win' }); endGame(true); }

let ac, gn;
function startAudio() {
  if (ac) return;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(); gn = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 48; gn.gain.value = 0; o.connect(gn).connect(ac.destination); o.start(); } catch (e) { }
}

function update(dt) {
  // harakat
  const k = c => keys[c] ? 1 : 0;
  let ix = k('KeyD') - k('KeyA') + stick.x, iz = k('KeyW') - k('KeyS') - stick.y;
  const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
  const sp = me.dead || puzzleOpen ? 0 : (keys.ShiftLeft || l > .95 && isTouch ? 6.2 : 4.2);
  const s = Math.sin(me.yaw), c = Math.cos(me.yaw), dx = (ix * c - iz * s) * sp * dt, dz = (-ix * s - iz * c) * sp * dt;
  if (!blocked(me.x + dx, me.z)) me.x += dx;
  if (!blocked(me.x, me.z + dz)) me.z += dz;
  if (sp && l) bob += dt * 9;
  me.inv = Math.max(0, me.inv - dt);
  for (const id in Net.players) if (Net.players[id].inv > 0) Net.players[id].inv -= dt;

  // hozirgi xona
  curCx = Math.max(0, Math.min(cols - 1, Math.round(me.x / CELL)));
  curCz = Math.max(0, Math.min(rows - 1, Math.round(me.z / CELL)));
  const ci = Math.min(N - 1, curCz * cols + curCx);
  if (ci !== curRoom) { curRoom = ci; updateRooms(ci); $('roomInfo').textContent = `Xona ${ci + 1} / ${N}`; }
  const room = rooms.get(ci);

  // jumboq xonasiga kirsak eshiklar yopiladi
  if (room && room.puzzle && !solved.has(ci) && !room.locked && Math.abs(me.x - curCx * CELL) < 3.6 && Math.abs(me.z - curCz * CELL) < 3.6) {
    setLock(room, true); flash(); say('Eshiklar yopildi! Ko‘k terminalni top (E).', 3500);
  }
  // kalit
  if (room && room.key) {
    room.key.rotation.y += dt * 2;
    if (Math.hypot(me.x - room.kx, me.z - room.kz) < 1.6 && !me.dead) { hasKey = true; room.g.remove(room.key); room.key = null; refreshKey(); say('Kalit sizda! Endi 1-xonadagi yashil eshikka qayt!', 4000); send({ t: 'key' }); }
  }

  // tiriltirish: o'lik do'st yonida E ni ushlab turish
  let near = null;
  if (!me.dead) for (const id in Net.players) { const p = Net.players[id]; if (p.dead && Math.hypot(p.x - me.x, p.z - me.z) < 2.6) near = +id; }
  if (near !== null && (keys.KeyE || actHeld)) {
    reviveT += dt; say(`Tiriltirilmoqda… ${Math.ceil(3 - reviveT)}`, 300);
    if (reviveT >= 3) { reviveT = 0; Net.players[near].dead = false; Net.players[near].inv = 4; send({ t: 'revive', id: near }); if (Net.mode === 'host') placeMonster(me.x, me.z); }
  } else reviveT = 0;

  // matn
  msgT -= dt; if (msgT <= 0) {
    let h = '';
    if (near !== null) h = 'Do‘stingiz o‘lgan — E ni 3 soniya bosib turing';
    else if (room && room.puzzle && !solved.has(ci) && Math.hypot(me.x - room.tx, me.z - room.tz) < 2.4) h = 'E — jumboqni ochish';
    else if (ci === 0 && Math.hypot(me.x + 4.6, me.z) < 3) h = hasKey ? 'E — maktabdan chiq!' : 'Eshik qulflangan';
    $('msg').textContent = h;
  }

  // maxluq
  monsterAI(dt);
  monster.position.set(mon.x, Math.sin(performance.now() / 400) * .1, mon.z);
  monster.rotation.y = Math.atan2(-(me.x - mon.x), -(me.z - mon.z));
  const md = Math.hypot(me.x - mon.x, me.z - mon.z);
  spot.intensity = 2.2 * (Math.random() < Math.max(.01, (12 - md) / 60) ? .15 : 1);
  if (gn) gn.gain.value = me.dead ? 0 : Math.max(0, 1 - md / 25) * .12;

  // boshqa o'yinchilar
  const team = [];
  for (const id in Net.players) {
    const p = Net.players[id];
    p.x += (p.tx - p.x) * Math.min(1, dt * 10); p.z += (p.tz - p.z) * Math.min(1, dt * 10);
    p.mesh.position.set(p.x, p.dead ? .25 : 0, p.z); p.mesh.rotation.set(0, p.yaw, p.dead ? Math.PI / 2 : 0);
    team.push(`<div class="${p.dead ? 'dead' : ''}">Do‘st ${id}: ${p.dead ? 'o‘lik 💀' : 'tirik'}</div>`);
  }
  if (Net.mode !== 'solo') $('team').innerHTML = team.join('');

  // tarmoqqa yuborish (sekundiga 10 marta)
  sendT -= dt;
  if (sendT <= 0 && Net.mode !== 'solo') {
    sendT = .1; send({ t: 'p', id: Net.id, x: me.x, z: me.z, yaw: me.yaw, d: me.dead });
    if (Net.mode === 'host') send({ t: 'm', x: mon.x, z: mon.z });
    if (Net.mode === 'host' && allDead()) { send({ t: 'over' }); endGame(false); }
  }

  // kamera
  cam.position.set(me.x, me.dead ? .4 : EYE + Math.sin(bob) * .04, me.z);
  cam.rotation.set(me.dead ? 0 : me.pitch, me.yaw, me.dead ? .6 : 0);
}

function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (running) update(dt);
  renderer.render(scene, cam);
}
requestAnimationFrame(loop);

/* ---------- 10. MENYU ---------- */
document.querySelectorAll('#sizes button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#sizes button').forEach(x => x.classList.remove('on')); b.classList.add('on'); N = +b.dataset.n; $('custom').value = '';
});
$('custom').oninput = e => {
  const v = Math.max(10, Math.min(2000, +e.target.value | 0)); if (e.target.value) { N = v; document.querySelectorAll('#sizes button').forEach(x => x.classList.remove('on')); }
};
$('btnSolo').onclick = () => { Net.mode = 'solo'; seed = Math.random() * 1e9 | 0; startGame(); $('c').requestPointerLock?.(); };
$('btnHost').onclick = () => { $('status').textContent = 'Xona yaratilmoqda…'; setupHostPeer(); };
$('btnJoin').onclick = () => { const c = $('joinCode').value.trim(); if (c.length < 5) return $('status').textContent = 'Xona kodini kiriting (5 ta belgi)'; $('status').textContent = 'Ulanmoqda…'; joinGame(c); };
$('btnGo').onclick = () => {
  seed = Math.random() * 1e9 | 0; send({ t: 'start', N, seed }); startGame(); $('c').requestPointerLock?.();
};
$('btnAgain').onclick = () => location.reload();