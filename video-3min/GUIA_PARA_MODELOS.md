# Guía para que otro modelo genere este video

Esta guía explica, paso a paso, cómo se produjo `out/El_Saque_de_Reconciliacion_3min.mp4` y cómo
puede reproducirlo o adaptarlo cualquier agente de código (Claude Opus, Codex, Gemini en Antigravity,
u otro) que pueda **leer y escribir archivos, ejecutar comandos y mirar imágenes**.

Hay dos formas de usarla:

- **Reproducir:** clonar el repo y ejecutar dos comandos (sección 2).
- **Recrear o adaptar:** darle al modelo el prompt maestro (sección 9) y dejar que siga el método
  (secciones 3 a 8). El código de esta carpeta sirve como implementación de referencia.

---

## 1. Qué se construye

Un video de 180 s exactos, 1920×1080 a 30 fps, generado 100 % por código:

| Capa | Tecnología | Archivo |
|------|------------|---------|
| Guion, voces, música, efectos, mezcla | Python (`edge-tts`, `numpy`, `scipy`) + `ffmpeg` | `build_audio.py` |
| Línea de tiempo compartida | JSON exportado como módulo JS | `timeline.js` (generado) |
| Personajes 3D | Three.js r128, low-poly | `characters.js` (copiado de `personajes-threejs/`) |
| Actuación (poses, caminata, cara) | JS | `rig.js` |
| Coliseo, cancha, red, balón, efectos | JS | `world.js` |
| Coreografía, balón y cámaras | JS | `story.js` |
| Motion design 2D | Canvas 2D sobre el WebGL | `overlay.js` |
| Render offline | Playwright (Chromium) + `ffmpeg` | `render.py` |

No se usa ningún editor de video, ni assets externos salvo el logo (`assets/sbl_logo.png`) y las
fuentes de Google Fonts (Barlow Condensed, Inter, JetBrains Mono).

---

## 2. Reproducir tal cual

Requisitos: Python 3.12, `ffmpeg` en el PATH, conexión a internet (voces y fuentes).

```bash
pip install numpy scipy edge-tts playwright
```

```bash
playwright install chromium
```

Desde `video-3min/`:

```bash
python build_audio.py all
```

```bash
python render.py video 4
```

El primer comando genera las voces, escribe `timeline.js` y mezcla `out/mix.wav` (2–3 min).
El segundo renderiza los 5400 fotogramas en 4 procesos y une el audio (unos 15 min con GPU integrada).

Para revisar sin renderizar todo:

```bash
python render.py sheet prueba 10.5 35 48.5 68.8 100.8 131.7 146 163.9 171
```

Eso guarda una hoja de contactos 3×3 en `out/shots/sheet_prueba.jpg`.

Si el archivo final supera 100 MB (límite de GitHub), recomprimir:

```bash
ffmpeg -i out/master.mp4 -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 192k -movflags +faststart out/final.mp4
```

---

## 3. La idea central: todo es función pura del tiempo

`window.seek(t)` dibuja el fotograma del segundo `t` sin depender de ningún fotograma anterior.
No hay `requestAnimationFrame`, ni física acumulada, ni `Math.random()`.

Esto es lo que hace posible todo lo demás:

- Renderizar por tramos en paralelo y unirlos sin saltos.
- Pedir un fotograma suelto de cualquier segundo para revisarlo.
- Que el video salga idéntico cada vez.

Reglas que se derivan:

- Aleatoriedad solo con `hash(n)` determinista (`lib.js`).
- Parpadeo, respiración y temblor de cámara son senos o ruido de `t`.
- El rastro del balón se calcula evaluando su posición en `t - k·dt`, no guardando historial.
- Las posiciones "en la mano" del balón se pre-resuelven posando al personaje en el instante exacto.

---

## 4. Orden de construcción (y por qué)

### Paso 1 — Leer la fuente y escribir el guion

