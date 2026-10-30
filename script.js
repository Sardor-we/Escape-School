const $=q=>document.getElementById(q),T=THREE,TAU=Math.PI*2;
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const norm=s=>String(s).toLowerCase().replace(/[ʻ’'`ʼ‘\s]/g,'');
const ren=new T.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio,2));document.body.prepend(ren.domElement);
const scene=new T.Scene(),cam=new T.PerspectiveCamera(70,1,.1,130);scene.add(cam);
const amb=new T.AmbientLight(0xffffff,.3);scene.add(amb);
const torch=new T.PointLight(0xfff2cc,.9,15);cam.add(torch);
function rs(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',rs);rs();
const M=(c,e)=>new T.MeshLambertMaterial({color:c,emissive:e||0});
const MB=c=>new T.MeshBasicMaterial({color:c});
function brickC(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#9a4632';g.fillRect(0,0,128,128);g.strokeStyle='#e3d2b4';g.lineWidth=3;for(let y=0;y<128;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(128,y);g.stroke();for(let x=(y/16%2)*32;x<128;x+=64){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+16);g.stroke()}}return c}
const BC=brickC();
const brickM=(rx,ry)=>{const t=new T.CanvasTexture(BC);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);return new T.MeshLambertMaterial({map:t})};
function gridM(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.strokeStyle='#c9ced6';g.lineWidth=4;for(let i=0;i<=64;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.moveTo(0,i);g.lineTo(64,i);g.stroke()}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(5,3);return new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide})}
function label(s,col){const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle='#223';g.fillRect(0,0,128,64);g.fillStyle=col||'#fff';g.font='bold 40px sans-serif';g.textAlign='center';g.fillText(s,64,46);return new T.MeshBasicMaterial({map:new T.CanvasTexture(c)})}

// ---------- state ----------
let seed=1,rm=null,host=true,playing=false,level=0,G=null,cols=[],ints=[],D={},lampM={},items=[],modal=null;
const me={n:'Oyinchi',x:40,z:8,yaw:0,pit:0,lv:0,hide:null,jail:false,c:0,drive:false,jt:0};
let taken=new Set(),opened=new Set(),inst=new Set(),got=new Set(),RL={},CL={},power=false;
const car={x:-25,z:8,psi:Math.PI/2,v:0,g:null},proj=[];
const gr=[{id:0,male:1,x:20,z:8,lv:1,wx:20,wz:8,st:0,cd:0,tl:0,mx:0,mz:0},{id:1,male:0,x:50,z:8,lv:2,wx:50,wz:8,st:0,cd:0,tl:0,mx:0,mz:0}];
const PN={akk:'Akkumulyator',motor:'Motor',kalit:'Mashina kaliti',gayka:'Motorni qotirish kaliti',benzin:'Benzin',hutkey:'Kulba kaliti'};
const PI={akk:'🔋',motor:'⚙️',kalit:'🔑',gayka:'🔧',benzin:'⛽',hutkey:'🗝️'};

// ---------- helpers ----------
function B(w,h,d,x,y,z,m,p){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);(p||G).add(o);return o}
function C(x0,z0,x1,z1,o){const c=Object.assign({x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1)},o||{});cols.push(c);return c}
function W(x0,z0,x1,z1,m,h){h=h||4;const t=.25,ax=Math.abs(x1-x0)>=Math.abs(z1-z0);B(ax?Math.abs(x1-x0):t,h,ax?t:Math.abs(z1-z0),(x0+x1)/2,h/2,(z0+z1)/2,m);if(ax)C(x0,z0-t/2,x1,z1+t/2);else C(x0-t/2,z0,x1+t/2,z1)}
function WG(z,gs,m){let x=0;for(const g of gs){W(x,z,g-.9,z,m);x=g+.9}W(x,z,78,z,m)}
function door(id,cx,z,m){const o=B(1.8,3,.18,cx,1.5,z,m||M(0x7a4a22)),c=C(cx-.9,z-.15,cx+.9,z+.15);D[id]={m:o,c};if(opened.has(id)){o.visible=false;c.open=1}}
function I(x,z,r,t,f){ints.push({x,z,r,t,f})}
function openDoor(id){opened.add(id);const d=D[id];if(d){d.m.visible=false;d.c.open=1}}
function bc(t,d){if(rm)rm.emit(t,d)}
function msg(s,ms){const e=$('ms2');e.textContent=s;clearTimeout(msg.t);msg.t=setTimeout(()=>e.textContent='',ms||2500)}

