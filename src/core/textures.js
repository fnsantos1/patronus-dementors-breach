/**
 * textures.js - Texturas desenhadas em <canvas> e usadas como CanvasTexture.
 *
 * Optamos por gerar as texturas por codigo (em vez de usar arquivos de
 * imagem) para o repositorio nao depender de assets externos. Sao tres:
 * os veios da madeira da varinha, o recorte esfarrapado do manto e o
 * brilho das particulas.
 */

import * as THREE from 'three';

/** Cria um canvas quadrado do tamanho pedido. */
function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

/**
 * Madeira: faixas horizontais claras e escuras, com a posicao de cada faixa
 * deslocada por um seno para os veios nao ficarem retos.
 */
export function createWoodTexture(size = 256) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#4a301c';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    // oscila entre 0 e 1 ao longo da altura: e o veio da madeira
    const wave = Math.sin(y * 0.35) * 0.5 + 0.5;
    const tone = 60 + wave * 70;
    ctx.fillStyle = `rgb(${tone + 25}, ${tone * 0.65}, ${tone * 0.35})`;
    const offset = Math.sin(y * 0.08) * 6;   // curva o veio
    ctx.fillRect(offset, y, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Mapa de transparencia do manto. A textura e lida com U = volta do manto e
 * V = altura: opaca no topo e recortada na barra, onde tiras verticais de
 * alturas sorteadas formam a franja rasgada do tecido.
 */
export function createShroudAlphaTexture(size = 256) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';            // branco = opaco
  ctx.fillRect(0, 0, size, size);

  const strips = 60;
  const stripWidth = size / strips;
  ctx.fillStyle = '#000000';            // preto = transparente
  for (let i = 0; i < strips; i++) {
    const height = size * (0.12 + Math.random() * 0.22);
    ctx.fillRect(i * stripWidth, size - height, stripWidth + 1, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Circulo com brilho suave usado nas particulas da ponta da varinha. */
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
