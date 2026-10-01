'use client'
/**
 * EVERY SIGN-OFF, PROVABLE. The record writes itself as you arrive: who it
 * went to, what they actually watched, what they said, when they decided —
 * then the certificate seals. The window-closed outcome is one quiet line,
 * not the headline (owner, 2026-10-01).
 */
import * as React from 'react'
import { cx } from '@/lib/cx'

const ROWS = [
  { t: 'Mon 10:02', who: 'Northlight Pictures', what: 'Sent Spring campaign — rough cut v4 for approval', tag: 'Sent' },
  { t: 'Mon 10:02', who: 'Review window', what: 'Closes Thursday at 5:00 PM, under the production agreement', tag: 'Window' },
  { t: 'Tue 14:31', who: 'Maya Lindqvist', what: 'Watched 92% of the cut through a screening link', tag: 'Watched' },
  { t: 'Tue 14:38', who: 'Maya Lindqvist', what: 'Note at 00:00:41:08 — “Hold the logo two frames longer”', tag: 'Note' },
  { t: 'Wed 11:15', who: 'Maya Lindqvist', what: 'Approved, with one note attached', tag: 'Approved' },
  { t: 'Wed 11:15', who: 'Genreline', what: 'Certificate issued — printable, with every step above', tag: 'Sealed' },
]

export function RecordLedger() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let timer: ReturnType<typeof setInterval> | undefined
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      if (reduce) { setN(ROWS.length); return }
      timer = setInterval(() => setN((x) => { if (x >= ROWS.length) { clearInterval(timer); return x } return x + 1 }), 650)
    }, { threshold: 0.35 })
    if (ref.current) io.observe(ref.current)
    return () => { io.disconnect(); if (timer) clearInterval(timer) }
  }, [])
  const sealed = n >= ROWS.length
  return (
    <div ref={ref} className="relative">
      <div className="screen p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[12px] font-semibold text-muted-foreground">Approval record</p>
            <p className="font-display text-xl font-bold text-foreground">Spring campaign — rough cut v4</p>
          </div>
          <span className={cx('rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors duration-500', sealed ? 'bg-status-green/15 text-status-green' : 'bg-secondary text-muted-foreground')}>{sealed ? 'Approved · on the record' : 'Recording…'}</span>
        </div>
        <ol className="mt-4 space-y-1">
          {ROWS.map((r, k) => (
            <li key={k} className={cx('grid grid-cols-[70px_1fr] gap-3 rounded-lg px-2 py-2 transition-[opacity,transform] duration-500 ease-[--ease-out] sm:grid-cols-[80px_150px_1fr_auto]', k < n ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
              <span className="text-[12px] tabular-nums text-muted-foreground">{r.t}</span>
              <span className="hidden text-[13px] font-semibold text-foreground sm:block">{r.who}</span>
              <span className="text-[13px] leading-5 text-foreground"><span className="font-semibold sm:hidden">{r.who}: </span>{r.what}</span>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">{r.tag}</span>
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden className={cx('absolute -bottom-8 -right-4 grid size-24 rotate-12 place-items-center rounded-full border-2 border-primary/70 bg-background/80 text-center font-display text-[10px] font-bold uppercase leading-tight text-primary shadow-[0_0_40px_hsl(var(--primary)/0.4)] backdrop-blur transition-[opacity,transform] duration-700 ease-[--ease-pop] sm:size-28', sealed ? 'scale-100 opacity-100' : 'scale-50 opacity-0')}>
        On the<br />record
      </div>
    </div>
  )
}
