// story.js - Coreografia del debate: Samuel y Tomas, camaras, luces y modelos holograficos.
// Todos los tiempos salen de timeline.js (generado desde el guion y las voces reales).
import { TL } from './timeline.js';
import { clamp, lerp, lerp3, seg, ss, eio, eo, EASE, noise1, win, hash } from './lib.js';
import { Actor } from './rig.js';
import { MAPC, KM } from './world.js';
const THREE = window.THREE;

export const S = n => TL.scenes[n][0], SE = n => TL.scenes[n][1];
export const B = n => TL.beats[n][0], BE = n => TL.beats[n][1];
export const M = n => { if (!(n in TL.marks)) throw new Error('marca ' + n); return TL.marks[n]; };
const cueMap = Object.fromEntries(TL.cues.map(c => [c.id, c]));
export const C = id => cueMap[id];
const byWho = {};
for (const c of TL.cues) (byWho[c.who] = byWho[c.who] || []).push(c);

export function speech(who, t) {
  let a = 0, w = 0;
  const list = byWho[who];
  if (list) for (const c of list) {
    if (t < c.t0 - 0.2 || t > c.t1 + 0.32) continue;
    const ww = Math.min(seg(t, c.t0 - 0.12, c.t0 + 0.12), 1 - seg(t, c.t1 - 0.05, c.t1 + 0.28));
    const i = (t - c.t0) * 60, i0 = Math.floor(i), e = c.env;
    const v = (i0 < 0 || i0 >= e.length - 1) ? 0 : lerp(e[i0], e[i0 + 1], i - i0) / 99;
    if (ww > w) { w = ww; a = v; }
  }
  return { a: Math.pow(a, 0.75), w };
}

// ---- tiempos de los modelos (compartidos con overlay.js)
export const decayDays = t => {                // reloj simulado del decaimiento
  const a = M('m7_iodine') - 0.3, b = M('m7_cesium'), c = M('m7_hundred') + 0.8;
  if (t < a) return 0;
  if (t < b) return 80 * eio(seg(t, a, b));
  return 80 + (100 * 365.25 - 80) * Math.pow(eio(seg(t, b + 0.2, c)), 2.2);
};
export const fI131 = d => Math.pow(0.5, d / 8.02);
export const fCs137 = d => Math.pow(0.5, d / 365.25 / 30.1);

const PI = Math.PI;
const P = (o) => ({ base: 'stand', o });
export const SAM = [-2.57, 0.16], TOM = [2.57, 0.16];

export class Story {
  constructor(world, builder, scene) {
    this.world = world;
    const sam = new Actor(builder.buildSamuel(), builder, 1), tom = new Actor(builder.buildTomas(), builder, 2);
    scene.add(sam.root, tom.root);
    this.actors = { samuel: sam, tomas: tom };
    this.duo = [sam, tom];
    this.clockSpot = new THREE.SpotLight(0xfff2dc, 0, 12, 0.35, 0.5, 1.2);
    this.clockSpot.position.set(0.6, 3.4, 3.2); this.clockSpot.target = world.clock; scene.add(this.clockSpot);
    this.shots = [];
    this._script(sam, tom);
    for (const a of this.duo) a.finalize();
    this.shots.sort((a, b) => a.t0 - b.t0);
  }

  sh(t0, t1, p0, p1, l0, l1, f0 = 34, f1 = f0, ease = 'io') { this.shots.push({ t0, t1, p0, p1, l0, l1, f0, f1, ease: EASE[ease] }); }

