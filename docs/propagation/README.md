# Propagation physics (`propagation/`)

The "go deeper" pages for the **Propagation & Bands** track. These mirror the
[`docs/dsp/`](../dsp/) pages in spirit — equation in, link to the verifying test — but they describe
the [`src/propagation/`](../../src/propagation/) module, **not** the from-scratch `dsp/` core.

That separation is deliberate (brief §8, §10): propagation is **RF physics — how energy crosses a
medium before it becomes samples** — so its band lookup, radio-horizon calculator, and skywave
geometry live behind their own boundary and never touch the signal-processing core.

- **[Wavelength & bands](./wavelength-and-bands.md)** — `λ = c/f` and the LF…SHF band ladder with each
  band's dominant propagation mode and rough reach.
- **[Radio horizon](./radio-horizon.md)** — the geometric line-of-sight distance, `d ≈ 3.57·(√h₁ +
√h₂)` km.
- **[Skywave & MUF](./skywave.md)** — the conceptual reflect-vs-penetrate rule (the maximum usable
  frequency) and the illustrative skywave bearing deflection behind the geolocation cross-link.

## Scope

Everything here is public, **textbook-level** RF theory, kept strictly illustrative. Modes, reaches,
critical frequencies, and bearing deflections are teaching values, **not** predictions or real system
parameters. All values synthetic.
