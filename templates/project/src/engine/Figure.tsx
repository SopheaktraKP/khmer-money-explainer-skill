import React from 'react';
import {interpolate} from 'remotion';
import {C, INK_W} from './theme';
import {clamp, easeInOut, useScene} from './anim';

export type Face = 'neutral' | 'smile' | 'happy' | 'worry' | 'shock' | 'sad' | 'angry' | 'star' | 'think' | 'smug';
export type Pose = 'down' | 'pointR' | 'pointL' | 'up' | 'hips' | 'think' | 'holdR' | 'holdL' | 'holdBoth' | 'shrug' | 'cross' | 'wave' | 'headGrab';
export type Hair = 'short' | 'bun' | 'long' | 'spiky' | 'cap' | 'side' | 'bald';
type XY = [number, number];
// Each side: elbow, hand, relative to the shoulder, with R = screen right.
const POSES: Record<Pose, {R: [XY, XY]; L: [XY, XY]}> = {
  down: {R: [[16, 62], [20, 124]], L: [[-16, 62], [-20, 124]]},
  pointR: {R: [[68, 8], [136, -12]], L: [[-16, 62], [-20, 124]]},
  pointL: {R: [[16, 62], [20, 124]], L: [[-68, 8], [-136, -12]]},
  up: {R: [[52, -40], [78, -106]], L: [[-52, -40], [-78, -106]]},
  hips: {R: [[58, 34], [18, 76]], L: [[-58, 34], [-18, 76]]},
  think: {R: [[58, 20], [8, -58]], L: [[-16, 62], [-20, 124]]},
  holdR: {R: [[62, 34], [124, 30]], L: [[-16, 62], [-20, 124]]},
  holdL: {R: [[16, 62], [20, 124]], L: [[-62, 34], [-124, 30]]},
  holdBoth: {R: [[60, 36], [100, 16]], L: [[-60, 36], [-100, 16]]},
  shrug: {R: [[60, 18], [108, -30]], L: [[-60, 18], [-108, -30]]},
  cross: {R: [[36, 50], [-24, 36]], L: [[-36, 50], [24, 52]]},
  wave: {R: [[60, -30], [96, -96]], L: [[-16, 62], [-20, 124]]},
  headGrab: {R: [[64, -30], [22, -92]], L: [[-64, -30], [-22, -92]]},
};
const mix = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const INK = C.ink;

const HairShape: React.FC<{hair: Hair; color: string}> = ({hair, color}) => {
  const s = {fill: color, stroke: INK, strokeWidth: INK_W - 1, strokeLinejoin: 'round' as const};
  switch (hair) {
    case 'bun': return <g><circle cx={0} cy={-68} r={18} {...s} /><path d="M-54 -8 C-56 -64 56 -64 54 -8 C30 -30 -30 -30 -54 -8Z" {...s} /></g>;
    case 'long': return <path d="M-58 62 C-76 -74 76 -74 58 62 C50 30 56 -4 44 -22 C10 -30 -10 -30 -44 -22 C-56 -4 -50 30 -58 62Z" {...s} />;
    case 'spiky': return <path d="M-54 -14 L-60 -46 L-36 -38 L-30 -70 L-8 -46 L10 -74 L24 -44 L50 -60 L54 -14 C28 -32 -28 -32 -54 -14Z" {...s} />;
    case 'cap': return <g><path d="M-54 -14 C-52 -70 52 -70 54 -14Z" {...s} /><path d="M50 -22 C70 -22 90 -16 96 -6 C76 -12 60 -14 44 -12Z" {...s} /></g>;
    case 'side': return <path d="M-54 -6 C-60 -68 50 -78 56 -12 C30 -14 6 -22 -8 -38 C-16 -22 -36 -14 -54 -6Z" {...s} />;
    case 'short': return <path d="M-54 -10 C-56 -68 56 -68 54 -10 C34 -26 -34 -26 -54 -10Z" {...s} />;
    default: return null;
  }
};

