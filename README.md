# El Saque de Reconciliación · Animación y Modelado 3D (Three.js)

Proyecto de investigación y divulgación de **Grado 10°** del **Colegio San Bonifacio de las Lanzas (SBL)**.
**Dirección:** Juan David Rodríguez Cerón  
**Investigadores Estudiantiles:**
- **Sofía Lara Mora** (#4 · Capitana & Coordinadora)
- **Juan Diego Núñez** (#7 · Rematador & Análisis Biomecánico)
- **Martín Quiñones** (#10 · Armador & Estratega)

---

## 🏐 Resumen del Proyecto

Este proyecto aborda la transición biomecánica y dialéctica desde el voleibol tradicional excluyente (con red a 2.43 m y monopolio de altura) hacia el **voleibol sentado y adaptado**, promoviendo la inclusión escolar mediante gráficos 3D en tiempo real generados 100% por código en **Three.js**.

---

## 📂 Estructura del Repositorio

- **`personajes-threejs/`**: Laboratorio 3D y visualizador interactivo de personajes:
  - Modelado low-poly facetado con sombras nítidas (`flatShading: true`).
  - Rostros expresivos (ojos con esclera, iris, pupila, reflejo y parpadeo; bocas con sincronización labial).
  - Uniformes deportivos oficiales del Colegio San Bonifacio de las Lanzas (nombres y dorsales).
  - **Silla de ruedas deportiva 3D (*sport wheelchair*)** con ángulo *camber* de 12°, plataforma de reposapiés y postura natural de 90°.
  - Modos de pose: De Pie, Silla de Ruedas / Sentado, Acción de Remate.
  
- **`video-personajes-10s/`**: Producción cinematográfica del video de 10 segundos:
  - Animación de cámara orbital, *whip dolly* y plano heroico a ras de piso.
  - Voces en español generadas para cada estudiante con sincronización de labios y gesticulación.
  - Balón Mikasa tricolor en vuelo con estela cometa luminosa y remate de potencia.
  - Marcadores gráficos deportivos (*lower-thirds*), ecualizador de voz y telemetría biomecánica.
  - Video master renderizado en `out/El_Saque_de_Reconciliacion_Personajes.mp4` (1080p @ 24 fps).

- **`video-3min/`**: Video final de 3 minutos (1080p @ 30 fps) con los tres estudiantes interactuando:
  - Seis capítulos: la pregunta, el problema, el partido Ruanda–Colombia 2016, la regla, la jugada y la oportunidad.
  - Motion design: logo animado del colegio, título cinético, datos de la encuesta, etiquetas ancladas al 3D y créditos.
  - Voces neuronales en español con sincronía labial, subtítulos palabra a palabra, música y efectos sintetizados.
  - Video master en `out/El_Saque_de_Reconciliacion_3min.mp4` (ver `video-3min/README.md`).
  - Guía paso a paso para que otro modelo de IA lo reproduzca: `video-3min/GUIA_PARA_MODELOS.md`.

- **`video-opuscar/`**: Demostración cinemática inicial con dirección estilizada y telestrator 2D proyectado.

---

## 🚀 Cómo ejecutar localmente

1. Iniciar un servidor HTTP local en la raíz del proyecto:
   ```bash
   python -m http.server 8095
   ```
2. Abrir en tu navegador:
   - **Visualizador de Personajes:** [http://localhost:8095/personajes-threejs/index.html](http://localhost:8095/personajes-threejs/index.html)
   - **Video Cinemático Interactivo:** [http://localhost:8095/video-personajes-10s/index.html](http://localhost:8095/video-personajes-10s/index.html)
