/**
 * AudioEngine - Motor de Audio Procedural y Voz Integrada
 * Proyecto: "El Saque de Reconciliación" - Colegio San Bonifacio de las Lanzas
 * No requiere archivos externos de audio: sintetiza música, efectos y narración con Web Audio API y Web Speech API.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isVoiceEnabled = true;
    this.isPlaying = false;
    this.currentAct = 1;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.synthInterval = null;

    // Web Speech API
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.availableVoices = [];
    this.spanishVoice = null;
    this.lastSpokenText = '';

    if (this.synth) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  initVoices() {
    if (!this.synth) return;
    this.availableVoices = this.synth.getVoices();
    // Prioritize Colombian or Latin American Spanish, then any Spanish
    this.spanishVoice = this.availableVoices.find(v => v.lang === 'es-CO') ||
                        this.availableVoices.find(v => v.lang === 'es-419') ||
                        this.availableVoices.find(v => v.lang === 'es-MX') ||
                        this.availableVoices.find(v => v.lang.startsWith('es')) ||
                        this.availableVoices[0];
  }

  start() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.startAmbientMusic();
  }

  stop() {
    this.isPlaying = false;
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  setAct(actNumber) {
    if (this.currentAct !== actNumber) {
      this.currentAct = actNumber;
      this.playWhoosh();
    }
  }

  // Generador de música sintética atmosférica adaptada a cada acto
  startAmbientMusic() {
    if (this.synthInterval) clearInterval(this.synthInterval);

    let step = 0;
    this.synthInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      step++;

      // Escalas según el acto dramático
      let chordNotes = [];
      let tempoDivider = 4;

      if (this.currentAct === 1) {
        // Tensión / Fragmentación (D menor / tensión reflexiva)
        chordNotes = [146.83, 174.61, 220.0, 261.63]; // D3, F3, A3, C4
        tempoDivider = 4;
      } else if (this.currentAct === 2) {
        // Ruanda - Colombia (A menor a C mayor: memoria y puente)
        chordNotes = (step % 8 < 4) ? [110.0, 164.81, 220.0, 261.63] : [130.81, 164.81, 196.0, 261.63];
        tempoDivider = 3;
      } else if (this.currentAct === 3) {
        // Sarajevo / Laboratorio Biomecánico (Precisión, pulso rítmico, E menor dórico)
        chordNotes = [164.81, 196.0, 246.94, 293.66, 370.0];
        tempoDivider = 2;
      } else if (this.currentAct === 4) {
        // Dialéctica / Geist (Acordes expansivos F mayor 7 a G mayor)
        chordNotes = (step % 8 < 4) ? [174.61, 220.0, 261.63, 329.63] : [196.0, 246.94, 293.66, 392.0];
        tempoDivider = 4;
      } else {
        // Acto V: El Saque de Reconciliación en SBL (Cálido y esperanzador, C mayor a F)
        chordNotes = (step % 8 < 4) ? [130.81, 196.0, 261.63, 329.63] : [174.61, 220.0, 261.63, 349.23];
        tempoDivider = 3;
      }

      // Reproducir nota de acorde ambiental con ataque suave
      if (step % tempoDivider === 0) {
        const note = chordNotes[step % chordNotes.length];
        this.playPadTone(note, 2.5);
      }

      // Pulso suave rítmico
      if (this.currentAct === 3 || this.currentAct === 4) {
        if (step % 2 === 0) {
          this.playSubPulse(step % 4 === 0 ? 82.4 : 110.0, 0.4);
        }
      }
    }, 450);
  }

  playPadTone(freq, duration) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = this.currentAct === 3 ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.currentAct === 3 ? 900 : 550, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playSubPulse(freq, duration) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Efecto de contacto / golpe con el balón
  playBallHit(type = 'bump') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'spike') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      // Recepción / golpe bajo
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Silbato arbitral
  playWhistle() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2450, now);
    osc2.frequency.setValueAtTime(2780, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // Sonido de transición / quién
  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Buffer de ruido blanco filtrado
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Campana de reconciliación / punto colectivo
  playChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
  }

  // Narración mediante Web Speech API (Voz Guía Integrada)
  speakNarration(text, speaker = '') {
    if (!this.isVoiceEnabled || !this.synth) return;
    if (this.lastSpokenText === text) return;
    this.lastSpokenText = text;

    this.synth.cancel(); // Detiene frase anterior

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.spanishVoice) {
      utterance.voice = this.spanishVoice;
    }
    utterance.lang = 'es-CO';
    utterance.rate = 1.02; // Ritmo fluido y claro
    utterance.pitch = speaker === 'Sofía' ? 1.15 : (speaker === 'Juan Diego' ? 0.95 : 1.0);
    utterance.volume = this.isMuted ? 0 : 0.95;

    this.synth.speak(utterance);
  }

  stopNarration() {
    if (this.synth) {
      this.synth.cancel();
      this.lastSpokenText = '';
    }
  }

  toggleVoice() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    if (!this.isVoiceEnabled) {
      this.stopNarration();
    }
    return this.isVoiceEnabled;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopNarration();
    }
    return this.isMuted;
  }
}

window.AudioEngine = AudioEngine;
