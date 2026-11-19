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
    const hair = new THREE.MeshStandardMaterial({
      color: 0x2a1d15,
      roughness: 0.9,
      flatShading: true,
    });
    const eye = new THREE.MeshStandardMaterial({
      color: 0x1a2230,
      roughness: 0.4,
      flatShading: true,
    });

    this.materials = { skin, wood, robePrimary, robeSecondary, robeCloak, leather, gold, hair, eye };

    this.buildTorsoAndRobe();
    this.buildHeadAndHood();
    this.buildLeftArm();
    this.buildLegs();

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

  buildHeadAndHood() {
    const { skin, robePrimary, robeSecondary, robeCloak, hair, eye } = this.materials;

    this.head = new THREE.Group();
    this.head.name = 'cabeca';
    this.head.position.set(0, 0.05, 0);
    this.body.add(this.head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 6), skin);
    neck.position.set(0, 0.04, 0);
    neck.castShadow = true;
    this.head.add(neck);

    const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.21, 0.18), skin);
    cranium.position.set(0, 0.17, -0.01);
    cranium.castShadow = true;
    this.head.add(cranium);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.02), eye);
    leftEye.position.set(-0.045, 0.18, -0.102);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.02), eye);
    rightEye.position.set(0.045, 0.18, -0.102);
    this.head.add(rightEye);

    const hairBrow = new THREE.Mesh(new THREE.BoxGeometry(0.186, 0.045, 0.06), hair);
    hairBrow.position.set(0, 0.25, -0.08);
    hairBrow.castShadow = true;
    this.head.add(hairBrow);

    const hoodRoof = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.25), robeCloak);
    hoodRoof.position.set(0, 0.29, -0.01);
    hoodRoof.rotation.x = 0.08;
    hoodRoof.castShadow = true;
    this.head.add(hoodRoof);

    const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.06), robeCloak);
    hoodBack.position.set(0, 0.17, 0.09);
    hoodBack.castShadow = true;
    this.head.add(hoodBack);

    const hoodLeft = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.25, 0.23), robeCloak);
    hoodLeft.position.set(-0.105, 0.17, 0);
    hoodLeft.castShadow = true;
    this.head.add(hoodLeft);

    const hoodRight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.25, 0.23), robeCloak);
    hoodRight.position.set(0.105, 0.17, 0);
    hoodRight.castShadow = true;
    this.head.add(hoodRight);

    const hoodTrim = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.03, 0.04), robeSecondary);
    hoodTrim.position.set(0, 0.29, -0.12);
    this.head.add(hoodTrim);

    const hoodPeak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), robeCloak);
    hoodPeak.position.set(0, 0.25, 0.16);
    hoodPeak.rotation.x = -0.85;
    hoodPeak.rotation.y = Math.PI / 4;
    hoodPeak.castShadow = true;
    this.head.add(hoodPeak);
  }

  buildLeftArm() {
    const { skin, robePrimary, robeSecondary } = this.materials;

    this.leftShoulder = new THREE.Group();
    this.leftShoulder.name = 'ombro-esquerdo';
    this.leftShoulder.position.set(-0.22, -0.02, 0);
    this.leftShoulder.rotation.set(0.18, 0, 0.14);
    this.body.add(this.leftShoulder);

    const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.13), robePrimary);
    leftUpperArm.position.y = -0.15;
    leftUpperArm.castShadow = true;
    this.leftShoulder.add(leftUpperArm);

    this.leftElbow = new THREE.Group();
    this.leftElbow.name = 'cotovelo-esquerdo';
    this.leftElbow.position.y = -0.29;
    this.leftElbow.rotation.x = 0.38;
    this.leftShoulder.add(this.leftElbow);

    const leftForeArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.11), robePrimary);
    leftForeArm.position.y = -0.13;
    leftForeArm.castShadow = true;
    this.leftElbow.add(leftForeArm);

    const leftCuff = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.05, 0.125), robeSecondary);
    leftCuff.position.y = -0.24;
    leftCuff.castShadow = true;
    this.leftElbow.add(leftCuff);

    this.leftHand = new THREE.Group();
    this.leftHand.name = 'mao-esquerda';
    this.leftHand.position.y = -0.27;
    this.leftElbow.add(this.leftHand);

    const leftFist = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.13), skin);
    leftFist.castShadow = true;
    this.leftHand.add(leftFist);
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

  buildLegs() {
    const { robeCloak, leather } = this.materials;

    const createLeg = (name, x) => {
      const leg = new THREE.Group();
      leg.name = name;
      leg.position.set(x, -0.78, 0);

      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), robeCloak);
      thigh.position.y = -0.19;
      thigh.castShadow = true;
      leg.add(thigh);

      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.1), robeCloak);
      shin.position.y = -0.52;
      shin.castShadow = true;
      leg.add(shin);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.18), leather);
      boot.position.set(0, -0.72, -0.03);
      boot.castShadow = true;
      boot.receiveShadow = true;
      leg.add(boot);

      this.body.add(leg);
      return leg;
    };

    this.leftLeg = createLeg('perna-esquerda', -0.1);
    this.rightLeg = createLeg('perna-direita', 0.1);
  }

  update(delta, isMoving = false) {
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

    // Animação sutil de respiração (idle) e caminhada
    if (this.body) {
      this.body.position.y = Math.sin(this.time * 2.2) * 0.012;
    }

    const targetSwing = isMoving ? Math.sin(this.time * 8.0) * 0.45 : 0;
    const lerpFactor = Math.min(1, delta * 10);

    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x += (targetSwing - this.leftLeg.rotation.x) * lerpFactor;
      this.rightLeg.rotation.x += (-targetSwing - this.rightLeg.rotation.x) * lerpFactor;
    }

    if (this.leftShoulder) {
      const armTarget = 0.18 - targetSwing * 0.6;
      this.leftShoulder.rotation.x += (armTarget - this.leftShoulder.rotation.x) * lerpFactor;
    }
  }

  // de onde o feitico vai sair
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
