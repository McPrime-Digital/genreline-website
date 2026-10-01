import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/client')

export default function Client() {
  return (
    <>
      <PageHero
        title="Run client work in your studio’s brand."
        lead="Companies, projects, the conversation, the cuts, the approvals, the contracts and the invoices — and a portal your clients sign into that wears your name, not ours."
        media={['portal-dashboard', 'portal-messages', 'client-overview']}
      />
      <Section id="replaces" title="What it replaces">
        <Replaces items={['Email threads with clients', 'File-sharing links', 'A review tool', 'An e-signature tool', 'An invoicing tool', 'A client portal from somebody else’s brand']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Companies and projects"
          body={<p>Every client company with its projects, its own team and its own roles. A client’s owner can scope a teammate to a single project and set where their history begins.</p>}
          features={['CLI-02', 'CLI-03', 'CLI-04', 'IDN-09', 'IDN-10']}
          media="client-companies"
        />
        <CapabilityBlock
          reverse
          title="The client company is the room"
          body={<p>The studio and the client share one room per company, with project tags, threads, mentions of people and of projects, files, tasks and approvals, read receipts and voice notes. An outside collaborator can be seated in one room and nowhere else.</p>}
          features={['MSG-01', 'MSG-04', 'MSG-09', 'MSG-12', 'MSG-19', 'MSG-20']}
          media="client-messages"
        />
        <CapabilityBlock
          title="Review and approval"
          body={<p>Send a cut, a document or a task for approval with a review window. The client reviews frame by frame and decides — or, if nobody responds, the stage advances and the record says so.</p>}
          features={['APR-01', 'APR-02', 'APR-14', 'APR-20']}
          media="portal-review"
        />
        <CapabilityBlock
          reverse
          title="The client’s calendar"
          body={<p>The client sees what’s coming, ordered by whose move it is. Each pending decision says what happens if nobody responds: the stage advances automatically, and the production moves on.</p>}
          features={['MTG-02']}
          media={['portal-calendar', 'crew-calendar']}
        />
        <CapabilityBlock
          title="The vault"
          body={<p>Files on both sides, by production. Large uploads pause and resume, and a new version stacks on the one before it.</p>}
          features={['FIL-01', 'FIL-03', 'APR-08']}
          media="portal-files"
        />
        <CapabilityBlock
          reverse
          title="Contracts and releases"
          body={<p>Contracts from templates, signed in the portal or through a single-use link by somebody with no account. A signed talent or likeness release writes the rights it proves onto the asset.</p>}
          features={['DOC-01', 'DOC-09', 'DOC-10']}
          media="portal-contracts"
        />
        <CapabilityBlock
          title="Meetings and booking"
          body={<p>Meetings addressed to a client company are joinable by its team. The client books from your availability, and the meeting is the booking.</p>}
          features={['MTG-01', 'MTG-04']}
          media="portal-meetings"
        />
        <CapabilityBlock
          reverse
          title="The screening room"
          body={<p>Show a cut to somebody with no account through a guest link with a passcode, an expiry and a view limit. Every guest sees their own identity moving across the frame — a session watermark, not forensic marking — and the studio sees how far each guest actually watched.</p>}
          features={['CLI-08', 'CLI-09', 'APR-18']}
          media="client-guest-links"
        />
        <CapabilityBlock
          title="Your brand, everywhere it leaves the building"
          body={<p>The portal, the screening page, the signing page, the email and the sealed contract PDF carry your studio’s name, logo and colour. Your clients never receive mail branded Genreline.</p>}
          features={['FND-09', 'CLI-05', 'FND-10']}
          media="client-brand-kit"
        />
        <CapabilityBlock
          reverse
          title="Disclosure the client bears"
          body={<p>When an asset contains a synthetic performer, the clearance panel tells the client — the party that runs the advertisement — what has to be disclosed, alongside what the signed releases permit.</p>}
          features={['CLI-11']}
        />
        <CapabilityBlock
          title="Invoices"
          body={<p>Numbered invoices with your bank transfer details on every one, or a Stripe payment link you add. The client sees them in the portal.</p>}
          features={['MON-01', { id: 'MON-02', text: 'Bank transfer details on every invoice, or a Stripe payment link' }]}
          media="portal-invoices"
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/crew', title: 'The Crew space', body: 'The studio works the same tasks and approvals from its side.' },
            { href: '/product/review', title: 'Review and approval', body: 'The record the portal shows is the record the certificate prints.' },
            { href: '/product/contracts', title: 'Contracts', body: 'A release signed in the portal writes the asset’s rights.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> Among those checks: one client company cannot read another’s files, rights or approvals.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
