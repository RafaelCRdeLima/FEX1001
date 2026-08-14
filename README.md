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
  aula-01-medidas/
    index.html                apresentação (reveal.js) — versão corrente
    img/                      figuras, compartilhadas com o LaTeX
    beamer/main.tex           versão Beamer original (não atualizada)

Apostilas e Relatorios/
  apostilas/                  Apostila 1 (Medidas) e Apostila 2 (Gráficos)
  Experiencia 1..5            roteiros e modelos de relatório (.docx e .pdf)
  FEX1001-Plano de ensino ... plano de ensino 2026/02 (.docx e .pdf)
  Cronograma Geral ...        calendário do semestre 2026/02

vendor/                       reveal.js e KaTeX embutidos (sem CDN)
```

## Aula 1 — Medidas e Algarismos Significativos

Apresentação em HTML (reveal.js + KaTeX), 124 slides, cobrindo a Apostila 1 por
inteiro:

1. Por que medir — grandezas, unidades do SI, \(M(G)=G/U\)
2. Algarismos significativos — o algarismo duvidoso, zeros, precisão do instrumento
3. Conversão de unidades e notação científica
4. Operações — adição, subtração, multiplicação, divisão, potências, logaritmos,
   funções trigonométricas; fórmulas com uma ou mais medidas diretas
5. Critérios de arredondamento (três casos)
6. Erros experimentais — escala, sistemático, aleatório, com o caso do Hubble
7. Tratamento estatístico — média, desvio médio, desvio padrão, a história da
   distribuição normal, Exemplo 11 completo
8. Erro relativo percentual
9. Propagação de erros — equação do erro indeterminado
10. Exercícios I, II e III

Exemplos resolvidos 1 a 14 da apostila, todos presentes.

### Apresentar

Abra `aulas/aula-01-medidas/` pelo site, ou o arquivo diretamente no navegador.

A navegação é **linear**: um único par de teclas percorre os 124 slides, do
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

## Créditos das imagens

As figuras de instrumentos, réguas e prefixos vêm da Apostila 1 do DFIS/UDESC.
As imagens do Hubble são de uso livre para fins educacionais, com atribuição:

| Arquivo | Crédito | Fonte |
|---|---|---|
| `hubble-orbita.jpg` | NASA (STS-125, 19/05/2009) | [science.nasa.gov](https://science.nasa.gov/image-detail/hubble-space-telescope-hst-7/) |
| `hubble-m100-antes-depois.jpg` | NASA / ESA | [science.nasa.gov](https://science.nasa.gov/image-detail/gpn-2002-000064-crop_hubble_images_of_m100_before_and_after_repair_0-1/) |
| `hubble-estrela-costar.jpg` | NASA, ESA e equipe do COSTAR | [esahubble.org](https://esahubble.org/images/opo9408a/) |
| `gauss-retrato.jpg` | C. A. Jensen, 1840 — domínio público | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Carl_Friedrich_Gauss_1840_by_Jensen.jpg) |

Imagens da NASA são de domínio público; as da ESA/Hubble estão sob
[CC BY 4.0](https://esahubble.org/copyright/).

## Publicação

O GitHub Pages publica direto do branch `main`, a partir da raiz do repositório —
o site é estático e não precisa de etapa de build. Todo push em `main` republica
automaticamente. O arquivo `.nojekyll` impede o Jekyll de processar o conteúdo.
