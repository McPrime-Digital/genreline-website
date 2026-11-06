/**
 * The home hero's posters: a still of every shot, rendered by the scene
 * itself — the title (the page's first paint, its Largest Contentful Paint),
 * Crew, Client, Stakeholders, the Suite and the close. The title's poster is
 * what the canvas fades in over; on a device that does not run the 3D, the
 * stills cross-fade as the visitor scrolls (HeroDirector).
 *
 * Run against a server on BASE (default http://localhost:3001):
 *   npx tsx scripts/make-hero-poster.ts
 * Writes public/hero/poster-dark-{shot}-{wide,tall}.{avif,webp} (the site is
 * dark only — owner, 2026-11-06). Each
 * AVIF must stay under 120 KB; the script fails if one does not.
 *
 * Uses Playwright's Chromium on the machine's GPU (SwiftShader, software
 * WebGL, with GL=swiftshader), each shot held with `?shot=`, and the page's
 * words hidden — a poster is only the picture behind them.
 */
import { mkdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE ?? 'http://localhost:3001'
const OUT = join(process.cwd(), 'public', 'hero')
const LIMIT = 120 * 1024
const ALL = ['title', 'crew', 'client', 'stakeholders', 'suite', 'close'] as const
// `SHOTS=title,close` renders only those
const SHOTS = process.env.SHOTS ? ALL.filter((s) => process.env.SHOTS!.split(',').includes(s)) : ALL

const SHAPES = [
  // a laptop or desktop: 16:9 at 1920
  { shape: 'wide', viewport: { width: 1920, height: 1080 }, scale: 1 },
  // a phone: 414 × 896 at 2x
  { shape: 'tall', viewport: { width: 414, height: 896 }, scale: 2 },
] as const

const GL =
  process.env.GL === 'swiftshader'
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu']

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ args: GL })
  let over = 0
  // where the logo sits in each title poster, for the page to place it (HeroDirector)
  const framesFile = join(OUT, 'posters.json')
  const frames: Record<string, unknown> = existsSync(framesFile) ? JSON.parse(readFileSync(framesFile, 'utf8')) : {}
  for (const theme of ['dark'] as const) {
    for (const { shape, viewport, scale } of SHAPES) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: theme, reducedMotion: 'reduce' })
      await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme)
      for (const shot of SHOTS) {
        const page = await ctx.newPage()
        await page.goto(`${BASE}/?hero=live&shot=${shot}`, { waitUntil: 'load', timeout: 90_000 })
        await page.mouse.move(8, 8) // the scene wakes on the visitor's first move
        await page.waitForSelector('.hero-scene[data-ready="true"]', { timeout: 90_000 })
        await page.addStyleTag({ content: 'header, .hero-top, .hero-shots, .hero-track, .hero-shade, .hero-play-wrap, nextjs-portal { visibility: hidden !important } .hero-scene { transition: none !important }' })
        await page.waitForTimeout(4000) // the screens' captures and labels load and decode
        if (shot === 'title') {
          const logo = await page.locator('[data-hero-stage]').getAttribute('data-logo')
          if (logo) frames[shape] = JSON.parse(logo)
        }
        const png = await page.locator('[data-hero-stage]').screenshot({ type: 'png' })
        const base = join(OUT, `poster-${theme}-${shot}-${shape}`)
        const img = sharp(png)
        await img.clone().avif({ quality: 80, effort: 9, chromaSubsampling: '4:4:4' }).toFile(`${base}.avif`)
        await img.clone().webp({ quality: 80, effort: 6 }).toFile(`${base}.webp`)
        const kb = (f: string) => Math.round(statSync(f).size / 1024)
        const avif = statSync(`${base}.avif`).size
        if (avif > LIMIT) over++
        console.log(`poster-${theme}-${shot}-${shape}: avif ${kb(`${base}.avif`)} KB, webp ${kb(`${base}.webp`)} KB${avif > LIMIT ? '  OVER 120 KB' : ''}`)
        await page.close()
      }
      await ctx.close()
    }
  }
  await browser.close()
  writeFileSync(framesFile, JSON.stringify(frames, null, 2) + '\n')
  process.exit(over ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
