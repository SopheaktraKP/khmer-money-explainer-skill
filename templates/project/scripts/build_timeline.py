#!/usr/bin/env python3
"""Measures every voice clip and writes src/story/timeline.json, the single clock of the video.

Each beat of src/story/script.json has its own voice/<id>.mp3, so re-voicing one sentence shifts the rest
automatically. An optional voice/<id>.words.json (from get_word_timestamps) enables at('b03', 'word') cues.

Run from the project root:  python scripts/build_timeline.py [--placeholder]
--placeholder estimates length from the text, so a look test can run before any credits are spent.
"""
import json, os, subprocess, sys

script = json.load(open('src/story/script.json', encoding='utf-8'))
FPS, GAP, SCENE_GAP, TAIL = 30, script.get('gap', .3), script.get('scene_gap', .7), script.get('tail', 1.5)
placeholder = '--placeholder' in sys.argv
beats, scenes, t, missing = [], [], 0.0, []
for s_i, scene in enumerate(script['scenes']):
    start = t
    for b in scene['beats']:
        path = f"voice/{b['id']}.mp3"
        if os.path.exists(path):
            d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', path], capture_output=True, text=True).stdout)
        elif placeholder:
            d = max(1.5, len(b['text']) / 13.0)
        else:
            missing.append(b['id'])
            continue
        row = {'id': b['id'], 'scene': scene['id'], 'start': round(t * FPS), 'end': round((t + d) * FPS), 'dur': round(d, 3)}
        wp = f"voice/{b['id']}.words.json"
        if os.path.exists(wp):
            row['words'] = [{'w': w['text'], 's': round(w['start'], 3), 'e': round(w['end'], 3)} for w in json.load(open(wp, encoding='utf-8'))['words']]
        beats.append(row)
        t += d + GAP
    t += SCENE_GAP
    if s_i == len(script['scenes']) - 1:
        t += TAIL - GAP - SCENE_GAP
    scenes.append({'id': scene['id'], 'chapter': scene.get('chapter', 0), 'mood': scene.get('music', 'light'), 'start': round(start * FPS), 'end': round(t * FPS)})
if missing:
    sys.exit(f"Missing voice for: {', '.join(missing)}. Generate them, or pass --placeholder for a look test.")
out = {'fps': FPS, 'total': round(t * FPS), 'beats': beats, 'scenes': scenes}
json.dump(out, open('src/story/timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"{len(beats)} beats, {len(scenes)} scenes, {t:.1f} s ({t / 60:.1f} min)")
