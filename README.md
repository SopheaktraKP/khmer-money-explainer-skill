# Khmer Money Explainer: a Claude skill

A [Claude skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) for making **8-10 minute Khmer-language explainer videos about real-life money decisions**. The videos use a clean, warm stick-figure style. Each one follows two ordinary people through the same choice, does the arithmetic out loud, and works out who ends up ahead.

Example topics: renting vs buying, salary and debt, franchise vs your own brand, tontine (តុងទីន) vs bank.

Videos are rendered with [Remotion](https://www.remotion.dev/) and voiced with [KiriTTS](https://www.kiritts.com/).

## What the skill does

1. **Topic**: suggests topics people in Cambodia recognise, with numbers that can be sourced and a twist.
2. **Research and arithmetic**: uses primary Cambodian sources (NBC, NIS, bank rate sheets) and a `calc.py` that produces every number shown on screen.
3. **Script**: writes a Khmer script of about 100-120 beats with a fixed structure: hook, setup, both sides, result, risks, close. Voicing starts only after you approve it.
4. **Look test**: renders still frames and checks them before any TTS credits are spent.
5. **Voice**: voices one KiriTTS clip per beat, so fixing a wrong word only costs one sentence.
6. **Timeline, sound and render**: builds the timeline, mixes music and sound effects, then renders an H.264 video and a thumbnail.
7. **QA**: reports black or frozen frames and loudness, and checks every on-screen number against the calculations.
8. **Deliver**: writes a Khmer YouTube description with chapters, sources, assumptions and a not-financial-advice line.

## Channel principles

- **Original work only.** The characters, stories and visual identity belong to the channel.
- **Honest money.** Assumptions are shown on screen, both sides are covered, and the video gives no personal recommendations.
- **Real people stay out.** Videos describe patterns from reported cases and never accuse named people or companies.

## Repository layout

```
SKILL.md                     # Skill definition and the full pipeline
references/
  script-formula.md          # Video structure, line-by-line habits, Khmer writing rules
  visual-style.md            # Visual language, metaphors, thumbnail rules
templates/project/           # Remotion project (example: tontine vs bank)
  src/engine/                # Reusable engine: Figure, Props, Charts, Stage, anim, theme
  src/story/                 # Per-video story.tsx and script.json
  scripts/                   # calc, timeline, TTS to-do, audio mix, stills, QA, number checks
```

## Installation

**Claude.ai / Claude desktop:** zip this folder (with `SKILL.md` at the top level) and upload it under *Settings → Capabilities → Skills*.

**Claude Code:** copy the folder into your skills directory:

```bash
git clone https://github.com/SopheaktraKP/khmer-money-explainer-skill ~/.claude/skills/khmer-money-explainer
```

Then ask Claude something like *"Make a Khmer money explainer about renting vs buying a house in Phnom Penh."*

## Requirements

- Node.js 18+ and npm (Remotion 4)
- Python 3
- ffmpeg
- A [KiriTTS](https://www.kiritts.com/) account connected to Claude for voicing. A 9-minute video uses roughly 3,000-3,500 credits.

## Disclaimer

Videos made with this skill are for education only and are not financial advice. Characters are fictional.
