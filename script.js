// ===== TEMA =====
const root = document.documentElement, themeToggle = document.getElementById('themeToggle');
let theme = root.getAttribute('data-theme') || 'light';
function applyTheme(t) {
  root.setAttribute('data-theme', t);
  themeToggle.setAttribute('aria-pressed', String(t === 'dark'));
  themeToggle.setAttribute('aria-label', t === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0a1a15' : '#10231d');
}
applyTheme(theme);
themeToggle.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', theme); } catch (e) {}
  applyTheme(theme);
});

// ===== MENÚ MÓVIL =====
const navToggle = document.getElementById('navToggle'), navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => navToggle.setAttribute('aria-expanded', String(navLinks.classList.toggle('open'))));
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => { navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }));

// ===== ACORDEÓN =====
const headers = document.querySelectorAll('.accordion-header');
function setOpen(h, open) {
  const b = h.nextElementSibling;
  h.setAttribute('aria-expanded', String(open));
  b.classList.toggle('open', open);
  b.style.maxHeight = open ? b.scrollHeight + 'px' : '';
}
headers.forEach(h => {
  h.type = 'button'; setOpen(h, false);
  h.addEventListener('click', () => {
    const open = h.getAttribute('aria-expanded') !== 'true';
    headers.forEach(x => setOpen(x, false));
    setOpen(h, open);
  });
});
window.addEventListener('resize', () => headers.forEach(h => h.getAttribute('aria-expanded') === 'true' && setOpen(h, true)));

// ===== TARJETAS =====
document.querySelectorAll('.tarjeta').forEach(t => {
  const flip = () => t.setAttribute('aria-pressed', String(t.classList.toggle('flipped')));
  t.addEventListener('click', flip);
  t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
});

// ===== CURVA DE CRECIMIENTO =====
const faseInfo = {
  lag: "Fase de latencia (lag): las bacterias se adaptan al nuevo medio. No hay aumento celular notable, pero sí alta actividad metabólica (síntesis de enzimas). Su duración determina cuánto tarda el cultivo en volverse productivo.",
  log: "Fase exponencial (log): división celular a velocidad máxima y constante. El número de bacterias aumenta exponencialmente y hay alto consumo de nutrientes. Es la fase de mayor interés industrial y de laboratorio.",
  estacionaria: "Fase estacionaria: la tasa de división se iguala a la tasa de muerte celular. Los nutrientes escasean y se acumulan desechos. Muchas bacterias producen metabolitos secundarios, como antibióticos, en esta fase.",
  muerte: "Fase de muerte: predomina la muerte celular sobre la división. Hay agotamiento extremo de nutrientes y alta acumulación de desechos. Marca el final del ciclo útil del cultivo."
};
const phaseRanges = { lag: [0, 1, 2], log: [3, 4, 5, 6], estacionaria: [7, 8], muerte: [9, 10] };
const phaseColors = { lag: '#6fc2b6', log: '#3a9188', estacionaria: '#d89a3c', muerte: '#c1604a' };
const dataPoints = [1, 1, 1.3, 3, 8, 20, 42, 46, 45, 22, 9], baseColor = '#5c6b64';
const phaseOf = i => Object.keys(phaseRanges).find(p => phaseRanges[p].includes(i));
const faseBtns = document.querySelectorAll('.fase-btn'), faseInfoBox = document.getElementById('faseInfo');
let growthChart = null;

function selectFase(fase) {
  faseBtns.forEach(b => b.classList.toggle('active', b.dataset.fase === fase));
  faseInfoBox.innerHTML = `<p>${faseInfo[fase]}</p>`;
  if (!growthChart) return;
  const ds = growthChart.data.datasets[0];
  ds.pointBackgroundColor = dataPoints.map((_, i) => phaseOf(i) === fase ? phaseColors[fase] : baseColor);
  ds.pointRadius = dataPoints.map((_, i) => phaseOf(i) === fase ? 7 : 4);
  growthChart.update();
}
faseBtns.forEach(b => b.addEventListener('click', () => selectFase(b.dataset.fase)));

