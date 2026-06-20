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

test('glossary index', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Glossary', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Glossary' })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'glossary.png') });
});

test('wordmark (README header)', async ({ page }) => {
  // Capture the real landing wordmark lockup (mark + word) so the README header tracks the app
  // rather than a hand-made image. A little padding around the heading gives it room to breathe.
  await page.goto('/');
  // Scope to the landing's <main> — the sidebar also has an <h1>Wavefront</h1> (at a smaller size),
  // and it renders first, so an unscoped `.first()` would capture the nav lockup instead.
  const heading = page.getByRole('main').getByRole('heading', { name: 'Wavefront' });
  await expect(heading).toBeVisible();
  // Measure the inline lockup span, not the block-level <h1>: the heading stretches across the full
  // max-w-3xl column, which would leave the wordmark in the left third of a mostly-empty frame (and
  // shrunk to a third once the README sets width=360). The span is fit-content, so its box is tight.
  const lockup = heading.locator('span').first();
  const box = await lockup.boundingBox();
  if (!box) throw new Error('wordmark lockup has no bounding box');
  // Frame the lockup with room for the glow, but keep the bottom inside the 12px gap to the
  // description below so only the mark + word are captured.
  const padX = 20;
  const padTop = 16;
  const padBottom = 2;
  await page.screenshot({
    path: path.join(IMG_DIR, 'wordmark.png'),
    clip: {
      x: box.x - padX,
      y: box.y - padTop,
      width: box.width + padX * 2,
      height: box.height + padTop + padBottom,
    },
  });
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

test('multipath module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Multipath & Fading' }).first().click();
  await expect(page.getByRole('img', { name: /channel frequency response/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'multipath-fading.png') });
});

test('carrier offset module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Carrier Offset & Doppler' }).first().click();
  await expect(page.getByRole('img', { name: /constellation rotating/i })).toBeVisible();
  await page.waitForTimeout(400); // let it spin to a non-trivial angle
  await page.screenshot({ path: path.join(IMG_DIR, 'carrier-offset.png') });
});

test('analog modulation module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Analog: AM / FM / PM' }).first().click();
  await expect(page.getByRole('img', { name: /FM spectrum/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'analog-modulation.png') });
});

test('modulation zoo module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Modulation Zoo' }).first().click();
  await expect(page.getByRole('img', { name: /QPSK spectrogram/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'modulation-zoo.png') });
});

test('ofdm module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'OFDM' }).first().click();
  await expect(page.getByRole('img', { name: /OFDM occupied-band/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'ofdm.png') });
});

test('spread spectrum module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Spread Spectrum' }).first().click();
  await expect(page.getByRole('img', { name: /Narrowband data spectrum/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'spread-spectrum.png') });
});

test('chirp module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Chirp / LFM' }).first().click();
  await expect(page.getByRole('img', { name: /Chirp spectrogram/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'chirp-lfm.png') });
});

test('modulation classifier module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Modulation Classifier' }).first().click();
  await expect(page.getByRole('img', { name: /Unknown signal spectrum/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'modulation-classifier.png') });
});

test('pulse compression & range-Doppler module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pulse Compression & Range-Doppler' }).first().click();
  const map = page.getByRole('img', { name: /range-Doppler map/i });
  await expect(map).toBeVisible();
  // The drag-watch loop: scroll the column to the bottom, where the sticky control rail rests just
  // below the marquee map. The range/velocity sliders and the map must be co-visible AND not
  // overlap — dragging must move the blob without scrolling. (CONTRIBUTING → "Keep controls
  // co-visible with their target plot".)
  await page.getByRole('main').evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  const rangeSlider = page.getByRole('slider', { name: /Target range/i });
  await expect(map).toBeInViewport();
  await expect(rangeSlider).toBeInViewport();
  await expect(page.getByRole('slider', { name: /Radial velocity/i })).toBeInViewport();
  // The map sits fully above the control rail (no occlusion).
  const mapBox = await map.boundingBox();
  const sliderBox = await rangeSlider.boundingBox();
  if (!mapBox || !sliderBox) throw new Error('map or slider not laid out');
  expect(mapBox.y + mapBox.height).toBeLessThanOrEqual(sliderBox.y + 1);
  await page.screenshot({ path: path.join(IMG_DIR, 'range-doppler.png') });
});

