import Link from 'next/link'
import { Feature, FeatureLabel, FeatureList } from '@/components/FeatureLabel'
import { CtaBand, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/ai')

const GATE = [
  { title: 'The studio’s budget', body: 'Is there credit, and has the studio’s own limit been reached?' },
  { title: 'The person’s budget', body: 'Has this person reached the limit set for them, or for their seat class?' },
  { title: 'The ceiling', body: 'What is the most this call could cost? Above the ceiling, the person sees the number and confirms.' },
  { title: 'The route', body: 'Which model does this job, chosen by capability — replaceable, never locked in.' },
  { title: 'The queue', body: 'The work runs on the provider’s machines; Genreline submits and receives.' },
  { title: 'The meter', body: 'The cost is recorded against the person and the production.' },
  { title: 'Provenance', body: 'Which model made the asset, from what, and under what terms — written onto the asset.' },
]

export default function Ai() {
  return (
    <>
      <PageHero
        title="AI with a budget and a record."
        lead="Image and video generation is being built inside the production: many models through one gate, a ceiling on every call, a budget for every person, and provenance on every asset."
        size="md"
      >
        <FeatureLabel id="STG-01" />
      </PageHero>

      <Section id="the-gate" title="One gate, in order" lead="No surface in the product calls a model directly. Every generation will pass through the same seven checks.">
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {GATE.map((g, i) => (
            <li key={g.title}>
              <span className="text-[13px] font-semibold tabular-nums text-primary">{i + 1}</span>
              <p className="mt-1 font-display text-[17px] font-semibold text-foreground">{g.title}</p>
              <p className="mt-1 text-[14px] leading-6 text-muted-foreground">{g.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="today" title="What already works" lead="The first three checks govern text today, inside the assistant.">
        <FeatureList items={['MON-05', 'MON-06', 'AGT-01', 'STG-06', 'CLI-11']} className="max-w-3xl" />
      </Section>

      <Section id="being-built" title="Being built">
        <FeatureList items={['STG-01', 'SWR-11', 'STG-07', 'STG-08', 'STG-09', 'STG-10', 'STG-11', 'STG-12', 'STG-13']} className="max-w-3xl" />
      </Section>

      <Section id="claims" title="What Genreline will not claim" width="measure">
        <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>Genreline does not train models. It routes work to the models a studio chooses.</p>
          <p>So it will not tell you that any model is “commercially safe” — that depends on the model and its terms, not on us — and it offers no IP indemnity for what a model produces.</p>
          <p>What it will give you instead is the record: for every generated asset, which model made it, from what, and under what terms. And for every likeness, <Feature id="DOC-10">the signed release that says whether it may be used at all</Feature>.</p>
        </div>
        <p className="mt-8 text-[15px] text-muted-foreground">Everything being built is on the <Link href="/roadmap?area=generation" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">roadmap</Link>.</p>
      </Section>
      <CtaBand />
    </>
  )
}
