import "./index.css";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { SlowDriftCompositions } from "./compositions/slow-drift/slow-drift";
import { SongcordCompositions } from "./compositions/songcord/songcord";
import { MusicaUniversalisCompositions, MusicaUniversalis } from "./compositions/musica-universalis/musica-universalis";
import { MorphoGenesisCompositions } from "./compositions/morpho-genesis/morpho-genesis";
import { TheField, TheFieldCompositions } from "./compositions/the-field/the-field";
import { FractalVisualizer } from "./compositions/slow-drift/FractalVisualizer";
import { ChannelBanner } from "./brand/ChannelBanner";
import { ChannelAvatar } from "./brand/ChannelAvatar";
import { makeThumbnail } from "./brand/VideoThumbnail";
import { makeShortPromo, calculateShortMetadata } from "./brand/ShortPromo";
import { makeEduBreakdown, calculateEduMetadata } from "./brand/EduBreakdown";

const SlowDriftThumbnail = makeThumbnail(FractalVisualizer);
const MusicaUniversalisThumbnail = makeThumbnail(MusicaUniversalis);
const TheFieldThumbnail = makeThumbnail(TheField);

const SlowDriftShort = makeShortPromo(FractalVisualizer);
const MusicaUniversalisShort = makeShortPromo(MusicaUniversalis);
const TheFieldShort = makeShortPromo(TheField);
const TheFieldEdu = makeEduBreakdown(TheField);

const TheFieldRawPlate: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050508", overflow: "hidden" }}>
    <Sequence from={-Math.round(236 * 60)}>
      <TheField audioVolume={0} />
    </Sequence>
  </AbsoluteFill>
);

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
      <Composition id="slow-drift-short" component={SlowDriftShort} durationInFrames={45 * 60} fps={60} width={1080} height={1920} calculateMetadata={calculateShortMetadata} defaultProps={{ title: "SLOW DRIFT", series: "01", facts: "432 Hz · BINAURAL", startSeconds: 225, durationSeconds: 45, hookText: "EACH BELL LIFTS THE FRACTAL SURFACE", subText: "Julia set in C major · Tuned to A = 432 Hz · Binaural" }} />
      <Composition id="musica-universalis-short" component={MusicaUniversalisShort} durationInFrames={45 * 60} fps={60} width={1080} height={1920} calculateMetadata={calculateShortMetadata} defaultProps={{ title: "MUSICA UNIVERSALIS", series: "02", facts: "432 Hz · BINAURAL", startSeconds: 140, durationSeconds: 45, hookText: "2:24 — THE SCALE THAT CLIMBS FOREVER", subText: "Shepard tone illusion · Pythagorean harmony in 432 Hz" }} />
      <Composition id="the-field-short" component={TheFieldShort} durationInFrames={45 * 60} fps={60} width={1080} height={1920} calculateMetadata={calculateShortMetadata} defaultProps={{ title: "THE FIELD", series: "03", facts: "432 Hz · BINAURAL", startSeconds: 236, durationSeconds: 45, hookText: "4:16 — THREE VOICES CONVERGE", subText: "500,000 quartz grains · Fibonacci canon 21 : 13 : 8" }} />
      <Composition id="the-field-plate-01" component={TheFieldRawPlate} durationInFrames={45 * 60} fps={60} width={1080} height={1920} />
      <Composition id="the-field-edu-short" component={TheFieldEdu} durationInFrames={48 * 60} fps={60} width={1080} height={1920} calculateMetadata={calculateEduMetadata} defaultProps={{ pieceTitle: "THE FIELD", series: "03", subtitle: "ACOUSTIC PHYSICS & GENERATIVE MATHEMATICS", steps: [] }} />
      <Composition id="the-field-edu-4k" component={TheFieldEdu} durationInFrames={48 * 60} fps={60} width={3840} height={2160} calculateMetadata={calculateEduMetadata} defaultProps={{ pieceTitle: "THE FIELD", series: "03", subtitle: "ACOUSTIC PHYSICS & GENERATIVE MATHEMATICS", steps: [] }} />
    </>
  );
};
