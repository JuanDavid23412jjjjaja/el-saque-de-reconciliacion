"""
build_audio.py - Guion (ingles B2+ con subtitulos en espanol), voces, linea de tiempo, musica y mezcla
del video-debate "Nagahiro and the Weight of the Flash".

    python build_audio.py tts      -> voces neuronales (edge-tts) con tiempos por palabra
    python build_audio.py layout   -> linea de tiempo -> timeline.js
    python build_audio.py mix      -> musica + efectos sintetizados + mezcla out/mix.wav
    python build_audio.py all      -> todo

timeline.js es la UNICA fuente de tiempos: la animacion (JS) y el audio (Python) leen lo mismo.
"""
import asyncio, hashlib, json, os, subprocess, sys, unicodedata, wave
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, "temp_audio")
OUT = os.path.join(HERE, "out")
os.makedirs(TMP, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

SR = 48000
CREDITS = 11.0

VOICES = {
    "samuel": dict(voice="en-US-AndrewNeural", rate="+4%", pitch="+10Hz"),
    "tomas":  dict(voice="en-US-BrianNeural",  rate="+3%", pitch="+12Hz"),
    "narr":   dict(voice="en-GB-SoniaNeural",  rate="-6%", pitch="-2Hz"),
}

# ----------------------------------------------------------------------------
# GUION  (text = ingles en pantalla / es = subtitulo / tts = como se pronuncia / cite = fuente APA)
# ----------------------------------------------------------------------------
def L(id, who, text, es, gap=0.34, tts=None, post=0.0, cite=None):
    return dict(kind="line", id=id, who=who, text=text, es=es, tts=tts or text, gap=gap, post=post, cite=cite)

def B(name, dur, marks=None):
    return dict(kind="beat", name=name, dur=dur, marks=marks or {})

SCENES = [
    ("logo", [
        B("sting", 6.0, marks={"logo_pop": 0.7, "logo_text": 1.9, "wipe_in": 5.2}),
    ]),
    ("intro", [
        B("clock_in", 1.4),
        L("n1", "narr", "Eight fifteen in the morning. August the sixth, 1945.",
          "Ocho y quince de la mañana. 6 de agosto de 1945.",
          tts="Eight fifteen in the morning. August the sixth, nineteen forty-five.", gap=0.0),
        B("silence", 3.4, marks={"flash": 0.35, "back": 2.7}),
        L("n2", "narr", "Three days later, Nagasaki. More than eighty years on, we are still arguing about what those two mornings mean.",
          "Tres días después, Nagasaki. Más de ochenta años después, seguimos discutiendo qué significan esas dos mañanas.", gap=0.0),
        B("stage_in", 1.6, marks={"lights": 0.1}),
        L("i1", "samuel", "Hi, I'm Samuel.", "Hola, soy Samuel.", gap=0.0),
        L("i2", "tomas", "And I'm Tomás. We're in tenth grade at San Bonifacio de las Lanzas.",
          "Y yo soy Tomás. Estamos en grado décimo en el San Bonifacio de las Lanzas.", gap=0.25),
        L("i3", "samuel", "Today we're not giving you a history lesson. We're having an argument.",
          "Hoy no les vamos a dar una clase de historia. Vamos a debatir."),
        L("i4", "tomas", "Can a calculation tell us whether a decision was right?",
          "¿Puede un cálculo decirnos si una decisión fue correcta?", gap=0.4),
        B("title", 4.4, marks={"title_hit": 0.35, "title_out": 3.9}),
    ]),
    ("round1", [
        B("r1_in", 0.5),
        L("r1n", "narr", "Round one. The thesis.", "Primera ronda. La tesis.", gap=0.0, post=0.3),
        L("a1", "samuel", "In the summer of 1945, the war in the Pacific was far from over, and Japan's leaders had not accepted unconditional surrender.",
          "En el verano de 1945, la guerra en el Pacífico estaba lejos de terminar, y los líderes de Japón no habían aceptado la rendición incondicional.",
          tts="In the summer of nineteen forty-five, the war in the Pacific was far from over, and Japan's leaders had not accepted unconditional surrender.",
          cite="Frank, 1999; Walker, 2004"),
        L("a2", "samuel", "An invasion was already being planned. From Washington's point of view, the bomb promised a quick end to the war.",
          "Ya se planeaba una invasión. Desde Washington, la bomba prometía un final rápido de la guerra.", cite="Walker, 2004"),
        L("a3", "samuel", "After the war, Secretary of War Henry Stimson called it “the least abhorrent choice”.",
          "Después de la guerra, el secretario de Guerra Henry Stimson la llamó «la opción menos aborrecible».",
          tts="After the war, Secretary of War Henry Stimson called it, the least abhorrent choice.", cite="Stimson, 1947"),
        L("a4", "tomas", "Least abhorrent compared to what?", "¿Menos aborrecible comparada con qué?", gap=0.3),
        L("a5", "samuel", "Compared to an invasion. The official story claimed it saved up to half a million American lives.",
          "Comparada con una invasión. La versión oficial afirmó que salvó hasta medio millón de vidas estadounidenses.", gap=0.25),
        L("a6", "tomas", "Half a million. Keep that number in mind. We'll come back to it.",
          "Medio millón. Guarden esa cifra. Volveremos a ella.", post=0.3),
    ]),
    ("round2", [
        B("r2_in", 0.5),
        L("r2n", "narr", "Round two. The antithesis.", "Segunda ronda. La antítesis.", gap=0.0, post=0.3),
        L("b1", "tomas", "Historian Barton Bernstein went back to the military estimates from 1945. They don't support the half-million figure.",
          "El historiador Barton Bernstein revisó las estimaciones militares de 1945. No respaldan la cifra de medio millón.",
          tts="Historian Barton Bernstein went back to the military estimates from nineteen forty-five. They don't support the half-million figure.",
          cite="Bernstein, 1986"),
        L("b2", "tomas", "Others, like Alperovitz and Hasegawa, argue that the Soviet Union mattered just as much: as a diplomatic target, and as a new enemy for Japan.",
          "Otros, como Alperovitz y Hasegawa, sostienen que la Unión Soviética pesó igual: como objetivo diplomático y como nuevo enemigo de Japón.",
          cite="Alperovitz, 1965; Hasegawa, 2005"),
        L("b3", "samuel", "That's an interpretation, though. Not a proven fact.", "Pero eso es una interpretación. No un hecho probado.", gap=0.3),
        L("b4", "tomas", "Fair enough. So let's look at what we can actually measure.",
          "De acuerdo. Entonces miremos lo que sí podemos medir.", gap=0.3, post=0.2),
        L("m1", "tomas", "The Hiroshima bomb turned less than one gram of matter into energy. About zero point seven grams.",
          "La bomba de Hiroshima convirtió menos de un gramo de materia en energía. Cerca de 0,7 gramos.", cite="Malik, 1985"),
        L("m2", "tomas", "That's the same energy as fifteen thousand tons of TNT.",
          "Es la misma energía que quince mil toneladas de TNT.", gap=0.25),
        B("tower", 1.5),
        L("m3", "tomas", "About thirty-five percent of it came out as heat, and heat spreads out with the square of the distance.",
          "Cerca del 35 % salió como calor, y el calor se dispersa con el cuadrado de la distancia.", cite="Glasstone & Dolan, 1977", gap=0.0),
        L("m4", "tomas", "Half a kilometre from ground zero, our model gives seventy-one calories per square centimetre. Three kilometres away, it's still four and a half.",
          "A medio kilómetro de la zona cero, nuestro modelo da 71 calorías por centímetro cuadrado. A tres kilómetros, aún son 4,5."),
        L("m5", "samuel", "And what about a modern warhead?", "¿Y qué pasa con una ojiva moderna?", gap=0.3),
        L("m6", "tomas", "Take three hundred kilotons, twenty times bigger. The radius only grows with the cube root, but the damaged area is more than seven times larger.",
          "Tomemos 300 kilotones, veinte veces más. El radio solo crece con la raíz cúbica, pero el área dañada es más de siete veces mayor.",
          cite="Glasstone & Dolan, 1977"),
        L("m7", "tomas", "And radiation doesn't end with the explosion. Iodine-131 disappears within weeks, but cesium-137 still keeps about ten percent after a hundred years.",
          "Y la radiación no termina con la explosión. El yodo-131 desaparece en semanas, pero el cesio-137 aún conserva cerca del 10 % después de cien años.",
          tts="And radiation doesn't end with the explosion. Iodine one thirty-one disappears within weeks, but cesium one thirty-seven still keeps about ten percent after a hundred years.",
          gap=0.4),
        L("m8", "tomas", "Survivors have been followed since 1950, and their risk of dying of cancer rises steadily with every gray of radiation they received.",
          "Los sobrevivientes son estudiados desde 1950, y su riesgo de morir de cáncer aumenta con cada gray de radiación que recibieron.",
          tts="Survivors have been followed since nineteen fifty, and their risk of dying of cancer rises steadily with every gray of radiation they received.",
          cite="Ozasa et al., 2012", gap=0.4),
        B("cranes_in", 1.3),
        L("m9", "tomas", "In total, the deaths are estimated at somewhere between a hundred and ten thousand and two hundred and ten thousand. Even the counting is uncertain.",
          "En total, las muertes se estiman entre unas 110.000 y 210.000. Incluso el conteo es incierto.", cite="Wellerstein, 2020", gap=0.0),
        L("m10", "samuel", "We can calculate all of this… but can we really imagine it?",
          "Podemos calcular todo esto… pero ¿de verdad podemos imaginarlo?", gap=0.5),
        L("m11", "tomas", "Günther Anders called that the Promethean gap: we can produce far more than we are able to imagine, or to feel.",
          "Günther Anders lo llamó la brecha prometeica: podemos producir mucho más de lo que somos capaces de imaginar, o de sentir.",
          tts="Gunther Anders called that the Promethean gap: we can produce far more than we are able to imagine, or to feel.", cite="Anders, 1956", gap=0.4),
        L("m12", "tomas", "That's why the survivors' testimony matters. In 2024, their organization, Nihon Hidankyo, won the Nobel Peace Prize.",
          "Por eso importa el testimonio de los sobrevivientes. En 2024, su organización, Nihon Hidankyo, ganó el Premio Nobel de Paz.",
          tts="That's why the survivors' testimony matters. In twenty twenty-four, their organization, Nihon Hidankyo, won the Nobel Peace Prize.",
          cite="Norwegian Nobel Committee, 2024", post=0.4),
    ]),
    ("round3", [
        B("r3_in", 0.5),
        L("r3n", "narr", "Round three. The sublation.", "Tercera ronda. La superación (Aufhebung).", gap=0.0, post=0.3),
        L("c1", "samuel", "So I keep what was true on my side: the leaders wanted to end a terrible war, and that concern was real.",
          "Entonces conservo lo que era cierto de mi lado: los líderes querían terminar una guerra terrible, y esa preocupación era real."),
        L("c2", "tomas", "And I keep what the models and the survivors show us: some consequences can never be undone.",
          "Y yo conservo lo que nos muestran los modelos y los sobrevivientes: algunas consecuencias nunca se pueden deshacer."),
        L("c3", "samuel", "Hans Jonas puts it clearly: when the effects of a technology are irreversible, we have to weigh them before we act, not after.",
          "Hans Jonas lo dice claro: cuando los efectos de una tecnología son irreversibles, hay que sopesarlos antes de actuar, no después.",
          cite="Jonas, 1984", gap=0.4),
        L("c4", "tomas", "So the military justification isn't simply false…", "Así que la justificación militar no es simplemente falsa…", gap=0.4),
        L("c5", "samuel", "…but it can't close the discussion.", "…pero no puede cerrar la discusión.", gap=0.15),
        L("c6", "tomas", "Because the survivors' suffering was never part of the calculation.",
          "Porque el sufrimiento de los sobrevivientes nunca fue parte del cálculo.", post=0.3),
    ]),
    ("closing", [
        B("close_in", 0.9),
        L("d1", "tomas", "Today, there are around twelve thousand nuclear warheads in the world.",
          "Hoy hay cerca de doce mil ojivas nucleares en el mundo.", cite="SIPRI, 2026", gap=0.0),
        L("d2", "samuel", "Numbers can tell us how big the danger is. Memory is what tells us never to use them.",
          "Los números nos dicen qué tan grande es el peligro. La memoria es lo que nos dice que nunca debemos usarlas."),
        L("d3", "tomas", "So calculate, remember, and decide before it's too late.",
          "Así que calculen, recuerden y decidan antes de que sea demasiado tarde.", gap=0.4),
        L("d4", "samuel", "No more Hibakusha.", "Nunca más hibakusha.", gap=0.7, post=0.4),
        B("bell", 4.6, marks={"bell": 0.2, "end_title": 0.6}),
    ]),
    ("credits", [
        B("credits", CREDITS),
    ]),
]

# Marcas derivadas de palabras dichas: nombre -> (cue, prefijo, n-esima aparicion, offset)
WORD_MARKS = {
    "n1_eight": ("n1", "eight", 0, 0), "n1_august": ("n1", "august", 0, 0),
    "n2_nagasaki": ("n2", "nagasaki", 0, 0), "n2_eighty": ("n2", "eighty", 0, 0),
    "i1_samuel": ("i1", "samuel", 0, 0), "i2_tomas": ("i2", "tom", 0, 0), "i2_sb": ("i2", "bonifacio", 0, 0),
    "i3_arg": ("i3", "argument", 0, 0), "i4_calc": ("i4", "calculation", 0, 0), "i4_right": ("i4", "right", 0, 0),
    "a1_summer": ("a1", "summer", 0, 0), "a1_surr": ("a1", "unconditional", 0, 0),
    "a2_inv": ("a2", "invasion", 0, 0), "a2_bomb": ("a2", "bomb", 0, 0),
    "a3_stimson": ("a3", "stimson", 0, 0), "a3_least": ("a3", "least", 0, 0),
    "a5_half": ("a5", "half", 0, 0), "a6_keep": ("a6", "keep", 0, 0),
    "b1_bern": ("b1", "bernstein", 0, 0), "b1_dont": ("b1", "don", 0, 0),
    "b2_alp": ("b2", "alperovitz", 0, 0), "b2_has": ("b2", "hasegawa", 0, 0), "b2_sov": ("b2", "soviet", 0, 0),
    "b4_measure": ("b4", "measure", 0, 0),
    "m1_less": ("m1", "less", 0, 0), "m1_gram": ("m1", "gram", 0, 0), "m1_seven": ("m1", "seven", 0, 0),
    "m2_fifteen": ("m2", "fifteen", 0, 0), "m2_tnt": ("m2", "tnt", 0, 0),
    "m3_heat": ("m3", "heat", 0, 0), "m3_square": ("m3", "square", 0, 0),
    "m4_half": ("m4", "half", 0, 0), "m4_seventy": ("m4", "seventy", 0, 0), "m4_three": ("m4", "three", 0, 0), "m4_four": ("m4", "four", 0, 0),
    "m6_three": ("m6", "three", 0, 0), "m6_cube": ("m6", "cube", 0, 0), "m6_area": ("m6", "area", 0, 0), "m6_seven": ("m6", "seven", 0, 0),
    "m7_iodine": ("m7", "iodine", 0, 0), "m7_weeks": ("m7", "weeks", 0, 0), "m7_cesium": ("m7", "cesium", 0, 0), "m7_hundred": ("m7", "hundred", 0, 0),
    "m8_1950": ("m8", "nineteen", 0, 0), "m8_risk": ("m8", "risk", 0, 0), "m8_gray": ("m8", "gray", 0, 0),
    "m9_between": ("m9", "between", 0, 0), "m9_uncertain": ("m9", "uncertain", 0, 0),
    "m10_imagine": ("m10", "imagine", 0, 0),
    "m11_gap": ("m11", "promethean", 0, 0), "m11_produce": ("m11", "produce", 0, 0), "m11_feel": ("m11", "feel", 0, 0),
    "m12_2024": ("m12", "twenty", 0, 0), "m12_nobel": ("m12", "nobel", 0, 0),
    "c1_keep": ("c1", "keep", 0, 0), "c2_keep": ("c2", "keep", 0, 0), "c2_never": ("c2", "never", 0, 0),
    "c3_jonas": ("c3", "jonas", 0, 0), "c3_before": ("c3", "before", 0, 0),
    "c5_close": ("c5", "close", 0, 0), "c6_calc": ("c6", "calculation", 0, 0),
    "d1_twelve": ("d1", "twelve", 0, 0), "d2_memory": ("d2", "memory", 0, 0),
    "d3_calc": ("d3", "calculate", 0, 0), "d3_remember": ("d3", "remember", 0, 0), "d3_decide": ("d3", "decide", 0, 0),
}

# ----------------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------------
def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum())

