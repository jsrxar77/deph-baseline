import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";
import { useAudioBands } from "./useAudioBands";

// Fixed Julia-constant anchor for this composition. Not derived from anything musical — it's a
// visual seed. Swapped from the original (-0.687, 0.312) — too static/blob-like — to a classic
// chaotic-boundary constant known for lively, spiraling filament structure ("more movement").
const JULIA_SEED: [number, number] = [-0.7269, 0.1889];

const ITER_BASE = 150; // higher than the first pass — denser filament detail, "more fractal"

type GLState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Program link error: ${info}`);
  }
  return program;
}

export const FractalVisualizer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const bands = useAudioBands(frame);
  const glStateRef = useRef<GLState | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;
    const gl = node.getContext("webgl", { antialias: true, preserveDrawingBuffer: true });
    if (!gl) {
      setDiagnostic("DIAGNOSTIC: getContext('webgl') returned null — WebGL unavailable in this renderer.");
      return;
    }
    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch (e) {
      setDiagnostic(`DIAGNOSTIC: shader error — ${(e as Error).message}`);
      return;
    }

    // Fullscreen quad: two triangles as a triangle strip.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of ["uResolution", "uTime", "uBass", "uMid", "uHigh", "uColorOffset", "uIterBase", "uSeed"]) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    glStateRef.current = { gl, program, uniforms };
  }, []);

  const timeInSeconds = frame / fps;

  useLayoutEffect(() => {
    const state = glStateRef.current;
    if (!state) return;
    const { gl, program, uniforms } = state;

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.uniform2f(uniforms.uResolution, width, height);
    gl.uniform1f(uniforms.uTime, timeInSeconds);
    gl.uniform1f(uniforms.uBass, bands.bass);
    gl.uniform1f(uniforms.uMid, bands.mid);
    gl.uniform1f(uniforms.uHigh, bands.high);
    // Cycles roughly every ~55s — visibly moving within a normal viewing window, while still
    // slow enough that the disruptive accent in the palette reads as a passing event, not a strobe.
    gl.uniform1f(uniforms.uColorOffset, (timeInSeconds / 55) % 1);
    gl.uniform1f(uniforms.uIterBase, ITER_BASE);
    gl.uniform2f(uniforms.uSeed, JULIA_SEED[0], JULIA_SEED[1]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050508" }}>
      <Audio src={staticFile("slow-drift-audio.wav")} />
      <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "100%" }} />
      {diagnostic ? (
        <div style={{ position: "absolute", top: 24, left: 28, color: "red", fontFamily: "monospace", fontSize: 20, maxWidth: "90%" }}>
          {diagnostic}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
