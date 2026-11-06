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
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform float uAspect;
  varying float vAlpha;
  varying float vTint;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = -mv.z;
    vec4 clip = projectionMatrix * mv;
    // the pointer: stars near it ease aside a little and brighten (nearer stars more than far ones)
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float dl = length(d);
    float near = smoothstep(220.0, 30.0, depth);
    float push = uPointerOn * smoothstep(0.34, 0.0, dl);
    ndc += (d / max(dl, 1e-4)) * push * (0.012 + 0.03 * near) / vec2(uAspect, 1.0);
    clip.xy = ndc * clip.w;
    gl_Position = clip;
    gl_PointSize = clamp(aSize * uPixel / max(depth, 0.1) * (1.0 + push * 0.6), 1.0, 7.5);
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 40.0);
    vAlpha = twinkle * (1.0 + push * 0.9) * smoothstep(2.0, 9.0, depth) * smoothstep(260.0, 120.0, depth);
    vTint = aTint;
  }
`

// ── SHOOTING STARS ──────────────────────────────────────────────────────────

/**
 * A few meteors, far beyond everything: screen-space streaks (so they lie at infinity, still while the
 * camera moves), each slot firing on its own irregular rhythm, worked out entirely here from the time —
 * no script per frame. A bright head, a tapering tail, under a second and a half; some cycles stay dark,
 * so the sky never keeps a beat.
 */
export const METEOR_VERT = /* glsl */ `
  attribute vec2 aCorner;
  attribute float aSlot;
  uniform float uTime;
  uniform float uAspect;
  uniform float uOn;
  varying vec2 vC;
  varying float vFade;
  float h(float n) { return fract(sin(n * 91.7 + aSlot * 13.13) * 43758.5453); }
  void main() {
    float period = 8.0 + aSlot * 3.7;
    float tt = uTime + aSlot * 4.3 + 3.0;
    float cycle = floor(tt / period);
    float local = tt - cycle * period;
    float life = 0.7 + 0.6 * h(cycle + 1.0);
    float k = local / life;
    float alive = step(k, 1.0) * step(0.4, h(cycle + 7.0)) * uOn;
    // in aspect space (x spans the frame's width in units of its half-height): from high in the frame, falling
    vec2 origin = vec2(mix(-0.35, 0.95, h(cycle + 2.0)) * uAspect, mix(0.25, 0.92, h(cycle + 3.0)));
    float ang = radians(mix(198.0, 238.0, h(cycle + 4.0)));
    vec2 dir = vec2(cos(ang), sin(ang));
    float travel = mix(0.45, 0.85, h(cycle + 5.0));
    vec2 head = origin + dir * travel * k;
    float len = mix(0.16, 0.3, h(cycle + 6.0)) * min(1.0, k * 3.0);
    vec2 tail = head - dir * len;
    vec2 p = mix(tail, head, aCorner.x);
    vec2 n = vec2(-dir.y, dir.x);
    p += n * aCorner.y * mix(0.0012, 0.0036, aCorner.x);
    p.x /= uAspect;
    gl_Position = alive > 0.5 ? vec4(p, 0.0, 1.0) : vec4(4.0, 4.0, 0.0, 1.0);
    vC = aCorner;
    vFade = sin(clamp(k, 0.0, 1.0) * 3.14159);
  }