def all_lines():
    for _, items in SCENES:
        for it in items:
            if it["kind"] == "line":
                yield it

def cache_key(ln):
    v = VOICES[ln["who"]]
    h = hashlib.md5((ln["tts"] + json.dumps(v, sort_keys=True)).encode("utf8")).hexdigest()[:10]
    return f"{ln['id']}_{h}"

def read_wav(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
        if w.getnchannels() == 2:
            a = a.reshape(-1, 2).mean(axis=1)
        assert w.getframerate() == SR
    return a

def write_wav(path, stereo):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())

# ----------------------------------------------------------------------------
# ETAPA 1: TTS
# ----------------------------------------------------------------------------
async def tts_one(ln):
    import edge_tts
    key = cache_key(ln)
    wav, meta, mp3 = (os.path.join(TMP, key + e) for e in (".wav", ".json", ".mp3"))
    if os.path.exists(wav) and os.path.exists(meta):
        return
    v = VOICES[ln["who"]]
    for attempt in range(5):
        try:
            com = edge_tts.Communicate(ln["tts"], v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary")
            words = []
            with open(mp3, "wb") as f:
                async for ch in com.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append([ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7])
            break
        except Exception as e:
            print("  reintento", ln["id"], e)
            await asyncio.sleep(1.5)
    else:
        raise RuntimeError("TTS fallo para " + ln["id"])
    af = "highpass=f=90,equalizer=f=3000:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-af", af, "-ar", str(SR), "-ac", "1", wav], check=True)
    json.dump(words, open(meta, "w", encoding="utf8"), ensure_ascii=False)
    print("  voz", ln["id"], ln["who"])

