// O Dementador: manto esvoacante, capuz vazio e dois bracos com garras.
// Poucos segmentos de proposito - com flatShading as facetas ficam a
// mostra e o modelo ganha um ar tosco, que combina com o bicho.

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

export class Dementor {
  constructor(shroudAlpha = null, phase = 0) {
    // o phase desencontra a animacao, senao todos flutuam iguais
    this.phase = phase;
    this.baseY = 0;

    this.group = new THREE.Group();
    this.group.name = 'dementador';

    this.createShroud(shroudAlpha);
    this.createHood();

    this.arms = [this.createArm(-1), this.createArm(1)];
    for (const arm of this.arms) this.group.add(arm.shoulder);

    // o Dementador esfria o ambiente por onde passa
    const aura = new THREE.PointLight(0x4477ff, 8, 6);
    aura.position.y = 1.8;
    this.group.add(aura);
  }

  createShroud(shroudAlpha) {
    // cilindro sem tampas, estreito nos ombros e aberto na barra.
    // 14 lados e 8 andares: pouco o suficiente para aparecer a quina
    const geometry = new THREE.CylinderGeometry(0.45, 1.15, 2.6, 14, 8, true);
    geometry.translate(0, 1.3, 0);

    // sem copia das posicoes originais a onda se acumula e o manto explode
    this.shroudBase = Float32Array.from(geometry.attributes.position.array);

    const material = cloth.clone();
    material.transparent = true;
    material.alphaMap = shroudAlpha;
    material.alphaTest = 0.5;   // recorta a franja; sem isso ela so desbota

    this.shroud = new THREE.Mesh(geometry, material);
    this.shroud.name = 'manto';
    this.shroud.castShadow = true;
    this.shroud.receiveShadow = true;
    this.group.add(this.shroud);
  }

  createHood() {
    this.hood = new THREE.Group();
    this.hood.name = 'capuz';
    this.hood.position.y = 2.5;

    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), cloth);
    shell.scale.set(1, 0.95, 1.1);
    shell.castShadow = true;
    this.hood.add(shell);

    const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), cloth);
    top.position.set(0, 0.32, -0.08);
    top.rotation.x = -0.25;   // bico caido para tras
    this.hood.add(top);

    // onde deveria estar o rosto fica so uma esfera quase preta
    const faceVoid = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 7, 5),
      new THREE.MeshStandardMaterial({ color: 0x05050c, roughness: 1, flatShading: true })
    );
    faceVoid.position.set(0, -0.02, 0.12);
    faceVoid.scale.set(1, 1.1, 0.8);
    this.hood.add(faceVoid);

    // MeshBasicMaterial ignora a luz, entao os olhos parecem brilhar
    this.eyes = [];
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0x6fd8ff })
      );
      eye.position.set(side * 0.1, 0.02, 0.32);
      this.hood.add(eye);
      this.eyes.push(eye);
    }

    this.group.add(this.hood);
  }

  // side = -1 (esquerdo) ou +1 (direito)
  createArm(side) {
    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? 'ombro-esquerdo' : 'ombro-direito';
    shoulder.position.set(side * 0.45, 2.1, 0.05);
    shoulder.rotation.z = side * 0.5;
    const baseRotationZ = shoulder.rotation.z;

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 2, 6), skin);
    upperArm.position.y = -0.2;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 7, 1, true), cloth);
    sleeve.position.y = -0.2;
    sleeve.castShadow = true;
    shoulder.add(sleeve);

    const elbow = new THREE.Group();
    elbow.name = 'cotovelo';
    elbow.position.y = -0.45;
    elbow.rotation.x = -0.7;
    shoulder.add(elbow);

    const foreArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 2, 6), skin);
    foreArm.position.y = -0.18;
    foreArm.castShadow = true;
    elbow.add(foreArm);

    const hand = new THREE.Group();
    hand.name = 'mao';
    hand.position.y = -0.4;
    elbow.add(hand);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), skin);
    palm.scale.set(1, 0.7, 1.2);
    hand.add(palm);

    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 4), skin);
      claw.position.set((i - 1) * 0.045, -0.09, 0.03);
      claw.rotation.x = Math.PI;   // vira a ponta do cone para baixo
      claw.rotation.z = (i - 1) * 0.2;
      hand.add(claw);
    }

    return { shoulder, elbow, baseRotationZ, side };
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

  update(delta, time) {
    const t = time + this.phase;

    this.group.position.y = this.baseY + Math.sin(t * 0.9) * 0.12;
    this.group.rotation.z = Math.sin(t * 0.6) * 0.04;

    // capuz pendendo de um lado para o outro, como se estivesse vazio
    this.hood.rotation.z = Math.sin(t * 0.8) * 0.08;

    for (const arm of this.arms) {
      arm.shoulder.rotation.z = arm.baseRotationZ + Math.sin(t * 1.1 + arm.side) * 0.15;
      arm.elbow.rotation.x = -0.7 + Math.sin(t * 1.4 + arm.side * 2) * 0.2;
    }

    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 2.2));
    for (const eye of this.eyes) {
      eye.material.color.setRGB(0.35 * pulse, 0.8 * pulse, pulse);
    }

    this.animateShroud(t);
  }

  // Afasta cada vertice do eixo central por um seno. A amplitude cresce
  // conforme desce o manto, por isso o topo fica firme e a barra esvoaca.
  // Com flatShading nao precisa recalcular normal: ela sai da propria face.
  animateShroud(t) {
    const position = this.shroud.geometry.attributes.position;
    const base = this.shroudBase;

    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = base[ix];
      const y = base[ix + 1];
      const z = base[ix + 2];

      const height = 1 - y / 2.6;   // 0 no topo, 1 na barra
      const wave = Math.sin(Math.atan2(z, x) * 3 + t * 2.4 + y * 2) * height * height * 0.22;

      position.array[ix] = x * (1 + wave);
      position.array[ix + 2] = z * (1 + wave);
      position.array[ix + 1] = y + wave * 0.2;
    }

    position.needsUpdate = true;
  }
}
