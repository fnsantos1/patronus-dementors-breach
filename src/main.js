// Monta a cena da Entrega 2: a camara de pedra, os tres personagens e as
// camaras de visualizacao. Tudo estatico - nenhuma animacao nesta entrega.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createWoodTexture, createShroudAlphaTexture } from './core/textures.js';
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
// o ACES escurece bastante a imagem; a exposicao compensa isso
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c14);

const camera = new THREE.PerspectiveCamera(
  60,                                       // abertura em graus
  window.innerWidth / window.innerHeight,
  0.1,                                      // corte proximo
  60                                        // corte distante
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 24;

// Iluminacao. A sala e escura por proposta: a luz ambiente so evita que
// os cantos fiquem pretos, e quem ilumina de verdade sao as tochas e a
// ponta da varinha.
scene.add(new THREE.AmbientLight(0x5a6a94, 0.55));

// A sala e fechada: uma luz de fora nao entraria, o teto barra. Quem
// ilumina e o candelabro no centro - e a unica que projeta sombra, para
// nao pagar quatro mapas de sombra - mais as tochas de parede.
const chandelier = new THREE.PointLight(0xffcf9a, 45, 20);
chandelier.position.set(0, ALTURA - 0.8, 0);
chandelier.castShadow = true;
chandelier.shadow.mapSize.set(1024, 1024);
chandelier.shadow.bias = -0.004;
scene.add(chandelier);

const woodTexture = createWoodTexture();
const shroudAlpha = createShroudAlphaTexture();

const room = createRoom(woodTexture);
scene.add(room.group);

// O Conjurador fica preso a camara na visao em primeira pessoa e num
// suporte no meio da sala nas outras, para dar para olhar o modelo.
const conjurer = new Conjurer(woodTexture);
const conjurerStand = new THREE.Group();
conjurerStand.position.set(0, 1.55, 0.6);
conjurerStand.rotation.y = Math.PI;
conjurerStand.add(conjurer.rig);
scene.add(conjurerStand);

// Dementadores entrando pelas extremidades da sala, virados para o centro
const dementors = [
  new Dementor(shroudAlpha, 0.0),
  new Dementor(shroudAlpha, 2.1),
  new Dementor(shroudAlpha, 4.3),
];
dementors[0].setPosition(-4.5, 0.3, -4.0);
dementors[1].setPosition(4.8, 0.5, -3.0);
dementors[2].setPosition(-5.2, 0.2, 2.6);
for (const dementor of dementors) {
  dementor.lookAtPoint(new THREE.Vector3(0, 0, 0));
  scene.add(dementor.group);
}

const patronus = new Patronus();
patronus.setPosition(3.0, 0, 3.6);
patronus.group.rotation.y = 2.4;
scene.add(patronus.group);

const helpers = new THREE.Group();
helpers.add(new THREE.GridHelper(LARGURA, LARGURA, 0x5e74a0, 0x2b3246));
helpers.add(new THREE.AxesHelper(2));
helpers.visible = false;
scene.add(helpers);

// As tres camaras pedidas na proposta, mais uma livre para inspecao. Cada
// uma e so um par (posicao, alvo) aplicado na mesma camera perspectiva.
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
    semCandelabro: true,   // ele fica bem embaixo da camera e tapa a vista
  },
  Digit0: {
    nome: 'livre',
    position: new THREE.Vector3(1.2, 3.2, 6.0),   // dentro da sala, longe das colunas
    target: new THREE.Vector3(0, 1.2, 0),
  },
};

function applyView(view) {
  camera.position.copy(view.position);
  controls.target.copy(view.target);

  // na primeira pessoa o braco passa a ser filho da camara: e o mesmo
  // encaixe de grupos usado dentro dos personagens, um nivel acima
  if (view.primeiraPessoa) {
    camera.add(conjurer.rig);
    conjurer.rig.position.set(0.22, -0.12, -0.35);
    conjurer.rig.rotation.set(0, 0, 0);
  } else {
    conjurerStand.add(conjurer.rig);
    conjurer.rig.position.set(0, 0, 0);
  }

  room.chandelier.visible = !view.semCandelabro;

  document.getElementById('camera-atual').textContent = view.nome;
}

scene.add(camera);   // a camara precisa estar na cena para carregar o braco
applyView(views.Digit0);

let wireframe = false;

window.addEventListener('keydown', (event) => {
  if (views[event.code]) applyView(views[event.code]);

  if (event.code === 'KeyG') helpers.visible = !helpers.visible;

  if (event.code === 'KeyL') {
    wireframe = !wireframe;
    scene.traverse((object) => {
      if (object.isMesh) object.material.wireframe = wireframe;
    });
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// para depurar pelo console do navegador
window.app = { scene, camera, renderer, conjurer, dementors, patronus, room };

function animate() {
  // nada se move na cena: o laco existe para a camera responder ao mouse
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
