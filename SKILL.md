---
name: khmer-money-explainer
description: Make an 8-10 minute horizontal Khmer-language explainer video about a real-life money decision, in a clean-and-warm stick-figure style (original characters, money tags, jars, charts, a calm narrator, cited sources), rendered with Remotion and voiced with KiriTTS. The format follows two people through the same choice and works out who ends up ahead, for example renting vs buying, salary and debt, franchise vs own brand, tontine vs bank. Use whenever the user asks for a Khmer finance or business explainer, a "who ends up with more?" or "which is better?" money video, a stick-figure explainer for a Cambodian audience, another video "like the tontine video", or wants topic ideas for such a channel, even if they don't name this skill.
---

# Khmer money explainer

Each video follows two ordinary people through the same money decision, does the arithmetic out loud, and leaves the
viewer able to decide for themselves. Viewers stay for the numbers and trust the channel because the numbers are honest.

The working example is the tontine vs bank video in `templates/project/` (`src/story/`).

## Rules that protect the channel

- **Original work only.** Style research may look at other channels, but never copy their scripts, characters, thumbnails, logos or shots, and never name them in a video or description. Our cast, stories and visual identity (including the krama-wearing guide) are our own.
- **Honest money.** Show the assumptions on screen. Give both sides, including the risks of the option that looks best. Give questions to ask, not a personal recommendation. Every description ends with a not-financial-advice line and says the characters are fictional.
- **Real people stay out.** Accusations of fraud against named people or companies are not this format's job. Describe patterns from reported cases, linked in the description.
- **Spending:** voice costs KiriTTS credits: the 1,100-character pilot used 433, so a 9-minute video is roughly 3,000-3,500. Check `get_usage` before voicing, tell the user the estimate, and get the script approved first.

## Pipeline

### 1. Topic
If the user gives no topic, suggest 3 with one line each. A strong topic is a **fork everyone in Cambodia recognises**, has **numbers that can be sourced**, and has **a twist** where the obvious answer is wrong or incomplete. Search for what's current before suggesting.

Settle at the start, and only ask about what isn't already known: topic, voice (default `Maly`; the account may have cloned voices, see `list_voices`), and channel name (`CHANNEL` in `story.tsx`; empty hides the badge).

### 2. Research and arithmetic
- Use primary Cambodian sources where they exist: National Bank of Cambodia, National Institute of Statistics, bank rate sheets, law firm tax notes, reputable press. Note publication dates: rates and tax rules change.
- Rewrite `scripts/calc.py` for the topic. **Every number on screen and in the narration comes from it** and is written to `src/story/numbers.json`. Add sanity asserts. Run several scenarios, including one where the "winner" loses.
- Separate what is **sourced** from what is **assumed**, and label assumed values on screen with `<Note>`. If a fact can't be sourced, either frame it as a clear assumption or drop it, and tell the user.

### 3. Script
About 7,000-9,000 Khmer characters for 8-10 minutes; the pilot's voice ran about 15 characters per second. One beat is one or two sentences of around 70 characters, so a 9-minute video has roughly 100-120 beats. Read `references/script-formula.md` for the structure and for Khmer writing rules.

Write it to `src/story/script.json` (scenes contain beats; format below) and show the user the full Khmer script with the sources and assumptions. **Wait for approval before voicing.** The user is the authority on Khmer wording and terms.

### 4. Set up the project
Copy `templates/project/` to a new folder, run `npm install`, then replace `src/story/script.json`, `src/story/story.tsx` and `scripts/calc.py`. Leave `src/engine/` alone unless adding something reusable. Use a short path (see Gotchas).

### 5. Look test before spending credits
```bash
python scripts/calc.py
python scripts/build_timeline.py --placeholder
python scripts/check_numbers.py
npx tsc --noEmit
node scripts/stills.mjs out/look/x_ 100,400,900 0.5
```
Look at the frames yourself, against the checklist in `references/visual-style.md`. Once voiced, check each line twice, near its start and near its end: stills taken only at the end hide cards that sit empty while the voice builds up to a number. Write scenes one at a time and check each, because layout problems are far cheaper to fix now.

### 6. Voice
```bash
python scripts/tts_todo.py
```
This lists only beats that are new or changed. For each, call KiriTTS `text_to_speech` with the beat's `tts` field (or `text`) and one consistent voice, leaving delivery settings unset. Download the URL to `voice/<id>.mp3` (links expire in about a day) and record it with `python scripts/tts_todo.py --done <id> <speech_id>`. One clip per beat means one wrong word costs one sentence to fix.

