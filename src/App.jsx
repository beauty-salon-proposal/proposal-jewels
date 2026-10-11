import { useEffect } from "react"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"
import MirrorPage from "./components/MirrorPage"
import { PAGES } from "./data/routes"

function Title() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    const hit = PAGES.find((p) => p.route === pathname && p.search === search)
      || PAGES.find((p) => p.route === pathname)
    document.title = (hit && hit.title) || "Gridaan"
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

function SpaLinks() {
  const nav = useNavigate()
  useEffect(() => {
    const h = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest && e.target.closest("a")
      if (!a) return
      const href = a.getAttribute("href")
      if (!href || href.startsWith("/mirror/") || /^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return
      if (href.startsWith("/")) { e.preventDefault(); nav(href) }
    }
    document.addEventListener("click", h)
    return () => document.removeEventListener("click", h)
  }, [nav])
  return null
}

export default function App() {
  return (
    <>
      <Title />
      <SpaLinks />
      <Routes>
        <Route path="/" element={<MirrorPage file="mirror/index.html" />} />
        <Route path="/shop" element={<MirrorPage key={window.location.pathname} />} />
        <Route path="/category/:slug" element={<MirrorPage key={window.location.pathname} />} />
        <Route path="/product/:slug" element={<MirrorPage key={window.location.pathname} />} />
        <Route path="/:page" element={<MirrorPage key={window.location.pathname} />} />
        <Route path="*" element={<MirrorPage file="mirror/index.html" />} />
      </Routes>
    </>
  )
}
