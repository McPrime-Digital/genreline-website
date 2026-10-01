import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/files')

export default function Files() {
  return (
    <>
      <PageHero
        title="Files and screening."
        lead="A vault on both sides, uploads that pause and resume, versions that stack, and a screening room that records how far each guest actually watched."
        media="client-files"
      />
      <Section id="replaces" title="What it replaces">
        <Replaces items={['A file-transfer service', 'Shared drive folders', 'Review links that record nothing', 'Version numbers in file names']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="The vault"
          body={<p>Files by production, on the studio’s side and the client’s. Uploads go straight to storage rather than through a server. Above 8 MB they pause and resume, and the server checks every part before it accepts the file.</p>}
          features={['FIL-01', 'FIL-03', 'FND-20']}
          media="portal-files"
        />
        <CapabilityBlock
          reverse
          title="Versions that stack"
          body={<p>Upload a new version onto its predecessor. The vault shows the version number, and the approval knows which version it is about.</p>}
          features={['APR-08']}
        />
        <CapabilityBlock
          title="The screening room"
          body={<p>Share a cut with somebody who has no account, through a link with a passcode, an expiry and a view limit. The link’s token is never stored, only its fingerprint. The studio sees how far each guest watched, as a bar.</p>}
          features={['CLI-08', 'APR-20', 'APR-18']}
          media="client-guest-links"
        />
        <CapabilityBlock
          reverse
          title="A watermark that names the viewer"
          body={<p>Every guest sees their own identity moving across the frame, aimed at the way cuts actually leak: a screen recorder. It is a session watermark, not forensic marking — and under reduced motion it stops moving but stays.</p>}
          features={['CLI-09']}
        />
        <CapabilityBlock
          title="The library"
          body={<p>Every asset across the studio, with facets and each production’s footprint.</p>}
          features={['FIL-07']}
          media="suite-library"
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/review', title: 'Review and approval', body: 'What a guest watched sits beside the decision it informed.' },
            { href: '/product/contracts', title: 'Contracts', body: 'A release is tied to the file it covers.' },
            { href: '/product/client', title: 'The client’s portal', body: 'Clients upload and download in the same vault.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> <Feature id="FIL-06">Objects left behind by an abandoned upload are cleaned up.</Feature></p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
