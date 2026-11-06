/**
 * THE PHENOMENA — the universe behind the logo is never the same (the owner, 2026-11-06: "the outerspace
 * background … seem to have just one design and one way which is very disappointing … proper outerspace
 * universe thing not just dusty aurora or huge galaxies"). Fourteen real things of deep space, each its own
 * small program (PHENOM, chosen when it is built — the Windows rule: no program carries the others), each
 * evolving slowly while it holds (uAge, uLife), drawn in a film stock's palette, somewhere new each time.
 *
 * And the ways one gives way to the next (uStyle, ten of them — film's own transitions among them): push
 * in, pull out, whip pan, spin, iris, star dissolve, light leak, anamorphic wipe, fade through black,
 * hyperspace. Each sky is drawn by the slot showing it, leaving (uRole +1) or arriving (−1), uK of the way.
 *
 * Light is authored in display space and added (no colour-space conversion): a phenomenon returns the
 * light it adds to the night.
 */

/** The phenomena, in the order of PHENOM. */
export const PHENOMENA = [
  'milky', 'blackhole', 'ring', 'pillars', 'remnant', 'comet', 'eclipse', 'pulsar', 'cluster', 'binary', 'deepfield', 'quasar', 'meteors', 'lens',
] as const
export type PhenomenonKind = number

/** The changes, in the order of uStyle. */
export const CHANGES = ['push', 'pull', 'whip', 'spin', 'iris', 'dissolve', 'leak', 'wipe', 'black', 'hyperspace'] as const

/**
 * Per phenomenon: its size range (in the sky's heights), whether it fills the field (centred where the
 * camera looks) or stands somewhere in it, and a dark disc the stars must hide behind (its radius, in its
 * own units).
 */
export const PHENOMENON_LOOK: readonly { scale: [number, number]; field: boolean; dark: number }[] = [
  { scale: [0.24, 0.32], field: true, dark: 0 }, // milky
  { scale: [0.075, 0.105], field: false, dark: 0.32 }, // blackhole
  { scale: [0.07, 0.1], field: false, dark: 0 }, // ring
  { scale: [0.15, 0.2], field: false, dark: 0 }, // pillars
  { scale: [0.09, 0.12], field: false, dark: 0 }, // remnant
  { scale: [0.16, 0.22], field: false, dark: 0 }, // comet
  { scale: [0.06, 0.085], field: false, dark: 0.3 }, // eclipse
  { scale: [0.08, 0.11], field: false, dark: 0 }, // pulsar
  { scale: [0.07, 0.095], field: false, dark: 0 }, // cluster
  { scale: [0.09, 0.12], field: false, dark: 0 }, // binary
  { scale: [0.2, 0.26], field: true, dark: 0 }, // deepfield
  { scale: [0.09, 0.12], field: false, dark: 0 }, // quasar
  { scale: [0.22, 0.28], field: true, dark: 0 }, // meteors
  { scale: [0.075, 0.1], field: false, dark: 0 }, // lens
]

