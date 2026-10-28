/**
 * dementor.js - Dementador (inimigo).
 *
 * Personagem complexo: nenhuma parte dele e uma primitiva isolada. O corpo
 * reune 15+ malhas organizadas em grupos, o que da a hierarquia de
 * transformacoes exigida pela disciplina:
 *
 *   group .................. corpo inteiro (flutua e gira)
 *    |- shroud ............. manto (cilindro aberto deformado por onda)
 *    |- hood ............... capuz
 *    |    |- hoodShell ..... esfera achatada
 *    |    |- hoodTop ....... cone (bico do capuz)
 *    |    |- faceVoid ...... esfera escura = vazio do rosto
 *    |    |- eyes[2] ....... esferas luminosas
 *    |- arms[2]
 *         |- shoulder ...... grupo que gira o braco todo
 *              |- upperArm . capsula
 *              |- sleeve ... cone aberto (manga)
 *              |- elbow .... grupo que dobra o antebraco
 *                   |- foreArm ... capsula
 *                   |- hand ...... esfera + 3 garras (cones)
 *
 * Girar `shoulder` arrasta antebraco, mao e garras; e esse o ponto de
 * usar grupos em vez de posicionar cada peca em coordenadas absolutas.
 */

import * as THREE from 'three';

export class Dementor {
  /**
   * @param {THREE.Texture} shroudAlpha mapa de transparencia do manto
   * @param {number} phase deslocamento da animacao, para que varios
   *                       Dementadores nao se mexam em sincronia
   */
  constructor(shroudAlpha = null, phase = 0) {
    this.phase = phase;
    this.baseY = 0;

    this.group = new THREE.Group();
    this.group.name = 'dementador';

    this.createShroud(shroudAlpha);
    this.createHood();

    // dois bracos simetricos: -1 = esquerdo, +1 = direito
    this.arms = [this.createArm(-1), this.createArm(1)];
    for (const arm of this.arms) this.group.add(arm.shoulder);

    // luz fria que acompanha o inimigo (o Dementador "esfria" o ambiente)
    const aura = new THREE.PointLight(0x3366ff, 1.2, 5);
    aura.position.y = 1.8;
    this.group.add(aura);
  }

  /**
   * Manto: cilindro aberto, estreito nos ombros e largo na barra. Usamos
   * muitos segmentos em altura (12) porque os vertices sao deslocados na
   * animacao para simular o tecido esvoacando.
   */
  createShroud(shroudAlpha) {
    const geometry = new THREE.CylinderGeometry(
      0.45,   // raio no topo (ombros)
      1.15,   // raio na base (barra aberta)
      2.6,    // altura
      24,     // segmentos ao redor
      12,     // segmentos em altura
      true    // sem tampas: o manto e um tubo aberto
    );
    // centraliza com a base no chao (y = 0)
    geometry.translate(0, 1.3, 0);

    // guardamos as posicoes originais para a onda nao se acumular a cada quadro
    this.shroudBasePositions = Float32Array.from(
      geometry.attributes.position.array
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x15161d,
      roughness: 0.95,
      side: THREE.DoubleSide,     // o manto e visto por dentro e por fora
      transparent: true,
      alphaMap: shroudAlpha,
      alphaTest: 0.5,             // recorta a franja em vez de desbotar
    });

