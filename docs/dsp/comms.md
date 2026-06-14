# Digital comms: constellations, AWGN, and BER

> Source: [`src/dsp/comms.ts`](../../src/dsp/comms.ts).
> Verified by: [`comms.test.ts`](../../src/dsp/comms.test.ts).

## The idea (plain language)

A radio sends data by transmitting short tones whose amplitude and phase are chosen from a fixed
menu of I/Q points — a **constellation**. Bits pick the point; noise nudges it; the receiver guesses
the nearest point and reads the bits back. This page is the math under Track B.

## Constellations

Each scheme is a set of `2^k` points (`k` = bits/symbol), Gray-coded and normalized to **unit
average symbol energy**:

```
BPSK   k=1   ±1
QPSK   k=2   (±1 ± j)/√2
16-QAM k=4   {−3,−1,1,3}² / √10
```

- **Gray coding** — points are labeled so physical neighbors differ by exactly one bit, so the most
  likely error (a slip to the nearest wrong point) costs a single bit. `bitsToSymbols` groups bits
  MSB-first and looks up the point; `symbolsToBits` / `nearestSymbol` do the reverse by minimum
  Euclidean distance.
- **Energy normalization** — dividing by `√(mean energy)` makes the Eb/N0 comparison across schemes
  fair (a 16-QAM symbol carries 4× the bits, so it needs more energy per symbol for the same per-bit
  margin).

## AWGN channel and Eb/N0

`awgn` adds complex Gaussian noise (Box–Muller, seeded) to each symbol. The noise level is set from
the target **Eb/N0**, with unit symbol energy:

```
Eb = 1/k      N0 = Eb / (Eb/N0)      σ = √(N0/2)   per I/Q axis      (noiseSigma)
```

`bitErrorRate` then counts the fraction of differing bits between the transmitted and sliced streams.

## What the tests pin down

- Every constellation has unit average energy and is Gray-coded (nearest neighbors differ by one
  bit).
- Bits round-trip through `bitsToSymbols` → `symbolsToBits` with no noise; a partial trailing group
  is zero-padded.
- `noiseSigma(0 dB, k=2) = 0.5` and decreases with Eb/N0; `awgn` is deterministic per seed and has
  the requested standard deviation.
- End-to-end BER is ~0 at high Eb/N0 and rises as it drops.

## Where it's used

The **Symbol Mapping** and **The Noisy Channel** modules (Track B), rendered on the shared
`ConstellationPlot` viz.
