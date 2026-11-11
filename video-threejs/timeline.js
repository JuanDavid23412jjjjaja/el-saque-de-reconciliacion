/**
 * Timeline - Guion Maestro y Orquestación Determinista
 * Proyecto: "El Saque de Reconciliación" - Colegio San Bonifacio de las Lanzas
 * Duración total: 225 segundos (3 minutos y 45 segundos)
 * 5 Actos sincronizados con cámaras, narración por voz de Sofía, Juan Diego y Martín, y HUD de datos.
 */

class Timeline {
  constructor() {
    this.totalDuration = 225; // 3 min 45 seg

    // Definición de los 5 Actos
    this.acts = [
      {
        id: 1,
        name: 'Acto I: La Cancha Fragmentada',
        subtitle: 'El Clima del Ego y la Exclusión en el Colegio San Bonifacio',
        startTime: 0,
        endTime: 45,
        narrator: 'Sofía Lara Mora'
      },
      {
        id: 2,
        name: 'Acto II: El Partido de la Historia',
        subtitle: 'Ruanda vs. Colombia (2016) y la Ética del Perdón',
        startTime: 45,
        endTime: 90,
        narrator: 'Juan Diego Núñez'
      },
      {
        id: 3,
        name: 'Acto III: Laboratorio Biomecánico',
        subtitle: 'Mundial Sarajevo 2022: Pelvis en el Suelo e Interdependencia',
        startTime: 90,
        endTime: 150,
        narrator: 'Martín Quiñones'
      },
      {
        id: 4,
        name: 'Acto IV: Dialéctica en Movimiento',
        subtitle: 'De la Competencia Destructiva al Espíritu Colectivo (Geist)',
        startTime: 150,
        endTime: 195,
        narrator: 'Juan Diego Núñez'
      },
      {
        id: 5,
        name: 'Acto V: El Saque de Reconciliación',
        subtitle: 'Transformación Escolar: En la Cancha Jugamos Todos',
        startTime: 195,
        endTime: 225,
        narrator: 'Sofía Lara Mora'
      }
    ];

    // Cues de narración con timestamp, locutor, texto en español y tarjeta HUD
    this.narrationCues = [
      // ACTO I (0 - 45s) - Sofía Lara Mora
      {
        start: 0,
        end: 14,
        speaker: 'Sofía',
        text: 'Bienvenidos a "El Saque de Reconciliación". En el Colegio San Bonifacio de las Lanzas, el deporte debería ser un puente de encuentro. Sin embargo, en nuestras canchas cotidianas se evidencia una cultura dominada por el ego.',
        badge: 'PROBLEMA LOCAL • SBL IBAGUÉ',
        stat: null
      },
      {
        start: 14,
        end: 29,
        speaker: 'Sofía',
        text: 'Aplicamos una encuesta rigurosa a setenta y tres estudiantes de nuestro colegio. Los resultados son contundentes: el 47.9% se ha sentido excluido en el voleibol por su nivel técnico, y el 68.5% afirma que los equipos se arman priorizando únicamente a los más hábiles.',
        badge: 'EVIDENCIA EMPÍRICA (n = 73)',
        stat: { title: '47.9% EXCLUSIÓN', desc: 'Se siente marginado en la cancha', alt: '68.5% eligen solo a "los mejores"' }
      },
      {
        start: 29,
        end: 45,
        speaker: 'Sofía',
        text: 'En los descansos y clases surgen quejas constantes: "que me griten por fallar" y "que no me pasen el balón". La red alta y la fuerza del salto permiten que dos jugadores acaparen el partido, dejando al resto en la sombra de la frustración.',
        badge: 'VIOLENCIA RELACIONAL',
        stat: { title: 'FRUSTRACIÓN', desc: '"Que me griten por hacer las cosas mal"', alt: '"Que no me pasen el balón"' }
      },

      // ACTO II (45 - 90s) - Juan Diego Núñez
      {
        start: 45,
        end: 62,
        speaker: 'Juan Diego',
        text: 'Frente a esta exclusión local, encontramos una lección histórica en el deporte adaptado: el partido de voleibol sentado entre Ruanda y Colombia en 2016, galardonado mundialmente por Peace and Sport.',
        badge: 'ANTECEDENTE HISTÓRICO • 2016',
        stat: { title: 'PEACE & SPORT', desc: 'Ruanda vs. Colombia (2016)', alt: 'De adversarios de guerra a compañeros' }
      },
      {
        start: 62,
        end: 78,
        speaker: 'Juan Diego',
        text: 'En aquella cancha, excombatientes y víctimas del conflicto armado demostraron que el perdón no es una teoría pasiva, sino un acto de liderazgo ético y una decisión relacional encarnada en el cuerpo.',
        badge: 'ÉTICA DEL PERDÓN',
        stat: { title: 'ÉTICA DE LA ALTERIDAD', desc: 'Reconocer al otro como indispensable', alt: 'Reconciliación activa en el deporte' }
      },
      {
        start: 78,
        end: 90,
        speaker: 'Juan Diego',
        text: 'Cuando la red desciende a 1.15 metros y los deportistas se sientan en el suelo, las jerarquías de la altura se desvanecen. Ningún jugador puede vencer desde el aislamiento; la paz se construye punto a punto.',
        badge: 'NIVELACIÓN DEL ESPACIO',
        stat: { title: 'RED A 1.15 M', desc: 'Anulación de la ventaja del salto vertical', alt: 'Cancha reducida a 10m x 6m' }
      },

      // ACTO III (90 - 150s) - Martín Quiñones
      {
        start: 90,
        end: 110,
        speaker: 'Martín',
        text: 'Entremos al laboratorio biomecánico a través del Mundial de Voleibol Sentado Sarajevo 2022. La regla fundamental de World ParaVolley exige que la pelvis permanezca en contacto estricto con el suelo en cada contacto con el balón.',
        badge: 'CIENCIA DEL DEPORTE • SARAJEVO 2022',
        stat: { title: 'REGLA PELVIS EN SUELO', desc: 'World ParaVolley (Girard et al., 2014)', alt: 'Fuerza vertical de salto anulada' }
      },
      {
        start: 110,
        end: 130,
        speaker: 'Martín',
        text: 'Al anular la fuerza de salto vertical, el desplazamiento depende exclusivamente del arrastre y el impulso coordinado de brazos. Como lo demostraron Cavedon y colaboradores en 2024, la eficacia del saque y la recepción exige cobertura hexagonal compartida.',
        badge: 'BIOMECÁNICA DEL ARRASTRE',
        stat: { title: 'SAQUE Y RECEPCIÓN', desc: 'Cavedon et al. (2024) Frontiers in Sports', alt: 'Interdependencia táctica estructural' }
      },
      {
        start: 130,
        end: 150,
        speaker: 'Martín',
        text: 'Si no puedes cubrir la cancha tú solo, la comunicación no verbal se vuelve vital: miradas, anticipación postural y señales manuales. La táctica inclusiva no es condescendencia: es una necesidad estructural del alto rendimiento.',
        badge: 'COMUNICACIÓN NO VERBAL',
        stat: { title: 'EFICACIA COLECTIVA', desc: 'Cobertura mutua en milisegundos', alt: 'El cuerpo obliga a la mente a cooperar' }
      },

      // ACTO IV (150 - 195s) - Juan Diego Núñez
      {
        start: 150,
        end: 172,
        speaker: 'Juan Diego',
        text: 'Aquí se revela la dialéctica de Hegel: la Tesis de la competencia individualista choca con la Antítesis de la restricción física y la exclusión. Esta contradicción se supera en una Síntesis superior: el espíritu colectivo o Geist.',
        badge: 'FILOSOFÍA DIALÉCTICA • HEGEL',
        stat: { title: 'TESIS + ANTÍTESIS', desc: 'Competencia vs Restricción Física', alt: 'Síntesis: Espíritu Colectivo (Geist)' }
      },
      {
        start: 172,
        end: 195,
        speaker: 'Juan Diego',
        text: 'En el voleibol tradicional, el error provoca reclamo y hostilidad. En el voleibol sentado, el error ajeno exige autorregulación emocional y relevo táctico inmediato: cubrir la espalda del compañero es la única forma de salvar el punto.',
        badge: 'AUTORREGULACIÓN EMOCIONAL',
        stat: { title: 'SOPORTE AL ERROR', desc: 'Del reclamo hostil al respaldo corporal', alt: 'Eficacia colectiva sobre el ego' }
      },

      // ACTO V (195 - 225s) - Sofía Lara Mora
      {
        start: 195,
        end: 212,
        speaker: 'Sofía',
        text: 'Regresamos a nuestra cancha del San Bonifacio. Nuestra encuesta arrojó una cifra esperanzadora: el 71.2% de los estudiantes encuestados está dispuesto a jugar voleibol sentado como alternativa de inclusión.',
        badge: 'PROPUESTA PEDAGÓGICA • SBL',
        stat: { title: '71.2% DISPUESTO', desc: 'A probar el voleibol sentado en el SBL', alt: 'Hacia una cancha sin exclusión' }
      },
      {
        start: 212,
        end: 225,
        speaker: 'Sofía',
        text: 'Este es el Saque de Reconciliación: demostrar que en la cancha cabemos todos, y que la verdadera victoria ocurre cuando jugamos juntos con empatía, técnica y dignidad.',
        badge: 'CONCLUSIÓN • EN LA CANCHA JUGAMOS TODOS',
        stat: { title: 'EL SAQUE DE RECONCILIACIÓN', desc: 'Sofía Lara • Juan Diego Núñez • Martín Quiñones', alt: 'Profesor: Juan David Rodríguez Cerón • 2026' }
      }
    ];
  }

