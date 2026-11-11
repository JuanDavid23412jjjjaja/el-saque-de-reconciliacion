// main.js - Master Orchestrator following Lemo-Opuscar Architecture
import { Scene3D } from './scene3d.js';
import { Overlay } from './overlay.js';
import { sound } from './audio.js';

const W = 1920;
const H = 1080;
const DUR = 10.0; // Exactly 10.0 seconds

window.DUR = DUR;
window.READY = false;

// DOM Elements
const stage = document.getElementById('stage');
const ovCanvas = document.getElementById('ov');
const playBtn = document.getElementById('playBtn');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');
const timelineScrubber = document.getElementById('timelineScrubber');
const timecodeLabel = document.getElementById('timecodeLabel');
const container = document.getElementById('app-container');

// Instantiate 3D Scene and Overlay
const scene3D = new Scene3D(stage);
const overlay = new Overlay(ovCanvas);

// Master render function for any time t in [0.0, 10.0]
window.render = function(t) {
  t = Math.max(0, Math.min(DUR, t));
  scene3D.update(t);
  overlay.draw(t, scene3D);
};

// Animation State
let currentTime = 0;
let prevTime = 0;
let isPlaying = false;
let lastRafTime = 0;

function updateUI() {
  if (timelineScrubber) {
    timelineScrubber.value = (currentTime / DUR) * 1000;
  }
  if (timecodeLabel) {
    const sec = Math.floor(currentTime).toString().padStart(2, '0');
    const ms = Math.floor((currentTime % 1) * 100).toString().padStart(2, '0');
    timecodeLabel.textContent = `00:00:${sec}:${ms} / 00:00:10:00`;
  }
}

function tick(now) {
  if (isPlaying) {
    if (!lastRafTime) lastRafTime = now;
    const dt = (now - lastRafTime) / 1000;
    lastRafTime = now;

    prevTime = currentTime;
    currentTime += dt;

    if (currentTime >= DUR) {
      currentTime = DUR;
      isPlaying = false;
      if (playBtn) playBtn.textContent = 'REPLAY';
    }

    sound.update(currentTime, prevTime);
    window.render(currentTime);
    updateUI();
  }
  requestAnimationFrame(tick);
}

// User Interactions
if (playBtn) {
  playBtn.addEventListener('click', () => {
    sound.init();
    if (currentTime >= DUR) {
      currentTime = 0;
      prevTime = 0;
    }
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'PAUSA' : 'PLAY';
    lastRafTime = 0;
  });
}

if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    currentTime = 0;
    prevTime = 0;
    isPlaying = true;
    lastRafTime = 0;
    if (playBtn) playBtn.textContent = 'PAUSA';
    sound.init();
    sound.lastTriggered = {};
    window.render(currentTime);
    updateUI();
  });
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    sound.init();
    const muted = sound.toggleMute();
    muteBtn.textContent = muted ? 'MUTED' : 'AUDIO ON';
    muteBtn.style.color = muted ? '#ff3b30' : '#3fd8ff';
  });
}

if (timelineScrubber) {
  timelineScrubber.addEventListener('input', (e) => {
    const frac = parseFloat(e.target.value) / 1000;
    prevTime = currentTime;
    currentTime = frac * DUR;
    isPlaying = false;
    if (playBtn) playBtn.textContent = 'PLAY';
    sound.update(currentTime, prevTime);
    window.render(currentTime);
    updateUI();
  });
}

// Auto-fit responsive scaling while maintaining 1920x1080 aspect ratio
function resize() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;
  const scale = Math.min(windowW / W, windowH / H);
  
  container.style.transform = `scale(${scale})`;
  container.style.left = `${(windowW - W * scale) / 2}px`;
  container.style.top = `${(windowH - H * scale) / 2}px`;
}

window.addEventListener('resize', resize);
resize();

// Initial Frame Render
window.render(0.0);
updateUI();

// Signal Readiness
window.READY = true;
requestAnimationFrame(tick);

// Autoplay after small delay or first user gesture
document.body.addEventListener('click', () => {
  sound.init();
}, { once: true });
