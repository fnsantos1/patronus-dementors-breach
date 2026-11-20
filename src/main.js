// Monta a cena com suporte a particulas para a Varinha e o Patrono,
// animacoes no loop de render e acumulador de Carga Magica na tecla Espaco.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { carregarTexturas } from './core/textures.js';
import { createEtherealSmokeTexture } from './core/particles.js';
import { GestureRecognizer } from './core/gestures.js';
import { SpellManager } from './core/spells.js';
import { createRoom, LARGURA, ALTURA } from './scene/room.js';
import { Conjurer } from './characters/conjurer.js';
import { Dementor } from './characters/dementor.js';
import { Patronus } from './characters/patronus.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c14);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  60
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 24;

// Iluminacao ambiente e candelabro central
scene.add(new THREE.AmbientLight(0x5a6a94, 0.55));

const chandelier = new THREE.PointLight(0xffcf9a, 45, 20);
chandelier.position.set(0, ALTURA - 0.8, 0);
chandelier.castShadow = true;
chandelier.shadow.mapSize.set(1024, 1024);
chandelier.shadow.bias = -0.004;
scene.add(chandelier);

const texturas = carregarTexturas();
const particleTexture = createEtherealSmokeTexture();

const room = createRoom(texturas);
scene.add(room.group);

// Grade e eixos de debug (tecla G)
const helpers = new THREE.Group();
helpers.add(new THREE.GridHelper(LARGURA, 14, 0x4466aa, 0x223355));
helpers.add(new THREE.AxesHelper(2));
helpers.visible = false;
scene.add(helpers);

// Caixas de colisao dos obstaculos da camara (colunas, caixotes e mesa)
const PLAYER_RADIUS = 0.35;
const ROOM_LIMIT = LARGURA / 2 - 0.2 - PLAYER_RADIUS;
const obstacleBoxes = [];
room.group.updateMatrixWorld(true);
for (const child of room.group.children) {
  if (child.name === 'coluna' || child.name === 'caixote' || child.name === 'mesa-tombada') {
    const box = new THREE.Box3().setFromObject(child);
    box.expandByScalar(PLAYER_RADIUS);
    obstacleBoxes.push(box);
  }
}

// O Conjurador com sistema de particulas na ponta da varinha
const conjurer = new Conjurer(texturas, particleTexture);
const conjurerStand = new THREE.Group();
conjurerStand.position.set(0, 1.55, 0.6);
conjurerStand.rotation.y = 0;
conjurerStand.add(conjurer.rig);
scene.add(conjurerStand);

// Dementadores (Flyweight com esqueleto anatomico e veu textil)
const dementors = [];
let currentWave = 1;
let playerHealth = 100;
let score = 0;

function spawnWave(wave) {
  const count = 2 + wave;
  const radius = LARGURA / 2 - 2.0;
  const aiTypes = ['chaser', 'keeper', 'flanker'];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + wave * 0.6;
    const dementor = new Dementor(texturas, i * 1.7);
    dementor.hp = 2;
    dementor.aiType = aiTypes[i % aiTypes.length];
    dementor.setPosition(Math.cos(angle) * radius, 0.35, Math.sin(angle) * radius);
    dementor.lookAtPoint(conjurerStand.position);
    scene.add(dementor.group);
    dementors.push(dementor);
  }
}

spawnWave(currentWave);

// O Patrono (Modo Inspecao: visivel para avaliacao estrutural)
const patronus = new Patronus(particleTexture);
patronus.setPosition(3.0, 0, 3.6);
patronus.group.rotation.y = 2.4;
scene.add(patronus.group);

// Funcao auxiliar de movimento com colisao
function moveConjurer(deltaVec) {
  const nextX = THREE.MathUtils.clamp(
    conjurerStand.position.x + deltaVec.x,
    -ROOM_LIMIT,
    ROOM_LIMIT
  );
  const nextZ = THREE.MathUtils.clamp(
    conjurerStand.position.z + deltaVec.z,
    -ROOM_LIMIT,
    ROOM_LIMIT
  );

  const canMoveX = !obstacleBoxes.some(
    (b) => nextX > b.min.x && nextX < b.max.x && conjurerStand.position.z > b.min.z && conjurerStand.position.z < b.max.z
  );
  if (canMoveX) conjurerStand.position.x = nextX;

  const canMoveZ = !obstacleBoxes.some(
    (b) => conjurerStand.position.x > b.min.x && conjurerStand.position.x < b.max.x && nextZ > b.min.z && nextZ < b.max.z
  );
  if (canMoveZ) conjurerStand.position.z = nextZ;
}

