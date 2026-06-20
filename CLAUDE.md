# CLAUDE.md

Wavefront is an interactive, **from-scratch, test-verified DSP/RF learning tool** for strong
software engineers who are _not_ electrical engineers. Seven tracks take a reader from a signal as
a rotating vector to direction finding, the full radio chain, and channel coding — every transform
built **from scratch** (no black-box DSP libraries) and checked against reference values, so the
math is readable and trustworthy. The soul of the tool is **direct manipulation**: drag the emitter,
drag a receiver, sweep a slider, and watch everything recompute live.

This file is the index plus the handful of rules worth stating up front. To extend the project, read
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** and **[CONTRIBUTING.md](CONTRIBUTING.md)** first.

## How work happens here

Developed by a **builder agent + an adversarial PR reviewer** in a loop — expect review findings and
work through them. Two house defaults beyond the conventions below: **verify a fix landed where you
claimed** (a change billed as shared/app-wide must live in the shared layer, not be patched in one
spot — confirm by inspection), and **lead with the idea, not the mechanics** (the Pedagogy rule, as
a general default — copy, commit messages, review replies).

## Commands

```bash
npm run dev          # Vite dev server
npm test             # Vitest, run once   (test:watch, test:coverage also exist)
npm run lint         # ESLint
npm run format       # Prettier --write   (format:check is the CI gate)
npm run build        # tsc -b && vite build
npm run screenshots  # Playwright → docs/images/   (see rule below)
```

CI runs **lint → format:check → test → build** (`.github/workflows/ci.yml`); run them before
pushing. Stack: React 19 + TypeScript (strict) + Vite + Tailwind v4 + Zustand + Canvas 2D + Web
Audio. Imports use the `@/` alias for `src/`.

**Screenshots — regenerate only what structurally changed.** A full `npm run screenshots` re-renders
the whole gallery, and the render is environment-specific: even an _unchanged_ scene diffs across
machines, so a full regen buries the one real change in noise. Verify app-wide visual changes live
(`npm run dev`), then commit **only** the screenshots whose content actually changed.

## Architecture map

The app is composed **entirely from the module registry** — there is no routing table. Adding
curriculum is a registry entry, not a wiring change.

- **Registry** — `src/registry/`: `types.ts` (`ModuleDef`, `TrackDef`, the `TrackId` union),
  `tracks.ts` (`TRACKS` = canonical display order + `layerNames`). Modules live in
  `src/modules/<track>/<module-id>/`, call `registerModule({...})`, and are imported for side effect
  from `src/modules/index.ts`. Nav, ordering, layer subheaders, and capstone markers all derive from
  this.
- **From-scratch DSP core** — `src/dsp/*`: complex/IQ, FFT, correlation, steering/beamforming,
  geolocation, comms, coding, equalization, pulse shaping, channelizer, … Each primitive has a
  colocated `*.test.ts`.
- **RF physics** — `src/propagation/*`: wavelength/bands, radio horizon, skywave/MUF. **Deliberately
  kept out of `dsp/`** — propagation is physics, not signal processing. Has its own closed-form tests.
- **Shared viz** — `src/components/plots/*`: `TimeSeriesPlot`, `SpectrumPlot`, `XYPlot`,
  `ConstellationPlot`, `PhasorPlot`, `PolarPlot`, `WorldMap`, … all on `useCanvas`; axis labels via
  `axisLabel.ts` (`AXIS` presets), titles via `<PlotTitle>`. Reuse these; add a view type only when
  genuinely new. The Playwright pipeline lives in `e2e/screenshots.spec.ts`.
- **Shared layout/components** — `ModuleView` (lays out the module + explanation rail, wraps prose in
  `<GlossedText>`, portals the `ControlRail`), `ControlRail` (`src/components/ControlRail.tsx`),
  `Slider` (`src/components/Slider.tsx`), `Sidebar`/`TrackOverview` (`src/components/layout/`).
- **Design tokens** — `src/design/tokens.ts` (mirrored as CSS vars in `src/index.css`). Canvas /
  gradient code uses `withAlpha(colors.signal, α)` / `signalRgb` — the sanctioned way to use a token
  where CSS `var()` can't resolve.
- **Glossary `<Term>`** — `src/glossary/`: a flat single-source map (`glossary.ts`) + a render-time
  matcher (`match.ts`) inside `<GlossedText>`. Marking is **map-driven, never hand-wrapped** — write
  plain prose and add the term to the map.
