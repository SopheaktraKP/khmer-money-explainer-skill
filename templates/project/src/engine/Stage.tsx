import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import timeline from '../story/timeline.json';
import {CHAPTERS, CHANNEL} from '../story/story';
import {C, GROUND_Y, BODY_FONT, TITLE_FONT} from './theme';
import {clamp, kf, useScene} from './anim';

const W = 1920, H = 1080;
export type Mood = 'neutral' | 'warm' | 'cool' | 'stress';
const MOODS: Record<Mood, [string, string]> = {
  neutral: [C.paper, C.ground], warm: ['#FBEFD6', '#EAD9B8'], cool: ['#E4F1EE', '#CFE0DA'], stress: ['#D5D4DA', '#BBB9C2'],
};

/** Quiet line-art street that says "Cambodia" without competing with the story. */
export const Street: React.FC<{opacity?: number}> = ({opacity = 0.16}) => (
  <g opacity={opacity} fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
    {[[40, 260, 300], [300, 200, 380], [510, 300, 250], [1130, 240, 340], [1380, 310, 270], [1700, 260, 360]].map(([x, w, hh], i) => (
      <g key={i}>
        <rect x={x} y={GROUND_Y - hh} width={w} height={hh} />
        {[0, 1, 2].map((k) => <rect key={k} x={x + 24 + k * (w - 40) / 3} y={GROUND_Y - hh + 34} width={(w - 90) / 3} height={60} />)}
        <line x1={x} x2={x + w} y1={GROUND_Y - hh + 130} y2={GROUND_Y - hh + 130} />
      </g>
    ))}
    {[[850, 1], [1020, .8]].map(([x, s], i) => (
      <g key={i} transform={`translate(${x},${GROUND_Y}) scale(${s})`}>
        <path d="M0 0 C6 -90 -8 -180 12 -260" strokeWidth={5} />
        {[-70, -30, 20, 60].map((a, k) => <path key={k} transform={`translate(12,-260) rotate(${a})`} d="M0 0 Q18 -60 0 -110 Q-18 -60 0 0" />)}
      </g>
    ))}
  </g>
);

/**
 * The stage every scene sits on: paper background, ground, faint street and a slow camera creep so no
 * shot ever freezes. `zoom` is [[frame, z], ...]; `focus` is the [x, y] the camera closes in on.
 * `tint` is [[frame, mood], ...] for mood changes mid-scene (bad news turns the stage grey).
 */
export const Stage: React.FC<{mood?: Mood; street?: boolean; zoom?: [number, number][]; focus?: [number, number]; children?: React.ReactNode; tint?: [number, Mood][]}> =
  ({mood = 'neutral', street = true, zoom, focus = [960, 620], children, tint}) => {
    const {f, dur} = useScene();
    const creep = interpolate(f, [0, Math.max(dur, 1)], [1, 1.035], clamp);
    const z = (zoom ? kf(f, zoom, 22) : 1) * creep;
    const active = tint ? tint.filter(([a]) => f >= a).pop()?.[1] ?? mood : mood;
    const [bg, ground] = MOODS[active];
    return (
      <AbsoluteFill style={{background: bg}}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <pattern id="dots" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2.2" fill={C.ink} opacity=".07" /></pattern>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" />
          <g transform={`translate(${focus[0]},${focus[1]}) scale(${z}) translate(${-focus[0]},${-focus[1]})`}>
            {street && <Street />}
            <rect x={-200} y={GROUND_Y} width={W + 400} height={H} fill={ground} />
            <line x1={-200} x2={W + 200} y1={GROUND_Y} y2={GROUND_Y} stroke={C.ink} strokeWidth={5} />
            {children}
          </g>
        </svg>
      </AbsoluteFill>
    );
  };

/** Numbered chapter steps, top-left. Sits above scene wipes so it stays steady. */
export const ChapterBar: React.FC = () => {
  const f = useCurrentFrame();
  const rows = timeline.scenes as {start: number; end: number; chapter: number}[];
  const row = rows.find((r) => f >= r.start && f < r.end) ?? rows[rows.length - 1];
  const idx = row.chapter;
  const title = CHAPTERS[idx];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {idx > 0 && title && (
        <div style={{position: 'absolute', left: 40, top: 30, display: 'flex', alignItems: 'center', gap: 10, fontFamily: BODY_FONT}}>
          {CHAPTERS.slice(1).map((_, i) => (
            <div key={i} style={{width: 18, height: 18, borderRadius: 18, border: `3px solid ${C.ink}`, background: i + 1 < idx ? C.ink : i + 1 === idx ? C.sun : 'transparent'}} />
          ))}
          <div style={{marginLeft: 8, padding: '4px 18px', background: C.sun, borderRadius: 10, border: `3px solid ${C.ink}`, fontWeight: 700, fontSize: 28, color: C.ink}}>{title}</div>
        </div>
      )}
      {CHANNEL && (
        <div style={{position: 'absolute', right: 40, top: 28, padding: '6px 22px', background: C.white, border: `3px solid ${C.ink}`, borderRadius: 30, fontFamily: TITLE_FONT, fontSize: 30, color: C.ink}}>{CHANNEL}</div>
      )}
    </AbsoluteFill>
  );
};
