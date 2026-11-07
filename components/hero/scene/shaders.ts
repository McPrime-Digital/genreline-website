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

/**
 * The universe travelling (universe.ts): the stars stream toward the camera, each wrapping round to the
 * far end of the field as it passes the near one, fading in and out at the ends so none pops.
 */
/**
 * A change of sky (universe.ts skyMotion): how much of the leaving sky (x) and of the arriving one (y) shows
 * at a point. Quiet by rule (the owner, 2026-11-07): no circles, no lines, no flash — only soft weights
 * (uFade: a crossfade, a push, a glide, a breath of dark, a rack focus), and two soft masks: a condense, the
 * new sky's clouds gathering out of the old through a large slow cloud of noise (n), and a bloom, each sky
 * by its own light (lum: the new brightest-first, the old faintest-first). Shared by the sky and the stars,
 * so the stars change with the clouds. Branchless: the change's numbers come from universe.ts.
 */
const CHANGE = /* glsl */ `
  uniform vec2 uFade;
  uniform float uCond;
  uniform float uBloom;
  uniform float uT;
  float ch21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  float cvn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(ch21(i), ch21(i + vec2(1.0, 0.0)), u.x), mix(ch21(i + vec2(0.0, 1.0)), ch21(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // the condense's cloud at a point of the screen (s: 0–1 across it; a: its width over its height): large, soft, slowly turning over
  float changeCloud(vec2 s, float a) {
    vec2 p = (s - 0.5) * vec2(a, 1.0);
    return smoothstep(0.12, 0.88, cvn(p * 2.1 + vec2(3.1, uT * 0.5)) * 0.65 + cvn(p * 5.2 - vec2(uT * 0.4, 7.7)) * 0.35);
  }
  vec2 changeAt(float n, float lumA, float lumB) {
    float t = uT * 1.7 - 0.35;
    float stay = smoothstep(t - 0.35, t + 0.35, n);
    float tb = 1.0 - 1.3 * uT;
    float ta = 1.3 * uT - 0.3;
    float mA = mix(1.0, stay, uCond) * mix(1.0, smoothstep(ta, ta + 0.3, lumA), uBloom);
    float mB = mix(1.0, 1.0 - stay, uCond) * mix(1.0, smoothstep(tb, tb + 0.3, lumB), uBloom);
    return uFade * vec2(mA, mB);
  }
`
const STREAM = /* glsl */ `
  uniform float uTravelled;
  uniform vec2 uField; // the field's far and near z
  vec3 streamed(vec3 p, out float edge) {
    float span = uField.y - uField.x;
    p.z = uField.x + mod(p.z - uField.x + uTravelled, span);
    edge = smoothstep(0.0, 14.0, p.z - uField.x) * smoothstep(0.0, 14.0, uField.y - p.z);
    return p;
  }
`

export const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTint;
  uniform float uTime;
  uniform float uPixel;
  uniform float uAspect;
  uniform float uRoll;
  uniform vec2 uStars;
  uniform float uStarSize;
  varying float vAlpha;
  varying float vTint;
  ${STREAM}
  ${CHANGE}
  // each sky has its own of the stars (most of them): a change shows the old sky's going, the new sky's coming
  float own(float seed) { return step(fract(sin(aPhase * 917.3 + seed * 13.7) * 43758.5453), 0.8); }
  void main() {
    float edge;
    vec4 mv = modelViewMatrix * vec4(streamed(position, edge), 1.0);
    // a spin turns the whole field
    float c = cos(uRoll);
    float s = sin(uRoll);
    mv.xy = mat2(c, s, -s, c) * mv.xy;
    float depth = -mv.z;
    gl_Position = projectionMatrix * mv;
    vec2 scr = gl_Position.xy / max(gl_Position.w, 1e-4) * 0.5 + 0.5;
    // a condense gathers the stars with the clouds; a bloom brings the bright ones first
    float bright = clamp((aSize / uStarSize - 0.45) / 2.2, 0.0, 1.0);
    vec2 m = changeAt(changeCloud(scr, uAspect), bright, bright);
    float shown = min(1.0, own(uStars.x) * m.x + own(uStars.y) * m.y);
    // most twinkle; a few pulse, slow and deep (the owner: "some pulsating")
    float pulsing = step(0.93, fract(aPhase * 13.71));
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 40.0);
    float pulse = 0.1 + 1.1 * pow(0.5 + 0.5 * sin(uTime * (0.45 + aPhase * 0.7) + aPhase * 23.0), 2.0);
    gl_PointSize = clamp(aSize * (1.0 + 0.6 * pulsing) * uPixel / max(depth, 0.1), 1.0, 8.5);
    vAlpha = mix(twinkle, pulse, pulsing) * shown * edge * smoothstep(2.0, 9.0, depth) * smoothstep(260.0, 120.0, depth);
    vTint = aTint;
  }
`

// ── THE DEEP SKY'S BRIGHT STARS, THROUGH A STAR FILTER ──────────────────────

/**
 * Small quads on the deep sky: a few bright stars drawn the way a cinematographer's star filter draws them,
 * four soft spikes (KIND 1). (KIND 0, far spiral galaxies, is no longer drawn: the owner, 2026-11-06, wants
 * nothing in the sky but stars and a subtle nebula.)
 */
export const SKYOBJ_VERT = /* glsl */ `
  attribute vec2 aCorner;
  attribute vec3 aCentre;
  attribute float aSize;
  attribute float aEra;
  attribute vec4 aLook; // turn, tilt, tint, phase
  uniform vec4 uEraW;
  uniform vec4 uEraZoom;
  uniform vec3 uZoomCentre;
  uniform float uTime;
  uniform float uRoll;
  varying vec2 vC;
  varying vec4 vLook;
  varying float vW;
  void main() {
    vec4 one = vec4(equal(vec4(aEra), vec4(0.0, 1.0, 2.0, 3.0)));
    float zoom = dot(one, uEraZoom);
    vW = dot(one, uEraW);
    vec3 c = uZoomCentre + (aCentre - uZoomCentre) * vec3(zoom, zoom, 1.0);
    vec4 mv = viewMatrix * vec4(c, 1.0);
    // they turn with the sky (universe.ts); their spikes stay square, as a lens's filter draws them
    float cr = cos(uRoll);
    float sr = sin(uRoll);
    mv.xy = mat2(cr, sr, -sr, cr) * mv.xy;
    mv.xy += aCorner * aSize * zoom;
    gl_Position = vW > 0.001 ? projectionMatrix * mv : vec4(4.0, 4.0, 0.0, 1.0);
    vC = aCorner;
    vLook = aLook;
  }
