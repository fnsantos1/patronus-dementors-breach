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

  static async getShared(shroudAlpha = null, fabricTexture = null, texturas = null) {
    if (!DementorArchetype.instance) {
      DementorArchetype.instance = new DementorArchetype(shroudAlpha, fabricTexture, './assets/models/dementor_skeleton.glb', texturas);
    }
    await DementorArchetype.instance.load();
    return DementorArchetype.instance;
  }

  constructor(shroudAlpha = null, fabricTexture = null, modelUrl = './assets/models/dementor_skeleton.glb', texturas = null) {
    this.modelUrl = modelUrl;
    this.isLoaded = false;
    this.loadPromise = null;

    // Mantém alphaMap para fiapos na barra, mas usa sempre textura de tecido preto e velho (sem couro)
    const couro = texturas?.couro;
    this.shroudAlpha = shroudAlpha || couro?.alphaMap || createShroudAlphaTexture();
    this.fabricTexture = fabricTexture || createFabricTexture();

    // 1. Materiais Compartilhados (Flyweight Intrinsic State)
    // Osso cadavérico bem escuro e envelhecido
    this.boneMaterial = new THREE.MeshStandardMaterial({
      color: 0x34363c,
      roughness: 0.90,
      metalness: 0.02,
      flatShading: false,
    });

    // Véu de tecido preto e velho, fosco e esfarrapado (sem reflexão de luz)
    this.clothMaterial = new THREE.MeshStandardMaterial({
      map: this.fabricTexture,
      color: 0x101116,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.1,
      transparent: true,
      opacity: 0.92,
      alphaMap: this.shroudAlpha,
      alphaTest: 0.16,
      side: THREE.DoubleSide,
    });

    // Capuz/mortalha translúcido envolvendo o crânio e caindo sobre os ombros
    this.hoodMaterial = new THREE.MeshStandardMaterial({
      map: this.fabricTexture,
      ...(couro?.normalMap ? { normalMap: couro.normalMap } : {}),
      ...(couro?.roughnessMap ? { roughnessMap: couro.roughnessMap } : {}),
      color: 0x14161e,
      roughness: 0.94,
      metalness: 0.02,
      transparent: true,
      opacity: 0.78,
      alphaMap: this.shroudAlpha,
      alphaTest: 0.12,
      side: THREE.DoubleSide,
    });

    // 2. Geometrias Compartilhadas (Flyweight Intrinsic State)
    this.shroudGeometry = this.buildContinuousShroudGeometry();
    this.leftSleeveGeometry = this.buildLongSleeveGeometry(-1);
    this.rightSleeveGeometry = this.buildLongSleeveGeometry(1);

    // 3. Protótipo da Hierarquia e Animações
    this.prototypeScene = null;
    this.idleClip = null;
  }

  buildContinuousShroudGeometry() {
    // Malha única contínua do topo do crânio (y=5.35) até a barra em farrapos (y=0.10)
    // no espaço da malha do esqueleto (escala 0.55 aplicada no pai).
    const radialSegs = 40;
    const heightSegs = 32;
    const geometry = new THREE.CylinderGeometry(1, 1, 1, radialSegs, heightSegs, true);
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const count = pos.count;

    const skinIndices = new Float32Array(count * 4);
    const skinWeights = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      // t = 0 na barra (y = -1.45, cauda bem longa), t = 1 no topo da cabeça (y = 5.35)
      const t = pos.getY(i) + 0.5;
      const y = -1.45 + t * 6.80;

      // Perfil anatômico contínuo: abre na barra, ajusta na cintura/tórax/pescoço,
      // adere ao formato do crânio e fecha no topo da cabeça.
      let r;
      if (y > 4.85) {
        const capT = (y - 4.85) / 0.50;
        r = 0.64 * Math.cos(capT * Math.PI * 0.5);
      } else if (y > 3.82) {
        r = 0.64;
      } else if (y > 3.40) {
        const neckT = (y - 3.40) / 0.42;
        r = 0.58 + neckT * 0.06;
      } else if (y > 2.00) {
        const torsoT = (y - 2.00) / 1.40;
        r = 0.62 - Math.sin(torsoT * Math.PI) * 0.04;
      } else {
        const skirtT = (2.00 - y) / 3.45;
        r = 0.62 + Math.pow(skirtT, 1.25) * 0.72;
      }

      // Esculpe o capuz aderente ao crânio com cavidade de boca e olhos profundos na frente (+Z, angle = PI/2)
      if (y > 3.70 && y < 4.95) {
        const dFront = Math.atan2(Math.sin(angle - Math.PI * 0.5), Math.cos(angle - Math.PI * 0.5));
        // Cavidade da boca (estreita e profunda)
        const mouthDepth = Math.exp(-Math.pow(dFront / 0.22, 2) - Math.pow((y - 3.98) / 0.20, 2)) * 0.24;
        // Cavidades oculares (olhos ligeiramente profundos)
        const leftEye = Math.exp(-Math.pow((dFront - 0.34) / 0.16, 2) - Math.pow((y - 4.44) / 0.14, 2)) * 0.15;
        const rightEye = Math.exp(-Math.pow((dFront + 0.34) / 0.16, 2) - Math.pow((y - 4.44) / 0.14, 2)) * 0.15;
        r = Math.max(0.25, r - mouthDepth - leftEye - rightEye);
      }

      // Dobras verticais suaves na parte inferior
      const hemFactor = Math.max(0, (2.2 - y) / 3.65);
      const pleat = Math.sin(angle * 7 + y * 1.4) * hemFactor * 0.18;
      const finalR = Math.max(0.01, r * (1 + pleat));

      // Cauda longa inclinada para trás (-Z) na parte inferior da saia
      const tailRatio = Math.max(0, (1.80 - y) / 3.25);
      const tailOffsetZ = -Math.pow(tailRatio, 1.5) * 1.35;

      pos.setXYZ(i, Math.cos(angle) * finalR, y, Math.sin(angle) * finalR + tailOffsetZ);
      uv.setXY(i, (angle + Math.PI) / (Math.PI * 2), t);

      // Pesos de Skinning (0: Hips, 1: Torso, 2: Neck, 3: Head)
      let b0 = 0, w0 = 0, b1 = 1, w1 = 0;
      if (y < 2.2) {
        b0 = 0; b1 = 1;
        w1 = Math.max(0, Math.min(1, (y - 1.4) / 0.8));
        w0 = 1 - w1;
      } else if (y < 3.54) {
        b0 = 1; b1 = 2;
        w1 = Math.max(0, Math.min(1, (y - 2.6) / 0.94));
        w0 = 1 - w1;
      } else {
        b0 = 2; b1 = 3;
        w1 = Math.max(0, Math.min(1, (y - 3.54) / 0.45));
        w0 = 1 - w1;
      }
      skinIndices[i * 4] = b0;
      skinIndices[i * 4 + 1] = b1;
      skinWeights[i * 4] = w0;
      skinWeights[i * 4 + 1] = w1;
    }

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    geometry.computeVertexNormals();
    return geometry;
  }

  buildLongSleeveGeometry(side = -1) {
    // Manga longa e esvoaçante ao longo do braço (side -1 = esquerdo, +1 = direito)
    const radialSegs = 24;
    const lengthSegs = 18;
    const geometry = new THREE.CylinderGeometry(1, 1, 1, radialSegs, lengthSegs, true);
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const count = pos.count;

    const skinIndices = new Float32Array(count * 4);
    const skinWeights = new Float32Array(count * 4);

    // Índices dos ossos no skin do GLB:
    // Torso=1, L.UpperLeg.001=11, L.DownLeg.001=12, R.UpperLeg.001=14, R.DownLeg.001=15
    const upperBone = side < 0 ? 11 : 14;
    const foreBone = side < 0 ? 12 : 15;

    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      // t = 0 no ombro, t = 1 no pulso/garras
      const t = pos.getY(i) + 0.5;
      const x = side * (0.62 + t * 1.68);

      // Raio base justo no ombro e levemente mais amplo no antebraço
      const baseR = 0.28 + t * 0.14;
      const localY = Math.sin(angle) * baseR;
      const localZ = Math.cos(angle) * baseR;

      // Aba esvoaçante caída na parte inferior da manga (quando sin(angle) < 0)
      const bottomFactor = Math.max(0, -Math.sin(angle));
      const drapeDrop = Math.pow(bottomFactor, 1.5) * (0.25 + t * 1.15);
      const y = 3.15 + localY - drapeDrop;

      pos.setXYZ(i, x, y, localZ);
      // Mapeia UV.y (v) de 1.0 no topo da manga até 0.0 na ponta inferior caída,
      // para que o alphaMap recorte fiapos na barra da manga igual à saia.
      const sleeveV = 1.0 - Math.pow(bottomFactor, 1.1);
      uv.setXY(i, t * 2.0, sleeveV);

      let b0, b1, w0, w1;
      if (t < 0.25) {
        b0 = 1; b1 = upperBone;
        w1 = t / 0.25;
        w0 = 1 - w1;
      } else {
        b0 = upperBone; b1 = foreBone;
        w1 = Math.max(0, Math.min(1, (t - 0.35) / 0.4));
        w0 = 1 - w1;
      }
      skinIndices[i * 4] = b0;
      skinIndices[i * 4 + 1] = b1;
      skinWeights[i * 4] = w0;
      skinWeights[i * 4 + 1] = w1;
    }

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
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

    // 2. Localiza a SkinnedMesh original (Cylinder.001) para compartilhar seu esqueleto
    let sourceSkinnedMesh = null;
    clonedSkeleton.traverse((node) => {
      if (node.isSkinnedMesh && !sourceSkinnedMesh) {
        sourceSkinnedMesh = node;
      }
    });

    const animatedCloths = [];
    const bindTargetParent = sourceSkinnedMesh?.parent || instanceGroup;

    const createBoundCloth = (baseGeom, material, name) => {
      const geom = baseGeom.clone();
      const basePositions = new Float32Array(geom.attributes.position.array);
      const mesh = sourceSkinnedMesh
        ? new THREE.SkinnedMesh(geom, material)
        : new THREE.Mesh(geom, material);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      if (sourceSkinnedMesh) {
        mesh.bind(sourceSkinnedMesh.skeleton, sourceSkinnedMesh.bindMatrix);
      }
      bindTargetParent.add(mesh);
      animatedCloths.push({ geom, basePositions });
      return mesh;
    };

    // 3. Capuz + Capa em uma única malha contínua (SkinnedMesh)
    const shroudMesh = createBoundCloth(this.shroudGeometry, this.clothMaterial, 'mortalha_continua');

    // 4. Mangas longas e esvoaçantes (SkinnedMesh) cobrindo todo o braço
    createBoundCloth(this.leftSleeveGeometry, this.clothMaterial, 'manga_longa_esquerda');
    createBoundCloth(this.rightSleeveGeometry, this.clothMaterial, 'manga_longa_direita');

    // 5. AnimationMixer individual para movimentação da ossatura
    let mixer = null;
    if (this.idleClip) {
      mixer = new THREE.AnimationMixer(clonedSkeleton);
      const action = mixer.clipAction(this.idleClip);
      action.timeScale = 0.65 + (phase % 0.35) * 0.3;
      action.time = (phase * 1.7) % this.idleClip.duration;
      action.play();
    }

    return { instanceGroup, mixer, shroudMesh, clonedSkeleton, animatedCloths };
  }
}

