// Shared Strudel evaluation: re-implements the small part of the browser REPL that `$:` labels,
// `setcpm`/`setcps`, `all` and `_$:` muting need, so both the inspector and the render script
// evaluate a .strudel file identically. If a Strudel update adds REPL-level behavior, check here
// first — this is the one place it's implemented, not duplicated per script.
import { installResolveHook } from './resolve-hook.mjs';

// The hook must be installed before @strudel/core is imported (see resolve-hook.mjs), hence
// dynamic imports. Strudel logs banners/warnings while loading; silence them so stdout stays clean.
installResolveHook();
const { log, warn } = console;
console.log = console.warn = () => {};
const core = await import('@strudel/core');
const mini = await import('@strudel/mini');
const tonal = await import('@strudel/tonal');
const { transpiler } = await import('@strudel/transpiler');
Object.assign(console, { log, warn });

const { evalScope, evaluate, Pattern, silence, stack, isPattern, register } = core;

// `only`: optional list of layer keys ('$0', '$3', ...) to keep; every other `$:` layer is left out, as if
// muted. Used by render.mjs --only to render one layer as a stem for a DAW (see docs/daw-bridge.md).
export async function evalStrudel(code, { only } = {}) {
  const pPatterns = {};
  let anonymousIndex = 0;
  let cps = 0.5;

  Pattern.prototype.p = function (id) {
    if (typeof id === 'string' && (id.startsWith('_') || id.endsWith('_'))) return silence;
    if (String(id).includes('$')) id = `${id}${anonymousIndex++}`;
    pPatterns[id] = this;
    return this;
  };
  Pattern.prototype.q = () => silence;

  const allTransforms = [];
  await evalScope(
    core,
    mini,
    tonal,
    {
      all: (t) => (allTransforms.push(t), silence),
      each: () => silence,
      hush: () => silence,
      setcps: (v) => void (cps = v),
      setCps: (v) => void (cps = v),
      setcpm: (v) => void (cps = v / 60),
      setCpm: (v) => void (cps = v / 60),
      cpm: register('cpm', (v, pat) => pat._fast(v / 60 / cps)),
    },
  );

  let { pattern } = await evaluate(code, transpiler);
  const labelled = Object.entries(pPatterns);
  if (labelled.length) {
    let list = [];
    let solo = false;
    for (const [key, value] of labelled) {
      const isSolo = key.length > 1 && key.startsWith('S');
      if (isSolo && !solo) {
        list = [];
        solo = true;
      }
      // Tag each event with its layer so callers can show/group by which `$:` block it came from.
      const tag = (v) => (v !== null && typeof v === 'object' ? { ...v, layer: key } : { value: v, layer: key });
      if ((!solo || isSolo) && (!only || only.includes(key))) list.push(value.fmap(tag));
    }
    pattern = stack(...list);
  }
  for (const t of allTransforms) pattern = t(pattern);
  if (!isPattern(pattern)) pattern = silence;
  return { pattern, cps, layers: labelled.map(([k]) => k), core };
}
