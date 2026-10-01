'use client'

/**
 * One colour in (CLI-05). The studio picks a colour; the type that sits on it
 * is chosen by MEASURED contrast, not by taste — the published WCAG 2.1
 * relative-luminance formula, five lines of arithmetic (no library; the app
 * rejected one whose licence forbade commercial use). This is a simplified
 * view: the product also derives the dark theme in OKLCH, holding hue and
 * chroma and moving lightness only as far as it must.
 *
 * The four presets are the kinds of colour the app's own probe throws at the
 * derivation: a pale gold, a navy, a neon yellow and a pure red.
 */
import * as React from 'react'
import { cx as cn } from '@/lib/cx'

const PRESETS = [
  { hex: '#E9D8A6', name: 'Pale gold' },
  { hex: '#1B2A4A', name: 'Navy' },
  { hex: '#E6FF00', name: 'Neon yellow' },
  { hex: '#FF0000', name: 'Pure red' },
]
const INK = '#0B1220'
const PAPER = '#FFFFFF'

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const valid = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s)

export function BrandDemo() {
  const [hex, setHex] = React.useState('#1F6F5B')
  const [draft, setDraft] = React.useState('#1F6F5B')
  const ink = contrast(hex, INK)
  const paper = contrast(hex, PAPER)
  const on = ink >= paper ? INK : PAPER
  const ratio = Math.max(ink, paper)

  const commit = (v: string) => {
    const s = v.startsWith('#') ? v : `#${v}`
    setDraft(s)
    if (valid(s)) setHex(s.toUpperCase())
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div>
        <label htmlFor="brand-hex" className="text-[13px] font-medium text-foreground">Your studio’s colour</label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            aria-label="Pick a colour"
            value={hex.toLowerCase()}
            onChange={(e) => commit(e.target.value)}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-1"
          />
          <input
            id="brand-hex"
            value={draft}
            onChange={(e) => commit(e.target.value.trim())}
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            aria-invalid={!valid(draft)}
            aria-describedby="brand-hex-hint"
            className="h-10 w-32 rounded-lg border border-input bg-background px-3 font-body text-sm tabular-nums text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-[invalid=true]:border-destructive"
          />
        </div>
        <p id="brand-hex-hint" className={cn('mt-2 text-[12px]', valid(draft) ? 'text-muted-foreground' : 'text-destructive')}>
          {valid(draft) ? 'Six hex digits, like #1F6F5B.' : 'Enter six hex digits after the #, like #1F6F5B.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => commit(p.hex)}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-muted-foreground outline-none transition-[color,transform] duration-[--dur-press] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              <span aria-hidden className="size-3.5 rounded-sm border border-border" style={{ background: p.hex }} />
              {p.name}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mt-6 text-[15px] leading-7 text-muted-foreground">
          Type on this colour is <span className="font-semibold text-foreground">{on === INK ? 'near-black' : 'white'}</span>, at{' '}
          <span className="font-semibold tabular-nums text-foreground">{ratio.toFixed(1)}&nbsp;:&nbsp;1</span>. WCAG asks for 4.5&nbsp;:&nbsp;1 for body text. The
          other choice would have been <span className="tabular-nums">{Math.min(ink, paper).toFixed(1)}&nbsp;:&nbsp;1</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" style={{ ['--demo' as string]: hex, ['--demo-on' as string]: on }}>
        {[
          { name: 'Light', ground: '#F7F9FB', text: '#171C23', muted: '#525C66', border: '#BFCAD3' },
          { name: 'Dark', ground: '#020A2B', text: '#E8EBF5', muted: '#9AA5C8', border: '#2A3B78' },
        ].map((t) => (
          <div key={t.name} className="squircle border p-5" style={{ background: t.ground, borderColor: t.border }}>
            <p className="text-[12px] font-medium" style={{ color: t.muted }}>{t.name} theme</p>
            <p className="mt-3 text-[15px] font-semibold" style={{ color: t.text }}>Rough cut v3</p>
            <p className="mt-1 text-[13px]" style={{ color: t.muted }}>Waiting for your decision</p>
            <div className="mt-5 flex gap-2">
              <span className="inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-semibold" style={{ background: 'var(--demo)', color: 'var(--demo-on)' }}>Approve</span>
              <span className="inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] font-medium" style={{ borderColor: t.border, color: t.text }}>Request changes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
