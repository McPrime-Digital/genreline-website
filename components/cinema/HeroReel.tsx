'use client'
/**
 * The hero's reel. With public/media/hero-reel.mp4 present it plays muted,
 * looping, behind a scrim (the owner's footage). Without it, the stage is lit
 * by the cinematic background alone, and — on previews only — a small slate
 * says what to upload.
 */
import * as React from 'react'

export function HeroReel({ src, poster, showSlot }: { src: string | null; poster: string | null; showSlot: boolean }) {
  const reduce = React.useSyncExternalStore(() => () => {}, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true)
  if (src) {
    return (
      <div className="absolute inset-0 -z-10">
        <video className="h-full w-full object-cover opacity-50 dark:opacity-40" src={src} poster={poster ?? undefined} muted loop playsInline autoPlay={!reduce} preload="metadata" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>
    )
  }
  if (!showSlot) return null
  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-10 hidden rounded-md border border-dashed border-primary/50 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur md:block">
      Hero reel slot — add <code className="text-foreground">public/media/hero-reel.mp4</code> (1920×1080, muted, under 6 MB)
    </div>
  )
}
