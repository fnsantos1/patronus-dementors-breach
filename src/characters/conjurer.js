// O Conjurador. O jogo e em primeira pessoa, entao do mago so aparece o
// braco com a varinha. Sao sete blocos: braco, antebraco, mao, cabo,
// haste e a ponta que acende. A varinha e filha da mao e a mao e filha do
// cotovelo, logo mexer no ombro move tudo que vem abaixo, luz inclusive.

import * as THREE from 'three';
import { WandSmokeSystem } from '../core/particles.js';
import { createSpectralStarTexture } from '../core/textures.js';

export class Conjurer {
  constructor(woodTexture = null, particleTexture = null) {
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

    this.buildWand(wood, particleTexture);
  }

  buildWand(wood, particleTexture) {
    this.wand = new THREE.Group();
    this.wand.name = 'varinha';
    this.wand.rotation.x = -1.35; // deita a varinha para a frente da mao
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

    // Estrela de luz difusa na ponta da varinha (THREE.Sprite aditivo)
    const starTexture = createSpectralStarTexture();
    const starMaterial = new THREE.SpriteMaterial({
      map: starTexture,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.88,
    });
    this.star = new THREE.Sprite(starMaterial);
    this.star.scale.set(0.08, 0.08, 0.08);
    this.tip.add(this.star);

    // Mantém compatibilidade com referências a glow
    this.glow = this.star;

    // A luz da ponta da varinha
    this.light = new THREE.PointLight(0xaad4ff, 14, 12);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(512, 512);
    this.tip.add(this.light);

    this.charge = 0;
    this.time = 0;

    // Aura e névoa etérea da Varinha
    if (particleTexture) {
      this.particleSystem = new WandSmokeSystem(this.tip, particleTexture);
    }
  }

  setMagicCharge(charge) {
    this.charge = charge;

    if (this.particleSystem) {
      this.particleSystem.setCharge(charge);
    }
    // Luz suave mais etérea e intensa
    if (this.light) {
      this.light.intensity = 14 + charge * 20;
      this.light.distance = 12 + charge * 4;
    }
    // Expansão suave e pulso dinâmico da estrela difusa
    if (this.star) {
      const baseScale = 0.08 + charge * 0.14; // expande de 0.08m até 0.22m
      this.star.scale.set(baseScale, baseScale, baseScale);
      if (this.star.material) {
        this.star.material.opacity = 0.88 + charge * 0.12;
      }
    }
  }

  update(delta) {
    this.time += delta;

    if (this.particleSystem) {
      this.particleSystem.update(delta);
    }

    // Cintilação sutil e respiração orgânica da estrela espectral
    if (this.star) {
      const shimmer = 1.0 + Math.sin(this.time * 7.0) * 0.08;
      const currentBase = 0.08 + (this.charge || 0) * 0.14;
      const s = currentBase * shimmer;
      this.star.scale.set(s, s, s);
    }
  }

  // de onde o feitico vai sair
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
