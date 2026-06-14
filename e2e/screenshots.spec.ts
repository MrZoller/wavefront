import { test, expect } from '@playwright/test';
import path from 'node:path';

const IMG_DIR = path.resolve(import.meta.dirname, '../docs/images');

/**
 * Captures the marquee scenes into docs/images/ (brief §14). As tracks grow, add a block per
 * marquee scene here so the README/track-doc gallery regenerates with the UI.
 */

test('track overview (landing)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wavefront' }).first()).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'overview.png') });
});

test('rotating phasor module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'The Rotating Phasor / IQ' }).first().click();
  await expect(page.getByRole('img', { name: /rotating phasor/i })).toBeVisible();
  // Let the phasor spin to a visually interesting (non-zero) angle before capturing.
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(IMG_DIR, 'rotating-phasor.png') });
});

test('phase difference module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Phase Difference' }).first().click();
  await expect(page.getByRole('img', { name: /plane wave arriving/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'phase-difference.png') });
});

test('cross-correlation module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cross-Correlation as a Lag Finder' }).first().click();
  await expect(page.getByRole('img', { name: /cross-correlation versus lag/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'cross-correlation.png') });
});

test('interferometer module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Two-Element Interferometer' }).first().click();
  await expect(page.getByRole('img', { name: /draggable emitter/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'interferometer.png') });
});

test('beamforming module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Beamforming / Array Pattern' }).first().click();
  await expect(page.getByRole('img', { name: /polar array gain pattern/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'beamforming.png') });
});

test('AoA cross-fix module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AoA Cross-Fixing' }).first().click();
  await expect(
    page.getByRole('application', { name: /DF sites with lines of bearing/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'aoa-cross-fix.png') });
});

test('TDOA module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'TDOA Multilateration' }).first().click();
  await expect(
    page.getByRole('application', { name: /hyperbolas of constant range difference/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'tdoa.png') });
});

test('GDOP heatmap module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'GDOP Heatmap' }).first().click();
  await expect(page.getByRole('application', { name: /GDOP heatmap/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'gdop-heatmap.png') });
});

test('FDOA module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'FDOA (Doppler Difference)' }).first().click();
  await expect(page.getByRole('application', { name: /Doppler-difference field/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'fdoa.png') });
});

test('symbol mapping module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Symbol Mapping' }).first().click();
  await expect(
    page.getByRole('img', { name: /constellation with the mapped symbols/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'symbol-mapping.png') });
});

test('noisy channel module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'The Noisy Channel' }).first().click();
  await expect(page.getByRole('img', { name: /received symbols spread by noise/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'noisy-channel.png') });
});

test('pulse shaping module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pulse Shaping' }).first().click();
  await expect(page.getByRole('img', { name: /pulse-shaped waveform/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'pulse-shaping.png') });
});

test('matched filter module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Matched Filter' }).first().click();
  await expect(page.getByRole('img', { name: /eye diagram of the matched-filter/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'matched-filter.png') });
});

test('up/downconversion module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Up/Downconversion' }).first().click();
  await expect(page.getByRole('img', { name: /passband on the wire/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'upconversion.png') });
});

test('send a message module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Send a Message' }).first().click();
  await expect(
    page.getByRole('img', { name: /received symbols for the transmitted message/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'send-a-message.png') });
});
