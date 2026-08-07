# FEX1001 — Física Experimental I

Material didático da disciplina **FEX1001 (Física Experimental I)** — Departamento de Física, CCT/UDESC.

Prof. Rafael C. R. de Lima

## Conteúdo do repositório

### `Aula 1 - Medidas/`
Apresentação em LaTeX/Beamer sobre **Medidas e Algarismos Significativos**, baseada na
*Apostila 1 — Medidas e Algarismos Significativos*.

- `main.tex` — fonte da apresentação (compilar com `pdflatex`)
- `*.png` — figuras usadas nos slides

Tópicos abordados:
- Motivação, grandezas e unidades (SI)
- Algarismos significativos (algarismo duvidoso, zeros)
- Precisão, conversão de unidades e notação científica
- Operações com algarismos significativos (adição, subtração, multiplicação, divisão)
- Critérios de arredondamento
- Erros experimentais e tratamento estatístico (média, desvio médio, desvio padrão)
- Exercícios

### `Apostilas e Relatorios/`
- `apostilas/` — apostilas teóricas da disciplina
  - Apostila 1 — Medidas e Algarismos Significativos
  - Apostila 2 — Gráficos
- `Experiencia 1..5` — roteiros/relatórios das experiências (`.docx` e `.pdf`)
- `Cronograma Geral FEX1001 2025-02` — cronograma da disciplina

## Como compilar a apresentação

```bash
cd "Aula 1 - Medidas"
pdflatex main.tex
pdflatex main.tex   # segunda passagem, para o sumário
```

## Próximos passos

- [ ] Publicar as aulas como site (GitHub Pages) para acesso dos alunos
