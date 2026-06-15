# Gain & clipping

> Source: [`src/dsp/gain.ts`](../../src/dsp/gain.ts).
> Verified by: [`gain.test.ts`](../../src/dsp/gain.test.ts).

## The idea (plain language)

Before a sample is quantized it passes through an amplifier whose job is to fill the converter's
range. Too little gain and the signal sits in the bottom few bits, where quantization noise swamps
it. Too much and the peaks slam into the rails and **clip** — the flattened tops are no longer a sine,
so energy folds into harmonics and spurs that no later stage can remove. The sweet spot between is
why **automatic gain control (AGC)** exists.

## The numbers

```
gain (linear) = 10^(dB / 20)              (dbToLinear)
clip(x)       = max(−limit, min(limit, x))  hard saturation at the rails   (clip)
headroom dB   = 20·log10(limit / peak)      margin before the rails        (headroomDb)
```

A symmetric (odd) clipper grows **odd** harmonics (3f, 5f, …) but no even ones — a clipped sine
trends toward a square wave.

| Function             | Role                                            |
| -------------------- | ----------------------------------------------- |
| `dbToLinear`         | dB → linear multiplier                          |
| `clip` / `applyGain` | saturate at ±limit; gain-then-clip in one step  |
| `clippedFraction`    | fraction of samples on a rail (a clip detector) |
| `headroomDb`         | how far the peak sits below the rail            |

## What the tests pin down

- `0 dB = ×1`, `20 dB = ×10`, `6.02 dB ≈ ×2`; `clip` saturates at ±limit.
- `clippedFraction` and `headroomDb` report the rail state correctly.
- A hard-clipped sine grows odd harmonics (3f, 5f) but not even ones.

Taught interactively in the **Gain, Clipping & AGC** module.