const FaceShape: React.FC<{face: Face; talking: boolean; f: number; blink: boolean; lookX: number}> = ({face, talking, f, blink, lookX}) => {
  const eyeY = -2, dx = 21;
  const open = talking ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.62)) : 0;
  const stroke = {stroke: INK, strokeWidth: 4.5, fill: 'none', strokeLinecap: 'round' as const};
  const big = face === 'shock';
  const eye = (x: number) => face === 'star'
    ? <path transform={`translate(${x},${eyeY})`} d="M0 -13 L4 -4 L13 -3 L6 3 L8 12 L0 7 L-8 12 L-6 3 L-13 -3 L-4 -4Z" fill={C.sun} stroke={INK} strokeWidth={2.5} />
    : blink ? <path d={`M${x - 9} ${eyeY} H${x + 9}`} {...stroke} />
    : <ellipse cx={x + lookX} cy={eyeY} rx={big ? 8 : 6.5} ry={big ? 11 : 8.5} fill={INK} />;
  const brow = ({worry: [10, -10], sad: [10, -10], angry: [-14, 14], shock: [-4, 4], think: [-8, 6]} as Record<string, number[]>)[face];
  let mouth: React.ReactNode;
  if (talking) mouth = <ellipse cx={0} cy={28} rx={11} ry={3 + 11 * open} fill={INK} />;
  else switch (face) {
    case 'happy': case 'star': mouth = <path d="M-20 18 Q0 50 20 18Z" fill={C.coral} stroke={INK} strokeWidth={4} strokeLinejoin="round" />; break;
    case 'smile': mouth = <path d="M-16 22 Q0 38 16 22" {...stroke} />; break;
    case 'smug': mouth = <path d="M-12 28 Q6 36 20 18" {...stroke} />; break;
    case 'shock': mouth = <ellipse cx={0} cy={32} rx={12} ry={16} fill={INK} />; break;
    case 'sad': mouth = <path d="M-15 36 Q0 20 15 36" {...stroke} />; break;
    case 'worry': mouth = <path d="M-14 32 Q-5 24 3 32 T16 30" {...stroke} />; break;
    case 'angry': mouth = <path d="M-15 32 H15" {...stroke} />; break;
    case 'think': mouth = <path d="M-6 30 H12" {...stroke} />; break;
    default: mouth = <path d="M-10 28 Q0 33 10 28" {...stroke} />;
  }
  return (
    <g>
      {eye(-dx)}{eye(dx)}
      {brow && <g><path d={`M${-dx - 11} ${-18 + brow[0] * .35} L${-dx + 11} ${-18 + brow[1] * .35}`} {...stroke} /><path d={`M${dx - 11} ${-18 + brow[1] * .35} L${dx + 11} ${-18 + brow[0] * .35}`} {...stroke} /></g>}
      {mouth}
      {face === 'worry' && <path d="M62 -14 C70 -2 72 6 64 10 C56 6 56 -2 62 -14Z" fill={C.skySoft} stroke={INK} strokeWidth={3} />}
    </g>
  );
};