  _script(sa, to) {
    const sh = this.sh.bind(this);
    const handsLect = P({ lax: -0.62, laz: 0.1, lf: -0.7, rax: -0.62, raz: -0.1, rf: -0.7, g: 0.75 });
    const chest = P({ rax: -0.85, raz: -0.35, rf: -2.0, g: 0 });
    const palm = P({ rax: -0.62, raz: 0.18, rf: -1.05, lax: 0.05, g: 0, al: 1 });
    const point = P({ rax: -1.25, raz: 0.25, rf: -0.15, g: 0 });
    const pointBack = P({ rax: -0.4, raz: 0.95, rf: -2.1, hz: 0.06, g: 0 });
    const offer = P({ lax: -0.75, laz: -0.35, lf: -0.6, g: 0.3 });
    const offerR = P({ rax: -0.75, raz: 0.35, rf: -0.6, g: 0.3 });
    const openUp = P({ lax: -0.6, laz: -0.55, lf: -0.7, rax: -0.6, raz: 0.55, rf: -0.7, g: 0.4 });
    const think = 'think', shrug = 'shrug';
    const fingerUp = P({ rax: -1.0, raz: 0.15, rf: -1.9, g: 0 });
    const handshake = P({ rax: -0.85, raz: -0.12, rf: -0.45, g: 0, al: 1 });
    const lookUp = P({ hx: -0.35, g: 0.4 });

    // ------------------------------------------------------------ posiciones de partida (atriles)
    sa.at(0, ...SAM).face(0, 0.5); to.at(0, ...TOM).face(0, -0.5);
    sa.pose(0, handsLect, 0.01); to.pose(0, handsLect, 0.01);
    sa.look(0, 'cam'); to.look(0, 'cam');
    sa.emo(0, { smile: 0.35 }); to.emo(0, { smile: 0.35 });

    // ------------------------------------------------------------ 0-1. LOGO + RELOJ
    const cl = B('clock_in'), fl = M('flash'), bk = M('back'), sIn = B('stage_in'), lit = M('lights');
    sh(0, cl, [0, 2.1, 3.6], [0, 2.1, 3.6], [0, 2.1, -1.5], [0, 2.1, -1.5], 34);
    sh(cl, fl, [0.15, 2.15, 4.4], [0.0, 2.1, 3.0], [0, 2.1, -1.5], [0, 2.1, -1.5], 34, 34, 'lin');
    sh(fl, bk + 0.1, [0.0, 2.1, 2.95], [0.0, 2.1, 2.9], [0, 2.1, -1.5], [0, 2.1, -1.5], 34);
    sh(bk + 0.1, M('n2_eighty') - 0.2, [-0.6, 2.0, 3.6], [0.4, 2.2, 3.3], [0, 2.1, -1.5], [0, 2.1, -1.5], 34, 32, 'lin');
    sh(M('n2_eighty') - 0.2, sIn + 1.2, [0, 2.4, 3.4], [0, 3.0, 7.6], [0, 2.0, -1.5], [0, 1.4, -0.6], 34, 38, 'io');

    // ------------------------------------------------------------ 2. PRESENTACION
    const i1 = C('i1'), i2 = C('i2'), i3 = C('i3'), i4 = C('i4');
    sh(sIn + 1.2, i2.t0, [0, 2.9, 7.6], [0, 2.6, 6.6], [0, 1.4, -0.6], [0, 1.35, -0.4], 38, 36);
    sh(i2.t0, i3.t0 - 0.1, [1.15, 1.62, 1.55], [1.3, 1.6, 1.4], [2.6, 1.5, 0.1], [2.6, 1.52, 0.12], 30, 28);
    sh(i3.t0 - 0.1, i4.t0 - 0.15, [-0.55, 1.6, 2.4], [-0.85, 1.6, 2.05], [-2.45, 1.38, 0.1], [-2.5, 1.45, 0.1], 32, 30);
    sh(i4.t0 - 0.15, B('title'), [4.6, 1.8, 1.6], [4.2, 1.75, 2.0], [-1.0, 1.4, 0.2], [-0.2, 1.4, 0.2], 34, 32);
    sh(B('title'), BE('title'), [0, 1.9, 5.2], [0, 2.2, 3.0], [0, 2.6, -7], [0, 2.9, -7.6], 42, 40);
    sa.look(lit + 0.5, 'cam'); to.look(lit + 0.5, 'cam');
    sa.pose(i1.t0 - 0.25, chest, 0.35).pose(i1.t1 + 0.1, handsLect, 0.5);
    sa.emo(i1.t0, { smile: 0.75 }); to.emo(i2.t0, { smile: 0.7 });
    to.pose(i2.t0 - 0.1, offerR, 0.4).pose(M('i2_sb') - 0.1, openUp, 0.4).pose(i2.t1, handsLect, 0.5);
    sa.look(i2.t0 + 0.2, 'tomas', 0.5).look(i3.t0 - 0.2, 'cam', 0.4);
    to.look(i3.t0 + 0.2, 'samuel', 0.5);
    sa.pose(i3.t0, openUp, 0.4).pose(M('i3_arg') - 0.2, P({ rax: -0.9, raz: -0.25, rf: -0.6, g: 0 }), 0.35).pose(i3.t1 + 0.1, handsLect, 0.5);
    sa.look(M('i3_arg') - 0.1, 'tomas', 0.3).emo(M('i3_arg'), { smile: 0.6, brow: 0.4 });
    to.nod(M('i3_arg') + 0.2, 0.18).emo(M('i3_arg'), { smile: 0.55, brow: 0.3 });
    to.pose(i4.t0 - 0.1, think, 0.5).pose(M('i4_calc') + 0.4, openUp, 0.5).pose(i4.t1 + 0.3, handsLect, 0.6);
    to.look(i4.t0, 'cam', 0.5).emo(i4.t0, { smile: 0.1, brow: 0.5 });
    sa.look(i4.t0 + 0.3, 'tomas', 0.4);
    sa.look(B('title') + 0.3, [0, 3, -7.8], 0.8); to.look(B('title') + 0.4, [0, 3, -7.8], 0.8);

    // ------------------------------------------------------------ 3. RONDA 1 - TESIS (Samuel)
    const r1 = S('round1'), a1 = C('a1'), a2 = C('a2'), a3 = C('a3'), a4 = C('a4'), a5 = C('a5'), a6 = C('a6');
    sh(r1, a1.t0 - 0.2, [0, 2.4, 3.0], [0, 2.7, 1.4], [0, 2.9, -7.8], [0, 3.0, -7.8], 40, 38);
    sh(a1.t0 - 0.2, a2.t0 - 0.1, [-0.35, 1.58, 2.55], [-0.95, 1.6, 1.95], [-2.4, 1.35, 0.1], [-2.5, 1.45, 0.1], 32, 30, 'lin');
    sh(a2.t0 - 0.1, a3.t0 - 0.1, [3.35, 1.85, -0.5], [3.25, 1.82, -0.25], [-2.55, 1.45, 0.2], [-2.55, 1.48, 0.2], 28, 27);
    sh(a3.t0 - 0.1, a4.t0 - 0.1, [-1.35, 1.62, 1.25], [-1.55, 1.63, 1.05], [-2.6, 1.55, 0.1], [-2.6, 1.57, 0.1], 30, 28, 'lin');
    sh(a4.t0 - 0.1, a5.t0 - 0.1, [1.3, 1.6, 1.3], [1.42, 1.6, 1.15], [2.6, 1.52, 0.1], [2.6, 1.55, 0.1], 28, 27);
    sh(a5.t0 - 0.1, a6.t0 - 0.1, [-0.6, 1.62, 2.3], [-0.95, 1.6, 2.0], [-2.45, 1.4, 0.1], [-2.5, 1.45, 0.1], 32, 30, 'lin');
    sh(a6.t0 - 0.1, SE('round1'), [0, 2.2, 6.6], [0, 2.4, 5.6], [0, 1.6, -1.5], [0, 2.0, -3], 40, 40);
    for (const a of [sa, to]) a.look(r1 + 0.1, [0, 3, -7.8], 0.6);
    sa.look(a1.t0 - 0.3, 'cam', 0.5).emo(a1.t0, { smile: 0.05, brow: 0.2 });
    to.look(a1.t0, 'samuel', 0.6).emo(a1.t0, { smile: 0.1 });
    sa.pose(a1.t0, handsLect, 0.4).pose(M('a1_surr') - 0.3, P({ rax: -1.0, raz: 0.2, rf: -0.5, g: 0.3 }), 0.4).pose(a1.t1, handsLect, 0.5);
    sa.look(a2.t0, 'tomas', 0.5).pose(M('a2_inv') - 0.2, offerR, 0.4).pose(M('a2_bomb') - 0.2, point, 0.35).pose(a2.t1 + 0.1, handsLect, 0.5);
    sa.look(a3.t0, 'cam', 0.4).pose(M('a3_least') - 0.2, fingerUp, 0.35).pose(a3.t1, handsLect, 0.5).emo(M('a3_least'), { smile: 0, brow: 0.5 });
    to.pose(a4.t0 - 0.15, shrug, 0.35).pose(a4.t1 + 0.2, handsLect, 0.5).emo(a4.t0, { smile: 0.0, brow: -0.6 }).look(a4.t0, 'samuel', 0.3);
    sa.look(a4.t0 + 0.2, 'tomas', 0.3);
    sa.pose(a5.t0, openUp, 0.4).pose(M('a5_half') - 0.15, fingerUp, 0.3).pose(a5.t1 + 0.2, handsLect, 0.5).emo(a5.t0, { smile: 0.2, brow: 0.3 });
    to.pose(a6.t0, P({ rax: -1.3, raz: -0.45, rf: -0.2, g: 0 }), 0.45).pose(M('a6_keep') + 0.6, handsLect, 0.6);
    to.look(a6.t0, [0, 3, -7.8], 0.5).look(M('a6_keep'), 'samuel', 0.5).emo(a6.t0, { smile: 0.4, brow: 0.3 });
    sa.look(a6.t0 + 0.3, [0, 3, -7.8], 0.6).look(M('a6_keep') + 0.2, 'tomas', 0.5).nod(M('a6_keep') + 0.6, 0.15);

    // ------------------------------------------------------------ 4. RONDA 2 - ANTITESIS (Tomas)
    const r2 = S('round2'), b1 = C('b1'), b2 = C('b2'), b3 = C('b3'), b4 = C('b4');
    sh(r2, b1.t0 - 0.2, [0, 2.4, 3.0], [0, 2.7, 1.4], [0, 2.9, -7.8], [0, 3.0, -7.8], 40, 38);
    sh(b1.t0 - 0.2, b2.t0 - 0.1, [0.6, 1.6, 2.35], [0.95, 1.6, 2.0], [2.45, 1.4, 0.1], [2.5, 1.45, 0.1], 32, 30, 'lin');
    sh(b2.t0 - 0.1, b3.t0 - 0.1, [-3.35, 1.85, -0.5], [-3.25, 1.82, -0.25], [2.55, 1.45, 0.2], [2.55, 1.48, 0.2], 28, 27);
    sh(b3.t0 - 0.1, b4.t0 - 0.1, [-1.15, 1.6, 1.45], [-1.3, 1.6, 1.3], [-2.6, 1.5, 0.1], [-2.6, 1.52, 0.1], 32, 31);
    sh(b4.t0 - 0.1, C('m1').t0 + 0.2, [0, 2.6, 7.4], [0, 1.8, 4.6], [0, 1.2, -0.4], [0, 1.25, 0.6], 38, 34);
    for (const a of [sa, to]) a.look(r2 + 0.1, [0, 3, -7.8], 0.6);
    to.look(b1.t0 - 0.3, 'cam', 0.5).emo(b1.t0, { smile: 0.1, brow: 0.3 });
    sa.look(b1.t0, 'tomas', 0.6).emo(b1.t0, { smile: 0.05 });
    to.pose(b1.t0, offer, 0.4).pose(M('b1_dont') - 0.2, P({ rax: -0.55, raz: 0.9, rf: -0.4, lax: -0.55, laz: -0.9, lf: -0.4, g: 0 }), 0.35).pose(b1.t1, handsLect, 0.5);
    to.look(b2.t0, 'samuel', 0.5).pose(M('b2_alp') - 0.2, offerR, 0.4).pose(M('b2_sov') - 0.2, offer, 0.4).pose(b2.t1, handsLect, 0.5);
    sa.pose(b3.t0 - 0.1, fingerUp, 0.35).pose(b3.t1 + 0.2, handsLect, 0.5).emo(b3.t0, { smile: 0.1, brow: -0.4 }).look(b3.t0, 'tomas', 0.3);
    to.nod(b4.t0 + 0.1, 0.2).emo(b4.t0, { smile: 0.55, brow: 0.2 });
    // salen de los atriles: el estudio se convierte en laboratorio
    const ms = M('b4_measure');
    to.pose(b4.t0 + 0.4, 'stand', 0.5).move(b4.t0 + 0.7, C('m1').t0 + 0.2, 0, 0.95);
    to.face(C('m1').t0, 0, 0.6);
    sa.pose(ms - 0.4, 'stand', 0.5).move(ms, ms + 2.6, -2.15, 1.25).face(ms + 2.4, 'tomas', 0.6);
    sa.look(b4.t0 + 0.8, 'tomas', 0.5); to.look(b4.t0 + 0.6, null, 0.4).look(C('m1').t0 - 0.2, 'cam', 0.5);

    // M1 - masa-energia: un grano en la palma, una torre detras
    const m1 = C('m1'), m2 = C('m2');
    this.grainHand = to;
    sh(m1.t0 + 0.2, M('m1_gram') - 0.3, [0, 1.75, 4.0], [0, 1.55, 2.9], [0, 1.3, 0.8], [0.05, 1.2, 0.95], 34, 30);
    sh(M('m1_gram') - 0.3, m2.t0 + 0.4, [0.5, 0.26, 0.95], [0.4, 0.23, 0.8], [-0.12, 0.2, -0.3], [-0.12, 0.2, -0.3], 32, 30, 'lin');
    this.shots[this.shots.length - 1].track = () => { const h = to.handPos('r'); return [h.x, h.y + 0.05, h.z]; };
    sh(m2.t0 + 0.4, BE('tower'), [0.5, 1.35, 2.5], [3.4, 2.6, 6.4], [0.1, 1.25, 1.0], [0, 1.65, -1.2], 26, 40, 'io');
    to.pose(M('m1_less') - 0.4, palm, 0.5).look(M('m1_less') - 0.2, [0.12, 1.12, 1.25], 0.5).emo(M('m1_less'), { smile: 0.15, brow: 0.35 });
    to.look(M('m1_seven') + 0.2, 'cam', 0.5);
    to.pose(M('m2_fifteen') - 0.2, pointBack, 0.45).look(M('m2_fifteen'), [0, 2.4, -2], 0.6).pose(BE('tower') - 0.2, 'stand', 0.5);
    sa.look(M('m1_gram') - 0.3, [0.12, 1.12, 1.25], 0.6).emo(M('m1_gram'), { smile: 0.1, brow: 0.6 });
    sa.look(M('m2_fifteen') + 0.1, [0, 2.6, -2], 0.7).emo(M('m2_fifteen') + 0.3, { smile: 0, brow: 0.8 });

    // M2 - calor sobre el mapa
    const m3 = C('m3'), m4 = C('m4'), m5 = C('m5'), m6 = C('m6');
    const tE = [3.25, 2.15], sE = [-3.25, 2.15];
    to.move(BE('tower') - 1.2, m3.t0 + 1.4, ...tE).face(m3.t0 + 1.2, [MAPC[0], MAPC[2]], 0.7);
    sa.move(BE('tower') - 1.0, m3.t0 + 1.6, ...sE).face(m3.t0 + 1.4, [MAPC[0], MAPC[2]], 0.7);
    sh(BE('tower'), m4.t0, [5.2, 4.2, 6.0], [3.0, 5.0, 6.6], [0, 0.3, -1.2], [0, 0.35, -1.0], 40, 40, 'lin');
    sh(m4.t0, m5.t0 - 0.1, [-1.2, 6.8, 6.4], [1.2, 6.4, 6.2], [0, 0.2, -1.5], [0, 0.2, -1.5], 40, 40, 'lin');
    to.look(m3.t0 + 0.6, [0, 0.8, -1.2], 0.6).pose(M('m3_heat') - 0.2, P({ rax: -1.3, raz: 0.2, rf: -0.3, hx: 0.2, g: 0 }), 0.4).pose(M('m3_square'), 'stand', 0.6);
    to.pose(M('m4_half') - 0.2, P({ rax: -0.9, raz: 0.15, rf: -0.25, g: 0 }), 0.4).pose(M('m4_four'), 'stand', 0.6);
    sa.look(m3.t0 + 0.8, [0, 0.4, -1.2], 0.6).emo(m3.t0, { smile: 0, brow: 0.3 });
    // M3 - raiz cubica
    sh(m5.t0 - 0.1, m6.t0 - 0.1, [-2.0, 1.65, 3.85], [-2.15, 1.66, 3.65], [-3.25, 1.5, 2.15], [-3.25, 1.55, 2.15], 28, 27);
    sh(m6.t0 - 0.1, C('m7').t0 - 0.3, [0.4, 8.2, 4.4], [-0.4, 8.6, 3.6], [0, 0, -1.2], [0, 0, -1.3], 42, 42, 'lin');
    sa.look(m5.t0 - 0.3, 'tomas', 0.4).pose(m5.t0 - 0.1, offerR, 0.4).pose(m5.t1 + 0.3, 'stand', 0.5).emo(m5.t0, { smile: 0.1, brow: 0.5 });
    to.look(m5.t0 + 0.2, 'samuel', 0.4).look(m6.t0 + 0.4, [0, 0.4, -1.2], 0.6);
    to.pose(m6.t0 + 0.2, openUp, 0.45).pose(M('m6_area') - 0.2, P({ lax: -0.5, laz: -1.0, lf: -0.2, rax: -0.5, raz: 1.0, rf: -0.2, g: 0 }), 0.5).pose(m6.t1, 'stand', 0.6);
    sa.look(m6.t0 + 0.4, [0, 0.3, -1.2], 0.6).emo(M('m6_area'), { smile: 0, brow: 0.7, sad: 0.2 });

    // M4 - decaimiento
    const m7 = C('m7'), m8 = C('m8');
    to.move(m7.t0 - 0.4, m7.t0 + 2.2, 0, 1.05).face(m7.t0 + 2.0, 'cam', 0.6);
    sa.move(m7.t0 - 0.2, m7.t0 + 2.4, -2.55, 1.05).face(m7.t0 + 2.2, 'tomas', 0.6);
    sh(C('m7').t0 - 0.3, M('m7_cesium') - 0.2, [0, 2.0, 6.0], [0, 1.85, 5.0], [0, 1.45, -1.4], [0, 1.45, -1.5], 38, 36, 'lin');
    sh(M('m7_cesium') - 0.2, m8.t0 - 0.2, [3.0, 1.9, 2.7], [2.6, 1.85, 2.3], [1.0, 1.5, -1.7], [1.1, 1.5, -1.8], 36, 34, 'lin');
    to.look(m7.t0 + 2.2, 'cam', 0.5).pose(M('m7_iodine') - 0.2, P({ lax: -1.1, laz: -0.6, lf: -0.25, g: 0 }), 0.45)
      .pose(M('m7_cesium') - 0.2, P({ rax: -1.1, raz: 0.6, rf: -0.25, g: 0 }), 0.45).pose(m7.t1, 'stand', 0.6);
    to.look(M('m7_iodine'), [-1.25, 1.6, -1.8], 0.5).look(M('m7_cesium'), [1.25, 1.6, -1.8], 0.5).look(M('m7_hundred') + 0.3, 'cam', 0.5);
    sa.look(M('m7_iodine') + 0.1, [-1.25, 1.6, -1.8], 0.6).look(M('m7_cesium') + 0.1, [1.25, 1.6, -1.8], 0.6);
    // M5 - dosis-respuesta
    to.move(m8.t0 - 0.6, m8.t0 + 1.6, 2.15, -1.05).face(m8.t0 + 1.4, [3.2, 2.6], 0.6);
    sh(m8.t0 - 0.2, B('cranes_in'), [3.6, 1.55, 2.6], [3.1, 1.75, 3.2], [0, 0.95, -1.6], [0, 1.0, -1.6], 36, 36, 'lin');
    to.look(m8.t0 + 0.5, [0, 1.2, -1.6], 0.5).pose(M('m8_risk') - 0.2, P({ lax: -0.9, laz: -0.45, lf: -0.3, g: 0 }), 0.45).pose(m8.t1, 'stand', 0.6);
    sa.look(m8.t0 + 0.5, [0, 1.2, -1.6], 0.6).emo(M('m8_gray'), { smile: 0, brow: 0.2, sad: 0.4 });

    // Memoria: grullas de papel
    const m9 = C('m9'), m10 = C('m10'), m11 = C('m11'), m12 = C('m12'), cr = B('cranes_in');
    sa.move(cr - 0.4, cr + 2.6, -0.95, 1.15).face(cr + 2.4, 'tomas', 0.7);
    to.move(cr - 0.3, cr + 2.4, 0.95, 1.05).face(cr + 2.2, 'samuel', 0.7);
    sh(cr, m10.t0 - 0.1, [0.3, 0.45, 5.4], [0.0, 0.6, 4.6], [0, 2.4, -1.2], [0, 2.9, -1.4], 40, 42, 'lin');
    sh(m10.t0 - 0.1, m11.t0 - 0.1, [0.25, 1.6, 2.55], [0.15, 1.6, 2.35], [-0.95, 1.65, 1.15], [-0.95, 1.7, 1.15], 30, 28, 'lin');
    sh(m11.t0 - 0.1, m12.t0 - 0.1, [-0.35, 1.6, 2.6], [-0.2, 1.6, 2.4], [0.95, 1.6, 1.05], [0.95, 1.62, 1.05], 30, 28, 'lin');
    sh(m12.t0 - 0.1, SE('round2'), [0, 1.3, 6.5], [0, 1.7, 5.4], [0, 2.2, -0.5], [0, 2.6, -0.6], 40, 40, 'lin');
    for (const a of [sa, to]) { a.look(cr + 0.4, [a === sa ? -0.3 : 0.3, 3.4, -0.6], 0.8); a.pose(cr, lookUp, 0.8); a.emo(cr, { smile: 0, sad: 0.35 }); }
    to.look(m9.t0 + 1.5, 'samuel', 0.6).pose(m9.t0 + 1.0, 'stand', 0.6);
    sa.look(m9.t0 + 2.0, 'tomas', 0.6).pose(m9.t0 + 1.0, 'stand', 0.6);
    sa.look(M('m10_imagine') - 0.3, [-0.3, 3.4, -0.6], 0.7).pose(m10.t0, openUp, 0.5).pose(m10.t1 + 0.3, 'stand', 0.6);
    to.pose(m11.t0, offer, 0.45).pose(M('m11_feel') - 0.3, chest, 0.4).pose(m11.t1 + 0.2, 'stand', 0.6).look(m11.t0, 'samuel', 0.5);
    sa.look(m11.t0 + 0.2, 'tomas', 0.5).nod(M('m11_feel') + 0.2, 0.15);
    for (const a of [sa, to]) { a.look(m12.t0 + 0.4, [0, 3.2, -1.0], 0.9); a.pose(m12.t0 + 0.3, lookUp, 0.9); a.emo(M('m12_nobel'), { smile: 0.25, sad: 0.15 }); }

    // ------------------------------------------------------------ 5. RONDA 3 - SUPERACION
    const r3 = S('round3'), c1 = C('c1'), c2 = C('c2'), c3 = C('c3'), c4 = C('c4'), c5 = C('c5'), c6 = C('c6');
    sh(r3, c1.t0 - 0.2, [0, 2.4, 3.0], [0, 2.7, 1.4], [0, 2.9, -7.8], [0, 3.0, -7.8], 40, 38);
    sa.move(r3 + 0.6, c1.t0, -1.55, 0.95).face(c1.t0 - 0.3, 'tomas', 0.6);
    to.move(r3 + 0.6, c1.t0, 1.55, 0.95).face(c1.t0 - 0.3, 'samuel', 0.6);
    for (const a of [sa, to]) { a.pose(r3, 'stand', 0.6); a.emo(r3 + 0.5, { smile: 0.3 }); }
    sh(c1.t0 - 0.2, c2.t0 - 0.1, [0.7, 1.45, 3.1], [0.4, 1.45, 2.8], [-1.4, 1.72, 0.95], [-1.45, 1.74, 0.95], 34, 32, 'lin');
    sh(c2.t0 - 0.1, c3.t0 - 0.1, [-0.7, 1.45, 3.1], [-0.4, 1.45, 2.8], [1.4, 1.72, 0.95], [1.45, 1.74, 0.95], 34, 32, 'lin');
    sh(c3.t0 - 0.1, c4.t0 - 0.1, [0, 1.75, 5.2], [0, 1.65, 4.3], [0, 1.45, 0.6], [0, 1.5, 0.7], 36, 34, 'lin');
    sh(c4.t0 - 0.1, c6.t0 - 0.1, [2.2, 1.6, 3.2], [1.5, 1.62, 3.0], [-0.3, 1.5, 0.8], [0, 1.55, 0.8], 32, 30, 'lin');
    sh(c6.t0 - 0.1, SE('round3') + 0.6, [0, 1.15, 3.2], [0, 1.3, 2.6], [0, 1.85, 0.8], [0, 2.05, 0.8], 36, 34, 'lin');
    sa.look(c1.t0 - 0.2, 'cam', 0.5).pose(M('c1_keep') - 0.3, palm, 0.5).look(M('c1_keep'), [-1.05, 2.1, 1.25], 0.5).look(c1.t1 - 1.2, 'tomas', 0.5).pose(c1.t1 + 0.2, 'stand', 0.6);
    to.look(c1.t0, 'samuel', 0.5).nod(c1.t1 - 0.4, 0.15);
    to.look(c2.t0 - 0.2, 'cam', 0.5).pose(M('c2_keep') - 0.3, P({ lax: -0.62, laz: -0.18, lf: -1.05, g: 0, al: 1 }), 0.5).look(M('c2_keep'), [1.05, 2.1, 1.25], 0.5)
      .look(M('c2_never'), 'samuel', 0.5).pose(c2.t1 + 0.2, 'stand', 0.6).emo(M('c2_never'), { smile: 0.05, sad: 0.3 });
    sa.look(c2.t0, 'tomas', 0.5).nod(c2.t1 - 0.3, 0.15);
    sa.look(c3.t0, 'cam', 0.5).pose(c3.t0, offerR, 0.45).pose(M('c3_before') - 0.2, fingerUp, 0.35).pose(c3.t1 + 0.1, 'stand', 0.5).emo(c3.t0, { smile: 0.2, brow: 0.4 });
    to.look(c3.t0 + 0.2, 'samuel', 0.5);
    sa.move(c4.t0 - 0.2, c4.t1 + 0.6, -0.62, 0.95).face(c4.t1 + 0.4, 'tomas', 0.5);
    to.move(c4.t0 - 0.3, c4.t1 + 0.5, 0.62, 0.95).face(c4.t1 + 0.3, 'samuel', 0.5);
    to.pose(c4.t0, openUp, 0.5).pose(c4.t1, 'stand', 0.5).look(c4.t0, 'samuel', 0.4);
    sa.pose(c5.t0 - 0.1, P({ rax: -0.75, raz: 0.1, rf: -0.5, lax: -0.75, laz: -0.1, lf: -0.5, g: 0 }), 0.4).pose(c5.t1 + 0.3, 'stand', 0.6).emo(c5.t0, { smile: 0.35, brow: 0.3 });
    for (const a of [sa, to]) a.look(M('c5_close') + 0.2, [0, 1.85, 0.75], 0.6);
    to.look(c6.t0 - 0.1, 'samuel', 0.4).look(M('c6_calc'), [0, 2.1, 0.75], 0.6).emo(c6.t0, { smile: 0.1, sad: 0.3 });

    // ------------------------------------------------------------ 6. CIERRE - DISCURSO DE PAZ
    const ca = S('closing'), d1 = C('d1'), d2 = C('d2'), d3 = C('d3'), d4 = C('d4'), bell = M('bell');
    sh(ca, d2.t0 - 0.1, [0, 4.6, 8.8], [0, 7.6, 10.5], [0, 0.8, -1.0], [0, 0.4, -3.5], 40, 46, 'io');
    sh(d2.t0 - 0.1, d3.t0 - 0.1, [-1.1, 1.6, 2.6], [-0.9, 1.62, 2.4], [-0.62, 1.6, 0.95], [-0.62, 1.62, 0.95], 30, 28, 'lin');
    sh(d3.t0 - 0.1, d4.t0 - 0.2, [1.1, 1.6, 2.6], [0.9, 1.62, 2.4], [0.62, 1.58, 0.95], [0.62, 1.6, 0.95], 30, 28, 'lin');
    sh(d4.t0 - 0.2, bell, [0, 1.55, 3.4], [0, 1.55, 3.05], [0, 1.45, 0.9], [0, 1.48, 0.9], 32, 30, 'lin');
    sh(bell, SE('closing') + 0.5, [0, 1.6, 3.2], [0, 3.4, 7.4], [0, 1.3, 0.9], [0, 2.2, -1.0], 32, 40, 'io');
    sh(SE('closing') + 0.5, TL.dur, [0, 3.6, 7.8], [0, 4.2, 9.5], [0, 2.4, -1.2], [0, 2.8, -1.6], 40, 42, 'lin');
    for (const a of [sa, to]) a.look(ca + 0.3, 'cam', 0.6);
    to.face(d1.t0 - 0.3, 'cam', 0.6).emo(d1.t0, { smile: 0, brow: 0.3 }).pose(M('d1_twelve') - 0.2, P({ lax: -0.6, laz: -0.8, lf: -0.3, rax: -0.6, raz: 0.8, rf: -0.3, g: 0 }), 0.5).pose(d1.t1 + 0.3, 'stand', 0.6);
    sa.face(d1.t0 - 0.2, 'cam', 0.6);
    sa.pose(M('d2_memory') - 0.2, chest, 0.4).pose(d2.t1 + 0.2, 'stand', 0.5).emo(M('d2_memory'), { smile: 0.4, brow: 0.2 });
    to.look(d2.t0 + 0.3, 'samuel', 0.5).look(d3.t0 - 0.1, 'cam', 0.4);
    to.pose(M('d3_calc') - 0.15, P({ rax: -0.85, raz: 0.2, rf: -1.6, g: 0 }), 0.3).pose(M('d3_remember') - 0.1, chest, 0.3)
      .pose(M('d3_decide') - 0.1, P({ rax: -1.2, raz: 0.25, rf: -0.25, g: 0 }), 0.3).pose(d3.t1 + 0.3, 'stand', 0.5).emo(d3.t0, { smile: 0.3, brow: 0.4 });
    sa.look(d3.t0 + 0.2, 'tomas', 0.5).look(d4.t0 - 0.3, 'cam', 0.4).emo(d4.t0 - 0.3, { smile: 0.15, brow: 0.2 });
    to.look(d4.t0, 'cam', 0.4);
    // apreton de manos con la campana
    sa.move(d4.t1 + 0.1, bell + 0.4, -0.4, 1.06).face(d4.t1 + 0.2, PI / 2, 0.6);
    to.move(d4.t1 + 0.1, bell + 0.4, 0.4, 0.84).face(d4.t1 + 0.2, -PI / 2, 0.6);
    sa.pose(bell - 0.1, handshake, 0.6).look(bell, 'tomas', 0.5).emo(bell, { smile: 0.7 });
    to.pose(bell - 0.05, handshake, 0.6).look(bell, 'samuel', 0.5).emo(bell, { smile: 0.7 });
    sa.fx((p, t) => { const w = win(t, bell + 0.6, bell + 3.6, 0.3, 0.4); p.rf += Math.sin((t - bell) * 9) * 0.12 * w; });
    to.fx((p, t) => { const w = win(t, bell + 0.6, bell + 3.6, 0.3, 0.4); p.rf += Math.sin((t - bell) * 9) * 0.12 * w; });
    sa.look(bell + 2.4, 'cam', 0.6); to.look(bell + 2.5, 'cam', 0.6);
  }

