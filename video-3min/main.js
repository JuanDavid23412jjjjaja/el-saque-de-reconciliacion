// main.js - Orquestacion: carga de fuentes y logo, API de seek para el render y reproductor interactivo.
import { TL } from './timeline.js';
import { Scene3D } from './scene3d.js';
import { Overlay2D } from './overlay.js';

const DUR = TL.dur;
const gl = document.getElementById('webgl-canvas'), ov = document.getElementById('overlay-canvas');
const comp = document.createElement('canvas'); comp.width = 1920; comp.height = 1080;
const cctx = comp.getContext('2d');

async function boot() {
  const fonts = ['italic 900 80px "Barlow Condensed"', 'italic 800 80px "Barlow Condensed"', '900 80px "Barlow Condensed"', '800 80px "Barlow Condensed"',
    '500 30px "Inter"', '600 30px "Inter"', '700 30px "Inter"', '800 30px "Inter"', '900 30px "Inter"', 'italic 700 30px "Inter"', 'italic 800 30px "Inter"',
    '600 20px "JetBrains Mono"', '700 20px "JetBrains Mono"', '800 20px "JetBrains Mono"'];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'ÁÉÍÓÚÑ¿¡ abc 0123')));
  await document.fonts.ready;
  const logo = new Image(); logo.src = 'assets/sbl_logo.png'; await logo.decode();

  const s3 = new Scene3D(gl, logo);
  const o2 = new Overlay2D(ov, s3, logo);
  window.seek = (t) => {
    t = Math.max(0, Math.min(DUR - 1e-4, t));
    s3.renderFrame(t, (ctx, tt) => o2.board(ctx, tt));
    o2.render(t);
  };
  // fotograma compuesto (3D + motion design) para el render offline
  window.frame = (t, q = 0.93) => {
    window.seek(t);
    cctx.drawImage(gl, 0, 0); cctx.drawImage(ov, 0, 0);
    return comp.toDataURL('image/jpeg', q).slice(23);
  };
  window.TL = TL; window.s3 = s3;
  window.seek(0);
  window.READY = true;
  player();
}

function player() {
  const btn = document.getElementById('play-btn'), sl = document.getElementById('time-slider'), lab = document.getElementById('time-label');
  if (!btn || location.search.includes('render')) return;
  sl.max = DUR;
  const audio = new Audio('out/mix.wav');
  let playing = false, t0 = 0, off = 0;
  const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  const tick = () => {
    if (!playing) return;
    const t = audio.readyState > 2 && !audio.paused ? audio.currentTime : off + (performance.now() / 1000 - t0);
    if (t >= DUR) { playing = false; btn.textContent = 'REPRODUCIR'; off = 0; return; }
    window.seek(t); sl.value = t; lab.textContent = fmt(t); requestAnimationFrame(tick);
  };
  btn.onclick = () => {
    playing = !playing; btn.textContent = playing ? 'PAUSAR' : 'REPRODUCIR';
    if (playing) { t0 = performance.now() / 1000; audio.currentTime = off; audio.play().catch(() => {}); requestAnimationFrame(tick); }
    else { off = audio.currentTime || off; audio.pause(); }
  };
  sl.oninput = e => { off = parseFloat(e.target.value); t0 = performance.now() / 1000; audio.currentTime = off; window.seek(off); lab.textContent = fmt(off); };
}
boot().catch(e => { console.error(e); window.BOOT_ERROR = String(e && e.stack || e); });
