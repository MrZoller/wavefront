# Wavelength & bands

> Source: [`src/propagation/wavelength.ts`](../../src/propagation/wavelength.ts),
> [`src/propagation/bands.ts`](../../src/propagation/bands.ts).
> Verified by: [`wavelength.test.ts`](../../src/propagation/wavelength.test.ts),
> [`bands.test.ts`](../../src/propagation/bands.test.ts).

## The idea (plain language)

Everything about a band follows from one equation: a wave's **wavelength** is the speed of light
divided by its frequency. Low frequencies are physically _long_ (an LF wave is hundreds of metres);
high frequencies are _short_ (a UHF wave is centimetres). That single fact sets antenna sizes and
decides which way the energy tends to travel — so the radio spectrum splits into bands that behave
very differently.

## The numbers

```
λ = c / f                 c = 299 792 458 m/s        (wavelengthM)
f = c / λ                 the inverse                 (frequencyHzForWavelength)
```

The band ladder (`bandFor` looks up the band for a frequency), with the propagation mode each is
known for and an illustrative reach:

| Band | Range      | Dominant mode | Rough reach (illustrative)                         |
| ---- | ---------- | ------------- | -------------------------------------------------- |
| LF   | 30–300 kHz | ground wave   | hundreds–thousands of km along the surface         |
| MF   | 0.3–3 MHz  | ground wave   | regional by day; skywave carries it far after dark |
| HF   | 3–30 MHz   | skywave       | global — bounces off the ionosphere                |
| VHF  | 30–300 MHz | line-of-sight | local, roughly to the radio horizon                |
| UHF  | 0.3–3 GHz  | line-of-sight | short, needs a clear path                          |
| SHF  | 3–30 GHz   | line-of-sight | tight beams, easily blocked                        |

This is the "aha" for AM vs FM vs shortwave: AM broadcast (MF) rides skywave at night and reaches
across states, FM (VHF) is line-of-sight and stays local, shortwave (HF) bounces around the world.

## What the tests pin down

- `λ = c/f` hits known points: 1 MHz ≈ 300 m, 100 MHz ≈ 3 m, 1 GHz ≈ 0.3 m, and the inverse round-trips.
- `bandFor` places representative frequencies in the right band, treats the lower edge as inclusive
  and the upper as exclusive, and clamps frequencies that run off either end.
- The ladder is contiguous and ascending (no gaps or overlaps), and each band carries its headline mode.

Taught interactively in the **Band Explorer** module (the track's capstone).
