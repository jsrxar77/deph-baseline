// GLSL ES 3.0 Fragment Shader for Morpho-Genesis (for HdrCanvas linear HDR pipeline)
// MORFOGÉNESIS SAGRADA Y CONTINUA:
//
// 1. CIMÁTICA Y CHLADNI : Resonancia acústica primordial que nace de la singularidad y se expande al encuadre
// 2. LA FLOR DE LA VIDA  : Mitosis celular real acelerada dinámicamente (1 a 1) hasta la 3ra iteración (37 células exactas), enmarcada al 100% dentro de la pantalla sin deformarse ni cortarse
// 3. EL CUBO DE METATRÓN: Nacido de los 13 centros exactos de la Flor (distancias 0.24 y 0.36) -> Disparo láser secuencial de los 42 chords platónicos
// 4. LA ESPIRAL ÁUREA   : Desenrollado continuo de la ESPIRAL PURA (Phi = 1.618) desde el origen, CERO círculos concéntricos en el centro
//
// SISTEMA ÓPTICO DUAL (FOREGROUND NÍTIDO vs FONDO DIFUMINADO Y FUNDIDO):
// - Primer plano: Filigrana incandescente ultra-nítida con núcleo brillante y chispas vivas
// - Fondo: El trazo wireframe se disuelve por completo; se convierte en una bruma etérea difuminada y suave (bokeh/aura out-of-focus) fundida con la obsidiana cósmica

import { DEPH_PHASE_RINGS_GLSL } from "../../signature/phaseRings";

