import { useCurrentFrame } from "remotion";

export interface CaptionWord {
  word: string;
  cleanWord?: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export interface CaptionsProps {
  words: CaptionWord[];
  fontFamily?: string;
  bottomPx?: number;
  maxWordsPerPhrase?: number;
}

export const Captions: React.FC<CaptionsProps> = ({
  words = [],
  fontFamily = "'Avenir Next', -apple-system, BlinkMacSystemFont, sans-serif",
  bottomPx = 480, // Safe zone above YouTube Shorts bottom UI bar
  maxWordsPerPhrase = 4,
}) => {
  const frame = useCurrentFrame();

  if (!words || words.length === 0) return null;

  // Find the index of the currently active word
  const activeIndex = words.findIndex(
    (w) => frame >= w.startFrame && frame <= w.endFrame
  );

  // If no word is strictly active, find if we are between words in the narrative
  let currentTargetIndex = activeIndex;
  if (currentTargetIndex === -1) {
    const nextIndex = words.findIndex((w) => frame < w.startFrame);
    if (nextIndex > 0) {
      // Check if we are within 0.8s of the last spoken word
      const prevWord = words[nextIndex - 1];
      if (frame - prevWord.endFrame <= 48) {
        currentTargetIndex = nextIndex - 1;
      }
    }
  }

  // If before first word or after last word (+ grace period), render nothing
  if (currentTargetIndex === -1) {
    return null;
  }

  // Determine the phrase window around the active word
  const phraseStart = Math.floor(currentTargetIndex / maxWordsPerPhrase) * maxWordsPerPhrase;
  const phraseEnd = Math.min(words.length, phraseStart + maxWordsPerPhrase);
  const phraseWords = words.slice(phraseStart, phraseEnd);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: `${bottomPx}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        pointerEvents: "none",
        padding: "0 48px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px 14px",
          background: "rgba(5, 7, 13, 0.76)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(127, 212, 245, 0.28)",
          borderRadius: "18px",
          padding: "16px 28px",
          maxWidth: "920px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.65), 0 0 24px rgba(127, 212, 245, 0.12)",
        }}
      >
        {phraseWords.map((item, idx) => {
          const globalIdx = phraseStart + idx;
          const isActive = globalIdx === currentTargetIndex && activeIndex !== -1;
          const isSpoken = globalIdx < currentTargetIndex || (globalIdx === currentTargetIndex && activeIndex === -1);

          let scale = 1.0;
          let color = "rgba(242, 251, 255, 0.45)"; // upcoming word
          let textShadow = "none";
          let fontWeight = 600;

          if (isActive) {
            scale = 1.12;
            color = "#7fd4f5"; // Glowing cyan
            textShadow = "0 0 16px rgba(127, 212, 245, 0.85), 0 0 32px rgba(127, 212, 245, 0.4)";
            fontWeight = 800;
          } else if (isSpoken) {
            color = "#f2fbff"; // Solid white
            fontWeight = 600;
          }

          return (
            <span
              key={`${globalIdx}-${item.word}`}
              style={{
                fontFamily,
                fontSize: "36px",
                lineHeight: "1.25",
                letterSpacing: "0.02em",
                fontWeight,
                color,
                textShadow,
                transform: `scale(${scale})`,
                transition: "transform 0.08s ease-out, color 0.08s ease-out",
                display: "inline-block",
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
