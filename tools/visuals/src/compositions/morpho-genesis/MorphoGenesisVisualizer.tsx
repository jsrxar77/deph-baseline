import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { HdrCanvas, type HdrParams } from "../../shared/HdrCanvas";
import { SCENE_FRAGMENT } from "./shader";
import { useAudioBands } from "./useAudioBands";

// Cinematic HDR Color Grade:
// Rich optical bloom, deep true blacks, ACES filmic tonemapping, subtle edge dispersion
const GRADE: HdrParams = {
  bloom: 0.65,      // Generous ethereal glow for incandescent nodal filaments
  exposure: 1.12,   // High dynamic range punch
  saturation: 1.34, // Rich saturated jewel tones (obsidian, alchemical gold, electric turquoise)
  threshold: 1.10,  // Only nodes and sparks hotter than 1.1 bleed into the bloom pyramid
  ca: 0.0016,       // Subtle optical chromatic aberration at lens periphery
  gamma: 2.22,      // Deep inky contrast without milky grey lifting
};

export const MorphoGenesisVisualizer: React.FC<{ playbackSrc: string; analysisSrc: string }> = ({
  playbackSrc,
  analysisSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const bands = useAudioBands(frame, analysisSrc);

  const timeInSeconds = frame / fps;
  const progress = durationInFrames > 0 ? frame / durationInFrames : 0;

  const uniforms = {
    uRes: [width / height, 1.0] as [number, number],
    uTime: timeInSeconds,
    uProgress: progress,
    uBass: bands.bass,
    uMid: bands.mid,
    uHigh: bands.high,
    uRms: bands.rms,
  };

  return (
    <HdrCanvas
      sceneFragment={SCENE_FRAGMENT}
      uniforms={uniforms}
      width={width}
      height={height}
      params={GRADE}
      audioSrc={playbackSrc}
    />
  );
};
