# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Fundamentals module: Convolution & the Impulse Response.** A new module in a new **"Systems"**
  stage of **Fundamentals**, slotted _before_ the filtering layer (Channelizer/PFB stays the track's
  marquee — one capstone per track). It names the organizing idea the app already runs on everywhere
  but never taught on its own. The framing leads with the **impulse response**, not "flip, slide,
  multiply, sum": an **LTI system** is completely described by how it answers a single impulse, and
  its output for any signal is a sum of shifted, scaled copies of that response — which _is_
  **convolution**. Three linked interactions on one shared impulse response `h`: (1) **ping the
  system** — drag/sketch the response taps (a draggable, keyboard-operable stem editor with
  grab/grabbing cursor + halos), defining a system by drawing how it answers a ping; (2) the
  **sliding mechanism** — a scrubbable slide position `k` shows the flipped `h` overlapping the
  input, the per-pair products, and one output sample being built, left to right; (3) the **payoff**
  — preset responses that _are_ other modules (a moving-average **low-pass FIR filter**, a flipped
  pulse = the **matched filter**, a spike-plus-echo = **multipath**), run through the same operation
  to wildly different outputs, cross-linked to **FIR Filtering**, **Matched Filter**, and **Multipath
  & Fading** by human name. A "go deeper" rail adds **time convolution = frequency multiplication**
  (why the FFT enables fast convolution), linked to **The DFT as a Change of Basis**. One
  from-scratch, tested `dsp/` primitive backs it (`src/dsp/convolution.ts`: `convolve`,
  `convolveAt`) — surfaced as the **named** concept and reused: pulse shaping now re-exports
  `convolve` from here rather than carrying its own copy. Tests pin identity (a unit impulse returns
  the input), length (`N + M − 1`), commutativity, worked-by-hand examples, `convolveAt`-vs-`convolve`
  agreement, and the cross-link proof that `convolve(sig, reverse(pulse))` equals
  `crossCorrelate(pulse, sig)` (the matched filter is the same operation). Three glossary terms
  (convolution, impulse response, LTI system) and `docs/dsp/convolution.md`. Strictly textbook-level;
  all signals synthetic.

- **Synthesis module: GPS Acquisition.** A deliberately bounded synthesis scene added to
  **Modulations & Waveforms** (alongside the radar scene in the "Synthesis" stage; the Modulation Zoo
  stays the track's marquee), making one point click: GPS is three things already built — spread
  spectrum, correlation, and multilateration — plus one genuinely new idea, **receiving a signal that
  sits below the noise floor** and reading **range** off the correlation peak's position. Each satellite
  repeats a known **PRN** spreading code; the received samples are that code delayed by a **code phase**
  (its travel time → a **pseudorange**) and Doppler-shifted, buried at negative SNR and visually
  indistinguishable from noise. Correlating against the known code applies the spread-spectrum
  **processing gain** in reverse — the despreader, run to acquire — lifting a sharp peak out of the
  noise; since neither the code phase nor the Doppler is known, **acquisition** searches both at once on
  a **code-phase × Doppler** surface. Drag the true target (or the sliders), drop the SNR, or shorten
  the integration and watch the peak track it — or sink into the noise. One from-scratch, tested `dsp/`
  addition backs it (`src/dsp/gps.ts`: `prnReceived`, `codePhaseProfile`, `acquisitionSurface`,
  `acquisitionPeak`), reusing the Spread Spectrum module's `pnCode`, the FFT (with the centered-bin
  helper hoisted to `src/dsp/fft.ts` as `fftShiftedBin`), and the Gaussian-noise model wholesale; the
  tests pin the surface peak at the true (code phase, Doppler) bin, the despread peak at the processing
  gain 10·log₁₀(L), and a 15-dB-sub-noise signal acquired with integration and vanishing below a deep
  enough SNR. The **2D acquisition heatmap is now one shared, reusable component**
  (`src/components/plots/AcquisitionHeatmap.tsx`, axes parameterized: range/code-phase × Doppler) that
  both the radar range-Doppler map and this scene render — the radar map refactored onto it — with a
  draggable, keyboard-operable true-target handle (grab/grabbing cursor + halo) here. Six glossary terms
  (acquisition, code phase, pseudorange, PRN, processing gain, multilateration) and
  `docs/dsp/gps-acquisition.md`. Four acquired satellites fix a position by **multilateration** — the
  GDOP Heatmap and TDOA Multilateration geometry, linked by name rather than rebuilt. Strictly the open
  civilian (C/A-style) signal at undergraduate-textbook depth; all signals/parameters synthetic and
  illustrative (a synthetic PRN code, code phase in chips, Doppler normalized), with no real PRN
  assignments, frequencies, or ephemeris — and explicitly **not** a GNSS track (tracking loops, the
  navigation-message decode, and ionospheric corrections are named as out-of-scope directions, not
  built; restricted/encrypted signals and spoofing/jamming are out of scope).

