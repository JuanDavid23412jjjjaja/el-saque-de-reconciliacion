# generate_audio_pure.py - Zero-dependency audio synthesizer using standard library math & wave
import math
import random
import wave
import struct

SR = 48000
DUR = 10.0
total_samples = int(SR * DUR)

left = [0.0] * total_samples
right = [0.0] * total_samples

# 1. Subtle Brown Noise Ambience
last_val = 0.0
random.seed(42)
for i in range(total_samples):
    white = random.uniform(-0.02, 0.02)
    last_val = (last_val + white) * 0.992
    left[i] += last_val * 0.4
    right[i] += last_val * 0.4

# Helper: Sub-Bass Impact
def add_sub_thump(t_start, freq_start=65.0, freq_end=24.0, dur=0.8, gain=0.85):
    idx_start = int(t_start * SR)
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    phase = 0.0
    for i in range(n):
        t = i / SR
        frac = i / n
        freq = freq_start * math.pow(freq_end / freq_start, frac)
        phase += 2.0 * math.pi * freq / SR
        env = math.exp(-t * 5.0) * gain
        sig = math.sin(phase) * env
        left[idx_start + i] += sig
        right[idx_start + i] += sig

# Helper: Telemetry UI Chirp
def add_chirp(t_start, freq=1200.0, dur=0.045, pan=0.0):
    idx_start = int(t_start * SR)
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    phase = 0.0
    l_gain = math.cos((pan + 1.0) * math.pi / 4.0)
    r_gain = math.sin((pan + 1.0) * math.pi / 4.0)
    for i in range(n):
        t = i / SR
        freq_cur = freq + (freq * 0.5) * (i / n)
        phase += 2.0 * math.pi * freq_cur / SR
        env = math.exp(-t * 70.0) * 0.25
        sig = math.sin(phase) * env
        left[idx_start + i] += sig * l_gain
        right[idx_start + i] += sig * r_gain

# Helper: Mechanical Servo Glissando
def add_servo(t_start, dur=1.8):
    idx_start = int(t_start * SR)
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    phase = 0.0
    for i in range(n):
        t = i / SR
        freq = 180.0 + 140.0 * math.sin(math.pi * t / dur)
        phase += 2.0 * math.pi * freq / SR
        env = math.pow(math.sin(math.pi * t / dur), 0.8) * 0.26
        # Softened sawtooth
        saw = 2.0 * ((phase / (2.0 * math.pi)) % 1.0) - 1.0
        sig = saw * env * 0.75
        left[idx_start + i] += sig
        right[idx_start + i] += sig

# Helper: Volleyball Leather Hit
def add_ball_hit(t_start):
    idx_start = int(t_start * SR)
    dur = 0.22
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    phase = 0.0
    for i in range(n):
        t = i / SR
        frac = i / n
        freq = 170.0 * math.pow(42.0 / 170.0, frac)
        phase += 2.0 * math.pi * freq / SR
        env_thud = math.exp(-t * 22.0) * 0.85
        thud = math.sin(phase) * env_thud
        snap = random.uniform(-0.4, 0.4) * math.exp(-t * 45.0)
        sig = thud + snap * 0.35
        left[idx_start + i] += sig * 0.9
        right[idx_start + i] += sig * 0.8

# Helper: Ball Floor Bounce
def add_ball_bounce(t_start):
    idx_start = int(t_start * SR)
    dur = 0.28
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    phase = 0.0
    for i in range(n):
        t = i / SR
        frac = i / n
        freq = 120.0 * math.pow(32.0 / 120.0, frac)
        phase += 2.0 * math.pi * freq / SR
        env = math.exp(-t * 15.0) * 0.75
        sig = math.sin(phase) * env
        left[idx_start + i] += sig * 0.7
        right[idx_start + i] += sig * 0.9

# Cues
add_sub_thump(0.05, 58.0, 22.0, 1.2, 0.9)
add_chirp(0.08, 900.0, 0.05, -0.3)
add_chirp(0.40, 1100.0, 0.04, -0.2)

add_servo(2.85, 1.8)
add_chirp(2.85, 1400.0, 0.05, 0.0)

add_sub_thump(4.65, 78.0, 28.0, 0.5, 0.8)
add_chirp(4.70, 1800.0, 0.06, 0.2)

add_chirp(5.30, 850.0, 0.04, -0.4)

add_ball_hit(6.45)
add_chirp(6.48, 1600.0, 0.04, 0.1)

add_ball_bounce(7.80)
add_sub_thump(7.80, 52.0, 20.0, 0.9, 0.85)

add_chirp(8.80, 1300.0, 0.05, 0.0)

# Normalize
max_val = 0.0
for i in range(total_samples):
    max_val = max(max_val, abs(left[i]), abs(right[i]))

if max_val > 0.0:
    target = 0.89
    for i in range(total_samples):
        left[i] = (left[i] / max_val) * target
        right[i] = (right[i] / max_val) * target

# Write to WAV
out_path = r"c:\Users\cp\Downloads\Para mis chinos\video-opuscar\out\mix.wav"
with wave.open(out_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    data = bytearray()
    for i in range(total_samples):
        il = int(max(-32768, min(32767, left[i] * 32767)))
        ir = int(max(-32768, min(32767, right[i] * 32767)))
        data.extend(struct.pack('<hh', il, ir))
    wf.writeframes(data)

print(f"Audio synthesized cleanly to {out_path}")
