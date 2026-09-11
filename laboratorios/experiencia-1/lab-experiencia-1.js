/* FEX1001 — Experiência 1: algarismos significativos, erros e incertezas.
 *
 * A única experiência da disciplina sem gráfico linear. O objeto de estudo é a
 * própria medida: o mesmo objeto é medido com quatro escalas da mesma régua e
 * se acompanha o que acontece com os algarismos significativos, com a conversão
 * de unidades e com o erro que se propaga até a área.
 *
 * Princípio de projeto desta página: os valores digitados pelo aluno NUNCA são
 * reformatados. Uma medida de "2" metros não vira "2,000" — o número de
 * algarismos é o conteúdo da experiência, não um detalhe de apresentação.
 */
(() => {
  "use strict";

  const STORAGE = "fex1001-experiencia-1";
  const TEAMS = [1, 2, 3, 4, 5];

  /** As quatro escalas da régua, com o fator para metros. */
  const SCALES = [
    { key: "m", label: "metro", unit: "m", toM: 1 },
    { key: "dm", label: "decímetro", unit: "dm", toM: 0.1 },
    { key: "cm", label: "centímetro", unit: "cm", toM: 0.01 },
    { key: "mm", label: "milímetro", unit: "mm", toM: 0.001 },
  ];
  const byKey = Object.fromEntries(SCALES.map(s => [s.key, s]));

  /** Converte um valor de uma escala para outra. */
  function convert(value, from, to) {
    if (!Number.isFinite(value)) return NaN;
    return value * (byKey[from].toM / byKey[to].toM);
  }

  const tbody1 = document.querySelector("#tabela1 tbody");
  const tbodyConv = document.querySelector("#tabelaConv tbody");
  const tbodyPer = document.querySelector("#tabelaPerimetro tbody");
  const tbodyArea = document.querySelector("#tabelaArea tbody");
  const tbody3 = document.querySelector("#tabela3 tbody");
  const tbody3b = document.querySelector("#tabela3b tbody");
  const canvas = document.getElementById("grafico");
  const statusEl = document.getElementById("status");

  /* ----------------------------------------------------------- Tabela 1a */

  function buildTable1() {
    tbody1.innerHTML = "";
    TEAMS.forEach(team => {
      const tr = document.createElement("tr");
      tr.dataset.team = String(team);

      const head = document.createElement("td");
      head.className = "fixed";
      head.textContent = `Equipe ${team}`;
      tr.appendChild(head);

      SCALES.forEach(scale => {
        ["C", "L"].forEach(quantity => {
          const td = document.createElement("td");
          td.dataset.eq = String(team);
          const input = document.createElement("input");
          input.type = "text";
          input.dataset.cell = `${quantity}_${scale.key}_${team}`;
          input.placeholder = "—";
          td.appendChild(input);
          tr.appendChild(td);
        });
      });
      tbody1.appendChild(tr);
    });
  }

  function cellInput(quantity, scaleKey, team) {
    return document.querySelector(`[data-cell="${quantity}_${scaleKey}_${team}"]`);
  }

  /** Texto cru digitado, sem qualquer reformatação. */
  function rawValue(quantity, scaleKey, team) {
    const input = cellInput(quantity, scaleKey, team);
    return input ? input.value.trim() : "";
  }

  function numValue(quantity, scaleKey, team) {
    return Lab.parseNum(rawValue(quantity, scaleKey, team));
  }

  function myTeam() {
    return Number(document.getElementById("minhaEquipe").value);
  }

  /** Medida da própria equipe, em cada escala. */
  function mine(quantity, scaleKey) {
    return numValue(quantity, scaleKey, myTeam());
  }

  function highlightTeam() {
    const team = String(myTeam());
    document.querySelectorAll("#tabela1 [data-eq]").forEach(cell => {
      cell.classList.toggle("mine", cell.dataset.eq === team);
    });
  }

  /* ------------------------------------------------------- conversões */

  function renderConversions() {
    tbodyConv.innerHTML = "";
    SCALES.forEach(target => {
      const tr = document.createElement("tr");
      const head = document.createElement("td");
      head.className = "fixed";
      head.textContent = `(${target.unit})`;
      tr.appendChild(head);

      SCALES.forEach(source => {
        ["C", "L"].forEach(quantity => {
          const td = document.createElement("td");
          const converted = convert(mine(quantity, source.key), source.key, target.key);
          td.textContent = Number.isFinite(converted) ? formatMeasure(converted) : "—";
          tr.appendChild(td);
        });
      });
      tbodyConv.appendChild(tr);
    });
  }

  /**
   * Formata um valor derivado sem impor casas decimais fixas: mostra o que é
   * necessário e nada além, para não sugerir precisão inexistente.
   */
  function formatMeasure(value) {
    if (!Number.isFinite(value)) return "—";
    if (value === 0) return "0";
    const abs = Math.abs(value);
    if (abs < 1e-3 || abs >= 1e6) {
      return value.toExponential(4).replace(".", ",");
    }
    // Cinco algarismos significativos — ver a nota em Lab.numTexAuto.
    return String(Number(value.toPrecision(5))).replace(".", ",");
  }

  /* ------------------------------------------- perímetro e área (Tab. 2) */

  /** Linhas da Tabela 2a: cada uma soma C e L medidos nas escalas indicadas. */
  const PERIMETER_ROWS = [
    { label: "C[m] + C[m] + L[m] + L[m]", terms: [["C", "m"], ["C", "m"], ["L", "m"], ["L", "m"]] },
    { label: "C[dm] + C[dm] + L[dm] + L[dm]", terms: [["C", "dm"], ["C", "dm"], ["L", "dm"], ["L", "dm"]] },
    { label: "C[cm] + C[cm] + L[cm] + L[cm]", terms: [["C", "cm"], ["C", "cm"], ["L", "cm"], ["L", "cm"]] },
    { label: "C[mm] + C[mm] + L[mm] + L[mm]", terms: [["C", "mm"], ["C", "mm"], ["L", "mm"], ["L", "mm"]] },
    { label: "C[m] + C[dm] + L[cm] + L[mm]", terms: [["C", "m"], ["C", "dm"], ["L", "cm"], ["L", "mm"]] },
  ];

  /** Linhas da Tabela 2b: produto de C por L, nas escalas indicadas. */
  const AREA_ROWS = [
    { label: "C[m] × L[m]", c: "m", l: "m" },
    { label: "C[dm] × L[dm]", c: "dm", l: "dm" },
    { label: "C[cm] × L[cm]", c: "cm", l: "cm" },
    { label: "C[mm] × L[mm]", c: "mm", l: "mm" },
    { label: "C[dm] × L[cm]", c: "dm", l: "cm" },
  ];

  /** Perímetro de uma linha, expresso na unidade pedida. */
  function perimeterIn(row, targetKey) {
    let total = 0;
    for (const [quantity, scaleKey] of row.terms) {
      const value = convert(mine(quantity, scaleKey), scaleKey, targetKey);
      if (!Number.isFinite(value)) return NaN;
      total += value;
    }
    return total;
  }

  /** Área de uma linha, expressa na unidade pedida ao quadrado. */
  function areaIn(row, targetKey) {
    const c = convert(mine("C", row.c), row.c, targetKey);
    const l = convert(mine("L", row.l), row.l, targetKey);
    return Number.isFinite(c) && Number.isFinite(l) ? c * l : NaN;
  }

  function renderIndirect() {
    tbodyPer.innerHTML = "";
    PERIMETER_ROWS.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="fixed">${row.label}</td>` +
        SCALES.map(s => `<td>${formatMeasure(perimeterIn(row, s.key))}</td>`).join("");
      tbodyPer.appendChild(tr);
    });

    tbodyArea.innerHTML = "";
    AREA_ROWS.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="fixed">${row.label}</td>` +
        SCALES.map(s => `<td>${formatMeasure(areaIn(row, s.key))}</td>`).join("");
      tbodyArea.appendChild(tr);
    });
  }

  /* ------------------------------------------------ estatística (Tab. 3) */

  function scaleError(scaleKey) {
    return Lab.parseNum(document.getElementById(`errEsc_${scaleKey}`).value);
  }

  /** Estatística de C e L numa escala, sobre as medidas das cinco equipes. */
  function statsFor(scaleKey) {
    const stat = {};
    ["C", "L"].forEach(quantity => {
      const values = TEAMS.map(t => numValue(quantity, scaleKey, t)).filter(Number.isFinite);
      stat[quantity] = {
        mean: Lab.mean(values),
        meanDev: Lab.meanDeviation(values),
        std: Lab.stdDev(values),
        n: values.length,
      };
    });
    return stat;
  }

  /** Incerteza adotada para propagar, conforme o critério escolhido. */
  function uncertainty(stat, scaleKey) {
    const criterion = document.getElementById("criterio").value;
    const esc = scaleError(scaleKey);
    const { std, meanDev } = stat;
    switch (criterion) {
      case "escala": return esc;
      case "padrao": return std;
      case "medio": return meanDev;
      default: {
        const candidates = [esc, std].filter(Number.isFinite);
        return candidates.length ? Math.max(...candidates) : NaN;
      }
    }
  }

  function criterionLabel() {
    const select = document.getElementById("criterio");
    return select.options[select.selectedIndex].text;
  }

  /** Área de referência, convertida para a unidade de cada escala. */
  function referenceArea(targetKey) {
    const cv = Lab.parseNum(document.getElementById("cRefV").value);
    const lv = Lab.parseNum(document.getElementById("lRefV").value);
    const ce = Lab.parseNum(document.getElementById("cRefE").value);
    const le = Lab.parseNum(document.getElementById("lRefE").value);
    const cu = document.getElementById("cRefU").value;
    const lu = document.getElementById("lRefU").value;
    if (!Number.isFinite(cv) || !Number.isFinite(lv)) return { area: NaN, error: NaN };

    const c = convert(cv, cu, targetKey);
    const l = convert(lv, lu, targetKey);
    const dc = Number.isFinite(ce) ? convert(ce, cu, targetKey) : 0;
    const dl = Number.isFinite(le) ? convert(le, lu, targetKey) : 0;
    // Propagação conservadora para o produto: ΔA = L·ΔC + C·ΔL.
    return { area: c * l, error: l * dc + c * dl };
  }

  /** Tudo o que as linhas e) a j) da Tabela 3 precisam, por escala. */
  function areaAnalysis() {
    return SCALES.map(scale => {
      const stat = statsFor(scale.key);
      const meanC = stat.C.mean;
      const meanL = stat.L.mean;
      const dC = uncertainty(stat.C, scale.key);
      const dL = uncertainty(stat.L, scale.key);

      const measured = Number.isFinite(meanC) && Number.isFinite(meanL) ? meanC * meanL : NaN;
      const measuredError = Number.isFinite(measured) && Number.isFinite(dC) && Number.isFinite(dL)
        ? meanL * dC + meanC * dL : NaN;

      const ref = referenceArea(scale.key);

      return {
        scale, stat, meanC, meanL, dC, dL,
        measured, measuredError,
        reference: ref.area, referenceError: ref.error,
        // i) erro percentual: quanto a área medida se afasta da referência
        percentError: Lab.percentError(measured, ref.area),
        // j) erro relativo percentual: a incerteza propagada, como fração do valor
        relativeError: Number.isFinite(measured) && measured !== 0 && Number.isFinite(measuredError)
          ? Math.abs(measuredError / measured) * 100 : NaN,
      };
    });
  }

  function renderStats() {
    const rows = [
      { label: "a) ΔE_Esc", get: (scale) => {
          const e = scaleError(scale.key);
          return Number.isFinite(e) ? formatMeasure(e) : "—";
        }, sameForBoth: true },
      { label: "b) C̄, L̄", get: (scale, q) => formatMeasure(statsFor(scale.key)[q].mean) },
      { label: "c) ΔC̄, ΔL̄", get: (scale, q) => formatMeasure(statsFor(scale.key)[q].meanDev) },
      { label: "d) σ_C, σ_L", get: (scale, q) => formatMeasure(statsFor(scale.key)[q].std) },
    ];

    tbody3.innerHTML = "";
    rows.forEach(row => {
      const tr = document.createElement("tr");
      let html = `<td class="fixed">${row.label}</td>`;
      SCALES.forEach(scale => {
        ["C", "L"].forEach(q => {
          html += `<td>${row.sameForBoth ? row.get(scale) : row.get(scale, q)}</td>`;
        });
      });
      tr.innerHTML = html;
      tbody3.appendChild(tr);
    });
  }

  function renderAreas(analysis) {
    const lines = [
      { label: "e) A_M", pick: a => a.measured },
      { label: "f) A_R", pick: a => a.reference },
      { label: "g) ΔA_M", pick: a => a.measuredError },
      { label: "h) ΔA_R", pick: a => a.referenceError },
      { label: "i) E (%)", pick: a => a.percentError, suffix: " %" },
      { label: "j) E_r (%)", pick: a => a.relativeError, suffix: " %" },
    ];
    tbody3b.innerHTML = "";
    lines.forEach(line => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="fixed">${line.label}</td>` + analysis.map(a => {
        const v = line.pick(a);
        return `<td>${Number.isFinite(v) ? formatMeasure(v) + (line.suffix || "") : "—"}</td>`;
      }).join("");
      tbody3b.appendChild(tr);
    });
  }

  /* ------------------------------------------------------------ gráfico */

  function renderChart(analysis) {
    // Comparação feita em m², para que as quatro escalas fiquem no mesmo eixo.
    const items = analysis.map(a => {
      const factor = Math.pow(a.scale.toM, 2);
      return {
        label: a.scale.unit,
        value: Number.isFinite(a.measured) ? a.measured * factor : NaN,
        error: Number.isFinite(a.measuredError) ? a.measuredError * factor : NaN,
      };
    });
    const ref = referenceArea("m").area;

    Lab.drawScaleComparison(canvas, {
      items,
      reference: ref,
      labelY: "área medida A_M (m²)",
      title: "A mesma área, medida com as quatro escalas da régua",
      logScale: false,
    });

    const usable = items.filter(i => Number.isFinite(i.value));
    const readout = document.getElementById("graficoReadout");
    if (!usable.length) {
      readout.textContent = "Preencha a Tabela 1a para ver a comparação entre as escalas.";
      return;
    }
    const compatible = Number.isFinite(ref)
      ? usable.filter(i => Number.isFinite(i.error) && Math.abs(i.value - ref) <= i.error).length
      : null;
    readout.textContent = compatible === null
      ? `${usable.length} escala(s) com área calculada. Informe C_R e L_R para comparar com a referência.`
      : `${compatible} de ${usable.length} escalas concordam com a referência dentro da própria incerteza.`;
  }

  /* ------------------------------------------------------------ refresh */

  function refresh() {
    highlightTeam();
    renderConversions();
    renderIndirect();
    renderStats();
    const analysis = areaAnalysis();
    renderAreas(analysis);
    renderChart(analysis);
    return analysis;
  }

  /* --------------------------------------------------------- construção */

  function value(id) { return (document.getElementById(id).value || "").trim(); }

  function buildTables(analysis) {
    // Tabela 1a preserva exatamente o que foi digitado.
    const tabela1 = Lab.latexTable({
      caption: "Medidas diretas do comprimento $C$ e da largura $L$ realizadas por cada equipe, " +
               "nas unidades de cada escala da régua.",
      label: "medidas", align: "l" + "rr".repeat(4), compact: true,
      columns: ["Equipe"].concat(SCALES.flatMap(s => [`$C$ (${s.unit})`, `$L$ (${s.unit})`])),
      rows: TEAMS.map(team => [`Equipe ${team}`].concat(
        SCALES.flatMap(s => [Lab.rawCell(rawValue("C", s.key, team)), Lab.rawCell(rawValue("L", s.key, team))]))),
    });

    const tabela1conv = Lab.latexTable({
      caption: `Medidas da equipe ${Lab.latexEscape(String(myTeam()))} convertidas para cada unidade.`,
      label: "conversoes", align: "l" + "rr".repeat(4), compact: true,
      columns: ["Expresso em"].concat(SCALES.flatMap(s => [`$C$ [${s.unit}]`, `$L$ [${s.unit}]`])),
      rows: SCALES.map(target => [`(${target.unit})`].concat(
        SCALES.flatMap(source => ["C", "L"].map(q =>
          Lab.numTexAuto(convert(mine(q, source.key), source.key, target.key)))))),
    });

    const tabela2per = Lab.latexTable({
      caption: "Perímetro $P = C + C + L + L$ calculado com as medidas da equipe nas escalas " +
               "indicadas, expresso em cada unidade.",
      label: "perimetro", align: "lrrrr", compact: true,
      columns: ["Cálculo"].concat(SCALES.map(s => `(${s.unit})`)),
      rows: PERIMETER_ROWS.map(row => [Lab.latexEscape(row.label)].concat(
        SCALES.map(s => Lab.numTexAuto(perimeterIn(row, s.key))))),
    });

    const tabela2area = Lab.latexTable({
      caption: "Área $A = C \\times L$ calculada com as medidas da equipe nas escalas indicadas.",
      label: "area", align: "lrrrr", compact: true,
      columns: ["Cálculo"].concat(SCALES.map(s => `(${s.unit}$^2$)`)),
      rows: AREA_ROWS.map(row => [Lab.latexEscape(row.label)].concat(
        SCALES.map(s => Lab.numTexAuto(areaIn(row, s.key))))),
    });

    const statRows = [
      ["a) $\\Delta E_{\\mathrm{Esc}}$", scale => Lab.numTexAuto(scaleError(scale.key)), true],
      ["b) $\\bar{C}$, $\\bar{L}$", (scale, q) => Lab.numTexAuto(statsFor(scale.key)[q].mean)],
      ["c) $\\overline{\\Delta C}$, $\\overline{\\Delta L}$", (scale, q) => Lab.numTexAuto(statsFor(scale.key)[q].meanDev)],
      ["d) $\\sigma_C$, $\\sigma_L$", (scale, q) => Lab.numTexAuto(statsFor(scale.key)[q].std)],
    ];
    const tabela3 = Lab.latexTable({
      caption: "Erro de escala e estatística das medidas das cinco equipes, por escala.",
      label: "estatistica", align: "l" + "rr".repeat(4), compact: true,
      columns: [""].concat(SCALES.flatMap(s => [`$C$ (${s.unit})`, `$L$ (${s.unit})`])),
      rows: statRows.map(([label, get, both]) => [label].concat(
        SCALES.flatMap(scale => both ? [get(scale), get(scale)] : ["C", "L"].map(q => get(scale, q))))),
    });

    const areaRows = [
      ["e) $A_M$", a => a.measured],
      ["f) $A_R$", a => a.reference],
      ["g) $\\Delta A_M$", a => a.measuredError],
      ["h) $\\Delta A_R$", a => a.referenceError],
      ["i) $E$ (\\%)", a => a.percentError],
      ["j) $E_r$ (\\%)", a => a.relativeError],
    ];
    const tabela3b = Lab.latexTable({
      caption: "Área medida, área de referência, erros propagados e erros percentuais, por escala.",
      label: "areas", align: "lrrrr", compact: true,
      columns: [""].concat(SCALES.map(s => `(${s.unit}$^2$)`)),
      rows: areaRows.map(([label, pick]) => [label].concat(analysis.map(a => Lab.numTexAuto(pick(a))))),
    });

    return { tabela1, tabela1conv, tabela2per, tabela2area, tabela3, tabela3b };
  }

  function buildSections(analysis) {
    const objeto = value("objeto") || "objeto retangular escolhido pelo docente";

    const medidasDiretas =
      `O comprimento $C$ e a largura $L$ do ${Lab.latexEscape(objeto)} foram medidos com as ` +
      "quatro escalas da mesma régua --- metro, decímetro, centímetro e milímetro --- cada uma " +
      "registrada na sua própria unidade. As medidas foram compartilhadas entre as cinco " +
      "equipes, com revisão dos casos em que houve divergência no número de algarismos " +
      "significativos. A Tabela~\\ref{tab:conversoes} traz as medidas da equipe convertidas " +
      "para cada unidade; note que a conversão não acrescenta informação à medida, apenas " +
      "reescreve o mesmo valor em outra unidade.\n";

    const medidasIndiretas =
      "O perímetro e a área foram calculados a partir das medidas da própria equipe. As " +
      "últimas linhas das Tabelas~\\ref{tab:perimetro} e~\\ref{tab:area} combinam " +
      "deliberadamente escalas diferentes, de modo que o resultado fica limitado pela medida " +
      "menos precisa que entra na conta.\n";

    const criterio = criterionLabel();
    const teoriaErros = [
      "O erro de escala de cada régua foi determinado a partir da sua menor divisão. A média, " +
      "o desvio médio e o desvio padrão de $C$ e $L$ foram calculados sobre as medidas das " +
      "cinco equipes, escala a escala.",
      "",
      "A área medida é $A_M = \\bar{C}\\,\\bar{L}$, e a de referência " +
      "$A_R = C_R L_R$, com $C_R$ e $L_R$ fornecidos pelo docente. Para o produto de duas " +
      "grandezas independentes, a propagação conservadora do erro é",
      "",
      "\\begin{equation}",
      "\\Delta A = \\bar{L}\\,\\Delta C + \\bar{C}\\,\\Delta L.",
      "\\label{eq:propagacao}",
      "\\end{equation}",
      "",
      `A incerteza adotada para $\\Delta C$ e $\\Delta L$ foi ${Lab.latexEscape(criterio)}.`,
      "",
      "O erro percentual compara a área medida com a de referência, " +
      "$E = |A_M - A_R|/A_R \\times 100$, enquanto o erro relativo percentual exprime a " +
      "incerteza propagada como fração do próprio valor medido, " +
      "$E_r = \\Delta A_M / A_M \\times 100$.",
      "",
    ].join("\n");

    const analise = [
      Lab.latexFigure({
        file: "figuras/comparacao_escalas.png",
        caption: "A mesma área, obtida com as quatro escalas da régua, com a incerteza propagada " +
                 "de cada uma e a área de referência.",
        label: "escalas",
      }),
      "",
      Lab.latexText(value("analiseTexto"),
        "% As quatro escalas concordam dentro da própria incerteza? O que muda entre elas: o\n" +
        "% valor medido ou o erro? A conversão de unidades cria algarismos significativos que a\n" +
        "% medida não tinha?"),
      "",
    ].join("\n");

    return {
      objetivo: "Medir e utilizar conceitos de algarismos significativos, transformação de " +
                "unidades, notação científica, critérios de arredondamento e operações com " +
                "algarismos significativos.\n",
      medidasDiretas, medidasIndiretas, teoriaErros, analise,
      conclusoes: Lab.latexText(value("concTexto"),
        "% Faça a síntese dos resultados. O objetivo foi alcançado?"),
    };
  }

  function buildCsv(analysis) {
    const medidas = [["equipe"].concat(SCALES.flatMap(s => [`C_${s.unit}`, `L_${s.unit}`]))];
    TEAMS.forEach(team => medidas.push([team].concat(
      SCALES.flatMap(s => [rawValue("C", s.key, team), rawValue("L", s.key, team)]))));

    const cell = v => Number.isFinite(v) ? v.toPrecision(8) : "";
    const areas = [["escala", "C_media", "L_media", "incerteza_C", "incerteza_L",
      "A_medida", "erro_A_medida", "A_referencia", "erro_A_referencia",
      "erro_percentual", "erro_relativo_percentual"]];
    analysis.forEach(a => areas.push([
      a.scale.unit, cell(a.meanC), cell(a.meanL), cell(a.dC), cell(a.dL),
      cell(a.measured), cell(a.measuredError), cell(a.reference), cell(a.referenceError),
      cell(a.percentError), cell(a.relativeError),
    ]));

    return { medidas, areas };
  }

  async function generate() {
    const setStatus = (text, kind = "busy") => {
      statusEl.textContent = text;
      statusEl.className = `status ${kind}`;
    };

    const equipe = value("equipe");
    const integrantes = value("integrantes");
    if (!equipe || !integrantes) {
      setStatus("Preencha o número da bancada e os nomes dos integrantes antes de gerar.", "err");
      return;
    }

    try {
      setStatus("Montando o pacote do relatório...");
      const analysis = refresh();

      const template = await Lab.fetchText("../../template_relatorio/main_experiencia1.tex");
      const mainTex = Lab.fillTemplate(template, {
        titulo: "Experiência 1 --- Algarismos significativos, teoria de erros e incertezas",
        subtitulo: "Roteiro/Relatório de Física Experimental I",
        equipe, integrantes,
        data: Lab.dateBR(value("dataExp")),
      });

      const tables = buildTables(analysis);
      const sections = buildSections(analysis);
      const csv = buildCsv(analysis);

      const files = [
        { name: "main.tex", blob: Lab.textBlob(mainTex) },
        { name: "tabelas/tabela1_medidas.tex", blob: Lab.textBlob(tables.tabela1) },
        { name: "tabelas/tabela1_conversoes.tex", blob: Lab.textBlob(tables.tabela1conv) },
        { name: "tabelas/tabela2_perimetro.tex", blob: Lab.textBlob(tables.tabela2per) },
        { name: "tabelas/tabela2_area.tex", blob: Lab.textBlob(tables.tabela2area) },
        { name: "tabelas/tabela3_estatistica.tex", blob: Lab.textBlob(tables.tabela3) },
        { name: "tabelas/tabela3_areas.tex", blob: Lab.textBlob(tables.tabela3b) },
        { name: "secoes/objetivo.tex", blob: Lab.textBlob(sections.objetivo) },
        { name: "secoes/medidas_diretas.tex", blob: Lab.textBlob(sections.medidasDiretas) },
        { name: "secoes/medidas_indiretas.tex", blob: Lab.textBlob(sections.medidasIndiretas) },
        { name: "secoes/teoria_erros.tex", blob: Lab.textBlob(sections.teoriaErros) },
        { name: "secoes/analise.tex", blob: Lab.textBlob(sections.analise) },
        { name: "secoes/conclusoes.tex", blob: Lab.textBlob(sections.conclusoes) },
        { name: "dados/medidas.csv", blob: Lab.textBlob(Lab.toCsv(csv.medidas)) },
        { name: "dados/areas.csv", blob: Lab.textBlob(Lab.toCsv(csv.areas)) },
        { name: "figuras/comparacao_escalas.png", blob: await Lab.canvasBlob(canvas) },
      ];

      setStatus(await Lab.saveFiles(files), "ok");
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Geração cancelada.", "busy");
        return;
      }
      console.error(error);
      setStatus("Não foi possível gerar o relatório. A página precisa estar sendo servida por " +
        "HTTP (no site da disciplina ou por um servidor local), não aberta como arquivo solto.", "err");
    }
  }

  /* ------------------------------------------------------------- início */

  buildTable1();

  const store = Lab.bindPersistence(STORAGE, {
    collect: () => ({
      celulas: Object.fromEntries(
        Array.from(document.querySelectorAll("[data-cell]")).map(i => [i.dataset.cell, i.value])),
    }),
  });

  const restored = store.restore();
  if (restored && restored.celulas) {
    Object.entries(restored.celulas).forEach(([key, val]) => {
      const input = document.querySelector(`[data-cell="${key}"]`);
      if (input) input.value = val;
    });
  }

  document.getElementById("gerar").addEventListener("click", generate);
  document.getElementById("limpar").addEventListener("click", () => {
    if (!confirm("Isto apaga todo o preenchimento desta experiência neste navegador. Continuar?")) return;
    store.clear();
    location.reload();
  });

  document.addEventListener("input", () => { refresh(); store.save(); });
  document.addEventListener("change", () => { refresh(); store.save(); });

  refresh();
})();