- **Synthesis module: The Ionosonde & the Ionogram.** A deliberately bounded synthesis scene added
  to **Propagation & Bands** (a new "Synthesis" stage; Band Explorer stays the track's marquee),
  making one point click: an ionosonde is echo-delay radar pointed straight up. Ping the sky and the
  round-trip delay is a **virtual height** (`h' = c·t/2` — the radar range primitive, aimed upward);
  sweep the frequency and the heights trace out the **ionogram**, which cusps up and cuts off at the
  **critical frequency** (foF2) the HF Skywave stub only asserts. That cutoff _is_ the measurement;
  the secant law then turns foF2 into the MUF for an oblique path (`MUF = foF2·sec φ`), closing the
  Track-E loop. Drag foF2 (day/night, like the skywave scene), the layer peak height, the probe
  frequency, or the oblique angle and watch the single-ping echo, the ionogram, and the readouts
  recompute live. One from-scratch, tested `propagation/` addition backs it
  (`src/propagation/ionosonde.ts`: `virtualHeightKmFromDelay`, `echoDelaySecondsForHeight`,
  `reflectsVertical`, `virtualHeightKm`, `ionogramTrace`) — a single parabolic-layer reflection model
  and the sweep that cuts off at foF2 — reusing the radar echo-delay idea, the chirp/sweep machinery,
  the shared x–y plot, and the skywave `mufMHz` secant law wholesale (no new viz component). Five
  glossary terms (ionosonde, ionogram, virtual height, critical frequency, sounding) and
  `docs/propagation/ionosonde.md`. Strictly public/textbook-level — a single illustrative layer with
  stand-in critical frequencies, no real ionograms, station identifiers, or space-weather data — and
  explicitly **not** a new sounding track (o/x ray splitting, multi-layer D/E/F profiles, true-height
  inversion, and oblique sounding are named as out-of-scope directions, not built).

- **Synthesis module: Pulse Compression & Range-Doppler.** A deliberately bounded capstone-style
  scene added to **Modulations & Waveforms** (a new "Synthesis" stage; the Modulation Zoo stays the
  track's marquee), making one point click: radar's core signal processing is primitives already
  built, aimed outward. **Pulse compression** is the LFM chirp through the matched filter (a long,
  low-power echo collapsed to a sharp range peak — literally the cross-correlation peak); **Doppler
  processing** is an FFT across pulses; together they paint the **range-Doppler map**, the radar
  cousin of the GDOP heatmap, with a bright blob at the target's (range, velocity). Drag target
  range, velocity, chirp sweep, SNR, and pulse count, or add a second target, and watch the echo,
  the compressed peak, and the blob recompute live. Two from-scratch, tested `dsp/` additions back
  it — a round-trip echo model and the range-Doppler assembly (`src/dsp/radar.ts`: `echoPulses`,
  `pulseCompress`, `rangeDopplerMap`, `dopplerBin`, `compressionRatio`, `timeBandwidthProduct`),
  plus a complex matched-filter `crossCorrelateComplex` generalizing `src/dsp/correlation.ts`. The
  tests pin the compressed peak at the true range, the range-Doppler peak at the true
  (range, velocity), and the compression ratio ≈ the time-bandwidth product. It reuses the chirp,
  matched-filter/correlation, FFT, noise, spectrogram/heatmap canvas, x–y, time-series, and slider
  primitives wholesale — a strong test that they compose cleanly. Three glossary terms (pulse
  compression, range-Doppler, time-bandwidth product) and `docs/dsp/radar.md`. Strictly
  public/textbook-level; all units synthetic and illustrative (range in bins, Doppler in
  cycles/pulse) — no real radar waveforms or system parameters, and explicitly **not** a radar
  track (CFAR, the full ambiguity function, and SAR are named as out-of-scope directions, not built).

- **🚢 Track G — Coding & Equalization (v1).** The "make the link survive a real channel" track:
  after a signal has been sent, distorted, and noised, recover it by adding redundancy and by undoing
  what the channel did. Two from-scratch, fully tested `dsp/` primitives back it — channel coding
  (repetition + Hamming(7,4) with syndrome decoding, and closed-form coding-gain BER curves) and the
  estimate-and-equalize family (pilot least-squares channel estimation, frequency-domain
  zero-forcing/MMSE equalizers, an EVM metric, and an adaptive LMS equalizer). Four modules across two
  stages — "Error Control" and "Undoing the Channel": **Channel Coding (FEC)** (pick a code, drag
  Eb/N0, watch the coded curve shift left for a code-rate cost, with an interactive encode → flip →
  decode worked example), **Channel Estimation** (known pilots; the estimated response converges to
  truth as pilots/SNR grow), the **Equalization** capstone (a multipath-smeared constellation that
  snaps back and an eye that reopens when the channel is inverted, plus a "go deeper" adaptive LMS
  view with tap weights converging live and the error falling), and a conceptual **Synchronization**
  stub (carrier/timing recovery as tracking loops). It reuses the constellation, eye, and BER/x–y
  views wholesale, adds one small tap-weight stem plot, and teed up the ML throughline — LMS is
  gradient descent, the linear ancestor of a learned equalizer. Registered like any other track (human
  layer names, one capstone), with fifteen glossary terms and `docs/` pages.

- **🚢 Track E — Propagation & Bands (v1).** The last of the originally-envisioned tracks, and a
  deliberately lean _context companion_: the RF physics around the signal, not a DSP peer. Its math
  lives in a new from-scratch, tested `src/propagation/` module kept out of the `dsp/` core (the one
  track whose math is physics, not signal processing) — wavelength `λ = c/f`, the LF…SHF band ladder
  with each band's dominant mode and rough reach, the geometric radio horizon `d ≈ 3.57·(√h₁ + √h₂)`
  km, and a conceptual skywave/MUF rule. Three modules under one "Bands & Reach" stage: the **Band
  Explorer** capstone (drag frequency across the bands and watch wavelength, mode, and reach change —
  why AM crosses states at night, FM stays local, shortwave goes global), **Radio Horizon /
  Line-of-Sight** (drag two antenna heights on a curved-earth picture whose grazing geometry matches
  the formula), and a conceptual **HF Skywave & the Ionosphere** stub (reflect vs. punch-through, set
  by day/night and frequency). A new shared `RayPathDiagram` earth-curvature renderer backs the last
  two. The highest-value piece is the cross-link: the **AoA cross-fixing** scene gains a
  line-of-sight ↔ HF-skywave toggle on the shared world map, and on skywave the naive straight-ray
  fix visibly walks off the true emitter — the one place propagation changes a DSP answer. Registered
  like any other track (human layer name, one capstone), with fourteen glossary terms and `docs/`
  pages.

- **🚢 Track F — Signal Chain & SDR (v1).** A lean companion track for where the IQ samples come from.
  Two from-scratch, tested boundary effects — a quantizer (bit depth, optional dither, SQNR ≈
  6.02·N + 1.76 dB) and a gain/clipping stage (the Goldilocks zone between buried-in-noise and
  clipping-into-spurs) — plus a reusable interactive block diagram whose every lit block routes to the
  module that simulates it (mixer → downconversion, ADC → quantization, filters → FIR, channelizer →
  channelization), and an SDR-architectures view showing the ADC march toward the antenna across
  superhet → zero-IF → direct sampling. Registered like any other track (human layer names, one
  capstone), with twelve glossary terms and `docs/` pages.

- **🚢 Fundamentals (v1).** All six modules were already built and stable, so the track's status flips
  from `building` to `shipping` — both newer tracks now read as v1 (no "building" badge in the nav).

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

### Changed

- **Bottom-fade scroll cue added to the explanation side-rail.** The right-hand explanation panel
  (`ASIDE`) is one of the app's two main content scroll regions — its write-ups routinely run past the
  fold — but only the module plot region (`.wf-scroll`) signaled "more below" with a bottom fade; the
  side-rail had no such cue, so its scrollability wasn't obvious. It now carries the **same** fade,
  bringing both main scroll regions into alignment (they already shared the app-wide scrollbar styling).
  The fade is token-derived and quiet (neutral, never the green accent) and — crucially — fades to the
  panel's own `surface`, the color _behind_ the text: a long explanation fades out at the bottom edge,
  while a short, non-scrolling one leaves bare surface under the fade and shows nothing, so it's never
  dimmed. Layout/CSS only; explanation copy and behavior are unchanged. The Modulation Zoo marquee
  screenshot is regenerated and shows the cue on its long explanation.

- **Sticky controls now pin to whichever edge they're anchored on — top _or_ bottom (fixes Modulation
  Zoo).** The co-visibility rail (`<ControlRail>`) previously only pinned **bottom**-anchored controls
  (the radar / GPS footers); a module whose controls sit at the **top** with plot rows stacked below —
  the **Modulation Zoo**, whose SNR slider and scheme-selector chips drive five stacked views per
  scheme — pushed those controls off the _top_ of the fold as the reader scrolled to the spectrum / eye
  / spectrogram rows, severing the same drag-watch loop the rail exists to protect (the radar problem,
  inverted). The shared mechanism is now **parameterized by edge** (`<ControlRail edge="top">`):
  `ModuleView` lays the column out as a scrolling plot region **between a pinned header and footer**, and
  the rail portals into the slot for the edge it lives on — so controls pin to whichever edge they're
  anchored on and the loop is never severed regardless of placement. The Modulation Zoo's SNR slider and
  both scheme-chip rows now pin as a **header**: scroll to any plot row and they stay put, drag SNR or
  switch schemes and the visible row responds. The rail keeps the same occlusion care as the footer —
  opaque token `bg-surface`, an edge-correct border + shadow that face the plots, and scroll content
  bounded so nothing renders under the pinned header (no peek-through strip). Pure layout: no DSP,
  computed-value, copy, or control-behavior change; the radar / GPS footers are untouched. The
  Playwright layout guard now asserts co-visibility for **both** edges (footer sliders for the radar,
  the pinned SNR/chip header with a lower plot row scrolled into view for the zoo), and the affected
  screenshot is regenerated.

- **Direction-finding maps brought up to the affordance/legibility conventions (FDOA worst-case
  first).** A visual/affordance pass over the older geolocation scenes — no DSP, computed readout, or
  drag-behavior changes. The shared **`WorldMap`** now (1) sizes every marker label to the app's type
  scale (Tailwind `text-sm`, the readable step above the body) and draws a quiet, token-derived
  legibility backing behind it, so names read clearly over a heatmap field — either half of a
  diverging Doppler gradient, the GDOP precision heat, or a bright contour line — without competing
  with it;
  (2) takes a per-marker `labelOffset` so crowded labels separate instead of smudging into one
  another; and (3) renders a new `velocity` marker kind as an **open ring handle**, visibly distinct
  from the solid site dot. Its keyboard marker row is relabeled **`move:` → `select:`** to match what
  it does (select a marker, then arrow-key nudge). **FDOA (Doppler Difference)** — the densest, least
  discoverable scene — uses all three: each receiver's velocity-vector tip is now separately grabbable
  from its dot (drag the dot to move the platform, the arrow tip to change its velocity), the
  `Rx{i}`/`v{i}` labels sit on opposite sides of their markers with breathing room, and the single
  quiet hint spells out the position / velocity / emitter drags and the select-then-nudge alternative.
  The sibling maps (**GDOP Heatmap**, **AoA Cross-Fixing**, **TDOA Multilateration**) inherit the
  label backing automatically — most visibly the GDOP marquee, whose receiver labels now read over the
  colored precision field. Affected screenshots regenerated.
