// rig.js - Sistema de poses y actuacion para los personajes low-poly (Sofia, Juan Diego, Martin)
// Todo es funcion pura del tiempo: se puede saltar a cualquier fotograma (render por segmentos).
import { clamp, lerp, ss, eio, angLerp, hash, noise1, seg, EASE } from './lib.js';
const THREE = window.THREE;

// ---------------------------------------------------------------- POSES
const ZERO = {
  sit: 0, drop: 0, lift: 0, prx: 0, pry: 0, prz: 0, sx: 0, sy: 0, sz: 0, hx: 0, hy: 0, hz: 0,
  lax: 0, lay: 0, laz: -0.1, lf: -0.18, lfz: 0, rax: 0, ray: 0, raz: 0.1, rf: -0.18, rfz: 0,
  llx: 0, llz: 0, lk: 0, rlx: 0, rlz: 0, rk: 0, lan: 0, ran: 0,
  g: 1,   // cuanto gesticula al hablar (0 = brazos ocupados)
  al: 0,  // bloqueo del balanceo de brazos al caminar
};
const KEYS = Object.keys(ZERO);
const P = (o, base = ZERO) => Object.assign({}, base, o);

const SIT = P({ sit: 1, llx: -1.6, lk: 0.14, rlx: -1.53, rk: 0.02, llz: -0.15, rlz: 0.15, sx: 0.08, lan: 0.6, ran: 0.5,
  lax: 0.28, laz: -0.4, lf: -0.05, rax: 0.28, raz: 0.4, rf: -0.05 });