test('sampling & aliasing module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sampling & Aliasing' }).first().click();
  await expect(
    page.getByRole('img', { name: /aliased low-frequency reconstruction/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'sampling-aliasing.png') });
});

test('dft basis module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'The DFT as a Change of Basis' }).first().click();
  await expect(page.getByRole('img', { name: /DFT magnitude spectrum bars/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'dft-basis.png') });
});

test('windowing module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Windowing & Leakage' }).first().click();
  await expect(page.getByRole('img', { name: /window spectral leakage/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'windowing.png') });
});

test('fir filter module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'FIR Filtering' }).first().click();
  await expect(page.getByRole('img', { name: /FIR low-pass frequency response/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'fir-filter.png') });
});

test('multirate module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Decimation & Interpolation' }).first().click();
  await expect(page.getByRole('img', { name: /Original wideband spectrum/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'multirate.png') });
});

test('channelizer module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Channelizer (PFB)' }).first().click();
  await expect(page.getByRole('img', { name: /Wide spectrum tiled into channels/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'channelizer.png') });
});

test('quantization module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Quantization & Bit Depth' }).first().click();
  await expect(page.getByRole('img', { name: /quantized staircase/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'quantization.png') });
});

test('gain / AGC module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Gain, Clipping & AGC' }).first().click();
  await expect(page.getByRole('img', { name: /amplified, clipped/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'gain-agc.png') });
});

test('receiver signal chain module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Receiver Signal Chain' }).first().click();
  await expect(page.getByRole('group', { name: /Receive signal chain/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'signal-chain.png') });
});

test('SDR architectures module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'SDR Architectures' }).first().click();
  await expect(page.getByRole('group', { name: /Superheterodyne architecture/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'sdr-architectures.png') });
});

test('band explorer module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Band Explorer' }).first().click();
  await expect(page.getByRole('img', { name: /radio-band ladder/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'band-explorer.png') });
});

test('radio horizon module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Radio Horizon' }).first().click();
  await expect(page.getByRole('img', { name: /curved Earth with two antennas/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'radio-horizon.png') });
});

test('HF skywave module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'HF Skywave' }).first().click();
  await expect(
    page.getByRole('img', { name: /HF ray reflecting off the ionosphere/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'hf-skywave.png') });
});

test('propagation-aware geolocation (skywave drift)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AoA Cross-Fixing' }).first().click();
  await expect(
    page.getByRole('application', { name: /DF sites with lines of bearing/i })
  ).toBeVisible();
  // Flip the line-of-bearing toggle to skywave so the naive fix walks off the true emitter.
  // `exact` avoids matching the sidebar's "HF Skywave & the Ionosphere" nav item.
  await page.getByRole('button', { name: 'HF skywave', exact: true }).click();
  await page.screenshot({ path: path.join(IMG_DIR, 'aoa-skywave-drift.png') });
});

test('channel coding module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Channel Coding (FEC)' }).first().click();
  await expect(page.getByRole('img', { name: /bit error rate versus Eb\/N0/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'channel-coding.png') });
});

test('channel estimation module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Channel Estimation' }).first().click();
  await expect(
    page.getByRole('img', { name: /estimated channel frequency response/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'channel-estimation.png') });
});

test('equalization module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Equalization' }).first().click();
  await expect(
    page.getByRole('img', { name: /constellation re-clustered after equalization/i })
  ).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'equalization.png') });
});

test('synchronization stub', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Synchronization' }).first().click();
  await expect(page.getByRole('img', { name: /tracking-loop block diagram/i })).toBeVisible();
  await page.screenshot({ path: path.join(IMG_DIR, 'synchronization.png') });
});
