// O Dementador: um manto de quatro lados, um capuz vazio e dois bracos
// com garra, tudo em caixas. O modelo fica parado - a onda que abre as
// dobras do manto e aplicada uma vez, na montagem.

import * as THREE from 'three';

const cloth = new THREE.MeshStandardMaterial({
  color: 0x24252f,
  roughness: 1,
  flatShading: true,
  side: THREE.DoubleSide,
});

const skin = new THREE.MeshStandardMaterial({
  color: 0x4a4852,
  roughness: 1,
  flatShading: true,
});

// Afasta cada vertice do eixo central por um seno, com amplitude maior
// conforme desce o manto: o topo fica firme e a barra abre em dobras.
function rufflePrism(geometry, phase) {
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const ix = i * 3;
    const x = position.array[ix];
    const y = position.array[ix + 1];
    const z = position.array[ix + 2];

    const height = 1 - y / 2.6;   // 0 no topo, 1 na barra
    const wave = Math.sin(Math.atan2(z, x) * 3 + phase + y * 2) * height * height * 0.22;

    position.array[ix] = x * (1 + wave);
    position.array[ix + 2] = z * (1 + wave);
    position.array[ix + 1] = y + wave * 0.2;
  }

  geometry.computeVertexNormals();
}

export class Dementor {
  constructor(shroudAlpha = null, phase = 0) {
    this.phase = phase;   // muda as dobras do manto de cada Dementador
    this.baseY = 0;

    this.group = new THREE.Group();
    this.group.name = 'dementador';

    this.createShroud(shroudAlpha);
    this.createHood();

    this.arms = [this.createArm(-1), this.createArm(1)];
    for (const arm of this.arms) this.group.add(arm.shoulder);

    // ele esfria o ambiente por onde passa
    const aura = new THREE.PointLight(0x4477ff, 8, 6);
    aura.position.y = 1.8;
    this.group.add(aura);
  }

  createShroud(shroudAlpha) {
    // cilindro de 4 lados e sem tampas: uma caixa afunilada, estreita nos
    // ombros e aberta na barra
    const geometry = new THREE.CylinderGeometry(0.5, 1.2, 2.6, 4, 6, true);
    geometry.translate(0, 1.3, 0);

    // o manto recebe a onda uma unica vez, so para nao ficar um prisma
    // perfeito; o phase muda o desenho das dobras de cada Dementador
    rufflePrism(geometry, this.phase);

    const material = cloth.clone();
    material.transparent = true;
    material.alphaMap = shroudAlpha;
    material.alphaTest = 0.5;   // recorta a franja; sem isso ela so desbota

    this.shroud = new THREE.Mesh(geometry, material);
    this.shroud.name = 'manto';
    this.shroud.rotation.y = Math.PI / 4;   // uma face virada para a frente
    this.shroud.castShadow = true;
    this.shroud.receiveShadow = true;
    this.group.add(this.shroud);
  }

  createHood() {
    this.hood = new THREE.Group();
    this.hood.name = 'capuz';
    this.hood.position.y = 2.45;

    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.74, 0.86), cloth);
    shell.castShadow = true;
    this.hood.add(shell);

    // onde deveria estar o rosto fica so um bloco quase preto
    const faceVoid = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.56, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x05050c, roughness: 1 })
    );
    faceVoid.position.z = 0.33;
    this.hood.add(faceVoid);

    for (const side of [-1, 1]) {
      // MeshBasicMaterial ignora a luz, entao o olho parece brilhar
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.055, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x6fd8ff })
      );
      eye.position.set(side * 0.12, 0.03, 0.48);
      this.hood.add(eye);
    }

    this.group.add(this.hood);
  }

  // side = -1 (esquerdo) ou +1 (direito)
  createArm(side) {
    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? 'ombro-esquerdo' : 'ombro-direito';
    shoulder.position.set(side * 0.45, 2.1, 0.05);
    shoulder.rotation.z = side * 0.5;

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.46, 0.15), skin);
    upperArm.position.y = -0.23;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.name = 'cotovelo';
    elbow.position.y = -0.47;
    elbow.rotation.x = -0.7;
    shoulder.add(elbow);

    // antebraco e mao no mesmo bloco, com uma garra na ponta
    const foreArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.12), skin);
    foreArm.position.y = -0.22;
    foreArm.castShadow = true;
    elbow.add(foreArm);

    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), skin);
    claw.position.y = -0.55;
    claw.rotation.x = Math.PI;   // ponta da piramide para baixo
    elbow.add(claw);

    return { shoulder, elbow, baseRotationZ: shoulder.rotation.z, side };
  }

  setPosition(x, y, z) {
    this.baseY = y;   // altura em torno da qual ele flutua
    this.group.position.set(x, y, z);
    return this;
  }

  lookAtPoint(target) {
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    this.group.rotation.y = Math.atan2(dx, dz);
    return this;
  }
}
