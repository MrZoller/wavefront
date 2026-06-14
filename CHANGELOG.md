# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **🚧 Track C — Modulations & Waveforms.** Every scheme's fingerprint, built on a pluggable
  modulator:
  - **Analog: AM / FM / PM** — one message tone modulated three ways with live spectrum.
  - **Modulation Zoo** (marquee) — A/B two schemes across five synchronized views (I/Q,
    constellation, spectrum, eye, spectrogram) at a shared SNR.
  - **OFDM** — QPSK across 64 subcarriers via IFFT + cyclic prefix.
  - **Spread Spectrum** — PN spreading with live processing gain.
  - **Chirp / LFM** — the swept-tone spectrogram diagonal.
  - **Modulation Classifier** (capstone) — identify an unknown scheme from three features.
- **New `dsp/` primitives (27 tests):** `fft.ts` (DFT reference + radix-2 FFT/IFFT), `window.ts`,
  `spectrum.ts` (magnitude spectrum + spectrogram), `modulation.ts` (pluggable `Modulator` + linear
  PSK/QAM, CPFSK/MSK, analog AM/FM/PM), `waveforms.ts` (OFDM, chirp, DSSS), and `features.ts`
  (modulation features + nearest-prototype classifier).
- **New shared viz:** `SpectrumPlot`, `SpectrogramPlot` (waterfall), and `EyeDiagramPlot`.
- `docs/dsp/fft.md`, `docs/dsp/modulation.md`, and `docs/tracks/modulations-and-waveforms.md`.

- **🚢 Track B — Playing a Radio Signal (v1).** A complete new track following one message down the
  transmit/receive chain, end to end:
  - **Symbol Mapping** — group bits into Gray-coded I/Q symbols on a BPSK / QPSK / 16-QAM
    constellation; toggle bits and switch schemes to watch the same bits land differently.
  - **Pulse Shaping** — each symbol launches a raised-cosine pulse; the summed waveform passes
    exactly through the symbol values (ISI-free), and β trades bandwidth for ringing.
  - **Up/Downconversion** — mix complex baseband onto a real carrier (`I·cos − Q·sin`) and back;
    three panes show baseband → passband on the wire → recovered baseband.
  - **The Noisy Channel** — add complex AWGN at a chosen Eb/N0, slice each received point to the
    nearest constellation point, and watch the live bit error rate climb as the clouds collide.
  - **Matched Filter** — root-raised-cosine shaping + matched receiver, shown as a BPSK eye diagram
    that opens and closes with Eb/N0, with live BER.
  - **Send a Message** (capstone) — type text and watch it ride symbols across the noisy channel and
    come back, characters garbling as Eb/N0 drops.
- **New `dsp/` primitives (27 tests):** `dsp/comms.ts` — energy-normalized Gray-coded constellations
  (`BPSK` / `QPSK` / `QAM16`), `bitsToSymbols` / `symbolsToBits` / `nearestSymbol`, `awgn` +
  `noiseSigma` (Eb/N0 → σ), `bitErrorRate`, and `textToBits` / `bitsToText`; `dsp/pulse.ts` —
  `raisedCosine` / `rootRaisedCosine`, `upsample`, FIR `convolve`; `dsp/carrier.ts` — `upconvert` /
  `downconvert` / `lowpass`.
- **New shared viz:** `ConstellationPlot` — an I/Q lattice + received-symbol scatter cloud.
- A `building` track status (distinct from `shipping`/v1) for the navigation shell.
- `docs/dsp/comms.md`, `docs/dsp/pulse.md`, `docs/dsp/carrier.md`, and
  `docs/tracks/playing-a-radio-signal.md`.

- **FDOA (Doppler Difference)** — completes Track A, Layer 2. Two moving platforms sweep past a
  stationary emitter; the difference of their Doppler shifts is a measurable observable whose
  constant-value locus is an _isodoppler_ curve, drawn through the emitter over a diverging
  Doppler-difference heatmap. Drag the receivers, their velocity arrows, the emitter, or the carrier
  `f₀`.
- **New `dsp/` primitives (6 tests):** `radialRate` / `fdoa` (Doppler-difference geolocation) and a
  field-agnostic `isoContour` (marching-squares level-set extractor) in `dsp/contour.ts`.
