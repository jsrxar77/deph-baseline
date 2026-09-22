import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { FractalVisualizer } from "./compositions/slow-drift/FractalVisualizer";

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

export const SlowDriftFractal = () => {
  return (
    <Composition
      id="SlowDriftFractal"
      component={FractalVisualizer}
      durationInFrames={21840} // placeholder; calculateMetadata overrides this from the real audio
      fps={FPS}
      width={1920}
      height={1080}
      calculateMetadata={calculateMetadata}
    />
  );
};
