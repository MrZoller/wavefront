# Channel estimation & equalization: pilots, ZF/MMSE, and adaptive LMS

> Source: [`src/dsp/equalization.ts`](../../src/dsp/equalization.ts).
> Verified by: [`equalization.test.ts`](../../src/dsp/equalization.test.ts).

## The idea (plain language)

Multipath convolves the transmitted stream with a short impulse response `h` — symbols smear into
each other (inter-symbol interference), the constellation streaks, the eye shuts. To undo it you
first **measure** the channel, then **invert** it. This page is the math under the **Channel
Estimation** and **Equalization** modules.

## The channel as convolution

`applyChannelLinear` is the causal FIR channel `y[n] = Σ_l h[l]·x[n−l]`. The block model used by the
equalizer is **circular** convolution (`applyChannelCircular`): `y = IFFT(FFT(x)·H)`, where
`H = channelFreqResponse(h)`. That's one complex gain per FFT bin — the same per-subcarrier picture
OFDM uses, which is what makes equalization a single divide per bin.

## Pilot-based least-squares estimation

`estimateChannelLS(pilots, received, numTaps)` fits the channel from **known** pilots: stack them
into a convolution matrix `A` and solve the normal equations `(AᴴA)·ĥ = Aᴴy` (a small complex
Gaussian-elimination solve). With no noise it's exact; noise averages down as the pilot count grows,
so the estimate converges to truth.

## Zero-forcing vs. MMSE

`equalize(received, taps, mode, snr)` inverts the channel in the frequency domain:

```
zero-forcing:  W = 1/H                    exact inverse, amplifies noise in the nulls
MMSE:          W = conj(H)/(|H|² + 1/SNR) backs off in the nulls (needs the linear SNR)
```

`evm` (error vector magnitude) is the constellation-quality readout that drops when the equalizer
re-clusters the points.

## Adaptive LMS

`lmsEqualizer(received, desired, numTaps, mu)` never forms `1/H`. It runs an FIR filter and, against
known symbols, takes one gradient step per sample:

```
y[n] = Σ_k w_k·x[n−k]      e = d − y      w_k ← w_k + μ·e·x[n−k]*
```

The weights climb to the channel inverse and `|e|²` falls (in the mean) — gradient descent on error,
the linear ancestor of a learned (neural) equalizer.

## What the tests pin down

- A unit tap is a pass-through; a unit tap's response is flat at magnitude 1.
- LS recovers the channel **exactly** with no noise, and the estimate error shrinks as pilots grow and
  as noise drops.
- Zero-forcing inverts the channel exactly (no noise); MMSE drops the constellation EVM well below the
  distorted input.
- LMS drives `|e|²` down, learns weights that approximate the channel inverse, and recovers the
  transmitted symbols end-to-end.

## Where it's used

The **Channel Estimation** module (the converging estimate-vs-truth overlay) and the **Equalization**
capstone (the snap-back constellation, the eye reopening, and the live LMS "go deeper" view) — both in
the Coding & Equalization track.
