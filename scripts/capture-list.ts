/** Writes the capture slots (content/media.ts) as JSON for the app repo's
 *  capture script, which holds the credentials this repo must never hold. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { MEDIA } from '../content/media'
mkdirSync('.capture', { recursive: true })
const slots = MEDIA.filter((m) => m.kind === 'capture')
writeFileSync('.capture/slots.json', JSON.stringify(slots, null, 2))
console.log(`${slots.length} capture slots → .capture/slots.json`)
