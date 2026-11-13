// A camara onde o jogo acontece: chao, quatro paredes, teto, tochas e
// alguns obstaculos. Tudo em caixas, no mesmo acabamento dos personagens.
//
// A sala e quadrada e centrada na origem, entao fica facil posicionar
// qualquer coisa: o chao vai de -LARGURA/2 a +LARGURA/2 nos dois eixos.

import * as THREE from 'three';

export const LARGURA = 14;   // metros, nos eixos X e Z
export const ALTURA = 5;     // do chao ao teto
const ESPESSURA = 0.4;       // das paredes

// Quebra a repeticao da textura: cada peca recebe uma copia do material com
// a imagem deslocada e, as vezes, virada de cabeca para baixo. Como a copia
// aponta para a mesma imagem, nao custa memoria nenhuma - muda so o
// enquadramento. Sem isso as quatro paredes ficam identicas.
function variar(material, deslocaX, deslocaY, virar = false) {
  const copia = material.clone();

  for (const canal of ['map', 'normalMap', 'roughnessMap']) {
    if (!copia[canal]) continue;
    const textura = copia[canal].clone();
    textura.offset.set(deslocaX, deslocaY);
    if (virar) {
      textura.center.set(0.5, 0.5);
      textura.rotation = Math.PI;
    }
    textura.needsUpdate = true;
    copia[canal] = textura;
  }

  return copia;
}

export function createRoom(texturas) {
  const room = new THREE.Group();
  room.name = 'camara';

  // paredes: rocha externa, com relevo e rugosidade
  const rock = new THREE.MeshStandardMaterial({
    ...texturas.rocha,
    roughness: 1,
  });
  // tablado onde o jogador fica: mesma pedra do chao, na escala da peca
  const stone = new THREE.MeshStandardMaterial({
    ...texturas.pisoTablado,
    color: 0xa8a8ae,
    roughness: 1,
  });
  // teto e colunas: a mesma pedra irregular do chao, so que mais escura
  const darkStone = new THREE.MeshStandardMaterial({
    ...texturas.pisoTeto,
    color: 0x8a8a90,
    roughness: 1,
  });
  const columnStone = new THREE.MeshStandardMaterial({
    ...texturas.pisoColuna,
    color: 0x9a9aa0,
    roughness: 1,
  });
  const wood = new THREE.MeshStandardMaterial({
    ...texturas.tabua,
    roughness: 1,
  });

  // chao e teto: caixas achatadas, mais faceis de posicionar que planos.
  // O piso usa a pedra irregular, com relevo e rugosidade proprios.
  const chaoMaterial = new THREE.MeshStandardMaterial({
    ...texturas.piso,
    roughness: 1,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, ESPESSURA, LARGURA), chaoMaterial);
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

  // deslocamentos escolhidos a dedo, um por parede, para nenhuma repetir a outra
  const variacoes = [[0, 0, false], [0.37, 0.21, true], [0.64, 0.08, false], [0.19, 0.44, true]];

  paredes.forEach((parede, i) => {
    const [dx, dy, virar] = variacoes[i];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...parede.tam), variar(rock, dx, dy, virar));
    mesh.name = parede.nome;
    mesh.position.set(...parede.pos);
    mesh.receiveShadow = true;
    room.add(mesh);
  });

  const { chandelier, chandelierFlame } = addChandelier(room, wood);
  addColumns(room, columnStone);
  addProps(room, wood, stone);
  const torches = addTorches(room, wood);

  return { group: room, torches, chandelier, chandelierFlame };
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
  // o material das velas sai junto para o main.js apagar o fogo ao
  // desligar a luz
  return { chandelier, chandelierFlame: fogo };
}

// Quatro colunas, uma por canto, afastadas da parede.
function addColumns(room, material) {
  const d = LARGURA / 2 - 1.6;

  for (const x of [-d, d]) {
    for (const z of [-d, d]) {
      const column = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, ALTURA, 0.7),
        variar(material, Math.random(), Math.random())
      );
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
      variar(wood, Math.random(), Math.random())
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
// Devolve, para cada tocha, a luz e a chama, para o main.js poder
// liga-las, desliga-las e fazer o bruxuleio.
function addTorches(room, wood) {
  const torches = [];
  const meio = LARGURA / 2 - ESPESSURA / 2;

  // uma tocha no meio de cada parede, a 2,6 m do chao
  const pontos = [
    { nome: 'norte', pos: [0, 2.6, -meio], giro: 0 },
    { nome: 'sul', pos: [0, 2.6, meio], giro: Math.PI },
    { nome: 'oeste', pos: [-meio, 2.6, 0], giro: Math.PI / 2 },
    { nome: 'leste', pos: [meio, 2.6, 0], giro: -Math.PI / 2 },
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
    torches.push({ nome: ponto.nome, light, flame: chama.material });

    room.add(torch);
  }

  return torches;
}
