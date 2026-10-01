/**
 * THE TOOLS GENRELINE REPLACES — the second argument (owner, 2026-10-01).
 * Named by job, with examples of what studios use today (names in text,
 * never logos). Each is tied to the feature that replaces it, so its status
 * — replaced today, or being built — comes from content/features.ts.
 */
export type ReplacedTool = { job: string; today: string; featureId: string }
export type ToolGroup = { space: string; line: string; tools: ReplacedTool[] }

export const TOOL_GROUPS: readonly ToolGroup[] = [
  {
    space: 'Crew',
    line: 'Running the team and the production',
    tools: [
      { job: 'Team chat', today: 'Slack, Microsoft Teams, WhatsApp groups', featureId: 'MSG-02' },
      { job: 'Tasks and assignments', today: 'Asana, Monday, Trello', featureId: 'CRW-04' },
      { job: 'Crew lists and rates', today: 'Spreadsheets, Airtable', featureId: 'CRW-02' },
      { job: 'Script breakdown', today: 'Movie Magic, StudioBinder, spreadsheets', featureId: 'CRW-07' },
      { job: 'Shared calendars', today: 'Google Calendar, Outlook', featureId: 'MTG-02' },
      { job: 'Video calls', today: 'Zoom, Google Meet', featureId: 'MTG-01' },
      { job: 'Who-can-see-what', today: 'Spreadsheets, IT tickets', featureId: 'IDN-04' },
      { job: 'AI spend control', today: 'Shared logins on a company card', featureId: 'MON-06' },
    ],
  },
  {
    space: 'Client and portal',
    line: 'Running client work, in your brand',
    tools: [
      { job: 'Client conversation', today: 'Email threads, WhatsApp', featureId: 'MSG-01' },
      { job: 'Review and approval', today: 'Frame.io, Vimeo Review, Ziflow', featureId: 'APR-14' },
      { job: 'Live review sessions', today: 'cineSync, Evercast, screen-sharing', featureId: 'APR-15' },
      { job: 'Screening links', today: 'Private video links', featureId: 'CLI-08' },
      { job: 'Large file transfer', today: 'WeTransfer, Dropbox, Google Drive', featureId: 'FIL-03' },
      { job: 'E-signature', today: 'DocuSign, PandaDoc', featureId: 'DOC-05' },
      { job: 'Talent and location releases', today: 'Paper and PDF release forms', featureId: 'DOC-10' },
      { job: 'Booking', today: 'Calendly', featureId: 'MTG-04' },
      { job: 'Invoicing', today: 'Accounting-tool invoices, Word templates', featureId: 'MON-01' },
      { job: 'A client portal', today: 'A portal in someone else’s brand', featureId: 'FND-09' },
    ],
  },
  {
    space: 'The Suite',
    line: 'Making the work',
    tools: [
      { job: 'Screenwriting', today: 'Final Draft, WriterDuet, Celtx', featureId: 'SWR-01' },
      { job: 'Storyboards', today: 'Boords, StudioBinder boards', featureId: 'SWR-09' },
      { job: 'Moodboards', today: 'Milanote, Pinterest boards', featureId: 'NEW-01' },
      { job: 'Asset library', today: 'Shared drives and folders', featureId: 'FIL-07' },
      { job: 'Image generation', today: 'Midjourney, Firefly', featureId: 'STG-01' },
      { job: 'Video generation', today: 'Runway, Kling, Luma, Pika', featureId: 'STG-01' },
      { job: 'Comparing models', today: 'A tab and a subscription for each', featureId: 'STG-08' },
      { job: 'Upscale and restore', today: 'Standalone upscalers', featureId: 'STG-10' },
      { job: 'Dubbing and lip-sync', today: 'Standalone dubbing tools', featureId: 'STG-11' },
      { job: 'Resizing and cutdowns', today: 'Manual re-exports', featureId: 'STG-13' },
      { job: 'Music and sound', today: 'Stock libraries, music generators', featureId: 'SND-01' },
      { job: 'Assembly and finishing', today: 'Separate edit, grade and caption tools', featureId: 'PST-04' },
      { job: 'Pipelines', today: 'Zapier, scripts, spreadsheets', featureId: 'SWR-12' },
    ],
  },
]