// Sistema de magias e reconhecimento de gestos (Circulo, Triangulo, Quadrado, Linha/Dash)
const spellManager = new SpellManager(scene, conjurerStand, dementors, () => {
  score += 100;
});
new GestureRecognizer(
  (shape) => {
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      conjurerStand.rotation.y
    );
    if (currentViewKey === 'Digit1') {
      camera.getWorldDirection(dir);
    }
    if (shape === 'line') {
      const dashVec = dir.clone().setY(0).normalize().multiplyScalar(3.5);
      moveConjurer(dashVec);
      return;
    }
    const origin = conjurer.getTipPosition();
    spellManager.cast(shape, origin, dir);
  },
  {
    onStart: () => { isCharging = true; },
    onEnd: () => { isCharging = false; },
  }
);

// Cameras
const views = {
  Digit1: {
    nome: '1a pessoa',
    position: new THREE.Vector3(0, 1.7, 0.8),
    target: new THREE.Vector3(0, 1.6, -6),
    primeiraPessoa: true,
  },
  Digit2: {
    nome: '3a pessoa',
    position: new THREE.Vector3(0.9, 2.6, 4.2),
    target: new THREE.Vector3(0, 1.4, -2),
  },
  Digit3: {
    nome: 'zenital',
    position: new THREE.Vector3(0, ALTURA - 0.4, 0.01),
    target: new THREE.Vector3(0, 0, 0),
    semCandelabro: true,
  },
  Digit0: {
    nome: 'livre',
    position: new THREE.Vector3(1.2, 3.2, 6.0),
    target: new THREE.Vector3(0, 1.2, 0),
  },
};

let currentViewKey = 'Digit0';
let playerYaw = 0;
let playerPitch = 0;

function applyView(view, key = currentViewKey) {
  currentViewKey = key;
  camera.position.copy(view.position);
  controls.target.copy(view.target);
  controls.enabled = key !== 'Digit1' && key !== 'Digit2';

  if (view.primeiraPessoa) {
    camera.add(conjurer.rig);
    conjurer.rig.position.set(0, -0.1, -0.35);
    conjurer.rig.rotation.set(0, 0, 0);
  } else {
    conjurerStand.add(conjurer.rig);
    conjurer.rig.position.set(0, 0, 0);
  }
  conjurer.setFirstPerson(Boolean(view.primeiraPessoa));

  room.chandelier.visible = !view.semCandelabro;
  document.getElementById('camera-atual').textContent = view.nome;
}

scene.add(camera);
applyView(views.Digit1, 'Digit1');

// Luzes
const COR_APAGADA = new THREE.Color(0x2a221c);

function createSwitch(light, flame) {
  return {
    light,
    flame,
    on: true,
    intensity: light.intensity,
    flameColor: flame.color.clone(),
  };
}

const lightSwitches = {
  KeyC: createSwitch(chandelier, room.chandelierFlame),
};

const torchKeys = { norte: 'Digit5', sul: 'Digit6', oeste: 'Digit7', leste: 'Digit8' };
for (const torch of room.torches) {
  lightSwitches[torchKeys[torch.nome]] = createSwitch(torch.light, torch.flame);
}

function toggleLight(lightSwitch) {
  lightSwitch.on = !lightSwitch.on;
  lightSwitch.light.intensity = lightSwitch.on ? lightSwitch.intensity : 0;
  lightSwitch.flame.color.copy(lightSwitch.on ? lightSwitch.flameColor : COR_APAGADA);
}

let wireframe = false;
let uvVisivel = false;

// lista sem repeticao dos materiais que tem textura
function materiaisTexturizados() {
  const materiais = [];
  scene.traverse((object) => {
    if (object.isMesh && object.material.map && !materiais.includes(object.material)) {
      materiais.push(object.material);
    }
  });
  return materiais;
}

// Estado da Conjuracao e Carga Magica
let isCharging = false;
let magicCharge = 0; // 0.0 a 1.0

// Estado de movimentacao WASD
const moveKeys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };
const MOVE_SPEED = 3.5;

