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
