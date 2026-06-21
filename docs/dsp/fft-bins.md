# FFT bins, zero-padding, and resolution

> Source: [`src/dsp/binning.ts`](../../src/dsp/binning.ts).
> Verified by: [`binning.test.ts`](../../src/dsp/binning.test.ts).
> Reuses the from-scratch [`fft`](./fft.md); nothing here re-implements the transform.

## Two different Ns

A spectrum is governed by two lengths, and conflating them is the classic beginner trap:

- **N_real** — how many _true_ samples you captured. It sets the **frequency resolution**: the
  closest two tones a block can tell apart is ≈ `fs / N_real` (the DFT bin-width / Rayleigh limit).
- **N_fft** — how many points you _transform_, after zero-padding the capture up to `N_fft`. It sets
  the **bin spacing**, `fs / N_fft`: how finely the (fixed-resolution) spectrum is sampled for
  drawing.

## Zero-padding interpolates — it adds no information

`zeroPad` appends zeros up to `N_fft`; the zeros contribute nothing to the sum, so `fft` still
measures the _same_ underlying spectrum (the DTFT of the capture) — just at more points. The test
pins the exact consequence: **double `N_fft` and every original bin reappears untouched, with one new
sample dropped exactly between each pair** (`coarse[k] == fine[2k]`). That is sinc interpolation: a
smoother, finer-drawn picture of a fixed curve, not a finer curve. `binSpacing` returns `fs / N_fft`;
a one-sided spectrum has `N_fft/2 + 1` bins, so padding visibly draws _more dots_.

## More bins ≠ more resolution; more data is

`frequencyResolution` returns `fs / N_real`, independent of how much you zero-pad. The headline test
(`prominentPeakCount` over `paddedMagnitudeSpectrum`) machine-proves the lesson, in the same spirit
as the convolution module's cross-link proof:

- two tones closer than `fs / N_real` stay **one** peak no matter how far you crank `N_fft`
  (32 → 4096 bins);
- the **same two tones** become **two** peaks once `N_real` is large enough — more captured signal,
  not more bins.

Throughout, the capture carries the bare block's implicit **rectangular window** (no taper); trading
mainlobe width for sidelobe level is the separate [Windowing & Leakage](./fft.md#windows) lesson.

## Where it's used

The **FFT Bins & Zero-Padding** module (Fundamentals → Sampling & the Frequency Domain). All example
signals are synthetic; the 1 kHz sample rate and 200/230 Hz tones are illustrative round numbers.
