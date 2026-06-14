# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Visual identity: a wave mark, wordmark, and favicons.** A concept-driven mark — concentric wave
  crests radiating from a source (the namesake, and the shape a wavefront actually makes), in the
  signal-green token with no new palette. One source-of-truth glyph (`public/wavefront-mark.svg`)
  feeds a reusable `Wordmark` lockup (mark + word, used in the landing header and the sidebar) and a
  generated favicon set — SVG plus 16/32/180/192/512 PNGs, placed on a dark tile so the green stays
  legible at 16×16 and on light browser chrome — wired into `index.html` with a web manifest. The
  favicons are regenerated from the mark by `scripts/generate-favicons.mjs`; the README opens with
  the wordmark and hero (both captured by the screenshot pipeline), and the mark is documented in
  `docs/brand.md`.

- **A plot's title reads as a title, not a second axis label.** The name of a plot and its top-left
  y-axis label share the same corner; rendered alike, they fused into what looked like one two-line
  caption, so a reader couldn't tell the heading from the axis annotation. A new shared `PlotTitle`
  (`src/components/plots/`) gives the title a proportional heading treatment — distinct from the
  quiet monospace `readout` styling the x- and y-axis captions share as peers — so at a glance
  "Sensor A — reference" reads as the plot's name and "Amplitude" reads as the vertical axis. Adopted
  by every titled plot across Tracks A–D; the styling lives in one component (change it once,
  everywhere), and a test pins that the title never borrows the axis labels' mono treatment. Wording,
  axis placement, and the meaning-vs-unit rules are unchanged — this is purely visual hierarchy.

- **Legible curriculum structure in the nav.** Each track's climb is now visible, driven entirely by
  registry metadata so the sidebar and landing page stay in sync. Modules declare a `layer`, an
  `order` (unique within a track), and at most one `isCapstone`; tracks declare `layerNames`. Both
  views render the result: quiet layer subheaders (`Foundations`, `Angle of Arrival`, `Geolocation`,
  …), per-layer step numbers as a directional cue, and a signal-tinted **Capstone** marker on each
  track's marquee destination (GDOP Heatmap, Send a Message, Modulation Zoo, Channelizer). `order`
  expresses the terminal/synthesis module and `isCapstone` the marquee — allowed to differ (in
  Modulations & Waveforms the Classifier is terminal-by-order while the Zoo is the capstone). A
  landing **scope note** ("publicly available, textbook-level concepts and synthetic signals") sits
  quietly in the footer, and the hero now ties the from-scratch core to verifiability ("checked
  against reference values by the test suite"). Backed by a registry test (one capstone per track,
  every used layer named, unique layer-contiguous order) and documented in `ARCHITECTURE.md` /
  `CONTRIBUTING.md`.

