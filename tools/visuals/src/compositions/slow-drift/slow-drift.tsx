import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { FractalVisualizer } from "./FractalVisualizer";

type Props = {};

const FPS = 60; // matches this project's standing convention — see docs/sync-pipeline.md

// Duration comes from the real rendered audio.wav, not a hardcoded guess — if the piece or its
// tail length changes and gets re-rendered, this composition follows without editing anything here.
const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const durationInSeconds = await getAudioDurationInSeconds(staticFile("slow-drift-audio.wav"));
  return {
    durationInFrames: Math.ceil(durationInSeconds * FPS),
  };
};

export const SlowDriftCompositions = () => {
  return (
    <Composition
      id="slow-drift"
      component={FractalVisualizer}
      durationInFrames={21840} // placeholder; calculateMetadata overrides this from the real audio
      fps={FPS}
      width={3840}
      height={2160}
      calculateMetadata={calculateMetadata}
    />
  );
};