  // Obtiene el estado determinista en cualquier segundo t (0 a 225s)
  getStateAt(t) {
    const clampedT = Math.max(0, Math.min(this.totalDuration, t));

    // Determinar Acto actual
    const currentAct = this.acts.find(a => clampedT >= a.startTime && clampedT < a.endTime) || this.acts[this.acts.length - 1];

    // Determinar Cue de narración actual
    const currentCue = this.narrationCues.find(c => clampedT >= c.start && clampedT < c.end) || this.narrationCues[this.narrationCues.length - 1];

    // 1. Configuración de cámara según el acto y progreso
    const cameraState = this.computeCameraKeyframe(clampedT, currentAct.id);

    // 2. Estado de voleibol sentado (la red baja a partir del Acto II a los 65s)
    const isSittingVolleyball = clampedT >= 65;

    // 3. Trayectoria determinista del balón en parábola
    const ballTrajectory = this.computeBallTrajectory(clampedT, currentAct.id, isSittingVolleyball);

    // 4. Overlays tácticos según el acto
    const showIsolation = clampedT >= 15 && clampedT < 45; // Acto I: sombra de exclusión
    const showTacticalHexagons = clampedT >= 105 && clampedT < 155; // Acto III: hexágonos de Sarajevo
    const showGeist = clampedT >= 165 && clampedT <= 225; // Acto IV y V: red dorada de Geist

    return {
      t: clampedT,
      progress: clampedT / this.totalDuration,
      currentAct,
      currentCue,
      cameraPos: cameraState.pos,
      cameraLookAt: cameraState.lookAt,
      isSittingVolleyball,
      ballTrajectory,
      showIsolation,
      showTacticalHexagons,
      showGeist
    };
  }

