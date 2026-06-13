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

## Adding a track

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#recipe-add-a-new-track).

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
