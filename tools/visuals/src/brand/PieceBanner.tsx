import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

// deph's YouTube channel banner (2560x1440) with any piece's own visual as the background: "deph" + "AMBIENT"
// (deph ambient = deep phase ambient) centred in YouTube's safe area (about 1544x423 at this size). Each piece
// registers its own banner with makeBanner(<its visual>), like makeThumbnail. Render one with:
//   npx remotion still the-field-banner --output=<file>.jpg
const FPS = 60;
const UI = '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';

export type BannerProps = { momentSeconds: number };

export const makeBanner = (Background: React.ComponentType): React.FC<BannerProps> =>
  ({ momentSeconds }) => (
  <AbsoluteFill style={{ backgroundColor: "#050508" }}>
    <Sequence from={-momentSeconds * FPS}>
      <Background />
    </Sequence>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 46% 30% at 50% 50%, rgba(5,5,8,0.78) 0%, rgba(5,5,8,0.55) 60%, rgba(5,5,8,0) 100%)",
      }}
    />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ fontFamily: UI, fontWeight: 300, fontSize: 230, letterSpacing: "0.14em", paddingLeft: "0.14em", color: "#eaf8ff", lineHeight: 1, textShadow: "0 0 40px rgba(5,5,8,0.6)" }}>
        deph
      </div>
      <div style={{ marginTop: 34, fontFamily: UI, fontWeight: 400, fontSize: 58, letterSpacing: "0.42em", paddingLeft: "0.42em", textTransform: "uppercase", color: "#7fd4f5", lineHeight: 1, textShadow: "0 0 30px rgba(5,5,8,0.7)" }}>
        ambient
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