Word-accurate cues are optional: save `get_word_timestamps` output as `voice/<id>.words.json`, then use `at('b03', 'word')`. Fractions like `at('b03', .5)` are usually enough. Listen to numbers, names and foreign words; if KiriTTS misreads one, add a `tts` spelling for that beat.

### 7. Timeline, sound, render
```bash
python scripts/build_timeline.py
python scripts/make_audio.py
npx remotion render src/index.ts Main out/video.mp4 --codec h264 --crf 18 --muted
ffmpeg -y -i out/video.mp4 -i out/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
python scripts/qa.py out/final.mp4 out/qa
npx remotion still src/index.ts Thumbnail out/thumb.png
```
Long videos take a while, so run the render in the background. Render a short pilot of the first scenes for the user's review before the full video when the look or voice is new.

### 8. QA
Read `out/qa/report.md`, and look at every contact sheet. Investigate black or frozen frames and loudness far from -15 LUFS. Check that every on-screen figure matches `numbers.json` and that no Khmer text is cut off or overlapped.

### 9. Deliver
Send the mp4 and thumbnail with `SendUserFile`. Also write `out/description.md` in Khmer, containing: a hook, a worked summary with the assumptions, risks, questions to ask yourself, the fictional-characters and not-financial-advice lines, a comment prompt, chapters with real timestamps from `timeline.json`, source links, and hashtags. Never upload or publish without the user asking.

## script.json format
```json
{ "gap": 0.3, "scene_gap": 0.7, "tail": 1.5,
  "scenes": [{ "id": "Hook", "chapter": 0, "music": "light", "beats": [
    { "id": "h1", "text": "Khmer sentence", "tts": "optional spoken spelling", "sfx": [{"at": 0.75, "type": "coin"}] }
  ]}]}
```
- `id` of a scene must match a component in `SCENES` in `story.tsx`.
- `chapter` indexes `CHAPTERS`; 0 is the hook and hides the bar.
- `music`: `light`, `tense` or `resolve`.
- `sfx` types: pop whoosh coin cash ding thud tick paper sad tada alarm. `at` is a fraction of the beat. Use them on reveals, not on every line.

## Writing scenes
Read `src/story/story.tsx`: it is the reference for how a scene is written. In short, `const {f, at} = useScene()` gives the frame and beat times, and every element enters through `<Show at={...} out={...} x y>`. Nothing is timed in seconds, so re-voicing never breaks a scene.

Available parts:
- `engine/Figure`: faces, poses, walking and props in hand. Define each character once at the top of the story.
- `engine/Props`: Title, Label, Chip, Tag, Bubble, ThoughtCloud, Jar, Coin, Bill, MoneyBag, Calendar, Bank, House, Stall, Notebook, Phone, Rock, Umbrella, StormCloud, CheckMark, VsBadge, Arrow, FlyingMoney, Note, Moto, NameChip.
- `engine/Charts`: Card, Counter, Bars, LineChart, MonthGrid, and `money()`.
- `engine/Stage`: `mood`, `tint`, `zoom`, `focus`.

If a topic needs a new prop, draw it in the same inked style in the story file, and move it to `engine/Props.tsx` if it's reusable.

## Gotchas (each of these happened)
- **Windows path limit.** Remotion fails when the project path is so long that files inside `node_modules` pass 260 characters: `Failed to launch the browser process` / `spawn ... chrome-headless-shell` on stills, and `getExecutableDir` errors on full renders. Pointing at a different browser doesn't fix the second one. Keep the project at a short path such as `D:/videos/<name>` (under about 100 characters), and run `npm install` there.
- **Temp space.** Each bundle copies to the temp folder and isn't removed. If C: is tight, set `RENDER_TMP` for `stills.mjs`, and `TEMP`/`TMP` for the CLI, to a bigger drive.
- **`<Show>` defaults to x=0, y=0**, which puts a centred title half off-screen. Always pass `x={960}` for centred elements.
- **Koulen's digits read badly** ("12" looks like "I2"). `Title` already sets digits and symbols in the body font; don't bypass it.
- **Tags over faces.** A standing figure's head reaches about y=470, and raised hands go higher. Put tags at y≈300-350 above a figure.
- **Remotion writes no usable audio with `--muted`,** so always mux `mix.wav` afterwards as shown.
- **Bash heredocs with a lot of TSX can fail to parse** in some shells on Windows. Write source files with the file tool.