const Krama: React.FC = () => (
  <g>
    <defs><pattern id="krama" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill={C.white} /><rect width="7" height="7" fill={C.coral} /><rect x="7" y="7" width="7" height="7" fill={C.coral} /></pattern></defs>
    <path d="M-34 -334 Q0 -314 34 -334 L38 -314 Q0 -292 -38 -314Z" fill="url(#krama)" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M14 -306 L28 -304 L36 -238 L14 -240Z" fill="url(#krama)" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

export type FigureProps = {
  x: number; y?: number; scale?: number; color?: string; hair?: Hair; hairColor?: string; krama?: boolean; stripes?: boolean; glasses?: boolean;
  face?: Face; pose?: Pose; prevPose?: Pose; poseAt?: number; talking?: boolean; walking?: boolean; seed?: number; flip?: boolean; lookX?: number; children?: React.ReactNode;
};

/**
 * One stick character, feet at (x, y). Always alive: it sways, breathes and blinks by itself.
 * For a pose change, pass prevPose + poseAt and it blends over 8 frames. `children` are drawn at the
 * right hand (holdR / pointR), so a prop stays in the hand wherever the pose moves it.
 */
export const Figure: React.FC<FigureProps> = ({x, y = 900, scale = 1, color = C.sky, hair = 'short', hairColor = C.ink, krama, stripes, glasses, face = 'smile', pose = 'down', prevPose, poseAt = 0, talking, walking, seed = 0, flip, lookX = 0, children}) => {
  const {f} = useScene();
  const t = prevPose ? interpolate(f, [poseAt, poseAt + 8], [0, 1], {...clamp, easing: easeInOut}) : 1;
  const from = POSES[prevPose ?? pose], to = POSES[pose];
  const sway = Math.sin((f + seed * 37) * 0.045) * 1.1;
  const breathe = Math.sin((f + seed * 19) * 0.09) * 2;
  const period = 72 + seed * 17, ph = (f + seed * 31) % period;
  const blink = ph < 4;
  const swing = walking ? Math.sin(f * 0.55) : 0;
  const bob = walking ? Math.abs(Math.sin(f * 0.55)) * 8 : 0;
  const armS = (side: 'R' | 'L') => {
    const sx = side === 'R' ? 32 : -32, sy = -298 + breathe;
    const e = mix(from[side][0], to[side][0], t), h = mix(from[side][1], to[side][1], t);
    const wob = talking ? Math.sin(f * 0.22 + (side === 'R' ? 0 : 2)) * 5 : 0;
    const walkA = walking ? (side === 'R' ? 1 : -1) * swing * 16 : 0;
    return {sx, sy, ex: sx + e[0] + walkA / 2, ey: sy + e[1], hx: sx + h[0] + walkA, hy: sy + h[1] + wob};
  };
  const R = armS('R'), L = armS('L');
  const limb = {stroke: INK, strokeWidth: INK_W, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const arm = (a: ReturnType<typeof armS>) => <path d={`M${a.sx} ${a.sy} L${a.ex} ${a.ey} L${a.hx} ${a.hy}`} {...limb} />;
  const hand = (a: ReturnType<typeof armS>) => <circle cx={a.hx} cy={a.hy} r={11} fill={C.white} stroke={INK} strokeWidth={5} />;
  const legA = swing * 34, legB = -swing * 34;
  return (
    <g transform={`translate(${x},${y - bob}) scale(${(flip ? -1 : 1) * scale},${scale}) rotate(${sway},0,0)`}>
      <ellipse cx={0} cy={bob + 3} rx={58} ry={9} fill={INK} opacity={0.16} />
      <path d={`M-12 -150 L${-26 + legA} 0 M12 -150 L${26 + legB} 0`} {...limb} />
      <path d={`M${-26 + legA} 0 h-14 M${26 + legB} 0 h14`} {...limb} strokeWidth={INK_W + 3} />
      {arm(L)}
      <g transform={`translate(0,${breathe * 0.5})`}>
        <ellipse cx={0} cy={-235} rx={44} ry={92} fill={color} stroke={INK} strokeWidth={INK_W} />
        {stripes && <g stroke={C.white} strokeWidth={9} opacity={0.75}>{[-280, -255, -230, -205, -180].map((yy) => <line key={yy} x1={-37} x2={37} y1={yy} y2={yy} />)}</g>}
        {stripes && <ellipse cx={0} cy={-235} rx={44} ry={92} fill="none" stroke={INK} strokeWidth={INK_W} />}
      </g>
      {krama && <g transform={`translate(0,${breathe * 0.5})`}><Krama /></g>}
      <g transform={`translate(0,${-378 + breathe})`}>
        {hair === 'long' && <HairShape hair={hair} color={hairColor} />}
        <ellipse cx={0} cy={0} rx={56} ry={54} fill={C.white} stroke={INK} strokeWidth={INK_W} />
        {hair !== 'long' && <HairShape hair={hair} color={hairColor} />}
        {hair === 'long' && <path d="M-50 -14 C-44 -60 44 -60 50 -14 C24 -28 -24 -28 -50 -14Z" fill={hairColor} stroke={INK} strokeWidth={5} />}
        <FaceShape face={face} talking={!!talking} f={f + seed * 5} blink={blink} lookX={lookX} />
        {glasses && <g fill="none" stroke={INK} strokeWidth={4}><circle cx={-21} cy={-2} r={15} /><circle cx={21} cy={-2} r={15} /><path d="M-6 -2 H6" /></g>}
      </g>
      {arm(R)}
      {hand(L)}{hand(R)}
      {children && <g transform={`translate(${R.hx},${R.hy})`}>{children}</g>}
    </g>
  );
};
