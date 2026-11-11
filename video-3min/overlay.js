// overlay.js - Motion design 2D: logo animado, titulo cinetico, datos de la encuesta, graficos anclados al 3D,
// subtitulos sincronizados palabra a palabra, transiciones, marcador y creditos.
import { TL } from './timeline.js';
import { clamp, lerp, seg, ss, eio, eo, eo5, ei, back, spring, hash, win } from './lib.js';
import { S, SE, B, BE, M, C } from './story.js';

const W = 1920, H = 1080;
const NAVY = '#070b16', RED = '#e8102a', GOLD = '#ffd21f', CYAN = '#3fd8ff', GREY = '#77787b', WHITE = '#ffffff', GREEN = '#35f0a0';
const WHO = { sofia: { n: 'SOFÍA', c: GOLD }, martin: { n: 'MARTÍN', c: CYAN }, juan: { n: 'JUAN DIEGO', c: '#ff5a6a' } };
const HF = (px, w = 900, it = true) => `${it ? 'italic ' : ''}${w} ${px}px "Barlow Condensed"`;
const TF = (px, w = 600, it = false) => `${it ? 'italic ' : ''}${w} ${px}px "Inter"`;
const MF = (px, w = 700) => `${w} ${px}px "JetBrains Mono"`;
const num = (v, d = 1) => v.toFixed(d).replace('.', ',');
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

const CHAPTERS = [['intro', 'LA PREGUNTA'], ['problem', 'EL PROBLEMA'], ['history', 'EL PARTIDO DE LA HISTORIA'], ['rule', 'LA REGLA'], ['play', 'LA JUGADA'], ['hope', 'LA OPORTUNIDAD']];

