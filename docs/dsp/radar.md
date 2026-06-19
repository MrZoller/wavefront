# Radar synthesis: pulse compression & the range-Doppler map

> Source: [`src/dsp/radar.ts`](../../src/dsp/radar.ts), [`src/dsp/correlation.ts`](../../src/dsp/correlation.ts).
> Verified by: [`radar.test.ts`](../../src/dsp/radar.test.ts), [`correlation.test.ts`](../../src/dsp/correlation.test.ts).

## The idea (plain language)

Radar's core signal processing is primitives you have already built, aimed outward. An **echo** is the
transmitted [LFM chirp](./modulation.md) delayed by the round-trip time-of-flight (range) and
phase-shifted across pulses by the target's motion (Doppler). **Pulse compression** is the
[matched filter](./pulse.md) — correlate the echo against the chirp — collapsing that long echo into a
sharp peak at the target's range. **Doppler processing** is an [FFT](./fft.md) taken across pulses
(slow-time). Stacking the two gives the **range-Doppler map**.

Everything is synthetic and illustrative: normalized units only — range in fast-time samples (range
bins), Doppler in cycles per pulse. No real waveforms, PRFs, frequencies, or system parameters.

## The echo model

```
rx[p][n] = Σ_targets  aₖ · tx[n − rangeBinₖ] · e^{j·2π·dopplerₖ·p}  +  noise        (echoPulses)
```

`echoPulses(tx, targets, nPulses, windowLen, noiseSigma, seed)` returns a `nPulses × windowLen` cube:
each target lays the transmitted chirp `tx` down at its `rangeBin` (the round-trip delay) and advances
its phase by `2π·doppler` from one pulse to the next (the slow-time axis). Complex AWGN of total
per-sample σ `noiseSigma` is added, deterministic for a given `seed` (reusing the from-scratch
`gaussianNoise` generator for the I and Q rails).

## Pulse compression (the matched filter)

`crossCorrelateComplex(ref, sig)` is the matched filter for complex (I/Q) waveforms:

```
c[ℓ] = Σ_n  conj(ref[n]) · sig[n + ℓ]          (crossCorrelateComplex)
```

Conjugating the reference is what makes it a matched filter — at the aligning lag every term becomes
`|ref[n]|²`, a real positive sum, so the magnitude peaks there. It reduces exactly to the real
[`crossCorrelate`](./cross-correlation.md) for real inputs and keeps the same sign convention: if
`sig[n] = ref[n − D]`, the peak lands at `ℓ = D`. `pulseCompress(rxPulse, tx, rangeBins)` runs this
against the transmitted chirp and returns the magnitude range profile — the long, low-power echo
collapsed into one sharp spike at the target's range bin.

The **time-bandwidth product** `timeBandwidthProduct(chirpLen, bandwidth)` = duration × swept
bandwidth is, to within a constant, the **compression ratio** — `compressionRatio` measures it as the
chirp length over the −3 dB main-lobe width of the compressed peak. That is the textbook statement of
pulse-compression gain: a long, gentle pulse on transmit, a sharp one after the matched filter, with
resolution ∝ T·B.

## The range-Doppler map

`rangeDopplerMap(rx, tx, rangeBins)` pulse-compresses every pulse (fast-time → range), then takes an
FFT of the compressed value across pulses at each range bin (slow-time → Doppler), `fftShift`ed so a
stationary target sits on the centre row. It returns a `rangeBins × nPulses` grid of magnitudes whose
peak is at the target's (range, velocity). `dopplerBin(f, n)` gives the shifted bin a normalized
Doppler `f` lands in (the inverse of the `fftShift` reordering). `nPulses` must be a power of two.

## What the tests pin down

- A single echo compresses to a peak **exactly at the target's range bin**, and the matched-filter
  peak magnitude equals the chirp energy `Σ|tx|²` (≈ the sample count for a unit chirp).
- The range bin is still recovered at low SNR (matched-filter processing gain), and two targets show
  up at their two range bins.
- The range-Doppler peak lands at the target's `(range, dopplerBin(f, n))`; a stationary target sits
  on the centre Doppler row; two targets at one range separate in velocity.
- The complex matched filter reduces to the real cross-correlation for real inputs, and matches a
  hand-computed conjugated example.
- The compression ratio of an LFM ≈ its time-bandwidth product (within tolerance), and a wider sweep
  compresses to a higher ratio.

## Where it's used

The **Pulse Compression & Range-Doppler** module (Track C, Layer 2 — a synthesis scene) — the
transmitted chirp and received echo, the matched-filter compressed peak, and the range-Doppler map,
all driven live by target range, velocity, chirp sweep, SNR, and pulse count. It is a deliberately
bounded synthesis: a strong test that the chirp, matched-filter, FFT, and noise primitives compose
cleanly when aimed outward.
