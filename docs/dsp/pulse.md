# Pulse shaping & the matched filter

> Source: [`src/dsp/pulse.ts`](../../src/dsp/pulse.ts).
> Verified by: [`pulse.test.ts`](../../src/dsp/pulse.test.ts).

## The idea (plain language)

Symbols are discrete numbers, but a transmitter emits a continuous waveform. **Pulse shaping** turns
each symbol into a smooth pulse and adds them up; the receiver's **matched filter** then pulls those
pulses back out of noise. The pulse is chosen so overlapping pulses still don't interfere at the
sampling instants.

## Raised cosine (Nyquist, ISI-free)

`raisedCosine(beta, span, sps)` samples the RC pulse at `sps` samples/symbol. Its defining property:
it is **1 at its own center and exactly 0 at every other integer symbol offset**. So sampling the sum
of many RC pulses recovers each symbol with zero inter-symbol interference, even though the pulses
overlap continuously in between. `beta` ∈ [0,1] is the roll-off — excess bandwidth is `(1+beta)/2` of
the symbol rate per side (small β = tight spectrum, long ringing tails; large β = gentle and wide).

## Root raised cosine & the matched filter

`rootRaisedCosine(beta, span, sps)` is the RC split in half (unit energy, `Σh² = 1`). Use an RRC at
the transmitter and an identical RRC at the receiver: their cascade is one full RC, so you get **both**

- the **matched filter** (correlating against the transmitted pulse maximizes SNR at the sampling
  instant), and
- the **Nyquist no-ISI** property.

`upsample(symbols, sps)` zero-stuffs symbols up to the waveform rate; `convolve(x, h)` is the FIR
convolution used both to shape (`upsample ⊛ rrc`) and to matched-filter (`noisy ⊛ rrc`).

## What the tests pin down

- RC peaks at 1 and is `~0` at every nonzero integer symbol offset (ISI-free).
- RRC has unit energy and is symmetric; `RRC ⊛ RRC` is ISI-free at symbol-spaced samples (it is an
  RC).
- `upsample` zero-stuffs correctly; `convolve` matches hand calcs and reproduces a lone pulse from a
  single upsampled impulse.

## Where it's used

The **Pulse Shaping** and **Matched Filter** modules (Track B) — the transmitted waveform and the
receiver eye diagram.
