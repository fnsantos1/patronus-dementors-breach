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

// Bolinha de brilho usada nas particulas da ponta da varinha.
export function createSparkTexture(size = 64) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(190, 220, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(140, 180, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
