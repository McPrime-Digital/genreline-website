/**
 * THE LABEL CHECK (S-W §9.2), run over the BUILT HTML — what a visitor gets,
 * not what the source intends. Run after `npm run build`. Fails if:
 *
 *  1. a Crew, Client or portal page renders a feature not labelled Available
 *     (Security- and Enterprise-page claims are allowed inside the page's
 *     security note — S-W §7's frame puts one on every product page);
 *  2. a Coming label appears for a feature outside the Suite or the network,
 *     or on a page that is not Home, Product, the Suite, AI, Network or Roadmap;
 *  3. the word "Coming" appears as a label anywhere it was not rendered by
 *     <FeatureLabel> (nobody types a label by hand — W-5);
 *  4. any page renders a Hidden, Internal, Do-not-claim or removed feature;
 *  5. any page contains a phrase from content/claims.ts's forbidden list
 *     (in text, alt text, aria labels, titles or meta descriptions);
 *  6. any link leaves for an origin other than app.genreline.com;
 *  7. any link names a Suite address beyond /product/suite (W-10).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { FEATURES, OFF_SITE } from '../content/features'
import { FORBIDDEN } from '../content/claims'
import { PAGES } from '../content/pages'

const ROOT = join(process.cwd(), '.next', 'server', 'app')
const BY_ID = new Map(FEATURES.map((f) => [f.id, f]))
const SUITE_SPACES = new Set(['suite', 'generation', 'sound', 'post', 'sets'])
const COMING_PAGES = new Set(['/', '/product', '/product/suite', '/product/production', '/ai', '/network', '/roadmap'])
const AVAILABLE_ONLY = new Set(['crew', 'client', 'portal'])

function htmlFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p))
    else if (name.endsWith('.html')) out.push(p)
  }
  return out
}

function routeOf(file: string): string {
  const rel = relative(ROOT, file).replace(/\.html$/, '')
  if (rel === 'index') return '/'
  if (rel === '_not-found' || rel === '_global-error') return `/${rel}`
  return `/${rel}`
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;|&#160;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function visibleText(html: string): string {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  const attrs = [...noScript.matchAll(/\s(?:alt|aria-label|title|placeholder|content)="([^"]*)"/g)].map((m) => m[1])
  const titles = [...noScript.matchAll(/<title>([\s\S]*?)<\/title>/g)].map((m) => m[1])
  const text = noScript.replace(/<[^>]+>/g, ' ')
  return decode([text, ...attrs, ...titles].join(' ')).replace(/\s+/g, ' ')
}

let failures = 0
const fail = (route: string, msg: string) => { failures++; console.log(`FAIL  ${route}  ${msg}`) }

const files = htmlFiles(ROOT)
let checked = 0
for (const file of files) {
  const route = routeOf(file)
  if (route.startsWith('/_global-error')) continue
  const page = PAGES.find((p) => p.path === route)
  const section = page?.section ?? (route === '/_not-found' ? 'company' : null)
  if (!section) continue
  checked++
  const html = readFileSync(file, 'utf8')
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const main = body.match(/<main[\s\S]*<\/main>/)?.[0] ?? ''

  // 1 + 4: every claim marker in the page body
  for (const m of body.matchAll(/data-feature-id="([A-Z0-9-]+)"(?:[^>]*?data-feature-site="([a-z-]+)")?/g)) {
    const id = m[1]
    const f = BY_ID.get(id)
    if (!f) { fail(route, `unknown S-F-A id ${id}`); continue }
    if (['hidden', 'internal', 'do-not-claim', 'none'].includes(f.label)) fail(route, `${id} is labelled ${f.label} and must not render`)
    if (OFF_SITE.has(id)) fail(route, `${id} is off the site by the owner's decision and must not render`)
    if (AVAILABLE_ONLY.has(section) && !['available', 'security', 'enterprise'].includes(f.label)) fail(route, `${id} (${f.label}) on a ${section} page`)
    if (AVAILABLE_ONLY.has(section) && (f.label === 'security' || f.label === 'enterprise')) {
      // allowed only inside the security note
      const idx = m.index ?? 0
      const before = body.slice(0, idx)
      const open = before.lastIndexOf('data-security-note')
      const close = before.lastIndexOf('</aside>')
      if (open === -1 || close > open) fail(route, `${id} (${f.label}) outside the security note on a ${section} page`)
    }
  }

  // 2: Coming badges
  for (const m of body.matchAll(/data-feature-label="coming"[^>]*data-feature-id="([A-Z0-9-]+)"|data-feature-id="([A-Z0-9-]+)"[^>]*data-feature-label="coming"/g)) {
    const id = m[1] ?? m[2]
    const f = BY_ID.get(id)
    if (!f) continue
    if (f.label !== 'coming') fail(route, `${id} renders Coming but S-F-A says ${f.label}`)
    if (!(SUITE_SPACES.has(f.space) || f.space === 'network')) fail(route, `Coming on ${id}, which is neither Suite nor network`)
    if (!COMING_PAGES.has(route)) fail(route, `Coming label on a page that may not carry one (${id})`)
  }
  if (AVAILABLE_ONLY.has(section) && /data-feature-label="coming"/.test(main)) fail(route, 'a Coming label on a Crew, Client or portal page')

  // 3: a hand-typed "Coming"
  const mainNoBadges = main.replace(/<span[^>]*data-feature-label="(?:coming|available)"[^>]*>[\s\S]*?<\/span>\s*(?:Coming|Available)\s*<\/span>|<span[^>]*data-feature-label="(?:coming|available)"[^>]*>\s*(?:Coming|Available)\s*<\/span>/g, ' ')
  const typed = visibleText(mainNoBadges).match(/\b(Coming|Available)\b(?! (?:to|in|on|for|from|at)\b)/g)
  if (typed) fail(route, `hand-typed label text: ${[...new Set(typed)].join(', ')}`)

  // 5: forbidden claims
  const text = visibleText(body)
  for (const f of FORBIDDEN) {
    if (f.allowedOn?.includes(route)) continue
    const hit = text.match(f.pattern)
    if (hit) fail(route, `forbidden "${hit[0]}" — ${f.reason}`)
  }

  // 6 + 7: links
  for (const m of body.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = decode(m[1])
    if (/^https?:\/\//.test(href) && !href.startsWith('https://app.genreline.com/') && !href.startsWith('https://genreline.com')) fail(route, `external link to ${href}`)
    if (/^\/product\/suite\/./.test(href)) fail(route, `Suite sub-address ${href} (W-10)`)
  }
}

const missing = PAGES.filter((p) => !files.some((f) => routeOf(f) === p.path))
for (const p of missing) fail(p.path, 'page in S-W §4 has no built HTML')

console.log(`\nlabel check: ${checked} pages, ${failures} failure${failures === 1 ? '' : 's'}`)
process.exit(failures ? 1 : 0)
