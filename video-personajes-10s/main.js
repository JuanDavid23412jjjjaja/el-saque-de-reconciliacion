// main.js - Video Orchestration, Seek API & Web Interactive Player
import { Scene3D } from './scene3d.js?v=4';
import { Overlay2D } from './overlay.js?v=4';

const DUR = 10.0;
window.DUR = DUR;

const canvas3D = document.getElementById('webgl-canvas');
const canvas2D = document.getElementById('overlay-canvas');

const scene3D = new Scene3D(canvas3D);
const overlay2D = new Overlay2D(canvas2D);

// Global seek function called by headless renderer and scrubber
window.seek = function(t) {
  const time = Math.max(0, Math.min(DUR, t));
  scene3D.renderFrame(time);
  overlay2D.render(time, DUR);
};
window.render = window.seek;

// Initial frame
window.seek(0);

// Signal ready for headless renderer
window.READY = true;

// --- Interactive In-Browser Video Player with Audio ---
const playBtn = document.getElementById('play-btn');
const timeSlider = document.getElementById('time-slider');
const timeLabel = document.getElementById('time-label');

let isPlaying = false;
let startTime = 0;
let pauseOffset = 0;
let audioElem = null;

// Audio element
try {
  audioElem = new Audio('out/mix.wav');
} catch (e) {
  console.warn("Audio element could not be loaded:", e);
}

function updatePlayback() {
  if (!isPlaying) return;

  const now = performance.now() / 1000;
  const currentT = pauseOffset + (now - startTime);

  if (currentT >= DUR) {
    pause();
    window.seek(DUR);
    timeSlider.value = DUR;
    timeLabel.textContent = '10.00 s';
    return;
  }

  window.seek(currentT);
  timeSlider.value = currentT;
  timeLabel.textContent = currentT.toFixed(2) + ' s';

  requestAnimationFrame(updatePlayback);
}

function play() {
  isPlaying = true;
  startTime = performance.now() / 1000;
  playBtn.textContent = 'PAUSAR';
  if (audioElem) {
    audioElem.currentTime = pauseOffset;
    audioElem.play().catch(() => {});
  }
  requestAnimationFrame(updatePlayback);
}

function pause() {
  if (isPlaying) {
    pauseOffset += (performance.now() / 1000) - startTime;
  }
  isPlaying = false;
  playBtn.textContent = 'REPRODUCIR';
  if (audioElem) {
    audioElem.pause();
  }
}

playBtn.addEventListener('click', () => {
  if (isPlaying) {
    pause();
  } else {
    if (pauseOffset >= DUR) pauseOffset = 0;
    play();
  }
});

timeSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  pauseOffset = val;
  startTime = performance.now() / 1000;
  if (audioElem) audioElem.currentTime = val;
  window.seek(val);
  timeLabel.textContent = val.toFixed(2) + ' s';
});
