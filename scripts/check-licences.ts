/**
 * Transitive licence scan of the PRODUCTION dependency tree. The app once
 * found a "commercial use is prohibited" licence riding in on an MIT package's
 * dependency (apca-w3 under apcach); an MIT badge on the top-level package
 * made it invisible. The only defence is reading the tree. Exits 1 on any
 * licence outside the allowlist, or any package with none declared.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

// Licences outside the allowlist that were READ and accepted for one package,
// with the reason. Anything not named here still fails the check.
const REVIEWED: Record<string, string> = {
  // Batch W-3D-1 names GSAP ScrollTrigger for the home hero's scroll. GSAP's
  // "Standard 'no charge' license" (https://gsap.com/standard-license, read
  // 2026-11-03) allows commercial use at no charge since 3.13; its one
  // restriction is building a no-code visual animation tool that competes with
  // Webflow, which a film production platform's website is not.
  gsap: "GSAP Standard 'no charge' license — reviewed for batch W-3D-1",
}

const ALLOW = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'OFL-1.1', 'CC0-1.0', 'Unlicense', 'BlueOak-1.0.0', 'MPL-2.0', 'Python-2.0', 'CC-BY-4.0'])

type Node = { version?: string; missing?: boolean; path?: string; license?: string; dependencies?: Record<string, Node> }
const tree: Node = JSON.parse(execFileSync('npm', ['ls', '--omit=dev', '--all', '--json', '--long'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
const seen = new Map<string, string>()
function walk(node: Node) {
  for (const [name, dep] of Object.entries(node.dependencies ?? {})) {
    // An uninstalled optional peer (npm ls lists it with no version and no
    // path) ships nothing and is not a licence in the tree.
    if (!dep.version || dep.missing) continue
    const key = `${name}@${dep.version}`
    if (!seen.has(key)) {
      let lic = dep.license
      if (!lic && dep.path && existsSync(join(dep.path, 'package.json'))) {
        const pj = JSON.parse(readFileSync(join(dep.path, 'package.json'), 'utf8'))
        lic = typeof pj.license === 'string' ? pj.license : pj.license?.type ?? (pj.licenses?.[0]?.type)
      }
      seen.set(key, String(lic ?? 'NONE'))
      walk(dep)
    }
  }
}
walk(tree)
let bad = 0
for (const [pkg, lic] of [...seen.entries()].sort()) {
  if (REVIEWED[pkg.slice(0, pkg.lastIndexOf('@'))]) continue
  const ok = lic.split(/\s+OR\s+|\s*\|\|\s*/i).map((s) => s.replace(/[()]/g, '').trim()).some((s) => ALLOW.has(s))
  if (!ok) { bad++; console.log(`REVIEW  ${pkg}  ${lic}`) }
}
console.log(`${seen.size} production packages scanned; ${bad} need review`)
process.exit(bad ? 1 : 0)
