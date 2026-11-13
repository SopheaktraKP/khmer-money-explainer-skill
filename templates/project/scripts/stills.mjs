// Fast look check: node scripts/stills.mjs out/look/x_ 100,400,900 [scale=0.5] [comp=Main]
// Bundles once and renders the given frames. Set RENDER_TMP to a big drive so bundles can't fill C:.
// Set BROWSER_EXE if the project path is too long for Windows (260 chars) to start Remotion's browser.
import path from 'path';
import fs from 'fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [prefix, frames, scale = '0.5', comp = 'Main'] = process.argv.slice(2);
if (process.env.RENDER_TMP) {
  fs.mkdirSync(process.env.RENDER_TMP, {recursive: true});
  process.env.TEMP = process.env.TMP = process.env.RENDER_TMP;
}
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.BROWSER_EXE || null;
const composition = await selectComposition({serveUrl, id: comp, browserExecutable});
fs.mkdirSync(path.dirname(prefix), {recursive: true});
for (const frame of frames.split(',').map(Number)) {
  const output = `${prefix}${String(frame).padStart(5, '0')}.jpg`;
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 88, scale: Number(scale), browserExecutable});
  console.log(output);
}
