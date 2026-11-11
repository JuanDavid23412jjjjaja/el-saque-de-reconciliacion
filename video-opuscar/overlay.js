// overlay.js - Refined 2D Telestrator, Broadcast Packaging & Telemetry
import { lerp, seg, ss, eio } from './lib.js';

export class Overlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 1920;
    this.H = 1080;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
  }

  draw(t, scene) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // 1. Studio Packaging & Broadcast Bug (Top-left & Top-right)
    this.drawBroadcastBug(ctx, t);

    // 2. Projected 3D Annotations & Leader Lines
    this.drawProjectedTelemetry(ctx, t, scene);

    // 3. Editorial Data Cards (Left Third)
    this.drawDataCards(ctx, t);

    // 4. Subtitle Banner (Bottom Center with generous margin)
    this.drawSubtitles(ctx, t);

    // 5. Cinematic Vignette & Corner Framing
    this.drawTechnicalFraming(ctx, t);
  }

  drawBroadcastBug(ctx, t) {
    // Top Left: Project Identity & Institutional Header
    ctx.save();
    
    ctx.fillStyle = 'rgba(10, 14, 20, 0.88)';
    ctx.strokeStyle = '#223448';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(40, 36, 440, 68, 6);
    ctx.fill();
    ctx.stroke();

    // Left Gold Accent Stripe
    ctx.fillStyle = '#ffd400';
    ctx.fillRect(40, 36, 4, 68);

    // Identity Typography
    ctx.fillStyle = '#f0f4f8';
    ctx.font = '900 13px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('COLEGIO SAN BONIFACIO DE LAS LANZAS', 56, 56);

    ctx.fillStyle = '#3fd8ff';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText('TELESTRATOR 3D // BIO-MECÁNICA & DIALÉCTICA', 56, 73);

    ctx.fillStyle = '#8e9eaf';
    ctx.font = '500 10px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText('GRADO 10° • EL SAQUE DE RECONCILIACIÓN', 56, 90);

    // Top Right: Live Analysis Bug & Timecode
    const secStr = Math.floor(t).toString().padStart(2, '0');
    const msStr = Math.floor((t % 1) * 100).toString().padStart(2, '0');
    const beat = Math.min(20, Math.floor(t * 2) + 1);

    ctx.fillStyle = 'rgba(10, 14, 20, 0.88)';
    ctx.strokeStyle = '#223448';
    ctx.beginPath();
    ctx.roundRect(1620, 36, 260, 68, 6);
    ctx.fill();
    ctx.stroke();

    // REC Dot (pulsing red)
    ctx.fillStyle = (Math.floor(t * 2) % 2 === 0) ? '#ff3b30' : '#881b16';
    ctx.beginPath();
    ctx.arc(1642, 57, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText('ANALYSIS MODE [LIVE]', 1656, 61);

    ctx.fillStyle = '#ffd400';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillText(`00:00:${secStr}:${msStr}`, 1640, 89);

    ctx.fillStyle = '#677d94';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(`BEAT ${beat}/20`, 1795, 89);

    ctx.restore();
  }

  drawProjectedTelemetry(ctx, t, scene) {
    ctx.save();

    // 1. Net Height Leader
    let curNetH = 2.43;
    let netColor = '#ff3b30';
    let netLabel = 'RED CONVENCIONAL: 2.43 M';
    let netSub = 'BARRERA FÍSICA EXCLUYENTE (VOLEIBOL ESTÁNDAR)';

    if (t < 2.8) {
      curNetH = 2.43;
      netColor = '#ff3b30';
      netLabel = 'RED CONVENCIONAL: 2.43 M';
      netSub = 'BARRERA FÍSICA EXCLUYENTE [TESIS]';
    } else if (t <= 4.6) {
      const p = eio(seg(t, 2.8, 4.6));
      curNetH = lerp(2.43, 1.15, p);
      netColor = '#ffd400';
      netLabel = `DESCENSO ACTIVO: ${curNetH.toFixed(2)} M`;
      netSub = 'CALIBRACIÓN MECÁNICA (-52.7%)';
    } else {
      curNetH = 1.15;
      netColor = '#00ff88';
      netLabel = 'RED VOLEIBOL SENTADO: 1.15 M';
      netSub = 'ACCESIBILIDAD TOTAL Y EQUIDAD [ANTÍTESIS]';
    }

    const netProj = scene.projectToScreen(0, curNetH, 0);
    if (netProj.visible) {
      this.drawLeaderCallout(ctx, {
        anchorX: netProj.x,
        anchorY: netProj.y,
        cardX: netProj.x + (netProj.x > 960 ? -310 : 50),
        cardY: Math.max(120, netProj.y - 70),
        title: netLabel,
        subtitle: netSub,
        color: netColor,
        tag: 'H_NET'
      });
    }

    // 2. Pelvic Contact Leader (When athlete is active)
    if (t >= 3.0) {
      const pelvisProj = scene.projectToScreen(0, 0.05, -1.6);
      if (pelvisProj.visible) {
        this.drawLeaderCallout(ctx, {
          anchorX: pelvisProj.x,
          anchorY: pelvisProj.y,
          cardX: pelvisProj.x + (pelvisProj.x > 960 ? -330 : 60),
          cardY: Math.min(840, pelvisProj.y + 35),
          title: 'REGLA DE CONTACTO PÉLVICO',
          subtitle: 'ANCLAJE AL SUELO (WPV 4.2.1) • Δy = 0.00 M',
          color: '#00ffaa',
          tag: 'PELVIS-LOCK'
        });
      }
    }

    // 3. Center of Mass (CoM) Target Tag
    if (t >= 3.8 && t <= 7.2) {
      const comProj = scene.projectToScreen(0, 0.28, -1.6);
      if (comProj.visible) {
        ctx.strokeStyle = '#ffd400';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(comProj.x, comProj.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffd400';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText('CoM 0.28m', comProj.x + 14, comProj.y + 4);
      }
    }

    // 4. Ball Landing Impact Marker
    if (t >= 7.8) {
      const impactProj = scene.projectToScreen(0.8, 0.015, 3.0);
      if (impactProj.visible) {
        const p = seg(t, 7.8, 9.8);
        ctx.strokeStyle = `rgba(63, 216, 255, ${1 - p})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(impactProj.x, impactProj.y, 16 + p * 32, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#3fd8ff';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.fillText('PUNTO DE IMPACTO // SÍNTESIS VALIDADOR', impactProj.x + 24, impactProj.y - 12);
      }
    }

    ctx.restore();
  }

  drawLeaderCallout(ctx, opts) {
    const { anchorX, anchorY, cardX, cardY, title, subtitle, color, tag } = opts;

    // Anchor Target Circle
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Dogleg Leader Line
    const midX = cardX > anchorX ? anchorX + 30 : anchorX - 30;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(midX, cardY + 22);
    ctx.lineTo(cardX > anchorX ? cardX : cardX + 275, cardY + 22);
    ctx.stroke();
    ctx.setLineDash([]);

    // Callout Card Box
    ctx.fillStyle = 'rgba(8, 12, 16, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, 275, 44, 4);
    ctx.fill();
    ctx.stroke();

    // Left Color Accent
    ctx.fillStyle = color;
    ctx.fillRect(cardX, cardY, 3, 44);

    // Callout Tag
    ctx.fillStyle = color;
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(tag, cardX + 10, cardY + 15);

    // Callout Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.fillText(title, cardX + 10, cardY + 28);

    // Callout Subtitle
    ctx.fillStyle = '#8e9eaf';
    ctx.font = '500 9px "Inter", sans-serif';
    ctx.fillText(subtitle, cardX + 10, cardY + 39);
  }

  drawDataCards(ctx, t) {
    ctx.save();

    // Shot 1 (0 - 3.2s): Tesis de Exclusión SBL
    if (t < 3.2) {
      const alpha = seg(t, 0.2, 0.8) * (1 - seg(t, 2.7, 3.2));
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(10, 14, 20, 0.9)';
      ctx.strokeStyle = '#ff3b30';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 130, 360, 220, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(40, 130, 4, 220);

      ctx.fillStyle = '#ff3b30';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillText('DIAGNÓSTICO SBL // N = 73 ESTUDIANTES', 56, 158);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px "JetBrains Mono", monospace';
      ctx.fillText('47.9%', 56, 210);

      ctx.fillStyle = '#d0d8e2';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText('Alumnos con sensación de exclusión', 56, 230);
      ctx.fillStyle = '#7a8c9e';
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.fillText('Barrera anatómica del salto vertical.', 56, 246);

      ctx.fillStyle = '#ffd400';
      ctx.font = '800 24px "JetBrains Mono", monospace';
      ctx.fillText('68.5%', 56, 290);
      ctx.fillStyle = '#d0d8e2';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText('Asocian el juego a solo "el mejor"', 150, 282);
      ctx.fillStyle = '#7a8c9e';
      ctx.font = '500 10px "Inter", sans-serif';
      ctx.fillText('Monopolio competitivo tradicional.', 150, 298);

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(56, 320, 320, 6);
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(56, 320, 320 * 0.479, 6);
    }
    // Shot 2 (3.2 - 6.5s): Antítesis Biomecánica
    else if (t < 6.5) {
      const alpha = seg(t, 3.2, 3.8) * (1 - seg(t, 6.0, 6.5));
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(10, 14, 20, 0.9)';
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 130, 360, 220, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd400';
      ctx.fillRect(40, 130, 4, 220);

      ctx.fillStyle = '#ffd400';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillText('ANTÍTESIS // RECONFIGURACIÓN ESPACIAL', 56, 158);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "JetBrains Mono", monospace';
      ctx.fillText('1.15 M', 56, 205);

      ctx.fillStyle = '#3fd8ff';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText('[-52.7% DESNIVEL]', 210, 205);

      ctx.fillStyle = '#d0d8e2';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText('Cancha reducida a 10m x 6m', 56, 235);
      ctx.fillStyle = '#7a8c9e';
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.fillText('Desplazamiento por fricción y tracción.', 56, 252);

      ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.fillRect(56, 275, 325, 48);
      ctx.strokeStyle = '#00ff88';
      ctx.strokeRect(56, 275, 325, 48);

      ctx.fillStyle = '#00ff88';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillText('CONTACTO PÉLVICO: OBLIGATORIO', 68, 294);
      ctx.fillStyle = '#d0d8e2';
      ctx.font = '500 10px "Inter", sans-serif';
      ctx.fillText('Desaparece la ventaja por estatura corporal.', 68, 310);
    }
    // Shot 3 & 4 (6.5 - 10.0s): Síntesis Dialéctica
    else {
      const alpha = seg(t, 6.5, 7.2);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 130, 360, 220, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(40, 130, 4, 220);

      ctx.fillStyle = '#00ffaa';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillText('SÍNTESIS // EL SAQUE DE RECONCILIACIÓN', 56, 158);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px "JetBrains Mono", monospace';
      ctx.fillText('71.2%', 56, 215);

      ctx.fillStyle = '#ffd400';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText('[+42.4% IMPACTO]', 210, 212);

      ctx.fillStyle = '#d0d8e2';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText('Inclusión y participación efectiva', 56, 240);
      ctx.fillStyle = '#7a8c9e';
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.fillText('Validado empíricamente en Grado 10° SBL.', 56, 258);

      ctx.fillStyle = 'rgba(63, 216, 255, 0.15)';
      ctx.fillRect(56, 280, 325, 45);
      ctx.strokeStyle = '#3fd8ff';
      ctx.strokeRect(56, 280, 325, 45);

      ctx.fillStyle = '#3fd8ff';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillText('SÍNTESIS DIALÉCTICA GEIST (HEGEL)', 68, 298);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 10px "Inter", sans-serif';
      ctx.fillText('La técnica reconcilia a la comunidad.', 68, 313);
    }

    ctx.restore();
  }

  drawSubtitles(ctx, t) {
    ctx.save();

    let textLine1 = '';
    let textLine2 = '';
    let phaseTag = '';
    let accentColor = '#ffd400';

    if (t < 3.2) {
      phaseTag = 'FASE 1: TESIS (EXCLUSIÓN TRADICIONAL)';
      accentColor = '#ff3b30';
      textLine1 = 'El voleibol tradicional con red de 2.43 m impone una barrera física vertical';
      textLine2 = 'donde el 47.9% de los alumnos de Grado 10 se siente excluido del juego.';
    } else if (t < 6.5) {
      phaseTag = 'FASE 2: ANTÍTESIS (REGLA BIOMECÁNICA)';
      accentColor = '#ffd400';
      textLine1 = 'Al descender la red a 1.15 m y anclar la pelvis al suelo mediante la regla World ParaVolley,';
      textLine2 = 'se anula el monopolio del salto y se democratiza la motricidad sobre la duela.';
    } else {
      phaseTag = 'FASE 3: SÍNTESIS (EL SAQUE DE RECONCILIACIÓN)';
      accentColor = '#00ffaa';
      textLine1 = 'El Voleibol Sentado se convierte en el Saque de Reconciliación:';
      textLine2 = 'una síntesis dialéctica que eleva la participación al 71.2% en el Colegio San Bonifacio.';
    }

    // Subtitle Container Box (Raised to y = 890 to leave generous space above controls)
    const boxW = 1080;
    const boxH = 74;
    const boxX = (this.W - boxW) / 2;
    const boxY = 885;

    ctx.fillStyle = 'rgba(8, 12, 18, 0.9)';
    ctx.strokeStyle = '#223244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.fillRect(boxX, boxY, 4, boxH);

    ctx.fillStyle = accentColor;
    ctx.font = '800 10px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(phaseTag, boxX + 24, boxY + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '0.3px';
    ctx.fillText(textLine1, boxX + 24, boxY + 42);

    ctx.fillStyle = '#9cb0c4';
    ctx.font = '500 13px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(textLine2, boxX + 24, boxY + 62);

    ctx.restore();
  }

  drawTechnicalFraming(ctx, t) {
    ctx.save();
    const s = 18;
    ctx.strokeStyle = 'rgba(100, 130, 160, 0.35)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(20, 20 + s); ctx.lineTo(20, 20); ctx.lineTo(20 + s, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.W - 20 - s, 20); ctx.lineTo(this.W - 20, 20); ctx.lineTo(this.W - 20, 20 + s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, this.H - 20 - s); ctx.lineTo(20, this.H - 20); ctx.lineTo(20 + s, this.H - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.W - 20 - s, this.H - 20); ctx.lineTo(this.W - 20, this.H - 20); ctx.lineTo(this.W - 20, this.H - 20 - s);
    ctx.stroke();

    ctx.restore();
  }
}
