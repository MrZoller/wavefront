# Architecture

Wavefront is built so that **new modules and tracks slot in without rewrites** (brief §9).
This document is the contract for that expansion. If you keep it accurate, adding curriculum
stays mechanical.

## The big picture

```
┌──────────────────────────────────────────────────────────────┐
│  App shell (src/App.tsx + components/layout/*)                 │
│  • Sidebar + TrackOverview + ModuleView                        │
│  • Composed entirely from the registry — no routing table      │
└───────────────┬──────────────────────────────────────────────┘
                │ reads
┌───────────────▼───────────────┐   ┌───────────────────────────┐
│  Module registry               │   │  Shared viz library        │
│  (src/registry/*)              │   │  (src/components/plots/*)  │
│  • ModuleDef / TrackDef        │   │  • TimeSeriesPlot, …        │
│  • registerModule()            │   │  • reused across all tracks │
└───────────────┬───────────────┘   └───────────────────────────┘
                │ each module uses
┌───────────────▼──────────────────────────────────────────────┐
│  From-scratch DSP core (src/dsp/*)                             │
│  • complex/IQ, FFT, correlation, steering vectors, …           │
│  • NO black-box library does the interesting math (brief §3.1) │
│  • every algorithm has numerical-correctness tests             │
└──────────────────────────────────────────────────────────────┘
```

A separate `src/propagation/` module (brief §8, §10) holds Track E's RF-physics helpers
(band lookup, radio-horizon, ray paths) so the `dsp/` boundary stays clean — propagation is
physics, not signal processing.

## The module registry contract

Defined in `src/registry/types.ts`:

