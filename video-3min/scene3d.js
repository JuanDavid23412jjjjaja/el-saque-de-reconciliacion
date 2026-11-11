// scene3d.js - Renderizador WebGL: coliseo + personajes + coreografia. renderFrame(t) es determinista.
import { CharacterBuilder } from './characters.js';
import { World } from './world.js';
import { Story } from './story.js';
const THREE = window.THREE;

export class Scene3D {
  constructor(canvas, logo) {
    this.canvas = canvas;
    const W = canvas.width, H = canvas.height;
    this.W = W; this.H = H;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = r;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060912);
    this.scene.fog = new THREE.FogExp2(0x0a1022, 0.012);
    this.camera = new THREE.PerspectiveCamera(36, W / H, 0.15, 90);
    this.builder = new CharacterBuilder(THREE);
    this.world = new World(this.scene, logo);
    this.story = new Story(this.world, this.builder, this.scene);
    this._v = new THREE.Vector3();
    this._fixColors();
  }
  // three r128: los colores hex y las texturas de canvas deben pasarse a espacio lineal para no verse lavados
  _fixColors() {
    const seen = new Set();
    this.scene.traverse(n => {
      const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : [];
      for (const m of ms) {
        if (seen.has(m)) continue; seen.add(m);
        if (m.color) m.color.convertSRGBToLinear();
        if (m.map && m.map.encoding !== THREE.sRGBEncoding) { m.map.encoding = THREE.sRGBEncoding; m.map.needsUpdate = true; }
        m.needsUpdate = true;
      }
      if (n.isLight && n.color) n.color.convertSRGBToLinear();
      if (n.isHemisphereLight) n.groundColor.convertSRGBToLinear();
    });
    this.scene.background.convertSRGBToLinear(); this.scene.fog.color.convertSRGBToLinear();
  }
  renderFrame(t, drawBoard) {
    this.story.update(t, this.camera);
    if (drawBoard) { drawBoard(this.world.boardCanvas.getContext('2d'), t); this.world.boardTex.needsUpdate = true; }
    this.renderer.render(this.scene, this.camera);
  }
  // punto 3D -> pixeles de pantalla
  project(p) {
    const v = this._v.set(p[0], p[1], p[2]).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.W, y: (-v.y * 0.5 + 0.5) * this.H, ok: v.z > -1 && v.z < 1 };
  }
}
