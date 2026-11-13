// Carrega as imagens de textura de assets/texturas/. Elas sao nossas,
// desenhadas pelo script tools/gerar-texturas.py.
//
// Cada material usa duas imagens: a cor e o mapa de normais, que da relevo
// a superficie quando a luz bate. As duas precisam usar a MESMA repeticao,
// senao o relevo nao casa com o desenho.
//
// repeat diz quantas vezes a imagem cabe dentro das coordenadas UV do
// objeto: a parede repete muito para os blocos sairem no tamanho certo, a
// varinha repete 1 para o veio percorrer a peca inteira.

import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function carregar(arquivo, repeatX, repeatY, cor = true) {
  const textura = loader.load(`./assets/texturas/${arquivo}`);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(repeatX, repeatY);
  // mapas de cor sao lidos em sRGB; normais sao dados, ficam lineares
  if (cor) textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

// gira a imagem 90 graus em torno do proprio centro
function girar(textura, angulo = Math.PI / 2) {
  textura.center.set(0.5, 0.5);
  textura.rotation = angulo;
  return textura;
}

// devolve o par { map, normalMap } de um material
function par(nome, repeatX = 1, repeatY = 1) {
  return {
    map: carregar(`${nome}.png`, repeatX, repeatY),
    normalMap: carregar(`${nome}-normal.png`, repeatX, repeatY, false),
  };
}

export function carregarTexturas() {
  return {
    // rocha das paredes: textura externa do ambientCG (CC0), 1024 px.
    // Alem da cor e das normais, ela traz mapa de rugosidade, que define
    // onde a pedra reflete mais ou menos a luz das tochas.
    rocha: {
      map: carregar('rocha.jpg', 4, 1.5),
      normalMap: carregar('rocha-normal.jpg', 4, 1.5, false),
      roughnessMap: carregar('rocha-rugosidade.jpg', 4, 1.5, false),
    },
    // piso de pedra irregular: textura externa (CC0), 1024 px
    piso: {
      map: carregar('piso.jpg', 5, 5),
      normalMap: carregar('piso-normal.jpg', 5, 5, false),
      roughnessMap: carregar('piso-rugosidade.jpg', 5, 5, false),
    },
    // A repeticao segue o tamanho real da peca, senao a pedra espreme num
    // eixo e estica no outro. Referencia: o chao de 14 m repete 5 vezes,
    // ou seja, uma pedra a cada 2,8 m. Teto: 14 / 2,8 = 5. Coluna de
    // 0,7 x 5 m: 0,7 / 2,8 = 0,25 na largura e 5 / 2,8 = 1,8 na altura.
    pisoTeto: {
      map: carregar('piso.jpg', 5, 5),
      normalMap: carregar('piso-normal.jpg', 5, 5, false),
      roughnessMap: carregar('piso-rugosidade.jpg', 5, 5, false),
    },
    // tablado de 3,4 m: 3,4 / 2,8 = 1,2
    pisoTablado: {
      map: carregar('piso.jpg', 1.2, 1.2),
      normalMap: carregar('piso-normal.jpg', 1.2, 1.2, false),
      roughnessMap: carregar('piso-rugosidade.jpg', 1.2, 1.2, false),
    },
    pisoColuna: {
      map: carregar('piso.jpg', 0.25, 1.8),
      normalMap: carregar('piso-normal.jpg', 0.25, 1.8, false),
      roughnessMap: carregar('piso-rugosidade.jpg', 0.25, 1.8, false),
    },
    pedraParede: par('pedra', 7, 2.5),
    // tabuas de madeira: textura externa (CC0), usada nos moveis da sala
    tabua: {
      map: carregar('tabua.jpg', 1, 1),
      normalMap: carregar('tabua-normal.jpg', 1, 1, false),
      roughnessMap: carregar('tabua-rugosidade.jpg', 1, 1, false),
    },
    // a nossa madeira fica na varinha, onde o veio fino aparece melhor
    madeira: par('madeira', 1, 1),
    // manto dos Dementadores: couro externo (CC0) na cor, no relevo e na
    // rugosidade; o recorte da franja continua vindo da nossa imagem, que
    // precisa ficar em 1x1 para o rasgado cair na barra do manto
    // A imagem do couro tem as costuras na horizontal. Girando 90 graus
    // elas passam a descer pelo manto, como as dobras do pano, e com
    // repeticao baixa aparecem poucas fitas em vez de uma grade delas.
    couro: {
      map: girar(carregar('couro.jpg', 1.6, 1)),
      normalMap: girar(carregar('couro-normal.jpg', 1.6, 1, false)),
      roughnessMap: girar(carregar('couro-rugosidade.jpg', 1.6, 1, false)),
      alphaMap: carregar('manto-franja.png', 1, 1, false),
    },
    uv: carregar('uv.png', 1, 1),
  };
}

function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

// Madeira da varinha (fallback procedural):
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

// Transparencia do manto (fallback procedural):
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
