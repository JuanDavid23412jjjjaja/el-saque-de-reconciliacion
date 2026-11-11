# El Saque de Reconciliación · Video de 3 minutos

Video final del proyecto (1080p · 30 fps · 180 s): `out/El_Saque_de_Reconciliacion_3min.mp4`

Sofía, Juan Diego y Martín (modelos de `personajes-threejs/`) presentan la investigación actuando
entre ellos: caminan, se pasan el balón, recrean la exclusión, se sientan y juegan un punto completo
de voleibol sentado.

> ¿Quieres que otro modelo de IA lo reproduzca o lo adapte? Lee [GUIA_PARA_MODELOS.md](GUIA_PARA_MODELOS.md).

## Capítulos

| # | Capítulo | Qué pasa |
|---|----------|----------|
| – | Logo SBL | Animación de apertura con el logo del colegio |
| 01 | La pregunta | Presentación de los tres y título |
| 02 | El problema | Red a 2,43 m, la exclusión actuada y la encuesta (47,9 % · 68,5 %) |
| 03 | El partido de la historia | Ruanda – Colombia 2016, premio Peace and Sport, Sarajevo 2022 |
| 04 | La regla | Pelvis en el suelo, red a 1,15 m, cancha de 10 × 6 m |
| 05 | La jugada | Punto completo contra un equipo holográfico + tesis/antítesis/síntesis |
| 06 | La oportunidad | 71,2 % quiere probarlo · «En la cancha jugamos todos» |
| – | Créditos | Logo, estudiantes, docente, áreas y fuentes |

## Archivos

- `build_audio.py` — guion, voces neuronales (edge-tts), música y efectos sintetizados, mezcla.
  Escribe `timeline.js`, la única fuente de tiempos para la animación y el audio.
- `rig.js` — poses, caminata, gestos al hablar, mirada, parpadeo y sincronía labial.
- `world.js` — coliseo, cancha transformable (18 × 9 → 10 × 6), red de altura variable, pantalla LED.
- `story.js` — coreografía de los tres personajes, balón y cámaras.
- `overlay.js` — motion design 2D (logo, títulos, datos, etiquetas ancladas al 3D, subtítulos, créditos).
- `render.py` — render determinista con Chromium (Playwright) + ffmpeg.

## Regenerar

```bash
python build_audio.py all
```

```bash
python render.py video 4
```

Requiere Python 3.12 con `numpy`, `scipy`, `edge-tts` y `playwright`, además de `ffmpeg`.
Para verlo en el navegador: servir esta carpeta (`python -m http.server 8095`) y abrir `index.html`.

## Nota de fidelidad

En la jugada los personajes juegan sentados en el piso (no en silla de ruedas), porque la regla
central del voleibol sentado que cita la investigación es mantener la pelvis en contacto con el suelo.
