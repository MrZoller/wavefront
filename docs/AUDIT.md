# Wavefront — Full-Project Correctness Audit

> Independent, adversarial correctness review (2026-06). Scope: the whole app, in the
> priority order numerical/DSP correctness → conceptual/pedagogical correctness → test-suite
> integrity → guardrails → conventions. Every numerical claim below was checked against an
> **independent** reference (a closed-form result, a textbook value, or a throwaway reference
> derivation), not against the code's own comments or test names.

## Method & independence

- Re-derived every `dsp/` and `propagation/` primitive against a closed form or textbook value
  (and, where useful, a hand reference): naive-DFT cross-check, GDOP at a known geometry,
  Hamming(7,4) bit-error leading term, radio-horizon constant, secant-law MUF, the I/Q
  recovery of down-conversion, etc. Spot-checks are stated inline per finding.
- Five parallel reviewers read every module's `Module.tsx` + `Explanation.tsx` copy against the
  code that computes it, plus full convention/guardrail sweeps. Their substantive findings were
  re-verified before inclusion here.
- Tolerances, expected values, and "green-ness" of the suite were treated as suspect: a passing
  test that asserts the wrong thing is a finding.

## Headline

**The numerical core is in excellent shape.** I found **no correctness bug in any `dsp/` or
`propagation/` primitive** — FFT/DFT, cross-correlation, steering/beamforming + grating lobes,
AoA least-squares, TDOA/hyperbola/Gauss-Newton, GDOP, FDOA, BPSK/QPSK/16-QAM + AWGN, RC/RRC
pulse shaping, quantization SQNR, Hamming(7,4) + analytic BER, ZF/MMSE/LMS equalization,
channelizer/PFB, radio horizon, secant-law MUF, and λ=c/f all reproduce theory within
tolerance, and the core test suite asserts genuinely independent expected values (e.g. GDOP
`√(8/9)` for a 120°-spread layout, Hamming leading term `9·p²`). 283/283 tests pass.

The findings are concentrated in **user-facing copy terminology**, **one misleading capstone
plot**, and **test/coverage gaps** (computed readouts and a Monte-Carlo BER curve never checked
against the closed form). Severity ladder used:
`correctness-bug` > `test-gap` > `guardrail` > `convention` > `polish`.

| Severity        | Count | Fixed | Report-only |
| --------------- | ----- | ----- | ----------- |
| correctness-bug | 4     | 4     | 0           |
| test-gap        | 4     | 2     | 2           |
| guardrail       | 0     | —     | —           |
| convention      | 4     | 4     | 0           |
| polish          | 7     | 2     | 5           |

(A follow-up pass resolved all four `convention` items and `PO-5`; see the per-finding
"FIXED" notes below. The deliberately-excluded items — `TG-3`, `TG-4`, `PO-2/3/4/6/7` — remain
report-only.)

---

## correctness-bug

### CB-1 — "BER waterfall" shows a non-existent error floor (send-a-message capstone) — FIXED

- **Location:** `src/modules/playing-a-radio-signal/send-a-message/SendMessageModule.tsx:48,134-146`
  with `src/components/plots/XYPlot.tsx:47-53`.
- **As it stood:** the headline plot is a Monte-Carlo estimate, `berVsSnr(scheme, EBN0_AXIS, 4000, 11)`
  — 4000 symbols ⇒ 8000 bits for QPSK, so the smallest resolvable non-zero BER is `1/8000 ≈ 1.25e-4`.
  Every Eb/N0 ≳ 9 dB yields **zero observed errors**. `XYPlot.tY` clamps `v` to `yDomain`
  (`min = 1e-4`) **before** the `log10`, so those zeros are drawn as a flat horizontal line at the
  `1e-4` floor — a hard "error floor" from ~9 dB onward.
- **Why it's wrong (independent reference):** BPSK/QPSK over AWGN have BER `= Q(√(2·Eb/N0))`, which
  keeps plunging: `≈3.9e-6` at 10 dB and `≈9e-9` at 12 dB. There is **no** error floor. The
  Explanation sells this exact plot as "from perfect to unreadable over just a few dB," which the
  rendered curve contradicts in its bottom decade — a confidently-wrong visual.