`
export const METEOR_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vC;
  varying float vFade;
  void main() {
    float along = vC.x;
    float across = 1.0 - abs(vC.y);
    float tail = pow(along, 2.4);
    float head = exp(-pow((1.0 - along) * 14.0, 2.0)) * 1.6;
    float a = (tail + head) * smoothstep(0.0, 0.9, across) * vFade * uOpacity;
    gl_FragColor = vec4(uColor, a);
    ${OUT}
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
  // where the page's words sit (fractions of the frame from the top left), so the line steps back behind them
  uniform vec4 uMask;
  uniform float uMaskOn;
  uniform float uTrackY;
  uniform float uTrackOn;
  uniform float uTopY;
  uniform vec2 uRes;
  float behindWords() {
    vec2 p = gl_FragCoord.xy / uRes;
    p.y = 1.0 - p.y;
    float inX = smoothstep(uMask.x - 0.03, uMask.x, p.x) * (1.0 - smoothstep(uMask.z, uMask.z + 0.04, p.x));
    float inY = smoothstep(uMask.y - 0.04, uMask.y, p.y) * (1.0 - smoothstep(uMask.w, uMask.w + 0.03, p.y));
    // and the tour's track, along the foot of the frame, and the slate line at its top
    float track = smoothstep(uTrackY - 0.035, uTrackY, p.y) * uTrackOn;
    float slate = 1.0 - smoothstep(uTopY - 0.02, uTopY + 0.015, p.y);
    return max(max(inX * inY * uMaskOn, track), slate);
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
    c *= 1.0 - 0.86 * behindWords();
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
    a *= 1.0 - 0.9 * behindWords();
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
  #ifdef MILKY
  varying float vBand;
  varying float vCore;
  varying float vDust;
  #endif
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
    #ifdef MILKY
      // The Milky Way, very far: a band across the sky, high on the left and falling away to the right
      // behind the logo, its light in clouds, its core cut by dark lanes of dust.
      vec2 a = (uv - vec2(0.5, 0.52)) * vec2(1.69, 1.0);
      vec2 along = normalize(vec2(1.0, -0.36));
      float across = dot(a, vec2(-along.y, along.x));
      float s = dot(a, along);
      float warp = (fbm(vec2(s * 3.0, 4.1) + uSeed) - 0.5) * 0.09;
      float band = exp(-pow((across + warp) / 0.075, 2.0));
      float clouds = fbm(vec2(s * 9.0, across * 22.0) + 2.3 - drift * 0.5);
      float lanes = smoothstep(0.5, 0.72, fbm(vec2(s * 14.0, across * 34.0) + 8.1));
      vBand = band * smoothstep(0.3, 0.78, clouds) * smoothstep(0.95, 0.4, abs(s));
      vCore = exp(-pow((across + warp) / 0.035, 2.0));
      vDust = lanes * exp(-pow((across + warp) / 0.045, 2.0));
    #endif
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
  #ifdef MILKY
  uniform vec3 uBand;
  uniform vec3 uBandEdge;
  uniform float uMilky;
  varying float vBand;
  varying float vCore;
  varying float vDust;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  float grainNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  #endif
  float dither(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) - 0.5; }
  void main() {
    vec3 a = mix(uA, uA2, uFace);
    vec3 b = mix(uB, uB2, uFace);
    vec3 c = mix(b, a, vMix) + uAccent * vAccent * 0.6;
    float alpha = vDensity * uWeight * uStrength;
    #ifdef MILKY
      // Its light is made of stars: a fine granular cloud (a few pixels across), countless pinpoints
      // thickening toward the core, a warmer core and cooler edges, and the dark lanes of dust across it.
      vec2 px = gl_FragCoord.xy;
      float granular = 0.45 + 0.55 * grainNoise(px / 2.6) * grainNoise(px / 7.0 + 13.0);
      float light = vBand * granular * (1.0 - vDust * 0.85) * uMilky;
      float pin = step(0.9975 - 0.006 * vBand, h21(floor(px))) * (0.4 + 0.6 * h21(floor(px) + 7.0));
      vec3 band = mix(uBandEdge, uBand, clamp(vCore * 1.3, 0.0, 1.0));
      c = mix(c, band, clamp(light * 2.2, 0.0, 1.0));
      alpha = max(alpha, light * 0.34) + pin * vBand * uMilky * 0.55;
    #endif
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
  uniform float uFace;
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
      // THE SOUNDSTAGE (the Crew, the studio era): a lacquered deck floating in the night, its grid kept
      // (the owner loves it) and refined into boards; warm pools under the tungsten lamps above; the
      // tile's reflection in the gloss; spike tape where the actors stand; a dolly track curving in front.
      // (+y runs away from the camera; the tile stands over y = -14.)
      float minor = max(gridLine(p.x, 2.0), gridLine(p.y, 2.0)) * 0.3;
      float major = max(gridLine(p.x, 10.0), gridLine(p.y, 10.0));
      float seams = gridLine(p.y, 0.5) * 0.07;
      float fade = smoothstep(uSize.y * 0.5, uSize.y * 0.08, abs(p.y + uSize.y * 0.08)) * smoothstep(uSize.x * 0.5, uSize.x * 0.12, abs(p.x));
      float sweep = exp(-pow((p.y - (fract(uTime * 0.05) - 0.5) * uSize.y) / 2.5, 2.0));
      // the pools of light, breathing a little as the haze moves through the beams
      float pools = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 c = vec2(-11.0 + fi * 11.0, -6.0 + 3.0 * abs(fi - 1.0));
        float breathe = 0.85 + 0.15 * sin(uTime * 0.6 + fi * 2.1);
        pools += exp(-dot(p - c, p - c) / 26.0) * breathe;
      }
      // the tile's reflection: a soft streak in the gloss, toward the camera
      float refl = exp(-p.x * p.x / 3.0) * smoothstep(-36.0, -18.0, p.y) * (1.0 - smoothstep(-15.0, -11.0, p.y));
      // the dolly track: two rails on an arc in front of the tile, sleepers across them
      vec2 dq = p - vec2(3.0, -3.0);
      float dr = length(dq);
      float da = atan(dq.y, dq.x);
      float onArc = smoothstep(-2.85, -2.65, da) * (1.0 - smoothstep(-0.65, -0.45, da));
      float rails = (1.0 - smoothstep(0.0, fwidth(dr) * 1.5, abs(dr - 13.4))) + (1.0 - smoothstep(0.0, fwidth(dr) * 1.5, abs(dr - 14.6)));
      float sl = abs(fract(da * 14.0 / 1.0) - 0.5) * 1.0;
      float sleepers = (1.0 - smoothstep(0.0, fwidth(da * 14.0) * 1.5, sl - 0.06)) * step(13.1, dr) * step(dr, 14.9);
      float dolly = onArc * clamp(rails + sleepers * 0.55, 0.0, 1.0);
      // spike tape: small crosses on the deck, in tape colours
      vec3 tape = vec3(0.0);
      float marks = 0.0;
      for (int i = 0; i < 4; i++) {
        vec2 m = i == 0 ? vec2(-4.5, -9.5) : i == 1 ? vec2(5.5, -7.0) : i == 2 ? vec2(-12.0, -2.5) : vec2(11.5, -12.5);
        vec3 tc = i == 0 ? vec3(0.95, 0.78, 0.25) : i == 1 ? vec3(0.9, 0.28, 0.22) : i == 2 ? vec3(0.35, 0.55, 0.95) : vec3(0.95, 0.78, 0.25);
        vec2 d = abs(p - m);
        float cross = max(step(d.x, 0.55) * step(d.y, 0.09), step(d.y, 0.55) * step(d.x, 0.09));
        marks = max(marks, cross);
        tape = mix(tape, tc, cross);
      }
      a = (max(minor, major * 0.8) + seams) * fade * (0.5 + 1.2 * sweep + 1.6 * pools);
      a += (pools * 0.22 + refl * 0.35) * fade + dolly * fade * 0.55 + marks * fade * 0.9;
      gl_FragColor = vec4(mix(uColor, tape, marks), a * uWeight * uOpacity);
      ${OUT}
      return;
    #elif MODE == 1
      // THE PICTURE PALACE (the Client): a dark polished floor, a gold art-deco fan inlaid in it radiating
      // from the foot of the great screen, two rows of aisle lights converging on it, the screen's silver
      // washing over the floor nearest it. Premiere night (uFace, the Stakeholders): the aisle becomes a
      // red carpet. (+y runs away from the camera; the screen stands at y = +2, the tile over y = -14.)
      vec2 o = vec2(0.0, 2.0);
      vec2 d = p - o;
      float r = length(d);
      float ang = atan(d.x, -d.y);
      float front = step(d.y, 0.0) * smoothstep(30.0, 22.0, r);
      float arcLen = abs(fract(ang * 22.0 / 6.2832 + 0.5) - 0.5) * (6.2832 / 22.0) * r;
      float spokes = (1.0 - smoothstep(0.0, fwidth(arcLen) * 1.5 + 0.03, arcLen)) * smoothstep(4.0, 7.0, r) * 0.55;
      float steps = (1.0 - smoothstep(0.0, fwidth(r) * 1.5, abs(r - 6.0))) + (1.0 - smoothstep(0.0, fwidth(r) * 1.5, abs(r - 11.0))) * 0.8 + (1.0 - smoothstep(0.0, fwidth(r) * 1.5, abs(r - 17.0))) * 0.6;
      float fan = (spokes + steps) * front;
      // the aisle: two rows of small lights converging on the screen
      float lights = 0.0;
      for (int i = 0; i < 12; i++) {
        float t = float(i) / 11.0;
        float y = mix(-30.0, -3.0, t);
        float x = mix(3.6, 1.6, t);
        vec2 a1 = p - vec2(-x, y);
        vec2 a2 = p - vec2(x, y);
        lights += exp(-dot(a1, a1) / 0.05) + exp(-dot(a2, a2) / 0.05);
      }
      float aisle = 1.0 - smoothstep(1.4, 2.2, abs(p.x) - (p.y + 30.0) * -0.02);
      aisle *= step(p.y, -2.0) * smoothstep(-40.0, -20.0, p.y);
      float wash = exp(-pow(max(0.0, -d.y) / 9.0, 2.0)) * smoothstep(26.0, 6.0, abs(p.x)) * step(d.y, 0.0);
      vec3 carpet = vec3(0.62, 0.08, 0.1);
      a = fan * 0.9 + lights * 1.2 + wash * 0.28 + aisle * uFace * 0.5;
      vec3 col = mix(uColor, vec3(0.86, 0.9, 1.0), clamp(wash * 1.4, 0.0, 1.0) * (1.0 - uFace));
      col = mix(col, vec3(1.0, 0.86, 0.6), clamp(lights, 0.0, 1.0));
      col = mix(col, carpet, aisle * uFace);
      float fade1 = smoothstep(uSize.y * 0.5, uSize.y * 0.1, abs(p.y + uSize.y * 0.06)) * smoothstep(uSize.x * 0.5, uSize.x * 0.14, abs(p.x));
      gl_FragColor = vec4(col, a * fade1 * uWeight * uOpacity);
      ${OUT}
      return;
    #else
      // THE CUTTING ROOM (the Suite, today): the floor is an edit timeline running to the horizon — lanes of
      // clips in muted colours, the cuts between them, a ruler at its near edge and the playhead sweeping
      // across. (+y runs away from the camera; time runs along x.)
      float lane = floor((p.y + 40.0) / 2.4);
      float inLane = fract((p.y + 40.0) / 2.4);
      float laneBand = smoothstep(0.08, 0.16, inLane) * (1.0 - smoothstep(0.84, 0.92, inLane));
      float clipLen = 3.0 + 6.0 * fract(sin(lane * 12.9898) * 43758.5453);
      float cx = (p.x + 60.0 + lane * 7.3) / clipLen;
      float cid = floor(cx);
      float cf = fract(cx);
      float cut = smoothstep(0.0, 0.04, cf) * (1.0 - smoothstep(0.96, 1.0, cf));
      float present = step(0.28, fract(sin((cid + lane * 31.0) * 78.233) * 43758.5453));
      float h = fract(sin((cid * 3.7 + lane) * 12.9898) * 43758.5453);
      vec3 tint = h < 0.33 ? vec3(0.42, 0.52, 0.78) : h < 0.66 ? vec3(0.48, 0.66, 0.56) : vec3(0.66, 0.5, 0.74);
      tint = lane < -14.0 ? uColor : tint;
      float clips = laneBand * cut * present;
      // the playhead, sweeping across time
      float ph = (fract(uTime * 0.035) - 0.5) * uSize.x * 0.7;
      float playhead = 1.0 - smoothstep(0.0, fwidth(p.x) * 1.5 + 0.04, abs(p.x - ph));
      float glow = exp(-pow((p.x - ph) / 1.6, 2.0));
      float fade = smoothstep(uSize.y * 0.5, uSize.y * 0.08, abs(p.y + uSize.y * 0.08)) * smoothstep(uSize.x * 0.5, uSize.x * 0.12, abs(p.x));
      a = (clips * 0.32 + playhead * 0.9 + glow * clips * 0.4) * fade;
      vec3 col = mix(tint, uColor, clamp(playhead + glow * 0.5, 0.0, 1.0));
      gl_FragColor = vec4(col, a * uWeight * uOpacity);
      ${OUT}
      return;
    #endif
    gl_FragColor = vec4(uColor, a * uWeight * uOpacity);
    ${OUT}
  }
`

