import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/money')

export default function Money() {
  return (
    <>
      <PageHero
        title="Money, with the controls in front of the spend."
        lead="Invoices for clients, credits for metered work, a budget for every person, and a ceiling on every AI call — in the same place as the work they pay for."
        media="client-invoices"
      />
      <Section id="replaces" title="What it replaces">
        <Replaces items={['An invoicing tool', 'Shared AI accounts on a company card', 'A spreadsheet of who spent what']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Invoices"
          body={<p>Numbered invoices addressed to a client company, with your bank transfer details on every one, or a Stripe payment link you add. The client sees them in the portal.</p>}
          features={['MON-01', { id: 'MON-02', text: 'Bank transfer details on every invoice, or a Stripe payment link' }]}
          media="portal-invoices"
        />
        <CapabilityBlock
          reverse
          title="Credits"
          body={<p>Metered work is paid from a credit balance the studio tops up. The balance stops at zero; it never goes negative.</p>}
          features={['MON-03', 'MON-04']}
        />
        <CapabilityBlock
          title="A ceiling on every call"
          body={<p>Every AI call is priced before it runs — the prompt about to be sent and the longest reply it could get. Above the ceiling, the person is shown the number and asked to confirm.</p>}
          features={['MON-05']}
        />
        <CapabilityBlock
          reverse
          title="A budget for every person"
          body={<p>Spend limits per person and per seat class, by day, week or month. The person a budget governs can always see it.</p>}
          features={['MON-06']}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/client', title: 'The client’s portal', body: 'Invoices appear where the client already works with you.' },
            { href: '/ai', title: 'AI and provenance', body: 'The same ceiling and budgets will govern image and video generation.' },
            { href: '/pricing', title: 'Pricing', body: 'Seats plus usage credits.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> Among those checks: a crew member whose role does not include money reads no invoices.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
