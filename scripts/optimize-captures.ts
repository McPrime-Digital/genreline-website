/**
 * .capture/raw/<id>.<theme>.png (DPR 2) → public/captures/<id>.<theme>.<hash>.webp.
 *
 * THE FILENAME CARRIES A CONTENT HASH. A re-shot capture under the same name is
 * served stale by every cache between the file and the eye — Next's image
 * optimiser, the CDN, the browser — for hours (found 2026-10-01: the Ink
 * re-shoot rendered as the old navy until the cache was cleared). A new image
 * is a new address, so no cache can hold the old one. dimensions.json maps each
 * <id>.<theme> to its file and its real pixel size.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const RAW = '.capture/raw'
const OUT = 'public/captures'
mkdirSync(OUT, { recursive: true })
async function main() {
  const files = readdirSync(RAW).filter((f) => f.endsWith('.png'))
  const dims: Record<string, { w: number; h: number; file: string }> = {}
  for (const f of files) {
    const key = f.replace(/\.png$/, '')
    const { data, info } = await sharp(join(RAW, f)).webp({ quality: 80, effort: 6 }).toBuffer({ resolveWithObject: true })
    const hash = createHash('sha256').update(data).digest('hex').slice(0, 10)
    const name = `${key}.${hash}.webp`
    // Retire every earlier file for this capture — the unhashed name and old hashes.
    for (const old of readdirSync(OUT)) if (old !== name && (old === `${key}.webp` || (old.startsWith(`${key}.`) && /^[0-9a-f]{10}\.webp$/.test(old.slice(key.length + 1))))) rmSync(join(OUT, old))
    writeFileSync(join(OUT, name), data)
    dims[key] = { w: info.width, h: info.height, file: name }
    console.log(`${join(OUT, name)}  ${info.width}×${info.height}  ${(data.length / 1024).toFixed(0)} KB`)
  }
  // The real pixel size of every capture, so <Media> reserves exactly the right
  // box (no layout shift) whatever the crop was.
  writeFileSync(join(OUT, 'dimensions.json'), JSON.stringify(dims, null, 2) + '\n')
  console.log(`${files.length} captures optimised`)
}
main().catch((e) => { console.error(e); process.exit(1) })