- **🚢 Track A v1 — Layer 2 Geolocation (the marquee).** Direction Finding & Geolocation is now
  feature-complete for v1:
  - **AoA Cross-Fixing** — lines of bearing cross to a fix, with a 2σ error region that elongates
    with range and shallow geometry (adjustable σθ).
  - **TDOA Multilateration** — receiver-pair hyperbolas of constant range difference, with a
    Gauss–Newton fix tracking the emitter.
  - **GDOP Heatmap** — the whole map colored by geometric dilution of precision; spread the
    receivers for a green basin, cluster/collinear to watch it go red.
- **New `dsp/` primitives (12 tests):** `aoaFix` + error ellipse, `rangeDifference` /
  `hyperbolaPoints` / `tdoaSolve`, and `gdop`, plus 2×2 linear-algebra helpers.
- **New shared viz:** `WorldMap` — a 2D map canvas with a scalar-field heatmap and draggable,
  keyboard-operable site/emitter markers.
- `docs/dsp/geolocation.md` (equations + linked tests).
- **Track A, Layer 1 — Angle of Arrival.** Two new modules:
  - **Two-Element Interferometer** — drag the emitter and watch the phase difference invert into
    lines of bearing; baselines past λ/2 light up the ambiguous candidate rays.
  - **Beamforming / Array Pattern** — steer an N-element ULA and watch the delay-and-sum gain
    pattern (mainlobe + sidelobes) sweep, with grating lobes appearing for d > λ/2.
- **New `dsp/` primitives (12 tests):** ULA `steeringVector`, `delayAndSumPower`, `arrayResponse`
  / `beamPattern` / `toDb`, and `candidateBearings` for phase-ambiguity resolution.
- **New shared viz:** `PolarPlot` (half-polar array/gain pattern with markers).
- `docs/dsp/steering-and-beamforming.md` (equations + linked tests).
- **Track A, Layer 0 complete.** Two new modules round out the Direction Finding primitives:
  - **Phase Difference** — live two-sensor geometry showing the extra path `d·sin(θ)`, the two
    phase-shifted sensor waveforms, `Δr`/`Δφ` readouts, and a `d ≤ λ/2` ambiguity badge.
  - **Cross-Correlation as a Lag Finder** — scrub a reference burst across a noisy record and
    watch the sliding dot product; the correlation peak marks the detected delay.
- **New from-scratch `dsp/` primitives (18 tests):** two-element phase geometry
  (`pathLengthDifference`, `phaseDifference`, `bearingFromPhase`, `isUnambiguous`, `wrapPhase`),
  cross/auto-correlation with peak-lag detection, and a seeded PRNG + Gaussian/bipolar generators.
- `docs/dsp/phase-difference.md` and `docs/dsp/cross-correlation.md` (math + linked tests).
- License copyright holder set to Chris Zoller.
- Project bootstrap: Vite + React + TypeScript + Tailwind v4 + Vitest.
- Repo scaffolding: `.gitignore`, MIT `LICENSE`, ESLint + Prettier + EditorConfig configs,
  CI workflow (`lint → format → test → build`).
- Design tokens for the dark "lab-instrument" aesthetic (`src/design/tokens.ts` + CSS vars).
- Module registry + track navigation shell (sidebar, track overview, module host) — all
  navigation composed from the registry.
- Shared viz library: DPR-aware `useCanvas` hook and a generic `TimeSeriesPlot`.
- Documentation set: `ARCHITECTURE.md`, `docs/README.md`, and the Direction Finding track page.
- **From-scratch DSP core (first primitives):** complex/IQ types and ops, Euler phasor
  (`expj`), and complex-tone generation — with 21 numerical-correctness tests.
- **First module — The Rotating Phasor / IQ** (Track A, Layer 0): a tone shown three ways at
  once (rotating vector on the complex plane, scrolling I/Q waveforms, audible Web Audio tone)
  with a live frequency slider. New shared viz: `PhasorPlot`, `useAnimationFrame`, plus the
  `useToneAudio` hook.
- **Automated screenshot pipeline** (`npm run screenshots`, Playwright) capturing the overview
  and phasor scenes into `docs/images/`, embedded in the README.
- `docs/dsp/complex-and-phasors.md` — the math-honest "go deeper" page linking its tests.
