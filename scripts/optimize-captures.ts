/** .capture/raw/<id>.<theme>.png (DPR 2) → public/captures/<id>.<theme>.webp. */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const RAW = '.capture/raw'
const OUT = 'public/captures'
mkdirSync(OUT, { recursive: true })
async function main() {
const files = readdirSync(RAW).filter((f) => f.endsWith('.png'))
const dims: Record<string, { w: number; h: number }> = {}
for (const f of files) {
  const out = join(OUT, f.replace(/\.png$/, '.webp'))
  const info = await sharp(join(RAW, f)).webp({ quality: 80, effort: 6 }).toFile(out)
  dims[f.replace(/\.png$/, '')] = { w: info.width, h: info.height }
  console.log(`${out}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
}
// The real pixel size of every capture, so <Media> reserves exactly the right
// box (no layout shift) whatever the crop was.
writeFileSync(join(OUT, 'dimensions.json'), JSON.stringify(dims, null, 2) + '\n')
console.log(`${files.length} captures optimised`)
}
main().catch((e) => { console.error(e); process.exit(1) })
