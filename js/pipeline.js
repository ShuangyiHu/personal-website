/* ═══════════════════════════════════════════════════════════════
   pipeline.js — Deep Research Agent Pipeline Animation
   ═══════════════════════════════════════════════════════════════ */

const Pipeline = (() => {
  // ── Helpers ──────────────────────────────────────────────────
  const pW  = () => document.getElementById('pipeline-stage').offsetWidth;
  const pH  = () => document.getElementById('pipeline-stage').offsetHeight;
  const pSvg = () => document.getElementById('pipeline-svg');
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Node layout as fractions of stage size
  const LAYOUT = {
    'n-query':    [0.50, 0.10],
    'n-planner':  [0.50, 0.22],
    'n-writer':   [0.50, 0.46],
    'n-claude':   [0.34, 0.61],
    'n-gemini':   [0.66, 0.61],
    'n-search2':  [0.50, 0.72],
    'n-rewriter': [0.50, 0.82],
    'n-guard':    [0.50, 0.90],
    'n-conv':     [0.50, 0.97],
  };
  const SEARCH_FX = [0.18, 0.32, 0.50, 0.68, 0.82];
  const SEARCH_FY = 0.34;

  function applyLayout() {
    for (const [id, [fx, fy]] of Object.entries(LAYOUT)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.style.left = (pW() * fx) + 'px';
      el.style.top  = (pH() * fy) + 'px';
    }
    SEARCH_FX.forEach((fx, i) => {
      const el = document.getElementById('n-s' + i);
      if (!el) return;
      el.style.left = (pW() * fx) + 'px';
      el.style.top  = (pH() * SEARCH_FY) + 'px';
    });
  }

  // ── SVG helpers ───────────────────────────────────────────────
  function mkEl(tag, attrs = {}) {
    const svg = pSvg();
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
    return el;
  }

  function nodeCenter(id) {
    const el = document.getElementById(id);
    if (!el) return { x: 0, y: 0 };
    return { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
  }

  function drawLine(x1, y1, x2, y2, cls, id) {
    const p = mkEl('line', { x1, y1, x2, y2, class: 'p-pipe ' + cls });
    if (id) p.id = id;
    return p;
  }

  function drawCurve(x1, y1, x2, y2, cls, id) {
    const mx = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    const p = mkEl('path', { d, class: 'p-pipe ' + cls });
    if (id) p.id = id;
    return p;
  }

  // ── Particle animations ───────────────────────────────────────
  function animParticle(x1, y1, x2, y2, cls = 'p-particle', dur = 600, delay = 0) {
    return new Promise(r => setTimeout(() => {
      const c = mkEl('circle', { r: 3, class: cls });
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const e = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        c.setAttribute('cx', x1 + (x2 - x1) * e);
        c.setAttribute('cy', y1 + (y2 - y1) * e);
        if (t < 1) requestAnimationFrame(step);
        else { c.remove(); r(); }
      }
      requestAnimationFrame(step);
    }, delay));
  }

  function animCurveParticle(x1, y1, x2, y2, cls = 'p-particle', dur = 700, delay = 0) {
    return new Promise(r => setTimeout(() => {
      const c = mkEl('circle', { r: 3, class: cls });
      const mx = (x1 + x2) / 2;
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const e = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const mt = 1 - e;
        c.setAttribute('cx', mt*mt*mt*x1 + 3*mt*mt*e*mx + 3*mt*e*e*mx + e*e*e*x2);
        c.setAttribute('cy', mt*mt*mt*y1 + 3*mt*mt*e*y1 + 3*mt*e*e*y2 + e*e*e*y2);
        if (t < 1) requestAnimationFrame(step);
        else { c.remove(); r(); }
      }
      requestAnimationFrame(step);
    }, delay));
  }

  // ── UI helpers ────────────────────────────────────────────────
  function show(id, delay = 0) {
    return new Promise(r => setTimeout(() => {
      document.getElementById(id)?.classList.add('visible'); r();
    }, delay));
  }
  function showPath(el, delay = 0) {
    return new Promise(r => setTimeout(() => {
      el?.classList.add('visible'); r();
    }, delay));
  }
  function setStatus(msg, state = '') {
    const el = document.getElementById('p-status-msg');
    el.className = state === 'warn' ? 'warn' : state === 'ok' ? 'ok' : '';
    el.textContent = msg;
  }
  function setDot(i, state) {
    const d = document.getElementById('dot-' + i);
    if (d) d.className = state;
  }

  // ── Path building ─────────────────────────────────────────────
  let paths = {};

  function buildPaths() {
    pSvg().innerHTML = '';
    paths = {};

    const q  = nodeCenter('n-query'),   pl = nodeCenter('n-planner');
    const wr = nodeCenter('n-writer'),   cl = nodeCenter('n-claude');
    const ge = nodeCenter('n-gemini'),   s2 = nodeCenter('n-search2');
    const rw = nodeCenter('n-rewriter'), gu = nodeCenter('n-guard');
    const co = nodeCenter('n-conv');

    paths.qpl = drawLine(q.x, q.y, pl.x, pl.y, 'p-pipe-cyan', 'p-qpl');

    SEARCH_FX.forEach((fx, i) => {
      const sx = pW() * fx, sy = pH() * SEARCH_FY;
      paths['ps' + i] = drawCurve(pl.x, pl.y, sx, sy, 'p-pipe-cyan', 'p-ps' + i);
      paths['sw' + i] = drawCurve(sx, sy, wr.x, wr.y, 'p-pipe-cyan', 'p-sw' + i);
    });

    paths.wrcl = drawCurve(wr.x, wr.y, cl.x, cl.y, 'p-pipe-violet', 'p-wrcl');
    paths.wrge = drawCurve(wr.x, wr.y, ge.x, ge.y, 'p-pipe-green',  'p-wrge');
    paths.clge = drawLine(cl.x,  cl.y,  ge.x, ge.y, 'p-pipe-red p-pipe-dash', 'p-clge');
    paths.cls2 = drawCurve(cl.x, cl.y, s2.x, s2.y, 'p-pipe-muted',  'p-cls2');
    paths.ges2 = drawCurve(ge.x, ge.y, s2.x, s2.y, 'p-pipe-muted',  'p-ges2');
    paths.s2rw = drawLine(s2.x,  s2.y,  rw.x, rw.y, 'p-pipe-cyan',   'p-s2rw');
    paths.rwgu = drawLine(rw.x,  rw.y,  gu.x, gu.y, 'p-pipe-cyan',   'p-rwgu');
    paths.guco = drawLine(gu.x,  gu.y,  co.x, co.y, 'p-pipe-green',  'p-guco');

    // Rollback arc
    const d = `M ${gu.x+80} ${gu.y} C ${gu.x+160} ${gu.y} ${wr.x+180} ${wr.y} ${wr.x+80} ${wr.y}`;
    paths.rollback = mkEl('path', { d, class: 'p-rollback', id: 'p-rollback' });
    const defs   = mkEl('defs');
    const marker = mkEl('marker', { id:'arr-amber', markerWidth:6, markerHeight:6, refX:5, refY:3, orient:'auto' });
    marker.appendChild(mkEl('polygon', { points:'0 0, 6 3, 0 6', fill:'rgba(255,107,53,0.8)' }));
    defs.appendChild(marker);
    paths.rollback.setAttribute('marker-end', 'url(#arr-amber)');
  }

  // ── Main sequence ─────────────────────────────────────────────
  let running = false;

  async function run() {
    if (running) return;
    running = true;

    // Reset
    document.querySelectorAll('.p-node').forEach(n => n.classList.remove('visible', 'p-alert'));
    document.querySelectorAll('.p-pipe, .p-rollback').forEach(p => p.classList.remove('visible'));
    document.getElementById('score-fill').style.width = '0%';
    document.getElementById('score-val').textContent = '0/10';
    document.getElementById('claude-score-txt').textContent = 'score: —';
    document.getElementById('gemini-score-txt').textContent = 'score: —';
    document.getElementById('disagree-badge').classList.remove('show');
    document.getElementById('conv-ring').classList.remove('burst');
    document.querySelectorAll('.p-dots span').forEach(d => d.className = '');

    setStatus('INITIALIZING PIPELINE...');
    applyLayout();
    buildPaths();

    const q  = nodeCenter('n-query'),   pl = nodeCenter('n-planner');
    const wr = nodeCenter('n-writer'),   cl = nodeCenter('n-claude');
    const ge = nodeCenter('n-gemini'),   s2 = nodeCenter('n-search2');
    const rw = nodeCenter('n-rewriter'), gu = nodeCenter('n-guard');
    const co = nodeCenter('n-conv');

    // ① Query
    setStatus('QUERY RECEIVED');
    await show('n-query'); await sleep(400);

    // ② Planner
    setStatus('PLANNER AGENT · decomposing query...');
    showPath(paths.qpl);
    await animParticle(q.x, q.y, pl.x, pl.y, 'p-particle', 500);
    await show('n-planner'); setDot(0, 'on'); await sleep(500);

    // ③ Fan-out search
    setStatus('PARALLEL WEB SEARCH · ×5 queries dispatched');
    SEARCH_FX.forEach((_, i) => showPath(paths['ps' + i], i * 60));
    await Promise.all(SEARCH_FX.map((fx, i) =>
      animCurveParticle(pl.x, pl.y, pW()*fx, pH()*SEARCH_FY, 'p-particle', 500, i*80)
    ));
    for (let i = 0; i < 5; i++) await show('n-s' + i, i * 80);
    setDot(1, 'on'); await sleep(400);

    // ④ Converge → writer
    await Promise.all(SEARCH_FX.map((fx, i) => {
      showPath(paths['sw' + i], i * 60);
      return animCurveParticle(pW()*fx, pH()*SEARCH_FY, wr.x, wr.y, 'p-particle', 550, i*100);
    }));
    setStatus('DRAFT WRITER · synthesizing 1000+ words...');
    await show('n-writer'); setDot(2, 'on'); await sleep(600);

    // ⑤ Dual eval
    setStatus('DUAL EVALUATION · Claude ⊕ Gemini in parallel');
    showPath(paths.wrcl); showPath(paths.wrge);
    await Promise.all([
      animCurveParticle(wr.x, wr.y, cl.x, cl.y, 'p-particle-violet', 600),
      animCurveParticle(wr.x, wr.y, ge.x, ge.y, 'p-particle-green',  600),
    ]);
    await Promise.all([show('n-claude'), show('n-gemini')]); await sleep(400);

    // ⑥ Scores + disagreement
    document.getElementById('claude-score-txt').textContent = 'score: 5 / 10';
    document.getElementById('gemini-score-txt').textContent = 'score: 9 / 10';
    showPath(paths.clge); await sleep(300);

    setStatus('⚠ EVALUATOR DISAGREEMENT — GAP = 4 · CONSERVATIVE MIN', 'warn');
    document.getElementById('n-claude').classList.add('p-alert');
    document.getElementById('disagree-badge').classList.add('show');
    setDot(3, 'warn'); await sleep(900);

    // ⑦ Targeted search
    setStatus('TARGETED SEARCH · filling weak sections');
    showPath(paths.cls2); showPath(paths.ges2);
    await Promise.all([
      animCurveParticle(cl.x, cl.y, s2.x, s2.y, 'p-particle-red',   500),
      animCurveParticle(ge.x, ge.y, s2.x, s2.y, 'p-particle-green', 500),
    ]);
    await show('n-search2'); await sleep(400);

    // ⑧ Rewriter
    setStatus('SECTION REWRITER · targeted rewrites dispatched');
    showPath(paths.s2rw);
    await animParticle(s2.x, s2.y, rw.x, rw.y, 'p-particle', 450);
    await show('n-rewriter'); await sleep(400);

    // ⑨ Guard + rollback
    setStatus('BEST-VERSION GUARD · checking score delta...');
    showPath(paths.rwgu);
    await animParticle(rw.x, rw.y, gu.x, gu.y, 'p-particle', 450);
    await show('n-guard'); await sleep(300);

    paths.rollback.classList.add('visible');
    setStatus('↺ ROLLBACK TRIGGERED · score regressed, restoring prior version', 'warn');
    await sleep(800);

    // ⑩ Convergence
    setStatus('CONVERGENCE · final quality score achieved', 'ok');
    showPath(paths.guco);
    await animParticle(gu.x, gu.y, co.x, co.y, 'p-particle-green', 500);
    await show('n-conv');

    setDot(4, 'ok');
    document.getElementById('score-fill').style.width = '82%';
    let sv = 0;
    const si = setInterval(() => {
      sv++;
      document.getElementById('score-val').textContent = sv + '/10';
      if (sv >= 8) clearInterval(si);
    }, 150);
    await sleep(500);
    document.getElementById('conv-ring').classList.add('burst');
    setStatus('PIPELINE COMPLETE · report ready', 'ok');

    running = false;
    // Auto-replay
    setTimeout(run, 4000);
  }

  // ── Public API ────────────────────────────────────────────────
  function init() {
    applyLayout();
    run();
    window.addEventListener('resize', () => { applyLayout(); buildPaths(); });
  }

  return { init, run };
})();