// ---------- riddles ----------
const RID=[["Tilsiz, ogʻizsiz soʻzlaydi, oʻqisang bilim beradi. Bu nima?",["kitob"]],["Qoʻli bor yurmaydi, yuzi bor kulmaydi, 12 raqami bor. Bu nima?",["soat"]],["Kechasi osmonga sochilgan marjon. Bu nima?",["yulduz","yulduzlar"]],["Qishda yogʻadi, oppoq, sovuq. Bu nima?",["qor"]],["Haftada nechta kun bor?",["7","yetti"]],["Bir yilda nechta oy bor?",["12","oniki"]],["Quyosh qaysi tomondan chiqadi? (sharq yoki gʻarb)",["sharq"]],["Oʻzbekiston poytaxti qaysi shahar?",["toshkent"]],["Qorning rangi qanday?",["oq"]],["Tovuqning nechta oyogʻi bor?",["2","ikki","ikkita"]],["Yozda yashil, kuzda sargʻayadi, qishda yalangʻoch. Bu nima?",["daraxt"]],["Suv necha gradusda qaynaydi?",["100","yuz"]]];
function riddle(lv,r){const R=rng(seed*7+lv*100+r+3);if(R()<.5){const a=2+(R()*9|0),b=2+(R()*9|0),o=R()*3|0;return o==0?{q:`${a} + ${b} = ?`,a:[String(a+b)]}:o==1?{q:`${a+b} − ${b} = ?`,a:[String(a)]}:{q:`${a} × ${b} = ?`,a:[String(a*b)]}}const p=RID[R()*RID.length|0];return{q:p[0],a:p[1]}}
const HARD=[["Dunyodagi eng baland togʻ qaysi?",["everest","jomolungma"]],["Amir Temur qaysi shaharda tugʻilgan?",["shahrisabz","kesh"]],["Suvning kimyoviy formulasi nima?",["h2o"]],["Eng katta okean qaysi?",["tinch","tinchokean"]],["Mirzo Ulugʻbek qaysi fan bilan shugʻullangan?",["astronomiya","astronom"]],["Quyosh tizimidagi eng katta sayyora qaysi?",["yupiter"]],["Oʻzbekiston mustaqillikka qaysi yili erishgan?",["1991"]],["Inson tanasidagi eng katta aʼzo qaysi?",["teri"]],["“Hamlet” asarining muallifi kim?",["shekspir","shakespeare"]],["“Avesto” qaysi dinning muqaddas kitobi?",["zardushtiylik","zardusht"]],["Xamsa muallifi kim?",["navoiy","alisher navoiy","alishernavoiy"]],["Dunyodagi eng katta qumli choʻl qaysi?",["sahara","sahroikabir"]],["Kislorodning kimyoviy belgisi nima?",["o"]],["Qaysi gaz oʻsimliklar fotosintezida yutiladi?",["karbonat angidrid","co2","karbonatangidrid"]]];
let lastHard=-1;
function ask(q,a,ok,hard){if(document.pointerLockElement)document.exitPointerLock();modal={a,ok,hard};$('qq').textContent=q;$('qa').value='';$('qm').textContent='';$('qo').hidden=false;setTimeout(()=>$('qa').focus(),60)}
function hardQ(ok){let i;do{i=Math.random()*HARD.length|0}while(i==lastHard);lastHard=i;ask(HARD[i][0],HARD[i][1],ok,1)}
$('qb').onclick=sub;$('qa').onkeydown=e=>{if(e.key==='Enter')sub();e.stopPropagation()};
$('qc').onclick=()=>{$('qo').hidden=true;modal=null};
function sub(){if(!modal)return;const v=norm($('qa').value);if(modal.a.some(x=>norm(x)===v)){const f=modal.ok;$('qo').hidden=true;modal=null;f()}else if(modal.hard){$('qm').textContent='Notoʻgʻri! Yangi savol…';const f=modal.ok;let i;do{i=Math.random()*HARD.length|0}while(i==lastHard);lastHard=i;modal={a:HARD[i][1],ok:f,hard:1};$('qq').textContent=HARD[i][0];$('qa').value=''}else $('qm').textContent='Notoʻgʻri, yana urinib koʻring'}

// ---------- items ----------
function genItems(){const R=rng(seed*13+5);items=[];const rr=()=>{const lv=1+(R()*4|0),r=R()*25|0,cx=6*(r%13)+3-0,zd=r<13?3:13;return{lv,x:(r<13?6*r+3:6*(r-13)+3)+(R()-.5)*2.5,z:(r<13?3:13)+(R()-.5)*2}};
for(const t of['akk','motor','hutkey'])items.push(Object.assign({t},rr()));
items.push({t:'kalit',lv:0,x:74,z:4},{t:'gayka',lv:0,x:6,z:3},{t:'benzin',lv:0,x:20+R()*40,z:6+R()*4})}
const COL={akk:0x33ff66,motor:0xff9933,kalit:0xffee33,gayka:0x66ccff,benzin:0xff3333,hutkey:0xcc66ff};

