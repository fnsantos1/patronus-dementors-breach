/**
 * conjurer.js - Conjurador (personagem jogavel).
 *
 * O jogo e em primeira pessoa, entao o jogador e representado pelo braco
 * do mago empunhando a varinha. A montagem toda e hierarquica:
 *
 *   rig ....................... posicionado na frente da camera
 *    |- shoulder .............. balanco de respiracao / mira do gesto
 *         |- upperArm ......... capsula (braco)
 *         |- sleeve ........... cone aberto (manga da veste)
 *         |- elbow ............ grupo que dobra o antebraco
 *              |- foreArm ..... capsula
 *              |- cuff ........ toro (punho da veste)
 *              |- hand ........ grupo da mao
 *                   |- palm ... esfera achatada
 *                   |- 4 dedos + polegar (capsulas)
 *                   |- wand ... grupo da varinha
 *                        |- handle .. cilindro grosso (cabo)
 *                        |- shaft ... cilindro afunilado (haste)
 *                        |- tip ..... grupo da ponta
 *                             |- tipGlow .. esfera luminosa
 *                             |- tipLight . PointLight (ilumina a cena)
 *                             |- sparks ... particulas (Points)
 *
 * Como a varinha e filha da mao, girar o ombro move a varinha, a luz e as
 * particulas juntas - nao precisamos recalcular nada disso na mao.
 */

import * as THREE from 'three';

export class Conjurer {
  /**
   * @param {THREE.Texture} woodTexture  textura da madeira da varinha
   * @param {THREE.Texture} sparkTexture textura das particulas
   */
  constructor(woodTexture = null, sparkTexture = null) {
    this.rig = new THREE.Group();
    this.rig.name = 'conjurador';

    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xbf8f6a,
      roughness: 0.7,
    });
    this.robeMaterial = new THREE.MeshStandardMaterial({
      color: 0x242a3a,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    this.woodMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.6,
    });

    this.createArm();
    this.createHand();
    this.createWand(sparkTexture);

    // mira do gesto: enquanto a barra de espaco esta pressionada, o mouse
    // move a ponta da varinha. Valores em -1..1 preenchidos por main.js.
    this.aimX = 0;
    this.aimY = 0;
    this.flashTimer = 0;
  }

  /** Ombro, braco, manga, cotovelo e antebraco. */
  createArm() {
    this.shoulder = new THREE.Group();
    this.shoulder.name = 'ombro';
    // o braco entra na tela de baixo para cima, vindo da direita
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

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.022, 8, 18),
      this.robeMaterial
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.02;
    this.elbow.add(cuff);
  }

  /** Mao fechada sobre o cabo: palma, quatro dedos e polegar. */
  createHand() {
    this.hand = new THREE.Group();
    this.hand.name = 'mao';
    this.hand.position.y = -0.26;
    this.hand.rotation.x = 0.25;
    this.elbow.add(this.hand);

    const palm = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 14, 10),
      this.skinMaterial
    );
    palm.scale.set(1, 0.72, 1.25);
    palm.castShadow = true;
    this.hand.add(palm);

    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.0115, 0.05, 3, 8),
        this.skinMaterial
      );
      finger.position.set((i - 1.5) * 0.026, -0.022, 0.028);
      finger.rotation.x = 1.25;               // dedos dobrados sobre o cabo
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

  /** Varinha: cabo, haste e a ponta com luz, brilho e particulas. */
  createWand(sparkTexture) {
    this.wand = new THREE.Group();
    this.wand.name = 'varinha';
    this.wand.rotation.x = -1.35;             // aponta para a frente da mao
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

    // a luz da ponta e a principal fonte dinamica da cena
    this.tipLight = new THREE.PointLight(0xaad4ff, 2, 9);
    this.tipLight.castShadow = true;
    this.tipLight.shadow.mapSize.set(512, 512);
    this.tip.add(this.tipLight);

    this.createSparks(sparkTexture);
  }

  /**
   * Particulas da ponta. Guardamos posicao, velocidade e tempo de vida de
   * cada particula em arrays paralelos; quando a vida acaba, a particula
   * volta para a ponta da varinha (reciclagem).
   */
  createSparks(sparkTexture, count = 80) {
    this.sparkCount = count;
    this.sparkPositions = new Float32Array(count * 3);
    this.sparkVelocities = new Float32Array(count * 3);
    this.sparkLives = new Float32Array(count);

    // vidas iniciais sorteadas para as particulas nao nascerem todas juntas
    for (let i = 0; i < count; i++) this.sparkLives[i] = Math.random();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      map: sparkTexture,
      color: 0xbfe0ff,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,   // particulas se somam = brilho
    });

    this.sparks = new THREE.Points(geometry, material);
    this.sparks.frustumCulled = false;
    this.tip.add(this.sparks);
  }

  /** Direcao do gesto durante a conjuracao, em -1..1. */
  setAim(x, y) {
    this.aimX = x;
    this.aimY = y;
  }

  /** Clarao do feitico bem-sucedido. */
  flash() {
    this.flashTimer = 0.4;
  }

  /**
   * @param {number} delta segundos desde o quadro anterior
   * @param {number} time  tempo total em segundos
   * @param {boolean} casting true enquanto a barra de espaco esta pressionada
   */
  update(delta, time, casting = false) {
    // respiracao: oscilacao lenta que mantem o braco "vivo" quando parado
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

  /** Intensidade da luz: pulsa parada, cresce ao carregar, estoura no clarao. */
  updateLight(delta, time, casting) {
    const idle = 1.6 + Math.sin(time * 5) * 0.25;
    const charge = casting ? 2.5 : 0;
    const flash = this.flashTimer * 25;

    this.tipLight.intensity = idle + charge + flash;
    this.tipGlow.scale.setScalar(1 + charge * 0.3 + flash * 0.4);

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - delta);
    }
  }

  /** Move as particulas e recicla as que morreram. */
  updateSparks(delta, casting) {
    const spread = casting ? 0.08 : 0.03;

    for (let i = 0; i < this.sparkCount; i++) {
      const ix = i * 3;
      this.sparkLives[i] -= delta * (casting ? 1.6 : 1);

      if (this.sparkLives[i] <= 0) {
        // renasce na ponta da varinha com velocidade sorteada
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

  /** Posicao da ponta da varinha no mundo (origem do feitico). */
  getTipPosition(target = new THREE.Vector3()) {
    return this.tip.getWorldPosition(target);
  }
}
