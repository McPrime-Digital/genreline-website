import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/production')

const STEPS = [
  { title: 'Scenes', body: 'Read from the screenplay the writer is working in. The writer’s scene numbers are kept; a new breakdown updates in place and never renumbers.' },
  { title: 'Breakdown', body: 'Cast, props, locations and the rest, per scene. A line the assistant suggested is marked as such.' },
  { title: 'Stripboard', body: 'Scenes grouped by location, interiors and day first, filled to a page budget per day. The first AD then drags.' },
  { title: 'Shoot days', body: 'Each day lands on the calendar — the studio’s and the client’s — with no extra step.' },
  { title: 'Call sheet', body: 'Sealed, numbered and sent in your studio’s voice. A change after sending is a new version, not an edit.' },
]

export default function Production() {
  return (
    <>
      <PageHero
        title="From the script to the shoot day."
        lead="Scenes come from the screenplay the writer is in. Breakdown, stripboard and shoot days follow, and a call sheet goes out sealed and numbered in your studio’s voice."
        media="crew-production"
      />
      <Section id="replaces" title="What it replaces">
        <Replaces items={['Retyping scenes from a PDF', 'A scheduling program', 'A stripboard in a spreadsheet', 'Call sheet templates', 'A calendar kept by hand']} />
      </Section>
      <Section id="the-chain" title="One chain, five steps">
        <ol className="grid gap-6 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="text-[13px] font-semibold tabular-nums text-primary">{i + 1}</span>
              <p className="mt-1 font-display text-lg font-semibold text-foreground">{s.title}</p>
              <p className="mt-1 text-[14px] leading-6 text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Breakdown that reads the script"
          body={<p>The breakdown is built from the screenplay itself, so the chain starts where the writing is — not from a PDF somebody exported last week.</p>}
          features={['CRW-07', 'SWR-01']}
          media="crew-production"
        />
        <CapabilityBlock
          reverse
          title="Shoot days on every calendar that needs them"
          body={<p>A dated shoot day appears on the studio’s calendar and on the client’s, beside approval deadlines and invoice dates.</p>}
          features={['CRW-08', 'MTG-02']}
          media="crew-calendar"
        />
        <CapabilityBlock
          title="A call sheet is a sealed record"
          body={<p>It is built from the day, hashed, stored as a numbered version with its PDF in the vault, and sent in your studio’s voice. Clients read the sent sheets for their own productions.</p>}
          features={['CRW-06', 'FND-10']}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/suite', title: 'The Suite', body: 'The screenplay editor the breakdown reads from.' },
            { href: '/product/crew', title: 'The Crew space', body: 'The directory the call sheet is staffed from.' },
            { href: '/product/meetings', title: 'The calendar', body: 'Where shoot days meet every other date that matters.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> Among those checks: a client reads only the call sheets sent for its own productions, and none of the breakdown.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
