/* FEX1001 — Experiência 3: Teorema do Trabalho e Energia.
 *
 * Relação investigada: W = m v² / 2. Linearizada com y' = W e x' = v², o
 * coeficiente angular vale m/2, de modo que a massa do carrinho é m = 2a'.
 */
(() => {
  "use strict";

  const M_REF_G = 250.00;                 // g, massa do carrinho sem massas adicionais
  const STORAGE = "fex1001-experiencia-3";
  const DEFAULT_D = [5, 15, 25, 35, 45];  // cm

  const tbody1 = document.querySelector("#tabela1 tbody");
  const tbody3 = document.querySelector("#tabela3 tbody");
  const tbody4 = document.querySelector("#tabela4 tbody");
  const canvas = document.getElementById("grafico");
  const statusEl = document.getElementById("status");

  const table = Lab.teamTable({
    tbody: tbody1,
    series: [
      { key: "W", placeholder: "0,000" },
      { key: "v", placeholder: "0,000" },
    ],
    lead: [{ key: "d", placeholder: "0,00" }],
    onChange: () => { refresh(); store.save(); },
  });

  const uploads = Lab.bindUploads();

  /* ------------------------------------------------- estatística e ajuste */

  function statistics() {
    return table.read()
      .filter(row => Number.isFinite(row.lead.d))
      .map(row => {
        const W = row.series.W.filter(Number.isFinite);
        const v = row.series.v.filter(Number.isFinite);
        const meanW = Lab.mean(W);
        const meanV = Lab.mean(v);
        return {
          d: row.lead.d,
          meanW, meanV,
          devW: Lab.meanDeviation(W), devV: Lab.meanDeviation(v),
          stdW: Lab.stdDev(W), stdV: Lab.stdDev(v),
          n: Math.min(W.length, v.length),
          // linearização: x' = v², y' = W
          x: Number.isFinite(meanV) ? meanV * meanV : NaN,
          y: meanW,
        };
      });
  }

  function fitFromStats(stats) {
    return Lab.linearFit(stats.map(s => ({ x: s.x, y: s.y })));
  }

  /* ------------------------------------------------------------- render */

  function renderStats(stats) {
    tbody3.innerHTML = "";
    if (!stats.length) {
      tbody3.innerHTML = '<tr><td colspan="8" class="empty">Preencha ao menos um deslocamento na Tabela 1.</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${Lab.fmt(s.d, 2)}</td>` +
        `<td>${Lab.fmt(s.meanW, 4)}</td><td>${Lab.fmt(s.meanV, 3)}</td>` +
        `<td>${Lab.fmt(s.devW, 4)}</td><td>${Lab.fmt(s.devV, 3)}</td>` +
        `<td>${Lab.fmt(s.stdW, 4)}</td><td>${Lab.fmt(s.stdV, 3)}</td>` +
        `<td>${s.n || "—"}</td>`;
      tbody3.appendChild(tr);
    });
  }

  function renderLinearized(stats) {
    document.getElementById("th4x").textContent =
      `x′ = ${document.getElementById("labelX").value || "v̄² (m²/s²)"}`;
    document.getElementById("th4y").textContent =
      `y′ = ${document.getElementById("labelY").value || "W̄ (J)"}`;
    tbody4.innerHTML = "";
    if (!stats.length) {
      tbody4.innerHTML = '<tr><td colspan="2" class="empty">—</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${Lab.fmt(s.x, 4)}</td><td>${Lab.fmt(s.y, 4)}</td>`;
      tbody4.appendChild(tr);
    });
  }

  function renderChart(stats, fit) {
    Lab.drawChart(canvas, {
      points: stats.map(s => ({ x: s.x, y: s.y })),
      fit,
      labelX: document.getElementById("labelX").value || "v̄² (m²/s²)",
      labelY: document.getElementById("labelY").value || "W̄ (J)",
      title: "Trabalho da mola em função do quadrado da velocidade",
    });
    const readout = document.getElementById("fitReadout");
    if (!fit) {
      readout.textContent = "São necessários ao menos dois deslocamentos com medidas para ajustar a reta.";
      return;
    }
    const unc = Number.isFinite(fit.sigmaA) ? ` ± ${Lab.fmt(fit.sigmaA, 5)}` : "";
    readout.textContent =
      `Mínimos quadrados (n = ${fit.n}): a′ = ${Lab.fmt(fit.a, 5)}${unc} kg  ·  ` +
      `b′ = ${Lab.fmt(fit.b, 5)} J` +
      (Number.isFinite(fit.r2) ? `  ·  R² = ${Lab.fmt(fit.r2, 5)}` : "");
  }

  /** m = 2a', em gramas para comparar com a referência do roteiro. */
  function massFromFit(fit) {
    return fit ? 2 * fit.a * 1000 : NaN;
  }

  function renderResults(fit) {
    const mass = massFromFit(fit);
    document.getElementById("mFit").textContent =
      Number.isFinite(mass) ? `${Lab.fmt(mass, 2)} g` : "—";
    document.getElementById("mErro").textContent =
      Number.isFinite(mass) ? `${Lab.fmt(Lab.percentError(mass, M_REF_G), 2)} %` : "—";
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
    const mass = 2 * a * 1000;
    el.textContent =
      `Pelos pontos lidos: a′ = ${Lab.fmt(a, 5)} kg  ·  b′ = ${Lab.fmt(b, 5)} J  ·  ` +
      `m = 2a′ = ${Lab.fmt(mass, 2)} g  ·  erro: ${Lab.fmt(Lab.percentError(mass, M_REF_G), 2)} %`;
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
      const cells = [Lab.rawCell(row.raw.d)];
      [1, 2, 3, 4, 5].forEach(team => {
        cells.push(Lab.rawCell(row.raw[`W${team}`]), Lab.rawCell(row.raw[`v${team}`]));
      });
      return cells;
    }).filter(cells => cells.some(c => c !== "--"));

    const tabela1 = Lab.latexTable({
      caption: "Trabalho $W$ e velocidade $v$ medidos por cada equipe, em função do deslocamento $d$.",
      label: "medidas",
      align: "r" + "rr".repeat(5),
      columns: ["$d$ (\\si{\\centi\\meter})"].concat(
        [1, 2, 3, 4, 5].flatMap(t => [`$W_${t}$`, `$v_${t}$`])),
      rows: rows1.length ? rows1 : [Array(11).fill("--")],
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
      caption: "Média, desvio médio e desvio padrão do trabalho e da velocidade. " +
               "Corresponde às Tabelas 3, 4 e 5 do roteiro.",
      label: "estatistica", align: "rrrrrrrr",
      columns: [
        "$d$ (\\si{\\centi\\meter})",
        "$\\bar{W}$ (\\si{\\joule})", "$\\bar{v}$ (\\si{\\meter\\per\\second})",
        "$\\overline{\\Delta W}$ (\\si{\\joule})", "$\\overline{\\Delta v}$ (\\si{\\meter\\per\\second})",
        "$\\sigma_W$ (\\si{\\joule})", "$\\sigma_v$ (\\si{\\meter\\per\\second})", "$n$",
      ],
      rows: stats.length ? stats.map(s => [
        Lab.numTex(s.d, 2), Lab.numTex(s.meanW, 4), Lab.numTex(s.meanV, 3),
        Lab.numTex(s.devW, 4), Lab.numTex(s.devV, 3),
        Lab.numTex(s.stdW, 4), Lab.numTex(s.stdV, 3), String(s.n || "--"),
      ]) : [Array(8).fill("--")],
    });

    const tabela4 = Lab.latexTable({
      caption: `Pares linearizados segundo as relações (3): $x' = ${Lab.latexEscape(value("relX") || "\\bar{v}^2")}$, $y' = ${Lab.latexEscape(value("relY") || "\\bar{W}")}$. Corresponde à Tabela 6 do roteiro.`,
      label: "linearizada", align: "rr",
      columns: [
        `$x'$ (${Lab.latexEscape(value("labelX") || "--")})`,
        `$y'$ (${Lab.latexEscape(value("labelY") || "--")})`,
      ],
      rows: stats.length ? stats.map(s => [Lab.numTex(s.x, 4), Lab.numTex(s.y, 4)]) : [["--", "--"]],
    });

    return { tabela1, tabela2, tabela3, tabela4 };
  }

  function buildSections(stats, fit, readPoints) {
    const fig = (slot, caption, label) => Lab.optionalFigure(uploads, slot, caption, label);

    const observacoes = [
      "O carrinho foi puxado esticando a mola por cerca de \\SI{20}{\\centi\\meter} e solto do " +
      "repouso, com parada automática da coleta.",
      "",
      fig("figObs", "Esboço dos gráficos de $v(x)$ e $F(x)$.", "obs"),
      "",
      "\\paragraph{Ao alterar o esticamento da mola.} " +
      Lab.latexText(value("obsB"), "% Descreva o observado."),
      "",
      "\\paragraph{Ao trocar a mola por um elástico.} " +
      Lab.latexText(value("obsC"), "% Descreva o observado."),
      "",
      "\\paragraph{Ao acrescentar massas ao carrinho.} " +
      Lab.latexText(value("obsD"), "% Descreva o observado."),
      "",
    ].join("\n");

    const experimentos =
      "O carrinho foi puxado \\SI{50.00}{\\centi\\meter} a partir da posição de relaxamento da mola " +
      "e solto do repouso. Para cada deslocamento $d$, o trabalho $W$ foi obtido pela área do " +
      "gráfico $F(x)$ entre $x_i = 0$ e $x_f = d$, e a velocidade $v$ foi lida em $x_f = d$. " +
      "A mola tem constante $k = \\SI{3.4(1)}{\\newton\\per\\meter}$ e o carrinho " +
      "$\\Delta x = \\SI{0.2}{\\milli\\meter}$, $\\Delta F = \\SI{0.1}{\\newton}$.\n";

    const teoria = [
      "O trabalho realizado por uma força variável ao longo do deslocamento é",
      "",
      "\\begin{equation}",
      "W = \\int_{x_i}^{x_f} F(x)\\,\\mathrm{d}x,",
      "\\label{eq:trabalho}",
      "\\end{equation}",
      "",
      "isto é, a área sob a curva $F(x)$ entre os limites do deslocamento.",
      "",
      Lab.latexText(value("teoriaA"), "% Relacione o trabalho com a área do gráfico F(x)."),
      "",
      "Pelo Teorema do Trabalho e Energia, o trabalho realizado sobre um corpo de massa $m$ " +
      "inicialmente em repouso é igual à sua energia cinética final,",
      "",
      "\\begin{equation}",
      "W = \\frac{1}{2} m v^2.",
      "\\label{eq:teorema}",
      "\\end{equation}",
      "",
      Lab.latexText(value("teoriaB"), "% Apresente a demonstração da equação (2)."),
      "",
    ].join("\n");

    const linearizacao = [
      Lab.latexText(value("linTexto"),
        "% Linearize a equação (2) e compare com a equação da reta $y' = a'x' + b'$."),
      "",
      "Comparando com a equação da reta $y' = a'x' + b'$, obtêm-se as relações",
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
        rows: readPoints.marked.map(p => [p.label, Lab.numTex(p.x, 4), Lab.numTex(p.y, 4)]),
      }));
    }
    if (readPoints && Number.isFinite(readPoints.a)) {
      grafico.push(
        "Pelos pontos $P_1$ e $P_2$,",
        "",
        "\\begin{equation}",
        `a' = \\frac{y_2 - y_1}{x_2 - x_1} = ${Lab.fmtTex(readPoints.a, 5)}, \\qquad b' = ${Lab.fmtTex(readPoints.b, 5)}.`,
        "\\end{equation}",
        "",
      );
    }
    grafico.push(
      Lab.latexText(value("coefTexto"), "% Apresente os valores lidos de P1, P2, P3 e o cálculo dos coeficientes."),
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
      const mass = massFromFit(fit);
      resultados.push(
        "O ajuste por mínimos quadrados dos pares da Tabela~\\ref{tab:linearizada} fornece",
        "",
        "\\begin{equation}",
        `a' = ${Lab.fmtTex(fit.a, 5)}` +
          (Number.isFinite(fit.sigmaA) ? ` \\pm ${Lab.fmtTex(fit.sigmaA, 5)}` : "") +
          `, \\qquad b' = ${Lab.fmtTex(fit.b, 5)}` +
          (Number.isFinite(fit.r2) ? `, \\qquad R^2 = ${Lab.fmtTex(fit.r2, 5)}.` : "."),
        "\\end{equation}",
        "",
        "Pelas relações (\\ref{eq:relacoes}), o coeficiente angular vale $m/2$, de modo que a " +
        "massa do carrinho é",
        "",
        "\\begin{equation}",
        `m = 2a' = \\SI{${Lab.fmtTex(mass, 2)}}{\\gram}.`,
        "\\end{equation}",
        "",
        `Comparando com o valor de referência $m = \\SI{${M_REF_G.toFixed(2)}(1)}{\\gram}$, ` +
        `o erro percentual é de ${Lab.fmtTex(Lab.percentError(mass, M_REF_G), 2)}\\,\\%.`,
        "",
      );
    } else {
      resultados.push("% Sem dados suficientes para o ajuste no momento da geração.", "");
    }
    resultados.push(Lab.latexText(value("resTexto"), "% Discuta os resultados obtidos."));

    return {
      objetivo: "Verificar experimentalmente o Teorema do Trabalho e Energia.\n",
      observacoes, experimentos, teoria, linearizacao,
      grafico: grafico.join("\n"),
      resultados: resultados.join("\n"),
      conclusoes: Lab.latexText(value("concTexto"),
        "% Faça a síntese dos resultados. O objetivo foi alcançado?"),
    };
  }

  function buildCsv(stats) {
    const head = ["d_cm"];
    [1, 2, 3, 4, 5].forEach(t => head.push(`W${t}_J`, `v${t}_m_s`));
    const medidas = [head];
    table.read().forEach(row => {
      if (!Number.isFinite(row.lead.d)) return;
      const line = [row.lead.d];
      [0, 1, 2, 3, 4].forEach(i => {
        line.push(Number.isFinite(row.series.W[i]) ? row.series.W[i] : "");
        line.push(Number.isFinite(row.series.v[i]) ? row.series.v[i] : "");
      });
      medidas.push(line);
    });

    const estatistica = [["d_cm", "W_media_J", "v_media_m_s", "desvio_medio_W_J",
      "desvio_medio_v_m_s", "desvio_padrao_W_J", "desvio_padrao_v_m_s",
      "x_linearizado_v2", "y_linearizado_W", "n"]];
    const cell = v => Number.isFinite(v) ? v.toFixed(6) : "";
    stats.forEach(s => estatistica.push([
      s.d, cell(s.meanW), cell(s.meanV), cell(s.devW), cell(s.devV),
      cell(s.stdW), cell(s.stdV), cell(s.x), cell(s.y), s.n,
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

    try {
      setStatus("Montando o pacote do relatório...");
      const { stats, fit } = refresh();
      const readPoints = renderReadPoints();

      const template = await Lab.fetchText("../../template_relatorio/main.tex");
      const mainTex = Lab.fillTemplate(template, {
        titulo: "Experiência 3 --- Trabalho e energia, conservação de energia e colisões",
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
        ["labelX", "labelY", "minhaEquipe", "relX", "relY"].includes(event.target.id)) {
      refresh();
      store.save();
    }
  });

  const restored = store.restore();
  if (!table.restore(restored && restored.rows)) DEFAULT_D.forEach(d => table.addRow({ d: String(d) }));
  refresh();
})();
