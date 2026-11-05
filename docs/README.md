# Documentação e Entregas do Projeto

> **Patronus: The Dementor's Breach**  
> Trabalho Prático da Disciplina de **Computação Gráfica**  
> Instituto de Ciência e Tecnologia — Universidade Federal de São Paulo (UNIFESP, São José dos Campos)

---

## 👥 Integrantes

| Nome | RA |
|---|---|
| Andrey Prado de Oliveira | 168491 |
| Diogo José Santos | 168632 |
| Fabricio Nascimento dos Santos | 170552 |
| João Victor Assaoka Ribeiro | 168863 |
| Kauan Domingues de Souza | 170347 |

---

## 📄 Relatórios e Documentos Oficiais

Todos os relatórios e especificações formais de cada etapa do projeto estão disponíveis em PDF:

| Entrega | Tópico | Arquivo PDF | Descrição Resumida |
|:---:|---|:---:|---|
| **01** | Proposta do Trabalho Final | [Entrega1-Proposta.pdf](./Entrega1-Proposta.pdf) | Proposta conceitual, escopo do jogo horda 3D, referências estéticas e cronograma. |
| **02** | Modelagem 3D e Construção Inicial | [Entrega2-Relatorio.pdf](./Entrega2-Relatorio.pdf) | Modelagem procedural dos 3 personagens (Conjurador, Dementador, Patrono) e da câmara 14×14×5 m. |
| **03** | Câmeras, Perspectiva e Iluminação | [Entrega3-Relatorio.pdf](./Entrega3-Relatorio.pdf) | Quatro câmeras com hierarquia de nós, matriz de projeção perspectiva e liga/desliga individual de luzes. |

---

## 🎥 Demonstrações em Vídeo

### Entrega 3 — Demonstração Técnica Funcional
- **Arquivo:** [`Demonstracao_Entrega_3.mp4`](./Demonstracao_Entrega_3.mp4)
- **Conteúdo demonstrado no vídeo:**
  1. **Múltiplas Câmeras:** Alternância dinâmica via teclado entre 1ª pessoa (<kbd>1</kbd>), 3ª pessoa (<kbd>2</kbd>), zenital (<kbd>3</kbd>) e livre (<kbd>0</kbd>).
  2. **Hierarquia no Grafo de Cena:** O braço do mago e a varinha acompanham a visão em primeira pessoa como filhos da câmera.
  3. **Projeção Perspectiva:** Ativação da grade (<kbd>G</kbd>) evidenciando linhas paralelas convergindo para o ponto de fuga e encolhimento relativo dos Dementadores ao fundo.
  4. **Iluminação e Sombras:** Ativação e desativação individual do candelabro (<kbd>C</kbd>) e das tochas cardeais (<kbd>5</kbd>, <kbd>6</kbd>, <kbd>7</kbd>, <kbd>8</kbd>), mantendo 60 FPS por meio da manipulação de intensidade.

---

## 🚀 Como Executar o Projeto Localmente

Como a aplicação é construída com Three.js nativo em módulos ES (sem etapa de compilação), execute um servidor HTTP na raiz do projeto:

```bash
python -m http.server 8000
```

E abra <http://localhost:8000> no navegador.