window.addEventListener('keydown', (event) => {
  if (event.code in moveKeys) moveKeys[event.code] = true;
  if (views[event.code]) applyView(views[event.code], event.code);
  if (lightSwitches[event.code] && !event.repeat) toggleLight(lightSwitches[event.code]);
  if (event.code === 'KeyG') helpers.visible = !helpers.visible;

  if (event.code === 'Space') {
    isCharging = true;
  }

  // mostra o xadrez de UV no lugar das texturas, para conferir o mapeamento.
  // Percorre materiais, nao malhas: varias pecas dividem o mesmo material.
  if (event.code === 'KeyU') {
    uvVisivel = !uvVisivel;
    for (const material of materiaisTexturizados()) {
      if (uvVisivel) {
        material.userData.mapa = material.map;
        material.map = texturas.uv;
      } else {
        material.map = material.userData.mapa;
      }
      material.needsUpdate = true;
    }
  }

  if (event.code === 'KeyL') {
    wireframe = !wireframe;
    scene.traverse((object) => {
      if (object.isMesh && object.material) {
        object.material.wireframe = wireframe;
      }
    });
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code in moveKeys) moveKeys[event.code] = false;
  if (event.code === 'Space') {
    isCharging = false;
  }
});

window.addEventListener('pointermove', (event) => {
  if ((currentViewKey === 'Digit1' || currentViewKey === 'Digit2') && (event.buttons & 1)) {
    playerYaw -= event.movementX * 0.004;
    playerPitch = Math.max(-1.1, Math.min(1.1, playerPitch - event.movementY * 0.004));
    conjurerStand.rotation.y = playerYaw;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.app = { scene, camera, renderer, conjurer, dementors, patronus, room };

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);

  // Dinamica de Carga Magica ao segurar Espaco
  if (isCharging) {
    magicCharge = Math.min(magicCharge + delta * 1.5, 1.0);
  } else {
    magicCharge = Math.max(magicCharge - delta * 2.0, 0.0);
  }
  conjurer.setMagicCharge(magicCharge);

  // Movimentacao WASD no plano XZ
  const forwardInput = (moveKeys.KeyW ? 1 : 0) - (moveKeys.KeyS ? 1 : 0);
  const strafeInput = (moveKeys.KeyD ? 1 : 0) - (moveKeys.KeyA ? 1 : 0);
  const isMoving = forwardInput !== 0 || strafeInput !== 0;

  if (isMoving) {
    const moveDir = new THREE.Vector3(strafeInput, 0, -forwardInput).normalize();
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), conjurerStand.rotation.y);
    moveConjurer(moveDir.multiplyScalar(MOVE_SPEED * delta));
  }

  // Atualizacao dos sistemas de particulas, magias e personagens
  conjurer.update(delta, isMoving);
  spellManager.update(delta);
  patronus.update(delta, camera);
  const elapsedTime = clock.getElapsedTime();
  const dementorSpeed = 1.0 + currentWave * 0.15;
  for (const dementor of dementors) {
    const toPlayer = new THREE.Vector3(
      conjurerStand.position.x - dementor.group.position.x,
      0,
      conjurerStand.position.z - dementor.group.position.z
    );
    const dist = toPlayer.length();
    if (dist > 0.01) {
      toPlayer.normalize();
      if (dementor.aiType === 'keeper') {
        if (dist > 5.5) {
          dementor.group.position.addScaledVector(toPlayer, dementorSpeed * delta);
        } else if (dist < 3.5) {
          dementor.group.position.addScaledVector(toPlayer, -dementorSpeed * 0.8 * delta);
        }
      } else if (dementor.aiType === 'flanker') {
        const side = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
        const flankDir = toPlayer.clone().multiplyScalar(0.75).addScaledVector(side, 0.65).normalize();
        if (dist > 0.9) {
          dementor.group.position.addScaledVector(flankDir, dementorSpeed * delta);
        }
      } else if (dist > 0.9) {
        dementor.group.position.addScaledVector(toPlayer, dementorSpeed * delta);
      }
    }
    if (dist < 1.35 && spellManager.shieldTimer <= 0) {
      playerHealth = Math.max(0, playerHealth - 22 * delta);
    }
    dementor.lookAtPoint(conjurerStand.position);
    dementor.update(delta, elapsedTime);
  }

  if (dementors.length === 0) {
    score += 250;
    currentWave += 1;
    spawnWave(currentWave);
  }

  document.getElementById('vida-atual').textContent = Math.ceil(playerHealth);
  document.getElementById('pontos-atual').textContent = score;
  document.getElementById('onda-atual').textContent = currentWave;

  if (currentViewKey === 'Digit1') {
    camera.position.set(
      conjurerStand.position.x,
      conjurerStand.position.y + 0.15,
      conjurerStand.position.z
    );
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;
    camera.rotation.z = 0;
  } else if (currentViewKey === 'Digit2') {
    const offset = new THREE.Vector3(0.65, 0.95 - playerPitch * 1.2, 3.2);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);
    camera.position.copy(conjurerStand.position).add(offset);
    camera.lookAt(
      conjurerStand.position.x,
      conjurerStand.position.y + 0.1,
      conjurerStand.position.z
    );
  } else {
    controls.update();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