Leer el documento del proyecto (`Proyecto 2 - Periodo 3 - 2026.docx`) y sacar de ahí **todas** las
cifras y afirmaciones. No inventar datos. Lo único ficticio del video es el marcador 24:24 de la
jugada, y está declarado en el README.

El guion vive en `SCENES` dentro de `build_audio.py`. Cada escena es una lista de:

- `L(id, quién, texto, tts=...)` — una línea de diálogo. `tts` es el texto que se pronuncia cuando
  difiere del subtítulo (números escritos en letras, «Pis and Sport» para que la voz en español
  pronuncie bien *Peace and Sport*).
- `B(nombre, duración, marks={...}, lines=[...])` — un momento de acción sin diálogo, con marcas
  internas (salto, golpe, aterrizaje) y gritos cortos colocados en un instante fijo.

Presupuesto: el español de las voces neuronales va a unas 2,7 palabras por segundo. Para 180 s
caben unas 330 palabras de diálogo más unos 45 s de acción, transiciones y créditos.

### Paso 2 — Generar voces y medir

`python build_audio.py tts` genera cada línea con `edge-tts` pidiendo `boundary="WordBoundary"`,
lo que devuelve el instante de cada palabra. Con eso se obtiene:

- la duración real de cada línea,
- los tiempos por palabra (subtítulos y disparo de gráficos),
- la envolvente de volumen a 60 Hz (sincronía labial).

Voces usadas: `es-CO-SalomeNeural` (Sofía), `es-CO-GonzaloNeural` (Martín), `es-MX-JorgeNeural`
(Juan Diego), con un leve aumento de tono para que suenen más jóvenes.

### Paso 3 — Calcular la línea de tiempo

`python build_audio.py layout` recorre las escenas sumando pausas, líneas y momentos de acción, y
escribe `timeline.js` con cuatro tablas: `scenes`, `beats`, `marks` y `cues`.

- La última escena (créditos) tiene duración `None` y se estira hasta completar 180 s. Si quedan
  menos de 9 s, el script falla y hay que recortar el guion.
- `WORD_MARKS` crea marcas a partir de palabras dichas: `"p3_pct": ("p3", "cuarenta", 0, 0)` es
  el instante en que Sofía dice «cuarenta», y ahí arranca el contador del 47,9 %.

**Toda la animación y todos los efectos de sonido se referencian por nombre** (`M('spike')`,
`C('r3').t0`), nunca con segundos escritos a mano. Si se cambia una frase, todo se reacomoda solo.

### Paso 4 — Música, efectos y mezcla

`python build_audio.py mix` sintetiza todo con `numpy`:

- 100 BPM, de modo que 75 compases son exactamente 180 s.
- Una sección musical por capítulo (progresión, batería y arpegio distintos), alineada al compás
  más cercano del inicio de cada escena.
- Instrumentos aditivos sencillos: bombo, palmas, hi-hat, bajo, pad, pluck, piano, riser, impacto.
- Efectos colocados en las marcas: pasos, golpes de balón, silbato, contadores, transiciones.
- La música se atenúa automáticamente bajo la voz (*ducking*). El script imprime los niveles; la
  voz debe quedar al menos 10 dB por encima de la música durante el diálogo.

### Paso 5 — Actuación de los personajes (`rig.js`)

Los modelos de `characters.js` no se modifican. `Actor` los envuelve y añade:

- **Poses con nombre** (`POSES`): diccionarios de ángulos de articulaciones. Hay más de 50, entre
  poses de pie y sentadas. Se encadenan con `actor.pose(t, 'nombre', duración)` y se mezclan con suavizado.
- **Trayectorias**: `actor.at(t, x, z)` teletransporta (solo en cortes) y `actor.move(t0, t1, x, z)`
  camina. El ciclo de caminata sale de la distancia recorrida, así los pies no patinan.
- **Desplazamiento sentado**: si el personaje está sentado y se mueve, se inclina y empuja con los
  brazos automáticamente.