// ---------- level build ----------
function build(lv){
 if(G)scene.remove(G);G=new T.Group();scene.add(G);cols=[];ints=[];D={};lampM={};level=lv;
 const wm=M(0xe8dfc8),fm=M(lv?0x6b5b4b:0x555560),cm=M(0xf4f0e6);
 scene.background=new T.Color(lv==1?0x8aa0c8:0x05060a);scene.fog=new T.Fog(lv==1?0x8aa0c8:0x05060a,18,lv==1?95:52);
 B(80,.2,18,39,-.1,8,fm);B(80,.2,18,39,4.1,8,cm);
 if(lv==0)base();else floor(lv);
 for(const it of items)if(it.lv==lv&&!taken.has(it.t)){const m=B(.4,.4,.4,it.x,.9,it.z,new T.MeshBasicMaterial({color:COL[it.t]}));const o=it;m.userData.it=1;I(it.x,it.z,1.4,()=>'E — '+PN[o.t]+'ni olish',()=>{if(taken.has(o.t))return;taken.add(o.t);got.add(o.t);m.visible=false;bc('take',{t:o.t});msg(PI[o.t]+' '+PN[o.t]+' topildi!')})}
 if(lv==1)yard();
 refreshLamps();
}
function base(){
 const wm=M(0x6e7480);
 W(0,0,78,0,wm);W(0,16,78,16,wm);W(0,0,0,16,wm);W(78,0,78,16,wm);
 for(let z=.5;z<16;z+=1)B(.08,3.6,.08,12,1.8,z,M(0x999999));C(11.9,0,12.1,16);
 B(2,.2,3,6,.5,13,M(0x6b4a2a));
 W(66,0,66,8,wm);W(66,8,69.1,8,wm);W(70.9,8,78,8,wm);door('q',70,8,M(0x444c60));
 B(.7,.9,.1,72.3,1.4,8.2,MB(0x2a8cff));
 I(72.3,8.9,1.4,()=>opened.has('q')?null:'E — Qiyin savol terminali',()=>hardQ(()=>{openDoor('q');bc('open',{id:'q'});msg('Podval eshigi ochildi!')}));
 const R=rng(seed);[[25,1.5],[31,14.6],[50,1.5],[55,14.6],[40,1.5],[18,14.5]].forEach(p=>{B(1.4,1.4,1.4,p[0],.7,p[1],M(0x8a6a3a));C(p[0]-.7,p[1]-.7,p[0]+.7,p[1]+.7)});
 for(let i=0;i<8;i++)B(.5,.18*(i+1),2,40.25+i*.5,.09*(i+1),8,M(0xb0b0b8));
 for(let x=10;x<70;x+=14)B(.7,.2,.7,x,3.95,8,MB(0xffe9a8));
 if(level==0)for(let i=0;i<5;i++)B(.3,.06,.3,6,2.3,1+3*i,MB(0x666666));
 // cell rescue
 I(13.4,8,2.2,()=>PL().some(p=>p.j&&p.c<5&&!p.me)?'E — Doʻstni qutqarish!':null,()=>{for(const p of PL())if(p.j&&p.c<5&&!p.me)bc('free',{p:p.peer});msg('Doʻstingiz ozod boʻldi!')});
}
function floor(lv){
 const wm=M([0,0xe8dfc8,0xdfe8d0,0xd8e0ee,0xeedfe3][lv]);
 W(0,0,78,0,wm);W(0,16,78,16,wm);W(78,0,78,16,wm);
 if(lv>1)W(0,0,0,16,wm);else{W(0,0,0,6,brickM(4,2));W(0,10,0,16,brickM(4,2))}
 const N=[],S=[];for(let i=0;i<13;i++)N.push(6*i+3);for(let i=0;i<12;i++)S.push(6*i+3);
 WG(6,N,wm);WG(10,S,wm);for(let i=1;i<13;i++)W(6*i,0,6*i,6,wm);for(let i=1;i<=12;i++)W(6*i,10,6*i,16,wm);
 const cl=M(0x888888);for(let x=3;x<78;x+=6){const m=new T.MeshBasicMaterial({color:0x333333});lampM['c'+x]=m;B(.9,.08,.9,x,4,8,m)}
 // corridor switches + stairs
 for(const sx of[2,72]){B(.15,.25,.1,sx,1.3,6.15,M(0xffffff));I(sx,6.9,1.3,()=>'E — Koridor chirogʻi',()=>{tog('c'+lv)})}
 if(lv<4)for(let i=0;i<8;i++)B(.5,.18*(i+1),2,74.25+i*.5,.09*(i+1),7,M(0xaaa090));else C(74,6,78,8);
 for(let i=0;i<8;i++)B(.5,.04,2,74.25+i*.5,.02,9,M(0x555555));B(4,.01,.1,76,.02,8,MB(0xffcc00));
 for(let r=0;r<25;r++)room(lv,r);
}
function room(lv,r){
 const nth=r<13,k=nth?r:r-13,cx=6*k+3,zd=nth?6:10,zb=nth?0:16,inw=nth?-1:1,id=lv+'-'+r,zm=(zd+zb)/2;
 door(id,cx,zd);
 const lm=new T.MeshBasicMaterial({color:0x333333});lampM[id]=lm;B(1.4,.08,.7,cx,4,zm,lm);
 B(2.6,1.2,.08,cx-1.2,2,zb-inw*.1,M(0x1c3a2a));B(1.2,1.2,.08,cx+2,2,zb-inw*.1,MB(0x7fc8ff));
 B(.8,2.2,1.4,cx-2.5,1.1,zm,M(0x7a5a38));C(cx-2.9,zm-.7,cx-2.1,zm+.7);
 I(cx-1.8,zm,1.4,()=>me.hide?'E — Chiqish':'E — Javon ichiga yashirinish',()=>hide(cx-2.5,zm,'w'));
 for(const dx of[-1.1,1.1])for(const dz of[1.8,3.6]){const z=zb+inw*dz,x=cx+dx;B(1.2,.75,.6,x,.4,z,M(0xb9803f));B(.4,.45,.4,x,.25,z+inw*.7,M(0x335577));C(x-.6,z-.3,x+.6,z+.3);I(x,z,.95,()=>me.hide?'E — Chiqish':'E — Parta tagiga yashirinish',()=>hide(x,z,'d'))}
 B(.15,.25,.1,cx+1.5,1.3,zd+inw*.15,M(0xffffff));I(cx+1.5,zd+inw*.7,1.2,()=>'E — Xona chirogʻi',()=>{tog(id);});
 const pm=new T.Mesh(new T.BoxGeometry(.5,.7,.08),MB(0x2a8cff));pm.position.set(cx-1.5,1.3,zd-inw*.12);G.add(pm);
 const lb=new T.Mesh(new T.BoxGeometry(.9,.45,.05),label(String(lv*100+r+1)));lb.position.set(cx,3.3,zd-inw*.12);G.add(lb);
 const q=riddle(lv,r);I(cx-1.5,zd-inw*.8,1.2,()=>opened.has(id)?null:'E — Eshik jumboqi (koʻk panel)',()=>ask(q.q,q.a,()=>{openDoor(id);bc('open',{id});msg('Eshik ochildi!')}));
}
function hide(x,z,t){if(me.hide){me.x=me.hide.ox;me.z=me.hide.oz;me.hide=null}else{me.hide={t,ox:me.x,oz:me.z};me.x=x;me.z=z}}
function refreshLamps(){for(const k in lampM){const on=power&&(k[0]=='c'?CL['c'+level]:RL[k]);lampM[k].color.set(on?0xfff6c0:0x333333)}}
function tog(id){if(id[0]=='c'){CL[id]=!CL[id];bc('light',{id,v:+CL[id]})}else{RL[id]=!RL[id];bc('light',{id,v:+RL[id]})}refreshLamps()}
// ---------- yard ----------
function yard(){
 const gm=M(0x4c7a3a);B(64,.1,56,-30,-.06,4,gm);B(60,.12,6,-30,-.03,8,M(0x55575c));
 const bf=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),ax=Math.abs(x1-x0)>Math.abs(z1-z0);B(ax?L:.5,3,ax?.5:L,(x0+x1)/2,1.5,(z0+z1)/2,brickM(L/3,1));if(ax)C(x0,z0-.25,x1,z1+.25);else C(x0-.25,z0,x1+.25,z1)};
 bf(-60,-20,0,-20);bf(-60,30,0,30);bf(-60,-20,-60,6);bf(-60,10,-60,30);bf(0,-20,0,0);bf(0,16,0,30);
 B(.3,6,.3,-60,3,5.8,M(0x333));B(.3,6,.3,-60,3,10.2,M(0x333));
 const gt=new T.Mesh(new T.PlaneGeometry(4.4,3.2),gridM());gt.rotation.y=Math.PI/2;gt.position.set(-60,1.7,8);G.add(gt);D.gate={m:gt,c:C(-60.3,6,-59.7,10,{gate:1})};if(opened.has('gate')){gt.visible=false;D.gate.c.open=1}
 const f=new T.Mesh(new T.BoxGeometry(.3,5,16),brickM(5,1.5));f.position.set(-.2,6.5,8);G.add(f);
 B(.4,.6,16.2,-.1,9.1,8,M(0x7a2a22));
 // hut
 const hm=M(0xa07040);W(-22,-14,-18,-14,hm);W(-22,-14,-22,-10,hm);W(-18,-14,-18,-10,hm);W(-22,-10,-20.9,-10,hm);W(-19.1,-10,-18,-10,hm);door('hut',-20,-10,M(0x553311));B(5,.4,5,-20,4,-12,M(0x6a2a1a));
 I(-20,-9,1.6,()=>opened.has('hut')?null:got.has('hutkey')?'E — Kulba eshigini ochish':'Kulba qulf — kalit kerak',()=>{if(got.has('hutkey')){openDoor('hut');bc('open',{id:'hut'})}});
 B(.8,1.2,.3,-20,1.3,-13.8,M(0x777777));
 I(-20,-13,1.6,()=>opened.has('hut')?(power?'E — Tokni oʻchirish':'E — Tokni yoqish'):null,()=>{power=!power;bc('power',{v:+power});refreshLamps();msg(power?'⚡ Tok yoqildi!':'Tok oʻchdi')});
 // car
 const g=new T.Group(),bm=M(0xd03030);const part=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o)};
 part(2,.8,4.2,0,.8,0,bm);part(1.7,.7,2,0,1.5,-.2,M(0x9ac8ff));for(const a of[-1,1])for(const b of[-1.4,1.4])part(.3,.7,.7,a*1.05,.4,b,M(0x111111));
 car.g=g;g.position.set(car.x,0,car.z);g.rotation.y=car.psi;G.add(g);
 I(-25,8,4,()=>drivingOr(),carAct);
}
function drivingOr(){if(me.drive)return null;if(inst.size==5)return 'E — Mashinaga oʻtirish va haydash';const c=[...got].filter(x=>x!='hutkey');return c.length?'E — Ehtiyot qismlarni oʻrnatish ('+inst.size+'/5)':'Mashina buzuq ('+inst.size+'/5 qism). Qismlarni toping!'}
function carAct(){const c=[...got].filter(x=>x!='hutkey');if(c.length){for(const t of c){inst.add(t);got.delete(t);bc('inst',{t})}msg('Qismlar oʻrnatildi: '+inst.size+'/5')}if(inst.size==5){me.drive=true;me.hide=null;msg('Haydang! Setkali darvozaga urilib chiqing!',4000)}}
// ---------- level change ----------
function go(lv,x,z){build(lv);me.x=x;me.z=z;me.lv=lv;me.hide=null}
// ---------- jail ----------
function jailMe(){me.c++;me.jail=true;me.jt=45;me.hide=null;me.drive=false;go(0,6,8);msg('Qamaldingiz! ('+me.c+'/5)',3500);if(me.c>=5)msg('Siz butunlay qamaldingiz!',4000)}
// ---------- players ----------
function myPeer(){const p=rm&&rm.peers().find(p=>p.isMe&&p.sameTab);return p?p.peer:'me'}
function PL(){const mine={me:1,peer:myPeer(),n:me.n,x:me.x,z:me.z,lv:me.lv,h:me.hide?me.hide.t:0,j:me.jail,c:me.c,y:me.yaw,crouch:me.crouch};if(!rm)return[mine];return rm.peers().filter(p=>p.kind==='viewer'&&(!p.isMe||p.sameTab)).map(p=>{if(p.isMe)return mine;const q=p.presence;return{me:0,peer:p.peer,n:String(q.n||'?').slice(0,14),x:+q.x||0,z:+q.z||0,lv:q.lv|0,h:q.h||0,j:!!q.j,c:q.c|0,y:+q.y||0,crouch:!!q.k}})}
const av={};
function avatars(){const seen={};for(const p of PL())if(!p.me){seen[p.peer]=1;let a=av[p.peer];if(!a){a=av[p.peer]=new T.Mesh(new T.BoxGeometry(.6,1.6,.4),M(0x3a7bd5,0x112244));scene.add(a)}a.visible=p.lv===level&&!p.h;a.position.set(p.x,.8,p.z);a.rotation.y=p.y}for(const k in av)if(!seen[k]){scene.remove(av[k]);delete av[k]}}
// ---------- grannies ----------
const gm3=[];function mkG(g){const o=new T.Group();const bd=M(g.male?0x2b3a55:0x7a2a6a),sk=M(0xe0b090),hr=M(0xdddddd);const a=new T.Mesh(new T.BoxGeometry(.8,1.3,.5),bd);a.position.y=.75;const b=new T.Mesh(new T.BoxGeometry(.45,.45,.45),sk);b.position.y=1.7;const c=new T.Mesh(new T.BoxGeometry(.5,.18,.5),g.male?M(0x222222):hr);c.position.y=1.98;const e=new T.Mesh(new T.BoxGeometry(.3,.07,.05),MB(0xff2200));e.position.set(0,1.75,-.24);o.add(a,b,c,e);o.scale.setScalar(1.15);scene.add(o);return o}
function gAI(dt){const P=PL();for(const g of gr){if(g.st>0){g.st-=dt;continue}g.cd-=dt;g.tl-=dt;
 if(g.tl<=0){g.tl=25+Math.random()*20;const pp=P.filter(p=>!p.j);if(pp.length&&Math.random()<.6)g.lv=pp[Math.random()*pp.length|0].lv||1,g.x=g.lv?74:40,g.z=8;if(g.lv==0)g.lv=1}
 let best=null,bd=1e9;for(const p of P){if(p.lv!==g.lv||p.j||p.c>=5||(g.lv==1&&p.x<0))continue;const d=Math.hypot(p.x-g.x,p.z-g.z);if(p.h=='w')continue;if(p.h=='d'&&d>1.8)continue;if(d<(p.crouch?7:14)&&d<bd){best=p;bd=d}}
 let tx,tz,sp=2.3;
 if(best){sp=4.1;tx=best.x;tz=best.z;if(g.z>6&&g.z<10&&(best.z<5.5||best.z>10.5)&&Math.abs(best.x-g.x)>.8){tx=best.x;tz=8}
  if(bd<1.15&&g.cd<=0){g.cd=4;if(best.me)jailMe();else bc('catch',{p:best.peer})}}
 else{if(Math.hypot(g.wx-g.x,g.wz-g.z)<1.2||Math.random()<.002){g.wx=g.lv==0?14+Math.random()*50:3+Math.random()*72;g.wz=g.lv==0?3+Math.random()*10:8}tx=g.wx;tz=g.wz}
 const dx=tx-g.x,dz=tz-g.z,d=Math.hypot(dx,dz)||1;
 if(g.lv===level)slide(g,dx/d*sp*dt,dz/d*sp*dt,.45);else{g.x+=dx/d*sp*dt;g.z+=dz/d*sp*dt}
 g.ry=Math.atan2(-dx,-dz)}}
