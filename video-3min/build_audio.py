"""
build_audio.py - Guion, voces, linea de tiempo, musica y mezcla del video de 3 minutos.

Etapas (se pueden ejecutar por separado):
    python build_audio.py tts      -> genera las voces neuronales (edge-tts) con tiempos por palabra
    python build_audio.py layout   -> calcula la linea de tiempo y escribe timeline.js
    python build_audio.py mix      -> sintetiza musica + efectos y mezcla out/mix.wav
    python build_audio.py all      -> todo

timeline.js es la UNICA fuente de verdad de tiempos: la animacion (JS) y el audio (Python)
leen las mismas escenas, beats, marcas y dialogos.
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
DUR = 180.0
BPM = 100.0
BEAT = 60.0 / BPM          # 0.6 s
BAR = BEAT * 4             # 2.4 s  -> 75 compases = 180 s exactos

VOICES = {
    "sofia":  dict(voice="es-CO-SalomeNeural",  rate="+2%", pitch="+10Hz"),
    "martin": dict(voice="es-CO-GonzaloNeural", rate="+3%", pitch="+14Hz"),
    "juan":   dict(voice="es-MX-JorgeNeural",   rate="+4%", pitch="+4Hz"),
}

# ----------------------------------------------------------------------------
# GUION
# ----------------------------------------------------------------------------
def L(id, who, text, gap=0.32, tts=None, post=0.0, shout=False):
    return dict(kind="line", id=id, who=who, text=text, tts=tts or text, gap=gap, post=post, shout=shout)

def B(name, dur, marks=None, lines=None):
    return dict(kind="beat", name=name, dur=dur, marks=marks or {}, lines=lines or [])

SCENES = [
    ("logo", [
        B("sting", 6.4, marks={"logo_pop": 1.0, "logo_text": 2.3, "wipe_in": 5.55}),
    ]),
    ("intro", [
        B("enter", 2.3),
        L("i1", "sofia", "¡Hola! Somos Sofía, Juan Diego y Martín, de grado décimo del Colegio San Bonifacio de las Lanzas.", gap=0.0),
        L("i2", "juan", "Y venimos a contarte lo que descubrimos en nuestra propia cancha."),
        L("i3", "martin", "Todo empezó con una pregunta muy sencilla."),
        L("i4", "sofia", "¿En la cancha… jugamos todos?", gap=0.45),
        B("title", 4.0, marks={"toss": 0.15, "title_hit": 0.75, "title_out": 3.45}),
    ]),
    ("problem", [
        B("s2_in", 0.9),
        L("p1", "martin", "En el voleibol tradicional, la red está a 2,43 metros. Gana el que más salta.",
          tts="En el voleibol tradicional, la red está a dos metros cuarenta y tres. Gana el que más salta.", gap=0.0),
        B("spike1", 2.1, marks={"jump": 0.45, "hit1": 0.95, "land1": 1.4}),
        L("p2", "juan", "Y los equipos casi siempre se arman con los mejores.", gap=0.1),
        B("exclusion", 3.7, marks={"ask": 0.35, "ignore": 1.35, "hit2": 2.25, "sad": 2.7},
          lines=[(0.35, L("x_ask", "martin", "¡Aquí! ¡Estoy solo!", shout=True))]),
        L("p3", "sofia", "Le preguntamos a 73 compañeros. El 47,9 % se ha sentido excluido.",
          tts="Le preguntamos a setenta y tres compañeros. El cuarenta y siete punto nueve por ciento se ha sentido excluido.", gap=0.45),
        L("p4", "martin", "Y el 68,5 % dice que siempre eligen a los mismos.",
          tts="Y el sesenta y ocho punto cinco por ciento dice que siempre eligen a los mismos."),
        L("p5", "juan", "Las quejas más repetidas: que me griten por equivocarme… y que no me pasen el balón.", gap=0.4),
        L("p6", "sofia", "Eso no es competir. Eso es excluir.", gap=0.45, post=0.5),
    ]),
    ("history", [
        B("s3_in", 1.3, marks={"zoom": 0.85}),
        L("h1", "sofia", "Pero en 2016, un partido cambió la historia: Ruanda contra Colombia, en voleibol sentado.",
          tts="Pero en dos mil dieciséis, un partido cambió la historia: Ruanda contra Colombia, en voleibol sentado.", gap=0.0),
        L("h2", "martin", "En la misma cancha jugaron excombatientes y víctimas de la guerra. Antiguos enemigos."),
        L("h3", "juan", "¿Enemigos… en el mismo partido?", gap=0.35),
        L("h4", "sofia", "Sí. Y recibieron el premio Peace and Sport, porque demostraron que el perdón también se entrena.",
          tts="Sí. Y recibieron el premio Pis and Sport, porque demostraron que el perdón también se entrena."),
        L("h5", "martin", "Y en el Mundial de Sarajevo 2022 vimos lo mismo: ningún equipo gana sin cooperar.",
          tts="Y en el Mundial de Sarajevo dos mil veintidós vimos lo mismo: ningún equipo gana sin cooperar."),
        L("h6", "sofia", "Y pensamos: ¿y si lo probamos en nuestro colegio?", gap=0.45, post=0.45),
    ]),
    ("rule", [
        B("s4_in", 0.9),
        L("r1", "juan", "¿Y qué tiene de especial el voleibol sentado?", gap=0.0),
        L("r2", "martin", "Una regla: la pelvis siempre en contacto con el suelo."),
        L("r3", "sofia", "La red baja a 1,15 metros, y la cancha se reduce a diez por seis.",
          tts="La red baja a un metro quince, y la cancha se reduce a diez por seis.", gap=0.5, post=0.5),
        L("r4", "juan", "Sin salto, ya no gano por altura. Ahora necesito a mi equipo."),
        L("r5", "martin", "Nos movemos con los brazos, y nos hablamos con miradas y señas."),
        L("r6", "sofia", "Si el cuerpo no puede dominar por la fuerza, la mente se ve obligada a cooperar.", gap=0.45, post=0.45),
    ]),
    ("play", [
        B("ready", 2.3, marks={"whistle": 0.75}),
        B("rally", 13.3,
          marks={"serve": 0.55, "recv": 1.95, "set": 3.3, "tip": 4.5, "odig": 5.55, "oset": 6.45, "oatk": 7.35,
                 "save": 8.45, "set2": 9.75, "spike": 11.25, "land": 11.65, "punto": 11.9},
          lines=[(1.5, L("y_mia", "sofia", "¡Mía!", shout=True)),
                 (3.0, L("y_arriba", "martin", "¡Juan Diego!", shout=True)),
                 (7.75, L("y_tengo", "martin", "¡La tengo!", shout=True)),
                 (9.35, L("y_tuya", "sofia", "¡Tuya!", shout=True)),
                 (10.55, L("y_voy", "juan", "¡Voy!", shout=True))]),
        B("celebrate", 2.5, marks={"five": 1.05},
          lines=[(0.10, L("c_sofia", "sofia", "¡Sí!", shout=True)),
                 (0.25, L("c_juan", "juan", "¡Vamos!", shout=True)),
                 (0.40, L("c_martin", "martin", "¡Eso!", shout=True))]),
        L("y1", "juan", "¡Ese punto fue de los tres!", gap=0.0),
        L("y2", "martin", "Competencia, restricción… y de ahí nace el espíritu colectivo."),
        L("y3", "sofia", "Hegel lo llamaría síntesis. Nosotros lo llamamos jugar en equipo.", gap=0.4, post=0.5),
    ]),
    ("hope", [
        B("s6_in", 0.8),
        L("e1", "sofia", "Y lo mejor: el 71,2 % de nuestros compañeros quiere probar el voleibol sentado.",
          tts="Y lo mejor: el setenta y uno punto dos por ciento de nuestros compañeros quiere probar el voleibol sentado.", gap=0.0),
        L("e2", "juan", "La verdadera competencia no es excluir al que menos sabe.", gap=0.4),
        L("e3", "martin", "Es descubrir que todos aportamos al equipo."),
        L("e3b", "juan", "Este video es nuestro primer paso.", gap=0.4),
        L("e4", "sofia", "Porque en la cancha…", gap=0.45),
        B("all", 3.0, marks={"arms": 0.15},
          lines=[(0.12, L("e5", "sofia", "¡Jugamos todos!")),
                 (0.12, L("e5_j", "juan", "¡Jugamos todos!", shout=True)),
                 (0.12, L("e5_m", "martin", "¡Jugamos todos!", shout=True))]),
    ]),
    ("credits", [
        B("credits", None, marks={}),   # se estira hasta 180 s
    ]),
]

# Marcas derivadas de palabras dichas: nombre -> (cue, prefijo de palabra, n-esima aparicion, offset)
WORD_MARKS = {
    "i1_sofia": ("i1", "sofia", 0, 0), "i1_juan": ("i1", "juan", 0, 0), "i1_martin": ("i1", "martin", 0, 0),
    "i1_colegio": ("i1", "colegio", 0, 0),
    "p1_red": ("p1", "red", 0, 0), "p1_gana": ("p1", "gana", 0, 0),
    "p3_73": ("p3", "setenta", 0, 0), "p3_pct": ("p3", "cuarenta", 0, 0), "p3_excl": ("p3", "excluido", 0, 0),
    "p4_pct": ("p4", "sesenta", 0, 0),
    "p5_q1": ("p5", "griten", 0, -0.35), "p5_q2": ("p5", "pasen", 0, -0.45),
    "p6_no": ("p6", "competir", 0, 0), "p6_excluir": ("p6", "excluir", 0, 0),
    "h1_2016": ("h1", "dos", 0, 0), "h1_ruanda": ("h1", "ruanda", 0, 0), "h1_colombia": ("h1", "colombia", 0, 0),
    "h1_sentado": ("h1", "voleibol", 0, 0),
    "h2_ex": ("h2", "excombatientes", 0, 0), "h2_vic": ("h2", "victimas", 0, 0), "h2_enemigos": ("h2", "antiguos", 0, 0),
    "h4_premio": ("h4", "premio", 0, 0), "h4_perdon": ("h4", "perdon", 0, 0),
    "h5_sarajevo": ("h5", "sarajevo", 0, 0), "h5_ningun": ("h5", "ningun", 0, 0),
    "r2_pelvis": ("r2", "pelvis", 0, 0),
    "r3_red": ("r3", "red", 0, 0), "r3_cancha": ("r3", "cancha", 0, 0),
    "r4_salto": ("r4", "salto", 0, 0), "r4_equipo": ("r4", "ahora", 0, 0),
    "r5_brazos": ("r5", "movemos", 0, 0), "r5_miradas": ("r5", "miradas", 0, 0),
    "r6_mente": ("r6", "mente", 0, 0),
    "y2_tesis": ("y2", "competencia", 0, 0), "y2_anti": ("y2", "restriccion", 0, 0), "y2_sint": ("y2", "espiritu", 0, 0), "y3_equipo": ("y3", "jugar", 0, 0), "h6_si": ("h6", "probamos", 0, 0),
    "e1_pct": ("e1", "setenta", 0, 0), "e1_probar": ("e1", "probar", 0, 0),
    "e3_todos": ("e3", "todos", 0, 0),
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
            else:
                for _, ln in it["lines"]:
                    yield ln

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
    data = np.clip(stereo, -1, 1)
    pcm = (data * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())

# ----------------------------------------------------------------------------
# ETAPA 1: TTS
# ----------------------------------------------------------------------------
async def tts_one(ln):
    import edge_tts
    key = cache_key(ln)
    wav = os.path.join(TMP, key + ".wav")
    meta = os.path.join(TMP, key + ".json")
    if os.path.exists(wav) and os.path.exists(meta):
        return
    v = VOICES[ln["who"]]
    mp3 = os.path.join(TMP, key + ".mp3")
    words = []
    for attempt in range(4):
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
        except Exception as e:  # red inestable: reintentar
            print("  reintento", ln["id"], e)
            await asyncio.sleep(1.5)
    else:
        raise RuntimeError("TTS fallo para " + ln["id"])
    # voz limpia: pasa-altos, presencia y compresion suave
    af = "highpass=f=95,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2"
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
    # fin real de la voz (recorta silencio de cola)
    env = np.abs(a)
    k = int(SR * 0.02)
    sm = np.convolve(env, np.ones(k) / k, mode="same")
    idx = np.where(sm > 0.012)[0]
    end = (idx[-1] + int(SR * 0.08)) if len(idx) else len(a)
    start = max(0, idx[0] - int(SR * 0.03)) if len(idx) else 0
    a = a[start:min(end, len(a))]
    off = start / SR
    words = [[w, max(0, t0 - off), max(0, t1 - off)] for w, t0, t1 in words]
    return a, words

# ----------------------------------------------------------------------------
# ETAPA 2: LAYOUT -> timeline.js
# ----------------------------------------------------------------------------
def envelope(a, hz=60):
    hop = SR // hz
    n = len(a) // hop + 1
    pad = np.zeros(n * hop, dtype=np.float32); pad[:len(a)] = a
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(axis=1))
    ref = np.percentile(rms, 92) + 1e-6
    e = np.clip(rms / ref, 0, 1.0)
    e = np.convolve(e, [0.25, 0.5, 0.25], mode="same")
    return [int(round(x * 99)) for x in e]

def stage_layout():
    scenes, beats, marks, cues = {}, {}, {}, []
    audio = {}
    t = 0.0

    def place(ln, t0):
        a, words = load_line(ln)
        d = len(a) / SR
        cues.append(dict(id=ln["id"], who=ln["who"], t0=round(t0, 3), t1=round(t0 + d, 3), text=ln["text"],
                         shout=ln["shout"], words=[[w, round(t0 + a0, 3), round(t0 + a1, 3)] for w, a0, a1 in words],
                         env=envelope(a)))
        audio[ln["id"]] = (t0, a)
        return d

    for name, items in SCENES:
        s0 = t
        for it in items:
            if it["kind"] == "beat":
                dur = it["dur"]
                if dur is None:
                    dur = DUR - t
                    if dur < 9.0:
                        raise SystemExit(f"El guion se pasa: quedan {dur:.2f}s para creditos (minimo 9).")
                beats[it["name"]] = [round(t, 3), round(t + dur, 3)]
                for off, ln in it["lines"]:
                    place(ln, t + off)
                for k, off in it["marks"].items():
                    marks[k] = round(t + off, 3)
                t += dur
            else:
                t += it["gap"]
                t += place(it, t)
                t += it["post"]
        scenes[name] = [round(s0, 3), round(t, 3)]

    cue_by_id = {c["id"]: c for c in cues}
    for mk, (cid, prefix, nth, off) in WORD_MARKS.items():
        c = cue_by_id[cid]
        hits = [w for w in c["words"] if norm(w[0]).startswith(prefix)]
        if len(hits) <= nth:
            raise SystemExit(f"Marca {mk}: no encuentro '{prefix}' en {cid}: {[w[0] for w in c['words']]}")
        marks[mk] = round(hits[nth][1] + off, 3)

    tl = dict(dur=DUR, fps=30, bpm=BPM, scenes=scenes, beats=beats, marks=marks, cues=cues)
    with open(os.path.join(HERE, "timeline.js"), "w", encoding="utf8") as f:
        f.write("// GENERADO por build_audio.py - no editar a mano\nexport const TL = ")
        json.dump(tl, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print("ESCENAS:")
    for k, (a, b) in scenes.items():
        print(f"  {k:9s} {a:7.2f} -> {b:7.2f}  ({b - a:5.2f}s)")
    for c in cues:
        if not c["shout"]:
            print(f"  {c['t0']:7.2f}-{c['t1']:7.2f} {c['who']:6s} {c['text'][:70]}")
    return tl, audio

# ----------------------------------------------------------------------------
# ETAPA 3: MUSICA + SFX + MEZCLA
# ----------------------------------------------------------------------------
N = int(SR * DUR)
rng = np.random.default_rng(7)

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)

class Bus:
    def __init__(self):
        self.l = np.zeros(N + SR * 6, dtype=np.float32)
        self.r = np.zeros(N + SR * 6, dtype=np.float32)
    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i < 0:
            sig = sig[-i:]; i = 0
        n = min(len(sig), len(self.l) - i)
        if n <= 0:
            return
        gl = gain * np.cos((pan + 1) * np.pi / 4) * 1.414
        gr = gain * np.sin((pan + 1) * np.pi / 4) * 1.414
        self.l[i:i + n] += sig[:n] * gl
        self.r[i:i + n] += sig[:n] * gr
    def stereo(self):
        return np.stack([self.l[:N], self.r[:N]], axis=1)

def adsr(n, a=0.005, d=0.1, s=0.7, r=0.1):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([np.linspace(0, 1, max(a_n, 1)), np.linspace(1, s, max(d_n, 1)),
                          np.full(s_n, s), np.linspace(s, 0, max(r_n, 1))])
    return env[:n] if len(env) >= n else np.pad(env, (0, n - len(env)))

def saw(freq, dur, harm=10, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    f = freq * (1 + detune)
    for k in range(1, harm + 1):
        if f * k > 9000: break
        out += np.sin(2 * np.pi * f * k * t + k * 0.7) / k
    return out.astype(np.float32) * 0.5

def kick(amp=1.0):
    d = 0.32; t = np.arange(int(d * SR)) / SR
    f = 46 + 95 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 9.5)
    s[:int(0.004 * SR)] += rng.uniform(-0.4, 0.4, int(0.004 * SR))
    return (s * amp).astype(np.float32)

def noise_hit(dur, lo, hi, decay, amp=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n).astype(np.float32)
    sos = signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos")
    x = signal.sosfilt(sos, x)
    t = np.arange(n) / SR
    return (x * np.exp(-t * decay) * amp).astype(np.float32)

def clap(amp=1.0):
    s = noise_hit(0.22, 900, 3800, 22, 1.0)
    for dly in (0.011, 0.023):
        k = int(dly * SR); s[k:] += s[:-k] * 0.6
    return s * amp * 0.6

def hat(amp=1.0, open_=False):
    return noise_hit(0.22 if open_ else 0.06, 6500, 13000, 14 if open_ else 70, amp)

def pluck(freq, dur=0.5, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        if freq * k > 10000: break
        out += np.sin(2 * np.pi * freq * k * t) / (k ** (1.9 - 0.5 * bright)) * np.exp(-t * (5 + k * 2.2))
    out *= np.minimum(1, t / 0.004)
    return out.astype(np.float32) * 0.6

def piano(freq, dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 10):
        fk = freq * k * (1 + 0.0004 * k * k)
        if fk > 10000: break
        out += np.sin(2 * np.pi * fk * t + k) / (k ** 1.35) * np.exp(-t * (1.3 + k * 0.75))
    out *= np.minimum(1, t / 0.003)
    out *= np.minimum(1, (dur - t) / 0.08)
    return out.astype(np.float32) * 0.5

def bass_note(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 6) + 0.2 * np.sin(6 * np.pi * freq * t) * np.exp(-t * 9)
    return (out * adsr(n, 0.006, 0.08, 0.75, 0.05)).astype(np.float32) * 0.55

def pad_chord(notes, dur, bright=1400):
    n = int(dur * SR)
    out = np.zeros(n, dtype=np.float32)
    for m in notes:
        f = midi(m)
        for det in (-0.004, 0.0, 0.004):
            out += saw(f, dur, harm=8, detune=det)[:n] / 3
    sos = signal.butter(2, bright, btype="low", fs=SR, output="sos")
    out = signal.sosfilt(sos, out).astype(np.float32)
    return out * adsr(n, min(0.5, dur * 0.25), 0.2, 0.85, min(0.6, dur * 0.3)) * 0.22

def riser(dur, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n).astype(np.float32)
    out = np.zeros(n, dtype=np.float32)
    # barrido de filtro por tramos
    segs = 24
    for i in range(segs):
        a, b = i * n // segs, (i + 1) * n // segs
        fc = 300 * (14000 / 300) ** (i / (segs - 1))
        sos = signal.butter(2, [fc * 0.6, min(fc * 1.4, 20000)], btype="band", fs=SR, output="sos")
        lo = max(0, a - 2000)
        y = signal.sosfilt(sos, x[lo:b])
        out[a:b] = y[a - lo:]
    return out * (t / dur) ** 2.2 * amp * 0.9

def whoosh(dur=0.6, amp=1.0, lo=250, hi=5000):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n).astype(np.float32)
    sos = signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos")
    x = signal.sosfilt(sos, x)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2.5
    return (x * env * amp * 0.5).astype(np.float32)

def impact(amp=1.0, dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 34 + 50 * np.exp(-t * 7)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    s += noise_hit(dur, 60, 1800, 5.5, 0.55)
    return (s * amp).astype(np.float32)

def thump(f0=170, f1=70, dur=0.16, amp=1.0, noise=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    s += noise_hit(dur, 500, 5000, 60, noise)
    return (s * amp).astype(np.float32)

def blip(freq=1200, dur=0.07, amp=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) * np.exp(-t * 45) * amp).astype(np.float32)

def whistle(dur=0.55, amp=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 2850 * t + 2.2 * np.sin(2 * np.pi * 38 * t)) + 0.5 * np.sin(2 * np.pi * 3120 * t)
    s += rng.standard_normal(n) * 0.12
    return (s * adsr(n, 0.01, 0.02, 0.9, 0.05) * amp * 0.5).astype(np.float32)

def servo(dur=2.6, amp=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 150 - 55 * (t / dur)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * 0.4
    sos = signal.butter(2, 900, btype="low", fs=SR, output="sos")
    s = signal.sosfilt(sos, s)
    return (s * adsr(n, 0.15, 0.1, 0.8, 0.3) * amp).astype(np.float32)

def reverb(st, secs=1.7, wet=0.25, seed=3):
    r = np.random.default_rng(seed)
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros_like(st)
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-t * (6.0 / secs))
        ir[:int(0.012 * SR)] = 0
        sos = signal.butter(1, 5200, btype="low", fs=SR, output="sos")
        ir = signal.sosfilt(sos, ir)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = signal.fftconvolve(st[:, ch], ir)[:len(st)]
    return st + out * wet

# Acordes (notas MIDI)
CH = {
    "C": [48, 60, 64, 67], "G": [43, 59, 62, 67], "Am": [45, 60, 64, 69], "F": [41, 60, 65, 69],
    "Dm": [50, 62, 65, 69], "E": [40, 59, 64, 68], "Em": [40, 59, 64, 67], "Csus": [48, 60, 65, 67],
}

def stage_mix(tl, audio):
    S = tl["scenes"]; M = tl["marks"]; Bt = tl["beats"]

    def bar_of(t):
        return int(round(t / BAR))

    # --- Secciones musicales alineadas al compas mas cercano de cada escena
    b_intro = bar_of(S["intro"][0])
    b_prob = bar_of(S["problem"][0])
    b_hist = bar_of(S["history"][0])
    b_rule = bar_of(S["rule"][0])
    b_play = bar_of(S["play"][0])
    b_hope = bar_of(S["hope"][0])
    b_cred = bar_of(S["credits"][0])
    b_end = 75

    def section(b):
        if b < b_intro: return "sting"
        if b < b_prob: return "intro"
        if b < b_hist: return "problem"
        if b < b_rule: return "history"
        if b < b_play: return "rule"
        if b < b_hope: return "play"
        if b < b_cred: return "hope"
        return "credits"

    PROG = {
        "sting": ["Csus", "Csus", "C", "C"],
        "intro": ["C", "G", "Am", "F"],
        "problem": ["Am", "F", "Dm", "E"],
        "history": ["F", "G", "Am", "Em"],
        "rule": ["Am", "F", "C", "G"],
        "play": ["Am", "F", "C", "G"],
        "hope": ["C", "G", "Am", "F"],
        "credits": ["C", "G", "F", "C"],
    }
    starts = {"sting": 0, "intro": b_intro, "problem": b_prob, "history": b_hist, "rule": b_rule,
              "play": b_play, "hope": b_hope, "credits": b_cred}

    drums, bass, pads, keys, fx = Bus(), Bus(), Bus(), Bus(), Bus()

    for b in range(b_end):
        sec = section(b)
        k = b - starts[sec]                      # compas dentro de la seccion
        nb = {"sting": b_intro, "intro": b_prob, "problem": b_hist, "history": b_rule, "rule": b_play,
              "play": b_hope, "hope": b_cred, "credits": b_end}[sec] - starts[sec]
        prog = PROG[sec]
        ch = CH[prog[k % 4]]
        root = ch[0]
        t0 = b * BAR
        last = (k == nb - 1)
        final = (b >= b_end - 2)

        # ---- PAD
        bright = {"sting": 900, "intro": 1500, "problem": 800, "history": 1200, "rule": 1300, "play": 1900, "hope": 2200, "credits": 1800}[sec]
        pg = {"sting": 0.7, "intro": 0.75, "problem": 0.8, "history": 0.9, "rule": 0.8, "play": 0.8, "hope": 1.0, "credits": 0.95}[sec]
        if final and b == b_end - 2:
            pads.add(t0, pad_chord(CH["C"][1:] + [72], BAR * 2 + 2.5, bright), pg)
        elif not final:
            pads.add(t0, pad_chord(ch[1:], BAR + 0.25, bright), pg)

        # ---- BAJO
        if sec in ("intro", "hope", "play"):
            patt = [0, 1.5, 2, 3, 3.5] if sec != "play" else [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
            for p in patt:
                note = root + (12 if (sec == "play" and p in (1.5, 3.5)) else 0)
                bass.add(t0 + p * BEAT, bass_note(midi(note), BEAT * (0.45 if sec == "play" else 0.8)), 0.8)
        elif sec == "problem":
            bass.add(t0, bass_note(midi(root), BAR * 0.95), 0.75)
        elif sec == "rule":
            for p in ([0, 2] if k < 4 else [0, 1.5, 2, 3.5]):
                bass.add(t0 + p * BEAT, bass_note(midi(root), BEAT * 0.9), 0.7)
        elif sec == "history":
            bass.add(t0, bass_note(midi(root), BAR * 0.9), 0.5)
        elif sec == "credits" and not final:
            for p in [0, 1.5, 2, 3]:
                bass.add(t0 + p * BEAT, bass_note(midi(root), BEAT * 0.8), 0.75)
        elif final and b == b_end - 2:
            bass.add(t0, bass_note(midi(36), BAR * 1.9), 0.8)

        # ---- BATERIA
        if sec in ("intro", "hope", "credits") and not final:
            full = sec != "intro" or k >= 1
            for q in range(4):
                drums.add(t0 + q * BEAT, kick(0.9 if q in (0, 2) else 0.55), 0.8)
                if q in (1, 3) and full:
                    drums.add(t0 + q * BEAT, clap(0.8), 0.7)
            for e in range(8):
                drums.add(t0 + e * BEAT / 2, hat(0.35 if e % 2 else 0.2), 0.5, pan=0.25)
            if sec == "hope":
                for e in range(16):
                    if e % 2: drums.add(t0 + e * BEAT / 4, hat(0.14), 0.4, pan=-0.3)
        elif sec == "problem":
            drums.add(t0, kick(0.8), 0.7)
            drums.add(t0 + 2.5 * BEAT, kick(0.5), 0.6)
            if k % 2 == 1: drums.add(t0 + 2 * BEAT, clap(0.5), 0.5)
            for e in range(8):
                drums.add(t0 + e * BEAT / 2, blip(2400 if e % 4 else 3200, 0.03, 0.10), 0.5, pan=0.4 if e % 2 else -0.4)
        elif sec == "rule":
            if k >= 2:
                for q in range(4):
                    drums.add(t0 + q * BEAT, kick(0.75), 0.7)
            if k >= 4:
                for e in range(8):
                    drums.add(t0 + e * BEAT / 2, hat(0.28 if e % 2 else 0.14), 0.5, pan=0.2)
            if k >= 6:
                drums.add(t0 + BEAT, clap(0.6), 0.6); drums.add(t0 + 3 * BEAT, clap(0.6), 0.6)
        elif sec == "play":
            for q in range(4):
                drums.add(t0 + q * BEAT, kick(1.0), 0.85)
                if q in (1, 3): drums.add(t0 + q * BEAT, clap(0.9), 0.75)
            for e in range(16):
                drums.add(t0 + e * BEAT / 4, hat(0.3 if e % 4 == 2 else 0.16, open_=(e == 14)), 0.5, pan=0.3 if e % 2 else -0.3)
        if last and sec not in ("sting", "credits", "history"):
            for e in range(6):   # redoble de transicion
                drums.add(t0 + BAR - (6 - e) * BEAT / 4, clap(0.35 + e * 0.1), 0.6)

        # ---- TECLAS / ARPEGIOS
        up = [ch[1], ch[2], ch[3], ch[2] + 12]
        if sec == "intro":
            for e in range(8):
                keys.add(t0 + e * BEAT / 2, pluck(midi(up[(e * 3) % 4] + 12), 0.45, 1.0), 0.42, pan=-0.35 if e % 2 else 0.35)
        elif sec == "problem":
            for e in (0, 3, 6):
                keys.add(t0 + e * BEAT / 2, pluck(midi(up[e % 3]), 0.9, 0.3), 0.45, pan=-0.2)
        elif sec == "history":
            pat = [(0, ch[1]), (1, ch[2]), (2, ch[3]), (2.5, ch[2]), (3, ch[3] + (2 if k % 2 else 0))]
            for p, n in pat:
                keys.add(t0 + p * BEAT, piano(midi(n + 12), 2.4), 0.55, pan=-0.15 + 0.1 * p)
            keys.add(t0, piano(midi(root + 12), 2.4), 0.5)
        elif sec == "rule":
            steps = 8 if k < 4 else 16
            for e in range(steps):
                keys.add(t0 + e * BAR / steps, pluck(midi(up[e % 4] + 12), 0.35, 0.6 + 0.4 * min(1, k / 8)), 0.24 + 0.02 * min(k, 8), pan=-0.4 if e % 2 else 0.4)
        elif sec == "play":
            for e in range(16):
                keys.add(t0 + e * BEAT / 4, pluck(midi(up[(e * 5) % 4] + 12), 0.25, 1.0), 0.3, pan=-0.45 if e % 2 else 0.45)
        elif sec in ("hope", "credits") and not final:
            for e in range(8):
                keys.add(t0 + e * BEAT / 2, pluck(midi(up[(e * 3) % 4] + 12), 0.5, 1.0), 0.4, pan=-0.35 if e % 2 else 0.35)
            mel = [ch[3] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 24]
            keys.add(t0, piano(midi(mel[k % 4]), 2.2), 0.5)
            keys.add(t0 + 2.5 * BEAT, piano(midi(mel[(k + 1) % 4]), 1.6), 0.38)
        if final and b == b_end - 2:
            for i, n in enumerate([60, 64, 67, 72, 76, 79, 84]):
                keys.add(t0 + i * BEAT / 2, piano(midi(n), 4.0), 0.5, pan=-0.3 + 0.1 * i)

    # --- Momentos especiales (FX musicales)
    fx.add(0.0, riser(M["logo_pop"], 0.5), 0.6)
    fx.add(M["logo_pop"], impact(0.9), 0.9)
    for i, n in enumerate([72, 76, 79, 84]):
        fx.add(M["logo_text"] + i * 0.12, piano(midi(n), 2.5), 0.4, pan=-0.3 + 0.2 * i)
    fx.add(M["wipe_in"] - 1.6, riser(1.6, 0.7), 0.6)
    fx.add(M["wipe_in"], whoosh(0.9, 1.0), 0.8)
    for sc in ("problem", "history", "rule", "play", "hope", "credits"):
        t = S[sc][0]
        fx.add(t - 1.3, riser(1.3, 0.55), 0.5)
        fx.add(t - 0.25, whoosh(0.8, 0.9), 0.7)
        fx.add(t + 0.05, impact(0.5, 1.4), 0.6)
    fx.add(M["title_hit"] - 0.5, whoosh(0.6, 1.0, 150, 3000), 0.8)
    fx.add(M["title_hit"], impact(1.0), 0.9)
    fx.add(M["title_out"], whoosh(0.6, 0.8), 0.7)
    fx.add(M["spike"] - 1.8, riser(1.8, 0.8), 0.7)
    fx.add(M["punto"], impact(1.0), 0.9)
    fx.add(Bt["all"][0] - 1.4, riser(1.5, 0.8), 0.7)
    fx.add(M["arms"] + 0.1, impact(0.9), 0.9)

    # --- SFX diegeticos / interfaz
    sfx = Bus()
    def ui(t, f=1300, a=0.35): sfx.add(t, blip(f, 0.08, a), 0.6)
    def pop(t): sfx.add(t, blip(700, 0.05, 0.4), 0.6); sfx.add(t + 0.03, blip(1500, 0.07, 0.3), 0.5)
    def counter(t, d=1.0):
        for i in range(int(d / 0.055)):
            sfx.add(t + i * 0.055, blip(1800 + i * 25, 0.025, 0.16), 0.5, pan=0.3)
        sfx.add(t + d, blip(2200, 0.18, 0.35), 0.6, pan=0.3)
    def step(t, pan=0.0, a=0.3): sfx.add(t, thump(120, 60, 0.09, a, 0.25), 0.5, pan)
    def ballhit(t, a=0.8, pan=0.0): sfx.add(t, thump(210, 90, 0.14, a, 0.5), 0.9, pan)

    # pasos de entrada
    e0 = Bt["enter"][0]
    for i in range(8):
        step(e0 + 0.15 + i * 0.3, pan=-0.5 + i * 0.07)
    for mk in ("i1_sofia", "i1_juan", "i1_martin"):
        sfx.add(M[mk] - 0.1, whoosh(0.3, 0.5, 800, 6000), 0.5); pop(M[mk])
    ballhit(M["toss"], 0.5)
    # problema
    ui(M["p1_red"]); sfx.add(M["p1_red"], whoosh(0.5, 0.5), 0.5)
    step(M["jump"] - 0.3, 0.2, 0.5); step(M["jump"] - 0.1, 0.2, 0.5)
    sfx.add(M["jump"], whoosh(0.45, 0.6, 300, 2500), 0.6)
    sfx.add(M["hit1"], thump(260, 80, 0.2, 1.0, 0.9), 1.0)
    sfx.add(M["land1"], thump(110, 45, 0.3, 0.9, 0.4), 0.9, -0.2)
    step(M["land1"] + 0.12, 0.2, 0.7)
    pop(M["p3_73"]); counter(M["p3_pct"], 1.1)
    counter(M["p4_pct"], 1.1)
    for mk in ("p5_q1", "p5_q2"):
        pop(M[mk]); sfx.add(M[mk], thump(90, 50, 0.2, 0.5, 0.1), 0.6)
    sfx.add(M["p6_no"], whoosh(0.3, 0.5), 0.5)
    sfx.add(M["p6_excluir"], impact(0.7, 1.2), 0.8)
    # historia
    sfx.add(M["zoom"] - 0.3, whoosh(0.9, 1.0, 120, 4000), 0.8)
    for mk in ("h1_2016", "h1_ruanda", "h1_colombia", "h1_sentado", "h2_ex", "h2_vic", "h4_premio", "h5_sarajevo"):
        sfx.add(M[mk] - 0.12, whoosh(0.35, 0.45, 700, 6000), 0.5); ui(M[mk], 1100, 0.25)
    sfx.add(M["h2_enemigos"], impact(0.45, 1.2), 0.6)
    sfx.add(M["h4_perdon"], blip(1568, 0.5, 0.25), 0.5); sfx.add(M["h4_perdon"] + 0.1, blip(2093, 0.6, 0.22), 0.5)
    ui(M["h5_ningun"], 1500)
    # regla
    sfx.add(M["r2_pelvis"] + 0.25, thump(100, 45, 0.25, 0.7, 0.3), 0.8)
    sfx.add(M["r2_pelvis"] + 0.45, blip(880, 0.25, 0.3), 0.6); sfx.add(M["r2_pelvis"] + 0.55, blip(1320, 0.3, 0.25), 0.6)
    sfx.add(M["r3_red"], servo(2.4, 0.35), 0.6); sfx.add(M["r3_red"] + 2.4, thump(140, 70, 0.12, 0.6, 0.5), 0.7)
    counter(M["r3_red"] + 0.2, 2.1)
    sfx.add(M["r3_cancha"], whoosh(1.6, 0.6, 200, 3000), 0.6); ui(M["r3_cancha"] + 1.7, 1700)
    sfx.add(M["r4_salto"], blip(300, 0.25, 0.3), 0.6); sfx.add(M["r4_salto"] + 0.12, blip(220, 0.3, 0.3), 0.6)
    for i in range(3):
        sfx.add(M["r5_brazos"] + 0.1 + i * 0.5, whoosh(0.4, 0.45, 300, 2000), 0.5, -0.2 + i * 0.2)
    ui(M["r5_miradas"], 1900, 0.3); ui(M["r5_miradas"] + 0.5, 2300, 0.3)
    # jugada
    sfx.add(M["whistle"], whistle(0.6), 0.7)
    ballhit(M["serve"], 0.8, -0.3)
    sfx.add(M["serve"], whoosh(1.2, 0.5, 400, 3000), 0.5)
    ballhit(M["recv"], 0.9, 0.2)
    ballhit(M["set"], 0.6, 0.0)
    ballhit(M["tip"], 0.6, -0.1); ballhit(M["odig"], 0.5, -0.4); ballhit(M["oset"], 0.4, -0.3); ballhit(M["oatk"], 0.8, -0.3)
    sfx.add(M["save"] - 0.6, whoosh(0.6, 0.6, 300, 2500), 0.6, 0.3)
    ballhit(M["save"], 0.9, 0.4); ballhit(M["set2"], 0.6, 0.0)
    ballhit(M["ignore"], 0.5); sfx.add(M["hit2"], thump(260, 80, 0.2, 0.9, 0.8), 0.9)
    sfx.add(M["sad"], blip(330, 0.5, 0.22), 0.5); sfx.add(M["sad"] + 0.25, blip(262, 0.7, 0.22), 0.5)
    ui(M["h6_si"], 1500, 0.3); pop(M["y3_equipo"])
    sfx.add(M["spike"] - 0.35, whoosh(0.4, 0.8, 300, 3500), 0.7)
    sfx.add(M["spike"], thump(280, 70, 0.25, 1.0, 1.0), 1.1)
    sfx.add(M["land"], thump(110, 40, 0.4, 1.0, 0.5), 1.0, -0.2)
    sfx.add(M["land"], impact(0.7, 1.5), 0.7)
    cb = Bt["celebrate"][0]
    for i in range(14):   # palmas del equipo
        sfx.add(cb + 0.3 + i * 0.14 + rng.uniform(-0.02, 0.02), clap(0.5), 0.5, rng.uniform(-0.6, 0.6))
    sfx.add(M["five"], clap(1.0), 0.9); sfx.add(M["five"], thump(300, 150, 0.08, 0.6, 0.6), 0.8)
    for mk, f in (("y2_tesis", 660), ("y2_anti", 740), ("y2_sint", 990)):
        pop(M[mk]); sfx.add(M[mk], blip(f, 0.4, 0.25), 0.5)
    sfx.add(M["y2_sint"], impact(0.6, 1.4), 0.7)
    # esperanza
    counter(M["e1_pct"], 1.3)
    ballhit(tl_cue(tl, "e2")["t0"] - 0.15, 0.45, -0.3); ballhit(tl_cue(tl, "e3")["t0"] - 0.15, 0.45, 0.3)
    ballhit(M["arms"] + 0.05, 0.6)
    for i in range(18):
        sfx.add(M["arms"] + 0.5 + i * 0.13 + rng.uniform(-0.02, 0.02), clap(0.45), 0.45, rng.uniform(-0.7, 0.7))
    c0 = S["credits"][0]
    for i in range(6):
        ui(c0 + 1.2 + i * 0.45, 1200 + i * 120, 0.2)

    # --- VOCES
    voice = Bus()
    PAN = {"sofia": 0.0, "martin": 0.14, "juan": -0.14}
    for c in tl["cues"]:
        t0, a = audio[c["id"]]
        g = 1.0 if not c["shout"] else 0.75
        if c["id"] in ("e5_j", "e5_m"): g = 0.6
        voice.add(t0, a, g * 1.25, PAN[c["who"]] * (2.5 if c["shout"] else 1))

    v = voice.stereo()
    v_wet = reverb(v, 0.9, 0.10, seed=11)       # sala corta: las voces "viven" en el coliseo

    # --- Ducking de la musica bajo la voz
    venv = np.abs(v).max(axis=1)
    k = int(0.12 * SR)
    venv = signal.fftconvolve(venv, np.ones(k) / k, mode="same")
    venv = np.clip(venv / 0.06, 0, 1)
    k2 = int(0.35 * SR)
    venv = signal.fftconvolve(venv, np.hanning(k2) / np.hanning(k2).sum(), mode="same")
    duck = (1.0 - 0.58 * np.clip(venv, 0, 1))[:, None]

    music = (drums.stereo() * 0.62 + bass.stereo() * 0.62 + reverb(pads.stereo(), 2.2, 0.45, 5) * 0.75
             + reverb(keys.stereo(), 1.8, 0.35, 6) * 0.7)
    fxs = reverb(fx.stereo(), 2.0, 0.3, 8) * 0.55
    sf = reverb(sfx.stereo(), 1.1, 0.22, 9) * 0.62

    # Curva de intensidad global de la musica
    tt = np.arange(N) / SR
    gain = np.ones(N, dtype=np.float32) * 0.5
    fade_in = np.clip(tt / 0.6, 0, 1)
    fade_out = np.clip((DUR - tt) / 2.2, 0, 1) ** 1.5
    mix = music * (gain * fade_in * fade_out)[:, None] * duck + fxs * (0.6 + 0.4 * duck) * fade_out[:, None] + sf + v_wet

    sel = venv[:N] > 0.5
    db = lambda x: 20 * np.log10(np.sqrt((x[sel] ** 2).mean()) + 1e-9)
    print(f"  niveles durante el dialogo -> voz {db(v_wet):.1f} dB | musica {db(music * (gain * fade_in * fade_out)[:, None] * duck):.1f} dB | fx {db(fxs):.1f} dB | sfx {db(sf):.1f} dB")
    nsel = ~sel
    print(f"  musica sin dialogo {20 * np.log10(np.sqrt(((music * (gain * fade_in * fade_out)[:, None] * duck)[nsel] ** 2).mean()) + 1e-9):.1f} dB")
    # Master: limitador suave + normalizacion
    peak = np.abs(mix).max()
    mix = mix / max(peak, 1e-6) * 1.6
    mix = np.tanh(mix * 0.95) / np.tanh(0.95 * 1.6) * 0.89
    write_wav(os.path.join(OUT, "mix_raw.wav"), mix)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(OUT, "mix_raw.wav"),
                    "-af", "loudnorm=I=-15:TP=-1.2:LRA=12:linear=true", "-ar", str(SR), os.path.join(OUT, "mix.wav")], check=True)
    os.remove(os.path.join(OUT, "mix_raw.wav"))
    print("Mezcla lista:", os.path.join(OUT, "mix.wav"))

def tl_cue(tl, cid):
    return next(c for c in tl["cues"] if c["id"] == cid)

if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "all"
    if stage in ("tts", "all"):
        asyncio.run(stage_tts())
    if stage in ("layout", "mix", "all"):
        tl, audio = stage_layout()
        if stage in ("mix", "all"):
            stage_mix(tl, audio)
