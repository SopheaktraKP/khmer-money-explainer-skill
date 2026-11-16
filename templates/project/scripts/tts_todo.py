#!/usr/bin/env python3
"""Lists beats that need a (paid) voice take: new beats, beats whose spoken text changed, and beats whose
speaker's voice changed in "voices". This is what stops a one-word script fix, or recasting one character,
from re-voicing the whole video.

python scripts/tts_todo.py                           show what needs voicing, grouped by voice
python scripts/tts_todo.py --done <id> <speech_id>   record a finished take (stores the voice it used)
"""
import hashlib, json, os, sys
from cast import load, speaker, voice

sys.stdout.reconfigure(encoding='utf-8')
script = load()
mp = 'voice/manifest.json'
man = json.load(open(mp, encoding='utf-8')) if os.path.exists(mp) else {}
beats = {b['id']: b for s in script['scenes'] for b in s['beats']}
spoken = {i: b.get('tts', b['text']) for i, b in beats.items()}
sha = lambda x: hashlib.sha1(x.encode()).hexdigest()

if len(sys.argv) > 3 and sys.argv[1] == '--done':
    i = sys.argv[2]
    if i not in beats:
        sys.exit(f'No beat {i} in script.json')
    man[i] = {'sha': sha(spoken[i]), 'speech_id': sys.argv[3], 'voice': voice(script, beats[i])}
    os.makedirs('voice', exist_ok=True)
    json.dump(man, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    sys.exit()


def stale(i):
    m = man.get(i, {})
    if m.get('sha') != sha(spoken[i]) or not os.path.exists(f'voice/{i}.mp3'):
        return 'new' if not m else 'text changed'
    # Takes recorded before voices were tracked have no 'voice'; they count as the voice the cast gives now.
    if m.get('voice', voice(script, beats[i])) != voice(script, beats[i]):
        return f"voice was {m['voice']}"
    return None


todo = [(i, stale(i)) for i in beats if stale(i)]
print('Cast: ' + ', '.join(f'{sp} = {v}' for sp, v in script['voices'].items()))
print(f"{len(todo)} of {len(beats)} beats need voice, {sum(len(spoken[i]) for i, _ in todo)} characters")
by_voice = {}
for i, why in todo:
    by_voice.setdefault(voice(script, beats[i]), []).append((i, why))
for v, rows in by_voice.items():
    print(f"\n## voice {v}: {len(rows)} beats, {sum(len(spoken[i]) for i, _ in rows)} characters")
    for i, why in rows:
        print(f"{i}\t{speaker(beats[i])}\t{why}\t{spoken[i]}")
