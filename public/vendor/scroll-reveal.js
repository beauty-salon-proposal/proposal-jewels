/* Gridaan scroll reveal — runs INSIDE the mirror iframe.
 * Loaded after /vendor/lenis.min.js, /vendor/gsap.min.js,
 * /vendor/ScrollTrigger.min.js (globals: Lenis, gsap, ScrollTrigger).
 * - Lenis smooth wheel scroll (desktop), native touch (mobile) for perf.
 * - GSAP ScrollTrigger.batch reveal, once:true (no re-hide jank).
 * - No CSS pre-hiding: initial state set via gsap.set, so content
 *   stays visible if this script or its deps fail to load.
 * - Exposes window.__scrollReveal { lenis, refresh, destroy } for the
 *   parent SPA (MirrorPage) to call on image rewrites / route changes.
 */
(function () {
  if (window.__scrollRevealBooted) return;
  window.__scrollRevealBooted = true;

  function boot() {
    try {
      if (!window.gsap || !window.Lenis) return;
      var reduce = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

      // Lenis recommended CSS (injected here so mirror HTML stays untouched).
      var css = document.createElement("style");
      css.setAttribute("data-sr", "lenis-css");
      css.textContent =
        "html.lenis,html.lenis body{height:auto}" +
        ".lenis.lenis-smooth{scroll-behavior:auto!important}" +
        ".lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}" +
        ".lenis.lenis-stopped{overflow:hidden}";
      document.head.appendChild(css);

      var lenis = null;
      var raf = null;
      if (!reduce) {
        lenis = new Lenis({
          duration: 1.25,
          easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.5,
          anchors: true
        });
        if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
        raf = function (time) { lenis.raf(time * 1000); };
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
      }

      // Reveal targets: page blocks only (not every p/li/img — that janks).
      // Images ride along inside their parent section/figure.
      var targets = [];
      if (window.ScrollTrigger && !reduce) {
        targets = gsap.utils.toArray(
          "main section, section, h1, h2, figure, blockquote, [data-reveal]"
        ).filter(function (el) {
          try {
            if (el.closest("header, nav, footer")) return false;
            var r = el.getBoundingClientRect();
            // Skip zero-size / hidden nodes.
            if (r.width === 0 && r.height === 0) return false;
            return true;
          } catch (e) { return false; }
        });
        gsap.set(targets, { opacity: 0, y: 36 });
        ScrollTrigger.batch(targets, {
          start: "top 90%",
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
              stagger: 0.08, overwrite: true
            });
          }
        });
        // Layout shifts as product images resolve -> recalc triggers.
        window.addEventListener("load", function () {
          try { ScrollTrigger.refresh(); } catch (e) {}
        });
      }

      function refresh() {
        try {
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        } catch (e) {}
      }

      function destroy() {
        try {
          if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
          if (targets.length) gsap.killTweensOf(targets);
          if (raf) gsap.ticker.remove(raf);
          if (lenis) lenis.destroy();
        } catch (e) {}
        window.__scrollReveal = null;
      }

      window.__scrollReveal = { lenis: lenis, refresh: refresh, destroy: destroy };
    } catch (e) { /* never break the shop */ }
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
