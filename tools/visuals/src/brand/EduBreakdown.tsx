import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

// deph's Educational Breakdown template ("Visual Essay" — works in both 9:16 vertical 1080x1920 and 16:9 4K 3840x2160).
// Turns any deph composition into an educational walkthrough of the acoustic physics, mathematics, and generative code
// behind the piece — with multi-segment timeline jumps, smooth audio/visual crossfades, animated procedural SVG diagrams
// (binaural phase interference, Fibonacci 21:13:8 canon rings, Chladni nodal modes, Pythagorean ratios), and bilingual support.

const FPS = 60;
const CYAN = "#7fd4f5";
const WHITE = "#f2fbff";
const UI = '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"Menlo", "SF Mono", monospace';

export type EduDiagramKind = "none" | "binaural" | "fibonacci" | "chladni" | "pythagorean";

export type EduStep = {
  tag: string; // e.g. "01 · CYMATICS"
  heading: string; // e.g. "HOW SOUND SHAPES MATTER"
  body: string; // 1-3 concise sentences
  formula?: string; // e.g. "f ∝ n² + m²  ·  524,176 quartz grains"
  pieceStartSeconds: number; // which moment of the piece to play during this step
  durationSeconds: number; // how long this step plays
  diagram?: EduDiagramKind;
};

export type EduBreakdownProps = {
  pieceTitle: string; // e.g. "THE FIELD"
  series: string; // e.g. "03"
  subtitle: string; // e.g. "INSIDE THE CODE & ACOUSTICS"
  steps: EduStep[];
  ctaText?: string; // e.g. "LISTEN TO THE FULL 4K PIECE · LINK BELOW"
  bgShift?: number;
};

const RingMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {[6, 12, 18, 23].map((r, i) => (
      <circle key={r} cx="24" cy="24" r={r} stroke={CYAN} strokeOpacity={1 - i * 0.18} strokeWidth="1.6" />
    ))}
  </svg>
);

