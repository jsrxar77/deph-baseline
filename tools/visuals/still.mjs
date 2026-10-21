#!/usr/bin/env node
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , compositionId, outputPath, frameStr, scaleStr] = process.argv;
if (!compositionId || !outputPath) {
  console.error("Usage: node still.mjs <compositionId> <outputPath> [frame=0] [scale=1]");
  process.exit(1);
}

const frame = frameStr ? parseInt(frameStr, 10) : 0;
const scale = scaleStr ? parseFloat(scaleStr) : 1;
const chromiumOptions = { gl: "angle" };

console.log("Bundling for still render...");
const bundleLocation = await bundle({
  entryPoint: path.join(__dirname, "src/index.ts"),
  bundlerOverride: enableTailwind,
  rspack: true,
});

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  chromiumOptions,
});

console.log(`Rendering still frame ${frame} of ${compositionId} (${composition.width}x${composition.height}) -> ${outputPath}`);

await renderStill({
  composition,
  serveUrl: bundleLocation,
  output: outputPath,
  frame,
  chromiumOptions,
  scale,
  imageFormat: "png",
});

console.log("Done:", outputPath);
