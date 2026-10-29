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

    // a luz da ponta: fixa nesta entrega
    this.light = new THREE.PointLight(0xaad4ff, 14, 12);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(512, 512);
    this.tip.add(this.light);
  }

  // de onde o feitico vai sair
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
