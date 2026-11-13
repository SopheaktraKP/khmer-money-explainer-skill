import {createContext, useContext} from 'react';
import {Easing, interpolate, spring} from 'remotion';

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Keyframes [[frame, value], ...]; each value is reached `dur` frames after its frame. */
export const kf = (f: number, keys: [number, number][], dur = 14) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [at, to] = keys[i];
    if (f <= at) break;
    v = interpolate(f, [at, at + dur], [v, to], {...clamp, easing: easeInOut});
  }
  return v;
};
/** Latest value of a [[frame, x], ...] list: for poses, faces and other non-numeric states. */
export const step = <T,>(f: number, keys: [number, T][]): T => {
  let v = keys[0][1];
  for (const [at, x] of keys) if (f >= at) v = x;
  return v;
};
export const pop = (f: number, at: number, fps = 30) =>
  spring({frame: f - at, fps, config: {damping: 11, stiffness: 180, mass: 0.7}});
export const fadeIn = (f: number, at: number, dur = 8) => interpolate(f, [at, at + dur], [0, 1], clamp);
export const fadeOut = (f: number, at: number, dur = 8) => interpolate(f, [at, at + dur], [1, 0], clamp);

export type Where = number | string | undefined;
export type SceneCtx = {
  f: number; fps: number; dur: number;
  /** Scene frame of a beat: at('b03') its start, at('b03', .5) halfway, at('b03', 'word') that spoken word. */
  at: (beat: string, where?: Where) => number;
  /** Scene frame at which the beat's voice ends. */
  end: (beat: string) => number;
  /** True while one of these beats is being spoken: drive mouths with it. */
  speaking: (...beats: string[]) => boolean;
};
export const SceneContext = createContext<SceneCtx | null>(null);
export const useScene = () => {
  const c = useContext(SceneContext);
  if (!c) throw new Error('useScene outside a scene');
  return c;
};
