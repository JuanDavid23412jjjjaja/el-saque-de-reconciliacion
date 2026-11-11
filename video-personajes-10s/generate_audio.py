"""
Generate 10-second master audio track with synchronized character voices and sound design:
- 0.1s - 2.8s: Sofía (#4) speaking
- 3.1s - 5.5s: Martín (#10) speaking
- 5.8s - 7.6s: Juan Diego (#7) speaking
- 7.8s: Setter ball touch
- 8.2s: Spiker powerful hit (THWACK)
- 8.8s: Duela floor impact (THUD)
- 9.0s - 10.0s: Team cheer & victory synth chord
"""
import os, sys, math, struct, wave, subprocess
import win32com.client

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_audio")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Generate Voice Audio via Windows SAPI
s = win32com.client.Dispatch('SAPI.SpVoice')
voices = {v.GetDescription(): v for v in s.GetVoices()}
sabina = [v for k, v in voices.items() if 'Sabina' in k]
voice_obj = sabina[0] if sabina else list(voices.values())[0]

def record_speech(text, outfile, rate=3):
    stream = win32com.client.Dispatch('SAPI.SpFileStream')
    stream.Open(outfile, 3) # SSFMCreateForWrite
    s.AudioOutputStream = stream
    s.Voice = voice_obj
    s.Rate = rate
    s.Speak(text)
    stream.Close()

raw_sofia = os.path.join(TEMP_DIR, "raw_sofia.wav")
raw_martin = os.path.join(TEMP_DIR, "raw_martin.wav")
raw_juan = os.path.join(TEMP_DIR, "raw_juan.wav")

record_speech("¡Hola! Con voleibol sentado jugamos todos.", raw_sofia, rate=3)
record_speech("Red a un metro quince: ¡biomecánica pura!", raw_martin, rate=3)
record_speech("¡Al remate! ¡Punto San Bonifacio!", raw_juan, rate=4)

# 2. Process Voices with distinct vocal timbre (Sofía = bright girl, Martín = teen setter, Juan Diego = athletic spiker)
proc_sofia = os.path.join(TEMP_DIR, "proc_sofia.wav")
proc_martin = os.path.join(TEMP_DIR, "proc_martin.wav")
proc_juan = os.path.join(TEMP_DIR, "proc_juan.wav")

