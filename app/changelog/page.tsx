import { PageHero, Section } from '@/components/site/Frame'
import { Badge } from '@/components/ui/badge'
import { CHANGELOG } from '@/content/changelog'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/changelog')

const AREA: Record<string, string> = { crew: 'Crew', client: 'Client', suite: 'Suite', review: 'Review', contracts: 'Contracts', platform: 'Platform', security: 'Security' }
const date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

export default function Changelog() {
  return (
    <>
      <PageHero title="Changelog" lead="What shipped, dated." size="md" />
      <Section className="pt-0" width="measure">
        <ol className="space-y-14">
          {CHANGELOG.map((e) => (
            <li key={e.date + e.title} className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-8">
              <time dateTime={e.date} className="text-[13px] tabular-nums text-faint sm:pt-1.5">{date.format(new Date(e.date))}</time>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-foreground">{e.title}</h2>
                  <Badge tone="outline">{AREA[e.area]}</Badge>
                </div>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-muted-foreground marker:text-faint">
                  {e.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  )
}
