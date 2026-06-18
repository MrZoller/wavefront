# Radio horizon

> Source: [`src/propagation/horizon.ts`](../../src/propagation/horizon.ts).
> Verified by: [`horizon.test.ts`](../../src/propagation/horizon.test.ts).

## The idea (plain language)

A line-of-sight wave travels straight, but the ground curves away beneath it. An antenna can only
"see" until its sight line goes tangent to the Earth — its **radio horizon**. Above HF, where
there's no skywave to borrow, that geometry is what sets your range, and it depends almost entirely
on **how high the antennas are**. Raising an antenna is the cheapest way to reach farther — which is
why broadcast and relay antennas climb towers and hilltops.

## The numbers

For an antenna of height `h` on an Earth of radius `R`, the tangent (horizon) distance is

```
d = √(2·R·h + h²) ≈ √(2·R·h)          for h ≪ R      (horizonKm)
```

A link closes when both ends can see the same point on the horizon, so the reach is the sum:

```
d ≈ √(2R·h₁) + √(2R·h₂) ≈ 3.57·(√h₁ + √h₂) km     heights in metres   (radioHorizonKm)
```

The `3.57` is just `√(2R)` once the units are folded in (`HORIZON_COEFF_KM_PER_SQRT_M`). Note the
**square root**: doubling a height doesn't double the range, and the first few metres buy the most.

This is the _geometric_ horizon. Atmospheric refraction bends rays slightly downward, which the
textbook captures with an effective `4/3·R` Earth — nudging the constant up toward `4.12`. We use the
plain geometric value.

## What the tests pin down

- `horizonKm` matches the closed form `√(2·R·h)` for a range of heights, and reproduces the classic
  `3.57·√h` coefficient (a 100 m mast ≈ 35.7 km).
- `radioHorizonKm` is the sum of the two antennas' horizons, is monotonic in height, and is zero at
  the surface; negative heights throw.

Taught interactively in the **Radio Horizon / Line-of-Sight** module, where the curved-earth picture
places each antenna at its own horizon distance from a shared grazing point — so the sight line
grazing the bulge and the formula's number agree.
