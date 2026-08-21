/* ------------------------------------------------------------------ *
 *  Linearização ao vivo — Aula 2 da FEX1001                            *
 *                                                                      *
 *  O aluno escolhe o fenômeno e depois escolhe a transformação dos      *
 *  eixos. O painel da direita mostra se aquela escolha endireitou ou    *
 *  não a curva, com a reta de mínimos quadrados e o r² como veredito.   *
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const raiz = document.getElementById('linearizacao');
  if (!raiz) return;

  const COR = {
    tinta: '#102333', apagado: '#607080', branco: '#fffdf8',
    azul: '#1e5c83', ouro: '#e6b75c', vermelho: '#b9494d', verde: '#246444'
  };
  const num = (n, c = 2) => n.toFixed(c).replace('.', ',');

  // ------------------------------------------------------------ fenômenos

  const FENOMENOS = [
    { id: 'quad', rot: 'C x² + D', f: x => 1.8 * x * x + 12, dom: [1, 10],
      certo: { ex: 'x2', ey: 'y' }, dica: 'x²' },
    { id: 'inv',  rot: 'C/x + D',  f: x => 40 / x + 6,       dom: [1, 10],
      certo: { ex: 'inv', ey: 'y' }, dica: '1/x' },
    { id: 'exp',  rot: 'A e\u1D2E\u02E3', f: x => 3 * Math.exp(0.42 * x), dom: [1, 10],
      certo: { ex: 'x', ey: 'ln' }, dica: 'ln y contra x' },
    { id: 'pot',  rot: 'k xⁿ',     f: x => 5 * Math.pow(x, 1.6),   dom: [1, 20],
      certo: { ex: 'logx', ey: 'log' }, dica: 'log y contra log x' }
  ];

  const EIXO_X = [
    { id: 'x',    rot: 'x',      g: x => x },
    { id: 'x2',   rot: 'x²',     g: x => x * x },
    { id: 'inv',  rot: '1/x',    g: x => 1 / x },
    { id: 'logx', rot: 'log x',  g: x => Math.log10(x) }
  ];
  const EIXO_Y = [
    { id: 'y',   rot: 'y',      g: y => y },
    { id: 'ln',  rot: 'ln y',   g: y => Math.log(y) },
    { id: 'log', rot: 'log y',  g: y => Math.log10(y) }
  ];

  let fen = FENOMENOS[0], ex = EIXO_X[0], ey = EIXO_Y[0];
  let dados = [];

  function gerar() {
    const [a, b] = fen.dom, n = 9;
    dados = [];
    for (let i = 0; i < n; i++) {
      const x = a + (b - a) * i / (n - 1);
      const y = fen.f(x);
      dados.push({ x, y: y * (1 + (Math.random() - 0.5) * 0.035) });   // 5% de ruído
    }
  }

  // ---------------------------------------------------------------- DOM

  raiz.innerHTML = `
    <div class="lin-painel">
      <div class="lin-grupo"><span class="lin-rot">Fenômeno medido</span><div class="lin-botoes" id="l-fen"></div></div>
      <div class="lin-grupo"><span class="lin-rot">Eixo horizontal</span><div class="lin-botoes" id="l-ex"></div></div>
      <div class="lin-grupo"><span class="lin-rot">Eixo vertical</span><div class="lin-botoes" id="l-ey"></div></div>
      <button type="button" id="l-novo" class="lin-bt">Novos dados</button>
    </div>
    <canvas id="l-tela" class="lin-tela"></canvas>
    <p class="lin-veredito" id="l-veredito"></p>`;

  const tela = raiz.querySelector('#l-tela');
  const ctx = tela.getContext('2d');
  const elVer = raiz.querySelector('#l-veredito');

  function botoes(caixaId, lista, atual, aoEscolher) {
    const caixa = raiz.querySelector(caixaId);
    caixa.innerHTML = '';
    lista.forEach(item => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lin-bt' + (item.id === atual().id ? ' ativo' : '');
      b.textContent = item.rot;
      b.addEventListener('click', e => {
        aoEscolher(item);
        caixa.querySelectorAll('.lin-bt').forEach(o => o.classList.remove('ativo'));
        b.classList.add('ativo');
        desenhar();
        e.currentTarget.blur();
      });
      caixa.appendChild(b);
    });
  }

  botoes('#l-fen', FENOMENOS, () => fen, it => { fen = it; gerar(); });
  botoes('#l-ex', EIXO_X, () => ex, it => { ex = it; });
  botoes('#l-ey', EIXO_Y, () => ey, it => { ey = it; });
  raiz.querySelector('#l-novo').addEventListener('click', e => { gerar(); desenhar(); e.currentTarget.blur(); });

  // ------------------------------------------------------------ geometria

  const L = 1000, A = 330;
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

  function painel(x0, y0, w, h, pts, tituloX, tituloY, comReta) {
    ctx.fillStyle = COR.branco;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = 'rgba(16,35,51,.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + .5, y0 + .5, w - 1, h - 1);

    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const ymin = Math.min(...ys), ymax = Math.max(...ys);
    const mx = (xmax - xmin) * 0.10 || 1, my = (ymax - ymin) * 0.12 || 1;
    const P = 34;
    const sx = v => x0 + P + (v - (xmin - mx)) / ((xmax + mx) - (xmin - mx)) * (w - P - 18);
    const sy = v => y0 + h - P - (v - (ymin - my)) / ((ymax + my) - (ymin - my)) * (h - P - 20);

    // eixos
    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x0 + P, y0 + 14); ctx.lineTo(x0 + P, y0 + h - P); ctx.lineTo(x0 + w - 14, y0 + h - P);
    ctx.stroke();

    // reta de mínimos quadrados
    let r2 = null, a = 0, b = 0;
    if (comReta) {
      const n = pts.length;
      const mX = xs.reduce((s, v) => s + v, 0) / n, mY = ys.reduce((s, v) => s + v, 0) / n;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < n; i++) { sxy += (xs[i]-mX)*(ys[i]-mY); sxx += (xs[i]-mX)**2; syy += (ys[i]-mY)**2; }
      a = sxy / sxx; b = mY - a * mX;
      r2 = (sxy * sxy) / (sxx * syy);
      ctx.strokeStyle = COR.vermelho; ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx(xmin - mx), sy(a * (xmin - mx) + b));
      ctx.lineTo(sx(xmax + mx), sy(a * (xmax + mx) + b));
      ctx.stroke();
    }

    // pontos
    ctx.fillStyle = COR.azul;
    pts.forEach(([px, py]) => {
      ctx.beginPath(); ctx.arc(sx(px), sy(py), 4.5, 0, 2 * Math.PI); ctx.fill();
    });

    // rótulos
    ctx.fillStyle = COR.apagado;
    ctx.font = '13px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(tituloX, x0 + w - 16, y0 + h - 12);
    ctx.save();
    ctx.translate(x0 + 14, y0 + 20); ctx.textAlign = 'left';
    ctx.fillText(tituloY, 0, 0);
    ctx.restore();

    return { r2, a, b };
  }

  // r² de uma combinação qualquer de eixos, para saber qual é a melhor
  function r2De(gx, gy) {
    const pts = dados.map(d => [gx(d.x), gy(d.y)]).filter(p => isFinite(p[0]) && isFinite(p[1]));
    const n = pts.length;
    if (n < 3) return -1;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const mX = xs.reduce((s, v) => s + v, 0) / n, mY = ys.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i]-mX)*(ys[i]-mY); sxx += (xs[i]-mX)**2; syy += (ys[i]-mY)**2; }
    return (sxx && syy) ? (sxy * sxy) / (sxx * syy) : -1;
  }

  function melhorR2() {
    let m = -1;
    for (const a of EIXO_X) for (const b of EIXO_Y) m = Math.max(m, r2De(a.g, b.g));
    return m;
  }

  function desenhar() {
    ctx.clearRect(0, 0, L, A);
    const brutos = dados.map(d => [d.x, d.y]);
    painel(8, 6, 470, A - 12, brutos, 'x', 'y', false);

    const tr = dados
      .map(d => [ex.g(d.x), ey.g(d.y)])
      .filter(p => isFinite(p[0]) && isFinite(p[1]));
    const r = painel(522, 6, 470, A - 12, tr, ex.rot, ey.rot, true);

    ctx.fillStyle = COR.apagado;
    ctx.font = '12px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('como você mediu', 243, 24);
    ctx.fillText('depois da transformação', 757, 24);

    // "endireitou" = está tão reto quanto a melhor transformação possível,
    // em vez de um limiar fixo que depende do ruído sorteado
    const acertou = ex.id === fen.certo.ex && ey.id === fen.certo.ey;
    const bom = r.r2 !== null && r.r2 >= melhorR2() - 0.0004;
    elVer.className = 'lin-veredito ' + (bom ? 'ok' : 'nao');
    elVer.innerHTML = r.r2 === null ? '' :
      (bom
        ? `<strong>Endireitou.</strong> r² = ${num(r.r2, 4)} — coeficiente angular
           <strong>${num(r.a, 3)}</strong>, coeficiente linear <strong>${num(r.b, 2)}</strong>.
           ${acertou ? 'É a transformação prevista para este fenômeno.' : 'Equivale à prevista.'}`
        : `<strong>Ainda torto.</strong> r² = ${num(r.r2, 4)}. Uma reta de verdade dá r² muito
           próximo de 1 — tente outra transformação.`);
  }

  // ------------------------------------------------- integração com o reveal

  const slide = raiz.closest('section');
  function quandoPronto(fn) {
    if (!window.Reveal) return;
    if (typeof Reveal.isReady === 'function' && Reveal.isReady()) fn(); else Reveal.on('ready', fn);
  }
  if (window.Reveal) {
    quandoPronto(redimensionar);
    Reveal.on('slidechanged', ev => { if (ev.currentSlide === slide) redimensionar(); });
    Reveal.on('resize', redimensionar);
  }
  window.addEventListener('resize', redimensionar);
  gerar();
  redimensionar();
})();
