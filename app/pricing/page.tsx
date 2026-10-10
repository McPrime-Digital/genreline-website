import Link from 'next/link'
import { Accordion } from 'radix-ui'
import { PageHero, Section } from '@/components/site/Frame'
import { PlanFinder } from '@/components/interactive/PlanFinder'
import { PLANS, ADDONS, METERS, AI, JOB_POST, UNITS, TRIAL_AND_EXPLORE } from '@/content/pricing'
import { APP } from '@/lib/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/pricing')

const money = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: v % 1 ? 2 : 0 })}`
const aiUnit = UNITS.find((u) => u.id === 'ai')!

const QUESTIONS = [
  { q: 'Are these prices final?', a: 'They are provisional until launch. They are generated from the same catalog the product bills from, so what you read here is what a studio is charged today; if a price moves before launch, this page moves with it.' },
  { q: 'Can I start now?', a: `Yes. You can open a studio today without a card. ${TRIAL_AND_EXPLORE.body}` },
  { q: 'What does a card do during the trial?', a: TRIAL_AND_EXPLORE.card },
  { q: 'What happens when the trial ends?', a: TRIAL_AND_EXPLORE.explore },
  { q: 'How is AI paid for?', a: aiUnit.plain },
  { q: 'What happens when we go beyond the plan?', a: 'What your seats include is pooled across the studio. Beyond it, meetings, recording, video and the archive are metered at the prices on this page and billed on the month’s invoice — never from your AI balance — under a monthly ceiling you set ($200 by default). At the ceiling the metered services pause until the month turns or you raise it; nothing is deleted and everything included keeps working. Storage beyond the plan is bought in 250 GB blocks; an upload past them is refused, never deleted.' },
  { q: 'Do our clients’ teams count as seats?', a: `No. A seat is a person who works for your studio. Your clients are counted as companies — each with up to ${PLANS[0].peoplePerCompany} of its own people logging in — and your freelancers as collaborator-months, only in the months they are on a job.` },
  { q: 'Is there an annual price?', a: 'Yes — two months free, billed yearly per seat. Enterprise is annual and by contract.' },
]

export default function Pricing() {
  return (
    <>
      <PageHero motif="ledger"
        title="Per seat, with the rest metered beside its cost."
        lead="A production company carries a bench. Pricing that charged for every freelancer would punish exactly that, so plans count staff seats and client companies, freelancers count only in the months they work, and everything we pay a provider for per use — meetings, recording, video, the archive, AI — is metered at a price beside its cost."
        size="md"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href={APP.signup} data-primary-cta className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Open Studio OS account</a>
          <Link href="/contact?topic=sales" className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Talk to us</Link>
        </div>
      </PageHero>
      <Section id="plans" title="Which plan fits" className="pt-0">
        <PlanFinder plans={PLANS} />
      </Section>
      <Section id="units" title="Every unit, plainly" width="measure">
        <dl className="divide-y divide-border border-y border-border">
          {UNITS.map((u) => (
            <div key={u.id} className="py-5">
              <dt className="text-[16px] font-semibold text-foreground">{u.name}</dt>
              <dd className="mt-1.5 text-[15px] leading-7 text-muted-foreground">{u.plain}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="beyond" title="Beyond the plan" width="measure">
        <p className="text-lg leading-relaxed text-muted-foreground">Bought by the unit, a month at a time, from inside the studio.</p>
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {ADDONS.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
              <span className="text-[15px] text-foreground">{a.name}{a.note ? <span className="text-muted-foreground"> · {a.note}</span> : null}</span>
              <span className="text-[15px] font-medium tabular-nums text-foreground">{money(a.amount)} <span className="font-normal text-muted-foreground">{a.unit}</span></span>
            </li>
          ))}
          <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <span className="text-[15px] text-foreground">Job post on the Marketplace<span className="text-muted-foreground"> · {JOB_POST.businessIncluded} a month included on Business</span></span>
            <span className="text-[15px] font-medium tabular-nums text-foreground">{money(JOB_POST.amount)} <span className="font-normal text-muted-foreground">{JOB_POST.unit}</span></span>
          </li>
        </ul>
        <p className="mt-10 text-lg leading-relaxed text-muted-foreground">Metered when you use more than your seats include — at a price beside what it costs us, under a monthly ceiling you set.</p>
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {METERS.map((m) => (
            <li key={m.id} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="text-[15px] font-semibold text-foreground">{m.name}</span>
                <span className="text-[15px] font-medium tabular-nums text-foreground">{money(m.amount)} <span className="font-normal text-muted-foreground">{m.unit}</span></span>
              </div>
              <p className="mt-1 text-[14px] leading-6 text-muted-foreground">{m.plain}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="ai" title="AI, prepaid" width="measure">
        <p className="text-lg leading-relaxed text-muted-foreground">{aiUnit.plain}</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {AI.plans.map((p) => (
            <li key={p.id} className="rounded-full border border-border px-4 py-2 text-[14px] text-foreground">{p.name} <span className="text-muted-foreground">· {money(p.amount)} a month, no bonus</span></li>
          ))}
          <li className="rounded-full border border-border px-4 py-2 text-[14px] text-foreground">Top up <span className="text-muted-foreground">· from {money(AI.minimumTopUp)}, lasts twelve months</span></li>
        </ul>
      </Section>
      <Section id="trial" title={TRIAL_AND_EXPLORE.heading} width="measure">
        <p className="text-lg leading-relaxed text-muted-foreground">{TRIAL_AND_EXPLORE.body}</p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{TRIAL_AND_EXPLORE.card}</p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{TRIAL_AND_EXPLORE.explore}</p>
        <p className="mt-4 text-sm text-muted-foreground">{TRIAL_AND_EXPLORE.domain}</p>
      </Section>
      <Section id="questions" title="Questions" width="measure">
        <Accordion.Root type="single" collapsible className="divide-y divide-border border-y border-border">
          {QUESTIONS.map((x) => (
            <Accordion.Item key={x.q} value={x.q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-[16px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {x.q}
                  <span aria-hidden className="text-muted-foreground transition-transform duration-[--dur-pop] group-data-[state=open]:rotate-45">+</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-4 text-[15px] leading-7 text-muted-foreground">{x.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Section>
    </>
  )
}
