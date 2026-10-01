/**
 * The footer (S-W §5.2). Bottom row: the mark, the region statement, the theme
 * toggle. NO COPYRIGHT LINE until the owner names the legal entity (S0-B §7 —
 * an unowned © claim is worse than none); `LEGAL_ENTITY` in lib/site.ts turns
 * it on.
 */
import Link from 'next/link'
import { ProductMark } from '@/components/ProductMark'
import { ThemeToggle } from '@/components/site/ThemeToggle'
import { FOOTER } from '@/content/nav'
import { LEGAL_ENTITY, REGION_STATEMENT } from '@/lib/site'

const isExternal = (href: string) => href.startsWith('http')

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container-wide py-14">
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {FOOTER.map((col) => (
            <div key={col.heading}>
              <p className="text-[13px] font-semibold text-foreground">{col.heading}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {isExternal(l.href) ? (
                      <a href={l.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-14 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <ProductMark size={24} />
            <span className="text-[13px] text-muted-foreground">{REGION_STATEMENT}</span>
            {LEGAL_ENTITY && <span className="text-[13px] text-muted-foreground">© {new Date().getFullYear()} {LEGAL_ENTITY}</span>}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}
