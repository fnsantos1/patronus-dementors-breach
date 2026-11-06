# 0008 - Modelagem Anatômica do Dementador com Arquétipo Flyweight e Cobertura Têxtil Total

## Contexto
Anteriormente, os Dementadores eram constituídos por blocos rígidos de caixas primitivas (`BoxGeometry`) e um cilindro de 4 lados afunilado deformado estaticamente uma única vez no carregamento. Além da aparência geométrica facetada não transmitir a natureza etérea e cadavérica de um esqueleto flutuante envolto em farrapos, cada instância recriava materiais e geometrias sem compartilhar recursos em VRAM, e partes do corpo (como braços e transição pescoço-ombros) ficavam desconectadas ou sem tecido.

## Decisão
1. **Arquitetura Flyweight Robusta (`DementorArchetype`)**:
   - Centralizamos o *estado intrínseco* em uma classe arquétipo que carrega e armazena uma única vez na VRAM as malhas e geometrias ósseas (`assets/models/dementor_skeleton.glb`), as geometrias completas do manto, capuz e mangas, e os materiais PBR compartilhados.
   - O método `getShared()` resolve o carregamento assíncrono aguardando a Promise compartilhada em todas as instâncias concorrentes, eliminando condições de corrida entre os múltiplos Dementadores da cena.
   - Cada instância de `Dementor` retém estritamente o *estado extrínseco*: posição no espaço, orientação, fase temporal individual (`phase`), vetor de flutuação vertical (`baseY + sin(t + phase)`) e seu próprio `AnimationMixer` com variações de velocidade e ciclo para evitar sincronismo mecânico.

2. **Cobertura Têxtil Total (Véu Negro, Capuz e Mangas)**:
   - **Capuz Amplo (`hoodGeometry`)**: Cobre toda a calota craniana e a nuca (altura de $Y = 1.95$ até $Y = 2.95$), com cúpula fechada e abertura frontal que emoldura a cavidade sombria do rosto e o crânio.
   - **Manto do Corpo Inteiro (`shroudGeometry`)**: Estende-se continuamente dos ombros ($Y = 2.15$) até a base próxima ao chão ($Y = -0.05$), eliminando qualquer lacuna entre o capuz e o tronco, com ondulações dinâmicas e recorte alfa de farrapos.
   - **Mangas dos Braços (`sleeveGeometry`)**: Mangas drapeadas e afuniladas que acompanham a extensão dos braços esqueléticos (`LUpperLeg001` e `RUpperLeg001`), deixando apenas as garras/mãos ósseas se projetando das frestas do tecido.

3. **Visibilidade e Contraste Ósseo**:
   - O material da ossatura foi calibrado para um tom de osso envelhecido e cadavérico (`#8e929a`, `roughness: 0.82`), destacando o crânio dentro do capuz e as mãos saindo das mangas contra o tecido negro acetinado (`#161820`).

4. **Aura Fria Sensorial**:
   - Cada Dementador possui uma `PointLight` fria azulada (`#3d66cc`) no centro do tórax que pulsa suavemente em harmonia com a oscilação de flutuação, iluminando as costelas e a cavidade do capuz por dentro do véu.

## Consequências
- Os Dementadores agora têm cobertura completa de todas as partes do corpo (cabeça, ombros, braços, tronco e membros inferiores).
- A ossatura é nitidamente visível no interior do tecido rasgado e sob o capuz.
- O carregamento concorrente no loop de inicialização opera de forma 100% determinística sem falhas assíncronas.
