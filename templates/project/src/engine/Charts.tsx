import React from 'react';
import {interpolate} from 'remotion';
import {BODY_FONT, C, INK_W} from './theme';
import {clamp, easeOut, useScene} from './anim';

const INK = C.ink;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const money = (n: number) => `${n < 0 ? '-' : ''}$${fmt(Math.abs(n))}`;

/** White card that holds a chart or list, centred at (x, y). */
export const Card: React.FC<{x: number; y: number; w: number; h: number; title?: string; children?: React.ReactNode}> = ({x, y, w, h, title, children}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-w / 2 + 7} y={-h / 2 + 8} width={w} height={h} rx={22} fill={INK} opacity={.12} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={C.white} stroke={INK} strokeWidth={INK_W - 1} />
    {title && (
      <foreignObject x={-w / 2} y={-h / 2 + 12} width={w} height={68}>
        <div style={{textAlign: 'center', fontFamily: BODY_FONT, fontWeight: 700, fontSize: 36, lineHeight: 1.5, color: INK}}>{title}</div>
      </foreignObject>
    )}
    {children}
  </g>
);

/** A number that rolls to its value and lands on the exact figure. */
export const Counter: React.FC<{at: number; dur?: number; from?: number; to: number; size?: number; color?: string; signed?: boolean}> = ({at, dur = 26, from = 0, to, size = 72, color = INK, signed}) => {
  const {f} = useScene();
  const v = interpolate(f, [at, at + dur], [from, to], {...clamp, easing: easeOut});
  const shown = f < at ? from : v;
  return <text textAnchor="middle" fontFamily={BODY_FONT} fontWeight={700} fontSize={size} fill={color} stroke={C.white} strokeWidth={size * .1} paintOrder="stroke fill">{`${signed && shown > 0 ? '+' : ''}${money(shown)}`}</text>;
};

export type BarItem = {label: string; value: number; color?: string; at?: number};
/** Side-by-side money bars, with the zero line in the middle when values go negative. */
export const Bars: React.FC<{items: BarItem[]; at: number; w?: number; h?: number; barW?: number; signed?: boolean}> = ({items, at, w = 700, h = 300, barW = 120, signed}) => {
  const {f} = useScene();
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const hasNeg = items.some((i) => i.value < 0);
  const hasPos = items.some((i) => i.value > 0);
  const zero = hasNeg ? (hasPos ? 0 : -h / 2) : h / 2;
  const scale = (hasNeg && hasPos ? h / 2 - 54 : h - 60) / max;
  return (
    <g>
      <line x1={-w / 2} x2={w / 2} y1={zero} y2={zero} stroke={INK} strokeWidth={4} />
      {items.map((it, i) => {
        const x = -w / 2 + (w / items.length) * (i + .5);
        const a = it.at ?? at + i * 10;
        const t = interpolate(f, [a, a + 22], [0, 1], {...clamp, easing: easeOut});
        const bh = it.value * scale * t;
        const y = bh >= 0 ? zero - bh : zero;
        const shown = it.value * t;
        const labelY = hasNeg && hasPos ? (it.value >= 0 ? zero + 40 : zero - 14) : zero + 42;
        return (
          <g key={i} opacity={f >= a ? 1 : .001}>
            <rect x={x - barW / 2} y={y} width={barW} height={Math.abs(bh)} rx={6} fill={it.color ?? C.teal} stroke={INK} strokeWidth={4} />
            <text x={x} y={bh >= 0 ? y - 14 : y + Math.abs(bh) + 44} textAnchor="middle" fontFamily={BODY_FONT} fontWeight={700} fontSize={40} fill={INK}>{(signed && shown > 0 ? '+' : '') + money(shown)}</text>
            <text x={x} y={labelY} textAnchor="middle" fontFamily={BODY_FONT} fontWeight={700} fontSize={30} fill={INK}>{it.label}</text>
          </g>
        );
      })}
    </g>
  );
};

/** Line chart for a value over time. Draws itself from `at`. */
export const LineChart: React.FC<{values: number[]; at: number; w?: number; h?: number; color?: string; xLabels?: [string, string]; dur?: number}> = ({values, at, w = 700, h = 300, color = C.teal, xLabels, dur = 40}) => {
  const {f} = useScene();
  const lo = Math.min(...values), hi = Math.max(...values), range = hi - lo || 1;
  const pts = values.map((v, i) => [-w / 2 + (w / (values.length - 1)) * i, h / 2 - ((v - lo) / range) * h] as [number, number]);
  const t = interpolate(f, [at, at + dur], [0, 1], clamp);
  const n = Math.max(2, Math.ceil(t * pts.length));
  const end = pts[n - 1];
  return (
    <g>
      <line x1={-w / 2} x2={w / 2} y1={h / 2} y2={h / 2} stroke={INK} strokeWidth={3} />
      <polyline points={pts.slice(0, n).map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={end[0]} cy={end[1]} r={11} fill={color} stroke={INK} strokeWidth={4} />
      {xLabels && <g fontFamily={BODY_FONT} fontWeight={500} fontSize={27} fill={INK}><text x={-w / 2} y={h / 2 + 38}>{xLabels[0]}</text><text x={w / 2} y={h / 2 + 38} textAnchor="end">{xLabels[1]}</text></g>}
    </g>
  );
};

export type Tile = 'empty' | 'paid' | 'won' | 'lost' | 'future';
/** Grid of months or payments: the "count the instalments" visual. states[i] sets each tile's look. */
export const MonthGrid: React.FC<{n?: number; cols?: number; size?: number; gap?: number; states: Tile[]; labels?: string[]}> = ({n = 12, cols = 6, size = 92, gap = 14, states, labels}) => {
  const rows = Math.ceil(n / cols);
  const tw = cols * size + (cols - 1) * gap, th = rows * size + (rows - 1) * gap;
  const fill: Record<Tile, string> = {empty: C.white, future: C.paperDeep, paid: C.tealSoft, won: C.sun, lost: C.coralSoft};
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const x = -tw / 2 + (i % cols) * (size + gap), y = -th / 2 + Math.floor(i / cols) * (size + gap);
        const s = states[i] ?? 'empty';
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <rect width={size} height={size} rx={12} fill={fill[s]} stroke={INK} strokeWidth={4} />
            <text x={size / 2} y={size / 2 + 13} textAnchor="middle" fontFamily={BODY_FONT} fontWeight={700} fontSize={34} fill={INK}>{labels?.[i] ?? i + 1}</text>
            {s === 'lost' && <path d={`M10 10 L${size - 10} ${size - 10} M${size - 10} 10 L10 ${size - 10}`} stroke={C.coral} strokeWidth={7} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};