  computeCameraKeyframe(t, actId) {
    const pos = new THREE.Vector3();
    const lookAt = new THREE.Vector3(0, 1.2, 0);

    if (actId === 1) {
      // Acto I: Inicio dramático orbitando la cancha alta del SBL
      const angle = t * 0.08 + 0.3;
      pos.set(Math.sin(angle) * 14, 6.5 + Math.sin(t * 0.2) * 1.5, Math.cos(angle) * 14);
      lookAt.set(-1.5, 1.4, 0);
    } else if (actId === 2) {
      // Acto II: Transición suave hacia la red bajando (corte horizontal Ruanda-Colombia)
      const subT = (t - 45) / 45;
      pos.set(-8 + subT * 12, 4.2 - subT * 1.2, 8 - subT * 3);
      lookAt.set(0, 1.15, 0);
    } else if (actId === 3) {
      // Acto III: Plano táctico cenital / 45 grados estilo telemetría deportiva Sarajevo
      const subT = (t - 90) / 60;
      pos.set(0 + Math.sin(subT * Math.PI) * 2, 11 - Math.cos(subT * Math.PI) * 1.5, 10);
      lookAt.set(0, 0.4, 0);
    } else if (actId === 4) {
      // Acto IV: Plano lateral dividido (Tesis vs Antítesis)
      const subT = (t - 150) / 45;
      pos.set(Math.cos(subT * 2) * 12, 5.2, Math.sin(subT * 2) * 7);
      lookAt.set(0, 0.8, 0);
    } else {
      // Acto V: Plano majestuoso en atardecer, alejándose con todo el equipo unido
      const subT = (t - 195) / 30;
      pos.set(0, 6 + subT * 3.5, 13 + subT * 4.5);
      lookAt.set(0, 0.6, 0);
    }

    return { pos, lookAt };
  }

  computeBallTrajectory(t, actId, isSitting) {
    const traj = { x: 0, y: 1.5, z: 0 };
    const netY = isSitting ? 1.15 : 2.43;

    // Rallies continuos calculados matemáticamente por ciclos de 4 segundos
    const cycleTime = 4.0;
    const progressInCycle = (t % cycleTime) / cycleTime; // 0.0 a 1.0

    // Trayectoria parabólica de lado A a lado B y viceversa
    const direction = Math.floor(t / cycleTime) % 2 === 0 ? 1 : -1;
    const startX = direction > 0 ? -6.5 : 6.5;
    const endX = direction > 0 ? 5.5 : -5.5;

    traj.x = startX + (endX - startX) * progressInCycle;
    traj.z = Math.sin(t * 1.5) * 1.8;

    // Altura: Arco de saque / remate sobre la red
    const peakHeight = netY + (isSitting ? 1.2 : 1.8);
    const parabola = 4 * progressInCycle * (1 - progressInCycle);
    traj.y = Math.max(0.25, (isSitting ? 0.35 : 0.9) + parabola * peakHeight);

    return traj;
  }
}

window.Timeline = Timeline;