- **Fix:** plot the **analytic** waterfall (`analyticBer`, added to `comms.ts` and tested against the
  Monte-Carlo simulation — see CB-1's sibling TG-1) as the smooth reference curve, with the
  operating-point marker on it, and extend the y-axis to `1e-6`. The live Monte-Carlo reality is
  still shown by the constellation + the live BER readout. Screenshot regenerated.

### CB-2 — "excess bandwidth" mislabels the occupied bandwidth (pulse-shaping) — FIXED

- **Location:** `src/modules/playing-a-radio-signal/pulse-shaping/PulseShapingExplanation.tsx:30`
  (rendered copy); echoed in the code comment `PulseShapingModule.tsx:97`.
- **As it stood:** "The roll-off β sets the **excess bandwidth**, (1+β)/2 of the symbol rate per side."
- **Why it's wrong (independent reference — Proakis, _Digital Communications_; Sklar):** for symbol
  rate `Rs = 1/T` the raised-cosine spectrum nulls at `(1+β)/(2T)`, so `(1+β)/2 · Rs` per side is the
  **occupied (absolute) bandwidth**, not the _excess_. The **excess bandwidth** is the part beyond the
  Nyquist minimum `Rs/2`, i.e. the fraction `β` (β=0.35 → "35 % excess"). Calling `(1+β)/2` the
  "excess bandwidth" over-counts by the entire Nyquist-minimum band and implies β=0 ⇒ zero bandwidth
  (false: β=0 still fills the full Nyquist band). The module's own readout already (correctly) labels
  this quantity "Occupied bandwidth," so the Explanation contradicted the module.
- **Fix:** rename to "occupied bandwidth" in the copy and the comment, matching the readout and the
  correct meaning. Teaching intent (β trades bandwidth for ringing) unchanged. The same wording in the
  long-form reference `docs/dsp/pulse.md` was corrected too (caught in follow-up review).

### CB-3 — DFT basis called "orthonormal" (dft-basis) — FIXED

- **Location:** `src/modules/fundamentals/dft-basis/DftBasisExplanation.tsx:20`.
- **As it stood:** "The sinusoids form an **orthonormal** basis, so the DFT just re-expresses the same
  vector in new coordinates — like rotating axes."
- **Why it's wrong (independent reference):** for the DFT as implemented (`X[k]=Σ x[n]·e^{−j2πkn/N}`,
  with the full `1/N` on the inverse — `fft.ts`), the basis vectors `e^{−j2πkn/N}` are **orthogonal**
  but each has squared norm `Σ_n |e^{−j2πkn/N}|² = N`, i.e. length `√N`. They are orthonormal only
  after a `1/√N` scaling. The unnormalized DFT preserves energy only up to the Parseval `1/N` factor
  — which the suite itself acknowledges ("energy is conserved up to 1/N", `fft.test.ts:47`).
- **Fix:** "orthonormal" → "orthogonal". The "change of basis / no information lost / inverse rebuilds
  exactly" intuition is correct for any invertible basis and is preserved.

### CB-4 — "Nyquist rate" used to mean fs/2 in source docstrings (aliasing) — FIXED

- **Location:** `src/dsp/sampling.ts:3` and `src/modules/fundamentals/aliasing/AliasingModule.tsx:13`
  (both are JSDoc/module comments — **not** rendered to users).
- **As it stood:** "a tone above the **Nyquist rate** (½ the sample rate)…"
- **Why it's wrong (independent reference):** the **Nyquist frequency** is `fs/2`; the **Nyquist rate**
  is the _minimum sampling rate_ `2·f_max` — a rate, not a frequency. The same module's rendered copy
  already uses the correct terms ("Nyquist limit", "Nyquist frequency"), and the glossary entry for
  "Nyquist rate" is correct, so only these two comments mis-define the term.
- **Severity note:** lower than CB-1..3 because it is not user-facing; included because this is a
  teaching tool whose source is part of the artifact and the mis-statement could propagate.
- **Fix:** "Nyquist rate" → "Nyquist frequency" in both docstrings.

---

## test-gap

### TG-1 — Simulated BER is never checked against the analytic Q-curve — FIXED

