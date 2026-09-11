/* FEX1001 — Experiência 2: gráficos na cinemática e dinâmica da partícula.
 *
 * Relação investigada: a = g sen(theta). Linearizada, y' = a e x' = sen(theta),
 * de modo que o coeficiente angular do ajuste é a própria gravidade local.
 */
(() => {
  "use strict";

  const G_REF = 9.79061;            // m/s², gravidade local em Joinville
  const TEAMS = [1, 2, 3, 4, 5];
  const STORAGE = "fex1001-experiencia-2";
  const DEFAULT_ANGLES = [1.0, 3.0, 5.0, 7.0, 9.0];

  const tbody1 = document.querySelector("#tabela1 tbody");
  const tbody3 = document.querySelector("#tabela3 tbody");
  const tbody4 = document.querySelector("#tabela4 tbody");
  const canvas = document.getElementById("grafico");
  const statusEl = document.getElementById("status");

  /** Imagens enviadas pelo aluno, por slot. */
  const uploads = {};

  /* ------------------------------------------------------------ Tabela 1 */

  function makeRow(angle = "") {
    const tr = document.createElement("tr");

    const tdAngle = document.createElement("td");
    const angleInput = document.createElement("input");
    angleInput.type = "text";
    angleInput.className = "theta";
    angleInput.value = angle === "" ? "" : String(angle).replace(".", ",");
    angleInput.placeholder = "0,0";
    tdAngle.appendChild(angleInput);
    tr.appendChild(tdAngle);

    TEAMS.forEach(team => {
      const td = document.createElement("td");
      td.dataset.eq = String(team);
      const input = document.createElement("input");
      input.type = "text";
      input.className = "accel";
      input.dataset.team = String(team);
      input.placeholder = "0,000";
      td.appendChild(input);
      tr.appendChild(td);
    });

    const tdDel = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "del-row";
    del.title = "Remover esta linha";
    del.setAttribute("aria-label", "Remover esta linha");
    del.textContent = "×";
    del.addEventListener("click", () => {
      tr.remove();
      if (!tbody1.children.length) addRow();
      refresh();
    });
    tdDel.appendChild(del);
    tr.appendChild(tdDel);

    return tr;
  }

  function addRow(angle = "") {
    tbody1.appendChild(makeRow(angle));
    highlightTeam();
  }

  /** Lê a Tabela 1 como uma lista de { theta, values[] }. */
  function readTable1() {
    return Array.from(tbody1.children).map(tr => {
      const theta = Lab.parseNum(tr.querySelector(".theta").value);
      const values = Array.from(tr.querySelectorAll(".accel")).map(i => Lab.parseNum(i.value));
      return { theta, values };
    });
  }

  /** Destaca a coluna da equipe do aluno, para reduzir erro de digitação. */
  function highlightTeam() {
    const mine = document.getElementById("minhaEquipe").value;
    document.querySelectorAll("#tabela1 [data-eq]").forEach(cell => {
      cell.classList.toggle("mine", cell.dataset.eq === mine);
    });
  }

  /* ------------------------------------------------- estatística e ajuste */

  /** Para cada ângulo, a estatística das acelerações medidas pelas equipes. */
  function statistics() {
    return readTable1()
      .filter(row => Number.isFinite(row.theta))
      .map(row => {
        const values = row.values.filter(Number.isFinite);
        const sin = Math.sin(row.theta * Math.PI / 180);
        return {
          theta: row.theta,
          sin,
          mean: Lab.mean(values),
          meanDev: Lab.meanDeviation(values),
          std: Lab.stdDev(values),
          n: values.length,
        };
      });
  }

  function fitFromStats(stats) {
    return Lab.linearFit(stats.map(s => ({ x: s.sin, y: s.mean })));
  }

  /* ------------------------------------------------------------ render */

  function renderStats(stats) {
    tbody3.innerHTML = "";
    if (!stats.length) {
      tbody3.innerHTML = '<tr><td colspan="6" class="empty">Preencha ao menos um ângulo na Tabela 1.</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${Lab.fmt(s.theta, 1)}</td>` +
        `<td>${Lab.fmt(s.sin, 4)}</td>` +
        `<td>${Lab.fmt(s.mean, 3)}</td>` +
        `<td>${Lab.fmt(s.meanDev, 3)}</td>` +
        `<td>${Lab.fmt(s.std, 3)}</td>` +
        `<td>${s.n || "—"}</td>`;
      tbody3.appendChild(tr);
    });
  }

  function renderLinearized(stats) {
    document.getElementById("th4x").textContent =
      `x′ = ${document.getElementById("labelX").value || "sen θ (—)"}`;
    document.getElementById("th4y").textContent =
      `y′ = ${document.getElementById("labelY").value || "ā (m/s²)"}`;

    tbody4.innerHTML = "";
    if (!stats.length) {
      tbody4.innerHTML = '<tr><td colspan="2" class="empty">—</td></tr>';
      return;
    }
    stats.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${Lab.fmt(s.sin, 4)}</td><td>${Lab.fmt(s.mean, 3)}</td>`;
      tbody4.appendChild(tr);
    });
  }

  function renderChart(stats, fit) {
    Lab.drawChart(canvas, {
      points: stats.map(s => ({ x: s.sin, y: s.mean })),
      fit,
      labelX: document.getElementById("labelX").value || "sen θ",
      labelY: document.getElementById("labelY").value || "ā (m/s²)",
      title: "Aceleração média em função da inclinação da pista",
    });

    const readout = document.getElementById("fitReadout");
    if (!fit) {
      readout.textContent = "São necessários ao menos dois ângulos com medidas para ajustar a reta.";
      return;
    }
    const unc = Number.isFinite(fit.sigmaA) ? ` ± ${Lab.fmt(fit.sigmaA, 4)}` : "";
    readout.textContent =
      `Mínimos quadrados (n = ${fit.n}): a′ = ${Lab.fmt(fit.a, 4)}${unc} m/s²  ·  ` +
      `b′ = ${Lab.fmt(fit.b, 4)} m/s²` +
      (Number.isFinite(fit.r2) ? `  ·  R² = ${Lab.fmt(fit.r2, 5)}` : "");
  }

  function renderResults(fit) {
    const gEl = document.getElementById("gFit");
    const errEl = document.getElementById("gErro");
    if (!fit) {
      gEl.textContent = "—";
      errEl.textContent = "—";
      return;
    }
    gEl.textContent = `${Lab.fmt(fit.a, 3)} m/s²`;
    errEl.textContent = `${Lab.fmt(Lab.percentError(fit.a, G_REF), 2)} %`;
  }

  /** Coeficientes obtidos dos pontos lidos à mão no papel milimetrado. */
  function renderReadPoints() {
    const get = key => Lab.parseNum(document.querySelector(`[data-p="${key}"]`).value);
    const read = n => ({ label: `P${n}`, x: get(`p${n}x`), y: get(`p${n}y`) });
    const marked = [1, 2, 3].map(read).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    const [p1, p2] = [read(1), read(2)];
    const el = document.getElementById("pontosReadout");

    const ready = [p1.x, p1.y, p2.x, p2.y].every(Number.isFinite);
    if (!ready || p2.x === p1.x) {
      el.textContent = "Coeficientes por P₁ e P₂: preencha os dois pontos com x′ diferentes.";
      return marked.length ? { marked } : null;
    }
    const a = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - a * p1.x;
    el.textContent =
      `Pelos pontos lidos: a′ = (y₂ − y₁)/(x₂ − x₁) = ${Lab.fmt(a, 4)}  ·  ` +
      `b′ = ${Lab.fmt(b, 4)}  ·  erro em relação a g: ${Lab.fmt(Lab.percentError(a, G_REF), 2)} %`;
    return { a, b, marked };
  }

  function refresh() {
    highlightTeam();
    const stats = statistics();
    const fit = fitFromStats(stats);
    renderStats(stats);
    renderLinearized(stats);
    renderChart(stats, fit);
    renderResults(fit);
    renderReadPoints();
    return { stats, fit };
  }

  /* ------------------------------------------------------------ uploads */

  function bindUploads() {
    document.querySelectorAll("[data-file]").forEach(input => {
      input.addEventListener("change", () => {
        const slot = input.dataset.file;
        const file = input.files && input.files[0];
        const thumb = document.querySelector(`[data-thumb="${slot}"]`);
        if (!file) {
          delete uploads[slot];
          thumb.innerHTML = "";
          return;
        }
        const extension = (file.name.split(".").pop() || "png").toLowerCase();
        uploads[slot] = { blob: file, extension };
        thumb.innerHTML = "";
        const img = document.createElement("img");
        img.alt = `Pré-visualização de ${file.name}`;
        img.src = URL.createObjectURL(file);
        img.addEventListener("load", () => URL.revokeObjectURL(img.src), { once: true });
        const name = document.createElement("div");
        name.className = "name";
        name.textContent = file.name;
        thumb.append(img, name);
      });
    });
  }

  /* -------------------------------------------------------- construção */

  function value(id) { return (document.getElementById(id).value || "").trim(); }

  function buildTables(stats) {
    // Preserva o que o aluno digitou (inclusive os algarismos significativos),
    // apenas normalizando a vírgula para o \num do siunitx.
    const cell = raw => {
      const text = String(raw).trim();
      if (!text) return "--";
      const n = Lab.parseNum(text);
      return Number.isFinite(n) ? `\\num{${text.replace(",", ".")}}` : Lab.latexEscape(text);
    };
    const rows1 = Array.from(tbody1.children).map(tr => {
      const theta = cell(tr.querySelector(".theta").value);
      const cells = Array.from(tr.querySelectorAll(".accel")).map(i => cell(i.value));
      return [theta, ...cells];
    }).filter(row => row.some(c => c !== "--"));

    const tabela1 = Lab.latexTable({
      caption: "Aceleração do carrinho medida por cada equipe em função do ângulo de inclinação da pista.",
      label: "medidas",
      align: "rrrrrr",
      columns: ["$\\theta$ (\\si{\\degree})", "$a_1$", "$a_2$", "$a_3$", "$a_4$", "$a_5$"],
      rows: rows1.length ? rows1 : [["--", "--", "--", "--", "--", "--"]],
    });

    const tabela2 = Lab.latexTable({
      caption: "Identificação das variáveis do experimento.",
      label: "variaveis",
      align: "ll",
      columns: ["Quantidade física", "Variável"],
      rows: [
        [Lab.latexEscape(value("varIndep") || "--"), "Independente"],
        [Lab.latexEscape(value("varDep") || "--"), "Dependente"],
      ],
    });

    const tabela3 = Lab.latexTable({
      caption: "Inclinação, média, desvio médio e desvio padrão das acelerações.",
      label: "estatistica",
      align: "rrrrrr",
      columns: [
        "$\\theta$ (\\si{\\degree})", "$\\sin\\theta$", "$\\bar{a}$ (\\si{\\meter\\per\\second\\squared})",
        "$\\overline{\\Delta a}$ (\\si{\\meter\\per\\second\\squared})",
        "$\\sigma_a$ (\\si{\\meter\\per\\second\\squared})", "$n$",
      ],
      rows: stats.length ? stats.map(s => [
        Lab.numTex(s.theta, 1), Lab.numTex(s.sin, 4), Lab.numTex(s.mean, 3),
        Lab.numTex(s.meanDev, 3), Lab.numTex(s.std, 3), String(s.n || "--"),
      ]) : [["--", "--", "--", "--", "--", "--"]],
    });

    const tabela4 = Lab.latexTable({
      caption: `Pares linearizados segundo as relações (2): $x' = ${Lab.latexEscape(value("relX") || "\\sin\\theta")}$, $y' = ${Lab.latexEscape(value("relY") || "\\bar{a}")}$.`,
      label: "linearizada",
      align: "rr",
      columns: [
        `$x'$ (${Lab.latexEscape(value("labelX") || "--")})`,
        `$y'$ (${Lab.latexEscape(value("labelY") || "--")})`,
      ],
      rows: stats.length
        ? stats.map(s => [Lab.numTex(s.sin, 4), Lab.numTex(s.mean, 3)])
        : [["--", "--"]],
    });

    return { tabela1, tabela2, tabela3, tabela4 };
  }

  function buildSections(stats, fit, readPoints) {
    const figure = (slot, caption, label) => uploads[slot]
      ? Lab.latexFigure({ file: `figuras/${slot}.${uploads[slot].extension}`, caption, label })
      : `% Nenhuma imagem enviada para: ${caption}\n`;

    const objetivo =
      "Determinar e verificar experimentalmente as equações da cinemática e da " +
      "dinâmica da partícula em um plano inclinado, por meio dos conceitos de " +
      "construção e linearização de gráficos.\n";

    const observacoes = [
      "A coleta foi feita na página \\emph{1: Position and Velocity} do SPARKvue, " +
      "soltando o carrinho do repouso na parte alta da pista. Durante o movimento na rampa, " +
      "o ajuste de curva forneceu",
      "",
      "\\begin{equation}",
      `x(t) = ${Lab.latexEscape(value("eqX") || "\\ldots")},`,
      "\\end{equation}",
      "",
      "\\begin{equation}",
      `v(t) = ${Lab.latexEscape(value("eqV") || "\\ldots")}.`,
      "\\end{equation}",
      "",
      Lab.latexText(value("obsTexto"), "% Responda: a aceleração é constante? Justifique."),
      "",
      figure("figObs", "Gráficos de $x(t)$ e $v(t)$ registrados no experimento.", "obs"),
    ].join("\n");

    const experimentos =
      "Para cada ângulo de inclinação $\\theta$, a aceleração do carrinho na rampa foi " +
      "determinada pelo ajuste de curva no SPARKvue. Os valores da equipe foram " +
      "compartilhados com as demais bancadas, compondo a Tabela~\\ref{tab:medidas}. " +
      "O indicador de ângulo tem erro de escala $\\Delta\\theta = \\SI{0.5}{\\degree}$.\n";

    const teoria = [
      "Aplicando a Segunda Lei de Newton ao carrinho na rampa sem atrito, a componente " +
      "do peso ao longo do plano inclinado conduz a uma aceleração constante,",
      "",
      "\\begin{equation}",
      "a = g\\sin\\theta,",
      "\\label{eq:teorica}",
      "\\end{equation}",
      "",
      `onde $g = \\SI{${G_REF}}{\\meter\\per\\second\\squared}$ é a aceleração da gravidade local.`,
      "",
      figure("figDCL", "Diagrama de corpo livre do carrinho na rampa.", "dcl"),
      "",
      Lab.latexText(value("teoriaTexto"), "% Apresente aqui a demonstração da equação (1)."),
      "",
    ].join("\n");

    const linearizacao = [
      Lab.latexText(value("linTexto"),
        "% Linearize a equação (1) e compare com a equação da reta $y' = a'x' + b'$."),
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

    const graficoParts = [
      Lab.latexFigure({
        file: "figuras/grafico_linear.png",
        caption: "Gráfico linearizado dos pares da Tabela~\\ref{tab:linearizada}, com a reta ajustada por mínimos quadrados.",
        label: "linear",
      }),
    ];

    if (readPoints && readPoints.marked && readPoints.marked.length) {
      graficoParts.push(Lab.latexTable({
        caption: "Pontos lidos sobre a reta traçada no papel milimetrado.",
        label: "pontos",
        align: "lrr",
        columns: ["Ponto", "$x'$", "$y'$"],
        rows: readPoints.marked.map(p => [p.label, Lab.numTex(p.x, 4), Lab.numTex(p.y, 3)]),
      }));
    }

    if (readPoints && Number.isFinite(readPoints.a)) {
      graficoParts.push(
        "Pelos pontos $P_1$ e $P_2$ lidos no papel milimetrado, o coeficiente angular vale",
        "",
        "\\begin{equation}",
        `a' = \\frac{y_2 - y_1}{x_2 - x_1} = ${Lab.fmtTex(readPoints.a, 4)}, \\qquad b' = ${Lab.fmtTex(readPoints.b, 4)}.`,
        "\\end{equation}",
        "",
      );
    }

    graficoParts.push(
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
      figure("figSpark", "Ajuste linear obtido no SPARKvue.", "spark"),
    );

    const resultadoLinhas = [];
    if (fit) {
      resultadoLinhas.push(
        "O ajuste por mínimos quadrados dos pares da Tabela~\\ref{tab:linearizada} fornece",
        "",
        "\\begin{equation}",
        `a' = ${Lab.fmtTex(fit.a, 4)}` +
          (Number.isFinite(fit.sigmaA) ? ` \\pm ${Lab.fmtTex(fit.sigmaA, 4)}` : "") +
          `, \\qquad b' = ${Lab.fmtTex(fit.b, 4)}` +
          (Number.isFinite(fit.r2) ? `, \\qquad R^2 = ${Lab.fmtTex(fit.r2, 5)}.` : "."),
        "\\end{equation}",
        "",
        "Pelas relações (\\ref{eq:relacoes}), o coeficiente angular é a própria aceleração " +
        "da gravidade local, de modo que",
        "",
        "\\begin{equation}",
        `g_{\\mathrm{exp}} = \\SI{${Lab.fmtTex(fit.a, 3)}}{\\meter\\per\\second\\squared}.`,
        "\\end{equation}",
        "",
        `Comparando com o valor de referência $g = \\SI{${G_REF}}{\\meter\\per\\second\\squared}$, ` +
        `o erro percentual é de ${Lab.fmtTex(Lab.percentError(fit.a, G_REF), 2)}\\,\\%.`,
        "",
      );
    } else {
      resultadoLinhas.push("% Sem dados suficientes para o ajuste no momento da geração.", "");
    }
    resultadoLinhas.push(Lab.latexText(value("resTexto"), "% Discuta os resultados obtidos."));

    return {
      objetivo,
      observacoes,
      experimentos,
      teoria,
      linearizacao,
      grafico: graficoParts.join("\n"),
      resultados: resultadoLinhas.join("\n"),
      conclusoes: Lab.latexText(value("concTexto"), "% Faça a síntese dos resultados. O objetivo foi alcançado?"),
    };
  }

  function buildCsv(stats) {
    const medidas = [["theta_graus", "a1_m_s2", "a2_m_s2", "a3_m_s2", "a4_m_s2", "a5_m_s2"]];
    readTable1().forEach(row => {
      if (!Number.isFinite(row.theta)) return;
      medidas.push([row.theta, ...row.values.map(v => Number.isFinite(v) ? v : "")]);
    });

    const estatistica = [["theta_graus", "sen_theta", "a_media_m_s2", "desvio_medio_m_s2", "desvio_padrao_m_s2", "n"]];
    stats.forEach(s => estatistica.push([
      s.theta,
      Number.isFinite(s.sin) ? s.sin.toFixed(6) : "",
      Number.isFinite(s.mean) ? s.mean.toFixed(6) : "",
      Number.isFinite(s.meanDev) ? s.meanDev.toFixed(6) : "",
      Number.isFinite(s.std) ? s.std.toFixed(6) : "",
      s.n,
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
      const dataTexto = value("dataExp");
      const dataTex = dataTexto
        ? dataTexto.split("-").reverse().join("/")
        : "\\today";

      const mainTex = template
        .replace(/\\newcommand\{\\experimento\}\{[^}]*\}/,
          "\\newcommand{\\experimento}{Experiência 2 --- Gráficos na cinemática e dinâmica da partícula}")
        .replace(/\\newcommand\{\\subtitulo\}\{[^}]*\}/,
          "\\newcommand{\\subtitulo}{Roteiro/Relatório de Física Experimental I}")
        .replace(/\\newcommand\{\\equipe\}\{[^}]*\}/,
          `\\newcommand{\\equipe}{${Lab.latexEscape(equipe)}}`)
        .replace(/\\newcommand\{\\integrantes\}\{[^}]*\}/,
          `\\newcommand{\\integrantes}{${Lab.latexEscape(integrantes.replace(/\n+/g, "; "))}}`)
        .replace(/\\newcommand\{\\datarelatorio\}\{[^}]*\}/,
          `\\newcommand{\\datarelatorio}{${dataTex}}`);

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
      setStatus(
        "Não foi possível gerar o relatório. A página precisa estar sendo servida por HTTP " +
        "(no site da disciplina ou por um servidor local), não aberta como arquivo solto.",
        "err");
    }
  }

  /* --------------------------------------------------------------- início */

  const store = Lab.bindPersistence(STORAGE, {
    collect: () => ({
      rows: Array.from(tbody1.children).map(tr => ({
        theta: tr.querySelector(".theta").value,
        values: Array.from(tr.querySelectorAll(".accel")).map(i => i.value),
      })),
    }),
  });

  function restoreRows(state) {
    if (!state || !Array.isArray(state.rows) || !state.rows.length) return false;
    tbody1.innerHTML = "";
    state.rows.forEach(row => {
      const tr = makeRow();
      tr.querySelector(".theta").value = row.theta || "";
      const inputs = tr.querySelectorAll(".accel");
      (row.values || []).forEach((v, i) => { if (inputs[i]) inputs[i].value = v; });
      tbody1.appendChild(tr);
    });
    return true;
  }

  document.getElementById("addRow").addEventListener("click", () => { addRow(); store.save(); });
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
  if (!restoreRows(restored)) DEFAULT_ANGLES.forEach(angle => addRow(angle));
  bindUploads();
  refresh();
})();
