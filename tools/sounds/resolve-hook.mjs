// Node module-resolution hook (requires Node >= 22.15 for module.registerHooks).
//
// @kabelsalat/web@0.4.1 (a dependency of @strudel/core) declares "main": "dist/index.js",
// which is a browser-only build with no exports. Bundlers pick "module" (dist/index.mjs),
// but Node picks "main", so `import { SalatRepl } from '@kabelsalat/web'` fails.
// This hook redirects that package to its .mjs build so @strudel/core loads in Node.
// Remove it if a future @strudel/core / @kabelsalat/web fixes the package entry.

import { registerHooks } from 'node:module';

export function installResolveHook() {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      const resolved = nextResolve(specifier, context);
      if (specifier === '@kabelsalat/web') {
        return { ...resolved, url: resolved.url.replace(/dist\/index\.js$/, 'dist/index.mjs') };
      }
      return resolved;
    },
  });
}