`
export const SKYOBJ_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vC;
  varying vec4 vLook;
  varying float vW;
  void main() {
    float c = cos(vLook.x);
    float s = sin(vLook.x);
    vec2 p = mat2(c, s, -s, c) * vC;
    #if KIND == 0
      // a spiral, tilted away: a bright bulge, two arms winding out, faint and warm-cored
      p.y /= max(0.25, vLook.y);
      float r = length(p);
      float th = atan(p.y, p.x);
      float arms = pow(0.5 + 0.5 * cos(2.0 * th - log(max(r, 0.02)) * 5.5), 3.0);
      float disc = exp(-r * 4.2) * (0.25 + 0.75 * arms);
      float bulge = exp(-r * r * 90.0);
      float a = (disc * 0.7 + bulge * 1.3) * smoothstep(1.0, 0.7, r);
      vec3 col = mix(vec3(0.62, 0.72, 1.0), vec3(1.0, 0.86, 0.62), clamp(bulge * 1.5 + vLook.z * 0.4, 0.0, 1.0));
      gl_FragColor = vec4(col, a * vW * uOpacity);
    #else
      // a star through a star filter: a hot core and four spikes, twinkling
      float r = length(p);
      float core = exp(-r * r * 160.0) * 1.6 + exp(-r * 9.0) * 0.35;
      float spikes = exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 3.2) + exp(-abs(p.x) * 70.0) * exp(-abs(p.y) * 3.2);
      float tw = 0.78 + 0.22 * sin(uTime * (0.9 + vLook.w) + vLook.w * 31.0);
      vec3 col = mix(vec3(0.75, 0.84, 1.0), vec3(1.0, 0.88, 0.7), vLook.z);
      gl_FragColor = vec4(col, (core + spikes * 0.55) * tw * vW * uOpacity * smoothstep(1.0, 0.85, max(abs(vC.x), abs(vC.y))));
    #endif
    ${OUT}
  }
`

// ── THE FILMS: EACH CINEMA'S PICTURE, IN ITS ERA'S LOOK ─────────────────────

/**
 * A film on a cinema's screen (films.ts gives the picture: the footage, or its still until it plays),
 * fitted into the screen with its own frame's shape, in its era's look (ERA):
 *  0 · THE SILENT ERA — a warm silver print: deep contrast, the lamp's flicker at sixteen frames a second,
 *      the gate weaving, scratches running down the print, dust, a heavy vignette.
 *  1 · THE GOLDEN AGE — three-strip Technicolor: rich and warm, the brights blooming (halation), a soft
 *      vignette.
 *  2 · TODAY — clean, a gentle grade.
 * Every era: a fine grain moving with the frames. Before any picture arrives, the screen glows with the
 * lamp's light alone. `uBright` lifts it when the visitor watches it (the cinema under the pointer).
 */
export const FILM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const FILM_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec2 uTexel;
  uniform float uTime;
  uniform float uWeight;
  uniform float uBright;
  uniform float uScreen;
  uniform float uFilm;
  varying vec2 vUv;
  float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float h2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  #ifdef CARD
  uniform float uBurn;
  uniform float uSheen;
  // smooth noise, for a burn whose edge creeps like burning film rather than in squares
  float vn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  #endif
  void main() {
    vec2 uvF = vUv;
    #ifdef LED
      // a curved LED wall, seen from inside its curve: its columns run the other way
      uvF.x = 1.0 - uvF.x;
    #endif
    #ifdef CARD
      // a card of film: the picture between two rows of perforations, the strip's black edge round it
      uvF = vec2(vUv.x, (vUv.y - 0.13) / 0.74);
    #endif
    // the film's frame inside the screen: pillarboxed or letterboxed to keep its own shape
    float r = uFilm / uScreen;
    vec2 q = (uvF - 0.5) * (r > 1.0 ? vec2(1.0, r) : vec2(1.0 / r, 1.0)) + 0.5;
    float inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
    float frame = floor(uTime * 24.0);
    vec3 c;
    #if ERA == 0
      float f16 = floor(uTime * 16.0);
      q += (vec2(h1(f16), h1(f16 + 3.1)) - 0.5) * vec2(0.0035, 0.0045);
      vec3 src = texture2D(uMap, q).rgb;
      float lum = smoothstep(0.03, 0.92, dot(src, vec3(0.3, 0.59, 0.11)));
      c = vec3(lum) * vec3(1.0, 0.94, 0.82);
      c *= 0.84 + 0.16 * h1(f16 * 1.7);
      float t2 = floor(uTime * 1.6);
      for (int i = 0; i < 3; i++) {
        float sx = h1(t2 + float(i) * 7.3);
        float on = step(0.45, h1(f16 + float(i) * 3.3));
        c += vec3(0.32) * smoothstep(0.0016, 0.0, abs(q.x - sx - 0.002 * sin(q.y * 9.0 + float(i)))) * on;
      }
      float dust = step(0.99935, h2(floor(q * vec2(240.0, 180.0)) + f16 * 13.0));
      c = mix(c, vec3(0.04), dust * 0.85);
      c *= smoothstep(0.95, 0.32, length((q - 0.5) * vec2(1.15, 1.0)));
    #elif ERA == 1
      c = texture2D(uMap, q).rgb;
      vec2 o = uTexel * 2.5;
      vec3 glow = (texture2D(uMap, q + o).rgb + texture2D(uMap, q - o).rgb + texture2D(uMap, q + vec2(o.x, -o.y)).rgb + texture2D(uMap, q + vec2(-o.x, o.y)).rgb) * 0.25;
      c += max(glow - 0.55, 0.0) * vec3(1.0, 0.58, 0.32) * 0.9;
      float l = dot(c, vec3(0.3, 0.59, 0.11));
      c = mix(vec3(l), c, 1.2) * vec3(1.06, 1.0, 0.9);
      c *= smoothstep(1.05, 0.4, length((q - 0.5) * vec2(1.1, 1.0)));
    #else
      c = texture2D(uMap, q).rgb;
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.35);
    #endif
    // before the picture arrives: the lamp's light alone
    c = mix(vec3(0.55, 0.52, 0.46) * smoothstep(0.9, 0.2, length(vUv - 0.5)), c, uHasMap);
    // the grain rides the picture's own light (added in linear light it would pepper the blacks)
    c *= 1.0 + (h2(gl_FragCoord.xy + frame * 17.0) - 0.5) * 0.16;
    c = max(c, 0.0) * uBright;
    #ifdef PROJECTED
      // thrown on the dark by the title's projector: the picture as faint light, its edges soft, the lamp's
      // flicker through it (drawn added to the sky)
      float soft = smoothstep(0.0, 0.05, q.x) * smoothstep(1.0, 0.95, q.x) * smoothstep(0.0, 0.07, q.y) * smoothstep(1.0, 0.93, q.y);
      float flick = 0.93 + 0.07 * sin(uTime * 41.0) * sin(uTime * 17.0);
      gl_FragColor = vec4(c * flick, inside * soft * uWeight);
    #elif defined(LED)
      // the wall itself: its LEDs a fine grid, its panels' seams, dark and idle beyond the picture
      vec2 led = fract(vec2(uvF.x * uScreen, uvF.y) * 160.0) - 0.5;
      float dots = 0.8 + 0.2 * smoothstep(0.5, 0.2, length(led));
      vec2 panel = fract(vec2(uvF.x * uScreen, uvF.y) * 6.0);
      float seam = 1.0 - 0.35 * (step(panel.x, 0.012) + step(panel.y, 0.018));
      vec3 idle = vec3(0.016, 0.018, 0.024) * (0.6 + 0.4 * smoothstep(0.0, 0.6, uvF.y));
      c = mix(idle, c, inside) * dots * seam;
      // its edges feathered into the dark (no hard frame round the picture)
      float feather = smoothstep(0.0, 0.035, uvF.x) * smoothstep(1.0, 0.965, uvF.x) * smoothstep(0.0, 0.05, uvF.y) * smoothstep(1.0, 0.95, uvF.y);
      gl_FragColor = vec4(c, uWeight * feather);
    #elif defined(CARD)
      // the strip round the picture: black, small rounded perforations along each edge lit from behind, its
      // corners rounded (uScreen is the picture's shape; the card is taller by its edges, 0.74 : 1)
      float ca = uScreen * 0.74;
      vec2 cp = (vUv - 0.5) * vec2(ca, 1.0);
      float aa = fwidth(cp.y) * 1.5;
      vec2 cb = abs(cp) - vec2(ca * 0.5, 0.5) + 0.03;
      float card = 1.0 - smoothstep(-aa, aa, length(max(cb, 0.0)) + min(max(cb.x, cb.y), 0.0) - 0.03);
      vec2 hp = vec2((fract(cp.x / 0.085 + 0.5) - 0.5) * 0.085, 0.435 - abs(cp.y));
      vec2 hq = abs(hp) - vec2(0.021, 0.026) + 0.008;
      float perf = 1.0 - smoothstep(-aa, aa, length(max(hq, 0.0)) + min(max(hq.x, hq.y), 0.0) - 0.008);
      // (in linear light: near black stays near black on screen, the holes a quiet glow — the strip frames the
      // picture, it never competes with the logo)
      vec3 strip = vec3(0.005, 0.005, 0.007) + vec3(0.9, 0.85, 0.75) * perf * 0.1;
      float pic = step(0.0, uvF.y) * step(uvF.y, 1.0);
      c = mix(strip, c, pic * inside);
      // the glass's sheen, and the burn as it leaves (from its trailing edge: uBurn below 0 burns from the
      // right, as a card thrown to the left; a glowing rim at the front of it)
      c += vec3(1.0) * exp(-pow((vUv.x + vUv.y * 0.3 - uSheen) * 9.0, 2.0)) * 0.12;
      vec2 nb = vUv * vec2(uScreen * 2.2, 2.4);
      float n = (vn(nb) * 0.6 + vn(nb * 2.7 + 7.1) * 0.4) * 0.38 + (uBurn < 0.0 ? 1.0 - vUv.x : vUv.x) * 0.62;
      float burn = abs(uBurn);
      float th = burn * 1.12;
      float keep = smoothstep(th - 0.012, th + 0.012, n);
      // the burning edge: a thin line of fire, a scorched brown band behind it
      float rim = (1.0 - smoothstep(0.0, 0.03, abs(n - th))) * step(0.001, burn);
      float scorch = (1.0 - smoothstep(0.0, 0.09, n - th)) * step(0.001, burn);
      c = mix(c, c * vec3(0.45, 0.28, 0.14), scorch * 0.8);
      c += vec3(1.0, 0.56, 0.2) * rim * 2.6;
      gl_FragColor = vec4(c, card * keep * uWeight);
    #else
      gl_FragColor = vec4(c, inside * uWeight);
    #endif
    ${OUT}
  }
