# Channel impairments: multipath, carrier offset, BER-vs-SNR

> Source: [`src/dsp/channel.ts`](../../src/dsp/channel.ts).
> Verified by: [`channel.test.ts`](../../src/dsp/channel.test.ts).

## The idea (plain language)

Between transmitter and receiver the signal is mangled in characteristic ways. This page covers the
three that Track B's Layer-2 modules visualize: multipath echoes, a carrier frequency/phase offset,
and the BER-vs-SNR curve that summarizes link quality.

## Multipath (FIR channel)

`multipath(signal, taps)` sums delayed, scaled copies — `y[n] = Σ gainₖ·x[n − delayₖ]`. In frequency
(`channelResponseDb`), `H(f) = Σ gainₖ·e^{−j2πf·delayₖ}` carves **notches** where the copies cancel
and peaks where they add — frequency-selective fading. In time the echo bleeds symbols together
(ISI), closing the eye.

## Carrier offset (constellation spin)

`applyCfo(symbols, cfo, phase)` rotates symbol `i` by `e^{j(2π·cfo·i + phase)}`. A constant `phase`
tilts the constellation to a fixed angle; a nonzero `cfo` keeps rotating it — a continuous **spin**.
Doppler from relative motion is the same thing: a frequency offset.

## BER vs SNR

`berVsSnr(scheme, ebN0sDb, …)` sweeps Eb/N0, runs random data through `awgn` + hard decisions, and
returns `{ ebN0, ber }` points — the **waterfall** curve. Denser constellations need more Eb/N0 for
the same BER.

## What the tests pin down

- A unit tap passes the signal through; a delayed echo adds the expected shifted copy.
- The channel response is flat for one tap and carves a deep notch where a two-tap echo cancels.
- A pure phase offset rotates without changing magnitude; a frequency offset accumulates rotation.
- BER decreases monotonically with Eb/N0 and is `~0` at high Eb/N0.

## Where it's used

The **Multipath & Fading** and **Carrier Offset & Doppler** modules, and the BER-vs-Eb/N0 curve in
the **Send a Message** marquee (Track B).
