# Contributing to Wavefront

Thanks for your interest! Wavefront is built to make adding curriculum _mechanical_ — the
heavy lifting is the registry + from-scratch `dsp/` core described in
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md). Read that first.

## Getting set up

```bash
npm install
npm run dev
```

## Running the checks (what CI runs)

```bash
npm run lint         # ESLint
npm run format:check # Prettier
npm test             # Vitest (run once)
npm run build        # tsc -b + vite build
```

`npm run format` auto-fixes formatting. CI (`.github/workflows/ci.yml`) runs lint → format
check → test → build on every push and PR.

## Adding a module

The full recipe is in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#recipe-add-a-new-module).
In short:

1. **Write and test the `dsp/` functions first** under `src/dsp/` (every export gets a doc
   comment with its equation + a Vitest spec). This is non-negotiable — the from-scratch,
   fully-tested core is the project's whole discipline.
2. Build the interactive component under `src/modules/<track>/<module-id>/`, reusing the shared
   plots in `src/components/plots/`.
3. `registerModule({ ... })` — declare the module's `track`, **`layer`**, and **`order`** (its place
   in the track's climb; `order` is unique within a track, ascending through layers) — and import
   the file from `src/modules/index.ts`. The sidebar and landing card slot it into the right stage
   automatically.
4. Add a `docs/dsp/` page linking the verifying test.
5. **Register any new jargon in the glossary** and wrap its first in-UI use in `<Term>` (below).

