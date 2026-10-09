import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { MorphoGenesisVisualizer } from "./MorphoGenesisVisualizer";

// 4K at 60 fps: the channel standard for every piece (see visuals-compose, "Naming").
const FPS = 60;
const WIDTH = 3840;
const HEIGHT = 2160;
// The piece is 1449 s (24:09). The render has a 3 s reverb tail after it, which the video does not show.
const PIECE_SECONDS = 1449;

export type MorphoGenesisProps = {
  playbackSrc: string; // what the viewer hears: the -14 LUFS YouTube master (public/)
  analysisSrc: string; // what the picture reacts to: the raw render, never the master (public/)
};

const calculateMetadata: CalculateMetadataFunction<MorphoGenesisProps> = async ({ props }) => {
  const seconds = await getAudioDurationInSeconds(staticFile(props.analysisSrc));
  return { durationInFrames: Math.ceil(Math.min(seconds, PIECE_SECONDS) * FPS) };
};

export const MorphoGenesisCompositions: React.FC = () => {
  return (
    <Composition
      id="morpho-genesis"
      component={MorphoGenesisVisualizer}
      durationInFrames={Math.ceil(PIECE_SECONDS * FPS)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{
        playbackSrc: "morpho-genesis-youtube.wav",
        analysisSrc: "morpho-genesis-audio.wav",
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
