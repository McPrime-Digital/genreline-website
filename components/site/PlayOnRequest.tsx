'use client'

/** A muted video that loads and plays only when asked (S-W §8: poster first,
 *  loads on request; S-B: nothing decorative moves on its own). */
import * as React from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

export function PlayOnRequest({ src, poster, width, height, label }: { src: string; poster?: string; width: number; height: number; label: string }) {
  const [playing, setPlaying] = React.useState(false)
  if (playing) {
    return <video src={src} poster={poster} width={width} height={height} muted loop playsInline autoPlay controls aria-label={label} className="h-auto w-full" />
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} className="group relative block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ aspectRatio: `${width} / ${height}` }}>
      {poster && <Image src={poster} alt="" fill sizes="100vw" className="object-cover" />}
      <span className="absolute inset-0 grid place-items-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-sm font-medium text-foreground shadow backdrop-blur transition-transform duration-[--dur-press] group-active:scale-[0.97]">
          <Play aria-hidden className="size-4" /> Play — {label}
        </span>
      </span>
    </button>
  )
}
