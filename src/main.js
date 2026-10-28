// Visualizador dos personagens (item 3.1 da proposta). Ainda nao e o jogo:
// e uma cena minima com chao, luzes e camera orbital, so para poder olhar
// os modelos de perto. A sala, as tres camaras e a mecanica de gesto vem
// nas proximas etapas.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createWoodTexture, createShroudAlphaTexture } from './core/textures.js';
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
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0f18);
scene.fog = new THREE.Fog(0x0c0f18, 12, 34);

const camera = new THREE.PerspectiveCamera(
  55,                                       // abertura em graus
  window.innerWidth / window.innerHeight,
  0.1,                                      // corte proximo
  100                                       // corte distante
);
camera.position.set(3.2, 2.2, 4.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
controls.enableDamping = true;

// A sala e escura de proposta, mas no visualizador precisamos ver os
// modelos: luz hemisferica fraca + uma direcional que faz as sombras.
scene.add(new THREE.HemisphereLight(0x95b6ff, 0x1a1c26, 1.1));
scene.add(new THREE.AmbientLight(0x7f96c8, 0.7));

const moonLight = new THREE.DirectionalLight(0xbcd2ff, 2.6);
moonLight.position.set(5, 9, 4);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -8;
moonLight.shadow.camera.right = 8;
moonLight.shadow.camera.top = 8;
moonLight.shadow.camera.bottom = -8;
scene.add(moonLight);

// duas tochas laranjas para os modelos nao ficarem todos azuis
for (const x of [-5, 5]) {
  const torch = new THREE.PointLight(0xff8c3a, 60, 18);
  torch.position.set(x, 2.8, -1);
  scene.add(torch);
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x4a4c57, roughness: 1 })
);
floor.name = 'chao';
floor.rotation.x = -Math.PI / 2;   // o plano nasce em pe, entao deitamos ele
floor.receiveShadow = true;
scene.add(floor);

const helpers = new THREE.Group();
helpers.add(new THREE.GridHelper(30, 30, 0x5e74a0, 0x2b3246));
helpers.add(new THREE.AxesHelper(2));
helpers.visible = false;
scene.add(helpers);

const woodTexture = createWoodTexture();
const shroudAlpha = createShroudAlphaTexture();

// No jogo o rig do Conjurador vai ser filho da camera. Aqui ele fica
// parado no mundo so para dar para girar em volta e inspecionar.
const conjurer = new Conjurer(woodTexture);
const conjurerStand = new THREE.Group();
conjurerStand.position.set(-2.4, 1.6, 0);
conjurerStand.rotation.y = 0.5;
conjurerStand.add(conjurer.rig);
scene.add(conjurerStand);

const dementors = [
  new Dementor(shroudAlpha, 0),
  new Dementor(shroudAlpha, 2.1),
];
dementors[0].setPosition(1.4, 0, -0.6);
dementors[1].setPosition(3.4, 0, -2.4).lookAtPoint(new THREE.Vector3(0, 0, 2));
for (const dementor of dementors) scene.add(dementor.group);

const patronus = new Patronus();
scene.add(patronus.group);

// de onde a camera olha cada personagem
const views = {
  Digit1: { target: new THREE.Vector3(-2.4, 1.4, 0), position: new THREE.Vector3(-1.5, 1.7, 1.4) },
  Digit2: { target: new THREE.Vector3(1.4, 1.4, -0.6), position: new THREE.Vector3(1.9, 1.9, 2.6) },
  Digit3: { target: new THREE.Vector3(0, 1.2, 0), position: new THREE.Vector3(2.6, 1.8, 3.4) },
  Digit0: { target: new THREE.Vector3(0, 1.3, 0), position: new THREE.Vector3(3.2, 2.2, 4.6) },
};

let casting = false;
let wireframe = false;

window.addEventListener('keydown', (event) => {
  const view = views[event.code];
  if (view) {
    camera.position.copy(view.position);
    controls.target.copy(view.target);
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

  // solta o feitico na direcao para onde o Conjurador esta virado
  const origin = conjurer.getTipPosition();
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(conjurerStand.quaternion);
  conjurer.flash();
  patronus.cast(origin, direction);
});

// enquanto conjura, o mouse move a ponta da varinha (esboco do gesto)
window.addEventListener('mousemove', (event) => {
  if (!casting) return;
  conjurer.setAim(
    (event.clientX / window.innerWidth) * 2 - 1,
    -((event.clientY / window.innerHeight) * 2 - 1)
  );
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// para depurar pelo console do navegador
window.app = { scene, camera, renderer, conjurer, dementors, patronus };

const clock = new THREE.Clock();

function animate() {
  // delta = duracao do ultimo quadro. Multiplicar as animacoes por ele
  // mantem a velocidade igual em maquinas com taxas de quadro diferentes.
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