- **`ModuleDef`** — one learning unit: `id`, `title`, `track`, `oneLineIntuition`, the
  interactive `component`, optional `explanation` content + `status`, and its place in the track's
  climb: `layer` (which stage), `order` (position in the track's sequence, unique per track), and
  optional `isCapstone`.
- **`TrackDef`** — an ordered collection of modules with shared framing, plus `layerNames`
  (human names for the layer indices its modules use).

The app derives **all** navigation from these — ordering, the layer subheaders, the step numbers,
and the capstone marker, in both the sidebar and the landing cards. There is no hand-maintained
route map and no ordering/markers hand-kept in the views.

### Capstone = marquee, not "last"

`isCapstone` marks a track's **marquee** — the one chip per track that a newcomer is drawn to, the
destination of the track's **core climb**, so the rest read as steps toward it. It is a
_navigational_ signal, distinct from raw position:

- **`order`** is the literal render sequence.
- **`isCapstone`** is the destination of the **core** sequence — **not** necessarily the last module
  by `order`.

Usually the capstone _is_ the last core module (GDOP Heatmap, Send a Message, Modulation Zoo, and
Channelizer are each their track's marquee). What makes the last-rendered module differ from the
capstone is an **optional / `advanced` module that sits outside the core climb** — and that's fine,
because its `advanced` tag is exactly what signals "offshoot, not a mandatory rung." Two shapes of
this, both real in the app:

- **A harder terminal synthesis after the marquee.** Modulations & Waveforms: the **Modulation Zoo**
  is the capstone (stable, central), while the **Modulation Classifier** is the terminal synthesis —
  last by `order`, `advanced`, in its own `Classification` stage — so it is _not_ the capstone.
- **A sideways variant trailing the capstone in the same layer.** Direction Finding's `Geolocation`
  layer ends on the **GDOP Heatmap** capstone, then **FDOA (Doppler Difference)** trails it. FDOA is
  `advanced` because it's an optional Doppler offshoot, _not_ a step you pass through to reach GDOP;
  reordering it before GDOP would falsely encode it as a prerequisite rung.

So the capstone marks the end of the **core** sequence, not necessarily the last item rendered; an
`advanced` module may legitimately follow it.

**Rule of thumb (esp. for new tracks E/F):** when a module causes ordering friction because it's
neither a clean rung nor the destination, tag it **`advanced`** — don't bend `order` or invent a
one-module layer to tidy the sequence. And never tag a module both `isCapstone` **and** `advanced`
(a "skippable destination" is a contradiction).

## Recipe: add a new module

1. Implement and **test its `dsp/` functions first** (brief §15) under `src/dsp/`.
   Every exported function gets a doc comment with its equation and a Vitest spec.
2. Build the interactive component under `src/modules/<track>/<module-id>/`.
   Lean on the shared viz library in `src/components/plots/`; add to it only when a
   genuinely new view type is needed. **Label every plot's axes** — the Cartesian plots require
   `xLabel`/`yLabel` (quantity + honest unit; see
   [CONTRIBUTING.md → Labeling plot axes](../CONTRIBUTING.md#labeling-plot-axes)).
3. Register it: in the module's entry file, call `registerModule({ ... })` — declaring its
   `track`, `layer`, and `order` (unique within the track, ascending through layers) — then import
   that file for its side effect from `src/modules/index.ts`. The nav slots it into the right stage
   automatically.
4. Add a "go deeper" doc under `docs/dsp/` and link the test that verifies the math.
5. **Register any new jargon** in `src/glossary/glossary.ts` (and match-only variants in the
   `ALIASES` map in `match.ts`). Write plain copy — `<GlossedText>` marks it automatically.
6. Capture a screenshot (it'll be picked up by `npm run screenshots`).

That's the whole loop. No shell, routing, or navigation edits.

## Recipe: add a new track

1. Add a `TrackDef` to `src/registry/tracks.ts` (this controls display order + status badge).
   Give it `layerNames` — a human name for each layer index its modules use (e.g.
   `{ 0: 'Foundations', 1: 'Angle of Arrival', 2: 'Geolocation' }`).
2. Add the `TrackId` to the union in `src/registry/types.ts`.
3. Add modules per the recipe above, declaring each module's `layer` + `order`, and mark **exactly
   one** module `isCapstone: true` (its marquee — see "Capstone = marquee, not 'last'"). The sidebar
   and overview pick the track up automatically.
4. Add a track page under `docs/tracks/`.

The registry test (`src/registry/registry.test.ts`) enforces this contract: exactly one capstone
per populated track, a name for every layer a module uses, and unique, layer-contiguous `order`.

## The glossary contract (`<Term>`)

Jargon is surfaced inline for non-EE readers from one flat source of truth,
`src/glossary/glossary.ts` (`id → { term, expansion?, gloss, moduleId?, docsPage? }`). Three lengths
of the same idea: the `gloss` (one sentence, in the popover) → the linked `moduleId` (the interactive
lesson) → the `docsPage` (the long-form write-up).

**Marking is map-driven and consistent by construction.** Authors write **plain copy**; a render-time
matcher (`src/glossary/match.ts`) inside `<GlossedText>` marks terms automatically, and `Term.tsx`
renders each marker's popover. Nothing is hand-wrapped, so highlighting can't drift page to page —
"is X glossed?" reduces to "is X in the map?". Prose surfaces are wrapped centrally: `ModuleView`
wraps the explanation rail + module intro, and module captions wrap their text in `<GlossedText>`.
The matcher enforces the deliberate rules — teaching-page exclusion, first-use **per `<section>`**,
excluded surfaces (headings/code/controls), and boundary-aware tokenization (`QPSK/QAM` → both,
`16-QAM` as one unit, no `FM`-in-"confirm"). Escape hatches: `<NoGloss>` suppresses, a hand-placed
`<Term>` forces.

This is **infrastructure, not a track**, and it is **enforced, not aspirational**:
`src/glossary/glossary.test.ts` fails CI if any `<Term id>` is dangling, any `moduleId` doesn't
resolve, or **any `docs/dsp/` page lacks a glossary entry referencing it**; `match.test.ts` pins the
tokenization edge cases and `GlossedText.test.tsx` pins the marking rules. The popover is mobile-first
(tap-to-toggle, Esc/outside-tap dismiss), keyboard-focusable, stays within the viewport, and hides
self-referential "Learn more" links at runtime.

Keep it a **flat map** — no categories, search, or nested entries. The cutoff for _what_ earns an
entry (the conceptual-load test, and the `Hz`-vs-`dB` contrast) lives in
[CONTRIBUTING.md](../CONTRIBUTING.md#inline-glossary-term); apply that line rather than re-litigating
it per term.

## Data flow

- **State** is a small Zustand store (`src/store/appStore.ts`) — currently just the active
  module id. Kept in memory; no browser storage (brief §10).
- **Live recompute loop:** interactive components hold their parameters in local React state
  (or the store), call pure `dsp/` functions on every change, and feed results to canvas-based
  plots via the `useCanvas` hook. This is the "drag and watch everything recompute" soul of the
  tool (brief §1). Keep DSP problem sizes modest and memoize for 60fps (brief §12).

## Conventions

- **`@/` path alias** maps to `src/` (see `tsconfig.app.json` + `vite.config.ts`).
- **Design tokens** live once in `src/design/tokens.ts`, mirrored as CSS variables in
  `src/index.css`. Read colors from there in canvas code; never hard-code hex in components.
- **Tests** are colocated (`*.test.ts`) for `dsp/` and registry logic.
