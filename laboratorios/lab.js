/* FEX1001 — motor compartilhado das páginas de laboratório.
 *
 * Responsabilidades: número em pt-BR, estatística descritiva, ajuste de reta
 * por mínimos quadrados, desenho do gráfico linearizado, escrita de LaTeX e
 * CSV, salvamento do pacote e persistência do preenchimento no navegador.
 *
 * Cada experiência tem seu próprio arquivo, que descreve suas tabelas e usa
 * estas funções. Nada aqui é específico de uma experiência.
 */
const Lab = (() => {
  "use strict";

  /* ------------------------------------------------------------ números */

  /** Lê um número digitado em pt-BR ("9,81") ou en-US ("9.81"). */
  function parseNum(value) {
    if (value === null || value === undefined) return NaN;
    const text = String(value).trim().replace(/\s+/g, "");
    if (!text) return NaN;
    return Number(text.replace(",", "."));
  }

  /** Formata com vírgula decimal e um número fixo de casas. */
  function fmt(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(digits).replace(".", ",");
  }

  /** Formata para o LaTeX, que recebe ponto decimal e deixa o siunitx virgular. */
  function fmtTex(value, digits = 3) {
    if (!Number.isFinite(value)) return "--";
    return value.toFixed(digits);
  }

  /**
   * Número para célula de tabela. Precisa de \num{} explícito: o siunitx não
   * reformata dígitos soltos no tabular, e sem isso a vírgula decimal não sai.
   */
  function numTex(value, digits = 3) {
    if (!Number.isFinite(value)) return "--";
    return `\\num{${value.toFixed(digits)}}`;
  }

  /* -------------------------------------------------------- estatística */

  function mean(values) {
    const v = values.filter(Number.isFinite);
    if (!v.length) return NaN;
    return v.reduce((a, b) => a + b, 0) / v.length;
  }

  /** Desvio médio: média dos módulos dos afastamentos. */
  function meanDeviation(values) {
    const v = values.filter(Number.isFinite);
    if (!v.length) return NaN;
    const m = mean(v);
    return v.reduce((acc, x) => acc + Math.abs(x - m), 0) / v.length;
  }

  /** Desvio padrão amostral (n-1). Indefinido para uma única medida. */
  function stdDev(values) {
    const v = values.filter(Number.isFinite);
    if (v.length < 2) return NaN;
    const m = mean(v);
    return Math.sqrt(v.reduce((acc, x) => acc + (x - m) ** 2, 0) / (v.length - 1));
  }

  /**
   * Ajuste de reta y = a x + b por mínimos quadrados, com as incertezas dos
   * coeficientes e o coeficiente de determinação.
   */
  function linearFit(points) {
    const pts = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    const n = pts.length;
    if (n < 2) return null;

    const sx = pts.reduce((s, p) => s + p.x, 0);
    const sy = pts.reduce((s, p) => s + p.y, 0);
    const sxx = pts.reduce((s, p) => s + p.x * p.x, 0);
    const sxy = pts.reduce((s, p) => s + p.x * p.y, 0);

    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-15) return null;

    const a = (n * sxy - sx * sy) / denom;
    const b = (sy * sxx - sx * sxy) / denom;

    const residuals = pts.map(p => p.y - (a * p.x + b));
    const ssRes = residuals.reduce((s, r) => s + r * r, 0);
    const my = sy / n;
    const ssTot = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);

    // Incerteza dos coeficientes a partir da variância residual.
    let sigmaA = NaN, sigmaB = NaN;
    if (n > 2) {
      const s2 = ssRes / (n - 2);
      sigmaA = Math.sqrt(n * s2 / denom);
      sigmaB = Math.sqrt(s2 * sxx / denom);
    }

    return {
      a, b, n, sigmaA, sigmaB,
      r2: ssTot > 0 ? 1 - ssRes / ssTot : NaN,
      points: pts,
    };
  }

  /** Erro percentual de um valor medido face a uma referência. */
  function percentError(measured, reference) {
    if (!Number.isFinite(measured) || !Number.isFinite(reference) || reference === 0) return NaN;
    return Math.abs(measured - reference) / Math.abs(reference) * 100;
  }

  /* ------------------------------------------------------------ gráfico */

  /**
   * Desenha o gráfico linearizado: pontos, reta ajustada, malha e rótulos.
   * Usa cores sólidas para sair legível também no PNG exportado.
   */
  function drawChart(canvas, data) {
    const { points, fit, labelX, labelY, title } = data;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const padL = 96, padR = 34, padT = 52, padB = 76;

    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, W, H);

    const valid = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!valid.length) {
      ctx.fillStyle = "#607080";
      ctx.font = "16px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sem dados suficientes para o gráfico.", W / 2, H / 2);
      ctx.textAlign = "start";
      return;
    }

    // Domínio com margem, sempre incluindo a origem quando ela está perto.
    let xMin = Math.min(...valid.map(p => p.x));
    let xMax = Math.max(...valid.map(p => p.x));
    let yMin = Math.min(...valid.map(p => p.y));
    let yMax = Math.max(...valid.map(p => p.y));
    if (xMin > 0 && xMin < (xMax - xMin)) xMin = 0;
    if (yMin > 0 && yMin < (yMax - yMin)) yMin = 0;
    const xPad = (xMax - xMin) * 0.08 || Math.abs(xMax) * 0.1 || 1;
    const yPad = (yMax - yMin) * 0.08 || Math.abs(yMax) * 0.1 || 1;
    xMin -= xPad; xMax += xPad; yMin -= yPad; yMax += yPad;

    const sx = x => padL + (x - xMin) / (xMax - xMin) * (W - padL - padR);
    const sy = y => H - padB - (y - yMin) / (yMax - yMin) * (H - padT - padB);

    // Malha e marcações.
    const ticks = 8;
    ctx.font = "13px 'DM Mono', monospace";
    ctx.strokeStyle = "rgba(16,35,51,0.10)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= ticks; i++) {
      const xv = xMin + (xMax - xMin) * i / ticks;
      const yv = yMin + (yMax - yMin) * i / ticks;
      const px = sx(xv), py = sy(yv);

      ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, H - padB); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(W - padR, py); ctx.stroke();

      ctx.fillStyle = "#607080";
      ctx.textAlign = "center";
      ctx.fillText(fmt(xv, 2), px, H - padB + 20);
      ctx.textAlign = "right";
      ctx.fillText(fmt(yv, 2), padL - 10, py + 4);
    }

    // Eixos.
    ctx.strokeStyle = "#102333";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB);
    ctx.stroke();

    // Reta ajustada, recortada ao domínio visível.
    if (fit) {
      ctx.strokeStyle = "#1e5c83";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx(xMin), sy(fit.a * xMin + fit.b));
      ctx.lineTo(sx(xMax), sy(fit.a * xMax + fit.b));
      ctx.stroke();
    }

    // Pontos experimentais.
    valid.forEach(p => {
      ctx.fillStyle = "#e6b75c";
      ctx.strokeStyle = "#102333";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });

    // Rótulos.
    ctx.fillStyle = "#102333";
    ctx.font = "600 15px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labelX || "x'", padL + (W - padL - padR) / 2, H - 22);

    ctx.save();
    ctx.translate(26, padT + (H - padT - padB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labelY || "y'", 0, 0);
    ctx.restore();

    if (title) {
      ctx.font = "600 16px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(title, padL, 28);
    }

    if (fit) {
      ctx.font = "13px 'DM Mono', monospace";
      ctx.fillStyle = "#1e5c83";
      ctx.textAlign = "right";
      const r2 = Number.isFinite(fit.r2) ? `   R² = ${fmt(fit.r2, 4)}` : "";
      ctx.fillText(`y' = ${fmt(fit.a, 4)} x' + ${fmt(fit.b, 4)}${r2}`, W - padR, 28);
    }
    ctx.textAlign = "start";
  }

  /**
   * Comparação de um mesmo mensurando obtido em escalas diferentes, com barra
   * de incerteza e linha de referência. É o gráfico da Experiência 1: mostra
   * de uma vez que todas as escalas concordam dentro da sua própria incerteza,
   * e que a incerteza é que muda de ordem de grandeza entre elas.
   *
   * data: { items:[{label, value, error}], reference, labelY, title, logScale }
   */
  function drawScaleComparison(canvas, data) {
    const { items, reference, labelY, title, logScale } = data;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const padL = 104, padR = 40, padT = 54, padB = 78;

    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, W, H);

    const valid = items.filter(i => Number.isFinite(i.value) && i.value > 0);
    if (!valid.length) {
      ctx.fillStyle = "#607080";
      ctx.font = "16px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Preencha as medidas para ver a comparação entre as escalas.", W / 2, H / 2);
      ctx.textAlign = "start";
      return;
    }

    // O eixo precisa acomodar valor, barra de erro e a referência.
    const candidates = [];
    valid.forEach(i => {
      const err = Number.isFinite(i.error) ? i.error : 0;
      candidates.push(i.value + err, Math.max(i.value - err, i.value * 1e-3));
    });
    if (Number.isFinite(reference) && reference > 0) candidates.push(reference);

    let lo = Math.min(...candidates), hi = Math.max(...candidates);
    const useLog = logScale && lo > 0 && hi / lo > 50;
    if (useLog) {
      const span = Math.log10(hi / lo) || 1;
      lo = Math.pow(10, Math.log10(lo) - span * 0.12);
      hi = Math.pow(10, Math.log10(hi) + span * 0.12);
    } else {
      const pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.15 || 1;
      lo -= pad; hi += pad;
    }

    const sy = v => {
      if (useLog) {
        return H - padB - (Math.log10(v) - Math.log10(lo)) /
          (Math.log10(hi) - Math.log10(lo)) * (H - padT - padB);
      }
      return H - padB - (v - lo) / (hi - lo) * (H - padT - padB);
    };

    const plotW = W - padL - padR;
    const slot = plotW / valid.length;
    const sx = i => padL + slot * (i + 0.5);

    // Malha horizontal e rótulos do eixo.
    ctx.font = "13px 'DM Mono', monospace";
    ctx.strokeStyle = "rgba(16,35,51,0.10)";
    ctx.lineWidth = 1;
    const ticks = 6;
    for (let k = 0; k <= ticks; k++) {
      const v = useLog
        ? Math.pow(10, Math.log10(lo) + (Math.log10(hi) - Math.log10(lo)) * k / ticks)
        : lo + (hi - lo) * k / ticks;
      const py = sy(v);
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(W - padR, py); ctx.stroke();
      ctx.fillStyle = "#607080";
      ctx.textAlign = "right";
      const text = (v !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5))
        ? v.toExponential(1).replace(".", ",")
        : fmt(v, 2);
      ctx.fillText(text, padL - 10, py + 4);
    }

    // Linha de referência.
    if (Number.isFinite(reference) && reference > 0) {
      const py = sy(reference);
      ctx.strokeStyle = "#9b2f3a";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(W - padR, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#9b2f3a";
      ctx.font = "12px 'DM Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("referência", padL + 6, py - 7);
    }

    // Eixos.
    ctx.strokeStyle = "#102333";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB);
    ctx.stroke();

    // Pontos com barra de incerteza.
    valid.forEach((item, i) => {
      const px = sx(i);
      const py = sy(item.value);
      const err = Number.isFinite(item.error) ? item.error : 0;

      if (err > 0) {
        const top = sy(item.value + err);
        const bottom = sy(Math.max(item.value - err, lo));
        ctx.strokeStyle = "#1e5c83";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 9, top); ctx.lineTo(px + 9, top); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 9, bottom); ctx.lineTo(px + 9, bottom); ctx.stroke();
      }

      ctx.fillStyle = "#e6b75c";
      ctx.strokeStyle = "#102333";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#102333";
      ctx.font = "600 14px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.label, px, H - padB + 24);
    });

    // Rótulos.
    ctx.fillStyle = "#102333";
    ctx.font = "600 15px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("escala da régua utilizada", padL + plotW / 2, H - 22);

    ctx.save();
    ctx.translate(28, padT + (H - padT - padB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labelY || "", 0, 0);
    ctx.restore();

    if (title) {
      ctx.font = "600 16px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(title, padL, 28);
    }
    if (useLog) {
      ctx.font = "12px 'DM Mono', monospace";
      ctx.fillStyle = "#607080";
      ctx.textAlign = "right";
      ctx.fillText("eixo logarítmico", W - padR, 28);
    }
    ctx.textAlign = "start";
  }

  /* -------------------------------------------------------------- LaTeX */

  /**
   * Símbolos que os alunos digitam direto do teclado ou copiam do roteiro e
   * que o pdflatex com inputenc não imprime: gregos, operadores e expoentes.
   * Sem esta tradução eles desaparecem silenciosamente do PDF.
   */
  const UNICODE_TEX = {
    "α": "\\ensuremath{\\alpha}", "β": "\\ensuremath{\\beta}", "γ": "\\ensuremath{\\gamma}",
    "δ": "\\ensuremath{\\delta}", "ε": "\\ensuremath{\\varepsilon}", "θ": "\\ensuremath{\\theta}",
    "λ": "\\ensuremath{\\lambda}", "μ": "\\ensuremath{\\mu}", "π": "\\ensuremath{\\pi}",
    "ρ": "\\ensuremath{\\rho}", "σ": "\\ensuremath{\\sigma}", "τ": "\\ensuremath{\\tau}",
    "φ": "\\ensuremath{\\phi}", "ω": "\\ensuremath{\\omega}",
    "Δ": "\\ensuremath{\\Delta}", "Ω": "\\ensuremath{\\Omega}", "Σ": "\\ensuremath{\\Sigma}",
    "Θ": "\\ensuremath{\\Theta}", "Φ": "\\ensuremath{\\Phi}",
    "±": "\\ensuremath{\\pm}", "×": "\\ensuremath{\\times}", "÷": "\\ensuremath{\\div}",
    "≈": "\\ensuremath{\\approx}", "≤": "\\ensuremath{\\leq}", "≥": "\\ensuremath{\\geq}",
    "≠": "\\ensuremath{\\neq}", "∞": "\\ensuremath{\\infty}", "√": "\\ensuremath{\\surd}",
    "°": "\\ensuremath{^\\circ}",
    "²": "\\ensuremath{^2}", "³": "\\ensuremath{^3}", "⁻": "\\ensuremath{^-}",
    "·": "\\ensuremath{\\cdot}", "–": "--", "—": "---",
    "“": "``", "”": "''", "…": "\\ldots{}",
  };

  function translateUnicode(text) {
    return text.replace(/[^\x00-\xFF]|[±×÷°²³·–—“”…]/g, ch => UNICODE_TEX[ch] ?? ch);
  }

  /** Escapa os caracteres que o LaTeX trata como comando. */
  function latexEscape(text) {
    const escaped = String(text ?? "")
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/([&%$#_{}])/g, "\\$1")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
    return translateUnicode(escaped);
  }

  /**
   * Texto livre do aluno: preserva parágrafos e deixa passar $...$, porque o
   * roteiro pede demonstrações e o aluno pode querer escrever fórmulas.
   */
  function latexText(text, fallback = "") {
    const raw = String(text ?? "").trim();
    if (!raw) return fallback;
    const paragraphs = raw.split(/\n{2,}/).map(p => p.trim().replace(/\n/g, " "));
    return translateUnicode(paragraphs.join("\n\n"));
  }

  /**
   * Monta um tabular completo dentro de um ambiente table.
   *
   * `compact` aplica \tabelalarga (corpo menor e colunas mais justas), o que
   * as tabelas de muitas colunas exigem para não estourar a margem. O comando
   * é definido pelo modelo de relatório; havendo um \providecommand aqui, a
   * tabela continua válida mesmo em um modelo que não o declare.
   */
  function latexTable({ caption, label, columns, rows, align, compact }) {
    const spec = align || "l".repeat(columns.length);
    const head = columns.join(" & ") + " \\\\";
    const body = rows.map(r => r.join(" & ") + " \\\\").join("\n");
    return [
      "\\begin{table}[H]",
      "\\centering",
      `\\caption{${caption}}`,
      `\\label{tab:${label}}`,
      ...(compact
        ? ["\\providecommand{\\tabelalarga}{\\footnotesize\\setlength{\\tabcolsep}{4pt}}",
           "\\tabelalarga"]
        : []),
      `\\begin{tabular}{${spec}}`,
      "\\toprule",
      head,
      "\\midrule",
      body,
      "\\bottomrule",
      "\\end{tabular}",
      "\\end{table}",
      "",
    ].join("\n");
  }

  /** Figura com legenda; width em fração de \linewidth. */
  function latexFigure({ file, caption, label, width = 0.78 }) {
    return [
      "\\begin{figure}[H]",
      "\\centering",
      `\\includegraphics[width=${width}\\linewidth]{${file}}`,
      `\\caption{${caption}}`,
      `\\label{fig:${label}}`,
      "\\end{figure}",
      "",
    ].join("\n");
  }

  /* ---------------------------------------------------------------- CSV */

  function toCsv(rows) {
    return rows.map(row => row.map(cell => {
      const text = String(cell ?? "");
      return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(";")).join("\n");
  }

  /* ------------------------------------------------------------ arquivos */

  function textBlob(content) {
    return new Blob([content], { type: "text/plain;charset=utf-8" });
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("Falha ao gerar o PNG do gráfico.")), "image/png");
    });
  }

  async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Não foi possível carregar ${path}`);
    return response.text();
  }

  function downloadBlob(name, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /**
   * Grava o pacote. Onde o navegador oferece o seletor de pastas, escreve a
   * árvore de diretórios inteira; onde não oferece, baixa arquivo a arquivo
   * com o caminho achatado no nome.
   */
  async function saveFiles(files) {
    if (window.showDirectoryPicker) {
      const root = await window.showDirectoryPicker({ mode: "readwrite" });
      for (const file of files) {
        const parts = file.name.split("/");
        const filename = parts.pop();
        let dir = root;
        for (const part of parts) {
          dir = await dir.getDirectoryHandle(part, { create: true });
        }
        const handle = await dir.getFileHandle(filename, { create: true });
        const writable = await handle.createWritable();
        await writable.write(file.blob);
        await writable.close();
      }
      return `${files.length} arquivos gravados na pasta escolhida. Abra-a no Overleaf e compile o main.tex.`;
    }

    files.forEach((file, i) => {
      setTimeout(() => downloadBlob(file.name.replaceAll("/", "_"), file.blob), i * 160);
    });
    return `Seu navegador não abre seletor de pasta; os ${files.length} arquivos foram baixados separadamente. ` +
           "Recrie as pastas figuras/, tabelas/, secoes/ e dados/ antes de compilar.";
  }

  /* ------------------------------------------------------- persistência */

  /** Salva e restaura todo campo marcado com data-save, pela sua id. */
  function bindPersistence(storageKey, extra = {}) {
    const fields = () => Array.from(document.querySelectorAll("[data-save]"));

    function snapshot() {
      const state = { fields: {}, ...(extra.collect ? extra.collect() : {}) };
      fields().forEach(el => {
        const key = el.id || el.dataset.p;
        if (key) state.fields[key] = el.value;
      });
      return state;
    }

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(snapshot()));
      } catch (error) {
        /* cota cheia ou armazenamento bloqueado: o preenchimento segue válido na tela */
      }
    }

    function restore() {
      let state = null;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) state = JSON.parse(raw);
      } catch (error) {
        return null;
      }
      if (!state) return null;
      fields().forEach(el => {
        const key = el.id || el.dataset.p;
        if (key && state.fields && key in state.fields) el.value = state.fields[key];
      });
      return state;
    }

    function clear() {
      try { localStorage.removeItem(storageKey); } catch (error) { /* ignora */ }
    }

    document.addEventListener("input", event => {
      if (event.target.closest("[data-save]") || event.target.matches("[data-save]")) save();
    });

    return { save, restore, clear, snapshot };
  }

  /**
   * Número para tabela quando a precisão não pode ser fixada de antemão: a
   * Experiência 1 põe lado a lado valores em m² e em mm², separados por doze
   * ordens de grandeza. Escolhe notação científica nos extremos e casas
   * decimais proporcionais no meio, sem inventar precisão.
   */
  function numTexAuto(value) {
    if (!Number.isFinite(value)) return "--";
    if (value === 0) return "\\num{0}";
    const abs = Math.abs(value);
    if (abs < 1e-3 || abs >= 1e6) return `\\num{${value.toExponential(4)}}`;
    // Cinco algarismos significativos, nunca casas decimais fixas: numa
    // disciplina sobre algarismos significativos, imprimir 0,223607 para um
    // desvio padrão seria o exemplo errado. O arredondamento final para o
    // número correto de algarismos continua sendo tarefa do aluno.
    return `\\num{${Number(value.toPrecision(5))}}`;
  }

  /* ------------------------------------------------- tabela de equipes */

  /**
   * Tabela de medidas partilhada entre as cinco bancadas. Cada equipe pode
   * contribuir com mais de uma grandeza por linha (a Experiência 3 mede
   * trabalho e velocidade), por isso `series` é uma lista.
   *
   * config: { tbody, teams, series:[{key,label}], lead:[{key,label,derived?}],
   *           onChange }
   */
  function teamTable(config) {
    const { tbody, teams = [1, 2, 3, 4, 5], series, lead, onChange } = config;

    function makeRow(values = {}) {
      const tr = document.createElement("tr");

      lead.forEach(col => {
        const td = document.createElement("td");
        if (col.derived) {
          td.className = "derived-cell";
          td.dataset.derived = col.key;
          td.textContent = "—";
        } else {
          const input = document.createElement("input");
          input.type = "text";
          input.dataset.lead = col.key;
          input.placeholder = col.placeholder || "";
          input.value = values[col.key] ?? "";
          td.appendChild(input);
        }
        tr.appendChild(td);
      });

      teams.forEach(team => {
        series.forEach(serie => {
          const td = document.createElement("td");
          td.dataset.eq = String(team);
          const input = document.createElement("input");
          input.type = "text";
          input.dataset.team = String(team);
          input.dataset.serie = serie.key;
          input.placeholder = serie.placeholder || "";
          const cellKey = `${serie.key}${team}`;
          input.value = values[cellKey] ?? "";
          td.appendChild(input);
          tr.appendChild(td);
        });
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
        if (!tbody.children.length) api.addRow();
        onChange();
      });
      tdDel.appendChild(del);
      tr.appendChild(tdDel);

      return tr;
    }

    const api = {
      addRow(values) {
        tbody.appendChild(makeRow(values));
        return api;
      },

      /** Estado da tabela: valores crus (texto) e numéricos, por linha. */
      read() {
        return Array.from(tbody.children).map(tr => {
          const row = { raw: {}, lead: {}, series: {} };
          lead.forEach(col => {
            const input = tr.querySelector(`[data-lead="${col.key}"]`);
            const text = input ? input.value.trim() : "";
            row.raw[col.key] = text;
            row.lead[col.key] = parseNum(text);
          });
          series.forEach(serie => {
            row.series[serie.key] = teams.map(team => {
              const input = tr.querySelector(`[data-team="${team}"][data-serie="${serie.key}"]`);
              const text = input ? input.value.trim() : "";
              row.raw[`${serie.key}${team}`] = text;
              return parseNum(text);
            });
          });
          row.element = tr;
          return row;
        });
      },

      /** Escreve o valor de uma coluna calculada na própria Tabela 1. */
      setDerived(tr, key, text) {
        const cell = tr.querySelector(`[data-derived="${key}"]`);
        if (cell) cell.textContent = text;
      },

      /** Destaca a coluna da equipe do aluno, para reduzir erro de digitação. */
      highlight(team) {
        tbody.closest("table").querySelectorAll("[data-eq]").forEach(cell => {
          cell.classList.toggle("mine", cell.dataset.eq === String(team));
        });
      },

      /** Snapshot para o localStorage. */
      snapshot() {
        return api.read().map(row => row.raw);
      },

      restore(rows) {
        if (!Array.isArray(rows) || !rows.length) return false;
        tbody.innerHTML = "";
        rows.forEach(values => api.addRow(values));
        return true;
      },
    };

    return api;
  }

  /* ------------------------------------------------------------ imagens */

  /**
   * Liga os seletores de imagem aos seus previews. Devolve o objeto que
   * acumula os arquivos, para a montagem do pacote.
   */
  function bindUploads() {
    const uploads = {};
    document.querySelectorAll("[data-file]").forEach(input => {
      input.addEventListener("change", () => {
        const slot = input.dataset.file;
        const file = input.files && input.files[0];
        const thumb = document.querySelector(`[data-thumb="${slot}"]`);
        if (!file) {
          delete uploads[slot];
          if (thumb) thumb.innerHTML = "";
          return;
        }
        uploads[slot] = { blob: file, extension: (file.name.split(".").pop() || "png").toLowerCase() };
        if (!thumb) return;
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
    return uploads;
  }

  /** Figura opcional: vira \includegraphics se o aluno enviou, comentário se não. */
  function optionalFigure(uploads, slot, caption, label, width) {
    return uploads[slot]
      ? latexFigure({ file: `figuras/${slot}.${uploads[slot].extension}`, caption, label, width })
      : `% Nenhuma imagem enviada para: ${caption}\n`;
  }

  /* --------------------------------------------------- cabeçalho do .tex */

  /** Preenche os \newcommand de identificação do modelo de relatório. */
  function fillTemplate(template, { titulo, subtitulo, equipe, integrantes, data }) {
    return template
      .replace(/\\newcommand\{\\experimento\}\{[^}]*\}/,
        () => `\\newcommand{\\experimento}{${titulo}}`)
      .replace(/\\newcommand\{\\subtitulo\}\{[^}]*\}/,
        () => `\\newcommand{\\subtitulo}{${subtitulo}}`)
      .replace(/\\newcommand\{\\equipe\}\{[^}]*\}/,
        () => `\\newcommand{\\equipe}{${latexEscape(equipe)}}`)
      .replace(/\\newcommand\{\\integrantes\}\{[^}]*\}/,
        () => `\\newcommand{\\integrantes}{${latexEscape(String(integrantes).replace(/\n+/g, "; "))}}`)
      .replace(/\\newcommand\{\\datarelatorio\}\{[^}]*\}/,
        () => `\\newcommand{\\datarelatorio}{${data}}`);
  }

  /** Data do campo <input type="date"> no formato brasileiro. */
  function dateBR(isoText) {
    return isoText ? isoText.split("-").reverse().join("/") : "\\today";
  }

  /** Célula de tabela que preserva os algarismos digitados pelo aluno. */
  function rawCell(text) {
    const value = String(text ?? "").trim();
    if (!value) return "--";
    const n = parseNum(value);
    return Number.isFinite(n) ? `\\num{${value.replace(",", ".")}}` : latexEscape(value);
  }

  return {
    parseNum, fmt, fmtTex, numTex, numTexAuto,
    teamTable, bindUploads, optionalFigure, fillTemplate, dateBR, rawCell,
    mean, meanDeviation, stdDev, linearFit, percentError,
    drawChart, drawScaleComparison,
    latexEscape, latexText, latexTable, latexFigure,
    toCsv, textBlob, canvasBlob, fetchText, saveFiles, downloadBlob,
    bindPersistence,
  };
})();