`

/**
 * The Suite's shooting star (Station.tsx FloorCinema): a card arriving as a star, or leaving as one. One quad
 * facing the camera, stretched along the star's flight (uLen × uWid scene units, uv.x 0 at the tail's end, 1
 * at the head): a white-hot head with a four-point glint, a tail thinning and fading behind it. uFlare swells
 * the head (the burst as it opens into a card).
 */
export const COMET_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  uniform float uLen;
  uniform float uWid;
  uniform float uFlare;
  varying vec2 vUv;
  void main() {
    float x = vUv.x * uLen;
    float y = (vUv.y - 0.5) * uWid;
    float hx = uLen - uWid * 0.5;
    vec2 d = vec2(x - hx, y) / (uWid * 0.5);
    float r2 = dot(d, d);
    float head = exp(-r2 * 30.0 / (1.0 + uFlare * 3.0)) + 0.3 * exp(-r2 * 5.0 / (1.0 + uFlare));
    float glint = (exp(-abs(d.y) * 40.0) * exp(-abs(d.x) * 2.6) + exp(-abs(d.x) * 40.0) * exp(-abs(d.y) * 2.6)) * (0.5 + uFlare);
    float along = clamp(x / hx, 0.0, 1.0);
    float tail = exp(-y * y / (uWid * uWid * 0.012 * (0.15 + along))) * pow(along, 1.8) * step(x, hx);
    gl_FragColor = vec4(uColor, clamp(head + glint * 0.6 + tail * 0.7, 0.0, 1.0) * uWeight);
    ${OUT}
  }
`
/**
 * The light a Suite card throws on the floor at its foot: lying on the floor in front of the card (uv.y 1 at
 * the foot, 0 toward the camera), in the film's colour, fading away from the card and toward its sides.
 */
export const POOL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  varying vec2 vUv;
  void main() {
    float across = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    float a = exp(-(1.0 - vUv.y) * 3.4) * across * 0.34;
    gl_FragColor = vec4(uColor, a * uWeight);
    ${OUT}
  }
`

// ── THE TITLE'S PROJECTOR ───────────────────────────────────────────────────

/**
 * The one film thing left in the sky (the owner, 2026-11-06: "we keep the star that is shooting like a
 * projector which is below the hero heading - i want that to shoot a very faded subtle medium size screen
 * projection to above the heading"): a far lamp below the title, its faint beam, and the screen it throws
 * above the title, a film playing on it (projector.tsx). Drawn straight in clip space — corners in the
 * frame's own coordinates (uP0–uP3: bottom left, bottom right, top right, top left), so they sit exactly
 * where the page's words are measured.
 */
export const PROJ_VERT = /* glsl */ `
  attribute vec2 aCorner;
  uniform vec2 uP0;
  uniform vec2 uP1;
  uniform vec2 uP2;
  uniform vec2 uP3;
  varying vec2 vUv;
  void main() {
    vUv = aCorner;
    gl_Position = vec4(mix(mix(uP0, uP1, aCorner.x), mix(uP3, uP2, aCorner.x), aCorner.y), 0.0, 1.0);
  }
`
/** The lamp: a star with a four-point glint, its shutter flickering while it projects. */
export const PROJ_LAMP_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  uniform float uOn;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 d = (vUv - 0.5) * 2.0;
    float r2 = dot(d, d);
    float shutter = 1.0 - 0.18 * uOn * step(0.5, fract(uTime * 24.0));
    float core = exp(-r2 * 28.0) * 1.5 + exp(-r2 * 6.0) * (0.22 + 0.25 * uOn);
    float glint = (exp(-abs(d.y) * 48.0) * exp(-abs(d.x) * 3.2) + exp(-abs(d.x) * 48.0) * exp(-abs(d.y) * 3.2)) * (0.35 + 0.5 * uOn);
    gl_FragColor = vec4(uColor, clamp(core + glint, 0.0, 1.0) * shutter * uWeight);
    ${OUT}
  }
`
/**
 * The beam, from the lamp (P0 = P1) to the screen's two outermost corners as the lamp sees them (P2, P3):
 * brightest at the lamp, its edges soft, flickering faintly; uReach runs the light out to the screen as it
 * shoots.
 */
