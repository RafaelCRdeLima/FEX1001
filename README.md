# FEX1001 — Física Experimental I

Material didático da disciplina **FEX1001 (Física Experimental I)** — Departamento de
Física, CCT/UDESC. Prof. Rafael C. R. de Lima.

**Site da disciplina:** https://rafaelcrdelima.github.io/FEX1001/

## Estrutura

```
index.html                    site da disciplina
styles.css                    estilo do site
favicon.svg

aulas/
  deck.css                    tema das apresentações
  galton.js                   simulação da tábua de Galton (Aula 1)
  linearizacao.js             simulação de linearização (Aula 2)
  papel.js                    painel de escala e posição do papel (Aula 2)
  ajuste.js                   painel de ajuste nos dois espaços (Aula 2)
  carrinho.js                 painel de tabela e escala livre (Aula 2)
  aula-01-medidas/
    index.html                apresentação (reveal.js) — versão corrente
    img/                      figuras
    beamer/main.tex           versão Beamer original (não atualizada)
  aula-02-graficos/
    index.html                apresentação (reveal.js) — versão corrente
    img/                      figuras da Apostila 2
    beamer/main.tex           rascunho Beamer do Prof. Rafael (não atualizado)

Apostilas e Relatorios/
  apostilas/                  Apostila 1 (Medidas) e Apostila 2 (Gráficos)
  Experiencia 1..5            roteiros e modelos de relatório (.docx e .pdf)
  FEX1001-Plano de ensino ... plano de ensino 2026/02 (.docx e .pdf)
  Cronograma Geral ...        calendário do semestre 2026/02

vendor/                       reveal.js e KaTeX embutidos (sem CDN)
```

## Aula 1 — Medidas e Algarismos Significativos

Apresentação em HTML (reveal.js + KaTeX), 132 slides, cobrindo a Apostila 1 por
inteiro:

1. Por que medir — grandezas, unidades do SI, \(M(G)=G/U\)
2. Algarismos significativos — o algarismo duvidoso, zeros, precisão do instrumento
3. Conversão de unidades e notação científica
4. Operações — adição, subtração, multiplicação, divisão, potências, logaritmos,
   funções trigonométricas; fórmulas com uma ou mais medidas diretas
5. Critérios de arredondamento (três casos)
6. Erros experimentais — escala (com o paradoxo da costa), sistemático
   (com o caso do Hubble), aleatório (com Einstein, Perrin e o movimento
   browniano)
7. Tratamento estatístico — média, desvio médio, desvio padrão, a história da
   distribuição normal, a tábua de Galton interativa, Exemplo 11 completo
8. Erro relativo percentual
9. Propagação de erros — equação do erro indeterminado
10. Exercícios I, II e III

Exemplos resolvidos 1 a 14 da apostila, todos presentes.

### Apresentar

Abra `aulas/aula-01-medidas/` pelo site, ou o arquivo diretamente no navegador.

A navegação é **linear**: um único par de teclas percorre os 132 slides, do
primeiro ao último, sem precisar entrar e sair de assuntos. Isso é o que permite
apresentar com passador de slides.

| Tecla | Ação |
|---|---|
| `→` `↓` `Page Down` `espaço` | slide seguinte |
| `←` `↑` `Page Up` | slide anterior |
| `ESC` | mapa de todos os slides |
| `S` | janela do apresentador, com as notas |
| `F` | tela cheia |
| `B` | tela preta |

Os passadores de slides mais comuns emitem `Page Up`/`Page Down`, e alguns as
setas — os dois conjuntos estão mapeados para o mesmo avanço linear.

Reveal.js e KaTeX estão no repositório (`vendor/`), sem depender de CDN — a
apresentação funciona sem internet. As fontes vêm do Google Fonts; sem rede, o
navegador cai nas fontes do sistema e o conteúdo continua legível.

Para gerar um PDF: abra a apresentação com `?print-pdf` no fim da URL e imprima
(Ctrl+P), escolhendo paisagem e “Imprimir imagens de fundo”.

