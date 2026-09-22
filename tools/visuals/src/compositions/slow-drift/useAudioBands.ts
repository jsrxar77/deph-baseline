import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";
import { staticFile, useVideoConfig } from "remotion";

export type AudioBands = {
  bass: number; // 0-1, < ~120Hz
  mid: number; // 0-1, drone/pad body
  high: number; // 0-1, bells/transients
  rms: number; // 0-1, overall level
};

const NUMBER_OF_SAMPLES = 256;

// Frames are rendered independently (Remotion may render them out of order, across worker
// threads), so any smoothing has to be a pure function of `frame` — no refs/mutable state
// carried between frames. This averages several frame-samples spread across a multi-second
// window, weighted toward the present, instead of a single FFT read — the original version only
// spanned 0.1s (4 samples, 2 frames apart), which is far shorter than this piece's sub-bass/drone
// envelopes move on, and read as visible frame-to-frame jitter ("vibrating") rather than the slow,
// organic swell an ambient piece like this calls for.
export function useAudioBands(frame: number): AudioBands {
  const { fps } = useVideoConfig();
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: staticFile("slow-drift-audio.wav"),
    frame,
    fps,
    windowInSeconds: 20,
  });

  if (!audioData) {
    return { bass: 0, mid: 0, high: 0, rms: 0 };
  }

  const SAMPLE_COUNT = 10;
  const SPAN_SECONDS = 1.5; // total look-back window this average covers
  const stepFrames = Math.max(1, Math.round((SPAN_SECONDS * fps) / (SAMPLE_COUNT - 1)));

  let bassSum = 0;
  let midSum = 0;
  let highSum = 0;
  let rmsSum = 0;
  let weightSum = 0;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const sampleFrame = Math.max(0, frame - i * stepFrames);
    // Linear taper: the current frame counts most, the oldest sample in the window counts least.
    const weight = SAMPLE_COUNT - i;

    const frequencies = visualizeAudio({
      fps,
      frame: sampleFrame,
      audioData,
      numberOfSamples: NUMBER_OF_SAMPLES,
      optimizeFor: "speed",
      dataOffsetInSeconds,
    });

    // Bin ranges are approximate for a 48kHz source: numberOfSamples/2 usable bins span 0-24kHz,
    // so each bin is roughly 24000 / (NUMBER_OF_SAMPLES/2) Hz wide.
    const hzPerBin = 24000 / (NUMBER_OF_SAMPLES / 2);
    const bassBins = Math.max(1, Math.round(120 / hzPerBin));
    const midBins = Math.max(bassBins + 1, Math.round(2000 / hzPerBin));

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
