// ============================================================================
// STRUDEL DRUM BEATS & RHYTHMIC TEMPLATES
// ============================================================================

// 1. Classic Four-on-the-Floor House Beat (124 BPM)
setcpm(124/4)
$: s("bd*4, [~ cp]*2, [~ hh]*4")
  .bank("RolandTR909")
  .gain(".9")

// 2. Detroit Techno with Shuffling Open Hats (132 BPM)
setcpm(132/4)
$: s("bd*4, [~ sd]*2, [hh oh]*4, [~ rim]*2")
  .bank("RolandTR909")
  .gain("[.9 .7 .8 .6]*4")

// 3. Boom-Bap Hip Hop Groove (90 BPM)
setcpm(90/4)
$: s("bd [~ bd] sd [~ [bd? bd]]")
  .bank("RolandTR808")
  .gain("1 .8 .9 .7")
$: s("hh*8")
  .bank("RolandTR808")
  .gain("[.7 .3 .5 .3]*4")

// 4. Euclidean Pop Clave / Tresillo Groove
setcpm(105/4)
$: s("bd(3,8,0)").bank("RolandTR707").gain(".9")
$: s("sd(2,8,2)").bank("RolandTR707").gain(".8")
$: s("hh(5,8,1)").bank("RolandTR707").gain(".6")

// 5. Polyrhythmic Afrobeat / Funk Syncopation
setcpm(112/4)
$: s("bd(3,8), [~ cp]*2, hh*16?0.1")
  .bank("AkaiLinn")
  .gain("[1 .4 .7 .3]*4")
  .delay(".3:.125:.4")

// 6. Jungle / Breakbeat Fast Chopper (165 BPM)
setcpm(165/4)
$: s("bd [~ bd] sd [~ [bd sd]]")
  .bank("RolandTR909")
  .ply("<1 2 1 4>")
  .fast(2)
