import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import timeline from '../story/timeline.json';
import {SCENES} from '../story/story';
import {SceneContext, SceneCtx, clamp, easeInOut} from './anim';
import {ChapterBar} from './Stage';
import {C} from './theme';

type Word = {w: string; s: number; e: number};
type Beat = {id: string; scene: string; start: number; end: number; words?: Word[]};
type SceneRow = {id: string; start: number; end: number; chapter: number};
const BEATS = timeline.beats as Beat[];
const WIPE = 12;

const SceneRunner: React.FC<{row: SceneRow}> = ({row}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beats = BEATS.filter((b) => b.scene === row.id);
  const find = (id: string) => {
    const b = beats.find((x) => x.id === id);
    if (!b) throw new Error(`Beat ${id} is not in scene ${row.id}`);
    return b;
  };
  const ctx: SceneCtx = {
    f, fps, dur: row.end - row.start,
    at: (id, where) => {
      const b = find(id);
      if (where === undefined) return b.start - row.start;
      if (typeof where === 'number') return b.start - row.start + Math.round((b.end - b.start) * where);
      const w = b.words?.find((x) => x.w.includes(where));
      if (!w) throw new Error(`Word "${where}" not found in ${id}: add voice/${id}.words.json and rerun build_timeline, or use a fraction`);
      return b.start - row.start + Math.round(w.s * fps) - 2; // visuals land just before the word
    },
    end: (id) => find(id).end - row.start,
    speaking: (...ids) => ids.some((id) => { const b = find(id); return f >= b.start - row.start && f < b.end - row.start; }),
  };
  const Comp = (SCENES as Record<string, React.FC>)[row.id];
  if (!Comp) throw new Error(`No scene component named ${row.id} in story.tsx`);
  const wipe = row.start === 0 ? 1 : interpolate(f, [0, WIPE], [0, 1], {...clamp, easing: easeInOut});
  const x = wipe * 125 - 12.5;
  return (
    <AbsoluteFill style={{clipPath: wipe >= 1 ? undefined : `polygon(0 0, ${x + 12}% 0, ${x - 12}% 100%, 0 100%)`}}>
      <SceneContext.Provider value={ctx}><Comp /></SceneContext.Provider>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {(timeline.scenes as SceneRow[]).map((row) => (
      <Sequence key={row.id} from={row.start} durationInFrames={row.end - row.start + WIPE} layout="none">
        <SceneRunner row={row} />
      </Sequence>
    ))}
    <ChapterBar />
  </AbsoluteFill>
);
