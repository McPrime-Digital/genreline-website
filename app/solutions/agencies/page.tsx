import { CapabilityBlock, CtaBand, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/agencies')

export default function Agencies() {
  return (
    <>
      <PageHero
        title="Client-heavy work, in your agency’s name."
        lead="Many clients, many approvals, many rounds. Each client company gets a room, a vault and a portal that wears your agency’s brand — and every approval leaves a record you can hand to anyone who asks."
        media="solutions-agencies"
      />
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Your brand, end to end"
          body={<p>The portal, the screening page, the signing page, the email and the sealed PDF carry your agency’s name and colour. One colour in, an accessible palette out in both themes.</p>}
          features={['FND-09', 'CLI-05', 'FND-10']}
          media="home-portal-brand-a"
        />
        <CapabilityBlock
          reverse
          title="Rounds that end in a record"
          body={<p>Every round is an approval with a review window. When a client goes quiet, the stage advances and the certificate says exactly that — so the conversation about round five is about the work, not about who said yes.</p>}
          features={['APR-01', 'APR-02', 'APR-12']}
          media="client-review-record"
        />
        <CapabilityBlock
          title="Show the cut to the people who never log in"
          body={<p>A guest link with a passcode, an expiry and a view limit, a watermark that names the viewer, and a record of how far they watched.</p>}
          features={['CLI-08', 'CLI-09', 'APR-20']}
          media="client-guest-links"
        />
        <CapabilityBlock
          reverse
          title="Talent and likeness, cleared"
          body={<p>Releases tied to the asset they cover, signed through a single-use link, writing the rights they prove — and a clearance panel that tells the client what they must disclose about a synthetic performer.</p>}
          features={['DOC-10', 'DOC-09', 'CLI-11']}
        />
        <CapabilityBlock
          title="Each client’s team, on their own terms"
          body={<p>A client’s owner invites their own team, gives each person a role, and can scope a teammate to one project.</p>}
          features={['CLI-04', 'IDN-09']}
          media="portal-team"
        />
      </Section>
      <CtaBand />
    </>
  )
}
