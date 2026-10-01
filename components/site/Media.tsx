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
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Image from 'next/image'
import { slot, type MediaSlot } from '@/content/media'
import { PlayOnRequest } from '@/components/site/PlayOnRequest'
import { cn } from '@/lib/utils'

const pub = (p: string) => existsSync(join(process.cwd(), 'public', p))

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
    if (!f.light && !f.dark) return <Placeholder s={s} className={cn(frameCls, className)} />
    const light = f.light ?? f.dark!
    const dark = f.dark ?? f.light!
    const common = { alt: s.alt, width: s.width * 2, height: s.height * 2, sizes, priority, className: 'h-auto w-full' }
    return (
      <div className={cn(frameCls, className)}>
        <Image src={light} {...common} alt={s.alt} className={cn(common.className, 'theme-light')} />
        <Image src={dark} {...common} alt={s.alt} className={cn(common.className, 'theme-dark')} />
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