- **Location:** `src/dsp/comms.test.ts:94-102`, `src/dsp/channel.test.ts:62-68`.
- **As it stood:** the only BER tests assert monotonicity and an order-of-magnitude threshold
  (`ber(12) < 0.001`). Nothing checks that the from-scratch `awgn` + `noiseSigma` + `symbolsToBits`
  pipeline actually _tracks_ the closed form across the SNR range — exactly the check the brief calls
  out ("compare simulated BER against the analytic expressions … curves should track theory across the
  range, not just look right"). `coding.ts`'s `uncodedBer` is the analytic curve itself, tested only
  against `qfunc` (tautological).
- **Independent reference:** BPSK/QPSK AWGN BER `= Q(√(2·Eb/N0))`; square 16-QAM Gray BER
  `≈ (3/4)·Q(√(0.8·Eb/N0))` (the standard `(4/k)(1−1/√M)Q(√(3k/(M−1)·γ))` with M=16).
- **Fix:** added `analyticBer(scheme, ebN0dB)` to `comms.ts` and a test that the Monte-Carlo `berVsSnr`
  simulation matches `analyticBer` within tolerance over the resolvable range for BPSK, QPSK, and
  16-QAM. This both fills the gap and provides the correctness anchor reused by CB-1's plot.

### TG-2 — `window.ts` generalized-cosine coefficients only partially pinned — FIXED

- **Location:** `src/dsp/window.ts` (Hann/Hamming/Blackman/rectangular); existing coverage in
  `spectrum.test.ts:12-24` checks Hann endpoints, rectangular all-ones, and that Blackman peaks at
  center — but never the **Hamming** coefficients, the `0.08` Blackman endpoints, symmetry, or the
  exact center values.
- **Independent reference:** Hann `0.5−0.5cos`, Hamming `0.54−0.46cos` (endpoints 0.08, center 1.00),
  Blackman `0.42−0.5cos+0.08cos2` (endpoints 0.00); all symmetric.
- **Fix:** added `window.test.ts` pinning each window's endpoints, center, symmetry, and coherent gain.

### TG-3 — On-screen module readouts have no component-level tests — REPORT-ONLY

- **Locations (representative):** interferometer pixel→bearing `atan2` mapping
  (`InterferometerModule.tsx:33-39`); skywave drift `‖fix−emitter‖` (`AoaCrossFixModule.tsx`);
  `formatHz` + `fMax` normalization (`FdoaModule.tsx:185-188,33`); inline `tapError`
  (`ChannelEstimationModule.tsx:56-61`); EVM `%` formatting + slice coloring
  (`EqualizationModule.tsx`); quantization/gain/aliasing readouts; classifier feature-bar scaling.
- **Status:** the _underlying_ `dsp/` functions each have a numerical test; the gap is purely the
  in-component **composition** (a sign slip or wrong constant in a module would pass the core suite).
  Only one module smoke test exists app-wide (`coding-and-equalization/modules.smoke.test.tsx`).
- **Recommendation (report-only — touches many components):** extract the non-trivial inline helpers
  (esp. the interferometer pixel→bearing map and the skywave-drift composition) and unit-test them, or
  add per-module assertions that the rendered derived value equals the tested function's output. Left
  for human triage to avoid a large mechanical churn in this correctness pass.

### TG-4 — Low-N BER readouts presented as numbers — REPORT-ONLY

- **Location:** `MatchedFilterModule.tsx:38-39` (BER over **40** symbols, quantized to 1/40 = 0.025);
  `NoisyChannelModule.tsx:43` (600 symbols).
- **Status:** the _constructions_ are correct (verified: with unit-energy RRC, the matched-filter
  decision BER tracks `Q(√(2·Eb/N0))`), but the displayed numbers are statistically meaningless at
  these counts and unchecked. Not a bug; a readout-honesty nit.
- **Recommendation:** de-emphasize the numeric BER in the matched-filter eye-diagram demo, or raise N.

---

## convention

### CV-1 — Signal-green hard-coded instead of read from the design token (8 canvas sites) — FIXED

- **Rule:** CONTRIBUTING.md — "Read colors from `src/design/tokens.ts`, never hard-code hex."
  `rgb(62, 240, 160)` **is** `colors.signal` (`#3ef0a0`, `tokens.ts:29`), duplicated as a literal.
- **Locations:** `SpectrumPlot.tsx:57`, `PolarPlot.tsx:89`, `SpectrogramPlot.tsx:24`,
  `BandExplorerModule.tsx:125,258`, `ChannelizerModule.tsx:88`, `GdopModule.tsx:11`,
  `AoaCrossFixModule.tsx:95` (+ the literal hex in the comment `:94`).
- **Why (mitigating):** all are `<canvas>` 2D-context / gradient stops where CSS `var(--color-signal)`
  can't resolve, and there is no `withAlpha()`/`signalRgb` bridge helper — so authors had no sanctioned
  in-token path. The _semantics_ are correct (green = live everywhere); this is maintainability drift,
  not a wrong color.
- **Fix:** added `withAlpha(color, alpha)` and a pre-parsed `signalRgb` tuple to `tokens.ts` as the
  sanctioned in-token path for canvas/gradient code, and replaced all 8 literals (and the literal hex
  in the `AoaCrossFixModule` comment). Rendered colors are pixel-identical. A new guard test
  (`src/test/no-hardcoded-signal-color.test.ts`) fails if the signal hex/rgb literal reappears outside
  `tokens.ts` / `index.css`.

### CV-2 — Hand-rolled canvases skip the shared axis-label contract — FIXED

- **Location:** the channelizer wide-spectrum canvas (`ChannelizerModule.tsx:77-138`, one-sided `[0,1)`,
  no visible x-label — only `aria-label`) and the dft-basis magnitude bars
  (`DftBasisModule.tsx:65-73`, bin index, no x-label). The shared `SpectrumPlot`/`XYPlot` instances in
  the same modules are correctly labeled and centered `[−0.5, 0.5]`.
- **Why it matters:** `axisLabel.ts` makes the point that "an unlabeled axis inverts the whole tool";
  the shared plots enforce it, these two raw canvases bypass it, and the channelizer additionally mixes
  a one-sided `0→1` axis with the extracted channel's centered `−0.5→+0.5` axis.
- **Fix:** added visible x-captions in the shared label style — the channelizer canvas now names its
  one-sided `0…1` normalized-frequency axis (so it reads correctly against the centered extracted-channel
  axis beside it), and dft-basis names the bin index. Labeling only; the math (channel centers `k/nCh`)
  is unchanged. Screenshots regenerated.

### CV-3 — Chirp "Sweep bandwidth" control is actually the half-width — FIXED

- **Location:** `src/modules/modulations-and-waveforms/chirp/ChirpModule.tsx:48` (label) vs the waveform
  `chirp(N, −bw, +bw)`, whose _total_ swept bandwidth is `2·bw`. The `±bw cyc/sample` display mitigates
  it, and the in-file comment even says "half-width."
- **Fix:** relabeled the slider "Sweep half-width" (and its `ariaLabel`) to match the waveform
  `chirp(N, −bw, +bw)` (the `±bw cyc/sample` display already showed the half-width). Screenshot
  regenerated.

### CV-4 — Quantization readout labels SQNR as "Dynamic range" — FIXED

- **Location:** `src/modules/signal-chain-sdr/quantization/QuantizationModule.tsx:159` —
  `label="Dynamic range (ideal)"` shows `idealSqnrDb = 6.02N + 1.76`.
- **Why it's a judgment call:** full-scale-sine **SQNR** (`6.02N+1.76`) and **dynamic range**
  (often `6.02N`, full-scale-to-LSB) are distinct, ≈1.76 dB apart. The value shown is exactly the SQNR
  formula and is correct; the _label_ conflates the two (common in teaching material). The Explanation
  frames DR correctly in prose.
- **Fix:** relabeled the readout "SQNR (ideal)" to match `idealSqnrDb` (and the "Measured SQNR"
  readout beside it). The Explanation's dynamic-range prose is left as-is. Screenshot regenerated.

---

## polish (report-only unless noted)

- **PO-1 (FIXED) — radio-horizon viz hard-codes `6371`.** `RadioHorizonModule.tsx:60`
  (`(CENTER*CENTER)/(2*6371)`) duplicates `EARTH_RADIUS_KM` (`constants.ts:14`). Same value; swapped to
  the imported constant for single-source consistency. No visual change.
- **PO-2 — repetition code "barely breaks even per bit-energy."** `ChannelCodingExplanation.tsx:44`,
  `ChannelCodingModule.tsx:113`, `coding.ts:8`. Verified result is a small **net loss**
  (`repetitionBer(10,3) > uncodedBer(10)`; `codingGainDb(repetition) ≤ 0`), not a break-even. Defensible
  hedging; could tighten to "a slight loss at this BER."
- **PO-3 — spread-spectrum "lifting the signal N dB above interference."**
  `SpreadSpectrumModule.tsx:85`. Processing gain `10·log₁₀(L)` is an SIR _improvement_, not an absolute
  level above interference (they coincide only at the demo's implicit 0 dB input SIR). Mental model is
  right; phrasing imprecise.
- **PO-4 — carrier-offset "every symbol decodes wrong."** `CarrierOffsetModule.tsx:120`. A static
  rotation past a boundary corrupts only symbols whose noise carries them across, until a full quadrant
  (≥45° for QPSK). Suggest "symbols start crossing decision boundaries and decode wrong."
- **PO-5 (FIXED) — noisy-channel "16-QAM needs more energy to hold the same per-bit margin."**
  `NoisyChannelExplanation.tsx:21`. At fixed Eb/N0 bit energy is already equalized, so the old wording
  was slightly wrong. Reworded: 16-QAM's denser points sit closer together, so it needs a higher Eb/N0
  to reach the same error rate. (Included because, unlike PO-2/3/4/6/7, it was not just imprecise but
  slightly incorrect.)
- **PO-6 — "Occupied bandwidth" readout is one-sided.** `PulseShapingModule.tsx:122`. Shows
  `(1+β)/2 · Rs` (per-side/baseband); "occupied bandwidth" usually denotes the two-sided RF figure
  `(1+β)·Rs`. Consider "Baseband bandwidth (per side)."
- **PO-7 — quantization measured-SQNR uses a 0.9-FS tone vs a full-scale "ideal."**
  `QuantizationModule.tsx:15`. The ~1 dB measured-vs-ideal gap a learner sees is partly the −0.9 dB
  backoff, not only windowing. Honest given the "(ideal)" qualifier; noted for awareness.

---

## Verified clean (independently re-derived — so the human can check the check)

- **FFT/DFT** (`fft.ts`): radix-2 matches the naive `dft` to 9 digits; Parseval holds to `1/N`;
  `ifft(fft(x))` round-trips; pure tone lands in exactly one bin; `fftFreqs = k·fs/N`; `fftShift`
  centers DC. Conventions correct.
- **Cross-correlation** (`correlation.ts`): `c[ℓ]=Σ ref[n]·sig[n+ℓ]`; peak at the true delay
  (re-derived the sign convention against a delayed copy).
- **Array/beamforming** (`array.ts`): steering `a(θ)=[e^{jkβ}]`, `β=2π d sinθ/λ`; verified the N=2,
  d=λ/2 broadside→endfire null is exactly 0; grating-lobe condition `sinθ_g = sinθ_s + mλ/d` correct.
- **Geolocation** (`geolocation.ts`): AoA least-squares crosses at the hand-computed point; hyperbola
  branch keeps `|p−f₁|−|p−f₂| = Δr`; TDOA Gauss-Newton Jacobian `u₀−uᵢ` correct; **GDOP `√(8/9)`** for
  three receivers 120° apart re-derived (`HᵀH = diag(4.5,1.5)`); FDOA sign chain (closing → +Δf →
  up-shift) consistent end to end.
- **Comms** (`comms.ts`): constellations unit-energy + Gray (nearest neighbors differ by 1 bit);
  `noiseSigma = √(N₀/2)`, `N₀ = Eb/(Eb/N0)`, `Eb = 1/k` (σ(0 dB, QPSK)=0.5 confirmed); Box-Muller AWGN.
- **Quantization** (`quantization.ts`): SQNR `6.02N+1.76`; mid-tread clamp indices `[−2^{N-1}, 2^{N-1}−1]`;
  ≈6 dB/bit verified.
- **Coding** (`coding.ts`): Hamming(7,4) encode/syndrome/decode correct (parity at positions 1,2,4);
  **independently re-derived the `9·p²` leading term** (the 7 weight-3 codewords — XOR-zero triples —
  contain 12 data positions, ×3 patterns each = 36 data-bit errors over k=4); `qfunc` matches textbook
  Q(1)/Q(2)/Q(3).
- **Equalization** (`equalization.ts`): LS normal equations `(AᴴA)ĥ=AᴴY`; ZF `=1/H`; MMSE
  `=H*/(|H|²+1/SNR)`; LMS update `w←w+μ·e·x*`; EVM definition. All correct.
- **Pulse shaping** (`pulse.ts`): RC and RRC match the standard closed forms including both removable
  singularities (RC at `t=±1/2β`, RRC at `t=0` and `t=±1/4β`); RRC⊛RRC ≈ Nyquist.
- **Channelizer/PFB** (`channelizer.ts`): channel centers `k/nCh`; PFB adjacent-channel rejection
  beats the bare FFT (tested < 0.05).
- **Carrier** (`carrier.ts`): `2·s·cos`/`−2·s·sin` + LPF recover I/Q exactly (re-derived the
  double-angle cancellation).
- **Channel/multipath, modulation (AM/FM/PM, CPFSK h=0.5 MSK → ±π/2/symbol), waveforms (OFDM CP,
  LFM, DSSS `10·log₁₀(L)`), features, spectrum/spectrogram, sampling alias-fold, random (Box-Muller),
  contour (marching squares):** all re-derived correct.
- **Propagation:** radio horizon `d ≈ 3.57(√h₁+√h₂)` km (`√(2R)=3.5696` for R=6371 km; 4/3-earth note
  → 4.12 consistent); secant-law MUF `fc·secφ` with φ from vertical; `λ=c/f`. Illustrative values
  correctly caveated.
- **Guardrails: clean.** No real system parameters, frequencies-of-interest, hop sequences, call signs,
  or CUI/ITAR/proprietary content. Band table and skywave constants are explicitly labeled illustrative.
- **Conventions (mostly clean):** shared `<Slider>` everywhere (no raw range inputs; enforced by a
  test); no internal vocabulary ("Layer N"/"Track X"/"stub") leaks into rendered copy (enforced by a
  test); `status:'stub'` → "Conceptual" badge; shared axis-label contract enforced for shared plots;
  exactly one capstone per track.

## Coverage

- **Fully covered:** every file in `src/dsp/` and `src/propagation/` (primitive-by-primitive numerical
  re-derivation + test-integrity read); all 31 modules' copy; convention + guardrail sweep across
  `src/`.
- **Partially covered:** rendered pixel geometry of canvas overlays was reasoned about from the feeding
  math, not visually diffed frame-by-frame. The marching-squares saddle cases in `contour.ts` were read
  but not exhaustively enumerated.
- **Not separately audited:** build tooling, Playwright harness internals, `store/` plumbing (no DSP
  claims).

## Fixes applied (small, scoped commits)

**Correctness pass:**

1. Copy terminology corrections — CB-2 (occupied bandwidth), CB-3 (orthogonal basis), CB-4 (Nyquist
   frequency).
2. `analyticBer` + Monte-Carlo-vs-analytic BER test (TG-1).
3. send-a-message analytic waterfall — removes the false error floor (CB-1).
4. `window.test.ts` pinning the window coefficients (TG-2).
5. radio-horizon uses `EARTH_RADIUS_KM` (PO-1).

**Follow-up pass (conventions + one copy fix):**

6. Design-token canvas bridge (`withAlpha` / `signalRgb`) + replace 8 signal-green literals + guard
   test (CV-1).
7. x-axis captions on the two raw canvases (CV-2).
8. Readout relabels — "SQNR (ideal)" and "Sweep half-width" (CV-3, CV-4).
9. 16-QAM Eb/N0 copy correction (PO-5).

Still **report-only** for human triage (deliberately out of scope): `TG-3` (component-test
scaffolding), `TG-4` (low-N BER readout nits), and polish-tier copy `PO-2/3/4/6/7` (defensible as
written — tightening risks pedantry that hurts non-EE accessibility).
