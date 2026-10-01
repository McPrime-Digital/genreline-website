import { Connects, CtaBand, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'
import { SpacesSection } from '@/components/cinema/SpacesSection'

export const metadata = pageMeta('/product')

export default function Product() {
  return (
    <>
      <PageHero
        kicker="Product"
        title="One operating system. Three spaces."
        lead="Crew is where the studio works. Client is where it serves the companies it makes things for, in its own brand. The Suite is where the work is written, boarded and kept. Underneath all three is one record."
        media={['client-overview', 'client-review', 'crew-tasks']}
      />
      <Section id="spaces" kicker="The spaces" title="Crew, Client and the Suite">
        <SpacesSection />
      </Section>
      <Section id="capabilities" title="Capabilities that run across the spaces">
        <Connects
          items={[
            { href: '/product/review', title: 'Review and approval', body: 'Approval as a record: stages, review windows, automatic advance on silence, and a certificate.' },
            { href: '/product/contracts', title: 'Contracts and signing', body: 'Templates, fields on the PDF, consent before signature, a seal, and releases that write rights.' },
            { href: '/product/production', title: 'Production', body: 'Scenes from the screenplay, breakdown, stripboard, shoot days and sealed call sheets.' },
            { href: '/product/meetings', title: 'Meetings and scheduling', body: 'Meetings, synchronised review playback, recording, a calendar on both sides, and booking.' },
            { href: '/product/money', title: 'Money', body: 'Invoices, credits, a budget per person and a ceiling on every AI call.' },
            { href: '/product/files', title: 'Files and screening', body: 'The vault, resumable large uploads, versions, and a screening room that records what a guest watched.' },
          ]}
        />
      </Section>
      <Section id="platform" title="The platform beneath them">
        <Connects
          items={[
            { href: '/security', title: 'Security', body: 'Every control that exists, stated precisely — and what has not been done yet.' },
            { href: '/ai', title: 'AI and provenance', body: 'One gate, a budget per person, a ceiling per call, provenance and rights per asset.' },
            { href: '/enterprise', title: 'Enterprise', body: 'Single sign-on, SCIM, a studio’s own security rules, and membership in several organizations.' },
          ]}
        />
      </Section>
      <CtaBand />
    </>
  )
}