# Sofía: natural female voice, slightly compressed with warm presence
subprocess.run([
    'ffmpeg', '-y', '-i', raw_sofia,
    '-af', 'highpass=f=120,equalizer=f=3200:t=q:w=1.2:g=3,atempo=1.05',
    '-ar', '48000', '-ac', '2', proc_sofia
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Martín: pitch down ~-3 semitones for male teenager voice
subprocess.run([
    'ffmpeg', '-y', '-i', raw_martin,
    '-af', 'asetrate=22050*0.87,atempo=1/0.87*1.1,equalizer=f=250:t=q:w=1:g=2,highpass=f=100',
    '-ar', '48000', '-ac', '2', proc_martin
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Juan Diego: deeper athletic resonance and energetic punch
subprocess.run([
    'ffmpeg', '-y', '-i', raw_juan,
    '-af', 'asetrate=22050*0.79,atempo=1/0.79*1.2,equalizer=f=180:t=q:w=1:g=3,highpass=f=90',
    '-ar', '48000', '-ac', '2', proc_juan
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 3. Procedural Sound Design & Foley Synthesis (Pure Python)
SAMPLE_RATE = 48000
TOTAL_DUR = 10.0
total_samples = int(SAMPLE_RATE * TOTAL_DUR)

left = [0.0] * total_samples
right = [0.0] * total_samples

def add_tone(start_t, dur_t, freq0, freq1, amp, pan=0.0):
    start_i = int(start_t * SAMPLE_RATE)
    n = int(dur_t * SAMPLE_RATE)
    for i in range(n):
        idx = start_i + i
        if idx >= total_samples: break
        p = i / n
        env = math.sin(p * math.pi) if p < 0.2 else (1.0 - p) ** 1.5
        freq = freq0 + (freq1 - freq0) * p
        val = amp * env * math.sin(2.0 * math.pi * freq * (i / SAMPLE_RATE))
        left[idx] += val * (1.0 - pan * 0.5)
        right[idx] += val * (1.0 + pan * 0.5)

def add_noise(start_t, dur_t, amp, pan=0.0):
    import random
    start_i = int(start_t * SAMPLE_RATE)
    n = int(dur_t * SAMPLE_RATE)
    for i in range(n):
        idx = start_i + i
        if idx >= total_samples: break
        p = i / n
        env = (1.0 - p) ** 3.0
        val = amp * env * (random.random() * 2.0 - 1.0)
        left[idx] += val * (1.0 - pan * 0.5)
        right[idx] += val * (1.0 + pan * 0.5)

# A. Intro sub-bass impact (0.0s)
add_tone(0.0, 1.8, 85.0, 42.0, 0.45)
add_noise(0.0, 0.25, 0.15)

# B. Transition camera whooshes
add_tone(3.0, 0.4, 220.0, 440.0, 0.18, pan=0.3)
add_tone(6.2, 0.4, 260.0, 520.0, 0.18, pan=-0.3)

# C. Setter touch (7.4s)
add_tone(7.4, 0.12, 380.0, 220.0, 0.25, pan=0.2)
add_noise(7.4, 0.08, 0.12, pan=0.2)

# D. Massive Spike Smash (8.1s)
add_tone(8.1, 0.45, 140.0, 48.0, 0.65, pan=0.0)
add_noise(8.1, 0.35, 0.45, pan=0.0)

# E. Floor Impact Thud (8.7s)
add_tone(8.7, 0.6, 95.0, 38.0, 0.55, pan=-0.3)
add_noise(8.7, 0.2, 0.25, pan=-0.3)

# F. Victory Chord (8.9s - 10.0s) C Major 9 (C4, E4, G4, B4, D5)
for f in [261.63, 329.63, 392.00, 493.88, 587.33]:
    add_tone(8.9, 1.1, f, f * 0.99, 0.12)

# G. Subtle Court Ambience / Electronic Grooving Pulse (120 BPM)
bpm = 120
beat_dur = 60.0 / bpm
for b in range(int(TOTAL_DUR / beat_dur)):
    bt = b * beat_dur
    if bt < 8.5:
        add_tone(bt, 0.12, 110.0, 55.0, 0.12) # Soft athletic kick

# Write procedural SFX layer
sfx_wav = os.path.join(TEMP_DIR, "sfx.wav")
with wave.open(sfx_wav, 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    raw = bytearray()
    for i in range(total_samples):
        l = max(-1.0, min(1.0, left[i]))
        r = max(-1.0, min(1.0, right[i]))
        raw.extend(struct.pack('<hh', int(l * 32767), int(r * 32767)))
    wav.writeframes(raw)

# 4. Final Mixing with ffmpeg: Delay each voice to its exact video cue & duck/blend
final_mix = os.path.join(OUT_DIR, "mix.wav")

filter_complex = (
    # Input 0: SFX
    # Input 1: Sofía voice -> delay by 250ms (0.25s)
    # Input 2: Martín voice -> delay by 3150ms (3.15s)
    # Input 3: Juan Diego voice -> delay by 5750ms (5.75s)
    "[1:a]adelay=250|250,volume=1.4[v_sofia];"
    "[2:a]adelay=3150|3150,volume=1.35[v_martin];"
    "[3:a]adelay=5750|5750,volume=1.45[v_juan];"
    "[0:a]volume=0.85[sfx];"
    "[sfx][v_sofia][v_martin][v_juan]amix=inputs=4:duration=first:dropout_transition=2,"
    "loudnorm=I=-14:TP=-1.5:LRA=11[out]"
)

subprocess.run([
    'ffmpeg', '-y',
    '-i', sfx_wav,
    '-i', proc_sofia,
    '-i', proc_martin,
    '-i', proc_juan,
    '-filter_complex', filter_complex,
    '-map', '[out]',
    '-t', '10.0',
    '-ar', '48000',
    final_mix
], check=True)

print("Master audio generated successfully at:", final_mix)
