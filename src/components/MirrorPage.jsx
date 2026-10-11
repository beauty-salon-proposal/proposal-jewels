import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { FILE_TO_ROUTE, resolveFile } from "../data/routes"
import { fixImages } from "../lib/imageFallback"

// iframe shell, fixed viewport height (NOT auto-height):
// auto-height inflates the iframe viewport, and vh-based hero sections
// (min-h-[74vh]) then explode to ~20k px of blank gradient.
// At 100vh the inner viewport equals a real browser viewport, so the
// mirror renders exactly like the live site. A click bridge maps
// /mirror/*.html links to pretty SPA routes for seamless navigation.
// An image fallback rewrites Next.js optimizer URLs (/_next/image?url=)
// to static files so production hosts without an image server work.
export default function MirrorPage({ file, title }) {
  const { pathname, search } = useLocation()
  const nav = useNavigate()
  const frameRef = useRef(null)
  const cur = file || resolveFile(pathname, search) || "mirror/index.html"

  useEffect(() => {
    if (title) document.title = title
  }, [title])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    let obs = null
    let timer = 0
    const sweep = () => {
      try {
        const d = frame.contentDocument
        if (d) fixImages(d)
      } catch { /* cross-origin noop */ }
    };
    const sweepSoon = () => {
      clearTimeout(timer)
      timer = setTimeout(sweep, 120)
    };
    const onLoad = () => {
      sweep()
      try {
        obs = new MutationObserver(sweepSoon)
        obs.observe(frame.contentDocument.documentElement,
          { childList: true, subtree: true, attributes: true,
            attributeFilter: ["src", "srcset"] })
      } catch { /* noop */ }
    };
    frame.addEventListener("load", onLoad)
    const toTop = () => {
      try { frame.contentWindow.scrollTo(0, 0) } catch { /* noop */ }
    }
    frame.addEventListener("load", toTop)
    toTop()
    const onClick = (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null
      if (!a || e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const h = a.getAttribute("href") || ""
      if (/^(https?:|mailto:|tel:|javascript:|#)/i.test(h)) return
      let path
      try {
        path = new URL(h, frame.contentDocument.baseURI).pathname
      } catch { return }
      const m = path.match(/^\/mirror\/(.+)\.html$/)
      if (!m) return
      const dest = FILE_TO_ROUTE["mirror/" + m[1] + ".html"]
      if (dest) {
        e.preventDefault()
        nav(dest)
      }
      // else: let the iframe load it natively (static file fallback)
    }
    frame.contentDocument.addEventListener("click", onClick)
    return () => {
      clearTimeout(timer)
      try { obs && obs.disconnect() } catch { /* noop */ }
      frame.removeEventListener("load", toTop)
      frame.removeEventListener("load", onLoad)
      try { frame.contentDocument.removeEventListener("click", onClick) } catch { /* noop */ }
    }
  }, [cur, nav])

  return (
    <iframe
      ref={frameRef}
      src={"/" + cur}
      title={title || "Gridaan"}
      style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
    />
  )
}