// ── THE CREW'S LIGHT: TUNGSTEN THROUGH HAZE ─────────────────────────────────

/**
 * A lamp's beam, falling from the grid above to its pool on the deck: a tall plane, narrow at the lamp
 * and wide at the floor, its haze moving slowly through it. Warm tungsten, faint, additive.
 */
export const BEAM_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vHaze;
  ${NOISE}
  void main() {
    vUv = uv;
    // the haze is all low frequencies: worked out per vertex on a finely divided plane, free per pixel
    vHaze = 0.5 + 0.5 * fbm(vec2(uv.x * 3.0 + uSeed, uv.y * 2.4 - uTime * 0.05));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vHaze;
  void main() {
    float down = 1.0 - vUv.y;
    float half_ = mix(0.07, 0.48, down);
    float x = abs(vUv.x - 0.5);
    float body = 1.0 - smoothstep(half_ * 0.25, half_, x);
    float core = 1.0 - smoothstep(0.0, half_ * 0.45, x);
    float haze = vHaze;
    // brightest high, near the lamp; feathered away at the lamp's end and into the pool at the floor
    float a = (body * 0.65 + core * 0.35) * haze * smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.8, vUv.y) * (0.4 + 0.6 * smoothstep(0.95, 0.3, down));
    gl_FragColor = vec4(uColor, a * uWeight * uOpacity);
    ${OUT}
  }
