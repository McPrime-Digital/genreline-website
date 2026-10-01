import { CtaBand, PageHero, Section, Connects } from '@/components/site/Frame'
import { DayInProduction } from '@/components/site/DayInProduction'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/production-companies')

export default function ProductionCompanies() {
  return (
    <>
      <PageHero
        title="Run the whole production."
        lead="Crew, clients, cuts, approvals, contracts and money in one place — with a record that holds up after the wrap, and a portal your clients know as yours."
        media="solutions-production-companies"
      />
      <Section id="a-day" title="A day in production">
        <DayInProduction
          steps={[
            { when: '6:30 AM', title: 'The call sheet is already out', body: 'Sent last night, sealed and numbered, in your studio’s name. A change this morning is version two, not an edit to version one.', href: '/product/production' },
            { when: '10:00 AM', title: 'Rough cut v3 goes to the client', body: 'Sent for approval with a review window. The client’s calendar now says what happens if nobody responds.', href: '/product/review' },
            { when: '1:15 PM', title: 'The agency’s producer watches through a guest link', body: 'No account needed. Their name moves across the frame, and the studio sees how far they watched.', href: '/product/files' },
            { when: '3:40 PM', title: 'Notes land on the frame', body: 'Anchored to the timecode, in the same room as the conversation, and out to the editor as markers.', href: '/product/review' },
            { when: '5:00 PM', title: 'A background actor signs a likeness release', body: 'On a phone, through a single-use link. The signature writes the asset’s rights — including that the likeness may not train a model.', href: '/product/contracts' },
            { when: 'Next morning', title: 'Nobody answered on the other cut', body: 'The stage advanced automatically, and the record names it an automatic advance — not a sign-off nobody gave.', href: '/product/review' },
          ]}
        />
      </Section>
      <Section id="spaces" title="Where each part lives">
        <Connects
          items={[
            { href: '/product/crew', title: 'Crew', body: 'The directory, tasks, internal rooms and permissions.' },
            { href: '/product/client', title: 'Client and portal', body: 'The room, the cuts, the approvals, the contracts and the invoices — in your brand.' },
            { href: '/product/suite', title: 'The Suite', body: 'The screenplay the breakdown reads from, boards and the library.' },
          ]}
        />
      </Section>
      <CtaBand />
    </>
  )
}
