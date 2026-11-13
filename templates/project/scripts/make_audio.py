#!/usr/bin/env python3
"""Builds out/mix.wav: voice clips on the timeline + synthesized SFX + an original soft score ducked under speech.

Everything is generated here, so there is nothing to license. Music mood per scene comes from `music` in
script.json: "light" (major), "tense" (minor), "resolve" (major, fuller). SFX come from `sfx` in each beat:
  {"id":"b03","text":"...","sfx":[{"at":0.5,"type":"coin"}]}     at = fraction of the beat
Types: pop whoosh coin cash ding thud tick paper sad tada alarm

Run from the project root after build_timeline: python scripts/make_audio.py [--no-voice]
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
script = json.load(open('src/story/script.json', encoding='utf-8'))
tl = json.load(open('src/story/timeline.json', encoding='utf-8'))
N = int(tl['total'] / tl['fps'] * SR)
rng = np.random.default_rng(7)
db = lambda x: 10 ** (x / 20)
T = lambda d: np.arange(int(d * SR)) / SR


def lp(x, hz):
    return sosfilt(butter(2, hz, 'low', fs=SR, output='sos'), x)


def bp(x, a, b):
    return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)


def place(buf, clip, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n] * gain


# ---------- SFX ----------
def bell(freq, d=.5, decay=9):
    t = T(d)
    return (np.sin(2 * np.pi * freq * t) + .35 * np.sin(2 * np.pi * freq * 2.76 * t)) * np.exp(-t * decay)


def seq(parts):
    out = np.zeros(int(sum(g for _, g in parts) * SR) + SR)
    t = 0
    for c, g in parts:
        place(out, c, t)
        t += g
    return out


def sfx(kind):
    if kind == 'pop':
        t = T(.09)
        return np.sin(2 * np.pi * (420 + 500 * t / .09) * t) * np.exp(-t * 45) * .8
    if kind == 'whoosh':
        t = T(.32)
        return bp(rng.normal(0, 1, len(t)), 500, 3500) * np.sin(np.pi * t / .32) ** 2 * .35
    if kind == 'coin':
        return seq([(bell(2500, .3, 16), .06), (bell(3350, .35, 14), 0)]) * .4
    if kind == 'cash':
        return seq([(sfx('coin'), .07), (sfx('coin'), .08), (bell(2100, .7, 7) * .5 + 0, 0)])
    if kind == 'ding':
        return bell(1320, .9, 6) * .5
    if kind == 'thud':
        t = T(.3)
        return np.sin(2 * np.pi * (90 - 60 * t) * t) * np.exp(-t * 18)
    if kind == 'tick':
        t = T(.03)
        return bp(rng.normal(0, 1, len(t)), 2000, 6000) * np.exp(-t * 200) * .5
    if kind == 'paper':
        t = T(.2)
        return bp(rng.normal(0, 1, len(t)), 1500, 7000) * np.exp(-t * 18) * .25
    if kind == 'sad':
        return seq([(bell(392, .6, 5), .28), (bell(370, .6, 5), .28), (bell(311, 1, 3.5), 0)]) * .5
    if kind == 'tada':
        return seq([(bell(523, .5, 7), .09), (bell(659, .5, 7), .09), (bell(784, .5, 7), .09), (bell(1047, 1, 4), 0)]) * .5
    if kind == 'alarm':
        t = T(.5)
        return np.sign(np.sin(2 * np.pi * 620 * t)) * (np.sin(2 * np.pi * 7 * t) > 0) * np.exp(-t * 3) * .12
    raise ValueError(f'Unknown SFX {kind}')


# ---------- Music: soft marimba + bass, chord changes every bar, per-scene mood ----------
BPM, BEAT = 92, 60 / 92
CHORDS = {
    'light': [[60, 64, 67], [57, 60, 64], [65, 69, 72], [55, 59, 62]],
    'tense': [[57, 60, 64], [53, 57, 60], [52, 55, 59], [57, 60, 64]],
    'resolve': [[60, 64, 67], [65, 69, 72], [57, 60, 64], [67, 71, 74]],
}
midi = lambda m: 440 * 2 ** ((m - 69) / 12)


def marimba(m, vel=1.0):
    t = T(.9)
    f = midi(m)
    return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 28)) * np.exp(-t * 6.5) * vel


def bass(m):
    t = T(1.4)
    return np.tanh(1.4 * np.sin(2 * np.pi * midi(m - 24) * t)) * np.exp(-t * 2.2) * .7


def scene_at(sec):
    fr = sec * tl['fps']
    for s in tl['scenes']:
        if s['start'] <= fr < s['end']:
            return s
    return tl['scenes'][-1]


music = np.zeros(N)
total = N / SR
PATTERN = [0, 2, 1, 2, 0, 1, 2, 1]
beat_i = 0
t = .1
while t < total - 1:
    mood = scene_at(t).get('mood', 'light')
    ch = CHORDS.get(mood, CHORDS['light'])[(beat_i // 8) % 4]
    step_i = beat_i % 8
    place(music, marimba(ch[PATTERN[step_i]] + 12, .55 if step_i % 2 else .8), t)
    if step_i == 0:
        place(music, bass(ch[0]), t, .8)
    if step_i == 4:
        place(music, bass(ch[0]), t, .55)
    t += BEAT / 2
    beat_i += 1
music = lp(music, 4500)
fade = int(1.5 * SR)
music[-fade:] *= np.linspace(1, 0, fade)
music[:int(.3 * SR)] *= np.linspace(0, 1, int(.3 * SR))

# ---------- Voice ----------
voice = np.zeros(N)
if '--no-voice' not in sys.argv:
    for b in tl['beats']:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f"voice/{b['id']}.mp3", '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        place(voice, np.frombuffer(raw, np.float32).astype(np.float64), b['start'] / tl['fps'])
    rms = np.sqrt(np.mean(voice[np.abs(voice) > 1e-3] ** 2))
    voice *= db(-19) / rms

# ---------- SFX placement ----------
fx = np.zeros(N)
times = {b['id']: b for b in tl['beats']}
for scene in script['scenes']:
    for b in scene['beats']:
        for e in b.get('sfx', []):
            row = times[b['id']]
            sec = (row['start'] + (row['end'] - row['start']) * e.get('at', 0)) / tl['fps']
            place(fx, sfx(e['type']), sec, db(e.get('db', -8)))

# ---------- Duck music under voice, then mix ----------
def smooth(x, win):
    """Moving average in linear time: a plain convolution takes minutes on a 10-minute video."""
    c = np.cumsum(np.concatenate(([0.0], x)))
    half = win // 2
    hi = np.minimum(np.arange(len(x)) + half, len(x))
    lo = np.maximum(np.arange(len(x)) - half, 0)
    return (c[hi] - c[lo]) / (hi - lo)


win = int(.25 * SR)
duck = smooth((smooth(np.abs(voice), win) > db(-45)).astype(np.float64), win)
music = music / (np.max(np.abs(music)) + 1e-9) * db(-17) * (1 - .55 * duck)
mix = voice + fx + music
peak = np.max(np.abs(mix))
if peak > .97:
    mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * .97
os.makedirs('out', exist_ok=True)
wavfile.write('out/mix_raw.wav', SR, (mix * 32767).astype(np.int16))
# Final loudness: YouTube-friendly level with a safe true peak.
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'out/mix_raw.wav', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '1', 'out/mix.wav'], check=True)
print(f'out/mix.wav {total:.1f} s, peak {np.max(np.abs(mix)):.2f}')