`
/** Dust in the beams: motes drifting slowly, lit only where a beam crosses them. */
export const MOTE_VERT = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixel;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.17 + aPhase * 6.0) * 0.5;
    p.y += sin(uTime * 0.11 + aPhase * 9.0) * 0.6 + fract(aPhase * 3.0 + uTime * 0.012) * 1.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(0.06 * uPixel / max(-mv.z, 0.1), 1.0, 4.0);
    vAlpha = 0.5 + 0.5 * sin(uTime * (0.8 + aPhase) + aPhase * 30.0);
  }
`
export const MOTE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  varying float vAlpha;
  ${SOFT_POINT}
  void main() {
    gl_FragColor = vec4(uColor, softPoint(gl_PointCoord) * vAlpha * uWeight * 0.8);
    ${OUT}
  }
`

// ── THE CLIENT: THE PICTURE PALACE ──────────────────────────────────────────

/**
 * Behind the Client's tile, the great screen of a picture palace — 2.39 : 1, silver, its light breathing
 * with the projector's shutter — framed by a gilded proscenium with an art-deco sunburst for its crown,
 * velvet curtains drawn aside, and its light spilling into space round the frame like an eclipse's
 * corona (where the cinema meets the sky). Premiere night (uFace): the light turns gold, the velvet red.
 */
export const PALACE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const PALACE_FRAG = /* glsl */ `
  uniform vec2 uSize;
  uniform float uTime;
  uniform float uWeight;
  uniform float uOpacity;
  uniform float uFace;
  uniform vec3 uSilver;
  uniform vec3 uGold;
  uniform vec3 uVelvet;
  varying vec2 vUv;
  float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
  // the proscenium: a box whose top corners round into an arch
  float sdArch(vec2 p, vec2 b, float r) {
    float rr = p.y > 0.0 ? r : 0.4;
    vec2 d = abs(p) - b + rr;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - rr;
  }
  float lineOf(float d, float w) { return 1.0 - smoothstep(0.0, fwidth(d) * 1.5 + w, abs(d)); }
  float h12(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    vec2 sc = vec2(0.0, 1.5);
    vec2 sh = vec2(19.0, 7.95);
    float d = sdBox(p - sc, sh);
    float inside = 1.0 - smoothstep(-0.06, 0.06, d);
    vec2 q = (p - sc) / sh;
    float shutter = 0.94 + 0.06 * sin(uTime * 7.3) * sin(uTime * 2.9 + 1.0);
    // the projected light: brightest in the middle, the faint grain of film moving through the gate
    float grain = (h12(floor(p * 14.0) + floor(uTime * 24.0)) - 0.5) * 0.07;
    float light = (0.45 + 0.55 * (1.0 - dot(q * vec2(0.75, 0.9), q * vec2(0.75, 0.9))) + grain) * shutter;
    float streamers = 0.6 + 0.4 * pow(0.5 + 0.5 * sin(atan(q.y, q.x) * 11.0 + uTime * 0.15), 2.0);
    float corona = exp(-max(d, 0.0) / 3.2) * (1.0 - inside) * streamers;
    float frame = lineOf(sdArch(p - sc - vec2(0.0, 0.6), sh + vec2(1.1, 1.5), 4.5), 0.04) + lineOf(sdArch(p - sc - vec2(0.0, 0.9), sh + vec2(1.9, 2.2), 5.5), 0.02) * 0.6;
    // small deco fans blooming at the arch's two upper corners
    vec2 fc = vec2(abs(p.x) - (sh.x + 1.6), p.y - (sc.y + sh.y + 0.6));
    float fr = length(fc);
    float fans = smoothstep(2.6, 0.5, fr) * pow(0.5 + 0.5 * cos(atan(fc.x, fc.y) * 9.0), 8.0) * step(0.0, fc.y + 0.4);
    // the crown: a sunburst rising from the top of the arch
    vec2 cp = p - vec2(0.0, sc.y + sh.y + 1.6);
    float r = length(cp);
    float ang = atan(cp.x, cp.y);
    float rays = step(0.0, cp.y) * smoothstep(7.0, 1.2, r) * smoothstep(0.5, 1.4, r) * pow(0.5 + 0.5 * cos(ang * 16.0), 10.0);
    float arcs = step(0.0, cp.y) * (lineOf(r - 2.2, 0.02) + lineOf(r - 3.6, 0.02) * 0.7) * smoothstep(1.3, 0.9, abs(ang));
    // the curtains, drawn aside: velvet folds either side of the frame
    float side = abs(p.x) - (sh.x + 2.2);
    float curtain = smoothstep(-0.4, 0.4, side) * (1.0 - smoothstep(5.0, 8.0, side)) * smoothstep(sc.y + sh.y + 3.5, sc.y + sh.y + 1.5, p.y) * smoothstep(sc.y - sh.y - 4.0, sc.y - sh.y - 2.0, p.y);
    float folds = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(p.x * 2.2 + sin(p.y * 0.25) * 0.8), 1.6);
    vec3 silver = mix(uSilver, vec3(1.0, 0.86, 0.6), uFace * 0.55);
    vec3 velvet = mix(uVelvet * 0.6, uVelvet, uFace);
    vec3 col = silver * light * inside * 0.72 + silver * corona * 0.5 + uGold * (frame * 0.85 + rays * 0.55 + arcs * 0.5 + fans * 0.6) + velvet * curtain * folds;
    float a = clamp(inside * light * 0.72 + corona * 0.5 + frame * 0.85 + rays * 0.55 + arcs * 0.5 + fans * 0.6 + curtain * folds * 0.8, 0.0, 1.0);
    gl_FragColor = vec4(col / max(a, 1e-3), a * uWeight * uOpacity);
    ${OUT}
  }
