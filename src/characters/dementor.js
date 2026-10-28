// O Dementador: manto esvoacante, capuz vazio e dois bracos com garras.
// A ideia e que nenhuma parte dele seja uma primitiva solta - o corpo todo
// e montado com grupos encaixados, entao girar o ombro leva o antebraco,
// a mao e as garras junto.

import * as THREE from 'three';

export class Dementor {
  constructor(shroudAlpha = null, phase = 0) {
    // o phase desencontra a animacao de cada Dementador, senao todos
    // flutuam exatamente iguais e fica estranho
    this.phase = phase;
    this.baseY = 0;

    this.group = new THREE.Group();
    this.group.name = 'dementador';

    this.createShroud(shroudAlpha);
    this.createHood();

    this.arms = [this.createArm(-1), this.createArm(1)];
    for (const arm of this.arms) this.group.add(arm.shoulder);

    // o Dementador "esfria" o ambiente por onde passa
    const aura = new THREE.PointLight(0x4477ff, 8, 6);
    aura.position.y = 1.8;
    this.group.add(aura);
  }

  createShroud(shroudAlpha) {
    // cilindro sem tampas: estreito nos ombros, aberto na barra.
    // 12 segmentos de altura porque sao esses vertices que vao ondular
    const geometry = new THREE.CylinderGeometry(0.45, 1.15, 2.6, 24, 12, true);
    geometry.translate(0, 1.3, 0);   // base no chao

    // sem guardar as posicoes originais a onda se acumula e o manto explode
    this.shroudBasePositions = Float32Array.from(geometry.attributes.position.array);

    const material = new THREE.MeshStandardMaterial({
      color: 0x24252f,
      roughness: 0.95,
      side: THREE.DoubleSide,
      transparent: true,
      alphaMap: shroudAlpha,
      alphaTest: 0.5,    // recorta a franja; sem isso ela so desbota
    });

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

    const cloth = new THREE.MeshStandardMaterial({
      color: 0x2a2b36,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), cloth);
    shell.scale.set(1, 0.95, 1.1);
    shell.castShadow = true;
    this.hood.add(shell);

    const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 16), cloth);
    top.position.set(0, 0.32, -0.08);
    top.rotation.x = -0.25;   // bico do capuz caido para tras
    this.hood.add(top);

    // esfera quase preta onde deveria estar o rosto
    const faceVoid = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x05050c, roughness: 1 })
    );
    faceVoid.position.set(0, -0.02, 0.12);
    faceVoid.scale.set(1, 1.1, 0.8);
    this.hood.add(faceVoid);

    // MeshBasicMaterial ignora a iluminacao, entao os olhos parecem brilhar
    this.eyes = [];
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 10, 8),
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
    const skin = new THREE.MeshStandardMaterial({ color: 0x4a4852, roughness: 0.8 });
    const cloth = new THREE.MeshStandardMaterial({
      color: 0x1f2029,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });

    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? 'ombro-esquerdo' : 'ombro-direito';
    shoulder.position.set(side * 0.45, 2.1, 0.05);
    shoulder.rotation.z = side * 0.5;
    const baseRotationZ = shoulder.rotation.z;

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 10), skin);
    upperArm.position.y = -0.2;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 12, 1, true), cloth);
    sleeve.position.y = -0.2;
    sleeve.castShadow = true;
    shoulder.add(sleeve);

    const elbow = new THREE.Group();
    elbow.name = 'cotovelo';
    elbow.position.y = -0.45;
    elbow.rotation.x = -0.7;
    shoulder.add(elbow);

    const foreArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 4, 10), skin);
    foreArm.position.y = -0.18;
    foreArm.castShadow = true;
    elbow.add(foreArm);

    const hand = new THREE.Group();
    hand.name = 'mao';
    hand.position.y = -0.4;
    elbow.add(hand);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), skin);
    palm.scale.set(1, 0.7, 1.2);
    hand.add(palm);

    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 6), skin);
      claw.position.set((i - 1) * 0.045, -0.09, 0.03);
      claw.rotation.x = Math.PI;         // vira a ponta do cone para baixo
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
    this.hood.rotation.x = Math.sin(t * 0.5) * 0.05;

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
  animateShroud(t) {
    const position = this.shroud.geometry.attributes.position;
    const base = this.shroudBasePositions;

    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = base[ix];
      const y = base[ix + 1];
      const z = base[ix + 2];

      const height = 1 - y / 2.6;              // 0 no topo, 1 na barra
      const amplitude = height * height * 0.22;
      const angle = Math.atan2(z, x);
      const wave = Math.sin(angle * 3 + t * 2.4 + y * 2) * amplitude;

      position.array[ix] = x * (1 + wave);
      position.array[ix + 2] = z * (1 + wave);
      position.array[ix + 1] = y + wave * 0.2;
    }

    position.needsUpdate = true;
    this.shroud.geometry.computeVertexNormals();   // senao a luz fica errada
  }
}