function slide(o,dx,dz,r){o.x+=dx;o.z+=dz;for(let k=0;k<2;k++)for(const c of cols){if(c.open)continue;const cx=Math.max(c.x0,Math.min(o.x,c.x1)),cz=Math.max(c.z0,Math.min(o.z,c.z1)),ex=o.x-cx,ez=o.z-cz,d2=ex*ex+ez*ez;if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);o.x=cx+ex/d*r;o.z=cz+ez/d*r}else{o.x+=r}}}}
// ---------- input ----------
const K={};let tmv={x:0,y:0},isT='ontouchstart' in window;
addEventListener('keydown',e=>{if(modal||!playing)return;K[e.code]=1;if(e.code=='KeyE')act();if(e.code=='KeyR')crouch();if(e.code=='KeyF')thr()});
addEventListener('keyup',e=>K[e.code]=0);
ren.domElement.addEventListener('click',()=>{if(playing&&!modal&&!isT)ren.domElement.requestPointerLock()});
addEventListener('mousemove',e=>{if(document.pointerLockElement){me.yaw-=e.movementX*.0024;me.pit=Math.max(-1.3,Math.min(1.3,me.pit-e.movementY*.0024))}});
if(isT){$('tc').hidden=false;let o=null,lo=null;const js=$('js'),lk=$('lk');
 js.ontouchstart=e=>{const t=e.changedTouches[0];o={id:t.identifier,x:t.clientX,y:t.clientY}};
 js.ontouchmove=e=>{for(const t of e.changedTouches)if(o&&t.identifier==o.id){tmv.x=Math.max(-1,Math.min(1,(t.clientX-o.x)/50));tmv.y=Math.max(-1,Math.min(1,(t.clientY-o.y)/50))}};
 js.ontouchend=()=>{o=null;tmv={x:0,y:0}};
 lk.ontouchstart=e=>{const t=e.changedTouches[0];lo={id:t.identifier,x:t.clientX,y:t.clientY}};
 lk.ontouchmove=e=>{for(const t of e.changedTouches)if(lo&&t.identifier==lo.id){me.yaw-=(t.clientX-lo.x)*.006;me.pit=Math.max(-1.3,Math.min(1.3,me.pit-(t.clientY-lo.y)*.006));lo.x=t.clientX;lo.y=t.clientY}};
 lk.ontouchend=()=>lo=null;
 $('bE').ontouchstart=e=>{e.preventDefault();if(!modal)act()};$('bF').ontouchstart=e=>{e.preventDefault();thr()};$('bR').ontouchstart=e=>{e.preventDefault();crouch()}}
