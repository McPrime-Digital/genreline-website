/**
 * THE SCENE'S SHADERS (GLSL ES 3.00 through three's ShaderMaterial). Each
 * one ends in three's colour-space chunk, so it matches the built-in
 * materials. No `eval`: three compiles these on the GPU, so the site's CSP
 * needs nothing new.
 */

const OUT = /* glsl */ `
  #include <colorspace_fragment>
`

const SOFT_POINT = /* glsl */ `
  float softPoint(vec2 c) {
    float d = length(c - 0.5) * 2.0;
    float core = smoothstep(1.0, 0.0, d);
    return core * core * (0.55 + 0.45 * smoothstep(0.35, 0.0, d));
  }
`

// ── STARS ───────────────────────────────────────────────────────────────────

export const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTint;
  uniform float uTime;
  uniform float uPixel;
  varying float vAlpha;
  varying float vTint;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = -mv.z;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uPixel / max(depth, 0.1), 1.0, 7.0);
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 40.0);
    vAlpha = twinkle * smoothstep(2.0, 9.0, depth) * smoothstep(260.0, 120.0, depth);
    vTint = aTint;
  }
`
export const STAR_FRAG = /* glsl */ `
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uInk;
  uniform float uDark;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTint;
  ${SOFT_POINT}
  void main() {
    float a = softPoint(gl_PointCoord) * vAlpha * uOpacity;
    vec3 c = mix(mix(uCool, vec3(1.0), 0.55), uWarm, vTint);
    gl_FragColor = vec4(mix(uInk, c, uDark), a);
    ${OUT}
  }
`

/** Warp streaks: two vertices per star, the tail drawn back along the camera's velocity. */
export const STREAK_VERT = /* glsl */ `
  attribute float aEnd;
  uniform vec3 uVel;
  uniform float uStretch;
  varying float vAlpha;
  void main() {
    vec3 off = uVel * uStretch;
    float len = length(off);
    if (len > 3.2) off *= 3.2 / len;
    vec3 p = position - off * aEnd;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = (1.0 - aEnd) * smoothstep(0.35, 1.8, len) * smoothstep(2.5, 10.0, -mv.z) * smoothstep(140.0, 60.0, -mv.z);
  }
`
export const STREAK_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
    ${OUT}
  }
`

// ── THE FLOW: PARTICLES STREAMING ALONG THE LINE ────────────────────────────

/**
 * Each particle rides the line at its own speed, at its own distance from it,
 * read from the line baked into a float texture (rows: point, normal,
 * binormal). The pointer pushes them aside in screen space and lights them.
 */
export const FLOW_VERT = /* glsl */ `
  attribute float aT;
  attribute float aSpeed;
  attribute float aAngle;
  attribute float aRadius;
  attribute float aSize;
  uniform sampler2D uCurve;
  uniform float uCurveSize;
  uniform float uFlow;
  uniform float uTime;
  uniform float uSpread;
  uniform float uPixel;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform float uAspect;
  varying float vAlpha;
  varying float vLit;

  vec3 row(int r, float u) {
    float f = u * (uCurveSize - 1.0);
    int i = int(floor(f));
    int j = min(i + 1, int(uCurveSize) - 1);
    return mix(texelFetch(uCurve, ivec2(i, r), 0).xyz, texelFetch(uCurve, ivec2(j, r), 0).xyz, fract(f));
  }

  void main() {
    float u = fract(aT + uFlow * aSpeed);
    vec3 p = row(0, u);
    vec3 n = row(1, u);
    vec3 b = row(2, u);
    float ang = aAngle + uTime * (0.08 + aSpeed * 6.0);
    float r = aRadius * uSpread * (0.85 + 0.15 * sin(uTime * 0.7 + aAngle * 3.0));
    vec3 world = p + (cos(ang) * n + sin(ang) * b) * r;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    vec4 clip = projectionMatrix * mv;

    // the pointer parts the stream
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float dl = length(d);
    float push = uPointerOn * smoothstep(0.26, 0.0, dl);
    ndc += (d / max(dl, 1e-4)) * push * 0.085 / vec2(uAspect, 1.0);
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    float depth = -mv.z;
    gl_PointSize = clamp(aSize * uPixel / max(depth, 0.1) * (1.0 + push * 1.4), 1.0, 14.0);
    vLit = push;
    vAlpha = smoothstep(0.0, 0.015, u) * smoothstep(1.0, 0.985, u) * smoothstep(1.2, 5.0, depth) * smoothstep(130.0, 50.0, depth);
  }
`
export const FLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vLit;
  ${SOFT_POINT}
  void main() {
    float a = softPoint(gl_PointCoord) * vAlpha * uOpacity * (1.0 + vLit * 1.5);
    gl_FragColor = vec4(mix(uColor, uHot, clamp(vLit * 1.2, 0.0, 1.0)), a);
    ${OUT}
  }
