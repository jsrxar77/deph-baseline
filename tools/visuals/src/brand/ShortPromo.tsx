import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions, CaptionWord } from "./Captions";

// deph's YouTube Shorts template (1080x1920, 9:16 vertical, 60 fps).
// Wraps any piece's visual component (<Background />) at a chosen moment (`startSeconds`, `durationSeconds`),
// applying:
//   - "center-crop" framing by default (renders the piece in a 16:9 3413x1920 stage centered on the 1080x1920 frame
//     so 3D cameras and WebGL shaders keep the exact scale and proportions approved for the 4K master) or
//     "native-vertical" framing (1080x1920 directly).
//   - Soft 1.2 s fade-in and 1.8 s fade-out (visual + audio volume envelope via Sequence/master) so cuts are never abrupt.
//   - deph brand chip in the top safe zone (RingMark + "deph · <series>" + piece title).
//   - An opening hook caption (0.4 s -> 5.8 s, then fades out completely so the visual plays unobstructed).
//   - A closing cue in the last 5.5 s above YouTube Shorts' bottom UI zone: Headphones icon + facts + "Full 4K piece linked below".

const FPS = 60;
const CYAN = "#7fd4f5";
const WHITE = "#f2fbff";
const UI = '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';

export type ShortPromoProps = {
  title: string; // e.g. "THE FIELD"
  series: string; // e.g. "03"
  facts: string; // e.g. "432 Hz · BINAURAL"
  startSeconds: number; // start timestamp in the full piece (seconds)
  durationSeconds: number; // length of the Short (30-58 s recommended)
  hookText: string; // opening line (first ~5.5 s), e.g. "4:16 — THREE VOICES CONVERGE"
  subText?: string; // secondary opening line, e.g. "500,000 quartz grains · Fibonacci 21 : 13 : 8"
  ctaText?: string; // closing line in last 5 s, default "FULL 4K PIECE LINKED BELOW"
  bgShift?: number; // horizontal shift of the 16:9 stage (-0.35 .. 0.35), 0 = dead center
  framing?: "center-crop" | "native-vertical";
  script?: string; // narrative voiceover script
  voiceAudio?: string; // filename in public/ or file/url for Remotion Audio
  captions?: CaptionWord[]; // word-by-word synchronized captions
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

export const calculateShortMetadata: CalculateMetadataFunction<ShortPromoProps> = async ({ props }) => {
  const dur = Math.max(5, Math.min(60, props.durationSeconds || 45));
  return {
    durationInFrames: Math.round(dur * FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

export const makeShortPromo = (
  Background: React.ComponentType<{ audioVolume?: number | ((f: number) => number) }>
): React.FC<ShortPromoProps> =>
  ({
    title,
    series,
    facts,
    startSeconds,
    durationSeconds = 45,
    hookText,
    subText,
    ctaText = "FULL 4K PIECE LINKED BELOW",
    bgShift = 0,
    framing = "center-crop",
    voiceAudio,
    captions,
  }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const t = frame / FPS;
    const totalSec = durationInFrames / FPS || durationSeconds;
    const startFrame = Math.round(startSeconds * FPS);

    // Audio envelope for background music:
    // - 1.2s smooth fade-in
    // - ducking to 0.32 during voiceover so narration is crisp and warm
    // - swell to 0.85 when voice concludes (at 4:16 Flower of Life assembly!)
    // - 1.8s smooth fade-out at the end
    const lastCaptionEndSec =
      captions && captions.length > 0 ? captions[captions.length - 1].endSec : 19.3;
    const voiceEndSec = Math.max(6, lastCaptionEndSec + 0.3);

    const bgVolume = (childFrame: number): number => {
      const relFrame = childFrame - startFrame;
      const curT = relFrame / FPS;
      const inFade = interpolate(curT, [0, 1.2], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const outFade = interpolate(curT, [totalSec - 1.8, totalSec], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const baseFade = Math.min(inFade, outFade);

      if (voiceAudio) {
        const duck = interpolate(
          curT,
          [0.2, 0.7, voiceEndSec, voiceEndSec + 0.9],
          [0.85, 0.32, 0.32, 0.85],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return baseFade * duck;
      }
      return baseFade * 0.85;
    };

    // Smooth entry/exit fade so a meditative excerpt never starts or cuts abruptly
    const fadeIn = interpolate(t, [0, 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeOut = interpolate(t, [totalSec - 1.8, totalSec], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const masterOpacity = Math.min(fadeIn, fadeOut);

    // Header stays crisp during the hook, then settles into a subtle watermark
    const headerOpacity = interpolate(t, [0, 0.8, 5.5, 7.0], [0, 0.92, 0.92, 0.52], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * fadeOut;

    // Opening hook card (0.3s -> 5.8s)
    const hookOpacity = interpolate(t, [0.3, 1.1, 4.8, 6.0], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Closing headphone + full-piece cue (last 5.5s before fade-out)
    const ctaStart = Math.max(6.5, totalSec - 6.2);
    const ctaEnd = Math.max(ctaStart + 1.5, totalSec - 0.8);
    const ctaOpacity = interpolate(
      t,
      [ctaStart, ctaStart + 0.9, ctaEnd - 0.8, ctaEnd],
      [0, 0.95, 0.95, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const zoom = framing === "center-crop" ? 1 + 2 * Math.abs(bgShift) : 1;

    return (
      <AbsoluteFill style={{ backgroundColor: "#050508", overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            opacity: masterOpacity,
            transform: `translateX(${bgShift * 100}%) scale(${zoom})`,
          }}
        >
          <Sequence from={-startFrame}>
            <Background audioVolume={bgVolume} />
          </Sequence>
        </AbsoluteFill>

        {/* Subtle top & bottom vignette so typography is always legible without darkening the centre */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(5,5,8,0.78) 0%, rgba(5,5,8,0.22) 18%, rgba(5,5,8,0) 35%, rgba(5,5,8,0) 68%, rgba(5,5,8,0.72) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Top safe-area brand header */}
        <div
          style={{
            position: "absolute",
            top: 118,
            left: 68,
            right: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: headerOpacity,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <RingMark size={48} />
            <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 32, letterSpacing: "0.18em", color: WHITE }}>
              deph <span style={{ color: CYAN, marginLeft: 6 }}>· {series}</span>
            </div>
          </div>
          <div
            style={{
              fontFamily: UI,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: "0.16em",
              color: CYAN,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
        </div>

        {/* Opening Hook Overlay (fades out after ~5.8 s so the piece breathes alone) */}
        {hookOpacity > 0.005 ? (
          <div
            style={{
              position: "absolute",
              top: 215,
              left: 68,
              right: 68,
              opacity: hookOpacity,
            }}
          >
            <div style={{ width: 96, height: 3, backgroundColor: CYAN, marginBottom: 22, borderRadius: 2 }} />
            <div
              style={{
                fontFamily: UI,
                fontWeight: 700,
                fontSize: 52,
                lineHeight: 1.12,
                letterSpacing: "0.04em",
                color: WHITE,
                textTransform: "uppercase",
                textShadow: "0 4px 28px rgba(5,5,8,0.85)",
              }}
            >
              {hookText}
            </div>
            {subText ? (
              <div
                style={{
                  marginTop: 18,
                  fontFamily: UI,
                  fontWeight: 500,
                  fontSize: 32,
                  lineHeight: 1.35,
                  letterSpacing: "0.06em",
                  color: CYAN,
                  textShadow: "0 2px 18px rgba(5,5,8,0.9)",
                }}
              >
                {subText}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Closing CTA above YouTube Shorts bottom chrome */}
        {ctaOpacity > 0.005 ? (
          <div
            style={{
              position: "absolute",
              left: 68,
              right: 120,
              bottom: 430,
              opacity: ctaOpacity,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: UI,
                fontWeight: 600,
                fontSize: 30,
                letterSpacing: "0.14em",
                color: CYAN,
                textTransform: "uppercase",
                textShadow: "0 2px 18px rgba(5,5,8,0.9)",
              }}
            >
              <Headphones size={38} />
              {facts}
            </div>
            <div
              style={{
                fontFamily: UI,
                fontWeight: 500,
                fontSize: 26,
                letterSpacing: "0.18em",
                color: WHITE,
                opacity: 0.92,
                textTransform: "uppercase",
                textShadow: "0 2px 18px rgba(5,5,8,0.9)",
              }}
            >
              {ctaText}
            </div>
          </div>
        ) : null}

        {/* Synchronized animated word-by-word captions */}
        {captions && captions.length > 0 ? (
          <Captions words={captions} bottomPx={440} />
        ) : null}

        {/* Narrator Voiceover audio */}
        {voiceAudio ? (
          <Audio
            src={voiceAudio.startsWith("http") ? voiceAudio : staticFile(voiceAudio)}
            volume={1.0}
          />
        ) : null}
      </AbsoluteFill>
    );
  };
