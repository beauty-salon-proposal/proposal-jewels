import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
const imageMap = JSON.parse(fs.readFileSync(path.join(root, "image-map.json"), "utf-8"))
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".svg": "image/svg+xml" }

function imgFile(prefix, src) {
  if (/^https?:/.test(src)) {
    const rel = imageMap[src] || imageMap[src.split("?")[0]]
    if (rel) {
      const f = path.join(root, "public", "mirror", rel)
      if (fs.existsSync(f)) return f
    }
    const name = decodeURIComponent(src).split("?")[0].split("/").pop()
    for (const d of ["public/mirror/assets/remote", "public/mirror/categories", "public/mirror"]) {
      const f = path.join(root, d, name)
      if (fs.existsSync(f)) return f
    }
    return null
  }
  const parts = []
  for (const seg of decodeURIComponent(src).replace(/^\//, "").split("?")[0].split("/")) {
    if (!seg || seg === ".") continue
    if (seg === "..") { if (parts.length) parts.pop(); continue }
    parts.push(seg)
  }
  let f = path.join(root, "public", prefix + parts.join("/"))
  if (fs.existsSync(f)) return f
  const name = parts[parts.length - 1] || ""
  if (name) {
    for (const d of ["public/mirror/categories", "public/mirror/assets/remote", "public/mirror"]) {
      f = path.join(root, d, name)
      if (fs.existsSync(f)) return f
    }
  }
  return null
}

function imageMiddleware(req, res, next) {
  let u
  try {
    u = new URL(req.url, "http://x")
  } catch {
    return next()
  }
  let prefix = null
  if (u.pathname === "/_next/image") prefix = ""
  else if (u.pathname === "/mirror/_next/image") prefix = "mirror/"
  if (prefix === null) return next()
  const src = u.searchParams.get("url") || ""
  const file = imgFile(prefix, src)
  if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream")
    res.setHeader("Cache-Control", "public, max-age=31536000")
    fs.createReadStream(file).pipe(res)
    return
  }
  next()
}

export default defineConfig({
  plugins: [react(), {
    name: "gridaan-image-fallback",
    configureServer(s) { s.middlewares.use(imageMiddleware) },
    configurePreviewServer(s) { s.middlewares.use(imageMiddleware) },
  }],
  server: { port: 8146 },
  preview: { port: 8147 },
})