export const SCENE_FRAGMENT = `
${DEPH_PHASE_RINGS_GLSL}

// deph's signature layer: the wave bends the content it crosses and lifts it slightly, never drawing a ring of its own
const float LIFT_STRENGTH = 0.010;
const float SHADE_STRENGTH = 0.012;
const vec3 CREST_TINT = vec3(0.10, 0.16, 0.20);

in vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uRms;

#define PI 3.141592653589793
#define PHI 1.618033988749895

// ----------------------------------------------------------------------------------------------------
// NÚCLEO DE DIBUJO PURO Y RENDERIZADO ÓPTICO DUAL
// ----------------------------------------------------------------------------------------------------

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Trazo de rayo láser continuo con punta incandescente
vec2 evalGrowingSegment(vec2 p, vec2 a, vec2 b, float progress) {
  if (progress <= 0.001) return vec2(1e5, 0.0);
  if (progress >= 0.999) {
    vec2 pa = p - a, ba = b - a;
    float lenSq = dot(ba, ba);
    float h = clamp(dot(pa, ba) / max(lenSq, 1e-6), 0.0, 1.0);
    return vec2(length(pa - ba * h), 0.0);
  }
  
  vec2 curB = mix(a, b, progress);
  vec2 pa = p - a, ba = curB - a;
  float lenSq = dot(ba, ba);
  float d = (lenSq < 1e-6) ? length(p - a) : length(pa - ba * clamp(dot(pa, ba) / lenSq, 0.0, 1.0));
  
  float dTip = length(p - curB);
  float tipGlow = 0.0024 / (dTip * dTip * 180.0 + 0.0018);
  return vec2(d, tipGlow);
}

// Renderizado Óptico Dual:
// - Primer Plano (fg = 1): Filigrana nítida, núcleo brillante y chispa incandescente
// - Fondo (fg = 0): Difuminado suave, sin wireframe ("out-of-focus"), fundido con el vacío cósmico
float renderAuraLine(float d, float sparks, float fg, float width) {
  // 1. Núcleo nítido de filigrana (exclusivo de primer plano; se extingue totalmente en el fondo para evitar el look wireframe)
  float core = smoothstep(width, 0.0, d) * fg * 1.35;
  
  // 2. Halo fino del trazo en primer plano (con caída exponencial para garantizar negro puro en la distancia)
  float nearHalo = (0.0022 / (d * d * 95.0 + 0.0020)) * exp(-d * 22.0) * fg;
  
  // 3. Aura difuminada y vaporosa de profundidad
  float diffuseHaze = (0.0062 / (d * d * 18.0 + 0.0095)) * exp(-d * 18.0);
  
  float foreGlow = core + nearHalo * 0.85 + sparks * 0.65;
  float backGlow = diffuseHaze * 0.85;
  
  return mix(backGlow, foreGlow, fg);
}

// ----------------------------------------------------------------------------------------------------
// 0. VIBRACIÓN DEL BEACON EN EL VACÍO NEGRO (Meditación Profunda y Ondas Lentas)
// Fondo negro absoluto, CERO estrellas.
// El beacon y las ondas de agua concéntricas nacen del centro (0, 0) para las figuras 1-3,
// y se trasladan suavemente al ojo de la espiral áurea (0.27624, -0.18818) en la figura 4.
// ----------------------------------------------------------------------------------------------------

vec2 getBeaconPosition(float t) {
  vec2 goldenEye = vec2(0.27624, -0.18818);
  float enterSpiral = smoothstep(985.0, 1015.0, t);
  float exitSpiral = smoothstep(1395.0, 1435.0, t);
  float weight = enterSpiral * (1.0 - exitSpiral);
  return mix(vec2(0.0), goldenEye, weight);
}

float getCentralWaterHeight(vec2 p, float t, vec2 bPos) {
  float r = length(p - bPos);
  // Onda lenta de agua desde el centro activo (período de 16 segundos, velocidad lenta 0.055)
  float age0 = mod(t, 16.0);
  float age1 = age0 + 16.0;
  
  float front0 = age0 * 0.055;
  float d0 = r - front0;
  float packet0 = exp(-d0 * d0 / 0.009);
  float wave0 = cos(36.0 * d0);
  float life0 = exp(-age0 * 0.18) * smoothstep(0.0, 0.4, age0);
  
  float front1 = age1 * 0.055;
  float d1 = r - front1;
  float packet1 = exp(-d1 * d1 / 0.014);
  float wave1 = cos(36.0 * d1);
  float life1 = exp(-age1 * 0.18) * smoothstep(0.0, 0.4, age1);
  
  return (life0 * packet0 * wave0 + life1 * packet1 * wave1 * 0.5) * 0.0035 / (1.0 + 1.8 * r);
}

vec3 getCentralVibrationBackground(vec2 p, float t) {
  // Fondo negro puro
  vec3 col = vec3(0.0);
  
  vec2 bPos = getBeaconPosition(t);
  float e = 0.004;
  float h0 = getCentralWaterHeight(p, t, bPos);
  
  // Pendiente de la superficie de agua
  vec2 slope = vec2(
    getCentralWaterHeight(p + vec2(e, 0.0), t, bPos) - h0,
    getCentralWaterHeight(p + vec2(0.0, e), t, bPos) - h0
  ) / e;
  
  float slopeLen = length(slope);
  
  // Destellos especulares SOLO en las crestas vivas de la onda de agua
  // Si no hay onda activa en este píxel, waveMask cae a 0.0 absoluto (negro puro)
  float waveMask = smoothstep(0.00015, 0.0012, slopeLen);
  
  vec3 n = normalize(vec3(-slope * 2.6, 1.0));
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 30.0);
  
  vec3 colGlint = mix(vec3(0.12, 0.85, 0.90), vec3(0.90, 0.98, 1.00), 0.55) * spec * 0.75 * waveMask;
  vec3 colWave = mix(vec3(0.10, 0.55, 1.15), vec3(0.70, 0.90, 1.25), 0.35) * max(h0, 0.0) * 22.0 * smoothstep(0.00003, 0.0003, abs(h0));
  
  // Pulsación sutil del punto activo del Beacon (estrictamente acotada con caída exponencial para evitar velo de fondo)
  float rCenter = length(p - bPos);
  float bindu = (0.0028 / (rCenter * rCenter * 450.0 + 0.0014)) * exp(-rCenter * 65.0) * (0.8 + 0.2 * sin(t * 0.8));
  vec3 colBindu = vec3(0.85, 0.95, 1.15) * bindu;
  
  col += colGlint + colWave + colBindu;
  return col;
}

// ----------------------------------------------------------------------------------------------------
// 1. CIMÁTICA Y CHLADNI: Resonancia Acústica Primordial (0:00 - 4:00 = 0s a 240s)
// Crece con calma (0 a 160s) -> Plenitud (160 a 195s) -> Se desarma hacia el centro (195 a 240s)
// ----------------------------------------------------------------------------------------------------

float getGrowingChladni(vec2 p, float t, float fg) {
  if (t < 0.0 || t > 240.0) return 0.0;
  
  float dLines = 1e5;
  float tipSparks = 0.0;
  float r = length(p);
  float rPlate = 0.48;
  
  // Ciclo orgánico de crecimiento y desarme:
  // Crecimiento: 0 a 160s | Apogeo: 160 a 195s | Desarme: 195 a 240s
  float growProg = smoothstep(5.0, 160.0, t);
  float disarmProg = smoothstep(195.0, 240.0, t);
  float lifeEnvelope = (1.0 - disarmProg);
  
  // Singularidad Central (Bindu)
  float centerGlow = (0.0055 / (r * r * 160.0 + 0.003)) * smoothstep(0.0, 10.0, t) * lifeEnvelope;
  
  // Placa Circular Exterior: se expande y luego en el desarme se repliega hacia el centro
  float rPlateCurrent = rPlate * growProg * (1.0 - disarmProg * 0.85);
  if (rPlateCurrent > 0.005) {
    dLines = min(dLines, abs(r - rPlateCurrent));
  }
  
  if (r > rPlateCurrent + 0.03) return centerGlow * mix(0.35, 1.0, fg);
  
  // 4 Anillos nodales concéntricos naciendo pausadamente cada 35 segundos
  for (int n = 1; n <= 4; n++) {
    float tRingStart = 15.0 + float(n) * 32.0;
    if (t > tRingStart) {
      float pRing = smoothstep(tRingStart, tRingStart + 25.0, t) * lifeEnvelope;
      float rn = (rPlateCurrent * float(n) / 4.5) * pRing;
      if (rn > 0.005) {
        dLines = min(dLines, abs(r - rn));
      }
    }
  }
  
  // Ejes nodales ortogonales y diagonales
  if (t > 70.0 && lifeEnvelope > 0.01) {
    float pAxis = smoothstep(70.0, 140.0, t) * lifeEnvelope;
    float lA = rPlateCurrent * pAxis;
    vec2 ax1 = evalGrowingSegment(p, vec2(-lA, 0.0), vec2(lA, 0.0), pAxis);
    vec2 ax2 = evalGrowingSegment(p, vec2(0.0, -lA), vec2(0.0, lA), pAxis);
    dLines = min(dLines, min(ax1.x, ax2.x));
    tipSparks = max(tipSparks, max(ax1.y, ax2.y));
    
    vec2 d1 = vec2(cos(PI * 0.25), sin(PI * 0.25)) * lA;
    vec2 d2 = vec2(cos(PI * 0.75), sin(PI * 0.75)) * lA;
    vec2 dg1 = evalGrowingSegment(p, -d1, d1, pAxis);
    vec2 dg2 = evalGrowingSegment(p, -d2, d2, pAxis);
    dLines = min(dLines, min(dg1.x, dg2.x));
    tipSparks = max(tipSparks, max(dg1.y, dg2.y));
  }
  
  // Curvas nodales acústicas de Chladni (n=3, m=5)
  if (t > 110.0 && r <= rPlateCurrent && lifeEnvelope > 0.01) {
    float pWave = smoothstep(110.0, 160.0, t) * lifeEnvelope;
    float rWave = rPlateCurrent * pWave;
    
    vec2 q = (p / max(rPlateCurrent, 0.01)) * (PI * 0.5);
    float n = 3.0; float m = 5.0;
    float a = 1.0; float b = 0.95;
    float w = a * cos(n * q.x) * cos(m * q.y) - b * cos(m * q.x) * cos(n * q.y);
    
    vec2 grad = vec2(
      -n * a * sin(n * q.x) * cos(m * q.y) + m * b * sin(m * q.x) * cos(n * q.y),
      -m * a * cos(n * q.x) * sin(m * q.y) + n * b * cos(m * q.x) * sin(n * q.y)
    ) * (PI * 0.5 / max(rPlateCurrent, 0.01));
    
    float distChladni = abs(w) / max(length(grad), 0.01);
    float waveMask = smoothstep(rWave + 0.03, rWave - 0.01, r);
    dLines = min(dLines, mix(1e5, distChladni, waveMask));
  }
  
  float aura = renderAuraLine(dLines, tipSparks, fg, 0.0020);
  return (aura + centerGlow * mix(0.35, 1.0, fg)) * lifeEnvelope;
}

// ----------------------------------------------------------------------------------------------------
// 2. LA FLOR DE LA VIDA: Mitosis Celular Sagrada de 37 Células (4:00 - 9:00 = 240s a 540s)
// Nace de la semilla en 240s -> Mitosis pausada (240-470s) -> Apogeo (470-500s) -> Se desarma (500-540s)
// ----------------------------------------------------------------------------------------------------

const float R_CELL = 0.120; // Radio de cada célula sagrada

// Árbol genealógico exacto de las 61 células (xy = coordenada destino, zw = coordenada célula madre):
const vec4 CELLS[61] = vec4[61](
  vec4(0.00000, 0.00000, 0.00000, 0.00000), // Célula 0 (Madre Primordial en el origen)
  vec4(0.12000, 0.00000, 0.00000, 0.00000), // Célula 1 (Vesica Piscis - división 1 a 2)
  vec4(0.06000, 0.10392, 0.00000, 0.00000), // Célula 2 (Trinidad / Triquetra)
  vec4(-0.06000, 0.10392, 0.00000, 0.00000), // Célula 3
  vec4(-0.12000, 0.00000, 0.00000, 0.00000), // Célula 4
  vec4(-0.06000, -0.10392, 0.00000, 0.00000), // Célula 5
  vec4(0.06000, -0.10392, 0.00000, 0.00000), // Célula 6 (Completa la Semilla de la Vida - 7 células)
  vec4(0.24000, 0.00000, 0.12000, 0.00000), // Célula 7 (Inicio Flor de la Vida - Anillo 2)
  vec4(0.18000, 0.10392, 0.12000, 0.00000), // Célula 8
  vec4(0.12000, 0.20785, 0.06000, 0.10392), // Célula 9
  vec4(0.00000, 0.20785, 0.06000, 0.10392), // Célula 10
  vec4(-0.12000, 0.20785, -0.06000, 0.10392), // Célula 11
  vec4(-0.18000, 0.10392, -0.06000, 0.10392), // Célula 12
  vec4(-0.24000, 0.00000, -0.12000, 0.00000), // Célula 13
  vec4(-0.18000, -0.10392, -0.06000, -0.10392), // Célula 14
  vec4(-0.12000, -0.20785, -0.06000, -0.10392), // Célula 15
  vec4(0.00000, -0.20785, -0.06000, -0.10392), // Célula 16
  vec4(0.12000, -0.20785, 0.06000, -0.10392), // Célula 17
  vec4(0.18000, -0.10392, 0.06000, -0.10392), // Célula 18 (Completa la Flor de la Vida - 19 células)
  vec4(0.36000, 0.00000, 0.24000, 0.00000), // Célula 19 (Inicio Fruto de la Vida - Anillo 3)
  vec4(0.30000, 0.10392, 0.18000, 0.10392), // Célula 20
  vec4(0.24000, 0.20785, 0.18000, 0.10392), // Célula 21
  vec4(0.18000, 0.31177, 0.12000, 0.20785), // Célula 22
  vec4(0.06000, 0.31177, 0.00000, 0.20785), // Célula 23
  vec4(-0.06000, 0.31177, 0.00000, 0.20785), // Célula 24
  vec4(-0.18000, 0.31177, -0.12000, 0.20785), // Célula 25
  vec4(-0.24000, 0.20785, -0.18000, 0.10392), // Célula 26
  vec4(-0.30000, 0.10392, -0.18000, 0.10392), // Célula 27
  vec4(-0.36000, 0.00000, -0.24000, 0.00000), // Célula 28
  vec4(-0.30000, -0.10392, -0.18000, -0.10392), // Célula 29
  vec4(-0.24000, -0.20785, -0.18000, -0.10392), // Célula 30
  vec4(-0.18000, -0.31177, -0.12000, -0.20785), // Célula 31
  vec4(-0.06000, -0.31177, 0.00000, -0.20785), // Célula 32
  vec4(0.06000, -0.31177, 0.00000, -0.20785), // Célula 33
  vec4(0.18000, -0.31177, 0.12000, -0.20785), // Célula 34
  vec4(0.24000, -0.20785, 0.18000, -0.10392), // Célula 35
  vec4(0.30000, -0.10392, 0.18000, -0.10392), // Célula 36 (Completa Anillo 3 - 37 células)
  vec4(0.48000, 0.00000, 0.36000, 0.00000), // Célula 37 (Inicio Anillo 4 - expansión al 90% de pantalla)
  vec4(0.42000, 0.10392, 0.30000, 0.10392), // Célula 38
  vec4(0.36000, 0.20785, 0.30000, 0.10392), // Célula 39
  vec4(0.30000, 0.31177, 0.24000, 0.20785), // Célula 40
  vec4(0.24000, 0.41569, 0.18000, 0.31177), // Célula 41
  vec4(0.12000, 0.41569, 0.06000, 0.31177), // Célula 42
  vec4(0.00000, 0.41569, 0.06000, 0.31177), // Célula 43
  vec4(-0.12000, 0.41569, -0.06000, 0.31177), // Célula 44
  vec4(-0.24000, 0.41569, -0.18000, 0.31177), // Célula 45
  vec4(-0.30000, 0.31177, -0.24000, 0.20785), // Célula 46
  vec4(-0.36000, 0.20785, -0.30000, 0.10392), // Célula 47
  vec4(-0.42000, 0.10392, -0.30000, 0.10392), // Célula 48
  vec4(-0.48000, 0.00000, -0.36000, 0.00000), // Célula 49
  vec4(-0.42000, -0.10392, -0.30000, -0.10392), // Célula 50
  vec4(-0.36000, -0.20785, -0.30000, -0.10392), // Célula 51
  vec4(-0.30000, -0.31177, -0.24000, -0.20785), // Célula 52
  vec4(-0.24000, -0.41569, -0.18000, -0.31177), // Célula 53
  vec4(-0.12000, -0.41569, -0.06000, -0.31177), // Célula 54
  vec4(0.00000, -0.41569, -0.06000, -0.31177), // Célula 55
  vec4(0.12000, -0.41569, 0.06000, -0.31177), // Célula 56
  vec4(0.24000, -0.41569, 0.18000, -0.31177), // Célula 57
  vec4(0.30000, -0.31177, 0.24000, -0.20785), // Célula 58
  vec4(0.36000, -0.20785, 0.30000, -0.10392), // Célula 59
  vec4(0.42000, -0.10392, 0.30000, -0.10392)  // Célula 60 (Llena el 90% del encuadre completo)
);

float getMitosisFlowerOfLife(vec2 p, float t, float fg) {
  if (t < 240.0 || t > 540.0) return 0.0;
  
  float dCircles = 1e5;
  float tipSparks = 0.0;
  
  float tStart = 240.0;
  float disarmProg = smoothstep(500.0, 540.0, t);
  float lifeEnvelope = 1.0 - disarmProg;
  
  // Célula Madre Primordial (Célula 0)
  float u0 = clamp((t - tStart) / 10.0, 0.0, 1.0);
  float s0 = u0 * u0 * (3.0 - 2.0 * u0);
  dCircles = min(dCircles, abs(length(p) - R_CELL * s0));
  
  // Mitosis pausada a ritmo meditativo de 240s a 470s (230 segundos de desarrollo biológico)
  for (int i = 1; i < 37; i++) {
    float tBirth;
    float tauBud;
    
    if (i <= 6) {
      // Semilla de la vida (células 1 a 6): 10 segundos por división
      tBirth = tStart + 10.0 + float(i - 1) * 10.0;
      tauBud = 9.0;
    } else if (i <= 18) {
      // Anillo 2 (células 7 a 18): 7 segundos por división
      tBirth = tStart + 70.0 + float(i - 7) * 7.0;
      tauBud = 6.5;
    } else {
      // Anillo 3 (células 19 a 36): 5.5 segundos por división
      tBirth = tStart + 154.0 + float(i - 19) * 5.5;
      tauBud = 5.0;
    }
    
    if (t >= tBirth) {
      float u = clamp((t - tBirth) / tauBud, 0.0, 1.0);
      float s = u * u * (3.0 - 2.0 * u);
      
      // En el desarme, las células se reabsorben hacia sus madres:
      vec2 cParent = CELLS[i].zw;
      vec2 cTarget = CELLS[i].xy;
      vec2 curC = mix(cParent, cTarget, s * (1.0 - disarmProg));
      
      float dCell = abs(length(p - curC) - R_CELL);
      
      // Membrana mitótica real
      if (s < 0.90 && disarmProg < 0.01) {
        float dP = abs(length(p - cParent) - R_CELL);
        float k = 0.065 * (1.0 - s);
        dCell = smin(dCell, dP, k);
      }
      
      dCircles = min(dCircles, dCell);
      
      // Chispa viva en el núcleo
      if (s < 0.95 && disarmProg < 0.01) {
        float dSpark = length(p - curC);
        tipSparks = max(tipSparks, (0.0030 / (dSpark * dSpark * 200.0 + 0.002)) * (1.0 - s));
      }
    }
  }
  
  return renderAuraLine(dCircles, tipSparks, fg, 0.0018) * lifeEnvelope;
}

// ----------------------------------------------------------------------------------------------------
// 3. EL CUBO DE METATRÓN: 13 Centros y 42 Rayos Platónicos (9:00 - 16:30 = 540s a 990s)
// Iluminación de centros (540-630s) -> Trazado de rayos (630-890s) -> Apogeo (890-930s) -> Desarme (930-990s)
// ----------------------------------------------------------------------------------------------------

float getGrowingMetatronCube(vec2 p, float t, float fg) {
  if (t < 540.0 || t > 990.0) return 0.0;
  
  float dLines = 1e5;
  float tipSparks = 0.0;
  float dNodes = 1e5;
  float nodeSparks = 0.0;
  
  vec2 C[13];
  C[0] = vec2(0.0, 0.0);
  C[1] = CELLS[7].xy;  C[2] = CELLS[9].xy;  C[3] = CELLS[11].xy;
  C[4] = CELLS[13].xy; C[5] = CELLS[15].xy; C[6] = CELLS[17].xy;
  C[7] = CELLS[19].xy; C[8] = CELLS[22].xy; C[9] = CELLS[25].xy;
  C[10] = CELLS[28].xy; C[11] = CELLS[31].xy; C[12] = CELLS[34].xy;
  
  float tStart = 540.0;
  float disarmProg = smoothstep(930.0, 990.0, t);
  float lifeEnvelope = 1.0 - disarmProg;
  
  // Iluminación pausada de los 13 Centros Sagrados (540s a 630s, ~7s por nodo)
  for (int i = 0; i < 13; i++) {
    float tNode = tStart + float(i) * 6.5;
    if (t > tNode) {
      float gn = smoothstep(tNode, tNode + 6.0, t) * lifeEnvelope;
      float rNode = (i == 0) ? 0.038 : ((i <= 6) ? 0.034 : 0.030);
      dNodes = min(dNodes, abs(length(p - C[i]) - rNode * gn));
      nodeSparks = max(nodeSparks, (0.0022 / (dot(p - C[i], p - C[i]) * 200.0 + 0.0020)) * gn);
    }
  }
  
  // Trazado de los 42 Rayos de Luz Platónicos (630s a 890s, ~6.2s por rayo)
  float tChordStart = tStart + 90.0; // t = 630s
  float dtChord = 6.2;
  float durChord = 7.5;
  
  int pairs[84] = int[84](
    1, 3,  3, 5,  5, 1,
    2, 4,  4, 6,  6, 2,
    1, 2,  2, 3,  3, 4,  4, 5,  5, 6,  6, 1,
    7, 9,  9, 11,  11, 7,
    8, 10,  10, 12,  12, 8,
    7, 8,  8, 9,  9, 10,  10, 11,  11, 12,  12, 7,
    0, 1,  0, 2,  0, 3,  0, 4,  0, 5,  0, 6,
    1, 7,  2, 8,  3, 9,  4, 10,  5, 11,  6, 12,
    1, 8,  2, 9,  3, 10,  4, 11,  5, 12,  6, 7
  );
  
  for (int k = 0; k < 42; k++) {
    float tRay = tChordStart + float(k) * dtChord;
    if (t > tRay) {
      float prog = clamp((t - tRay) / durChord, 0.0, 1.0);
      // En el desarme, los rayos se retraen hacia su nodo origen:
      prog *= (1.0 - disarmProg);
      float sprog = prog * prog * (3.0 - 2.0 * prog);
      int idxA = pairs[k * 2];
      int idxB = pairs[k * 2 + 1];
      vec2 ray = evalGrowingSegment(p, C[idxA], C[idxB], sprog);
      dLines = min(dLines, ray.x);
      tipSparks = max(tipSparks, ray.y * (1.0 - disarmProg));
    }
  }
  
  float glowLines = renderAuraLine(dLines, tipSparks, fg, 0.0016);
  float glowNodes = renderAuraLine(dNodes, nodeSparks, fg, 0.0018);
  return (glowLines + glowNodes) * lifeEnvelope;
}

// ----------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------
// 4. LA ESPIRAL ÁUREA CANÓNICA DE FIBONACCI (16:30 - 24:09 = 990s a 1449s)
// Construcción geométrica sagrada exacta de la Serie de Fibonacci y la Proporción Áurea (Phi = 1.618):
// - Retícula de Cuadrados de Fibonacci inscritos en el Rectángulo Dorado (proporción 1.618:1).
// - Espiral continua de Fibonacci que nace del centro áureo y barre los 8 arcos tangenciales.
// - CERO círculos, CERO esferas.
// ----------------------------------------------------------------------------------------------------

struct FibArc {
  vec2 c;
  float r;
  float a0;
  float a1;
};

// 8 arcos continuos de Fibonacci desde el centro hacia afuera:
const FibArc FIB_ARCS[8] = FibArc[8](
  FibArc(vec2(0.30448, -0.18818), 0.02824, -3.14159, -1.57080),
  FibArc(vec2(0.30448, -0.17073), 0.04570, -1.57080,  0.00000),
  FibArc(vec2(0.27624, -0.17073), 0.07394,  0.00000,  1.57080),
  FibArc(vec2(0.27624, -0.21642), 0.11964,  1.57080,  3.14159),
  FibArc(vec2(0.35018, -0.21642), 0.19358, -3.14159, -1.57080),
  FibArc(vec2(0.35018, -0.09679), 0.31321, -1.57080,  0.00000),
  FibArc(vec2(0.15661, -0.09679), 0.50679,  0.00000,  1.57080),
  FibArc(vec2(0.15661, -0.41000), 0.82000,  1.57080,  3.14159)
);

// Bounding boxes de los 8 Cuadrados de Fibonacci (del más pequeño al más grande):
const vec4 FIB_BOXES[8] = vec4[8](
  vec4(0.27624, 0.30448, -0.21642, -0.18818), // Cuadrado 0 (ojo primordial)
  vec4(0.30448, 0.35018, -0.21642, -0.17073), // Cuadrado 1 (primer paso adyacente)
  vec4(0.27624, 0.35018, -0.17073, -0.09679), // Cuadrado 2
  vec4(0.15661, 0.27624, -0.21642, -0.09679), // Cuadrado 3
  vec4(0.15661, 0.35018, -0.41000, -0.21642), // Cuadrado 4
  vec4(0.35018, 0.66339, -0.41000, -0.09679), // Cuadrado 5
  vec4(0.15661, 0.66339, -0.09679,  0.41000), // Cuadrado 6
  vec4(-0.66339, 0.15661, -0.41000, 0.41000)  // Cuadrado 7 (el gran cuadrado exterior)
);

// Distancia euclídea exacta al perímetro de una caja rectangular
float distToBoxOutline(vec2 p, vec4 b) {
  vec2 c = vec2(b.x + b.y, b.z + b.w) * 0.5;
  vec2 h = vec2(b.y - b.x, b.w - b.z) * 0.5;
  vec2 d = abs(p - c) - h;
  float ext = length(max(d, 0.0));
  float intD = max(d.x, d.y);
  return (intD > 0.0) ? ext : abs(intD);
}

// Retícula profética de Rectángulos de Fibonacci:
// Apenas empieza, existen los primeros 2 (el actual por donde va la luz y el siguiente que anticipa la dirección).
// Conforme la luz avanza y pisa el segundo, se proyecta el tercero, y así sucesivamente.
float getFibonacciGrid(vec2 p, float totalArcs, float lifeEnvelope) {
  float glowGrid = 0.0;
  
  for (int i = 0; i < 8; i++) {
    float vis;
    if (i == 0 || i == 1) {
      // Los primeros dos siempre están presentes desde el inicio para marcar el patrón
      vis = 1.0;
    } else {
      // Cada nuevo cuadrado se proyecta como guía cuando la luz pisa el anterior
      float trigger = float(i - 1);
      vis = smoothstep(trigger - 0.20, trigger + 0.35, totalArcs);
    }
    
    if (vis > 0.005) {
      float dBox = distToBoxOutline(p, FIB_BOXES[i]);
      // Filigrana nítida y suave, con caída exponencial para negro absoluto
      float core = smoothstep(0.0012, 0.0, dBox) * 0.70;
      float halo = (0.0012 / (dBox * dBox * 180.0 + 0.0022)) * exp(-dBox * 22.0);
      float squareGlow = (core + halo * 0.35) * vis;
      glowGrid = max(glowGrid, squareGlow);
    }
  }
  
  return glowGrid * lifeEnvelope;
}

// Distancia exacta a un arco circular con ángulo acotado
float distToArc(vec2 p, vec2 c, float r, float a0, float a1) {
  vec2 v = p - c;
  float dCenter = length(v);
  float ang = atan(v.y, v.x);
  
  float aMin = min(a0, a1);
  float aMax = max(a0, a1);
  float aMid = (aMin + aMax) * 0.5;
  float da = mod(ang - aMid + PI, 2.0 * PI) - PI;
  float curA = aMid + da;
  
  if (curA >= aMin && curA <= aMax) {
    return abs(dCenter - r);
  }
  
  vec2 p0 = c + vec2(cos(a0), sin(a0)) * r;
  vec2 p1 = c + vec2(cos(a1), sin(a1)) * r;
  return min(length(p - p0), length(p - p1));
}

// La Espiral Áurea continua de Fibonacci que se desenrolla orgánicamente:
float getGrowingFibonacciSpiral(vec2 p, float t, float fg) {
  if (t < 990.0 || t > 1449.0) return 0.0;
  
  float dSpiral = 1e5;
  float tipSpark = 0.0;
  
  float tStart = 990.0;
  float disarmProg = smoothstep(1395.0, 1449.0, t);
  float lifeEnvelope = 1.0 - disarmProg;
  
  // Progreso de desenrollado a lo largo de 350 segundos (990s a 1340s)
  float uSpiral = clamp((t - tStart) / 350.0, 0.0, 1.0) * (1.0 - disarmProg);
  float sProg = uSpiral * uSpiral * (3.0 - 2.0 * uSpiral);
  
  // Total de arcos = 8.0 (de 0.0 a 8.0)
  float totalArcs = 8.0 * sProg;
  
  // Coordenada actual de la punta que va dibujando la espiral
  vec2 curTip = FIB_ARCS[0].c + vec2(cos(FIB_ARCS[0].a0), sin(FIB_ARCS[0].a0)) * FIB_ARCS[0].r;
  
  for (int i = 0; i < 8; i++) {
    float arcIdx = float(i);
    if (totalArcs >= arcIdx) {
      float arcProg = clamp(totalArcs - arcIdx, 0.0, 1.0);
      float curA1 = mix(FIB_ARCS[i].a0, FIB_ARCS[i].a1, arcProg);
      
      float dArc = distToArc(p, FIB_ARCS[i].c, FIB_ARCS[i].r, FIB_ARCS[i].a0, curA1);
      dSpiral = min(dSpiral, dArc);
      
      if (arcProg > 0.001) {
        curTip = FIB_ARCS[i].c + vec2(cos(curA1), sin(curA1)) * FIB_ARCS[i].r;
      }
    }
  }
  
  // Chispa viva en la punta viajera
  float dTip = length(p - curTip);
  tipSpark = (0.0035 / (dTip * dTip * 350.0 + 0.0014)) * (1.0 - disarmProg);
  
  // Luz suave en el centro áureo
  vec2 goldenEye = vec2(0.27624, -0.18818);
  float dEye = length(p - goldenEye);
  float eyeGlow = (0.0020 / (dEye * dEye * 500.0 + 0.0012)) * smoothstep(tStart, tStart + 15.0, t) * lifeEnvelope;
  
  float aura = renderAuraLine(dSpiral, tipSpark, fg, 0.0024);
  return (aura + eyeGlow * mix(0.35, 1.0, fg)) * lifeEnvelope;
}

// ----------------------------------------------------------------------------------------------------
// MAIN SHADER PIPELINE (Arco Armónico Completo de 24:09 = 1449 Segundos Exactos)
// ----------------------------------------------------------------------------------------------------

void main() {
  vec2 p0 = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime;
  vec2 touch = dephRingTouch(p0, t);
  vec2 p = p0 + (length(p0) > 0.0001 ? normalize(p0) : vec2(0.0)) * touch.y * LIFT_STRENGTH;
  
  // Capa 0: Fondo negro puro y vibración central lenta y meditativa (cero estrellas)
  vec3 col = getCentralVibrationBackground(p, t);
  
  // --------------------------------------------------------------------------------------------------
  // 1. CIMÁTICA Y CHLADNI : 0:00 - 4:00 (0s a 240s)
  // --------------------------------------------------------------------------------------------------
  if (t < 240.0) {
    float glowChladni = getGrowingChladni(p, t, 1.0);
    vec3 colChladni = vec3(0.12, 1.05, 1.20); // Cyan-Turquesa Eléctrico
    vec3 cChladni = mix(colChladni, vec3(1.15, 1.25, 1.30), smoothstep(0.9, 2.3, glowChladni));
    col += cChladni * glowChladni;
  }
  
  // --------------------------------------------------------------------------------------------------
  // 2. FLOR DE LA VIDA : 4:00 - 9:00 (240s a 540s)
  // --------------------------------------------------------------------------------------------------
  if (t >= 240.0 && t < 540.0) {
    float glowFlower = getMitosisFlowerOfLife(p, t, 1.0);
    vec3 colFlower = vec3(1.24, 0.90, 0.22); // Oro Alquímico Puro 24k
    vec3 cFlower = mix(colFlower, vec3(1.28, 1.22, 1.08), smoothstep(0.9, 2.3, glowFlower));
    col += cFlower * glowFlower;
  }
  
  // --------------------------------------------------------------------------------------------------
  // 3. CUBO DE METATRÓN : 9:00 - 16:30 (540s a 990s)
  // --------------------------------------------------------------------------------------------------
  if (t >= 540.0 && t < 990.0) {
    float glowMeta = getGrowingMetatronCube(p, t, 1.0);
    vec3 colMeta = vec3(0.92, 0.36, 1.28); // Amatista Cósmica Platónica
    vec3 cMeta = mix(colMeta, vec3(1.22, 1.08, 1.28), smoothstep(0.9, 2.3, glowMeta));
    col += cMeta * glowMeta;
  }
  
  // --------------------------------------------------------------------------------------------------
  // 4. ESPIRAL ÁUREA CANÓNICA DE FIBONACCI : 16:30 - 24:09 (990s a 1449s)
  // Serie de Fibonacci que arma la espiral en proporción áurea pura (Phi = 1.618)
  // --------------------------------------------------------------------------------------------------
  if (t >= 990.0 && t <= 1449.0) {
    float disarmProg = smoothstep(1395.0, 1449.0, t);
    float lifeEnvelope = 1.0 - disarmProg;
    float tStart = 990.0;
    float uSpiral = clamp((t - tStart) / 350.0, 0.0, 1.0) * lifeEnvelope;
    float sProg = uSpiral * uSpiral * (3.0 - 2.0 * uSpiral);
    float totalArcs = 8.0 * sProg;
    
    // 1. Retícula profética de Fibonacci (revelación paso a paso de los cuadrados):
    float glowGrid = getFibonacciGrid(p, totalArcs, lifeEnvelope);
    vec3 colGrid = vec3(0.35, 0.55, 0.92) * 0.42; // Azul zafiro suave de geometría sagrada
    col += colGrid * glowGrid;
    
    // 2. Espiral de Fibonacci viva (brillante en oro y turquesa resplandeciente)
    float glowSpiral = getGrowingFibonacciSpiral(p, t, 1.0);
    vec3 colSpiral = mix(vec3(0.18, 1.15, 0.85), vec3(1.28, 1.05, 0.35), 0.45);
    vec3 cSpiral = mix(colSpiral, vec3(1.30, 1.30, 1.15), smoothstep(0.9, 2.3, glowSpiral));
    col += cSpiral * glowSpiral;
  }
  
  // Firma torus sobre el contenido: solo donde hay luz real, nunca como anillo propio
  float presence = smoothstep(0.02, 0.25, max(col.r, max(col.g, col.b)));
  col += touch.x * presence * CREST_TINT;
  col *= 1.0 + touch.y * presence * SHADE_STRENGTH;

  // Compresión de altas luces para el tonemapper ACES de HdrCanvas
  float hl = max(col.r, max(col.g, col.b));
  if (hl > 4.5) col *= (4.5 + 1.2 * log(1.0 + (hl - 4.5) / 1.2)) / hl;
  
  gl_FragColor = vec4(col, 1.0);
}
`;
