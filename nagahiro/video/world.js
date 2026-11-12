// world.js - Estudio de debate + modelos holograficos. Nada se anima aqui por si solo:
// story.js fija el estado de cada objeto en funcion de t (render determinista).
import { clamp, lerp, hash } from './lib.js';
const THREE = window.THREE;

export const KM = 1.15;                 // escala del mapa: 1 km = 1,15 m de escenario
export const MAPC = [0, 0, -1.2];       // centro del mapa / zona de modelos
export const AMBER = 0xffb04a, ICE = 0x7fd4ff, PAPER = 0xf4efe4, RED = 0xe8102a;

// modelos fisicos (los mismos de la propuesta)
export const Q = (dkm) => {             // cal/cm^2, 15 kt, f=0.35, altura 580 m, sin absorcion
  const R = Math.hypot(dkm * 1000, 580);
  return 0.35 * 15 * 4.184e12 / (4 * Math.PI * R * R) / 4.184 / 1e4;
};

const pointsMat = (color, size) => new THREE.ShaderMaterial({
  uniforms: { col: { value: new THREE.Color(color) }, f: { value: 1 }, op: { value: 1 }, size: { value: size } },
  vertexShader: `attribute float thr; uniform float f; uniform float size; varying float vis;
    void main(){ vis = step(thr, f); vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * vis * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 col; uniform float op; varying float vis;
    void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5 || vis < 0.5) discard;
      float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(col * (0.9 + 1.2 * a), min(1.0, a * 1.6) * op); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});

export class World {
  constructor(scene, logo) {
    this.scene = scene; this.logo = logo;
    this._lights(); this._studio(); this._lecterns(); this._clock();
    this._tower(); this._grain(); this._map(); this._decay(); this._dose(); this._cranes(); this._warheads(); this._crystals();
  }

  _lights() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight(0x8aa0d0, 0x0b0d14, 0.55); s.add(this.hemi);
    const key = new THREE.DirectionalLight(0xfff1e0, 1.25); key.position.set(3, 7, 6); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 25 });
    key.shadow.bias = -0.0006; s.add(key); this.key = key;
    const rim = new THREE.DirectionalLight(0x6fa8ff, 0.9); rim.position.set(-4, 4, -7); s.add(rim); this.rim = rim;
    const rim2 = new THREE.DirectionalLight(0xff8a6a, 0.45); rim2.position.set(5, 3, -6); s.add(rim2); this.rim2 = rim2;
    this.spots = [-2.5, 2.5].map(x => {
      const sp = new THREE.SpotLight(0xfff0dc, 1.3, 14, 0.42, 0.6, 1.2); sp.position.set(x * 1.2, 6.5, 3.5);
      sp.target.position.set(x, 1.1, 0.4); s.add(sp, sp.target); return sp;
    });
    this.heat = new THREE.PointLight(0xffa040, 0, 9, 1.6); s.add(this.heat);
  }

  _studio() {
    const s = this.scene;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x07090f, roughness: 0.35, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    // tarima circular con anillo de luz
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
    x.fillStyle = '#0d111c'; x.fillRect(0, 0, 1024, 1024);
    x.strokeStyle = 'rgba(140,170,230,0.10)'; x.lineWidth = 2;
    for (let i = 0; i <= 1024; i += 48) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1024); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(1024, i); x.stroke(); }
    x.strokeStyle = 'rgba(232,16,42,0.35)'; x.lineWidth = 6; x.beginPath(); x.arc(512, 512, 470, 0, 7); x.stroke();
    const tex = new THREE.CanvasTexture(c);
    this.stage = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.35, 0.12, 72), [
      new THREE.MeshStandardMaterial({ color: 0x0b0e16, roughness: 0.5 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: 0x0b0e16 })]);
    this.stage.position.y = -0.06; this.stage.receiveShadow = true; s.add(this.stage);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xe8102a, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.28, 0.025, 6, 120), this.ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.005; s.add(ring);
    // pantalla LED curva al fondo
    this.boardCanvas = document.createElement('canvas'); this.boardCanvas.width = 2048; this.boardCanvas.height = 640;
    this.boardTex = new THREE.CanvasTexture(this.boardCanvas);
    this.boardTex.wrapS = THREE.RepeatWrapping; this.boardTex.repeat.x = -1;
    const scr = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 4.4, 64, 1, true, -0.62, 1.24),
      new THREE.MeshBasicMaterial({ map: this.boardTex, side: THREE.BackSide, toneMapped: false }));
    scr.position.set(0, 3.0, 2.2); scr.rotation.y = Math.PI; s.add(scr); this.screen = scr;
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(10.05, 10.05, 4.6, 64, 1, true, -0.64, 1.28), new THREE.MeshStandardMaterial({ color: 0x05060a, side: THREE.BackSide }));
    frame.position.copy(scr.position); frame.rotation.y = Math.PI; s.add(frame);
    // columnas de luz verticales
    this.strips = [];
    for (let i = 0; i < 14; i++) {
      const a = -1.25 + i * (2.5 / 13), r = 13;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 7, 0.06), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2a4a8a : 0x7a1020, transparent: true, opacity: 0.6 }));
      m.position.set(Math.sin(a) * r, 3.5, -Math.cos(a) * r + 2.2); s.add(m); this.strips.push(m);
    }
  }

  _lecterns() {
    const s = this.scene;
    const c = document.createElement('canvas'); c.width = 256; c.height = 320; const x = c.getContext('2d');
    x.fillStyle = '#0f1424'; x.fillRect(0, 0, 256, 320);
    x.fillStyle = '#e8102a'; x.fillRect(0, 300, 256, 20);
    if (this.logo) { const w = 150; x.drawImage(this.logo, 53, 70, w, w * this.logo.height / this.logo.width); }
    const tex = new THREE.CanvasTexture(c);
    const body = new THREE.MeshStandardMaterial({ color: 0x141a2c, roughness: 0.5 });
    const fr = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    const top = new THREE.MeshStandardMaterial({ color: 0x252d44, roughness: 0.35 });
    this.lecterns = [[-2.35, 0.55, 0.5], [2.35, 0.55, -0.5]].map(([px, pz, yaw]) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.42), [body, body, body, body, fr, body]); b.position.y = 0.525; g.add(b);
      const tp = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.5), top); tp.position.set(0, 1.08, -0.02); tp.rotation.x = 0.18; g.add(tp);
      const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      mic.position.set(0.18, 1.25, 0.08); mic.rotation.x = -0.5; g.add(mic);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.01), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      led.position.set(0, 0.95, 0.212); g.add(led); g.userData.led = led;
      g.position.set(px, 0, pz); g.rotation.y = yaw;
      g.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
      s.add(g); g.userData.home = [px, pz]; return g;
    });
  }

  _clock() {
    const g = new THREE.Group(); this.clock = g;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 60), new THREE.MeshStandardMaterial({ color: 0xece5d6, roughness: 0.8 }));
    face.rotation.x = Math.PI / 2; g.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.06, 6, 60), new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.4, metalness: 0.5 })); g.add(rim);
    const dark = new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 0.6 });
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0, a = i / 60 * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.05 : 0.018, big ? 0.17 : 0.07, 0.02), dark);
      m.position.set(Math.sin(a) * (big ? 1.06 : 1.1), Math.cos(a) * (big ? 1.06 : 1.1), 0.05); m.rotation.z = -a; g.add(m);
    }
    const hand = (len, w, mat, z) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), mat); m.position.y = len / 2 - 0.08; p.add(m); p.position.z = z; g.add(p); return p; };
    this.hHour = hand(0.62, 0.07, dark, 0.07); this.hMin = hand(0.95, 0.045, dark, 0.09);
    this.hSec = hand(1.0, 0.016, new THREE.MeshStandardMaterial({ color: 0xb01020 }), 0.11);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), dark); pin.rotation.x = Math.PI / 2; pin.position.z = 0.12; g.add(pin);
    g.traverse(n => { if (n.isMesh) n.castShadow = true; });
    g.position.set(0, 2.1, -1.5); this.scene.add(g);
  }
  setClock(h, m, s) {
    this.hSec.rotation.z = -s / 60 * Math.PI * 2;
    this.hMin.rotation.z = -(m + s / 60) / 60 * Math.PI * 2;
    this.hHour.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2;
  }

  // torre de 15 000 t de TNT: 10 x 10 x 15 cubos de 10 t
  _tower() {
    const n = 1500, sz = 0.2, gap = 0.022;
    this.towerMat = new THREE.MeshStandardMaterial({ color: 0xffb04a, emissive: 0x6a3000, roughness: 0.45, transparent: true, opacity: 0.9 });
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(sz, sz, sz), this.towerMat, n);
    im.castShadow = true; im.receiveShadow = true;
    this.tower = im; this.towerCells = [];
    for (let l = 0; l < 15; l++) for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++)
      this.towerCells.push({ l, x: (i - 4.5) * (sz + gap), y: sz / 2 + l * (sz + gap), z: (j - 4.5) * (sz + gap), r: hash(l * 100 + i * 10 + j) });
    this.towerPos = new THREE.Vector3(0, 0, -2.0);
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._sv = new THREE.Vector3(); this._pv = new THREE.Vector3();
    this.scene.add(im); this.setTower(0);
  }
  setTower(k, op = 1) {          // k: 0..1 capas construidas (con onda por cubo)
    const im = this.tower, L = 15;
    im.visible = k > 0.001 && op > 0.01; this.towerMat.opacity = 0.9 * op;
    this.towerCells.forEach((c, i) => {
      const u = clamp((k * (L + 2) - c.l - c.r * 1.5) / 1.0);
      const e = u <= 0 ? 0 : 1 - Math.pow(1 - u, 3);
      this._pv.set(this.towerPos.x + c.x, this.towerPos.y + c.y + (1 - e) * 0.6, this.towerPos.z + c.z);
      this._sv.setScalar(Math.max(1e-4, e));
      im.setMatrixAt(i, this._m4.compose(this._pv, this._q, this._sv));
    });
    im.instanceMatrix.needsUpdate = true;
  }

  _grain() {
    this.grain = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.012, 1), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }));
    this.grain.add(core);
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,190,90,0.55)'); gr.addColorStop(1, 'rgba(255,150,40,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    this.glowMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    this.grainGlow = new THREE.Sprite(this.glowMat); this.grainGlow.scale.setScalar(0.16); this.grain.add(this.grainGlow);
    this.grainLight = new THREE.PointLight(0xffc070, 0, 2.2, 2); this.grain.add(this.grainLight);
    this.grain.visible = false; this.scene.add(this.grain);
  }

  // mapa abstracto: bloques de ciudad coloreados por energia termica (modelo del inverso del cuadrado)
  _map() {
    const g = new THREE.Group(); g.position.set(MAPC[0], 0.005, MAPC[2]); this.map = g; this.scene.add(g);
    const R = 4.0, step = 0.17, cells = [];
    for (let x = -R; x <= R; x += step) for (let z = -R; z <= R; z += step) {
      const d = Math.hypot(x, z); if (d > R) continue;
      const hsh = hash(x * 31.7 + z * 17.3);
      if (hsh < 0.12) continue;                                        // calles / plazas
      const river = Math.abs(z - Math.sin(x * 0.6) * 0.5 + 0.9) < 0.12 || Math.abs(x + 1.6 + z * 0.2) < 0.1;
      if (river) continue;
      cells.push({ x, z, d, h: 0.03 + hash(x * 7.1 - z * 3.3) * 0.12 });
    }
    this.mapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 1 });
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(step * 0.78, 1, step * 0.78), this.mapMat, cells.length);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    cells.forEach((c, i) => {
      m4.compose(new THREE.Vector3(c.x, c.h / 2, c.z), new THREE.Quaternion(), new THREE.Vector3(1, c.h, 1)); im.setMatrixAt(i, m4);
      im.setColorAt(i, col.setRGB(0.5, 0.55, 0.65));
    });
    im.receiveShadow = true; g.add(im); this.mapIM = im; this.mapCells = cells;
    // base
    const base = new THREE.Mesh(new THREE.CircleGeometry(R + 0.15, 72), new THREE.MeshBasicMaterial({ color: 0x0a1a30, transparent: true, opacity: 0.85 }));
    base.rotation.x = -Math.PI / 2; base.position.y = -0.002; g.add(base); this.mapBase = base;
    // anillos de distancia (0,5 1 1,5 2 3 km)
    this.rings = [0.5, 1, 1.5, 2, 3].map(km => {
      const m = new THREE.Mesh(new THREE.RingGeometry(km * KM - 0.012, km * KM + 0.012, 128), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.17; g.add(m); m.userData.km = km; return m;
    });
    // punto de detonacion (580 m) - una luz, no una explosion
    this.burst = new THREE.Sprite(this.glowMat.clone()); this.burst.position.set(0, 0.58 * KM, 0); this.burst.scale.setScalar(0.5); g.add(this.burst);
    this.burstLine = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.58 * KM, 4), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.6 }));
    this.burstLine.position.y = 0.29 * KM; g.add(this.burstLine);
    // discos de raiz cubica (15, 21, 300 kt) - radios relativos
    this.yieldDiscs = [[15, 0xffd9a0], [21, 0xff9a40], [300, 0xe8102a]].map(([kt, c]) => {
      const r = 1.05 * Math.cbrt(kt / 15);
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.18 + kt / 3000; g.add(m);
      const edge = new THREE.Mesh(new THREE.RingGeometry(r - 0.015, r + 0.015, 128), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      edge.rotation.x = -Math.PI / 2; edge.position.y = 0.19 + kt / 3000; g.add(edge);
      return { kt, r, m, edge };
    });
    this.setMap(0, 0, 0);
  }
  // a: visibilidad, heat: 0..1 coloreado termico, sweep: radio (km) hasta donde llega el coloreado
  setMap(a, heat, sweepKm, heatLight = 0) {
    this.map.visible = a > 0.001;
    if (!this.map.visible) { this.heat.intensity = 0; return; }
    const s = 0.6 + 0.4 * a;
    this.map.scale.set(s, a, s);
    this.mapMat.opacity = a; this.mapBase.material.opacity = 0.85 * a;
    const col = new THREE.Color(), cool = new THREE.Color(0x3a4a66), hot = new THREE.Color(0xffd27a), mid = new THREE.Color(0xff6a2a);
    this.mapCells.forEach((c, i) => {
      const dkm = c.d / KM;
      const lit = clamp((sweepKm - dkm) / 0.25) * heat;
      const v = clamp(Math.log10(Q(dkm)) / Math.log10(80));            // 0..1 (log)
      const hc = v > 0.6 ? mid.clone().lerp(hot, (v - 0.6) / 0.4) : cool.clone().lerp(mid, v / 0.6);
      col.copy(cool).lerp(hc, lit).convertSRGBToLinear();
      this.mapIM.setColorAt(i, col);
    });
    this.mapIM.instanceColor.needsUpdate = true;
    this.burst.material.opacity = a * heat; this.burstLine.material.opacity = 0.6 * a * heat;
    this.heat.position.set(MAPC[0], 0.58 * KM + 0.2, MAPC[2]); this.heat.intensity = heatLight * 2.5;
  }

  // nubes de nucleos: I-131 (ambar) vs Cs-137 (azul)
  _decay() {
    const mk = (cx, color, seed) => {
      const n = 700, pos = new Float32Array(n * 3), thr = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const u = hash(seed + i * 1.37), v = hash(seed + i * 2.71), w = hash(seed + i * 5.11);
        const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1), r = 0.85 * Math.cbrt(w);
        pos.set([cx + r * Math.sin(ph) * Math.cos(th), 1.55 + r * Math.cos(ph), MAPC[2] - 0.6 + r * Math.sin(ph) * Math.sin(th)], i * 3);
        thr[i] = hash(seed * 3 + i * 0.913) * 0.999 + 0.0005;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('thr', new THREE.BufferAttribute(thr, 1));
      const p = new THREE.Points(geo, pointsMat(color, 0.13)); p.visible = false; this.scene.add(p); return p;
    };
    this.iodine = mk(-1.25, 0xffa640, 11); this.cesium = mk(1.25, 0x6fc8ff, 29);
  }
  setDecay(a, fI, fC, spin = 0) {
    for (const [p, f] of [[this.iodine, fI], [this.cesium, fC]]) {
      p.visible = a > 0.001; p.material.uniforms.f.value = f; p.material.uniforms.op.value = a;
      p.rotation.y = spin * 0.15;
    }
  }

  // dosis-respuesta: RR = 1 + 0,42 D
  _dose() {
    const g = new THREE.Group(); g.position.set(0, 0, MAPC[2] - 0.4); this.dose = g; this.scene.add(g);
    this.doseBars = [0, 0.5, 1, 1.5, 2].map((D, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1, 0.34), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.1 - i * 0.025, 0.9, 0.55), emissive: 0x401000, roughness: 0.4, transparent: true }));
      m.position.x = (i - 2) * 0.55; m.castShadow = true; g.add(m); m.userData.D = D; return m;
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.01, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
    base.position.y = 0.9 * 1.0; g.add(base); this.doseBase = base;   // linea de riesgo base RR=1
    this.setDose(0, 0);
  }
  setDose(a, k) {
    this.dose.visible = a > 0.001;
    this.doseBars.forEach((b, i) => {
      const rr = 1 + 0.42 * b.userData.D, u = clamp(k * 6 - i * 0.8);
      const h = Math.max(0.001, 0.9 * rr * (1 - Math.pow(1 - u, 3)));
      b.scale.y = h; b.position.y = h / 2; b.material.opacity = a;
    });
    this.doseBase.material.opacity = 0.35 * a;
  }

  // grullas de papel (memoria) - geometria low-poly propia
  _cranes() {
    const v = [  // cuerpo, alas, cuello y cola como triangulos
      [0, 0, 0.18, 0, 0.05, 0, 0, 0, -0.05], [0, 0, 0.18, 0, 0, -0.05, 0, -0.03, 0],
      [0, 0.05, 0, -0.26, 0.11, -0.03, 0, 0, -0.05], [0, 0.05, 0, 0.26, 0.11, -0.03, 0, 0, -0.05],
      [0, 0, -0.05, 0, 0.05, 0, 0, 0.16, -0.19], [0, 0.0, 0.1, 0, 0.04, 0.06, 0, 0.17, 0.2],
      [0, 0.17, 0.2, 0, 0.13, 0.25, 0, 0.15, 0.17],
    ].flat();
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
    this.craneMat = new THREE.MeshStandardMaterial({ color: PAPER, emissive: 0x2a2620, roughness: 0.8, side: THREE.DoubleSide, flatShading: true, transparent: true });
    this.cranes = new THREE.InstancedMesh(geo, this.craneMat, 220);
    this.cranes.castShadow = true; this.scene.add(this.cranes);
    this.craneSeeds = Array.from({ length: 220 }, (_, i) => ({ a: hash(i * 1.1) * Math.PI * 2, r: 0.9 + hash(i * 2.3) * 4.2, s: 0.18 + hash(i * 3.7) * 0.22, ph: hash(i * 4.9), sz: 0.55 + hash(i * 6.1) * 0.55 }));
    this.setCranes(0, 0);
  }
  setCranes(a, t, n = 220) {
    const im = this.cranes; im.visible = a > 0.001; this.craneMat.opacity = a;
    if (!im.visible) return;
    const e = new THREE.Euler();
    this.craneSeeds.forEach((c, i) => {
      const on = i < n ? 1 : 0;
      const y = ((c.ph * 9 + t * c.s) % 9) - 0.6;
      const ang = c.a + t * 0.05 * (i % 2 ? 1 : -1);
      const flap = Math.sin(t * 2.2 + i) * 0.15;
      e.set(flap * 0.5, -ang + Math.PI / 2, flap);
      this._q.setFromEuler(e);
      const fade = clamp((y + 0.6) / 0.8) * clamp((8.4 - y) / 1.2) * on;
      this._pv.set(MAPC[0] + Math.cos(ang) * c.r * 1.15, y + 0.3, MAPC[2] + Math.sin(ang) * c.r * 0.8 - 0.9);
      this._sv.setScalar(Math.max(1e-4, c.sz * fade));
      im.setMatrixAt(i, this._m4.compose(this._pv, this._q, this._sv));
    });
    im.instanceMatrix.needsUpdate = true;
  }

  // 12 187 ojivas (SIPRI, 2026): un punto por ojiva sobre el piso
  _warheads() {
    const n = 12187, side = Math.ceil(Math.sqrt(n)), sp = 0.24;
    const pos = new Float32Array(n * 3), thr = new Float32Array(n);
    const order = [];
    for (let i = 0; i < n; i++) {
      const gx = (i % side) - side / 2, gz = Math.floor(i / side) - side / 2;
      order.push([i, Math.hypot(gx, gz)]);
      pos.set([gx * sp, 0.03, gz * sp - 1.0], i * 3);
    }
    order.sort((a, b) => a[1] - b[1]);
    order.forEach(([i], k) => { thr[i] = (k + 0.5) / n; });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('thr', new THREE.BufferAttribute(thr, 1));
    this.warheads = new THREE.Points(geo, pointsMat(0xff3040, 0.2)); this.warheads.visible = false; this.scene.add(this.warheads);
  }
  setWarheads(a, f) { this.warheads.visible = a > 0.001; this.warheads.material.uniforms.f.value = f; this.warheads.material.uniforms.op.value = a; }

  // cristales de la dialectica: tesis (ambar), antitesis (azul), superacion (blanco)
  _crystals() {
    const mk = (geo, c, e) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, emissive: e, roughness: 0.25, metalness: 0.3, flatShading: true, transparent: true })); m.castShadow = true; m.visible = false; this.scene.add(m); return m; };
    this.cThesis = mk(new THREE.OctahedronGeometry(0.28, 0), 0xffb04a, 0x5a2a00);
    this.cAnti = mk(new THREE.OctahedronGeometry(0.28, 0), 0x6fc8ff, 0x00304a);
    this.cSynth = mk(new THREE.IcosahedronGeometry(0.36, 0), 0xfaf6ee, 0x403a30);
  }
}