`

// ── THE LINE ────────────────────────────────────────────────────────────────

/**
 * The tube keeps a minimum width on screen: its radius grows with the
 * distance to the camera. Light flows along it, and one brighter light runs
 * just ahead of the camera on its journeys.
 */
export const LINE_VERT = /* glsl */ `
  uniform float uRadius;
  uniform float uPerDistance;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 centre = position - normal * uRadius;
    vec3 worldCentre = (modelMatrix * vec4(centre, 1.0)).xyz;
    float r = max(uRadius, length(cameraPosition - worldCentre) * uPerDistance);
    vec4 world = modelMatrix * vec4(centre + normal * r, 1.0);
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
const LINE_LIGHT = /* glsl */ `
  uniform float uTime;
  uniform float uLength;
  uniform float uSpacing;
  uniform float uSpeed;
  uniform float uHead;
  uniform float uHeadOn;
  float pulses() {
    float s = vUv.x * uLength;
    float ph = fract((s - uTime * uSpeed) / uSpacing) - 0.5;
    return exp(-pow(ph * uSpacing / 1.1, 2.0));
  }
  float head() {
    float s = (vUv.x - uHead) * uLength;
    return uHeadOn * exp(-pow(s / 2.4, 2.0));
  }
`
export const LINE_CORE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  ${LINE_LIGHT}
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float light = pulses() * 0.32 + head() * 0.8;
    vec3 c = uColor * (0.78 + 0.32 * facing);
    c = mix(c, uHot, clamp(light, 0.0, 1.0));
    gl_FragColor = vec4(c, 1.0);
    ${OUT}
  }
`
export const LINE_HALO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  ${LINE_LIGHT}
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float a = pow(facing, 2.4) * uOpacity * (1.0 + pulses() * 0.7 + head() * 1.6);
    gl_FragColor = vec4(uColor, a);
    ${OUT}
  }
`

// ── THE SKIES: EACH SPACE'S OWN LIGHT ───────────────────────────────────────

/**
 * A nebula, computed per vertex on a finely divided plane (it is all low
 * frequencies, so the GPU interpolates it for free), with one fine octave and
 * a dither per pixel so the dark gradients never band.
 */
const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
    return s;
  }
`
export const SKY_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vDensity;
  varying float vMix;
  varying float vAccent;
  ${NOISE}
  void main() {
    vUv = uv;
    vec2 q = uv * vec2(3.2, 2.0) + uSeed;
    vec2 drift = vec2(uTime * 0.006, -uTime * 0.004);
    float n = fbm(q + drift + fbm(q * 0.7 - drift) * 1.4);
    float m = fbm(q * 1.3 + 7.7 - drift * 1.5);
    vec2 c = (uv - 0.5) * vec2(1.0, 1.25);
    float r = length(c) * 2.0;
    vDensity = smoothstep(1.0, 0.05, r) * smoothstep(0.28, 0.85, n);
    vMix = m;
    vAccent = smoothstep(0.58, 0.85, n) * smoothstep(0.75, 0.0, r);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const SKY_FRAG = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uA2;
  uniform vec3 uB2;
  uniform vec3 uAccent;
  uniform float uFace;
  uniform float uWeight;
  uniform float uStrength;
  varying vec2 vUv;
  varying float vDensity;
  varying float vMix;
  varying float vAccent;
  float dither(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) - 0.5; }
  void main() {
    vec3 a = mix(uA, uA2, uFace);
    vec3 b = mix(uB, uB2, uFace);
    vec3 c = mix(b, a, vMix) + uAccent * vAccent * 0.6;
    float alpha = vDensity * uWeight * uStrength;
    alpha += dither(gl_FragCoord.xy) * (1.5 / 255.0);
    gl_FragColor = vec4(c, clamp(alpha, 0.0, 1.0));
    ${OUT}
  }
`

