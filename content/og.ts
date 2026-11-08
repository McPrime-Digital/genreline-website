import { PAGES } from '@/content/pages'
import { hero } from '@/content/home'
import sky from '@/content/og-sky.json'

/** The social card's address for a page: /og/home, /og/product--crew … */
export const ogSlug = (path: string) => (path === '/' ? 'home' : path.slice(1).replace(/\//g, '--'))
export const pathForSlug = (slug: string) => (slug === 'home' ? '/' : `/${slug.replace(/--/g, '/')}`)
export const OG_SLUGS = PAGES.map((p) => ogSlug(p.path))

/**
 * The social card: the picture a link to the site shows wherever it is shared (iMessage, WhatsApp, X,
 * LinkedIn, Slack …). It is the hero's own look, its landing sky and gold logo drawn by the scene
 * (scripts/make-social-card.ts → SKY) with the words set in the site's own faces (app/og/[slug]/route.tsx).
 *
 * The sky was drawn with the hero's title held where the card sets its own: `title` px capitals, their left
 * edge at `inset`, their top at `titleTop` (where the hero's layout puts it). So the scene placed the logo
 * beside words of exactly that size and place. Change one and re-run the script (it checks `titleTop`).
 * `quality` is the JPEG's; a card stays under 200 KB (WhatsApp drops a preview image much over 300 KB).
 * `look` names the card's layout (app/og/[slug]/route.tsx): change it with the layout, so every card gets a
 * new address (cardVersion).
 */
export const CARD = { width: 1200, height: 630, title: 40, inset: 64, titleTop: 228, quality: 84, sky: 'public/hero/card-sky.jpg', look: '2026-11-07' } as const

/** A card's words: the hero's slate line over the hero's title (home) or the page's own title and description. */
export function cardWords(path: string): { kicker: string; lines: string[]; text: string } {
  if (path === '/') return { kicker: hero.kicker, lines: [hero.headlineLine1, hero.headlineLine2], text: hero.subtext }
  const p = PAGES.find((x) => x.path === path)
  if (!p) throw new Error(`no page ${path}`)
  return { kicker: hero.kicker, lines: [p.title], text: p.description }
}

/**
 * A card's version, in its address (/og/home?v=…): it changes whenever the card does — its words, its sky
 * (content/og-sky.json, the sky's fingerprint, written by the script) or its layout (CARD.look). A platform
 * that keeps a link's picture (X for a week, Facebook and LinkedIn until asked again) then fetches the new
 * card as a new image; X's own advice for an updated card image is a new address. FNV-1a: stable, no
 * dependencies, eight hex digits.
 */
export function cardVersion(path: string) {
  const s = JSON.stringify([cardWords(path), sky.sha, CARD.look])
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16).padStart(8, '0')
}
