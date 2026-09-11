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

## Estado

- **Experiência 2** — completa.
- Experiências 1, 3, 4 e 5 — a fazer. As de 3 a 5 seguem a mesma estrutura de
  dez tarefas da 2 e devem reaproveitar o motor quase sem mudanças; a 1 é
  diferente (medidas em quatro escalas, conversões e propagação de erro).
