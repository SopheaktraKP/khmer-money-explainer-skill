// The example story: tontine vs bank. For a new video, replace this file, script.json and calc.py; leave engine/ alone.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage} from '../engine/Stage';
import {Figure, FigureProps} from '../engine/Figure';
import {Bank, Bill, Bubble, Chip, FlyingMoney, MoneyBag, Note, Notebook, Show, Stall, StormCloud, Tag, ThoughtCloud, Title, VsBadge} from '../engine/Props';
import {Bars, Card, Counter, money} from '../engine/Charts';
import {kf, SceneContext, step, useScene} from '../engine/anim';
import {C} from '../engine/theme';
import N from './numbers.json';

export const CHANNEL = '';
// Index 0 is the hook and shows no bar. Each later entry is one chapter pill.
export const CHAPTERS = ['', 'តុងជាអ្វី?', 'ដេញថ្លៃ៖ លុយមកពីណា?'];

// ---------- Cast: one definition each, so a character looks identical in every scene ----------
const Neang = (p: Partial<FigureProps> & {x: number}) => <Figure color={C.teal} hair="long" seed={1} {...p} />;
const Bora = (p: Partial<FigureProps> & {x: number}) => <Figure color={C.sky} stripes hair="spiky" seed={2} {...p} />;
const Organizer = (p: Partial<FigureProps> & {x: number}) => <Figure color={C.plum} hair="bun" glasses seed={3} {...p} />;
const Vendor = (p: Partial<FigureProps> & {x: number}) => <Figure color={C.sun} hair="cap" seed={4} {...p} />;

const Hook: React.FC = () => {
  const {f, at, speaking} = useScene();
  const bad = at('h5');
  const neangX = kf(f, [[0, 620], [at('h2'), 520]], 16);
  const boraX = kf(f, [[0, 1300], [at('h2', .5), 1180]], 16);
  return (
    <Stage tint={[[bad + 4, 'stress'], [at('h6'), 'warm']]} zoom={[[0, 1], [at('h5'), 1.12], [at('h6'), 1]]} focus={[520, 620]}>
      <Show at={at('h1', .55)} out={at('h2') - 4} x={960} y={250}><Title text={`${money(N.share)} = ${money(N.share)}`} size={110} /></Show>
      <Show at={at('h2', .1)} out={at('h6')} x={190} y={900} from="left"><Stall /></Show>
      <Show at={at('h2', .1)} out={at('h6')} x={190} y={610}><Chip text="តុង" bg={C.sunSoft} size={44} /></Show>
      <Show at={at('h2', .6)} out={at('h6')} x={1590} y={900} from="right"><Bank label="ធនាគារ" /></Show>
      <Neang x={neangX} walking={f > at('h2') && f < at('h2') + 16} talking={false}
        pose={step(f, [[0, 'wave'], [at('h1', .3), 'down'], [at('h4', .4), 'up'], [bad, 'headGrab'], [at('h6'), 'down']])}
        face={step(f, [[0, 'smile'], [at('h4', .4), 'star'], [bad, 'shock'], [at('h6'), 'think']])} />
      <Bora x={boraX} walking={f > at('h2', .5) && f < at('h2', .5) + 16}
        pose={step(f, [[0, 'down'], [at('h1', .2), 'wave'], [at('h1', .5), 'down'], [at('h3', .6), 'hips']])}
        face={step(f, [[0, 'smile'], [at('h4', .4), 'neutral'], [bad, 'shock'], [at('h6'), 'think']])} />
      <Show at={at('h3', .6)} out={at('h6')} x={1180} y={350}><Tag text={`+${money(N.bank_net)}`} kind="gain" size={58} /></Show>
      <Show at={at('h4', .4)} out={bad} x={520} y={300}><Tag text={`+${money(N.last_gain)}`} kind="gain" size={84} /></Show>
      <Show at={bad + 6} out={at('h6')} x={520} y={210} from="up"><StormCloud scale={1.3} /></Show>
      <Show at={bad + 10} out={at('h6')} x={740} y={360}><Tag text={money(-N.lost)} kind="loss" size={84} tilt={4} /></Show>
      {[0, 4, 9, 14, 19].map((d, i) => <FlyingMoney key={i} kind="bill" at={bad + 12 + d} dur={34} from={[520, 560]} to={[-60 + i * 30, 180 + i * 40]} arc={70} />)}
      <Show at={at('h6', .05)} x={960} y={250}><Title text="តុង ឬ ធនាគារ?" size={120} mark /></Show>
      <Show at={at('h6', .05)} x={850} y={640}><VsBadge scale={.9} /></Show>
      {speaking('h6') && null}
    </Stage>
  );
};

