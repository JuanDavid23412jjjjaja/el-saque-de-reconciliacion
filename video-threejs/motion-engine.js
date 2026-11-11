/**
 * MotionEngine - Motor Cinemático de Precisión Opus 5.5 / Skillry
 * Proyecto: "El Saque de Reconciliación" - Colegio San Bonifacio de las Lanzas
 * Estándares:
 * - 120 BPM, 120 beats, 30 compases de 2.0s (Duración exacta: 60.00 segundos, bucle perfecto)
 * - Easing de resorte críticamente amortiguado: 1 - (1 + w*t) * exp(-w*t)
 * - Sistema de Tres Tintas:
 *     1. PAPEL (0s - 20s, Beats 0 - 40): Papel crema, grafito con wobble y trama diagonal
 *     2. BLUEPRINT (20s - 40s, Beats 40 - 80): Azul técnico, líneas blancas CAD, cotas, engranajes y Voronoi
 *     3. HOLOGRAMA (40s - 60s, Beats 80 - 120): Negro y cian, líneas de escaneo, red Geist y síntesis hegeliana
 * - Cero cortes, cero desvanecimientos; transformación morfológica continua
 */

class MotionEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 1920;
    this.height = 1080;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.bpm = 120;
    this.beatDuration = 60 / this.bpm; // 0.50s por beat
    this.totalDuration = 60.0; // 60 segundos (30 compases de 4 beats = 120 beats)

    // Paleta de Colores Oficial Opus 5.5
    this.colors = {
      paperCream: '#EDE6D5',
      paperGrid: 'rgba(27, 62, 210, 0.13)',
      paperGridStrong: 'rgba(27, 62, 210, 0.26)',
      graphite: '#16161A',
      bluePencil: '#1B3ED2',
      blueprintBlue: '#1B3ED2',
      blueprintGrid: 'rgba(255, 255, 255, 0.15)',
      blueprintGridStrong: 'rgba(255, 255, 255, 0.30)',
      white: '#FFFFFF',
      hologramBlack: '#07080A',
      hologramCyan: '#45F0DD',
      hologramGrid: 'rgba(69, 240, 221, 0.14)',
      hologramGridStrong: 'rgba(69, 240, 221, 0.28)'
    };

    // Pre-generación de grano de papel procedural
    this.paperNoise = this.createPaperTexture();
  }

  createPaperTexture() {
    const offscreen = document.createElement('canvas');
    offscreen.width = 512;
    offscreen.height = 512;
    const octx = offscreen.getContext('2d');
    const imgData = octx.createImageData(512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 20;
      data[i] = 237 - v;
      data[i + 1] = 230 - v;
      data[i + 2] = 213 - v;
      data[i + 3] = 255;
    }
    octx.putImageData(imgData, 0, 0);
    return offscreen;
  }

  // Easing analítico: Resorte críticamente amortiguado (zero overshoot)
  // f(t) = 1 - (1 + w * t) * exp(-w * t)
  criticallyDamped(t, w = 18) {
    if (t <= 0) return 0;
    return 1 - (1 + w * t) * Math.exp(-w * t);
  }

  // Render principal determinista en el segundo t (0 a 60s)
  render(rawT) {
    const t = rawT % this.totalDuration;
    const beat = Math.floor(t / this.beatDuration);
    const ctx = this.ctx;

    ctx.save();

    // Determinar la etapa de tinta
    let currentInk = 'paper';
    if (t >= 20.0 && t < 40.0) currentInk = 'blueprint';
    else if (t >= 40.0) currentInk = 'hologram';

    // 1. DIBUJAR FONDO Y CUADRÍCULA SEGÚN TINTA
    this.drawBackground(ctx, t, currentInk);

    // 2. DIBUJAR SECCIÓN NARRATIVA SEGÚN TIEMPO
    if (t < 20.0) {
      this.drawStagePaper(ctx, t);
    } else if (t < 40.0) {
      this.drawStageBlueprint(ctx, t);
    } else {
      this.drawStageHologram(ctx, t);
    }

    // 3. TRANSICIONES ENTRE ETAPAS (Hard edge flood & scan line)
    this.drawTransitions(ctx, t);

    // 4. SELLOS TÉCNICOS PERMANENTES EN LAS ESQUINAS (Estándar Opus 5.5)
    this.drawCornerLabels(ctx, t, beat, currentInk);

    ctx.restore();

    return currentInk;
  }

  // ==========================================
  // 1. FONDOS Y CUADRÍCULAS TÉCNICAS
  // ==========================================
  drawBackground(ctx, t, ink) {
    const w = this.width;
    const h = this.height;

    if (ink === 'paper') {
      ctx.fillStyle = this.colors.paperCream;
      ctx.fillRect(0, 0, w, h);

      // Textura de grano de papel multiplicada
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(this.paperNoise, 0, 0, w, h);
      ctx.restore();

      // Cuadrícula azul de 60px
      this.drawGrid(ctx, 60, this.colors.paperGrid, this.colors.paperGridStrong);

    } else if (ink === 'blueprint') {
      ctx.fillStyle = this.colors.blueprintBlue;
      ctx.fillRect(0, 0, w, h);
      this.drawGrid(ctx, 60, this.colors.blueprintGrid, this.colors.blueprintGridStrong);

    } else if (ink === 'hologram') {
      ctx.fillStyle = this.colors.hologramBlack;
      ctx.fillRect(0, 0, w, h);
      this.drawGrid(ctx, 60, this.colors.hologramGrid, this.colors.hologramGridStrong);

      // Líneas de escaneo horizontales de 8px pitch
      ctx.save();
      ctx.fillStyle = 'rgba(69, 240, 221, 0.035)';
      for (let y = 0; y < h; y += 8) {
        ctx.fillRect(0, y, w, 2);
      }
      ctx.restore();
    }
  }

  drawGrid(ctx, step, colorLight, colorStrong) {
    ctx.lineWidth = 1;
    let colIndex = 0;
    for (let x = 0; x <= this.width; x += step) {
      ctx.strokeStyle = (colIndex % 5 === 0) ? colorStrong : colorLight;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.height);
      ctx.stroke();
      colIndex++;
    }

    let rowIndex = 0;
    for (let y = 0; y <= this.height; y += step) {
      ctx.strokeStyle = (rowIndex % 5 === 0) ? colorStrong : colorLight;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.width, y + 0.5);
      ctx.stroke();
      rowIndex++;
    }
  }

  // Líneas con perturbación de lápiz grafito (doble trazo)
  drawPencilLine(ctx, x1, y1, x2, y2, t, color = this.colors.graphite, width = 3) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';

    const wobble = Math.sin(t * 8 * Math.PI) * 1.4;

    // Trazo primario (90% grosor)
    ctx.lineWidth = width * 0.9;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2 + wobble;
    const midY = (y1 + y2) / 2 - wobble;
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();

    // Trazo secundario con mayor bamboleo (40% grosor)
    ctx.lineWidth = width * 0.4;
    ctx.beginPath();
    ctx.moveTo(x1 - wobble * 0.5, y1);
    ctx.quadraticCurveTo(midX + wobble * 1.5, midY - wobble * 1.2, x2 + wobble * 0.5, y2);
    ctx.stroke();

    ctx.restore();
  }

  // Trama diagonal de dibujo a lápiz (cross-hatching)
  drawHatching(ctx, x, y, w, h, spacing = 8, color = this.colors.bluePencil, angle = Math.PI / 4) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;

    const diag = Math.sqrt(w * w + h * h);
    for (let offset = -diag; offset < diag; offset += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset + diag * Math.cos(angle), y + diag * Math.sin(angle));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // ETAPA 1: PAPEL Y LÁPIZ (0s - 20s)
  // Tema: El Clima del Ego y la Exclusión en el SBL
  // ==========================================
  drawStagePaper(ctx, t) {
    const cx = this.width / 2;
    const cy = this.height / 2;

    // 0s - 4s (Compás 1-2): TÍTULO DE APERTURA KINÉTICO
    if (t < 4.0) {
      const enterSpring = this.criticallyDamped(t, 20);

      // Etiquetas pequeñas superior e inferior
      ctx.font = '600 24px "Geist", monospace';
      ctx.fillStyle = this.colors.bluePencil;
      ctx.letterSpacing = '0.22em';
      ctx.textAlign = 'center';
      ctx.fillText('COL. SAN BONIFACIO DE LAS LANZAS • GRADO 10', cx, cy - 130);

      ctx.fillStyle = this.colors.graphite;
      ctx.fillText('INVESTIGACIÓN INTERDISCIPLINAR • 2026', cx, cy + 150);

      // Título principal en Geist 900
      ctx.font = '900 68px "Geist", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EL SAQUE DE RECONCILIACIÓN', cx, cy + 20);

      // Trama diagonal dentro del título
      this.drawHatching(ctx, cx - 600, cy - 50, 1200, 90, 10, 'rgba(27, 62, 210, 0.22)');

      // Rieles de precisión arriba y abajo del texto
      const railWidth = 1420 * enterSpring;
      this.drawPencilLine(ctx, cx - railWidth / 2, cy - 90, cx + railWidth / 2, cy - 90, t, this.colors.graphite, 3.5);
      this.drawPencilLine(ctx, cx - railWidth / 2, cy + 90, cx + railWidth / 2, cy + 90, t, this.colors.graphite, 3.5);

      // Cota milimétrica derecha
      this.drawPencilLine(ctx, cx + 730, cy - 90, cx + 730, cy + 90, t, this.colors.bluePencil, 2);
      ctx.font = '700 18px "Geist", monospace';
      ctx.fillStyle = this.colors.bluePencil;
      ctx.fillText('180 MM', cx + 780, cy + 6);
    }

    // 4s - 8s (Compás 3-4): LA RED ALTA DEL VOLEIBOL TRADICIONAL (2.43m)
    else if (t < 8.0) {
      const subT = t - 4.0;
      const spring = this.criticallyDamped(subT, 16);

      // Red tradicional dibujada con cotas de altura
      const netY = cy + 120 - spring * 280;
      this.drawPencilLine(ctx, cx, cy + 240, cx, netY, t, this.colors.graphite, 5); // Poste

      // Red suspendida
      this.drawHatching(ctx, cx - 450, netY, 900, 140, 12, 'rgba(22, 22, 26, 0.4)');
      ctx.strokeRect(cx - 450, netY, 900, 140);

      // Vernier Caliper y Cota de Altura (2.43m)
      const caliperX = cx + 520;
      this.drawPencilLine(ctx, caliperX, cy + 240, caliperX, netY, t, this.colors.bluePencil, 2.5);
      this.drawPencilLine(ctx, caliperX - 25, netY, caliperX + 25, netY, t, this.colors.bluePencil, 2);
      this.drawPencilLine(ctx, caliperX - 25, cy + 240, caliperX + 25, cy + 240, t, this.colors.bluePencil, 2);

      const liveMeters = (spring * 2.43).toFixed(2);
      ctx.font = '800 32px "Geist", monospace';
      ctx.fillStyle = this.colors.bluePencil;
      ctx.textAlign = 'left';
      ctx.fillText(`H = ${liveMeters} M`, caliperX + 45, (netY + cy + 240) / 2);

      ctx.font = '600 20px "Geist", sans-serif';
      ctx.fillStyle = this.colors.graphite;
      ctx.fillText('RED TRADICIONAL: DOMINIO DEL SALTO Y FUERZA INDIVIDUAL', cx - 450, netY - 24);
    }

    // 8s - 14s (Compás 5-7): EVIDENCIA EMPÍRICA (n = 73, 47.9% EXCLUSIÓN)
    else if (t < 14.0) {
      const subT = t - 8.0;
      const spring = this.criticallyDamped(subT, 18);

      // Encabezado técnico
      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.bluePencil;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 02 — FORMULARIO DIAGNÓSTICO (n = 73 ESTUDIANTES)', cx, cy - 240);

      // Cuadro 1: 47.9% Exclusión
      const card1X = cx - 420;
      const cardY = cy - 140;
      const cardW = 380;
      const cardH = 280;

      ctx.strokeStyle = this.colors.graphite;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(card1X, cardY, cardW, cardH);
      this.drawHatching(ctx, card1X, cardY, cardW, cardH * spring, 14, 'rgba(27, 62, 210, 0.1)');

      const count1 = (spring * 47.9).toFixed(1);
      ctx.font = '900 64px "Geist", monospace';
      ctx.fillStyle = this.colors.graphite;
      ctx.textAlign = 'center';
      ctx.fillText(`${count1}%`, card1X + cardW / 2, cardY + 110);

      ctx.font = '700 20px "Geist", sans-serif';
      ctx.fillText('SE SIENTE EXCLUIDO', card1X + cardW / 2, cardY + 165);
      ctx.font = '500 16px "Geist", sans-serif';
      ctx.fillStyle = this.colors.bluePencil;
      ctx.fillText('Por su nivel técnico en voleibol', card1X + cardW / 2, cardY + 205);

      // Cuadro 2: 68.5% Sesgo a "Los Mejores"
      const card2X = cx + 40;
      ctx.strokeStyle = this.colors.graphite;
      ctx.strokeRect(card2X, cardY, cardW, cardH);
      this.drawHatching(ctx, card2X, cardY, cardW, cardH * spring, 14, 'rgba(27, 62, 210, 0.1)');

      const count2 = (spring * 68.5).toFixed(1);
      ctx.font = '900 64px "Geist", monospace';
      ctx.fillStyle = this.colors.graphite;
      ctx.fillText(`${count2}%`, card2X + cardW / 2, cardY + 110);

      ctx.font = '700 20px "Geist", sans-serif';
      ctx.fillText('EQUIPOS SESGADOS', card2X + cardW / 2, cardY + 165);
      ctx.font = '500 16px "Geist", sans-serif';
      ctx.fillStyle = this.colors.bluePencil;
      ctx.fillText('Se eligen solo a "los mejores"', card2X + cardW / 2, cardY + 205);
    }

    // 14s - 20s (Compás 8-10): CITAS DE VIOLENCIA RELACIONAL Y COLAPSO DE LA LÍNEA
    else {
      const subT = t - 14.0;
      const spring = this.criticallyDamped(subT, 14);

      // Citas textuales del documento
      ctx.font = '800 36px "Geist", sans-serif';
      ctx.fillStyle = this.colors.graphite;
      ctx.textAlign = 'center';

      ctx.fillText('“QUE ME GRITEN POR HACER LAS COSAS MAL”', cx, cy - 70);
      ctx.fillText('“QUE NO ME PASEN EL BALÓN”', cx, cy + 30);

      // Riel que aplasta las citas a partir de los 18s
      if (subT > 3.0) {
        const crushProgress = (subT - 3.0) / 3.0;
        const lineY = cy + 30 * (1 - crushProgress);
        this.drawPencilLine(ctx, cx - 750, lineY, cx + 750, lineY, t, this.colors.bluePencil, 6);
      }
    }
  }

  // ==========================================
  // ETAPA 2: BLUEPRINT AZUL TÉCNICO (20s - 40s)
  // Tema: Ruanda-Col 2016 y Biomecánica Sarajevo 2022
  // ==========================================
  drawStageBlueprint(ctx, t) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const subT = t - 20.0; // 0s a 20s dentro de blueprint

    // 20s - 26s: ANTECEDENTE HISTÓRICO (RUANDA vs COLOMBIA 2016)
    if (subT < 6.0) {
      const spring = this.criticallyDamped(subT, 18);

      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 03 — ANTECEDENTE HISTÓRICO DE PAZ (2016)', cx, cy - 240);

      ctx.font = '900 56px "Geist", sans-serif';
      ctx.fillStyle = this.colors.white;
      ctx.fillText('RUANDA vs. COLOMBIA', cx, cy - 140);

      ctx.font = '600 24px "Geist", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('PREMIO MUNDIAL PEACE AND SPORT', cx, cy - 90);

      // Medalla y dibujo técnico de reconciliación
      const medR = 110 * spring;
      ctx.strokeStyle = this.colors.white;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + 70, medR, 0, Math.PI * 2);
      ctx.stroke();

      // Círculo interior segmentado
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy + 70, medR * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '700 20px "Geist", monospace';
      ctx.fillText('ÉTICA DEL PERDÓN', cx, cy + 60);
      ctx.font = '500 16px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.fillText('EXCOMBATIENTES Y VÍCTIMAS', cx, cy + 90);
    }

    // 26s - 33s: MECANISMO DE DESCENSO DE RED A 1.15m (WORLD PARAVOLLEY)
    else if (subT < 13.0) {
      const localT = subT - 6.0;
      const spring = this.criticallyDamped(localT, 16);

      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 04 — NIVELACIÓN DEL ESPACIO FÍSICO (WPV REGULATION)', cx, cy - 240);

      // Mecanismo con engranajes girando a 120 BPM
      const gearAngle = t * Math.PI * 2;
      this.drawGear(ctx, cx - 260, cy - 60, 65, 16, gearAngle, this.colors.white);
      this.drawGear(ctx, cx - 145, cy - 60, 45, 10, -gearAngle * 1.6, this.colors.hologramCyan);

      // Cota de descenso de red: de 2.43m a 1.15m
      const targetHeight = 2.43 - spring * (2.43 - 1.15);
      ctx.font = '900 68px "Geist", monospace';
      ctx.fillStyle = this.colors.white;
      ctx.fillText(`${targetHeight.toFixed(2)} M`, cx + 220, cy - 40);

      ctx.font = '700 20px "Geist", sans-serif';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.fillText('ALTURA RED VOLEIBOL SENTADO', cx + 220, cy + 15);

      // Líneas de cancha reducida (10m x 6m)
      const courtW = 600 * spring;
      const courtH = 180;
      ctx.strokeStyle = this.colors.white;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx - courtW / 2, cy + 80, courtW, courtH);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 80);
      ctx.lineTo(cx, cy + 80 + courtH);
      ctx.stroke();

      ctx.font = '600 16px "Geist", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('CANCHA REDUCIDA: 10.00 M × 6.00 M (LÍNEA DE ATAQUE A 2.00 M)', cx, cy + 300);
    }

    // 33s - 40s: REGLA DE PELVIS EN CONTACTO CON EL SUELO Y TESELACIÓN VORONOI
    else {
      const localT = subT - 13.0;
      const spring = this.criticallyDamped(localT, 18);

      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 05 — BIOMECÁNICA SARAJEVO 2022 (GIRARD ET AL., 2014)', cx, cy - 240);

      // Placa de contacto en suelo
      const plateY = cy + 100;
      ctx.strokeStyle = this.colors.hologramCyan;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 350, plateY, 700, 40);

      // Curvas de estrés y regla pelvis
      ctx.font = '900 36px "Geist", sans-serif';
      ctx.fillStyle = this.colors.white;
      ctx.fillText('PELVIS EN CONTACTO PERMANENTE', cx, cy - 110);

      ctx.font = '700 26px "Geist", monospace';
      ctx.fillStyle = '#f87171'; // Rojo vector anulado
      ctx.fillText('FUERZA VERTICAL DE SALTO: Fy = 0.00 N', cx, cy - 50);

      ctx.fillStyle = this.colors.hologramCyan;
      ctx.fillText('DESPLAZAMIENTO POR ARRASTRE DE BRAZOS', cx, cy);

      // Hexágonos de cobertura mutua Cavedon et al. 2024
      const hexSpread = spring * 160;
      [-hexSpread, 0, hexSpread].forEach((hx, idx) => {
        this.drawPolygon(ctx, cx + hx, plateY - 14, 52, 6, Math.PI / 6, this.colors.white);
      });

      ctx.font = '600 18px "Geist", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('INTERDEPENDENCIA TÁCTICA: COBERTURA HEXAGONAL COMPARTIDA', cx, cy + 200);
    }
  }

  // ==========================================
  // ETAPA 3: HOLOGRAMA NEGRO Y CIAN (40s - 60s)
  // Tema: Dialéctica de Hegel (Geist) y Saque de Reconciliación
  // ==========================================
  drawStageHologram(ctx, t) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const subT = t - 40.0; // 0s a 20s dentro de holograma

    // 40s - 47s: DIALÉCTICA HEGELIANA (TESIS x ANTÍTESIS -> SÍNTESIS)
    if (subT < 7.0) {
      const spring = this.criticallyDamped(subT, 16);

      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 06 — FILOSOFÍA DIALÉCTICA (G.W.F. HEGEL • REDDING, 2025)', cx, cy - 240);

      // Tríada dialéctica
      ctx.font = '800 32px "Geist", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('TESIS: COMPETENCIA DEL EGO', cx - 380, cy - 90);
      ctx.fillText('ANTÍTESIS: RESTRICCIÓN FÍSICA', cx + 380, cy - 90);

      // Conectores hacia la síntesis
      ctx.strokeStyle = this.colors.hologramCyan;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 380, cy - 60);
      ctx.lineTo(cx, cy + 20);
      ctx.lineTo(cx + 380, cy - 60);
      ctx.stroke();

      // Síntesis central (Geist)
      const glowR = 140 * spring;
      ctx.strokeRect(cx - glowR, cy + 20 - 45, glowR * 2, 90);

      ctx.font = '900 48px "Geist", sans-serif';
      ctx.fillStyle = this.colors.white;
      ctx.fillText('SÍNTESIS: GEIST', cx, cy + 45);

      ctx.font = '700 18px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.fillText('ESPÍRITU COLECTIVO Y AUTORREGULACIÓN', cx, cy + 85);
    }

    // 47s - 54s: RED HOLOGRÁFICA GEIST (6 JUGADORES INTERCONECTADOS)
    else if (subT < 14.0) {
      const localT = subT - 7.0;
      const spring = this.criticallyDamped(localT, 18);

      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 07 — RED DE INTERDEPENDENCIA TÁCTICA', cx, cy - 240);

      // 6 Nodos interconectados en tensor de luz
      const nodes = [
        { x: cx - 300, y: cy - 70 },
        { x: cx - 120, y: cy - 120 },
        { x: cx + 120, y: cy - 120 },
        { x: cx + 300, y: cy - 70 },
        { x: cx - 180, y: cy + 90 },
        { x: cx + 180, y: cy + 90 }
      ];

      // Líneas de conexión de red viva
      ctx.strokeStyle = this.colors.hologramCyan;
      ctx.lineWidth = 1.8;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      // Dibujar nodos con núcleo blanco
      nodes.forEach((n, idx) => {
        const r = 18 * spring;
        ctx.fillStyle = this.colors.hologramCyan;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.white;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      });

      // El Balón viajando por el tensor
      const ballProgress = (localT % 2.0) / 2.0;
      const bX = cx - 280 + ballProgress * 560;
      const bY = cy - 80 - Math.sin(ballProgress * Math.PI) * 120;
      ctx.fillStyle = this.colors.white;
      ctx.beginPath();
      ctx.arc(bX, bY, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '800 24px "Geist", sans-serif';
      ctx.fillStyle = this.colors.white;
      ctx.fillText('EL CUERPO OBLIGA A LA MENTE A COOPERAR', cx, cy + 210);
    }

    // 54s - 60s: DATO DE ESPERANZA SBL (71.2%) Y CRÉDITOS FINALES
    else {
      const localT = subT - 14.0;
      const spring = this.criticallyDamped(localT, 18);

      ctx.font = '700 22px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.textAlign = 'center';
      ctx.fillText('FIG. 08 — TRANSFORMACIÓN ESCOLAR (COLEGIO SAN BONIFACIO)', cx, cy - 240);

      // Cifra monumental 71.2%
      const finalCount = (spring * 71.2).toFixed(1);
      ctx.font = '900 92px "Geist", monospace';
      ctx.fillStyle = this.colors.white;
      ctx.fillText(`${finalCount}%`, cx, cy - 80);

      ctx.font = '700 26px "Geist", sans-serif';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.fillText('DISPUESTO A JUGAR VOLEIBOL SENTADO EN EL COLEGIO', cx, cy - 10);

      // Tarjeta de cierre de créditos
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 520, cy + 40, 1040, 160);

      ctx.font = '800 28px "Geist", sans-serif';
      ctx.fillStyle = this.colors.white;
      ctx.fillText('EL SAQUE DE RECONCILIACIÓN', cx, cy + 90);

      ctx.font = '600 20px "Geist", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('SOFÍA LARA MORA • JUAN DIEGO NÚÑEZ • MARTÍN QUIÑONES', cx, cy + 130);

      ctx.font = '500 16px "Geist", monospace';
      ctx.fillStyle = this.colors.hologramCyan;
      ctx.fillText('ASESOR: JUAN DAVID RODRÍGUEZ CERÓN • SBL BILINGÜE 2026', cx, cy + 165);
    }
  }

  // ==========================================
  // TRANSICIONES LIMPIAS (Sin disolvencias)
  // ==========================================
  drawTransitions(ctx, t) {
    const w = this.width;
    const h = this.height;

    // Transición 1: 19.6s a 20.0s (Hard Edge Flood de Papel a Blueprint)
    if (t >= 19.6 && t < 20.0) {
      const p = (t - 19.6) / 0.4;
      const floodW = w * p;
      ctx.fillStyle = this.colors.blueprintBlue;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(floodW, 0);
      ctx.lineTo(floodW - 120, h);
      ctx.lineTo(0, h);
      ctx.fill();
    }

    // Transición 2: 39.6s a 40.0s (Línea de escaneo de Blueprint a Holograma)
    if (t >= 39.6 && t < 40.0) {
      const p = (t - 39.6) / 0.4;
      const scanY = h * p;
      ctx.fillStyle = this.colors.hologramBlack;
      ctx.fillRect(0, 0, w, scanY);

      ctx.strokeStyle = this.colors.hologramCyan;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();
    }
  }

  // ==========================================
  // SELLOS TÉCNICOS PERMANENTES EN ESQUINAS
  // ==========================================
  drawCornerLabels(ctx, t, beat, ink) {
    const textColor = ink === 'paper' ? this.colors.graphite : this.colors.white;
    const accentColor = ink === 'paper' ? this.colors.bluePencil : this.colors.hologramCyan;

    ctx.save();
    ctx.font = '700 17px "Geist", monospace';
    ctx.letterSpacing = '0.12em';

    // Superior Izquierda: FIGURA Y SECCIÓN
    ctx.textAlign = 'left';
    ctx.fillStyle = accentColor;
    let sectionName = '01 — DRAFT';
    if (t >= 8 && t < 20) sectionName = '02 — EXCLUSION DATA';
    else if (t >= 20 && t < 33) sectionName = '03 — BLUEPRINT CAD';
    else if (t >= 33 && t < 40) sectionName = '04 — BIOMECHANICS';
    else if (t >= 40 && t < 54) sectionName = '05 — GEIST NETWORK';
    else if (t >= 54) sectionName = '06 — RECONCILIATION';

    ctx.fillText(`FIG. ${sectionName}`, 60, 52);

    // Superior Derecha: 120 BPM • 60 FPS • 0 CUTS
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.fillText('120 BPM • 60 FPS • 0 CUTS', this.width - 60, 52);

    // Inferior Izquierda: SBL PROYECTO
    ctx.textAlign = 'left';
    ctx.fillText('SBL • RECONCILIATION SHOWREEL', 60, this.height - 44);

    // Inferior Derecha: BEAT XX / 120
    ctx.textAlign = 'right';
    ctx.fillStyle = accentColor;
    const beatClamped = Math.min(120, beat + 1);
    ctx.fillText(`BEAT ${beatClamped.toString().padStart(3, '0')} / 120`, this.width - 60, this.height - 44);

    ctx.restore();
  }

  // Utilitarios geométricos
  drawGear(ctx, x, y, radius, teeth, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    const toothDepth = radius * 0.16;
    const numPoints = teeth * 2;
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const r = (i % 2 === 0) ? radius + toothDepth : radius - toothDepth;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Eje central
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPolygon(ctx, x, y, radius, sides, angle, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = angle + (i / sides) * Math.PI * 2;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

window.MotionEngine = MotionEngine;
