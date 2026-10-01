/**
 * The whole production as a strip of film: every frame a stage, with the
 * real screen where one exists. It runs on its own; hover holds it.
 */
import { Media, hasMedia } from '@/components/site/Media'

export type ReelFrame = { tc: string; title: string; body: string; media?: string; featureId: string; coming?: boolean }

function Frame({ f }: { f: ReelFrame }) {
  const m = f.media && hasMedia(f.media) ? f.media : null
  return (
    <div data-feature-id={f.featureId} className="mx-2 w-[300px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[hsl(228_80%_8%)] sm:w-[340px]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[hsl(228_60%_12%)]">
        {m ? <Media id={m} frame={false} sizes="340px" className="!rounded-none opacity-90" /> : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_60%),radial-gradient(circle_at_80%_80%,hsl(var(--glow)/0.3),transparent_55%)] font-display text-3xl font-bold text-white/80">{f.title}</div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-display text-[11px] tabular-nums text-white/90">{f.tc}</span>
      </div>
      <div className="p-4">
        <p className="flex items-center gap-2 font-display text-[16px] font-semibold text-white">{f.title}{f.coming && <span data-feature-label="coming" data-feature-id={f.featureId} className="rounded bg-status-blue/25 px-1.5 py-0.5 text-[10px] font-medium text-[hsl(205_80%_80%)]">Coming</span>}</p>
        <p className="mt-1 text-[13px] leading-5 text-white/65">{f.body}</p>
      </div>
    </div>
  )
}

export function ProductionReel({ frames }: { frames: readonly ReelFrame[] }) {
  return (
    <div className="filmstrip">
      <div className="marquee" style={{ ['--marquee-dur' as string]: '90s' }}>
        <div className="marquee-track">
          {[...frames, ...frames].map((f, n) => <Frame key={n} f={f} />)}
        </div>
      </div>
    </div>
  )
}
