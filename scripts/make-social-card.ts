/**
 * The social card's sky: the picture behind the words of every card a shared link shows (content/og.ts CARD,
 * app/og/[slug]/route.tsx). It is the hero's landing sky and gold logo, drawn by the scene itself, the way
 * the posters are (scripts/make-hero-poster.ts): the title shot held with `?shot=title`, the page's words
 * hidden. While the scene lays out, the hero's title is held at the card's headline size (CARD.title), so
 * the logo sits beside words of exactly that size, and the card's words land where the page's would.
 *
 * On the left, where the words go, a soft pool of the canvas's black (the hero's own scrim, styles/hero.css
 * `.hero-scrim-title`, made a little deeper so small type reads at a phone's preview size).
 *
 * Run against a server on BASE (default http://localhost:3001), then rebuild (the cards are made at build):
 *   npx tsx scripts/make-social-card.ts
 * Writes public/hero/card-sky.jpg (1200 × 630, drawn at 2× and scaled down), and its fingerprint to
 * content/og-sky.json, which goes into every card's address so a new sky reaches the platforms that keep one.
 */
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { chromium } from '@playwright/test'
import { CARD } from '../content/og'

const BASE = process.env.BASE ?? 'http://localhost:3001'
const OUT = join(process.cwd(), CARD.sky)
const SCALE = 2

const GL =
  process.env.GL === 'swiftshader'
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu']

// The pool under the words: the hero's scrim (an ellipse at 18% 52%), and a wash from the left edge.
const POOL = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}">
  <defs>
    <radialGradient id="r" cx="0.2" cy="0.5" r="0.62" gradientTransform="translate(0.2 0.5) scale(1 1.1) translate(-0.2 -0.5)">
      <stop offset="0" stop-color="#000" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="l" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.9"/>
      <stop offset="0.3" stop-color="#000" stop-opacity="0.6"/>
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#r)"/>
  <rect width="100%" height="100%" fill="url(#l)"/>
</svg>`

async function main() {
  const browser = await chromium.launch({ args: GL })
  const ctx = await browser.newContext({
    viewport: { width: CARD.width, height: CARD.height },
    deviceScaleFactor: SCALE,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  // the title at the card's size and left edge before the scene measures it
  await ctx.addInitScript(
    ({ px, inset }) => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style')
        s.textContent = `.hero-title { font-size: ${px}px !important }`
        document.head.appendChild(s)
        const card = document.querySelector<HTMLElement>('.hero-shot-title')
        const left = document.querySelector('#hero-title')?.getBoundingClientRect().left
        if (card && left !== undefined) card.style.marginLeft = `${inset - left}px`
      })
    },
    { px: CARD.title, inset: CARD.inset },
  )
  const page = await ctx.newPage()
  await page.goto(`${BASE}/?hero=live&shot=title`, { waitUntil: 'load', timeout: 90_000 })
  await page.mouse.move(8, 8) // the scene wakes on the visitor's first move
  await page.waitForSelector('.hero-scene[data-ready="true"]', { timeout: 90_000 })
  await page.addStyleTag({
    content:
      'header, header *, .hero-top, .hero-shots, .hero-track, .hero-shade, .hero-scrim, .hero-play-wrap, nextjs-portal { visibility: hidden !important; animation: none !important } .hero-scene { transition: none !important }',
  })
  await page.waitForTimeout(4000) // the sky's picture paints and the frame settles
  const title = await page.locator('#hero-title').boundingBox()
  if (!title || Math.abs(title.x - CARD.inset) > 1 || Math.abs(title.y - CARD.titleTop) > 3) {
    throw new Error(`the hero's title sat at ${JSON.stringify(title)}; the card sets its words at x ${CARD.inset}, y ${CARD.titleTop}`)
  }
  const png = await page.locator('[data-hero-stage]').screenshot({ type: 'png' })
  await browser.close()

  const sky = await sharp(png).resize(CARD.width, CARD.height, { kernel: 'lanczos3' }).png().toBuffer()
  await sharp(sky)
    .composite([{ input: Buffer.from(POOL) }])
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(OUT)
  const sha = createHash('sha256').update(readFileSync(OUT)).digest('hex').slice(0, 12)
  writeFileSync(join(process.cwd(), 'content', 'og-sky.json'), JSON.stringify({ sha }, null, 2) + '\n')
  console.log(`${CARD.sky}: ${Math.round(statSync(OUT).size / 1024)} KB, fingerprint ${sha}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
