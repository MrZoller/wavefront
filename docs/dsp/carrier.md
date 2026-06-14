# Up/Downconversion (carrier mixing)

> Source: [`src/dsp/carrier.ts`](../../src/dsp/carrier.ts).
> Verified by: [`carrier.test.ts`](../../src/dsp/carrier.test.ts).

## The idea (plain language)

Baseband I/Q sits near 0 Hz, but radios transmit at a carrier frequency. **Upconversion** mixes the
complex baseband onto a real carrier for the air; **downconversion** mixes it back to recover I and Q.
The information rides along unchanged — only the center frequency moves.

## Upconvert → one real waveform

A complex baseband `I + jQ` becomes a single real passband signal (`upconvert`):

```
s(t) = I(t)·cos(2π f_c t) − Q(t)·sin(2π f_c t)
```

Cosine and sine are orthogonal (in-phase / quadrature), so two independent streams share one carrier
— the basis of QPSK/QAM.

## Downconvert → mix and filter

Mixing the passband with the same carrier (`downconvert`) gives, per rail:

```
I' = 2·s(t)·cos(2π f_c t) = I + (image at 2 f_c)
Q' = −2·s(t)·sin(2π f_c t) = Q + (image at 2 f_c)
```

A low-pass filter (`lowpass`, a moving average sized to span whole 2·f_c periods) removes the image
and leaves I and Q as transmitted.

## What the tests pin down

- `upconvert` of a constant `I=1, Q=0` baseband is exactly `cos(2π f_c n/fs)`.
- `upconvert → downconvert → lowpass` round-trips a constant `I/Q` (steady-state) back to the input.
- `lowpass` leaves a constant signal unchanged.

## Where it's used

The **Up/Downconversion** module (Track B) — the three-pane baseband → passband → recovered view.