export const POSES = {
  stand: P({}),
  hips: P({ laz: -0.55, lf: -0.25, lfz: 1.3, raz: 0.55, rf: -0.25, rfz: -1.3, g: 0 }),
  wave: P({ raz: 2.35, rf: -0.45, lax: -0.1, g: 0 }),
  salute: P({ rax: -1.9, raz: 0.5, rf: -1.9, hz: -0.08, g: 0 }),
  talk1: P({ rax: -0.75, raz: 0.3, rf: -1.25, lax: -0.2, lf: -0.6, g: 0.5 }),
  talk2: P({ lax: -0.7, laz: -0.28, lf: -1.3, rax: -0.7, raz: 0.28, rf: -1.3, g: 0.5 }),
  open: P({ lax: -0.45, laz: -0.75, lf: -0.9, rax: -0.45, raz: 0.75, rf: -0.9, hz: 0.1, g: 0.3 }),
  point: P({ rax: -1.4, raz: 0.1, rf: -0.12, g: 0 }),
  pointL: P({ lax: -1.4, laz: -0.1, lf: -0.12, g: 0 }),
  thumbBack: P({ rax: -0.5, raz: 0.9, rf: -2.2, g: 0 }),
  pointUp: P({ rax: -2.75, raz: 0.15, rf: -0.12, hx: -0.3, g: 0 }),
  shrug: P({ lax: -0.35, laz: -0.5, lf: -1.7, rax: -0.35, raz: 0.5, rf: -1.7, hz: 0.12, g: 0 }),
  think: P({ rax: -1.0, raz: -0.2, rf: -2.25, lax: -0.25, laz: 0.25, lf: -1.35, hx: 0.12, g: 0 }),
  hold: P({ lax: -0.85, laz: 0.3, lf: -1.15, rax: -0.85, raz: -0.3, rf: -1.15, g: 0, al: 1 }),
  holdLow: P({ lax: -0.4, laz: 0.26, lf: -0.95, rax: -0.4, raz: -0.26, rf: -0.95, g: 0, al: 1 }),
  present: P({ lax: -1.3, laz: 0.22, lf: -0.3, rax: -1.3, raz: -0.22, rf: -0.3, g: 0, al: 1 }),
  tossUp: P({ lax: -2.2, laz: 0.2, lf: -0.25, rax: -2.2, raz: -0.2, rf: -0.25, hx: -0.3, g: 0, al: 1 }),
  throwFwd: P({ lax: -1.75, laz: 0.2, lf: -0.1, rax: -1.75, raz: -0.2, rf: -0.1, sx: 0.2, g: 0, al: 1 }),
  catch: P({ lax: -1.2, laz: 0.25, lf: -0.7, rax: -1.2, raz: -0.25, rf: -0.7, g: 0, al: 1 }),
  sad: P({ hx: 0.5, sx: 0.22, lax: 0.06, rax: 0.06, lf: -0.04, rf: -0.04, g: 0 }),
  ask: P({ lax: -2.6, laz: -0.35, lf: -0.35, rax: -2.6, raz: 0.35, rf: -0.35, hx: -0.1, g: 0 }),
  crouch: P({ drop: 0.18, llx: -0.75, lk: 1.45, rlx: -0.75, rk: 1.45, sx: 0.38, lax: 0.75, rax: 0.75, lf: -0.3, rf: -0.3, g: 0, al: 1 }),
  jumpLoad: P({ lift: 0.72, llx: 0.15, lk: 0.95, rlx: -0.3, rk: 0.6, sx: -0.25, sy: -0.45, rax: -2.75, raz: 0.45, rf: -1.5, lax: -2.3, lf: -0.2, hx: -0.25, g: 0, al: 1 }),
  jumpHit: P({ lift: 0.8, sx: 0.42, sy: 0.35, rax: -0.95, raz: 0.1, rf: -0.05, lax: 0.3, llx: -0.3, lk: 0.5, rlx: 0.1, rk: 0.7, g: 0, al: 1 }),
  land: P({ drop: 0.13, llx: -0.6, lk: 1.15, rlx: -0.6, rk: 1.15, sx: 0.3, lax: 0.25, rax: 0.25, g: 0, al: 1 }),
  reach: P({ lift: 0.03, rax: -3.05, raz: 0.05, rf: -0.05, hx: -0.4, lax: 0.1, g: 0 }),
  cheer: P({ laz: -2.5, raz: 2.5, lf: -0.3, rf: -0.3, hx: -0.15, g: 0 }),
  squat: P({ sit: 0.68, llx: -1.75, lk: 2.0, rlx: -1.75, rk: 2.0, sx: 0.55, lax: -0.6, rax: -0.6, lf: -0.5, rf: -0.5, g: 0, al: 1 }),

  // ---- sentados en el piso (voleibol sentado: pelvis en contacto con el suelo)
  sit: SIT,
  sitTalk1: P({ rax: -0.9, raz: 0.3, rf: -1.3, lax: -0.45, laz: -0.2, lf: -0.95, g: 0.5 }, SIT),
  sitTalk2: P({ lax: -0.8, laz: -0.3, lf: -1.3, rax: -0.8, raz: 0.3, rf: -1.3, g: 0.5 }, SIT),
  sitOpen: P({ lax: -0.5, laz: -0.8, lf: -0.9, rax: -0.5, raz: 0.8, rf: -0.9, g: 0.3 }, SIT),
  sitKnees: P({ lax: -0.55, laz: -0.12, lf: -0.75, rax: -0.55, raz: 0.12, rf: -0.75, g: 0.8 }, SIT),
  sitReady: P({ sx: 0.24, lax: -1.05, laz: -0.15, lf: -1.25, rax: -1.05, raz: 0.15, rf: -1.25, g: 0 }, SIT),
  sitBump: P({ sx: 0.4, lax: -1.0, laz: 0.42, lf: -0.06, rax: -1.0, raz: -0.42, rf: -0.06, hx: -0.2, g: 0 }, SIT),
  sitBumpUp: P({ sx: 0.18, lax: -1.45, laz: 0.4, lf: -0.06, rax: -1.45, raz: -0.4, rf: -0.06, hx: -0.3, g: 0 }, SIT),
  sitSet: P({ sx: -0.04, hx: -0.4, lax: -2.5, laz: -0.2, lf: -1.05, rax: -2.5, raz: 0.2, rf: -1.05, g: 0 }, SIT),
  sitSetUp: P({ sx: -0.08, hx: -0.5, lax: -2.95, laz: -0.12, lf: -0.12, rax: -2.95, raz: 0.12, rf: -0.12, g: 0 }, SIT),
  sitLoad: P({ sx: -0.2, sy: -0.5, hx: -0.3, rax: -2.8, raz: 0.5, rf: -1.5, lax: -2.2, laz: -0.2, lf: -0.15, g: 0 }, SIT),
  sitHit: P({ sx: 0.46, sy: 0.4, rax: -0.9, raz: 0.05, rf: 0, lax: 0.2, laz: -0.45, lf: -0.3, g: 0 }, SIT),
  sitTip: P({ sx: 0.1, hx: -0.3, rax: -2.7, raz: 0.15, rf: -0.5, lax: -0.6, lf: -0.8, g: 0 }, SIT),
  sitCheer: P({ sx: -0.08, hx: -0.15, laz: -2.45, raz: 2.45, lf: -0.25, rf: -0.25, llx: -1.78, lk: 0.5, rlx: -1.7, rk: 0.4, g: 0 }, SIT),
  sitReach: P({ rax: -3.0, raz: 0.06, rf: -0.05, hx: -0.4, sx: -0.05, g: 0 }, SIT),
  sitSign: P({ rax: -1.9, raz: 0.35, rf: -1.6, hz: -0.06, g: 0 }, SIT),
  sitPoint: P({ rax: -1.45, raz: 0.1, rf: -0.1, g: 0 }, SIT),
  sitPointL: P({ lax: -1.45, laz: -0.1, lf: -0.1, g: 0 }, SIT),
  sitFiveR: P({ rax: -0.7, raz: 2.0, rf: -0.25, sz: -0.12, g: 0 }, SIT),
  sitFiveL: P({ lax: -0.7, laz: -2.0, lf: -0.25, sz: 0.12, g: 0 }, SIT),
  sitFiveBoth: P({ lax: -0.7, laz: -2.0, lf: -0.25, rax: -0.7, raz: 2.0, rf: -0.25, hx: -0.1, g: 0 }, SIT),
  sitHold: P({ lax: -0.85, laz: 0.3, lf: -1.15, rax: -0.85, raz: -0.3, rf: -1.15, g: 0 }, SIT),
  sitPresent: P({ lax: -1.3, laz: 0.22, lf: -0.3, rax: -1.3, raz: -0.22, rf: -0.3, g: 0 }, SIT),
  sitToss: P({ lax: -2.3, laz: 0.2, lf: -0.2, rax: -2.3, raz: -0.2, rf: -0.2, hx: -0.35, g: 0 }, SIT),
  sitThink: P({ rax: -1.0, raz: -0.2, rf: -2.25, lax: -0.4, lf: -1.0, hx: 0.1, g: 0 }, SIT),
  sitFist: P({ rax: -1.6, raz: 0.3, rf: -2.0, sx: 0.0, g: 0 }, SIT),
  sitDive: P({ sx: 0.75, sz: 0.0, lax: -1.75, laz: 0.3, lf: -0.05, rax: -1.75, raz: -0.3, rf: -0.05, hx: -0.5, g: 0 }, SIT),
};

