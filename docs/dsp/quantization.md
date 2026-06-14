# Quantization (ADC bit depth)

> Source: [`src/dsp/quantization.ts`](../../src/dsp/quantization.ts).
> Verified by: [`quantization.test.ts`](../../src/dsp/quantization.test.ts).

## The idea (plain language)

An analog-to-digital converter can only output a finite set of levels — `2^N` of them for `N` bits.
Each sample is rounded to the nearest, and the leftover (up to ±½ a level) is **quantization noise**.
This is where the IQ samples every other track consumes are actually born.

## The numbers

For a full-scale sinusoid through an `N`-bit converter, the signal-to-quantization-noise ratio is:

```
SQNR ≈ 6.02·N + 1.76 dB        (idealSqnrDb)
```

Each added bit halves the step size — halving the rounding error and dropping the noise floor ≈6 dB,
i.e. one more bit of **dynamic range**. Optional **dither** (±1 LSB triangular noise added before
rounding) decorrelates the error, trading a slightly higher floor for no harmonic spurs.

| Function                      | Role                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| `quantize` / `quantizeSignal` | round to one of `2^N` levels (clamping the rails); opt. dither |
| `idealSqnrDb`                 | the `6.02·N + 1.76 dB` rule                                    |
| `sqnrDb`                      | measured SQNR of a clean-vs-quantized pair                     |
| `levels` / `stepSize`         | `2^N`, and one LSB                                             |

## What the tests pin down

- A full-scale sine lands within ~1 dB of `6.02·N + 1.76`.
- Each added bit raises SQNR ≈6 dB (one more bit of dynamic range).
- In-range error never exceeds ½ an LSB; out-of-range inputs clamp to the rails.
- Dithered output is deterministic under an injected RNG.

Taught interactively in the **Quantization & Bit Depth** module.
