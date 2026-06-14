# FFT, windows, and the spectrum

> Source: [`src/dsp/fft.ts`](../../src/dsp/fft.ts), [`src/dsp/window.ts`](../../src/dsp/window.ts),
> [`src/dsp/spectrum.ts`](../../src/dsp/spectrum.ts).
> Verified by: [`fft.test.ts`](../../src/dsp/fft.test.ts),
> [`spectrum.test.ts`](../../src/dsp/spectrum.test.ts).

## The DFT as a change of basis

The DFT projects a signal onto a bank of complex sinusoids — each output bin is the correlation of
the signal with one frequency:

```
X[k] = Σ_n x[n]·e^{−j2πkn/N}                 (dft — the O(N²) reference)
```

`fft` is the radix-2 Cooley–Tukey version (O(N log N), power-of-two lengths); `ifft` inverts it via
the conjugate trick. The tests pin `fft` against `dft`, a single-bin tone, the inverse round-trip,
and Parseval (energy conservation up to 1/N).

## Windows

A finite block has hard edges that leak across the spectrum. `windowFn` tapers it —
`rectangular`/`hann`/`hamming`/`blackman` — trading mainlobe width (resolution) for sidelobe level
(leakage).

## Spectrum & spectrogram

- `magnitudeSpectrumDb` — window → zero-pad to a power of two → `fft` → `fftShift` → dB normalized to
  a 0 dB peak (centered, −fs/2 … +fs/2).
- `spectrogram` — a short-time FT: slide a window in `hop` steps, transform each block, stack the
  centered magnitude columns into a `frames × fftSize` waterfall.

## Where it's used

Every Track C view (spectrum, spectrogram), OFDM's IFFT modulator, and the classifier's spectral
features. The FFT/window primitives are also the foundation for Track D.