- **Labeled plot axes, by construction.** Axis labels are now a structured `AxisLabel`
  (`{ quantity, unit? }`) that splits meaning from unit, so "show a unit only when the quantity has
  one" is structural — normalized/unitless axes (`Sample`, `Amplitude`, `Normalized frequency`) stay
  honest while `Magnitude (dB)` keeps the dB. The shared Cartesian plots (`TimeSeriesPlot`,
  `SpectrumPlot`, `XYPlot`, `SpectrogramPlot`, `EyeDiagramPlot`) make `xLabel`/`yLabel` **required**
  (a plot can't render unlabeled), with `AXIS` presets for the recurring ones and a shared
  `AxisCaption`; `ConstellationPlot`/`PhasorPlot` draw intrinsic `I`/`Q` axes and `PolarPlot` captions
  bearing/power. Every existing plot across Tracks A–D is backfilled. Backed by a render/prop test
  (`src/components/plots/{axisLabel,plots}.test.tsx`) and documented in `CONTRIBUTING.md` /
  `ARCHITECTURE.md`.

- **Inline glossary (`<Term>`).** A flat source of truth (`src/glossary/glossary.ts`) seeded with
  the jargon across Tracks A–D, surfaced at the point of use by a `<Term id="…">` popover: a phosphor
  dotted underline that opens the term's expansion, a one-line gloss, and a "Learn more →" link into
  the module that teaches it. Mobile-first (tap-to-toggle, Esc/outside-tap dismiss), keyboard-focusable,
  self-reference-aware, and viewport-clamped so it never runs off-page.
- **Consistent-by-construction marking.** Authors write plain copy; a render-time, map-driven matcher
  (`src/glossary/match.ts`) inside `<GlossedText>` marks terms automatically, so highlighting can't
  drift page to page. It is boundary-aware and case-sensitive (no `FM` in "confirm"), separator-aware
  (`QPSK/QAM` → both), longest-match-first (`16-QAM` as one unit), and handles phrases + plurals; it
  enforces teaching-page exclusion and first-use **per section**, with `<NoGloss>` / forced `<Term>`
  escape hatches. Backed by a coverage test (dangling ids, unresolved links, `docs/dsp` coverage) plus
  tokenization and marking regression tests, and the contributor contract in `CONTRIBUTING.md` /
  `ARCHITECTURE.md`.

- **🚧 Track D — Fundamentals.** The foundational back-fill track, six modules across three layers:
  - **Sampling & Aliasing** — samples + the aliased reconstruction; the Nyquist fold.
  - **The DFT as a Change of Basis** — toggle basis bins; each spectrum bar is a dot product.
  - **Windowing & Leakage** — window shape vs. an off-bin tone's leakage (mainlobe/sidelobe trade).
  - **FIR Filtering** — taps (impulse response) ↔ frequency response, with cutoff/length controls.
  - **Decimation & Interpolation** — multirate with an anti-alias toggle (aliasing returns when off).
  - **Channelizer (PFB)** (marquee) — a wide band tiled into channels; bare-FFT vs polyphase toggle
    showing inter-channel leakage appear and vanish, with a channel grid + extracted channel.
- **New `dsp/` primitives (9 tests):** `filter.ts` (`firLowpass` / `firResponseDb`), `multirate.ts`
  (`filterComplex` / `decimate` / `interpolate`), `sampling.ts` (`aliasedFrequency`), and
  `channelizer.ts` (`ddc`, `channelize`, `bareFftProto` / `pfbProto`).
- `docs/dsp/channelization.md` and `docs/tracks/fundamentals.md`.

- **Track B channel completeness (brief §5 Layer 2).** Three additions finish the channel story:
  - **Multipath & Fading** — a direct ray plus a draggable echo; live channel frequency response
    (fading notches), blurred constellation, and a closing eye (ISI).
  - **Carrier Offset & Doppler** — an animated QPSK constellation that tilts under a phase offset and
    spins under a frequency offset (same physics as Doppler).
  - **Send a Message** now plots the live **BER-vs-Eb/N0 waterfall** with the operating point marked.
- **New `dsp/` primitives (7 tests):** `dsp/channel.ts` — `multipath` (FIR) + `channelResponseDb`,
  `applyCfo` (carrier/phase offset), and `berVsSnr`.
- **New shared viz:** `XYPlot` (line plot with log-y + operating-point marker), used for the BER
  curve and channel response.
- `docs/dsp/channel.md`.

- **Analog on-ramp audio.** The AM/FM/PM module now plays its modulated tone via Web Audio (AM
  tremolo vs FM/PM vibrato) — completing Track C, which is now marked **v1**.
- **🚢 Track C — Modulations & Waveforms (v1).** Every scheme's fingerprint, built on a pluggable
  modulator:
  - **Analog: AM / FM / PM** — one message tone modulated three ways with live spectrum.
  - **Modulation Zoo** (marquee) — A/B two schemes across five synchronized views (I/Q,
    constellation, spectrum, eye, spectrogram) at a shared SNR.
  - **OFDM** — QPSK across 64 subcarriers via IFFT + cyclic prefix.
  - **Spread Spectrum** — PN spreading with live processing gain.
  - **Chirp / LFM** — the swept-tone spectrogram diagonal.
  - **Modulation Classifier** (capstone) — identify an unknown scheme from three features.
- **New `dsp/` primitives (22 tests, 128 total):** `fft.ts` (DFT reference + radix-2 FFT/IFFT), `window.ts`,
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
- **New `dsp/` primitives (28 tests):** `dsp/comms.ts` — energy-normalized Gray-coded constellations
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