/**
 * Each space's structure, drawn behind it: the Crew's studio floor (a grid
 * receding to the horizon, a light sweeping across it), the Client's portal
 * (rings opening outward), the Suite's rays (a slow fan of light).
 */
export const STRUCTURE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const STRUCTURE_FRAG = /* glsl */ `
  uniform vec2 uSize;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uWeight;
  uniform float uOpacity;
  varying vec2 vUv;
  float gridLine(float v, float step) {
    float g = abs(fract(v / step - 0.5) - 0.5) * step;
    float w = fwidth(v) * 1.1;
    return 1.0 - smoothstep(0.0, w, g);
  }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float a = 0.0;
    #if MODE == 0
      // the floor: minor and major lines, fading into the distance and to the sides
      float minor = max(gridLine(p.x, 2.0), gridLine(p.y, 2.0)) * 0.35;
      float major = max(gridLine(p.x, 10.0), gridLine(p.y, 10.0));
      float fade = smoothstep(uSize.y * 0.5, uSize.y * 0.08, abs(p.y + uSize.y * 0.08)) * smoothstep(uSize.x * 0.5, uSize.x * 0.12, abs(p.x));
      float sweep = exp(-pow((p.y - (fract(uTime * 0.05) - 0.5) * uSize.y) / 2.5, 2.0));
      a = max(minor, major * 0.8) * fade * (0.55 + 1.2 * sweep);
    #elif MODE == 1
      // the portal: rings opening outward from the tile
      float r = length(p);
      float rings = gridLine(r - uTime * 0.6, 2.2);
      float fade = smoothstep(uSize.x * 0.48, 3.0, r) * smoothstep(2.2, 5.0, r);
      a = rings * fade * 0.9;
    #else
      // the rays: a fan of light turning slowly behind the tile
      float r = length(p);
      float ang = atan(p.y, p.x) + uTime * 0.025;
      float rays = pow(0.5 + 0.5 * cos(ang * 18.0), 14.0);
      float fade = smoothstep(uSize.x * 0.5, 4.0, r) * smoothstep(2.5, 7.0, r);
      a = rays * fade * 0.75;
    #endif
    gl_FragColor = vec4(uColor, a * uWeight * uOpacity);
    ${OUT}
  }
`

// ── THE SCREENS ─────────────────────────────────────────────────────────────

/**
 * One draw per screen, one small program per kind of screen (ART: 0 a
 * capture, 1–6 a Suite tool drawn — chosen when the program is built, so no
 * graphics compiler ever has to carry, or flatten, the others): the rounded screen itself (a capture, or a drawn piece
 * of a Suite tool at work, or — until its picture arrives — a shimmering
 * skeleton of an app), a rim of light, a sheen of glass, and its label below.
 */
