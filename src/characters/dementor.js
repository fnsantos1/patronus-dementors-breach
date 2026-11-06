// O Dementador: entidade espectral hostil flutuante composta por uma ossatura
// anatômica articulada sob um véu negro e capuz de textura têxtil rústica.
//
// Cobertura completa:
// - Capuz amplo cobrindo a nuca e o topo do crânio com abertura frontal sombria.
// - Manto completo cobrindo ombros, tórax, costas e descendo até a barra em farrapos.
// - Mangas drapeadas nos braços deixando as mãos/garras ósseas à mostra.
//
// Implementado com o padrão Flyweight:
// - Estado Intrínseco (DementorArchetype): Geometrias compartilhadas (ossos, capuz,
//   manto, mangas), materiais sombrios, texturas de trama têxtil e corte alfa.
// - Estado Extrínseco (Dementor): Posição espacial, orientação, fase temporal (phase),
//   flutuação vertical e AnimationMixer individual por instância.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { createFabricTexture, createShroudAlphaTexture } from '../core/textures.js';

export class DementorArchetype {
  static instance = null;

  static async getShared(shroudAlpha = null, fabricTexture = null) {
    if (!DementorArchetype.instance) {
      DementorArchetype.instance = new DementorArchetype(shroudAlpha, fabricTexture);
    }
    await DementorArchetype.instance.load();
    return DementorArchetype.instance;
  }

