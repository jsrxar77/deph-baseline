import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FractalVisualizer } from "../compositions/slow-drift/FractalVisualizer";

// deph's YouTube channel banner (2560x1440, YouTube's recommended size). A single still: a frame of the
// Slow Drift fractal as full-bleed background, softly darkened in the middle so the text reads, with the
// channel name and tagline inside YouTube's safe area (about 1544x423 at this size, centered — the part
// visible on every device). Rendered with:
//   npx remotion still DephBanner --output=../../docs/youtube-channel/banner.jpg
// Pick a moment with no bell pulse active (see bellPulses.ts): 300 s is 12.5 s after the last bell.
const FPS = 60;
const MOMENT_SECONDS = 300;

export const ChannelBanner: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050508" }}>
    <Sequence from={-MOMENT_SECONDS * FPS}>
      <FractalVisualizer />
    </Sequence>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 46% 30% at 50% 50%, rgba(5,5,8,0.78) 0%, rgba(5,5,8,0.55) 60%, rgba(5,5,8,0) 100%)",
      }}
    />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div
        style={{
          fontFamily: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: 300,
          fontSize: 230,
          letterSpacing: "0.14em",
          paddingLeft: "0.14em",
          color: "#eaf8ff",
          lineHeight: 1,
          textShadow: "0 0 40px rgba(5,5,8,0.6)",
        }}
      >
        deph
      </div>
      <div
        style={{
          marginTop: 34,
          fontFamily: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: 400,
          fontSize: 58,
          letterSpacing: "0.42em",
          paddingLeft: "0.42em",
          textTransform: "uppercase",
          color: "#7fd4f5",
          lineHeight: 1,
          textShadow: "0 0 30px rgba(5,5,8,0.7)",
        }}
      >
        generative ambient
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
