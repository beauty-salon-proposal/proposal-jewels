// Parent-side injector: loads Lenis + GSAP + the reveal boot script
// INSIDE the mirror iframe, so smooth scroll runs in the iframe's own
// window context (correct viewport, rAF, and ScrollTrigger measurements).
// Vendor UMD files live in /public/vendor and are copied to dist/ by Vite.

const VENDOR_SRCS = [
  "/vendor/lenis.min.js",
  "/vendor/gsap.min.js",
  "/vendor/ScrollTrigger.min.js",
  "/vendor/scroll-reveal.js",
];

function loadChain(doc, srcs) {
  return srcs.reduce(
    (p, src) =>
      p.then(
        () =>
          new Promise((resolve) => {
            try {
              if (doc.querySelector(`script[data-sr="${src}"]`)) return resolve();
              const s = doc.createElement("script");
              s.src = src;
              s.async = false;
              s.setAttribute("data-sr", src);
              s.onload = () => resolve();
              s.onerror = () => resolve(); // never break the shop
              doc.head.appendChild(s);
            } catch {
              resolve();
            }
          })
      ),
    Promise.resolve()
  );
}

/** Inject smooth-scroll + reveal into an iframe's document. Idempotent per document. */
export function injectScrollReveal(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc || !doc.head) return;
    if (doc.__srInjected) return;
    doc.__srInjected = true;
    loadChain(doc, VENDOR_SRCS).then(() => {
      try {
        const w = frame.contentWindow;
        if (w && w.__scrollReveal) w.__scrollReveal.refresh();
      } catch { /* noop */ }
    });
  } catch { /* cross-origin noop */ }
}

/** Recalc ScrollTrigger positions after image rewrites / layout shifts. */
export function refreshScrollReveal(frame) {
  try {
    const w = frame.contentWindow;
    if (w && w.__scrollReveal) w.__scrollReveal.refresh();
  } catch { /* noop */ }
}

/** Tear down Lenis + triggers before the iframe navigates away. */
export function destroyScrollReveal(frame) {
  try {
    const w = frame.contentWindow;
    if (w && w.__scrollReveal) w.__scrollReveal.destroy();
  } catch { /* noop */ }
}

/** Scroll the iframe to top via Lenis when active, else natively. */
export function scrollIframeToTop(frame) {
  try {
    const w = frame.contentWindow;
    const lenis = w && w.__scrollReveal && w.__scrollReveal.lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else w.scrollTo(0, 0);
  } catch {
    try { frame.contentWindow.scrollTo(0, 0); } catch { /* noop */ }
  }
}
