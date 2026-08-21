/* ------------------------------------------------------------------ *
 *  Do tabelamento ao papel — Aula 2 da FEX1001                         *
 *                                                                      *
 *  Dados de um carrinho acelerado, com erro gaussiano em cada medida    *
 *  de posição. A tabela fica à esquerda; o aluno digita o início e a    *
 *  escala de cada eixo, no formato "unidades : 1 mm", e vê os pontos    *
 *  caindo na folha milimetrada.                                        *
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const raiz = document.getElementById('carrinho');
  if (!raiz) return;

  const COR = {
    tinta: '#102333', apagado: '#607080', branco: '#fffdf8',
    azul: '#1e5c83', ouro: '#e6b75c', vermelho: '#b9494d', verde: '#246444'
  };
  const num = (n, c = 1) => n.toFixed(c).replace('.', ',');

  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Carrinho em movimento uniformemente acelerado.
  // t em 10^-2 s; x em cm.  x = 12,0 + 0,250 t + 0,0120 t²
  const TS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const SIGMA = 1.5;                       // cm
  let dados = [];

  function gerar() {
    dados = TS.map(t => {
      const x = 12 + 0.25 * t + 0.012 * t * t;
      return { t, x: Math.round((x + SIGMA * gauss()) * 10) / 10 };
    });
    montarTabela();
  }

  // ---------------------------------------------------------------- DOM

  raiz.innerHTML = `
    <div class="ca-corpo">
      <div class="ca-lado">
        <table class="ca-tabela" id="c-tabela"></table>
        <div class="ca-controles">
          <div class="ca-linha">
            <span class="ca-rot">Papel</span>
            <div class="ca-botoes" id="c-pos"></div>
            <button type="button" id="c-novo" class="ca-bt">Novos dados</button>
          </div>
          <div class="ca-linha">
            <span class="ca-rot">Eixo t</span>
            <label>início <input type="text" inputmode="decimal" id="c-it" value="0"></label>
            <label><input type="text" inputmode="decimal" id="c-et" value="1"> : 1 mm</label>
          </div>
          <div class="ca-linha">
            <span class="ca-rot">Eixo x</span>
            <label>início <input type="text" inputmode="decimal" id="c-ix" value="0"></label>
            <label><input type="text" inputmode="decimal" id="c-ex" value="1"> : 1 mm</label>
          </div>
        </div>
      </div>
      <div class="ca-vista">
        <canvas id="c-tela" class="ca-tela"></canvas>
        <p class="ca-veredito" id="c-veredito"></p>
      </div>
    </div>`;

  const tela = raiz.querySelector('#c-tela');
  const ctx = tela.getContext('2d');
  const elVer = raiz.querySelector('#c-veredito');
  const campos = ['c-it', 'c-et', 'c-ix', 'c-ex'].map(id => raiz.querySelector('#' + id));

  let retrato = true;

  function montarTabela() {
    const t = raiz.querySelector('#c-tabela');
    if (!t) return;
    t.innerHTML =
      '<thead><tr><th>t (10⁻² s)</th><th>x (cm)</th></tr></thead><tbody>' +
      dados.map(d => `<tr><td>${d.t}</td><td>${num(d.x)}</td></tr>`).join('') +
      '</tbody>';
  }

  const caixaPos = raiz.querySelector('#c-pos');
  [['Retrato', true], ['Paisagem', false]].forEach(([rot, r]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ca-bt' + (r === retrato ? ' ativo' : '');
    b.textContent = rot;
    b.addEventListener('click', e => {
      retrato = r;
      caixaPos.querySelectorAll('.ca-bt').forEach(o => o.classList.remove('ativo'));
      b.classList.add('ativo');
      desenhar();
      e.currentTarget.blur();
    });
    caixaPos.appendChild(b);
  });

  raiz.querySelector('#c-novo').addEventListener('click', e => { gerar(); desenhar(); e.currentTarget.blur(); });

  // vírgula ou ponto; o reveal já ignora teclas com foco em input, mas não custa
  const ler = el => {
    const v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : NaN;
  };
  campos.forEach(el => {
    el.addEventListener('input', desenhar);
    el.addEventListener('keydown', ev => ev.stopPropagation());
  });

  // ------------------------------------------------------------ geometria

  const L = 1000, A = 588;
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

  function desenhar() {
    ctx.clearRect(0, 0, L, A);

    const it = ler(campos[0]), et = ler(campos[1]);
    const ix = ler(campos[2]), ex = ler(campos[3]);

    if (!(et > 0) || !(ex > 0) || !isFinite(it) || !isFinite(ix)) {
      elVer.className = 'ca-veredito ruim';
      elVer.textContent = 'Preencha os quatro campos. As escalas precisam ser números maiores que zero.';
      return;
    }

    const folhaL = retrato ? 180 : 280;
    const folhaA = retrato ? 280 : 180;
    const k = Math.min((A - 68) / 280, 1.95);
    const ox = 74, oy = 26;
    const fx = mm => ox + mm * k;
    const fy = mm => oy + folhaA * k - mm * k;

    // folha
    ctx.fillStyle = COR.branco;
    ctx.fillRect(ox, oy, folhaL * k, folhaA * k);

    const linhas = (passo, alfa, largura) => {
      ctx.strokeStyle = `rgba(30,92,131,${alfa})`;
      ctx.lineWidth = largura;
      ctx.beginPath();
      for (let m = 0; m <= folhaL; m += passo) { ctx.moveTo(fx(m), oy); ctx.lineTo(fx(m), oy + folhaA * k); }
      for (let m = 0; m <= folhaA; m += passo) { ctx.moveTo(ox, fy(m)); ctx.lineTo(ox + folhaL * k, fy(m)); }
      ctx.stroke();
    };
    linhas(1, 0.09, 0.5); linhas(5, 0.18, 0.6); linhas(10, 0.32, 0.8); linhas(50, 0.52, 1.1);

    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.4;
    ctx.strokeRect(ox + .5, oy + .5, folhaL * k, folhaA * k);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx(0), oy); ctx.lineTo(fx(0), fy(0)); ctx.lineTo(ox + folhaL * k, fy(0));
    ctx.stroke();

    // pontos
    let fora = 0, noEixo = 0;
    let maxTmm = 0, maxXmm = 0;
    dados.forEach(d => {
      const tmm = (d.t - it) / et;
      const xmm = (d.x - ix) / ex;
      maxTmm = Math.max(maxTmm, tmm); maxXmm = Math.max(maxXmm, xmm);
      const dentro = tmm >= 0 && tmm <= folhaL && xmm >= 0 && xmm <= folhaA;
      if (!dentro) fora++;
      if (Math.abs(tmm) < 0.5) noEixo++;
      ctx.strokeStyle = dentro ? COR.azul : COR.vermelho;
      ctx.fillStyle = dentro ? COR.azul : COR.vermelho;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(fx(tmm), fy(xmm), 5, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx(tmm), fy(xmm), 1.8, 0, 2 * Math.PI); ctx.fill();
    });

    // rótulos dos eixos, como manda o Passo 3
    ctx.fillStyle = COR.tinta;
    ctx.font = '14px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('x (cm)', ox - 4, oy - 8);
    ctx.textAlign = 'right';
    ctx.fillText('t (10⁻² s)', ox + folhaL * k, oy + folhaA * k + 20);

    // leitura à direita da folha
    const usoT = maxTmm, usoX = maxXmm;
    ctx.fillStyle = COR.apagado;
    ctx.font = '13px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    const bx = ox + folhaL * k + 30;
    ctx.fillText(`folha ${retrato ? 'em retrato' : 'em paisagem'} — ${folhaL} × ${folhaA} mm`, bx, oy + 18);
    ctx.fillText(`t vai até ${num(usoT, 0)} de ${folhaL} mm  (${num(100 * usoT / folhaL, 0)}%)`, bx, oy + 46);
    ctx.fillText(`x vai até ${num(usoX, 0)} de ${folhaA} mm  (${num(100 * usoX / folhaA, 0)}%)`, bx, oy + 68);

    // veredito
    const ocT = usoT / folhaL, ocX = usoX / folhaA;
    let classe, texto;
    if (fora > 0) {
      classe = 'ruim';
      texto = `<strong>Não cabe.</strong> ${fora} de ${dados.length} pontos ficaram fora,
               em vermelho. Aumente o número antes de “: 1 mm”.`;
    } else if (ocT < 0.5 || ocX < 0.5) {
      classe = 'meio';
      texto = `<strong>Cabe, mas sobra papel.</strong> ${num(100 * ocT, 0)}% da largura e
               ${num(100 * ocX, 0)}% da altura. Diminua o número antes de “: 1 mm”, ou recue o início.`;
    } else {
      classe = 'bom';
      texto = `<strong>Ocupa bem.</strong> ${num(100 * ocT, 0)}% da largura e ${num(100 * ocX, 0)}%
               da altura.`;
    }
    if (noEixo > 0 && fora === 0) {
      texto += ` O primeiro ponto ficou sobre o eixo vertical — vale recuar o início.`;
    }
    elVer.className = 'ca-veredito ' + classe;
    elVer.innerHTML = texto;
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