- **Orientación y mirada**: `face(t, objetivo)` gira el cuerpo; `look(t, objetivo)` gira cabeza y
  pupilas. El objetivo puede ser `'cam'`, `'ball'`, otro personaje o un punto.
- **Cara**: `emo(t, {smile, brow, sad})`, parpadeo determinista, y boca que se abre con la
  envolvente real de la voz.
- **Gestos al hablar**: procedurales, proporcionales al volumen, y se apagan con `g: 0` cuando las
  manos están ocupadas.

Convención de ejes de los brazos (ahorra mucho ensayo y error): con el brazo colgando, `rotation.x`
negativo lo lleva al frente (−π/2 horizontal, −π arriba) y `rotation.z` lo abre hacia afuera
(positivo en el brazo de +x, negativo en el de −x).

### Paso 6 — Escenario (`world.js`)

- Duela de madera con textura generada en canvas, paredes, graderías, cerchas y conos de luz.
- `setCourt(k)` interpola la cancha de 18×9 m (k=0) a 10×6 m (k=1).
- `setNet(h)` ajusta postes, malla, bandas y antenas a cualquier altura.
- La pantalla LED del fondo es una textura de canvas que `overlay.js` redibuja cada fotograma.
- El logo aparece en los pendones y en la pantalla.

### Paso 7 — Coreografía y cámaras (`story.js`)

Un solo método `_script()` escribe, capítulo por capítulo:

- las acciones de cada actor,
- los nodos del balón: `{t, t2, src, h}` significa "en la mano de `src` desde `t` hasta `t2`, y
  luego vuela en parábola de altura `h` hasta el siguiente nodo",
- los planos: `sh(t0, t1, posInicial, posFinal, miraInicial, miraFinal, fovInicial, fovFinal)`.

Criterios de dirección que se aplicaron:

- Ningún plano dura más de unos 7 s y la cámara siempre se mueve.
- Quien habla hace algo además de hablar; los otros dos lo miran y reaccionan.
- Cuando hay panel de datos, el personaje va a un tercio de la pantalla y el panel al otro lado.
- Los teletransportes ocurren solo bajo una transición o un gráfico a pantalla completa.
- Los rivales son hologramas (mismos modelos con material translúcido) para no inventar personas.

### Paso 8 — Motion design (`overlay.js`)

Un canvas 2D del mismo tamaño encima del WebGL. Sistema de diseño:

- Colores: azul noche `#070b16`, rojo del logo `#e8102a`, dorado `#ffd21f`, cian `#3fd8ff`.
- Tipografías: Barlow Condensed itálica 800/900 para titulares, Inter para subtítulos, JetBrains
  Mono para rótulos técnicos.
- Recursos repetidos: bloque inclinado (`slab`), texto que sube desde una máscara (`rise`), letras
  escalonadas (`chars`), panel de vidrio esmerilado que desenfoca el 3D de fondo (`glass`), etiqueta
  con línea guía (`tag`), cota técnica (`dimLine`).
- `s3.project([x,y,z])` convierte un punto 3D a píxeles, y con eso se anclan etiquetas, cotas,
  arcos y globos a los personajes y a la red.
- Subtítulos: palabra ya dicha en blanco, palabra actual en el color del hablante, resto atenuado.

### Paso 9 — Render (`render.py`)

`window.frame(t)` compone WebGL + overlay en un tercer canvas y devuelve un JPEG en base64.
Python lo pide fotograma a fotograma y lo envía por tubería a `ffmpeg`. El modo `video N` lanza
N procesos, cada uno con su tramo, y luego concatena y añade el audio.

---

## 5. El ciclo de revisión (lo que más sube la calidad)

No se puede juzgar el video leyendo el código. El método fue:

1. Renderizar una hoja de 9 fotogramas de una escena (`render.py sheet`).
2. **Mirar la imagen** y anotar cada problema concreto.
3. Corregir y volver a renderizar la misma hoja.
4. Pasar a la siguiente escena.

