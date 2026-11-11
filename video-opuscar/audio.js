// audio.js - Web Audio API Procedural Sound Engine adhering to Lemo-Opuscar sound design
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.hasInit = false;
    this.lastTriggered = {};
  }

  init() {
    if (this.hasInit) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this.hasInit = true;

    // Ambient room tone bed (low pass filtered brown noise)
    this.startAmbience();
  }

  startAmbience() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 0.15;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    const ambientGain = this.ctx.createGain();
    ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(this.masterGain);
    whiteNoise.start();
  }

  // Sub-bass cinematic impact
  playSubThump(freq = 65, duration = 0.8) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + duration);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Mechanical winch / servo pitch-glide for net descent
  playMechanicalServo(duration = 1.6) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Motor whine
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(320, now + duration * 0.4);
    osc.frequency.linearRampToValueAtTime(95, now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.25, now + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Telemetry HUD chirp / data blip
  playTelemetryClick(freq = 1200) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Volleyball strike (punchy mid-range leather hit)
  playBallHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // Leather snap noise
    const bufferSize = this.ctx.sampleRate * 0.06;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // Ball floor landing bounce
  playBallBounce() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Check and dispatch sound cues based on current playback time t
  update(t, prevT) {
    if (!this.hasInit) return;

    // Shot 1 Hook impact
    if (prevT < 0.05 && t >= 0.05 && !this.lastTriggered['t0']) {
      this.playSubThump(55, 1.0);
      this.playTelemetryClick(900);
      this.lastTriggered['t0'] = true;
    }
    // Net descent begins
    if (prevT < 2.9 && t >= 2.9 && !this.lastTriggered['t29']) {
      this.playMechanicalServo(1.8);
      this.playTelemetryClick(1400);
      this.lastTriggered['t29'] = true;
    }
    // Net locks at 1.15m
    if (prevT < 4.7 && t >= 4.7 && !this.lastTriggered['t47']) {
      this.playSubThump(75, 0.4);
      this.playTelemetryClick(1800);
      this.lastTriggered['t47'] = true;
    }
    // Ball Strike
    if (prevT < 6.45 && t >= 6.45 && !this.lastTriggered['t645']) {
      this.playBallHit();
      this.lastTriggered['t645'] = true;
    }
    // Ball Bounce on Floor
    if (prevT < 7.75 && t >= 7.75 && !this.lastTriggered['t775']) {
      this.playBallBounce();
      this.playSubThump(48, 0.7);
      this.lastTriggered['t775'] = true;
    }
    // Final synthesis resolution
    if (prevT < 9.0 && t >= 9.0 && !this.lastTriggered['t90']) {
      this.playTelemetryClick(1200);
      this.lastTriggered['t90'] = true;
    }

    // Reset flags if scrubbed backwards
    if (t < prevT) {
      this.lastTriggered = {};
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