const resolvePose = p => (typeof p === 'string' ? POSES[p] : P(p.o || p, p.base ? POSES[p.base] : ZERO));
const lerpPose = (a, b, w) => { const o = {}; for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * w; return o; };

// ---------------------------------------------------------------- ACTOR
export class Actor {
  constructor(root, builder, seed = 0) {
    this.root = root;
    this.d = root.userData;
    this.id = this.d.id;
    this.seed = seed;
    this.scale = root.scale.x;
    this.standY = this.d.pelvis.position.y;
    this.floorY = 0.185;
    this.spineY = this.d.spine.position.y;
    this.poseKeys = []; this.pathSegs = []; this.faceKeys = []; this.lookKeys = []; this.emoKeys = []; this.fxs = []; this.nods = [];
    this.opacity = 1;
    this._v = new THREE.Vector3();
    this._enhanceFace(builder);
    if (this.d.ball) this.d.ball.visible = false;          // el balon pegado al brazo de Martin no se usa: el balon es libre
    this.sneakL = this.d.leftKnee.children[this.d.leftKnee.children.length - 1];
    this.sneakR = this.d.rightKnee.children[this.d.rightKnee.children.length - 1];
    root.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
  }

  _enhanceFace(builder) {
    const d = this.d, head = d.head, m = d.mouth;
    if (!m) return;
    const mats = builder.mats;
    this.brows = head.children.filter(c => c.isMesh && c.material === mats.eyebrow);
    this.brows.sort((a, b) => a.position.x - b.position.x);
    this.browBase = this.brows.map(b => ({ y: b.position.y, rz: b.rotation.z }));
    const lipGeo = new THREE.BoxGeometry(0.045, 0.01, 0.01);
    this.lipLow = new THREE.Mesh(lipGeo, mats.mouthLip);
    this.lipLow.position.copy(m.position);
    this.mouthIn = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.01, 0.006), new THREE.MeshBasicMaterial({ color: 0x4a1218 }));
    this.mouthIn.position.copy(m.position); this.mouthIn.position.z -= 0.0015;
    const cGeo = new THREE.BoxGeometry(0.016, 0.009, 0.009);
    this.cornL = new THREE.Mesh(cGeo, mats.mouthLip); this.cornR = new THREE.Mesh(cGeo, mats.mouthLip);
    head.add(this.lipLow, this.mouthIn, this.cornL, this.cornR);
    this.mouthBase = m.position.clone();
    this.eyes = [d.eyeL, d.eyeR].map(e => ({ g: e, parts: e.children.slice(1, 4).map(c => ({ c, x: c.position.x, y: c.position.y })) }));
  }

  // ---- API de coreografia
  pose(t, p, d = 0.45, ease = 'io') { this.poseKeys.push({ t, p: resolvePose(p), d, ease: EASE[ease] }); return this; }
  at(t, x, z) { this.pathSegs.push({ t0: t, t1: t, x0: x, z0: z, x1: x, z1: z }); return this; }
  move(t0, t1, x, z, opts = {}) {
    const last = this.pathSegs[this.pathSegs.length - 1];
    this.pathSegs.push({ t0, t1, x0: last.x1, z0: last.z1, x1: x, z1: z, ...opts });
    return this;
  }
  face(t, to, d = 0.5) { this.faceKeys.push({ t, to, d }); return this; }
  look(t, to, d = 0.35) { this.lookKeys.push({ t, to, d }); return this; }
  emo(t, e, d = 0.3) { this.emoKeys.push({ t, e, d }); return this; }
  nod(t, amp = 0.22) { this.nods.push({ t, amp }); return this; }
  fx(fn) { this.fxs.push(fn); return this; }
  finalize() {
    this.poseKeys.sort((a, b) => a.t - b.t); this.faceKeys.sort((a, b) => a.t - b.t);
    this.lookKeys.sort((a, b) => a.t - b.t); this.emoKeys.sort((a, b) => a.t - b.t);
    let acc = 0;
    for (const s of this.pathSegs) { s.len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0); s.acc = acc; acc += s.len; }
  }

  // ---- posicion sobre la cancha
  _path(t) {
    const segs = this.pathSegs;
    let s = segs[0];
    for (let i = 0; i < segs.length; i++) { if (segs[i].t0 <= t) s = segs[i]; else break; }
    const u = s.t1 > s.t0 ? ss(seg(t, s.t0, s.t1)) : 1;
    return { x: lerp(s.x0, s.x1, u), z: lerp(s.z0, s.z1, u), dist: s.acc + s.len * u, s };
  }
  posAt(t) {
    const a = this._path(t), b = this._path(t + 0.04), c = this._path(t - 0.04);
    const speed = Math.abs(b.dist - c.dist) / 0.08;
    const moving = a.s.t1 > a.s.t0 && t >= a.s.t0 && t <= a.s.t1 && a.s.len > 0.01;
    return { x: a.x, z: a.z, dist: a.dist, speed: moving ? speed : 0, dx: a.s.x1 - a.s.x0, dz: a.s.z1 - a.s.z0, noTurn: !!a.s.noTurn };
  }

  _poseAt(t) {
    const ks = this.poseKeys;
    let p = ks.length ? ks[0].p : ZERO;
    for (const k of ks) {
      if (t <= k.t) break;
      const w = k.ease((t - k.t) / k.d);
      p = w >= 1 ? k.p : lerpPose(p, k.p, w);
    }
    return Object.assign({}, p);
  }

  _yawTarget(to, pos, ctx) {
    if (typeof to === 'number') return to;
    let x, z;
    if (to === 'cam') { x = ctx.cam[0]; z = ctx.cam[2]; }
    else if (typeof to === 'string') { const o = ctx.actors[to].posAt(ctx.t); x = o.x; z = o.z; }
    else { x = to[0]; z = to[1]; }
    return Math.atan2(x - pos.x, z - pos.z);
  }

  // Cuerpo: posicion, orientacion y pose (independiente de la camara salvo para 'cam' en face)
  body(t, ctx) {
    const d = this.d, pos = this.posAt(t), p = this._poseAt(t);
    const sitK = clamp(p.sit);

    // orientacion
    let yaw = 0;
    const fk = this.faceKeys;
    if (fk.length) {
      yaw = this._yawTarget(fk[0].to, pos, ctx);
      for (const k of fk) { if (t <= k.t) break; yaw = angLerp(yaw, this._yawTarget(k.to, pos, ctx), ss((t - k.t) / k.d)); }
    }
    if (pos.speed > 0.01 && !pos.noTurn) {
      const w = ss(pos.speed / 0.9) * (1 - sitK);
      yaw = angLerp(yaw, Math.atan2(pos.dx, pos.dz), w);
    }
    this.yaw = yaw;

    // ciclo de caminata
    const wk = ss(pos.speed / 1.0) * (1 - sitK);
    if (wk > 0.001) {
      const ph = pos.dist / 1.25 * Math.PI * 2;
      const A = 0.6 * wk;
      p.llx += -Math.sin(ph) * A; p.rlx += Math.sin(ph) * A;
      p.lk += Math.max(0, Math.sin(ph + 1.0)) * 1.0 * wk; p.rk += Math.max(0, Math.sin(ph + 1.0 + Math.PI)) * 1.0 * wk;
      const sw = (1 - p.al) * wk;
      p.lax += Math.sin(ph) * 0.5 * sw; p.rax += -Math.sin(ph) * 0.5 * sw;
      p.lf += -0.35 * sw; p.rf += -0.35 * sw;
      p.lift += Math.abs(Math.sin(ph)) * 0.03 * wk;
      p.sy += Math.sin(ph) * 0.08 * wk; p.sx += 0.05 * wk;
    }
    // desplazamiento sentado: arrastre con brazos
    const sc = ss(pos.speed / 0.5) * sitK;
    if (sc > 0.001) {
      const loc = Math.atan2(pos.dx, pos.dz) - yaw;            // direccion de viaje en ejes del cuerpo
      const side = Math.sin(loc), fwd = Math.cos(loc);
      const ph = pos.dist * 7.5;
      const pulse = 0.5 + 0.5 * Math.sin(ph);
      p.sz += -side * 0.24 * sc; p.sx += fwd * 0.18 * sc;
      p.lax = lerp(p.lax, 0.15 + fwd * 0.4 * pulse, sc * 0.9); p.rax = lerp(p.rax, 0.15 + fwd * 0.4 * pulse, sc * 0.9);
      p.laz = lerp(p.laz, -0.55 - Math.max(0, -side) * 0.5 * pulse, sc * 0.9);
      p.raz = lerp(p.raz, 0.55 + Math.max(0, side) * 0.5 * pulse, sc * 0.9);
      p.lf = lerp(p.lf, -0.05, sc); p.rf = lerp(p.rf, -0.05, sc);
      p.lift += Math.abs(Math.sin(ph)) * 0.035 * sc;
      p.lk += pulse * 0.25 * sc; p.rk += (1 - pulse) * 0.25 * sc;
    }

    // respiracion y micro-movimiento
    const sd = this.seed;
    const br = Math.sin(t * 1.7 + sd * 2.1);
    p.sx += br * 0.012; p.sy += noise1(t * 0.35 + sd * 11) * 0.03 * (1 - sitK * 0.5);
    p.laz -= br * 0.012; p.raz += br * 0.012;
    p.hz += noise1(t * 0.5 + sd * 5) * 0.025;

    // gestos al hablar
    const sp = ctx.speech(this.id, t);
    if (sp.w > 0.001 && p.g > 0.001) {
      const g = p.g * sp.w, beat = Math.sin(t * 5.4 + sd) * 0.5 + 0.5, alt = noise1(t * 0.7 + sd * 3);
      const r = 0.5 + 0.5 * alt, l = 0.5 - 0.5 * alt;
      p.rax += (-0.5 - 0.25 * sp.a) * g * (0.4 + 0.6 * r); p.rf += (-0.95 - 0.35 * beat * (0.4 + sp.a)) * g * (0.4 + 0.6 * r); p.raz += 0.22 * g * r;
      p.lax += (-0.5 - 0.25 * sp.a) * g * (0.4 + 0.6 * l); p.lf += (-0.95 - 0.35 * beat * (0.4 + sp.a)) * g * (0.4 + 0.6 * l); p.laz -= 0.22 * g * l;
    }
    p.hx += sp.a * sp.w * 0.05 + sp.w * noise1(t * 1.9 + sd * 7) * 0.04;
    for (const n of this.nods) { const u = (t - n.t) / 0.5; if (u > 0 && u < 1) p.hx += Math.sin(u * Math.PI) * n.amp; }

    for (const f of this.fxs) f(p, t, pos);
    this.p = p; this.sp = sp;

    // aplicar
    const root = this.root;
    root.position.set(pos.x, p.lift * this.scale, pos.z);
    root.rotation.y = yaw;
    d.pelvis.position.y = lerp(this.standY, this.floorY, sitK) - p.drop;
    d.pelvis.rotation.set(p.prx, p.pry, p.prz);
    d.spine.position.y = this.spineY + br * 0.003;
    d.spine.rotation.set(p.sx, p.sy, p.sz);
    d.head.rotation.set(p.hx, p.hy, p.hz);
    d.leftArm.rotation.set(p.lax, p.lay, p.laz); d.leftForearm.rotation.set(p.lf, 0, p.lfz);
    d.rightArm.rotation.set(p.rax, p.ray, p.raz); d.rightForearm.rotation.set(p.rf, 0, p.rfz);
    d.leftLeg.rotation.set(p.llx, 0, p.llz); d.rightLeg.rotation.set(p.rlx, 0, p.rlz);
    d.leftKnee.rotation.x = p.lk; d.rightKnee.rotation.x = p.rk;
    this.sneakL.rotation.x = p.lan; this.sneakR.rotation.x = p.ran;
    if (d.pony) d.pony.rotation.z = -0.5 + Math.sin(t * 2.3) * 0.05 + pos.speed * 0.12 + p.sx * 0.3;
    root.updateMatrixWorld(true);
    this.headW = d.head.getWorldPosition(new THREE.Vector3());
    return pos;
  }

  handPos(side) {
    const f = side === 'l' ? this.d.leftForearm : this.d.rightForearm;
    return f.localToWorld(this._v.set(0, -0.3, 0.035)).clone();
  }
  handsMid(off = 0.1) {
    const a = this.handPos('l'), b = this.handPos('r');
    const m = a.add(b).multiplyScalar(0.5);
    m.x += Math.sin(this.yaw) * off; m.z += Math.cos(this.yaw) * off;
    return m;
  }
  hipPos() { return this.d.pelvis.getWorldPosition(new THREE.Vector3()); }

  // Mirada, parpadeo, boca y emocion (despues de conocer la camara y el balon)
  faceAnim(t, ctx) {
    const d = this.d, p = this.p, sp = this.sp, sd = this.seed;
    if (!this.mouthBase) return;
    // --- mirada
    const target = (to) => {
      if (!to) return null;
      if (to === 'cam') return ctx.cam;
      if (to === 'ball') return ctx.ball;
      if (typeof to === 'string') { const h = ctx.actors[to].headW; return [h.x, h.y, h.z]; }
      return to;
    };
    const ang = (to) => {
      const tg = target(to);
      if (!tg) return [0, 0];
      const vx = tg[0] - this.headW.x, vy = tg[1] - this.headW.y, vz = tg[2] - this.headW.z;
      let ly = Math.atan2(vx, vz) - (this.yaw + p.pry + p.sy);
      ly = Math.atan2(Math.sin(ly), Math.cos(ly));
      return [clamp(ly, -1.15, 1.15), clamp(-Math.atan2(vy, Math.hypot(vx, vz)) - p.sx - p.prx, -0.6, 0.6)];
    };
    let la = [0, 0];
    const lk = this.lookKeys;
    if (lk.length) {
      la = ang(lk[0].to);
      for (const k of lk) { if (t <= k.t) break; const b = ang(k.to), w = ss((t - k.t) / k.d); la = [lerp(la[0], b[0], w), lerp(la[1], b[1], w)]; }
    }
    d.head.rotation.y += la[0] * 0.78; d.head.rotation.x += la[1] * 0.78;
    const ex = clamp(la[0] * 0.6, -1, 1) * 0.011 + noise1(t * 0.9 + sd * 13) * 0.002, ey = clamp(-la[1] * 0.6, -1, 1) * 0.007;
    // --- emocion
    let e = { smile: 0.3, brow: 0, sad: 0 };
    for (const k of this.emoKeys) {
      if (t <= k.t) break;
      const w = ss((t - k.t) / k.d), b = Object.assign({ smile: 0.3, brow: 0, sad: 0 }, k.e);
      e = { smile: lerp(e.smile, b.smile, w), brow: lerp(e.brow, b.brow, w), sad: lerp(e.sad, b.sad, w) };
    }
    // --- parpadeo determinista
    const cyc = 2.9 + hash(sd * 3.3) * 1.6, ph = (t + sd * 1.37) % cyc;
    const blink = ph < 0.13 ? Math.sin(ph / 0.13 * Math.PI) : 0;
    const eyeS = Math.max(0.1, 1 - blink * 0.92) * (1 + Math.max(0, e.brow) * 0.14 - e.smile * 0.06);
    for (const eye of this.eyes) {
      eye.g.scale.y = eyeS;
      for (const q of eye.parts) { q.c.position.x = q.x + ex; q.c.position.y = q.y + ey; }
    }
    // --- cejas
    this.brows.forEach((b, i) => {
      const s = i === 0 ? 1 : -1, bb = this.browBase[i];
      b.position.y = bb.y + e.brow * 0.013 + sp.a * sp.w * 0.003;
      b.rotation.z = bb.rz + s * (Math.min(0, e.brow) * 0.45 + e.sad * 0.4);
    });
    // --- boca
    const open = sp.a * sp.w, mb = this.mouthBase, m = d.mouth;
    const wdt = 1 + e.smile * 0.35 - open * 0.12 - e.sad * 0.15;
    m.scale.set(wdt, 1, 1); m.position.y = mb.y + open * 0.003;
    this.lipLow.scale.set(wdt * 0.92, 1, 1); this.lipLow.position.y = mb.y - 0.004 - open * 0.024;
    const gap = (m.position.y - this.lipLow.position.y);
    this.mouthIn.scale.set(wdt, Math.max(0.2, gap / 0.01), 1); this.mouthIn.position.y = (m.position.y + this.lipLow.position.y) / 2;
    this.mouthIn.visible = open > 0.04;
    const cy = e.smile * 0.011 - e.sad * 0.012, cx = 0.0225 * wdt + 0.004;
    this.cornL.position.set(mb.x - cx, mb.y + cy * 0.6 - 0.001, mb.z); this.cornR.position.set(mb.x + cx, mb.y + cy * 0.6 - 0.001, mb.z);
    const rot = e.smile * 0.75 - e.sad * 0.8;
    this.cornL.rotation.z = -rot; this.cornR.rotation.z = rot;
    const cv = Math.abs(e.smile) + e.sad > 0.08;
    this.cornL.visible = this.cornR.visible = cv;
  }
}
