import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";

export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | { kind: "1fv" | "4fv"; value: Float32Array };

const VERTEX = `attribute vec2 aPosition; void main(){ gl_Position = vec4(aPosition, 0.0, 1.0); }`;

type GLState = { gl: WebGLRenderingContext; program: WebGLProgram; locs: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("Could not create shader");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`Shader compile error: ${gl.getShaderInfoLog(sh)}`);
  return sh;
}

/** Full-frame fragment shader host. `uniforms` is recomputed by the caller each frame (a pure function of frame). */
export const ShaderCanvas: React.FC<{ fragment: string; uniforms: Record<string, UniformValue> | null; width: number; height: number }> = ({
  fragment,
  uniforms,
  width,
  height,
}) => {
  const ref = useRef<GLState | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;
    const gl = node.getContext("webgl", { antialias: true, preserveDrawingBuffer: true });
    if (!gl) return setDiagnostic("DIAGNOSTIC: getContext('webgl') returned null — WebGL unavailable in this renderer.");
    try {
      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ref.current = { gl, program, locs: {} };
    } catch (e) {
      setDiagnostic(`DIAGNOSTIC: ${(e as Error).message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const st = ref.current;
    if (!st || !uniforms) return;
    const { gl, program, locs } = st;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    for (const [name, v] of Object.entries(uniforms)) {
      if (!(name in locs)) locs[name] = gl.getUniformLocation(program, name);
      const l = locs[name];
      if (l === null) continue;
      if (typeof v === "number") gl.uniform1f(l, v);
      else if (Array.isArray(v)) (v.length === 2 ? gl.uniform2f(l, v[0], v[1]) : gl.uniform3f(l, v[0], v[1], v[2]));
      else if (v.kind === "1fv") gl.uniform1fv(l, v.value);
      else gl.uniform4fv(l, v.value);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050508" }}>
      <Audio src={staticFile("songcord-master.wav")} />
      <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "100%" }} />
      {diagnostic ? <div style={{ position: "absolute", top: 24, left: 28, color: "red", fontFamily: "monospace", fontSize: 20, maxWidth: "90%" }}>{diagnostic}</div> : null}
    </AbsoluteFill>
  );
};
