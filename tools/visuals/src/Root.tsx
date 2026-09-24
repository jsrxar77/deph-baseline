import "./index.css";
import { Composition } from "remotion";
import { SlowDriftFractal } from "./Composition";
import { ChannelBanner } from "./brand/ChannelBanner";
import { ChannelAvatar } from "./brand/ChannelAvatar";
import { VideoThumbnail } from "./brand/VideoThumbnail";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <SlowDriftFractal />
      <Composition id="DephBanner" component={ChannelBanner} durationInFrames={1} fps={60} width={2560} height={1440} />
      <Composition id="DephAvatar" component={ChannelAvatar} durationInFrames={1} fps={60} width={800} height={800} defaultProps={{ background: "fractal" as const }} />
      <Composition id="DephThumbnailSlowDrift" component={VideoThumbnail} durationInFrames={1} fps={60} width={1280} height={720} defaultProps={{ lines: ["Slow", "Drift"], facts: "432 Hz · BINAURAL", series: "01", momentSeconds: 250, font: "Avenir Next", weight: 700, tracking: "0.02em", titleSize: 170 }} />
      <Composition id="DephAvatarBlack" component={ChannelAvatar} durationInFrames={1} fps={60} width={800} height={800} defaultProps={{ background: "black" as const }} />
    </>
  );
};
