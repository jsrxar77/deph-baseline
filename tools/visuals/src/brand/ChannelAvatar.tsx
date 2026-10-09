import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { FractalVisualizer } from "../compositions/slow-drift/FractalVisualizer";

// deph's YouTube profile picture (800x800; YouTube shows it inside a circle). The user's illustrated portrait is
// kept as it is (the face gets only a soft focus, the expression is untouched) and its background is replaced
// by the Slow Drift fractal in deph's Deep Decay palette, so the channel image speaks the same visual language
// as the videos. The portrait is cut out with public/deph-avatar-mask.png, generated from the portrait itself by
// scripts/make-avatar-mask.mjs (colour-based cutout of the head, hair, ears, neck and collar).
// Rendered with:  npx remotion still deph-avatar --output=../../docs/youtube-channel/avatar.jpg
const FPS = 60;
const FRACTAL_MOMENT_SECONDS = 300; // same moment as the banner: no bell pulse active
const DEFAULT_SRC = "deph-avatar-source.jpg";
const DEFAULT_MASK = "deph-avatar-mask.png";

// Props (all optional; defaults reproduce the original avatar): another portrait and its cutout mask from
// public/, and whether to apply the face soft focus (off for crisp comic-style portraits).
//   npx remotion still deph-avatar --props='{"src":"x.jpg","mask":"x-mask.png","softFocus":false}' --output=...
export type ChannelAvatarProps = { src?: string; mask?: string; softFocus?: boolean };

const FACE_MASK = "radial-gradient(ellipse 30% 42% at 50% 53%, #000 45%, transparent 100%)"; // soft-focus zone

const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

export const ChannelAvatar: React.FC<ChannelAvatarProps> = ({
  src: SRC = DEFAULT_SRC,
  mask = DEFAULT_MASK,
  softFocus = true,
}) => {
  const PORTRAIT_CUTOUT = `url(${staticFile(mask)})`;
  const cutout: React.CSSProperties = {
    WebkitMaskImage: PORTRAIT_CUTOUT,
    maskImage: PORTRAIT_CUTOUT,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };
  return (
  <AbsoluteFill style={{ backgroundColor: "#050508" }}>
    {/* 1. background: the fractal, slightly defocused and darkened so the figure stays the subject */}
    <AbsoluteFill style={{ filter: "blur(2.5px) brightness(0.8) saturate(1.05)" }}>
      <Sequence from={-FRACTAL_MOMENT_SECONDS * FPS}>
        <FractalVisualizer />
      </Sequence>
    </AbsoluteFill>
    {/* a soft dark halo behind the head, to separate it from the fractal */}
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse 38% 50% at 50% 48%, rgba(5,5,8,0.55) 40%, rgba(5,5,8,0) 100%)" }}
    />

    {/* 2. the portrait, cut out with the mask */}
    <AbsoluteFill style={cutout}>
      <Img src={staticFile(SRC)} style={fill} />
    </AbsoluteFill>

    {/* 3. face: soft focus (a blurred copy over the sharp one), slightly warmer and lifted */}
    {softFocus && <AbsoluteFill style={cutout}>
      <AbsoluteFill style={{ WebkitMaskImage: FACE_MASK, maskImage: FACE_MASK, opacity: 0.55 }}>
        <Img src={staticFile(SRC)} style={{ ...fill, filter: "blur(3px) contrast(0.9) brightness(1.06) saturate(0.92)" }} />
      </AbsoluteFill>
    </AbsoluteFill>}

    {/* 4. gentle vignette toward the circle's edge */}
    <AbsoluteFill
      style={{ background: "radial-gradient(circle at 50% 50%, rgba(5,5,8,0) 62%, rgba(5,5,8,0.5) 100%)" }}
    />
  </AbsoluteFill>
);
};