  constructor(shroudAlpha = null, fabricTexture = null, modelUrl = './assets/models/dementor_skeleton.glb') {
    this.modelUrl = modelUrl;
    this.isLoaded = false;
    this.loadPromise = null;

    this.shroudAlpha = shroudAlpha || createShroudAlphaTexture();
    this.fabricTexture = fabricTexture || createFabricTexture();

    // 1. Materiais Compartilhados (Flyweight Intrinsic State)
    // Osso cadavérico envelhecido visível sob o véu e capuz
    this.boneMaterial = new THREE.MeshStandardMaterial({
      color: 0x8e929a,
      roughness: 0.82,
      metalness: 0.05,
      flatShading: false,
    });

    // Véu esfarrapado e translúcido cobrindo o corpo e membros
    this.clothMaterial = new THREE.MeshStandardMaterial({
      map: this.fabricTexture,
      color: 0x161820,
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.88,
      alphaMap: this.shroudAlpha,
      alphaTest: 0.16,
      side: THREE.DoubleSide,
    });

    // Capuz escuro cobrindo o crânio
    this.hoodMaterial = new THREE.MeshStandardMaterial({
      map: this.fabricTexture,
      color: 0x12131a,
      roughness: 0.96,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    // Fundo da cavidade facial sombria
    this.voidMaterial = new THREE.MeshBasicMaterial({
      color: 0x020206,
    });

    // 2. Geometrias Compartilhadas (Flyweight Intrinsic State)
    this.hoodGeometry = this.buildHoodGeometry();
    this.shroudGeometry = this.buildShroudGeometry();
    this.sleeveGeometry = this.buildSleeveGeometry();

    // 3. Protótipo da Hierarquia e Animações
    this.prototypeScene = null;
    this.idleClip = null;
  }

  buildHoodGeometry() {
    // Capuz amplo cobrindo a nuca e o topo do crânio, aberto na frente (+Z)
    const hoodCyl = new THREE.CylinderGeometry(0.32, 0.55, 0.85, 20, 8, true, Math.PI * 0.22, Math.PI * 1.56);
    hoodCyl.translate(0, 2.42, -0.05);

    // Cúpula do topo da cabeça fechando a parte superior
    const topDome = new THREE.SphereGeometry(0.32, 16, 8, Math.PI * 0.22, Math.PI * 1.56, 0, Math.PI * 0.5);
    topDome.translate(0, 2.80, -0.05);

    return BufferGeometryUtils.mergeGeometries([hoodCyl, topDome]);
  }

  buildShroudGeometry() {
    // Manto do corpo inteiro: começa nos ombros (Y ≈ 2.15) e desce até o chão (Y ≈ -0.05)
    const geometry = new THREE.CylinderGeometry(0.65, 1.35, 2.2, 24, 10, true);
    geometry.translate(0, 1.05, 0);

    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = position.array[ix];
      const y = position.array[ix + 1];
      const z = position.array[ix + 2];

      const depthRatio = Math.max(0, Math.min(1, (2.1 - y) / 2.0));
      const pleat = Math.sin(Math.atan2(z, x) * 6 + y * 2.5) * depthRatio * 0.18;

      position.array[ix] = x * (1 + pleat);
      position.array[ix + 2] = z * (1 + pleat);
      position.array[ix + 1] = y + pleat * 0.10;
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  buildSleeveGeometry() {
    // Manga afunilada e drapeada que acompanha os braços estendidos
    const geometry = new THREE.CylinderGeometry(0.24, 0.52, 1.30, 14, 6, true);
    geometry.translate(0, 0.65, 0);

    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = position.array[ix];
      const y = position.array[ix + 1];
      const z = position.array[ix + 2];

      const flareRatio = Math.max(0, Math.min(1, y / 1.3));
      const wave = Math.sin(Math.atan2(z, x) * 4 + y * 3.0) * flareRatio * 0.12;

      position.array[ix] = x * (1 + wave);
      position.array[ix + 2] = z * (1 + wave);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        this.modelUrl,
        (gltf) => {
          this.prototypeScene = gltf.scene;
          this.animations = gltf.animations || [];
          this.idleClip = this.animations.find((a) => a.name.includes('Idle')) || this.animations[0];

          // Aplica o material ósseo visível em todas as malhas do modelo
          this.prototypeScene.traverse((child) => {
            if (child.isMesh) {
              child.material = this.boneMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Ajusta a escala para altura natural (~2.7m)
          this.prototypeScene.scale.setScalar(0.55);

          this.isLoaded = true;
          resolve(this);
        },
        undefined,
        (err) => {
          console.error('Erro ao carregar esqueleto do dementador:', err);
          reject(err);
        }
      );
    });
    return this.loadPromise;
  }

  /**
   * Instancia um novo Dementador compartilhando o estado intrínseco.
   * @param {number} phase - Desfasamento temporal individual
   */
  instantiate(phase = 0) {
    if (!this.isLoaded || !this.prototypeScene) {
      throw new Error('DementorArchetype ainda não foi carregado.');
    }

    const instanceGroup = new THREE.Group();
    instanceGroup.name = 'dementor_rig';

    // 1. Clona esqueleto 3D (Flyweight: geometrias e materiais permanecem compartilhados em VRAM)
    const clonedSkeleton = SkeletonUtils.clone(this.prototypeScene);
    instanceGroup.add(clonedSkeleton);

    // 2. Capuz amplo envolvendo a cabeça
    const hoodMesh = new THREE.Mesh(this.hoodGeometry, this.hoodMaterial);
    hoodMesh.name = 'capuz_completo';
    hoodMesh.castShadow = true;
    hoodMesh.receiveShadow = true;

    // Fundo escuro de sombra na cavidade do rosto
    const voidSphere = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 8), this.voidMaterial);
    voidSphere.position.set(0, 2.50, 0.05);
    hoodMesh.add(voidSphere);
    instanceGroup.add(hoodMesh);

    // 3. Manto do corpo inteiro (dos ombros até o chão)
    const shroudMesh = new THREE.Mesh(this.shroudGeometry, this.clothMaterial);
    shroudMesh.name = 'manto_corpo_inteiro';
    shroudMesh.castShadow = true;
    shroudMesh.receiveShadow = true;
    instanceGroup.add(shroudMesh);

    // 4. Mangas esfarrapadas drapeadas sobre os braços
    let lArm = null;
    let rArm = null;
    clonedSkeleton.traverse((node) => {
      if (node.isBone) {
        if (node.name === 'LUpperLeg001') lArm = node;
        if (node.name === 'RUpperLeg001') rArm = node;
      }
    });

    if (lArm) {
      const leftSleeve = new THREE.Mesh(this.sleeveGeometry, this.clothMaterial);
      leftSleeve.name = 'manga_esquerda';
      leftSleeve.castShadow = true;
      lArm.add(leftSleeve);
    }

    if (rArm) {
      const rightSleeve = new THREE.Mesh(this.sleeveGeometry, this.clothMaterial);
      rightSleeve.name = 'manga_direita';
      rightSleeve.castShadow = true;
      rArm.add(rightSleeve);
    }

    // 5. AnimationMixer individual para movimentação da ossatura
    let mixer = null;
    if (this.idleClip) {
      mixer = new THREE.AnimationMixer(clonedSkeleton);
      const action = mixer.clipAction(this.idleClip);
      action.timeScale = 0.65 + (phase % 0.35) * 0.3;
      action.time = (phase * 1.7) % this.idleClip.duration;
      action.play();
    }

    return { instanceGroup, mixer, hoodMesh, shroudMesh, clonedSkeleton };
  }
}

export class Dementor {
  /**
   * @param {THREE.Texture|null} shroudAlpha
   * @param {number} phase - Desfasamento temporal individual
   * @param {THREE.Texture|null} fabricTexture
   */
  constructor(shroudAlpha = null, phase = 0, fabricTexture = null) {
    this.phase = phase;
    this.baseY = 0;
    this.hoverSpeed = 1.2 + (phase % 0.4);
    this.hoverAmp = 0.14;

    this.group = new THREE.Group();
    this.group.name = 'dementador';

    // Aura fria espectral no centro do tórax
    this.baseLightIntensity = 8.5;
    this.aura = new THREE.PointLight(0x3d66cc, this.baseLightIntensity, 6.5);
    this.aura.position.y = 1.6;
    this.group.add(this.aura);

    this.mixer = null;
    this.skeletonInstance = null;
    this.isReady = false;

    // Conexão assíncrona segura ao arquétipo compartilhado (Flyweight)
    this.initArchetype(shroudAlpha, fabricTexture);
  }

