/** Hero visuals for pages that have no single product screen to show. */
import { Tilt } from '@/components/cinema/Tilt'
import { ShieldCheck, Users, Eye, PenLine, Check } from '@/components/icons'

const card = 'screen p-5 backdrop-blur'

export function SecurityVisual() {
  const rows = [
    ['Isolation', 'Enforced in the database · 76 checks'],
    ['Identity', 'Two-factor · passkeys · SSO · SCIM'],
    ['Protections', 'Rate limits · CSP · bot checks'],
    ['Data', 'One US region · retention · erasure'],
    ['Content', 'Session watermarks · sealed contracts'],
  ]
  return (
    <div className="relative mx-auto max-w-md" style={{ transform: 'rotateY(-14deg) rotateX(6deg)' }}>
      <Tilt className={`${card} float-a`} max={6}>
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><ShieldCheck className="size-5" aria-hidden /></span>
          <div><p className="font-display font-semibold text-foreground">Security posture</p><p className="text-[12px] text-muted-foreground">Stated precisely — gaps included</p></div>
        </div>
        <ul className="mt-3 space-y-2">
          {rows.map(([a, b]) => (
            <li key={a} className="flex items-center gap-3 rounded-lg bg-background/40 px-3 py-2.5">
              <Check aria-hidden className="size-4 shrink-0 text-status-green" />
              <span className="w-24 shrink-0 font-display text-[14px] font-semibold text-foreground">{a}</span>
              <span className="text-[12px] text-muted-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </Tilt>
    </div>
  )
}

export function GateVisual() {
  const steps = ['Studio budget', 'Person’s budget', 'Ceiling', 'Route', 'Queue', 'Meter', 'Provenance']
  return (
    <div className="relative mx-auto max-w-md" style={{ transform: 'rotateY(-12deg) rotateX(6deg)' }}>
      <Tilt className={`${card} float-a`} max={6}>
        <p className="font-display font-semibold text-foreground">One gate, every generation</p>
        <ol className="relative mt-4 space-y-2 pl-6">
          <span aria-hidden className="absolute bottom-3 left-[9px] top-3 w-px bg-gradient-to-b from-primary via-glow to-primary" />
          {steps.map((s, i) => (
            <li key={s} className="relative flex items-center justify-between rounded-lg bg-background/40 px-3 py-2">
              <span aria-hidden className="absolute -left-[21px] top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
              <span className="text-[14px] font-medium text-foreground">{s}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
            </li>
          ))}
        </ol>
      </Tilt>
    </div>
  )
}

export function NetworkVisual() {
  const nodes = [
    { l: 'Filmmakers', c: 'left-[8%] top-[10%]', I: Users },
    { l: 'Studios', c: 'right-[6%] top-[22%]', I: ShieldCheck },
    { l: 'Actors', c: 'left-[18%] bottom-[12%]', I: PenLine },
    { l: 'Audiences', c: 'right-[14%] bottom-[6%]', I: Eye },
  ]
  return (
    <div className="relative mx-auto aspect-square max-w-md">
      <div className="absolute inset-[18%] rounded-full border border-primary/40 shadow-[0_0_80px_hsl(var(--primary)/0.25)]" />
      <div className="absolute inset-[34%] grid place-items-center rounded-full border border-glow/50 bg-card/60 text-center backdrop-blur">
        <span className="font-display text-sm font-bold text-foreground">The network</span>
      </div>
      {nodes.map(({ l, c, I }, n) => (
        <div key={l} className={`absolute ${c} ${['float-a', 'float-b', 'float-c', 'float-b'][n]}`}>
          <div className="flex items-center gap-2 rounded-full border border-border bg-popover/90 px-3 py-2 shadow-xl backdrop-blur">
            <I aria-hidden className="size-4 text-primary" />
            <span className="text-[13px] font-medium text-foreground">{l}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ManifestoVisual() {
  return (
    <div className="relative mx-auto max-w-md" style={{ transform: 'rotateY(-10deg) rotateX(5deg)' }}>
      <Tilt className={`${card} float-a`} max={5}>
        <p className="font-display text-[12px] font-semibold text-primary">The question every production gets asked</p>
        <p className="mt-3 font-display text-3xl font-bold leading-tight text-foreground">“Who approved version three?”</p>
        <p className="mt-4 text-[14px] leading-6 text-muted-foreground">Genreline exists so that the answer takes ten seconds — and holds up.</p>
      </Tilt>
    </div>
  )
}