let near=null;
function act(){if(me.drive||me.jail&&!near)return;if(me.hide){hide(0,0);return}if(near)near.f()}
function crouch(){if(me.hide||me.drive||me.jail)return;me.crouch=!me.crouch;msg(me.crouch?'Oʻtirdingiz (sekin, sezilish kam)':'Turdingiz',1200)}
function ST(){if(level==0)return[{x0:40,x1:44,z0:7,z1:9,d:1,to:1,ax:72.5,az:8}];const a=[{x0:74,x1:78,z0:8,z1:10,d:-1,to:level-1,ax:level==1?38.5:72.5,az:8}];if(level<4)a.push({x0:74,x1:78,z0:6,z1:8,d:1,to:level+1,ax:72.5,az:8});return a}
function climb(){if(me.hide||me.drive||(level==1&&me.x<0))return 0;for(const z of ST())if(me.x>z.x0&&me.x<z.x1&&me.z>z.z0&&me.z<z.z1){const t=(me.x-z.x0)/(z.x1-z.x0);if(t>.95){go(z.to,z.ax,z.az);return 0}return z.d>0?t*4:-t*1.2}return 0}
function thr(){if(me.hide||me.drive||me.jail)return;const d=new T.Vector3();cam.getWorldDirection(d);const m=new T.Mesh(new T.BoxGeometry(.2,.2,.2),M(0x999999));m.position.copy(cam.position);scene.add(m);proj.push({m,v:d.multiplyScalar(17),t:3})}
function stunG(i){const g=gr[i];if(host)g.st=30;else bc('stun',{i});g.stl=30}
function projStep(dt){for(let i=proj.length-1;i>=0;i--){const p=proj[i];p.v.y-=14*dt;p.m.position.addScaledVector(p.v,dt);p.t-=dt;let hit=p.t<=0||p.m.position.y<0;for(const g of gr)if(g.lv===level&&Math.hypot(g.x-p.m.position.x,g.z-p.m.position.z)<1.1&&p.m.position.y<2.3&&g.st<=0){stunG(g.id);msg('Granni 30 soniyaga toʻxtadi!');hit=true}
 if(!hit)for(const c of cols)if(!c.open&&p.m.position.x>c.x0&&p.m.position.x<c.x1&&p.m.position.z>c.z0&&p.m.position.z<c.z1)hit=true;if(hit){scene.remove(p.m);proj.splice(i,1)}}}
