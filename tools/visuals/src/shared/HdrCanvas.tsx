import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";

/** A shader uniform: a float, a vec2/vec3, or a float/vec4 array. */
export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | { kind: "1fv" | "4fv"; value: Float32Array };

// A small HDR pipeline in raw WebGL2, deterministic and a pure function of the frame:
//   1. the scene fragment shader renders LINEAR, unclamped light into a half-float texture (values above 1 are real
//      "brighter than white" light, e.g. the being's core);
//   2. the bright parts are thresholded, downsampled through 5 levels and blurred (a bloom pyramid);
//   3. a final pass adds the bloom, applies a filmic tone curve (ACES) that rolls hot highlights toward white while
//      keeping saturation, a vignette and fine grain, and writes the 8-bit SDR frame (BT.709 output, YouTube-safe).
// "HDR look" in a standard video, not an HDR (PQ/HLG) export, at the user's choice for now.

const VERT = `#version 300 es
in vec2 aPosition; out vec2 vUv;
void main(){ vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const PRE = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uTexel; uniform float uThreshold;
vec3 tap(vec2 uv){ return texture(uTex, uv).rgb; }
void main(){
  vec3 c = 0.25 * (tap(vUv + uTexel * vec2(-0.5, -0.5)) + tap(vUv + uTexel * vec2(0.5, -0.5)) + tap(vUv + uTexel * vec2(-0.5, 0.5)) + tap(vUv + uTexel * vec2(0.5, 0.5)));
  float l = max(c.r, max(c.g, c.b));
  float k = max(l - uThreshold, 0.0) / max(l, 1e-4);   // keep only what is brighter than the threshold
  o = vec4(min(c * k, vec3(60.0)), 1.0);
}`;

const DOWN = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uTexel;
void main(){
  o = vec4(0.25 * (texture(uTex, vUv + uTexel * vec2(-0.5, -0.5)).rgb + texture(uTex, vUv + uTexel * vec2(0.5, -0.5)).rgb + texture(uTex, vUv + uTexel * vec2(-0.5, 0.5)).rgb + texture(uTex, vUv + uTexel * vec2(0.5, 0.5)).rgb), 1.0);
}`;

const BLUR = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 s = texture(uTex, vUv).rgb * 0.227027;
  s += (texture(uTex, vUv + uDir * 1.3846154).rgb + texture(uTex, vUv - uDir * 1.3846154).rgb) * 0.3162162;
  s += (texture(uTex, vUv + uDir * 3.2307692).rgb + texture(uTex, vUv - uDir * 3.2307692).rgb) * 0.0702703;
  o = vec4(s, 1.0);
}`;

const FINAL = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uScene, uB0, uB1, uB2, uB3, uB4;
uniform float uBloom, uExposure, uTime, uSaturation, uCA, uGamma;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 ca = (vUv - 0.5) * uCA;   // slight colour dispersion toward the edges, as light bends through water
  vec3 hdr = vec3(texture(uScene, vUv + ca).r, texture(uScene, vUv).g, texture(uScene, vUv - ca).b);
  vec3 bloom = texture(uB0, vUv).rgb * 0.75 + texture(uB1, vUv).rgb * 0.85 + texture(uB2, vUv).rgb * 0.95 + texture(uB3, vUv).rgb * 0.9 + texture(uB4, vUv).rgb * 0.8;
  vec3 c = (hdr + bloom * uBloom) * uExposure;
  c = aces(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaturation);
  c = pow(c, vec3(1.0 / uGamma));   // 2.0 (default) is steeper than sRGB 2.2 on purpose: deeper darks; higher values lift the shadows and brighten
  vec2 q = vUv - 0.5;
  c *= 1.0 - 0.5 * dot(q * vec2(0.9, 1.15), q * vec2(0.9, 1.15)) * 2.0;
  c += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * (1.5 / 255.0);   // fine grain, also breaks up 8-bit banding in the dark gradients
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

const LEVELS = 5;

type Tex = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type State = {
  gl: WebGL2RenderingContext;
  scene: WebGLProgram; pre: WebGLProgram; down: WebGLProgram; blur: WebGLProgram; final: WebGLProgram;
  sceneTex: Tex; lv: Tex[]; tmp: Tex[]; locs: Map<WebGLProgram, Record<string, WebGLUniformLocation | null>>;
};

function compile(gl: WebGL2RenderingContext, type: number, src: string, label: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`${label}: ${gl.getShaderInfoLog(sh)}`);
  return sh;
}
function program(gl: WebGL2RenderingContext, vs: string, fs: string, label: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, `${label} vertex`));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, `${label} fragment`));
  gl.bindAttribLocation(p, 0, "aPosition");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`${label} link: ${gl.getProgramInfoLog(p)}`);
  return p;
}
function makeTex(gl: WebGL2RenderingContext, w: number, h: number): Tex {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("half-float framebuffer is not complete");
  return { tex, fbo, w, h };
}

export type HdrParams = { bloom: number; exposure: number; saturation: number; threshold: number; ca?: number; gamma?: number };

