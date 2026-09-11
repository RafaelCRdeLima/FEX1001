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
| `../template_relatorio/main.tex` | o modelo do relatório, comum a todas |

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

## Estado

- **Experiências 2, 3, 4 e 5** — completas.
- **Experiência 1** — a fazer. É a única que foge da estrutura de dez tarefas:
  mede em quatro escalas, converte unidades e propaga erro, com tabelas
  compartilhadas entre as cinco equipes.
