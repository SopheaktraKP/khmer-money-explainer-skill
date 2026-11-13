import {Composition, Still} from 'remotion';
import {Video} from './engine/Video';
import {Thumbnail} from './story/story';
import timeline from './story/timeline.json';

export const Root = () => (
  <>
    <Composition id="Main" component={Video} width={1920} height={1080} fps={timeline.fps} durationInFrames={timeline.total} />
    <Still id="Thumbnail" component={Thumbnail} width={1920} height={1080} />
  </>
);