Se revisaron unas 14 hojas (más de 120 fotogramas) antes del render final. Para revisar movimiento,
pedir 9 instantes separados 0,2 s.

Qué buscar en cada fotograma:

- Textos que se salen del cuadro o se pisan entre sí, con el logo o con los subtítulos.
- Cabezas tapadas por rótulos.
- Un personaje que tapa a quien actúa (pasó con el remate: se cambió la cámara al otro lado de la red).
- Etiquetas ancladas a alguien que está fuera de cuadro.
- Colores lavados o quemados.
- Balón atravesando la red o flotando lejos de las manos.

---

## 6. Problemas reales que aparecieron y su solución

| Problema | Causa | Solución |
|----------|-------|----------|
| Colores pastel, lavados | En Three.js r128 los colores hex y las texturas de canvas se tratan como lineales | `Scene3D._fixColors()`: `convertSRGBToLinear()` en cada material y `encoding = sRGBEncoding` en cada textura |
| Torso flotando sobre la cadera | El video anterior fijaba `spine.position.y` a un valor inventado | Guardar la posición original del modelo y solo sumarle la respiración |
| Balón pegado al brazo de Martín | Venía en el modelo | Ocultarlo y usar un balón libre |
| El remate sentado atravesaba la red | El brazo estaba a media bajada en el instante del contacto | Pose intermedia con el brazo recto arriba justo en la marca, y caída más profunda |
| Hologramas blancos, quemados | Mezcla aditiva con opacidad alta cerca de la cámara | Bajar opacidad a 0,2 y oscurecer el color |
| Rótulos tapando los subtítulos | Composiciones pensadas sin la franja inferior | Reservar los 200 px inferiores para subtítulos |
| Triángulo de equipo plano | Las tres cabezas están a la misma altura | Dibujar arcos en vez de rectas |
| «Peace and Sport» mal pronunciado | Voz en español | Texto fonético en `tts`, texto correcto en el subtítulo |
| MP4 de 212 MB | CRF 16 | Recomprimir a CRF 22 para GitHub |
| `ffmpeg` no encontrado desde Python | PATH distinto | Verificar con `ffmpeg -version` antes de empezar |

---

## 7. Cómo adaptarlo

- **Cambiar una frase:** editar `SCENES`, luego `build_audio.py all` y `render.py video 4`.
- **Cambiar una cifra:** está en el guion (`SCENES`) y en el gráfico correspondiente de `overlay.js`.
  Cambiar los dos.
- **Otra duración:** cambiar `DUR` en `build_audio.py` y `render.py`, y ajustar `BPM` para que la
  duración sea un número entero de compases.
- **Usar las voces reales de los estudiantes:** grabar cada línea como WAV mono a 48 kHz con el
  nombre de caché que usa `cache_key()` en `temp_audio/`, y crear a su lado un JSON con los
  tiempos por palabra (o una lista vacía: los subtítulos se reparten proporcionalmente).
- **Otro colegio o tema:** reemplazar `assets/sbl_logo.png`, los colores en `overlay.js` y
  `world.js`, y los textos de pendones y créditos.
- **Sillas de ruedas:** `characters.js` conserva `createWheelchair()`. Habría que añadir una pose
  sentada en silla y mover la silla junto al actor.

---

## 8. Criterios de aceptación

El video está terminado cuando se cumple todo esto:

- [ ] `ffprobe` informa 1920×1080, 30 fps, 5400 fotogramas, 180,000 s, pista de audio AAC.
- [ ] El logo del colegio aparece en la apertura, durante todo el video y en los créditos.
- [ ] Los tres estudiantes hablan, se mueven y se pasan el balón en cada capítulo.
- [ ] Ninguna cifra en pantalla difiere del documento de investigación.
- [ ] Ningún texto se sale del cuadro ni queda tapado en las hojas de revisión.
- [ ] Los fotogramas a ambos lados de cada empalme de tramo (45 s, 90 s, 135 s) son continuos.
- [ ] La voz queda al menos 10 dB sobre la música durante el diálogo.
- [ ] El archivo final pesa menos de 100 MB.
- [ ] Una persona vio y escuchó el video completo al menos una vez.

