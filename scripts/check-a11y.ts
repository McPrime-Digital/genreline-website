/**
 * Accessibility (S-W §10 step 8): axe-core (MPL-2.0, dev only) over every
 * page in every theme at desktop width, plus the home page at phone width
 * with the drawer open and at desktop width with the mega-menu open. WCAG
 * 2.0/2.1/2.2 A and AA rules. Fails on any serious or critical violation.
 *
 * THE THEME IS SET, NOT IMPLIED. The site's default theme is Dark whatever
 * the system prefers, so a pass that only set the browser's colour scheme to
 * light was auditing Dark twice (found 2026-10-01). Each pass now stores the
 * theme the way a visitor's choice is stored, and asserts it applied.
 */
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { PAGES } from '../content/pages'

const BASE = process.env.BASE ?? 'http://localhost:3001'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function main() {
  const browser = await chromium.launch()
  let serious = 0
  let moderate = 0
  const run = async (label: string, page: import('@playwright/test').Page) => {
    const want = label.split(' ')[0]
    const cls = await page.evaluate(() => document.documentElement.className)
    if (!cls.split(/\s+/).includes(want)) throw new Error(`${label}: expected the ${want} theme, the page has class "${cls}"`)
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    for (const v of r.violations) {
      const bad = v.impact === 'serious' || v.impact === 'critical'
      if (bad) serious += v.nodes.length
      else moderate += v.nodes.length
      console.log(`${bad ? 'FAIL' : 'note'}  ${label}  ${v.impact}  ${v.id}: ${v.help} (${v.nodes.length}) — ${v.nodes[0]?.target.join(' ')}`)
    }
  }
  for (const theme of ['light', 'dark'] as const) {
    const scheme = theme === 'light' ? 'light' : 'dark'
    const choose = (t: string) => localStorage.setItem('theme', t)
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } })
    await ctx.addInitScript(choose, theme)
    const page = await ctx.newPage()
    for (const p of [...PAGES.map((x) => x.path), '/this-page-is-not-here']) {
      await page.goto(BASE + (p === '/this-page-is-not-here' ? '/product/not-here' : p), { waitUntil: 'networkidle' })
      await run(`${theme} ${p}`, page)
    }
    // the mega-menu, open
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Product', exact: true }).click()
    await page.waitForTimeout(400)
    await run(`${theme} / (product menu open)`, page)
    await ctx.close()
    // the drawer, open, at phone width
    const mctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    await mctx.addInitScript(choose, theme)
    const m = await mctx.newPage()
    await m.goto(BASE + '/', { waitUntil: 'networkidle' })
    await run(`${theme} / (phone)`, m)
    await m.getByRole('button', { name: 'Open menu' }).click()
    await m.waitForTimeout(400)
    await run(`${theme} / (phone, drawer open)`, m)
    await mctx.close()
  }
  await browser.close()
  console.log(`\naxe: ${serious} serious or critical node${serious === 1 ? '' : 's'}, ${moderate} moderate or minor`)
  process.exit(serious ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
