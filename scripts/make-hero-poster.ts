/**
 * The home hero's poster (batch W-3D-1 §3): the scene's first frame, rendered
 * by the scene itself, so the canvas fades in over a picture of itself.
 *
 * Run against a server on BASE (default http://localhost:3001):
 *   npx tsx scripts/make-hero-poster.ts
 * Writes public/hero/poster-{dark,light}-{wide,tall}.{avif,webp}. Each AVIF
 * must stay under 120 KB (it is the page's Largest Contentful Paint); the
 * script fails if one does not.
 *
 * Uses Playwright's Chromium with SwiftShader (software WebGL), Motion off so
 * nothing is mid-flight, and the page's words hidden — the poster is only the
 * picture behind them.
 */
import { mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE ?? 'http://localhost:3001'
const OUT = join(process.cwd(), 'public', 'hero')
const LIMIT = 120 * 1024

const SHAPES = [
  // a laptop or desktop: 16:9 at 1920
  { shape: 'wide', viewport: { width: 1920, height: 1080 }, scale: 1 },
  // a phone: 414 × 896 at 2x
  { shape: 'tall', viewport: { width: 414, height: 896 }, scale: 2 },
] as const

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  let over = 0
  for (const theme of ['dark', 'light'] as const) {
    for (const { shape, viewport, scale } of SHAPES) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: theme })
      await ctx.addInitScript((t) => {
        localStorage.setItem('theme', t)
        localStorage.setItem('genreline-motion', 'off')
      }, theme)
      const page = await ctx.newPage()
      await page.goto(`${BASE}/?hero=live`, { waitUntil: 'load', timeout: 90_000 })
      await page.waitForSelector('.hero-scene[data-ready="true"]', { timeout: 90_000 })
      await page.addStyleTag({ content: 'header, .hero-top, .hero-shots, .hero-track, .hero-shade, .hero-corners, nextjs-portal { visibility: hidden !important } .hero-scene { transition: none !important }' })
      await page.waitForTimeout(3000) // the screens' captures load and decode
      const png = await page.locator('[data-hero-stage]').screenshot({ type: 'png' })
      const base = join(OUT, `poster-${theme}-${shape}`)
      const img = sharp(png)
      await img.clone().avif({ quality: 82, effort: 9, chromaSubsampling: '4:4:4' }).toFile(`${base}.avif`)
      await img.clone().webp({ quality: 80, effort: 6 }).toFile(`${base}.webp`)
      const kb = (f: string) => Math.round(statSync(f).size / 1024)
      const avif = statSync(`${base}.avif`).size
      if (avif > LIMIT) over++
      console.log(`poster-${theme}-${shape}: avif ${kb(`${base}.avif`)} KB, webp ${kb(`${base}.webp`)} KB${avif > LIMIT ? '  OVER 120 KB' : ''}`)
      await ctx.close()
    }
  }
  await browser.close()
  process.exit(over ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
