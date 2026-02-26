/* ═══════════════════════════════════════════════════════════════
   main.js — App Init, Scroll Reveal
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll reveal ────────────────────────────────────────────
  const srObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('vis'), delay);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.sr').forEach(el => srObs.observe(el));

  // ── Init pipeline ────────────────────────────────────────────
  Pipeline.init();

});
