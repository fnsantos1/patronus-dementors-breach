# Patronus & Dementors Breach

Cena 3D interativa de computação gráfica onde um conjurador defende uma câmara mágica contra dementadores utilizando uma varinha e invocando um patrono corpóreo de luz.

## Language

**Conjurador**:
Entidade controlada pelo jogador em primeira pessoa, composta pelo braço articulado e a varinha.
_Avoid_: Mago, player, avatar

**Varinha**:
Instrumento mágico empunhado pelo Conjurador, cuja ponta emite aura passiva, feixes e feitiços.
_Avoid_: Bastão, arma

**Patrono**:
Guardião mágico corpóreo de luz em forma de cervo, composto por um núcleo espectral anatômico orgânico suavizado por iluminação de Phong translúcida (`opacity: 0.08`, `depthWrite: false`), envolvido por uma nuvem volumétrica de 15.000 partículas de névoa etérea contínua amostradas com `MeshSurfaceSampler` e recalibradas com sobreposição suave.
_Avoid_: Cervo sólido, bicho, pet, malha quadrada facetada

**Sombreamento de Phong**:
Modelo de reflexão com componentes ambiente, difuso e especular aplicado ao núcleo translúcido e analiticamente à nuvem de 15.000 partículas do Patrono pela sua luz interna. O termo difuso é amortecido com base ambiente (0.65) para preservar o contorno de luz das silhuetas e bordas anatômicas.
_Avoid_: Flat shading, sombreamento facetado, silhueta escurecida abrupta

**Amostragem de Superfície (MeshSurfaceSampler)**:
Técnica de distribuição estocástica ponderada pela área dos triângulos da malha 3D anatômica do Patrono, com peso prioritário para a galhada ramificada, gerando uma cobertura uniforme com dispersão volumétrica e ascensão térmica contínua.
_Avoid_: Dispersão em caixas cúbicas rígidas, amostragem uniforme desconectada da malha


**Conjuração**:
Ato ativado pelo jogador (ex: tecla Espaço) que inicia a preparação do feitiço, intensificando a aura da varinha conforme o movimento executado.
_Avoid_: Casting, tiro, disparo simples

**Aura da Varinha**:
Sistema de névoa mágica vaporosa na ponta da Varinha, com expansão suave e dissipação orgânica. Em Conjuração, transforma-se em uma espiral crescente que envolve a ponta e a mão do Conjurador.
_Avoid_: Faíscas, centelhas, chama, tiro pirotécnico

**Estrela Espectral**:
Ponto de luz difuso e perolado na ponta da Varinha gerado por sprite 2D com gradiente radial suave e blending aditivo. Apresenta cintilação mágica sutil em repouso e expande organicamente durante a Conjuração.
_Avoid_: Cubo rígido de luz, mesh facetada, lâmpada geométrica, tocha

**Névoa Etérea**:
Comportamento fluido e não-linear de fumaça mágica com respiração cromática que alterna harmoniosamente entre azul safira e azul celeste translúcido, com opacidade sutil e não obstrutiva.
_Avoid_: Fumaça branca opaca, poeira rígida, feixe de laser, fogos de artifício



**Carga Mágica**:
Medidor acumulador de energia mágica durante a Conjuração, influenciado pelo tempo de ativação e balanço da Varinha.
_Avoid_: Mana, stamina, cooldown

**Modo Inspeção**:
Estado atual de desenvolvimento que mantém o Patrono visível na câmara para análise estrutural e visual prévia à integração da mecânica completa de conjuração em jogo.
_Avoid_: Modo debug, cheat mode

**Galhada**:
Estrutura ramificada orgânica do Patrono (cervo), composta por haste principal curvada para trás e múltiplas pontas ascendentes.
_Avoid_: Chifre reto, antena



