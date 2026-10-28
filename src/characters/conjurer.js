// O Conjurador. Como o jogo e em primeira pessoa, do mago so aparece o
// braco segurando a varinha. A varinha e filha da mao, a mao e filha do
// cotovelo e por ai vai - mexer no ombro move tudo que esta abaixo dele,
// inclusive a luz e as particulas da ponta.

import * as THREE from 'three';

export class Conjurer {
  constructor(woodTexture = null, sparkTexture = null) {
    this.rig = new THREE.Group();
    this.rig.name = 'conjurador';

    this.skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc89a74, roughness: 0.7 });
    this.robeMaterial = new THREE.MeshStandardMaterial({
      color: 0x323b52,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    this.woodMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.6 });

    this.createArm();
    this.createHand();
    this.createWand(sparkTexture);

    // mira do gesto, de -1 a 1, preenchida pelo main.js enquanto a barra
    // de espaco esta pressionada
    this.aimX = 0;
    this.aimY = 0;
    this.flashTimer = 0;
  }

  createArm() {
    this.shoulder = new THREE.Group();
    this.shoulder.name = 'ombro';
    // entra na tela de baixo para cima, vindo da direita
    this.shoulder.rotation.set(-0.55, 0.12, -0.18);
    this.rig.add(this.shoulder);

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.058, 0.26, 4, 12),
      this.skinMaterial
    );
    upperArm.position.y = -0.13;
    upperArm.castShadow = true;
    this.shoulder.add(upperArm);

    const sleeve = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.34, 14, 1, true),
      this.robeMaterial
    );
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    this.shoulder.add(sleeve);

    this.elbow = new THREE.Group();
    this.elbow.name = 'cotovelo';
    this.elbow.position.y = -0.27;
    this.elbow.rotation.x = 0.85;
    this.shoulder.add(this.elbow);

    const foreArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.046, 0.24, 4, 12),
      this.skinMaterial
    );
    foreArm.position.y = -0.12;
    foreArm.castShadow = true;
    this.elbow.add(foreArm);

    // punho da veste
    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.022, 8, 18),
      this.robeMaterial
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.02;
    this.elbow.add(cuff);
  }

  createHand() {
    this.hand = new THREE.Group();
    this.hand.name = 'mao';
    this.hand.position.y = -0.26;
    this.hand.rotation.x = 0.25;
    this.elbow.add(this.hand);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 10), this.skinMaterial);
    palm.scale.set(1, 0.72, 1.25);
    palm.castShadow = true;
    this.hand.add(palm);

    // quatro dedos dobrados sobre o cabo
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.0115, 0.05, 3, 8),
        this.skinMaterial
      );
      finger.position.set((i - 1.5) * 0.026, -0.022, 0.028);
      finger.rotation.x = 1.25;
      this.hand.add(finger);
    }

    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.014, 0.045, 3, 8),
      this.skinMaterial
    );
    thumb.position.set(0.045, -0.005, -0.012);
    thumb.rotation.set(0.9, 0, -0.8);
    this.hand.add(thumb);
  }

  createWand(sparkTexture) {
    this.wand = new THREE.Group();
    this.wand.name = 'varinha';
    this.wand.rotation.x = -1.35;    // deita a varinha para a frente da mao
    this.hand.add(this.wand);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.023, 0.14, 14),
      this.woodMaterial
    );
    handle.position.y = 0.07;
    handle.castShadow = true;
    this.wand.add(handle);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.017, 0.3, 12),
      this.woodMaterial
    );
    shaft.position.y = 0.29;
    shaft.castShadow = true;
    this.wand.add(shaft);

    this.tip = new THREE.Group();
    this.tip.name = 'ponta-da-varinha';
    this.tip.position.y = 0.45;
    this.wand.add(this.tip);

    this.tipGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xdfefff })
    );
    this.tip.add(this.tipGlow);

    // essa e a principal luz dinamica do jogo
    this.tipLight = new THREE.PointLight(0xaad4ff, 14, 12);
    this.tipLight.castShadow = true;
    this.tipLight.shadow.mapSize.set(512, 512);
    this.tip.add(this.tipLight);

    this.createSparks(sparkTexture);
  }

  // Posicao, velocidade e vida de cada particula ficam em arrays paralelos.
  // Quando a vida acaba, a particula volta para a ponta da varinha.
  createSparks(sparkTexture, count = 80) {
    this.sparkCount = count;
    this.sparkPositions = new Float32Array(count * 3);
    this.sparkVelocities = new Float32Array(count * 3);
    this.sparkLives = new Float32Array(count);

    // vidas iniciais sorteadas para nao nascerem todas no mesmo instante
    for (let i = 0; i < count; i++) this.sparkLives[i] = Math.random();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      map: sparkTexture,
      color: 0xbfe0ff,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,   // particulas sobrepostas somam brilho
    });

    this.sparks = new THREE.Points(geometry, material);
    this.sparks.frustumCulled = false;
    this.tip.add(this.sparks);
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
    const sway = Math.sin(time * 0.9) * 0.03;

    const aimX = casting ? this.aimX : 0;
    const aimY = casting ? this.aimY : 0;

    this.shoulder.rotation.x = -0.55 + breathe + aimY * 0.35;
    this.shoulder.rotation.y = 0.12 + sway * 0.6 + aimX * 0.45;
    this.elbow.rotation.x = 0.85 - breathe * 1.5 - aimY * 0.2;
    this.hand.rotation.z = -aimX * 0.25;

    this.updateLight(delta, time, casting);
    this.updateSparks(delta, casting);
  }

  updateLight(delta, time, casting) {
    // pulsa parada, cresce enquanto carrega o feitico e estoura no clarao
    const idle = 12 + Math.sin(time * 5) * 2;
    const charge = casting ? 18 : 0;
    const flash = this.flashTimer * 160;

    this.tipLight.intensity = idle + charge + flash;
    this.tipGlow.scale.setScalar(1 + (casting ? 0.8 : 0) + this.flashTimer * 10);

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - delta);
    }
  }

  updateSparks(delta, casting) {
    const spread = casting ? 0.08 : 0.03;

    for (let i = 0; i < this.sparkCount; i++) {
      const ix = i * 3;
      this.sparkLives[i] -= delta * (casting ? 1.6 : 1);

      if (this.sparkLives[i] <= 0) {
        this.sparkLives[i] = 0.6 + Math.random() * 0.6;
        this.sparkPositions[ix] = 0;
        this.sparkPositions[ix + 1] = 0;
        this.sparkPositions[ix + 2] = 0;
        this.sparkVelocities[ix] = (Math.random() - 0.5) * spread;
        this.sparkVelocities[ix + 1] = 0.05 + Math.random() * spread * 2;
        this.sparkVelocities[ix + 2] = (Math.random() - 0.5) * spread;
      }

      this.sparkPositions[ix] += this.sparkVelocities[ix] * delta;
      this.sparkPositions[ix + 1] += this.sparkVelocities[ix + 1] * delta;
      this.sparkPositions[ix + 2] += this.sparkVelocities[ix + 2] * delta;
    }

    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.material.opacity = casting ? 1 : 0.6;
  }

  // de onde o feitico sai
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
