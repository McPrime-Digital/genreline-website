import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/crew')

export default function Crew() {
  return (
    <>
      <PageHero
        title="Run the team and the production."
        lead="The Crew space is where the studio works: who is on the job, what they are doing, what they may see, and the schedule that comes out of the script."
        media="crew-tasks"
      />
      <Section id="replaces" title="What it replaces" width="wide">
        <Replaces items={['A chat app for the crew', 'A task tracker', 'A crew list in a spreadsheet', 'Call sheet templates', 'Scheduling software', 'A spreadsheet of who may see what']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="A directory that is a production database"
          body={<p>Every person on the roster carries the facts a producer staffs from — department, skills, day rate, union, equipment, availability and location. Invites show whether they were sent, opened, or have expired.</p>}
          features={['CRW-02', 'IDN-13', 'IDN-19']}
          media="crew-directory"
        />
        <CapabilityBlock
          reverse
          title="Tasks that belong to the production"
          body={<p>Assign a task to anybody on either roster — your crew or the client’s team — with comments, labels, subtasks, relations, watchers and search. One board serves the Crew space, the studio’s project page and the client’s portal.</p>}
          features={['CRW-04', 'MSG-09']}
          media="crew-tasks"
        />
        <CapabilityBlock
          title="Internal rooms"
          body={<p>Channels, groups and direct messages for the crew, with threads, drafts that follow you between devices, an edit history on every message, and a call button in every room header. A client never sees an internal room.</p>}
          features={['MSG-02', 'MSG-03', 'MSG-15', 'MSG-27', 'MSG-21']}
          media="crew-chat"
        />
        <CapabilityBlock
          reverse
          title="Internal approvals"
          body={<p>The same approval engine the studio uses with clients, for sign-offs inside the studio — stages, review windows and a certificate.</p>}
          features={['CRW-05', 'APR-02']}
        />
        <CapabilityBlock
          title="From the script to the shoot day"
          body={<p>Scenes come from the screenplay the writer is in. Breakdown, stripboard and shoot days follow, and a call sheet goes out sealed and numbered in the studio’s voice.</p>}
          features={['CRW-07', 'CRW-08', 'CRW-06']}
          media="crew-production"
        />
        <CapabilityBlock
          reverse
          title="Permissions that say exactly who sees what"
          body={<p>Company roles, project roles, staff and contractor seats, and individual grants and denials with expiry. A contractor sees nothing until assigned. A denial always beats a grant, and every change is written to the permission ledger.</p>}
          features={['IDN-01', 'IDN-02', 'IDN-03', 'IDN-04', 'IDN-08', 'IDN-06']}
        />
        <CapabilityBlock
          title="A budget for every person"
          body={<p>Set an AI spend limit per person or per seat class, by day, week or month. The person it governs can see it — a refused call is explained, never mysterious.</p>}
          features={['MON-06', 'MON-05']}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/client', title: 'The Client space', body: 'Tasks and approvals reach the client’s team on the same board and the same record.' },
            { href: '/product/suite', title: 'The Suite', body: 'The breakdown reads the screenplay the writer is working in.' },
            { href: '/product/meetings', title: 'The calendar', body: 'Shoot days land on the calendar — the studio’s and the client’s.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> <Feature id="IDN-05">Delegation limits are database rules too: nobody can grant a permission they do not hold.</Feature></p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