export class Overlay2D {
  constructor(canvas, s3, logo) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.s3 = s3; this.logo = logo;
    this.subs = TL.cues.filter(c => !c.shout && c.id !== 'e5_j' && c.id !== 'e5_m').map(c => this._prepSub(c));
    this.shouts = TL.cues.filter(c => c.shout && !c.id.startsWith('e5'));
  }

  // ------------------------------------------------------------------ helpers
  rr(x, y, w, h, r) { const c = this.x; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  txt(s, x, y, font, color = WHITE, align = 'left', ls = 0, alpha = 1) {
    const c = this.x; if (alpha <= 0.003) return 0;
    c.save(); c.globalAlpha *= clamp(alpha); c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; c.letterSpacing = ls + 'px';
    c.fillText(s, x, y); const w = c.measureText(s).width; c.restore(); return w;
  }
  tw(s, font, ls = 0) { const c = this.x; c.save(); c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.restore(); return w; }
  // texto que sube desde una mascara
  rise(s, x, y, font, color, t, t0, d = 0.5, align = 'left', ls = 0) {
    const u = eo5(seg(t, t0, t0 + d)); if (u <= 0) return;
    const c = this.x, px = parseInt(font.match(/(\d+)px/)[1]);
    c.save(); c.beginPath(); c.rect(0, y - px * 1.05, W, px * 1.32); c.clip();
    this.txt(s, x, y + (1 - u) * px * 1.1, font, color, align, ls); c.restore();
  }
  // texto letra por letra
  chars(s, x, y, font, color, t, t0, step = 0.028, ls = 0, align = 'left') {
    const c = this.x, px = parseInt(font.match(/(\d+)px/)[1]);
    const total = this.tw(s, font, ls); let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    c.save(); c.beginPath(); c.rect(0, y - px * 1.05, W, px * 1.32); c.clip();
    for (let i = 0; i < s.length; i++) {
      const u = eo5(seg(t, t0 + i * step, t0 + i * step + 0.45));
      if (u > 0) this.txt(s[i], x0 + this.tw(s.slice(0, i), font, ls), y + (1 - u) * px * 1.1, font, color, 'left', 0);
    }
    c.restore(); return total;
  }
  // bloque inclinado
  slab(x, y, w, h, color, skew = 0.22) { const c = this.x; c.beginPath(); c.moveTo(x + h * skew, y); c.lineTo(x + w + h * skew, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fillStyle = color; c.fill(); }
  // panel de vidrio esmerilado sobre la escena 3D
  glass(x, y, w, h, r = 28, alpha = 1, tint = 'rgba(7,11,24,0.74)') {
    const c = this.x; if (alpha <= 0.003) return;
    c.save(); c.globalAlpha *= alpha;
    c.save(); this.rr(x, y, w, h, r); c.clip();
    c.filter = 'blur(20px)'; c.drawImage(this.s3.canvas, x - 40, y - 40, w + 80, h + 80, x - 40, y - 40, w + 80, h + 80); c.filter = 'none';
    c.fillStyle = tint; c.fillRect(x, y, w, h);
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.25, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(x, y, w, h); c.restore();
    this.rr(x + 0.5, y + 0.5, w - 1, h - 1, r); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.5; c.stroke();
    c.restore();
  }
  person(x, y, s, color) { const c = this.x; c.fillStyle = color; c.beginPath(); c.arc(x, y + s * 0.2, s * 0.2, 0, 7); c.fill(); this.rr(x - s * 0.3, y + s * 0.46, s * 0.6, s * 0.54, s * 0.2); c.fill(); }
  P(v) { return this.s3.project(v); }
  head(id, up = 0.3) { const h = this.s3.story.actors[id].headW; return this.P([h.x, h.y + up, h.z]); }
  line(a, b, color, w = 3, u = 1, dash = null) { const c = this.x; c.save(); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; if (dash) c.setLineDash(dash); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(lerp(a.x, b.x, u), lerp(a.y, b.y, u)); c.stroke(); c.restore(); }

  // ================================================================== RENDER
  render(t) {
    const c = this.x; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1;
    const cr = S('credits');
    this.vignette(); this.letterbox(t);
    this.sceneGraphics(t);
    this.fullscreen(t);
    if (t > M('wipe_in') + 0.5) this.hud(t);
    this.subtitles(t); this.shoutPops(t);
    this.titleCard(t);
    for (const [sc] of CHAPTERS.slice(1)) this.wipe(t, S(sc), sc);
    if (t >= cr) this.credits(t);
    if (t < M('wipe_in') + 1.0) this.sting(t);
    const fo = seg(t, 179.0, 179.85); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  vignette() {
    const c = this.x; if (!this._vg) { const g = c.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,0.5)'); this._vg = g; }
    c.fillStyle = this._vg; c.fillRect(0, 0, W, H);
  }
  letterbox(t) {
    const k = win(t, M('set2') + 0.15, M('land') + 0.5, 0.35, 0.4), h = 74 * eio(k);
    if (h > 0.5) { const c = this.x; c.fillStyle = '#000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h); }
  }

  // ------------------------------------------------------------------ LOGO DE APERTURA
  stingArt(c, t, ww, hh) {
    // arte del logo sobre fondo claro (se usa tambien como contenido de la pantalla LED)
    const pop = M('logo_pop'), cx = ww / 2, cy = hh * 0.44, k = hh / 1080;
    c.fillStyle = '#f4f5f8'; c.fillRect(0, 0, ww, hh);
    const g = c.createRadialGradient(cx, cy, 50 * k, cx, cy, 900 * k); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(226,229,236,1)'); c.fillStyle = g; c.fillRect(0, 0, ww, hh);
    c.fillStyle = 'rgba(119,120,123,0.22)';
    const off = (t * 9) % 60;
    for (let y = -60; y < hh + 60; y += 60 * k) for (let x = -60; x < ww + 60; x += 60 * k) c.fillRect(x + off * k, y + off * 0.5 * k, 3 * k, 3 * k);
    // arcos giratorios
    const arcs = [[430, 10, GREY, 0.5, 0.25, 1.0], [468, 4, RED, 0.9, 0.4, -0.7], [505, 16, GREY, 0.28, 0.55, 0.45]];
    c.save(); c.beginPath(); c.rect(0, 0, ww, hh * 0.73); c.clip();
    for (const [r, lw, col, al, t0, sp] of arcs) {
      const u = eo(seg(t, t0, t0 + 1.1)); if (u <= 0) continue;
      c.save(); c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = lw * k; c.lineCap = 'round';
      const a0 = t * sp * 0.5 + r; c.beginPath(); c.arc(cx, cy, r * k, a0, a0 + u * 4.4); c.stroke(); c.restore();
    }
    c.restore();
    // balon que cae y se convierte en el logo
    if (t < pop) { const u = ei(seg(t, 0.2, pop)); c.fillStyle = RED; c.beginPath(); c.arc(cx, lerp(-80 * k, cy, u), 44 * k, 0, 7); c.fill(); }
    else {
      const u = t - pop;
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2 + 0.2, q = eo(seg(u, 0, 0.55)), o = 1 - seg(u, 0.25, 0.7);
        if (o <= 0) continue;
        c.save(); c.globalAlpha = o; c.strokeStyle = i % 2 ? RED : GREY; c.lineWidth = 7 * k; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx + Math.cos(a) * (300 + q * 240) * k, cy + Math.sin(a) * (300 + q * 240) * k); c.lineTo(cx + Math.cos(a) * (360 + q * 330) * k, cy + Math.sin(a) * (360 + q * 330) * k); c.stroke(); c.restore();
      }
      const s = (0.55 + 0.45 * spring(u, 11, 0.5)) * (1 + seg(t, 3.5, 7) * 0.035), lw = 800 * k * s, lh = lw * this.logo.height / this.logo.width;
      c.save(); c.globalAlpha = seg(u, 0, 0.12); c.drawImage(this.logo, cx - lw / 2, cy - lh / 2 + 10 * k, lw, lh); c.restore();
    }
  }
  sting(t) {
    const c = this.x, wi = M('wipe_in');
    const f = eio(seg(t, wi, wi + 0.85)), front = lerp(-520, W + 420, f), sk = 300;
    c.save();
    if (f > 0) { c.beginPath(); c.moveTo(front + sk, 0); c.lineTo(W + 10, 0); c.lineTo(W + 10, H); c.lineTo(front, H); c.closePath(); c.clip(); }
    this.stingArt(c, t, W, H);
    const lt = M('logo_text');
    const lw = eo(seg(t, lt, lt + 0.6)) * 560; c.fillStyle = RED; c.fillRect(W / 2 - lw / 2, 818, lw, 5);
    this.rise('PROYECTO INTERDISCIPLINAR  ·  CICLO PROYECTIVO  ·  GRADO 10°', W / 2, 880, MF(27, 700), '#55565a', t, lt + 0.15, 0.6, 'center', 4);
    this.rise('P R E S E N T A', W / 2, 950, MF(22, 600), RED, t, lt + 1.1, 0.6, 'center', 6);
    c.restore();
    if (f > 0 && f < 1) {
      const bands = [[0, 150, NAVY], [150, 46, GREY], [196, 96, RED]];
      for (const [o, w, col] of bands) { c.beginPath(); c.moveTo(front + sk - o, 0); c.lineTo(front + sk - o - w, 0); c.lineTo(front - o - w, H); c.lineTo(front - o, H); c.closePath(); c.fillStyle = col; c.fill(); }
    }
  }

  // ------------------------------------------------------------------ TRANSICION ENTRE CAPITULOS
  wipe(t, T, sc) {
    if (t < T - 0.5 || t > T + 0.75) return;
    const c = this.x, sk = 260, cols = [RED, WHITE, GREY, NAVY], idx = CHAPTERS.findIndex(q => q[0] === sc);
    for (let i = 0; i < 4; i++) {
      const lagIn = (i) * 0.05, lagOut = (3 - i) * 0.05;
      let x0, x1;                                           // borde izquierdo / derecho de la banda
      if (t <= T) { const u = eo(seg(t, T - 0.46 + lagIn, T - 0.1 + lagIn)); x0 = -sk - 40; x1 = lerp(-sk - 40, W + sk + 40, u); }
      else { const u = ei(seg(t, T + 0.14 + lagOut, T + 0.56 + lagOut)); x0 = lerp(-sk - 40, W + sk + 40, u); x1 = W + sk + 40; }
      if (x1 - x0 < 1) continue;
      c.beginPath(); c.moveTo(x0 + sk, 0); c.lineTo(x1 + sk, 0); c.lineTo(x1, H); c.lineTo(x0, H); c.closePath(); c.fillStyle = cols[i]; c.fill();
    }
    const a = win(t, T - 0.14, T + 0.42, 0.14, 0.16);
    if (a > 0) {
      c.save(); c.globalAlpha = a; const dx = (t - T) * 60;
      const nw = this.tw('0' + (idx + 1), HF(300)), tw2 = this.tw(CHAPTERS[idx][1], HF(112)), x0 = (W - (nw + 50 + tw2)) / 2 + dx;
      this.txt('0' + (idx + 1), x0, 590, HF(300), RED, 'left');
      this.txt('CAPÍTULO', x0 + nw + 54, 470, MF(26, 700), GOLD, 'left', 6);
      this.txt(CHAPTERS[idx][1], x0 + nw + 50, 580, HF(112), WHITE, 'left');
      c.restore();
    }
  }

  // ------------------------------------------------------------------ HUD
  hud(t) {
    const c = this.x, cr = S('credits'), th = M('title_hit');
    let a = seg(t, M('wipe_in') + 0.5, M('wipe_in') + 1.1) * (1 - seg(t, cr + 0.5, cr + 1.1));
    a *= 1 - win(t, th - 0.1, S('problem') + 0.1, 0.1, 0.01);
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const tg = c.createLinearGradient(0, 0, 0, 230); tg.addColorStop(0, 'rgba(3,5,12,0.62)'); tg.addColorStop(1, 'rgba(3,5,12,0)'); c.fillStyle = tg; c.fillRect(0, 0, W, 230);
    // logo del colegio
    c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 24; c.shadowOffsetY = 6; this.rr(48, 40, 214, 132, 20); c.fillStyle = '#ffffff'; c.fill(); c.shadowColor = 'transparent';
    const lw = 184, lh = lw * this.logo.height / this.logo.width; c.drawImage(this.logo, 48 + 15, 40 + (132 - lh) / 2, lw, lh);
    c.fillStyle = RED; c.fillRect(280, 62, 4, 86);
    this.txt('EL SAQUE DE RECONCILIACIÓN', 300, 96, HF(38, 800), WHITE, 'left', 1);
    this.txt('PROYECTO INTERDISCIPLINAR · GRADO 10° · 2026', 300, 132, MF(17, 600), 'rgba(255,255,255,0.72)', 'left', 2);
    // capitulo
    let ci = 0; CHAPTERS.forEach(([sc], i) => { if (t >= S(sc)) ci = i; });
    const name = CHAPTERS[ci][1], nw = this.tw(name, HF(34, 800), 1.5), bw = nw + 118, bx = W - 48 - bw;
    this.rr(bx, 52, bw, 60, 30); c.fillStyle = 'rgba(7,11,24,0.78)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.5; c.stroke();
    this.rr(bx + 8, 60, 62, 44, 22); c.fillStyle = RED; c.fill();
    this.txt('0' + (ci + 1), bx + 39, 94, HF(34, 900), WHITE, 'center');
    this.txt(name, bx + 86, 94, HF(34, 800), WHITE, 'left', 1.5);
    for (let i = 0; i < 6; i++) {
      const [sc] = CHAPTERS[i], u = clamp((t - S(sc)) / (SE(sc) - S(sc)));
      const sx = W - 48 - 6 * 46 + i * 46; c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(sx, 126, 40, 4); c.fillStyle = i === ci ? GOLD : WHITE; c.fillRect(sx, 126, 40 * u, 4);
    }
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(0, H - 5, W, 5); c.fillStyle = RED; c.fillRect(0, H - 5, W * t / TL.dur, 5);
    c.restore();
  }

  // ------------------------------------------------------------------ SUBTITULOS
  _prepSub(cu) {
    const c = this.x, font = TF(41, 600), maxW = 1240;
    const words = cu.text.split(' ');
    c.save(); c.font = font; const sp = c.measureText(' ').width;
    const lines = [[]]; let lw = 0;
    const ws = words.map(w => c.measureText(w).width);
    words.forEach((w, i) => { if (lw + ws[i] > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(i); lw += ws[i] + sp; });
    if (lines.length === 2 && lines[1].length < 3 && lines[0].length > 4) { while (lines[1].length < lines[0].length - 1 && lines[0].length > 3) { const mv = lines[0].pop(); lines[1].unshift(mv); const w0 = lines[0].reduce((a, i) => a + ws[i] + sp, 0), w1 = lines[1].reduce((a, i) => a + ws[i] + sp, 0); if (w1 >= w0) break; } }
    c.restore();
    // tiempos por palabra
    let times;
    if (cu.words.length === words.length) times = cu.words.map(w => w[1]);
    else { const tot = words.reduce((a, w) => a + w.length + 1, 0); let acc = 0; times = words.map(w => { const tt = cu.t0 + (cu.t1 - cu.t0) * acc / tot; acc += w.length + 1; return tt; }); }
    return { cu, words, ws, sp, lines, times, font };
  }
  subtitles(t) {
    const c = this.x;
    for (const s of this.subs) {
      const cu = s.cu; if (t < cu.t0 - 0.18 || t > cu.t1 + 0.4) continue;
      const a = Math.min(seg(t, cu.t0 - 0.18, cu.t0 + 0.05), 1 - seg(t, cu.t1 + 0.15, cu.t1 + 0.4));
      const lh = 56, n = s.lines.length, widths = s.lines.map(l => l.reduce((q, i) => q + s.ws[i], 0) + s.sp * (l.length - 1));
      const bw = Math.max(...widths) + 76, bh = n * lh + 34, bx = (W - bw) / 2, by = 1012 - bh + (1 - eo(a)) * 18;
      const who = WHO[cu.who];
      c.save(); c.globalAlpha = a;
      this.rr(bx, by, bw, bh, 22); c.fillStyle = 'rgba(5,8,18,0.78)'; c.fill();
      c.fillStyle = who.c; this.rr(bx, by + 14, 6, bh - 28, 3); c.fill();
      // chip del hablante
      const cw = this.tw(who.n, MF(19, 800), 2.5) + 50;
      this.rr(bx + 4, by - 44, cw, 36, 18); c.fillStyle = 'rgba(5,8,18,0.86)'; c.fill();
      c.fillStyle = who.c; c.beginPath(); c.arc(bx + 24, by - 26, 6 + 2 * Math.abs(Math.sin(t * 9)), 0, 7); c.fill();
      this.txt(who.n, bx + 40, by - 19, MF(19, 800), who.c, 'left', 2.5);
      c.font = s.font; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      s.lines.forEach((l, li) => {
        let x = (W - widths[li]) / 2; const y = by + 17 + lh * (li + 1) - 14;
        for (const i of l) {
          const st = s.times[i], nx = i + 1 < s.times.length ? s.times[i + 1] : cu.t1;
          c.fillStyle = t < st - 0.03 ? 'rgba(255,255,255,0.46)' : (t < nx ? who.c : '#ffffff');
          c.fillText(s.words[i], x, y); x += s.ws[i] + s.sp;
        }
      });
      c.restore();
    }
  }
  shoutPops(t) {
    const c = this.x;
    for (const cu of this.shouts) {
      if (t < cu.t0 - 0.05 || t > cu.t1 + 0.55) continue;
      const p = this.head(cu.who, 0.42); if (!p.ok) continue;
      const u = t - cu.t0 + 0.05, s = spring(u, 14, 0.45) * (1 - ei(seg(t, cu.t1 + 0.3, cu.t1 + 0.55))), who = WHO[cu.who];
      const w = this.tw(cu.text, HF(58), 1) + 54;
      c.save(); c.translate(clamp(p.x - 70, w / 2 + 30, W - w / 2 - 30), Math.max(250, p.y - 40)); c.rotate(-0.06); c.scale(s, s);
      this.slab(-w / 2 - 10, -52, w, 78, who.c, 0.2); this.slab(-w / 2 - 4, -46, w - 12, 66, NAVY, 0.2);
      this.txt(cu.text, 0, 6, HF(58), WHITE, 'center', 1);
      c.fillStyle = who.c; c.beginPath(); c.moveTo(-14, 26); c.lineTo(14, 26); c.lineTo(0, 50); c.closePath(); c.fill();
      c.restore();
    }
  }

  // ------------------------------------------------------------------ TITULO
  titleCard(t) {
    const hit = M('title_hit'), end = S('problem'); if (t < hit - 0.14 || t > end + 0.02) return;
    const c = this.x, u1 = eo(seg(t, hit - 0.14, hit + 0.2)), u2 = eo(seg(t, hit - 0.02, hit + 0.34));
    c.save();
    c.fillStyle = GOLD; c.beginPath(); c.arc(W / 2, H / 2, u1 * 1250, 0, 7); c.fill();
    c.beginPath(); c.arc(W / 2, H / 2, u2 * 1250, 0, 7); c.clip();
    this.darkBG(t, 1);
    const z = 1 + seg(t, hit, end) * 0.035; c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    const tt = hit + 0.3;
    this.rise('PROYECTO DE INVESTIGACIÓN  ·  GRADO 10°  ·  2026', 280, 330, MF(25, 700), GOLD, t, tt, 0.5, 'left', 5);
    c.fillStyle = RED; c.fillRect(280, 352, eo(seg(t, tt + 0.1, tt + 0.7)) * 150, 6);
    this.chars('EL SAQUE DE', 276, 520, HF(168), WHITE, t, tt + 0.05, 0.032);
    const w2 = this.tw('RECONCILIACIÓN', HF(232)), bw = eo5(seg(t, tt + 0.3, tt + 0.9)) * (w2 + 110);
    c.save(); c.beginPath(); c.rect(240, 540, bw, 240); c.clip(); this.slab(236, 548, w2 + 80, 218, RED, 0.2); c.restore();
    this.chars('RECONCILIACIÓN', 290, 735, HF(232), WHITE, t, tt + 0.38, 0.03);
    const sa = seg(t, tt + 1.0, tt + 1.5);
    this.txt('¿EN LA CANCHA JUGAMOS TODOS?', 290, 860, TF(36, 700), WHITE, 'left', 7, sa);
    c.fillStyle = rgba(GOLD, sa); c.fillRect(290, 884, sa * 640, 3);
    // balon rebotando
    const bt = t - tt - 0.6; if (bt > 0) { const bx = lerp(W + 100, 1210, eo(seg(bt, 0, 1.2))), by = 446 - Math.abs(Math.sin(bt * 4.2)) * 230 * Math.exp(-bt * 0.7); this.ballIcon(bx, by, 74, bt * 3); }
    c.restore();
  }
  ballIcon(x, y, r, rot) {
    const c = this.x; c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = GOLD; c.fill(); c.clip();
    c.strokeStyle = '#1747c0'; c.lineWidth = r * 0.34; c.beginPath(); c.arc(-r * 0.9, -r * 0.2, r * 1.1, -0.9, 0.9); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = r * 0.26; c.beginPath(); c.arc(r * 1.1, r * 0.5, r * 1.2, 2.3, 4.0); c.stroke();
    c.restore(); c.save(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); c.restore();
  }
  darkBG(t, a = 1, c = this.x, ww = W, hh = H) {
    c.save(); c.globalAlpha *= a;
    const g = c.createLinearGradient(0, 0, ww, hh); g.addColorStop(0, '#0b1530'); g.addColorStop(0.55, NAVY); g.addColorStop(1, '#12060c'); c.fillStyle = g; c.fillRect(0, 0, ww, hh);
    c.strokeStyle = 'rgba(255,255,255,0.045)'; c.lineWidth = 1.5; const o = (t * 26) % 64;
    c.beginPath(); for (let x = -hh; x < ww + 64; x += 64) { c.moveTo(x + o, hh); c.lineTo(x + o + hh * 0.5, 0); } c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 3; c.beginPath(); c.arc(ww * 0.82, hh * 0.3, hh * (0.42 + 0.02 * Math.sin(t * 0.8)), 0, 7); c.stroke();
    c.beginPath(); c.arc(ww * 0.82, hh * 0.3, hh * 0.3, 0, 7); c.stroke();
    c.restore();
  }

  // ------------------------------------------------------------------ GRAFICOS POR ESCENA (sobre el 3D)
  sceneGraphics(t) {
    if (t >= S('intro') - 1 && t < S('problem')) this.gIntro(t);
    else if (t < S('history')) this.gProblem(t);
    else if (t < S('rule')) this.gHistory3D(t);
    else if (t < S('play')) this.gRule(t);
    else if (t < S('hope')) this.gPlay(t);
    else this.gHope(t);
  }

  tag(p, dx, dy, badge, title, sub, color, a, t0, t) {
    // etiqueta anclada a un punto 3D con linea guia
    const c = this.x; if (!p.ok || a <= 0) return;
    const u = eo(seg(t, t0, t0 + 0.45)) * a, tw = Math.max(this.tw(title, HF(40, 800), 1), this.tw(sub, MF(17, 600), 1.5)) + (badge ? 104 : 40), bx = dx === 0 ? p.x - tw / 2 : p.x + dx - (dx < 0 ? tw : 0), by = p.y + dy;
    c.save(); c.globalAlpha = a;
    const ex = p.x + dx, ey = dx === 0 ? by + 82 : by + 40;
    c.strokeStyle = color; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(lerp(p.x, ex, u), lerp(p.y, ey, u)); c.stroke();
    c.fillStyle = color; c.beginPath(); c.arc(p.x, p.y, 6, 0, 7); c.fill();
    c.beginPath(); c.rect(bx - 4, by - 6, (tw + 8) * u, 96); c.clip();
    this.rr(bx, by, tw, 82, 14); c.fillStyle = 'rgba(7,11,24,0.86)'; c.fill(); c.fillStyle = color; c.fillRect(bx, by + 12, 5, 58);
    let tx = bx + 22;
    if (badge) { this.rr(bx + 16, by + 14, 64, 54, 10); c.fillStyle = color; c.fill(); this.txt(badge, bx + 48, by + 55, HF(38, 900), NAVY, 'center'); tx = bx + 94; }
    this.txt(title, tx, by + 42, HF(40, 800), WHITE, 'left', 1); this.txt(sub, tx, by + 67, MF(17, 600), color, 'left', 1.5);
    c.restore();
  }

  gIntro(t) {
    const i2 = C('i2').t0, out = 1 - seg(t, i2 - 0.45, i2 - 0.15);
    const T = [['sofia', 'i1_sofia', '#4', 'SOFÍA LARA MORA', 'CAPITANA · COORDINACIÓN', GOLD, 0, -230], ['juan', 'i1_juan', '#7', 'JUAN DIEGO NÚÑEZ', 'ATACANTE · BIOMECÁNICA', '#ff5a6a', -30, -130], ['martin', 'i1_martin', '#10', 'MARTÍN QUIÑONES', 'ARMADOR · ESTRATEGIA', CYAN, 40, -120]];
    for (const [id, mk, b, n, r, col, dx, dy] of T) { const t0 = M(mk) - 0.1; if (t > t0) this.tag(this.head(id, 0.2), dx, dy, b, n, r, col, out, t0, t); }
  }

  dimLine(a, b, label, sub, color, u, side = 1) {
    // cota tecnica entre dos puntos proyectados
    const c = this.x; if (!a.ok || !b.ok || u <= 0) return;
    const ex = lerp(a.x, b.x, u), ey = lerp(a.y, b.y, u), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    c.save(); c.strokeStyle = color; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(ex, ey); c.stroke();
    for (const [px, py] of [[a.x, a.y], [ex, ey]]) { c.beginPath(); c.moveTo(px - nx * 16, py - ny * 16); c.lineTo(px + nx * 16, py + ny * 16); c.stroke(); }
    const mx = (a.x + ex) / 2 + nx * 34 * side, my = (a.y + ey) / 2 + ny * 34 * side;
    const al = side * nx >= 0 ? 'left' : 'right';
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 14;
    this.txt(label, mx, my + 14, HF(84), color, al, 1); c.shadowBlur = 8;
    if (sub) this.txt(sub, mx, my + 46, MF(18, 700), WHITE, al, 2);
    c.restore();
  }

  panelHeader(x, y, t, t0, sub) {
    this.rise('ENCUESTA  ·  «¿EN LA CANCHA JUGAMOS TODOS?»', x, y, MF(21, 800), GOLD, t, t0, 0.5, 'left', 2.5);
    this.rise(sub, x, y + 34, MF(17, 600), 'rgba(255,255,255,0.7)', t, t0 + 0.1, 0.5, 'left', 2);
  }
  iconGrid(x, y, cols, size, gap, t, tPop, tMark, nMark, color) {
    for (let i = 0; i < 73; i++) {
      const cx = x + (i % cols) * gap + size / 2, cy = y + Math.floor(i / cols) * (size * 1.22);
      const u = back(seg(t, tPop + i * 0.011, tPop + i * 0.011 + 0.3)); if (u <= 0) continue;
      const m = seg(t, tMark + i * 0.016, tMark + i * 0.016 + 0.25), on = i < nMark;
      const c = this.x; c.save(); c.translate(cx, cy + size / 2); c.scale(u * (on ? 1 + 0.12 * Math.sin(m * Math.PI) : 1), u); c.translate(0, -size / 2);
      c.globalAlpha *= on ? 1 : lerp(1, 0.4, seg(t, tMark, tMark + 0.6));
      this.person(0, 0, size, on && m > 0 ? color : 'rgba(255,255,255,0.86)'); c.restore();
    }
  }

  gProblem(t) {
    const c = this.x, st = this.s3.story;
    // cota de la red tradicional
    const red = M('p1_red'), gan = M('p1_gana');
    let a = win(t, red - 0.1, gan - 0.1, 0.01, 0.25);
    if (a > 0) { c.save(); c.globalAlpha = a; const u = eo(seg(t, red - 0.1, red + 0.6)); this.dimLine(this.P([2.5, 0, 0.04]), this.P([2.5, 2.43, 0.04]), num(2.43 * u, 2) + ' m', 'ALTURA DE LA RED · VOLEIBOL TRADICIONAL', GOLD, u, -1); c.restore(); }
    // impacto del remate
    for (const mk of ['hit1', 'hit2']) this.burst(t, M(mk), st.nodes.find(n => n.t === M(mk)).pIn, 0.8);
    // pase negado
    const X0 = B('exclusion'), ign = M('ignore'), sad = M('sad');
    a = win(t, M('ask') - 0.1, sad + 0.3, 0.3, 0.12);
    if (a > 0) {
      const A = st.actors, s = A.sofia.headW, m = A.martin.headW, pa = this.P([s.x + 0.3, s.y - 0.25, s.z]), pb = this.P([m.x - 0.3, m.y - 0.25, m.z]);
      if (pa.ok && pb.ok) {
        c.save(); c.globalAlpha = a; const neg = seg(t, ign - 0.1, ign + 0.15);
        c.strokeStyle = neg > 0 ? rgba(RED, 0.95) : rgba(WHITE, 0.9); c.lineWidth = 5; c.setLineDash([16, 14]); c.lineDashOffset = -t * 90 * (1 - neg);
        const mx = (pa.x + pb.x) / 2, my = Math.min(pa.y, pb.y) - 90; c.beginPath(); c.moveTo(pa.x, pa.y); c.quadraticCurveTo(mx, my, pb.x, pb.y); c.stroke(); c.setLineDash([]);
        if (neg > 0) {
          const s2 = spring(t - ign + 0.1, 13, 0.45), cy = (pa.y + pb.y) / 2 * 0.5 + my * 0.5;
          c.translate(mx, cy); c.scale(s2, s2); c.fillStyle = RED; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill();
          c.strokeStyle = WHITE; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-15, -15); c.lineTo(15, 15); c.moveTo(15, -15); c.lineTo(-15, 15); c.stroke();
          this.txt('PASE NEGADO', 0, 78, MF(22, 800), WHITE, 'center', 4);
        }
        c.restore();
      }
    }
    // panel 47,9 %
    const p3 = C('p3'), p4 = C('p4'), p5 = C('p5'), p6 = C('p6');
    let k = win(t, p3.t0 + 0.1, p4.t0 - 0.1, 0.5, 0.3);
    if (k > 0) {
      const px = 820 + (1 - eo(k)) * 200, py = 170, pw = 1030, ph = 690;
      c.save(); c.globalAlpha = seg(k, 0, 0.6); this.glass(px, py, pw, ph, 30);
      this.panelHeader(px + 54, py + 66, t, p3.t0 + 0.4, '73 ESTUDIANTES  ·  COLEGIO SAN BONIFACIO DE LAS LANZAS  ·  2026');
      this.iconGrid(px + 54, py + 136, 19, 42, 49, t, M('p3_73') - 0.1, M('p3_pct'), 35, RED);
      const pc = M('p3_pct'), u = eo(seg(t, pc, pc + 1.1));
      if (t > pc - 0.05) {
        this.txt(num(47.9 * u, 1), px + 54, py + 560, HF(250), RED, 'left'); const nw = this.tw(num(47.9 * u, 1), HF(250));
        this.txt('%', px + 66 + nw, py + 560, HF(130), RED);
        this.rise('SE HA SENTIDO EXCLUIDO', px + 590, py + 470, HF(62, 800), WHITE, t, M('p3_excl') - 0.5, 0.5);
        this.rise('en el voleibol, por no tener', px + 592, py + 520, TF(28, 500), 'rgba(255,255,255,0.78)', t, M('p3_excl') - 0.35, 0.5);
        this.rise('un nivel técnico alto.', px + 592, py + 558, TF(28, 500), 'rgba(255,255,255,0.78)', t, M('p3_excl') - 0.25, 0.5);
      }
      c.fillStyle = RED; c.fillRect(px + 54, py + 610, eo(seg(t, pc + 0.3, pc + 1.3)) * (pw - 108) * 0.479, 10); c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(px + 54, py + 610, pw - 108, 10);
      c.fillStyle = RED; c.fillRect(px + 54, py + 610, eo(seg(t, pc + 0.3, pc + 1.3)) * (pw - 108) * 0.479, 10);
      this.txt('35 de 73 estudiantes', px + 54, py + 652, MF(18, 600), 'rgba(255,255,255,0.7)', 'left', 1.5, seg(t, pc + 1.0, pc + 1.4));
      c.restore();
    }
    // panel 68,5 %
    k = win(t, p4.t0 - 0.05, p5.t0 - 0.1, 0.5, 0.3);
    if (k > 0) {
      const pw = 1030, ph = 690, px = 70 - (1 - eo(k)) * 200, py = 170, pc = M('p4_pct'), u = eo(seg(t, pc, pc + 1.1));
      c.save(); c.globalAlpha = seg(k, 0, 0.6); this.glass(px, py, pw, ph, 30);
      this.panelHeader(px + 54, py + 66, t, p4.t0 + 0.2, '¿CÓMO SE FORMAN LOS EQUIPOS EN EDUCACIÓN FÍSICA?');
      const cx = px + 250, cy = py + 370, r = 165;
      c.lineWidth = 50; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
      c.strokeStyle = GOLD; c.lineCap = 'butt'; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.685 * u); c.stroke();
      this.txt(num(68.5 * u, 1), cx + 6, cy + 30, HF(118), WHITE, 'center'); this.txt('%', cx, cy + 84, HF(54), GOLD, 'center');
      this.rise('DICE QUE LOS EQUIPOS', px + 490, py + 290, HF(60, 800), WHITE, t, pc + 0.5, 0.5);
      this.rise('SE ARMAN CON', px + 490, py + 356, HF(60, 800), WHITE, t, pc + 0.62, 0.5);
      const sw = eo5(seg(t, pc + 0.85, pc + 1.35)); if (sw > 0) { c.save(); c.beginPath(); c.rect(px + 480, py + 380, 470 * sw, 100); c.clip(); this.slab(px + 480, py + 384, 440, 86, GOLD, 0.2); this.txt('«LOS MEJORES»', px + 510, py + 452, HF(72), NAVY); c.restore(); }
      for (let i = 0; i < 73; i++) { const q = back(seg(t, pc + 0.9 + i * 0.008, pc + 1.2 + i * 0.008)); if (q > 0) { c.save(); c.translate(px + 498 + (i % 25) * 19, py + 510 + Math.floor(i / 25) * 34); c.scale(q, q); this.person(0, 0, 24, i < 50 ? GOLD : 'rgba(255,255,255,0.35)'); c.restore(); } }
      this.txt('50 de 73 estudiantes', px + 54, py + 652, MF(18, 600), 'rgba(255,255,255,0.7)', 'left', 1.5, seg(t, pc + 1.2, pc + 1.6));
      c.restore();
    }
    // quejas (burbujas)
    const Q = [[M('p5_q1'), 90, 215, 640, '«Que me griten por', 'hacer las cosas mal»', 1], [M('p5_q2'), 1230, 250, 600, '«Que no me pasen', 'el balón»', -1]];
    for (const [t0, bx, by, bw, l1, l2, dir] of Q) {
      const o = win(t, t0, p6.t0 - 0.1, 0.01, 0.3); if (o <= 0) continue;
      const s = spring(t - t0, 12, 0.5);
      c.save(); c.globalAlpha = o; c.translate(bx + bw / 2, by + 110); c.scale(s, s); c.rotate(dir * -0.025); c.translate(-bw / 2, -110);
      this.rr(0, 0, bw, 220, 34); c.fillStyle = 'rgba(248,249,252,0.97)'; c.fill();
      c.beginPath(); const tx = dir > 0 ? bw - 90 : 90; c.moveTo(tx - 28, 216); c.lineTo(tx + 28, 216); c.lineTo(tx + dir * 46, 268); c.closePath(); c.fill();
      this.txt('“', 28, 104, HF(150, 900, false), RED);
      const n1 = Math.floor(seg(t, t0 + 0.15, t0 + 0.75) * l1.length), n2 = Math.floor(seg(t, t0 + 0.75, t0 + 1.3) * l2.length);
      this.txt(l1.slice(0, n1), 96, 92, TF(46, 800, true), '#141a2c'); this.txt(l2.slice(0, n2), 96, 150, TF(46, 800, true), '#141a2c');
      this.txt('RESPUESTA ABIERTA · ENCUESTA SBL', 98, 194, MF(16, 700), RED, 'left', 2);
      c.restore();
    }
    // tipografia cinetica p6
    if (t > p6.t0 - 0.05) {
      const no = M('p6_no'), ex = M('p6_excluir'), o = 1 - seg(t, S('history') - 0.5, S('history') - 0.2);
      c.save(); c.globalAlpha = o; c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 24;
      const w1 = this.tw('ESO NO ES ', HF(120));
      c.shadowColor = 'transparent';
      const bw = eo5(seg(t, p6.t0 - 0.05, p6.t0 + 0.4)); c.save(); c.beginPath(); c.rect(470, 200, 1000 * bw, 150); c.clip(); this.slab(480, 206, 930, 132, 'rgba(7,11,24,0.92)', 0.2); c.restore();
      this.rise('ESO NO ES', 530, 312, HF(120), WHITE, t, p6.t0, 0.4);
      this.rise('COMPETIR', 530 + w1, 312, HF(120), WHITE, t, no - 0.1, 0.4);
      const sw = eo5(seg(t, no + 0.45, no + 0.8)); c.fillStyle = RED; c.fillRect(530 + w1 - 10, 266, (this.tw('COMPETIR', HF(120)) + 24) * sw, 12);
      const s = spring(t - ex + 0.05, 12, 0.42);
      if (t > ex - 0.05) { c.translate(960, 450); c.scale(s, s); this.slab(-360, -74, 700, 136, RED, 0.2); this.txt('ESO ES EXCLUIR.', -4, 40, HF(132), WHITE, 'center'); }
      c.restore();
    }
  }

  burst(t, t0, p, size = 1) {
    const u = (t - t0) / 0.32; if (u < 0 || u > 1) return;
    const q = this.P(p); if (!q.ok) return; const c = this.x;
    c.save(); c.translate(q.x, q.y); c.strokeStyle = WHITE; c.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + 0.3, r0 = (30 + eo(u) * 130) * size, r1 = (60 + eo(u) * 230) * size; c.globalAlpha = (1 - u) * 0.95; c.lineWidth = (i % 2 ? 9 : 5) * (1 - u); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
    c.restore();
    if (u < 0.22) { c.fillStyle = `rgba(255,255,255,${0.35 * (1 - u / 0.22)})`; c.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------------ HISTORIA
  gHistory3D(t) {
    const c = this.x, h4 = C('h4'), h5 = C('h5'), pr = M('h4_premio');
    const k = win(t, pr - 0.25, h5.t0 - 0.2, 0.5, 0.25);
    if (k > 0) {
      const px = 1110 + (1 - eo(k)) * 200, py = 220, pw = 740, ph = 600;
      c.save(); c.globalAlpha = seg(k, 0, 0.6); this.glass(px, py, pw, ph, 30);
      const cx = px + pw / 2;
      // laurel
      c.strokeStyle = GOLD; c.fillStyle = GOLD; c.lineWidth = 5;
      for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
        const u = back(seg(t, pr + i * 0.05, pr + 0.35 + i * 0.05)); if (u <= 0) continue;
        const a = Math.PI / 2 + s * (0.35 + i * 0.24), r = 118, lx = cx + Math.cos(a) * r, ly = py + 190 + Math.sin(a) * r;
        c.save(); c.translate(lx, ly); c.rotate(a + s * 1.1); c.scale(u, u); c.beginPath(); c.ellipse(0, 0, 27, 10, 0, 0, 7); c.fill(); c.restore();
      }
      this.txt('2016', cx, py + 208, HF(86), WHITE, 'center', 0, seg(t, pr + 0.2, pr + 0.6));
      this.rise('PREMIO', cx, py + 372, MF(24, 800), GOLD, t, pr + 0.1, 0.5, 'center', 10);
      this.rise('PEACE AND SPORT', cx, py + 452, HF(92), WHITE, t, pr + 0.25, 0.5, 'center', 1);
      c.fillStyle = RED; const lw = eo(seg(t, pr + 0.5, pr + 1.1)) * 420; c.fillRect(cx - lw / 2, py + 474, lw, 5);
      const q = '«El perdón también se entrena»', pe = M('h4_perdon'), n = Math.floor(seg(t, pe - 0.2, pe + 1.3) * q.length);
      this.txt(q.slice(0, n), cx - this.tw(q, TF(36, 700, true)) / 2, py + 544, TF(36, 700, true), WHITE);
      c.restore();
    }
  }

  flag(x, y, w, h, which, u) {
    const c = this.x; c.save(); c.translate(x + w / 2, y + h / 2); c.scale(u, u); c.translate(-w / 2, -h / 2);
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 40; c.shadowOffsetY = 14; this.rr(0, 0, w, h, 18); c.fillStyle = '#000'; c.fill(); c.shadowColor = 'transparent';
    this.rr(0, 0, w, h, 18); c.clip();
    if (which === 'rw') { c.fillStyle = '#00a1de'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#fad201'; c.fillRect(0, h / 2, w, h / 4); c.fillStyle = '#20603d'; c.fillRect(0, h * 0.75, w, h / 4);
      c.fillStyle = '#e5be01'; c.beginPath(); for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, r = i % 2 ? h * 0.085 : h * 0.17; c.lineTo(w * 0.8 + Math.cos(a) * r, h * 0.25 + Math.sin(a) * r); } c.closePath(); c.fill(); c.beginPath(); c.arc(w * 0.8, h * 0.25, h * 0.065, 0, 7); c.fillStyle = '#fad201'; c.fill(); }
    else { c.fillStyle = '#fcd116'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#003893'; c.fillRect(0, h / 2, w, h / 4); c.fillStyle = '#ce1126'; c.fillRect(0, h * 0.75, w, h / 4); }
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.restore();
  }
  courtTop(x, y, w, h, a = 1) {
    const c = this.x; c.save(); c.globalAlpha *= a; c.fillStyle = 'rgba(28,82,200,0.35)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 4; c.strokeRect(x, y, w, h);
    c.beginPath(); c.moveTo(x + w / 2, y - 22); c.lineTo(x + w / 2, y + h + 22); c.lineWidth = 7; c.stroke();
    c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(x + w * 0.3, y); c.lineTo(x + w * 0.3, y + h); c.moveTo(x + w * 0.7, y); c.lineTo(x + w * 0.7, y + h); c.stroke(); c.restore();
  }

  // contenido de pantalla completa (y de la pantalla LED del coliseo)
  historyArt(t) {
    const c = this.x, h1 = C('h1'), h2 = C('h2');
    this.darkBG(t, 1);
    // cabecera de archivo
    c.fillStyle = RED; c.beginPath(); c.arc(96, 236, 9 + 2 * Math.sin(t * 6), 0, 7); c.fill();
    this.txt('ARCHIVO  ·  DEPORTE Y RECONCILIACIÓN', 122, 244, MF(22, 700), 'rgba(255,255,255,0.8)', 'left', 4);
    const y16 = M('h1_2016'), ru = M('h1_ruanda'), co = M('h1_colombia'), se = M('h1_sentado'), ex = M('h2_ex'), vi = M('h2_vic'), en = M('h2_enemigos');
    if (t < h2.t0 - 0.15) {
      const o = 1 - seg(t, h2.t0 - 0.5, h2.t0 - 0.15);
      c.save(); c.globalAlpha = o;
      // 2016
      const mv = eio(seg(t, ru - 0.6, ru - 0.05)), yr = Math.round(lerp(1996, 2016, eo(seg(t, y16 - 0.25, y16 + 0.75))));
      const fs = lerp(430, 130, mv), fx = lerp(W / 2, 300, mv), fy = lerp(640, 372, mv);
      c.save(); c.font = HF(fs); c.textAlign = 'center'; c.lineWidth = lerp(5, 3, mv); c.strokeStyle = GOLD; c.globalAlpha *= seg(t, S('history'), S('history') + 0.6); c.strokeText(String(yr), fx, fy);
      if (mv > 0.5) { c.fillStyle = rgba(GOLD, (mv - 0.5) * 2); c.fillText(String(yr), fx, fy); } c.restore();
      if (t < ru - 0.3) this.rise('UN PARTIDO CAMBIÓ LA HISTORIA', W / 2, 790, HF(64, 800), WHITE, t, y16 + 1.0, 0.5, 'center', 3);
      // banderas
      const u1 = back(seg(t, ru - 0.15, ru + 0.4), 1.2), u2 = back(seg(t, co - 0.15, co + 0.4), 1.2);
      if (u1 > 0) { this.flag(330 - (1 - u1) * 300, 425, 470, 290, 'rw', 0.6 + 0.4 * u1); this.rise('RUANDA', 565, 808, HF(84), WHITE, t, ru + 0.1, 0.4, 'center', 2); }
      if (u2 > 0) { this.flag(1120 + (1 - u2) * 300, 425, 470, 290, 'co', 0.6 + 0.4 * u2); this.rise('COLOMBIA', 1355, 808, HF(84), WHITE, t, co + 0.1, 0.4, 'center', 2); }
      const vs = spring(t - co - 0.2, 12, 0.45); if (t > co + 0.2) { c.save(); c.translate(960, 570); c.scale(vs, vs); c.fillStyle = WHITE; c.beginPath(); c.arc(0, 0, 66, 0, 7); c.fill(); this.txt('VS', -2, 26, HF(76), RED, 'center'); c.restore(); }
      // rotulo
      const sw = eo5(seg(t, se - 0.1, se + 0.5)); if (sw > 0) { c.save(); c.beginPath(); c.rect(600, 216, 1240 * sw, 190); c.clip(); this.slab(620, 226, 760, 96, RED, 0.2); this.txt('VOLEIBOL SENTADO', 666, 302, HF(88), WHITE, 'left', 2); this.txt('«EL PARTIDO DE LA HISTORIA»  ·  RUANDA – COLOMBIA', 628, 372, MF(24, 700), GOLD, 'left', 3); c.restore(); }
      c.restore();
    }
    if (t > h2.t0 - 0.3) {
      const o = seg(t, h2.t0 - 0.3, h2.t0 + 0.1); c.save(); c.globalAlpha = o;
      const cx0 = 480, cy0 = 370, cw = 960, chh = 440;
      this.courtTop(cx0, cy0, cw, chh, 1);
      this.rise('EN LA MISMA CANCHA', 122, 330, HF(92), WHITE, t, h2.t0, 0.5, 'left', 1);
      const mix = eio(seg(t, en + 0.2, en + 0.9));
      const A = [], Bq = [];
      for (let i = 0; i < 6; i++) {
        const col = i % 2, row = Math.floor(i / 2), sx = 110 + col * 150, sy = 420 + row * 140;
        const hx = cx0 + cw * (0.12 + col * 0.2), hy = cy0 + chh * (0.2 + row * 0.3);
        const mixSide = i % 2 === 0;                           // la mitad cruza al otro lado: equipos mezclados
        A.push({ fx: sx, fy: sy, tx: mixSide ? hx : cx0 + cw - (hx - cx0), ty: hy, c: '#ff5a6a', t0: ex + i * 0.06 });
        Bq.push({ fx: W - sx, fy: sy, tx: mixSide ? cx0 + cw - (hx - cx0) + 0 : hx, ty: hy + (mixSide ? 0 : 0), c: '#c9ced8', t0: vi + i * 0.06 });
      }
      // posiciones finales: 3 rojos + 3 grises por lado
      const pts = [...A, ...Bq].map((d, i) => { const u = back(seg(t, d.t0, d.t0 + 0.35)); const jx = (i >= 6 ? 34 : -34) * mix; return { x: lerp(d.fx, d.tx + jx, mix), y: lerp(d.fy, d.ty + (i >= 6 ? 30 : -30) * mix, mix), u, c: d.c }; });
      if (mix > 0.6) { c.save(); c.globalAlpha *= (mix - 0.6) / 0.4 * 0.7; c.strokeStyle = GOLD; c.lineWidth = 3; for (const side of [0, 1]) { const g = pts.filter(p => (p.x < cx0 + cw / 2) === (side === 0)); c.beginPath(); g.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke(); } c.restore(); }
      for (const p of pts) { if (p.u <= 0) continue; c.save(); c.translate(p.x, p.y); c.scale(p.u, p.u); c.fillStyle = p.c; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 3; c.stroke(); c.restore(); }
      const la = 1 - seg(t, en + 0.2, en + 0.9);
      this.txt('EXCOMBATIENTES', 185, 800, MF(24, 800), '#ff5a6a', 'center', 3, seg(t, ex, ex + 0.3) * la);
      this.txt('VÍCTIMAS DE LA GUERRA', W - 200, 800, MF(24, 800), '#c9ced8', 'center', 3, seg(t, vi, vi + 0.3) * la);
      const s = spring(t - en, 11, 0.45); if (t > en) { c.save(); c.translate(1370, 300); c.scale(s, s); this.slab(-490, -70, 960, 108, GOLD, 0.2); this.txt('ANTIGUOS ENEMIGOS  →  UN EQUIPO', -6, 14, HF(76), NAVY, 'center'); c.restore(); }
      c.restore();
    }
  }
  sarajevoArt(t) {
    const c = this.x, sa = M('h5_sarajevo'), ni = M('h5_ningun'), t0 = C('h5').t0;
    this.darkBG(t + 40, 1);
    this.txt('CAMPEONATO MUNDIAL DE VOLEIBOL SENTADO', 122, 250, MF(24, 700), GOLD, 'left', 4, seg(t, t0 - 0.1, t0 + 0.3));
    this.chars('SARAJEVO', 116, 420, HF(178), WHITE, t, sa - 0.25, 0.03);
    this.chars('2022', 122, 574, HF(178), RED, t, sa + 0.1, 0.04);
    c.fillStyle = WHITE; c.fillRect(124, 606, eo(seg(t, sa + 0.3, sa + 0.9)) * 560, 5);
    this.txt('WORLD PARAVOLLEY', 124, 650, MF(22, 700), 'rgba(255,255,255,0.7)', 'left', 5, seg(t, sa + 0.5, sa + 0.9));
    // pizarra tactica
    const cx0 = 960, cy0 = 240, cw = 860, chh = 420, a = seg(t, t0, t0 + 0.4);
    this.courtTop(cx0, cy0, cw, chh, a);
    const home = [[0.12, 0.25], [0.12, 0.75], [0.26, 0.5], [0.4, 0.2], [0.42, 0.5], [0.4, 0.8]], away = home.map(([x, y]) => [1 - x, y]);
    const seq = [[away[2], 0], [home[2], 0.7], [home[4], 1.25], [home[3], 1.8], [[0.72, 0.62], 2.25]];
    const st = t - t0 - 0.5;
    c.save(); c.globalAlpha = a;
    home.forEach(([x, y], i) => { c.strokeStyle = rgba(GOLD, 0.28 + 0.12 * Math.sin(t * 3 + i)); c.lineWidth = 2; c.beginPath(); c.arc(cx0 + x * cw, cy0 + y * chh, 74 + 6 * Math.sin(t * 2 + i), 0, 7); c.stroke(); });
    for (let i = 1; i < seq.length; i++) { const u = seg(st, seq[i - 1][1], seq[i][1]); if (u <= 0) continue; const [a0] = seq[i - 1], [b0] = seq[i]; c.strokeStyle = WHITE; c.lineWidth = 4; c.setLineDash([12, 9]); c.beginPath(); c.moveTo(cx0 + a0[0] * cw, cy0 + a0[1] * chh); c.lineTo(cx0 + lerp(a0[0], b0[0], u) * cw, cy0 + lerp(a0[1], b0[1], u) * chh); c.stroke(); c.setLineDash([]); }
    home.forEach(([x, y]) => { c.fillStyle = GOLD; c.beginPath(); c.arc(cx0 + x * cw, cy0 + y * chh, 24, 0, 7); c.fill(); });
    away.forEach(([x, y]) => { c.fillStyle = CYAN; c.beginPath(); c.arc(cx0 + x * cw, cy0 + y * chh, 24, 0, 7); c.fill(); });
    let bi = 0; for (let i = 1; i < seq.length; i++) if (st >= seq[i - 1][1]) bi = i;
    const u = seg(st, seq[bi - 1] ? seq[bi - 1][1] : 0, seq[bi][1]), pa = seq[Math.max(0, bi - 1)][0], pb = seq[bi][0];
    if (st > 0) { c.fillStyle = WHITE; c.beginPath(); c.arc(cx0 + lerp(pa[0], pb[0], u) * cw, cy0 + lerp(pa[1], pb[1], u) * chh - Math.sin(u * Math.PI) * 26, 13, 0, 7); c.fill(); }
    ['1', '2', '3'].forEach((n, i) => { const q = seq[i + 1], s = spring(st - q[1], 13, 0.5); if (st > q[1]) { c.save(); c.translate(cx0 + q[0][0] * cw, cy0 + q[0][1] * chh - 50); c.scale(s, s); c.fillStyle = RED; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill(); this.txt(n, 0, 12, HF(34, 900, false), WHITE, 'center'); c.restore(); } });
    c.restore();
    const sw = eo5(seg(t, ni - 0.15, ni + 0.45)); if (sw > 0) { c.save(); c.beginPath(); c.rect(80, 700, 1800 * sw, 180); c.clip(); this.slab(100, 716, 1420, 118, RED, 0.2); this.txt('NINGÚN EQUIPO GANA SIN COOPERAR', 150, 808, HF(106), WHITE, 'left', 1); c.restore(); }
  }
  fullscreen(t) {
    const c = this.x, z = M('zoom'), h3 = C('h3').t0, h5 = C('h5').t0, h6 = C('h6').t0;
    let a = Math.min(seg(t, z + 0.22, z + 0.5), 1 - seg(t, h3 - 0.4, h3 - 0.15));
    if (a > 0) {
      c.save(); c.globalAlpha = a; const s = lerp(0.82, 1, eo(seg(t, z + 0.22, z + 0.75))); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2);
      if (s < 0.999) { c.fillStyle = NAVY; c.fillRect(-300, -300, W + 600, H + 600); }
      this.historyArt(t); c.restore();
      const fl = win(t, z + 0.18, z + 0.55, 0.12, 0.25); if (fl > 0) { c.fillStyle = `rgba(255,255,255,${fl * 0.55})`; c.fillRect(0, 0, W, H); }
    }
    a = Math.min(seg(t, h5 - 0.22, h5 + 0.05), 1 - seg(t, h6 - 0.4, h6 - 0.12));
    if (a > 0) { c.save(); c.globalAlpha = a; this.sarajevoArt(t); c.restore(); }
  }

  // ------------------------------------------------------------------ LA REGLA
  gRule(t) {
    const c = this.x, st = this.s3.story, A = st.actors, r3 = C('r3'), r4 = C('r4'), r5 = C('r5'), r6 = C('r6');
    const pel = st.sitT.martin;
    let a = win(t, pel - 0.05, r3.t0 - 0.3, 0.01, 0.25);
    if (a > 0) {
      const hp = A.martin.hipPos(), p = this.P([hp.x + 0.12, 0.2, hp.z + 0.2]);
      if (p.ok) {
        const u = eo(seg(t, pel, pel + 0.45)), bx = Math.min(p.x + 190, W - 720), by = Math.max(230, Math.min(p.y - 250, 640));
        c.save(); c.globalAlpha = a;
        c.strokeStyle = GREEN; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(lerp(p.x, bx, u), lerp(p.y, by + 130, u)); c.stroke();
        c.beginPath(); c.arc(p.x, p.y, 10 + 14 * ((t * 1.4) % 1), 0, 7); c.globalAlpha = a * (1 - (t * 1.4) % 1); c.stroke(); c.globalAlpha = a;
        c.fillStyle = GREEN; c.beginPath(); c.arc(p.x, p.y, 8, 0, 7); c.fill();
        c.beginPath(); c.rect(bx - 6, by - 6, 700 * u, 160); c.clip();
        this.rr(bx, by, 660, 140, 18); c.fillStyle = 'rgba(7,11,24,0.88)'; c.fill(); c.fillStyle = GREEN; c.fillRect(bx, by + 16, 6, 108);
        this.rr(bx + 26, by + 18, 150, 34, 8); c.fillStyle = GREEN; c.fill(); this.txt('REGLA Nº 1', bx + 101, by + 43, MF(20, 800), NAVY, 'center', 2);
        this.txt('PELVIS EN CONTACTO CON EL SUELO', bx + 26, by + 98, HF(48, 800), WHITE, 'left', 0.5);
        this.txt('REGLAMENTO OFICIAL · WORLD PARAVOLLEY', bx + 26, by + 124, MF(16, 600), 'rgba(255,255,255,0.7)', 'left', 2);
        c.restore();
      }
    }
    // la red baja
    const red = M('r3_red'), can = M('r3_cancha');
    a = win(t, r3.t0 - 0.1, can - 0.1, 0.3, 0.01);
    if (a > 0) {
      c.save(); c.globalAlpha = a; const X = 1.9;
      const g0 = this.P([X + 0.5, 2.43, 0.03]), g1 = this.P([X - 0.5, 2.43, 0.03]);
      if (st.netH < 2.4 && g0.ok && g1.ok) { this.line(g0, g1, 'rgba(255,255,255,0.75)', 3, 1, [10, 10]); this.txt('2,43 m · TRADICIONAL', g1.x - 16, g1.y + 7, MF(18, 700), 'rgba(255,255,255,0.8)', 'right', 2); }
      const done = seg(t, red + 2.4, red + 2.6);
      this.dimLine(this.P([X, 0, 0.03]), this.P([X, st.netH, 0.03]), num(st.netH, 2) + ' m', done > 0 ? 'VOLEIBOL SENTADO' : 'ALTURA DE LA RED', done > 0 ? GREEN : GOLD, 1, -1);
      c.restore();
    }
    // la cancha se reduce
    a = win(t, can - 0.05, r4.t0 - 0.2, 0.25, 0.01);
    if (a > 0) {
      const w = this.s3.world, hw = w.hw, hl = w.hl, k = st.courtK, col = k >= 0.999 ? GREEN : GOLD;
      c.save(); c.globalAlpha = a;
      const dim = (pa, pb, label, off) => {
        const A2 = this.P(pa), B2 = this.P(pb); if (!A2.ok || !B2.ok) return;
        this.line(A2, B2, col, 4); const mx = (A2.x + B2.x) / 2 + off[0], my = (A2.y + B2.y) / 2 + off[1];
        c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 16; this.txt(label, mx, my, HF(76), col, 'center'); c.restore();
        for (const q of [A2, B2]) { c.fillStyle = col; c.beginPath(); c.arc(q.x, q.y, 8, 0, 7); c.fill(); }
      };
      dim([hw + 0.9, 0.02, -hl], [hw + 0.9, 0.02, hl], num(hl * 2, hl * 2 % 1 > 0.05 ? 1 : 0) + ' m', [96, 20]);
      dim([-hw, 0.02, -1.3], [hw, 0.02, -1.3], num(hw * 2, hw * 2 % 1 > 0.05 ? 1 : 0) + ' m', [0, -22]);
      this.glass(70, 200, 520, 250, 26);
      this.txt('DIMENSIONES DE LA CANCHA', 104, 252, MF(19, 800), GOLD, 'left', 2.5);
      this.txt(`${num(hl * 2, 0)} × ${num(hw * 2, 0)} m`, 100, 362, HF(128), k >= 0.999 ? GREEN : WHITE);
      this.txt(k >= 0.999 ? 'VOLEIBOL SENTADO · RED A 1,15 m' : 'VOLEIBOL TRADICIONAL  →  SENTADO', 104, 412, MF(18, 700), 'rgba(255,255,255,0.8)', 'left', 2);
      c.restore();
    }
    // sin salto / equipo
    const sal = M('r4_salto'), eq = M('r4_equipo');
    a = win(t, sal, eq - 0.2, 0.01, 0.3);
    if (a > 0) {
      const hd = A.juan.headW, p = this.P([hd.x + 0.75, hd.y + 0.55, hd.z]);
      if (p.ok) {
        const s = spring(t - sal, 12, 0.5); c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.scale(s, s);
        c.strokeStyle = WHITE; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 60); c.lineTo(0, -50); c.moveTo(-26, -22); c.lineTo(0, -52); c.lineTo(26, -22); c.stroke();
        const xs = seg(t, sal + 0.35, sal + 0.6); c.strokeStyle = RED; c.lineWidth = 11; c.beginPath(); c.moveTo(-44, -40); c.lineTo(lerp(-44, 44, xs), lerp(-40, 48, xs)); c.stroke();
        this.slab(60, -36, 300, 70, RED, 0.2); this.txt('SALTO = 0', 214, 16, HF(58), WHITE, 'center', 1);
        this.txt('LA ALTURA YA NO ES VENTAJA', 66, 64, MF(18, 700), WHITE, 'left', 2);
        c.restore();
      }
    }
    a = win(t, eq, r5.t0 - 0.2, 0.01, 0.3);
    if (a > 0) {
      const P3 = ['juan', 'martin', 'sofia'].map(id => this.head(id, 0.34));
      if (P3.every(p => p.ok)) {
        c.save(); c.globalAlpha = a; c.shadowColor = GOLD; c.shadowBlur = 18;
        const arc = (p0, p1, lift, u) => { if (u <= 0) return; c.strokeStyle = GOLD; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); for (let k = 0; k <= 24; k++) { const q = k / 24 * u, x = lerp(p0.x, p1.x, q), y = lerp(p0.y, p1.y, q) - 4 * lift * q * (1 - q); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
        arc(P3[0], P3[1], 70, eo(seg(t, eq, eq + 0.5))); arc(P3[1], P3[2], 70, eo(seg(t, eq + 0.2, eq + 0.7))); arc(P3[0], P3[2], 190, eo(seg(t, eq + 0.4, eq + 0.95)));
        c.shadowBlur = 0; for (const p of P3) { c.fillStyle = GOLD; c.beginPath(); c.arc(p.x, p.y, 11, 0, 7); c.fill(); }
        const cx = (P3[0].x + P3[2].x) / 2, cy = Math.min(P3[0].y, P3[1].y, P3[2].y) - 250, s = spring(t - eq - 0.6, 12, 0.5);
        if (t > eq + 0.6) { c.translate(cx, cy); c.scale(s, s); this.slab(-190, -44, 360, 80, GOLD, 0.2); this.txt('MI EQUIPO', -4, 20, HF(64), NAVY, 'center', 1); }
        c.restore();
      }
    }
    // desplazamiento y senas
    const bra = M('r5_brazos'), mir = M('r5_miradas');
    a = win(t, bra, r6.t0 - 0.2, 0.01, 0.3);
    if (a > 0) {
      c.save(); c.globalAlpha = a;
      const u = seg(t, bra, bra + 1.6);
      for (let i = 0; i < 7; i++) {
        const q = i / 6; if (q > u + 0.05) break;
        const p = this.P([lerp(0.1, -0.6, q) + 0.55, 0.02, lerp(2.3, 1.5, q) + 0.35]), p2 = this.P([lerp(0.1, -0.6, q + 0.04) + 0.55, 0.02, lerp(2.3, 1.5, q + 0.04) + 0.35]);
        if (!p.ok) continue; const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
        c.save(); c.translate(p.x, p.y); c.rotate(ang); c.strokeStyle = CYAN; c.lineWidth = 7; c.lineCap = 'round'; c.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(t * 6 - i * 0.7)));
        c.beginPath(); c.moveTo(-14, -16); c.lineTo(8, 0); c.lineTo(-14, 16); c.stroke(); c.restore();
      }
      const lp = this.head('martin', 0.05); if (lp.ok) this.tag(lp, 110, -60, null, 'DESPLAZAMIENTO CON LOS BRAZOS', 'ARRASTRE E IMPULSO · SIN LEVANTAR LA PELVIS', CYAN, 1, bra + 0.2, t);
      if (t > mir - 0.05) {
        const pa = this.head('martin', 0.02), pb = this.head('sofia', 0.02);
        if (pa.ok && pb.ok) {
          const v = eo(seg(t, mir, mir + 0.5)); c.strokeStyle = GOLD; c.lineWidth = 4; c.setLineDash([4, 12]); c.lineCap = 'round'; c.lineDashOffset = -t * 40;
          c.beginPath(); c.moveTo(pa.x, pa.y); c.lineTo(lerp(pa.x, pb.x, v), lerp(pa.y, pb.y, v)); c.stroke(); c.setLineDash([]);
          const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 - 64, s = spring(t - mir - 0.3, 12, 0.5);
          if (t > mir + 0.3) { c.translate(mx, my); c.scale(s, s); this.slab(-210, -38, 400, 70, GOLD, 0.2); this.txt('MIRADAS Y SEÑAS', -4, 16, HF(54), NAVY, 'center', 1); }
        }
      }
      c.restore();
    }
    // frase clave sincronizada con la voz
    if (t > r6.t0 - 0.1) {
      const o = 1 - seg(t, S('play') - 0.5, S('play') - 0.25), wd = r6.words;
      const L1 = ['SI', 'EL', 'CUERPO', 'NO', 'PUEDE', 'DOMINAR', 'POR', 'LA', 'FUERZA,'], L2 = ['LA', 'MENTE', 'SE', 'VE', 'OBLIGADA', 'A', 'COOPERAR.'];
      c.save(); c.globalAlpha = o; this.glass(216, 178, 1488, 250, 26, seg(t, r6.t0 - 0.1, r6.t0 + 0.3));
      c.fillStyle = RED; c.fillRect(250, 206, 8, eo(seg(t, r6.t0, r6.t0 + 0.5)) * 194);
      const lineOut = (words, y, font, col, start) => {
        let x = 290; words.forEach((w, i) => { const tt = wd[start + i] ? wd[start + i][1] : r6.t1; const u = eo5(seg(t, tt - 0.08, tt + 0.3)); if (u > 0) { c.save(); c.globalAlpha = o * u; this.txt(w, x, y + (1 - u) * 26, font, col, 'left', 1); c.restore(); } x += this.tw(w + ' ', font, 1); });
      };
      lineOut(L1, 268, HF(62, 800), WHITE, 0); lineOut(L2, 384, HF(108), GOLD, L1.length);
      c.restore();
    }
  }

  // ------------------------------------------------------------------ LA JUGADA
  gPlay(t) {
    const c = this.x, st = this.s3.story, S5 = S('play'), cel = B('celebrate'), pu = M('punto');
    // marcador
    let a = win(t, S5 + 0.7, cel + 2.3, 0.4, 0.4);
    if (a > 0) {
      const y = 190 - (1 - eo(a)) * 40; c.save(); c.globalAlpha = a;
      this.rr(660, y, 600, 86, 20); c.fillStyle = 'rgba(7,11,24,0.88)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.5; c.stroke();
      this.txt('SBL', 690, y + 60, HF(54), WHITE); c.fillStyle = RED; c.fillRect(690, y + 70, 70, 5);
      const sc = t >= pu ? 25 : 24, fl = spring(t - pu, 12, 0.4);
      this.rr(852, y + 12, 86, 62, 12); c.fillStyle = t >= pu ? GOLD : 'rgba(255,255,255,0.12)'; c.fill();
      c.save(); c.translate(895, y + 43); if (t >= pu) c.scale(0.6 + 0.4 * fl, 0.6 + 0.4 * fl); this.txt(String(sc), 0, 20, HF(58, 900, false), t >= pu ? NAVY : WHITE, 'center'); c.restore();
      this.txt(':', 960, y + 58, HF(54, 900, false), 'rgba(255,255,255,0.6)', 'center');
      this.rr(982, y + 12, 86, 62, 12); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill(); this.txt('24', 1025, y + 63, HF(58, 900, false), WHITE, 'center');
      this.txt('VISITA', 1092, y + 60, HF(54), CYAN);
      this.txt('SET 3  ·  PUNTO DE PARTIDO', 960, y + 116, MF(18, 700), 'rgba(255,255,255,0.85)', 'center', 4);
      c.restore();
    }
    // toques
    const T = [['recv', '1', 'RECEPCIÓN', GOLD], ['set', '2', 'ARMADA', CYAN], ['tip', '3', 'ATAQUE', '#ff5a6a'], ['save', '1', 'DEFENSA', CYAN], ['set2', '2', 'ARMADA', GOLD], ['spike', '3', 'REMATE', '#ff5a6a']];
    for (const [mk, n, label, col] of T) {
      const t0 = M(mk), u = t - t0; if (u < 0 || u > 1.15) continue;
      const nd = st.nodes.find(q => q.t === t0), p = this.P([nd.pIn[0], nd.pIn[1] + 0.25, nd.pIn[2]]); if (!p.ok) continue;
      const s = spring(u, 14, 0.5), o = 1 - seg(u, 0.8, 1.15);
      c.save(); c.globalAlpha = o; c.translate(clamp(p.x + 120, 200, W - 320), Math.max(260, p.y + 10 - u * 26)); c.scale(s, s);
      c.fillStyle = col; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill(); this.txt(n, 0, 17, HF(50, 900, false), NAVY, 'center');
      this.slab(40, -27, this.tw(label, HF(44, 800), 1) + 44, 54, 'rgba(7,11,24,0.9)', 0.2); this.txt(label, 66, 15, HF(44, 800), WHITE, 'left', 1);
      c.restore();
    }
    for (const mk of ['serve', 'oatk', 'spike']) this.burst(t, M(mk), st.nodes.find(n => n.t === M(mk)).pIn, mk === 'spike' ? 1.3 : 0.6);
    // PUNTO
    a = win(t, pu, pu + 1.75, 0.01, 0.3);
    if (a > 0) {
      const s = spring(t - pu, 10, 0.4); c.save(); c.globalAlpha = a; c.translate(960, 500); c.rotate(-0.045); c.scale(s, s);
      this.slab(-640, -170, 1230, 300, RED, 0.2); this.slab(-600, 150, 1100, 16, GOLD, 0.2);
      this.txt('¡PUNTO!', -10, 108, HF(330), WHITE, 'center', 4);
      const sa = seg(t, pu + 0.3, pu + 0.6); c.globalAlpha = a * sa; this.slab(-520, 184, 1010, 66, NAVY, 0.2); this.txt('3 TOQUES  ·  3 JUGADORES  ·  1 EQUIPO', -6, 229, MF(32, 800), GOLD, 'center', 6); c.globalAlpha = a;
      c.restore(); this.confetti(t, pu, 90, 1.9);
    }
    // triada dialectica sobre sus cabezas
    const te = M('y2_tesis'), an = M('y2_anti'), si = M('y2_sint'), eq = M('y3_equipo'), out = 1 - seg(t, S('hope') - 0.45, S('hope') - 0.2);
    if (t > te - 0.05 && out > 0) {
      const mg = eio(seg(t, eq - 0.35, eq + 0.25));
      const N = [['juan', te, 'TESIS', 'COMPETENCIA', '#ff5a6a', 0.62, -150], ['martin', an, 'ANTÍTESIS', 'RESTRICCIÓN', CYAN, 0.62, 150], ['sofia', si, 'SÍNTESIS', 'ESPÍRITU COLECTIVO', GOLD, 1.0, 0]];
      const tgt = { x: 960, y: 300 };
      const pts = N.map(([id, t0, , , , up, dx]) => { const p = this.head(id, up); return { x: lerp(p.x + dx, tgt.x, mg), y: lerp(Math.max(p.y, 250), tgt.y, mg), ok: p.ok, t0 }; });
      c.save(); c.globalAlpha = out;
      if (pts.every(p => p.ok)) {
        c.shadowColor = WHITE; c.shadowBlur = 12;
        this.line(pts[0], pts[1], 'rgba(255,255,255,0.85)', 4, eo(seg(t, an - 0.1, an + 0.4)) * (1 - mg));
        this.line(pts[0], pts[2], GOLD, 5, eo(seg(t, si - 0.1, si + 0.45)) * (1 - mg)); this.line(pts[1], pts[2], GOLD, 5, eo(seg(t, si - 0.1, si + 0.45)) * (1 - mg));
        c.shadowBlur = 0;
        N.forEach(([id, t0, k, v, col], i) => {
          if (t < t0 - 0.05) return; const p = pts[i], s = spring(t - t0 + 0.05, 12, 0.5) * (1 - mg);
          const w = Math.max(this.tw(v, HF(46, 800), 1), 150) + 56;
          c.save(); c.translate(p.x, p.y); c.scale(s, s);
          this.rr(-w / 2, -58, w, 104, 18); c.fillStyle = 'rgba(7,11,24,0.9)'; c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.stroke();
          this.txt(k, 0, -24, MF(19, 800), col, 'center', 4); this.txt(v, 0, 26, HF(46, 800), WHITE, 'center', 1);
          c.restore();
        });
      }
      if (t > C('y3').t0 - 0.1) { const ha = seg(t, C('y3').t0, C('y3').t0 + 0.4) * (1 - mg); c.save(); c.globalAlpha = out * ha; this.rr(70, 214, 500, 50, 25); c.fillStyle = 'rgba(7,11,24,0.9)'; c.fill(); c.fillStyle = GOLD; c.beginPath(); c.arc(100, 239, 7, 0, 7); c.fill(); this.txt('G. W. F. HEGEL  ·  DIALÉCTICA', 122, 247, MF(21, 700), WHITE, 'left', 4); c.restore(); }
      if (t > eq - 0.1) { const s = spring(t - eq + 0.05, 10, 0.42); c.translate(960, 300); c.scale(s, s); this.slab(-470, -90, 900, 164, GOLD, 0.2); this.txt('JUGAR EN EQUIPO', -8, 46, HF(150), NAVY, 'center', 2); this.txt('SÍNTESIS = ESPÍRITU COLECTIVO (GEIST)', 0, 116, MF(22, 700), WHITE, 'center', 4, seg(t, eq + 0.3, eq + 0.7)); }
      c.restore();
    }
  }
  confetti(t, t0, n, life) {
    const c = this.x, u = t - t0; if (u < 0 || u > life) return;
    const cols = [GOLD, RED, WHITE, CYAN];
    for (let i = 0; i < n; i++) {
      const a = hash(i * 1.7) * 6.283, sp = 500 + hash(i * 3.1) * 900, x = 960 + Math.cos(a) * sp * u * (1 - u * 0.25), y = 520 + Math.sin(a) * sp * u * 0.7 - 380 * u + 720 * u * u;
      c.save(); c.translate(x, y); c.rotate(u * (4 + hash(i) * 9) + i); c.globalAlpha = clamp((life - u) / 0.5); c.fillStyle = cols[i % 4]; c.fillRect(-9, -5, 18, 10); c.restore();
    }
  }

  // ------------------------------------------------------------------ LA OPORTUNIDAD
  kw(lines, x, y, t, t0, t1, align = 'left') {
    const c = this.x, a = win(t, t0, t1, 0.01, 0.3); if (a <= 0) return;
    c.save(); c.globalAlpha = a; let yy = y;
    lines.forEach(([s, col, bg], i) => {
      const f = HF(104), w = this.tw(s, f, 1), tt = t0 + i * 0.16, u = eo5(seg(t, tt, tt + 0.45)); if (u <= 0) { yy += 118; return; }
      const x0 = align === 'right' ? x - w - 60 : x;
      c.save(); c.beginPath(); c.rect(x0 - 10, yy - 100, (w + 90) * u, 126); c.clip();
      this.slab(x0, yy - 92, w + 46, 108, bg, 0.2); this.txt(s, x0 + 34, yy - 6, f, col, 'left', 1); c.restore(); yy += 118;
    });
    c.restore();
  }
  gHope(t) {
    const c = this.x, e1 = C('e1'), e2 = C('e2'), e3 = C('e3'), e3b = C('e3b'), e4 = C('e4'), arms = M('arms'), cr = S('credits');
    const k = win(t, e1.t0 + 0.05, e2.t0 - 0.2, 0.5, 0.3);
    if (k > 0) {
      const px = 1000 + (1 - eo(k)) * 200, py = 170, pw = 850, ph = 700, pc = M('e1_pct'), u = eo(seg(t, pc, pc + 1.3));
      c.save(); c.globalAlpha = seg(k, 0, 0.6); this.glass(px, py, pw, ph, 30);
      this.panelHeader(px + 50, py + 64, t, e1.t0 + 0.3, '73 ESTUDIANTES  ·  COLEGIO SAN BONIFACIO DE LAS LANZAS');
      if (t > pc - 0.05) { const s = num(71.2 * u, 1), w = this.tw(s, HF(270)); this.txt(s, px + 46, py + 356, HF(270), GOLD); this.txt('%', px + 58 + w, py + 356, HF(140), GOLD); }
      this.rise('QUIERE PROBAR EL', px + 52, py + 440, HF(70, 800), WHITE, t, M('e1_probar') - 0.5, 0.5);
      this.rise('VOLEIBOL SENTADO', px + 52, py + 514, HF(70, 800), WHITE, t, M('e1_probar') - 0.35, 0.5);
      for (let i = 0; i < 73; i++) { const q = back(seg(t, pc + i * 0.012, pc + 0.3 + i * 0.012)); if (q > 0) { c.save(); c.translate(px + 62 + (i % 25) * 30, py + 550 + Math.floor(i / 25) * 40); c.scale(q, q); this.person(0, 0, 30, i < 52 ? GOLD : 'rgba(255,255,255,0.3)'); c.restore(); } }
      this.txt('52 de 73 · como alternativa inclusiva', px + 52, py + 676, MF(17, 600), 'rgba(255,255,255,0.7)', 'left', 1.5, seg(t, pc + 1.2, pc + 1.6));
      c.restore();
    }
    this.kw([['COMPETIR', WHITE, 'rgba(7,11,24,0.9)'], ['NO ES EXCLUIR', WHITE, RED]], 1080, 330, t, e2.t0 + 0.9, e3.t0 - 0.25);
    this.kw([['TODOS', NAVY, GOLD], ['APORTAMOS', WHITE, 'rgba(7,11,24,0.9)']], 110, 330, t, M('e3_todos') - 0.25, e3b.t0 - 0.15);
    this.kw([['NUESTRO PRIMER PASO', NAVY, WHITE]], 560, 300, t, e3b.t0 + 0.7, e4.t0 - 0.2);
    // cierre: EN LA CANCHA... ¡JUGAMOS TODOS!
    if (t > e4.t0 - 0.05) {
      const o = 1 - seg(t, cr + 0.5, cr + 1.1);
      c.save(); c.globalAlpha = o; c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 24;
      this.chars('EN LA CANCHA…', 960, 236, HF(104), WHITE, t, e4.t0 + 0.1, 0.035, 2, 'center'); c.shadowColor = 'transparent';
      if (t > arms - 0.02) { const s = spring(t - arms + 0.02, 10, 0.4); c.translate(960, 388); c.rotate(-0.035); c.scale(s, s); this.slab(-610, -112, 1190, 202, RED, 0.2); this.slab(-570, 102, 1080, 12, GOLD, 0.2); this.txt('¡JUGAMOS TODOS!', -10, 70, HF(212), WHITE, 'center', 3); }
      c.restore();
      this.confetti(t, arms, 150, 2.6);
    }
  }

  // ------------------------------------------------------------------ CREDITOS
  credits(t) {
    const c = this.x, cr = S('credits'), a = seg(t, cr + 0.7, cr + 1.9);
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, `rgba(4,7,16,${0.86 * a})`); g.addColorStop(1, `rgba(4,7,16,${0.78 * a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const T0 = cr + 1.3;
    const s = spring(t - T0, 9, 0.55); if (t > T0) { c.save(); c.translate(430, 440); c.scale(0.7 + 0.3 * s, 0.7 + 0.3 * s); c.globalAlpha = seg(t, T0, T0 + 0.3); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 50; this.rr(-310, -205, 620, 410, 34); c.fillStyle = WHITE; c.fill(); c.shadowColor = 'transparent'; const lw = 540, lh = lw * this.logo.height / this.logo.width; c.drawImage(this.logo, -lw / 2, -lh / 2, lw, lh); c.restore(); }
    const x = 850;
    this.chars('EL SAQUE DE RECONCILIACIÓN', x, 228, HF(92), WHITE, t, T0 + 0.2, 0.018);
    c.fillStyle = RED; c.fillRect(x + 4, 252, eo(seg(t, T0 + 0.5, T0 + 1.2)) * 300, 7);
    this.rise('UN PROYECTO DE INVESTIGACIÓN DE', x + 4, 318, MF(20, 700), GOLD, t, T0 + 0.7, 0.5, 'left', 4);
    const names = [['SOFÍA LARA MORA', '#4 · CAPITANA · COORDINACIÓN', GOLD], ['JUAN DIEGO NÚÑEZ', '#7 · ATACANTE · BIOMECÁNICA', '#ff5a6a'], ['MARTÍN QUIÑONES', '#10 · ARMADOR · ESTRATEGIA', CYAN]];
    names.forEach(([n, r, col], i) => { const tt = T0 + 0.9 + i * 0.22, y = 392 + i * 76; c.fillStyle = col; c.fillRect(x + 4, y - 44, 6, 52 * eo(seg(t, tt, tt + 0.4))); this.rise(n, x + 28, y, HF(64, 800), WHITE, t, tt, 0.5, 'left', 1); this.rise(r, x + 28 + 470, y - 8, MF(18, 700), col, t, tt + 0.1, 0.5, 'left', 2); });
    this.rise('DOCENTE ASESOR', x + 4, 648, MF(20, 700), GOLD, t, T0 + 1.7, 0.5, 'left', 4);
    this.rise('Juan David Rodríguez Cerón', x + 4, 700, TF(42, 700), WHITE, t, T0 + 1.8, 0.5);
    this.rise('ÁREAS INTEGRADAS', x + 4, 768, MF(20, 700), GOLD, t, T0 + 2.1, 0.5, 'left', 4);
    this.rise('Educación Física · Educación Artística y Cultural · Desarrollo Socioemocional', x + 4, 808, TF(25, 500), 'rgba(255,255,255,0.9)', t, T0 + 2.2, 0.5);
    this.rise('ERE · Lengua Castellana', x + 4, 844, TF(25, 500), 'rgba(255,255,255,0.9)', t, T0 + 2.3, 0.5);
    const b = seg(t, T0 + 2.6, T0 + 3.2);
    c.fillStyle = `rgba(255,255,255,${0.2 * b})`; c.fillRect(120, 902, (W - 240) * eo(b), 2);
    this.txt('CORPORACIÓN COLEGIO SAN BONIFACIO DE LAS LANZAS BILINGÜE  ·  CICLO PROYECTIVO  ·  GRADO 10°  ·  IBAGUÉ, TOLIMA  ·  2026', W / 2, 946, MF(20, 700), WHITE, 'center', 2, b);
    this.txt('Fuentes: World ParaVolley (2025) · Cavedon et al. (2024) · Girard et al. (2014) · Mindeporte / Peace and Sport (2017) · Encuesta SBL 2026 (n = 73)', W / 2, 986, TF(19, 500), 'rgba(255,255,255,0.68)', 'center', 0, b);
    this.txt('Animación 3D generada por código con Three.js y apoyo de inteligencia artificial', W / 2, 1018, TF(19, 500), 'rgba(255,255,255,0.68)', 'center', 0, b);
  }

  // ------------------------------------------------------------------ PANTALLA LED DEL COLISEO
  board(ctx, t) {
    const real = this.x; this.x = ctx;                       // reutiliza los mismos dibujos en la textura de la pantalla
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.scale(1280 / W, 720 / H);
    const S3 = S('history'), S5 = S('play'), S6 = S('hope');
    if (t >= S3 - 0.2 && t < S('rule')) { this.historyArt(Math.max(t, S3)); }
    else if (t >= B('celebrate') + 2.0) {
      this.darkBG(t, 1); ctx.fillStyle = '#ffffff'; this.rr(560, 250, 800, 500, 40); ctx.fill();
      const lw = 680, lh = lw * this.logo.height / this.logo.width; ctx.drawImage(this.logo, 960 - lw / 2, 500 - lh / 2, lw, lh);
    }
    else if (t >= S5 && t < S6) {
      this.darkBG(t, 1); const sc = t >= M('punto') ? '25' : '24';
      this.txt('SBL', 520, 520, HF(230), WHITE, 'right'); this.txt('VISITA', 1400, 520, HF(230), CYAN, 'left');
      this.txt(sc, 760, 760, HF(330, 900, false), t >= M('punto') ? GOLD : WHITE, 'center'); this.txt(':', 960, 730, HF(260, 900, false), WHITE, 'center'); this.txt('24', 1160, 760, HF(330, 900, false), WHITE, 'center');
      this.txt('SET 3 · PUNTO DE PARTIDO', 960, 900, MF(54, 800), GOLD, 'center', 8);
    } else if (t >= S6) {
      this.darkBG(t, 1); this.txt('71,2 %', 960, 560, HF(420), GOLD, 'center'); this.txt('QUIERE PROBAR EL VOLEIBOL SENTADO', 960, 760, HF(104, 800), WHITE, 'center', 2);
      ctx.fillStyle = RED; ctx.fillRect(360, 800, 1200, 12); this.txt('EN LA CANCHA JUGAMOS TODOS', 960, 900, MF(50, 800), WHITE, 'center', 8);
    } else {
      ctx.restore(); ctx.save(); this.stingArt(ctx, 30 + t, 1280, 720); ctx.scale(1280 / W, 720 / H);
      ctx.fillStyle = RED; ctx.fillRect(0, 880, W, 200); this.txt('EL SAQUE DE RECONCILIACIÓN', 960, 1012, HF(128), WHITE, 'center', 3);
    }
    ctx.restore(); this.x = real;
  }
}
