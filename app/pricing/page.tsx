import Link from 'next/link'
import { Accordion } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { PageHero, Section } from '@/components/site/Frame'
import { PlanFinder } from '@/components/interactive/PlanFinder'
import { PLANS, USAGE_CREDITS } from '@/content/pricing'
import { APP } from '@/lib/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/pricing')

const QUESTIONS = [
  { q: 'Why are there no prices yet?', a: 'Prices are being set. Until they are, each plan shows what it includes, and we will quote you directly. There is no checkout on this page, because there is nothing to buy through it yet.' },
  { q: 'Can I start now?', a: 'Yes. You can open a studio today without a card. New studios start on the Agency plan.' },
  { q: 'How is AI paid for?', a: USAGE_CREDITS.body },
  { q: 'What happens when we reach a limit?', a: 'Storage is enforced when a file is uploaded, and a studio that has not verified its address holds 1 GB until it does. Talk to us before you reach the others.' },
  { q: 'Do our clients’ teams count as seats?', a: 'The plans count your crew seats and your client companies, not the people on your clients’ teams.' },
]

export default function Pricing() {
  return (
    <>
      <PageHero
        title="Seats, plus usage credits."
        lead="A production company carries a bench. Pricing that charged for every freelancer would punish exactly that, so plans count crew seats and client companies, and metered work is paid from credits."
        size="md"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild variant="primary" size="lg" data-primary-cta><a href={APP.signup}>Open your studio</a></Button>
          <Link href="/contact?topic=sales" className="text-[15px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Talk to us</Link>
        </div>
      </PageHero>
      <Section id="plans" title="Which plan fits" className="pt-0">
        <PlanFinder plans={PLANS} />
      </Section>
      <Section id="credits" title={USAGE_CREDITS.heading} width="measure">
        <p className="text-lg leading-relaxed text-muted-foreground">{USAGE_CREDITS.body}</p>
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