  camAt(t) {
    let s = this.shots[0];
    for (const q of this.shots) { if (q.t0 <= t) s = q; else break; }
    const u = s.ease(seg(t, s.t0, s.t1));
    const p = lerp3(s.p0, s.p1, u), l = lerp3(s.l0, s.l1, u);
    const k = 0.012;
    p[0] += noise1(t * 0.55 + 3) * k; p[1] += noise1(t * 0.6 + 9) * k * 0.7; p[2] += noise1(t * 0.5 + 17) * k;
    l[0] += noise1(t * 0.45 + 31) * k * 1.4; l[1] += noise1(t * 0.5 + 43) * k;
    return { pos: p, look: l, fov: lerp(s.f0, s.f1, u), shot: s };
  }

  update(t, camera) {
    const w = this.world, cam = this.camAt(t);
    this.cam = cam;

    // ---- luces / atmosfera
    const lit = M('lights'), sIn = B('stage_in');
    const on = ss(seg(t, lit, lit + 1.4));
    const memA = win(t, B('cranes_in') - 0.3, SE('round2') + 0.8, 1.5, 1.5);
    const close = ss(seg(t, M('bell'), M('bell') + 2.5));
    w.hemi.intensity = lerp(0.04, 0.55, on) * (1 - 0.45 * memA) + 0.1 * close;
    w.key.intensity = lerp(0, 1.25, on) * (1 - 0.5 * memA);
    w.rim.intensity = lerp(0.15, 0.9, on); w.rim2.intensity = lerp(0, 0.45, on) + 0.5 * memA;
    w.spots.forEach((s, i) => { s.intensity = 1.3 * ss(seg(t, lit + i * 0.28, lit + i * 0.28 + 0.5)) * (1 - 0.6 * memA); });
    w.strips.forEach((m, i) => { m.material.opacity = 0.6 * ss(seg(t, lit + 0.3 + Math.abs(i - 6.5) * 0.06, lit + 0.9 + Math.abs(i - 6.5) * 0.06)) * (1 - 0.7 * memA); });
    w.ringMat.opacity = 0.15 + 0.75 * on;

    // ---- reloj (8:14:53 -> 8:15 en el destello; Nagasaki 11:02)
    const fl = M('flash'), n2n = M('n2_nagasaki');
    const clockA = 1 - ss(seg(t, M('n2_eighty') + 0.3, sIn + 0.6));
    w.clock.visible = clockA > 0.01;
    w.clock.position.y = 2.1 + (1 - clockA) * 1.5;
    w.clock.scale.setScalar(0.4 + 0.6 * clockA);
    if (t < fl) { const k = Math.max(0, Math.floor(t - 6.2) + 1); w.setClock(8, 14, Math.min(59, 52 + k)); }
    else if (t < n2n - 0.6) w.setClock(8, 15, 0);
    else { const u = eio(seg(t, n2n - 0.6, n2n + 0.9)); const mins = lerp(8 * 60 + 15, 11 * 60 + 2, u); w.setClock(Math.floor(mins / 60), mins % 60, 0); }
    this.clockSpot.intensity = 2.2 * clockA * (t < 6 ? ss(seg(t, 4.6, 6.2)) : 1) * (1 - win(t, fl, M('back'), 0.02, 0.6));

    // ---- atriles: se hunden cuando empiezan las mediciones
    const ms = M('b4_measure');
    const sink = ss(seg(t, ms - 0.4, ms + 1.8));
    w.lecterns.forEach(l => { l.position.y = -1.15 * sink; l.visible = sink < 0.999; l.userData.led.material.color.setHex(0xffffff); });
    const talkS = speech('samuel', t).w, talkT = speech('tomas', t).w;
    w.lecterns[0].userData.led.material.color.setRGB(0.25 + 0.75 * talkS, 0.25 + 0.05 * talkS, 0.3 + 0.0 * talkS);
    w.lecterns[1].userData.led.material.color.setRGB(0.25 + 0.75 * talkT, 0.25 + 0.05 * talkT, 0.3);

    // ---- personajes
    const ctx = { t, cam: cam.pos, actors: this.actors, speech };
    for (const a of this.duo) { a.root.visible = t > sIn - 0.2; a.body(t, ctx); }
    if (cam.shot.track) {            // plano que sigue un punto del cuerpo (la mano con el grano)
      const o = cam.shot.track();
      cam.pos = [o[0] + cam.pos[0], o[1] + cam.pos[1], o[2] + cam.pos[2]];
      cam.look = [o[0] + cam.look[0], o[1] + cam.look[1], o[2] + cam.look[2]];
    }
    camera.position.set(...cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.lookAt(...cam.look); camera.updateMatrixWorld(true);
    ctx.cam = cam.pos;
    for (const a of this.duo) a.faceAnim(t, ctx);

    // ---- M1: grano y torre
    const m1 = C('m1'), gIn = M('m1_gram') - 0.25, gOut = BE('tower') - 0.3;
    const gw = win(t, gIn, gOut, 0.5, 0.6);
    w.grain.visible = gw > 0.01;
    if (w.grain.visible) {
      const h = this.grainHand.handPos('r'); w.grain.position.set(h.x, h.y + 0.055, h.z);
      const pulseK = 1 + 0.08 * Math.sin(t * 6);
      w.grain.scale.setScalar(gw * pulseK); w.grainLight.intensity = 1.6 * gw; w.grainGlow.material.opacity = gw;
    }
    const tk = seg(t, M('m2_fifteen') - 0.5, M('m2_fifteen') + 2.4);
    const towerOut = 1 - ss(seg(t, BE('tower') - 0.2, BE('tower') + 1.0));
    w.setTower(t < M('m2_fifteen') - 0.5 ? 0 : eo(tk), towerOut);

    // ---- M2/M3: mapa termico y discos de rendimiento
    const m3 = C('m3'), m6 = C('m6'), m7 = C('m7');
    const mapA = ss(seg(t, BE('tower') - 0.1, BE('tower') + 1.5)) * (1 - ss(seg(t, m7.t0 - 0.2, m7.t0 + 1.0)));
    const heatOn = ss(seg(t, M('m3_heat') - 0.4, M('m3_heat') + 0.6)) * (1 - 0.75 * ss(seg(t, m6.t0, m6.t0 + 1.2)));
    const sweep = lerp(0, 3.7, eio(seg(t, M('m3_square') - 0.3, M('m4_half') + 1.8)));
    w.setMap(mapA, heatOn, sweep, heatOn * mapA * (1 - ss(seg(t, m6.t0, m6.t0 + 1)) ));
    w.rings.forEach((r, i) => { r.material.opacity = 0.9 * mapA * ss(seg(t, M('m4_half') + i * 0.35 - 0.2, M('m4_half') + i * 0.35 + 0.3)) * (1 - 0.8 * ss(seg(t, m6.t0, m6.t0 + 1))); });
    const yd = w.yieldDiscs;
    const d15 = ss(seg(t, m6.t0 - 0.2, m6.t0 + 0.6)) * mapA, g300 = eio(seg(t, M('m6_three') + 0.4, M('m6_cube') + 0.2));
    yd[0].m.material.opacity = 0.32 * d15; yd[0].edge.material.opacity = 0.95 * d15;
    yd[1].m.material.opacity = 0; yd[1].edge.material.opacity = 0;
    const s300 = lerp(yd[0].r / yd[2].r, 1, g300), a300 = mapA * ss(seg(t, M('m6_three') + 0.2, M('m6_three') + 0.6));
    yd[2].m.scale.setScalar(s300); yd[2].edge.scale.setScalar(s300);
    yd[2].m.material.opacity = (0.08 + 0.22 * ss(seg(t, M('m6_area') - 0.2, M('m6_area') + 0.6))) * a300; yd[2].edge.material.opacity = 0.95 * a300;

    // ---- M4: decaimiento
    const decA = win(t, m7.t0 + 0.3, C('m8').t0 + 0.2, 1.2, 0.9);
    const days = decayDays(t);
    w.setDecay(decA, fI131(days), fCs137(days), t - m7.t0);

    // ---- M5: dosis
    const m8 = C('m8');
    const doseA = win(t, m8.t0 + 0.2, B('cranes_in') + 0.6, 0.9, 1.0);
    w.setDose(doseA, seg(t, M('m8_risk') - 0.4, M('m8_gray') + 0.6));

    // ---- grullas (memoria) y regreso en el cierre
    const crA = win(t, B('cranes_in') - 0.2, S('round3') + 2.5, 1.8, 2.0) + 0.9 * ss(seg(t, M('d2_memory') - 0.4, M('d2_memory') + 2.5));
    w.setCranes(clamp(crA), t - B('cranes_in') + 30);

    // ---- cristales de la dialectica
    const c1k = M('c1_keep'), c2k = M('c2_keep'), c3 = C('c3'), cl5 = M('c5_close');
    const merge = eio(seg(t, c3.t0 + 1.0, cl5));
    const bob = (k) => Math.sin(t * 1.6 + k) * 0.04;
    const thA = ss(seg(t, c1k - 0.2, c1k + 0.6)) * (1 - ss(seg(t, cl5 - 0.1, cl5 + 0.3)));
    const anA = ss(seg(t, c2k - 0.2, c2k + 0.6)) * (1 - ss(seg(t, cl5 - 0.1, cl5 + 0.3)));
    const syA = ss(seg(t, cl5 - 0.1, cl5 + 0.7)) * (1 - ss(seg(t, SE('round3') - 0.5, SE('round3') + 1.0)));
    const center = [0, 1.85, 0.75];
    const pth = lerp3([-1.05, 1.95, 1.25], center, merge), pan = lerp3([1.05, 1.95, 1.25], center, merge);
    w.cThesis.visible = thA > 0.01; w.cThesis.position.set(pth[0], pth[1] + bob(0), pth[2]); w.cThesis.scale.setScalar(0.72 * thA * (1 - 0.4 * merge)); w.cThesis.rotation.set(t * 0.7, t * 1.1, 0);
    w.cAnti.visible = anA > 0.01; w.cAnti.position.set(pan[0], pan[1] + bob(2), pan[2]); w.cAnti.scale.setScalar(0.72 * anA * (1 - 0.4 * merge)); w.cAnti.rotation.set(-t * 0.8, -t * 0.9, 0);
    const rise = ss(seg(t, M('c6_calc') - 0.5, SE('round3')));
    w.cSynth.visible = syA > 0.01; w.cSynth.position.set(center[0], center[1] + rise * 0.35 + bob(4), center[2]);
    w.cSynth.scale.setScalar(syA * (1 + 0.15 * Math.exp(-Math.max(0, t - cl5) * 3))); w.cSynth.rotation.set(t * 0.4, t * 0.6, 0);

    // ---- ojivas
    const d1t = M('d1_twelve'), d2m = M('d2_memory');
    const wf = t < d2m ? eo(seg(t, d1t - 0.3, d1t + 2.2)) : 1 - eio(seg(t, d2m + 0.2, d2m + 3.2));
    w.setWarheads(t > d1t - 0.4 && wf > 0.001 ? 1 : 0, wf);
  }
}
