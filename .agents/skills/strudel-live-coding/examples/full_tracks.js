// ============================================================================
// FULL ARRANGEMENTS & MULTI-TRACK LIVE CODING STACKS
// ============================================================================

// Track 1: Deep Melodic Techno (124 BPM)
setcpm(124/4)

// [1] Kick & Percussion
$: s("bd*4, [~ cp]*2, [hh*2]*4")
  .bank("RolandTR909")
  .gain("[1 .7 .9 .7]*4")

// [2] Offbeat Shaker / Percussion Texture
$: s("rim(3,8,2), perc*16?0.2")
  .bank("RolandTR909")
  .gain(perlin.range(0.2, 0.6))
  .pan(sine.range(0.2, 0.8).slow(4))

// [3] Driving Rolling Bassline
$: note("<[c2 c3]*4 [bb1 bb2]*4 [ab1 ab2]*4 [g1 g2]*4>")
  .s("sawtooth")
  .lpf(sine.range(350, 1800).slow(8))
  .lpq(6)
  .decay(0.16)
  .gain(0.8)

// [4] Evolving Chords & Atmosphere
$: note("<[c3,g3,eb4] [bb2,f3,d4] [ab2,eb3,c4] [g2,d3,b3]>/4")
  .s("sawtooth")
  .vowel("<a e i o>")
  .room(0.9)
  .delay(".5:.25:.6")
  .gain(0.45)

// [5] Generative Pluck Arpeggio
$: n("<0 2 4 7 9 11 12 14>*2")
  .scale("C4:minor")
  .s("square")
  .jux(rev)
  .adsr(".01:.08:.2:.1")
  .lpf(1600)
  .room(0.7)
  .gain(0.5)
