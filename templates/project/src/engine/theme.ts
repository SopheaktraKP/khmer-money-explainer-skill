import {loadFont as loadKoulen} from '@remotion/google-fonts/Koulen';
import {loadFont as loadKantumruy} from '@remotion/google-fonts/KantumruyPro';

export const TITLE_FONT = loadKoulen('normal', {subsets: ['khmer', 'latin']}).fontFamily;
export const BODY_FONT = loadKantumruy('normal', {weights: ['500', '700'], subsets: ['khmer', 'latin']}).fontFamily;

// The channel's own palette. Change it here, never per scene, so every video stays one system.
export const C = {
  paper: '#F5F1E8', paperDeep: '#EBE4D5', ground: '#E3DAC8', ink: '#1F1B2D', white: '#FFFFFF',
  sun: '#F6B93B', sunSoft: '#FCE7B2', teal: '#1F9E8F', tealSoft: '#CDEBE4', coral: '#E4572E', coralSoft: '#F9D5C7',
  plum: '#6C4AB6', sky: '#3D8BD4', skySoft: '#CFE4F5', grey: '#8A8796', greySoft: '#D9D6CF', leaf: '#4E9F5B', brick: '#B85C38',
};
export const INK_W = 6;
export const GROUND_Y = 900;
