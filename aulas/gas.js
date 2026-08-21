/* ------------------------------------------------------------------ *
 *  Onde o eixo começa — Aula 2 da FEX1001                              *
 *                                                                      *
 *  Lei de Gay-Lussac: pressão de um gás a volume constante, medida     *
 *  para várias temperaturas, com erro gaussiano em cada leitura.       *
 *  A faixa de pressão é estreita e fica longe do zero — é o caso em    *
 *  que a escolha do INÍCIO do eixo decide se o gráfico presta.         *
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const raiz = document.getElementById('gas');
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

  const TS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];   // °C
  const P0 = 101.3, SIGMA = 0.9;                              // kPa
  let dados = [];

  function gerar() {
    dados = TS.map(T => ({
      T, P: Math.round((P0 * (1 + T / 273) + SIGMA * gauss()) * 10) / 10
    }));
    montarTabela();
  }

  // ---------------------------------------------------------------- DOM

  raiz.innerHTML = `
    <div class="ca-corpo">
      <div class="ca-lado">
        <table class="ca-tabela" id="g-tabela"></table>
        <div class="ca-controles">
          <div class="ca-linha">
            <span class="ca-rot">Papel</span>
            <div class="ca-botoes" id="g-pos"></div>
            <button type="button" id="g-novo" class="ca-bt">Novos dados</button>
          </div>
          <div class="ca-linha">
            <span class="ca-rot">Eixo T</span>
            <label>início <input type="text" inputmode="decimal" id="g-it" value="0"></label>
            <label><input type="text" inputmode="decimal" id="g-et" value="1"> : 1 mm</label>
          </div>
          <div class="ca-linha">
            <span class="ca-rot">Eixo P</span>
            <label>início <input type="text" inputmode="decimal" id="g-ip" value="0"></label>
            <label><input type="text" inputmode="decimal" id="g-ep" value="0,5"> : 1 mm</label>
          </div>
        </div>
      </div>
      <div class="ca-vista">
        <canvas id="g-tela" class="ca-tela"></canvas>
        <p class="ca-veredito" id="g-veredito"></p>
      </div>
    </div>`;

  const tela = raiz.querySelector('#g-tela');
  const ctx = tela.getContext('2d');
  const elVer = raiz.querySelector('#g-veredito');
  const campos = ['g-it', 'g-et', 'g-ip', 'g-ep'].map(id => raiz.querySelector('#' + id));

  let retrato = true;

  function montarTabela() {
    const t = raiz.querySelector('#g-tabela');
    if (!t) return;
    t.innerHTML =
      '<thead><tr><th>T (°C)</th><th>P (kPa)</th></tr></thead><tbody>' +
      dados.map(d => `<tr><td>${d.T}</td><td>${num(d.P)}</td></tr>`).join('') +
      '</tbody>';
  }

  const caixaPos = raiz.querySelector('#g-pos');
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

  raiz.querySelector('#g-novo').addEventListener('click', e => { gerar(); desenhar(); e.currentTarget.blur(); });

  const ler = el => {
    const v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : NaN;
  };
  campos.forEach(el => {
    el.addEventListener('input', desenhar);
    el.addEventListener('keydown', ev => ev.stopPropagation());
  });

  // Passo do rótulo: da escada 1–2–5, o que der espaçamento perto de 25 mm.
  // É a regra do Passo 5 — valores de referência em múltiplos amigáveis.
  function passoBom(escala) {
    const alvo = 25 * escala;                    // em unidades da grandeza
    const dec = Math.pow(10, Math.floor(Math.log10(alvo)));
    let melhor = dec, dif = Infinity;
    [1, 2, 5, 10].forEach(m => {
      const cand = m * dec;
      const d = Math.abs(cand - alvo);
      if (d < dif) { dif = d; melhor = cand; }
    });
    return melhor;
  }

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
    if (!dados.length) return;        // o reveal pode pedir um desenho antes de gerar

    const it = ler(campos[0]), et = ler(campos[1]);
    const ip = ler(campos[2]), ep = ler(campos[3]);

    if (!(et > 0) || !(ep > 0) || !isFinite(it) || !isFinite(ip)) {
      elVer.className = 'ca-veredito ruim';
      elVer.textContent = 'Preencha os quatro campos. As escalas precisam ser números maiores que zero.';
      return;
    }

    const folhaL = retrato ? 180 : 280;
    const folhaA = retrato ? 280 : 180;
    const k = Math.min((A - 68) / 280, 1.95);
    const ox = 92, oy = 26;
    const fx = mm => ox + mm * k;
    const fy = mm => oy + folhaA * k - mm * k;

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

    // valores de referência nos eixos (Passo 5)
    ctx.fillStyle = COR.apagado;
    ctx.font = '11px "DM Mono", ui-monospace, monospace';
    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.2;
    const pt = passoBom(et), pp = passoBom(ep);
    ctx.textAlign = 'center';
    for (let v = Math.ceil(it / pt) * pt; (v - it) / et <= folhaL + 0.001; v += pt) {
      const X = fx((v - it) / et);
      ctx.beginPath(); ctx.moveTo(X, fy(0)); ctx.lineTo(X, fy(0) + 5); ctx.stroke();
      ctx.fillText(num(v, pt < 1 ? 1 : 0), X, fy(0) + 18);
    }
    ctx.textAlign = 'right';
    for (let v = Math.ceil(ip / pp) * pp; (v - ip) / ep <= folhaA + 0.001; v += pp) {
      const Y = fy((v - ip) / ep);
      ctx.beginPath(); ctx.moveTo(fx(0), Y); ctx.lineTo(fx(0) - 5, Y); ctx.stroke();
      ctx.fillText(num(v, pp < 1 ? 1 : 0), fx(0) - 9, Y + 4);
    }

    // pontos
    let fora = 0;
    let maxT = -Infinity, maxP = -Infinity, minT = Infinity, minP = Infinity;
    dados.forEach(d => {
      const tmm = (d.T - it) / et, pmm = (d.P - ip) / ep;
      maxT = Math.max(maxT, tmm); minT = Math.min(minT, tmm);
      maxP = Math.max(maxP, pmm); minP = Math.min(minP, pmm);
      const dentro = tmm >= 0 && tmm <= folhaL && pmm >= 0 && pmm <= folhaA;
      if (!dentro) fora++;
      ctx.strokeStyle = dentro ? COR.azul : COR.vermelho;
      ctx.fillStyle = dentro ? COR.azul : COR.vermelho;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(fx(tmm), fy(pmm), 5, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx(tmm), fy(pmm), 1.8, 0, 2 * Math.PI); ctx.fill();
    });

    ctx.fillStyle = COR.tinta;
    ctx.font = '14px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P (kPa)', ox - 4, oy - 8);
    ctx.textAlign = 'right';
    ctx.fillText('T (°C)', ox + folhaL * k, oy + folhaA * k + 32);

    // leitura: o eixo é uma coisa, a banda dos pontos é outra
    const bandaT = maxT - minT, bandaP = maxP - minP;
    ctx.fillStyle = COR.apagado;
    ctx.font = '13px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    const bx = ox + folhaL * k + 28;
    ctx.fillText(`folha ${retrato ? 'em retrato' : 'em paisagem'} — ${folhaL} × ${folhaA} mm`, bx, oy + 18);
    ctx.fillText(`eixo T vai até ${num(maxT, 0)} de ${folhaL} mm`, bx, oy + 46);
    ctx.fillText(`  os pontos ocupam ${num(bandaT, 0)} mm`, bx, oy + 66);
    ctx.fillText(`eixo P vai até ${num(maxP, 0)} de ${folhaA} mm`, bx, oy + 96);
    ctx.fillText(`  os pontos ocupam ${num(bandaP, 0)} mm`, bx, oy + 116);

    // veredito
    let classe, texto;
    const ocupaP = bandaP / folhaA, ocupaT = bandaT / folhaL;
    if (fora > 0) {
      const est = [];
      if (maxT > folhaL) est.push(`o eixo T precisa de ${num(maxT, 0)} mm e a folha tem ${folhaL}`);
      if (maxP > folhaA) est.push(`o eixo P precisa de ${num(maxP, 0)} mm e a folha tem ${folhaA}`);
      classe = 'ruim';
      texto = `<strong>Não cabe:</strong> ${est.join('; ')}. Aumente a escala desse eixo ou suba o início.`;
    } else if (ocupaP < 0.35) {
      classe = 'ruim';
      texto = `<strong>Os pontos se amontoam.</strong> A pressão varia só de ${num(dados[0].P)} a
               ${num(dados[dados.length - 1].P)} kPa, e essa faixa toda cabe em ${num(bandaP, 0)} mm.
               <strong>Suba o início do eixo P</strong> — não há nada para ver abaixo de 100 kPa.`;
    } else if (ocupaT < 0.4) {
      classe = 'meio';
      texto = `<strong>Sobra papel na horizontal.</strong> Os pontos ocupam ${num(bandaT, 0)} mm
               de ${folhaL}. Diminua o número antes de “: 1 mm” no eixo T.`;
    } else {
      classe = 'bom';
      texto = `<strong>Bem enquadrado.</strong> Os pontos ocupam ${num(bandaT, 0)} mm na horizontal
               e ${num(bandaP, 0)} mm na vertical — ${num(100 * ocupaT, 0)}% e ${num(100 * ocupaP, 0)}%
               da folha.`;
    }
    elVer.className = 'ca-veredito ' + classe;
    elVer.innerHTML = texto;
  }

  // ------------------------------------------------- integração com o reveal

  gerar();                            // dados antes de qualquer desenho

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
  redimensionar();
})();
