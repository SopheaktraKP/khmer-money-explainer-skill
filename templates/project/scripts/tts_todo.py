#!/usr/bin/env python3
"""Lists beats that need a (paid) voice take: new beats, or beats whose spoken text changed.
This is what stops a one-word script fix from re-voicing the whole video.

python scripts/tts_todo.py                      show what needs voicing
python scripts/tts_todo.py --done <id> <speech_id>   record a finished take
"""
import hashlib, json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
script = json.load(open('src/story/script.json', encoding='utf-8'))
mp = 'voice/manifest.json'
man = json.load(open(mp, encoding='utf-8')) if os.path.exists(mp) else {}
spoken = {b['id']: b.get('tts', b['text']) for s in script['scenes'] for b in s['beats']}
sha = lambda x: hashlib.sha1(x.encode()).hexdigest()
if len(sys.argv) > 3 and sys.argv[1] == '--done':
    man[sys.argv[2]] = {'sha': sha(spoken[sys.argv[2]]), 'speech_id': sys.argv[3]}
    os.makedirs('voice', exist_ok=True)
    json.dump(man, open(mp, 'w', encoding='utf-8'), indent=1)
    sys.exit()
todo = [i for i, x in spoken.items() if man.get(i, {}).get('sha') != sha(x) or not os.path.exists(f'voice/{i}.mp3')]
print(f"{len(todo)} of {len(spoken)} beats need voice, {sum(len(spoken[i]) for i in todo)} characters")
for i in todo:
    print(f"{i}\t{spoken[i]}")
