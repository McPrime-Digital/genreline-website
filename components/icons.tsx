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
export const Check = (p: P) => base(p, <path d="M20 6 9 17l-5-5" />)
export const Minus = (p: P) => base(p, <path d="M5 12h14" />)
export const Play = (p: P) => base(p, <path d="M6 3 20 12 6 21Z" />)
export const CornerDownLeft = (p: P) => base(p, <><path d="m9 10-5 5 5 5" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></>)
export const ShieldCheck = (p: P) => base(p, <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>)