async def stage_tts():
    sem = asyncio.Semaphore(4)
    async def run(ln):
        async with sem:
            await tts_one(ln)
    await asyncio.gather(*[run(ln) for ln in all_lines()])

def load_line(ln):
    key = cache_key(ln)
    a = read_wav(os.path.join(TMP, key + ".wav"))
    words = json.load(open(os.path.join(TMP, key + ".json"), encoding="utf8"))
    sm = np.convolve(np.abs(a), np.ones(int(SR * 0.02)) / int(SR * 0.02), mode="same")
    idx = np.where(sm > 0.012)[0]
    end = (idx[-1] + int(SR * 0.08)) if len(idx) else len(a)
    start = max(0, idx[0] - int(SR * 0.03)) if len(idx) else 0
    a = a[start:min(end, len(a))]
    off = start / SR
    return a, [[w, max(0, t0 - off), max(0, t1 - off)] for w, t0, t1 in words]

# ----------------------------------------------------------------------------
# ETAPA 2: LAYOUT -> timeline.js
# ----------------------------------------------------------------------------
def envelope(a, hz=60):
    hop = SR // hz
    n = len(a) // hop + 1
    pad = np.zeros(n * hop, dtype=np.float32); pad[:len(a)] = a
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(axis=1))
    e = np.clip(rms / (np.percentile(rms, 92) + 1e-6), 0, 1.0)
    e = np.convolve(e, [0.25, 0.5, 0.25], mode="same")
    return [int(round(x * 99)) for x in e]

