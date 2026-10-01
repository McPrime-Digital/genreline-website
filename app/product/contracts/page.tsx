import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/contracts')

export default function Contracts() {
  return (
    <>
      <PageHero
        kicker="Contracts and signing"
        title="Contracts that hold up — and prove themselves."
        lead="Templates, fields placed on the PDF, consent before signature, a cryptographic seal, and a certificate of completion sealed inside the file — so the file proves itself to anybody who holds it."
        media="client-contracts"
      />
      <Section id="replaces" kicker="What it replaces" title="Instead of a dozen tools">
        <Replaces items={['An e-signature tool', 'Release forms on paper', 'A rights spreadsheet', 'A folder of signed PDFs nobody can find']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Templates that say what they could not fill"
          body={<p>Start from a template with merge fields for the client, the project and the studio. A field that cannot be filled is reported, never left blank. Or start from a PDF already in the vault.</p>}
          features={['DOC-01', 'DOC-03']}
        />
        <CapabilityBlock
          reverse
          title="Fields on the page"
          body={<p>Drag fields onto the PDF — all five kinds. Positions are fractions of the page, so a field sits in the same place on a phone and on paper. Once a contract is sent, its fields are frozen.</p>}
          features={['DOC-02']}
        />
        <CapabilityBlock
          title="Consent, then signature"
          body={<p>A signer consents to sign electronically before they can sign, and the exact wording they consented to is kept with the record. Signers sign in order, can decline, and a contract can be voided. Somebody with no account signs through a single-use link.</p>}
          features={['DOC-04', 'DOC-07', 'DOC-09']}
        />
        <CapabilityBlock
          reverse
          title="Sealed, with the evidence inside"
          body={<p>When the last signature lands, the PDF is sealed with a cryptographic signature and the certificate of completion is rendered into it first — the seal covers the evidence as well as the agreement. Without a certificate configured, the file says it is unsealed rather than pretending. It carries your studio’s brand.</p>}
          features={['DOC-05', 'DOC-06', 'CLI-05']}
        />
        <CapabilityBlock
          title="A signed release writes the rights it proves"
          body={<p>A talent, AI-likeness, location or music release is tied to the asset it covers. When the last signer signs, the asset’s rights are written by the signature — including whether a likeness may be used to train a model, which defaults to not allowed. The client sees the clearance and what must be disclosed.</p>}
          features={['DOC-10', 'STG-06', 'CLI-11']}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/client', title: 'The client’s portal', body: 'Clients read, consent and sign in the portal, in your brand.' },
            { href: '/product/files', title: 'The vault', body: 'Signed contracts are stored with the rest of the production.' },
            { href: '/ai', title: 'AI and provenance', body: 'Rights per asset are what generation will check before it uses a likeness.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="DOC-09">A signing link works once, and the token behind it is never stored — only its fingerprint.</Feature> <Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> Among those checks: a client owner cannot sign for a colleague.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
