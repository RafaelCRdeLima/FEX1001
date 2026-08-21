/* ------------------------------------------------------------------ *
 *  Tábua de Galton — simulação para a aula de medidas                  *
 *                                                                      *
 *  Cada bolinha desce por R fileiras de pinos. Em cada pino ela cai     *
 *  para a esquerda ou para a direita com a mesma probabilidade, e a     *
 *  caçapa em que termina é o número de desvios para a direita.          *
 *  Muitos efeitos pequenos e independentes, somados: é o teorema        *
 *  central do limite acontecendo na frente da turma.                    *
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const raiz = document.getElementById('galton');
  if (!raiz) return;

  const FILEIRAS = 12;                   // R
  const CACAPAS = FILEIRAS + 1;          // bins: 0..R
  const MEDIA_TEORICA = FILEIRAS / 2;
  const SIGMA_TEORICO = Math.sqrt(FILEIRAS) / 2;

  // Probabilidade do balde central, C(12,6)/2^12 — serve para prever a altura
  // do histograma antes de soltar as bolinhas.
  const P_CENTRAL = (() => {
    let c = 1;
    for (let i = 0; i < FILEIRAS / 2; i++) c = c * (FILEIRAS - i) / (i + 1);
    return c / Math.pow(2, FILEIRAS);
  })();

  // Vírgula decimal: é uma aula em português, e sobre algarismos significativos.
  const num = n => n.toFixed(2).replace('.', ',');

  const COR = {
    tinta: '#102333', apagado: '#607080', papel: '#f6f3ec',
    azul: '#1e5c83', ouro: '#e6b75c', ciano: '#8dd7dc', vermelho: '#b9494d'
  };

  // ---------------------------------------------------------------- DOM

  raiz.innerHTML = `
    <div class="galton-painel">
      <div class="galton-grupo">
        <span class="galton-rot">Bolinhas</span>
        <div class="galton-botoes" id="g-quant"></div>
      </div>
      <div class="galton-grupo">
        <span class="galton-rot">Simulação</span>
        <div class="galton-botoes">
          <button type="button" id="g-soltar" class="galton-bt galton-bt-forte">Soltar</button>
          <button type="button" id="g-limpar" class="galton-bt">Limpar</button>
        </div>
      </div>
      <dl class="galton-numeros">
        <div><dt>caíram</dt><dd id="g-n">0</dd></div>
        <div><dt>média</dt><dd id="g-media">—</dd></div>
        <div><dt>desvio padrão</dt><dd id="g-sigma">—</dd></div>
      </dl>
    </div>
    <canvas id="g-tela" class="galton-tela"></canvas>
    <p class="galton-nota">
      Curva cheia: a normal com a média e o desvio padrão <em>previstos</em>
      (<span class="galton-mono">${MEDIA_TEORICA}</span> e
      <span class="galton-mono">${num(SIGMA_TEORICO)}</span>).
      Os números acima são os <em>medidos</em> nas bolinhas que já caíram.
    </p>`;

  const tela = raiz.querySelector('#g-tela');
  const ctx = tela.getContext('2d');
  const elN = raiz.querySelector('#g-n');
  const elMedia = raiz.querySelector('#g-media');
  const elSigma = raiz.querySelector('#g-sigma');

  const QUANTIDADES = [10, 100, 500, 2000];
  let quantidade = 500;

  const caixaQuant = raiz.querySelector('#g-quant');
  QUANTIDADES.forEach(q => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'galton-bt' + (q === quantidade ? ' ativo' : '');
    b.textContent = q;
    b.addEventListener('click', () => {
      quantidade = q;
      caixaQuant.querySelectorAll('.galton-bt').forEach(o => o.classList.remove('ativo'));
      b.classList.add('ativo');
      b.blur();                       // devolve o teclado ao reveal
    });
    caixaQuant.appendChild(b);
  });

  // -------------------------------------------------------------- estado

  let contagem = new Array(CACAPAS).fill(0);
  let voando = [];          // bolinhas em queda
  let porSoltar = 0;        // ainda não lançadas
  let somaBins = 0, somaBins2 = 0, totalCaidas = 0;
  let rodando = false, anim = null, ultimo = 0;
  let taxaSpawn = 0, acumulaSpawn = 0;   // bolinhas por segundo a lançar
  let escalaMax = 4;                     // topo do histograma, em contagem

  function limpar() {
    contagem = new Array(CACAPAS).fill(0);
    voando = [];
    porSoltar = 0;
    acumulaSpawn = 0;
    escalaMax = 4;
    somaBins = somaBins2 = totalCaidas = 0;
    atualizarNumeros();
    desenhar();
  }

  function soltar() {
    porSoltar += quantidade;
    // Espalha o lançamento no tempo: com poucas bolinhas dá para acompanhar cada
    // uma; com muitas, o lote inteiro cai em alguns segundos.
    const duracao = Math.min(6, Math.max(3, quantidade * 0.3));
    taxaSpawn = quantidade / duracao;
    fixarEscala();
    if (!rodando) laco();
  }

  // A escala vertical é decidida no momento de soltar, a partir do total já
  // comprometido: assim as barras só crescem durante a queda, em vez de dançar
  // a cada quadro por causa da renormalização pelo maior balde.
  function fixarEscala() {
    const comprometidas = totalCaidas + voando.length + porSoltar;
    const esperado = P_CENTRAL * comprometidas;
    const desvio = Math.sqrt(comprometidas * P_CENTRAL * (1 - P_CENTRAL));
    escalaMax = Math.max(4, Math.ceil(esperado + 2.1 * desvio));
  }

  raiz.querySelector('#g-soltar').addEventListener('click', e => { soltar(); e.currentTarget.blur(); });
  raiz.querySelector('#g-limpar').addEventListener('click', e => { limpar(); e.currentTarget.blur(); });

  // ------------------------------------------------------------ geometria

  // Dimensões lógicas: o slide tem 720 px de altura e já gasta ~190 px com
  // título, controles e nota — o canvas precisa caber nos ~450 px restantes.
  let L = 1000, A = 360, dpr = 1;
  const MARGEM = 46;
  const Y_PINO_TOPO = 24;
  const Y_PINO_BASE = 148;
  const Y_BASE = 302;               // linha do chão das caçapas
  const ALTURA_MAX_BARRA = 142;

  const larguraCacapa = () => (L - 2 * MARGEM) / CACAPAS;
  // x em unidades de caçapa (0..R) → pixel
  const px = u => MARGEM + (u + 0.5) * larguraCacapa();
  const pyFileira = k => Y_PINO_TOPO + (k / (FILEIRAS - 1)) * (Y_PINO_BASE - Y_PINO_TOPO);

  function redimensionar() {
    const larguraCss = tela.clientWidth || 1000;
    L = 1000;
    A = 360;
    dpr = Math.min(3, (window.devicePixelRatio || 1) * (larguraCss / L) * 1.4);
    tela.width = Math.round(L * dpr);
    tela.height = Math.round(A * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenhar();
  }

  // -------------------------------------------------------------- física

  function novaBolinha() {
    const desvios = [];
    for (let k = 0; k < FILEIRAS; k++) desvios.push(Math.random() < 0.5 ? -1 : 1);
    const bin = desvios.reduce((s, d) => s + (d > 0 ? 1 : 0), 0);
    return { desvios, bin, s: 0 };      // s = posição contínua na descida (0..FILEIRAS)
  }

  // posição horizontal (em unidades de caçapa) de uma bolinha em s
  function xDe(b) {
    const k = Math.min(FILEIRAS - 1, Math.floor(b.s));
    const frac = Math.min(1, b.s - k);
    let x = MEDIA_TEORICA;
    for (let i = 0; i < k; i++) x += b.desvios[i] * 0.5;
    return x + b.desvios[k] * 0.5 * frac;
  }

  function yDe(b) {
    if (b.s <= FILEIRAS - 1) return pyFileira(b.s);
    const t = Math.min(1, b.s - (FILEIRAS - 1));
    return pyFileira(FILEIRAS - 1) + t * (Y_BASE - 10 - pyFileira(FILEIRAS - 1));
  }

  const VEL = 5;                // fileiras por segundo

  function passo(dt) {
    acumulaSpawn += taxaSpawn * dt;
    while (acumulaSpawn >= 1 && porSoltar > 0) {
      voando.push(novaBolinha());
      porSoltar--;
      acumulaSpawn -= 1;
    }
    if (porSoltar === 0) acumulaSpawn = 0;
    const restantes = [];
    for (const b of voando) {
      b.s += VEL * dt;
      if (b.s >= FILEIRAS) {
        contagem[b.bin]++;
        totalCaidas++;
        somaBins += b.bin;
        somaBins2 += b.bin * b.bin;
      } else {
        restantes.push(b);
      }
    }
    voando = restantes;
    return porSoltar > 0 || voando.length > 0;
  }

  // ------------------------------------------------------------- desenho

  function desenhar() {
    ctx.clearRect(0, 0, L, A);

    const lc = larguraCacapa();
    const alturaMax = ALTURA_MAX_BARRA;
    // salvaguarda para o caso raro de um balde passar do previsto
    const maiorReal = Math.max(...contagem);
    if (maiorReal > escalaMax) escalaMax = maiorReal;

    // caçapas: barras do histograma
    for (let i = 0; i < CACAPAS; i++) {
      const h = (contagem[i] / escalaMax) * alturaMax;
      if (h > 0.5) {
        ctx.fillStyle = COR.azul;
        ctx.fillRect(px(i) - lc * 0.42, Y_BASE - h, lc * 0.84, h);
      }
    }

    // curva normal teórica, escalada ao maior balde
    if (totalCaidas > 0) {
      // A curva mostra a contagem *esperada* em cada balde para o número de
      // bolinhas que já caiu — por isso ela cresce junto com o histograma.
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const u = (i / 240) * FILEIRAS;
        const z = (u - MEDIA_TEORICA) / SIGMA_TEORICO;
        const dens = Math.exp(-z * z / 2) / (SIGMA_TEORICO * Math.sqrt(2 * Math.PI));
        const y = Y_BASE - (totalCaidas * dens / escalaMax) * alturaMax;
        i ? ctx.lineTo(px(u), y) : ctx.moveTo(px(u), y);
      }
      ctx.strokeStyle = COR.vermelho;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // chão
    ctx.beginPath();
    ctx.moveTo(MARGEM - 8, Y_BASE);
    ctx.lineTo(L - MARGEM + 8, Y_BASE);
    ctx.strokeStyle = COR.tinta;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // divisórias das caçapas
    ctx.strokeStyle = 'rgba(16,35,51,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CACAPAS; i++) {
      const x = MARGEM + i * lc;
      ctx.beginPath();
      ctx.moveTo(x, Y_BASE);
      ctx.lineTo(x, Y_BASE - 18);
      ctx.stroke();
    }

    // pinos
    ctx.fillStyle = 'rgba(16,35,51,0.45)';
    for (let k = 0; k < FILEIRAS; k++) {
      for (let j = 0; j <= k; j++) {
        const u = MEDIA_TEORICA + (j - k / 2);
        ctx.beginPath();
        ctx.arc(px(u), pyFileira(k), 2.6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // bolinhas em queda
    ctx.fillStyle = COR.ouro;
    for (const b of voando) {
      ctx.beginPath();
      ctx.arc(px(xDe(b)), yDe(b), 4.2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // rótulos das caçapas
    ctx.fillStyle = COR.apagado;
    ctx.font = '13px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < CACAPAS; i++) ctx.fillText(String(i), px(i), Y_BASE + 18);
    ctx.fillText('desvios para a direita', L / 2, Y_BASE + 38);
  }

  function atualizarNumeros() {
    elN.textContent = totalCaidas;
    if (totalCaidas < 2) {
      elMedia.textContent = elSigma.textContent = '—';
      return;
    }
    const m = somaBins / totalCaidas;
    const v = (somaBins2 - totalCaidas * m * m) / (totalCaidas - 1);
    elMedia.textContent = num(m);
    elSigma.textContent = num(Math.sqrt(Math.max(0, v)));
  }

  // ---------------------------------------------------------------- laço

  function laco(agora) {
    if (!rodando) { rodando = true; ultimo = agora || performance.now(); }
    const t = agora || performance.now();
    const dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;

    const continua = passo(dt);
    desenhar();
    atualizarNumeros();

    if (continua) {
      anim = requestAnimationFrame(laco);
    } else {
      rodando = false;
      anim = null;
    }
  }

  function parar() {
    if (anim) cancelAnimationFrame(anim);
    anim = null;
    rodando = false;
  }

  // ------------------------------------------------- integração com o reveal

  const slide = raiz.closest('section');

  function aoTrocarSlide(ev) {
    const atual = ev && ev.currentSlide;
    if (atual === slide) {
      redimensionar();
    } else {
      parar();
      voando = [];
      porSoltar = 0;
    }
  }

  // O evento 'ready' pode já ter disparado antes deste script rodar — não dá
  // para depender só dele.
  function quandoPronto(fn) {
    if (!window.Reveal) return;
    if (typeof Reveal.isReady === 'function' && Reveal.isReady()) fn();
    else Reveal.on('ready', fn);
  }

  if (window.Reveal) {
    quandoPronto(() => {
      redimensionar();
      if (Reveal.getCurrentSlide() !== slide) parar();
    });
    Reveal.on('slidechanged', aoTrocarSlide);
    Reveal.on('resize', redimensionar);
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();
})();
