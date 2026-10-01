/**
 * The icons the BROWSER needs, inlined. Paths are lucide's (ISC licence,
 * https://lucide.dev — © Lucide Contributors). lucide-react 1.x marks every icon a client component, so even a server component's icon shipped its runtime — ~9 KB gzipped
 * on every page view for eleven glyphs; these cost a few hundred bytes.
 * Server components may still import lucide-react: they ship no JavaScript.
 */
import * as React from 'react'

type P = React.SVGProps<SVGSVGElement>
const base = (props: P, children: React.ReactNode) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
)

export const Search = (p: P) => base(p, <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>)
export const ChevronDown = (p: P) => base(p, <path d="m6 9 6 6 6-6" />)
export const Menu = (p: P) => base(p, <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>)
export const X = (p: P) => base(p, <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>)
export const Monitor = (p: P) => base(p, <><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></>)
export const Sun = (p: P) => base(p, <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>)
export const Moon = (p: P) => base(p, <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />)
/** Matte: a disc of grain. Drawn here (lucide has no grain glyph), in lucide's stroke and dot idiom. */
export const Grain = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><path d="M9 8.5h.01M13.5 7.5h.01M16 11h.01M11.5 12h.01M8 13.5h.01M14 15.5h.01M10.5 16.5h.01" /></>)
export const Check = (p: P) => base(p, <path d="M20 6 9 17l-5-5" />)
export const Minus = (p: P) => base(p, <path d="M5 12h14" />)
export const Play = (p: P) => base(p, <path d="M6 3 20 12 6 21Z" />)
export const CornerDownLeft = (p: P) => base(p, <><path d="m9 10-5 5 5 5" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></>)
export const ShieldCheck = (p: P) => base(p, <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>)
export const Users = (p: P) => base(p, <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>)
export const Briefcase = (p: P) => base(p, <><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>)
export const Building = (p: P) => base(p, <><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></>)
export const Link2 = (p: P) => base(p, <><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><path d="M8 12h8" /></>)
export const Eye = (p: P) => base(p, <><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" /></>)
export const PenLine = (p: P) => base(p, <><path d="M12 20h9" /><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.85.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.85z" /></>)
