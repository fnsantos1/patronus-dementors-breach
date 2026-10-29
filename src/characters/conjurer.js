// O Conjurador. O jogo e em primeira pessoa, entao do mago so aparece o
// braco com a varinha. Sao sete blocos: braco, antebraco, mao, cabo,
// haste e a ponta que acende. A varinha e filha da mao e a mao e filha do
// cotovelo, logo mexer no ombro move tudo que vem abaixo, luz inclusive.

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
    const wood = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.9,
      flatShading: true,
    });

    // ombro: entra na tela de baixo para cima, vindo da direita
    this.shoulder = new THREE.Group();
    this.shoulder.name = 'ombro';
    this.shoulder.rotation.set(-0.55, 0.12, -0.18);
    this.rig.add(this.shoulder);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.13), skin);
    upperArm.position.y = -0.15;
    upperArm.castShadow = true;
    this.shoulder.add(upperArm);

    this.elbow = new THREE.Group();
    this.elbow.name = 'cotovelo';
    this.elbow.position.y = -0.29;
    this.elbow.rotation.x = 0.85;
    this.shoulder.add(this.elbow);

    const foreArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.11), skin);
    foreArm.position.y = -0.13;
    foreArm.castShadow = true;
    this.elbow.add(foreArm);

    this.hand = new THREE.Group();
    this.hand.name = 'mao';
    this.hand.position.y = -0.27;
    this.hand.rotation.x = 0.25;
    this.elbow.add(this.hand);

    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.14), skin);
    fist.castShadow = true;
    this.hand.add(fist);

    this.buildWand(wood);

    // mira do gesto, de -1 a 1, preenchida pelo main.js enquanto a barra
    // de espaco esta pressionada
    this.aimX = 0;
    this.aimY = 0;
    this.flashTimer = 0;
  }

  buildWand(wood) {
    this.wand = new THREE.Group();
    this.wand.name = 'varinha';
    this.wand.rotation.x = -1.35;   // deita a varinha para a frente da mao
    this.hand.add(this.wand);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.14, 0.042), wood);
    handle.position.y = 0.07;
    handle.castShadow = true;
    this.wand.add(handle);

    // cilindro de 4 lados: haste afunilada de secao quadrada
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.021, 0.3, 4), wood);
    shaft.position.y = 0.29;
    shaft.castShadow = true;
    this.wand.add(shaft);

    this.tip = new THREE.Group();
    this.tip.name = 'ponta-da-varinha';
    this.tip.position.y = 0.45;
    this.wand.add(this.tip);

    this.glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.035, 0.035),
      new THREE.MeshBasicMaterial({ color: 0xdfefff })
    );
    this.tip.add(this.glow);

    // principal luz dinamica do jogo
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

    // a luz pulsa parada, cresce enquanto carrega e estoura no clarao
    this.light.intensity = 12 + Math.sin(time * 5) * 2
      + (casting ? 18 : 0) + this.flashTimer * 160;
    this.glow.scale.setScalar(1 + this.flashTimer * 10);

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - delta);
    }
  }

  // de onde o feitico sai
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
