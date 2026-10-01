import Link from 'next/link'
import { FeatureList } from '@/components/FeatureLabel'
import { Connects, CtaBand, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product')

export default function Product() {
  return (
    <>
      <PageHero
        title="One operating system. Three spaces."
        lead="Crew is where the studio works. Client is where it serves the companies it makes things for, in its own brand. The Suite is where the work is written, boarded and kept. Underneath all three is one record."
        media="client-overview"
      />
      <Section id="spaces" title="The spaces">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { name: 'Crew', href: '/product/crew', body: 'The directory, tasks, internal rooms and approvals, permissions, and the production schedule that comes out of the script.', items: ['CRW-02', 'CRW-04', 'IDN-03'] },
            { name: 'Client and portal', href: '/product/client', body: 'Companies, projects, the shared room, review and approval, contracts, meetings, invoices — and a portal that wears your studio’s name.', items: ['MSG-01', 'CLI-05', 'CLI-08'] },
            { name: 'The Suite', href: '/product/suite', body: 'A screenplay editor, document types, storyboards and the asset library today. Generation is being built.', items: ['SWR-01', 'SWR-09', 'STG-01'] },
          ].map((s) => (
            <div key={s.name} className="flex flex-col squircle-lg border border-border bg-card/40 p-6">
              <h3 className="font-display text-xl font-semibold text-foreground">{s.name}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.body}</p>
              <FeatureList items={s.items} className="mt-5 flex-1" />
              <Link href={s.href} className="mt-6 text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Open {s.name}</Link>
            </div>
          ))}
        </div>
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
