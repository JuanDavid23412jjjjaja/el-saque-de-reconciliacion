// story.js - Coreografia completa de 180 s: actuacion de los tres estudiantes, balon, camaras y estado del coliseo.
// Los tiempos salen de timeline.js (generado desde el guion y las voces reales).
import { TL } from './timeline.js';
import { clamp, lerp, lerp3, seg, ss, eio, EASE, noise1, win } from './lib.js';
import { Actor, POSES } from './rig.js';
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

const PI = Math.PI;
const pose = (base, o) => ({ base, o });

export class Story {
  constructor(world, builder, scene) {
    this.world = world;
    const mk = (root, id, seed) => { const a = new Actor(root, builder, seed); a.id = id; scene.add(root); return a; };
    const so = mk(builder.buildSofia(), 'sofia', 1), ju = mk(builder.buildJuanDiego(), 'juan', 2), ma = mk(builder.buildMartin(), 'martin', 3);
    // Rivales holograficos (equipo visitante virtual)
    this.holoMat = new THREE.MeshBasicMaterial({ color: 0x2cb8ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
    const holo = (root, id, seed) => {
      const a = mk(root, id, seed);
      root.traverse(n => { if (n.isMesh) { n.material = this.holoMat; n.castShadow = false; n.receiveShadow = false; } });
      a.mouthBase = null; return a;
    };
    const oa = holo(builder.buildJuanDiego(), 'oa', 4), ob = holo(builder.buildSofia(), 'ob', 5), oc = holo(builder.buildMartin(), 'oc', 6);
    this.actors = { sofia: so, juan: ju, martin: ma, oa, ob, oc };
    this.trio = [so, ju, ma]; this.holos = [oa, ob, oc];
    this.shots = []; this.nodes = [];
    this._script(so, ju, ma, oa, ob, oc);
    for (const a of Object.values(this.actors)) a.finalize();
    this.shots.sort((a, b) => a.t0 - b.t0);
    this._resolveBall();
  }

  sh(t0, t1, p0, p1, l0, l1, f0 = 36, f1 = f0, ease = 'io') { this.shots.push({ t0, t1, p0, p1, l0, l1, f0, f1, ease: EASE[ease] }); }

  // =====================================================================================
  _script(so, ju, ma, oa, ob, oc) {
    const N = this.nodes, sh = this.sh.bind(this);
    const A = this.actors;
    const waveFx = (a, t0, t1) => a.fx((p, t) => { const w = win(t, t0, t1, 0.25, 0.25); if (w > 0) { p.rfz += Math.sin(t * 11) * 0.4 * w; p.raz += Math.sin(t * 11 + 0.5) * 0.1 * w; } });
    const presentL = { lax: -0.35, laz: -1.05, lf: -0.25, g: 0 }, presentR = { rax: -0.35, raz: 1.05, rf: -0.25, g: 0 };

    // ------------------------------------------------------------------ 1. PRESENTACION
    const i1 = C('i1'), i2 = C('i2'), i3 = C('i3'), i4 = C('i4');
    const tIn = M('wipe_in') - 0.35;
    ma.at(0, -3.3, 4.3).move(tIn, 8.9, 1.4, 3.5).face(0, PI / 2).face(8.6, 'cam', 0.6);
    so.at(0, -4.6, 4.7).move(tIn + 0.1, 9.0, 0, 3.9).face(0, PI / 2).face(8.7, 'cam', 0.6);
    ju.at(0, -5.9, 4.2).move(tIn + 0.2, 9.1, -1.4, 3.5).face(0, PI / 2).face(8.8, 'cam', 0.6);
    ma.pose(0, 'holdLow', 0.01); so.pose(0, 'stand', 0.01); ju.pose(0, 'stand', 0.01);
    so.look(0, null).look(8.3, 'cam', 0.5); ju.look(0, null).look(8.6, 'sofia', 0.4); ma.look(0, null).look(8.5, 'sofia', 0.4);
    so.emo(0, { smile: 0.8 }); ju.emo(0, { smile: 0.6 }); ma.emo(0, { smile: 0.6 });
    // i1: Sofia saluda y presenta
    so.pose(i1.t0 - 0.2, 'wave', 0.3); waveFx(so, i1.t0 - 0.1, M('i1_sofia') - 0.35);
    so.pose(M('i1_sofia') - 0.35, pose('stand', { rax: -0.9, raz: -0.3, rf: -2.0, g: 0 }), 0.3);     // mano al pecho
    so.pose(M('i1_juan') - 0.2, presentL, 0.3).look(M('i1_juan') - 0.15, 'juan', 0.25);
    so.pose(M('i1_martin') - 0.2, presentR, 0.3).look(M('i1_martin') - 0.15, 'martin', 0.25);
    so.pose(M('i1_martin') + 0.65, 'talk2', 0.4).look(M('i1_martin') + 0.6, 'cam', 0.3);
    so.pose(i1.t1 - 0.1, 'stand', 0.5);
    ju.look(M('i1_juan') - 0.1, 'cam', 0.25).pose(M('i1_juan') - 0.05, 'salute', 0.25).pose(M('i1_juan') + 0.75, 'stand', 0.4).nod(M('i1_juan') + 0.15, 0.15);
    ma.look(M('i1_martin') - 0.1, 'cam', 0.25).pose(M('i1_martin') - 0.05, 'present', 0.3).pose(M('i1_martin') + 0.85, 'holdLow', 0.45);
    // i2: Juan Diego da un paso al frente
    ju.move(i2.t0 - 0.25, i2.t0 + 0.7, -1.2, 4.2, { noTurn: true }).pose(i2.t0, 'talk1', 0.35).pose(i2.t0 + 1.9, 'thumbBack', 0.3).pose(i2.t1, 'stand', 0.45);
    ju.emo(i2.t0, { smile: 0.7, brow: 0.3 }).move(i3.t0 - 0.05, i3.t0 + 0.9, -1.4, 3.5, { noTurn: true });
    so.look(i2.t0 - 0.1, 'juan', 0.3); ma.look(i2.t0 - 0.1, 'juan', 0.3);
    // i3: Martin juega con el balon y se lo pasa a Sofia
    const tA = i3.t0 + 0.25, tP = i3.t1 - 0.3;
    ma.look(i3.t0 - 0.15, 'cam', 0.3); so.look(i3.t0, 'martin', 0.3); ju.look(i3.t0, 'martin', 0.3);
    ma.pose(tA - 0.22, 'hold', 0.2).pose(tA + 0.1, 'holdLow', 0.3).pose(tA + 0.55, 'hold', 0.2).pose(tA + 0.85, 'holdLow', 0.3);
    N.push({ t: 0, t2: tA, src: { a: 'martin' }, h: 0.5 });
    N.push({ t: tA + 0.72, t2: tP + 0.08, src: { a: 'martin' }, h: 0.32 });
    ma.face(tP - 0.3, 'sofia', 0.3).pose(tP - 0.1, 'throwFwd', 0.18).pose(tP + 0.25, 'stand', 0.4).face(tP + 0.5, 'cam', 0.5);
    so.face(tP - 0.25, 'martin', 0.3).pose(tP + 0.1, 'catch', 0.25).pose(tP + 0.5, 'hold', 0.25).face(tP + 0.5, 'cam', 0.4);
    // i4: la pregunta
    so.look(i4.t0 - 0.2, 'cam', 0.25).emo(i4.t0 - 0.1, { smile: 0.45, brow: 0.7 }).pose(i4.t0 + 0.95, 'present', 0.4);
    ju.look(i4.t0, 'sofia', 0.3).look(i4.t0 + 1.0, 'cam', 0.3); ma.look(i4.t0, 'sofia', 0.3).look(i4.t0 + 1.0, 'cam', 0.3);
    so.pose(M('toss') - 0.24, 'hold', 0.16).pose(M('toss') - 0.06, 'throwFwd', 0.14, 'o').pose(M('toss') + 0.5, 'stand', 0.4);
    N.push({ t: tP + 0.45, t2: M('toss') + 0.02, src: { a: 'sofia' }, h: 0.12 });
    N.push({ t: M('title_hit') - 0.03, src: [0, 1.4, 5.86], hide: true });

    sh(4.4, 9.3, [7, 8.5, 14], [0.9, 1.75, 10.3], [0, 2.4, 0], [0, 1.6, 3.7], 42, 36);
    sh(9.3, i2.t0 - 0.12, [0.9, 1.75, 10.3], [-0.8, 1.6, 9.3], [0, 1.6, 3.7], [0, 1.5, 3.7], 36, 34);
    sh(i2.t0 - 0.12, i3.t0 - 0.12, [-3.0, 1.55, 7.2], [-2.6, 1.5, 6.8], [-1.15, 1.42, 4.1], [-1.15, 1.42, 4.2], 30);
    sh(i3.t0 - 0.12, i4.t0 - 0.28, [2.9, 1.5, 6.9], [2.5, 1.46, 6.5], [1.25, 1.3, 3.6], [1.25, 1.3, 3.6], 30);
    sh(i4.t0 - 0.28, 26, [0, 1.5, 7.6], [0, 1.42, 6.1], [0, 1.3, 3.9], [0, 1.3, 3.9], 32, 30);

    // ------------------------------------------------------------------ 2. EL PROBLEMA
    const tp = 26, p1 = C('p1'), p2 = C('p2'), p3 = C('p3'), p4 = C('p4'), p5 = C('p5'), p6 = C('p6');
    const jump = M('jump'), hit1 = M('hit1'), land1 = M('land1'), X0 = B('exclusion'), ask = M('ask'), ign = M('ignore'), hit2 = M('hit2'), sad = M('sad');
    ma.at(tp, 1.3, 1.25).face(tp, [3.6, 5], 0.01); so.at(tp, -1.3, 2.0).face(tp, [-0.6, 0.6], 0.01); ju.at(tp, -1.0, 4.2).face(tp, PI, 0.01);
    ma.pose(tp, 'stand', 0.01); so.pose(tp, 'hold', 0.01); ju.pose(tp, 'stand', 0.01);
    ma.emo(tp, { smile: 0.3 }); so.emo(tp, { smile: 0.3 }); ju.emo(tp, { smile: 0.5 });
    ma.look(tp, 'cam', 0.01); so.look(tp, 'martin', 0.01); ju.look(tp, 'martin', 0.01);
    // p1: Martin y la red alta
    ma.pose(p1.t0, 'talk1', 0.35).face(M('p1_red') - 0.55, [1.1, -3], 0.55).look(M('p1_red') - 0.4, [1.2, 2.7, 0], 0.3)
      .pose(M('p1_red') - 0.35, 'pointUp', 0.35).pose(M('p1_red') + 0.8, 'reach', 0.4)
      .fx((p, t) => { const w = win(t, M('p1_red') + 1.0, M('p1_gana') - 0.2, 0.2, 0.2); p.lift += w * (0.05 + 0.035 * Math.abs(Math.sin(t * 7))); })
      .face(M('p1_gana') - 0.35, [3.6, 5], 0.5).look(M('p1_gana') - 0.3, 'cam', 0.3).pose(M('p1_gana') - 0.3, 'shrug', 0.4).emo(M('p1_gana') - 0.3, { smile: 0.1, brow: 0.5 })
      .pose(jump - 0.3, 'stand', 0.5).look(jump - 0.3, 'juan', 0.3);
    // Sofia lanza, Juan Diego salta y remata
    const tT = jump - 0.6;
    so.pose(tT - 0.2, 'tossUp', 0.2, 'o').pose(tT + 0.35, 'stand', 0.5).look(tT, 'ball', 0.2).look(land1 + 0.3, 'juan', 0.4)
      .move(land1 + 0.1, land1 + 1.3, -2.7, 1.2, { noTurn: true }).move(p2.t0 + 0.8, p2.t0 + 2.2, -2.3, 2.5, { noTurn: true });
    N.push({ t: tp, t2: tT, cut: true, src: { a: 'sofia' }, h: 0.35 });
    ju.move(jump - 0.95, jump - 0.05, -0.6, 1.3).look(tp + 1, 'ball', 0.3)
      .pose(jump - 0.3, 'crouch', 0.25).pose(jump - 0.04, 'jumpLoad', 0.32, 'o').pose(hit1 - 0.1, pose('jumpHit', { rax: -2.6, rf: -0.1 }), 0.1).pose(hit1, 'jumpHit', 0.12, 'o')
      .pose(hit1 + 0.1, 'land', 0.36, 'i').pose(land1 + 0.14, 'stand', 0.4).face(land1 + 0.15, 'cam', 0.55).look(land1 + 0.2, 'cam', 0.4);
    N.push({ t: hit1, src: { a: 'juan', m: 'r' }, h: 0.02, trail: true });
    N.push({ t: land1, src: [0.9, 0.115, -5.2], h: 0.55, impact: 1 });
    N.push({ t: land1 + 0.7, src: [1.5, 0.115, -8.0], h: 0.25 });
    N.push({ t: land1 + 1.25, src: [1.8, 0.115, -9.6], hide: true });
    // p2: "con los mejores"
    ju.pose(p2.t0 - 0.2, 'hips', 0.4).emo(p2.t0 - 0.2, { smile: 0.85, brow: 0.3 }).pose(p2.t0 + 1.0, 'talk1', 0.35).pose(p2.t1 - 0.25, 'hips', 0.4);
    ma.look(p2.t0 + 0.9, [1.6, 0.2, 2.6], 0.6).pose(p2.t0 + 0.9, pose('stand', { hx: 0.25, sx: 0.1, g: 0 }), 0.6).emo(p2.t0 + 0.9, { smile: 0, sad: 0.6 }, 0.6);
    so.look(p2.t0, 'juan', 0.3);
    // Exclusion actuada: Martin pide el balon y lo ignoran
    N.push({ t: X0, t2: ign, cut: true, src: { a: 'sofia' }, h: 0.55 });
    so.pose(X0 - 0.01, 'hold', 0.01).look(X0 + 0.05, 'martin', 0.3).face(X0, 'martin', 0.4)
      .face(ign - 0.5, 'juan', 0.35).look(ign - 0.5, 'juan', 0.25).pose(ign - 0.14, 'throwFwd', 0.16, 'o').pose(ign + 0.3, 'stand', 0.45);
    ma.face(X0 - 0.1, 'sofia', 0.4).look(X0 - 0.1, 'sofia', 0.3).emo(X0, { smile: 0.7, brow: 0.7 }, 0.3).move(X0, ask + 0.45, 0.9, 2.0, { noTurn: true })
      .pose(ask - 0.2, 'ask', 0.3).fx((p, t) => { const w = win(t, ask, ign + 0.35, 0.2, 0.3); if (w > 0) { p.laz -= Math.sin(t * 10) * 0.28 * w; p.raz += Math.sin(t * 10) * 0.28 * w; p.lift += Math.abs(Math.sin(t * 5)) * 0.05 * w; } })
      .look(ign + 0.1, 'ball', 0.2).pose(sad - 0.3, 'sad', 0.75).emo(sad - 0.3, { smile: 0, sad: 1 }, 0.5).look(sad, [1.4, 0, 3.4], 0.5)
      .face(sad + 0.25, [3.5, 6.5], 1.0).move(sad + 0.45, sad + 1.7, 1.9, 2.9, { noTurn: true });
    ju.face(X0 - 0.2, 'sofia', 0.4).look(X0, 'sofia', 0.3).pose(ign - 0.55, 'catch', 0.3).face(ign + 0.15, PI, 0.4).look(ign, 'ball', 0.2)
      .pose(ign + 0.3, pose('jumpLoad', { lift: 0.22 }), 0.45, 'o').pose(hit2 - 0.1, pose('jumpHit', { rax: -2.6, rf: -0.1, lift: 0.3 }), 0.1).pose(hit2, pose('jumpHit', { lift: 0.25 }), 0.12, 'o')
      .pose(hit2 + 0.1, 'land', 0.22, 'i').pose(hit2 + 0.4, pose('stand', { rax: -2.9, raz: 0.25, rf: -0.5, g: 0 }), 0.35).emo(hit2, { smile: 1, brow: 0.4 }).pose(hit2 + 1.4, 'stand', 0.5);
    N.push({ t: hit2, src: { a: 'juan', m: 'r' }, h: 1.35, trail: true });
    N.push({ t: hit2 + 0.8, src: [-1.2, 0.115, -6.2], h: 0.3, impact: 0.6 });
    N.push({ t: hit2 + 1.4, src: [-1.6, 0.115, -8.4], hide: true });
    so.look(sad + 0.2, 'martin', 0.4).emo(sad + 0.2, { smile: 0, sad: 0.5 }, 0.5);
    // p3: Sofia presenta la encuesta (ella a la izquierda, panel a la derecha)
    so.move(sad + 0.55, p3.t0 + 0.35, -2.0, 5.2).face(p3.t0 + 0.2, 'cam', 0.5).look(p3.t0 - 0.2, 'cam', 0.3)
      .pose(p3.t0, 'talk1', 0.4).pose(M('p3_73') - 0.2, presentR, 0.35).pose(M('p3_pct') - 0.3, 'talk2', 0.4).pose(M('p3_excl') - 0.2, 'open', 0.4)
      .emo(p3.t0, { smile: 0.05, sad: 0.3 }).pose(p3.t1, 'stand', 0.5);
    ma.move(p3.t0 + 1.2, p4.t0 - 0.4, 2.0, 5.1).face(p4.t0 - 0.6, 'cam', 0.5).pose(p3.t0 + 1.0, 'stand', 0.6).look(p4.t0 - 0.5, 'cam', 0.3);
    ju.look(p3.t0, 'sofia', 0.4).emo(p3.t0, { smile: 0.1 }, 0.5);
    // p4: Martin (a la derecha, panel a la izquierda)
    ma.pose(p4.t0, 'talk1', 0.35).pose(M('p4_pct') - 0.1, presentL, 0.35).pose(M('p4_pct') + 1.7, 'open', 0.4).pose(p4.t1, 'stand', 0.5).emo(p4.t0, { smile: 0, sad: 0.55 });
    so.move(p4.t0 + 0.4, p4.t0 + 2.1, -0.9, 5.0, { noTurn: true }).look(p4.t0 + 0.4, 'martin', 0.4);
    ju.move(p4.t0 + 0.5, p5.t0 - 0.25, 0.2, 3.4).face(p5.t0 - 0.5, 'cam', 0.4);
    // p5: Juan Diego camina hacia camara y reconoce las quejas
    ju.move(p5.t0 - 0.25, p5.t0 + 2.6, 0.5, 5.3, { noTurn: true }).pose(p5.t0 - 0.1, 'think', 0.5).look(p5.t0 - 0.2, [0.5, 0.6, 7.5], 0.4).emo(p5.t0 - 0.2, { smile: 0, sad: 0.5, brow: -0.2 }, 0.5)
      .pose(M('p5_q1') - 0.1, 'talk1', 0.35).look(M('p5_q1') - 0.1, 'cam', 0.3).pose(M('p5_q2') - 0.1, 'open', 0.4).pose(p5.t1 - 0.1, pose('stand', { hx: 0.22, sx: 0.08, g: 0 }), 0.5);
    ma.move(p5.t0 + 0.3, p5.t0 + 1.9, 1.7, 5.1, { noTurn: true }).look(p5.t0, 'juan', 0.4); so.look(p5.t0, 'juan', 0.4);
    // p6: "Eso no es competir. Eso es excluir."
    so.look(p6.t0 - 0.25, 'cam', 0.3).emo(p6.t0 - 0.2, { smile: 0, brow: -0.55 }, 0.4).pose(p6.t0 - 0.1, pose('stand', { rax: -1.15, raz: 0.45, rf: -1.6, g: 0 }), 0.35)
      .fx((p, t) => { const w = win(t, p6.t0 + 0.1, M('p6_excluir') - 0.4, 0.2, 0.3); p.rfz += Math.sin(t * 9) * 0.3 * w; p.hy += Math.sin(t * 9) * 0.07 * w; })
      .pose(M('p6_excluir') - 0.25, 'open', 0.3).pose(p6.t1 + 0.1, 'stand', 0.5);
    ju.look(p6.t0, 'sofia', 0.3).look(M('p6_excluir') + 0.3, 'cam', 0.4).nod(M('p6_excluir') + 0.35, 0.2).pose(p6.t0, 'stand', 0.5);
    ma.look(p6.t0, 'sofia', 0.3).look(M('p6_excluir') + 0.3, 'cam', 0.4).nod(M('p6_excluir') + 0.5, 0.18);

    sh(tp, M('p1_gana') - 0.15, [4.5, 0.95, 5.7], [3.9, 1.15, 5.0], [1.0, 1.65, 0.5], [1.0, 1.9, 0.4], 40);
    sh(M('p1_gana') - 0.15, BE('spike1'), [1.3, 1.0, -3.6], [0.7, 1.5, -2.6], [-0.7, 1.7, 1.6], [-0.6, 2.5, 0.9], 46, 40);
    sh(BE('spike1'), X0, [-2.3, 1.5, 3.9], [-2.0, 1.5, 3.6], [-0.4, 1.42, 1.3], [-0.4, 1.42, 1.3], 34);
    sh(X0, sad + 0.3, [0.5, 2.3, 7.7], [0.1, 2.0, 7.0], [-0.3, 1.35, 1.8], [-0.3, 1.35, 1.8], 38);
    sh(sad + 0.3, p3.t0 - 0.15, [3.7, 1.35, 5.8], [3.5, 1.35, 5.5], [1.3, 1.25, 2.3], [1.6, 1.22, 2.6], 30);
    sh(p3.t0 - 0.15, p4.t0 - 0.12, [-0.5, 1.5, 9.1], [-0.6, 1.48, 8.8], [-0.75, 1.3, 5.2], [-0.8, 1.3, 5.2], 36);
    sh(p4.t0 - 0.12, p5.t0 - 0.12, [0.5, 1.5, 9.1], [0.6, 1.48, 8.8], [0.75, 1.3, 5.2], [0.8, 1.3, 5.2], 36);
    sh(p5.t0 - 0.12, p6.t0 - 0.15, [0.3, 1.55, 9.6], [0.5, 1.5, 8.5], [0.3, 1.4, 4.6], [0.5, 1.4, 5.3], 34);
    sh(p6.t0 - 0.15, S('history'), [0.1, 1.55, 8.9], [0.3, 1.5, 8.0], [0.4, 1.74, 5.1], [0.4, 1.72, 5.1], 34);

    // ------------------------------------------------------------------ 3. LA HISTORIA (Ruanda - Colombia 2016)
    const S3 = S('history'), h3 = C('h3'), h4 = C('h4'), h5 = C('h5'), h6 = C('h6');
    for (const a of this.trio) a.face(S3 - 0.05, PI, 0.6).look(S3, [0, 5.6, -15.6], 0.4).emo(S3, { smile: 0.2, brow: 0.3 });
    ju.pose(S3 + 0.25, 'pointUp', 0.4);
    const th = 67;
    ju.at(th, -1.9, 4.7).face(th, 'sofia', 0.01).pose(th, 'stand', 0.01).look(th, 'sofia', 0.01);
    so.at(th, -0.5, 4.9).face(th, 'juan', 0.01).pose(th, 'stand', 0.01).look(th, 'juan', 0.01);
    ma.at(th, 0.35, 4.2).face(th, 'juan', 0.01).pose(th, 'stand', 0.01).look(th, 'juan', 0.01);
    ju.pose(h3.t0 - 0.2, 'open', 0.3).emo(h3.t0 - 0.3, { smile: 0, brow: 1 }, 0.25).fx((p, t) => { const w = win(t, h3.t0, h3.t1 + 0.3, 0.3, 0.3); p.sx += 0.12 * w; });
    so.nod(h4.t0 - 0.05, 0.25).emo(h4.t0 - 0.2, { smile: 0.75, brow: 0.2 }).pose(h4.t0 + 0.4, 'talk1', 0.4)
      .face(M('h4_premio') - 0.5, 'cam', 0.6).look(M('h4_premio') - 0.4, 'cam', 0.35).pose(M('h4_premio') - 0.15, 'pointUp', 0.35).pose(M('h4_premio') + 1.3, 'talk2', 0.4)
      .pose(M('h4_perdon') - 0.2, pose('stand', { rax: -0.9, raz: -0.32, rf: -2.0, g: 0 }), 0.4).pose(h4.t1 + 0.2, 'stand', 0.5);
    ju.pose(h4.t0, 'stand', 0.5).emo(h4.t0 + 1, { smile: 0.5, brow: 0.3 }, 0.6).nod(M('h4_perdon') + 0.7, 0.2);
    ma.look(h4.t0 - 0.2, 'sofia', 0.3).emo(h4.t0, { smile: 0.6 }).nod(M('h4_premio') + 0.8, 0.15);
    const th2 = 87;
    ju.at(th2, -1.8, 4.8).face(th2, 'cam', 0.01).pose(th2, 'think', 0.01).look(th2, 'sofia', 0.01).emo(th2, { smile: 0.3, brow: 0.2 }, 0.01);
    so.at(th2, -0.5, 5.1).face(th2, 'cam', 0.01).pose(th2, 'stand', 0.01).look(th2, 'cam', 0.01).emo(th2, { smile: 0.6 }, 0.01);
    ma.at(th2, 0.8, 4.8).face(th2, 'cam', 0.01).pose(th2, 'stand', 0.01).look(th2, 'sofia', 0.01).emo(th2, { smile: 0.4 }, 0.01);
    so.pose(h6.t0, 'talk1', 0.35).pose(M('h6_si') - 0.3, 'open', 0.35).emo(M('h6_si') - 0.3, { smile: 0.9, brow: 0.7 }).pose(h6.t1 + 0.1, 'stand', 0.4);
    ju.look(M('h6_si'), 'martin', 0.3).nod(M('h6_si') + 0.45, 0.2).pose(M('h6_si') + 0.3, 'stand', 0.4).emo(M('h6_si'), { smile: 0.9, brow: 0.4 }).look(h6.t1, 'cam', 0.3);
    ma.look(M('h6_si'), 'juan', 0.3).nod(M('h6_si') + 0.6, 0.2).pose(M('h6_si') + 0.5, pose('stand', { rax: -1.6, raz: 0.3, rf: -2.0, g: 0 }), 0.3).emo(M('h6_si'), { smile: 0.9 }).look(h6.t1, 'cam', 0.3);

    sh(S3, th, [0.4, 2.2, 9.6], [0, 5.3, -6.5], [0.3, 3.6, 0], [0, 5.6, -15.6], 40, 30, 'i');
    this.shots[this.shots.length - 1].t1 = M('zoom') + 0.6;
    sh(th, h4.t0 - 0.1, [-0.9, 1.52, 6.6], [-1.1, 1.5, 6.3], [-1.85, 1.47, 4.7], [-1.85, 1.47, 4.7], 28);
    sh(h4.t0 - 0.1, th2, [0.6, 1.5, 8.3], [0.5, 1.48, 7.8], [0.3, 1.3, 4.9], [0.3, 1.3, 4.9], 36);
    sh(th2, S('rule'), [-0.5, 1.6, 8.7], [-0.5, 1.5, 7.9], [-0.5, 1.32, 4.9], [-0.5, 1.32, 4.9], 34);

    // ------------------------------------------------------------------ 4. LA REGLA
    const S4 = S('rule'), r1 = C('r1'), r2 = C('r2'), r3 = C('r3'), r4 = C('r4'), r5 = C('r5'), r6 = C('r6');
    const pel = M('r2_pelvis');
    ju.at(S4, -5.2, 3.5).move(S4, r1.t0 + 1.9, -1.7, 2.8).face(S4, PI / 2, 0.01).face(r1.t0 + 1.7, 'martin', 0.4).pose(S4, 'stand', 0.01).look(S4, 'martin', 0.01).emo(S4, { smile: 0.4, brow: 0.6 }, 0.01);
    ma.at(S4, -3.6, 3.0).move(S4, r1.t0 + 1.7, 0.1, 2.3).face(S4, PI / 2, 0.01).face(r1.t0 + 1.5, 'cam', 0.5).pose(S4, 'stand', 0.01).look(S4, null, 0.01).look(r1.t0 + 1.2, 'juan', 0.3).emo(S4, { smile: 0.5 }, 0.01);
    so.at(S4, -2.0, 3.7).move(S4, r1.t0 + 1.5, 1.8, 2.8).face(S4, PI / 2, 0.01).face(r1.t0 + 1.3, 'cam', 0.5).pose(S4, 'stand', 0.01).look(S4, null, 0.01).look(r1.t0 + 1.4, 'juan', 0.3).emo(S4, { smile: 0.5 }, 0.01);
    ju.pose(r1.t0 + 1.2, 'shrug', 0.4).pose(r2.t0 + 0.2, 'stand', 0.5).face(r2.t0 + 0.6, 'cam', 0.6);
    ma.look(r2.t0 - 0.15, 'cam', 0.3).pose(r2.t0 - 0.1, 'pointUp', 0.3).pose(pel - 0.3, 'squat', 0.45).pose(pel + 0.15, 'sit', 0.5).pose(pel + 1.0, 'sitKnees', 0.4);
    ju.pose(pel + 0.55, 'squat', 0.45).pose(pel + 1.0, 'sit', 0.5).look(r2.t0 + 0.3, 'martin', 0.3);
    so.pose(pel + 0.9, 'squat', 0.45).pose(pel + 1.35, 'sit', 0.5).look(r2.t0, 'martin', 0.3);
    this.sitT = { martin: pel + 0.45, juan: pel + 1.3, sofia: pel + 1.65 };
    // r3: la red baja, la cancha se reduce (giran para mirarla)
    const red = M('r3_red'), can = M('r3_cancha');
    so.face(r3.t0 - 0.45, [-0.4, 0.2], 0.7).look(r3.t0 - 0.3, [0.4, 1.9, 0], 0.3).pose(red - 0.25, 'sitPoint', 0.35).look(red + 1.5, [0.4, 1.1, 0], 1.0).pose(can - 0.2, 'sitOpen', 0.4).pose(r3.t1 + 0.2, 'sit', 0.5);
    ju.face(r3.t0 - 0.35, [0.4, 0.2], 0.7).look(r3.t0 - 0.2, [0, 2.0, 0], 0.3).look(red + 1.5, [0, 1.1, 0], 1.0).emo(red, { smile: 0.3, brow: 0.8 }, 0.5);
    ma.face(r3.t0 - 0.4, [0.1, -0.2], 0.7).look(r3.t0 - 0.2, [0, 2.0, 0], 0.3).look(red + 1.5, [0, 1.1, 0], 1.0).pose(r3.t0 - 0.4, 'sit', 0.4);
    for (const a of this.trio) a.face(r4.t0 - 0.55, 'cam', 0.6);
    // r4: sin salto
    const sal = M('r4_salto'), eq = M('r4_equipo');
    ju.look(r4.t0 - 0.3, 'cam', 0.3).pose(sal - 0.15, 'sitReach', 0.4).look(sal - 0.1, [-1.7, 3, 3.2], 0.3).emo(sal, { smile: 0, brow: 0.5 }, 0.3)
      .fx((p, t) => { const w = win(t, sal + 0.2, sal + 1.3, 0.2, 0.2); p.sx -= 0.06 * w * (1 + Math.sin(t * 8)); })
      .pose(sal + 1.35, 'sit', 0.45).look(sal + 1.4, 'cam', 0.3).emo(sal + 1.3, { smile: 0.1, sad: 0.3 }, 0.4)
      .pose(eq - 0.15, 'sitOpen', 0.4).look(eq, 'martin', 0.3).look(eq + 0.75, 'sofia', 0.3).look(eq + 1.35, 'cam', 0.3).emo(eq - 0.1, { smile: 0.9, brow: 0.3 }, 0.4).pose(r4.t1 + 0.1, 'sit', 0.5);
    ma.look(r4.t0, 'juan', 0.3).pose(r4.t0, 'sit', 0.5).pose(eq + 0.6, 'sitFist', 0.3).nod(eq + 0.7, 0.18).emo(eq, { smile: 0.9 }).pose(r5.t0 - 0.3, 'sitTalk1', 0.4);
    so.look(r4.t0, 'juan', 0.3).nod(eq + 0.9, 0.2).emo(eq, { smile: 0.9 });
    // r5: desplazamiento con brazos + senas
    const bra = M('r5_brazos'), mir = M('r5_miradas');
    ma.look(r5.t0 - 0.2, 'cam', 0.3).pose(bra - 0.2, 'sit', 0.3).move(bra, bra + 1.6, -0.6, 1.5, { noTurn: true })
      .look(mir - 0.15, 'sofia', 0.25).pose(mir - 0.1, 'sitSign', 0.3).pose(mir + 1.2, 'sit', 0.5);
    so.look(r5.t0, 'martin', 0.3).nod(mir + 0.4, 0.2).pose(mir + 0.5, 'sitSign', 0.3).pose(mir + 1.3, 'sit', 0.45);
    ju.look(r5.t0, 'martin', 0.3).look(mir + 0.5, 'sofia', 0.3);
    // r6: la frase clave
    so.look(r6.t0 - 0.25, 'cam', 0.3).pose(r6.t0 - 0.1, 'sitTalk2', 0.4).emo(r6.t0, { smile: 0.4, brow: 0.2 })
      .pose(M('r6_mente') - 0.2, pose('sit', { rax: -2.0, raz: 0.5, rf: -2.3, hz: -0.08, g: 0 }), 0.3).pose(M('r6_mente') + 0.85, 'sitOpen', 0.4).emo(M('r6_mente') + 0.8, { smile: 0.9 }).pose(r6.t1 + 0.1, 'sit', 0.4);
    ju.look(r6.t0, 'sofia', 0.3).look(r6.t1 - 0.5, 'cam', 0.3).pose(r6.t0, 'sitKnees', 0.5); ma.look(r6.t0, 'sofia', 0.3).look(r6.t1 - 0.4, 'cam', 0.3).pose(r6.t0, 'sitKnees', 0.5);

    sh(S4, r2.t0 - 0.1, [-3.6, 1.6, 8.6], [-0.3, 1.55, 7.7], [-3.2, 1.25, 3.2], [0, 1.2, 2.7], 36);
    sh(r2.t0 - 0.1, pel - 0.25, [1.0, 1.5, 5.7], [0.95, 1.47, 5.6], [0.1, 1.36, 2.3], [0.1, 1.36, 2.3], 34);
    sh(pel - 0.25, r3.t0 - 0.3, [0.95, 1.47, 5.6], [0.5, 0.82, 5.0], [0.1, 1.36, 2.3], [-0.2, 0.58, 2.5], 34, 40);
    sh(r3.t0 - 0.3, can - 0.1, [5.5, 1.2, 6.0], [5.0, 1.5, 5.4], [0.8, 1.6, 0.6], [0.6, 1.0, 0.5], 40);
    sh(can - 0.1, r4.t0 - 0.2, [0, 15, 8.5], [0, 11.5, 6.5], [0, 0, 0.6], [0, 0, 0.8], 44);
    sh(r4.t0 - 0.2, eq - 0.35, [-3.7, 0.9, 5.6], [-3.1, 0.82, 5.1], [-1.3, 0.78, 2.6], [-1.2, 0.74, 2.6], 34);
    sh(eq - 0.35, r5.t0 - 0.15, [-0.7, 1.15, 7.6], [-0.3, 1.05, 6.9], [0, 0.95, 2.6], [0, 0.9, 2.6], 38);
    sh(r5.t0 - 0.15, r6.t0 - 0.2, [1.9, 2.7, 6.4], [0.3, 2.1, 5.2], t => { const q = ma.posAt(t); return [q.x + 0.3, 0.5, q.z]; }, t => { const q = ma.posAt(t); return [q.x + 0.5, 0.5, q.z + 0.3]; }, 36);
    sh(r6.t0 - 0.2, S('play'), [0.3, 1.05, 7.8], [0.0, 0.95, 6.6], [-0.1, 1.0, 2.4], [-0.1, 0.95, 2.3], 36, 34);

    // ------------------------------------------------------------------ 5. LA JUGADA
    const S5 = S('play'), serve = M('serve'), recv = M('recv'), set = M('set'), tip = M('tip'), odig = M('odig'), oset = M('oset'), oatk = M('oatk'),
      save = M('save'), set2 = M('set2'), spike = M('spike'), land = M('land'), cel = B('celebrate'), five = M('five');
    so.at(S5, 0.3, 3.4); ma.at(S5, 1.3, 1.1); ju.at(S5, -1.5, 1.6);
    for (const a of this.trio) a.face(S5, PI, 0.01).pose(S5, 'sitReady', 0.01).look(S5, 'ball', 0.01).emo(S5, { smile: 0.2, brow: -0.2 }, 0.01);
    oa.at(0, -1.6, -1.6); ob.at(0, 1.2, -1.0); oc.at(0, 0.5, -4.4);
    for (const a of this.holos) a.face(0, 0, 0.01).pose(0, 'sitReady', 0.01);
    // saque rival
    oc.pose(S5, pose('sit', { lax: -1.2, laz: 0.1, lf: -0.6, g: 0 }), 0.01).pose(serve - 0.55, 'sitLoad', 0.4).pose(serve - 0.1, pose('sit', { rax: -2.95, rf: -0.1, g: 0 }), 0.1).pose(serve, 'sitHit', 0.14, 'o').pose(serve + 0.5, 'sitReady', 0.4);
    N.push({ t: S5, t2: serve - 0.32, cut: true, src: { a: 'oc', m: 'l' }, h: 0.3 });
    N.push({ t: serve, src: { a: 'oc', m: 'r' }, h: 1.0 });
    // recepcion de Sofia
    so.move(recv - 0.95, recv - 0.2, 0.1, 3.0, { noTurn: true }).pose(recv - 0.32, 'sitBump', 0.28).pose(recv, 'sitBumpUp', 0.16, 'o').pose(recv + 0.5, 'sitReady', 0.4);
    N.push({ t: recv, src: { a: 'sofia' }, h: 1.75 });
    // armada de Martin
    ma.face(recv - 0.3, [-3, 1.0], 0.5).pose(set - 0.5, 'sitSet', 0.38).pose(set - 0.01, 'sitSetUp', 0.14, 'o').pose(set + 0.5, 'sitReady', 0.4);
    N.push({ t: set, src: { a: 'martin' }, h: 1.1 });
    // toque de Juan Diego
    ju.move(set - 0.7, tip - 0.35, -1.4, 0.8, { noTurn: true }).pose(tip - 0.45, 'sitTip', 0.32).pose(tip + 0.02, pose('sitTip', { rax: -2.2, rf: -0.1 }), 0.12).pose(tip + 0.4, 'sitReady', 0.4);
    N.push({ t: tip, src: { a: 'juan', m: 'r' }, h: 0.55 });
    // respuesta rival
    oa.move(tip - 0.2, odig - 0.15, -1.3, -1.7, { noTurn: true }).pose(odig - 0.32, 'sitBump', 0.28).pose(odig, 'sitBumpUp', 0.16).pose(odig + 0.4, 'sitReady', 0.3)
      .move(oset - 0.3, oatk - 0.35, -1.0, -0.75, { noTurn: true }).pose(oatk - 0.55, 'sitLoad', 0.4).pose(oatk - 0.1, pose('sit', { rax: -2.95, rf: -0.1, g: 0 }), 0.1).pose(oatk, 'sitHit', 0.14, 'o').pose(oatk + 0.5, 'sitReady', 0.4);
    ob.face(odig, [-3, -1.0], 0.4).pose(oset - 0.45, 'sitSet', 0.35).pose(oset - 0.01, 'sitSetUp', 0.14).pose(oset + 0.4, 'sitReady', 0.4).face(oatk, 0, 0.5);
    N.push({ t: odig, src: { a: 'oa' }, h: 1.25 });
    N.push({ t: oset, src: { a: 'ob' }, h: 1.0 });
    N.push({ t: oatk, src: { a: 'oa', m: 'r' }, h: 0.45, trail: true });
    // salvada de Martin
    ma.face(oatk - 0.7, PI, 0.5).move(oatk - 0.45, save - 0.06, 2.15, 3.15, { noTurn: true }).pose(save - 0.3, 'sitDive', 0.26).pose(save + 0.05, pose('sitDive', { lax: -2.1, rax: -2.1, sx: 0.5 }), 0.15).pose(save + 0.6, 'sitReady', 0.45)
      .emo(oatk, { smile: 0, brow: 0.8 }, 0.2).emo(save + 0.4, { smile: 0.8, brow: 0.2 }, 0.3);
    N.push({ t: save, src: { a: 'martin' }, h: 1.9 });
    // armada de Sofia
    so.move(save - 0.3, set2 - 0.3, 0.0, 2.3, { noTurn: true }).face(save - 0.2, [-3, 1.6], 0.6).pose(set2 - 0.5, 'sitSet', 0.38).pose(set2 - 0.01, 'sitSetUp', 0.14, 'o').pose(set2 + 0.5, 'sitReady', 0.4);
    N.push({ t: set2, src: { a: 'sofia' }, h: 1.5 });
    // remate de Juan Diego
    ju.move(oatk + 0.1, oatk + 1.0, -1.5, 0.62, { noTurn: true }).face(set2 - 0.6, PI - 0.25, 0.5).pose(spike - 0.8, 'sitLoad', 0.5).emo(spike - 0.8, { smile: 0, brow: -0.6 }, 0.3)
      .pose(spike - 0.11, pose('sit', { rax: -2.95, raz: 0.08, rf: -0.08, sx: -0.02, sy: -0.1, hx: -0.3, lax: -0.6, g: 0 }), 0.11).pose(spike, 'sitHit', 0.16, 'o').pose(land + 0.2, 'sitFist', 0.3).emo(land, { smile: 1, brow: 0.5 }, 0.2);
    N.push({ t: spike, src: { a: 'juan', m: 'r', up: 0.06 }, h: 0.03, trail: true });
    N.push({ t: land, src: [0.6, 0.115, -4.2], h: 0.5, impact: 1.4 });
    N.push({ t: land + 0.55, src: [1.0, 0.115, -5.8], h: 0.2 });
    N.push({ t: land + 1.05, src: [1.2, 0.115, -6.9], h: 0.06 });
    N.push({ t: land + 1.5, src: [1.3, 0.115, -7.5], hide: true });
    ob.move(spike - 0.1, land + 0.1, 0.8, -3.2, { noTurn: true }).pose(spike, 'sitDive', 0.3).pose(land + 0.6, 'sit', 0.6);
    oa.pose(spike - 0.3, pose('sit', { lax: -2.9, rax: -2.9, lf: -0.1, rf: -0.1, g: 0 }), 0.25).pose(land + 0.4, 'sit', 0.6);
    // celebracion
    so.pose(land + 0.2, 'sitCheer', 0.3).emo(land, { smile: 1, brow: 0.5 }, 0.2); ma.pose(land + 0.25, 'sitCheer', 0.3).emo(land, { smile: 1, brow: 0.5 }, 0.2);
    ju.pose(land + 0.9, 'sitCheer', 0.3);
    ju.move(cel + 0.1, cel + 1.0, -0.6, 2.3, { noTurn: true }); so.move(cel + 0.1, cel + 1.0, 0.0, 1.5, { noTurn: true }); ma.move(cel + 0.1, cel + 1.0, 0.6, 2.3, { noTurn: true });
    for (const a of this.trio) a.face(cel + 0.15, 'cam', 0.9);
    ju.look(cel + 0.3, 'martin', 0.3); ma.look(cel + 0.3, 'juan', 0.3); so.look(cel + 0.3, 'cam', 0.3);
    ju.pose(five - 0.28, 'sitFiveR', 0.24).pose(five + 0.3, 'sitCheer', 0.3); ma.pose(five - 0.28, 'sitFiveL', 0.24).pose(five + 0.3, 'sitCheer', 0.3);
    so.pose(five - 0.28, 'sitFiveBoth', 0.24).pose(five + 0.3, 'sitCheer', 0.3);
    // y1..y3
    const y1 = C('y1'), y2 = C('y2'), y3 = C('y3'), yeq = M('y3_equipo');
    ju.look(y1.t0 - 0.2, 'cam', 0.3).pose(y1.t0 - 0.15, 'sitOpen', 0.35).pose(y1.t1 + 0.1, 'sitKnees', 0.5);
    so.pose(y1.t0 - 0.1, 'sitKnees', 0.5).look(y1.t0, 'juan', 0.3); ma.pose(y1.t0 - 0.1, 'sitKnees', 0.5).look(y1.t0, 'juan', 0.3);
    ma.look(y2.t0 - 0.2, 'cam', 0.3).pose(y2.t0 - 0.1, pose('sit', { lax: -0.4, laz: -1.1, lf: -0.2, g: 0 }), 0.35).look(M('y2_tesis'), 'juan', 0.25)
      .pose(M('y2_anti') - 0.15, 'sit', 0.3).look(M('y2_anti'), [0.6, 0, 3.2], 0.25).pose(M('y2_sint') - 0.3, 'sitOpen', 0.4).look(M('y2_sint') - 0.2, 'sofia', 0.3).look(M('y2_sint') + 0.7, 'cam', 0.3).pose(y2.t1 + 0.1, 'sitKnees', 0.5);
    ju.look(y2.t0, 'martin', 0.3); so.look(y2.t0, 'martin', 0.3);
    so.look(y3.t0 - 0.2, 'cam', 0.3).pose(y3.t0 - 0.1, 'sitTalk1', 0.4).pose(yeq - 0.35, 'sitPresent', 0.4).emo(yeq, { smile: 1 });
    ju.look(y3.t0, 'sofia', 0.3).pose(yeq - 0.2, pose('sit', { rax: -0.75, raz: 1.0, rf: -0.25, sz: -0.1, g: 0 }), 0.4).look(yeq + 0.5, 'cam', 0.4);
    ma.look(y3.t0, 'sofia', 0.3).pose(yeq - 0.1, pose('sit', { lax: -0.75, laz: -1.0, lf: -0.25, sz: 0.1, g: 0 }), 0.4).look(yeq + 0.6, 'cam', 0.4);

    sh(S5, serve - 0.35, [0.5, 5.2, 9.8], [6.8, 1.5, 2.2], [0, 0.6, 0.6], [0, 0.7, -0.6], 40);
    sh(serve - 0.35, recv + 0.25, [2.6, 1.3, -7.6], [2.1, 1.45, -6.9], [0.3, 0.9, -2], [0.1, 0.7, 2.5], 38);
    sh(recv + 0.25, tip - 0.25, [5.8, 0.9, 3.8], [5.1, 1.0, 2.7], [0.6, 1.0, 2.4], [-0.2, 1.15, 1.0], 36);
    sh(tip - 0.25, oatk + 0.15, [-8.0, 3.9, 0.4], [-7.2, 3.4, 1.3], [0, 0.8, 0.2], [0, 0.7, 0.1], 40);
    sh(oatk + 0.15, set2 + 0.15, [4.6, 0.55, 6.5], [3.5, 0.7, 5.6], [1.7, 0.6, 3.1], [0.6, 0.95, 2.5], 36);
    sh(set2 + 0.15, spike + 0.06, [-3.3, 0.45, -1.9], [-2.85, 0.55, -1.2], [-1.4, 0.95, 0.6], [-1.45, 1.1, 0.55], 34, 30);
    sh(spike + 0.06, cel + 0.05, [-2.9, 2.8, 4.6], [-2.6, 2.5, 4.2], [0.2, 0.4, -2.2], [0.4, 0.25, -3.2], 42);
    sh(cel + 0.05, y1.t0 - 0.1, [3.4, 1.1, 6.0], [0.5, 1.2, 6.5], [0, 0.8, 2.1], [0, 0.75, 2.1], 36);
    sh(y1.t0 - 0.1, y2.t0 - 0.15, [-1.6, 0.9, 5.4], [-1.4, 0.88, 5.2], [-0.4, 0.7, 2.3], [-0.4, 0.7, 2.3], 30);
    sh(y2.t0 - 0.15, yeq - 0.5, [0.2, 1.3, 7.2], [0, 1.2, 6.4], [0, 1.0, 2.0], [0, 1.0, 2.0], 36);
    sh(yeq - 0.5, S('hope'), [0, 1.2, 6.4], [0, 2.3, 5.4], [0, 1.0, 2.0], [0, 0.7, 2.0], 36);

    // ------------------------------------------------------------------ 6. LA ESPERANZA
    const S6 = S('hope'), e1 = C('e1'), e2 = C('e2'), e3 = C('e3'), e3b = C('e3b'), e4 = C('e4'), arms = M('arms'), cr = S('credits');
    ju.at(S6, -1.0, 3.0); so.at(S6, 0, 3.2); ma.at(S6, 1.0, 3.0);
    for (const a of this.trio) a.face(S6, 'cam', 0.01).pose(S6, 'sitKnees', 0.01).emo(S6, { smile: 0.8 }, 0.01);
    so.pose(S6, 'sitHold', 0.01).look(S6, 'cam', 0.01); ju.look(S6, 'sofia', 0.01); ma.look(S6, 'sofia', 0.01);
    so.pose(M('e1_pct') - 0.2, 'sitPresent', 0.35).emo(M('e1_pct'), { smile: 1, brow: 0.5 }).pose(M('e1_pct') + 1.4, 'sitHold', 0.4);
    ju.look(M('e1_pct') + 0.5, [5, 1.4, 5], 0.3).emo(M('e1_pct') + 0.5, { smile: 0.9, brow: 0.8 }).look(M('e1_probar'), 'cam', 0.3).pose(M('e1_probar'), 'sitFist', 0.3).pose(e1.t1, 'sitKnees', 0.4);
    ma.look(M('e1_pct') + 0.7, [5, 1.4, 5], 0.3).emo(M('e1_pct') + 0.7, { smile: 0.9, brow: 0.8 }).look(M('e1_probar') + 0.2, 'cam', 0.3);
    N.push({ t: S6, t2: e2.t0 - 0.6, cut: true, src: { a: 'sofia' }, h: 0.3 });
    so.look(e2.t0 - 0.8, 'juan', 0.25).pose(e2.t0 - 0.72, pose('sitPresent', { sz: 0.2 }), 0.14).pose(e2.t0 - 0.3, 'sitKnees', 0.4);
    ju.look(e2.t0 - 0.7, 'ball', 0.2).pose(e2.t0 - 0.5, 'sitPresent', 0.25).pose(e2.t0 - 0.12, 'sitHold', 0.25).look(e2.t0 - 0.1, 'cam', 0.3)
      .emo(e2.t0, { smile: 0.25, brow: 0.1 }).fx((p, t) => { const w = win(t, e2.t0 + 1.3, e2.t0 + 2.3, 0.2, 0.2); p.hy += Math.sin(t * 8) * 0.12 * w; });
    N.push({ t: e2.t0 - 0.15, t2: e3.t0 - 0.62, src: { a: 'juan' }, h: 0.75 });
    ma.look(e2.t0, 'juan', 0.3).look(e3.t0 - 0.7, 'ball', 0.2).pose(e3.t0 - 0.5, 'sitPresent', 0.25).pose(e3.t0 - 0.12, 'sitHold', 0.25).look(e3.t0 - 0.1, 'cam', 0.3)
      .emo(e3.t0, { smile: 0.9, brow: 0.3 }).look(M('e3_todos'), 'sofia', 0.3).look(M('e3_todos') + 0.6, 'cam', 0.3);
    ju.pose(e3.t0 - 0.72, pose('sitToss', { lax: -1.9, rax: -1.9 }), 0.14).pose(e3.t0 - 0.3, 'sitKnees', 0.4).emo(e3.t0, { smile: 0.9 }).look(e3.t0 - 0.5, 'martin', 0.3);
    so.look(e2.t0, 'juan', 0.3).look(e3.t0 - 0.6, 'ball', 0.2).look(e3.t0, 'martin', 0.3);
    N.push({ t: e3.t0 - 0.15, t2: e4.t0 - 0.62, src: { a: 'martin' }, h: 0.3 });
    ju.look(e3b.t0 - 0.2, 'cam', 0.3).pose(e3b.t0 - 0.1, 'sitTalk1', 0.35).pose(e3b.t0 + 0.9, 'sitPoint', 0.3).pose(e3b.t1 + 0.1, 'sitKnees', 0.4);
    ma.look(e3b.t0, 'juan', 0.3).look(e4.t0 - 0.9, 'sofia', 0.25).pose(e4.t0 - 0.74, pose('sitPresent', { sz: 0.2 }), 0.14).pose(e4.t0 - 0.3, 'sitKnees', 0.4);
    so.look(e3b.t0, 'juan', 0.3).look(e4.t0 - 0.7, 'ball', 0.2).pose(e4.t0 - 0.5, 'sitPresent', 0.25).pose(e4.t0 - 0.15, 'sitHold', 0.25).look(e4.t0 - 0.15, 'cam', 0.3)
      .pose(e4.t0 + 0.2, 'sitPresent', 0.4).emo(e4.t0, { smile: 1, brow: 0.4 });
    N.push({ t: e4.t0 - 0.18, t2: arms + 0.03, src: { a: 'sofia' }, h: 2.25 });
    so.pose(arms - 0.2, 'sitHold', 0.14).pose(arms - 0.05, 'sitToss', 0.14, 'o').pose(arms + 0.35, 'sitCheer', 0.3).look(arms + 0.1, 'ball', 0.2).pose(arms + 1.5, 'sitToss', 0.35).look(arms + 1.9, 'cam', 0.3);
    ju.look(e4.t0, 'sofia', 0.3).look(arms - 0.1, 'cam', 0.2).pose(arms - 0.05, 'sitCheer', 0.24, 'o'); ma.look(e4.t0, 'sofia', 0.3).look(arms - 0.1, 'cam', 0.2).pose(arms, 'sitCheer', 0.24, 'o');
    N.push({ t: arms + 1.9, t2: 200, src: { a: 'sofia' } });
    // creditos: se juntan y saludan
    ju.move(cr, cr + 1.3, -0.72, 3.1, { noTurn: true }).pose(cr + 0.4, pose('sit', { raz: 2.3, rf: -0.45, g: 0 }), 0.5); waveFx(ju, cr + 0.7, 181);
    ma.move(cr, cr + 1.3, 0.72, 3.1, { noTurn: true }).pose(cr + 0.6, pose('sit', { raz: 2.3, rf: -0.45, g: 0 }), 0.5); waveFx(ma, cr + 0.9, 181);
    so.pose(cr + 0.2, 'sitHold', 0.4).pose(cr + 1.5, 'sitToss', 0.6).fx((p, t) => { const w = seg(t, cr + 2, cr + 2.5); p.sz += Math.sin(t * 2.2) * 0.07 * w; });

    sh(S6, e2.t0 - 0.2, [1.5, 1.0, 7.7], [1.3, 0.95, 7.1], [1.35, 0.68, 3.1], [1.3, 0.68, 3.1], 36);
    sh(e2.t0 - 0.2, e3.t0 - 0.25, [-1.9, 0.88, 6.0], [-1.6, 0.86, 5.7], [-0.7, 0.68, 3.0], [-0.7, 0.68, 3.0], 30);
    sh(e3.t0 - 0.25, e3b.t0 - 0.15, [1.9, 0.88, 6.0], [1.6, 0.86, 5.7], [0.7, 0.68, 3.0], [0.7, 0.68, 3.0], 30);
    sh(e3b.t0 - 0.15, arms - 0.1, [0, 0.98, 7.3], [0, 0.86, 6.1], [0, 0.7, 3.1], [0, 0.7, 3.1], 34);
    sh(arms - 0.1, cr, [0, 0.86, 6.1], [0, 2.4, 8.4], [0, 0.7, 3.1], [0, 1.25, 2.8], 34, 38, 'o');
    sh(cr, 180.5, [0, 2.4, 8.4], [3.2, 7.2, 13.2], [0, 1.25, 2.8], [0, 1.7, 0.8], 38, 40, 'ss');
  }

  // =====================================================================================
  camAt(t) {
    let s = this.shots[0];
    for (const q of this.shots) { if (q.t0 <= t) s = q; else break; }
    const u = s.ease(seg(t, s.t0, s.t1));
    const v = (x) => (typeof x === 'function' ? x(t) : x);
    const p = lerp3(v(s.p0), v(s.p1), u), l = lerp3(v(s.l0), v(s.l1), u);
    const k = 0.014;                                         // respiracion de camara en mano
    p[0] += noise1(t * 0.55 + 3) * k; p[1] += noise1(t * 0.6 + 9) * k * 0.7; p[2] += noise1(t * 0.5 + 17) * k;
    l[0] += noise1(t * 0.45 + 31) * k * 1.4; l[1] += noise1(t * 0.5 + 43) * k;
    return { pos: p, look: l, fov: lerp(s.f0, s.f1, u), shot: s };
  }

  ctxAt(t) { return { t, cam: this.camAt(t).pos, actors: this.actors, speech, ball: this._ballNow || [0, 1, 0] }; }

  _srcPos(src) {
    if (Array.isArray(src)) return src.slice();
    const a = this.actors[src.a];
    let v;
    if (src.m === 'r' || src.m === 'l') { const f = src.m === 'l' ? a.d.leftForearm : a.d.rightForearm; v = f.localToWorld(new THREE.Vector3(0, -0.4, 0.03)); v.y += src.up || 0; }
    else { v = a.handsMid(0.1); v.y += 0.02; }
    return [v.x, Math.max(0.115, v.y), v.z];
  }

  _resolveBall() {
    this.nodes.sort((a, b) => a.t - b.t);
    for (const n of this.nodes) {
      if (n.t2 === undefined) n.t2 = n.t;
      if (Array.isArray(n.src)) { n.pIn = n.pOut = n.src; continue; }
      const a = this.actors[n.src.a];
      a.body(n.t, this.ctxAt(n.t)); n.pIn = this._srcPos(n.src);
      if (n.t2 > n.t && n.t2 < 190) { a.body(n.t2, this.ctxAt(n.t2)); n.pOut = this._srcPos(n.src); } else n.pOut = n.pIn;
    }
  }

  // posicion del balon en t (los actores ya deben estar posados en t para los tramos "en la mano")
  ballAt(t, live = true) {
    const ns = this.nodes;
    let i = -1;
    for (let k = 0; k < ns.length; k++) { if (ns[k].t <= t) i = k; else break; }
    if (i < 0) return null;
    const n = ns[i];
    if (t <= n.t2) return { p: (live && !Array.isArray(n.src)) ? this._srcPos(n.src) : n.pIn, held: true, n };
    const m = ns[i + 1];
    if (n.hide || !m || m.cut) return null;
    const u = (t - n.t2) / (m.t - n.t2), p = lerp3(n.pOut, m.pIn, u);
    p[1] += 4 * (n.h || 0) * u * (1 - u);
    return { p, held: false, n, u };
  }

  // =====================================================================================
  update(t, camera) {
    const w = this.world, cam = this.camAt(t);
    camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.lookAt(cam.look[0], cam.look[1], cam.look[2]);
    camera.updateMatrixWorld(true);
    this.cam = cam;

    // estado de la cancha
    const red = M('r3_red'), can = M('r3_cancha');
    this.courtK = ss(seg(t, can, can + 1.9)); this.netH = lerp(2.43, 1.15, eio(seg(t, red, red + 2.4)));
    w.setCourt(this.courtK); w.setNet(this.netH);

    const ctx = { t, cam: cam.pos, actors: this.actors, speech, ball: [0, 1, 0] };
    const S5 = S('play'), cel = B('celebrate');
    const ho = win(t, S5 + 0.3, cel + 1.6, 1.3, 1.2);
    this.holoMat.opacity = 0.2 * ho * (0.85 + 0.15 * Math.sin(t * 23));
    for (const a of this.holos) { a.root.visible = ho > 0.001; if (a.root.visible) a.body(t, ctx); }
    for (const a of this.trio) a.body(t, ctx);

    // balon
    const b = this.ballAt(t);
    w.ball.visible = !!b;
    let trailW = 0;
    if (b) {
      w.ball.position.set(b.p[0], b.p[1], b.p[2]); ctx.ball = b.p; this._ballNow = b.p;
      if (!b.held) { w.ballMesh.rotation.x = t * 11; w.ballMesh.rotation.z = t * 4; if (b.n.trail) trailW = Math.min(1, b.u * 6) * (1 - b.u * 0.3); }
      else { w.ballMesh.rotation.x = t * 0.6; }
    }
    w.trail.forEach((m, i) => {
      const q = trailW > 0 ? this.ballAt(t - (i + 1) * 0.011, false) : null;
      m.visible = !!q && !q.held;
      if (m.visible) { m.position.set(q.p[0], q.p[1], q.p[2]); const k = 1 - i / w.trail.length; m.scale.setScalar(0.5 + k * 0.75); m.material.opacity = 0.34 * k * trailW; }
    });
    for (const a of this.trio) a.faceAnim(t, ctx);

    // efectos de piso
    w.resetVfx();
    for (const n of this.nodes) {
      if (n.impact) { const u = (t - n.t) / 0.9; if (u > 0 && u < 1) { w.ring(n.src[0], n.src[2], (0.25 + u * 2.4) * n.impact, (1 - u) * 0.9, 0xffe27a); w.ring(n.src[0], n.src[2], (0.15 + u * 1.5) * n.impact, (1 - u) * 0.6, 0x7fdcff); } }
    }
    if (this.sitT) {
      const r4 = C('r4').t0;
      this.trio.forEach((a, i) => {
        const ts = this.sitT[a.id], u = (t - ts) / 0.9, q = a.posAt(t);
        if (u > 0 && u < 1) w.ring(q.x, q.z - 0.05, 0.35 + u * 1.1, (1 - u) * 0.9, 0x35f0a0);
        const o = win(t, ts, r4 + 0.3, 0.3, 0.8);
        w.disc(i, q.x, q.z - 0.05, 0.42, o * (0.22 + 0.1 * Math.sin(t * 5 + i)));
      });
    }
    if (ho > 0 && ho < 1 && t < S5 + 2) for (const a of this.holos) { const q = a.posAt(t); w.ring(q.x, q.z, 0.3 + ho * 0.9, (1 - ho) * 0.8, 0x4fd8ff); }
    const ar = M('arms'), ua = (t - ar) / 1.2;
    if (ua > 0 && ua < 1) { w.ring(0, 3.2, 0.5 + ua * 4, (1 - ua) * 0.7, 0xffd21f); w.ring(0, 3.2, 0.3 + ua * 2.5, (1 - ua) * 0.6, 0xff3040); }
  }
}
