/**
 * SoundDesign - Motor de Audio de Precisión Matemática a 120 BPM
 * Diseñado bajo el estándar de Opus 5.5 / Skillry:
 * - 120 BPM exactos (0.50 segundos por beat, 2.0 segundos por compás de 4 beats)
 * - Síntesis de sonido procedural para las 3 tintas:
 *   1. Papel: Rasgueo sutil de lápiz grafito y chasquidos de regla
 *   2. Blueprint: Clics mecánicos de compás, calibrador y engranajes
 *   3. Holograma: Sub-graves puros, ondas sinusoidales analíticas y pulsos de escaneo
 * - Cero muestras de audio externas; todo generado al vuelo en Web Audio API
 */

class SoundDesign {
  constructor() {
    this.ctx = null;
    this.bpm = 120;
    this.beatDuration = 60 / this.bpm; // 0.50s
    this.isMuted = false;
    this.masterGain = null;
    this.lastTriggeredBeat = -1;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Se llama en cada frame con el tiempo t en segundos
  updateBeat(t, inkStage) {
    if (!this.ctx || this.isMuted) return;

    // Calcular el índice de beat actual
    const currentBeat = Math.floor(t / this.beatDuration);

    if (currentBeat !== this.lastTriggeredBeat) {
      this.lastTriggeredBeat = currentBeat;
      const beatInBar = currentBeat % 4; // 0, 1, 2, 3

      // Metrónomo táctil sutil según el beat y la tinta actual
      if (inkStage === 'paper') {
        this.playPencilScuff(beatInBar === 0 ? 0.35 : 0.18);
        if (beatInBar === 0) this.playSubKick(55, 0.25);
      } else if (inkStage === 'blueprint') {
        this.playMechanicalClick(beatInBar === 0 ? 0.4 : 0.2);
        if (beatInBar === 0) this.playSubKick(70, 0.35);
      } else if (inkStage === 'hologram') {
        this.playHoloPulse(beatInBar === 0 ? 880 : 440, beatInBar === 0 ? 0.3 : 0.15);
        if (beatInBar === 0) this.playSubKick(48, 0.45);
      }
    }
  }

  // Sub-bombo de 120 BPM limpio sin distorsión
  playSubKick(freq = 60, volume = 0.3) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.08);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Sonido de textura de lápiz grafito sobre papel
  playPencilScuff(intensity = 0.2) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // Clic de precisión técnica (blueprint / compás / engranaje)
  playMechanicalClick(intensity = 0.25) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

    gain.gain.setValueAtTime(intensity * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Pulso holográfico (onda pura armónica)
  playHoloPulse(freq = 440, intensity = 0.2) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(intensity * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Impacto de transición entre tintas (Hard edge flood / Scan line wipe)
  playTransitionHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.playSubKick(42, 0.6);

    // Resonancia metálica fina
    [880, 1320, 1760].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.08 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

window.SoundDesign = SoundDesign;