export const PHENOM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const PHENOM_FRAG = /* glsl */ `
  uniform vec2 uGaze;
  uniform vec2 uCenter;
  uniform float uScale;
  uniform float uRot;
  uniform float uAspect;
  uniform vec3 uPal0;
  uniform vec3 uPal1;
  uniform vec3 uPal2;
  uniform float uSeed;
  uniform float uAge;
  uniform float uLife;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uK;
  uniform float uStyle;
  uniform float uRole;
  uniform vec2 uDir;
  uniform vec2 uHalf;
  varying vec2 vUv;
  const float PI = 3.14159265;
  float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float h2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  float vn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    #ifdef LOW
    for (int i = 0; i < 3; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
    #else
    for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
    #endif
    return s;
  }
  mat2 rot2(float a) { float c = cos(a); float s = sin(a); return mat2(c, s, -s, c); }
  // noise round a circle (no seam where the angle wraps)
  float ringNoise(float a, float f) { return vn(vec2(cos(a), sin(a)) * f + uSeed); }

  #if PHENOM == 0
  // THE MILKY WAY: a band of countless stars across the sky, its core warmer, lanes of dust through it
  vec3 phenom(vec2 p) {
    float drift = uAge * 0.006;
    float across = p.y + (fbm(vec2(p.x * 0.5 + uSeed, 1.7)) - 0.5) * 0.6;
    float band = exp(-pow(across / 0.6, 2.0));
    float core = exp(-pow(across / 0.22, 2.0));
    float clouds = fbm(vec2(p.x * 1.4 + drift, across * 3.2) + uSeed);
    float lanes = smoothstep(0.5, 0.72, fbm(vec2(p.x * 2.4 + drift, across * 6.5) + uSeed * 1.3 + 8.0)) * core;
    float grain = 0.5 + 0.5 * h2(floor(gl_FragCoord.xy / 1.5));
    float pin = step(0.996, h2(floor(gl_FragCoord.xy))) * band;
    float light = band * smoothstep(0.32, 0.78, clouds) * (1.0 - lanes * 0.9) * grain * smoothstep(5.5, 2.0, abs(p.x));
    vec3 c = mix(uPal1, uPal0, clamp(core * 1.4, 0.0, 1.0));
    return c * light * 0.42 + vec3(0.9, 0.92, 1.0) * pin * 0.5;
  }
  #elif PHENOM == 1
  // A BLACK HOLE: its shadow, the photon ring, the accretion disk nearly edge-on — brighter where it turns
  // toward us — and the far side of the disk lensed into a halo over and under the hole
  vec3 phenom(vec2 p) {
    float r = length(p);
    float rh = 0.32;
    vec2 dp = vec2(p.x, p.y / 0.2);
    float dr = length(dp);
    float ang = atan(dp.y, dp.x);
    float swirl = fbm(vec2(ang * 2.5 - uAge * 0.22 + dr * 3.5, dr * 5.0) + uSeed);
    float disk = smoothstep(0.42, 0.52, dr) * smoothstep(1.45, 0.7, dr) * (0.4 + 0.8 * swirl);
    float doppler = 1.0 + 0.65 * clamp(-p.x / max(dr * 0.6, 0.12), -1.0, 1.0);
    // the near half passes in front of the hole; the far half is hidden behind it
    disk *= clamp(step(p.y, 0.0) + step(rh, r), 0.0, 1.0) * doppler;
    float halo = exp(-pow((r - 0.43) / 0.045, 2.0)) * (0.55 + 0.45 * swirl) * (1.0 - 0.55 * abs(p.x / max(r, 0.01)));
    float photon = exp(-pow((r - rh - 0.012) / 0.007, 2.0));
    float shadow = smoothstep(rh + 0.008, rh - 0.008, r);
    vec3 hot = vec3(1.0, 0.86, 0.62);
    vec3 c = mix(uPal0 * 0.5 + hot * 0.5, vec3(1.0, 0.96, 0.88), clamp(disk * 0.5, 0.0, 1.0));
    float breathe = 0.85 + 0.15 * sin(uAge * 0.25);
    return (c * disk * 0.75 * breathe + hot * halo * 0.6 + vec3(1.0, 0.95, 0.85) * photon * 0.9) * (1.0 - shadow);
  }
  #elif PHENOM == 2
  // A RING NEBULA: a dying star's shell, teal inside, red at its rim, filaments torn into it, the white
  // dwarf at its heart — slowly expanding as it holds
  vec3 phenom(vec2 p) {
    p.y *= 1.25;
    float r = length(p);
    float a = atan(p.y, p.x);
    float R = 0.6 + 0.06 * uLife;
    float n = fbm(vec2(a * 1.6, r * 4.0) + uSeed + uAge * 0.008);
    float shell = exp(-pow((r - R) / (0.15 + 0.05 * n), 2.0)) * (0.55 + 0.6 * n);
    float inner = smoothstep(R, 0.05, r) * 0.3;
    float fil = smoothstep(0.55, 0.85, fbm(vec2(a * 5.0, r * 12.0) + uSeed * 2.0)) * smoothstep(R + 0.32, R, r) * smoothstep(R - 0.14, R, r);
    float star = exp(-r * r / 0.0007) * 1.6;
    vec3 c = mix(uPal1, uPal0, smoothstep(R - 0.12, R + 0.14, r));
    return c * (shell * 0.5 + inner * 0.45 + fil * 0.5) + vec3(1.0, 0.97, 0.92) * star;
  }
  #elif PHENOM == 3
  // THE PILLARS OF A STAR NURSERY: a cloud of glowing gas, and dark columns of dust rising into it from
  // below, only their tips lit by the young stars beyond
  vec3 phenom(vec2 p) {
    float gas = fbm(p * 1.2 + uSeed + vec2(uAge * 0.005, 0.0));
    float wisps = fbm(p * 2.6 - uSeed + vec2(0.0, uAge * 0.004));
    float cloud = smoothstep(1.7, 0.1, length((p - vec2(0.0, 0.25)) * vec2(0.6, 0.9))) * (0.35 + 0.8 * gas);
    float dark = 0.0;
    float lit = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float x0 = (fi - 1.0) * 0.5 + (h1(uSeed + fi) - 0.5) * 0.2;
      float top = 0.05 + 0.55 * h1(uSeed + fi * 7.0);
      // wide at the foot, narrowing to a rounded tip
      float k = smoothstep(-1.1, top, p.y);
      float w = mix(0.2, 0.07, k) * (0.85 + 0.3 * h1(uSeed + fi * 3.0));
      float edge = abs(p.x - x0 - 0.03 * sin(p.y * 3.0 + fi * 2.0)) - w * (0.85 + 0.3 * vn(p * 7.0 + fi * 9.0));
      float below = smoothstep(top + 0.04, top - 0.06, p.y + 0.04 * vn(vec2(p.x * 9.0, fi)));
      float col = smoothstep(0.015, -0.02, edge) * below * smoothstep(-1.4, -0.9, p.y);
      dark = max(dark, col);
      lit = max(lit, exp(-pow((p.y - top) / 0.05, 2.0)) * smoothstep(0.03, -0.04, edge));
    }
    vec3 gasC = mix(uPal1, uPal0, smoothstep(0.3, 0.75, gas)) * (0.75 + 0.5 * wisps);
    return gasC * cloud * 0.42 * (1.0 - dark * 0.95) + uPal2 * lit * 0.5 * (0.75 + 0.25 * sin(uAge * 0.4));
  }
  #elif PHENOM == 4
  // A SUPERNOVA REMNANT: a shell of torn filaments flying out from a pulsing core, inside a blue haze
  vec3 phenom(vec2 p) {
    p.x *= 0.85;
    float r = length(p);
    float g = 1.0 + 0.07 * uLife;
    float shell = smoothstep(1.0 * g, 0.72 * g, r);
    float ridged = 1.0 - abs(fbm(p * 3.0 / g + uSeed) * 2.0 - 1.0);
    float fil = pow(ridged, 3.5) * shell * (0.6 + 0.4 * vn(p * 2.0 + uSeed));
    float haze = smoothstep(0.95 * g, 0.0, r) * 0.42;
    float pulse = exp(-r * r / 0.0005) * (0.55 + 0.45 * step(0.5, fract(uTime * 2.6)));
    vec3 c = mix(uPal1, uPal0, clamp(fil * 1.4, 0.0, 1.0));
    return c * (fil * 0.5 + haze * 0.55) + vec3(0.85, 0.9, 1.0) * pulse;
  }
  #elif PHENOM == 5
  // A COMET: its head drifting along its path while it holds, a straight blue ion tail and a curved, wider
  // dust tail streaming away from the sun
  vec3 phenom(vec2 p) {
    vec2 head = vec2(mix(-0.75, 0.75, uLife), mix(0.22, -0.12, uLife));
    vec2 d = p - head;
    vec2 away = normalize(vec2(-0.86, 0.5));
    float along = dot(d, away);
    float across = dot(d, vec2(-away.y, away.x));
    float coma = exp(-dot(d, d) / 0.0016) * 1.5 + exp(-length(d) * 10.0) * 0.4;
    float ion = step(0.0, along) * exp(-pow(across / (0.008 + along * 0.025), 2.0)) * exp(-along * 1.2) * (0.75 + 0.25 * vn(vec2(along * 14.0 - uAge * 0.8, 3.0)));
    float curve = across - along * along * 0.3;
    float dust = step(0.0, along) * exp(-pow(curve / (0.02 + along * 0.11), 2.0)) * exp(-along * 0.95) * (0.65 + 0.35 * vn(vec2(along * 7.0 - uAge * 0.25, across * 18.0)));
    return vec3(0.55, 0.78, 1.0) * ion * 0.95 + mix(uPal0, vec3(1.0, 0.9, 0.7), 0.5) * dust * 0.85 + vec3(0.95, 1.0, 0.95) * coma;
  }
  #elif PHENOM == 6
  // A SOLAR ECLIPSE: the moon's dark disc, the pearl corona streaming out round it, a thin red rim of
  // chromosphere — and, near the end of its hold, the diamond ring as the sun's edge breaks through
  vec3 phenom(vec2 p) {
    float r = length(p);
    float R = 0.3;
    float a = atan(p.y, p.x);
    float streams = 0.45 + 0.55 * pow(ringNoise(a, 2.2), 2.0) + 0.3 * pow(ringNoise(a, 7.0), 3.0);
    float corona = exp(-(r - R) * 3.0) * step(R, r) * streams * (0.92 + 0.08 * sin(uAge * 0.45));
    float chromo = exp(-pow((r - R) / 0.007, 2.0));
    float ba = 0.8 + uSeed * 0.3;
    vec2 bp = R * vec2(cos(ba), sin(ba));
    float ring = smoothstep(0.78, 0.92, uLife) * (1.0 - smoothstep(0.97, 1.0, uLife));
    float bead = (exp(-dot(p - bp, p - bp) / 0.0004) * 2.5 + exp(-length(p - bp) * 14.0) * 0.6) * ring;
    float disc = smoothstep(R - 0.004, R + 0.004, r);
    return (vec3(0.92, 0.95, 1.0) * corona * 0.6 + vec3(1.0, 0.32, 0.28) * chromo * 0.6) * disc + vec3(1.0, 0.98, 0.94) * bead;
  }
  #elif PHENOM == 7
  // A PULSAR: a neutron star, its two beams sweeping like a lighthouse's, flashing as they cross us, in
  // the nebula it lights
  vec3 phenom(vec2 p) {
    float r = length(p);
    float spin = uTime * 1.9 + uSeed;
    vec2 ax = normalize(vec2(cos(spin), sin(spin) * 0.32));
    float along = dot(p, ax);
    float across = abs(dot(p, vec2(-ax.y, ax.x)));
    float beam = exp(-pow(across / (0.012 + abs(along) * 0.11), 2.0)) * exp(-abs(along) * 1.4);
    float flash = pow(max(0.0, cos(spin)), 24.0);
    float core = exp(-r * r / 0.0006) * (1.4 + 1.6 * flash) + exp(-r * 7.0) * 0.25;
    float neb = fbm(p * 2.4 + uSeed) * exp(-r * 1.7) * 0.4;
    return uPal1 * neb + vec3(0.7, 0.86, 1.0) * beam * 0.55 + vec3(1.0) * core;
  }
  #elif PHENOM == 8
  // A GLOBULAR CLUSTER: a hundred thousand old stars in a ball, thickest at the core, twinkling
  vec3 phenom(vec2 p) {
    p = rot2(uAge * 0.004) * p;
    float r = length(p);
    float dens = exp(-r * r / 0.22);
    vec3 L = vec3(0.0);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float sc = 34.0 + fi * 30.0;
      vec2 g = p * sc;
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float h = h2(id + fi * 17.0 + uSeed);
      float on = step(1.0 - dens * (0.6 - fi * 0.12), h);
      vec2 o = (vec2(h2(id + 3.1), h2(id + 7.7)) - 0.5) * 0.55;
      float star = exp(-dot(f - o, f - o) * 70.0) * on;
      float tw = 0.7 + 0.3 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
      L += mix(vec3(1.0, 0.86, 0.62), vec3(0.78, 0.86, 1.0), fract(h * 13.0)) * star * tw;
    }
    return L * 0.9 + mix(uPal0, vec3(1.0, 0.9, 0.75), 0.6) * dens * 0.1;
  }
  #elif PHENOM == 9
  // A BINARY: a red giant spilling its gas in a stream that curls onto a disk round its small, hot companion
  vec3 phenom(vec2 p) {
    float ang = uAge * 0.06 + uSeed;
    vec2 giant = vec2(cos(ang), sin(ang) * 0.4) * 0.42;
    vec2 dwarf = -giant * 0.62;
    float rg = length(p - giant);
    float giantL = smoothstep(0.23, 0.19, rg) * (0.55 + 0.45 * vn((p - giant) * 9.0 + uAge * 0.1)) + exp(-rg * 5.0) * 0.35;
    vec2 dd = p - dwarf;
    float rd = length(dd);
    float disk = exp(-pow((rd - 0.11) / 0.05, 2.0)) * (0.6 + 0.4 * sin(atan(dd.y, dd.x) * 3.0 - uAge * 2.2));
    vec2 ab = dwarf - giant;
    float tt = clamp(dot(p - giant, ab) / dot(ab, ab), 0.0, 1.0);
    vec2 on = giant + ab * tt + vec2(-ab.y, ab.x) * sin(tt * PI) * 0.22;
    float stream = exp(-dot(p - on, p - on) / 0.0012) * smoothstep(0.1, 0.3, tt) * smoothstep(1.0, 0.8, tt);
    float dwarfL = exp(-rd * rd / 0.0004) * 1.8;
    vec3 giantC = mix(uPal0, vec3(1.0, 0.55, 0.35), 0.5);
    return giantC * giantL * 0.7 + mix(giantC, vec3(0.7, 0.86, 1.0), tt) * stream * 0.7 + vec3(0.75, 0.87, 1.0) * (disk * 0.55 + dwarfL);
  }
  #elif PHENOM == 10
  // A DEEP FIELD: thousands of far galaxies, faint, of every shape and colour — the oldest light there is
  vec3 phenom(vec2 p) {
    p += vec2(uAge * 0.003, 0.0);
    vec3 L = vec3(0.0);
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float sc = 8.0 + fi * 7.0;
      vec2 g = p * sc + fi * 13.1 + uSeed;
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float h = h2(id);
      if (h < 0.5) continue;
      vec2 o = (vec2(h2(id + 1.3), h2(id + 4.7)) - 0.5) * 0.5;
      vec2 q = rot2(h * 6.28) * (f - o);
      q.y /= 0.3 + 0.7 * fract(h * 7.0);
      float gal = exp(-dot(q, q) * (110.0 + 140.0 * fract(h * 3.0)));
      vec3 c = mix(vec3(1.0, 0.8, 0.55), vec3(0.6, 0.75, 1.0), fract(h * 11.0));
      L += c * gal * (0.2 + 0.35 * fract(h * 5.0));
    }
    return L * smoothstep(2.6, 0.8, length(p));
  }
  #elif PHENOM == 11
  // A QUASAR: a blazing core in its faint host galaxy, twin jets thrown out across space, knots of light
  // travelling along them
  vec3 phenom(vec2 p) {
    float r = length(p);
    vec2 ax = normalize(vec2(1.0, 0.35));
    float along = dot(p, ax);
    float across = dot(p, vec2(-ax.y, ax.x));
    float jet = exp(-pow(across / (0.008 + abs(along) * 0.035), 2.0)) * exp(-abs(along) * 0.8) * smoothstep(0.02, 0.06, abs(along));
    float knots = 0.0;
    for (int i = 0; i < 4; i++) {
      float kp = fract(uAge * 0.025 + float(i) * 0.25) * 1.4;
      knots += exp(-pow((abs(along) - kp) / 0.03, 2.0));
    }
    vec2 hp = rot2(0.35) * p;
    float host = exp(-dot(hp * vec2(1.0, 1.9), hp * vec2(1.0, 1.9)) / 0.07) * 0.22;
    float core = exp(-r * r / 0.0005) * 2.0 + exp(-r * 9.0) * 0.35;
    return vec3(0.6, 0.76, 1.0) * jet * (0.45 + knots * 0.55) + mix(uPal0, vec3(1.0, 0.9, 0.75), 0.5) * host + vec3(1.0, 0.95, 0.9) * core;
  }
  #elif PHENOM == 12
  // A METEOR STORM: meteors streaking out from one point of the sky, thickening to a peak and thinning
  vec3 phenom(vec2 p) {
    vec3 L = vec3(0.0);
    float storm = sin(PI * clamp(uLife, 0.0, 1.0));
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float period = 2.0 + h1(fi + uSeed) * 3.0;
      float tt = uAge + h1(fi * 3.1 + uSeed) * period;
      float cyc = floor(tt / period);
      float k = (tt - cyc * period) / 0.85;
      if (k > 1.0) continue;
      float ang = h1(fi * 7.0 + cyc * 1.3 + uSeed) * 6.2832;
      vec2 dir = vec2(cos(ang), sin(ang));
      float start = 0.2 + h1(fi + cyc * 2.7) * 0.6;
      vec2 head = dir * (start + k * 0.5);
      vec2 d = p - head;
      float along = dot(d, -dir);
      float across = dot(d, vec2(-dir.y, dir.x));
      float tail = step(0.0, along) * step(along, 0.28) * exp(-along / 0.1) * exp(-pow(across / 0.0035, 2.0));
      float headL = exp(-dot(d, d) / 0.00004);
      float fade = sin(k * PI) * step(h1(fi * 5.0 + cyc), 0.3 + 0.65 * storm);
      L += vec3(1.0, 0.93, 0.78) * (tail + headL * 1.6) * fade;
    }
    return L + uPal1 * exp(-length(p) * 1.5) * 0.05;
  }
  #else
  // AN EINSTEIN RING: a galaxy far behind a massive one, its light bent into a ring and arcs round it, the
  // cluster's galaxies gathered close
  vec3 phenom(vec2 p) {
    float r = length(p);
    float a = atan(p.y, p.x);
    float ring = exp(-pow((r - 0.42) / 0.018, 2.0)) * (0.45 + 0.55 * pow(ringNoise(a, 3.0), 2.0));
    float arcs = exp(-pow((r - 0.6) / 0.014, 2.0)) * smoothstep(0.35, 0.0, abs(sin(a * 1.5 + uSeed)));
    vec2 lp = p * vec2(1.0, 1.4);
    float lensGal = exp(-dot(lp, lp) / 0.018) * 0.8 + exp(-r * 5.0) * 0.12;
    float members = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      vec2 c = (vec2(h1(fi + uSeed), h1(fi * 3.7 + uSeed)) - 0.5) * 1.8;
      members += exp(-dot(p - c, p - c) / 0.003);
    }
    float shimmer = 0.85 + 0.15 * sin(uAge * 0.5 + a * 2.0);
    return vec3(0.55, 0.72, 1.0) * (ring * 0.85 + arcs * 0.55) * shimmer + vec3(1.0, 0.85, 0.6) * (lensGal + members * 0.5);
  }
  #endif

  void main() {
    // how far this sky is from being fully present: 0 present, 1 gone (leaving with uK, arriving against it)
    float t = uRole > 0.0 ? uK : 1.0 - uK;
    vec2 uv = vUv;
    vec2 c = uGaze;
    float vis = 1.0 - t;
    vec3 extra = vec3(0.0);
    int s = int(uStyle + 0.5);
    vec2 sv = (uv - c) * vec2(uAspect, 1.0);
    if (s == 0) {
      // push in: the old swells past the camera, the new grows in from far away
      uv = c + (uv - c) * (uRole > 0.0 ? 1.0 / (1.0 + 1.5 * t) : 1.0 + 1.3 * t);
      vis = pow(1.0 - t, 1.3);
    } else if (s == 1) {
      // pull out: the old falls away into the distance, the new comes in from beyond the camera
      uv = c + (uv - c) * (uRole > 0.0 ? 1.0 + 1.3 * t : 1.0 / (1.0 + 1.5 * t));
      vis = pow(1.0 - t, 1.3);
    } else if (s == 2) {
      // a whip pan: the old flies out to one side, the new in from the other
      uv += uDir * uHalf * t * (uRole > 0.0 ? 2.2 : -2.2);
      vis = pow(1.0 - t, 0.8);
    } else if (s == 3) {
      // a spin: the old twists away, the new untwists into place
      float a = t * 2.4 * uRole * exp(-length(sv) * 2.0);
      uv = c + (rot2(a) * sv) / vec2(uAspect, 1.0) * (1.0 + 0.6 * t);
      vis = 1.0 - t;
    } else if (s == 4) {
      // an iris, as the films closed a scene: it closes on the old, opens on the new, a gold rim round it
      float ti = uRole > 0.0 ? clamp(uK * 2.0, 0.0, 1.0) : clamp((1.0 - uK) * 2.0, 0.0, 1.0);
      float R = (1.0 - ti) * length(uHalf * vec2(uAspect, 1.0)) * 1.05;
      float d = length(sv);
      vis = smoothstep(R + 0.004, R - 0.004, d);
      extra += vec3(1.0, 0.82, 0.48) * exp(-pow((d - R) / 0.003, 2.0)) * step(0.001, ti) * step(ti, 0.999) * 0.8;
    } else if (s == 5) {
      // a dissolve through the stars: the old goes speck by speck, the new arrives in its place, sparkling
      float n = vn(uv * vec2(70.0, 42.0) + 3.0);
      vis = uRole > 0.0 ? smoothstep(uK - 0.04, uK + 0.04, n) : smoothstep(n - 0.04, n + 0.04, uK);
      if (uRole > 0.0) extra += vec3(0.95, 0.92, 1.0) * exp(-pow((n - uK) / 0.012, 2.0)) * sin(PI * uK) * 0.5;
    } else if (s == 6) {
      // a light leak, as at the end of a roll: warm light washes over, and the new is there under it
      vis = uRole > 0.0 ? 1.0 - smoothstep(0.3, 0.7, uK) : smoothstep(0.3, 0.7, uK);
      if (uRole > 0.0) {
        vec2 lp = sv - uDir * uHalf * (1.6 - 3.0 * uK);
        float leak = exp(-dot(lp, lp) / 0.02) + 0.6 * exp(-dot(lp * vec2(0.5, 1.4), lp * vec2(0.5, 1.4)) / 0.06);
        extra += mix(vec3(1.0, 0.45, 0.2), vec3(1.0, 0.8, 0.5), clamp(leak, 0.0, 1.0)) * leak * sin(PI * uK) * 0.45;
      }
    } else if (s == 7) {
      // an anamorphic wipe: a line of light sweeps across, the new behind it, its flare streaking sideways
      float e = (uDir.x >= 0.0 ? -1.0 : 1.0) * uHalf.x * uAspect * mix(1.1, -1.1, uK);
      float side = (uDir.x >= 0.0 ? 1.0 : -1.0) * (sv.x - e);
      vis = uRole > 0.0 ? smoothstep(-0.002, 0.002, -side) : smoothstep(-0.002, 0.002, side);
      if (uRole > 0.0) extra += vec3(0.7, 0.85, 1.0) * (exp(-pow((sv.x - e) / 0.004, 2.0)) * 0.9 + exp(-pow(sv.y / 0.004, 2.0)) * exp(-abs(sv.x - e) * 6.0) * 0.5) * sin(PI * uK);
    } else if (s == 8) {
      // a fade through black: the old goes, a breath of dark, the new comes
      vis = uRole > 0.0 ? 1.0 - smoothstep(0.0, 0.42, uK) : smoothstep(0.58, 1.0, uK);
    } else {
      // hyperspace: the old rushes at the camera and is gone, the new swells out of a point
      uv = c + (uv - c) * (uRole > 0.0 ? 1.0 / (1.0 + 4.0 * t * t) : 1.0 + 3.0 * t);
      vis = pow(1.0 - t, 2.0);
    }
    vec2 p = rot2(uRot) * ((uv - uCenter) * vec2(uAspect, 1.0)) / uScale;
    vec3 L = phenom(p) * vis * uIntensity + extra;
    gl_FragColor = vec4(L, 1.0);
  }
`