### Versão Beamer

`aulas/aula-01-medidas/beamer/main.tex` é a apresentação original em LaTeX.
Ela **não** contém os tópicos acrescentados depois (divisão, outras operações,
erro relativo percentual, propagação de erros, Exemplos 8 a 14 e o tratamento
estatístico completo do Exemplo 11). Está mantida apenas como registro.

```bash
cd "aulas/aula-01-medidas/beamer"
pdflatex main.tex && pdflatex main.tex
```

## Aula 2 — Construção e Análise de Gráficos

Apresentação em HTML, 64 slides, cobrindo a Apostila 2 por inteiro:

1. Por que gráficos — o que se enxerga no gráfico e não na tabela
2. O sistema de coordenadas cartesianas
3. Construção em papel milimetrado — os sete passos, com o Exemplo 15
   e dois painéis: um com escalas prontas para escolher, outro em que o aluno
   digita início e escala de cada eixo sobre dados de um carrinho acelerado
4. Gráfico linear — coeficientes angular e linear (Exemplo 16)
5. Linearização — Exemplo 17, o catálogo de transformações e um painel que
   mostra o mesmo conjunto nos dois espaços, com o ajuste ao vivo
6. Papel mono-log — Exemplo 18
7. Papel di-log — Exemplo 19
8. Um caso histórico — o diagrama de Hubble (1929)
9. Simulação: escolher a transformação e ver se endireita
10. Exercícios IV

Exemplos resolvidos 15 a 19 da apostila, todos presentes.

### Sobre a numeração

A Apostila 2 é a de gráficos, então esta é a **Aula 2**. O projeto Overleaf do
professor usa outra numeração — lá, *Aula 2* é sobre erros e *Aula 3* sobre
gráficos. O conteúdo de erros já está dentro da Aula 1, porque a Apostila 1
o cobre na seção II.

## Créditos das imagens

As figuras de instrumentos, réguas e prefixos vêm da Apostila 1, e as figuras
III.1 a III.12 da Apostila 2 — ambas do DFIS/UDESC. As demais são de uso livre
para fins educacionais, com atribuição:

| Arquivo | Crédito | Fonte |
|---|---|---|
| `hubble-orbita.jpg` | NASA (STS-125, 19/05/2009) | [science.nasa.gov](https://science.nasa.gov/image-detail/hubble-space-telescope-hst-7/) |
| `hubble-m100-antes-depois.jpg` | NASA / ESA | [science.nasa.gov](https://science.nasa.gov/image-detail/gpn-2002-000064-crop_hubble_images_of_m100_before_and_after_repair_0-1/) |
| `hubble-estrela-costar.jpg` | NASA, ESA e equipe do COSTAR | [esahubble.org](https://esahubble.org/images/opo9408a/) |
| `gauss-retrato.jpg` | C. A. Jensen, 1840 — domínio público | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Carl_Friedrich_Gauss_1840_by_Jensen.jpg) |
| `richardson-retrato.jpg` | NOAA — domínio público | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Lewis_Fry_Richardson.png) |
| `costa-fiordes.jpg` | NASA/USGS — ASTER, *Earth as Art II* | [NASA Earth Observatory](https://earthobservatory.nasa.gov/images/4605/fjords-norway) |
| `perrin-trajetorias.svg` | J. B. Perrin, 1913 — domínio público | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:PerrinPlot2.svg) |
| `hubble-1929.jpg` | E. Hubble, PNAS 15, 168 (1929) — domínio público | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hubble's_law_original_1929.png) |

Imagens da NASA são de domínio público; as da ESA/Hubble estão sob
[CC BY 4.0](https://esahubble.org/copyright/).

## Publicação

O GitHub Pages publica direto do branch `main`, a partir da raiz do repositório —
o site é estático e não precisa de etapa de build. Todo push em `main` republica
automaticamente. O arquivo `.nojekyll` impede o Jekyll de processar o conteúdo.
