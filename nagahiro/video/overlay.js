// overlay.js - Motion design 2D sobre el 3D: logo, reloj, rotulos de ronda, citas, paneles de modelos,
// subtitulos en ingles y creditos. render(t) es funcion pura de t.
import { TL } from './timeline.js';
import { clamp, lerp, seg, ss, eio, eo, eo5, back, win, hash } from './lib.js';
import { S, SE, B, BE, M, C, decayDays, fI131, fCs137 } from './story.js';
import { Q, KM, MAPC } from './world.js';

const W = 1920, H = 1080;
const NAVY = '#070b16', RED = '#e8102a', GREY = '#9aa0a8', WHITE = '#ffffff', PAPER = '#f4efe4', AMBER = '#ffb04a', ICE = '#7fd4ff', INK = '#1d1a16';
const WHO = { samuel: { n: 'SAMUEL', c: RED }, tomas: { n: 'TOMÁS', c: ICE }, narr: { n: 'NARRATOR', c: GREY } };
const HF = (px, w = 900, it = false) => `${it ? 'italic ' : ''}${w} ${px}px "Barlow Condensed"`;
const TF = (px, w = 600, it = false) => `${it ? 'italic ' : ''}${w} ${px}px "Inter"`;
const MF = (px, w = 700) => `${w} ${px}px "JetBrains Mono"`;
const SF = (px, it = true, w = 500) => `${it ? 'italic ' : ''}${w} ${px}px "Cormorant Garamond"`;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fmt = (v, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const ROUNDS = [
  ['round1', '01', 'ROUND ONE', 'THESIS', 'TESIS', 'The military justification', 'La justificación militar'],
  ['round2', '02', 'ROUND TWO', 'ANTITHESIS', 'ANTÍTESIS', 'Evidence, models and memory', 'Evidencia, modelos y memoria'],
  ['round3', '03', 'ROUND THREE', 'SUBLATION', 'SUPERACIÓN', 'Aufhebung: cancel · preserve · raise', 'Cancelar · conservar · elevar'],
];

export class Overlay2D {
  constructor(canvas, s3, logo) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.s3 = s3; this.logo = logo;
    this.subs = TL.cues.map(c => this._chunks(c));
    // el ultimo bloque de cada linea se queda un poco, pero nunca encima de la linea siguiente
    const starts = TL.cues.map(c => c.t0).sort((a, b) => a - b);
    for (const list of this.subs) { const ch = list[list.length - 1], nx = starts.find(v => v > ch.t1 - 0.01); ch.end = nx !== undefined ? Math.min(ch.t1 + 0.35, nx - 0.03) : ch.t1 + 0.35; }
    // textura de papel (para el destello): fibras deterministas
    const p = document.createElement('canvas'); p.width = W; p.height = H; const px = p.getContext('2d');
    px.fillStyle = PAPER; px.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) {
      const x = hash(i * 1.3) * W, y = hash(i * 2.9) * H, l = 6 + hash(i * 5.7) * 40, a = hash(i * 7.1) * Math.PI;
      px.strokeStyle = `rgba(120,100,70,${0.03 + hash(i * 3.3) * 0.05})`; px.lineWidth = 1;
      px.beginPath(); px.moveTo(x, y); px.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); px.stroke();
    }
    const g = px.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,70,40,0.18)');
    px.fillStyle = g; px.fillRect(0, 0, W, H);
    this.paper = p;
  }

  // ------------------------------------------------------------ primitivas
  txt(s, x, y, font, color = WHITE, align = 'left', ls = 0, alpha = 1) {
    const c = this.x; if (alpha <= 0.003) return;
    c.save(); c.globalAlpha *= clamp(alpha); c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic';
    if (ls) c.letterSpacing = ls + 'px';
    c.fillText(s, x, y); c.restore();
  }
  w(s, font, ls = 0) { const c = this.x; c.save(); c.font = font; if (ls) c.letterSpacing = ls + 'px'; const v = c.measureText(s).width; c.restore(); return v; }
  rise(s, x, y, font, color, t, t0, d = 0.5, align = 'left', ls = 0, a = 1) {
    const u = eo(seg(t, t0, t0 + d)); if (u <= 0) return;
    const c = this.x; c.save(); c.beginPath(); c.rect(0, y - 400, W, 400 + 18); c.clip();
    this.txt(s, x, y + (1 - u) * 70, font, color, align, ls, u * a); c.restore();
  }
  chars(s, x, y, font, color, t, t0, step = 0.03, ls = 0, align = 'left', a = 1) {
    const n = Math.floor((t - t0) / step); if (n <= 0) return;
    const sub = s.slice(0, Math.min(s.length, n));
    const full = this.w(s, font, ls), xx = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
    this.txt(sub, xx, y, font, color, 'left', ls, a);
    if (n < s.length && Math.floor(t * 8) % 2 === 0) { const cw = this.w(sub, font, ls); this.x.fillStyle = color; this.x.globalAlpha = a; this.x.fillRect(xx + cw + 4, y - 22, 3, 26); this.x.globalAlpha = 1; }
  }
  glass(x, y, w, h, r = 22, a = 1, tint = 'rgba(8,12,24,0.78)', edge = 'rgba(255,255,255,0.14)') {
    if (a <= 0.003) return;
    const c = this.x; c.save(); c.globalAlpha *= a;
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = tint; c.fill();
    c.strokeStyle = edge; c.lineWidth = 1.5; c.stroke(); c.restore();
  }
  line(x0, y0, x1, y1, color, wd = 2, a = 1) { const c = this.x; c.save(); c.globalAlpha *= a; c.strokeStyle = color; c.lineWidth = wd; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }
  logoAt(x, y, h, a = 1) { if (!this.logo || a <= 0) return; const c = this.x; c.save(); c.globalAlpha *= a; const w = h * this.logo.width / this.logo.height; c.drawImage(this.logo, x - w / 2, y - h / 2, w, h); c.restore(); }
  proj(p) { return this.s3.project(p); }

  // etiqueta anclada a un punto 3D
  tag(p, dx, dy, head, body, color, a, align = 'left') {
    if (a <= 0.01) return;
    const q = this.proj(p); if (!q.ok) return;
    const x = q.x + dx, y = q.y + dy;
    this.line(q.x, q.y, x, y, rgba(color, 0.9), 2, a);
    const c = this.x; c.save(); c.globalAlpha = a; c.fillStyle = color; c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); c.restore();
    const wd = Math.max(this.w(head, HF(40, 800)), body ? this.w(body, MF(17, 700), 1) : 0) + 34;
    const bx = align === 'left' ? x : x - wd;
    this.glass(bx, y - 52, wd, body ? 84 : 56, 12, a);
    c.save(); c.globalAlpha = a; c.fillStyle = color; c.fillRect(bx, y - 52, 5, body ? 84 : 56); c.restore();
    this.txt(head, bx + 18, y - 12, HF(40, 800), WHITE, 'left', 0, a);
    if (body) this.txt(body, bx + 18, y + 20, MF(17, 700), color, 'left', 1, a);
  }

  // ------------------------------------------------------------ subtitulos (ingles), divididos en bloques
  _chunks(cue) {
    const words = cue.text.split(' ');
    const out = []; let cur = '';
    for (const w of words) {
      const nxt = cur ? cur + ' ' + w : w;
      if (nxt.length > 62 && cur) { out.push(cur); cur = w; }
      else { cur = nxt; if (/[.;:?!]$/.test(w) && cur.length > 34) { out.push(cur); cur = ''; } }
    }
    if (cur) out.push(cur);
    const tot = out.reduce((s, x) => s + x.length, 0);
    let acc = 0; const d = cue.t1 - cue.t0;
    return out.map((s, i) => { const a = cue.t0 + d * acc / tot; acc += s.length; return { s, t0: a, t1: cue.t0 + d * acc / tot, who: cue.who, last: i === out.length - 1 }; });
  }
  subtitles(t) {
    for (const list of this.subs) for (const ch of list) {
      const e1 = ch.last ? ch.end : ch.t1 - 0.02, e0 = ch.last ? Math.min(ch.t1 + 0.15, e1 - 0.08) : ch.t1 - 0.12;
      if (t < ch.t0 - 0.05 || t > e1) continue;
      const a = Math.min(seg(t, ch.t0 - 0.02, ch.t0 + 0.1), 1 - seg(t, e0, e1));
      const y = H - 92, who = WHO[ch.who];
      const tw = this.w(ch.s, TF(38, 600));
      this.glass(W / 2 - tw / 2 - 30, y - 50, tw + 60, 72, 16, a * 0.92, 'rgba(5,8,16,0.72)', 'rgba(255,255,255,0.06)');
      this.txt(who.n, W / 2, y - 60, MF(16, 800), who.c, 'center', 3, a);
      this.txt(ch.s, W / 2, y, TF(38, 600), WHITE, 'center', 0, a);
    }
  }
  citations(t) {
    for (const c of TL.cues) {
      if (!c.cite || t < c.t0 - 0.1 || t > c.t1 + 1.2) continue;
      const a = Math.min(seg(t, c.t0 + 0.2, c.t0 + 0.6), 1 - seg(t, c.t1 + 0.7, c.t1 + 1.2));
      const s = c.cite, wd = this.w(s, TF(24, 600, true)) + 150;
      const x = W - 70 - wd + (1 - eo(seg(t, c.t0 + 0.2, c.t0 + 0.7))) * 60, y = 140;
      this.glass(x, y, wd, 56, 28, a);
      this.txt('SOURCE', x + 26, y + 36, MF(15, 800), AMBER, 'left', 3, a);
      this.txt(s, x + 118, y + 37, TF(24, 600, true), WHITE, 'left', 0, a);
    }
  }

  // ------------------------------------------------------------ render
  render(t) {
    const c = this.x; c.clearRect(0, 0, W, H);
    this.vignette(t);
    this.intro(t);
    this.rounds(t);
    this.hud(t);
    this.graphics(t);
    this.closing(t);
    this.subtitles(t);
    this.citations(t);
    this.flash(t);
    this.credits(t);
    this.sting(t);
    this.grain(t);
  }
  vignette() {
    const c = this.x, g = c.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  grain(t) {
    const c = this.x, f = Math.floor(t * 30); c.save(); c.globalAlpha = 0.035;
    for (let i = 0; i < 70; i++) { c.fillStyle = i % 2 ? '#fff' : '#000'; c.fillRect(hash(f * 7.3 + i) * W, hash(f * 3.1 + i * 9.7) * H, 2, 2); }
    c.restore();
  }

  // ------------------------------------------------------------ 0. logo
  sting(t) {
    const end = M('wipe_in') + 0.8; if (t > end) return;
    const c = this.x, out = eio(seg(t, M('wipe_in'), end));
    c.save(); c.beginPath(); c.rect(0, 0, W, H * (1 - out)); c.clip();
    c.fillStyle = NAVY; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H / 2 - 60, 50, W / 2, H / 2, 900); g.addColorStop(0, 'rgba(232,16,42,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const lp = M('logo_pop'), u = back(seg(t, lp, lp + 0.8), 1.4);
    // anillos que se cierran
    for (let i = 0; i < 3; i++) {
      const k = eo(seg(t, lp - 0.4 + i * 0.12, lp + 0.6 + i * 0.12));
      c.strokeStyle = rgba(i === 1 ? RED : WHITE, 0.5 * (1 - seg(t, 4.2, 5.2))); c.lineWidth = 2;
      c.beginPath(); c.arc(W / 2, H / 2 - 70, 420 - k * (250 - i * 26), -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke();
    }
    this.logoAt(W / 2, H / 2 - 70, 230 * u, clamp(u * 1.2));
    const lt = M('logo_text');
    this.rise('CORPORACIÓN COLEGIO SAN BONIFACIO DE LAS LANZAS BILINGÜE', W / 2, H / 2 + 140, HF(44, 800), WHITE, t, lt, 0.6, 'center', 3);
    this.rise('PROJECTIVE CYCLE  ·  GRADE 10  ·  IBAGUÉ 2026', W / 2, H / 2 + 190, MF(20, 700), GREY, t, lt + 0.35, 0.6, 'center', 4);
    const bar = eo(seg(t, lt + 0.2, lt + 1.2));
    c.fillStyle = RED; c.fillRect(W / 2 - 160 * bar, H / 2 + 216, 320 * bar, 3);
    c.restore();
    if (out > 0 && out < 1) { c.fillStyle = RED; c.fillRect(0, H * (1 - out) - 6, W, 6); }
  }

  // ------------------------------------------------------------ 1. reloj, destello, Nagasaki
  intro(t) {
    const n1 = C('n1'), n2 = C('n2');
    if (t > S('intro') && t < B('stage_in') + 1) {
      const a1 = win(t, M('n1_eight') - 0.2, M('flash'), 0.3, 0.02);
      this.chars('HIROSHIMA', 140, H - 250, HF(86, 900), WHITE, t, M('n1_eight'), 0.06, 8, 'left', a1);
      this.chars('06 · 08 · 1945   08:15', 144, H - 200, MF(30, 700), AMBER, t, M('n1_august'), 0.04, 4, 'left', a1);
      const a2 = win(t, M('n2_nagasaki') - 0.2, M('n2_eighty') + 1.6, 0.3, 0.5);
      this.chars('NAGASAKI', 140, H - 250, HF(86, 900), WHITE, t, M('n2_nagasaki'), 0.06, 8, 'left', a2);
      this.chars('09 · 08 · 1945   11:02', 144, H - 200, MF(30, 700), AMBER, t, M('n2_nagasaki') + 0.4, 0.04, 4, 'left', a2);
      const a3 = win(t, M('n2_eighty'), B('stage_in') + 0.8, 0.4, 0.6);
      this.rise('1945  →  2026', W - 140, 200, HF(64, 800), WHITE, t, M('n2_eighty'), 0.6, 'right', 4, a3);
      this.rise('81 YEARS  ·  81 AÑOS', W - 140, 240, MF(20, 700), GREY, t, M('n2_eighty') + 0.2, 0.6, 'right', 4, a3);
    }
    // nombres
    const sa = this.s3.story.actors.samuel, to = this.s3.story.actors.tomas;
    const nm = (who, a, t0, t1, n1_, n2_, side) => {
      const al = win(t, t0, t1, 0.4, 0.4); if (al <= 0) return;
      const h = who.headW; if (!h) return;
      const q = this.proj([h.x, h.y - 0.75, h.z]);
      const x = side < 0 ? q.x - 330 : q.x + 120, y = q.y;
      const k = eo(seg(t, t0, t0 + 0.6));
      const c = this.x; c.save(); c.globalAlpha = al; c.fillStyle = side < 0 ? RED : ICE; c.fillRect(x, y - 70, 6, 100 * k); c.restore();
      this.rise(n1_, x + 22, y - 22, HF(54, 900), WHITE, t, t0 + 0.1, 0.5, 'left', 2, al);
      this.rise(n2_, x + 24, y + 14, MF(17, 700), side < 0 ? RED : ICE, t, t0 + 0.25, 0.5, 'left', 2, al);
    };
    nm(sa, 1, C('i1').t0 - 0.1, C('i3').t0 - 0.4, 'SAMUEL', 'LOSADA BRAVO · GRADE 10', 1);
    nm(to, 1, C('i2').t0 - 0.1, C('i3').t0 + 1.5, 'TOMÁS', 'HOMEZ BARRAGÁN · GRADE 10', -1);
    // titulo
    const th = M('title_hit'), to_ = M('title_out');
    const ta = win(t, th - 0.1, to_ + 0.4, 0.15, 0.5);
    if (ta > 0) {
      const c = this.x;
      c.save(); c.globalAlpha = ta * 0.55; c.fillStyle = NAVY; c.fillRect(0, 0, W, H); c.restore();
      const sp = lerp(40, 22, eo5(seg(t, th, th + 1.2)));
      this.txt('NAGAHIRO', W / 2, H / 2 + 10, HF(210, 900), WHITE, 'center', sp, ta * eo(seg(t, th, th + 0.4)));
      this.rise('AND THE WEIGHT OF THE FLASH', W / 2, H / 2 + 90, HF(58, 800), AMBER, t, th + 0.35, 0.6, 'center', 10, ta);
      this.rise('Nagahiro y el peso del destello', W / 2, H / 2 + 140, SF(36), PAPER, t, th + 0.6, 0.6, 'center', 1, ta);
      const k = eo(seg(t, th + 0.2, th + 1.1)); c.save(); c.globalAlpha = ta; c.fillStyle = RED; c.fillRect(W / 2 - 300 * k, H / 2 + 166, 600 * k, 3); c.restore();
      this.rise('A DEBATE IN THREE ROUNDS  ·  UN DEBATE EN TRES RONDAS', W / 2, H / 2 + 210, MF(19, 700), GREY, t, th + 0.9, 0.6, 'center', 4, ta);
    }
  }
  // destello: la pantalla se vuelve papel (sin explosion) y el sonido calla
  flash(t) {
    const f = M('flash'), b = M('back');
    const a = Math.min(seg(t, f, f + 0.06), 1 - seg(t, b - 0.2, b + 1.4));
    if (a <= 0) return;
    const c = this.x; c.save(); c.globalAlpha = a; c.drawImage(this.paper, 0, 0);
    const k = seg(t, f + 0.5, f + 1.4) * (1 - seg(t, b - 0.4, b));
    c.globalAlpha = a * k * 0.55;
    this.txt('08:15', W / 2, H / 2 + 30, SF(120, false, 500), '#8a7c66', 'center', 14, a * k * 0.6);
    c.restore();
  }

  // ------------------------------------------------------------ rotulos de ronda + HUD
  rounds(t) {
    for (const [sc, n, en, big, es, d1, d2] of ROUNDS) {
      const t0 = S(sc) + 0.1, nc = C(sc === 'round1' ? 'r1n' : sc === 'round2' ? 'r2n' : 'r3n'), t1 = nc.t1 + 0.5;
      const a = win(t, t0, t1 + 0.3, 0.25, 0.45); if (a <= 0) continue;
      const c = this.x;
      const wipe = eio(seg(t, t0, t0 + 0.55));
      c.save(); c.globalAlpha = a * 0.8; c.fillStyle = NAVY; c.fillRect(0, 0, W * wipe, H); c.restore();
      c.save(); c.globalAlpha = a; c.fillStyle = RED; c.fillRect(W * wipe - 8, 0, 8, H); c.restore();
      c.save(); c.globalAlpha = a * 0.12; c.strokeStyle = WHITE; c.lineWidth = 3; c.font = HF(470, 900); c.strokeText(n, 40, H / 2 + 170); c.restore();
      this.rise(en, 560, H / 2 - 110, MF(26, 800), AMBER, t, t0 + 0.3, 0.5, 'left', 8, a);
      this.rise(big, 552, H / 2 + 40, HF(200, 900), WHITE, t, t0 + 0.4, 0.6, 'left', 6, a);
      this.rise(es, 560, H / 2 + 100, HF(50, 800), GREY, t, t0 + 0.55, 0.6, 'left', 8, a);
      this.rise(d1, 562, H / 2 + 170, TF(30, 600), WHITE, t, t0 + 0.75, 0.6, 'left', 0, a);
      this.rise(d2, 562, H / 2 + 210, SF(30), PAPER, t, t0 + 0.9, 0.6, 'left', 0, a * 0.85);
    }
  }
  hud(t) {
    const a = win(t, S('round1') + 2.4, SE('closing') - 4.0, 0.6, 0.8); if (a <= 0) return;
    const lw = this.logo ? 58 * this.logo.width / this.logo.height : 60;
    this.logoAt(70 + lw / 2, 74, 58, a);
    this.line(86 + lw, 50, 86 + lw, 98, 'rgba(255,255,255,0.25)', 2, a);
    this.txt('NAGAHIRO', 102 + lw, 70, HF(34, 900), WHITE, 'left', 4, a);
    this.txt('DEBATE · SBL GRADE 10', 104 + lw, 94, MF(14, 700), GREY, 'left', 3, a);
    const items = [['round1', 'THESIS'], ['round2', 'ANTITHESIS'], ['round3', 'SUBLATION'], ['closing', 'CLOSING']];
    let x = W - 70;
    for (let i = items.length - 1; i >= 0; i--) {
      const [sc, lab] = items[i], act = t >= S(sc) && t < SE(sc), done = t >= SE(sc);
      const wd = this.w(lab, MF(15, 800), 2) + 34; x -= wd;
      this.glass(x, 52, wd, 38, 19, a, act ? 'rgba(232,16,42,0.9)' : 'rgba(8,12,24,0.6)', act ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)');
      this.txt(lab, x + wd / 2, 77, MF(15, 800), act ? WHITE : done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', 'center', 2, a);
      x -= 10;
    }
  }

  // ------------------------------------------------------------ graficos por momento
  panel(x, y, w, h, t0, t1, t, title, lines, color = AMBER) {
    const a = win(t, t0, t1, 0.4, 0.4); if (a <= 0) return 0;
    const k = eo(seg(t, t0, t0 + 0.5));
    this.glass(x - (1 - k) * 40, y, w, h, 20, a);
    const c = this.x; c.save(); c.globalAlpha = a; c.fillStyle = color; c.fillRect(x - (1 - k) * 40, y, 6, h); c.restore();
    this.txt(title, x + 30, y + 46, MF(16, 800), color, 'left', 4, a);
    lines.forEach((l, i) => this.rise(l[0], x + 30, y + 46 + l[2], l[1], l[3] || WHITE, t, t0 + 0.15 + i * 0.12, 0.45, 'left', l[4] || 0, a));
    return a;
  }
  graphics(t) {
    const c = this.x;
    // --- Ronda 1: cita de Stimson
    const a3 = C('a3');
    {
      const a = win(t, M('a3_least') - 0.3, a3.t1 + 1.6, 0.4, 0.5);
      if (a > 0) {
        this.glass(W - 820, 300, 700, 250, 24, a);
        this.txt('“', W - 790, 420, SF(140, false, 600), AMBER, 'left', 0, a);
        this.rise('the least abhorrent', W - 720, 400, SF(66), WHITE, t, M('a3_least') - 0.1, 0.5, 'left', 0, a);
        this.rise('choice”', W - 720, 466, SF(66), WHITE, t, M('a3_least') + 0.1, 0.5, 'left', 0, a);
        this.rise('HENRY L. STIMSON · HARPER’S MAGAZINE, 1947', W - 720, 515, MF(16, 700), GREY, t, M('a3_least') + 0.4, 0.5, 'left', 2, a);
      }
    }
    // --- 500 000: la afirmacion y su refutacion
    const a5 = M('a5_half'), b1 = C('b1'), bd = M('b1_dont');
    {
      const a = win(t, a5 - 0.2, C('a6').t0 + 0.4, 0.3, 0.4) + win(t, b1.t0 + 0.2, b1.t1 + 1.4, 0.4, 0.5);
      if (a > 0) {
        const x = W - 740, y = 300;
        this.glass(x, y, 640, 260, 24, a);
        this.txt('THE OFFICIAL CLAIM · LA VERSIÓN OFICIAL', x + 34, y + 50, MF(15, 800), AMBER, 'left', 3, a);
        const n = Math.round(500000 * eo(seg(t, a5, a5 + 1.0)));
        this.txt(fmt(t > b1.t0 ? 500000 : n), x + 30, y + 160, HF(130, 900), WHITE, 'left', 2, a);
        this.txt('U.S. lives “saved”', x + 36, y + 214, TF(26, 600, true), GREY, 'left', 0, a);
        const s = eo(seg(t, bd, bd + 0.5));
        if (s > 0) {
          c.save(); c.globalAlpha = a; c.strokeStyle = RED; c.lineWidth = 10; c.beginPath(); c.moveTo(x + 24, y + 122); c.lineTo(x + 24 + 420 * s, y + 112); c.stroke(); c.restore();
          this.rise('NOT SUPPORTED by 1945 military estimates', x + 300, y + 214, MF(15, 800), RED, t, bd + 0.2, 0.5, 'left', 1, a);
        }
      }
    }
    // --- Alperovitz / Hasegawa
    const b2 = C('b2');
    {
      const a = win(t, M('b2_alp') - 0.2, b2.t1 + 1.0, 0.4, 0.5);
      const card = (x, t0, name, l1, l2) => {
        const aa = a * seg(t, t0 - 0.2, t0 + 0.3); if (aa <= 0) return;
        this.glass(x, 300, 520, 170, 20, aa); c.save(); c.globalAlpha = aa; c.fillStyle = ICE; c.fillRect(x, 300, 6, 170); c.restore();
        this.txt(name, x + 30, 352, HF(44, 900), WHITE, 'left', 2, aa);
        this.txt(l1, x + 30, 398, TF(24, 600), WHITE, 'left', 0, aa);
        this.txt(l2, x + 30, 434, TF(22, 500, true), GREY, 'left', 0, aa);
      };
      card(W - 1170, M('b2_alp'), 'ALPEROVITZ · 1965', 'Atomic diplomacy:', 'a message to the Soviet Union');
      card(W - 620, M('b2_has'), 'HASEGAWA · 2005', 'Soviet entry into the war', 'weighed on Japan’s leaders');
    }
    // --- "interpretacion, no hecho"
    const b3 = C('b3');
    { const a = win(t, b3.t0 + 0.4, b3.t1 + 0.8, 0.2, 0.4); if (a > 0) {
      const k = back(seg(t, b3.t0 + 0.4, b3.t0 + 0.9), 2.2);
      c.save(); c.translate(W - 420, 360); c.rotate(-0.06); c.scale(k, k);
      c.globalAlpha = a * 0.75; c.fillStyle = 'rgba(8,12,24,0.8)'; c.fillRect(-300, -64, 600, 128);
      c.globalAlpha = a; c.strokeStyle = AMBER; c.lineWidth = 5; c.strokeRect(-300, -64, 600, 128);
      this.txt('INTERPRETATION ≠ FACT', 0, 20, HF(58, 900), AMBER, 'center', 3, a * clamp(k));
      c.restore();
    } }

    // --- M1: masa-energia
    const m1 = C('m1'), m2 = C('m2'), tw = BE('tower');
    { const a = win(t, M('m1_gram') - 0.1, tw - 0.2, 0.4, 0.5); const g = this.s3.story.world.grain;
      if (a > 0 && g.visible) {
        const p = g.position;
        this.tag([p.x, p.y, p.z], 130, -110, '≈ 0.7 g', 'LESS THAN ONE GRAM · <1 g', AMBER, a * win(t, M('m1_gram'), m2.t0 + 0.8, 0.3, 0.4));
      }
      this.panel(110, 250, 560, 250, M('m1_less'), tw + 0.2, t, 'MASS–ENERGY · MASA–ENERGÍA', [
        ['E = Δm · c²', HF(72, 900), 76],
        ['Δm ≈ 0.7 g  →  E ≈ 6.3 × 10¹³ J', MF(22, 700), 120, AMBER],
        ['Hiroshima · 15 kt (Malik, 1985)', TF(22, 500, true), 160, GREY],
      ]);
      const k = eo(seg(t, M('m2_fifteen') - 0.4, M('m2_fifteen') + 2.4)), aT = win(t, M('m2_fifteen') - 0.3, tw + 0.3, 0.4, 0.5);
      if (aT > 0) {
        this.glass(W - 700, 190, 620, 250, 24, aT);
        this.txt(fmt(15000 * k), W - 120, 330, HF(150, 900), WHITE, 'right', 2, aT);
        this.txt('TONS OF TNT · TONELADAS DE TNT', W - 124, 376, MF(18, 800), AMBER, 'right', 3, aT);
        this.txt('1 cube = 10 t  ·  10 × 10 × 15 = 1,500 cubes', W - 124, 412, TF(22, 500, true), GREY, 'right', 0, aT);
      }
    }
    // --- M2: inverso del cuadrado
    const m3 = C('m3'), m4 = C('m4'), m6 = C('m6'), m7 = C('m7');
    this.panel(110, 230, 600, 282, M('m3_heat') - 0.2, m4.t1 + 0.6, t, 'INVERSE SQUARE · INVERSO DEL CUADRADO', [
      ['Q = f · W / 4πR²', HF(66, 900), 72],
      ['f = 0.35 · W = 15 kt · burst at 580 m', MF(18, 700), 112, AMBER],
      ['no atmospheric absorption → upper bound', MF(18, 700), 142, GREY],
      ['sin absorción atmosférica → cota superior', TF(20, 500, true), 176, GREY],
    ]);
    { const w = this.s3.story.world;
      const aB = win(t, M('m3_heat') - 0.2, m6.t0 + 0.6, 0.4, 0.4);
      this.tag([MAPC[0], 0.58 * KM, MAPC[2]], -90, -70, '580 m', 'BURST HEIGHT', AMBER, aB, 'right');
      [0.5, 1, 1.5, 2, 3].forEach((km, i) => {
        const aa = win(t, M('m4_half') + i * 0.35, m4.t1 + 0.6, 0.3, 0.4);
        const v = Q(km), s = v >= 5 ? fmt(v, 0) : fmt(v, 1);
        const ang = [-2.45, -0.95, -0.15, 0.55, 1.15][i], left = i === 0;
        this.tag([MAPC[0] + Math.cos(ang) * km * KM, 0.17, MAPC[2] + Math.sin(ang) * km * KM], left ? -40 : 40, left ? -60 : -30, s + ' cal/cm²', km + ' km', i < 2 ? AMBER : '#ffd27a', aa, left ? 'right' : 'left');
      });
    }
    // --- M3: raiz cubica
    this.panel(110, 230, 600, 252, m6.t0 + 0.2, m7.t0 + 0.4, t, 'CUBE-ROOT SCALING · RAÍZ CÚBICA', [
      ['R₂ = R₁ · (W₂ / W₁)^⅓', HF(64, 900), 72],
      ['300 kt / 15 kt = 20  →  radius × 2.7', MF(18, 700), 112, AMBER],
      ['area × 7.4 · ideal air burst, flat terrain', MF(18, 700), 142, GREY],
    ], '#ff7a50');
    { const yd = this.s3.story.world.yieldDiscs;
      const a15 = win(t, m6.t0 + 0.1, m7.t0 + 0.2, 0.4, 0.4), a300 = win(t, M('m6_three') + 0.6, m7.t0 + 0.2, 0.4, 0.4);
      const s300 = yd[2].m.scale.x * yd[2].r;
      this.tag([MAPC[0] - yd[0].r * 0.7, 0.2, MAPC[2] + yd[0].r * 0.7], -40, -60, '15 kt', 'HIROSHIMA', '#ffd9a0', a15, 'right');
      this.tag([MAPC[0] + s300 * 0.72, 0.2, MAPC[2] - s300 * 0.69], 40, -50, '300 kt', 'RADIUS × 2.7', RED, a300 * seg(t, M('m6_cube') - 0.2, M('m6_cube') + 0.3));
      const aA = win(t, M('m6_area'), m7.t0 + 0.2, 0.3, 0.4);
      if (aA > 0) { this.glass(W - 600, 560, 520, 190, 24, aA); this.txt('AREA × 7.4', W - 130, 680, HF(124, 900), WHITE, 'right', 2, aA); this.txt('ÁREA MÁS DE 7 VECES MAYOR', W - 134, 720, MF(18, 800), RED, 'right', 3, aA); }
    }
    // --- M4: decaimiento
    const m8 = C('m8');
    { const a = win(t, m7.t0 + 0.8, m8.t0 + 0.3, 0.5, 0.5);
      if (a > 0) {
        const d = decayDays(t), fi = fI131(d), fc = fCs137(d);
        const tl = d < 365 ? fmt(d, 0) + ' days' : fmt(d / 365.25, 0) + ' years';
        this.glass(W / 2 - 220, 128, 440, 92, 46, a);
        this.txt('t = ' + tl, W / 2, 190, HF(56, 900), WHITE, 'center', 2, a);
        const pct = v => v >= 0.995 ? fmt(v * 100, 1) + ' %' : v > 0.0995 ? fmt(v * 100, 1) + ' %' : v > 0.001 ? fmt(v * 100, 2) + ' %' : '< 0.1 %';
        this.tag([-2.1, 1.55, MAPC[2] - 0.6], -50, 10, 'I-131 · ' + pct(fi), 'HALF-LIFE ≈ 8 DAYS', AMBER, a, 'right');
        this.tag([2.1, 1.55, MAPC[2] - 0.6], 50, 10, 'Cs-137 · ' + pct(fc), 'HALF-LIFE ≈ 30 YEARS', ICE, a);
        this.panel(110, H - 380, 560, 150, m7.t0 + 1.0, m8.t0 + 0.3, t, 'RADIOACTIVE DECAY · DECAIMIENTO', [['N(t) = N₀ · (½)^(t/T)', HF(56, 900), 64]], ICE);
      }
    }
    // --- M5: dosis-respuesta
    { const a = win(t, m8.t0 + 0.6, B('cranes_in') + 0.4, 0.5, 0.5);
      if (a > 0) {
        this.panel(110, 230, 610, 252, m8.t0 + 0.6, B('cranes_in') + 0.4, t, 'DOSE–RESPONSE · DOSIS–RESPUESTA', [
          ['RR = 1 + 0.42 · D', HF(66, 900), 72],
          ['solid cancer mortality · Life Span Study', MF(18, 700), 112, AMBER],
          ['population average, not an individual prediction', MF(16, 700), 142, GREY],
        ]);
        const w = this.s3.story.world;
        w.doseBars.forEach((b, i) => {
          const aa = a * seg(t, M('m8_risk') + i * 0.13, M('m8_risk') + i * 0.13 + 0.4); if (aa <= 0) return;
          const top = b.getWorldPosition(new window.THREE.Vector3()); top.y = b.scale.y + 0.08;
          const q = this.proj([top.x, top.y, top.z]), q2 = this.proj([top.x, 0, top.z + 0.25]);
          this.txt(fmt(1 + 0.42 * b.userData.D, 2), q.x, q.y, HF(40, 900), WHITE, 'center', 1, aa);
          this.txt(fmt(b.userData.D, 1) + ' Gy', q2.x, q2.y + 30, MF(17, 800), AMBER, 'center', 1, aa);
        });
      }
    }
    // --- memoria: conteo incierto, brecha prometeica, Nobel
    const m9 = C('m9'), m11 = C('m11'), m12 = C('m12');
    { const a = win(t, M('m9_between') - 0.2, m9.t1 + 1.0, 0.5, 0.6);
      if (a > 0) {
        this.rise('110,000 – 210,000', W / 2, 250, SF(104, false, 600), PAPER, t, M('m9_between'), 0.8, 'center', 2, a);
        this.rise('estimated deaths · muertes estimadas · Hiroshima + Nagasaki', W / 2, 300, MF(18, 700), GREY, t, M('m9_between') + 0.4, 0.6, 'center', 2, a);
      }
    }
    { const a = win(t, M('m11_gap') - 0.3, m11.t1 + 0.9, 0.4, 0.5);
      if (a > 0) {
        const x0 = 260, y0 = 230, L1 = 1400, L2 = 420;
        const k1 = eo(seg(t, M('m11_produce') - 0.2, M('m11_produce') + 1.0)), k2 = eo(seg(t, M('m11_produce') + 0.4, M('m11_produce') + 1.2));
        this.glass(x0 - 50, y0 - 70, L1 + 100, 260, 24, a * 0.95);
        this.txt('THE PROMETHEAN GAP · LA BRECHA PROMETEICA', x0, y0 - 22, MF(17, 800), AMBER, 'left', 4, a);
        c.save(); c.globalAlpha = a; c.fillStyle = AMBER; c.fillRect(x0, y0 + 10, L1 * k1, 34); c.fillStyle = PAPER; c.fillRect(x0, y0 + 96, L2 * k2, 34); c.restore();
        this.txt('WHAT WE CAN PRODUCE · LO QUE PODEMOS PRODUCIR', x0 + 14, y0 + 34, MF(17, 800), NAVY, 'left', 2, a * k1);
        this.txt('WHAT WE CAN IMAGINE OR FEEL', x0 + 14, y0 + 158, MF(16, 800), PAPER, 'left', 2, a * k2);
        const gk = seg(t, M('m11_feel') - 0.4, M('m11_feel') + 0.4);
        if (gk > 0) {
          this.line(x0 + L2, y0 + 113, x0 + L1, y0 + 113, RED, 3, a * gk);
          this.line(x0 + L1, y0 + 44, x0 + L1, y0 + 130, RED, 3, a * gk);
          this.txt('GAP · BRECHA', x0 + (L1 + L2) / 2, y0 + 100, HF(40, 900), RED, 'center', 6, a * gk);
        }
        this.txt('Günther Anders, 1956', x0 + L1, y0 + 160, TF(20, 500, true), GREY, 'right', 0, a);
      }
    }
    { const a = win(t, M('m12_2024') - 0.2, m12.t1 + 1.4, 0.4, 0.6);
      if (a > 0) {
        const x = W / 2 - 380, y = 160;
        this.glass(x, y, 760, 190, 24, a, 'rgba(244,239,228,0.92)', 'rgba(0,0,0,0.1)');
        this.txt('NOBEL PEACE PRIZE · 2024', W / 2, y + 52, MF(18, 800), '#9a6b1f', 'center', 5, a);
        this.rise('Nihon Hidankyo', W / 2, y + 122, SF(70, true, 600), INK, t, M('m12_2024'), 0.6, 'center', 1, a);
        this.txt('the survivors’ organization · la organización de los sobrevivientes', W / 2, y + 162, TF(19, 500, true), '#5a5040', 'center', 0, a);
      }
    }
    // --- ronda 3: cristales y Aufhebung
    const c1 = C('c1'), c2 = C('c2'), c5 = M('c5_close'), c6 = C('c6');
    { const w = this.s3.story.world;
      if (w.cThesis.visible) this.tag(w.cThesis.position.toArray(), -70, 70, 'THESIS', 'ENDING THE WAR MATTERED', AMBER, win(t, M('c1_keep') + 0.3, c5 - 0.3, 0.4, 0.3), 'right');
      if (w.cAnti.visible) this.tag(w.cAnti.position.toArray(), 70, 70, 'ANTITHESIS', 'SOME HARM IS IRREVERSIBLE', ICE, win(t, M('c2_keep') + 0.3, c5 - 0.3, 0.4, 0.3));
      const a = win(t, c5 - 0.1, SE('round3') + 0.2, 0.3, 0.5);
      if (a > 0) {
        this.rise('AUFHEBUNG', W / 2, 250, HF(110, 900), WHITE, t, c5, 0.6, 'center', 16, a);
        const ws = [['CANCEL', 'cancelar'], ['PRESERVE', 'conservar'], ['RAISE', 'elevar']];
        ws.forEach(([e, s], i) => {
          const x = W / 2 + (i - 1) * 300;
          this.rise(e, x, 310, MF(24, 800), [AMBER, ICE, PAPER][i], t, c5 + 0.4 + i * 0.25, 0.5, 'center', 5, a);
          this.rise(s, x, 344, SF(28), GREY, t, c5 + 0.5 + i * 0.25, 0.5, 'center', 0, a);
        });
        this.txt('Hegel, 1830 / 1991, §§79–82', W / 2, 384, TF(18, 500, true), GREY, 'center', 0, a * seg(t, c5 + 1.2, c5 + 1.6));
      }
    }
  }

  // ------------------------------------------------------------ cierre
  closing(t) {
    const c = this.x;
    const d1 = C('d1'), d3 = C('d3'), bell = M('bell');
    { const a = win(t, M('d1_twelve') - 0.2, C('d2').t0 + 1.4, 0.4, 0.6);
      if (a > 0) {
        const k = eo(seg(t, M('d1_twelve') - 0.3, M('d1_twelve') + 2.2));
        this.txt(fmt(Math.round(12187 * k)), W / 2, 260, HF(170, 900), WHITE, 'center', 4, a);
        this.txt('NUCLEAR WARHEADS · JANUARY 2026 · OJIVAS NUCLEARES', W / 2, 306, MF(19, 800), RED, 'center', 4, a);
        this.txt('1 dot = 1 warhead · SIPRI Yearbook 2026', W / 2, 342, TF(20, 500, true), GREY, 'center', 0, a);
      }
    }
    { const a = win(t, M('d3_calc') - 0.1, d3.t1 + 1.0, 0.2, 0.5);
      if (a > 0) {
        const ws = [['CALCULATE', 'd3_calc', AMBER], ['REMEMBER', 'd3_remember', PAPER], ['DECIDE', 'd3_decide', RED]];
        ws.forEach(([s, mk, col], i) => {
          const x = W / 2 + (i - 1) * 540, kk = back(seg(t, M(mk) - 0.05, M(mk) + 0.35), 2);
          c.save(); c.translate(x, 250); c.scale(kk, kk); this.txt(s, 0, 0, HF(86, 900), col, 'center', 5, a * clamp(kk)); c.restore();
        });
      }
    }
    { const a = win(t, M('end_title') - 0.1, SE('closing') + 0.2, 0.6, 0.6);
      if (a > 0) {
        c.save(); c.globalAlpha = a * 0.45; c.fillStyle = NAVY; c.fillRect(0, 0, W, H); c.restore();
        const sp = lerp(36, 18, eo5(seg(t, M('end_title'), M('end_title') + 2.2)));
        this.txt('NO MORE HIBAKUSHA', W / 2, H / 2 - 20, HF(150, 900), WHITE, 'center', sp, a * eo(seg(t, M('end_title'), M('end_title') + 0.8)));
        this.rise('Nunca más hibakusha', W / 2, H / 2 + 50, SF(48), PAPER, t, M('end_title') + 0.6, 0.8, 'center', 1, a);
        this.rise('In memory of the victims of Hiroshima and Nagasaki · 1945', W / 2, H / 2 + 110, MF(18, 700), GREY, t, M('end_title') + 1.2, 0.8, 'center', 3, a);
      }
    }
  }

  credits(t) {
    const k0 = B('credits'); if (t < k0 - 0.6) return;
    const c = this.x, a = seg(t, k0 - 0.6, k0 + 0.4), out = 1 - seg(t, TL.dur - 1.2, TL.dur - 0.1);
    c.save(); c.globalAlpha = a; c.fillStyle = NAVY; c.fillRect(0, 0, W, H); c.restore();
    const A = a * out;
    this.logoAt(250, 230, 170, A);
    this.rise('NAGAHIRO', 440, 220, HF(96, 900), WHITE, t, k0, 0.6, 'left', 10, A);
    this.rise('AND THE WEIGHT OF THE FLASH · HISTORY, SCIENCE AND MEMORY IN HIROSHIMA AND NAGASAKI', 444, 262, MF(17, 800), AMBER, t, k0 + 0.2, 0.6, 'left', 2, A);
    const col = (x, y, head, rows, t0) => {
      this.rise(head, x, y, MF(16, 800), RED, t, t0, 0.5, 'left', 4, A);
      rows.forEach((r, i) => this.rise(r[0], x, y + 44 + i * 38, r[1] || TF(26, 600), r[2] || WHITE, t, t0 + 0.12 + i * 0.07, 0.5, 'left', 0, A));
    };
    col(160, 380, 'STUDENTS · ESTUDIANTES', [['Samuel Alejandro Losada Bravo'], ['Tomás Alejandro Homez Barragán']], k0 + 0.4);
    col(160, 540, 'TEACHER · DOCENTE', [['Juan David Rodríguez Cerón']], k0 + 0.6);
    col(160, 660, 'AREAS · ÁREAS', [['Social Sciences · Artistic and Cultural Education', TF(22, 500)], ['Philosophy · Mathematics · Technoscience', TF(22, 500)]], k0 + 0.8);
    col(160, 820, 'INSTITUTION', [['Corporación Colegio San Bonifacio de las Lanzas Bilingüe', TF(22, 500)], ['Projective Cycle · Grade 10 · Ibagué, Tolima · 2026', TF(20, 500, true), GREY]], k0 + 1.0);
    const refs = ['Alperovitz (1965)', 'Anders (1956)', 'Bernstein (1986)', 'Frank (1999)', 'Glasstone & Dolan (1977)', 'Hasegawa (2005)', 'Hegel (1991)', 'Jonas (1984)',
      'Malik (1985)', 'Norwegian Nobel Committee (2024)', 'Ozasa et al. (2012)', 'SIPRI (2026)', 'Stimson (1947)', 'Walker (2004)', 'Wellerstein (2020)'];
    this.rise('SOURCES CITED · FUENTES', 1060, 380, MF(16, 800), RED, t, k0 + 0.5, 0.5, 'left', 4, A);
    refs.forEach((r, i) => this.rise(r, 1060 + (i % 2) * 380, 424 + Math.floor(i / 2) * 36, TF(21, 500), WHITE, t, k0 + 0.6 + i * 0.04, 0.5, 'left', 0, A * 0.9));
    this.rise('PRODUCTION NOTES', 1060, 740, MF(16, 800), RED, t, k0 + 1.2, 0.5, 'left', 4, A);
    const notes = ['Debate positions are argumentative roles, not personal opinions.', 'No real historical person is depicted. No graphic violence.',
      'Figures come from the project’s models; see the proposal for assumptions.', '3D: Three.js · Synthetic neural voices · Original synthesized score.'];
    notes.forEach((s, i) => this.rise(s, 1060, 782 + i * 34, TF(19, 500, true), GREY, t, k0 + 1.3 + i * 0.08, 0.5, 'left', 0, A));
  }

  // ------------------------------------------------------------ pantalla LED del estudio (textura 2048 x 640)
  board(x, t) {
    const Wb = 2048, Hb = 640;
    x.fillStyle = '#04060c'; x.fillRect(0, 0, Wb, Hb);
    x.strokeStyle = 'rgba(80,110,170,0.12)'; x.lineWidth = 1;
    for (let i = 0; i < Wb; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, Hb); x.stroke(); }
    const T = (s, px, py, font, col, al = 'center', ls = 0) => { x.save(); x.font = font; x.fillStyle = col; x.textAlign = al; if (ls) x.letterSpacing = ls + 'px'; x.fillText(s, px, py); x.restore(); };
    const on = ss(seg(t, M('lights') + 0.3, M('lights') + 1.2)); if (on <= 0) return;
    x.globalAlpha = on;
    const r1 = S('round1'), r2 = S('round2'), r3 = S('round3'), cl = S('closing');
    if (this.logo) { const h = 120, w = h * this.logo.width / this.logo.height; x.drawImage(this.logo, 80, 40, w, h); x.drawImage(this.logo, Wb - 80 - w, 40, w, h); }
    if (t > B('title') - 0.2 && t < r1) x.globalAlpha = on * (1 - 0.85 * ss(seg(t, B('title') - 0.2, B('title') + 0.2)));
    if (t < r1) {
      T('NAGAHIRO', Wb / 2, 340, HF(230, 900), WHITE, 'center', 30);
      T('AND THE WEIGHT OF THE FLASH', Wb / 2, 430, HF(72, 800), AMBER, 'center', 14);
      T('HISTORY · SCIENCE · MEMORY', Wb / 2, 500, MF(30, 700), GREY, 'center', 8);
    } else {
      const rd = t < r2 ? ['ROUND 1', 'THESIS', AMBER] : t < r3 ? ['ROUND 2', 'ANTITHESIS', ICE] : t < cl ? ['ROUND 3', 'SUBLATION', PAPER] : ['CLOSING', '', RED];
      T(rd[0], Wb / 2, 120, MF(40, 800), rd[2], 'center', 12);
      if (t > M('a5_half') && t < C('m1').t0) {
        T('500,000 ?', Wb / 2, 400, HF(260, 900), WHITE, 'center', 10);
        const s = seg(t, M('b1_dont'), M('b1_dont') + 0.5);
        if (s > 0) { x.strokeStyle = RED; x.lineWidth = 22; x.beginPath(); x.moveTo(560, 330); x.lineTo(560 + 930 * s, 310); x.stroke(); }
      } else if (t > C('m1').t0 && t < r3) {
        const eqs = [[C('m1').t0, 'E = Δm · c²'], [C('m3').t0, 'Q = f · W / 4πR²'], [C('m6').t0, 'R₂ = R₁ · (W₂/W₁)^⅓'], [C('m7').t0, 'N = N₀ · (½)^(t/T)'], [C('m8').t0, 'RR = 1 + 0.42 · D'], [B('cranes_in'), '1945 — 2026']];
        let e = eqs[0][1]; for (const [tt, s] of eqs) if (t >= tt) e = s;
        const dim = t > C('m7').t0 - 0.5 && t < B('cranes_in') ? 0.3 : 1;
        x.globalAlpha = on * dim; T(e, Wb / 2, 380, HF(150, 900), WHITE, 'center', 4); x.globalAlpha = on;
      } else {
        const card = t < C(t < r2 ? 'r1n' : t < r3 ? 'r2n' : 'r3n').t1 + 1 && t < cl;
        x.globalAlpha = on * (card ? 1 : 0.45); T(rd[1], Wb / 2, 380, HF(card ? 240 : 150, 900), WHITE, 'center', card ? 20 : 12); x.globalAlpha = on;
      }
    }
    x.globalAlpha = 1;
  }
}
