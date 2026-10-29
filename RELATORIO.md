# Entrega 2 — Modelagem 3D e Construção Inicial da Cena

**Patronus: The Dementor's Breach** — Computação Gráfica, UNIFESP (ICT, São José dos Campos)

> Versão para entrega: [docs/Entrega2-Relatorio.pdf](docs/Entrega2-Relatorio.pdf)

| Integrante | RA |
|---|---|
| Andrey Prado de Oliveira | 168491 |
| Diogo José Santos | 168632 |
| Fabricio Nascimento dos Santos | 170552 |
| João Victor Assaoka Ribeiro | 168863 |
| Kauan Domingues de Souza | 170347 |

## 1. Tecnologia

Three.js r169 sobre WebGL, sem etapa de compilação. A biblioteca está em
`vendor/three/`; basta servir a pasta: `python3 -m http.server 8000`.

## 2. Personagens

Modelos próprios, feitos por código: primitivas do Three.js agrupadas em
`THREE.Group` encaixados, de modo que girar um grupo arrasta tudo abaixo dele.
Não há modelo nem imagem externa no projeto.

- **Conjurador** — braço e varinha em primeira pessoa, na hierarquia
  ombro → cotovelo → mão → varinha, com a luz do feitiço na ponta.
- **Dementador** — manto, capuz vazio e dois braços com garra. O manto é um
  prisma de base quadrada deformado por um seno vértice a vértice, o que abre
  dobras na barra.
- **Patrono** — versão preliminar. Cervo espectral com galhada e pernas
  divididas em quadril e joelho, de material translúcido e emissivo.

O acabamento blocado é intencional: caixas e pirâmides com `flatShading`, para
deixar as facetas à mostra. As duas texturas (madeira e as franjas do manto) são
desenhadas em `<canvas>` por código.

## 3. A cena

Câmara quadrada centrada na origem, 14 × 14 m de piso e 5 m de altura. Unidade
em metros, face do chão em `y = 0`. Tem paredes, teto, colunas nos cantos,
tablado central, caixotes, mesa tombada e tochas de parede. O Conjurador fica no
centro; os Dementadores entram pelas extremidades, flutuando e virados para o
meio da sala.

A sala é fechada, então a iluminação é interna: ambiente fria, candelabro,
tochas e a luz da varinha. Quatro câmeras por tecla — primeira pessoa, terceira
pessoa, zenital e livre.

A cena é inteiramente estática: não há animação. A deformação do manto é
aplicada uma única vez, na montagem do modelo.

## 4. Dificuldades

- A cena ficou preta: desde o r155 as luzes usam unidades físicas, e nossas
  intensidades quase não iluminavam.
- Ao fechar o teto escureceu de novo, porque a luz principal estava acima dele.
- A deformação do manto acumulava erro a cada quadro; a correção é guardar as
  posições originais dos vértices.

## 5. O que falta

- Mecânica do gesto: travar a câmera, vetorizar o mouse e validar o traçado.
- Animação dos personagens e do feitiço.
- Ondas de inimigos, pontuação e condições de vitória/derrota.
- Textura de pedra nas paredes e no chão.
- Capturas de tela e vídeo em `docs/`.

## 6. Créditos

- Three.js r169 — licença MIT, mrdoob e contribuidores.
- Dementador e Patrono referenciam o universo de Harry Potter (J. K. Rowling /
  Warner Bros.); trabalho acadêmico, sem fim comercial.
- Modelos e texturas feitos pelo grupo.
