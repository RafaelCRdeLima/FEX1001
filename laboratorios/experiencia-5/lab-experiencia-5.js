/* FEX1001 — Experiência 5: equilíbrio de corpos rígidos, alavanca de Arquimedes.
 *
 * Relação investigada: d = [(L - 2x1)/2] M/(M1 + M). Invertendo,
 *
 *     1/d = [2/(M(L - 2x1))] M1 + 2/(L - 2x1),
 *
 * que é uma reta em M1. A razão entre os coeficientes devolve a massa da
 * régua, M = b'/a', sem depender de L nem de x1 — o que torna o resultado
 * independente da geometria medida.
 *
 * Unidades: M1 em gramas e d em centímetros ao longo de todo o cálculo, de
 * modo que M = b'/a' já sai em gramas.
 */
(() => {
  "use strict";

  const M_REGUA_G = 150.00;   // g, massa de referência da régua
  const L_CM = 100.00;        // cm, comprimento da régua
  const M_SUPORTE_G = 10.00;  // g, massa do suporte
  const STORAGE = "fex1001-experiencia-5";
  const DEFAULT_M1 = [0, 10, 20, 30, 50];   // g penduradas no suporte

  const tbody1 = document.querySelector("#tabela1 tbody");
  const tbody3 = document.querySelector("#tabela3 tbody");
  const tbody4 = document.querySelector("#tabela4 tbody");
  const canvas = document.getElementById("grafico");
  const statusEl = document.getElementById("status");

  const table = Lab.teamTable({
    tbody: tbody1,
    series: [{ key: "d", placeholder: "0,00" }],
    lead: [
      { key: "m1", placeholder: "0,00" },
      { key: "M1", derived: true },
    ],
    onChange: () => { refresh(); store.save(); },
  });

  const uploads = Lab.bindUploads();

  /* ---------------------------------------------------------- grandezas */

  function statistics() {
    return table.read()
      .filter(row => Number.isFinite(row.lead.m1))
      .map(row => {
        const combined = M_SUPORTE_G + row.lead.m1;       // M1 = m + m1
        table.setDerived(row.element, "M1", Lab.fmt(combined, 2));
        const values = row.series.d.filter(Number.isFinite);
        const mean = Lab.mean(values);
        return {
          m1: row.lead.m1,
          M1: combined,
          mean,
          dev: Lab.meanDeviation(values),
          std: Lab.stdDev(values),
          n: values.length,
          x: combined,
          y: Number.isFinite(mean) && mean !== 0 ? 1 / mean : NaN,
        };
      });
  }

  function fitFromStats(stats) {
    return Lab.linearFit(stats.map(s => ({ x: s.x, y: s.y })));
  }

  /** M = b'/a', em gramas. */
  function massFromCoefficients(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return NaN;
    return b / a;
  }

  /** b' esperado = 2/(L - 2x1), em 1/cm. */
  function expectedIntercept() {
    const x1 = Lab.parseNum(document.getElementById("posX1").value);
    if (!Number.isFinite(x1)) return NaN;
    const span = L_CM - 2 * x1;
    return span !== 0 ? 2 / span : NaN;
  }

  /* ------------------------------------------------------------- render */

  function renderStats(stats) {
    tbody3.innerHTML = "";
    if (!stats.length) {
      tbody3.innerHTML = '<tr><td colspan="5" class="empty">Preencha ao menos uma massa na Tabela 1.</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${Lab.fmt(s.M1, 2)}</td>` +
        `<td>${Lab.fmt(s.mean, 2)}</td>` +
        `<td>${Lab.fmt(s.dev, 2)}</td>` +
        `<td>${Lab.fmt(s.std, 2)}</td>` +
        `<td>${s.n || "—"}</td>`;
      tbody3.appendChild(tr);
    });
  }

  function renderLinearized(stats) {
    document.getElementById("th4x").textContent =
      `x′ = ${document.getElementById("labelX").value || "M₁ (g)"}`;
    document.getElementById("th4y").textContent =
      `y′ = ${document.getElementById("labelY").value || "1/d̄ (1/cm)"}`;
    tbody4.innerHTML = "";
    if (!stats.length) {
      tbody4.innerHTML = '<tr><td colspan="2" class="empty">—</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${Lab.fmt(s.x, 2)}</td><td>${Lab.fmt(s.y, 5)}</td>`;
      tbody4.appendChild(tr);
    });
  }

  function renderChart(stats, fit) {
    Lab.drawChart(canvas, {
      points: stats.map(s => ({ x: s.x, y: s.y })),
      fit,
      labelX: document.getElementById("labelX").value || "M₁ (g)",
      labelY: document.getElementById("labelY").value || "1/d̄ (1/cm)",
      title: "Inverso da distância de equilíbrio contra a massa do contrapeso",
    });
    const readout = document.getElementById("fitReadout");
    if (!fit) {
      readout.textContent = "São necessárias ao menos duas massas com medidas para ajustar a reta.";
      return;
    }
    const unc = Number.isFinite(fit.sigmaA) ? ` ± ${Lab.fmt(fit.sigmaA, 6)}` : "";
    readout.textContent =
      `Mínimos quadrados (n = ${fit.n}): a′ = ${Lab.fmt(fit.a, 6)}${unc} 1/(g·cm)  ·  ` +
      `b′ = ${Lab.fmt(fit.b, 5)} 1/cm` +
      (Number.isFinite(fit.r2) ? `  ·  R² = ${Lab.fmt(fit.r2, 5)}` : "");
  }

  function renderResults(fit) {
    const mass = fit ? massFromCoefficients(fit.a, fit.b) : NaN;
    const bExp = expectedIntercept();
    document.getElementById("mFit").textContent =
      Number.isFinite(mass) ? `${Lab.fmt(mass, 2)} g` : "—";
    document.getElementById("mErro").textContent =
      Number.isFinite(mass) ? `${Lab.fmt(Lab.percentError(mass, M_REGUA_G), 2)} %` : "—";
    document.getElementById("bEsperado").textContent =
      Number.isFinite(bExp) ? `${Lab.fmt(bExp, 5)} 1/cm` : "informe x₁";
  }

  function renderReadPoints() {
    const get = key => Lab.parseNum(document.querySelector(`[data-p="${key}"]`).value);
    const read = n => ({ label: `P${n}`, x: get(`p${n}x`), y: get(`p${n}y`) });
    const marked = [1, 2, 3].map(read).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    const [p1, p2] = [read(1), read(2)];
    const el = document.getElementById("pontosReadout");

    if (![p1.x, p1.y, p2.x, p2.y].every(Number.isFinite) || p2.x === p1.x) {
      el.textContent = "Coeficientes por P₁ e P₂: preencha os dois pontos com x′ diferentes.";
      return marked.length ? { marked } : null;
    }
    const a = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - a * p1.x;
    const mass = massFromCoefficients(a, b);
    el.textContent =
      `Pelos pontos lidos: a′ = ${Lab.fmt(a, 6)}  ·  b′ = ${Lab.fmt(b, 5)}  ·  ` +
      `M = b′/a′ = ${Lab.fmt(mass, 2)} g  ·  erro: ${Lab.fmt(Lab.percentError(mass, M_REGUA_G), 2)} %`;
    return { a, b, marked };
  }

  function refresh() {
    table.highlight(document.getElementById("minhaEquipe").value);
    const stats = statistics();
    const fit = fitFromStats(stats);
    renderStats(stats);
    renderLinearized(stats);
    renderChart(stats, fit);
    renderResults(fit);
    renderReadPoints();
    return { stats, fit };
  }

  /* --------------------------------------------------------- construção */

  function value(id) { return (document.getElementById(id).value || "").trim(); }

  function buildTables(stats) {
    const rows1 = table.read().map(row => {
      const m1 = Lab.parseNum(row.raw.m1);
      return [
        Lab.rawCell(row.raw.m1),
        Number.isFinite(m1) ? Lab.numTex(M_SUPORTE_G + m1, 2) : "--",
        ...[1, 2, 3, 4, 5].map(t => Lab.rawCell(row.raw[`d${t}`])),
      ];
    }).filter(cells => cells.some(c => c !== "--"));

    const tabela1 = Lab.latexTable({
      caption: "Distância de equilíbrio medida por cada equipe, em função da massa do contrapeso.",
      label: "medidas", align: "rrrrrrr",
      columns: ["$m_1$ (\\si{\\gram})", "$M_1$ (\\si{\\gram})"]
        .concat([1, 2, 3, 4, 5].map(t => `$d_${t}$`)),
      rows: rows1.length ? rows1 : [Array(7).fill("--")],
    });

    const tabela2 = Lab.latexTable({
      caption: "Identificação das variáveis do experimento.",
      label: "variaveis", align: "ll",
      columns: ["Quantidade física", "Variável"],
      rows: [
        [Lab.latexEscape(value("varIndep") || "--"), "Independente"],
        [Lab.latexEscape(value("varDep") || "--"), "Dependente"],
      ],
    });

    const tabela3 = Lab.latexTable({
      caption: "Média, desvio médio e desvio padrão da distância de equilíbrio.",
      label: "estatistica", align: "rrrrr",
      columns: [
        "$M_1$ (\\si{\\gram})", "$\\bar{d}$ (\\si{\\centi\\meter})",
        "$\\overline{\\Delta d}$ (\\si{\\centi\\meter})",
        "$\\sigma_d$ (\\si{\\centi\\meter})", "$n$",
      ],
      rows: stats.length ? stats.map(s => [
        Lab.numTex(s.M1, 2), Lab.numTex(s.mean, 2),
        Lab.numTex(s.dev, 2), Lab.numTex(s.std, 2), String(s.n || "--"),
      ]) : [Array(5).fill("--")],
    });

    const tabela4 = Lab.latexTable({
      caption: `Pares linearizados segundo as relações (2): $x' = ${Lab.latexEscape(value("relX") || "M_1")}$, $y' = ${Lab.latexEscape(value("relY") || "1/\\bar{d}")}$.`,
      label: "linearizada", align: "rr",
      columns: [
        `$x'$ (${Lab.latexEscape(value("labelX") || "--")})`,
        `$y'$ (${Lab.latexEscape(value("labelY") || "--")})`,
      ],
      rows: stats.length ? stats.map(s => [Lab.numTex(s.x, 2), Lab.numTex(s.y, 5)]) : [["--", "--"]],
    });

    return { tabela1, tabela2, tabela3, tabela4 };
  }

  function buildSections(stats, fit, readPoints) {
    const fig = (slot, caption, label) => Lab.optionalFigure(uploads, slot, caption, label);
    const x1 = value("posX1") || "--";

    const observacoes = [
      "\\paragraph{Ao mover o suporte para a região central.} " +
      Lab.latexText(value("obsA"), "% Para que lado pende?"),
      "",
      "\\paragraph{Ao pendurar \\SI{50}{\\gram} no suporte.} " +
      Lab.latexText(value("obsB"), "% Para que lado pende?"),
      "",
    ].join("\n");

    const experimentos =
      `Com o suporte fixado na posição $x_1 = \\SI{${x1.replace(",", ".")}}{\\centi\\meter}$ a ` +
      "partir da marca ``0 cm\'\', a alavanca foi equilibrada na horizontal ajustando a " +
      "distância $d$ entre o contrapeso e o pivô. A cada etapa foram acrescentados " +
      "\\SI{10.00}{\\gram} ao suporte, cuja massa combinada é $M_1 = m + m_1$, com " +
      `$m = \\SI{${M_SUPORTE_G.toFixed(2)}}{\\gram}$. A régua tem comprimento ` +
      `$L = \\SI{${L_CM.toFixed(2)}}{\\centi\\meter}$.\n`;

    const teoria = [
      "Impondo o equilíbrio de torques em torno do pivô, com o peso da régua homogênea " +
      "aplicado em seu centro geométrico, obtém-se a distância necessária para o equilíbrio",
      "",
      "\\begin{equation}",
      "d = \\left(\\frac{L - 2x_1}{2}\\right)\\left(\\frac{M}{M_1 + M}\\right),",
      "\\label{eq:alavanca}",
      "\\end{equation}",
      "",
      "onde $L$ é o comprimento da régua, $x_1$ a posição do contrapeso a partir da " +
      "extremidade onde começa a escala e $M$ a massa da régua.",
      "",
      fig("figDCL", "Diagrama de corpo livre da alavanca.", "dcl"),
      "",
      Lab.latexText(value("teoriaTexto"), "% Apresente a demonstração da equação (1)."),
      "",
    ].join("\n");

    const linearizacao = [
      Lab.latexText(value("linTexto"),
        "% Linearize a equação (1) e compare com a equação da reta."),
      "",
      "Invertendo a equação (\\ref{eq:alavanca}),",
      "",
      "\\begin{equation}",
      "\\frac{1}{d} = \\frac{2}{M(L - 2x_1)}\\,M_1 + \\frac{2}{L - 2x_1},",
      "\\end{equation}",
      "",
      "que é linear em $M_1$. Comparando com $y' = a'x' + b'$,",
      "",
      "\\begin{equation}",
      "\\begin{aligned}",
      `x' &= ${Lab.latexEscape(value("relX") || "\\ldots")}, \\\\`,
      `y' &= ${Lab.latexEscape(value("relY") || "\\ldots")}, \\\\`,
      `a' &= ${Lab.latexEscape(value("relA") || "\\ldots")}, \\\\`,
      `b' &= ${Lab.latexEscape(value("relB") || "\\ldots")}.`,
      "\\end{aligned}",
      "\\label{eq:relacoes}",
      "\\end{equation}",
      "",
      "A razão entre os coeficientes elimina $L$ e $x_1$, de modo que $M = b'/a'$ não " +
      "depende da geometria medida.",
      "",
    ].join("\n");

    const grafico = [Lab.latexFigure({
      file: "figuras/grafico_linear.png",
      caption: "Gráfico linearizado dos pares da Tabela~\\ref{tab:linearizada}, com a reta ajustada por mínimos quadrados.",
      label: "linear",
    })];
    if (readPoints && readPoints.marked && readPoints.marked.length) {
      grafico.push(Lab.latexTable({
        caption: "Pontos lidos sobre a reta traçada no papel milimetrado.",
        label: "pontos", align: "lrr",
        columns: ["Ponto", "$x'$", "$y'$"],
        rows: readPoints.marked.map(p => [p.label, Lab.numTex(p.x, 2), Lab.numTex(p.y, 5)]),
      }));
    }
    if (readPoints && Number.isFinite(readPoints.a)) {
      grafico.push(
        "Pelos pontos $P_1$ e $P_2$,",
        "",
        "\\begin{equation}",
        `a' = ${Lab.fmtTex(readPoints.a, 6)}, \\qquad b' = ${Lab.fmtTex(readPoints.b, 5)}.`,
        "\\end{equation}",
        "",
      );
    }
    grafico.push(
      Lab.latexText(value("coefTexto"), "% Apresente os valores lidos e o cálculo dos coeficientes."),
      "",
      "Equação experimental obtida no papel milimetrado:",
      "",
      "\\begin{equation}",
      `${Lab.latexEscape(value("eq3") || "\\ldots")}`,
      "\\label{eq:experimental}",
      "\\end{equation}",
      "",
      "Equação experimental obtida no SPARKvue:",
      "",
      "\\begin{equation}",
      `${Lab.latexEscape(value("eq4") || "\\ldots")}`,
      "\\label{eq:sparkvue}",
      "\\end{equation}",
      "",
      fig("figSpark", "Ajuste linear obtido no SPARKvue.", "spark"),
    );

    const resultados = [];
    if (fit) {
      const mass = massFromCoefficients(fit.a, fit.b);
      const bExp = expectedIntercept();
      resultados.push(
        "O ajuste por mínimos quadrados fornece",
        "",
        "\\begin{equation}",
        `a' = ${Lab.fmtTex(fit.a, 6)}` +
          (Number.isFinite(fit.sigmaA) ? ` \\pm ${Lab.fmtTex(fit.sigmaA, 6)}` : "") +
          `, \\qquad b' = ${Lab.fmtTex(fit.b, 5)}` +
          (Number.isFinite(fit.r2) ? `, \\qquad R^2 = ${Lab.fmtTex(fit.r2, 5)}.` : "."),
        "\\end{equation}",
        "",
        "Pelas relações (\\ref{eq:relacoes}), a razão entre os coeficientes é a massa da régua,",
        "",
        "\\begin{equation}",
        `M = \\frac{b'}{a'} = \\SI{${Lab.fmtTex(mass, 2)}}{\\gram}.`,
        "\\end{equation}",
        "",
        `Comparando com o valor de referência $M = \\SI{${M_REGUA_G.toFixed(2)}(1)}{\\gram}$, ` +
        `o erro percentual é de ${Lab.fmtTex(Lab.percentError(mass, M_REGUA_G), 2)}\\,\\%.`,
        "",
      );
      if (Number.isFinite(bExp)) {
        resultados.push(
          `O coeficiente linear esperado pela geometria é $b' = 2/(L - 2x_1) = ` +
          `${Lab.fmtTex(bExp, 5)}$, contra ${Lab.fmtTex(fit.b, 5)} obtido no ajuste.`,
          "",
        );
      }
    } else {
      resultados.push("% Sem dados suficientes para o ajuste no momento da geração.", "");
    }
    resultados.push(Lab.latexText(value("resTexto"), "% Discuta os resultados obtidos."));

    return {
      objetivo: "Verificar experimentalmente o princípio da alavanca de Arquimedes.\n",
      observacoes, experimentos, teoria, linearizacao,
      grafico: grafico.join("\n"),
      resultados: resultados.join("\n"),
      conclusoes: Lab.latexText(value("concTexto"),
        "% Faça a síntese dos resultados. O objetivo foi alcançado?"),
    };
  }

  function buildCsv(stats) {
    const medidas = [["m1_g", "M1_g", "d1_cm", "d2_cm", "d3_cm", "d4_cm", "d5_cm"]];
    table.read().forEach(row => {
      if (!Number.isFinite(row.lead.m1)) return;
      medidas.push([row.lead.m1, M_SUPORTE_G + row.lead.m1,
        ...row.series.d.map(v => Number.isFinite(v) ? v : "")]);
    });
    const cell = v => Number.isFinite(v) ? v.toFixed(6) : "";
    const estatistica = [["M1_g", "d_media_cm", "desvio_medio_cm", "desvio_padrao_cm",
      "x_M1", "y_inverso_d", "n"]];
    stats.forEach(s => estatistica.push([
      cell(s.M1), cell(s.mean), cell(s.dev), cell(s.std), cell(s.x), cell(s.y), s.n,
    ]));
    return { medidas, estatistica };
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
    if (!Number.isFinite(Lab.parseNum(value("posX1")))) {
      setStatus("Informe a posição x₁ do contrapeso — ela define o coeficiente linear esperado.", "err");
      document.getElementById("posX1").focus();
      return;
    }

    try {
      setStatus("Montando o pacote do relatório...");
      const { stats, fit } = refresh();
      const readPoints = renderReadPoints();
      const template = await Lab.fetchText("../../template_relatorio/main.tex");
      const mainTex = Lab.fillTemplate(template, {
        titulo: "Experiência 5 --- Equilíbrio de corpos rígidos e elasticidade",
        subtitulo: "Roteiro/Relatório de Física Experimental I",
        equipe, integrantes,
        data: Lab.dateBR(value("dataExp")),
      });

      const tables = buildTables(stats);
      const sections = buildSections(stats, fit, readPoints);
      const csv = buildCsv(stats);

      const files = [
        { name: "main.tex", blob: Lab.textBlob(mainTex) },
        { name: "tabelas/tabela1_medidas.tex", blob: Lab.textBlob(tables.tabela1) },
        { name: "tabelas/tabela2_variaveis.tex", blob: Lab.textBlob(tables.tabela2) },
        { name: "tabelas/tabela3_estatistica.tex", blob: Lab.textBlob(tables.tabela3) },
        { name: "tabelas/tabela4_linearizada.tex", blob: Lab.textBlob(tables.tabela4) },
        { name: "secoes/objetivo.tex", blob: Lab.textBlob(sections.objetivo) },
        { name: "secoes/observacoes.tex", blob: Lab.textBlob(sections.observacoes) },
        { name: "secoes/experimentos.tex", blob: Lab.textBlob(sections.experimentos) },
        { name: "secoes/teoria.tex", blob: Lab.textBlob(sections.teoria) },
        { name: "secoes/linearizacao.tex", blob: Lab.textBlob(sections.linearizacao) },
        { name: "secoes/grafico.tex", blob: Lab.textBlob(sections.grafico) },
        { name: "secoes/resultados.tex", blob: Lab.textBlob(sections.resultados) },
        { name: "secoes/conclusoes.tex", blob: Lab.textBlob(sections.conclusoes) },
        { name: "dados/medidas.csv", blob: Lab.textBlob(Lab.toCsv(csv.medidas)) },
        { name: "dados/estatistica.csv", blob: Lab.textBlob(Lab.toCsv(csv.estatistica)) },
        { name: "figuras/grafico_linear.png", blob: await Lab.canvasBlob(canvas) },
      ];
      Object.entries(uploads).forEach(([slot, file]) => {
        files.push({ name: `figuras/${slot}.${file.extension}`, blob: file.blob });
      });

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

  const store = Lab.bindPersistence(STORAGE, { collect: () => ({ rows: table.snapshot() }) });

  document.getElementById("addRow").addEventListener("click", () => { table.addRow(); refresh(); store.save(); });
  document.getElementById("gerar").addEventListener("click", generate);
  document.getElementById("limpar").addEventListener("click", () => {
    if (!confirm("Isto apaga todo o preenchimento desta experiência neste navegador. Continuar?")) return;
    store.clear();
    location.reload();
  });

  document.addEventListener("input", event => {
    if (event.target.closest("#tabela1, #pontos") ||
        ["labelX", "labelY", "minhaEquipe", "relX", "relY", "posX1"].includes(event.target.id)) {
      refresh();
      store.save();
    }
  });

  const restored = store.restore();
  if (!table.restore(restored && restored.rows)) DEFAULT_M1.forEach(m => table.addRow({ m1: String(m) }));
  refresh();
})();
