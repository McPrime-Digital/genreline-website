/**
 * THE SUITE — the whole making of a film, as stages. The owner's headline
 * argument (2026-10-01): every planned part is named, each labelled from
 * content/features.ts (Available or Coming), none hidden.
 */
export type SuiteStage = { id: string; name: string; line: string; ids: string[] }

export const SUITE_STAGES: readonly SuiteStage[] = [
  { id: 'write', name: 'Write', line: 'The screenplay, co-written live, in the format the industry reads.', ids: ['SWR-01', 'SWR-06', 'SWR-02', 'AGT-01', 'SWR-03', 'SWR-04', 'SWR-05', 'SWR-08'] },
  { id: 'visualise', name: 'Visualise', line: 'Boards, moodboards and shot lists — then frames and animatics generated from them.', ids: ['SWR-09', 'NEW-01', 'SWR-10', 'SWR-11', 'SWR-07'] },
  { id: 'stage', name: 'The Stage', line: 'Image and video generation inside the production — every major model, one gate, a budget and a record.', ids: ['STG-01', 'STG-02', 'STG-08', 'STG-09', 'STG-07', 'STG-05', 'STG-15'] },
  { id: 'hybrid', name: 'Hybrid', line: 'Live action and generated shots in one cut — with a signed release behind every face.', ids: ['NEW-02', 'STG-06', 'DOC-10', 'CLI-11'] },
  { id: 'automate', name: 'Workflows', line: 'Pipelines you compose once and run on every production — and agents that run them.', ids: ['SWR-12', 'AGT-03'] },
  { id: 'sound', name: 'Sound', line: 'Music, effects and dialogue — generated, designed and mixed.', ids: ['SND-01', 'SND-02', 'SND-03'] },
  { id: 'post', name: 'Edit and finish', line: 'Assemble the cut, hand it to the editor and back, then grade, caption and deliver.', ids: ['PST-01', 'PST-02', 'PST-04', 'PST-03'] },
  { id: 'adapt', name: 'Remaster and adapt', line: 'Restore what you shot, and turn one master into every version the world needs.', ids: ['STG-10', 'STG-11', 'STG-12', 'STG-13'] },
  { id: 'worlds', name: 'Worlds', line: 'Full 3D virtual sets — roamable, for a whole film.', ids: ['S3D-01', 'S3D-02', 'S3D-03'] },
  { id: 'keep', name: 'Keep', line: 'Every asset the studio holds, with its rights and where it came from.', ids: ['FIL-07'] },
]

/**
 * What each Suite tool DOES — built or coming, described in full (owner,
 * 2026-10-01: "a coming feature doesn't mean you don't talk about what it
 * does"). Coming tools are written as what they will do, never as shipped.
 */
