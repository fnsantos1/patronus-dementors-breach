// A camara onde o jogo acontece: chao, quatro paredes, teto, tochas e
// alguns obstaculos. Tudo em caixas, no mesmo acabamento dos personagens.
//
// A sala e quadrada e centrada na origem, entao fica facil posicionar
// qualquer coisa: o chao vai de -LARGURA/2 a +LARGURA/2 nos dois eixos.

import * as THREE from 'three';

export const LARGURA = 14;   // metros, nos eixos X e Z
export const ALTURA = 5;     // do chao ao teto
const ESPESSURA = 0.4;       // das paredes

export function createRoom(woodTexture = null) {
  const room = new THREE.Group();
  room.name = 'camara';

  const stone = new THREE.MeshStandardMaterial({
    color: 0x55565f,
    roughness: 1,
    flatShading: true,
  });
  const darkStone = new THREE.MeshStandardMaterial({
    color: 0x3c3d45,
    roughness: 1,
    flatShading: true,
  });
  const wood = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.9,
    flatShading: true,
  });

  // chao e teto: caixas achatadas, mais faceis de posicionar que planos
  const floor = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, ESPESSURA, LARGURA), stone);
  floor.name = 'chao';
  floor.position.y = -ESPESSURA / 2;   // a face de cima fica em y = 0
  floor.receiveShadow = true;
  room.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, ESPESSURA, LARGURA), darkStone);
  ceiling.name = 'teto';
  ceiling.position.y = ALTURA + ESPESSURA / 2;
  room.add(ceiling);

  // quatro paredes. Duas no eixo X e duas no Z, so trocando as medidas
  const meio = LARGURA / 2;
  const paredes = [
    { nome: 'parede-norte', pos: [0, ALTURA / 2, -meio], tam: [LARGURA, ALTURA, ESPESSURA] },
    { nome: 'parede-sul', pos: [0, ALTURA / 2, meio], tam: [LARGURA, ALTURA, ESPESSURA] },
    { nome: 'parede-oeste', pos: [-meio, ALTURA / 2, 0], tam: [ESPESSURA, ALTURA, LARGURA] },
    { nome: 'parede-leste', pos: [meio, ALTURA / 2, 0], tam: [ESPESSURA, ALTURA, LARGURA] },
  ];

  for (const parede of paredes) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...parede.tam), stone);
    mesh.name = parede.nome;
    mesh.position.set(...parede.pos);
    mesh.receiveShadow = true;
    room.add(mesh);
  }

  const chandelier = addChandelier(room, wood);
  addColumns(room, darkStone);
  addProps(room, wood, darkStone);
  const torches = addTorches(room, wood);

  return { group: room, torches, chandelier };
}

// Candelabro pendurado no meio do teto. A luz dele e criada no main.js,
// que e quem cuida da iluminacao da cena.
function addChandelier(room, wood) {
  const chandelier = new THREE.Group();
  chandelier.name = 'candelabro';
  chandelier.position.set(0, ALTURA - 0.9, 0);

  const haste = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), wood);
  haste.position.y = 0.45;
  chandelier.add(haste);

  const aro = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.6), wood);
  chandelier.add(aro);

  const fogo = new THREE.MeshBasicMaterial({ color: 0xffc46d });
  for (const [x, z] of [[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]]) {
    const vela = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), fogo);
    vela.position.set(x, 0.2, z);
    chandelier.add(vela);
  }

  room.add(chandelier);
  return chandelier;
}

// Quatro colunas, uma por canto, afastadas da parede.
function addColumns(room, material) {
  const d = LARGURA / 2 - 1.6;

  for (const x of [-d, d]) {
    for (const z of [-d, d]) {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.7, ALTURA, 0.7), material);
      column.name = 'coluna';
      column.position.set(x, ALTURA / 2, z);
      column.castShadow = true;
      column.receiveShadow = true;
      room.add(column);
    }
  }
}

// Obstaculos soltos pela sala: caixotes e uma mesa tombada.
function addProps(room, wood, stone) {
  const caixotes = [
    { pos: [-4.2, 0.4, 3.4], tam: 0.8, giro: 0.3 },
    { pos: [-3.3, 0.3, 4.2], tam: 0.6, giro: -0.6 },
    { pos: [-4.0, 1.1, 3.4], tam: 0.6, giro: 0.8 },   // empilhado sobre o primeiro
    { pos: [4.6, 0.45, -3.2], tam: 0.9, giro: 0.15 },
  ];

  for (const caixote of caixotes) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(caixote.tam, caixote.tam, caixote.tam),
      wood
    );
    box.name = 'caixote';
    box.position.set(...caixote.pos);
    box.rotation.y = caixote.giro;
    box.castShadow = true;
    box.receiveShadow = true;
    room.add(box);
  }

  // mesa tombada: um tampo de pe, apoiado em dois pes
  const mesa = new THREE.Group();
  mesa.name = 'mesa-tombada';
  mesa.position.set(4.3, 0, 2.6);
  mesa.rotation.y = -0.9;

  const tampo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.12), wood);
  tampo.position.y = 0.5;
  tampo.castShadow = true;
  mesa.add(tampo);

  for (const x of [-0.9, 0.9]) {
    const pe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.9), wood);
    pe.position.set(x, 0.1, 0.4);
    pe.castShadow = true;
    mesa.add(pe);
  }

  room.add(mesa);

  // degrau de pedra no centro, onde o jogador se posiciona
  const tablado = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 3.4), stone);
  tablado.name = 'tablado';
  tablado.position.y = 0.1;
  tablado.receiveShadow = true;
  room.add(tablado);
}

// Tochas de parede: um suporte de madeira e um bloco aceso com uma luz.
// Devolve a lista das luzes para o main.js poder fazer o bruxuleio.
function addTorches(room, wood) {
  const lights = [];
  const meio = LARGURA / 2 - ESPESSURA / 2;

  // uma tocha no meio de cada parede, a 2,6 m do chao
  const pontos = [
    { pos: [0, 2.6, -meio], giro: 0 },
    { pos: [0, 2.6, meio], giro: Math.PI },
    { pos: [-meio, 2.6, 0], giro: Math.PI / 2 },
    { pos: [meio, 2.6, 0], giro: -Math.PI / 2 },
  ];

  for (const ponto of pontos) {
    const torch = new THREE.Group();
    torch.name = 'tocha';
    torch.position.set(...ponto.pos);
    torch.rotation.y = ponto.giro;

    // o suporte aponta para dentro da sala (+Z local)
    const suporte = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), wood);
    suporte.position.z = 0.25;
    torch.add(suporte);

    const chama = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.26, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xffa94d })
    );
    chama.position.set(0, 0.16, 0.5);
    torch.add(chama);

    const light = new THREE.PointLight(0xff8c3a, 26, 14);
    light.position.set(0, 0.2, 0.6);
    torch.add(light);
    lights.push(light);

    room.add(torch);
  }

  return lights;
}
