import Link from 'next/link'
import { CtaBand, PageHero, Section } from '@/components/site/Frame'
import { Media } from '@/components/site/Media'
import { FOUNDER } from '@/lib/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/about')

export default function About() {
  return (
    <>
      <PageHero
        title="Why Genreline exists."
        lead="A production runs on a dozen tools, and the record of what happened falls through the gaps between them."
        size="md"
      />
      <Section width="measure" className="pt-0">
        <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>The chat is in one place, the cuts in another, the signatures in a third, the invoices in a fourth. Each tool is good at its job. None of them can say who approved version three, what they had actually watched when they did, whether the face in shot 47 agreed to be used, or what happens on Thursday if the client says nothing.</p>
          <p>Genreline puts the production in one system so that it can answer those questions — and so the client of a studio sees the studio, not the software it runs on.</p>
        </div>
      </Section>
      <Section title="How it is built" width="measure">
        <ul className="space-y-5 text-[16px] leading-7 text-muted-foreground">
          <li><span className="font-semibold text-foreground">Every claim on this site traces to an inventory.</span> A feature is marked available only when it works today. Everything else is on the <Link href="/roadmap" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">roadmap</Link>, with its status.</li>
          <li><span className="font-semibold text-foreground">The boundary between studios is held in the database,</span> and 76 automated security checks prove it on every change.</li>
          <li><span className="font-semibold text-foreground">The gaps are published.</span> The <Link href="/security#not-yet" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">security page</Link> lists what has not been done, beside what has.</li>
          <li><span className="font-semibold text-foreground">Nothing is quietly dropped.</span> A feature leaves the plan only by a decision, written down with its date.</li>
        </ul>
      </Section>
      {FOUNDER && (
        <Section title="Who is building it" width="measure">
          <div className="grid items-start gap-8 sm:grid-cols-[200px_minmax(0,1fr)]">
            <Media id="about-founder" frame={false} sizes="200px" />
            <div>
              <p className="font-display text-xl font-semibold text-foreground">{FOUNDER.name}</p>
              <p className="text-[14px] text-muted-foreground">{FOUNDER.role}</p>
              <p className="mt-3 text-[16px] leading-7 text-muted-foreground">{FOUNDER.bio}</p>
            </div>
          </div>
        </Section>
      )}
      <CtaBand />
    </>
  )
}
