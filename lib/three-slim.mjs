/**
 * THREE, SLIMMED FOR THE HERO (batch W-3D-1 §6: the 3D bundle under 250 KB
 * gzipped). next.config.mjs points the browser build's `three` at this file.
 *
 * React Three Fiber imports the whole three namespace (`import * as THREE`)
 * and registers every export as a JSX element, so no bundler can drop any of
 * three — R3F and three alone measured 250 KB gzipped, the whole budget. This
 * file is that namespace, cut to what R3F's own code reads and what the hero
 * uses; everything else in three falls away (R3F + three: 208 KB).
 *
 * Adding a three class to the hero means adding it here. A name missing here
 * fails the build ("export … was not found"), never the page.
 * The path is relative so the `three` alias cannot point this file at itself.
 */
export {
  // read by @react-three/fiber itself
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, Raycaster, Vector2, Vector3, Layers, Object3D, Color,
  ColorManagement, SRGBColorSpace, LinearSRGBColorSpace, NoToneMapping, ACESFilmicToneMapping,
  PCFSoftShadowMap, PCFShadowMap, VSMShadowMap, BasicShadowMap, UnsignedByteType, RGBAFormat, ShaderMaterial,
  // read by @react-three/drei's Billboard, kept for the next shot that wants it
  Quaternion,
  // the hero's scene
  Group, Mesh, Sprite, SpriteMaterial, Points, LineLoop, LineSegments, LineBasicMaterial, MeshBasicMaterial,
  BufferGeometry, BufferAttribute, Float32BufferAttribute, TubeGeometry, PlaneGeometry, CylinderGeometry, CatmullRomCurve3,
  Texture, CanvasTexture, VideoTexture, DataTexture, FloatType, NearestFilter, LinearFilter, LinearMipmapLinearFilter,
  AdditiveBlending, NormalBlending, Vector4, DoubleSide, FrontSide, BackSide,
} from '../node_modules/three/src/Three.js'

/**
 * three's Clock, unchanged except that it does not log. three r183 deprecated
 * Clock in favour of Timer and warns from its constructor; @react-three/fiber
 * 9.8 still builds one for every canvas, so the warning came from R3F, not
 * from anything the hero does, and was the only line the hero put in the
 * console (batch W-3D-1 §6: no console errors). Same fields, same methods,
 * same arithmetic as node_modules/three/src/core/Clock.js. Drop this the day
 * R3F moves to Timer.
 */
export class Clock {
  constructor(autoStart = true) {
    this.autoStart = autoStart
    this.startTime = 0
    this.oldTime = 0
    this.elapsedTime = 0
    this.running = false
  }
  start() {
    this.startTime = performance.now()
    this.oldTime = this.startTime
    this.elapsedTime = 0
    this.running = true
  }
  stop() {
    this.getElapsedTime()
    this.running = false
    this.autoStart = false
  }
  getElapsedTime() {
    this.getDelta()
    return this.elapsedTime
  }
  getDelta() {
    let diff = 0
    if (this.autoStart && !this.running) {
      this.start()
      return 0
    }
    if (this.running) {
      const newTime = performance.now()
      diff = (newTime - this.oldTime) / 1000
      this.oldTime = newTime
      this.elapsedTime += diff
    }
    return diff
  }
}
