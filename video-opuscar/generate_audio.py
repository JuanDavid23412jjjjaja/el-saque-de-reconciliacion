# generate_audio.py - High-Fidelity Audio Synthesizer for 10-Second Lemo-Opuscar Video
import numpy as np
import wave
import struct

SR = 48000
DUR = 10.0
total_samples = int(SR * DUR)

left = np.zeros(total_samples, dtype=np.float32)
right = np.zeros(total_samples, dtype=np.float32)

t_axis = np.linspace(0, DUR, total_samples, endpoint=False)

# 1. Studio Room Ambience Bed (Low-passed brown noise)
np.random.seed(42)
white = np.random.normal(0, 0.05, total_samples)
# Cumulative sum for brown noise
brown = np.cumsum(white)
brown = brown - np.mean(brown)
brown = brown / (np.max(np.abs(brown)) + 1e-6) * 0.08
left += brown
right += brown

# Helper: Sub-Bass Impact
def add_sub_thump(t_start, freq_start=65, freq_end=24, dur=0.8, gain=0.85):
    idx_start = int(t_start * SR)
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    t = np.linspace(0, dur, n, endpoint=False)
    freq = np.geomspace(freq_start, freq_end, n)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.exp(-t * 5.0) * gain
    sig = np.sin(phase) * env
    left[idx_start:idx_end] += sig
    right[idx_start:idx_end] += sig

# Helper: Telemetry UI Chirp
def add_chirp(t_start, freq=1200, dur=0.045, pan=0.0):
    idx_start = int(t_start * SR)
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    t = np.linspace(0, dur, n, endpoint=False)
    freq_sweep = np.linspace(freq, freq * 1.5, n)
    phase = 2 * np.pi * np.cumsum(freq_sweep) / SR
    env = np.exp(-t * 70.0) * 0.25
    sig = np.sin(phase) * env
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    left[idx_start:idx_end] += sig * l_gain
    right[idx_start:idx_end] += sig * r_gain

# Helper: Mechanical Servo Glissando
def add_servo(t_start, dur=1.8):
    idx_start = int(t_start * SR)
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    t = np.linspace(0, dur, n, endpoint=False)
    freq = 180 + 140 * np.sin(np.pi * t / dur)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.sin(np.pi * t / dur) ** 0.8 * 0.28
    sig = (2 * (phase / (2 * np.pi) % 1) - 1) * env # sawtooth
    # Simple low-pass smoothing
    kernel = np.ones(12) / 12
    sig = np.convolve(sig, kernel, mode='same')
    left[idx_start:idx_end] += sig * 0.8
    right[idx_start:idx_end] += sig * 0.8

# Helper: Volleyball Leather Hit
def add_ball_hit(t_start):
    idx_start = int(t_start * SR)
    dur = 0.22
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    t = np.linspace(0, dur, n, endpoint=False)
    # Low punch
    freq = np.geomspace(170, 42, n)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env_thud = np.exp(-t * 22.0) * 0.85
    thud = np.sin(phase) * env_thud
    # Snap noise
    snap = np.random.normal(0, 0.4, n) * np.exp(-t * 45.0)
    sig = thud + snap * 0.35
    left[idx_start:idx_end] += sig * 0.9
    right[idx_start:idx_end] += sig * 0.8

# Helper: Ball Floor Bounce
def add_ball_bounce(t_start):
    idx_start = int(t_start * SR)
    dur = 0.28
    idx_end = min(total_samples, idx_start + int(dur * SR))
    n = idx_end - idx_start
    if n <= 0: return
    t = np.linspace(0, dur, n, endpoint=False)
    freq = np.geomspace(120, 32, n)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.exp(-t * 15.0) * 0.75
    sig = np.sin(phase) * env
    left[idx_start:idx_end] += sig * 0.7
    right[idx_start:idx_end] += sig * 0.9

# Sequence Event Dispatch
# t = 0.05: Hook sub thump
add_sub_thump(0.05, 58, 22, 1.2, 0.9)
add_chirp(0.08, 900, 0.05, -0.3)
add_chirp(0.4, 1100, 0.04, -0.2)

# t = 2.85: Net descent starts
add_servo(2.85, 1.8)
add_chirp(2.85, 1400, 0.05, 0.0)

# t = 4.65: Net locks at 1.15m
add_sub_thump(4.65, 78, 28, 0.5, 0.8)
add_chirp(4.70, 1800, 0.06, 0.2)

# t = 5.3: Wind-up tension
add_chirp(5.3, 850, 0.04, -0.4)

# t = 6.45: Ball Strike!
add_ball_hit(6.45)
add_chirp(6.48, 1600, 0.04, 0.1)

# t = 7.80: Floor Landing Impact!
add_ball_bounce(7.80)
add_sub_thump(7.80, 52, 20, 0.9, 0.85)

# t = 8.8: Resolution lock
add_chirp(8.8, 1300, 0.05, 0.0)

# Master Limiter & Normalization (-14 LUFS approx, peak at -1 dB)
max_peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_peak > 0:
    target_peak = 0.89  # -1 dBFS
    left = left / max_peak * target_peak
    right = right / max_peak * target_peak

# Write WAV file
with wave.open(r"C:\Users\cp\Downloads\Para mis chinos\video-opuscar\out\mix.wav", "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    interleaved = np.empty((total_samples * 2,), dtype=np.int16)
    interleaved[0::2] = np.clip(left * 32767, -32768, 32767).astype(np.int16)
    interleaved[1::2] = np.clip(right * 32767, -32768, 32767).astype(np.int16)
    wf.writeframes(interleaved.tobytes())

print("Audio rendered successfully to out/mix.wav")