  async initArchetype(shroudAlpha, fabricTexture) {
    try {
      const archetype = await DementorArchetype.getShared(shroudAlpha, fabricTexture);
      const instance = archetype.instantiate(this.phase);
      this.skeletonInstance = instance;
      this.mixer = instance.mixer;
      this.group.add(instance.instanceGroup);
      this.isReady = true;
    } catch (err) {
      console.error('Falha ao inicializar arquétipo do dementador:', err);
    }
  }

  setPosition(x, y, z) {
    this.baseY = y;
    this.group.position.set(x, y, z);
    return this;
  }

  lookAtPoint(target) {
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    this.group.rotation.y = Math.atan2(dx, dz);
    return this;
  }

  /**
   * Atualização dinâmica por quadro:
   * - Avanço do AnimationMixer esquelético
   * - Flutuação vertical sinusoidal
   * - Inclinação e balanço sutil com a atmosfera
   * - Pulsação da aura fria
   *
   * @param {number} delta
   * @param {number} [elapsedTime]
   */
  update(delta, elapsedTime = 0) {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    const t = elapsedTime !== undefined ? elapsedTime : performance.now() * 0.001;

    // Flutuação vertical espectral
    const floatY = Math.sin(t * this.hoverSpeed + this.phase) * this.hoverAmp;
    this.group.position.y = this.baseY + floatY;

    // Leve inclinação espectral ao flutuar
    this.group.rotation.z = Math.sin(t * 0.85 + this.phase) * 0.035;
    this.group.rotation.x = Math.cos(t * 0.75 + this.phase) * 0.025;

    // Pulsação suave da aura fria
    if (this.aura) {
      const pulse = 0.8 + 0.3 * Math.sin(t * 2.2 + this.phase);
      this.aura.intensity = this.baseLightIntensity * pulse;
    }
  }
}
