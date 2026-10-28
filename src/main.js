/**
 * main.js - Visualizador dos personagens do item 3.1 da proposta.
 *
 * Esta pagina ainda nao e o jogo: ela monta uma cena minima (chao, luzes e
 * camera orbital) so para exibir e inspecionar os tres modelos. A sala
 * completa, as camaras em primeira/terceira pessoa e a mecanica de gestos
 * vem nas proximas etapas.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createWoodTexture, createShroudAlphaTexture, createSparkTexture } from './core/textures.js';
import { Conjurer } from './characters/conjurer.js';
import { Dementor } from './characters/dementor.js';
import { Patronus } from './characters/patronus.js';

/* ------------------------------------------------------------------ */
/* Renderizador, cena e camera                                         */
/* ------------------------------------------------------------------ */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06070d);
// neblina: escurece o que esta longe e reforca o clima da camara
scene.fog = new THREE.Fog(0x06070d, 8, 26);

const camera = new THREE.PerspectiveCamera(
  55,                                       // campo de visao em graus
  window.innerWidth / window.innerHeight,   // proporcao da tela
  0.1,                                      // plano de corte proximo
  100                                       // plano de corte distante
);
camera.position.set(3.2, 2.2, 4.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
controls.enableDamping = true;

/* ------------------------------------------------------------------ */
/* Iluminacao                                                          */
/* ------------------------------------------------------------------ */

// luz ambiente fraca e azulada: a camara e escura por proposta
scene.add(new THREE.AmbientLight(0x3a4a6a, 0.5));

// luz direcional alta, unica que projeta as sombras do chao
const moonLight = new THREE.DirectionalLight(0x90b0ff, 1.1);
moonLight.position.set(5, 9, 4);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -8;
moonLight.shadow.camera.right = 8;
moonLight.shadow.camera.top = 8;
moonLight.shadow.camera.bottom = -8;
scene.add(moonLight);

// duas tochas laranjas nas laterais, para os modelos nao ficarem monocromaticos
for (const x of [-5, 5]) {
  const torch = new THREE.PointLight(0xff8c3a, 8, 14);
  torch.position.set(x, 2.6, -2);
  scene.add(torch);
}

/* ------------------------------------------------------------------ */
/* Chao                                                                */
/* ------------------------------------------------------------------ */

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x2b2c33, roughness: 0.95 })
);
floor.name = 'chao';
floor.rotation.x = -Math.PI / 2;    // o plano nasce em pe; deitamos no eixo X
floor.receiveShadow = true;
scene.add(floor);

const helpers = new THREE.Group();
helpers.add(new THREE.GridHelper(30, 30, 0x4a5a7a, 0x23283a));
helpers.add(new THREE.AxesHelper(2));
helpers.visible = false;
scene.add(helpers);

/* ------------------------------------------------------------------ */
/* Personagens                                                         */
/* ------------------------------------------------------------------ */

const woodTexture = createWoodTexture();
const shroudAlpha = createShroudAlphaTexture();
const sparkTexture = createSparkTexture();

// Conjurador. No jogo este grupo sera filho da camera (visao em primeira
// pessoa); aqui ele fica parado no mundo para poder ser inspecionado.
const conjurer = new Conjurer(woodTexture, sparkTexture);
const conjurerStand = new THREE.Group();
conjurerStand.position.set(-2.4, 1.6, 0);
conjurerStand.rotation.y = 0.5;
conjurerStand.add(conjurer.rig);
scene.add(conjurerStand);

// Dois Dementadores, com fases diferentes para nao se moverem iguais
const dementors = [
  new Dementor(shroudAlpha, 0),
  new Dementor(shroudAlpha, 2.1),
];
dementors[0].setPosition(1.4, 0, -0.6);
dementors[1].setPosition(3.4, 0, -2.4).lookAtPoint(new THREE.Vector3(0, 0, 2));
for (const dementor of dementors) scene.add(dementor.group);

const patronus = new Patronus();
scene.add(patronus.group);

/* ------------------------------------------------------------------ */
/* Controles de teclado                                                */
/* ------------------------------------------------------------------ */

// pontos de interesse da camera para cada personagem
const views = {
  Digit1: { target: new THREE.Vector3(-2.4, 1.4, 0), position: new THREE.Vector3(-1.5, 1.7, 1.4) },
  Digit2: { target: new THREE.Vector3(1.4, 1.4, -0.6), position: new THREE.Vector3(1.9, 1.9, 2.6) },
  Digit3: { target: new THREE.Vector3(0, 1.2, 0), position: new THREE.Vector3(2.6, 1.8, 3.4) },
  Digit0: { target: new THREE.Vector3(0, 1.3, 0), position: new THREE.Vector3(3.2, 2.2, 4.6) },
};

let casting = false;
let wireframe = false;

window.addEventListener('keydown', (event) => {
  if (views[event.code]) {
    camera.position.copy(views[event.code].position);
    controls.target.copy(views[event.code].target);
  }

  if (event.code === 'Space' && !casting) {
    event.preventDefault();
    casting = true;
  }

  if (event.code === 'KeyG') helpers.visible = !helpers.visible;

  if (event.code === 'KeyL') {
    wireframe = !wireframe;
    scene.traverse((object) => {
      if (object.isMesh) object.material.wireframe = wireframe;
    });
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code !== 'Space') return;
  casting = false;

  // solta o feitico: o Patrono sai da ponta da varinha para a frente
  const origin = conjurer.getTipPosition();
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(conjurerStand.quaternion);
  conjurer.flash();
  patronus.cast(origin, direction);
});

// enquanto conjura, o mouse move a ponta da varinha (prototipo do gesto)
window.addEventListener('mousemove', (event) => {
  if (!casting) return;
  const x = (event.clientX / window.innerWidth) * 2 - 1;    // -1 a 1
  const y = -((event.clientY / window.innerHeight) * 2 - 1);
  conjurer.setAim(x, y);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ------------------------------------------------------------------ */
/* Laco de animacao                                                    */
/* ------------------------------------------------------------------ */

// exposto para depuracao pelo console do navegador (ex.: app.scene)
window.app = { scene, camera, renderer, conjurer, dementors, patronus };

const clock = new THREE.Clock();

function animate() {
  // delta = tempo do ultimo quadro. Toda animacao e multiplicada por ele
  // para a velocidade nao depender da taxa de quadros da maquina.
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  conjurer.update(delta, time, casting);
  for (const dementor of dementors) dementor.update(delta, time);
  patronus.update(delta, time);

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
