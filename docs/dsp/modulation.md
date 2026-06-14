# Modulators, waveforms, and modulation features

> Source: [`src/dsp/modulation.ts`](../../src/dsp/modulation.ts),
> [`src/dsp/waveforms.ts`](../../src/dsp/waveforms.ts), [`src/dsp/features.ts`](../../src/dsp/features.ts).
> Verified by: [`modulation.test.ts`](../../src/dsp/modulation.test.ts),
> [`waveforms.test.ts`](../../src/dsp/waveforms.test.ts), [`features.test.ts`](../../src/dsp/features.test.ts).

## The pluggable Modulator

A common `Modulator` interface (`modulate(bits, sps) → { signal, symbols?, sps }`) lets the same
bitstream flow through the same channel and views regardless of scheme — so comparisons are
apples-to-apples and new schemes are additions, not rewrites.

- **Linear (PSK/QAM)** — map bits to constellation symbols (reusing `comms`), then RRC pulse-shape
  each rail. Exposes `symbols` for the constellation/eye.
- **Constant-envelope (CPFSK/MSK)** — integrate a frequency that the bits steer, so `|signal| = 1`
  (no constellation; read in frequency). `h = 0.5` is MSK.

## Analog

`am` rides the message on amplitude (`1 + μ·m` → carrier + two sidebands); `fm`/`pm` bend
frequency/phase (constant envelope, a Carson-rule fan of sidebands).

## Waveform-level systems

- `ofdmSymbol` / `ofdmModulate` — place QAM symbols on subcarriers, IFFT to time, prepend a cyclic
  prefix (tail copied to front) so multipath becomes a per-subcarrier multiply.
- `chirp` — a linearly swept tone (constant envelope), the spectrogram diagonal.
- `pnCode` / `dsssSpread` / `processingGainDb` — spread each bit by a PN code into `L` chips;
  processing gain is `10·log10(L)` dB.

## Modulation features

`extractFeatures` returns three discriminators — envelope coefficient of variation (constant-envelope
vs amplitude-bearing), spectral spread (compact MSK vs wide FSK), and Q-rail energy fraction (BPSK ≈ 0
vs QPSK/QAM ≈ ½). `classify` is nearest-prototype in that space; the tests confirm each clean scheme
classifies as itself.

## Where it's used

The whole of Track C: the Analog on-ramp, Modulation Zoo, OFDM, Spread Spectrum, Chirp, and the
Modulation Classifier.
