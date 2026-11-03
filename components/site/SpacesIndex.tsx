/**
 * THE SPACES INDEX — every space and portal, each a way back up to its place
 * on the page, at the foot of the home page. It sat under the hero's closing
 * title until the owner moved it (2026-11-03: "it must go to the bottom as
 * there must be a breathing area"). Its line is the last sentence of the old
 * hero's lede. Words from content/home.ts.
 */
import { Icon } from '@/components/Icon'
import { hero } from '@/content/home'

export function SpacesIndex() {
  const { label, line, spaces } = hero.index
  return (
    <section aria-labelledby="spaces-index" className="border-t border-border py-16 sm:py-20">
      <div className="container-wide">
        <h2 id="spaces-index" className="font-display text-[13px] font-semibold text-primary">{label}</h2>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-6 text-muted-foreground">{line}</p>
        <nav aria-labelledby="spaces-index" className="spaces-index mt-8">
          {spaces.map((e) => (
            <a key={e.href} href={e.href} className="group spaces-index-item">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary transition-colors group-hover:border-primary/50">
                <Icon name={e.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[14.5px] font-semibold text-foreground">{e.name}</span>
                <span className="mt-0.5 block text-[12.5px] leading-[1.35] text-muted-foreground">{e.line}</span>
              </span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
