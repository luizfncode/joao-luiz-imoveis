/* ===== Configuração =====
   Coloque os frames em /frames como f_0001.jpg ... f_0060.jpg (mesma cena, câmera avançando).
   Sugestão: 1920x1080, JPG/WebP ~150KB. Para mobile, use 1080x1920 (9:16) se quiser crop dedicado. */
const N = 60, PATH = i => `frames/f_${String(i + 1).padStart(4, '0')}.jpg`;

const $ = id => document.getElementById(id);
const cv = $('cv'), cx = cv.getContext('2d'), cv2 = $('cv2'), cx2 = cv2.getContext('2d');
const hero = $('hero'), stage = $('stage'), h1 = document.querySelector('h1'), cta = $('cta'), scr = $('scr'), tag = document.querySelector('.tag');
const imgs = new Array(N); let real = false, cur = 0, target = 0, last = -1;

/* Cena procedural: usada só enquanto não houver frames reais (mostra o efeito funcionando). */
function scene(c, w, h, t) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a3342'); g.addColorStop(.6, '#8a6a58'); g.addColorStop(1, '#1b1a19');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.translate(w * (.55 - t * .2), h * .66); const z = 1 + t * 1.1; c.scale(z, z);
  const u = Math.min(w, h * 1.6);
  const vol = (x, y, ww, hh, n) => {
    c.fillStyle = '#16151a'; c.fillRect(x, y, ww, hh);
    for (let i = 0; i < n; i++) { const wg = c.createLinearGradient(0, y, 0, y + hh); wg.addColorStop(0, '#f3c27a'); wg.addColorStop(1, '#b8692f');
      c.fillStyle = wg; c.fillRect(x + ww * (i + .12) / n, y + hh * .2, ww / n * .76, hh * .6); }
  };
  vol(-u * .45, -u * .12, u * .9, u * .14, 9);
  vol(-u * .3, -u * .27, u * .55, u * .14, 6);
  c.fillStyle = '#2b2a2e'; c.fillRect(-u * .34, -u * .285, u * .64, u * .02); c.fillRect(-u * .5, -u * .125, u * 1, u * .015);
  c.fillStyle = 'rgba(243,194,122,.18)'; c.fillRect(-u * .45, u * .02, u * .9, u * .1);
  c.restore();
}
function cover(c, im, w, h) {
  const r = Math.max(w / im.width, h / im.height), dw = im.width * r, dh = im.height * r;
  c.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
function draw(c, w, h, f) {
  const im = imgs[f] && imgs[f].complete && imgs[f].naturalWidth ? imgs[f] : null;
  if (real && im) cover(c, im, w, h); else if (!real) scene(c, w, h, f / (N - 1));
  else { for (let d = 1; d < N; d++) { const a = imgs[f - d] || imgs[f + d]; if (a && a.naturalWidth) { cover(c, a, w, h); break; } } }
}
function size() {
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * d; cv.height = innerHeight * d;
  const r = cv2.getBoundingClientRect(); cv2.width = r.width * d; cv2.height = r.height * d;
  last = -1; draw(cx2, cv2.width, cv2.height, N - 1);
}
/* Pré-carrega progressivamente: 1º frame, depois a cada 6, depois o resto. */
function load(i) { return new Promise(r => { const im = new Image(); im.onload = im.onerror = () => r(im); im.src = PATH(i); imgs[i] = im; }); }
(async () => {
  const first = await load(0);
  if (!first.naturalWidth) return;           /* sem frames: segue com a cena procedural */
  real = true; size();
  const order = [...Array(N).keys()]; order.sort((a, b) => (a % 6 > 0) - (b % 6 > 0) || a - b);
  for (let k = 1; k < N; k += 4) await Promise.all(order.slice(k, k + 4).map(load));
  draw(cx2, cv2.width, cv2.height, N - 1);
})();

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function onScroll() { const r = hero.getBoundingClientRect(); $('nav').classList.toggle('solid', r.bottom < innerHeight * .6); target = clamp(-r.top / (r.height - innerHeight)); }
function tick() {
  cur += (target - cur) * .12;                         /* suavização */
  const p = cur, fp = clamp(p / .75);                   /* 0–75%: frames | 75–85%: pausa | 85–100%: transição */
  const f = Math.round(fp * (N - 1));
  if (f !== last) { last = f; draw(cx, cv.width, cv.height, f); }
  h1.style.opacity = 1 - clamp(p / .4); h1.style.transform = `translateY(${-p * 90}px)`;
  tag.style.opacity = 1 - clamp(p / .3); cta.style.opacity = 1 - clamp(p / .2); cta.style.pointerEvents = p > .2 ? 'none' : '';
  scr.style.opacity = 1 - clamp(p / .1);
  const q = clamp((p - .85) / .15), e = q * q * (3 - 2 * q);
  stage.style.clipPath = q ? `inset(${e * 16}% ${e * 6}% ${e * 16}% ${e * 50}% round ${e * 28}px)` : 'none';
  requestAnimationFrame(tick);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { size(); onScroll(); });
size(); onScroll(); cur = target; tick();

/* ===== Seções novas: imagens (data-src) com fallback procedural ===== */
const phs = [...document.querySelectorAll('.ph')];
function paint(c) {
  const d = Math.min(devicePixelRatio || 1, 2), r = c.getBoundingClientRect(); if (!r.width) return;
  c.width = r.width * d; c.height = r.height * d; const x = c.getContext('2d');
  if (c._im && c._im.naturalWidth) cover(x, c._im, c.width, c.height); else scene(x, c.width, c.height, +c.dataset.t || 0);
}
function setSrc(c, src) { c._im = null; if (!src) return; const im = new Image(); im.onload = () => { c._im = im; paint(c); }; im.src = src; }
phs.forEach(c => { if (c.id !== 'prev') setSrc(c, c.dataset.src); paint(c); });
const prev = $('prev'), items = [...document.querySelectorAll('.svc li')];
function pick(li) { items.forEach(i => i.classList.toggle('on', i === li)); prev.dataset.t = li.dataset.t; setSrc(prev, li.dataset.src); paint(prev); }
items.forEach(li => { li.tabIndex = 0; li.addEventListener('mouseenter', () => pick(li)); li.addEventListener('focus', () => pick(li)); });
pick(items[0]);
addEventListener('resize', () => document.querySelectorAll('.ph').forEach(paint));
onScroll();

/* ===== Explorar imóveis (EDITAR os dados abaixo; os textos entre colchetes são provisórios) ===== */
const L = 'Luziânia — GO', WA = 'https://wa.me/5561999823527';
const P = [
  {fin:'comprar',tipo:'Casa',nome:'Casa residencial',t:.1},
  {fin:'comprar',tipo:'Apartamento',nome:'Apartamento residencial',t:.3},
  {fin:'comprar',tipo:'Terreno',nome:'Terreno',t:.5},
  {fin:'comprar',tipo:'Lote',nome:'Lote',t:.7},
  {fin:'comprar',tipo:'Casa',nome:'Casa residencial',t:.9},
  {fin:'comprar',tipo:'Terreno',nome:'Terreno',t:.4}
];
let fin = 'comprar';
function render() {
  const t = $('ft').value, r = P.filter(p => p.fin === fin && (!t || p.tipo === t));
  $('cnt').textContent = r.length ? r.length + (r.length === 1 ? ' imóvel à venda' : ' imóveis à venda') : '';
  $('list').innerHTML = r.length ? r.map(p => `<li><canvas class="ph" data-t="${p.t}"></canvas><div><span class="st">Venda</span><h3>${p.nome}</h3><p>${L}</p></div><p>Detalhes e valores sob consulta</p><b>Consulte valores</b><a target="_blank" rel="noopener" href="${WA}?text=${encodeURIComponent('Olá! Tenho interesse em: ' + p.nome + ' em ' + L)}">Ver detalhes</a></li>`).join('')
    : `<li class="empty">${fin === 'alugar' ? 'Consulte as opções de locação residenciais e comerciais com a nossa equipe.' : 'Nenhum imóvel nesse tipo no momento.'} <a href="${WA}" target="_blank" rel="noopener">Falar no WhatsApp</a></li>`;
  document.querySelectorAll('#list .ph').forEach(paint);
}
document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { fin = b.dataset.fin; document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); render(); });
$('ft').onchange = render;
$('go').onclick = () => { render(); $('list').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
render();

/* ===== Menu mobile e reveal ao rolar ===== */
const nav = $('nav'), bg = $('burger');
bg.onclick = () => { const o = nav.classList.toggle('open'); bg.setAttribute('aria-expanded', o); };
document.querySelectorAll('#menu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); bg.setAttribute('aria-expanded', false); }));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
} else document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));

/* =========================================================
   INTRO DE ABERTURA
========================================================= */

const siteIntro = document.getElementById('siteIntro');

let introStarted = false;

document.documentElement.classList.add('intro-lock');
document.body.classList.add('intro-lock');


function startSiteIntro() {

  if (introStarted || !siteIntro) return;

  introStarted = true;

  /* Pequeno tempo para garantir que o primeiro frame
     esteja renderizado atrás da intro */

  setTimeout(() => {

    siteIntro.classList.add('play');

  }, 120);


  /* Abre as cortinas */

  setTimeout(() => {

    siteIntro.classList.add('open');

  }, 850);


  /* Libera a página */

  setTimeout(() => {

    siteIntro.classList.add('done');

    document.documentElement.classList.remove('intro-lock');
    document.body.classList.remove('intro-lock');

  }, 1900);


  /* Remove completamente depois da animação */

  setTimeout(() => {

    siteIntro.remove();

  }, 2500);

}


/* Quando o primeiro frame real estiver pronto */
window.addEventListener('hero-first-frame-ready', startSiteIntro);


/* Fallback caso não existam frames reais */
setTimeout(() => {

  if (!introStarted) {
    startSiteIntro();
  }

}, 2200);