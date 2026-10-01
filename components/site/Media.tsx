/**
 * <Media id> — every picture on the site comes through here, from the slot
 * manifest (content/media.ts). Server-only: it checks at BUILD time whether
 * the file exists.
 *
 *  · a capture renders a theme-paired pair (light/dark), so the screenshot
 *    follows the visitor's theme (S-W §8 "in both themes");
 *  · an upload renders the owner's image, or a poster-first video that plays
 *    on request (S-B: nothing decorative moves on its own);
 *  · a missing file renders a labelled placeholder that says exactly what
 *    belongs there — never a stock image, never an invented screen (W-8).
 */
import 'server-only'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Image, { getImageProps } from 'next/image'
import { preload } from 'react-dom'
import { slot, type MediaSlot } from '@/content/media'
import { PlayOnRequest } from '@/components/site/PlayOnRequest'
import { cn } from '@/lib/utils'

const pub = (p: string) => existsSync(join(process.cwd(), 'public', p))

/** Real pixel sizes written by scripts/optimize-captures.ts. */
const DIMS: Record<string, { w: number; h: number }> = (() => {
  const f = join(process.cwd(), 'public', 'captures', 'dimensions.json')
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
})()

/** The first slot in the list that has a real file, or null. A page names
 *  its preferred capture and its fallbacks in order. */
export function firstMedia(ids: string | readonly string[] | undefined): string | null {
  if (!ids) return null
  const list = typeof ids === 'string' ? [ids] : ids
  for (const id of list) {
    const s = slot(id)
    if (s.kind === 'upload' || hasMedia(id)) return id // an upload shows its placeholder
  }
  warnMissing(list)
  return null
}

const warned = new Set<string>()
function warnMissing(ids: readonly string[]) {
  const key = ids.join(',')
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[media] no capture yet for ${key} — left off the page (run the capture; see README)`)
}

/** True when the slot has a real file — lets a page drop a tab rather than show a placeholder. */
export function hasMedia(id: string): boolean {
  return Object.values(mediaFiles(slot(id))).some(Boolean)
}

export function mediaFiles(s: MediaSlot) {
  if (s.kind === 'capture') {
    const light = `/captures/${s.id}.light.webp`
    const dark = `/captures/${s.id}.dark.webp`
    return { light: pub(light) ? light : null, dark: pub(dark) ? dark : null }
  }
  const file = `/media/${s.id}.${s.format}`
  const poster = `/media/${s.id}.poster.webp`
  return { file: pub(file) ? file : null, poster: pub(poster) ? poster : null }
}

function Placeholder({ s, className }: { s: MediaSlot; className?: string }) {
  const what = s.kind === 'capture'
    ? <>Product capture <code className="text-foreground">{s.id}</code> — run <code className="text-foreground">npm run capture</code> ({s.route})</>
    : <>Upload <code className="text-foreground">public/media/{s.id}.{s.format}</code> at {s.width}×{s.height}: {s.brief}</>
  return (
    <div
      role="img"
      aria-label={s.alt}
      data-media-placeholder={s.id}
      className={cn('media-placeholder flex items-end p-4 text-left', className)}
      style={{ aspectRatio: `${s.width} / ${s.height}` }}
    >
      <p className="max-w-[46ch] rounded-md bg-background/85 px-2.5 py-1.5 text-[12px] leading-5 text-muted-foreground backdrop-blur">{what}</p>
    </div>
  )
}

export function Media({
  id,
  priority = false,
  sizes = '(min-width: 1200px) 1136px, 100vw',
  className,
  frame = true,
}: {
  id: string
  priority?: boolean
  sizes?: string
  className?: string
  frame?: boolean
}) {
  const s = slot(id)
  const frameCls = frame ? 'capture-frame squircle-xl' : 'overflow-hidden squircle-lg'

  if (s.kind === 'capture') {
    const f = mediaFiles(s) as { light: string | null; dark: string | null }
    // A product capture that does not exist yet is left off the page — a
    // placeholder where a screenshot should be reads as unfinished. Only an
    // owner upload (footage, photography) shows its labelled placeholder.
    if (!f.light && !f.dark) {
      warnMissing([id])
      return null
    }
    const light = f.light ?? f.dark!
    const dark = f.dark ?? f.light!
    const dim = (src: string) => DIMS[src.replace(/^\/captures\//, '').replace(/\.webp$/, '')] ?? { w: s.width * 2, h: s.height * 2 }
    const [dl, dd] = [dim(light), dim(dark)]
    if (priority) {
      // The hero is usually the largest paint. Preload ONLY the image for the
      // visitor's colour scheme — a media-scoped preload is skipped by the
      // browser when it does not match, so the pair never costs two downloads.
      for (const [src, d, scheme] of [[light, dl, 'light'], [dark, dd, 'dark']] as const) {
        const { srcSet } = getImageProps({ src, alt: '', width: d.w, height: d.h, sizes }).props
        if (srcSet) preload(src, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high', media: `(prefers-color-scheme: ${scheme})` } as Parameters<typeof preload>[1])
      }
    }
    return (
      <div className={cn(frameCls, className)}>
        {/* A theme pair is never preloaded: `priority` would fetch BOTH images on
            every visit. Lazy loading skips the display:none twin entirely;
            fetchPriority lifts the visible one when it is the hero. */}
        <Image src={light} alt={s.alt} width={dl.w} height={dl.h} sizes={sizes} loading="lazy" fetchPriority={priority ? 'high' : 'auto'} className="theme-light h-auto w-full" />
        <Image src={dark} alt={s.alt} width={dd.w} height={dd.h} sizes={sizes} loading="lazy" fetchPriority={priority ? 'high' : 'auto'} className="theme-dark h-auto w-full" />
      </div>
    )
  }

  const f = mediaFiles(s) as { file: string | null; poster: string | null }
  if (!f.file) return <Placeholder s={s} className={cn(frameCls, className)} />
  if (s.format === 'mp4') {
    return (
      <div className={cn(frameCls, className)}>
        <PlayOnRequest src={f.file} poster={f.poster ?? undefined} width={s.width} height={s.height} label={s.alt} />
      </div>
    )
  }
  return (
    <div className={cn(frameCls, className)}>
      <Image src={f.file} alt={s.alt} width={s.width} height={s.height} sizes={sizes} priority={priority} className="h-auto w-full" />
    </div>
  )
}
