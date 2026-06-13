# Wavefront docs

The index for Wavefront's documentation. These docs double as the "go deeper" content
behind each module's progressive-disclosure drawer (brief §3.4, §14).

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the module-registry contract, the from-scratch
  `dsp/` core, the shared viz library, data flow, and step-by-step recipes for adding a module
  or a track. **Start here to extend the project.**
- **[dsp/](./dsp/)** — a short, math-honest page per core algorithm: the equation it implements
  and a link to the test that verifies it.
- **[tracks/](./tracks/)** — one page per track summarizing its curriculum and the intuition
  each module delivers.
- **images/** — auto-generated screenshots (`npm run screenshots`), embedded in the README and
  per-track docs.

## Scope note

Everything here is public, unclassified, textbook-level DSP/RF theory, and **all example
signals are synthetic** (brief §12).
