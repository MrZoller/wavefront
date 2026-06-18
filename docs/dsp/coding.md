# Channel coding: repetition, Hamming(7,4), and coding gain

> Source: [`src/dsp/coding.ts`](../../src/dsp/coding.ts).
> Verified by: [`coding.test.ts`](../../src/dsp/coding.test.ts).

## The idea (plain language)

A noisy channel flips bits. **Forward error correction** adds structured redundancy so the receiver
can _correct_ the flips, not just notice them. This page is the math under the **Channel Coding
(FEC)** module.

## Repetition code

Send each bit `n` times; decode by **majority vote** (`repetitionEncode` / `repetitionDecode`). It
survives up to ⌊n/2⌋ flips per group — the most intuitive code there is. But on an AWGN channel it
splits each bit's energy across the copies, so per _information_ bit it barely breaks even: redundancy
without structure is weak.

## Hamming(7,4)

Four data bits + three parity bits, laid out so the parity-check result — the **syndrome** — is the
binary _position_ of the flipped bit (0 = no error):

```
parity at positions 1,2,4   data at 3,5,6,7
syndrome s = (s1, s2, s4)   →  flip position s, then read the data bits
```

`hamming74EncodeBlock` / `hamming74Syndrome` / `hamming74DecodeBlock` implement one block;
`hamming74Encode` / `hamming74Decode` run a stream (zero-padding a trailing partial group). Any
single error in a 7-bit block is corrected; two defeat it.

## BER and coding gain

The BER curves are closed form (no Monte-Carlo noise), all per **information** bit so the comparison
is honest — a rate-`R` code spends `Ec = R·Eb` per transmitted bit:

```
qfunc(x) = ½·erfc(x/√2)
uncoded BPSK:   Pb = Q(√(2·Eb/N0))
repetition(n):  p = Q(√(2·(1/n)·Eb/N0)),  Pb = Σ_{k>n/2} C(n,k) p^k (1−p)^{n−k}
Hamming(7,4):   p = Q(√(2·(4/7)·Eb/N0)),  Pb ≈ (1/7) Σ_{j≥2} j·C(7,j) p^j (1−p)^{7−j}
```

`codingGainDb` reports how much less Eb/N0 a code needs to hit a reference BER — the coded curve's
left-shift. Hamming's leading `p²` term makes it fall steeper than uncoded, so it wins at useful SNR;
repetition does not.

## What the tests pin down

- Repetition round-trips and corrects up to ⌊n/2⌋ flips by majority vote.
- Hamming(7,4) gives a zero syndrome for every codeword, round-trips all 16 data words, and **corrects
  any single-bit error** (every data word × every position).
- `qfunc` matches known values and is symmetric; `uncodedBer = Q(√(2·Eb/N0))`.
- Hamming BER **< uncoded** at useful SNR (coding gain); repetition does not beat uncoded on AWGN.
- `codingGainDb` is positive for Hamming, non-positive for repetition.

## Where it's used

The **Channel Coding (FEC)** module (Coding & Equalization): the coded-vs-uncoded BER curve and the
interactive encode → flip → decode worked example.