def stage_layout():
    scenes, beats, marks, cues, audio = {}, {}, {}, [], {}
    t = 0.0
    for name, items in SCENES:
        s0 = t
        for it in items:
            if it["kind"] == "beat":
                beats[it["name"]] = [round(t, 3), round(t + it["dur"], 3)]
                for k, off in it["marks"].items():
                    marks[k] = round(t + off, 3)
                t += it["dur"]
            else:
                t += it["gap"]
                a, words = load_line(it)
                d = len(a) / SR
                cues.append(dict(id=it["id"], who=it["who"], t0=round(t, 3), t1=round(t + d, 3), text=it["text"], es=it["es"],
                                 cite=it["cite"], words=[[w, round(t + a0, 3), round(t + a1, 3)] for w, a0, a1 in words], env=envelope(a)))
                audio[it["id"]] = (t, a)
                t += d + it["post"]
        scenes[name] = [round(s0, 3), round(t, 3)]
    dur = round(t, 3)
    cue_by_id = {c["id"]: c for c in cues}
    for mk, (cid, prefix, nth, off) in WORD_MARKS.items():
        c = cue_by_id[cid]
        hits = [w for w in c["words"] if norm(w[0]).startswith(prefix)]
        if len(hits) <= nth:
            raise SystemExit(f"Marca {mk}: no encuentro '{prefix}' en {cid}: {[w[0] for w in c['words']]}")
        marks[mk] = round(hits[nth][1] + off, 3)
    tl = dict(dur=dur, fps=30, scenes=scenes, beats=beats, marks=marks, cues=cues)
    with open(os.path.join(HERE, "timeline.js"), "w", encoding="utf8") as f:
        f.write("// GENERADO por build_audio.py - no editar a mano\nexport const TL = ")
        json.dump(tl, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"DURACION TOTAL {dur:.2f}s")
    for k, (a, b) in scenes.items():
        print(f"  {k:9s} {a:7.2f} -> {b:7.2f}  ({b - a:5.2f}s)")
    for c in cues:
        print(f"  {c['t0']:7.2f}-{c['t1']:7.2f} {c['who']:6s} {c['text'][:70]}")
    return tl, audio

