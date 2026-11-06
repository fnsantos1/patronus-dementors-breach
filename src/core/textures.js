// Texturas desenhadas em <canvas> e usadas como CanvasTexture. Preferimos
// gerar por codigo a depender de arquivos de imagem: o repositorio fica
// leve e nao ha caminho de asset para quebrar.

import * as THREE from 'three';

function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

// Madeira da varinha: faixas horizontais claras e escuras, deslocadas por
// um seno para o veio nao sair reto.
export function createWoodTexture(size = 256) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#4a301c';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const wave = Math.sin(y * 0.35) * 0.5 + 0.5;
    const tone = 70 + wave * 80;
    ctx.fillStyle = `rgb(${tone + 30}, ${tone * 0.65}, ${tone * 0.35})`;
    ctx.fillRect(Math.sin(y * 0.08) * 6, y, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Transparencia do manto. A textura e lida com U na volta do manto e V na
// altura: branco (opaco) em cima, tiras pretas de alturas sorteadas em
// baixo - que e o que vira a franja rasgada.
export function createShroudAlphaTexture(size = 256) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const strips = 60;
  const stripWidth = size / strips;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < strips; i++) {
    const height = size * (0.12 + Math.random() * 0.22);
    ctx.fillRect(i * stripWidth, size - height, stripWidth + 1, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Textura procedural de tecido rústico e desgastado para o capuz e manto do Dementador:
// Trama ortogonal entrecruzada em cinza-chumbo profundo com micro-ruído espectral de poeira e desbotamento.
export function createFabricTexture(size = 256) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  // Base cinza-carvão escuro
  ctx.fillStyle = '#1c1d24';
  ctx.fillRect(0, 0, size, size);

  // Trama entrecruzada (fios horizontais e verticais)
  const threadSpacing = 4;
  for (let x = 0; x < size; x += threadSpacing) {
    const threadTone = 24 + ((x * 13) % 20);
    ctx.fillStyle = `rgba(${threadTone}, ${threadTone + 2}, ${threadTone + 6}, 0.65)`;
    ctx.fillRect(x, 0, 2, size);
  }

  for (let y = 0; y < size; y += threadSpacing) {
    const threadTone = 20 + ((y * 17) % 24);
    ctx.fillStyle = `rgba(${threadTone}, ${threadTone + 2}, ${threadTone + 8}, 0.65)`;
    ctx.fillRect(0, y, size, 2);
  }

  // Ruído espectral e manchas de desbotamento e desgaste pelo frio
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.max(10, Math.min(60, data[i] + noise));
    data[i + 1] = Math.max(12, Math.min(62, data[i + 1] + noise));
    data[i + 2] = Math.max(18, Math.min(75, data[i + 2] + noise * 1.2));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Estrela espectral difusa da ponta da varinha:
// Gradiente radial multicamada suave com centro perolado luminoso, halo celeste translúcido
// e decaimento exponencial sem facetas geométricas.
export function createSpectralStarTexture(size = 128) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2;

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.12, 'rgba(230, 245, 255, 0.95)');
  grad.addColorStop(0.28, 'rgba(145, 210, 255, 0.65)');
  grad.addColorStop(0.55, 'rgba(55, 145, 255, 0.22)');
  grad.addColorStop(0.80, 'rgba(20, 80, 220, 0.06)');
  grad.addColorStop(1.0, 'rgba(0, 40, 180, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