// Numero entre 0 e 1 tirado de uma semente. Deterministico: a cena fica
// igual a cada carregamento, mas cada Dementador recebe valores proprios.
function sorteio(semente) {
  const x = Math.sin(semente * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export class Dementor {
  /**
   * @param {THREE.Texture|Object|null} shroudAlphaOrTexturas - Textura alphaMap, objeto com texturas ou null
   * @param {number} phase - Desfasamento temporal individual
   * @param {THREE.Texture|null} fabricTexture
   */
  constructor(shroudAlphaOrTexturas = null, phase = 0, fabricTexture = null) {
    let shroudAlpha = null;
    let texturas = null;

    if (shroudAlphaOrTexturas && shroudAlphaOrTexturas.couro) {
      texturas = shroudAlphaOrTexturas;
      shroudAlpha = texturas.couro?.alphaMap;
      if (!fabricTexture) {
        fabricTexture = texturas.couro?.map;
      }
    } else {
      shroudAlpha = shroudAlphaOrTexturas;
    }

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
    this.initArchetype(shroudAlpha, fabricTexture, texturas);
  }

  async initArchetype(shroudAlpha, fabricTexture, texturas = null) {
    try {
      const archetype = await DementorArchetype.getShared(shroudAlpha, fabricTexture, texturas);

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

    // Ondulação esvoaçante em tempo real na barra do manto e abas das mangas
    if (this.skeletonInstance?.animatedCloths) {
      for (const { geom, basePositions } of this.skeletonInstance.animatedCloths) {
        const pos = geom.attributes.position;
        const arr = pos.array;
        for (let i = 0; i < pos.count; i++) {
          const ix = i * 3;
          const bx = basePositions[ix];
          const by = basePositions[ix + 1];
          const bz = basePositions[ix + 2];

          // Quanto mais baixo na barra (by < 2.2) ou mais afastado nos braços (|bx| > 0.7), mais esvoaçante
          const swayWeight = Math.max(
            Math.max(0, (2.2 - by) / 2.2),
            Math.max(0, (Math.abs(bx) - 0.75) / 1.5) * 0.65
          );
          if (swayWeight > 0.01) {
            const waveX = Math.sin(t * 2.1 + by * 1.8 + this.phase) * 0.14 * swayWeight;
            const waveZ = Math.cos(t * 1.7 + bx * 2.2 + this.phase) * 0.16 * swayWeight;
            arr[ix] = bx + waveX;
            arr[ix + 2] = bz + waveZ;
          }
        }
        pos.needsUpdate = true;
      }
    }

    // Pulsação suave da aura fria
    if (this.aura) {
      const pulse = 0.8 + 0.3 * Math.sin(t * 2.2 + this.phase);
      this.aura.intensity = this.baseLightIntensity * pulse;
    }
  }
}