# ----------------------------------------------------------------------------
# ETAPA 3: MUSICA + SFX + MEZCLA (todo sintetizado: banda sonora original)
# ----------------------------------------------------------------------------
rng = np.random.default_rng(7)

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)

class Bus:
    def __init__(self, N):
        self.N = N
        self.l = np.zeros(N + SR * 8, dtype=np.float32)
        self.r = np.zeros(N + SR * 8, dtype=np.float32)
    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i < 0:
            sig = sig[-i:]; i = 0
        n = min(len(sig), len(self.l) - i)
        if n <= 0:
            return
        self.l[i:i + n] += sig[:n] * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
        self.r[i:i + n] += sig[:n] * gain * np.sin((pan + 1) * np.pi / 4) * 1.414
    def stereo(self):
        return np.stack([self.l[:self.N], self.r[:self.N]], axis=1)

def adsr(n, a=0.005, d=0.1, s=0.7, r=0.1):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([np.linspace(0, 1, max(a_n, 1)), np.linspace(1, s, max(d_n, 1)), np.full(s_n, s), np.linspace(s, 0, max(r_n, 1))])
    return env[:n] if len(env) >= n else np.pad(env, (0, n - len(env)))

def saw(freq, dur, harm=8, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t); f = freq * (1 + detune)
    for k in range(1, harm + 1):
        if f * k > 9000: break
        out += np.sin(2 * np.pi * f * k * t + k * 0.7) / k
    return out.astype(np.float32) * 0.5

def noise_band(dur, lo, hi, decay, amp=1.0):
    n = int(dur * SR)
    x = signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    return (x * np.exp(-np.arange(n) / SR * decay) * amp).astype(np.float32)

def piano(freq, dur=3.0, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 10):
        fk = freq * k * (1 + 0.0004 * k * k)
        if fk > 10000: break
        out += np.sin(2 * np.pi * fk * t + k) / (k ** 1.4) * np.exp(-t * (0.9 + k * 0.6))
    out *= np.minimum(1, t / 0.003) * np.minimum(1, (dur - t) / 0.1)
    return (out * 0.5 * amp).astype(np.float32)

def pad(notes, dur, bright=1100, amp=1.0, att=None):
    n = int(dur * SR)
    out = np.zeros(n, dtype=np.float32)
    for m in notes:
        for det in (-0.005, 0.0, 0.005):
            out += saw(midi(m), dur, detune=det)[:n] / 3
    out = signal.sosfilt(signal.butter(2, bright, btype="low", fs=SR, output="sos"), out).astype(np.float32)
    a = att if att is not None else min(1.2, dur * 0.3)
    return out * adsr(n, a, 0.3, 0.85, min(1.5, dur * 0.35)) * 0.2 * amp

def sub_drone(freq, dur, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.003 * t) + 0.15 * np.sin(2 * np.pi * freq * 3.01 * t)
    s *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t)
    return (s * adsr(n, min(2.0, dur * 0.3), 0.1, 1.0, min(2.0, dur * 0.3)) * 0.3 * amp).astype(np.float32)

def pulse(freq, amp=1.0):
    d = 0.5; t = np.arange(int(d * SR)) / SR
    f = freq + freq * 1.5 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    return (s * amp).astype(np.float32)

def tick(amp=1.0, hi=False):
    s = noise_band(0.05, 2500 if hi else 1800, 7000, 180, 1.0)
    s[:int(0.002 * SR)] *= 2
    return s * amp

