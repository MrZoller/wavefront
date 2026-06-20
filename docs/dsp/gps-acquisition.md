# GPS acquisition: finding a signal below the noise

> Source: [`src/dsp/gps.ts`](../../src/dsp/gps.ts), [`src/dsp/waveforms.ts`](../../src/dsp/waveforms.ts) (`pnCode`, `processingGainDb`).
> Verified by: [`gps.test.ts`](../../src/dsp/gps.test.ts), [`fft.test.ts`](../../src/dsp/fft.test.ts).

## The idea (plain language)

GPS is the canonical real application of three things built elsewhere in this app —
[spread spectrum](./modulation.md), [correlation](./cross-correlation.md), and
[multilateration](./geolocation.md) — plus one genuinely new idea: **recovering a signal that sits
below the noise floor**, and reading **range** off the correlation peak's position.

Each satellite endlessly repeats a known pseudo-random (**PRN**) spreading code. The received samples
are that code **delayed by a code phase** (its travel time) and **Doppler-shifted** by the relative
motion, buried in noise at a **negative SNR** — plot them and they are indistinguishable from noise. You
receive it anyway by **correlating against the code you already know**: the spread-spectrum **processing
gain** lifts a sharp peak out of the noise, and _where_ that peak sits on the code-phase axis is a
ranging measurement — a **pseudorange**. Since neither the code phase nor the Doppler is known, the
search runs over **both at once**.

Everything is synthetic and illustrative: a synthetic PRN code, normalized units only — code phase in
chips, Doppler in cycles per code period. This is the **open civilian** (C/A-style) acquisition only; no
real PRN assignments, frequencies, or ephemeris.

## The sub-noise signal model

```
rx[n] = code[(k − codePhase) mod L] · e^{j·2π·doppler·n}  +  noise,   k = n mod L        (prnReceived)
```

`prnReceived(code, { codePhase, doppler, snrDb, periods, seed })` lays the length-`L` PRN code down,
cyclically delayed by `codePhase` chips and advanced in phase by the Doppler carrier, then adds complex
AWGN. The clean signal has unit power per sample, so the per-sample noise σ is `10^(−snrDb/20)` — a
**negative** `snrDb` puts the signal genuinely below the noise floor (reusing the from-scratch
`gaussianNoise` generator for the I and Q rails).

## Despreading is the processing gain, run to acquire

`codePhaseProfile(received, code, doppler, periods)` wipes off a Doppler estimate, circular-correlates
each code period against the local code, and coherently sums across periods. The peak lands at the true
code phase; one despread period lifts it to `Σ|code|² = L`, so the gain in dB is exactly the Spread
Spectrum module's `processingGainDb(L)` = `10·log₁₀(L)`. Integrate `P` periods and the peak grows ∝ `P`
(another `10·log₁₀(P)`), while the noise floor grows only ∝ `√P` — which is why a signal lost at one
integration length reappears at a longer one. This is the despreader the learner already saw, run in
reverse to **acquire**.

## The acquisition surface

```
surface[c][·] = |fftShift(fft_p( circularCorr_c(period_p) ))|        (acquisitionSurface)
```

`acquisitionSurface(received, code, periods)` circular-correlates every code period against the local
code (the **code-phase** axis), then takes an [FFT](./fft.md) of that complex correlation across periods
at each code phase (the **Doppler** axis), `fftShift`ed so a stationary signal sits on the centre row.
It returns an `L × periods` grid whose bright peak is at the signal's (code phase, Doppler);
`acquisitionPeak` reads back the argmax, and the shared `fftShiftedBin(f, n)` gives the Doppler bin a
normalized shift lands in. `periods` must be a power of two.

This is structurally the [radar range-Doppler map](./radar.md): a 2D correlation search → peak →
measurement, with per-period circular correlation in place of per-pulse pulse compression and an FFT
across code periods in place of across pulses. The two scenes draw the surface with the same
`AcquisitionHeatmap` component (axes parameterized: range/code-phase × Doppler).

## What the tests pin down

- The acquisition peak lands at the true `(code phase, Doppler bin)` for a known input, and a stationary
  (zero-Doppler) signal sits on the centre Doppler row.
- One despread code period realizes the spread-spectrum processing gain `Σ|code|² = L` =
  `10·log₁₀(L)` dB, and coherent integration over `P` periods multiplies the despread peak by `P`.
- A signal **15 dB below the noise** is acquired once enough code periods are integrated, the peak
  lifting further out of the noise as integration grows, and **vanishing** below a deep enough SNR.

## Where it's used

The **GPS Acquisition** module (Track C, Layer 2 — a synthesis scene) — the known code versus the
buried received samples, the despread correlation peak (whose position is the pseudorange), and the
draggable code-phase × Doppler acquisition surface, all driven live by code phase, Doppler, SNR, and
integration length. It is a deliberately bounded synthesis: a strong test that the PRN-code, correlation,
FFT, and noise primitives compose when aimed at the canonical sub-noise problem. Four acquired
satellites fix a position by [multilateration](./geolocation.md) — the geometry the GDOP Heatmap and
TDOA Multilateration modules already teach — which this module links to rather than rebuilds. Tracking
loops, the navigation-message decode, and ionospheric corrections are named directions, not built here;
restricted/encrypted signals and spoofing/jamming are out of scope.
