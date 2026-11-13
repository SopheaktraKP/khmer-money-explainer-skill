import React from 'react';
import {interpolate} from 'remotion';
import {BODY_FONT, C, TITLE_FONT, INK_W} from './theme';
import {clamp, easeOut, fadeIn, fadeOut, pop, useScene} from './anim';

const INK = C.ink;
const line = {stroke: INK, strokeWidth: INK_W - 1, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

/** Reveal wrapper: every prop, tag and card enters through this, so entrances feel like one system. */
export const Show: React.FC<{at: number; out?: number; x?: number; y?: number; from?: 'pop' | 'up' | 'left' | 'right' | 'fade'; scale?: number; children: React.ReactNode}> =
  ({at, out, x = 0, y = 0, from = 'pop', scale = 1, children}) => {
    const {f, fps} = useScene();
    if (f < at - 1 || (out !== undefined && f > out + 9)) return null;
    const o = out !== undefined ? fadeOut(f, out) : 1;
    const p = pop(f, at, fps);
    const e = interpolate(f, [at, at + 14], [0, 1], {...clamp, easing: easeOut});
    const s = from === 'pop' ? p : 1;
    const dx = from === 'left' ? (e - 1) * 260 : from === 'right' ? (1 - e) * 260 : 0;
    const dy = from === 'up' ? (1 - e) * 70 : 0;
    const op = from === 'pop' ? o : o * fadeIn(f, at, 8);
    return <g opacity={op} transform={`translate(${x + dx},${y + dy}) scale(${s * scale})`}>{children}</g>;
  };

/** Box with Khmer-safe auto-sizing HTML inside SVG. Anchored at its centre. */
const Html: React.FC<{w?: number; h?: number; children: React.ReactNode}> = ({w = 1200, h = 500, children}) => (
  <foreignObject x={-w / 2} y={-h / 2} width={w} height={h} style={{overflow: 'visible'}}>
    <div style={{width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY_FONT, color: INK}}>{children}</div>
  </foreignObject>
);

/** Big Khmer headline. mark = highlighter bar behind the line. Use color for the single word that matters. */
export const Title: React.FC<{text: string; size?: number; color?: string; mark?: boolean; halo?: boolean}> = ({text, size = 92, color = INK, mark, halo = true}) => (
  <Html w={1800} h={size * 2.6}>
    <div style={{position: 'relative', display: 'inline-block', padding: '0 26px', fontFamily: TITLE_FONT, fontSize: size, lineHeight: 1.5, color, textAlign: 'center', isolation: 'isolate',
      WebkitTextStroke: halo && !mark ? `${size * 0.14}px ${C.white}` : undefined, paintOrder: 'stroke fill'}}>
      {mark && <div style={{position: 'absolute', left: 0, right: 0, bottom: size * 0.22, height: size * 0.42, background: C.sun, transform: 'rotate(-1deg)', zIndex: -1}} />}
      {text.split(/([\d$=+,.%-]+)/).map((part, i) => (i % 2 ? <span key={i} style={{fontFamily: BODY_FONT, fontWeight: 700}}>{part}</span> : part))}
    </div>
  </Html>
);

/** Plain body line for short statements on the stage. */
export const Label: React.FC<{text: string; size?: number; color?: string; weight?: number}> = ({text, size = 44, color = INK, weight = 700}) => (
  <Html w={1400} h={size * 2.4}><div style={{fontSize: size, fontWeight: weight, color, textAlign: 'center', lineHeight: 1.45}}>{text}</div></Html>
);

export const Chip: React.FC<{text: string; bg?: string; color?: string; size?: number}> = ({text, bg = C.white, color = INK, size = 36}) => (
  <Html w={1000} h={size * 3}>
    <div style={{padding: `${size * 0.12}px ${size * 0.6}px`, background: bg, color, border: `4px solid ${INK}`, borderRadius: size * 0.7, fontWeight: 700, fontSize: size, lineHeight: 1.45, whiteSpace: 'nowrap'}}>{text}</div>
  </Html>
);

/** Money tag: green for gain, pink for loss, yellow for a neutral price. */
export const Tag: React.FC<{text: string; kind?: 'gain' | 'loss' | 'price'; size?: number; tilt?: number}> = ({text, kind = 'price', size = 46, tilt = -5}) => {
  const bg = {gain: C.tealSoft, loss: C.coralSoft, price: C.sunSoft}[kind];
  const color = {gain: '#0D6B60', loss: '#B23A17', price: INK}[kind];
  return (
    <g transform={`rotate(${tilt})`}>
      <Html w={700} h={size * 3}>
        <div style={{position: 'relative', padding: `${size * 0.14}px ${size * 0.7}px ${size * 0.14}px ${size * 0.45}px`, background: bg, color, border: `4px solid ${INK}`, borderRadius: 10, fontWeight: 700, fontSize: size, lineHeight: 1.35, whiteSpace: 'nowrap'}}>
          {text}<span style={{position: 'absolute', right: size * 0.22, top: '50%', width: size * .22, height: size * .22, marginTop: -size * .11, borderRadius: 99, background: C.white, border: `3px solid ${INK}`}} />
        </div>
      </Html>
    </g>
  );
};

/** Speech bubble; tail points to `tail` relative to centre. */
export const Bubble: React.FC<{text: string; w?: number; tail?: [number, number]; size?: number; h?: number}> = ({text, w = 620, tail = [-120, 120], size = 36, h = 150}) => (
  <g>
    <path d={`M${tail[0] - 30} ${h / 2 - 18} L${tail[0]} ${tail[1]} L${tail[0] + 34} ${h / 2 - 18}Z`} fill={C.white} {...line} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={C.white} {...line} />
    <rect x={tail[0] - 24} y={h / 2 - 8} width={52} height={10} fill={C.white} />
    <Html w={w - 44} h={h - 10}><div style={{fontSize: size, fontWeight: 500, textAlign: 'center', lineHeight: 1.45}}>{text}</div></Html>
  </g>
);

export const ThoughtCloud: React.FC<{w?: number; h?: number; tail?: [number, number]; children?: React.ReactNode}> = ({w = 340, h = 220, tail = [-110, 170], children}) => (
  <g>
    <circle cx={tail[0] * .6} cy={h / 2 + (tail[1] - h / 2) * .35} r={15} fill={C.white} {...line} />
    <circle cx={tail[0]} cy={tail[1]} r={9} fill={C.white} {...line} />
    <path d={`M${-w * .42} ${h * .22} C${-w * .62} ${h * .1} ${-w * .55} ${-h * .3} ${-w * .3} ${-h * .3} C${-w * .26} ${-h * .62} ${w * .14} ${-h * .62} ${w * .2} ${-h * .36} C${w * .5} ${-h * .46} ${w * .62} ${h * .04} ${w * .42} ${h * .22} C${w * .4} ${h * .52} ${w * .02} ${h * .54} ${-w * .06} ${h * .36} C${-w * .2} ${h * .54} ${-w * .42} ${h * .46} ${-w * .42} ${h * .22}Z`} fill={C.white} {...line} />
    {children}
  </g>
);

/** Savings jar, bottom-centre origin. Animate fill 0..1 from the scene with kf(). */
export const Jar: React.FC<{fill?: number; color?: string; label?: string; scale?: number}> = ({fill = 0, color = C.teal, label, scale = 1}) => {
  const H = 200, W = 150, top = -H + 10;
  const lvl = (H - 22) * Math.max(0, Math.min(1, fill));
  return (
    <g transform={`scale(${scale})`}>
      <rect x={-W / 2} y={top} width={W} height={H - 10} rx={24} fill="#fff" opacity={.65} />
      {lvl > 0 && <rect x={-W / 2 + 5} y={-14 - lvl} width={W - 10} height={lvl + 4} rx={12} fill={color} />}
      <rect x={-W / 2} y={top} width={W} height={H - 10} rx={24} fill="none" {...line} />
      <rect x={-W / 2 - 4} y={top - 32} width={W + 8} height={36} rx={9} fill={C.sun} {...line} />
      {label && <g transform={`translate(0,${-H * .48})`}><rect x={-58} y={-24} width={116} height={48} rx={8} fill={C.white} {...line} strokeWidth={3} /><Html w={112} h={46}><span style={{fontSize: 26, fontWeight: 700, whiteSpace: 'nowrap'}}>{label}</span></Html></g>}
    </g>
  );
};
export const Coin: React.FC<{r?: number}> = ({r = 30}) => (
  <g><circle r={r} fill={C.sun} {...line} /><circle r={r * .68} fill="none" stroke={INK} strokeWidth={2.5} opacity={.5} /><text textAnchor="middle" dy={r * .36} fontFamily={BODY_FONT} fontWeight={700} fontSize={r} fill={INK}>$</text></g>
);
export const Bill: React.FC<{scale?: number; color?: string}> = ({scale = 1, color = '#BFE6CB'}) => (
  <g transform={`scale(${scale})`}><rect x={-44} y={-24} width={88} height={48} rx={5} fill={color} {...line} strokeWidth={4} /><circle r={13} fill="none" stroke={INK} strokeWidth={3} /><text textAnchor="middle" dy={8} fontFamily={BODY_FONT} fontWeight={700} fontSize={21} fill={INK}>$</text></g>
);
/** Fat money bag: the pot. Origin bottom-centre. */
export const MoneyBag: React.FC<{label?: string; scale?: number}> = ({label, scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <path d="M-34 -150 C-96 -116 -114 -52 -92 -20 C-80 -4 80 -4 92 -20 C114 -52 96 -116 34 -150Z" fill={C.sun} {...line} />
    <path d="M-32 -152 Q-50 -190 -24 -180 Q0 -194 24 -180 Q50 -190 32 -152Z" fill={C.sun} {...line} />
    <path d="M-38 -150 H38" fill="none" strokeWidth={9} stroke={C.brick} strokeLinecap="round" />
    {label ? <g transform="translate(0,-74)"><Html w={200} h={80}><span style={{fontWeight: 700, fontSize: 36, whiteSpace: 'nowrap'}}>{label}</span></Html></g>
      : <text textAnchor="middle" y={-52} fontFamily={BODY_FONT} fontWeight={700} fontSize={64} fill={INK}>$</text>}
  </g>
);
export const Calendar: React.FC<{text: string; sub?: string; scale?: number}> = ({text, sub, scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <rect x={-62} y={-62} width={124} height={124} rx={12} fill={C.white} {...line} />
    <path d="M-62 -24 V-50 Q-62 -62 -50 -62 H50 Q62 -62 62 -50 V-24Z" fill={C.coral} {...line} />
    <g transform="translate(0,-43)"><Html w={120} h={40}><span style={{fontSize: 21, fontWeight: 700, color: C.white, whiteSpace: 'nowrap'}}>{sub}</span></Html></g>
    <g transform="translate(0,19)"><Html w={120} h={84}><span style={{fontSize: 48, fontWeight: 700, whiteSpace: 'nowrap'}}>{text}</span></Html></g>
  </g>
);
export const Bank: React.FC<{label?: string; scale?: number}> = ({label, scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <rect x={-190} y={-34} width={380} height={34} fill={C.paperDeep} {...line} />
    <rect x={-168} y={-262} width={336} height={228} fill={C.white} {...line} />
    {[-120, -40, 40, 120].map((x) => <rect key={x} x={x - 16} y={-250} width={32} height={216} fill={C.skySoft} {...line} strokeWidth={4} />)}
    <path d="M-205 -262 L0 -372 L205 -262Z" fill={C.sky} {...line} />
    {label && <g transform="translate(0,-298)"><Html w={300} h={50}><span style={{fontSize: 32, fontWeight: 700, color: C.white, whiteSpace: 'nowrap'}}>{label}</span></Html></g>}
  </g>
);
export const House: React.FC<{scale?: number; color?: string}> = ({scale = 1, color = C.sunSoft}) => (
  <g transform={`scale(${scale})`}>
    <rect x={-120} y={-170} width={240} height={170} fill={color} {...line} />
    <path d="M-150 -170 L0 -280 L150 -170Z" fill={C.brick} {...line} />
    <rect x={-30} y={-90} width={60} height={90} fill={C.white} {...line} /><rect x={-96} y={-130} width={46} height={46} fill={C.skySoft} {...line} /><rect x={50} y={-130} width={46} height={46} fill={C.skySoft} {...line} />
  </g>
);
export const Stall: React.FC<{scale?: number; color?: string}> = ({scale = 1, color = C.teal}) => (
  <g transform={`scale(${scale})`}>
    <rect x={-120} y={-90} width={240} height={90} fill={C.white} {...line} />
    <path d="M-116 -90 V-210 M116 -90 V-210" fill="none" {...line} />
    <path d="M-140 -210 H140 L156 -160 H-156Z" fill={color} {...line} />
    {[-96, -32, 32, 96].map((x) => <path key={x} d={`M${x - 24} -208 H${x + 8} L${x + 12} -162 H${x - 30}Z`} fill={C.white} opacity={.75} />)}
  </g>
);
/** The book an organizer keeps: the whole informal system lives in it. */
export const Notebook: React.FC<{scale?: number}> = ({scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <rect x={-34} y={-44} width={68} height={88} rx={5} fill={C.coral} {...line} strokeWidth={4} />
    <rect x={-24} y={-32} width={48} height={22} fill={C.white} stroke={INK} strokeWidth={3} />
    <path d="M-34 -30 h-6 M-34 -10 h-6 M-34 10 h-6 M-34 30 h-6" fill="none" {...line} strokeWidth={3} />
  </g>
);
export const Phone: React.FC<{scale?: number}> = ({scale = 1}) => (
  <g transform={`scale(${scale})`}><rect x={-24} y={-44} width={48} height={88} rx={9} fill={INK} /><rect x={-19} y={-37} width={38} height={68} rx={3} fill={C.skySoft} /></g>
);
export const Rock: React.FC<{label?: string; scale?: number}> = ({label, scale = 1}) => (
  <g transform={`scale(${scale})`}>
    <path d="M-110 -6 L-124 -70 L-70 -128 L34 -138 L108 -96 L118 -14 Z" fill={C.grey} {...line} />
    {label && <g transform="translate(0,-66)"><Html w={220} h={60}><span style={{fontSize: 38, fontWeight: 700, color: C.white, whiteSpace: 'nowrap'}}>{label}</span></Html></g>}
  </g>
);
export const Umbrella: React.FC<{scale?: number}> = ({scale = 1}) => (
  <g transform={`scale(${scale})`}><path d="M0 -210 V-10 Q0 8 -18 6" fill="none" {...line} /><path d="M-130 -210 Q0 -310 130 -210 Q88 -234 44 -210 Q0 -234 -44 -210 Q-88 -234 -130 -210Z" fill={C.sun} {...line} /></g>
);
export const StormCloud: React.FC<{scale?: number}> = ({scale = 1}) => (
  <g transform={`scale(${scale})`}><path d="M-120 20 C-170 20 -170 -44 -110 -46 C-100 -96 -24 -100 -6 -62 C26 -86 90 -66 86 -30 C136 -32 142 20 100 20Z" fill={C.grey} {...line} /></g>
);
export const CheckMark: React.FC<{ok: boolean; r?: number}> = ({ok, r = 32}) => (
  <g><circle r={r} fill={ok ? C.teal : C.coral} {...line} strokeWidth={4} />
    {ok ? <path d={`M${-r * .45} 0 L${-r * .1} ${r * .36} L${r * .5} ${-r * .36}`} fill="none" stroke={C.white} strokeWidth={r * .2} strokeLinecap="round" strokeLinejoin="round" />
      : <path d={`M${-r * .38} ${-r * .38} L${r * .38} ${r * .38} M${r * .38} ${-r * .38} L${-r * .38} ${r * .38}`} stroke={C.white} strokeWidth={r * .2} strokeLinecap="round" />}
  </g>
);
export const VsBadge: React.FC<{scale?: number}> = ({scale = 1}) => (
  <g transform={`scale(${scale})`}><circle r={78} fill={C.sun} {...line} strokeWidth={8} /><text textAnchor="middle" dy={26} fontFamily={BODY_FONT} fontWeight={700} fontSize={70} fill={INK}>VS</text></g>
);
export const Arrow: React.FC<{from: [number, number]; to: [number, number]; color?: string; bend?: number; progress?: number}> = ({from, to, color = C.coral, bend = -60, progress = 1}) => {
  const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2 + bend;
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) * 1.2;
  const a = Math.atan2(to[1] - my, to[0] - mx) * 180 / Math.PI;
  return (
    <g>
      <path d={`M${from[0]} ${from[1]} Q${mx} ${my} ${to[0]} ${to[1]}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${len * progress} ${len}`} />
      {progress > .97 && <path transform={`translate(${to[0]},${to[1]}) rotate(${a})`} d="M-24 -16 L6 0 L-24 16Z" fill={color} stroke={color} strokeWidth={5} strokeLinejoin="round" />}
    </g>
  );
};
/** Money travels from a to b along an arc; start it with `at`, it lands after `dur` frames. */
export const FlyingMoney: React.FC<{at: number; dur?: number; from: [number, number]; to: [number, number]; arc?: number; kind?: 'coin' | 'bill'}> = ({at, dur = 22, from, to, arc = 120, kind = 'coin'}) => {
  const {f} = useScene();
  if (f < at || f > at + dur) return null;
  const t = interpolate(f, [at, at + dur], [0, 1], {...clamp, easing: easeOut});
  const x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * arc;
  return <g transform={`translate(${x},${y}) rotate(${t * 240})`}>{kind === 'coin' ? <Coin r={22} /> : <Bill scale={.8} />}</g>;
};
/** Small note at the bottom: every assumed or sourced number shows where it came from. */
export const Note: React.FC<{text: string; x?: number; y?: number}> = ({text, x = 960, y = 1030}) => (
  <g transform={`translate(${x},${y})`}><Html w={1700} h={70}><div style={{padding: '2px 22px', background: 'rgba(255,255,255,.85)', borderRadius: 10, fontSize: 30, fontWeight: 500, color: '#4A4658', whiteSpace: 'nowrap'}}>{text}</div></Html></g>
);

/** Step-through moto, the kind on every Cambodian street. Sits on the ground line by default (pass y to change), faces right. A rider stands at x-40. */
export const Moto: React.FC<{x?: number; y?: number; scale?: number; flip?: boolean; spin?: number; color?: string}> = ({x = 0, y = 900, scale = 1, flip, spin = 0, color = C.brick}) => {
  const wheel = (cx: number) => (
    <g transform={`translate(${cx},-46) rotate(${spin})`}>
      <circle r={46} fill={C.ink} />
      <circle r={25} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <path d="M-25 0 H25 M0 -25 V25" stroke={C.ink} strokeWidth={4} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${(flip ? -1 : 1) * scale},${scale})`}>
      {wheel(-120)}{wheel(120)}
      <rect x={-172} y={-62} width={130} height={18} rx={9} fill={C.grey} {...line} strokeWidth={4} />
      <path d="M112 -150 L120 -46" fill="none" {...line} strokeWidth={9} />
      <path d="M-182 -112 C-172 -150 -120 -160 -70 -152 L20 -150 C34 -118 44 -100 62 -96 L86 -150 L100 -236 L128 -236 L122 -150 L92 -74 C60 -56 -20 -52 -60 -62 C-110 -70 -162 -80 -182 -112Z" fill={color} {...line} />
      <path d="M72 -60 Q120 -118 168 -64" fill={color} {...line} />
      <rect x={-150} y={-174} width={170} height={26} rx={13} fill={C.ink} />
      <circle cx={-182} cy={-120} r={9} fill={C.coral} {...line} strokeWidth={3} />
      <path d="M92 -272 L116 -262 L112 -236" fill="none" {...line} strokeWidth={8} />
      <circle cx={136} cy={-214} r={20} fill={C.sun} {...line} />
    </g>
  );
};

/** Name under a character, on the ground line. Show it when each person is introduced. */
export const NameChip: React.FC<{at: number; x: number; text: string; bg: string}> = ({at, x, text, bg}) => (
  <Show at={at} x={x} y={966}><Chip text={text} bg={bg} size={40} /></Show>
);
