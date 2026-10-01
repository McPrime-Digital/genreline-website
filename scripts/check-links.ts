/**
 * The link check (S-W §10 step 8). Against a running server (BASE): every
 * internal link answers 200 and every #anchor exists on its target page;
 * every link to app.genreline.com answers 200 on the live app.
 */
import { PAGES } from '../content/pages'

const BASE = process.env.BASE ?? 'http://localhost:3001'
const html = new Map<string, string>()
async function get(path: string) {
  if (!html.has(path)) {
    const r = await fetch(BASE + path, { redirect: 'manual' })
    html.set(path, r.status === 200 ? await r.text() : `__STATUS_${r.status}`)
  }
  return html.get(path)!
}

async function main() {
  let failed = 0
  const fail = (m: string) => { failed++; console.log('FAIL  ' + m) }
  const internal = new Set<string>()
  const app = new Set<string>()
  const sources = new Map<string, string>()
  for (const p of [...PAGES.map((x) => x.path), '/does-not-exist-under/product']) {
    const body = await get(p)
    if (body.startsWith('__STATUS_')) { if (!p.startsWith('/does-not')) fail(`${p} answered ${body.slice(9)}`); continue }
    for (const m of body.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      const href = m[1].replace(/&amp;/g, '&')
      if (href.startsWith('https://app.genreline.com')) app.add(href)
      else if (href.startsWith('/') || href.startsWith('#')) {
        const abs = href.startsWith('#') ? p + href : href
        internal.add(abs)
        sources.set(abs, p)
      } else if (/^https?:/.test(href)) fail(`${p} links outside: ${href}`)
    }
  }
  for (const link of internal) {
    const [pathq, anchor] = link.split('#')
    const path = pathq.split('?')[0] || '/'
    const body = await get(path)
    if (body.startsWith('__STATUS_')) { fail(`${link} (from ${sources.get(link)}) answered ${body.slice(9)}`); continue }
    if (anchor && !new RegExp(`id="${anchor}"`).test(body)) fail(`${link} (from ${sources.get(link)}) — no element with id="${anchor}"`)
  }
  for (const link of app) {
    const r = await fetch(link, { redirect: 'follow' })
    if (r.status !== 200) fail(`${link} answered ${r.status}`)
  }
  console.log(`\nlinks: ${internal.size} internal, ${app.size} to the app; ${failed} failure${failed === 1 ? '' : 's'}`)
  process.exit(failed ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