const AnimatedDiagram: React.FC<{ kind: EduDiagramKind; t: number; scale: number }> = ({ kind, t, scale }) => {
  if (kind === "none") return null;
  const w = Math.round(360 * scale);
  const h = Math.round(96 * scale);

  if (kind === "binaural") {
    // Visualizes L (216 Hz), R (223 Hz) and the slow beat envelope (7 Hz)
    const ptsBeat: string[] = [];
    const ptsCarrier: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const x = u * w;
      const env = Math.cos((u * 2.5 - t * 0.8) * Math.PI * 2);
      const carrier = Math.sin((u * 18 - t * 4.0) * Math.PI * 2) * env;
      const yCarrier = h * 0.5 + carrier * (h * 0.36);
      const yEnv = h * 0.5 - Math.abs(env) * (h * 0.38);
      ptsCarrier.push(`${x.toFixed(1)},${yCarrier.toFixed(1)}`);
      ptsBeat.push(`${x.toFixed(1)},${yEnv.toFixed(1)}`);
    }
    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <polyline fill="none" stroke={WHITE} strokeOpacity={0.35} strokeWidth={1.5 * scale} points={ptsCarrier.join(" ")} />
        <polyline fill="none" stroke={CYAN} strokeOpacity={0.95} strokeWidth={2.2 * scale} points={ptsBeat.join(" ")} />
      </svg>
    );
  }

  if (kind === "fibonacci") {
    // Three canon rings rotating at 1/21, 1/13, 1/8 speeds toward alignment
    const cx = h * 0.55;
    const cy = h * 0.5;
    const radii = [h * 0.42, h * 0.3, h * 0.18];
    const speeds = [8 / 21, 8 / 13, 1];
    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        {radii.map((r, idx) => {
          const ang = (t * speeds[idx] * 0.9) % (Math.PI * 2);
          const dx = cx + Math.cos(ang) * r;
          const dy = cy + Math.sin(ang) * r;
          return (
            <g key={idx}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={CYAN} strokeOpacity={0.35 + idx * 0.2} strokeWidth={1.5 * scale} />
              <circle cx={dx} cy={dy} r={3.5 * scale} fill={WHITE} />
            </g>
          );
        })}
        <line x1={cx} y1={cy - h * 0.46} x2={cx} y2={cy + h * 0.46} stroke={CYAN} strokeOpacity={0.3} strokeDasharray="3 3" />
      </svg>
    );
  }

  if (kind === "chladni") {
    // Chladni nodal curves cos(n*pi*x)*cos(m*pi*y) - cos(m*pi*x)*cos(n*pi*y) = 0 preview
    const s = h * 0.88;
    return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke={CYAN} strokeOpacity={0.4} strokeWidth="2" />
        <path
          d="M 20 20 Q 50 80 80 20 M 20 80 Q 50 20 80 80 M 20 20 Q 80 50 20 80 M 80 20 Q 20 50 80 80"
          fill="none"
          stroke={CYAN}
          strokeWidth="2.2"
          strokeOpacity={0.9}
        />
      </svg>
    );
  }

  if (kind === "pythagorean") {
    // 2:1, 3:2, 4:3 harmonic bars
    const ratios = [
      { label: "1:1", w: 1.0 },
      { label: "4:3", w: 0.75 },
      { label: "3:2", w: 0.666 },
      { label: "2:1", w: 0.5 },
    ];
    return (
      <svg width={w} height={h}>
        {ratios.map((r, i) => {
          const y = 12 * scale + i * 20 * scale;
          const bw = w * 0.75 * r.w;
          return (
            <g key={r.label}>
              <line x1={0} y1={y} x2={bw} y2={y} stroke={CYAN} strokeWidth={3 * scale} strokeOpacity={0.85} />
              <text x={bw + 10 * scale} y={y + 4 * scale} fill={WHITE} fontSize={13 * scale} fontFamily={MONO}>
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return null;
};

export const calculateEduMetadata: CalculateMetadataFunction<EduBreakdownProps> = async ({ props }) => {
  const totalSec = (props.steps || []).reduce((acc, s) => acc + (s.durationSeconds || 10), 0) || 48;
  return {
    durationInFrames: Math.round(totalSec * FPS),
    fps: FPS,
  };
};

export const makeEduBreakdown = (Background: React.ComponentType): React.FC<EduBreakdownProps> =>
  ({
    pieceTitle,
    series,
    subtitle,
    steps,
    ctaText = "FULL 4K PIECE ON THE CHANNEL · USE HEADPHONES",
    bgShift = 0,
  }) => {
    const frame = useCurrentFrame();
    const { width, height, durationInFrames } = useVideoConfig();
    const isVertical = height > width;
    const scale = isVertical ? width / 1080 : height / 1080;

    // Build cumulative timeline of steps
    let cursorFrames = 0;
    const timeline = steps.map((step) => {
      const startFrame = cursorFrames;
      const durFrames = Math.round(step.durationSeconds * FPS);
      cursorFrames += durFrames;
      return { ...step, startFrame, durFrames, endFrame: cursorFrames };
    });

    const activeIdx = Math.min(
      timeline.length - 1,
      Math.max(0, timeline.findIndex((s) => frame >= s.startFrame && frame < s.endFrame))
    );
    const active = timeline[activeIdx] || timeline[0];
    const localFrame = frame - (active?.startFrame || 0);
    const localSec = localFrame / FPS;
    const stepDurSec = (active?.durFrames || FPS * 10) / FPS;

    // Crossfade at step boundaries so switching moments in the piece feels smooth
    const stepFadeIn = interpolate(localSec, [0, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const stepFadeOut = interpolate(localSec, [stepDurSec - 0.9, stepDurSec], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const cardOpacity = Math.min(stepFadeIn, stepFadeOut);

    // Master video fade at start and end
    const totalSec = durationInFrames / FPS;
    const globalSec = frame / FPS;
    const masterFade = Math.min(
      interpolate(globalSec, [0, 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      interpolate(globalSec, [totalSec - 1.5, totalSec], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    );

    const zoom = 1 + 2 * Math.abs(bgShift);

    return (
      <AbsoluteFill style={{ backgroundColor: "#050508", overflow: "hidden" }}>
        {/* Each step mounts its own slice of the piece so audio & visuals match the exact concept explained */}
        <AbsoluteFill
          style={{
            opacity: masterFade * (0.25 + 0.75 * cardOpacity),
            transform: `translateX(${bgShift * 100}%) scale(${zoom})`,
          }}
        >
          {timeline.map((step, i) => (
            <Sequence key={i} from={step.startFrame} durationInFrames={step.durFrames}>
              <Sequence from={-Math.round(step.pieceStartSeconds * FPS)}>
                <Background />
              </Sequence>
            </Sequence>
          ))}
        </AbsoluteFill>

        {/* Soft gradient framing for legibility */}
        <AbsoluteFill
          style={{
            background: isVertical
              ? "linear-gradient(180deg, rgba(5,5,8,0.82) 0%, rgba(5,5,8,0.18) 26%, rgba(5,5,8,0.12) 62%, rgba(5,5,8,0.88) 100%)"
              : "linear-gradient(90deg, rgba(5,5,8,0.86) 0%, rgba(5,5,8,0.58) 38%, rgba(5,5,8,0.05) 68%, rgba(5,5,8,0) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Top Brand Bar */}
        <div
          style={{
            position: "absolute",
            top: Math.round((isVertical ? 112 : 64) * scale),
            left: Math.round(68 * scale),
            right: Math.round(68 * scale),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: masterFade * 0.92,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: Math.round(16 * scale) }}>
            <RingMark size={Math.round(46 * scale)} />
            <div>
              <div
                style={{
                  fontFamily: UI,
                  fontWeight: 600,
                  fontSize: Math.round(28 * scale),
                  letterSpacing: "0.18em",
                  color: WHITE,
                }}
              >
                deph <span style={{ color: CYAN }}>· {series}</span> — {pieceTitle}
              </div>
              <div
                style={{
                  fontFamily: UI,
                  fontWeight: 500,
                  fontSize: Math.round(18 * scale),
                  letterSpacing: "0.22em",
                  color: CYAN,
                  opacity: 0.85,
                  marginTop: Math.round(4 * scale),
                }}
              >
                {subtitle}
              </div>
            </div>
          </div>

          {/* Step progress pills */}
          <div style={{ display: "flex", gap: Math.round(8 * scale) }}>
            {timeline.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: Math.round((idx === activeIdx ? 36 : 12) * scale),
                  height: Math.round(5 * scale),
                  borderRadius: Math.round(3 * scale),
                  backgroundColor: idx === activeIdx ? CYAN : WHITE,
                  opacity: idx === activeIdx ? 0.95 : 0.28,
                }}
              />
            ))}
          </div>
        </div>

        {/* Educational Explanation Card */}
        {active ? (
          <div
            style={{
              position: "absolute",
              left: Math.round(68 * scale),
              right: isVertical ? Math.round(84 * scale) : undefined,
              width: isVertical ? undefined : Math.round(760 * scale),
              bottom: Math.round((isVertical ? 420 : 110) * scale),
              opacity: cardOpacity * masterFade,
              backgroundColor: "rgba(5, 8, 16, 0.72)",
              borderLeft: `${Math.round(4 * scale)}px solid ${CYAN}`,
              padding: `${Math.round(28 * scale)}px ${Math.round(34 * scale)}px`,
              borderRadius: `0 ${Math.round(12 * scale)}px ${Math.round(12 * scale)}px 0`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: MONO,
                fontSize: Math.round(20 * scale),
                letterSpacing: "0.14em",
                color: CYAN,
                textTransform: "uppercase",
              }}
            >
              <span>{active.tag}</span>
              <span style={{ opacity: 0.75 }}>
                @{Math.floor(active.pieceStartSeconds / 60)}:
                {String(Math.floor(active.pieceStartSeconds % 60)).padStart(2, "0")}
              </span>
            </div>

            <div
              style={{
                marginTop: Math.round(12 * scale),
                fontFamily: UI,
                fontWeight: 700,
                fontSize: Math.round(40 * scale),
                lineHeight: 1.12,
                letterSpacing: "0.03em",
                color: WHITE,
                textTransform: "uppercase",
              }}
            >
              {active.heading}
            </div>

            <div
              style={{
                marginTop: Math.round(14 * scale),
                fontFamily: UI,
                fontWeight: 400,
                fontSize: Math.round(27 * scale),
                lineHeight: 1.42,
                color: WHITE,
                opacity: 0.92,
              }}
            >
              {active.body}
            </div>

            {active.formula ? (
              <div
                style={{
                  marginTop: Math.round(18 * scale),
                  padding: `${Math.round(10 * scale)}px ${Math.round(16 * scale)}px`,
                  backgroundColor: "rgba(127, 212, 245, 0.1)",
                  border: `1px solid rgba(127, 212, 245, 0.32)`,
                  borderRadius: Math.round(6 * scale),
                  fontFamily: MONO,
                  fontSize: Math.round(21 * scale),
                  color: CYAN,
                  letterSpacing: "0.05em",
                }}
              >
                {active.formula}
              </div>
            ) : null}

            {active.diagram && active.diagram !== "none" ? (
              <div style={{ marginTop: Math.round(18 * scale) }}>
                <AnimatedDiagram kind={active.diagram} t={globalSec} scale={scale} />
              </div>
            ) : null}

            {activeIdx === timeline.length - 1 && ctaText ? (
              <div
                style={{
                  marginTop: Math.round(20 * scale),
                  fontFamily: UI,
                  fontWeight: 600,
                  fontSize: Math.round(22 * scale),
                  letterSpacing: "0.16em",
                  color: CYAN,
                  textTransform: "uppercase",
                }}
              >
                🎧 {ctaText}
              </div>
            ) : null}
          </div>
        ) : null}
      </AbsoluteFill>
    );
  };
