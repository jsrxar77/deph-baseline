import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

// deph's YouTube thumbnail template (1280x720) — every deph video's cover uses this layout so the series is
// recognizable at a glance:
//   top-left     brand chip: the creation-torus mark (four concentric rings) + "deph" + the series number
//   left, middle piece title in large letters, a thin cyan rule, then one line of facts
//   bottom-left  a small headphones cue + "generative ambient"
//   bottom-right left EMPTY on purpose: YouTube draws the video-length badge there
// Background: a frame of the piece's own fractal, with a dark gradient on the left so text reads at small sizes
// (thumbnails are often shown ~170 px wide). Render one with:
//   npx remotion still slow-drift-thumbnail --output=../../media/<name>/renders/thumbnails/<name>-thumbnail.jpg
const FPS = 60;
const CYAN = "#7fd4f5";
const WHITE = "#f2fbff";

export type ThumbnailProps = {
  lines: string[]; // the piece title, one word per line
  facts: string; // one line of verifiable facts, e.g. "432 Hz · BINAURAL"
  series: string; // series number, e.g. "01"
  momentSeconds: number; // which frame of the piece's fractal to use
  font: string; // CSS font-family for the title
  weight: number;
  tracking: string; // letter-spacing of the title
  titleSize: number;
};

const RingMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {[6, 12, 18, 23].map((r, i) => (
      <circle key={r} cx="24" cy="24" r={r} stroke={CYAN} strokeOpacity={1 - i * 0.18} strokeWidth="1.6" />
    ))}
  </svg>
);

const Headphones: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.7" strokeLinecap="round">
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4.2" height="7" rx="1.6" fill={CYAN} fillOpacity="0.25" />
    <rect x="16.8" y="14" width="4.2" height="7" rx="1.6" fill={CYAN} fillOpacity="0.25" />
  </svg>
);

const UI = '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';

// One template, every piece's own visual as the background: each piece registers its own thumbnail composition
// via makeThumbnail(<its visual component>) rather than this file importing any one piece directly — the layout
// changes once, for all; only the background differs.
export const makeThumbnail = (Background: React.ComponentType): React.FC<ThumbnailProps> =>
  ({ lines, facts, series, momentSeconds, font, weight, tracking, titleSize }) => (
  <AbsoluteFill style={{ backgroundColor: "#050508" }}>
    <Sequence from={-momentSeconds * FPS}>
      <Background />
    </Sequence>
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(90deg, rgba(5,5,8,0.88) 0%, rgba(5,5,8,0.72) 40%, rgba(5,5,8,0.15) 72%, rgba(5,5,8,0) 100%)",
      }}
    />

    {/* brand chip */}
    <div style={{ position: "absolute", left: 66, top: 52, display: "flex", alignItems: "center", gap: 16 }}>
      <RingMark size={54} />
      <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 38, letterSpacing: "0.18em", color: WHITE }}>
        deph <span style={{ color: CYAN, marginLeft: 8 }}>· {series}</span>
      </div>
    </div>

    {/* title, rule, facts */}
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 72, paddingTop: 20 }}>
      <div
        style={{
          fontFamily: `"${font}", ${UI}`,
          fontWeight: weight,
          fontSize: titleSize,
          lineHeight: 0.94,
          letterSpacing: tracking,
          color: WHITE,
          textTransform: "uppercase",
          textShadow: "0 4px 30px rgba(5,5,8,0.7)",
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div style={{ width: 150, height: 4, backgroundColor: CYAN, marginTop: 30, borderRadius: 2 }} />
      <div style={{ marginTop: 26, fontFamily: UI, fontWeight: 600, fontSize: 48, letterSpacing: "0.12em", color: CYAN, textShadow: "0 2px 18px rgba(5,5,8,0.8)" }}>
        {facts}
      </div>
    </AbsoluteFill>

    {/* bottom-left cue */}
    <div style={{ position: "absolute", left: 70, bottom: 46, display: "flex", alignItems: "center", gap: 14, fontFamily: UI, fontWeight: 500, fontSize: 30, letterSpacing: "0.2em", color: WHITE, opacity: 0.9, textTransform: "uppercase" }}>
      <Headphones size={40} />
      Headphones · Generative ambient
    </div>
  </AbsoluteFill>
);
