import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The signal accent lives once in `src/design/tokens.ts` (`colors.signal = #3ef0a0`), mirrored as
 * the `--color-signal` CSS custom property in `index.css`. Every other use must read the token —
 * directly, or via `withAlpha(colors.signal, α)` / `signalRgb` for `<canvas>` 2D contexts and
 * gradient stops that can't resolve a CSS `var()`. This guards against the hex / rgb literal
 * silently reappearing in a component (CV-1 in docs/AUDIT.md), the same way the Slider and
 * internal-vocabulary tests guard their conventions.
 */
const ROOT = join(import.meta.dirname, '..');
// The two sanctioned homes for the literal value: the token definition and its CSS mirror.
const ALLOWED = [join(ROOT, 'design', 'tokens.ts'), join(ROOT, 'index.css')];
// The signal accent as a hex, or as raw RGB channels with any inter-channel spacing.
const SIGNAL_LITERAL = /#3ef0a0\b|\b62\s*,\s*240\s*,\s*160\b/i;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('signal-green is read from the design token, never hard-coded', () => {
  it('no source file inlines the signal accent as a hex or rgb literal', () => {
    const files = walk(ROOT).filter(
      (f) => /\.(tsx?|css)$/.test(f) && !/\.test\.tsx?$/.test(f) && !ALLOWED.includes(f)
    );
    const offenders = files
      .map((f) => ({ f, m: readFileSync(f, 'utf8').match(SIGNAL_LITERAL) }))
      .filter((x) => x.m)
      .map((x) => `${x.f}: …${x.m![0]}…`);
    expect(
      offenders,
      `Read the token instead of the literal — colors.signal, withAlpha(colors.signal, α), or\nsignalRgb (for canvas colormap/gradient stops):\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