// ---------- main loop ----------
let last=performance.now(),acc=0,ga=0;
function zoneLight(){if(level==1&&me.x<0)return .95;if(level==0)return power?.75:.28;if(!power)return .13;if(me.z>6&&me.z<10)return CL['c'+level]?.95:.2;const r=me.z<6?Math.floor(me.x/6):13+Math.floor(me.x/6);return RL[level+'-'+r]?.95:.2}
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(!playing){ren.render(scene,cam);return}
 if(me.jail){me.jt-=dt;if(me.c<5&&me.jt<=0){me.jail=false;me.x=14;me.z=8;msg('Ozod boʻldingiz!')}}
 if(me.drive){let fw=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0)-tmv.y,st=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0)-tmv.x;fw=Math.max(-1,Math.min(1,fw));car.v+=(fw*14-car.v)*Math.min(1,dt*1.2);car.psi+=st*Math.min(1,Math.abs(car.v)/6)*1.5*dt*Math.sign(car.v||1);
  const fx=-Math.sin(car.psi),fz=-Math.cos(car.psi);car.x+=fx*car.v*dt;car.z+=fz*car.v*dt;
  for(const c of cols){if(c.open)continue;const cx=Math.max(c.x0,Math.min(car.x,c.x1)),cz=Math.max(c.z0,Math.min(car.z,c.z1)),ex=car.x-cx,ez=car.z-cz,d2=ex*ex+ez*ez;if(d2<2.9){if(c.gate&&Math.abs(car.v)>4){opened.add('gate');bc('win');win();return}const d=Math.sqrt(d2)||.01;car.x=cx+ex/d*1.7;car.z=cz+ez/d*1.7;car.v*=-.2}}
  car.g.position.set(car.x,0,car.z);car.g.rotation.y=car.psi;me.x=car.x;me.z=car.z;
  cam.position.set(car.x-fx*7,3.6,car.z-fz*7);cam.lookAt(car.x,1.2,car.z)}
 else{const sp=(me.crouch?2.2:K.ShiftLeft||K.ShiftRight?7:4.5)*dt;let fw=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0)-tmv.y,sd=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+tmv.x;
  if((fw||sd)&&!me.hide){const s=Math.sin(me.yaw),c=Math.cos(me.yaw);slide(me,(-s*fw+c*sd)*sp,(-c*fw-s*sd)*sp,.4)}
  if(K.ArrowLeft&&0)me.yaw+=0;cam.position.set(me.x,me.hide?(me.hide.t=='w'?1.2:.55):(me.crouch?.95:1.65)+climb(),me.z);cam.rotation.set(me.pit,me.yaw,0,'YXZ')}
 // interact
 near=null;let bd=1e9,bt=null;if(!me.drive&&!me.jail||me.jail)for(const i of ints){const d=Math.hypot(i.x-me.x,i.z-me.z);if(d<i.r&&d<bd){const t=i.t();if(t){bd=d;near=i;bt=t}}}
 if(me.hide){near=null;bt='E — Chiqish'}if(me.drive)bt='W/S — gaz, A/D — rul. Darvozaga uring!';
 $('pr').textContent=bt||'';
 amb.intensity+=(zoneLight()-amb.intensity)*Math.min(1,dt*6);torch.intensity=level==1&&me.x<0?.2:.9;
 // grannies
 if(host)gAI(dt);projStep(dt);
 let chase=0;gr.forEach((g,i)=>{if(!gm3[i])gm3[i]=mkG(g);const o=gm3[i];o.visible=g.lv===level;if(g.lv===level){o.position.x+=(g.x-o.position.x)*Math.min(1,dt*10);o.position.z+=(g.z-o.position.z)*Math.min(1,dt*10);o.rotation.y=g.ry||0;o.rotation.z=g.st>0||g.stl>0?.5:0;const d=Math.hypot(g.x-me.x,g.z-me.z);if(d<10&&g.st<=0&&!me.hide)chase=Math.max(chase,1-d/10)}if(g.stl>0)g.stl-=dt});
 $('vg').style.opacity=chase*.8;
 // tick
 acc+=dt;ga+=dt;if(acc>.1){acc=0;if(rm)rm.presence({n:me.n,x:+me.x.toFixed(1),z:+me.z.toFixed(1),lv:me.lv,h:me.hide?me.hide.t:0,j:+me.jail,c:me.c,k:+!!me.crouch,y:+me.yaw.toFixed(2)});avatars();hud();
  if(PL().every(p=>p.c>=5))end('Yutqazdingiz 😢')}
 if(host&&rm&&ga>.12){ga=0;bc('g',{a:gr.map(g=>[+g.x.toFixed(1),+g.z.toFixed(1),g.lv,g.st>0?1:0,+(g.ry||0).toFixed(2)])})}
 me.lv=level;ren.render(scene,cam)}
