/* ------------------------------------------------------------------ *
 *  Escolha da escala e da posição do papel — Aula 2 da FEX1001         *
 *                                                                      *
 *  O aluno escolhe retrato/paisagem, o início de cada eixo e a escala,  *
 *  e vê o Exemplo 15 caindo na folha de verdade: se cabe, se sobra      *
 *  papel, e se algum ponto vai parar em cima do eixo.                   *
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const raiz = document.getElementById('papel');
  if (!raiz) return;

  // Exemplo 15 — dilatação volumétrica de uma esfera
  const V = [64.1, 80.7, 97.8, 114.9, 138.0, 162.5, 195.0, 223.3, 260.0];
  const T = [60, 65, 70, 75, 80, 85, 90, 95, 100];
  const VMAX = Math.max(...V), TMAX = Math.max(...T);

  const COR = {
    tinta: '#102333', apagado: '#607080', papel: '#f6f3ec', branco: '#fffdf8',
    azul: '#1e5c83', ouro: '#e6b75c', vermelho: '#b9494d', verde: '#246444'
  };
  const num = (n, c = 0) => n.toFixed(c).replace('.', ',');

  // mm de papel por unidade da grandeza
  const ESC_V = [
    { rot: '1,0 : 1 mm', mm: 1 }, { rot: '1,0 : 2 mm', mm: 2 },
    { rot: '2,0 : 1 mm', mm: 0.5 }, { rot: '5,0 : 1 mm', mm: 0.2 }
  ];
  const ESC_T = [
    { rot: '1,00 : 1 mm', mm: 1 }, { rot: '1,00 : 2 mm', mm: 2 },
    { rot: '1,00 : 4 mm', mm: 4 }, { rot: '1,00 : 5 mm', mm: 5 }
  ];
  const INI_V = [{ rot: 'do zero', v: 0 }, { rot: 'em 60,0', v: 60 }];
  const INI_T = [{ rot: 'do zero', v: 0 }, { rot: 'em 60,00', v: 60 }];

  let retrato = true, escV = ESC_V[0], escT = ESC_T[0], iniV = INI_V[0], iniT = INI_T[0];

  // ---------------------------------------------------------------- DOM

  raiz.innerHTML = `
    <div class="pap-corpo">
      <div class="pap-painel">
        <div class="pap-grupo"><span class="pap-rot">Posição do papel</span><div class="pap-botoes" id="p-pos"></div></div>
        <div class="pap-grupo"><span class="pap-rot">Eixo V — início</span><div class="pap-botoes" id="p-iniv"></div></div>
        <div class="pap-grupo"><span class="pap-rot">Eixo V — escala</span><div class="pap-botoes pap-duplo" id="p-escv"></div></div>
        <div class="pap-grupo"><span class="pap-rot">Eixo T — início</span><div class="pap-botoes" id="p-init"></div></div>
        <div class="pap-grupo"><span class="pap-rot">Eixo T — escala</span><div class="pap-botoes pap-duplo" id="p-esct"></div></div>
      </div>
      <div class="pap-vista">
        <canvas id="p-tela" class="pap-tela"></canvas>
        <p class="pap-veredito" id="p-veredito"></p>
      </div>
    </div>`;

  const tela = raiz.querySelector('#p-tela');
  const ctx = tela.getContext('2d');
  const elVer = raiz.querySelector('#p-veredito');

  function grupo(sel, lista, ativo, escolher) {
    const caixa = raiz.querySelector(sel);
    caixa.innerHTML = '';
    lista.forEach(item => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pap-bt' + (ativo(item) ? ' ativo' : '');
      b.textContent = item.rot;
      b.addEventListener('click', e => {
        escolher(item);
        caixa.querySelectorAll('.pap-bt').forEach(o => o.classList.remove('ativo'));
        b.classList.add('ativo');
        desenhar();
        e.currentTarget.blur();          // devolve o teclado ao reveal
      });
      caixa.appendChild(b);
    });
  }

  grupo('#p-pos', [{ rot: 'Retrato', r: true }, { rot: 'Paisagem', r: false }],
        it => it.r === retrato, it => { retrato = it.r; });
  grupo('#p-iniv', INI_V, it => it === iniV, it => { iniV = it; });
  grupo('#p-escv', ESC_V, it => it === escV, it => { escV = it; });
  grupo('#p-init', INI_T, it => it === iniT, it => { iniT = it; });
  grupo('#p-esct', ESC_T, it => it === escT, it => { escT = it; });

  // ------------------------------------------------------------ geometria

  const L = 1000, A = 520;
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

    const folhaL = retrato ? 180 : 280;      // largura da folha, em mm
    const folhaA = retrato ? 280 : 180;      // altura da folha, em mm
    const usadaL = (TMAX - iniT.v) * escT.mm;
    const usadaA = (VMAX - iniV.v) * escV.mm;

    // px por mm: a folha inteira cabe na altura do canvas, com folga
    const k = Math.min((A - 60) / 280, 2.2);
    const ox = 66, oy = 24;                  // canto superior esquerdo da folha
    const fx = mm => ox + mm * k;
    const fy = mm => oy + folhaA * k - mm * k;   // origem no canto inferior esquerdo

    // folha
    ctx.fillStyle = COR.branco;
    ctx.fillRect(ox, oy, folhaL * k, folhaA * k);

    // malha milimetrada
    const linhas = (passo, alfa, largura) => {
      ctx.strokeStyle = `rgba(30,92,131,${alfa})`;
      ctx.lineWidth = largura;
      ctx.beginPath();
      for (let m = 0; m <= folhaL; m += passo) { ctx.moveTo(fx(m), oy); ctx.lineTo(fx(m), oy + folhaA * k); }
      for (let m = 0; m <= folhaA; m += passo) { ctx.moveTo(ox, fy(m)); ctx.lineTo(ox + folhaL * k, fy(m)); }
      ctx.stroke();
    };
    linhas(1, 0.10, 0.5);
    linhas(5, 0.20, 0.6);
    linhas(10, 0.34, 0.8);
    linhas(50, 0.55, 1.1);

    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.4;
    ctx.strokeRect(ox + .5, oy + .5, folhaL * k, folhaA * k);

    // eixos do gráfico, na borda esquerda e inferior da folha
    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx(0), oy); ctx.lineTo(fx(0), fy(0)); ctx.lineTo(ox + folhaL * k, fy(0));
    ctx.stroke();

    // pontos experimentais
    let fora = 0, noEixo = 0;
    for (let i = 0; i < V.length; i++) {
      const xmm = (T[i] - iniT.v) * escT.mm;
      const ymm = (V[i] - iniV.v) * escV.mm;
      const dentro = xmm >= 0 && xmm <= folhaL && ymm >= 0 && ymm <= folhaA;
      if (!dentro) fora++;
      if (Math.abs(xmm) < 0.5) noEixo++;
      ctx.strokeStyle = dentro ? COR.azul : COR.vermelho;
      ctx.fillStyle = dentro ? COR.azul : COR.vermelho;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(fx(xmm), fy(ymm), 4.5, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx(xmm), fy(ymm), 1.6, 0, 2 * Math.PI); ctx.fill();
    }

    // cotas do que foi ocupado
    const cota = (x1, y1, x2, y2, texto, cor) => {
      ctx.strokeStyle = cor; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.save(); ctx.fillStyle = cor;
      ctx.font = '12px "DM Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      if (x1 === x2) { ctx.translate(x1 - 12, (y1 + y2) / 2); ctx.rotate(-Math.PI / 2); }
      else { ctx.translate((x1 + x2) / 2, y2 + 16); }
      ctx.fillText(texto, 0, 0);
      ctx.restore();
    };
    const corA = usadaA > folhaA ? COR.vermelho : COR.ouro;
    const corL = usadaL > folhaL ? COR.vermelho : COR.ouro;
    cota(ox - 6, fy(0), ox - 6, fy(Math.min(usadaA, folhaA)), num(usadaA) + ' mm', corA);
    cota(ox, oy + folhaA * k + 6, fx(Math.min(usadaL, folhaL)), oy + folhaA * k + 6, num(usadaL) + ' mm', corL);

    // legenda da folha
    ctx.fillStyle = COR.apagado;
    ctx.font = '13px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`folha ${retrato ? 'em retrato' : 'em paisagem'} — ${folhaL} × ${folhaA} mm`,
                 ox + folhaL * k + 30, oy + 20);
    ctx.font = '12px "DM Mono", ui-monospace, monospace';
    ctx.fillText(`V ocupa ${num(usadaA)} de ${folhaA} mm  (${num(100 * usadaA / folhaA)}%)`,
                 ox + folhaL * k + 30, oy + 48);
    ctx.fillText(`T ocupa ${num(usadaL)} de ${folhaL} mm  (${num(100 * usadaL / folhaL)}%)`,
                 ox + folhaL * k + 30, oy + 70);

    // veredito
    const ocupA = usadaA / folhaA, ocupL = usadaL / folhaL;
    let classe, texto;
    if (fora > 0) {
      classe = 'ruim';
      texto = `<strong>Não cabe.</strong> ${fora} de ${V.length} pontos caem fora da folha —
               em vermelho. Reduza a escala ou mude a posição do papel.`;
    } else if (ocupA < 0.5 || ocupL < 0.5) {
      classe = 'meio';
      texto = `<strong>Cabe, mas sobra papel.</strong> Ocupa ${num(100 * ocupL)}% da largura e
               ${num(100 * ocupA)}% da altura. Dá para usar uma escala maior.`;
    } else {
      classe = 'bom';
      texto = `<strong>Ocupa bem.</strong> ${num(100 * ocupL)}% da largura e
               ${num(100 * ocupA)}% da altura, com escala limpa.`;
    }
    if (noEixo > 0 && fora === 0) {
      texto += ` <em>Repare:</em> o primeiro ponto caiu <strong>em cima do eixo vertical</strong> —
                 por isso a apostila desloca o valor inicial um pouco para a direita.`;
    }
    elVer.className = 'pap-veredito ' + classe;
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
  redimensionar();
})();
