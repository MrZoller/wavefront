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
3. `registerModule({ ... })` and import the file from `src/modules/index.ts`.
4. Add a `docs/dsp/` page linking the verifying test.
5. **Register any new jargon in the glossary** and wrap its first in-UI use in `<Term>` (below).

## Adding a track

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#recipe-add-a-new-track).

## Inline glossary (`<Term>`)

Wavefront is for software engineers who are **not** EEs. Jargon gets a one-tap safety net via a
single source of truth, [`src/glossary/glossary.ts`](./src/glossary/glossary.ts), surfaced inline
by `<Term id="…">`. **This is a standing contract, not a one-time pass** — a coverage test
(`src/glossary/glossary.test.ts`) fails CI if it drifts.

When you add a module or a `dsp/` primitive that introduces a non-obvious term or acronym:

1. Add a glossary entry (`id`, `term`, optional `expansion`, one-sentence `gloss`, optional
   `moduleId` link, optional `docsPage`). The `gloss` **must stay in sync** with that term's
   `docs/dsp` one-liner — they're the same idea at two lengths.
2. Wrap its **first significant use within each primary explanatory surface** in
   `<Term id="…">…</Term>`. Use `<Term id="…" />` to render the display term itself.

```tsx
// glossary.ts
fft: { id: 'fft', term: 'FFT', expansion: 'Fast Fourier Transform',
       gloss: 'A fast algorithm that converts a signal between its time view and its frequency view.',
       moduleId: 'dft-basis', docsPage: 'fft' },

// in a module's copy
the <Term id="fft">FFT</Term> turns the waveform into its spectrum…
```

**Scope first-use _per explanatory surface_, not per page.** A module page has distinct surfaces a
reader navigates independently — the **side-rail explanation panel**, the **body copy / captions**,
and the **module intro/description**. Each should stand on its own, so a term gets its marker on its
first significant use _within each surface_ (the side rail glosses `FFT` even if a body caption
already did). Don't let a terse caption "spend" the first-use that the explanation panel needs.

**Restraint is still the whole game.** _Within_ a surface: first significant use only, not every
occurrence — the goal is "every surface is self-sufficient," not "underline everything." Never wrap
a term in a heading, control, or axis label, and never self-referentially inside the module that
teaches it (the popover hides its own "Learn more" link in that case anyway). The popover is a
definition, not a lesson: one expansion + one sentence.

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
