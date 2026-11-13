#!/usr/bin/env python3
"""QA of a rendered 16:9 video: specs, loudness, silences, black/white/frozen frames and contact sheets.
Every 5 s becomes one thumbnail so a 10-minute video reviews in a few sheets.
Usage: python scripts/qa.py <video.mp4> <outdir>
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

vid, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
R = []
pr = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration', '-of', 'json', vid).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
au = [s for s in pr['streams'] if s['codec_type'] == 'audio']
dur = float(pr['format']['duration'])
R.append(f"SPECS {v['width']}x{v['height']} {v['r_frame_rate']} fps, {dur:.2f} s; audio: " + (', '.join(f"{s['codec_name']} {s['sample_rate']} Hz" for s in au) or 'NONE'))
if au:
    e = run('ffmpeg', '-i', vid, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
    tail = e[e.rfind('Summary:'):]
    R.append('LOUDNESS ' + ' | '.join(l.strip() for l in tail.splitlines() if l.strip().startswith(('I:', 'LRA:', 'Peak:'))) + '  (target about -15 LUFS)')
    e = run('ffmpeg', '-i', vid, '-map', '0:a:0', '-af', 'silencedetect=n=-45dB:d=1.2', '-f', 'null', '-').stderr
    R.append('SILENCES>1.2s ' + ('; '.join(l.split('] ')[-1] for l in e.splitlines() if 'silence_start' in l) or 'none'))
W, H = 160, 90
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32) / 255
n = len(F)
mean = F.mean((1, 2))
diff = np.abs(np.diff(F, axis=0)).mean((1, 2)) * 255
black = [i for i in range(n) if mean[i] < .05]
white = [i for i in range(n) if mean[i] > .97]
frozen, s = [], None
for i in range(len(diff)):
    if diff[i] < .004:
        s = i if s is None else s
    else:
        if s is not None and i - s >= 45:
            frozen.append((s, i))
        s = None
R.append(f"FRAMES {n}; black {black[:12]}; white {white[:12]}; frozen spans >=1.5 s {frozen[:12]}")
R.append(f"MOTION mean diff {diff.mean():.2f}")
# contact sheets: one tile every 5 s, 6 x 5 tiles per sheet, seconds burned in for the reviewer only
cw, ch, cols, rows = 320, 180, 6, 5
step = 150
idx = list(range(0, n, step))
for k in range(0, len(idx), cols * rows):
    S = Image.new('RGB', (cw * cols, ch * rows), 'black')
    d = ImageDraw.Draw(S)
    for j, fr in enumerate(idx[k:k + cols * rows]):
        img = run_img = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{fr / 30:.3f}', '-i', vid, '-frames:v', '1', '-vf', f'scale={cw}:{ch}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        x, y = (j % cols) * cw, (j // cols) * ch
        S.paste(Image.frombytes('RGB', (cw, ch), img), (x, y))
        d.rectangle([x, y, x + 46, y + 13], fill='black')
        d.text((x + 2, y + 1), f'{fr // 30}s', fill='yellow')
    S.save(os.path.join(out, f'sheet_{k // (cols * rows):02d}.jpg'), quality=85)
open(os.path.join(out, 'report.md'), 'w', encoding='utf-8').write('\n'.join(R) + '\n')
print('\n'.join(R))
