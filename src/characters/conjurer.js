// O Conjurador. Como o jogo e em primeira pessoa, do mago so aparece o
// braco segurando a varinha. A varinha e filha da mao, a mao e filha do
// cotovelo: mexer no ombro move tudo que esta abaixo dele, inclusive a
// luz da ponta.

import * as THREE from 'three';

export class Conjurer {
  constructor(woodTexture = null) {
    this.rig = new THREE.Group();
    this.rig.name = 'conjurador';

    const skin = new THREE.MeshStandardMaterial({
      color: 0xc89a74,
      roughness: 1,
      flatShading: true,
    });
    const robe = new THREE.MeshStandardMaterial({
      color: 0x323b52,
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const wood = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.9,
      flatShading: true,
    });

    this.buildArm(skin, robe);
    this.buildHand(skin);
    this.buildWand(wood);

    // mira do gesto, de -1 a 1, preenchida pelo main.js enquanto a barra
    // de espaco esta pressionada
    this.aimX = 0;
    this.aimY = 0;
    this.flashTimer = 0;
  }

  buildArm(skin, robe) {
    this.shoulder = new THREE.Group();
    this.shoulder.name = 'ombro';
    // entra na tela de baixo para cima, vindo da direita
    this.shoulder.rotation.set(-0.55, 0.12, -0.18);
    this.rig.add(this.shoulder);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.26, 2, 7), skin);
    upperArm.position.y = -0.13;
    upperArm.castShadow = true;
    this.shoulder.add(upperArm);

    const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 7, 1, true), robe);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    this.shoulder.add(sleeve);

    this.elbow = new THREE.Group();
    this.elbow.name = 'cotovelo';
    this.elbow.position.y = -0.27;
    this.elbow.rotation.x = 0.85;
    this.shoulder.add(this.elbow);

    const foreArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.24, 2, 7), skin);
    foreArm.position.y = -0.12;
    foreArm.castShadow = true;
    this.elbow.add(foreArm);
  }

  buildHand(skin) {
    this.hand = new THREE.Group();
    this.hand.name = 'mao';
    this.hand.position.y = -0.26;
    this.hand.rotation.x = 0.25;
    this.elbow.add(this.hand);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.052, 6, 5), skin);
    palm.scale.set(1, 0.72, 1.25);
    palm.castShadow = true;
    this.hand.add(palm);

    // tres dedos dobrados sobre o cabo ja dao a leitura da mao fechada
    for (let i = 0; i < 3; i++) {
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.05, 1, 5), skin);
      finger.position.set((i - 1) * 0.03, -0.022, 0.028);
      finger.rotation.x = 1.25;
      this.hand.add(finger);
    }
  }

  buildWand(wood) {
    this.wand = new THREE.Group();
    this.wand.name = 'varinha';
    this.wand.rotation.x = -1.35;   // deita a varinha para a frente da mao
    this.hand.add(this.wand);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.023, 0.14, 6), wood);
    handle.position.y = 0.07;
    handle.castShadow = true;
    this.wand.add(handle);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.017, 0.3, 6), wood);
    shaft.position.y = 0.29;
    shaft.castShadow = true;
    this.wand.add(shaft);

    this.tip = new THREE.Group();
    this.tip.name = 'ponta-da-varinha';
    this.tip.position.y = 0.45;
    this.wand.add(this.tip);

    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xdfefff })
    );
    this.tip.add(this.glow);

    // essa e a principal luz dinamica do jogo
    this.light = new THREE.PointLight(0xaad4ff, 14, 12);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(512, 512);
    this.tip.add(this.light);
  }

  setAim(x, y) {
    this.aimX = x;
    this.aimY = y;
  }

  flash() {
    this.flashTimer = 0.4;
  }

  update(delta, time, casting = false) {
    // oscilacao lenta para o braco nao ficar completamente imovel
    const breathe = Math.sin(time * 1.6) * 0.022;
    const aimX = casting ? this.aimX : 0;
    const aimY = casting ? this.aimY : 0;

    this.shoulder.rotation.x = -0.55 + breathe + aimY * 0.35;
    this.shoulder.rotation.y = 0.12 + aimX * 0.45;
    this.elbow.rotation.x = 0.85 - breathe * 1.5 - aimY * 0.2;
    this.hand.rotation.z = -aimX * 0.25;

    // a luz pulsa parada, cresce enquanto carrega e estoura no clarao
    const idle = 12 + Math.sin(time * 5) * 2;
    this.light.intensity = idle + (casting ? 18 : 0) + this.flashTimer * 160;
    this.glow.scale.setScalar(1 + (casting ? 0.8 : 0) + this.flashTimer * 10);

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - delta);
    }
  }

  // de onde o feitico sai
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