export const PANEL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const PANEL_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uLabel;
  uniform float uHasMap;
  uniform float uHasLabel;
  uniform vec2 uSize;
  uniform float uLabelH;
  uniform float uRadius;
  uniform float uOpacity;
  uniform float uHover;
  uniform float uFocus;
  uniform float uTime;
  uniform float uSheen;
  uniform float uDark;
  uniform vec3 uRim;
  uniform vec3 uGlass;
  uniform vec3 uInk;
  uniform vec3 uGold;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float sdBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float hash1(float n) { return fract(sin(n * 91.345) * 47453.5453); }
  float band(float v, float a, float b, float w) { return smoothstep(a - w, a, v) * (1.0 - smoothstep(b, b + w, v)); }
  float rbox(vec2 uv, vec2 c, vec2 h, float r) {
    float d = sdBox(uv - c, h, r);
    return 1.0 - smoothstep(-0.004, 0.004, d);
  }

  #if ART > 0
  // a dusk shot: the sky, the sun low, a ridge against it
  vec3 stageShot(vec2 p, vec2 a) {
    vec3 c = mix(vec3(0.95, 0.62, 0.34), vec3(0.16, 0.18, 0.36), smoothstep(0.25, 0.95, p.y));
    c = mix(c, vec3(1.0, 0.86, 0.6), smoothstep(0.09, 0.06, length((p - vec2(0.64, 0.42)) * a)));
    float ridge = 0.3 + 0.07 * sin(p.x * 9.0) + 0.04 * sin(p.x * 23.0 + 1.0);
    return mix(c, vec3(0.06, 0.06, 0.09), smoothstep(ridge + 0.005, ridge - 0.005, p.y));
  }

  // ── the Suite's tools at work, drawn (no words) ──
  vec3 art(vec2 uv, float aspect) {
    // drawn in display colours, returned in the working (linear) space
    vec3 gold = pow(uGold, vec3(1.0 / 2.2));
    vec2 a = vec2(aspect, 1.0);
    vec3 base = mix(vec3(0.045, 0.045, 0.06), vec3(0.97, 0.965, 0.95), 1.0 - uDark);
    vec3 dim = mix(vec3(0.22, 0.22, 0.26), vec3(0.78, 0.77, 0.74), 1.0 - uDark);
    vec3 col = base;
    float t = uTime;
    #if ART == 1
      // Write: a screenplay page, its lines typing in, the cursor blinking
      col = mix(vec3(0.9, 0.89, 0.86), vec3(1.0), 1.0 - uDark) * (uDark > 0.5 ? 0.86 : 1.0);
      vec3 ink = vec3(0.28, 0.27, 0.3);
      float lineH = 0.062;
      float idx = floor((0.92 - uv.y) / lineH);
      float yIn = fract((0.92 - uv.y) / lineH);
      float typed = mod(t * 3.2, 18.0);
      if (idx >= 0.0 && idx < 13.0 && yIn > 0.3 && yIn < 0.7) {
        float kind = mod(idx, 5.0);
        float x0 = kind == 0.0 ? 0.12 : (kind == 1.0 ? 0.40 : (kind == 4.0 ? 0.30 : 0.22));
        float w = kind == 0.0 ? 0.55 + 0.2 * hash1(idx) : (kind == 1.0 ? 0.18 : (kind == 4.0 ? 0.16 : 0.42 + 0.2 * hash1(idx + 3.0)));
        float shown = clamp(typed - idx, 0.0, 1.0);
        float x1 = x0 + w * shown;
        float on = step(x0, uv.x) * step(uv.x, x1);
        col = mix(col, kind == 1.0 ? gold * 0.85 : ink, on * 0.85);
        float cursor = step(abs(uv.x - x1 - 0.008), 0.004) * step(0.5, fract(t * 1.6)) * step(idx, typed) * step(typed, idx + 1.0);
        col = mix(col, gold, cursor);
      }
    #elif ART == 2
      // Visualise: a storyboard — six sketched frames (a horizon, a figure, the lines of the shot), a gold brush stroke painting across them
      vec2 cell = vec2(3.0, 2.0);
      vec2 g = uv * cell;
      vec2 id = floor(g);
      vec2 f = fract(g);
      float h = hash1(id.x + id.y * 7.0);
      vec3 paper = mix(vec3(0.86, 0.85, 0.82), vec3(0.97, 0.96, 0.93), 1.0 - uDark) * (uDark > 0.5 ? 0.82 : 1.0);
      vec3 pencil = vec3(0.32, 0.31, 0.34);
      float inside = rbox(f, vec2(0.5), vec2(0.43, 0.38), 0.03);
      vec2 q = (f - vec2(0.07, 0.12)) / vec2(0.86, 0.76);
      float horizon = 0.3 + 0.35 * h;
      float sketch = smoothstep(0.012, 0.0, abs(q.y - horizon - 0.04 * sin(q.x * 6.0 + h * 9.0)));
      vec2 fig = vec2(0.25 + 0.5 * hash1(h * 13.0), horizon + 0.12);
      float head = smoothstep(0.012, 0.0, abs(length((q - fig - vec2(0.0, 0.16)) * vec2(1.6, 1.0)) - 0.06));
      float body = smoothstep(0.012, 0.0, abs(q.x - fig.x)) * step(fig.y - 0.02, q.y) * step(q.y, fig.y + 0.1);
      float persp = smoothstep(0.01, 0.0, abs(q.y - horizon - (q.x - 0.5) * (h - 0.5) * 0.9)) * step(q.y, horizon);
      float lines = clamp(sketch + head + body + persp * 0.6, 0.0, 1.0) * step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
      vec3 frame = mix(paper, pencil, lines * 0.8);
      float border = inside - rbox(f, vec2(0.5), vec2(0.415, 0.365), 0.025);
      col = mix(base, frame, inside);
      col = mix(col, pencil, border * 0.6);
      float reveal = fract(t * 0.12) * 1.3;
      float sy = 0.52 + 0.17 * sin(uv.x * 7.0 + 1.3) + 0.05 * sin(uv.x * 19.0);
      float stroke = smoothstep(0.03, 0.0, abs(uv.y - sy) - 0.011 * (1.0 + sin(uv.x * 30.0) * 0.3)) * step(uv.x, reveal);
      col = mix(col, gold, stroke * 0.9);
    #elif ART == 3
      // The Stage: a frame being generated — it resolves from soft blocks to a dusk shot, line by line, then holds
      float scan = clamp(fract(t * 0.12) * 1.7, 0.0, 1.0);
      vec2 coarse = (floor(uv * vec2(18.0, 10.0)) + 0.5) / vec2(18.0, 10.0);
      vec3 shot = stageShot(uv, a);
      vec3 rough = stageShot(coarse, a) * 0.55 + 0.05;
      float resolved = step(1.0 - scan, uv.y);
      col = mix(rough, shot, resolved);
      col += gold * smoothstep(0.014, 0.0, abs(uv.y - (1.0 - scan))) * (1.0 - step(0.999, scan)) * 0.9;
      float bars = step(uv.y, 0.08) + step(0.92, uv.y);
      col = mix(col, vec3(0.0), bars);
    #elif ART == 4
      // Workflows: nodes joined by curves, work travelling along them
      vec2 n0 = vec2(0.14, 0.5), n1 = vec2(0.42, 0.75), n2 = vec2(0.42, 0.28), n3 = vec2(0.7, 0.55), n4 = vec2(0.88, 0.3);
      vec2 P = uv;
      float lines = 0.0;
      float pulse = 0.0;
      for (int k = 0; k < 5; k++) {
        vec2 A = k == 0 ? n0 : k == 1 ? n0 : k == 2 ? n1 : k == 3 ? n2 : n3;
        vec2 B = k == 0 ? n1 : k == 1 ? n2 : k == 2 ? n3 : k == 3 ? n3 : n4;
        float s = clamp((P.x - A.x) / (B.x - A.x), 0.0, 1.0);
        float e = s * s * (3.0 - 2.0 * s);
        float y = mix(A.y, B.y, e);
        float inX = step(A.x, P.x) * step(P.x, B.x);
        float d = abs(P.y - y);
        lines = max(lines, inX * smoothstep(0.012, 0.004, d));
        float head = fract(t * 0.35 + float(k) * 0.23);
        pulse = max(pulse, inX * smoothstep(0.03, 0.0, length((P - vec2(mix(A.x, B.x, head), mix(A.y, B.y, head * head * (3.0 - 2.0 * head)))) * a)));
      }
      col = mix(base, dim, lines);
      col = mix(col, gold, pulse);
      for (int k = 0; k < 5; k++) {
        vec2 N = k == 0 ? n0 : k == 1 ? n1 : k == 2 ? n2 : k == 3 ? n3 : n4;
        float box = rbox(P * a, N * a, vec2(0.075, 0.055), 0.02);
        float ring = box - rbox(P * a, N * a, vec2(0.068, 0.048), 0.016);
        col = mix(col, mix(base, gold, 0.12), box);
        col = mix(col, gold, ring * 0.9);
      }
    #elif ART == 5
      // Sound: three voices of a waveform, moving, louder under the pointer
      float y = uv.y - 0.5;
      float loud = 1.0 + uHover * 0.8;
      float w = 0.0;
      for (int k = 0; k < 3; k++) {
        float fk = float(k);
        float amp = (0.17 - fk * 0.04) * loud * (0.6 + 0.4 * sin(uv.x * 3.1 + t * (0.7 + fk * 0.3)));
        float wave = amp * sin(uv.x * (14.0 + fk * 9.0) - t * (2.4 + fk)) * sin(uv.x * 3.14159);
        float d = abs(y - wave);
        w = max(w, smoothstep(0.012, 0.002, d) * (1.0 - fk * 0.28));
      }
      float bars = 0.0;
      float bx = floor(uv.x * 64.0);
      float bh = 0.06 + 0.32 * abs(sin(bx * 0.7 + t * 2.0) * sin(bx * 0.13 + t * 0.6)) * loud;
      bars = step(abs(y), bh) * step(0.25, fract(uv.x * 64.0)) * 0.22;
      col = mix(base, dim, bars);
      col = mix(col, gold, w);
    #elif ART == 6
      // Edit and finish: a timeline — the ruler, four tracks of clips, the playhead
      float ruler = step(0.86, uv.y) * step(0.5, fract(uv.x * 40.0)) * step(uv.y, 0.86 + 0.04 + 0.04 * step(0.9, fract(uv.x * 8.0)));
      col = mix(base, dim, ruler * 0.8);
      for (int k = 0; k < 4; k++) {
        float fk = float(k);
        float y0 = 0.66 - fk * 0.17;
        if (uv.y > y0 && uv.y < y0 + 0.12) {
          float cx = uv.x * (5.0 + fk) + fk * 1.7;
          float cid = floor(cx);
          float cf = fract(cx);
          float gap = step(0.04, cf) * step(cf, 0.96);
          vec3 tint = k == 0 ? mix(gold, base, 0.25) : k == 1 ? vec3(0.32, 0.42, 0.62) : k == 2 ? vec3(0.42, 0.58, 0.5) : vec3(0.55, 0.42, 0.6);
          col = mix(col, tint * (0.75 + 0.25 * hash1(cid + fk * 9.0)), gap * 0.9);
        }
      }
      float ph = fract(t * 0.08) * 0.92 + 0.04;
      col = mix(col, gold, smoothstep(0.004, 0.0, abs(uv.x - ph)));
    #endif
    return pow(max(col, 0.0), vec3(2.2));
  }
  #endif

  void main() {
    vec2 full = vec2(uSize.x, uSize.y + uLabelH);
    vec2 p = vUv * full;
    vec2 q = p - vec2(0.0, uLabelH);
    vec2 uv = clamp(q / uSize, 0.0, 1.0);
    // Everything with a derivative — the edge's width, both texture reads — is worked out before any
    // branch, so Direct3D's compiler (Chrome and Edge on Windows) never meets one in divergent flow.
    float d = sdBox(q - uSize * 0.5, uSize * 0.5, uRadius);
    float px = max(fwidth(d), 1e-4);
    vec3 picture = texture(uMap, uv).rgb;
    vec4 lab = texture(uLabel, vec2(p.x / uSize.x, clamp(p.y / uLabelH, 0.0, 1.0)));
    vec3 col = vec3(0.0);
    float alpha = 0.0;
    if (p.y >= uLabelH) {
      alpha = 1.0 - smoothstep(-px, px, d);
      #if ART > 0
        col = art(uv, uSize.x / uSize.y);
      #else
      if (uHasMap > 0.5) {
        col = picture;
      } else {
        // the skeleton of an app while the picture loads: a sidebar, a header, rows, a shimmer passing
        col = uGlass;
        float side = step(uv.x, 0.19);
        col = mix(col, uGlass * 1.18 + 0.01, side);
        float head = step(0.88, uv.y);
        col = mix(col, uGlass * 1.12 + 0.01, head * (1.0 - side));
        float rowY = fract((0.84 - uv.y) * 7.0);
        float row = step(0.25, uv.x) * step(uv.x, 0.25 + 0.45 + 0.25 * hash1(floor((0.84 - uv.y) * 7.0))) * step(0.35, rowY) * step(rowY, 0.65) * step(uv.y, 0.84) * step(0.08, uv.y);
        col = mix(col, uInk * 0.5 + uGlass * 0.5, row * 0.35);
        float sh = exp(-pow((uv.x + uv.y * 0.3) - (fract(uTime * 0.35) * 2.0 - 0.4), 2.0) * 30.0);
        col += sh * 0.05;
      }
      #endif
      // the glass: a light from above, a sheen that sweeps as the screen arrives, the rim
      col *= 0.9 + 0.1 * uv.y;
      float s = (uv.x + uv.y * 0.45) - uSheen;
      col += exp(-s * s * 55.0) * (0.06 + 0.06 * uHover);
      float rim = smoothstep(-0.07, 0.0, d) * alpha;
      col = mix(col, uRim, rim * (0.55 + 0.45 * uHover));
      col *= mix(0.62, 1.0, uFocus);
    } else if (uHasLabel > 0.5) {
      col = lab.rgb;
      alpha = lab.a * mix(0.55, 1.0, max(uFocus, uHover));
    }
    gl_FragColor = vec4(col, alpha * uOpacity);
    ${OUT}
  }
`
