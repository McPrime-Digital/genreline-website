/**
 * Favicons from one 1024 tile (owner, 2026-10-01: the white-gold mark).
 *   npx tsx scripts/make-favicons.ts <source.png> <app-dir>
 * Writes <app-dir>/favicon.ico (PNG-in-ICO: 16, 32, 48), icon.png (512,
 * alpha kept) and apple-icon.png (180, flattened on white — iOS fills
 * transparent corners with black and applies its own rounding).
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

async function main() {
  const [src, out] = process.argv.slice(2)
  if (!src || !out) throw new Error('usage: make-favicons.ts <source.png> <app-dir>')
  const sizes = [16, 32, 48]
  const pngs = await Promise.all(sizes.map((s) => sharp(src).resize(s, s, { kernel: 'lanczos3' }).png().toBuffer()))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4)
  const dir = Buffer.alloc(16 * sizes.length)
  let offset = 6 + dir.length
  sizes.forEach((s, i) => {
    const e = i * 16
    dir.writeUInt8(s, e); dir.writeUInt8(s, e + 1); dir.writeUInt8(0, e + 2); dir.writeUInt8(0, e + 3)
    dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6)
    dir.writeUInt32LE(pngs[i].length, e + 8); dir.writeUInt32LE(offset, e + 12)
    offset += pngs[i].length
  })
  writeFileSync(join(out, 'favicon.ico'), Buffer.concat([header, dir, ...pngs]))
  await sharp(src).resize(512, 512).png().toFile(join(out, 'icon.png'))
  await sharp(src).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile(join(out, 'apple-icon.png'))
  console.log(`favicons written to ${out}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
