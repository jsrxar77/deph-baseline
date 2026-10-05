import "./index.css";
import { Composition } from "remotion";
import { SlowDriftCompositions } from "./compositions/slow-drift/slow-drift";
import { SongcordCompositions } from "./compositions/songcord/songcord";
import { MusicaUniversalisCompositions, MusicaUniversalis } from "./compositions/musica-universalis/musica-universalis";
import { MorphoGenesisCompositions } from "./compositions/morpho-genesis/morpho-genesis";
import { TheField, TheFieldCompositions } from "./compositions/the-field/the-field";
import { FractalVisualizer } from "./compositions/slow-drift/FractalVisualizer";
import { ChannelBanner } from "./brand/ChannelBanner";
import { ChannelAvatar } from "./brand/ChannelAvatar";
import { makeThumbnail } from "./brand/VideoThumbnail";

const SlowDriftThumbnail = makeThumbnail(FractalVisualizer);
const MusicaUniversalisThumbnail = makeThumbnail(MusicaUniversalis);
const TheFieldThumbnail = makeThumbnail(TheField);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <SlowDriftCompositions />
      <SongcordCompositions />
      <MusicaUniversalisCompositions />
      <MorphoGenesisCompositions />
      <TheFieldCompositions />
      <Composition id="deph-banner" component={ChannelBanner} durationInFrames={1} fps={60} width={2560} height={1440} />
      <Composition id="deph-avatar" component={ChannelAvatar} durationInFrames={1} fps={60} width={800} height={800} />
      <Composition id="slow-drift-thumbnail" component={SlowDriftThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["Slow", "Drift"], facts: "432 Hz · BINAURAL", series: "01", momentSeconds: 250, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 170 }} />
      <Composition id="musica-universalis-thumbnail" component={MusicaUniversalisThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["Musica", "Universalis"], facts: "432 Hz · BINAURAL", series: "02", momentSeconds: 260, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 130 }} />
      <Composition id="the-field-thumbnail" component={TheFieldThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["The", "Field"], facts: "432 Hz · BINAURAL", series: "03", momentSeconds: 262, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 170 }} />
    </>
  );
};
