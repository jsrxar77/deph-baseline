import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";
import { staticFile, useVideoConfig } from "remotion";

export type AudioBands = {
  bass: number; // 0-1, < ~120Hz
  mid: number;  // 0-1, 120Hz - 2000Hz (pad/drone body)
  high: number; // 0-1, > 2000Hz (bells/transients)
  rms: number;  // 0-1, overall level
};

const NUMBER_OF_SAMPLES = 256;

export function useAudioBands(frame: number, audioSrc: string = "morpho-genesis-audio.wav"): AudioBands {
  const { fps } = useVideoConfig();
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: staticFile(audioSrc),
    frame,
    fps,
    windowInSeconds: 20,
  });

  if (!audioData) {
    return { bass: 0, mid: 0, high: 0, rms: 0 };
  }

  const SAMPLE_COUNT = 10;
  const SPAN_SECONDS = 1.2;
  const stepFrames = Math.max(1, Math.round((SPAN_SECONDS * fps) / (SAMPLE_COUNT - 1)));

  let bassSum = 0;
  let midSum = 0;
  let highSum = 0;
  let rmsSum = 0;
  let weightSum = 0;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const sampleFrame = Math.max(0, frame - i * stepFrames);
    const weight = SAMPLE_COUNT - i;

    const frequencies = visualizeAudio({
      fps,
      frame: sampleFrame,
      audioData,
      numberOfSamples: NUMBER_OF_SAMPLES,
      optimizeFor: "speed",
      dataOffsetInSeconds,
    });

    const hzPerBin = 24000 / (NUMBER_OF_SAMPLES / 2);
    const bassBins = Math.max(1, Math.round(140 / hzPerBin));
    const midBins = Math.max(bassBins + 1, Math.round(2400 / hzPerBin));

    bassSum += average(frequencies.slice(0, bassBins)) * weight;
    midSum += average(frequencies.slice(bassBins, midBins)) * weight;
    highSum += average(frequencies.slice(midBins, frequencies.length)) * weight;
    rmsSum += average(frequencies) * weight;
    weightSum += weight;
  }

  return {
    bass: bassSum / weightSum,
    mid: midSum / weightSum,
    high: highSum / weightSum,
    rms: rmsSum / weightSum,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