/** 12 people in two rows with a gap in the middle for the pot. Index 0 is Neang so viewers can follow her. */
const FRONT = [180, 480, 780, 1140, 1440, 1740];
const BACK = [330, 630, 900, 1020, 1290, 1590];
const RING = [...FRONT.map((x) => ({x, y: 900})), ...BACK.map((x) => ({x, y: 660}))];
const COLORS = [C.teal, C.coral, C.sun, C.sky, C.leaf, C.plum, C.brick, C.grey];
const HAIRS = ['long', 'short', 'bun', 'side', 'cap', 'spiky'] as const;

const What: React.FC = () => {
  const {f, at} = useScene();
  const potX = kf(f, [[0, 960], [at('w3', .75), RING[2].x], [at('w4', .1), RING[8].x], [at('w4', .55), RING[4].x], [at('w5'), 960]], 18);
  const potY = kf(f, [[0, 800], [at('w3', .75), 900], [at('w4', .1), 660], [at('w4', .55), 900], [at('w5'), 800]], 18);
  const order = RING.map((r, i) => ({...r, i})).sort((a, b) => a.y - b.y);
  return (
    <Stage mood="warm" street={false}>
      {order.map(({x, y, i}) => {
        const shown = at('w1', .05 + i * .05);
        return (
          <Show key={i} at={shown}>
            {i === 0
              ? <Neang x={x} y={y} scale={.68} face="happy" />
              : <Figure x={x} y={y} scale={y < 800 ? .52 : .62} color={COLORS[i % COLORS.length]} hair={HAIRS[i % HAIRS.length]} seed={i} face={i % 3 ? 'smile' : 'neutral'} />}
          </Show>
        );
      })}
      <Show at={at('w2', .1)} out={at('w5', .4)} x={960} y={170}><Title text={`${N.members} នាក់`} size={84} /></Show>
      <Show at={at('w2', .5)} out={at('w3')} from="up">
        <Organizer x={960} y={800} pose="holdR" face="smile" scale={.82}><Notebook scale={1.2} /></Organizer>
      </Show>
      <Show at={at('w2', .55)} out={at('w3')} x={1330} y={330}><Chip text="មេតុង" bg={C.sunSoft} size={46} /></Show>
      {RING.map((r, i) => <FlyingMoney key={i} at={at('w3', .12) + i * 3} dur={20} from={[r.x, r.y - 120]} to={[960, 700]} arc={90} />)}
      <Show at={at('w3', .15)} out={at('w5') + 40}><g transform={`translate(${potX},${potY})`}><MoneyBag label={money(N.share * (N.members - 1))} /></g></Show>
      <Show at={at('w5', .5)} x={960} y={330}><Title text="អ្នកណាបានមុន?" size={120} color={C.coral} /></Show>
    </Stage>
  );
};

