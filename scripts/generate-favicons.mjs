/**
 * Generate the favicon set from the single source-of-truth glyph (`public/wavefront-mark.svg`).
 *
 * The app wordmark uses the bare green glyph on the app's own dark background. Browser tabs and OS
 * icon surfaces aren't always dark, so the favicons place that same glyph on a dark tile — bright
 * signal-green stays legible on light chrome, and the silhouette stays bold at 16px. Everything here
 * derives from the one mark file, so the glyph has a single source of truth (run after editing it):
 *
 *   node scripts/generate-favicons.mjs
 *
 * Outputs (all in public/): favicon.svg (rounded tile, for the modern SVG favicon) and PNG
 * fallbacks favicon-16/32, apple-touch-icon (180), icon-192, icon-512 (square tiles).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const pub = (p) => fileURLToPath(new URL(`../public/${p}`, import.meta.url));

const TILE = '#0d1418'; // surface token — a hair above the bg so the icon reads even on a black tab.
// The glyph lives in a 0..32 box but leans left and nearly fills the height; nudge + shrink it so it
// sits centered inside the tile with even padding.
const PLACE = 'translate(5.57 4.8) scale(0.7)';

const raw = readFileSync(pub('wavefront-mark.svg'), 'utf8');
const glyph = raw.slice(raw.indexOf('<g'), raw.lastIndexOf('</svg>')).trim();

const compose = (rx) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <title>Wavefront</title>
  <rect width="32" height="32" rx="${rx}" fill="${TILE}" />
  <g transform="${PLACE}">
    ${glyph}
  </g>
</svg>
`;

const rounded = compose(7); // app-icon rounding for the crisp SVG favicon
const square = compose(0); // full-bleed for raster fallbacks / installed icons (the OS masks its own)

writeFileSync(pub('favicon.svg'), rounded);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function raster(svg, size, name) {
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>*{margin:0;padding:0}</style><img src="${uri}" width="${size}" height="${size}">`
  );
  await page.locator('img').screenshot({ path: pub(name) });
  console.log(`  ${name}  ${size}x${size}`);
}

console.log('favicon.svg');
await raster(rounded, 16, 'favicon-16.png');
await raster(rounded, 32, 'favicon-32.png');
await raster(square, 180, 'apple-touch-icon.png');
await raster(square, 192, 'icon-192.png');
await raster(square, 512, 'icon-512.png');

await browser.close();
console.log('done');
