"""Who speaks each beat, and with which KiriTTS voice. Shared by tts_todo, build_timeline and make_audio.

script.json holds a cast list that maps each speaker id to a voice:
  "voices": {"narrator": "Maly", "neang": "Neary", "bora": "Dara"}
and each beat may name its speaker. A beat with no speaker is the narrator's:
  {"id": "h2a", "speaker": "neang", "text": "..."}
Speaker ids are short lowercase names used in code (talking('neang')); voice names are KiriTTS names.
They are kept apart on purpose: KiriTTS has a voice called "Bora", which need not be the character Bora.
"""
import json, sys

NARRATOR = 'narrator'


def load(path='src/story/script.json'):
    script = json.load(open(path, encoding='utf-8'))
    voices = script.get('voices') or {NARRATOR: 'Maly'}
    problems = []
    if NARRATOR not in voices:
        problems.append(f'"voices" has no "{NARRATOR}" entry')
    for s in script['scenes']:
        for b in s['beats']:
            sp = b.get('speaker', NARRATOR)
            if sp not in voices:
                problems.append(f'beat {b["id"]} has speaker "{sp}", which is not in "voices" ({", ".join(voices)})')
    if problems:
        sys.exit('script.json cast problems:\n  ' + '\n  '.join(problems))
    script['voices'] = voices
    return script


def speaker(beat):
    return beat.get('speaker', NARRATOR)


def voice(script, beat):
    return script['voices'][speaker(beat)]
