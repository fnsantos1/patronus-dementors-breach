// Sistema de névoa e fumaça etérea procedural para a Varinha e o Patrono.
// Alternância cromática em tons de azul e suavização de Phong com 15.000 partículas.

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

/**
 * Gera textura procedural de vapor difuso multicamada com tonalidade azul etérea translúcida.
 */
export function createEtherealSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 128, 128);

  const lobes = [
    { x: 64, y: 64, r: 54, alpha: 0.45 },
    { x: 52, y: 56, r: 40, alpha: 0.32 },
    { x: 74, y: 58, r: 38, alpha: 0.32 },
    { x: 60, y: 72, r: 42, alpha: 0.28 },
    { x: 68, y: 70, r: 36, alpha: 0.25 },
  ];

  for (const lobe of lobes) {
    const grad = ctx.createRadialGradient(lobe.x, lobe.y, 0, lobe.x, lobe.y, lobe.r);
    grad.addColorStop(0, `rgba(200, 230, 255, ${lobe.alpha})`);
    grad.addColorStop(0.35, `rgba(120, 190, 255, ${lobe.alpha * 0.7})`);
    grad.addColorStop(0.7, `rgba(40, 140, 245, ${lobe.alpha * 0.25})`);
    grad.addColorStop(1, 'rgba(20, 90, 200, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Sistema de névoa da Varinha.
 */
export class WandSmokeSystem {
  constructor(tipGroup, texture) {
    this.tipGroup = tipGroup;
    this.count = 200;
    this.charge = 0; // 0.0 a 1.0
    this.time = 0;

    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    this.particles = [];

    const sapphire = new THREE.Color(0x2196f3);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sapphire.toArray(colors, i * 3);

      this.particles.push({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: Math.random(),
        maxLife: 1.4 + Math.random() * 0.8,
        angle: Math.random() * Math.PI * 2,
        radius: 0.03 + Math.random() * 0.03,
        spiralSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 1.8),
        seed: Math.random() * 100,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.12,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      opacity: 0.2,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.tipGroup.add(this.points);
  }

  setCharge(charge) {
    this.charge = THREE.MathUtils.clamp(charge, 0, 1);
  }

  resetParticle(p) {
    p.life = 0;
    p.maxLife = 1.1 + Math.random() * 0.9;
    p.angle = Math.random() * Math.PI * 2;
    p.phase = Math.random() * Math.PI * 2;

    if (this.charge > 0.05) {
      p.radius = 0.035 + Math.random() * (0.04 + this.charge * 0.12);
      p.y = (Math.random() - 0.5) * (0.08 + this.charge * 0.3);
      p.x = Math.cos(p.angle) * p.radius;
      p.z = Math.sin(p.angle) * p.radius;
      p.vx = (Math.random() - 0.5) * 0.02;
      p.vy = 0.06 + this.charge * 0.1;
      p.vz = (Math.random() - 0.5) * 0.02;
    } else {
      p.radius = 0.015 + Math.random() * 0.015;
      p.x = (Math.random() - 0.5) * 0.025;
      p.y = (Math.random() - 0.5) * 0.025;
      p.z = (Math.random() - 0.5) * 0.025;
      p.vx = (Math.random() - 0.5) * 0.015;
      p.vy = 0.03 + Math.random() * 0.03;
      p.vz = (Math.random() - 0.5) * 0.015;
    }
  }

  update(delta) {
    this.time += delta;
    const pos = this.geometry.attributes.position.array;
    const col = this.geometry.attributes.color.array;

    const sapphireBlue = new THREE.Color(0x1976d2);
    const celestialBlue = new THREE.Color(0x90caf9);
    const softCyan = new THREE.Color(0x64b5f6);

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.resetParticle(p);
      }

      const lifeProgress = p.life / p.maxLife;
      const bellAlpha = Math.sin(lifeProgress * Math.PI);

      if (this.charge > 0.05) {
        p.angle += p.spiralSpeed * delta * (1.0 + this.charge * 1.3);
        const currentRadius = p.radius * (1.0 + lifeProgress * 0.6 * (1.0 + this.charge));
        const sway = Math.sin(p.life * 2.5 + p.seed) * 0.015;

        p.x = Math.cos(p.angle) * currentRadius + sway;
        p.z = Math.sin(p.angle) * currentRadius + sway;
        p.y += (0.04 + this.charge * 0.15) * delta;
      } else {
        const waveX = Math.sin(p.life * 2.0 + p.seed) * 0.02;
        const waveZ = Math.cos(p.life * 1.8 + p.seed) * 0.02;
        p.x += (p.vx + waveX * 0.1) * delta;
        p.y += p.vy * delta;
        p.z += (p.vz + waveZ * 0.1) * delta;
      }

      pos[i * 3 + 0] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;

      const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.0 + p.phase);
      const blendedColor = new THREE.Color().lerpColors(sapphireBlue, celestialBlue, pulse);
      if (this.charge > 0.2) {
        blendedColor.lerp(softCyan, this.charge * 0.4);
      }

      blendedColor.multiplyScalar(bellAlpha);
      col[i * 3 + 0] = blendedColor.r;
      col[i * 3 + 1] = blendedColor.g;
      col[i * 3 + 2] = blendedColor.b;
    }

    this.material.opacity = 0.18 + this.charge * 0.17;
    this.material.size = 0.11 + this.charge * 0.07;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}

/**
 * Sistema de névoa do Patrono:
 * - 15.000 partículas para volumetria suave contínua aveludada (amostradas da malha 3D).
 * - Partículas recalibradas para tamanho ~0.20 com sobreposição e contornos suaves.
 * - Modelo analítico de Phong especular acoplado à luz interna do cervo, com termo difuso
 *   amortecido para preservar as silhuetas e bordas de luz sem escurecimento abrupto.
 * - Dinâmica contínua de vapor ascendente com ondulação térmica e respiração cromática.
 */
export class PatronusSmokeSystem {
  constructor(meshesOrBoxes, texture, rootGroup = null) {
    this.count = 15000;
    this.texture = texture;
    this.time = 0;
    this.rootGroup = rootGroup;

    // Luz interna espectral de referência para o Phong (centro do tórax)
    this.lightPosition = new THREE.Vector3(0, 1.25, 0);

    this.basePositions = new Float32Array(this.count * 3);
    this.currentPositions = new Float32Array(this.count * 3);
    this.normals = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.offsets = new Float32Array(this.count * 3);
    this.lifes = new Float32Array(this.count);
    this.speeds = new Float32Array(this.count);
    this.phases = new Float32Array(this.count);

    if (Array.isArray(meshesOrBoxes) && meshesOrBoxes.length > 0 && meshesOrBoxes[0].size) {
      this.sampleFromBoxes(meshesOrBoxes);
    } else {
      this.sampleFromMeshes(meshesOrBoxes, rootGroup);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Partículas volumétricas preenchendo o corpo de luz com sobreposição aveludada
    this.material = new THREE.PointsMaterial({
      size: 0.22,
      map: this.texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      opacity: 0.26,
    });

    this.points = new THREE.Points(this.geometry, this.material);

    // Vetores temporários reutilizáveis
    this._p = new THREE.Vector3();
    this._l = new THREE.Vector3();
    this._v = new THREE.Vector3();
    this._h = new THREE.Vector3();
    this._camPosLocal = new THREE.Vector3();
  }

  sampleFromMeshes(meshes, rootGroup = null) {
    const validMeshes = Array.isArray(meshes) ? meshes : [meshes];
    const samplersInfo = [];
    let totalWeight = 0;

    // Matriz de conversão para o espaço local de rootGroup
    // Isso impede que a transformação do grupo do Patrono seja aplicada duas vezes
    let invRootMatrix = new THREE.Matrix4();
    if (rootGroup) {
      rootGroup.updateWorldMatrix(true, true);
      invRootMatrix = rootGroup.matrixWorld.clone().invert();
    }

    for (const mesh of validMeshes) {
      mesh.updateWorldMatrix(true, false);
      const sampler = new MeshSurfaceSampler(mesh).build();
      const area = (sampler.distribution && sampler.distribution.length > 0)
        ? sampler.distribution[sampler.distribution.length - 1]
        : 1;

      const isHorns = mesh.name && mesh.name.toLowerCase().includes('horn');
      // Concede peso extra para a galhada para garantir que as ramificações tenham alta densidade luminosa
      const weight = isHorns ? area * 3.5 : area;
      totalWeight += weight;

      // Matriz relativa que leva do espaço local da malha para o espaço local do rootGroup
      const toGroupMatrix = new THREE.Matrix4();
      if (rootGroup) {
        toGroupMatrix.multiplyMatrices(invRootMatrix, mesh.matrixWorld);
      } else {
        toGroupMatrix.copy(mesh.matrix);
      }

      samplersInfo.push({ mesh, sampler, weight, toGroupMatrix });
    }

    const tempPos = new THREE.Vector3();
    const tempNorm = new THREE.Vector3();

    for (let i = 0; i < this.count; i++) {
      let r = Math.random() * totalWeight;
      let chosen = samplersInfo[0];
      for (const info of samplersInfo) {
        r -= info.weight;
        if (r <= 0) {
          chosen = info;
          break;
        }
      }

      chosen.sampler.sample(tempPos, tempNorm);

      // Converte coordenadas locais da malha para o espaço local do grupo do Patrono
      tempPos.applyMatrix4(chosen.toGroupMatrix);
      tempNorm.transformDirection(chosen.toGroupMatrix).normalize();

      // PREENCHIMENTO VOLUMÉTRICO DE LUZ:
      // Distribuímos as partículas tanto no interior quanto na superfície anatômica:
      // - 45% penetram para dentro do corpo ao longo de -tempNorm, preenchendo o interior de luz
      // - 35% ficam na superfície anatômica da malha
      // - 20% formam a aura/halo translúcido exterior
      const roll = Math.random();
      if (roll < 0.45) {
        const inwardDepth = Math.random() * 0.12;
        tempPos.addScaledVector(tempNorm, -inwardDepth);
      } else if (roll > 0.80) {
        const auraHalo = Math.random() * 0.04;
        tempPos.addScaledVector(tempNorm, auraHalo);
      } else {
        const surfaceJitter = (Math.random() - 0.5) * 0.015;
        tempPos.addScaledVector(tempNorm, surfaceJitter);
      }

      const idx = i * 3;
      this.basePositions[idx + 0] = tempPos.x;
      this.basePositions[idx + 1] = tempPos.y;
      this.basePositions[idx + 2] = tempPos.z;

      this.currentPositions[idx + 0] = tempPos.x;
      this.currentPositions[idx + 1] = tempPos.y;
      this.currentPositions[idx + 2] = tempPos.z;

      this.normals[idx + 0] = tempNorm.x;
      this.normals[idx + 1] = tempNorm.y;
      this.normals[idx + 2] = tempNorm.z;

      this.lifes[i] = Math.random();
      this.speeds[i] = 0.08 + Math.random() * 0.10;
      this.phases[i] = Math.random() * Math.PI * 2;

      this.offsets[idx + 0] = Math.random() * Math.PI * 2;
      this.offsets[idx + 1] = Math.random() * Math.PI * 2;
      this.offsets[idx + 2] = Math.random() * Math.PI * 2;
    }
  }

  sampleFromBoxes(boxes) {
    let totalVolume = 0;
    const boxVols = boxes.map(b => {
      const vol = b.size.x * b.size.y * b.size.z;
      totalVolume += vol;
      return vol;
    });

    for (let i = 0; i < this.count; i++) {
      let r = Math.random() * totalVolume;
      let chosenBox = boxes[0];
      for (let j = 0; j < boxes.length; j++) {
        r -= boxVols[j];
        if (r <= 0) {
          chosenBox = boxes[j];
          break;
        }
      }

      const expansion = 1.15;
      const lx = (Math.random() - 0.5) * chosenBox.size.x * expansion;
      const ly = (Math.random() - 0.5) * chosenBox.size.y * expansion;
      const lz = (Math.random() - 0.5) * chosenBox.size.z * expansion;

      const p = new THREE.Vector3(lx, ly, lz);
      if (chosenBox.rotation) {
        p.applyEuler(chosenBox.rotation);
      }
      p.add(chosenBox.center);

      this.basePositions[i * 3 + 0] = p.x;
      this.basePositions[i * 3 + 1] = p.y;
      this.basePositions[i * 3 + 2] = p.z;

      this.currentPositions[i * 3 + 0] = p.x;
      this.currentPositions[i * 3 + 1] = p.y;
      this.currentPositions[i * 3 + 2] = p.z;

      const norm = p.clone().sub(chosenBox.center).normalize();
      if (norm.lengthSq() === 0) norm.set(0, 1, 0);
      this.normals[i * 3 + 0] = norm.x;
      this.normals[i * 3 + 1] = norm.y;
      this.normals[i * 3 + 2] = norm.z;

      this.lifes[i] = Math.random();
      this.speeds[i] = 0.10 + Math.random() * 0.12;
      this.phases[i] = Math.random() * Math.PI * 2;

      this.offsets[i * 3 + 0] = Math.random() * Math.PI * 2;
      this.offsets[i * 3 + 1] = Math.random() * Math.PI * 2;
      this.offsets[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
  }

  update(delta, camera = null) {
    this.time += delta;
    const pos = this.geometry.attributes.position.array;
    const col = this.geometry.attributes.color.array;
    const t = this.time;

    // Posição local da câmera em relação ao grupo do patrono para cálculo do vetor de visão
    if (camera && this.points.parent) {
      this.points.parent.worldToLocal(this._camPosLocal.copy(camera.position));
    } else {
      this._camPosLocal.set(2, 2, 4);
    }

    const sapphire = new THREE.Color(0x1976d2);
    const celestial = new THREE.Color(0x90caf9);
    const specularHighlight = new THREE.Color(0xebf5ff);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const bx = this.basePositions[idx + 0];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];

      const nx = this.normals[idx + 0];
      const ny = this.normals[idx + 1];
      const nz = this.normals[idx + 2];

      const offX = this.offsets[idx + 0];
      const offZ = this.offsets[idx + 2];
      const phase = this.phases[i];

      this.lifes[i] += delta * this.speeds[i];
      if (this.lifes[i] > 1.0) {
        this.lifes[i] -= 1.0;
      }
      const progress = this.lifes[i];
      const bellAlpha = Math.sin(progress * Math.PI);

      // Movimento térmico ondulante sutil e ascensão contida para manter o corpo preenchido de luz
      const radialDrift = progress * 0.035;
      const waveX = Math.sin(t * 1.5 + offX + progress * 2.0) * 0.02;
      const waveZ = Math.cos(t * 1.3 + offZ + progress * 2.0) * 0.02;
      const riseY = progress * 0.14;

      const px = bx + nx * radialDrift + waveX;
      const py = by + riseY;
      const pz = bz + nz * radialDrift + waveZ;

      pos[idx + 0] = px;
      pos[idx + 1] = py;
      pos[idx + 2] = pz;

      // --- CÁLCULO DE PHONG ANALÍTICO (Suavizado nas bordas) ---
      // Vetor Luz: do ponto até a luz interna
      this._p.set(px, py, pz);
      this._l.copy(this.lightPosition).sub(this._p).normalize();

      // Vetor Visão: do ponto até a câmera
      this._v.copy(this._camPosLocal).sub(this._p).normalize();

      // Termo Difuso de Phong: amortecido com base ambiente 0.65 para evitar escurecimento de silhuetas
      const nDotL = Math.max(0, nx * this._l.x + ny * this._l.y + nz * this._l.z);
      const diffuse = 0.65 + 0.35 * nDotL;

      // Termo Especular de Blinn-Phong: N . H onde H = normalize(L + V)
      this._h.copy(this._l).add(this._v).normalize();
      const nDotH = Math.max(0, nx * this._h.x + ny * this._h.y + nz * this._h.z);
      const specular = Math.pow(nDotH, 24) * 0.70;

      // Respiração mágica alternando entre safira e azul celeste
      const breath = 0.5 + 0.5 * Math.sin(t * 1.6 + phase);
      const blended = new THREE.Color().lerpColors(sapphire, celestial, breath);

      // Aplica iluminação difusa + especular perolada ponderada pela curva de vida
      col[idx + 0] = (blended.r * diffuse + specularHighlight.r * specular) * bellAlpha;
      col[idx + 1] = (blended.g * diffuse + specularHighlight.g * specular) * bellAlpha;
      col[idx + 2] = (blended.b * diffuse + specularHighlight.b * specular) * bellAlpha;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
