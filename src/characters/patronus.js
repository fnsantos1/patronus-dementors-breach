// O Patrono: guardião corpóreo de luz em forma de cervo.
// Composto por um núcleo anatômico orgânico suavizado por iluminação de Phong translúcida,
// envolvido por uma nuvem volumétrica de 15.000 partículas de névoa etérea contínua
// amostradas diretamente na superfície da malha 3D com MeshSurfaceSampler.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PatronusSmokeSystem } from '../core/particles.js';

export class Patronus {
  /**
   * @param {THREE.Texture} particleTexture - Textura procedural de vapor etéreo
   * @param {string} modelUrl - Caminho para o modelo 3D GLTF/GLB do cervo
   */
  constructor(particleTexture = null, modelUrl = './assets/models/patronus.glb') {
    this.group = new THREE.Group();
    this.group.name = 'patrono';
    this.particleTexture = particleTexture;
    this.particleSystem = null;
    this.model = null;
    this.isLoaded = false;

    // Núcleo espectral translúcido suavizado com iluminação de Phong perolada
    this.material = new THREE.MeshPhongMaterial({
      color: 0xd6edff,
      emissive: 0x5a9eff,
      emissiveIntensity: 0.65,
      specular: 0x90caff,
      shininess: 60,
      transparent: true,
      opacity: 0.08, // Opacidade sutil para não demarcar arestas duras
      flatShading: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Luz pontual interna espectral do Patrono (centro do tórax)
    this.light = new THREE.PointLight(0xdcefff, 35, 16);
    this.light.position.set(0, 1.25, 0);
    this.group.add(this.light);

    this.loadModel(modelUrl);
  }

  loadModel(modelUrl) {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        this.model = gltf.scene;
        this.model.name = 'cervo_corpo';

        // 1. Substitui materiais da malha 3D pelo MeshPhongMaterial translúcido
        const meshes = [];
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = this.material;
            child.castShadow = false;
            child.receiveShadow = false;
            meshes.push(child);
          }
        });

        // 2. Normalização automática de escala e alinhamento das patas com o chão
        this.normalizeModel(this.model);

        this.group.add(this.model);

        // 3. Sistema de partículas volumétrico amostrado com MeshSurfaceSampler
        // Passamos this.group para calibrar a matriz relativa e garantir alinhamento perfeito (sem deslocamento duplo)
        if (this.particleTexture && meshes.length > 0) {
          this.particleSystem = new PatronusSmokeSystem(meshes, this.particleTexture, this.group);
          this.group.add(this.particleSystem.points);
        }

        this.isLoaded = true;
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar o modelo 3D do Patrono:', error);
      }
    );
  }

  /**
   * Ajusta a escala para altura total de ~2.4m, alinha as patas em Y = 0
   * e orienta a cabeça para a convenção de frente da cena (-Z).
   */
  normalizeModel(model) {
    // Orienta a cabeça para a frente padrão (-Z)
    model.rotation.y = Math.PI;
    model.updateMatrixWorld(true);

    const initialBox = new THREE.Box3().setFromObject(model);
    const initialSize = new THREE.Vector3();
    initialBox.getSize(initialSize);

    // Altura alvo anatômica de 2.4 metros (até a ponta da galhada)
    const targetHeight = 2.4;
    const scale = targetHeight / (initialSize.y || 1);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    // Centraliza em X/Z e apoia as patas perfeitamente em Y = 0
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x = -scaledCenter.x;
    model.position.y = -scaledBox.min.y;
    model.position.z = -scaledCenter.z;
    model.updateMatrixWorld(true);
  }

  update(delta, camera = null) {
    if (this.particleSystem) {
      this.particleSystem.update(delta, camera);
    }
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    return this;
  }
}
