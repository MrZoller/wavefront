# Sampling, FIR design, multirate & channelization

> Source: [`sampling.ts`](../../src/dsp/sampling.ts), [`filter.ts`](../../src/dsp/filter.ts),
> [`multirate.ts`](../../src/dsp/multirate.ts), [`channelizer.ts`](../../src/dsp/channelizer.ts).
> Verified by: [`multirate.test.ts`](../../src/dsp/multirate.test.ts),
> [`filter.test.ts`](../../src/dsp/filter.test.ts), [`channelizer.test.ts`](../../src/dsp/channelizer.test.ts).

## Sampling & aliasing

`aliasedFrequency(f, fs)` folds a frequency into the observable band `[0, fs/2]`: sampling makes the
spectrum periodic, so anything above Nyquist (`fs/2`) reappears as a lower "alias". Irreversible —
hence anti-alias filtering before any rate reduction.

## FIR design

`firLowpass(cutoff, numTaps)` is a windowed-sinc low-pass: the ideal brick-wall `sinc` truncated and
Hann-tapered, normalized to unit DC gain. `firResponseDb(taps)` is `|Σ h[n]·e^{−j2πfn}|` in dB — the
taps and the response are the same filter in two domains.

## Multirate

- `decimate(signal, M)` — low-pass to the new Nyquist (`0.5/M`) then keep every `M`-th sample;
  `antiAlias:false` skips the filter so aliasing returns.
- `interpolate(signal, L)` — zero-stuff by `L` then low-pass (gain `L`) to remove the images.

## Channelization

- `ddc(signal, fc, M)` — digital downconverter: mix `fc` to zero, low-pass, decimate by `M`. One
  channel out of a wide band.
- `channelize(signal, nCh, proto)` — analysis filter bank: every channel `k` mixes `k/nCh` to zero,
  filters with prototype `proto`, decimates by `nCh`. The prototype is the whole story:
  - `bareFftProto(nCh)` — a length-`nCh` **rectangle**, reproducing the FFT bank's leaky `sinc`
    channels (tall sidelobes → adjacent-channel bleed).
  - `pfbProto(nCh, tapsPerBranch)` — a **designed** windowed-sinc spanning several taps per channel,
    giving sharp, well-isolated channels (the polyphase filter bank).

## What the tests pin down

- Alias folding (`70 → 30` at `fs = 100`), unit DC gain + stopband rejection of `firLowpass`.
- `decimate`/`interpolate` change length correctly and preserve a DC signal.
- A tuned `ddc` brings its tone to a steady DC; `channelize` routes a tone to its own channel and the
  PFB rejects an off-center tone in neighbors far better than the bare FFT.

## Where it's used

Track D's Sampling, FIR, Multirate, and Channelizer modules. (The FFT itself is in
[`fft.md`](./fft.md).)
