/**
 * The footer (S-W §5.2), with pull: a last call to open a studio over the lit
 * stage, the columns, and the wordmark set huge as the end card. No copyright
 * line until the owner names the legal entity (S0-B §7).
 */
import Link from 'next/link'
import { ProductMark } from '@/components/ProductMark'
import { FOOTER } from '@/content/nav'
import { APP, LEGAL_ENTITY, REGION_STATEMENT } from '@/lib/site'

const isExternal = (href: string) => href.startsWith('http')

export function SiteFooter() {
  return (
    <footer className="relative isolate mt-10 overflow-hidden border-t border-border">
      <div className="aurora -z-10 opacity-40" />
      <div className="container-wide">
        <div className="flex flex-col gap-8 border-b border-border py-14 md:flex-row md:items-end md:justify-between">
          <div>
            <ProductMark size={40} />
            <p className="mt-5 max-w-[34ch] font-display text-3xl font-bold leading-tight text-foreground">Run the production. Keep the record.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={APP.signup} className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Open Studio OS account</a>
            <Link href="/contact?topic=sales" className="liquid-pill liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Talk to us</Link>
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5">
          {FOOTER.map((col) => (
            <div key={col.heading}>
              <p className="font-display text-[14px] font-semibold text-foreground">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {isExternal(l.href) ? (
                      <a href={l.href} className="text-[14px] text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="text-[14px] text-muted-foreground transition-colors hover:text-foreground">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-5 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
            <span>{REGION_STATEMENT}</span>
            <Link href="/security" className="hover:text-foreground">Security</Link>
            <Link href="/roadmap" className="hover:text-foreground">Roadmap</Link>
            {LEGAL_ENTITY && <span>© {new Date().getFullYear()} {LEGAL_ENTITY}</span>}
          </div>
        </div>
      </div>
      <p aria-hidden translate="no" className="pointer-events-none select-none text-center font-display text-[22vw] font-bold leading-[0.8] tracking-[-0.06em] text-foreground/[0.05]">
        Genreline
      </p>
    </footer>
  )
}
