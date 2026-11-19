// O Conjurador. O jogo e em primeira pessoa, entao do mago so aparece o
// braco com a varinha. Sao sete blocos: braco, antebraco, mao, cabo,
// haste e a ponta que acende. A varinha e filha da mao e a mao e filha do
// cotovelo, logo mexer no ombro move tudo que vem abaixo, luz inclusive.

import * as THREE from 'three';
import { WandSmokeSystem } from '../core/particles.js';
import { createSpectralStarTexture } from '../core/textures.js';

export class Conjurer {
  constructor(texturas, particleTexture = null) {
    this.rig = new THREE.Group();
    this.rig.name = 'conjurador';

    const skin = new THREE.MeshStandardMaterial({
      color: 0xc89a74,
      roughness: 1,
      flatShading: true,
    });
    const woodTextureProps = texturas?.madeira ? texturas.madeira : (texturas?.map ? texturas : {});
    const wood = new THREE.MeshStandardMaterial({
      ...woodTextureProps,
      roughness: 0.9,
      flatShading: true,
    });
    const robePrimary = new THREE.MeshStandardMaterial({
      color: 0x1e2638,
      roughness: 0.88,
      flatShading: true,
    });
    const robeSecondary = new THREE.MeshStandardMaterial({
      color: 0x2c3852,
      roughness: 0.85,
      flatShading: true,
    });
    const robeCloak = new THREE.MeshStandardMaterial({
      color: 0x151a28,
      roughness: 0.92,
      flatShading: true,
    });
    const leather = new THREE.MeshStandardMaterial({
      color: 0x3b2618,
      roughness: 0.8,
      flatShading: true,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xd4a84f,
      roughness: 0.4,
      metalness: 0.5,
      flatShading: true,
    });

    this.materials = { skin, wood, robePrimary, robeSecondary, robeCloak, leather, gold };

    this.buildTorsoAndRobe();

    // ombro: entra na tela de baixo para cima, vindo da direita
    this.shoulder = new THREE.Group();
    this.shoulder.name = 'ombro';
    this.shoulder.position.set(0.22, -0.02, 0);
    this.shoulder.rotation.set(-0.55, 0.12, -0.18);
    this.rig.add(this.shoulder);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.13), robePrimary);
    upperArm.position.y = -0.15;
    upperArm.castShadow = true;
    this.shoulder.add(upperArm);

    this.elbow = new THREE.Group();
    this.elbow.name = 'cotovelo';
    this.elbow.position.y = -0.29;
    this.elbow.rotation.x = 0.85;
    this.shoulder.add(this.elbow);

    const foreArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.11), robePrimary);
    foreArm.position.y = -0.13;
    foreArm.castShadow = true;
    this.elbow.add(foreArm);

    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.05, 0.125), robeSecondary);
    cuff.position.y = -0.24;
    cuff.castShadow = true;
    this.elbow.add(cuff);

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

  buildTorsoAndRobe() {
    const { robePrimary, robeSecondary, robeCloak, leather, gold } = this.materials;

    this.body = new THREE.Group();
    this.body.name = 'corpo';
    this.rig.add(this.body);

    const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.27, 0.14, 6), robeCloak);
    mantle.position.y = -0.02;
    mantle.scale.set(1.05, 1, 0.72);
    mantle.castShadow = true;
    mantle.receiveShadow = true;
    this.body.add(mantle);

    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.03), gold);
    clasp.position.set(0, -0.04, -0.18);
    this.body.add(clasp);

    const upperTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.4, 6), robePrimary);
    upperTorso.position.y = -0.22;
    upperTorso.scale.set(1.0, 1, 0.72);
    upperTorso.castShadow = true;
    upperTorso.receiveShadow = true;
    this.body.add(upperTorso);

    const chestPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.04), robeSecondary);
    chestPanel.position.set(0, -0.22, -0.13);
    chestPanel.castShadow = true;
    this.body.add(chestPanel);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.172, 0.07, 6), leather);
    belt.position.y = -0.44;
    belt.scale.set(1.02, 1, 0.75);
    belt.castShadow = true;
    this.body.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.03), gold);
    buckle.position.set(0, -0.44, -0.135);
    this.body.add(buckle);

    const lowerRobe = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.33, 0.72, 6), robePrimary);
    lowerRobe.position.y = -0.82;
    lowerRobe.scale.set(1.0, 1, 0.78);
    lowerRobe.castShadow = true;
    lowerRobe.receiveShadow = true;
    this.body.add(lowerRobe);

    const robeFrontStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.03), robeSecondary);
    robeFrontStrip.position.set(0, -0.82, -0.2);
    robeFrontStrip.rotation.x = 0.15;
    robeFrontStrip.castShadow = true;
    this.body.add(robeFrontStrip);

    const backCloak = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.96, 0.04), robeCloak);
    backCloak.position.set(0, -0.52, 0.16);
    backCloak.rotation.x = 0.12;
    backCloak.castShadow = true;
    backCloak.receiveShadow = true;
    this.body.add(backCloak);
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