export const SUITE_DETAIL: Record<string, { does: string; points: string[] }> = {
  'SWR-01': { does: 'A screenplay editor built for production, not just for the page.', points: ['Industry formatting and true pagination', 'Locked scenes and numbers that never shift', 'Tracked changes, comments and snapshots', 'The breakdown reads straight from it'] },
  'SWR-06': { does: 'Write together in real time, with everyone’s cursor on the page.', points: ['Live co-editing on the same draft', 'See who is where in the script', 'No more emailing versions'] },
  'SWR-02': { does: 'Every document a production writes, in one place.', points: ['Screenplay, treatment, bible, breakdown', 'One format system for all of them'] },
  'AGT-01': { does: 'An assistant that works inside the script and documents — priced before every call.', points: ['Draft, rewrite and summarise in place', 'A per-call ceiling asks before anything expensive', 'Counts against the person’s budget'] },
  'SWR-03': { does: 'Revision mode the way productions run it.', points: ['Coloured revision pages', 'Asterisks on changed lines', 'OMITTED scenes held in place'] },
  'SWR-04': { does: 'Bring Final Draft scripts in and send them out, intact.', points: ['FDX import with formatting preserved', 'FDX export for anyone still on Final Draft'] },
  'SWR-05': { does: 'Start from whatever the writer already has.', points: ['Fountain, PDF and Word import', 'Scenes and elements recognised on the way in'] },
  'SWR-08': { does: 'An assistant that learns one writer’s own voice — with their consent.', points: ['Trained on the writer’s own work only', 'Suggestions in their style, not a generic one'] },
  'SWR-09': { does: 'Storyboards tied to the script and the schedule.', points: ['Boards, shots and shot types', 'Prompts kept with every frame', 'Reorder by drag'] },
  'NEW-01': { does: 'Moodboards that live with the production, not in a separate app.', points: ['References, looks, palettes and lighting', 'Pinned to scenes and shots', 'Shared with the client in your brand'] },
  'SWR-10': { does: 'Shot lists that feed the schedule directly.', points: ['From the board to the shot list', 'Each shot ready for the Stage to generate'] },
  'SWR-11': { does: 'Generate the board itself — frames and animatics from the script.', points: ['Frames generated from each shot’s prompt', 'Animatics with timing from the script', 'Runs through the Stage’s budget and record'] },
  'SWR-07': { does: 'Live co-editing for boards and workflows too.', points: ['The whole team on one board at once', 'Cursors, not version files'] },
  'STG-01': { does: 'Image and video generation inside the production — every take a version, every result costed.', points: ['Text-to-image, image-to-video, text-to-video', 'Takes and versions kept like footage', 'Cost per result shown before and after', 'Output lands in the vault, filed to the production'] },
  'STG-02': { does: 'Every major model through one gate, chosen by what the shot needs.', points: ['One place instead of a subscription per model', 'Routing by capability — swap models without changing workflow', 'No lock-in to any single provider'] },
  'STG-08': { does: 'Model Arena — run the same prompt through several models and compare.', points: ['Side-by-side results', 'Cost and time for each', 'Pick the winner, keep the record'] },
  'STG-09': { does: 'Studio Kits — your studio’s looks, characters and presets, reusable on every job.', points: ['Save a look once, use it everywhere', 'Share kits across the team', 'Consistent output across productions'] },
  'STG-07': { does: 'Continuity — the same character, location, wardrobe and style across every shot.', points: ['Character and face consistency', 'Locations and wardrobe held between shots', 'A style that does not drift'] },
  'STG-05': { does: 'Provenance on every generated asset.', points: ['Which model made it, from what prompt and seed', 'C2PA-aligned records', 'A disclosure your client can rely on'] },
  'STG-15': { does: 'Turn generated imagery into 3D scenes.', points: ['From a frame to a scene you can move through', 'A bridge to virtual sets'] },
  'NEW-02': { does: 'Hybrid production — live action and generated shots in one cut, with rights on both.', points: ['Filmed and generated shots in the same production', 'Every likeness backed by a signed release', 'One record for what was filmed and what was made'] },
  'STG-06': { does: 'Rights on every asset, written by the signature that proves them.', points: ['Likeness, location and music rights per asset', 'AI-training permission stated, defaulting to not allowed'] },
  'DOC-10': { does: 'Releases that write the rights they prove.', points: ['Talent, AI-likeness, location and music releases', 'Signed on a phone through a single-use link'] },
  'CLI-11': { does: 'A clearance panel that tells the client what they must disclose.', points: ['Synthetic performers flagged', 'Disclosure obligations stated plainly'] },
  'SWR-12': { does: 'Workflows — generation pipelines and automations you compose once and run on every production.', points: ['Chain script, board, generation and delivery steps', 'Run on a schedule or a trigger', 'Every step inside the budget and the record'] },
  'AGT-03': { does: 'Agents that act as an executive producer or a director’s assistant.', points: ['Run workflows on your instruction', 'Report back on the record', 'Inside the same permissions as a person'] },
  'SND-01': { does: 'Music, effects and dialogue — generated for the scene.', points: ['Score and music beds', 'Sound effects', 'Dialogue and voice'] },
  'SND-02': { does: 'Sound design — spotting, ADR and the mix.', points: ['Spot the cut for sound', 'ADR sessions', 'Mix to delivery'] },
  'SND-03': { does: 'A licensed effects library inside the Suite.', points: ['Cleared effects ready to drop in', 'Licences recorded per use'] },
  'PST-01': { does: 'Edit — an assembly surface to build the cut from takes and generations.', points: ['Assemble scenes from footage and generated shots', 'Versions stacked and reviewable'] },
  'PST-02': { does: 'Hand the timeline to Resolve, Premiere or Final Cut — and bring it back.', points: ['Round-trip with professional editors', 'Notes and markers travel with it'] },
  'PST-04': { does: 'Finishing — colour, grade, delivery specifications and captions.', points: ['Grade and colour', 'Captions and subtitles', 'Deliver to spec for every platform'] },
  'PST-03': { does: 'A full editor with two-way live sync.', points: ['Edit in the browser or the NLE', 'Both stay in step'] },
  'STG-10': { does: 'Remaster — upscale and restore footage you already have.', points: ['Upscale to higher resolutions', 'Restore archive and damaged footage', 'Clean noise and artefacts'] },
  'STG-11': { does: 'Translate the film — with lip-sync that matches the new language.', points: ['Dubbed dialogue in other languages', 'Lips matched to the new audio'] },
  'STG-12': { does: 'Reframe any cut to any aspect ratio, at any length.', points: ['16:9, 9:16, 1:1, 4:5 from one master', 'Subject-aware reframing'] },
  'STG-13': { does: 'One master, every version — cutdowns, captions and localisations.', points: ['6, 15 and 30-second cutdowns', 'Captioned and localised variants', 'Delivered in the same production'] },
  'S3D-01': { does: 'Studio — full 3D virtual sets for your production.', points: ['Build or generate a set', 'Light and frame shots inside it'] },
  'S3D-02': { does: 'Roamable, interactive sets for a whole film.', points: ['Walk the set like a location scout', 'Block scenes before you shoot'] },
  'S3D-03': { does: 'Hire a film architect to build the set for you.', points: ['Commission a set from a specialist', 'Delivered into your production'] },
  'FIL-07': { does: 'One library for everything the studio holds.', points: ['Facets across every production', 'Each production’s footprint', 'Rights and provenance with each asset'] },
}
