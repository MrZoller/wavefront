import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Internal organizing vocabulary — layer numbers (Layer 0/1/2…) and track letters (Track A–F) — is
 * build-time scaffolding. Users never see it; the UI shows human names ("Direction Finding &
 * Geolocation", "Foundations", "The Transmit Chain"). So user-facing copy must never reference
 * `Layer N` / `Track X`: a cross-reference uses the human module/track name (linked where the
 * glossary already does, via `<Term>`) or restates the concept. See CONTRIBUTING → "User-facing
 * copy: no internal layer/track vocabulary".
 *
 * This guards the rendered layer. Comments are stripped first, because the scaffolding is *expected*
 * there — module docstrings (`brief §7, Track D Layer 0`) and the registry's `// Track A` headers
 * are authoring surfaces. What's left is code + JSX text, where `Layer <n>` / `Track <A–F>` only
 * occur in strings the user actually reads.
 *
 * Badges are the same rule applied to status tokens (`stub` → "Conceptual", not a raw "STUB"); those
 * are mapped through `moduleStatusBadge()` and guarded by `src/components/layout/Sidebar.test.tsx`.
 */
const ROOT = join(import.meta.dirname, '..');
const USER_FACING_DIRS = ['modules', 'components', 'registry', 'glossary'].map((d) =>
  join(ROOT, d)
);
const USER_FACING_FILES = [join(ROOT, 'config.ts')];

const stripComments = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments, incl. /** … */ docstrings
    .replace(/(^|[^:])\/\/[^\n]*/gm, '$1'); // line comments (the [^:] spares URLs like http://)

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// Capital-L "Layer <n>" / "Track <A–F>" — the rendered coordinates, not identifiers like
// `layerNames`, `TrackId`, or `getTrackLayers`.
const LEAK = /\bLayer \d|\bTrack [A-F]\b/;

describe('user-facing copy never leaks internal layer/track vocabulary', () => {
  it('no rendered string references "Layer N" or "Track X"', () => {
    const files = [...USER_FACING_DIRS.flatMap(walk), ...USER_FACING_FILES].filter(
      (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)
    );
    const offenders = files
      .map((f) => ({ f, m: stripComments(readFileSync(f, 'utf8')).match(LEAK) }))
      .filter((x) => x.m)
      .map((x) => `${x.f}: …${x.m![0]}…`);
    expect(
      offenders,
      `User-facing copy must use human module/track names (or restate the concept), not internal\ncoordinates:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
