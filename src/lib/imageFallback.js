import { IMAGE_MAP } from "./imageMap";

const PLACEHOLDER = "/mirror/placeholder.svg";

/** Resolve a Next.js optimizer URL to a static file, or null. */
export function resolveOptimizerUrl(raw, base) {
  let u;
  try {
    u = new URL(raw, base);
  } catch {
    return null;
  }
  if (!u.pathname.endsWith("/_next/image") && !/(^|\/)image$/.test(u.pathname)) return null;
  const src = u.searchParams.get("url") || "";
  if (/^https?:/i.test(src)) {
    const hit = IMAGE_MAP[src] || IMAGE_MAP[src.split("?")[0]];
    return hit ? "/mirror/" + hit : null;
  }
  const parts = [];
  for (const seg of decodeURIComponent(src).split("?")[0].split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (parts.length) parts.pop();
      continue;
    }
    parts.push(seg);
  }
  if (!parts.length) return null;
  return "/mirror/" + parts.join("/");
}

function rewriteSet(value, base) {
  // split srcset on commas, but keep data: URIs intact
  return value
    .split(/,(?![^(]*\))/)
    .map((part) => {
      const t = part.trim();
      if (!t || t.startsWith("data:")) return part;
      const sp = t.search(/\s/);
      const url = sp < 0 ? t : t.slice(0, sp);
      const desc = sp < 0 ? "" : t.slice(sp);
      if (/[?&]url=/.test(url)) {
        const r = resolveOptimizerUrl(url, base);
        if (r) return r + desc;
      }
      return part;
    })
    .join(", ");
}

/** Rewrite optimizer URLs inside a (iframe) document. Idempotent. */
export function fixImages(doc) {
  if (!doc || !doc.querySelectorAll) return 0;
  const base = doc.baseURI;
  let fixed = 0;
  const els = doc.querySelectorAll(
    "img[src],img[srcset],img[imagesrcset],source[src],source[srcset],link[imagesrcset]"
  );
  els.forEach((el) => {
    if (el.dataset && el.dataset.fbDone) return;
    let touched = false;
    ["src", "srcset", "imagesrcset"].forEach((attr) => {
      const v = el.getAttribute && el.getAttribute(attr);
      if (!v || v.startsWith("data:")) return;
      if (!v.includes("_next/image") && !/(^|\/)image\?/.test(v)) return;
      const isSingle = !/,\s*\S/.test(v) || attr === "src";
      if (isSingle) {
        const r = resolveOptimizerUrl(v.trim(), base);
        if (r && r !== v) {
          el.setAttribute(attr, r);
          touched = true;
        }
      } else {
        const r = rewriteSet(v, base);
        if (r !== v) {
          el.setAttribute(attr, r);
          touched = true;
        }
      }
    });
    if (touched) {
      fixed++;
      if (el.dataset) el.dataset.fbDone = "1";
      if (el.tagName === "IMG" && !el.dataset.fbErr) {
        el.dataset.fbErr = "1";
        el.addEventListener("error", () => {
          const cur = el.getAttribute("src") || "";
          if (!cur.includes("placeholder.svg")) el.setAttribute("src", PLACEHOLDER);
        });
      }
    }
  });
  return fixed;
}
