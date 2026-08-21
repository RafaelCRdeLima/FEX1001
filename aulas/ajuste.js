/* ------------------------------------------------------------------ *
 *  Ajuste nos dois espaços — Aula 2 da FEX1001                         *
 *                                                                      *
 *  Três conjuntos de dados sintéticos, cada um de uma família de curvas *
 *  e com erro gaussiano em cada ponto. À esquerda o gráfico como foi    *
 *  medido; à direita, o mesmo conjunto já linearizado. Os controles     *
 *  movem os parâmetros do ajuste e as duas curvas respondem juntas —    *
 *  a reta de um lado é a curva do outro.                                *
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const raiz = document.getElementById('ajuste');
  if (!raiz) return;

  const COR = {
    tinta: '#102333', apagado: '#607080', branco: '#fffdf8',
    azul: '#1e5c83', ouro: '#e6b75c', vermelho: '#b9494d', verde: '#246444'
  };
  const num = (n, c = 2) => n.toFixed(c).replace('.', ',');

  // ruído gaussiano (Box-Muller)
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // ---------------------------------------------------------- conjuntos

  const CONJUNTOS = [
    {
      id: 'quad', rot: 'C x² + D',
      eq: 'y = C x² + D', linear: 'y contra x²',
      dom: [1, 10], n: 12, ruido: 0.030, relativo: false,
      p1: { rot: 'C', min: 0.4, max: 3.6, step: 0.02, real: 1.8, ini: 1.10 },
      p2: { rot: 'D', min: -25, max: 50, step: 0.5, real: 12, ini: 34 },
      f: (x, C, D) => C * x * x + D,
      gx: x => x * x, gy: y => y,
      rotX: 'x²', rotY: 'y',
      reta: (u, C, D) => C * u + D,
      // parâmetros a partir da reta ajustada em (x², y)
      dosCoef: (a, b) => [a, b]
    },
    {
      id: 'log', rot: 'C ln x + D',
      eq: 'y = C ln x + D', linear: 'y contra ln x',
      dom: [1, 20], n: 12, ruido: 0.030, relativo: false,
      p1: { rot: 'C', min: 0.5, max: 9, step: 0.05, real: 4.5, ini: 7.6 },
      p2: { rot: 'D', min: -12, max: 18, step: 0.25, real: 2, ini: -6 },
      f: (x, C, D) => C * Math.log(x) + D,
      gx: x => Math.log(x), gy: y => y,
      rotX: 'ln x', rotY: 'y',
      reta: (u, C, D) => C * u + D,
      dosCoef: (a, b) => [a, b]
    },
    {
      id: 'exp', rot: 'A e^Bx',
      eq: 'y = A e^{Bx}', linear: 'ln y contra x',
      dom: [1, 10], n: 12, ruido: 0.035, relativo: true,
      p1: { rot: 'A', min: 0.4, max: 9, step: 0.05, real: 3, ini: 6.5 },
      p2: { rot: 'B', min: 0.12, max: 0.75, step: 0.005, real: 0.42, ini: 0.26 },
      f: (x, A, B) => A * Math.exp(B * x),
      gx: x => x, gy: y => Math.log(y),
      rotX: 'x', rotY: 'ln y',
      reta: (u, A, B) => Math.log(A) + B * u,
      // a reta em (x, ln y) tem inclinação B e intercepto ln A
      dosCoef: (a, b) => [Math.exp(b), a]
    }
  ];

  let cj = CONJUNTOS[0];
  let p1 = cj.p1.ini, p2 = cj.p2.ini;
  let dados = [];

  function gerar() {
    const [a, b] = cj.dom;
    dados = [];
    // amplitude do ruído: uma fração da variação de y no intervalo
    const y0 = cj.f(a, cj.p1.real, cj.p2.real), y1 = cj.f(b, cj.p1.real, cj.p2.real);
    const faixa = Math.abs(y1 - y0);
    for (let i = 0; i < cj.n; i++) {
      const x = a + (b - a) * i / (cj.n - 1);
      const y = cj.f(x, cj.p1.real, cj.p2.real);
      dados.push({ x, y: cj.relativo ? y * (1 + cj.ruido * gauss()) : y + faixa * cj.ruido * gauss() });
    }
  }

  // ---------------------------------------------------------------- DOM

  raiz.innerHTML = `
    <div class="aj-topo">
      <div class="aj-grupo"><span class="aj-rot">Conjunto de dados</span><div class="aj-botoes" id="a-cj"></div></div>
      <div class="aj-grupo"><span class="aj-rot">&nbsp;</span><div class="aj-botoes">
        <button type="button" id="a-melhor" class="aj-bt aj-bt-forte">Melhor ajuste</button>
        <button type="button" id="a-novo" class="aj-bt">Novos dados</button>
      </div></div>
      <div class="aj-eq" id="a-eq"></div>
    </div>
    <div class="aj-controles">
      <label class="aj-slider"><span id="a-r1"></span><input type="range" id="a-s1"></label>
      <label class="aj-slider"><span id="a-r2"></span><input type="range" id="a-s2"></label>
    </div>
    <canvas id="a-tela" class="aj-tela"></canvas>
    <p class="aj-veredito" id="a-veredito"></p>`;

  const tela = raiz.querySelector('#a-tela');
  const ctx = tela.getContext('2d');
  const s1 = raiz.querySelector('#a-s1'), s2 = raiz.querySelector('#a-s2');
  const r1 = raiz.querySelector('#a-r1'), r2 = raiz.querySelector('#a-r2');
  const elEq = raiz.querySelector('#a-eq'), elVer = raiz.querySelector('#a-veredito');

  function prepararSliders() {
    [[s1, cj.p1, () => p1], [s2, cj.p2, () => p2]].forEach(([el, cfg, val]) => {
      el.min = cfg.min; el.max = cfg.max; el.step = cfg.step; el.value = val();
    });
    elEq.innerHTML = `\\(${cj.eq}\\)  ·  linearização: <strong>${cj.linear}</strong>`;
    if (window.renderMathInElement) {
      try { renderMathInElement(elEq, { delimiters: [{ left: '\\(', right: '\\)', display: false }] }); } catch (e) {}
    }
    rotulos();
  }

  function rotulos() {
    const casas = c => (c.step < 0.01 ? 3 : 2);
    r1.innerHTML = `<b>${cj.p1.rot}</b> = ${num(p1, casas(cj.p1))}`;
    r2.innerHTML = `<b>${cj.p2.rot}</b> = ${num(p2, casas(cj.p2))}`;
  }

  const caixaCj = raiz.querySelector('#a-cj');
  CONJUNTOS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aj-bt' + (c === cj ? ' ativo' : '');
    b.textContent = c.rot;
    b.addEventListener('click', e => {
      cj = c; p1 = c.p1.ini; p2 = c.p2.ini;
      caixaCj.querySelectorAll('.aj-bt').forEach(o => o.classList.remove('ativo'));
      b.classList.add('ativo');
      gerar(); prepararSliders(); desenhar();
      e.currentTarget.blur();
    });
    caixaCj.appendChild(b);
  });

  // As setas do reveal não devem navegar enquanto o controle está em foco;
  // ao soltar, o foco volta para a apresentação.
  [s1, s2].forEach((el, i) => {
    el.addEventListener('input', () => {
      if (i === 0) p1 = parseFloat(el.value); else p2 = parseFloat(el.value);
      rotulos(); desenhar();
    });
    el.addEventListener('keydown', ev => ev.stopPropagation());
    el.addEventListener('change', () => el.blur());
  });

  // reta de mínimos quadrados sobre os dados linearizados
  function minimosQuadrados() {
    const pts = dados.map(d => [cj.gx(d.x), cj.gy(d.y)]).filter(p => isFinite(p[0]) && isFinite(p[1]));
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxy = 0, sxx = 0;
    pts.forEach(p => { sxy += (p[0]-mx)*(p[1]-my); sxx += (p[0]-mx)**2; });
    const a = sxy / sxx, b = my - a * mx;
    const ssr = pts.reduce((s, p) => s + (p[1] - (a * p[0] + b)) ** 2, 0);
    return { a, b, ssr };
  }

  raiz.querySelector('#a-novo').addEventListener('click', e => { gerar(); desenhar(); e.currentTarget.blur(); });
  raiz.querySelector('#a-melhor').addEventListener('click', e => {
    const { a, b } = minimosQuadrados();
    const [v1, v2] = cj.dosCoef(a, b);
    p1 = Math.min(cj.p1.max, Math.max(cj.p1.min, v1));
    p2 = Math.min(cj.p2.max, Math.max(cj.p2.min, v2));
    s1.value = p1; s2.value = p2;
    rotulos(); desenhar();
    e.currentTarget.blur();
  });

  // ------------------------------------------------------------ geometria

  const L = 1000, A = 348;
  let dpr = 1;

  function redimensionar() {
    const larguraCss = tela.clientWidth || L;
    dpr = Math.min(3, (window.devicePixelRatio || 1) * (larguraCss / L) * 1.4);
    tela.width = Math.round(L * dpr);
    tela.height = Math.round(A * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenhar();
  }

  // ------------------------------------------------------------- desenho

  function painel(x0, y0, w, h, pts, curva, rotX, rotY, titulo) {
    ctx.fillStyle = COR.branco;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = 'rgba(16,35,51,.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + .5, y0 + .5, w - 1, h - 1);

    // enquadramento pelos DADOS, para não dançar quando o ajuste está ruim
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const ymin = Math.min(...ys), ymax = Math.max(...ys);
    const mx = (xmax - xmin) * 0.09 || 1, my = (ymax - ymin) * 0.14 || 1;
    const P = 32;
    const sx = v => x0 + P + (v - (xmin - mx)) / ((xmax + mx) - (xmin - mx)) * (w - P - 16);
    const sy = v => y0 + h - P - (v - (ymin - my)) / ((ymax + my) - (ymin - my)) * (h - P - 22);

    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x0 + P, y0 + 16); ctx.lineTo(x0 + P, y0 + h - P); ctx.lineTo(x0 + w - 12, y0 + h - P);
    ctx.stroke();

    // curva do ajuste, recortada ao painel: um ajuste ruim sai do quadro
    ctx.save();
    ctx.beginPath(); ctx.rect(x0 + P, y0 + 12, w - P - 12, h - P - 12); ctx.clip();
    ctx.strokeStyle = COR.vermelho; ctx.lineWidth = 2.3;
    ctx.beginPath();
    for (let i = 0; i <= 220; i++) {
      const u = (xmin - mx) + i / 220 * ((xmax + mx) - (xmin - mx));
      const v = curva(u);
      if (!isFinite(v)) continue;
      i ? ctx.lineTo(sx(u), sy(v)) : ctx.moveTo(sx(u), sy(v));
    }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COR.azul;
    pts.forEach(([px, py]) => { ctx.beginPath(); ctx.arc(sx(px), sy(py), 4, 0, 2 * Math.PI); ctx.fill(); });

    ctx.fillStyle = COR.apagado;
    ctx.font = '13px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(rotX, x0 + w - 14, y0 + h - 10);
    ctx.textAlign = 'left';
    ctx.fillText(rotY, x0 + P + 7, y0 + 20);
    ctx.textAlign = 'center';
    ctx.font = '12px "DM Mono", ui-monospace, monospace';
    ctx.fillText(titulo, x0 + w / 2, y0 + 20);
  }

  function desenhar() {
    ctx.clearRect(0, 0, L, A);

    // esquerda: como foi medido
    painel(6, 6, 482, A - 12,
      dados.map(d => [d.x, d.y]),
      x => cj.f(x, p1, p2),
      'x', 'y', 'como você mediu');

    // direita: linearizado — a mesma curva vira reta
    const tr = dados.map(d => [cj.gx(d.x), cj.gy(d.y)]).filter(p => isFinite(p[0]) && isFinite(p[1]));
    painel(512, 6, 482, A - 12, tr,
      u => cj.reta(u, p1, p2),          // no espaço linearizado o modelo é uma reta
      cj.rotX, cj.rotY, 'depois da linearização');

    // resíduos no espaço linearizado, que é onde a reta vive
    let ssr = 0;
    tr.forEach(([u, v]) => {
      const prev = cj.reta(u, p1, p2);
      if (isFinite(prev)) ssr += (v - prev) ** 2;
    });
    // o piso do resíduo é o dos mínimos quadrados: comparar com ele é honesto,
    // porque com ruído o melhor ajuste não cai exatamente nos valores geradores
    const piso = minimosQuadrados().ssr;
    const bom = ssr <= piso * 1.08 + 1e-9;
    const fmt = v => (v < 100 ? num(v, 3) : num(v, 0));
    elVer.className = 'aj-veredito ' + (bom ? 'ok' : 'nao');
    elVer.innerHTML = bom
      ? `Resíduos: <strong>${fmt(ssr)}</strong> — o mínimo para estes dados.
         Melhor ajuste: a reta e a curva acertaram juntas.`
      : `Resíduos: <strong>${fmt(ssr)}</strong> — o mínimo possível é ${fmt(piso)}.
         Mexa nos controles: a reta e a curva se movem juntas.`;
  }

  // ------------------------------------------------- integração com o reveal

  const slide = raiz.closest('section');
  function quandoPronto(fn) {
    if (!window.Reveal) return;
    if (typeof Reveal.isReady === 'function' && Reveal.isReady()) fn(); else Reveal.on('ready', fn);
  }
  if (window.Reveal) {
    quandoPronto(() => { prepararSliders(); redimensionar(); });
    Reveal.on('slidechanged', ev => { if (ev.currentSlide === slide) redimensionar(); });
    Reveal.on('resize', redimensionar);
  }
  window.addEventListener('resize', redimensionar);
  gerar(); prepararSliders(); redimensionar();
})();