`

/**
 * The projector's beam, from the booth above and behind the camera to the screen: four faces of a long
 * frustum, brightest near the lamp, hazy, faint. aT runs 0 at the lamp to 1 at the screen.
 */
export const PROJECTOR_VERT = /* glsl */ `
  attribute float aT;
  uniform float uTime;
  varying float vT;
  varying float vHaze;
  ${NOISE}
  void main() {
    vT = aT;
    vHaze = 0.5 + 0.5 * fbm(vec2(position.x * 0.12 + position.z * 0.05, position.y * 0.12 - uTime * 0.06));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const PROJECTOR_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  uniform float uOpacity;
  varying float vT;
  varying float vHaze;
  void main() {
    float a = (0.25 + 0.75 * (1.0 - vT)) * smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.85, vT) * vHaze;
    gl_FragColor = vec4(uColor, a * uWeight * uOpacity);
    ${OUT}
  }
`

// ── THE SUITE: THE MODERN LENS ──────────────────────────────────────────────

/**
 * Behind the Suite's tile, a cine lens seen down its barrel: the iris — nine curved blades round a
 * polygonal opening that opens as the camera arrives (uOpen) — the barrel's rim, and the coated glass's
 * reflections, violet and green, drifting as the camera leans. (The focus ring, with its engraved
 * distances, turns round it: a canvas texture, textures.ts focusRingTexture.)
 */
export const IRIS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const IRIS_FRAG = /* glsl */ `
  uniform float uOpen;
  uniform float uTime;
  uniform float uWeight;
  uniform vec3 uGold;
  uniform vec2 uLean;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float ang = atan(p.y, p.x) + uTime * 0.02;
    const float N = 9.0;
    float seg = 6.28318 / N;
    // the opening: a regular nine-sided polygon, the blades' straight inner edges
    float a0 = mod(ang, seg) - seg * 0.5;
    float radius = mix(0.2, 0.62, uOpen);
    float poly = radius * cos(seg * 0.5) / cos(a0);
    float open = 1.0 - smoothstep(poly - 0.004, poly + 0.004, r);
    // the blades, overlapping: each its own shade, their seams curving out from the opening's corners
    float twist = ang - (r - radius) * 1.6;
    float idx = floor(mod(twist, 6.28318) / seg);
    float blade = (1.0 - open) * (1.0 - smoothstep(0.9, 0.905, r));
    float shade = 0.55 + 0.45 * fract(sin(idx * 12.9898) * 43758.5453);
    float edge = exp(-pow((r - poly) / 0.01, 2.0)) * (1.0 - open * 0.5);
    float seamD = abs(fract(twist / seg) - 0.5) * seg * r;
    float seams = (1.0 - smoothstep(0.0, 0.006 + fwidth(seamD), seamD)) * blade * smoothstep(radius, radius + 0.05, r);
    // the barrel's rim
    float rim = exp(-pow((r - 0.93) / 0.012, 2.0)) + exp(-pow((r - 0.98) / 0.006, 2.0)) * 0.6;
    // the coated glass in the opening: two reflections, violet and green, drifting with the camera's lean
    vec2 g = p - uLean * 0.12;
    float refl = exp(-pow(length(g - vec2(-0.12, 0.1)) / 0.09, 2.0)) * 0.7 + exp(-pow(abs(length(g + vec2(0.05, 0.08)) - 0.22) / 0.015, 2.0)) * 0.5;
    vec3 col = uGold * (edge * 0.9 + rim * 0.8 + seams * 0.45) + vec3(0.07, 0.065, 0.085) * blade * shade
      + open * (vec3(0.55, 0.38, 0.95) * refl + vec3(0.3, 0.85, 0.6) * exp(-pow(length(g - vec2(0.16, -0.12)) / 0.06, 2.0)) * 0.6);
    float a = clamp(blade * (0.3 + 0.2 * shade) + edge * 0.9 + rim * 0.8 + seams * 0.45 + open * refl * 0.6, 0.0, 1.0);
    gl_FragColor = vec4(col / max(a, 1e-3), a * uWeight);
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
