#!/usr/bin/env python3
"""Fails if the narration or story.tsx states a number that calc.py did not produce.
A money video lives or dies on its arithmetic, so no figure may be typed in by hand.
Small counts and other deliberate literals go in "allow" in src/story/numbers.json.
Run from the project root: python scripts/check_numbers.py
"""
import json, re, sys

sys.stdout.reconfigure(encoding='utf-8')
nums = json.load(open('src/story/numbers.json', encoding='utf-8'))
ok = set()


def walk(x):
    if isinstance(x, dict):
        for v in x.values():
            walk(v)
    elif isinstance(x, list):
        for v in x:
            walk(v)
    elif isinstance(x, (int, float)):
        ok.add(float(x))


walk(nums)
KH = str.maketrans('០១២៣៤៥៦៧៨៩', '0123456789')
NUM = re.compile(r'\d[\d,]*(?:\.\d+)?')
found = lambda s: [float(m.replace(',', '')) for m in NUM.findall(s.translate(KH))]
bad = []
script = json.load(open('src/story/script.json', encoding='utf-8'))
for scene in script['scenes']:
    for b in scene['beats']:
        for field in ('text', 'tts'):
            for n in found(b.get(field, '')):
                if n not in ok:
                    bad.append(f"{b['id']}.{field}: {n:g}")
story = open('src/story/story.tsx', encoding='utf-8').read()
for m in re.finditer(r'\$(\d[\d,]*(?:\.\d+)?)', story):
    n = float(m.group(1).replace(',', ''))
    if n not in ok:
        bad.append(f'story.tsx: ${n:g}')
if bad:
    print('Numbers not in numbers.json:')
    print('\n'.join(sorted(set(bad))))
    sys.exit(1)
print(f'All numbers trace back to calc.py ({len(ok)} known values)')