    this.shroud = new THREE.Mesh(geometry, material);
    this.shroud.name = 'manto';
    this.shroud.castShadow = true;
    this.shroud.receiveShadow = true;
    this.group.add(this.shroud);
  }

  /** Capuz vazio: casca, bico, o "vazio" do rosto e dois olhos. */
  createHood() {
    this.hood = new THREE.Group();
    this.hood.name = 'capuz';
    this.hood.position.y = 2.5;

    const clothMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b1c24,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), clothMaterial);
    shell.scale.set(1, 0.95, 1.1);
    shell.castShadow = true;
    this.hood.add(shell);

    const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 16), clothMaterial);
    top.position.set(0, 0.32, -0.08);
    top.rotation.x = -0.25;
    this.hood.add(top);

    // esfera bem escura logo a frente: e o rosto que nunca se ve
    const faceVoid = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x03030a, roughness: 1 })
    );
    faceVoid.position.set(0, -0.02, 0.12);
    faceVoid.scale.set(1, 1.1, 0.8);
    this.hood.add(faceVoid);

    // olhos: MeshBasicMaterial nao recebe luz, entao parecem brilhar
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

  /**
   * Braco em tres niveis (ombro -> cotovelo -> mao).
   * @param {number} side -1 para o braco esquerdo, +1 para o direito
   */
  createArm(side) {
    const skin = new THREE.MeshStandardMaterial({ color: 0x3c3a42, roughness: 0.8 });
    const cloth = new THREE.MeshStandardMaterial({
      color: 0x12131a,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });

    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? 'ombro-esquerdo' : 'ombro-direito';
    shoulder.position.set(side * 0.45, 2.1, 0.05);
    shoulder.rotation.z = side * 0.5;      // bracos abertos para os lados
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
    elbow.rotation.x = -0.7;               // antebraco avancado para a frente
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

    // tres garras: cones virados de ponta para baixo
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 6), skin);
      claw.position.set((i - 1) * 0.045, -0.09, 0.03);
      claw.rotation.x = Math.PI;
      claw.rotation.z = (i - 1) * 0.2;
      hand.add(claw);
    }

    return { shoulder, elbow, baseRotationZ, side };
  }

  /** Posiciona o Dementador guardando a altura de referencia da flutuacao. */
  setPosition(x, y, z) {
    this.baseY = y;
    this.group.position.set(x, y, z);
    return this;
  }

  /** Gira o corpo para encarar um ponto, mantendo-o em pe (so no eixo Y). */
  lookAtPoint(target) {
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    this.group.rotation.y = Math.atan2(dx, dz);
    return this;
  }

  /**
   * Animacao do quadro.
   * @param {number} delta segundos desde o quadro anterior
   * @param {number} time  tempo total em segundos
   */
  update(delta, time) {
    const t = time + this.phase;

    // flutuacao: sobe e desce em torno da altura de referencia
    this.group.position.y = this.baseY + Math.sin(t * 0.9) * 0.12;
    this.group.rotation.z = Math.sin(t * 0.6) * 0.04;

    // capuz pende para os lados, como se nao houvesse cabeca dentro
    this.hood.rotation.z = Math.sin(t * 0.8) * 0.08;
    this.hood.rotation.x = Math.sin(t * 0.5) * 0.05;

    // bracos: ombro balanca, cotovelo dobra
    for (const arm of this.arms) {
      arm.shoulder.rotation.z = arm.baseRotationZ + Math.sin(t * 1.1 + arm.side) * 0.15;
      arm.elbow.rotation.x = -0.7 + Math.sin(t * 1.4 + arm.side * 2) * 0.2;
    }

    // olhos pulsando
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 2.2));
    for (const eye of this.eyes) {
      eye.material.color.setRGB(0.35 * pulse, 0.8 * pulse, pulse);
    }

    this.animateShroud(t);
  }

  /**
   * Deforma o manto vertice a vertice. Para cada vertice calculamos o
   * quanto ele esta abaixo dos ombros (`height`) e afastamos o vertice do
   * eixo central por um seno: quanto mais proximo da barra, maior a
   * amplitude. Por isso o topo fica firme e a barra esvoaca.
   */
  animateShroud(t) {
    const position = this.shroud.geometry.attributes.position;
    const base = this.shroudBasePositions;

    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = base[ix];
      const y = base[ix + 1];
      const z = base[ix + 2];

      const height = 1 - y / 2.6;                 // 0 no topo, 1 na barra
      const amplitude = height * height * 0.22;
      const angle = Math.atan2(z, x);             // volta do manto
      const wave = Math.sin(angle * 3 + t * 2.4 + y * 2) * amplitude;

      position.array[ix] = x * (1 + wave);
      position.array[ix + 2] = z * (1 + wave);
      position.array[ix + 1] = y + wave * 0.2;
    }

    position.needsUpdate = true;
    this.shroud.geometry.computeVertexNormals();  // refaz a iluminacao
  }
}
