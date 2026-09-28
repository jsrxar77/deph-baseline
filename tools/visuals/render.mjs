#!/usr/bin/env node
// Renders a composition using the Node.js API (bundle -> selectComposition -> renderMedia) instead of shelling out to
// `npx remotion render`, because the CLI only draws a live progress bar for an interactive terminal: piped or
// backgrounded (as any render long enough to matter here always is), that bar never reaches a readable log, so there
// is no real number to report while it runs — confirmed by testing, not assumed (see visuals-compose skill,
// "Reporting render progress"). renderMedia()'s onProgress gives exact renderedFrames/encodedFrames/progress on every
// tick; this script writes one JSON line per tick to <name>.progress.jsonl next to the output, so progress can be
// read at any moment with `tail -1`, from this or a future session, foreground or background.
//
// Mirrors every setting from remotion.config.ts, because "When using the Node.JS APIs, the config file doesn't
// apply" (that file's own top comment) — Rspack, Tailwind, the ANGLE GL renderer (WebGL needs it, see
// visuals-compose), yuv420p + BT.709 limited range for YouTube.
//
// Usage: node render.mjs <compositionId> <outputPath> [--frames=start-end] [--concurrency=N]
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const [, , compositionId, outputPath, ...rest] = process.argv;
if (!compositionId || !outputPath) {
  console.error("Usage: node render.mjs <compositionId> <outputPath> [--frames=start-end] [--concurrency=N]");
  process.exit(1);
}
const flag = (name) => rest.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const framesArg = flag("frames");
const frameRange = framesArg ? framesArg.split("-").map(Number) : undefined;
const concurrency = flag("concurrency") ? Number(flag("concurrency")) : undefined;

const chromiumOptions = { gl: "angle" }; // WebGL2 needs this in headless Chrome on Remotion 4.x — see visuals-compose

const progressPath = outputPath.replace(/\.[^.]+$/, "") + ".progress.jsonl";
fs.writeFileSync(progressPath, "");
const log = (obj) => fs.appendFileSync(progressPath, JSON.stringify({ t: new Date().toISOString(), ...obj }) + "\n");

console.log("Bundling...");
const bundleLocation = await bundle({
  entryPoint: path.join(process.cwd(), "src/index.ts"),
  bundlerOverride: enableTailwind,
  rspack: true,
});

const composition = await selectComposition({ serveUrl: bundleLocation, id: compositionId, chromiumOptions });
log({ stage: "bundled", compositionId, width: composition.width, height: composition.height, fps: composition.fps, durationInFrames: composition.durationInFrames });
console.log(`Rendering ${compositionId}: ${composition.width}x${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames -> ${outputPath}`);
console.log(`Progress: tail -f ${progressPath}`);

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: "h264",
  outputLocation: outputPath,
  chromiumOptions,
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  jpegQuality: 90,
  overwrite: true,
  concurrency,
  frameRange,
  onProgress: ({ progress, renderedFrames, encodedFrames, stitchStage, renderedDoneIn, encodedDoneIn }) => {
    log({ stage: stitchStage, progress: Math.round(progress * 1000) / 1000, renderedFrames, encodedFrames, renderedDoneIn, encodedDoneIn });
  },
});
log({ stage: "done" });
console.log("Done:", outputPath);
