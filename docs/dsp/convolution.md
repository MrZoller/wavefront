# Convolution & the impulse response

> Source: [`src/dsp/convolution.ts`](../../src/dsp/convolution.ts).
> Verified by: [`convolution.test.ts`](../../src/dsp/convolution.test.ts).

## The idea (plain language)

A linear, time-invariant (**LTI**) system is completely described by **one** thing — its **impulse
response** `h`, i.e. what comes out when you feed in a single unit impulse ("ping it once"). Once you
know `h`, the output for _any_ input `x` is the sum of a shifted, scaled copy of `h` for every input
sample. That sum is **convolution**:

```
y[k] = Σ_j x[j]·h[k − j]   (equivalently Σ_j h[j]·x[k − j] — convolution commutes)
```

You don't have to know what's inside the box: poke it once, see what comes out, and you can predict
its response to anything.

## You've been doing this all along

The point of naming the operation is that the rest of the app already runs on it — only the impulse
response `h` changes:

- a **moving-average / low-pass FIR filter** is convolution with a short run of equal taps (the taps
  _are_ the impulse response);
- the **matched filter** is convolution with a _flipped_ copy of the pulse (the test below proves it
  equals cross-correlation against the pulse);
- **pulse shaping** is convolving the symbols with the pulse shape;
- **multipath** is convolution with a few-tap echo response (a spike plus delayed, smaller spikes).

## The functions

- `convolve(x, h)` — full linear convolution, length `x.length + h.length − 1`. The workhorse the FIR,
  pulse-shaping, matched-filter, and multipath code all share; pulse shaping re-exports it from here
  (`src/dsp/pulse.ts`) rather than carrying its own copy.
- `convolveAt(x, h, k)` — the single output sample `y[k]` at one slide position `k`, without building
  the whole output. Equal to `convolve(x, h)[k]` on the support and `0` outside it; the module's
  scrubber reads out exactly this so the "flip · shift · multiply · sum" mechanism is the literal
  definition.

## Convolution in time = multiplication in frequency

Convolving two signals in time multiplies their spectra in frequency. That is why filtering is
"multiply the spectra," and why the FFT enables _fast_ convolution: transform both, multiply
point-by-point, transform back. See [the DFT as a change of basis](./fft.md).

## What the tests pin down

- **Identity:** convolving with a unit impulse returns the input unchanged; a shifted impulse delays it.
- **Length:** output length is `len(x) + len(h) − 1`.
- **Commutativity:** `convolve(x, h) == convolve(h, x)`.
- **Worked examples:** `[1,2,3] ⊛ [1,1] = [1,3,5,3]` and `[1,2,3] ⊛ [0,1,0.5] = [0,1,2.5,4,1.5]`.
- **`convolveAt` agreement:** equals `convolve(...)[k]` at every `k`, and `0` off the support.
- **Cross-link correctness:** `convolve(sig, reverse(pulse))` equals `crossCorrelate(pulse, sig)` — so
  the matched filter and this module are the same operation, only with `h` = the flipped pulse.

## Where it's used

The **Convolution & the Impulse Response** module (Fundamentals — Systems), and, under the hood,
**FIR Filtering**, **Pulse Shaping**, the **Matched Filter**, and **Multipath & Fading**.