const Bid: React.FC = () => {
  const {f, at} = useScene();
  const leave = at('d3');
  return (
    <Stage zoom={[[0, 1]]}>
      {/* d1-d2: the vendor bids */}
      <Show at={0} out={leave} x={300} y={900} from="left"><Stall color={C.leaf} /></Show>
      <Show at={at('d1', .05)} out={leave}>
        <Vendor x={560} pose={step(f, [[0, 'down'], [at('d1', .75), 'up']])} face={step(f, [[0, 'worry'], [at('d1', .75), 'smile']])} />
      </Show>
      <Show at={at('d1', .3)} out={at('d2')} x={930} y={300}>
        <ThoughtCloud tail={[-190, 120]}><g transform="translate(0,-90)"><MoneyBag scale={.7} /></g></ThoughtCloud>
      </Show>
      <Show at={at('d1', .8)} out={leave} x={560} y={300}><Tag text={`ដេញ ${money(N.bid)}`} kind="price" size={60} /></Show>
      <Show at={at('d2', .35)} out={leave} x={1320} y={470}><Card x={0} y={0} w={760} h={330} title="អ្នកមិនទាន់ទទួលលុយ ដាក់ប៉ុន្មាន?">
        <g transform="translate(-180,70)"><text textAnchor="middle" fontFamily="inherit" fontWeight={700} fontSize={84} fill={C.grey} textDecoration="line-through">{money(N.share)}</text></g>
        <g transform="translate(170,76)"><Counter at={at('d2', .55)} from={N.share} to={N.live} dur={18} size={110} color={C.teal} /></g>
      </Card></Show>

      {/* d3-d5: Neang waits, then the comparison with Bora */}
      <Show at={leave}><Neang x={330} pose={step(f, [[0, 'down'], [at('d4'), 'up'], [at('d5'), 'pointR']])} face={step(f, [[0, 'think'], [at('d4'), 'star'], [at('d5'), 'smile']])} /></Show>
      <Show at={leave} out={at('d5')} x={1130} y={500}>
        <Card x={0} y={0} w={1120} h={620} title={`ស្រីនាង៖ ទទួលខែទី ${N.members}`}>
          <g transform="translate(0,50)"><Bars at={at('d3', .55)} w={760} h={380} barW={170} items={[
            {label: 'បង់សរុប', value: N.last_paid, color: C.coralSoft, at: at('d3', .55)},
            {label: 'ទទួលបាន', value: N.last_got, color: C.tealSoft, at: at('d3', .8)},
          ]} /></g>
        </Card>
      </Show>
      <Show at={at('d4', .05)} out={at('d5')} x={1560} y={250}><Tag text={`+${money(N.last_gain)}`} kind="gain" size={72} /></Show>
      <Show at={at('d5', .05)} x={1140} y={500}>
        <Card x={0} y={0} w={1080} h={620} title="ចំណេញក្នុងមួយឆ្នាំ">
          <g transform="translate(0,50)"><Bars at={at('d5', .2)} w={720} h={380} barW={170} items={[
            {label: 'ស្រីនាង (តុង)', value: N.last_gain, color: C.teal, at: at('d5', .2)},
            {label: 'បូរ៉ា (ធនាគារ)', value: N.bank_net, color: C.sky, at: at('d5', .8)},
          ]} /></g>
        </Card>
      </Show>
      <Show at={at('d5', .45)} from="fade"><Note text={`សន្មត៖ ដេញថ្លៃ ${money(N.bid)} រាល់ខែ · ប្រាក់បញ្ញើ ${N.bank_rate_pct}% ក្នុងមួយឆ្នាំ · ពន្ធ ${N.tax_pct}%`} /></Show>
    </Stage>
  );
};

export const SCENES = {Hook, What, Bid};

const STILL_CTX = {f: 200, fps: 30, dur: 400, at: () => 0, end: () => 400, speaking: () => false};
/** 16:9 thumbnail: rendered at 1920x1080, then downscale to 1280x720 for upload. */
export const Thumbnail: React.FC = () => (
  <SceneContext.Provider value={STILL_CTX}>
    <AbsoluteFill style={{background: `linear-gradient(115deg, ${C.sunSoft} 0 49.7%, ${C.ink} 49.7% 50.3%, ${C.skySoft} 50.3%)`}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Show at={0} x={480} y={190}><Title text="តុង" size={190} /></Show>
        <Show at={0} x={1440} y={190}><Title text="ធនាគារ" size={170} /></Show>
        <Neang x={480} y={1040} scale={1.35} face="shock" pose="headGrab" />
        <Bora x={1440} y={1040} scale={1.35} face="smile" pose="hips" />
        <Show at={0} x={800} y={480}><Tag text={money(-N.lost)} kind="loss" size={74} /></Show>
        <Show at={0} x={180} y={500}><Tag text={`+${money(N.last_gain)}`} kind="gain" size={74} /></Show>
        <Show at={0} x={1760} y={500}><Tag text={`+${money(N.bank_net)}`} kind="gain" size={74} /></Show>
        <Show at={0} x={960} y={640}><VsBadge scale={1.2} /></Show>
      </svg>
    </AbsoluteFill>
  </SceneContext.Provider>
);
