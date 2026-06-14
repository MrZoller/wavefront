# Brand & identity

Wavefront's visual identity is deliberately minimal and on-aesthetic — a precise instrument, not a
marketing site. Every visual either **identifies the product** or **teaches a concept**; nothing is
ornamental, and there's no separate brand palette (the mark uses the existing design tokens).

## The mark

<img src="../public/icon-512.png" alt="Wavefront mark" width="88" />

Concentric wave crests radiating from a source — a **wavefront** propagating outward. It's the
product's namesake and the literal shape a wavefront makes leaving an antenna, so the glyph teaches
the concept rather than decorating. One accent color: the signal-green token (`#3ef0a0`) on
transparent; the favicons add a dark tile behind it (see below).

- **Single source of truth:** [`public/wavefront-mark.svg`](../public/wavefront-mark.svg). The app
  wordmark and every favicon derive from this one file.
- **Wordmark / lockup:** [`src/components/Wordmark.tsx`](../src/components/Wordmark.tsx) pairs the
  mark with “Wavefront” in the UI sans (Inter), signal-green with the app's phosphor glow. It sizes
  to the surrounding text, and is reused in the landing header and the sidebar so the brand reads the
  same everywhere.

## Favicons

Generated from the mark by
[`scripts/generate-favicons.mjs`](../scripts/generate-favicons.mjs) — re-run it after editing the
mark:

```bash
node scripts/generate-favicons.mjs
```

The favicons place the glyph on a dark tile so the bright green stays legible on light browser chrome
and the silhouette stays bold at 16×16:

- `public/favicon.svg` — rounded-tile SVG, the primary icon for modern browsers.
- `public/favicon-16.png`, `public/favicon-32.png` — classic tab / bookmark fallbacks.
- `public/apple-touch-icon.png` (180) — iOS home screen.
- `public/icon-192.png`, `public/icon-512.png` — PWA / installed icon, wired in
  [`public/site.webmanifest`](../public/site.webmanifest).

All are referenced from `index.html`.

## README imagery

The README opens with the wordmark and a hero shot, both produced by the screenshot pipeline
(`npm run screenshots` → `docs/images/`), so the docs never drift from the app. The hero is currently
the static GDOP heatmap; the intended upgrade is a short GIF of a live interaction (dragging a
receiver while the precision field repaints), with the static shot as the documented fallback until
that capture is added.