export const PROJ_BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uWeight;
  uniform float uReach;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float t = vUv.y;
    float across = vUv.x / max(t, 1e-3);
    float soft = smoothstep(0.0, 0.25, across) * smoothstep(1.0, 0.75, across);
    float lit = smoothstep(uReach, uReach - 0.06, t);
    float flicker = 0.9 + 0.1 * sin(uTime * 37.0) * sin(uTime * 23.0);
    float a = (0.22 + 0.78 * pow(1.0 - t, 2.0)) * smoothstep(0.0, 0.03, t) * soft * lit * flicker;
    gl_FragColor = vec4(uColor, a * uWeight);
    ${OUT}
  }
`

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
  uniform float uRoll;
  ${STREAM}
  void main() {
    vec3 off = uVel * uStretch;
    float len = length(off);
    if (len > 3.2) off *= 3.2 / len;
    float edge;
    vec3 p = streamed(position, edge) - off * aEnd;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float c = cos(uRoll);
    float s = sin(uRoll);
    mv.xy = mat2(c, s, -s, c) * mv.xy;
    gl_Position = projectionMatrix * mv;
    vAlpha = edge * (1.0 - aEnd) * smoothstep(0.35, 1.8, len) * smoothstep(2.5, 10.0, -mv.z) * smoothstep(140.0, 60.0, -mv.z);
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

    // the pointer gathers the stream: the particles near it settle into a ring round it, swaying
    // round it a little, and light up
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float dl = max(length(d), 1e-4);
    float push = uPointerOn * smoothstep(0.3, 0.02, dl);
    vec2 dir = d / dl;
    float ring = 0.075 + 0.05 * fract(aAngle * 7.31);
    vec2 moved = dir * mix(dl, ring, push * 0.7);
    float sway = push * 0.55 * sin(uTime * 0.9 + aAngle * 3.0);
    moved = mat2(cos(sway), sin(sway), -sin(sway), cos(sway)) * moved;
    ndc = uPointer + moved / vec2(uAspect, 1.0);
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    float depth = -mv.z;
    gl_PointSize = clamp(aSize * uPixel / max(depth, 0.1) * (1.0 + push * 1.6), 1.0, 14.0) + push * 1.5;
    vLit = push;
    float far = smoothstep(130.0, 50.0, depth);
    vAlpha = smoothstep(0.0, 0.015, u) * smoothstep(1.0, 0.985, u) * smoothstep(1.2, 5.0, depth) * mix(far, 1.0, push * 0.85);
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
  // the pointer: the line warms and brightens under it, a light shimmering along it there
  uniform vec2 uRes;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  float pointerDist() {
    vec2 d = (gl_FragCoord.xy / uRes - uPointer) * vec2(uRes.x / uRes.y, 1.0);
    return length(d);
  }
  float underPointer() {
    float r = pointerDist();
    return uPointerOn * exp(-r * r / 0.012);
  }
  // light running out along the line from under the pointer, in rings, like touching a live wire
  float shimmer() {
    return 0.45 + 0.55 * pow(0.5 + 0.5 * sin(pointerDist() * 90.0 - uTime * 7.0), 3.0);
  }
  // where the page's words sit (fractions of the frame from the top left), so the line steps back behind them
  uniform vec4 uMask;
  uniform float uMaskOn;
  uniform float uTrackY;
  uniform float uTrackOn;
  uniform float uTopY;
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
    float near = underPointer();
    float light = pulses() * 0.32 + head() * 0.8 + near * shimmer() * 1.2;
    vec3 c = uColor * (0.78 + 0.32 * facing);
    c = mix(c, uHot, clamp(light, 0.0, 1.0));
    c = mix(c, vec3(1.0, 0.97, 0.9), near * shimmer() * 0.55);
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
    float a = pow(facing, 2.4) * uOpacity * (1.0 + pulses() * 0.7 + head() * 1.6 + underPointer() * shimmer() * 3.2);
    a *= 1.0 - 0.9 * behindWords();
    gl_FragColor = vec4(uColor, a);
    ${OUT}
  }
`

// ── A SOFT NOISE, FOR THE FLOORS AND THE CINEMA ─────────────────────────────

/** Value noise and its fractal sum: low frequencies, cheap (the floors' and the cinema's textures). */
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
// ── THE DEEP SKY: PAINTED ONCE A SHOWING, SHOWN ALIVE ───────────────────────

/**
 * The deep sky (universe.ts, skybake.ts), round 6 (the owner, 2026-11-07: the skies were "full of nebula smudges
 * and nothing different … give me better and more advanced backgrounds"). Each showing is painted once, per
 * texel, into a picture of the whole sky — too costly to draw every frame on a laptop's graphics, nothing at
 * once — and shown every frame from it, two texture reads and a layer of fine stars.
 *
 * The painting is the same layers for every sky, weighted by its recipe (no branches: one program for all):
 * clouds warped through themselves (domain warping, after Inigo Quilez), thin threads where a warped noise
 * crosses zero (filaments), the Milky Way edge-on (its light in clumps of unresolved stars, lanes of dust down
 * its middle), dark dust and one sinuous dark cloud that hide what is behind them, a far glow from one side,
 * halos round a few bright stars. It stores √light (so the darks do not band in eight bits) and, in alpha,
 * how thick the fine stars are there.
 */
