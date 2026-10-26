import "./index.css";
import { Composition } from "remotion";
import { SlowDriftCompositions } from "../../../media/slow-drift/visuals/slow-drift";
import { SongcordCompositions } from "../../../media/songcord/visuals/songcord";
import { MusicaUniversalisCompositions, MusicaUniversalis } from "../../../media/musica-universalis/visuals/musica-universalis";
import { TheField, TheFieldCompositions } from "../../../media/the-field/visuals/the-field";
import { Gnosis, GnosisCompositions } from "../../../media/gnosis/visuals/gnosis";
import { FractalVisualizer } from "../../../media/slow-drift/visuals/FractalVisualizer";
import { ChannelBanner } from "./brand/ChannelBanner";
import { ChannelAvatar } from "./brand/ChannelAvatar";
import { makeThumbnail } from "./brand/VideoThumbnail";
import { makeBanner } from "./brand/PieceBanner";

const SlowDriftThumbnail = makeThumbnail(FractalVisualizer);
const MusicaUniversalisThumbnail = makeThumbnail(MusicaUniversalis);
const TheFieldThumbnail = makeThumbnail(TheField);
const GnosisThumbnail = makeThumbnail(Gnosis);
const SlowDriftBanner = makeBanner(FractalVisualizer);
const MusicaUniversalisBanner = makeBanner(MusicaUniversalis);
const TheFieldBanner = makeBanner(TheField);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <SlowDriftCompositions />
      <SongcordCompositions />
      <MusicaUniversalisCompositions />
      <TheFieldCompositions />
      <GnosisCompositions />
      <Composition id="deph-banner" component={ChannelBanner} durationInFrames={1} fps={60} width={2560} height={1440} />
      <Composition id="deph-avatar" component={ChannelAvatar} durationInFrames={1} fps={60} width={800} height={800} />
      <Composition id="slow-drift-thumbnail" component={SlowDriftThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["Slow", "Drift"], facts: "432 Hz · BINAURAL", series: "01", momentSeconds: 250, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 170 }} />
      <Composition id="musica-universalis-thumbnail" component={MusicaUniversalisThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["Musica", "Universalis"], facts: "432 Hz · BINAURAL", series: "02", momentSeconds: 260, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 130 }} />
      <Composition id="the-field-thumbnail" component={TheFieldThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["The", "Field"], facts: "432 Hz · BINAURAL", series: "03", momentSeconds: 262, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 170 }} />
      <Composition id="gnosis-thumbnail" component={GnosisThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["Gnosis"], facts: "432 Hz · BINAURAL", series: "04", momentSeconds: 300, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 200, bgShift: 0.15 }} />
      <Composition id="slow-drift-banner" component={SlowDriftBanner} durationInFrames={1} fps={60} width={2560} height={1440} defaultProps={{ momentSeconds: 250 }} />
      <Composition id="musica-universalis-banner" component={MusicaUniversalisBanner} durationInFrames={1} fps={60} width={2560} height={1440} defaultProps={{ momentSeconds: 260 }} />
      <Composition id="the-field-banner" component={TheFieldBanner} durationInFrames={1} fps={60} width={2560} height={1440} defaultProps={{ momentSeconds: 262 }} />
    </>
  );
};
