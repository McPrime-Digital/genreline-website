import Link from 'next/link'
import { CtaBand, PageHero, Section, SecurityNote } from '@/components/site/Frame'
import { Feature } from '@/components/FeatureLabel'
import { Icon, type IconName } from '@/components/Icon'
import { Reveal } from '@/components/cinema/Reveal'
import { siteLabel } from '@/content/features'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/production')

/** The AI and hybrid production cycle — every stage, the tool that runs it,
 *  and where it lives. Statuses come from content/features.ts. */
const CYCLE: { n: string; title: string; body: string; icon: IconName; featureId: string; href: string }[] = [
  { n: '01', title: 'Script', body: 'Written and co-edited live in Script Design.', icon: 'PenTool', featureId: 'SWR-01', href: '/product/suite#write' },
  { n: '02', title: 'Breakdown', body: 'Scenes, characters, locations and looks read from the script — lines the assistant suggested are marked.', icon: 'ListTree', featureId: 'CRW-07', href: '/product/crew' },
  { n: '03', title: 'Boards and moodboards', body: 'Storyboards shot by shot, references and palettes pinned to scenes.', icon: 'LayoutGrid', featureId: 'SWR-09', href: '/product/suite#visualise' },
  { n: '04', title: 'Generate', body: 'The Stage: image and video from every major model, through one gate with a budget.', icon: 'WandSparkles', featureId: 'STG-01', href: '/product/suite#stage' },
  { n: '05', title: 'Continuity', body: 'Characters, locations, wardrobe and style held from shot to shot.', icon: 'Fingerprint', featureId: 'STG-07', href: '/product/suite#stage' },
  { n: '06', title: 'Hybrid', body: 'Filmed and generated shots in one cut, a signed release behind every face.', icon: 'Combine', featureId: 'NEW-02', href: '/product/suite#hybrid' },
  { n: '07', title: 'Assemble', body: 'Build the cut from takes and generations; versions stack.', icon: 'Scissors', featureId: 'APR-08', href: '/product/files' },
  { n: '08', title: 'Review', body: 'Frame-accurate notes, drawings on the frame, sessions in sync.', icon: 'ScanEye', featureId: 'APR-14', href: '/product/review' },
  { n: '09', title: 'Approve', body: 'On the record, with a printable certificate.', icon: 'BadgeCheck', featureId: 'APR-02', href: '/product/review' },
  { n: '10', title: 'Rights and disclosure', body: 'Releases write the rights; the client sees what must be disclosed.', icon: 'Stamp', featureId: 'DOC-10', href: '/product/contracts' },
  { n: '11', title: 'Finish and deliver', body: 'Grade, captions, every aspect ratio and cutdown from one master.', icon: 'SlidersHorizontal', featureId: 'PST-04', href: '/product/suite#post' },
  { n: '12', title: 'Invoice', body: 'Numbered invoices in the client’s portal.', icon: 'Receipt', featureId: 'MON-01', href: '/product/money' },
]

export default function Production() {
  return (
    <>
      <PageHero
        motif="stripboard"
        kicker="Production"
        title="The AI production cycle, end to end."
        lead="From the first line of the script to the delivered master and the paid invoice — every stage of an AI or hybrid production in one system, each one reading from the stage before it."
        media={['client-review-record', 'portal-review']}
      />
      <Section id="cycle" kicker="Twelve stages" title="One chain. Nothing retyped, nothing lost between tools.">
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {CYCLE.map((c, i) => {
            const label = siteLabel(c.featureId)
            return (
              <Reveal as="li" key={c.n} delay={(i % 4) * 60} className="bg-background">
                <Link href={c.href} data-feature-id={c.featureId} className="group flex h-full flex-col gap-4 p-6 transition-colors hover:bg-card/60">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-border bg-card text-primary"><Icon name={c.icon} className="size-5" /></span>
                    <span className="font-display text-[13px] tabular-nums text-muted-foreground">{c.n}</span>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                      {c.title}
                      {label === 'Coming' && <span data-feature-label="coming" data-feature-id={c.featureId} className="rounded-md bg-status-blue/15 px-1.5 py-0.5 text-[11px] font-medium text-status-blue">Coming</span>}
                    </p>
                    <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">{c.body}</p>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </ol>
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> A freelancer scoped to one production sees that production and nothing else.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