def bell(freq=98.0, dur=9.0, amp=1.0):
    # campana de bronce (parciales inarmonicos) - evoca la Campana de la Paz
    n = int(dur * SR); t = np.arange(n) / SR
    parts = [(0.5, 1.0, 0.35), (1.0, 0.9, 0.5), (1.19, 0.55, 0.8), (1.5, 0.4, 1.0), (2.0, 0.45, 1.3), (2.51, 0.25, 1.8), (3.0, 0.2, 2.2), (4.07, 0.12, 3.0)]
    out = np.zeros(n)
    for r, a, dc in parts:
        out += a * np.sin(2 * np.pi * freq * r * t + r) * np.exp(-t * dc) * (1 + 0.04 * np.sin(2 * np.pi * 2.3 * t * r))
    out += noise_band(dur, 200, 2500, 25, 0.3)[:n]
    out *= np.minimum(1, t / 0.004)
    return (out * 0.35 * amp).astype(np.float32)

def whoosh(dur=0.9, amp=1.0, lo=200, hi=4000):
    n = int(dur * SR); t = np.arange(n) / SR
    x = signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    return (x * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2.5 * amp * 0.45).astype(np.float32)

def boom_soft(amp=1.0, dur=3.0):
    # golpe grave sin explosion: un "latido" sub con cola
    n = int(dur * SR); t = np.arange(n) / SR
    f = 32 + 40 * np.exp(-t * 5)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    s += noise_band(dur, 40, 400, 3.5, 0.25)[:n]
    return (s * amp).astype(np.float32)

def swell(dur, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = signal.sosfilt(signal.butter(2, [300, 6000], btype="band", fs=SR, output="sos"), rng.standard_normal(n))
    return (x * (t / dur) ** 2.4 * amp * 0.4).astype(np.float32)

def blip(freq=1200, dur=0.08, amp=0.5):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * freq * t) * np.exp(-t * 40) * amp).astype(np.float32)

def ring_tone(dur, amp=1.0):
    # tono agudo muy suave durante el silencio (el "zumbido" despues del destello)
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 3950 * t) * 0.6 + np.sin(2 * np.pi * 3960 * t) * 0.4
    return (s * adsr(n, 0.05, 0.1, 0.8, dur * 0.6) * amp).astype(np.float32)

def reverb(st, secs=2.0, wet=0.3, seed=3):
    r = np.random.default_rng(seed)
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros_like(st)
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-t * (6.0 / secs))
        ir[:int(0.015 * SR)] = 0
        ir = signal.sosfilt(signal.butter(1, 5000, btype="low", fs=SR, output="sos"), ir)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = signal.fftconvolve(st[:, ch], ir)[:len(st)]
    return st + out * wet

# progresiones (MIDI): re menor -> resolucion en Re mayor al final
CH = {"Dm": [38, 57, 62, 65], "Bb": [34, 58, 62, 65], "F": [41, 57, 60, 65], "C": [36, 55, 60, 64], "Gm": [43, 58, 62, 67],
      "A": [33, 57, 61, 64], "Dmaj": [38, 57, 62, 66], "G": [43, 59, 62, 67], "Bm": [35, 54, 59, 62]}