- **State** — a small Zustand store, `src/store/appStore.ts` (active module id; in-memory, no
  persistence).

## Conventions that will bite you

The ones an agent wouldn't infer. Most are guarded by a test (named inline); honor them in spirit too.

- **From-scratch + test-first.** Build and test the `dsp/` / `propagation/` function _before_ the UI.
  Tests pin real expected values against an **independent** reference (GDOP `√(8/9)`, Hamming `9·p²`,
  Parseval, peak-at-known-lag) — not the code's own comments — and cross-link proofs where apt (e.g.
  `convolve(sig, reverse(pulse)) == crossCorrelate`, `convolution.test.ts`). The independent
  correctness audit is **[docs/AUDIT.md](docs/AUDIT.md)**.
- **Accent semantics.** Green (`colors.signal`, cyan secondary) = **live / dynamic / interactive**
  (readout values, live sliders, active nav, links, drag handles). Neutral `text*` = **static**
  (labels, titles, units, formulas). Never accent a static label.
- **Design tokens only.** Read every color from `src/design/tokens.ts`; never inline a hex. The
  signal accent is guarded (`src/test/no-hardcoded-signal-color.test.ts`).
- **No internal vocabulary in user-facing copy.** Never render `Layer N` or `Track A–F` — use the
  human names ("Foundations", "Direction Finding & Geolocation"), or restate the concept. Map
  internal `status` tokens to badges at render time (`stub` → "Conceptual"), never the raw token.
  ("track" as an ordinary word is fine; the guard targets only `Track <A–F>` / `Layer <N>`.) Guards:
  `src/test/no-internal-vocab.test.ts`, `Sidebar.test.tsx`.
- **Shared primitives only.** All sliders go through `<Slider>` — no raw `<input type="range">`
  (guard in `Slider.test.tsx`). Every Cartesian plot must name its axes (`xLabel`/`yLabel` are
  required props: quantity + _honest_ unit, none for normalized/unitless); a descriptive title goes
  in `<PlotTitle>`, kept visually distinct from the axis caption.
- **Interactive affordance.** Draggable canvas handles get a `grab`/`grabbing` cursor + persistent
  halo + keyboard focus/nudge; chips look pressable; at most **one** quiet textual hint per surface,
  no on-canvas "drag me" chrome. (Details in CONTRIBUTING.)
- **One capstone per track.** Exactly one module sets `isCapstone` — the track's **marquee**, _not_
  necessarily the last by `order` (an `advanced` offshoot may legitimately follow it). Guard:
  `src/registry/registry.test.ts`.
- **Layout.** Tall modules pin their controls in a `<ControlRail edge>` to whichever edge they live
  on (top _or_ bottom), so a control never scrolls away from the plot it drives. Both scroll regions
  (module region + explanation side-rail) carry the token-derived bottom-fade "more below" cue.
  Respect `prefers-reduced-motion` (`usePrefersReducedMotion`). Co-visibility is checked in
  `e2e/screenshots.spec.ts`.
- **Pedagogy.** Lead with the _idea / intuition_, not the mechanics; cross-link related modules by
  human name; use progressive disclosure ("go deeper") for the rigorous material; gloss jargon via
  the map.

## Guardrails (scope — non-negotiable)

Public, **unclassified, textbook-level** DSP/RF theory only (Wikipedia / undergraduate depth). **All
example signals are synthetic.** No real system parameters, frequencies of interest, hop sequences,
call signs, or CUI / ITAR / proprietary content. Civilian / open signals only where relevant (e.g.
GPS **C/A** code, never encrypted codes). Label illustrative values as illustrative. This keeps the
project freely shareable — the audit confirms it clean; keep it that way.

## Go deeper

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — full conventions (axis labels, accent, glossary cutoff,
  affordance, co-visible controls) + the add-a-module checklist.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — registry contract, capstone-vs-last, recipes for
  adding a module or a track.
- **[docs/AUDIT.md](docs/AUDIT.md)** — the independent correctness audit (method + findings).
- **[docs/README.md](docs/README.md)** — docs index → `docs/dsp/` (per-algorithm math + verifying
  test), `docs/propagation/`, `docs/tracks/` (per-track curriculum), `docs/brand.md`.
