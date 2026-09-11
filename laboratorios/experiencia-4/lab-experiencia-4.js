/* FEX1001 — Experiência 4: cinemática e dinâmica de rotações.
 *
 * Relação investigada: alpha = (g/R) / (1 + I/(M R^2)). Invertendo,
 *
 *     1/alpha = R/g + [I/(g R)] (1/M),
 *
 * que é uma reta em x' = 1/M. O coeficiente angular dá o momento de inércia,
 * I = a' g R, e o coeficiente linear deve reproduzir R/g.
 */
(() => {
  "use strict";

  const G = 9.79061;          // m/s²
  const M_HASTE = 0.02700;    // kg
  const L_HASTE = 0.38000;    // m
  const M_AJUST = 0.07500;    // kg, cada massa ajustável
  const R_POLIA = 0.02400;    // m
  const STORAGE = "fex1001-experiencia-4";
  const DEFAULT_M = [10, 20, 30, 40, 50];   // g

  const tbody1 = document.querySelector("#tabela1 tbody");
  const tbody3 = document.querySelector("#tabela3 tbody");
  const tbody4 = document.querySelector("#tabela4 tbody");
  const canvas = document.getElementById("grafico");
  const statusEl = document.getElementById("status");

  const table = Lab.teamTable({
    tbody: tbody1,
    series: [{ key: "a", placeholder: "0,00" }],
    lead: [{ key: "M", placeholder: "0,00" }],
    onChange: () => { refresh(); store.save(); },
  });

  const uploads = Lab.bindUploads();

  /* ---------------------------------------------------------- grandezas */

  /** Momento de inércia de referência, pela geometria do acessório. */
  function inertiaReference() {
    const dCm = Lab.parseNum(document.getElementById("distD").value);
    if (!Number.isFinite(dCm)) return NaN;
    const d = dCm / 100;
    return M_HASTE * L_HASTE * L_HASTE / 12 + 2 * M_AJUST * d * d;
  }

  function statistics() {
    return table.read()
      .filter(row => Number.isFinite(row.lead.M))
      .map(row => {
        const values = row.series.a.filter(Number.isFinite);
        const mass = row.lead.M / 1000;           // g → kg
        const mean = Lab.mean(values);
        return {
          massG: row.lead.M,
          mass,
          mean,
          dev: Lab.meanDeviation(values),
          std: Lab.stdDev(values),
          n: values.length,
          // linearização por inversos
          x: mass > 0 ? 1 / mass : NaN,
          y: Number.isFinite(mean) && mean !== 0 ? 1 / mean : NaN,
        };
      });
  }

  function fitFromStats(stats) {
    return Lab.linearFit(stats.map(s => ({ x: s.x, y: s.y })));
  }

  /** I = a' g R. */
  function inertiaFromSlope(slope) {
    return Number.isFinite(slope) ? slope * G * R_POLIA : NaN;
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
        `<td>${Lab.fmt(s.mass, 5)}</td>` +
        `<td>${Lab.fmt(s.mean, 3)}</td>` +
        `<td>${Lab.fmt(s.dev, 3)}</td>` +
        `<td>${Lab.fmt(s.std, 3)}</td>` +
        `<td>${s.n || "—"}</td>`;
      tbody3.appendChild(tr);
    });
  }

  function renderLinearized(stats) {
    document.getElementById("th4x").textContent =
      `x′ = ${document.getElementById("labelX").value || "1/M (1/kg)"}`;
    document.getElementById("th4y").textContent =
      `y′ = ${document.getElementById("labelY").value || "1/ᾱ (s²/rad)"}`;
    tbody4.innerHTML = "";
    if (!stats.length) {
      tbody4.innerHTML = '<tr><td colspan="2" class="empty">—</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${Lab.fmt(s.x, 3)}</td><td>${Lab.fmt(s.y, 5)}</td>`;
      tbody4.appendChild(tr);
    });
  }

  function renderChart(stats, fit) {
    Lab.drawChart(canvas, {
      points: stats.map(s => ({ x: s.x, y: s.y })),
      fit,
      labelX: document.getElementById("labelX").value || "1/M (1/kg)",
      labelY: document.getElementById("labelY").value || "1/ᾱ (s²/rad)",
      title: "Inverso da aceleração angular contra o inverso da massa pendurada",
    });
    const readout = document.getElementById("fitReadout");
    if (!fit) {
      readout.textContent = "São necessárias ao menos duas massas com medidas para ajustar a reta.";
      return;
    }
    const unc = Number.isFinite(fit.sigmaA) ? ` ± ${Lab.fmt(fit.sigmaA, 6)}` : "";
    readout.textContent =
      `Mínimos quadrados (n = ${fit.n}): a′ = ${Lab.fmt(fit.a, 6)}${unc}  ·  ` +
      `b′ = ${Lab.fmt(fit.b, 5)} s²/rad` +
      (Number.isFinite(fit.r2) ? `  ·  R² = ${Lab.fmt(fit.r2, 5)}` : "");
  }

  function renderResults(fit) {
    const iExp = fit ? inertiaFromSlope(fit.a) : NaN;
    const iRef = inertiaReference();
    const f = (v, d) => Number.isFinite(v) ? Lab.fmt(v, d) : "—";

    document.getElementById("iFit").textContent =
      Number.isFinite(iExp) ? `${f(iExp * 1e4, 3)}×10⁻⁴ kg·m²` : "—";
    document.getElementById("iRef").textContent =
      Number.isFinite(iRef) ? `${f(iRef * 1e4, 3)}×10⁻⁴ kg·m²` : "informe d";
    document.getElementById("iErro").textContent =
      Number.isFinite(iExp) && Number.isFinite(iRef)
        ? `${f(Lab.percentError(iExp, iRef), 2)} %` : "—";
    document.getElementById("bEsperado").textContent = `${Lab.fmt(R_POLIA / G, 5)} s²/rad`;
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
    const iExp = inertiaFromSlope(a);
    el.textContent =
      `Pelos pontos lidos: a′ = ${Lab.fmt(a, 6)}  ·  b′ = ${Lab.fmt(b, 5)} s²/rad  ·  ` +
      `I = a′gR = ${Lab.fmt(iExp * 1e4, 3)}×10⁻⁴ kg·m²`;
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
    const rows1 = table.read().map(row => [
      Lab.rawCell(row.raw.M),
      ...[1, 2, 3, 4, 5].map(t => Lab.rawCell(row.raw[`a${t}`])),
    ]).filter(cells => cells.some(c => c !== "--"));

    const tabela1 = Lab.latexTable({
      caption: "Aceleração angular medida por cada equipe em função da massa pendurada no fio.",
      label: "medidas", align: "rrrrrr",
      columns: ["$M$ (\\si{\\gram})"].concat([1, 2, 3, 4, 5].map(t => `$\\alpha_${t}$`)),
      rows: rows1.length ? rows1 : [Array(6).fill("--")],
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
      caption: "Massa convertida para quilogramas e estatística da aceleração angular.",
      label: "estatistica", align: "rrrrr",
      columns: [
        "$M$ (\\si{\\kilo\\gram})", "$\\bar{\\alpha}$ (\\si{\\radian\\per\\second\\squared})",
        "$\\overline{\\Delta\\alpha}$ (\\si{\\radian\\per\\second\\squared})",
        "$\\sigma_\\alpha$ (\\si{\\radian\\per\\second\\squared})", "$n$",
      ],
      rows: stats.length ? stats.map(s => [
        Lab.numTex(s.mass, 5), Lab.numTex(s.mean, 3),
        Lab.numTex(s.dev, 3), Lab.numTex(s.std, 3), String(s.n || "--"),
      ]) : [Array(5).fill("--")],
    });

    const tabela4 = Lab.latexTable({
      caption: `Pares linearizados segundo as relações (3): $x' = ${Lab.latexEscape(value("relX") || "1/M")}$, $y' = ${Lab.latexEscape(value("relY") || "1/\\bar{\\alpha}")}$.`,
      label: "linearizada", align: "rr",
      columns: [
        `$x'$ (${Lab.latexEscape(value("labelX") || "--")})`,
        `$y'$ (${Lab.latexEscape(value("labelY") || "--")})`,
      ],
      rows: stats.length ? stats.map(s => [Lab.numTex(s.x, 3), Lab.numTex(s.y, 5)]) : [["--", "--"]],
    });

    return { tabela1, tabela2, tabela3, tabela4 };
  }

  function buildSections(stats, fit, readPoints) {
    const fig = (slot, caption, label) => Lab.optionalFigure(uploads, slot, caption, label);
    const dCm = value("distD") || "--";

    const observacoes = [
      Lab.latexText(value("obsTexto"), "% Descreva o comportamento observado ao liberar a massa."),
      "",
      fig("figObs", "Registro do movimento observado.", "obs"),
    ].join("\n");

    const experimentos =
      "As massas ajustáveis foram posicionadas simetricamente a " +
      `$d = \\SI{${dCm.replace(",", ".")}}{\\centi\\meter}$ do eixo. Para cada massa $M$ ` +
      "pendurada no fio, a aceleração angular do sistema foi determinada pelo ajuste de curva " +
      "durante a queda. O sistema tem haste de massa " +
      `$M_H = \\SI{${(M_HASTE * 1000).toFixed(2)}}{\\gram}$ e comprimento ` +
      `$L = \\SI{${(L_HASTE * 100).toFixed(2)}}{\\centi\\meter}$, massas ajustáveis de ` +
      `\\SI{${(M_AJUST * 1000).toFixed(2)}}{\\gram} cada e polia de raio ` +
      `$R = \\SI{${(R_POLIA * 1000).toFixed(2)}}{\\milli\\meter}$.\n`;

    const teoria = [
      "Aplicando a Segunda Lei de Newton à massa pendurada e a segunda lei da dinâmica de " +
      "rotações ao sistema girante, sem atrito e sem inércia nas polias,",
      "",
      "\\begin{equation}",
      "\\alpha = \\left(\\frac{g}{R}\\right)\\frac{1}{1 + \\dfrac{I}{MR^2}},",
      "\\label{eq:alpha}",
      "\\end{equation}",
      "",
      "com o momento de inércia da haste com as massas ajustáveis dado por",
      "",
      "\\begin{equation}",
      "I = \\frac{M_H L^2}{12} + 2md^2.",
      "\\label{eq:inercia}",
      "\\end{equation}",
      "",
      fig("figDCL", "Diagrama de corpo livre do sistema.", "dcl"),
      "",
      Lab.latexText(value("teoriaTexto"), "% Apresente a demonstração das equações (1) e (2)."),
      "",
    ].join("\n");

    const linearizacao = [
      Lab.latexText(value("linTexto"),
        "% Linearize a equação (1) e compare com a equação da reta."),
      "",
      "Invertendo a equação (\\ref{eq:alpha}),",
      "",
      "\\begin{equation}",
      "\\frac{1}{\\alpha} = \\frac{R}{g} + \\frac{I}{gR}\\cdot\\frac{1}{M},",
      "\\end{equation}",
      "",
      "que é linear em $1/M$. Comparando com $y' = a'x' + b'$,",
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
        rows: readPoints.marked.map(p => [p.label, Lab.numTex(p.x, 3), Lab.numTex(p.y, 5)]),
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
    const iRef = inertiaReference();
    if (fit) {
      const iExp = inertiaFromSlope(fit.a);
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
        "Pelas relações (\\ref{eq:relacoes}), $a' = I/(gR)$, de modo que",
        "",
        "\\begin{equation}",
        `I = a'gR = \\SI{${(iExp).toExponential(4).replace("e", "e")}}{\\kilo\\gram\\meter\\squared}.`,
        "\\end{equation}",
        "",
        `O coeficiente linear esperado é $b' = R/g = ${Lab.fmtTex(R_POLIA / G, 5)}$, ` +
        `contra ${Lab.fmtTex(fit.b, 5)} obtido no ajuste.`,
        "",
      );
      if (Number.isFinite(iRef)) {
        resultados.push(
          "O valor de referência, pela equação (\\ref{eq:inercia}), é",
          "",
          "\\begin{equation}",
          `I_{\\mathrm{ref}} = \\frac{M_H L^2}{12} + 2md^2 = \\SI{${iRef.toExponential(4)}}{\\kilo\\gram\\meter\\squared},`,
          "\\end{equation}",
          "",
          `resultando em erro percentual de ${Lab.fmtTex(Lab.percentError(iExp, iRef), 2)}\\,\\%.`,
          "",
        );
      } else {
        resultados.push("% Informe a distância d para calcular o momento de inércia de referência.", "");
      }
    } else {
      resultados.push("% Sem dados suficientes para o ajuste no momento da geração.", "");
    }
    resultados.push(Lab.latexText(value("resTexto"), "% Discuta os resultados obtidos."));

    return {
      objetivo: "Determinar e verificar experimentalmente as equações da cinemática e da " +
                "dinâmica de rotações.\n",
      observacoes, experimentos, teoria, linearizacao,
      grafico: grafico.join("\n"),
      resultados: resultados.join("\n"),
      conclusoes: Lab.latexText(value("concTexto"),
        "% Faça a síntese dos resultados. O objetivo foi alcançado?"),
    };
  }

  function buildCsv(stats) {
    const medidas = [["M_g", "alpha1", "alpha2", "alpha3", "alpha4", "alpha5"]];
    table.read().forEach(row => {
      if (!Number.isFinite(row.lead.M)) return;
      medidas.push([row.lead.M, ...row.series.a.map(v => Number.isFinite(v) ? v : "")]);
    });
    const cell = v => Number.isFinite(v) ? v.toFixed(8) : "";
    const estatistica = [["M_kg", "alpha_media", "desvio_medio", "desvio_padrao",
      "x_inverso_M", "y_inverso_alpha", "n"]];
    stats.forEach(s => estatistica.push([
      cell(s.mass), cell(s.mean), cell(s.dev), cell(s.std), cell(s.x), cell(s.y), s.n,
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
    if (!Number.isFinite(Lab.parseNum(value("distD")))) {
      setStatus("Informe a distância d das massas ajustáveis — ela define o momento de inércia de referência.", "err");
      document.getElementById("distD").focus();
      return;
    }

    try {
      setStatus("Montando o pacote do relatório...");
      const { stats, fit } = refresh();
      const readPoints = renderReadPoints();
      const template = await Lab.fetchText("../../template_relatorio/main.tex");
      const mainTex = Lab.fillTemplate(template, {
        titulo: "Experiência 4 --- Cinemática e dinâmica de rotações",
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
        ["labelX", "labelY", "minhaEquipe", "relX", "relY", "distD"].includes(event.target.id)) {
      refresh();
      store.save();
    }
  });

  const restored = store.restore();
  if (!table.restore(restored && restored.rows)) DEFAULT_M.forEach(m => table.addRow({ M: String(m) }));
  refresh();
})();
