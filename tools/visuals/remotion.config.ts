/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);
// slow-drift renders a WebGL shader to canvas; on Remotion 4.x (pre-5.0) the local default
// GL backend is null, which fails to acquire a WebGL context in headless Chrome — angle fixes it.
// See https://www.remotion.dev/docs/troubleshooting/webgl2-context
Config.setChromiumOpenGlRenderer("angle");

// YouTube's recommended upload format: H.264 High, yuv420p, limited (TV) range, tagged BT.709. Without
// these the render came out as yuvj420p (full range) with untagged/bt470bg color, which YouTube can
// interpret with shifted contrast and saturation — noticeable on this palette's very dark tones.
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
