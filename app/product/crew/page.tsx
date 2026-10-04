import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { PeopleGrid } from '@/components/site/PeopleGrid'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/crew')

export default function Crew() {
  return (
    <>
      <PageHero motif="clapper"
        kicker="The Crew space"
        title="Where the studio works."
        lead="The Crew space is where the studio works: who is on the job, what they are doing, what they may see, and the breakdown that comes out of the script."
        media="crew-tasks"
      />
      <Section id="replaces" kicker="What it replaces" title="Instead of a dozen tools">
        <Replaces items={['A chat app for the crew', 'A task tracker', 'A crew list in a spreadsheet', 'Scheduling software', 'A spreadsheet of who may see what']} />
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
          title="From the script to the breakdown"
          body={<p>Scenes and elements are read from the screenplay the writer is in — characters, locations, props, looks — so every shot the Stage generates starts from the script, not from a retyped list.</p>}
          features={[{ id: 'CRW-07', text: 'Screenplay to scenes to breakdown' }]}
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
      <Section id="people" kicker="Who works here" title="Everyone in it, with exactly what they need">
        <PeopleGrid
          people={[
            { role: 'Producers and coordinators', sees: 'Every production their role covers — staffing, schedule, tasks and approvals', featureId: 'IDN-01' },
            { role: 'Editors, colourists, assistants', sees: 'Their tasks, rooms and the productions they are on', featureId: 'IDN-02' },
            { role: 'Collaborators', sees: 'Nothing until invited onto a production or a task — then exactly what the invitation says, for as long as it says', featureId: 'IDN-20' },
            { role: 'Finance', sees: 'Invoices and spend, because their role includes money', featureId: 'IDN-01' },
            { role: 'Every person', sees: 'One profile and one availability across every studio they work with — shared field by field, by them', featureId: 'IDN-21' },
            { role: 'Every change', sees: 'Written to the permission ledger — who granted what, when, until when', featureId: 'IDN-06' },
          ]}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/client', title: 'The Client space', body: 'Tasks and approvals reach the client’s team on the same board and the same record.' },
            { href: '/product/suite', title: 'The Suite', body: 'The breakdown reads the screenplay the writer is working in.' },
            { href: '/product/meetings', title: 'The calendar', body: 'Review deadlines and invoice dates land on the calendar — the studio’s and the client’s.' },
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