## Adding a track

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#recipe-add-a-new-track). A track declares
`layerNames` (a human name per layer index) and designates **exactly one** module `isCapstone: true`
— its **marquee** destination, which is _not_ necessarily the last module by `order` (see
[Capstone = marquee, not "last"](./docs/ARCHITECTURE.md#capstone--marquee-not-last)). The registry
test enforces one capstone per track, named layers, and unique order.

## Inline glossary (`<Term>`)

Wavefront is for software engineers who are **not** EEs. Jargon gets a one-tap safety net via a
single source of truth, [`src/glossary/glossary.ts`](./src/glossary/glossary.ts), surfaced inline
by `<Term id="…">`. **This is a standing contract, not a one-time pass** — a coverage test
(`src/glossary/glossary.test.ts`) fails CI if it drifts.

**Marking is automatic and map-driven — do not hand-wrap mentions.** Author copy as **plain text**;
a render-time matcher (`src/glossary/match.ts`) inside `<GlossedText>` marks glossary terms for you.
"Is QAM highlighted?" reduces to "is QAM in the map?", never "did the author remember to wrap it" —
so highlighting can't drift page to page. When you add a module or a `dsp/` primitive that
introduces a non-obvious term or acronym, you do **one** thing:

- Add a glossary entry (`id`, `term`, optional `expansion`, one-sentence `gloss`, optional `moduleId`
  link, optional `docsPage`). The `gloss` **must stay in sync** with that term's `docs/dsp`
  one-liner — they're the same idea at two lengths. Match-only surface variants (plurals, phrases,
  `I/Q` for `IQ`, `16-QAM` for `QAM`) go in the `ALIASES` map in `match.ts`.

Then just write plain prose — `the FFT turns the waveform into its spectrum…` — and the side rail,
captions, and module intro all gloss it automatically. Prose surfaces are wrapped centrally
(`ModuleView` wraps the explanation + intro; module captions wrap their text in `<GlossedText>`), so
new copy is glossed by construction.

**The marking rules the matcher enforces (you don't think about these):**

- **Teaching-page exclusion:** a term is never marked on the module that teaches it.
- **First use per section:** marked once per `<section>` (a reading chunk), not every occurrence and
  not just once for a whole long page — predictable, never a minefield.
- **Excluded surfaces:** headings, `code`, and controls (buttons/sliders/labels) are never glossed.
- **Tokenization:** boundary-aware and case-sensitive (no `FM` inside "confirm"), separator-aware
  (`QPSK/QAM` → both), longest-match-first (`16-QAM` is one unit), phrases and simple plurals.

**Overrides (exceptions only):** wrap a span in `<NoGloss>…</NoGloss>` to suppress marking, or
hand-place a `<Term id="…">…</Term>` to force one. These are escape hatches, not the default.

**The popover is a definition, not a lesson:** one expansion + one sentence.

**What to define (the cutoff).** The test is **conceptual load, not the unit or how technical it
looks.** Define what is domain-specific _or_ compresses a non-obvious concept; do **not** define
general scientific/SI literacy a strong engineer already has. The judgment question: _"Would a
strong software engineer with no RF/DSP background actually stall here — or only because they
momentarily forgot high-school physics?"_

The calibration case is `Hz` vs `dB`, which look like the same category (units) but fall on opposite
sides of the line:

- **`Hz` → don't define.** General literacy; a gloss here is pure noise.
- **`dB` → define.** It only _looks_ like a unit. It's a logarithmic _ratio_, and "3 dB ≈ half
  power" genuinely trips up non-EEs.

And **gloss the concept, not the letters**: `dBm` → "a power level on a logarithmic scale,"
not "decibel-milliwatts" (that's the `expansion` field's job).

## User-facing copy: no internal layer/track vocabulary

**Layer numbers** (Layer 0/1/2…) and **track letters** (Track A–F) are build-time scaffolding — they
organize the registry and the brief, and they belong in code, comments, `docs/`, and this file.
**Users never see them**: the UI shows human names (tracks like "Direction Finding & Geolocation",
layer groupings like "Foundations" / "The Transmit Chain"). So **rendered copy must never say
`Layer N` or `Track X`** (or spelled-out variants like "the second track") — it points the reader at
a coordinate system that doesn't exist for them.

For a cross-reference, instead:

- name the **human module/track** ("the cross-correlation module", "the Propagation & Bands track"),
  linked where the glossary already does it (a `<Term>` whose entry teaches that module); or
- simply **restate the concept** ("that's the cross-correlation peak") when a full reference isn't
  needed.

**This extends to badges and status labels, not just prose.** A module's registry `status` (`stub`,
`advanced`, …) is authoring vocabulary too — `stub` means "deliberately lighter / conceptual lesson"
to us, but a raw **"STUB"** badge reads as "unfinished / placeholder" and undersells a finished,
interactive module. So **map internal status tokens to user-facing labels at render time** and never
render the raw token: `moduleStatusBadge()` in the registry does this (`stub` → **"Conceptual"**,
`stable` → no badge), the same authoring→presentation mapping as layer names. (`PLANNED` / `BUILDING`
on a not-yet-built _track_ are fine — they honestly mean "not available yet"; the rule is about
labeling a finished module with a word that implies it isn't.)

This is the same internal-vocabulary-leak class as the glossary and accent-semantics rules, so it's
guarded the same way: `src/test/no-internal-vocab.test.ts` strips comments and fails if any
user-facing string matches `Layer \d` / `Track [A-F]`, and `src/components/layout/Sidebar.test.tsx`
asserts the rendered status badge shows the mapped label (not the raw token) — so a leak can't
silently reappear.

## Labeling plot axes

Wavefront's premise is that the **visualization** carries the intuition and the prose only supports
it — so an unlabeled axis inverts the whole tool. Every plot must say what its axes represent, and it
does so **through the shared plot components** (`src/components/plots/`), not plot-by-plot. The rule:

1. **Always label the quantity** (and its scale): `Time`, `Frequency`, `Magnitude (dB)`, `Amplitude`,
   `Phase (°)`, `Sample`, `Bit error rate (log)`… This is mandatory.
2. **Show a unit only when the quantity actually has one.** Don't fabricate units for normalized or
   unitless axes — a window taper is `Amplitude` (a 0→1 weight, no unit) over `Sample` (an index).
3. **Where the scale is the lesson, the label is doing teaching work — never omit it.** This is the
   point of the **dB**, **normalized-frequency**, and **log** cases:
   - A spectrum's y is `Magnitude (dB)` — here the dB _is_ the concept, so it must appear.
   - A spectrum's x is `Frequency (Hz)` **only** when there's a real sample rate; otherwise it's
     `Normalized frequency (cycles/sample)`. "Frequency doesn't have to be in Hz" is worth teaching,
     not hiding — so label normalized axes as normalized.
4. **Keep it lightweight.** A small, quiet caption from the design tokens — not tick/gridline spam.
   Add numeric ticks only where a reader must read magnitudes off the plot; for pure-intuition plots
   the quantity label alone is enough. This is about labels, not a charting-library rebuild.

### How it's enforced (so it can't drift)

Axis labels are a structured type, splitting meaning from unit so rule 2 is structural:

```ts
import { AXIS, type AxisLabel } from '@/components/plots/axisLabel';

interface AxisLabel {
  quantity: string; // required, non-empty — what the axis represents (and its scale)
  unit?: string; // only when the quantity genuinely has one: 'Hz', 'dB', '°', 'cycles/sample'
}

<SpectrumPlot data={spectrum} yLabel={AXIS.magnitudeDb} xLabel={AXIS.normalizedFrequency} />;
// module-specific axes pass an inline object:
<XYPlot … yLabel={{ quantity: 'Bit error rate (log)' }} xLabel={{ quantity: 'Eb/N0', unit: 'dB' }} />;
```

- The Cartesian plots (`TimeSeriesPlot`, `SpectrumPlot`, `XYPlot`, `SpectrogramPlot`,
  `EyeDiagramPlot`) make `xLabel`/`yLabel` **required props** — a plot that doesn't name its axes
  won't compile, so new modules are labeled by default rather than by remembering. Reuse the `AXIS`
  presets for recurring axes (`magnitudeDb`, `normalizedFrequency`, `sample`, `time`, `amplitude`) so
  every spectrum is worded the same way; put a plot's descriptive title ("passband on the wire") in a
  `<PlotTitle>` above the plot, not in the axis label. `PlotTitle` renders the name as a heading
  (proportional face, a little brighter/heavier) so it stays distinct from the quiet monospace axis
  captions that share the corner — without it the title and the top-left y-label fuse into one
  two-line caption.
- The plots with **intrinsic** axes label themselves: `ConstellationPlot` and `PhasorPlot` draw the
  `I`/`Q` axes, and `PolarPlot` captions its bearing/power axes. `WorldMap` is exempt — its
  latitude/longitude graticule is self-describing.
- This is **backed by a test** (`src/components/plots/{axisLabel,plots}.test.tsx`): the quantity must
  be non-empty (`formatAxisLabel` throws otherwise) and the captions/aria-labels are checked on
  render. Bespoke module canvases (built directly on `useCanvas`) aren't required props, but should
  follow the same rule.

## Accent color semantics

The green accent has **one job: live / interactive.** Keeping it to one meaning is what makes it
learnable — green stops reading as "editable" and starts reliably meaning "this is alive / I can act
on it."

- **Green (`signal`, with `cyan` as the secondary) = the stuff that's alive or actable** — current
  readout values, live slider values, the active nav item, links, and draggable-handle accents.
- **Neutral (`text` / `text-muted` / `text-faint`) = static** — labels, titles, units, axis
  captions, prose, and field _names_ (as opposed to their live values). Static formulas in the "Go
  deeper" panels are neutral `text-text`, not green.
- A control box should read as **"static label : live value"** — exactly the `Readout` pattern (name
  `text-text-faint`, value `text-signal` only when it's a live/measured value).
- **Glossary `<Term>` links** are also accent-colored; the **dotted underline** carries the
  link-vs-value distinction within the same accent (live values are never underlined).
- The one sanctioned exception is the **brand wordmark** (`<Wordmark>`): the accent _is_ the brand
  color, and in the sidebar the lockup is itself the clickable "home" control.

Roles are documented at the source in `src/design/tokens.ts`. When in doubt: if it changes or
responds to the user it may be green; if it's a fixed label, it's neutral.

## Interactive affordance

Wavefront is direct-manipulation first, so **interactive elements must announce themselves**, the
same way everywhere (documented so new tracks inherit it):

- **Draggable canvas handles** (the `WorldMap` markers, the interferometer emitter): the cursor
  becomes `grab` on hover and `grabbing` while dragging, a faint **persistent halo ring** marks each
  handle as grabbable (not plotted data), and keyboard users get a focus ring + arrow-key nudge.
  `WorldMap` owns this for the geolocation maps; bespoke canvases follow the same recipe.
- **Sliders** all go through the shared **`<Slider>`** (`src/components/Slider.tsx`) — never a
  hand-rolled `<input type="range">` (a test fails if one appears). It pairs the static field name
  with its live accent value and renders one range input whose track surface, accent fill-to-value,
  and grabbable handle are styled once in `index.css`, so a slider never reads as a bare dot on a
  hairline regardless of the page it's on.
- **Selectable chips / buttons** look pressable — border + surface fill, a hover state, and a clear
  selected state (`border-signal-dim bg-surface-raised text-signal`). They must not read as a legend.
- **Lean on passive affordance.** Cursor/hover/focus do the discovery; keep at most **one quiet
  textual hint** per interactive map (a single `text-text-faint` line near the controls) — never
  on-canvas "drag me" labels or persistent instructional chrome.

## Keep controls co-visible with their target plot

Wavefront is drag-and-watch: a control and the visualization it changes must stay **co-visible** — a
reader must never have to choose between seeing the sliders and seeing the plot they affect. Most
modules have a plot or two above the controls, so this holds for free. The **synthesis** modules that
stack several representations push the controls off the fold, and the drag-watch loop silently breaks
on exactly the modules that most need it — whether the controls sit at the **bottom** (the radar
range-Doppler scene; GPS acquisition) and scroll off below, or at the **top** (the Modulation Zoo's
SNR slider + scheme chips, with plot rows stacked beneath) and scroll off above.

The shared mechanism is **`<ControlRail edge>`** (`src/components/ControlRail.tsx`): wrap a module's
primary controls in it and `ModuleView` lays the column out as a **scrolling plot region between a
pinned header and footer** — the rail portals into the slot for the edge it's anchored on (`edge`
defaults to `"bottom"`; pass `edge="top"` for top-anchored controls), so the plots scroll _up to_ its
edge and stop, **never under it** (an in-flow `sticky` rail can't avoid that: the content shares its
scroll box and slides beneath, showing a peek-through strip). **Pin controls to whichever edge they
live on, so the loop is never severed regardless of control placement.** The rail is a solid, opaque
`bg-surface` floor/ceiling with a border + shadow on the side that faces the plots (a bottom rail
borders/shadows up; a top rail borders/shadows down). For a bottom rail, place the module's **marquee
/ target plot last** so it sits directly above the rail (on the radar module, the range-Doppler map;
the explanatory single-pulse plots sit above that). A tall module signals scrollability with a
**bottom fade gradient** — partial content fades into the background at the bottom edge, the canonical
"more below" cue. It's used on **both main content scroll regions**: the module plot region
(`.wf-scroll`, fading to `bg`) and the explanation side-rail (`.wf-aside-fade`, fading to the panel's
own `surface`). Because each fades to the color behind it, a panel that doesn't overflow leaves bare
background under the fade and shows nothing — so a short explanation never gets a phantom gradient.
The fade is static and background-derived (never the green accent), and there's no per-module "scroll
for more" text (one quiet visual cue, not prose). We don't try to _force_ the scrollbar visible
(browsers auto-hide overlay scrollbars regardless), but when it does show it's a useful position
indicator, so it's styled on-theme **app-wide** — a single global rule in `index.css` (nav, module
region, and side-rail all match) styles every state (rest/hover/active — a quiet token-neutral thumb,
never the green accent) so no scrollbar ever falls back to the default grey. The fade stays the
scrollability cue; the scrollbar just shows position. Where this layout doesn't fit, the accepted
alternatives are placing the controls **beside** a tall plot (two-column) or capping stacked-plot
height. Playwright checks in `e2e/screenshots.spec.ts` assert co-visibility for **both** edges — the
radar map and its footer sliders (bottom), and the Modulation Zoo's pinned SNR/chip header with a
lower plot row scrolled into view (top) — with the plot never rendering under the rail and the fade
cue present, so the regression can't quietly return as more tall synthesis modules land.

## Coding conventions

- **TypeScript strict**; no `any` where a real type fits.
- **Read colors from `src/design/tokens.ts`**, never hard-code hex in components/canvas.
- Use the **`@/` alias** for imports from `src/`.
- **Direct manipulation over forms**: prefer draggable elements and live sliders.
- Keep DSP problem sizes modest and memoize; target 60fps on live-drag interactions.
- **Scope guardrail:** textbook-level, public theory only; all example signals synthetic.

## Commit style

Small, logical commits with [Conventional Commits](https://www.conventionalcommits.org/)
messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`…). No giant dumps.
