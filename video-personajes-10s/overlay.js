// overlay.js - 2D Broadcast Graphics, Subtitles, Character Badges & Animated Audio Equalizer
import { clamp, easeOutCubic, easeInOutCubic } from './lib.js?v=4';

export class Overlay2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width || 1920;
    this.height = canvas.height || 1080;
  }

  render(t, dur = 10.0) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Top Header Bar
    this.drawHeader(ctx, t, dur, w, h);

    // 2. Character Cards & Synced Subtitles
    if (t < 3.2) {
      this.drawCharacterBadge(ctx, t, {
        name: 'SOFÍA LARA MORA',
        role: 'CAPITANA & COORDINADORA',
        number: '#4',
        accentColor: '#ffd400',
        subtitle: '« ¡Hola! Con voleibol sentado jugamos todos. »',
        speaking: t >= 0.25 && t <= 3.02,
        fadeIn: clamp(t / 0.4, 0, 1),
        fadeOut: clamp((3.2 - t) / 0.3, 0, 1)
      });
    } else if (t < 6.4) {
      this.drawCharacterBadge(ctx, t, {
        name: 'MARTÍN QUIÑONES',
        role: 'ARMADOR & ESTRATEGA',
        number: '#10',
        accentColor: '#3fd8ff',
        subtitle: '« Red a un metro quince: ¡biomecánica pura! »',
        speaking: t >= 3.15 && t <= 5.43,
        fadeIn: clamp((t - 3.2) / 0.4, 0, 1),
        fadeOut: clamp((6.4 - t) / 0.3, 0, 1)
      });
    } else if (t < 8.8) {
      this.drawCharacterBadge(ctx, t, {
        name: 'JUAN DIEGO NÚÑEZ',
        role: 'REMATADOR & BIOMECÁNICA',
        number: '#7',
        accentColor: '#00ffaa',
        subtitle: '« ¡Al remate! ¡Punto San Bonifacio! »',
        speaking: t >= 5.75 && t <= 7.65,
        fadeIn: clamp((t - 6.4) / 0.4, 0, 1),
        fadeOut: clamp((8.8 - t) / 0.3, 0, 1),
        telemetry: true
      });
    } else {
      // Grand Finale Title Card
      this.drawFinale(ctx, t, w, h);
    }
  }

  drawHeader(ctx, t, dur, w, h) {
    ctx.save();

    // Top Header Pill
    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    ctx.strokeStyle = 'rgba(63, 216, 255, 0.35)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 48, 36, 460, 44, 22, true, true);

    // Glowing Live Dot
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(68, 58, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText('SBL 3D // EL SAQUE DE RECONCILIACIÓN', 84, 63);

    // Live Timecode Pill
    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    ctx.strokeStyle = 'rgba(255, 212, 0, 0.35)';
    this.roundRect(ctx, w - 240, 36, 192, 44, 22, true, true);

    const sec = Math.floor(t);
    const ms = Math.floor((t % 1) * 100);
    const timeStr = `00:0${sec}:${ms < 10 ? '0' : ''}${ms} / 00:10:00`;
    ctx.fillStyle = '#ffd400';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(timeStr, w - 222, 63);

    ctx.restore();
  }

  drawCharacterBadge(ctx, t, data) {
    const alpha = data.fadeIn * data.fadeOut;
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const boxX = 64;
    const boxY = 860;
    const boxW = 540;
    const boxH = 120;

    // Glass Background
    ctx.fillStyle = 'rgba(10, 14, 24, 0.92)';
    ctx.strokeStyle = data.accentColor;
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 16, true, true);

    // Dorsal Badge
    ctx.fillStyle = data.accentColor;
    this.roundRect(ctx, boxX + 20, boxY + 18, 58, 28, 6, true, false);
    ctx.fillStyle = '#0a0e18';
    ctx.font = '900 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.number, boxX + 49, boxY + 38);

    // Name & Role
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Inter", sans-serif';
    ctx.fillText(data.name, boxX + 90, boxY + 40);

    ctx.fillStyle = data.accentColor;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(data.role, boxX + 90, boxY + 58);

    // Subtitle Line
    ctx.fillStyle = '#e4ecf5';
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillText(data.subtitle, boxX + 24, boxY + 95);

    // Voice Spectrum Equalizer Bars
    if (data.speaking) {
      const eqX = boxX + boxW - 100;
      const eqY = boxY + 28;
      ctx.fillStyle = data.accentColor;
      for (let i = 0; i < 6; i++) {
        const barH = 6 + Math.abs(Math.sin(t * 18.0 + i * 1.2)) * 22;
        ctx.fillRect(eqX + i * 9, eqY + (24 - barH), 5, barH);
      }
    }

    // Telemetry Box for Juan Diego
    if (data.telemetry) {
      const telX = 1420;
      const telY = 840;
      ctx.fillStyle = 'rgba(10, 14, 24, 0.92)';
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
      this.roundRect(ctx, telX, telY, 440, 140, 14, true, true);

      ctx.fillStyle = '#00ffaa';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.fillText('BIOMECÁNICA WPV // TELEMETRÍA', telX + 20, telY + 30);

      ctx.fillStyle = '#8ca3ba';
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillText('ALTURA DE RED:', telX + 20, telY + 62);
      ctx.fillText('SILLA DE RUEDAS ADAPTADA:', telX + 20, telY + 88);
      ctx.fillText('VELOCIDAD DE IMPACTO:', telX + 20, telY + 114);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('1.15 M (-52.7%)', telX + 410, telY + 62);
      ctx.fillStyle = '#00ffaa';
      ctx.fillText('✓ GEOMETRÍA ADAPTADA', telX + 410, telY + 88);
      ctx.fillStyle = '#ffd400';
      ctx.fillText('82.4 KM/H', telX + 410, telY + 114);
    }

    ctx.restore();
  }

  drawFinale(ctx, t, w, h) {
    const p = clamp((t - 8.8) / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = p;

    // Center Card Banner
    const cardW = 860;
    const cardH = 200;
    const cardX = (w - cardW) / 2;
    const cardY = 800;

    ctx.fillStyle = 'rgba(8, 12, 22, 0.94)';
    ctx.strokeStyle = '#ffd400';
    ctx.lineWidth = 2;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 20, true, true);

    ctx.textAlign = 'center';

    // Subtitle
    ctx.fillStyle = '#3fd8ff';
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText('PROYECTO DE INVESTIGACIÓN · GRADO 10° · SBL', w / 2, cardY + 45);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Inter", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('EL SAQUE DE RECONCILIACIÓN', w / 2, cardY + 95);

    // Divider
    ctx.strokeStyle = 'rgba(255, 212, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 200, cardY + 118);
    ctx.lineTo(w / 2 + 200, cardY + 118);
    ctx.stroke();

    // Authors
    ctx.fillStyle = '#ffd400';
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillText('SOFÍA LARA MORA · MARTÍN QUIÑONES · JUAN DIEGO NÚÑEZ', w / 2, cardY + 146);

    ctx.fillStyle = '#9cb4c9';
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillText('Profesor: Juan David Rodríguez Cerón · Colegio San Bonifacio de las Lanzas', w / 2, cardY + 172);

    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
