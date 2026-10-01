/**
 * Each page's own identity — a film-world motif behind its hero, drawn in
 * SVG/CSS on the app's tokens. Decorative: aria-hidden, pointer-transparent,
 * faded into the canvas.
 */
export type MotifName = 'stripboard' | 'timecode' | 'sprockets' | 'seal' | 'ledger' | 'waveform' | 'clapper' | 'brand' | 'nebula' | 'vault' | 'constellation' | 'slate'

const fade = 'pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_70%_at_70%_40%,#000_20%,transparent_75%)]'

export function Motif({ name }: { name: MotifName }) {
  switch (name) {
    case 'stripboard': {
      const colours = ['hsl(0 0% 100% / .10)', 'hsl(48 90% 60% / .16)', 'hsl(210 80% 60% / .16)', 'hsl(140 50% 50% / .14)', 'hsl(0 0% 100% / .08)', 'hsl(48 90% 60% / .12)']
      return (
        <div aria-hidden className={fade}>
          <div className="absolute right-[-4%] top-16 flex h-[78%] w-[62%] -rotate-6 gap-1.5 opacity-80">
            {Array.from({ length: 34 }).map((_, i) => <span key={i} className="h-full flex-1 rounded-sm" style={{ background: colours[(i * 7) % colours.length] }} />)}
          </div>
        </div>
      )
    }
    case 'timecode':
      return (
        <div aria-hidden className={fade}>
          <svg className="absolute bottom-24 right-0 h-40 w-[70%]" viewBox="0 0 700 160" preserveAspectRatio="none">
            {Array.from({ length: 141 }).map((_, i) => <line key={i} x1={i * 5} x2={i * 5} y1={i % 10 === 0 ? 70 : 100} y2={130} stroke="hsl(var(--foreground) / .25)" strokeWidth="1" />)}
            <rect x="0" y="136" width="700" height="4" fill="hsl(var(--foreground) / .12)" />
            <rect x="0" y="136" width="440" height="4" fill="hsl(var(--primary) / .8)" />
            <line x1="440" x2="440" y1="40" y2="150" stroke="hsl(var(--primary))" strokeWidth="2" />
            {[120, 260, 520, 610].map((x) => <circle key={x} cx={x} cy="150" r="5" fill="hsl(var(--glow) / .8)" />)}
            <text x="448" y="56" fill="hsl(var(--primary))" fontSize="16" fontFamily="var(--font-display)">00:00:41:08</text>
          </svg>
        </div>
      )
    case 'sprockets':
      return (
        <div aria-hidden className={fade}>
          {['right-[22%]', 'right-[6%]'].map((p) => (
            <div key={p} className={`absolute ${p} top-0 h-full w-14 -rotate-6 bg-[hsl(228_80%_6%/.6)]`}>
              <div className="absolute inset-y-0 left-1 w-2.5 [background:radial-gradient(circle,hsl(0_0%_100%/.35)_0_3px,transparent_3.5px)_0_0/10px_18px]" />
              <div className="absolute inset-y-0 right-1 w-2.5 [background:radial-gradient(circle,hsl(0_0%_100%/.35)_0_3px,transparent_3.5px)_0_0/10px_18px]" />
            </div>
          ))}
        </div>
      )
    case 'seal':
      return (
        <div aria-hidden className={fade}>
          <svg className="absolute right-[4%] top-10 size-[420px] opacity-60" viewBox="0 0 200 200">
            <defs><path id="sealpath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="hsl(var(--primary) / .6)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="64" fill="none" stroke="hsl(var(--primary) / .4)" strokeWidth="1" strokeDasharray="2 4" />
            <text fontSize="9.5" letterSpacing="3" fill="hsl(var(--primary) / .7)" fontFamily="var(--font-display)"><textPath href="#sealpath">SEALED · CERTIFICATE OF COMPLETION · CONSENT · SIGNATURE ·</textPath></text>
            <path d="M80 102 l14 14 l28 -30" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      )
    case 'ledger':
      return <div aria-hidden className={`${fade} [background:repeating-linear-gradient(to_bottom,transparent_0_35px,hsl(var(--foreground)/.07)_35px_36px),linear-gradient(to_right,transparent_62%,hsl(var(--primary)/.25)_62%,hsl(var(--primary)/.25)_calc(62%+1px),transparent_calc(62%+1px))]`} />
    case 'waveform':
      return (
        <div aria-hidden className={fade}>
          <svg className="absolute right-0 top-1/3 h-56 w-[72%]" viewBox="0 0 720 220" preserveAspectRatio="none">
            {Array.from({ length: 120 }).map((_, i) => { const h = 20 + Math.abs(Math.sin(i * 0.37) * 80 + Math.sin(i * 1.3) * 30); return <rect key={i} x={i * 6} y={110 - h / 2} width="3" height={h} rx="1.5" fill={i < 72 ? 'hsl(var(--primary) / .55)' : 'hsl(var(--foreground) / .18)'} /> })}
          </svg>
        </div>
      )
    case 'clapper':
      return (
        <div aria-hidden className={fade}>
          <div className="absolute right-[6%] top-14 h-[300px] w-[460px] -rotate-6 rounded-xl border border-foreground/15 bg-[hsl(228_80%_6%/.5)]">
            <div className="h-14 rounded-t-xl [background:repeating-linear-gradient(135deg,hsl(0_0%_100%/.75)_0_22px,hsl(228_80%_8%)_22px_44px)] opacity-60" />
            <div className="grid grid-cols-3 gap-px p-4 font-display text-[12px] text-foreground/50">
              {['PROD', 'SCENE', 'TAKE', 'NORTHLIGHT', '01', '04', 'DIRECTOR', 'CAMERA', 'DATE'].map((t) => <span key={t} className="border-b border-foreground/15 py-3">{t}</span>)}
            </div>
          </div>
        </div>
      )
    case 'brand':
      return (
        <div aria-hidden className={fade}>
          <div className="absolute right-[4%] top-16 grid grid-cols-4 gap-3 -rotate-6 opacity-70">
            {['#1F6F5B', '#8B2A3C', '#C8A24A', '#2B4BD8', '#E07A3C', '#5B3FA6', '#0E7C86', '#B83A6A'].map((c) => <span key={c} className="size-24 rounded-2xl shadow-2xl" style={{ background: c }} />)}
          </div>
        </div>
      )
    case 'nebula':
      return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-[-10%] top-[-20%] size-[70vmax] rounded-full bg-[radial-gradient(circle,hsl(var(--glow)/.35),transparent_60%)] blur-3xl" />
          <div className="absolute left-[30%] top-[20%] size-[40vmax] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/.18),transparent_60%)] blur-3xl" />
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(1px_1px_at_20%_30%,#fff,transparent),radial-gradient(1px_1px_at_70%_20%,#fff,transparent),radial-gradient(1.5px_1.5px_at_85%_60%,#fff,transparent),radial-gradient(1px_1px_at_40%_70%,#fff,transparent),radial-gradient(1px_1px_at_60%_45%,#fff,transparent),radial-gradient(1.5px_1.5px_at_10%_80%,#fff,transparent),radial-gradient(1px_1px_at_92%_35%,#fff,transparent)] [background-size:600px_400px]" />
        </div>
      )
    case 'vault':
      return (
        <div aria-hidden className={fade}>
          <svg className="absolute right-[2%] top-0 size-[560px] opacity-50" viewBox="0 0 200 200">
            {[90, 72, 54, 36].map((r, i) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={i === 0 ? 'hsl(var(--glow) / .6)' : 'hsl(var(--foreground) / .18)'} strokeWidth={i === 0 ? 1.2 : 0.6} strokeDasharray={i % 2 ? '3 3' : undefined} />)}
            {Array.from({ length: 24 }).map((_, i) => { const a = (i / 24) * Math.PI * 2; return <line key={i} x1={100 + Math.cos(a) * 36} y1={100 + Math.sin(a) * 36} x2={100 + Math.cos(a) * 90} y2={100 + Math.sin(a) * 90} stroke="hsl(var(--foreground) / .07)" strokeWidth=".5" /> })}
          </svg>
        </div>
      )
    case 'constellation': {
      const pts = [[60, 40], [180, 90], [300, 50], [380, 160], [240, 200], [120, 170], [420, 70], [500, 190], [560, 110]]
      return (
        <div aria-hidden className={fade}>
          <svg className="absolute right-0 top-10 h-[360px] w-[66%]" viewBox="0 0 600 260">
            {pts.map((p, i) => pts.slice(i + 1, i + 3).map((q, j) => <line key={`${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="hsl(var(--primary) / .3)" strokeWidth="1" />))}
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i % 3 ? 3 : 5} fill={i % 3 ? 'hsl(var(--foreground) / .6)' : 'hsl(var(--primary))'} />)}
          </svg>
        </div>
      )
    }
    case 'slate':
    default:
      return (
        <div aria-hidden className={fade}>
          <p className="absolute right-[4%] top-24 font-display text-[16vw] font-bold leading-none tracking-[-0.06em] text-foreground/[0.04]">SC 01</p>
        </div>
      )
  }
}
