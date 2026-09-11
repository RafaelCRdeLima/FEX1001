# Laboratórios online

Versão interativa dos roteiros da FEX1001. O aluno preenche as tabelas durante
a experiência e baixa o relatório já em LaTeX, com tabelas, figuras e dados
prontos para compilar no Overleaf.

## Como está organizado

| Arquivo | Papel |
|---|---|
| `lab.css` | folha de estilo compartilhada, herdada do site da disciplina |
| `lab.js` | motor comum: estatística, ajuste de reta, gráfico, escrita de LaTeX/CSV, gravação do pacote e persistência |
| `experiencia-N/index.html` | as tabelas e campos daquela experiência |
| `experiencia-N/lab-experiencia-N.js` | a física daquela experiência: o que se calcula e o que vai para o relatório |
| `../template_relatorio/main.tex` | modelo do relatório das Experiências 2 a 5 |
| `../template_relatorio/main_experiencia1.tex` | modelo próprio da Experiência 1 |

O motor não conhece nenhuma experiência em particular. Para acrescentar uma
nova, basta um `index.html` com as tabelas e um script que descreva os cálculos
e a montagem das seções — o resto vem de `lab.js`.

## O que o aluno recebe

```
main.tex                      modelo preenchido com equipe, integrantes e data
tabelas/tabela1_medidas.tex   dados brutos, com os algarismos que ele digitou
tabelas/tabela2_variaveis.tex
tabelas/tabela3_estatistica.tex   médias, desvio médio e desvio padrão
tabelas/tabela4_linearizada.tex   os pares (x', y') da linearização
secoes/*.tex                  uma por seção do roteiro, com os textos dele
figuras/grafico_linear.png    o gráfico linearizado com a reta ajustada
figuras/fig*.png              as fotos que ele enviou (DCL, esboços, SPARKvue)
dados/*.csv                   os mesmos números em CSV, para reanálise
```

Onde o navegador suporta o seletor de pastas (Chrome, Edge), a árvore é gravada
inteira de uma vez. Onde não suporta (Firefox, Safari), os arquivos são baixados
separadamente com o caminho no nome, e o aluno recria as pastas.

## Requisitos

As páginas precisam ser servidas por HTTP — no GitHub Pages da disciplina ou,
para testar localmente, `python3 -m http.server` na raiz do repositório. Abertas
como arquivo solto (`file://`), o navegador bloqueia a leitura do modelo LaTeX.

O preenchimento fica salvo no `localStorage` do navegador do aluno, por
experiência. O botão "Limpar preenchimento" apaga.

## As experiências e suas linearizações

Cada página lineariza a relação teórica da sua experiência e extrai do
coeficiente angular a grandeza física que o roteiro pede.

| Exp. | Relação | x′ | y′ | Grandeza extraída | Referência |
|---|---|---|---|---|---|
| 2 | a = g·sen θ | sen θ | ā | g = a′ | 9,79061 m/s² |
| 3 | W = ½mv² | v̄² | W̄ | m = 2a′ | 250,00 g |
| 4 | α = (g/R)·[1+I/(MR²)]⁻¹ | 1/M | 1/ᾱ | I = a′gR | M_H L²/12 + 2md² |
| 5 | d = [(L−2x₁)/2]·M/(M₁+M) | M₁ | 1/d̄ | M = b′/a′ | 150,00 g |

As Experiências 4 e 5 linearizam por inversos, e por isso têm um coeficiente
linear com significado físico próprio — R/g e 2/(L−2x₁) — que a página mostra
ao lado do ajuste, como conferência independente.

Na Experiência 5, a massa da régua sai da razão b′/a′, que cancela L e x₁: o
resultado não depende da geometria medida.

## A Experiência 1 é diferente

Ela não lineariza nada e não tem gráfico de reta: o objeto de estudo é a medida
em si. Por isso tem estrutura própria, e um modelo LaTeX só dela, sem as seções
de linearização e gráfico linear que não lhe cabem.

O mesmo objeto é medido com as quatro escalas da régua. A página converte
unidades, calcula perímetro e área em cada escala (inclusive as linhas que
combinam escalas diferentes de propósito), faz a estatística entre as cinco
equipes e propaga o erro até a área por ΔA = L̄·ΔC + C̄·ΔL.

Duas decisões de projeto que valem registro:

- **Os valores digitados nunca são reformatados.** Uma medida de "2" metros não
  vira "2,000". O número de algarismos é o conteúdo da experiência.
- **Os valores calculados saem com cinco algarismos significativos**, e a página
  diz isso ao aluno: arredondar para o número correto continua sendo tarefa
  dele. Imprimir um desvio padrão com seis algarismos numa disciplina sobre
  algarismos significativos seria dar o exemplo errado.

A incerteza que entra na propagação é escolhida por menu — a maior entre erro de
escala e desvio padrão, ou qualquer uma das três isoladamente — porque a
convenção é da disciplina, não do programa. A escolha fica registrada no texto
do relatório.

O gráfico é a comparação da mesma área obtida nas quatro escalas, com a barra de
incerteza de cada uma e a linha de referência: mostra de uma vez que as escalas
concordam, e que o que muda entre elas é o erro, não o valor.

## Estado

As cinco experiências estão completas.
