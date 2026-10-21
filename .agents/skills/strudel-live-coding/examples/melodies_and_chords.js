// ============================================================================
// STRUDEL MELODIES, HARMONY & SYNTH PATTERNS
// ============================================================================

// 1. Hypnotic Acid 303 Bassline
setcpm(128/4)
$: note("<[c2 c3]*4 [bb1 bb2]*4 [f2 f3]*4 [eb2 eb3]*4>")
  .s("sawtooth")
  .lpf(sine.range(300, 2400).slow(4))
  .lpq(8)
  .decay(0.18)
  .gain(0.75)

// 2. Neo-Soul / Lo-Fi Electric Piano Chords
setcpm(82/4)
$: n("<[0,2,4,6] [3,5,7,9] [2,4,6,8] [4,6,8,10]>/2")
  .scale("Eb4:major")
  .s("gm_epiano1")
  .adsr(".02:.2:.6:.4")
  .room(0.7)
  .delay(".4:.25:.5")

// 3. Arpeggiated Modal Lead with Stereo Spread (Jux)
setcpm(120/4)
$: n("0 2 4 6 7 9 11 12")
  .scale("D4:dorian")
  .s("square")
  .jux(rev)
  .lpf(1400)
  .delay(".5:.125:.6")
  .gain(0.6)

// 4. Shuffle Blues / Funk Bassline
setcpm(95/4)
$: n("<[0@2 0] [3@2 3] [4@2 4] [3@2 3]>*2")
  .scale("G2:mixolydian")
  .s("gm_acoustic_bass")
  .decay(0.2)
  .gain(0.85)

// 5. Ambient Evolving Pad with Perlin Noise Cutoff
setcpm(60/4)
$: note("<[c3,g3,eb4] [bb2,f3,d4] [ab2,eb3,c4] [g2,d3,b3]>/4")
  .s("sawtooth,triangle")
  .lpf(perlin.range(400, 1800).slow(8))
  .adsr(".4:.3:.8:1.2")
  .room(1.5)
  .gain(0.5)
