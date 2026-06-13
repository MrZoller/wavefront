# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