def stage_mix(tl, audio):
    DUR = tl["dur"]; N = int(SR * DUR)
    S, M, Bt = tl["scenes"], tl["marks"], tl["beats"]
    cue = {c["id"]: c for c in tl["cues"]}
    music, fx, sfx = Bus(N), Bus(N), Bus(N)

    def prog(t0, t1, chords, bar, amp=1.0, bright=1100):
        t, i = t0, 0
        while t < t1 - 0.5:
            d = min(bar, t1 - t) + 1.2
            music.add(t, pad(CH[chords[i % len(chords)]], d, bright, amp), 1.0, -0.15 if i % 2 else 0.15)
            t += bar; i += 1

    def pulses(t0, t1, period, freq=55, amp=0.5):
        t = t0
        while t < t1:
            music.add(t, pulse(freq, amp)); t += period

    def arp(t0, t1, notes, step, amp=0.35):
        t, i = t0, 0
        while t < t1:
            music.add(t, piano(midi(notes[i % len(notes)]), 1.6, amp), 1.0, 0.3 * np.sin(i)); t += step; i += 1

    # --- 0. Logo: acorde que crece + campanilla
    music.add(0.2, pad(CH["Dm"], 6.2, 900, 0.9, att=2.0))
    music.add(M["logo_pop"], piano(midi(74), 4.0, 0.5))
    music.add(M["logo_pop"] + 0.02, piano(midi(62), 4.0, 0.4))
    fx.add(M["wipe_in"] - 0.4, whoosh(0.9, 0.7))

    # --- 1. Reloj y destello: tic-tac, luego SILENCIO (la brecha prometeica en sonido)
    flash = M["flash"]
    t = S["intro"][0] + 0.2
    k = 0
    while t < flash - 0.05:
        sfx.add(t, tick(0.55, k % 2 == 0), 1.0, 0.25 if k % 2 else -0.25); t += 1.0; k += 1
    music.add(S["intro"][0], sub_drone(midi(26), flash - S["intro"][0] + 0.3, 0.6))
    fx.add(flash - 1.2, swell(1.2, 0.5))                                   # aspiracion antes del corte
    fx.add(flash + 0.1, ring_tone(2.4, 0.018))                             # casi silencio
    music.add(M["back"], piano(midi(38), 6.0, 0.9))                        # una sola nota grave al volver
    music.add(M["back"], piano(midi(50), 6.0, 0.5))
    music.add(M["back"] + 0.4, sub_drone(midi(26), Bt["stage_in"][1] - M["back"], 0.55))
    prog(M["back"] + 0.5, Bt["stage_in"][0], ["Dm", "Bb"], 4.0, 0.7, 800)

    # --- 2. Presentacion: pulso suave, acordes que se abren
    s_in = Bt["stage_in"][0]
    fx.add(M["lights"] - 0.2, whoosh(0.8, 0.5, 150, 2500))
    for i in range(3):
        sfx.add(M["lights"] + i * 0.28, pulse(70 + i * 8, 0.45))       # golpes de luces del estudio
    prog(s_in, Bt["title"][0], ["Dm", "Bb", "F", "C"], 3.2, 0.9, 1300)
    pulses(s_in + 0.5, Bt["title"][0], 0.833, 49, 0.35)
    arp(cue["i3"]["t0"], Bt["title"][0], [62, 65, 69, 72, 69, 65], 0.4166, 0.18)
    # titulo
    fx.add(M["title_hit"] - 1.2, swell(1.2, 0.6))
    fx.add(M["title_hit"], boom_soft(0.9, 3.5))
    music.add(M["title_hit"], piano(midi(50), 4.0, 0.7)); music.add(M["title_hit"], piano(midi(57), 4.0, 0.5)); music.add(M["title_hit"], piano(midi(62), 4.0, 0.5))
    music.add(M["title_hit"], sub_drone(midi(26), 4.6, 0.8))

    def round_card(t0):
        fx.add(t0 - 0.5, whoosh(1.0, 0.55))
        fx.add(t0 + 0.15, boom_soft(0.55, 2.5))
        fx.add(t0 + 0.15, bell(196.0, 4.0, 0.22))

    # --- 3. Ronda 1 (tesis): pulso marcial contenido, re menor
    r1a, r1b = S["round1"]
    round_card(r1a)
    prog(r1a + 0.3, r1b, ["Dm", "Dm", "Bb", "C"], 3.33, 0.85, 1000)
    pulses(r1a + 0.6, r1b, 0.833, 46, 0.45)
    t = r1a + 0.6
    while t < r1b:
        sfx.add(t + 0.4166, tick(0.12, True)); t += 0.833
    sfx.add(M["a5_half"], blip(880, 0.25, 0.25))

    # --- 4. Ronda 2 (antitesis): datos y memoria
    r2a, r2b = S["round2"]
    round_card(r2a)
    prog(r2a + 0.3, cue["m1"]["t0"], ["Gm", "Dm", "Bb", "A"], 3.33, 0.85, 1100)
    pulses(r2a + 0.6, cue["m1"]["t0"], 0.833, 46, 0.4)
    # modelos: textura de "laboratorio": arpegio frio + pulso
    m0, m9 = cue["m1"]["t0"] - 0.3, Bt["cranes_in"][0]
    prog(m0, m9, ["Dm", "F", "C", "Gm"], 3.33, 0.6, 1600)
    arp(m0, m9, [74, 69, 65, 62, 65, 69], 0.2083, 0.11)
    pulses(m0, m9, 0.833, 44, 0.32)
    fx.add(M["m1_gram"], bell(880.0, 3.0, 0.12))                              # el grano: brillo diminuto
    fx.add(M["m2_fifteen"] - 1.0, swell(1.0, 0.5))
    fx.add(M["m2_fifteen"], boom_soft(1.0, 4.0))                              # la torre: peso
    for i in range(12):
        sfx.add(M["m2_fifteen"] + 0.05 + i * 0.07, pulse(60 + i * 6, 0.18))     # bloques apilandose
    for k_ in ("m4_half", "m4_three"):
        sfx.add(M[k_], blip(1320, 0.2, 0.22))
    sfx.add(M["m6_three"], boom_soft(0.4, 2.0))
    for i in range(5):
        sfx.add(M["m6_area"] + i * 0.18, blip(660 - i * 60, 0.25, 0.16))
    # decaimiento: chasquidos de contador que se espacian
    t, gap = M["m7_iodine"], 0.06
    rr = np.random.default_rng(31)
    while t < cue["m7"]["t1"]:
        sfx.add(t, tick(0.10, True), 1.0, rr.uniform(-0.6, 0.6)); gap *= 1.05; t += gap * rr.uniform(0.5, 1.5)
    sfx.add(M["m8_gray"], blip(990, 0.3, 0.2))
    # grullas / memoria: la musica se queda en piano solo
    fx.add(m9 - 0.3, whoosh(1.4, 0.35, 300, 3000))
    mem_a, mem_b = m9, S["round2"][1]
    notes = [69, 65, 62, 64, 65, 57, 62, 60, 62, 65, 69, 67]
    t, i = mem_a + 0.2, 0
    while t < mem_b - 0.5:
        music.add(t, piano(midi(notes[i % len(notes)]), 3.5, 0.55), 1.0, 0.2 * np.sin(i * 1.3))
        if i % 3 == 0:
            music.add(t, piano(midi(notes[i % len(notes)] - 24), 4.0, 0.35))
        t += 1.25; i += 1
    music.add(mem_a, sub_drone(midi(26), mem_b - mem_a + 1, 0.4))
    prog(cue["m11"]["t0"], mem_b, ["Bb", "F", "Gm", "Dm"], 3.33, 0.45, 800)

    # --- 5. Ronda 3 (superacion): armonia que se abre hacia Re mayor
    r3a, r3b = S["round3"]
    round_card(r3a)
    prog(r3a + 0.3, r3b, ["Bb", "F", "Gm", "Dm", "Bb", "F", "G", "A"], 3.33, 0.85, 1400)
    pulses(r3a + 0.6, r3b, 0.833, 49, 0.3)
    arp(cue["c3"]["t0"], r3b, [62, 69, 74, 69, 65, 69], 0.4166, 0.15)
    fx.add(M["c5_close"], bell(392.0, 3.5, 0.12))

    # --- 6. Cierre: Re mayor, discurso de paz, campana final y silencio
    ca, cb = S["closing"]
    prog(ca, M["bell"] - 0.2, ["Dmaj", "Bm", "G", "A"], 3.33, 0.95, 1700)
    arp(ca + 0.4, M["bell"] - 0.8, [62, 66, 69, 74, 69, 66], 0.4166, 0.2)
    pulses(ca + 0.4, cue["d4"]["t0"] - 0.6, 0.833, 49, 0.35)
    fx.add(cue["d4"]["t0"] - 1.4, swell(1.4, 0.4))
    fx.add(M["bell"], bell(98.0, 12.0, 1.0))
    music.add(M["bell"], pad(CH["Dmaj"], 9.0, 900, 0.6, att=1.5))
    # creditos: piano suave
    ka, kb = S["credits"]
    t, i = ka + 0.5, 0
    for nn in [74, 69, 66, 62, 66, 69, 71, 69]:
        if t > kb - 1.5: break
        music.add(t, piano(midi(nn), 3.5, 0.4), 1.0, 0.2 * np.sin(i)); t += 1.25; i += 1
    music.add(ka, pad(CH["Dmaj"], kb - ka, 800, 0.55, att=1.0))

    # --- VOCES
    voice = Bus(N)
    PAN = {"samuel": -0.12, "tomas": 0.12, "narr": 0.0}
    for c in tl["cues"]:
        t0, a = audio[c["id"]]
        voice.add(t0, a, 1.2 if c["who"] != "narr" else 1.1, PAN[c["who"]])
    v = voice.stereo()
    v_wet = reverb(v, 0.8, 0.08, seed=11)

    venv = np.abs(v).max(axis=1)
    venv = signal.fftconvolve(venv, np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
    venv = np.clip(venv / 0.06, 0, 1)
    k2 = int(0.35 * SR)
    venv = signal.fftconvolve(venv, np.hanning(k2) / np.hanning(k2).sum(), mode="same")
    duck = (1.0 - 0.55 * np.clip(venv, 0, 1))[:, None]

    mus = reverb(music.stereo(), 2.6, 0.45, 5)
    fxs = reverb(fx.stereo(), 3.0, 0.35, 8)
    sf = reverb(sfx.stereo(), 1.2, 0.2, 9)
    tt = np.arange(N) / SR
    # silencio real durante el destello: todo menos el tono casi inaudible cae a cero
    sil = 1.0 - np.clip((tt - flash) / 0.05, 0, 1) * np.clip((M["back"] - tt) / 0.3, 0, 1)
    fade_in = np.clip(tt / 0.5, 0, 1)
    fade_out = np.clip((DUR - tt) / 2.5, 0, 1) ** 1.5
    g = (0.55 * fade_in * fade_out * sil)[:, None]
    mix = mus * g * duck + fxs * (0.6 + 0.4 * duck) * (fade_out * np.maximum(sil, 0.0))[:, None] + sf * 0.6 * sil[:, None] + v_wet
    # el tono del silencio se agrega despues del corte para que si se escuche (muy bajo)
    rt = Bus(N); rt.add(flash + 0.1, ring_tone(2.4, 0.02)); mix += rt.stereo()

    sel = venv[:N] > 0.5
    db = lambda x: 20 * np.log10(np.sqrt((x[sel] ** 2).mean()) + 1e-9)
    print(f"  niveles con dialogo -> voz {db(v_wet):.1f} dB | musica {db(mus * g * duck):.1f} dB | fx {db(fxs):.1f} dB")
    peak = np.abs(mix).max()
    mix = mix / max(peak, 1e-6) * 1.5
    mix = np.tanh(mix * 0.95) / np.tanh(0.95 * 1.5) * 0.89
    write_wav(os.path.join(OUT, "mix_raw.wav"), mix)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(OUT, "mix_raw.wav"),
                    "-af", "loudnorm=I=-16:TP=-1.2:LRA=14:linear=true", "-ar", str(SR), os.path.join(OUT, "mix.wav")], check=True)
    os.remove(os.path.join(OUT, "mix_raw.wav"))
    print("Mezcla lista:", os.path.join(OUT, "mix.wav"))

if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "all"
    if stage in ("tts", "all"):
        asyncio.run(stage_tts())
    if stage in ("layout", "mix", "all"):
        tl, audio = stage_layout()
        if stage in ("mix", "all"):
            stage_mix(tl, audio)