const SKY_NOISE = /* glsl */ `
  vec2 h22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }
`
export const SKYBAKE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`
export const SKYBAKE_FRAG = /* glsl */ `
  uniform vec3 uCol[6];
  uniform vec4 uL1;
  uniform vec4 uL2;
  uniform vec4 uShape;
  uniform vec4 uBandP;
  uniform vec4 uNebP;
  uniform vec4 uMore;
  uniform vec4 uGlints[6];
  uniform float uAspect;
  varying vec2 vUv;
  ${SKY_NOISE}
  // gradient noise, quintic, about −0.7…0.7
  float gn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = dot(h22(i) * 2.0 - 1.0, f);
    float b = dot(h22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
    float c = dot(h22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
    float d = dot(h22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
  // fractal sums, scaled to about −1…1
  float fbm(vec2 p, int n) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 7; i++) {
      if (i >= n) break;
      s += a * gn(p);
      p = ROT * p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return s * 3.2;
  }
  // the same, softer: each finer octave weaker, so the clouds billow rather than marble
  float fbmSoft(vec2 p, int n) {
    float s = 0.0;
    float a = 0.55;
    for (int i = 0; i < 7; i++) {
      if (i >= n) break;
      s += a * gn(p);
      p = ROT * p * 2.03 + vec2(4.1, 2.7);
      a *= 0.42;
    }
    return s * 3.4;
  }
  vec3 srgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  }
  void main() {
    // the sky's own frame: x across −0.84…0.84, y up −0.5…0.5
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float seed = uNebP.w;
    float clouds = uL1.x;
    float threads = uL1.y;
    float milky = uL1.z;
    float dusty = uL1.w;
    float glowing = uL2.x;
    float ribbon = uL2.y;
    float streaks = uL2.z;
    float halos = uL2.w;
    float cover = uShape.x;
    float scale = uShape.y;
    float starsAt = uShape.z;
    float split = uMore.x;

    // CLOUDS: warped through themselves, twice
    vec2 q = p * (3.0 / scale) + vec2(seed * 1.7, seed * 0.9);
    vec2 w1 = vec2(fbm(q, 4), fbm(q + vec2(5.2, 1.3), 4));
    vec2 w2 = vec2(fbm(q + 0.6 * w1 + vec2(1.7, 9.2), 4), fbm(q + 0.6 * w1 + vec2(8.3, 2.8), 4));
    // a broad soft body, its edges and its insides worked by the warped detail
    float body = fbmSoft(q * 0.45 + 3.3, 3);
    float h = mix(fbmSoft(q + 0.6 * w2, 5), body, 0.45);
    // where they lie: about their place, unevenly, over more or less of the sky
    vec2 c = (p - uNebP.xy) * vec2(0.8, 1.15);
    float region = fbm(p * 1.4 + seed * 0.37 + 11.0, 3) * 0.35 + (0.4 - length(c)) * 2.4 + (cover - 0.5) * 1.6;
    float lie = smoothstep(-0.5, 0.6, region);
    float dens = smoothstep(-0.35, 1.0, h) * lie;
    float core = smoothstep(0.55, 1.3, h) * lie;
    // fine streaks of dust through them (a reflection nebula)
    float sa = seed * 2.3;
    vec2 sp = mat2(cos(sa), sin(sa), -sin(sa), cos(sa)) * p;
    float st = fbm(sp * vec2(3.0, 34.0) + seed + w1 * 1.5, 4);
    dens *= mix(1.0, 0.45 + 0.55 * smoothstep(-0.7, 0.7, st), streaks);
    vec2 side = vec2(cos(uBandP.x + 1.2), sin(uBandP.x + 1.2));
    float mixAB = mix(smoothstep(-0.9, 0.9, w2.x + 0.5 * w1.y), smoothstep(-0.25, 0.25, dot(p - uNebP.xy, side)), split);
    vec3 cc = srgb(mix(uCol[1], uCol[0], mixAB));
    vec3 L = cc * dens * clouds * 1.0 + srgb(uCol[2]) * core * clouds * 0.45;

    // THREADS: where a warped noise crosses zero — long, fine, sinuous; they come and go along their length
    vec2 fq = p * (1.4 / scale) + seed * 0.61 + 0.45 * w1;
    // a slope under the noise draws its zero out into long sweeping arcs, not closed loops
    vec2 sweep = vec2(cos(seed * 1.9), sin(seed * 1.9));
    float n1 = fbm(fq, 3) + dot(p, sweep) * 2.2;
    float n2 = fbm(fq * 1.5 + 4.4, 3) + dot(p, sweep) * 2.6;
    float th = exp(-abs(n1) * 20.0) + 0.4 * exp(-abs(n2 - 0.25) * 26.0);
    float along = smoothstep(-0.1, 1.0, fbm(p * 1.8 + seed + 21.0, 3));
    float thLie = smoothstep(-0.6, 0.5, region + 0.3);
    th *= along * thLie;
    L += srgb(mix(uCol[0], uCol[1], smoothstep(-0.6, 0.6, n2) * (1.0 - split * 0.5) + split * mixAB * 0.5)) * th * threads * 0.5;
    L += srgb(uCol[2]) * th * th * threads * 0.1;

    // THE MILKY WAY, edge-on: a band of unresolved stars in clumps, its core warmer, dust down its middle
    vec2 dir = vec2(cos(uBandP.x), sin(uBandP.x));
    vec2 bp = p - uBandP.zw;
    float al = dot(bp, dir);
    float ac = dot(bp, vec2(-dir.y, dir.x)) + fbm(vec2(al * 2.4, 3.1) + seed, 3) * 0.035;
    float bw = 0.1 * uBandP.y;
    float prof = exp(-pow(ac / bw, 2.0));
    float inner = exp(-pow(ac / (bw * 0.42), 2.0));
    float bulge = exp(-pow((al - uMore.y) / 0.42, 2.0));
    float clumps = smoothstep(-0.6, 1.0, fbm(vec2(al * 7.0, ac * 18.0) + seed * 1.3, 6));
    float lanes = smoothstep(-0.05, 0.45, fbm(vec2(al * 4.2, ac * 15.0) + seed * 2.1 + 7.0, 6)) * exp(-pow((ac - 0.008) / (bw * 0.55), 2.0));
    float band = prof * (0.2 + 0.8 * clumps) * (0.5 + 0.5 * bulge) * (1.0 - 0.88 * lanes);
    L += srgb(mix(uCol[4], uCol[3], inner * (0.35 + 0.65 * bulge))) * band * milky * 0.4;

    // the fine stars: thicker in star clouds, thickest along the band
    float sc = fbm(p * 4.0 + seed * 0.5 + 50.0, 4);
    float starD = starsAt * (0.35 + 0.65 * smoothstep(-0.9, 0.9, sc)) + band * milky * 1.1 + dens * clouds * 0.25;

    // HALOS: blue light scattered round a few bright stars
    for (int i = 0; i < 6; i++) {
      vec4 g = uGlints[i];
      vec2 d = (vUv - g.xy) * vec2(uAspect, 1.0);
      L += srgb(uCol[2]) * exp(-dot(d, d) / 0.0016) * g.z * g.w * halos * 0.35;
    }

    // DUST: dark clouds, and one sinuous dark cloud, hiding the light and the stars behind them
    vec2 dq = p * (2.6 / scale) + seed * 0.83 + 0.6 * w2;
    float dn = fbm(dq, 6);
    float dust = smoothstep(0.2, 0.85, dn) * dusty;
    float rn = fbm(p * 1.35 + seed * 0.29 + 31.0, 4);
    float wisp = smoothstep(-0.4, 0.7, fbm(p * 9.0 + seed + 4.0, 4));
    float rib = smoothstep(0.26, 0.05, abs(rn)) * (0.55 + 0.45 * wisp) * ribbon;
    dust = max(dust, rib);
    float rim = (smoothstep(0.36, 0.26, abs(rn)) - smoothstep(0.26, 0.16, abs(rn))) * ribbon;
    L *= 1.0 - 0.9 * dust;
    starD *= 1.0 - 0.94 * dust;
    L += srgb(uCol[2]) * rim * (0.4 + 0.6 * wisp) * 0.06;

    // THE FAR GLOW: a wide soft light from one side (the galaxy's own, or the zodiac's)
    float gx = dot(p, vec2(cos(uNebP.z), sin(uNebP.z)));
    L += srgb(uCol[5]) * pow(smoothstep(-0.25, 0.95, gx), 2.2) * glowing * 0.2 * (1.0 - 0.6 * dust);

    L *= uShape.w;
    gl_FragColor = vec4(sqrt(clamp(L, 0.0, 1.0)), clamp(starD, 0.0, 1.0));
  }
`

/**
 * Showing the painted skies: the leaving one (A) and the arriving one (B), each moved by the change and by its
 * own slow life (universe.ts skyMotion; uT*: offset, zoom, turn about the gaze, per vertex — a straight move,
 * so the grid carries it exactly), softened by a rack focus (mip bias), each with its fine stars and its bright
 * stars, drawn in the sky's own frame so they move with it, and crossed by the change (CHANGE).
 */
export const GALAXY_VERT = /* glsl */ `
  uniform vec2 uCentre;
  uniform float uSkyAspect;
  uniform vec4 uTA;
  uniform vec4 uTB;
  uniform vec2 uSeeds;
  uniform vec2 uFlow;
  uniform float uTime;
  uniform float uLive;
  varying vec2 vUvA;
  varying vec2 vUvB;
  varying vec2 vCloudA;
  varying vec2 vCloudB;
  varying vec2 vLight;
  float lh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ln(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(lh(i), lh(i + vec2(1.0, 0.0)), f.x), mix(lh(i + vec2(0.0, 1.0)), lh(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  // the clouds' slow churn: where on its picture each point of the sky reads its clouds, drifting a few pixels,
  // a large slow swell and a finer one (the stars do not churn: they read the sky where it is)
  vec2 swell(vec2 q, float seed, float t) {
    vec2 a = vec2(ln(q * 3.5 + seed + vec2(t * 0.03, 0.0)), ln(q * 3.5 + seed + vec2(5.2, 1.3 - t * 0.026)));
    vec2 b = vec2(ln(q * 8.0 + seed + vec2(9.1, t * 0.045)), ln(q * 8.0 + seed + vec2(2.7 - t * 0.04, 6.6)));
    return a * 0.01 + b * 0.004;
  }
  // (both start from nothing: at the first moment the clouds are exactly as painted — and as the poster shows)
  vec2 churn(vec2 uv, float seed, float flow) {
    vec2 q = uv * vec2(uSkyAspect, 1.0);
    return (swell(q, seed, uTime * flow) - swell(q, seed, 0.0)) * uLive * flow;
  }
  // the clouds' light wandering: a large soft swell of more and less passing slowly across them
  float wander(vec2 uv, float seed) {
    vec2 q = uv * vec2(uSkyAspect, 1.0) * 1.7 + seed * 0.3;
    return 1.0 + (ln(q + vec2(uTime * 0.011, -uTime * 0.008)) - ln(q)) * 0.38 * uLive;
  }
  vec2 moved(vec2 uv, vec4 t) {
    vec2 d = (uv - uCentre) * vec2(uSkyAspect, 1.0) / t.z;
    float c = cos(t.w);
    float s = sin(t.w);
    d = mat2(c, s, -s, c) * d;
    return uCentre + d / vec2(uSkyAspect, 1.0) - t.xy;
  }
  void main() {
    vUvA = moved(uv, uTA);
    vUvB = moved(uv, uTB);
    vCloudA = vUvA + churn(vUvA, uSeeds.x, uFlow.x);
    vCloudB = vUvB + churn(vUvB, uSeeds.y, uFlow.y);
    vLight = vec2(wander(vUvA, uSeeds.x), wander(vUvB, uSeeds.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const GALAXY_FRAG = /* glsl */ `
  uniform sampler2D uMapA;
  uniform sampler2D uMapB;
  uniform vec2 uBlur;
  uniform vec2 uSeeds;
  uniform vec4 uGA[6];
  uniform vec4 uGB[6];
  uniform vec2 uGrid;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  varying vec2 vUvA;
  varying vec2 vUvB;
  varying vec2 vCloudA;
  varying vec2 vCloudB;
  varying vec2 vLight;
  ${CHANGE}
  ${SKY_NOISE}
  float inside(vec2 uv) {
    vec2 e = smoothstep(vec2(0.0), vec2(0.05), uv) * smoothstep(vec2(1.0), vec2(0.95), uv);
    return e.x * e.y;
  }
  // the fine stars: one at most in each small cell of the sky, most faint, a few bright (a steep power law),
  // white on average, some warm, some cool; a point of light about a pixel across, whatever the zoom
  vec3 fine(vec2 uv, float density, float seed) {
    vec2 g = uv * uGrid;
    vec2 id = floor(g);
    vec2 r = h22(id + seed * 17.0);
    vec2 r2 = h22(id + seed * 17.0 + 91.7);
    vec2 px = (fract(g) - (0.2 + 0.6 * r2)) / max(fwidth(g), vec2(1e-5));
    float b = 0.1 + 0.9 * pow(r.y, 7.0);
    vec3 tint = mix(mix(uCool, vec3(1.0), 0.5), mix(uWarm, vec3(1.0), 0.4), fract(r.y * 13.7 + r2.x));
    // (a touch wider than a pixel, so a star gliding with the sky never flickers on the pixel grid)
    return tint * step(r.x, density * (0.02 + 0.16 * density)) * b * exp(-dot(px, px) / (0.95 * uDpr * uDpr)) * 0.62;
  }
  // the bright stars: a point and a little glow
  vec3 bright(vec2 uv, vec4 g[6]) {
    vec2 perPx = max(fwidth(uv), vec2(1e-6));
    vec3 l = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      vec2 d = (uv - g[i].xy) / perPx / uDpr;
      float r2 = dot(d, d);
      l += vec3(0.95, 0.97, 1.0) * g[i].z * (exp(-r2 / 0.9) * 0.85 + exp(-sqrt(r2) / 3.0) * 0.07);
    }
    return l;
  }
  void main() {
    vec4 a = texture(uMapA, vCloudA, uBlur.x);
    vec4 b = texture(uMapB, vCloudB, uBlur.y);
    vec2 s = gl_FragCoord.xy / uRes;
    vec2 m = changeAt(changeCloud(s, uRes.x / uRes.y), clamp(dot(a.rgb, vec3(0.3, 0.5, 0.2)) * 4.0, 0.0, 1.0), clamp(dot(b.rgb, vec3(0.3, 0.5, 0.2)) * 4.0, 0.0, 1.0));
    vec3 A = a.rgb * a.rgb * vLight.x + (fine(vUvA, a.a, uSeeds.x) + bright(vUvA, uGA)) * (1.0 - smoothstep(0.6, 2.2, uBlur.x));
    vec3 B = b.rgb * b.rgb * vLight.y + (fine(vUvB, b.a, uSeeds.y) + bright(vUvB, uGB)) * (1.0 - smoothstep(0.6, 2.2, uBlur.y));
    vec3 L = A * m.x * inside(vUvA) + B * m.y * inside(vUvB);
    // a whisper of noise against banding (a hash without sin: sin of large numbers stripes on some GPUs)
    L += (h22(gl_FragCoord.xy).x - 0.5) * (1.5 / 255.0);
    gl_FragColor = vec4(max(L, 0.0), 1.0);
  }
`

/**
 * Each space's floor, below it: the Crew's soundstage, the Client's cinema,
 * the Suite's light table of frames.
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
  uniform float uHouse;
  uniform vec3 uSpill;
  uniform sampler2D uAtlas;
  uniform float uHasAtlas;
  uniform vec3 uRoom;
  uniform float uAisle;
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
      // THE CINEMA'S FLOOR (the Client; the owner, 2026-11-06: "i like the previous floor i just needed you to
      // improve it more"): round 3's polished floor with the gold art-deco fan inlaid in it, radiating from
      // the foot of the screen, and two rows of aisle lights converging on it — refined: the inlay in fine
      // gold lines, a slow gleam travelling over it, and the film's light reflected in the polish, a long soft
      // streak in its own colour. Dark under the room, so the sky doesn't show through it. Premiere night
      // (uFace, the Stakeholders): the aisle a red carpet, its lights gold. Drawn with premultiplied alpha (rgb
      // the light it adds, alpha the dark). (+y runs away from the camera; the screen stands at y = uRoom.y,
      // the room is open at y = uRoom.z, its walls at x = ±uRoom.x.)
      if (abs(p.x) > uRoom.x + 1.0 || p.y > uRoom.y + 0.5 || p.y < uRoom.z - 9.0) discard;
      float inRoom = smoothstep(uRoom.x + 1.0, uRoom.x - 1.5, abs(p.x)) * smoothstep(uRoom.z - 8.0, uRoom.z + 2.0, p.y) * step(p.y, uRoom.y);
      vec2 d = p - vec2(0.0, uRoom.y);
      float r = length(d);
      float ang = atan(d.x, -d.y);
      float front = step(d.y, 0.0) * smoothstep(34.0, 24.0, r);
      // the fan: fine gold spokes and three steps of arc, inlaid
      float arcLen = abs(fract(ang * 22.0 / 6.2832 + 0.5) - 0.5) * (6.2832 / 22.0) * r;
      float spokes = (1.0 - smoothstep(0.0, fwidth(arcLen) * 1.2 + 0.012, arcLen)) * smoothstep(4.5, 8.0, r) * 0.5;
      float steps = 0.0;
      for (int i = 0; i < 3; i++) {
        float rr = i == 0 ? 6.5 : i == 1 ? 12.0 : 18.5;
        steps += (1.0 - smoothstep(0.0, fwidth(r) * 1.2 + 0.01, abs(r - rr))) * (1.0 - float(i) * 0.2);
      }
      float fan = (spokes + steps * 0.8) * front;
      // a gleam travelling slowly out over the polished inlay
      float gleam = exp(-pow((r - mod(uTime * 2.2, 40.0)) / 2.6, 2.0));
      // the aisle: two rows of small lights converging on the screen
      float lights = 0.0;
      for (int i = 0; i < 12; i++) {
        float t = float(i) / 11.0;
        float y = mix(uRoom.z - 6.0, uRoom.y - 4.0, t);
        float x = mix(3.8, 1.7, t);
        vec2 a1 = vec2(abs(p.x) - x, p.y - y);
        lights += exp(-dot(a1, a1) / 0.04) * (0.85 + 0.15 * sin(uTime * 1.3 + t * 9.0));
      }
      float aisle = (1.0 - smoothstep(1.4, 2.0, abs(p.x) - (uRoom.y - p.y) * 0.025)) * step(p.y, uRoom.y - 2.0) * smoothstep(uRoom.z - 8.0, uRoom.z + 4.0, p.y);
      // the film's light reflected in the polish: a long soft streak toward the camera, in its own colour
      float refl = exp(-pow(p.x / (uRoom.x * 0.62), 2.0)) * exp(-(uRoom.y - p.y) / 9.0) * step(p.y, uRoom.y) * (0.85 + 0.15 * sin(p.y * 1.7 - uTime * 0.8));
      vec3 gold = mix(uColor, vec3(1.0, 0.86, 0.6), 0.25);
      vec3 warm = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.86, 0.55), uFace);
      vec3 L = gold * fan * (0.55 + 1.1 * gleam) * 0.5
             + uSpill * refl * 0.045
             + warm * lights * (0.45 + 0.55 * uHouse) * 0.9
             + vec3(0.42, 0.04, 0.06) * aisle * uFace * 0.45;
      gl_FragColor = vec4(L * uWeight, inRoom * 0.92 * uWeight);
      ${OUT}
      return;
    #else
      // THE SUITE'S FLOOR (today): a light table of film frames running to the horizon, the work moving
      // through the Suite row by row (the owner, 2026-11-06: a floor that embodies what the Suite stands for)
      // — nearest, the script; then the storyboards; then frames being generated, resolving out of noise;
      // farthest, finished frames, graded and letterboxed (stills of the tour's films). A slow wave of light
      // runs away across it, carrying each frame a stage further as it passes. (+y runs away from the camera.)
      vec2 cell = vec2(5.4, 3.3);
      vec2 g = (p + vec2(0.0, 40.0)) / cell;
      vec2 id = floor(g);
      vec2 fp = (fract(g) - 0.5) * cell;
      vec2 halfF = cell * 0.5 - vec2(0.42, 0.38);
      vec2 dd = abs(fp) - halfF;
      float box = max(dd.x, dd.y);
      float aa = fwidth(box) * 1.2 + 0.005;
      float inFrame = 1.0 - smoothstep(-aa, aa, box);
      float edge = (1.0 - smoothstep(0.0, aa * 1.6 + 0.025, abs(box)));
      vec2 fuv = fp / (halfF * 2.0) + 0.5;
      float cy = (id.y + 0.5) * cell.y - 40.0;
      float hsh = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
      // the wave, and each frame's stage (0 script, 1 boards, 2 generating, 3 finished)
      float wave = mod(uTime * 3.2, 96.0) - 44.0;
      float lit = exp(-pow((cy - wave) / 3.6, 2.0));
      float stage = clamp(floor((cy + 30.0) / 15.0 + step(wave - 7.0, cy) * step(cy, wave) * 1.0), 0.0, 3.0);
      vec3 pic;
      if (stage < 0.5) {
        // a page of script: the lines of a scene, a slug line, dialogue indented
        float row = floor(fuv.y * 9.0);
        float inRow = step(0.3, fract(fuv.y * 9.0)) * step(fract(fuv.y * 9.0), 0.62);
        float len = 0.25 + 0.6 * fract(sin((row + hsh * 40.0) * 7.31) * 437.58);
        float indent = mod(row, 3.0) == 1.0 ? 0.28 : 0.08;
        float txt = inRow * step(indent, fuv.x) * step(fuv.x, indent + len) * step(0.06, fuv.y) * step(fuv.y, 0.94);
        // (light on dark: the floor adds light, so ink must glow — a script lit from beneath)
        pic = vec3(0.1, 0.09, 0.08) + vec3(0.95, 0.9, 0.78) * txt * 0.85;
      } else if (stage < 1.5) {
        // a storyboard panel: graphite on paper — a horizon, a figure, a sun or a moon
        float hz = 0.36 + 0.2 * hsh;
        float line = 1.0 - smoothstep(0.0, 0.025, abs(fuv.y - hz - 0.05 * sin(fuv.x * 6.0 + hsh * 9.0)));
        vec2 c = fuv - vec2(0.25 + 0.5 * fract(hsh * 7.0), hz + 0.25);
        float disc = 1.0 - smoothstep(0.0, 0.02, abs(length(c * vec2(1.6, 1.0)) - 0.09));
        float fig = (1.0 - smoothstep(0.0, 0.02, abs(fuv.x - 0.62 - 0.1 * hsh))) * step(hz - 0.3, fuv.y) * step(fuv.y, hz);
        float hatch = step(0.86, fract((fuv.x + fuv.y) * 18.0)) * step(fuv.y, hz) * 0.35;
        pic = vec3(0.08, 0.08, 0.1) + vec3(0.78, 0.82, 0.92) * clamp(line + disc + fig + hatch, 0.0, 1.0) * 0.8;
      } else {
        // a frame of film (the stills of the tour's films): generating — resolving out of noise and blur —
        // or finished, graded and letterboxed
        float i = mod(id.x * 3.0 + id.y * 5.0, 16.0);
        vec2 a = (vec2(mod(i, 4.0), floor(i / 4.0)) + clamp(fuv, 0.02, 0.98)) / vec2(4.0, 4.0);
        a.y = 1.0 - a.y;
        float gen = stage < 2.5 ? 0.55 + 0.45 * sin(uTime * 0.8 + hsh * 6.0) : 0.0;
        vec3 film = texture(uAtlas, a, gen * 5.0).rgb;
        vec3 warm = mix(vec3(0.5, 0.36, 0.24), vec3(0.85, 0.7, 0.5), fuv.y);
        film = mix(warm, film, uHasAtlas);
        float n = fract(sin(dot(floor(fuv * vec2(48.0, 30.0)) + floor(uTime * 12.0), vec2(41.3, 289.1))) * 15731.743);
        film = mix(film, vec3(n), gen * 0.55);
        float bars = stage > 2.5 ? step(0.12, fuv.y) * step(fuv.y, 0.88) : 1.0;
        pic = film * bars * 1.05;
      }
      float fade = smoothstep(uSize.y * 0.5, uSize.y * 0.08, abs(p.y + uSize.y * 0.06)) * smoothstep(uSize.x * 0.5, uSize.x * 0.12, abs(p.x));
      vec3 col = pic + uColor * (edge * (0.35 + 1.4 * lit) + inFrame * lit * 0.25);
      a = (inFrame * (0.85 + 0.7 * lit) + edge * (0.4 + lit)) * fade;
      gl_FragColor = vec4(col / max(a, 1e-3) * a, a * uWeight * uOpacity);
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

// ── THE CLIENT: THE CINEMA ──────────────────────────────────────────────────

/**
 * The Client's cinema: a modern auditorium with its house lights down (the owner, 2026-11-06: "push the cinema
 * back just a little bit … redesign it and make it properly advanced cinema with dim lights"). The screen spans
 * the wall at the film's own 2.39 : 1 (cinema.tsx draws the film). The room round it is dark, and its walls
 * dissolve into space the farther they are from the screen, so the sky still shows at the edges. Its lights
 * are few and dim: sconces washing the side walls up and down, fibre-optic stars in the ceiling, the floor's
 * gold deco fan and its aisle lights (STRUCTURE_FRAG mode 1), the film's own light on the wall round it.
 * No seats (the owner, 2026-11-06). Premiere night (uFace, the Stakeholders) turns the lights gold.
 *
 * One program per part (PART): 0 the screen wall, 1 the side walls, 2 the ceiling. Each part's uv runs 0–1
 * across it (each part says which way). Drawn with premultiplied alpha: rgb is the light a part adds, alpha
 * how much of the sky behind it the room hides.
 */
export const HALL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const HALL_FRAG = /* glsl */ `
  uniform vec2 uSize;
  uniform vec2 uScreen;
  uniform vec2 uOffset;
  uniform float uTime;
  uniform float uWeight;
  uniform float uFace;
  uniform float uHouse;
  uniform vec3 uSpill;
  uniform vec3 uLamp;
  uniform vec3 uGold;
  varying vec2 vUv;
  float h12(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    // the house lights: down while the film plays (uHouse), gold on premiere night
    vec3 lamp = mix(uLamp, uGold, uFace * 0.8) * (0.4 + 0.6 * uHouse);
    vec3 L = vec3(0.0);
    float k = 0.0;
    #if PART == 0
      // THE SCREEN WALL (p from the wall's middle, s from the screen's): black velour round the screen, the
      // film's light caught on it nearest the screen and in the seams of its panels, a thin line of light
      // either side of the screen, and the stage's edge below it
      vec2 s = p - uOffset;
      vec2 q = abs(s) - uScreen;
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
      float off = smoothstep(-0.02, 0.05, d);
      vec2 e = uSize * 0.5 - abs(p);
      float fade = smoothstep(0.0, 2.0, e.x) * smoothstep(0.0, 2.5, e.y);
      k = off * mix(0.55, 0.96, exp(-max(d, 0.0) / 5.0)) * fade;
      // (uSpill is the film's hue at full strength: the velour takes only a trace of it)
      float bounce = exp(-max(d, 0.0) / 1.6) * off;
      float seam = 1.0 - smoothstep(0.03, 0.09, abs(fract(s.x / 2.4 + 0.5) - 0.5) * 2.4);
      L += uSpill * bounce * (0.018 + 0.03 * seam * bounce);
      float side = abs(s.x) - uScreen.x - 1.4;
      float strip = exp(-side * side / 0.004) * smoothstep(-uScreen.y - 2.6, -uScreen.y, s.y) * smoothstep(uScreen.y + 2.0, uScreen.y, s.y);
      float stage = exp(-pow(s.y + uScreen.y + 1.1, 2.0) / 0.006) * smoothstep(uScreen.x + 1.5, uScreen.x - 2.0, abs(s.x));
      L += lamp * (strip * 0.5 + stage * 0.3) * fade;
    #elif PART == 1
      // THE SIDE WALLS (u from the screen's end, v from the floor): sconces washing the wall up and down,
      // the film's light nearest the screen; the wall fading away from it
      float t = vUv.x * uSize.x;
      float v = vUv.y * uSize.y;
      k = 0.9 * exp(-t / 10.0) * smoothstep(uSize.x, uSize.x * 0.6, t) * smoothstep(0.0, 1.5, v) * smoothstep(uSize.y, uSize.y - 3.0, v);
      for (int i = 0; i < 4; i++) {
        vec2 r = vec2(t, v) - vec2(2.6 + float(i) * 4.6, 7.4);
        float w = 0.24 + 0.3 * abs(r.y);
        float wash = exp(-pow(r.x / w, 2.0)) * exp(-abs(r.y) / 3.6);
        float fixture = exp(-(r.x * r.x / 0.02 + r.y * r.y / 0.2));
        L += lamp * (wash * 0.55 + fixture * 1.8) * smoothstep(uSize.x, uSize.x * 0.5, t);
      }
      L += uSpill * 0.02 * exp(-t / 4.0) * smoothstep(1.0, 6.0, v);
    #elif PART == 2
      // THE CEILING (u across, v from the screen's end): fibre-optic stars, twinkling, the room's dark
      // fading toward its open end, so its stars run on into the sky's
      float t = vUv.y * uSize.y;
      float ex = uSize.x * 0.5 - abs(p.x);
      k = 0.86 * exp(-t / 9.0) * smoothstep(0.0, 2.0, ex) * smoothstep(uSize.y, uSize.y * 0.55, t);
      vec2 g = vec2(p.x, t) / 0.9;
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5 - (vec2(h12(id), h12(id + 7.3)) - 0.5) * 0.7;
      float rad = max(0.07, fwidth(g.x) * 0.9);
      float tw = 0.55 + 0.45 * sin(uTime * (0.5 + h12(id + 3.1) * 1.5) + h12(id + 9.2) * 6.2832);
      float star = smoothstep(rad, 0.0, length(f)) * (0.07 / rad) * step(0.5, h12(id + 1.7)) * tw;
      L += mix(vec3(0.82, 0.86, 1.0), lamp * 1.8, 0.35 + 0.4 * uFace) * star * 1.6 * smoothstep(uSize.y, uSize.y * 0.4, t);
      // a cove of light where the ceiling meets the screen wall
      L += lamp * exp(-t / 0.6) * 0.3 * smoothstep(0.0, 4.0, ex);
    #endif
    gl_FragColor = vec4(L * uWeight, k * uWeight);
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
