/**
 * Favicons. The owner, 2026-10-01: "use the white / gold logo for all dark
 * mode and dark / gold for all light mode" — so the tab icon follows the
 * browser's own light or dark mode.
 *   npx tsx scripts/make-favicons.ts <dark-gold-1024.png> <white-gold-1024.png> <app-dir>
 * Writes <app-dir>/icon.svg — both tiles embedded, switched by
 * prefers-color-scheme inside the SVG (Chrome, Edge and Firefox honour it; a
 * <link media> on PNG icons is not reliably honoured) — and favicon.ico
 * (16/32/48) plus apple-icon.png (180) from the white-gold tile, for the
 * browsers and home screens that cannot switch (Safari takes these). Removes
 * icon.png, so the SVG is the one icon browsers choose between modes.
 */
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

async function main() {
  const [lightModeTile, darkModeTile, out] = process.argv.slice(2)
  if (!lightModeTile || !darkModeTile || !out) throw new Error('usage: make-favicons.ts <dark-gold.png> <white-gold.png> <app-dir>')
  const b64 = async (src: string) => (await sharp(src).resize(64, 64, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer()).toString('base64')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>.d{display:none}@media (prefers-color-scheme:dark){.l{display:none}.d{display:inline}}</style><image class="l" width="64" height="64" href="data:image/png;base64,${await b64(lightModeTile)}"/><image class="d" width="64" height="64" href="data:image/png;base64,${await b64(darkModeTile)}"/></svg>`
  writeFileSync(join(out, 'icon.svg'), svg)
  const sizes = [16, 32, 48]
  const pngs = await Promise.all(sizes.map((s) => sharp(darkModeTile).resize(s, s, { kernel: 'lanczos3' }).png().toBuffer()))
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
  await sharp(darkModeTile).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile(join(out, 'apple-icon.png'))
  if (existsSync(join(out, 'icon.png'))) rmSync(join(out, 'icon.png'))
  console.log(`favicons written to ${out} (icon.svg ${(svg.length / 1024).toFixed(1)} KB)`)
}
main().catch((e) => { console.error(e); process.exit(1) })