export const HdrCanvas: React.FC<{ sceneFragment: string; uniforms: Record<string, UniformValue> | null; width: number; height: number; params: HdrParams; audioSrc?: string }> = ({
  sceneFragment,
  uniforms,
  width,
  height,
  params,
  audioSrc = "songcord-master.wav",
}) => {
  const ref = useRef<State | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;
    const gl = node.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) return setDiagnostic("DIAGNOSTIC: getContext('webgl2') returned null — WebGL2 unavailable in this renderer.");
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return setDiagnostic("DIAGNOSTIC: no float/half-float render target support.");
    try {
      const sceneVert = VERT;
      const sceneFrag = `#version 300 es\nprecision highp float;\nout vec4 fragColorOut;\n` + sceneFragment.replace("precision highp float;", "").replace(/gl_FragColor/g, "fragColorOut");
      const st: State = {
        gl,
        scene: program(gl, sceneVert, sceneFrag, "scene"),
        pre: program(gl, VERT, PRE, "prefilter"), down: program(gl, VERT, DOWN, "downsample"), blur: program(gl, VERT, BLUR, "blur"), final: program(gl, VERT, FINAL, "final"),
        sceneTex: makeTex(gl, width, height), lv: [], tmp: [], locs: new Map(),
      };
      for (let k = 0; k < LEVELS; k++) {
        const w = Math.max(2, width >> (k + 1)), h = Math.max(2, height >> (k + 1));
        st.lv.push(makeTex(gl, w, h));
        st.tmp.push(makeTex(gl, w, h));
      }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      ref.current = st;
    } catch (e) {
      setDiagnostic(`DIAGNOSTIC: ${(e as Error).message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const st = ref.current;
    if (!st || !uniforms) return;
    const { gl } = st;
    const loc = (p: WebGLProgram, name: string) => {
      let m = st.locs.get(p);
      if (!m) st.locs.set(p, (m = {}));
      if (!(name in m)) m[name] = gl.getUniformLocation(p, name);
      return m[name];
    };
    const draw = (t: Tex | null, w: number, h: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
      gl.viewport(0, 0, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const bind = (unit: number, tex: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };

    // 1. scene -> HDR texture
    gl.useProgram(st.scene);
    for (const [name, v] of Object.entries(uniforms)) {
      const l = loc(st.scene, name);
      if (l === null) continue;
      if (typeof v === "number") gl.uniform1f(l, v);
      else if (Array.isArray(v)) (v.length === 2 ? gl.uniform2f(l, v[0], v[1]) : gl.uniform3f(l, v[0], v[1], v[2]));
      else if (v.kind === "1fv") gl.uniform1fv(l, v.value);
      else gl.uniform4fv(l, v.value);
    }
    draw(st.sceneTex, width, height);

    // 2. prefilter into level 0, then downsample the pyramid
    gl.useProgram(st.pre);
    bind(0, st.sceneTex.tex);
    gl.uniform1i(loc(st.pre, "uTex"), 0);
    gl.uniform2f(loc(st.pre, "uTexel"), 1 / width, 1 / height);
    gl.uniform1f(loc(st.pre, "uThreshold"), params.threshold);
    draw(st.lv[0], st.lv[0].w, st.lv[0].h);
    gl.useProgram(st.down);
    for (let k = 1; k < LEVELS; k++) {
      bind(0, st.lv[k - 1].tex);
      gl.uniform1i(loc(st.down, "uTex"), 0);
      gl.uniform2f(loc(st.down, "uTexel"), 1 / st.lv[k - 1].w, 1 / st.lv[k - 1].h);
      draw(st.lv[k], st.lv[k].w, st.lv[k].h);
    }

    // 3. separable blur of every level
    gl.useProgram(st.blur);
    gl.uniform1i(loc(st.blur, "uTex"), 0);
    for (let k = 0; k < LEVELS; k++) {
      const L = st.lv[k];
      bind(0, L.tex);
      gl.uniform2f(loc(st.blur, "uDir"), 1 / L.w, 0);
      draw(st.tmp[k], L.w, L.h);
      bind(0, st.tmp[k].tex);
      gl.uniform2f(loc(st.blur, "uDir"), 0, 1 / L.h);
      draw(L, L.w, L.h);
    }

    // 4. composite to the screen
    gl.useProgram(st.final);
    bind(0, st.sceneTex.tex);
    gl.uniform1i(loc(st.final, "uScene"), 0);
    for (let k = 0; k < LEVELS; k++) {
      bind(1 + k, st.lv[k].tex);
      gl.uniform1i(loc(st.final, `uB${k}`), 1 + k);
    }
    gl.uniform1f(loc(st.final, "uBloom"), params.bloom);
    gl.uniform1f(loc(st.final, "uExposure"), params.exposure);
    gl.uniform1f(loc(st.final, "uSaturation"), params.saturation);
    gl.uniform1f(loc(st.final, "uCA"), params.ca ?? 0);
    gl.uniform1f(loc(st.final, "uGamma"), params.gamma ?? 2.0);
    gl.uniform1f(loc(st.final, "uTime"), typeof uniforms.uTime === "number" ? uniforms.uTime : 0);
    draw(null, width, height);
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile(audioSrc)} />
      <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "100%" }} />
      {diagnostic ? <div style={{ position: "absolute", top: 24, left: 28, color: "red", fontFamily: "monospace", fontSize: 20, maxWidth: "90%" }}>{diagnostic}</div> : null}
    </AbsoluteFill>
  );
};