if (document.getElementById('growthChart') && typeof Chart !== 'undefined') {
  growthChart = new Chart(document.getElementById('growthChart'), {
    type: 'line',
    data: { labels: dataPoints.map((_, i) => i), datasets: [{
      data: dataPoints, borderColor: 'rgba(111,194,182,.55)', borderWidth: 2, tension: .35,
      pointRadius: dataPoints.map(() => 4), pointHoverRadius: 7,
      pointBackgroundColor: dataPoints.map(() => baseColor),
      fill: { target: 'origin', above: 'rgba(58,145,136,.08)' }
    }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      onClick: (e, els) => { if (els.length) { const p = phaseOf(els[0].index); if (p) selectFase(p); } }
    }
  });
}

// ===== NAV ACTIVA + ANILLO DE PROGRESO =====
const sections = document.querySelectorAll('section[id]'), navAnchors = document.querySelectorAll('.nav-links a');
const petriFill = document.getElementById('petriFill'), CIRC = 276.5, colonies = document.querySelectorAll('.petri-colony');
function onScroll() {
  let current = '';
  sections.forEach(s => { if (scrollY >= s.offsetTop - 120) current = s.id; });
  navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
  const h = document.documentElement.scrollHeight - innerHeight, pct = h > 0 ? scrollY / h : 0;
  petriFill.style.strokeDashoffset = CIRC - CIRC * pct;
  [.2, .45, .7, .9].forEach((t, i) => colonies[i].classList.toggle('show', pct >= t));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== HERO: PLACA DE PETRI CON COLONIAS =====
const canvas = document.getElementById('colonyCanvas'), ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CYCLE = 24000, FADE = 1500;
let W, H, heroDish, heroColonies = [], t0 = 0, heroVisible = true;

function layout() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = canvas.offsetWidth; H = canvas.offsetHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  heroDish = W < 800
    ? { x: W * .78, y: H * .86, r: W * .3 }
    : { x: W * .74, y: H * .52, r: Math.min(H * .34, W * .2) };
  seed();
}
function seed() {
  heroColonies = [];
  const palette = ['111,194,182', '58,145,136', '216,154,60'];
  for (let n = 0, tries = 0; n < 16 && tries < 400; tries++) {
    const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * heroDish.r * .78;
    const c = {
      x: heroDish.x + Math.cos(a) * d, y: heroDish.y + Math.sin(a) * d,
      max: heroDish.r * (.04 + Math.random() * .08),
      delay: Math.random() * 9000, dur: 6000 + Math.random() * 4000,
      col: palette[Math.random() < .7 ? Math.floor(Math.random() * 2) : 2]
    };
    if (heroColonies.every(o => Math.hypot(o.x - c.x, o.y - c.y) > o.max + c.max + 6)) { heroColonies.push(c); n++; }
  }
}
function draw(el) {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = el > CYCLE - FADE ? Math.max(0, (CYCLE - el) / FADE) : 1;
  const g = ctx.createRadialGradient(heroDish.x, heroDish.y, 0, heroDish.x, heroDish.y, heroDish.r);
  g.addColorStop(0, 'rgba(216,154,60,.12)'); g.addColorStop(1, 'rgba(58,145,136,.08)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(heroDish.x, heroDish.y, heroDish.r, 0, 6.283); ctx.fill();
  ctx.strokeStyle = 'rgba(111,194,182,.4)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(111,194,182,.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(heroDish.x, heroDish.y, heroDish.r * .92, 0, 6.283); ctx.stroke();
  heroColonies.forEach(c => {
    const p = Math.min(Math.max((el - c.delay) / c.dur, 0), 1);
    if (p <= 0) return;
    const r = c.max * (1 - Math.pow(1 - p, 3));
    const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 2.2);
    glow.addColorStop(0, `rgba(${c.col},.35)`); glow.addColorStop(1, `rgba(${c.col},0)`);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(c.x, c.y, r * 2.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = `rgba(${c.col},.85)`; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(c.x - r * .3, c.y - r * .3, r * .3, 0, 6.283); ctx.fill();
  });
  ctx.globalAlpha = 1;
}
function loop(now) {
  if (heroVisible) {
    if (!t0) t0 = now;
    let el = now - t0;
    if (el > CYCLE) { t0 = now; seed(); el = 0; }
    draw(el);
  }
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { layout(); if (reduced) draw(CYCLE - FADE - 1); });
new IntersectionObserver(e => heroVisible = e[0].isIntersecting).observe(canvas);
layout();
if (reduced) draw(CYCLE - FADE - 1); else requestAnimationFrame(loop);

// ===== LABORATORIO: PLACA INTERACTIVA =====
const dish = document.getElementById('dishCanvas'), dctx = dish.getContext('2d');
const tempR = document.getElementById('tempRange'), phR = document.getElementById('phRange');
let dishCells = [], rate = 1;
const bell = (x, opt, w) => Math.exp(-((x - opt) ** 2) / (2 * w * w));
function updateRate() {
  const t = +tempR.value, p = +phR.value;
  rate = bell(t, 37, t < 37 ? 9 : 5) * bell(p, 7, 1.3); // modelo simplificado de bacteria mesófila
  document.getElementById('tempOut').textContent = t;
  document.getElementById('phOut').textContent = p.toFixed(1);
  document.getElementById('meterFill').style.width = (rate * 100) + '%';
  document.getElementById('simMsg').textContent =
    rate > .75 ? 'Condiciones óptimas: crecimiento exponencial.' :
    rate > .3 ? 'Crecimiento lento: te alejas del óptimo.' :
    rate > .05 ? 'Casi sin crecimiento.' :
    'Sin crecimiento: ' + (t > 50 ? 'el calor desnaturaliza las proteínas.' : t < 10 ? 'el frío frena el metabolismo.' : 'el pH inhibe las enzimas.');
}
function dishLoop() {
  if (Math.random() < rate * .35 && dishCells.length < 400) {
    const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * 140;
    dishCells.push({ x: 160 + Math.cos(a) * d, y: 160 + Math.sin(a) * d, r: 0, max: 2 + Math.random() * 3 });
  } else if (rate < .05 && Math.random() < .1) dishCells.pop();
  dctx.clearRect(0, 0, 320, 320);
  dctx.fillStyle = '#6fc2b6';
  dishCells.forEach(c => { if (c.r < c.max) c.r += .03 * rate; dctx.beginPath(); dctx.arc(c.x, c.y, c.r, 0, 6.283); dctx.fill(); });
  requestAnimationFrame(dishLoop);
}
tempR.addEventListener('input', updateRate); phR.addEventListener('input', updateRate);
updateRate(); dishLoop();

// ===== SIMULADOR (4 MISIONES) =====
const missions = [
  { title: "Misión 1 · Elegir el medio de cultivo", prompt: "Recibes una muestra con sospecha de infección por bacteria gramnegativa. ¿Qué medio usas para aislarla e identificarla?", options: ["Agar nutritivo", "Caldo nutritivo", "Agar MacConkey", "Agar sangre"], correct: 2, ok: "Correcto. El agar MacConkey es selectivo y diferencial para gramnegativas.", bad: "Ese medio no diferencia gramnegativas. El agar MacConkey era la opción indicada." },
  { title: "Misión 2 · Temperatura y pH", prompt: "Configuras la incubadora para un cultivo clínico. ¿Qué condiciones usas?", options: ["15 °C y pH 3.0", "37 °C y pH 7.0", "60 °C y pH 10.0", "80 °C y pH 12.0"], correct: 1, ok: "Correcto. 37 °C y pH neutro son ideales para bacterias de interés clínico.", bad: "Esas condiciones no favorecen el crecimiento. Lo correcto era 37 °C y pH 7.0." },
  { title: "Misión 3 · Detectar el error de técnica", prompt: "Un técnico siembra por estría sin flamear el asa entre cada estría y no logra colonias aisladas. ¿Cuál es el error?", options: ["Usó un medio selectivo incorrecto", "No flameó el asa entre estrías", "Incubó a baja temperatura", "Usó agar líquido en vez de sólido"], correct: 1, ok: "Correcto. Sin flamear el asa, la concentración bacteriana no disminuye progresivamente.", bad: "El error real fue no flamear el asa entre estrías." },
  { title: "Misión 4 · Leer la curva de crecimiento", prompt: "El cultivo lleva horas incubando: la población es estable, los nutrientes escasean y hay desechos acumulados. ¿Qué haces?", options: ["Esperar más tiempo (fase lag)", "Tomar muestra genética (fase log)", "Cosechar metabolitos secundarios (fase estacionaria)", "Descartar el cultivo (fase de muerte)"], correct: 2, ok: "Correcto. En fase estacionaria se acumulan metabolitos útiles, como antibióticos.", bad: "Esas señales corresponden a la fase estacionaria, momento de cosechar metabolitos." }
];
let current = 0, score = 0;
const labScreen = document.getElementById('labScreen'), scoreValue = document.getElementById('scoreValue');
const missionCount = document.getElementById('missionCount'), restartBtn = document.getElementById('restartGame');
const miniColonies = ['col1', 'col2', 'col3', 'col4'].map(id => document.getElementById(id));

function renderMission() {
  missionCount.textContent = `${current}/4`;
  if (current >= missions.length) return renderFinal();
  const m = missions[current];
  const order = [...m.options.keys()].sort(() => Math.random() - .5); // opciones en orden aleatorio
  labScreen.innerHTML = `
    <p class="mission-title">${m.title}</p>
    <p class="mission-prompt">${m.prompt}</p>
    <div class="mission-options">${order.map(i => `<button class="mission-option" type="button" data-index="${i}">${m.options[i]}</button>`).join('')}</div>
    <div class="mission-feedback" id="missionFeedback" hidden></div>`;
  labScreen.querySelectorAll('.mission-option').forEach(b => b.addEventListener('click', () => answerMission(+b.dataset.index)));
}
function answerMission(index) {
  const m = missions[current], fb = document.getElementById('missionFeedback'), right = index === m.correct;
  labScreen.querySelectorAll('.mission-option').forEach(b => {
    const i = +b.dataset.index; b.disabled = true;
    if (i === m.correct) b.classList.add('correct'); else if (i === index) b.classList.add('incorrect');
  });
  if (right) { score += 10; scoreValue.textContent = score; miniColonies[current].classList.add('show'); }
  fb.hidden = false; fb.classList.toggle('incorrect', !right); fb.textContent = right ? m.ok : m.bad;
  const next = document.createElement('button');
  next.className = 'btn btn-outline'; next.type = 'button';
  next.textContent = current < missions.length - 1 ? 'Siguiente misión' : 'Ver resultado';
  next.addEventListener('click', () => { current++; renderMission(); });
  labScreen.appendChild(next);
}
function renderFinal() {
  const msg = score === 40 ? "Colonia pura obtenida. Dominas el flujo completo de un cultivo bacteriano."
    : score >= 20 ? "Buen desempeño. Repasa los conceptos donde perdiste puntos."
    : "Cultivo contaminado. Vuelve al contenido científico antes de reintentar.";
  labScreen.innerHTML = `<div class="lab-final"><h3>UFC viables finales: ${score}/40</h3><p>${msg}</p></div>`;
  restartBtn.hidden = false;
}
restartBtn.addEventListener('click', () => {
  current = 0; score = 0; scoreValue.textContent = 0;
  miniColonies.forEach(c => c.classList.remove('show'));
  restartBtn.hidden = true; renderMission();
});
renderMission();