# Nagahiro and the Weight of the Flash · Video-debate animado

Producto audiovisual de la propuesta de **Samuel Alejandro Losada Bravo** y **Tomás Alejandro Homez Barragán**
(Grado 10, Ciclo Proyectivo, Colegio San Bonifacio de las Lanzas Bilingüe · docente Juan David Rodríguez Cerón).

Video final: `out/Nagahiro_Video_Debate_web.mp4` (versión comprimida para GitHub; el maestro sin comprimir, `out/Nagahiro_Video_Debate.mp4`, queda solo en local). Son 1920 × 1080 a 30 fps y dura 4:09. Está en inglés (nivel B2+) con subtítulos en inglés. Las traducciones al español de cada línea siguen en el guion (`build_audio.py`, campo `es`).

## Estructura

| Tiempo | Parte | Qué se ve |
|---|---|---|
| 0:00 | Logo SBL | Apertura con el escudo del colegio |
| 0:06 | 8:15 | Reloj que llega a las 8:15; la pantalla se vuelve papel y el sonido calla. Luego Nagasaki, 11:02 |
| 0:23 | Presentación | Samuel y Tomás en sus atriles; pregunta: *Can a calculation tell us whether a decision was right?* |
| 0:42 | Ronda 1 · Tesis | Samuel defiende la justificación militar (Frank, Walker, Stimson) y la cifra de 500 000 |
| 1:17 | Ronda 2 · Antítesis | Tomás refuta (Bernstein, Alperovitz, Hasegawa), salen de los atriles y se presentan los cinco modelos. Después: memoria, brecha prometeica y Nobel 2024 |
| 3:06 | Ronda 3 · Superación | Cada uno conserva lo válido de su lado; los cristales de tesis y antítesis se funden (*Aufhebung*) |
| 3:38 | Cierre | 12 187 ojivas (un punto por ojiva), «calculate, remember, decide», *No more Hibakusha* y apretón de manos |
| 3:58 | Créditos | Estudiantes, docente, áreas, fuentes y notas de producción |

## Los cinco modelos en pantalla

1. **Masa–energía:** un grano de ≈0,7 g en la palma de Tomás y, detrás, una torre de 1500 cubos de 10 t (15 000 t de TNT).
2. **Inverso del cuadrado:** un mapa abstracto con la luz a 580 m de altura. Anillos a 0,5, 1, 1,5, 2 y 3 km con 71, 31, 16, 10 y 4,5 cal/cm². El supuesto que se declara: sin absorción atmosférica, así que es una cota superior.
3. **Raíz cúbica:** disco de 15 kt frente a 300 kt; el radio crece ×2,7 y el área ×7,4. Se muestran solo cocientes.
4. **Decaimiento:** dos nubes de núcleos con su reloj simulado. El I‑131 (T½ ≈ 8 días) desaparece; el Cs‑137 (T½ ≈ 30 años) conserva cerca del 10 % a los 100 años.
5. **Dosis–respuesta:** barras con RR = 1 + 0,42·D para 0–2 Gy, con la advertencia de que es un promedio poblacional.

## Decisiones artísticas (eje de Educación Artística)

- **Sin violencia gráfica:** el destello es una hoja de papel en blanco, no una explosión. No aparecen víctimas, ciudades destruidas ni personas históricas.
- **La brecha prometeica (Anders):**
  - En imagen: un grano casi invisible frente a una torre que no cabe en el plano, y una barra de «lo que podemos producir» mucho más larga que la de «lo que podemos imaginar o sentir».
  - En sonido: el tic‑tac se corta en seco y deja un silencio real de unos 2,5 s. Es el único momento del video sin música.
- **Memoria:** grullas de papel que suben en penumbra. La música se reduce a piano solo.
- **Paleta:**
  - Ámbar para el cálculo y la tesis.
  - Azul hielo para la evidencia y la antítesis.
  - Papel para la memoria y la superación.
  - Rojo SBL solo para lo institucional y el cierre.
- **Banda sonora original:** todo está sintetizado en `build_audio.py`. La música va en re menor durante el debate y resuelve a re mayor en el cierre. Termina con una campana de bronce (evoca la Campana de la Paz) seguida de silencio.

## Regenerar

Requiere Python 3.12 con `numpy`, `scipy`, `edge-tts` y `playwright`, además de `ffmpeg`.

```bash
python build_audio.py all
```

```bash
python render.py video 4
```

Para revisar fotogramas sueltos: `python render.py sheet <nombre> <9 tiempos>`, que guarda una hoja de contactos en `out/shots/`.

## Notas

- Las voces son sintéticas (edge-tts: Andrew = Samuel, Brian = Tomás, Sonia = narradora), no las de los estudiantes.
- La apariencia de los personajes es inventada; no se basa en fotos de los estudiantes.
- Las posiciones del debate son roles argumentativos, no opiniones personales.