---

## 9. Prompt maestro

Copiar y pegar en el agente, dentro de una copia de este repositorio:

```text
Vas a producir un video animado de 3 minutos (180 s exactos, 1920x1080, 30 fps) generado
completamente por código, para un proyecto escolar de grado 10.

Fuentes que debes leer antes de escribir nada:
- "Proyecto 2 - Periodo 3 - 2026.docx": la investigación. Todas las cifras y afirmaciones del
  video salen de aquí. No inventes datos.
- personajes-threejs/characters.js: los tres personajes 3D (Sofía #4, Juan Diego #7, Martín #10).
  Úsalos sin modificar el archivo.
- personajes-threejs/assets/sbl_logo.png: el logo del colegio.
- video-3min/GUIA_PARA_MODELOS.md: el método. Síguelo en orden.
- video-3min/: implementación de referencia. Puedes reutilizarla o reescribirla.

Requisitos del video:
1. Abre con el logo del colegio animado y cierra con créditos (estudiantes, docente, áreas, fuentes).
2. Los tres estudiantes interactúan todo el tiempo: caminan, se miran, se pasan el balón,
   gesticulan al hablar y reaccionan a quien habla. Ninguna escena estática.
3. Mucho motion design: título cinético, paneles de datos animados, etiquetas ancladas a los
   personajes, cotas técnicas, transiciones por capítulo, subtítulos palabra a palabra.
4. Voces en español con sincronía labial, música y efectos de sonido.
5. Estructura: la pregunta, el problema (encuesta), el partido Ruanda-Colombia 2016, la regla del
   voleibol sentado, una jugada completa, la oportunidad (71,2 %) y los créditos.

Reglas técnicas obligatorias:
- window.seek(t) debe dibujar el fotograma del segundo t sin estado previo. Nada de
  requestAnimationFrame, física acumulada ni Math.random().
- Una sola línea de tiempo generada desde el guion y las duraciones reales de las voces. Animación
  y audio la leen por nombre de marca; no escribas segundos a mano.
- Three.js r128: convierte colores a lineal y marca las texturas de canvas como sRGB.
- Reserva los 200 px inferiores para subtítulos.

Método de trabajo:
1. Escribe el guion, genera las voces, mide y calcula la línea de tiempo.
2. Construye rig, escenario, coreografía y motion design.
3. Antes del render final, renderiza hojas de contacto de cada escena, mira las imágenes y corrige
   cada defecto que veas. Repite hasta que no quede ninguno.
4. Renderiza en paralelo, une el audio y verifica con ffprobe.
5. Comprueba los criterios de aceptación de la guía y dime con franqueza qué no pudiste verificar
   (por ejemplo, si no puedes escuchar el audio).

Entrega: video-3min/out/El_Saque_de_Reconciliacion_3min.mp4 (menos de 100 MB) y un resumen de las
decisiones que tomaste por tu cuenta.
```

---

## 10. Qué necesita el agente

Capacidades mínimas del modelo o del entorno donde corra:

- Leer y escribir archivos del repositorio.
- Ejecutar Python, `ffmpeg` y un navegador sin interfaz.
- **Ver imágenes** (las hojas de contacto). Sin esto el paso 5 no se puede hacer y la calidad cae
  mucho: habría que pedirle a una persona que revise las hojas y describa los defectos.
- Acceso a internet para las voces de `edge-tts` y las fuentes.
- Tolerar tareas largas: el render completo tarda unos 15 minutos y conviene lanzarlo en segundo plano.

Ningún modelo de los usados aquí puede escuchar el audio. La revisión final de sonido siempre la
hace una persona.