function hud(){const fl=level==0?'Podval':level==1&&me.x<0?'Hovli':level+'-qavat';$('hud').innerHTML=`📍 ${fl} &nbsp; ⚡ Tok: ${power?'<span class=ok>yoqilgan</span>':'<span class=no>oʻchiq</span>'} &nbsp; ⛓ Qamalish: ${me.c}/5<br>`+Object.keys(PN).map(t=>`<span class="${inst.has(t)?'ok':got.has(t)?'hv':'no'}">${PI[t]}</span>`).join(' ')+` <small>(${inst.size}/5 oʻrnatildi)</small>`+(PL().length>1?'<br>👥 '+PL().map(p=>p.n+(p.j?'⛓':'')).join(', '):'')}
function win(){playing=false;if(document.pointerLockElement)document.exitPointerLock();end('🎉 Gʻalaba! Maktabdan qochdingiz!')}
function end(t){if($('end').hidden===false)return;playing=false;if(document.pointerLockElement)document.exitPointerLock();$('et').textContent=t;$('end').hidden=false}
// ---------- start / network ----------
function begin(s,idx){seed=s;genItems();playing=true;$('menu').hidden=true;go(0,38+2*(idx||0),8);me.yaw=0;$('hud').hidden=false}
function nm(){me.n=($('nm').value.trim()||'Oyinchi').slice(0,14)}
$('b1').onclick=()=>{nm();host=true;rm=null;begin(Math.random()*1e6|0,0)};
async function lobby(code,mk){nm();const R=await claude.use('room');if(!R){$('ms').textContent='Ulanib oʻynash bu yerda mavjud emas (tizimga kirgan boʻlishingiz kerak).';return}
 let r;try{r=await R.join('es'+code)}catch(e){$('ms').textContent='Xonaga ulanib boʻlmadi.';return}
 rm=r;host=mk;await rm.presence({n:me.n,hs:mk?1:0,lv:0,x:0,z:0,c:0});
 rm.on('start',m=>{const L=PL().map(p=>p.peer).sort();begin(+m.data.s,L.indexOf(myPeer()))});
 rm.on('take',m=>{if(!m.isMe){taken.add(m.data.t);const it=items.find(i=>i.t==m.data.t);if(it&&it.lv==level){const x=me.x,z=me.z;build(level);me.x=x;me.z=z}}});
 rm.on('open',m=>{if(!m.isMe)openDoor(m.data.id)});
 rm.on('inst',m=>{if(!m.isMe){inst.add(m.data.t);got.delete(m.data.t)}});
 rm.on('power',m=>{if(!m.isMe){power=!!m.data.v;refreshLamps()}});
 rm.on('light',m=>{if(!m.isMe){(m.data.id[0]=='c'?CL:RL)[m.data.id]=!!m.data.v;refreshLamps()}});
 rm.on('catch',m=>{if(m.data.p===myPeer())jailMe()});
 rm.on('free',m=>{if(m.data.p===myPeer()&&me.jail&&me.c<5){me.jail=false;me.x=14;me.z=8;msg('Doʻstingiz sizni qutqardi!')}});
 rm.on('stun',m=>{if(host&&gr[m.data.i])gr[m.data.i].st=30});
 rm.on('g',m=>{if(host||!m.data.a)return;m.data.a.forEach((a,i)=>{const g=gr[i];if(g){g.x=a[0];g.z=a[1];g.lv=a[2];g.st=a[3]?1:0;g.ry=a[4]}})});
 rm.on('win',()=>win());
 const upd=()=>{$('pl').innerHTML='<b>Xonadagilar:</b> '+PL().map(p=>p.n).join(', ')};rm.onPeers(upd);upd();
 if(mk){$('ms').innerHTML='Xona kodi: <b style="font-size:26px">'+code+'</b><br>Doʻstlaringiz shu kodni kiritsin, hammasi kirgach “Boshlash”ni bosing.';$('bs').hidden=false;$('b1').hidden=$('b2').hidden=$('b3').hidden=true}
 else{await new Promise(r=>setTimeout(r,2200));if(!rm.peers().some(p=>!p.isMe&&p.presence&&p.presence.hs==1)){$('ms').textContent='Bunday kodli xona topilmadi.';rm.leave();rm=null;return}$('ms').textContent='Ulandingiz! Xona egasi boshlashini kuting…';$('b1').hidden=$('b2').hidden=$('b3').hidden=true}}
$('b2').onclick=()=>lobby(String(100000+Math.random()*899999|0),true);
$('b3').onclick=()=>{const c=$('cd').value.trim();if(!/^\d{6}$/.test(c)){$('ms').textContent='6 xonali kod kiriting';return}lobby(c,false)};
$('bs').onclick=()=>{if(PL().length<2&&!confirm('Hozircha yolgʻizsiz. Baribir boshlaymizmi?'))return;rm.emit('start',{s:Math.random()*1e6|0})};
$('hud').hidden=true;requestAnimationFrame(loop);