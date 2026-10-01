/**
 * Lighthouse, mobile (its default: emulated phone, throttled network and CPU),
 * for Home, one product page and Pricing (S-W §10 step 8). Bar: ≥ 95 on
 * Performance, Accessibility, Best Practices and SEO. SEO is scored with the
 * production robots policy — a preview's noindex would otherwise fail the
 * crawlable check by design — so run against a build made with
 * VERCEL_ENV=production. Uses Playwright's Chromium.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE ?? 'http://localhost:3001'
const PAGES = (process.env.PAGES ?? '/,/product/review,/pricing').split(',')
mkdirSync('reports', { recursive: true })
let below = 0
for (const p of PAGES) {
  const out = `reports/lighthouse${p === '/' ? '-home' : p.replace(/\//g, '-')}.json`
  execFileSync('npx', ['lighthouse', BASE + p, '--quiet', '--output=json', `--output-path=${out}`, '--chrome-flags=--headless=new --no-sandbox', '--only-categories=performance,accessibility,best-practices,seo'], {
    stdio: 'inherit',
    env: { ...process.env, CHROME_PATH: chromium.executablePath() },
  })
  const r = JSON.parse(readFileSync(out, 'utf8'))
  const s = Object.fromEntries(Object.entries(r.categories as Record<string, { score: number }>).map(([k, v]) => [k, Math.round(v.score * 100)]))
  const a = r.audits
  console.log(`${p.padEnd(18)} performance ${s.performance}  accessibility ${s.accessibility}  best-practices ${s['best-practices']}  seo ${s.seo}   LCP ${a['largest-contentful-paint'].displayValue}  CLS ${a['cumulative-layout-shift'].displayValue}  TBT ${a['total-blocking-time'].displayValue}`)
  for (const [k, v] of Object.entries(s)) if (v < 95) { below++; console.log(`  below 95: ${k} = ${v}`) }
}
process.exit(below ? 1 : 0)
