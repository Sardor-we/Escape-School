import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const game = document.getElementById("game");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const keyStatus = document.getElementById("keyStatus");
const message = document.getElementById("message");

// ==========================
// SCENE
// ==========================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x050507);

scene.fog = new THREE.Fog(
    0x050507,
    5,
    35
);

// ==========================
// CAMERA
// ==========================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.7, 8);

// ==========================
// RENDERER
// ==========================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

game.appendChild(renderer.domElement);

// ==========================
// LIGHT
// ==========================

const ambientLight = new THREE.HemisphereLight(
    0x666677,
    0x111111,
    0.25
);

scene.add(ambientLight);

const flashlight = new THREE.SpotLight(
    0xffffff,
    5,
    25,
    Math.PI / 7,
    0.5,
    1
);

flashlight.position.set(0, 1.7, 0);

scene.add(flashlight);

flashlight.target.position.set(0, 1.7, -5);

scene.add(flashlight.target);

// ==========================
// MATERIALS
// ==========================

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x25252b
});

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x383840
});

const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x241b1b
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x17171c
});

// ==========================
// FLOOR
// ==========================

const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 35),
    floorMaterial
);

floor.position.y = -0.1;
floor.position.z = -8;

floor.receiveShadow = true;

scene.add(floor);

// ==========================
// CEILING
// ==========================

const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 35),
    ceilingMaterial
);

ceiling.position.y = 4;

ceiling.position.z = -8;

scene.add(ceiling);

// ==========================
// WALL FUNCTION
// ==========================

function createWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            height,
            depth
        ),
        wallMaterial
    );

    wall.position.set(
        x,
        y,
        z
    );

    wall.castShadow = true;
    wall.receiveShadow = true;

    scene.add(wall);

    return wall;
}

// ==========================
// MAIN CORRIDOR
// ==========================

// Chap devor
createWall(
    -10,
    2,
    -8,
    0.4,
    4,
    35
);

// O‘ng devor
createWall(
    10,
    2,
    -8,
    0.4,
    4,
    35
);

// Orqa devor
createWall(
    0,
    2,
    -25,
    20,
    4,
    0.4
);

// ==========================
// ROOMS
// ==========================

// Chap xona devorlari
createWall(
    -5,
    2,
    -5,
    0.3,
    4,
    8
);

// O‘ng xona
createWall(
    5,
    2,
    -12,
    0.3,
    4,
    8
);

// ==========================
// DOOR
// ==========================

const door = new THREE.Mesh(
    new THREE.BoxGeometry(
        2,
        3,
        0.3
    ),
    doorMaterial
);

door.position.set(
    0,
    1.5,
    -24.7
);

door.castShadow = true;

scene.add(door);

// ==========================
// EXIT LIGHT
// ==========================

const exitLight = new THREE.PointLight(
    0xff3333,
    2,
    8
);

exitLight.position.set(
    0,
    3,
    -23
);

scene.add(exitLight);

// ==========================
// KEY
// ==========================

const key = new THREE.Group();

const keyRing = new THREE.Mesh(
    new THREE.TorusGeometry(
        0.25,
        0.06,
        8,
        20
    ),
    new THREE.MeshStandardMaterial({
        color: 0xffcc33,
        metalness: 0.8,
        roughness: 0.2
    })
);

key.add(keyRing);

const keyStick = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.08,
        0.08,
        0.7
    ),
    new THREE.MeshStandardMaterial({
        color: 0xffcc33,
        metalness: 0.8,
        roughness: 0.2
    })
);

keyStick.position.z = -0.4;

key.add(keyStick);

key.position.set(
    4,
    1,
    -10
);

scene.add(key);

let hasKey = false;

// ==========================
// PLAYER
// ==========================

const player = {
    position: new THREE.Vector3(
        0,
        1.7,
        8
    ),

    speed: 0.12
};

const keys = {};

document.addEventListener(
    "keydown",
    (event) => {
        keys[event.key.toLowerCase()] = true;
    }
);

document.addEventListener(
    "keyup",
    (event) => {
        keys[event.key.toLowerCase()] = false;
    }
);

// ==========================
// MOUSE LOOK
// ==========================

let yaw = 0;
let pitch = 0;

document.addEventListener(
    "mousemove",
    (event) => {

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {
            return;
        }

        yaw -= event.movementX * 0.002;

        pitch -= event.movementY * 0.002;

        pitch = THREE.MathUtils.clamp(
            pitch,
            -1.4,
            1.4
        );
    }
);

// ==========================
// START GAME
// ==========================

startButton.addEventListener(
    "click",
    () => {

        startScreen.style.display = "none";

        renderer.domElement.requestPointerLock();

    }
);

// ==========================
// PLAYER MOVEMENT
// ==========================

function updatePlayer() {

    const direction = new THREE.Vector3();

    if (keys["w"]) {
        direction.z -= 1;
    }

    if (keys["s"]) {
        direction.z += 1;
    }

    if (keys["a"]) {
        direction.x -= 1;
    }

    if (keys["d"]) {
        direction.x += 1;
    }

    if (direction.length() > 0) {

        direction.normalize();

        const forward = new THREE.Vector3(
            -Math.sin(yaw),
            0,
            -Math.cos(yaw)
        );

        const right = new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
        );

        player.position.addScaledVector(
            forward,
            -direction.z * player.speed
        );

        player.position.addScaledVector(
            right,
            direction.x * player.speed
        );
    }

    // Chegaralarni saqlash
    player.position.x = THREE.MathUtils.clamp(
        player.position.x,
        -9,
        9
    );

    player.position.z = THREE.MathUtils.clamp(
        player.position.z,
        -24,
        9
    );

    camera.position.copy(
        player.position
    );

    camera.rotation.order = "YXZ";

    camera.rotation.y = yaw;

    camera.rotation.x = pitch;

    flashlight.position.copy(
        camera.position
    );

    flashlight.target.position.set(
        camera.position.x -
            Math.sin(yaw) * 5,

        camera.position.y,

        camera.position.z -
            Math.cos(yaw) * 5
    );
}

// ==========================
// KEY CHECK
// ==========================

function checkKey() {

    if (hasKey) {
        return;
    }

    const distance =
        player.position.distanceTo(
            key.position
        );

    if (distance < 1.5) {

        hasKey = true;

        key.visible = false;

        keyStatus.textContent =
            "TOPILDI";

        message.textContent =
            "🔑 Kalit topildi! Endi chiqish eshigiga bor.";
    }
}

// ==========================
// DOOR CHECK
// ==========================

function checkDoor() {

    const distance =
        player.position.distanceTo(
            door.position
        );

    if (distance < 2) {

        if (hasKey) {

            message.textContent =
                "🎉 TABRIKLAYMAN! 1-LEVEL TUGADI!";

            exitLight.color.set(
                0x33ff66
            );

        } else {

            message.textContent =
                "🔒 Eshik qulflangan. Kalitni top!";

        }
    }
}

// ==========================
// ANIMATION
// ==========================

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const time = clock.getElapsedTime();

    // Kalit aylanishi
    if (key.visible) {

        key.rotation.y =
            time * 2;

        key.position.y =
            1 + Math.sin(time * 3) * 0.15;
    }

    updatePlayer();

    checkKey();

    checkDoor();

    renderer.render(
        scene,
        camera
    );
}

animate();

// ==========================
// WINDOW RESIZE
// ==========================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
); 