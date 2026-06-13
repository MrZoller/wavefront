# Track A — Direction Finding & Geolocation

The v1 ship target (brief §4). The motivating arc: a non-EE arrives wanting to understand
"how do you find where a transmitter is?", and the curriculum walks them down to phasors and
back up to a live GDOP map.

Built as a layered curriculum — each layer is a prerequisite for the next.

![The Rotating Phasor / IQ module](../images/rotating-phasor.png)

## Layer 0 — Primitives

| Module                                | Intuition                                                                   | Status      |
| ------------------------------------- | --------------------------------------------------------------------------- | ----------- |
| **Rotating phasor / IQ**              | A complex sample is just a 2D point, and a signal spins it.                 | ✅ shipping |
| **Phase difference**                  | Two sensors see the same wave with a phase offset that encodes direction.   | ✅ shipping |
| **Cross-correlation as a lag finder** | A sliding dot product reveals _when_ a signal arrived (the engine of TDOA). | ✅ shipping |

![Phase difference module](../images/phase-difference.png)

![Cross-correlation lag finder module](../images/cross-correlation.png)

## Layer 1 — Angle of Arrival (AoA)

| Module                      | Intuition                                                                           | Status             |
| --------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| Two-element interferometer  | Path-length difference → phase difference → bearing (and ambiguity when `d > λ/2`). | planned            |
| Beamforming / array pattern | Steer a uniform linear array and watch the gain pattern sweep.                      | planned            |
| MUSIC super-resolution      | The noise subspace resolves two emitters beamforming smears together.               | planned (advanced) |

## Layer 2 — Geolocation (marquee scenes)

| Module               | Intuition                                                                     | Status            |
| -------------------- | ----------------------------------------------------------------------------- | ----------------- |
| AoA cross-fixing     | Two lines of bearing intersect to a fix; error regions elongate with range.   | planned           |
| TDOA multilateration | Each receiver pair defines a hyperbola of constant range difference.          | planned           |
| GDOP heatmap         | Geometry turns measurement error into position error — see it across the map. | planned (ship v1) |
| FDOA                 | Doppler-difference isodoppler curves from a moving platform.                  | planned (stub)    |

> These scenes assume a straight line-of-bearing to the emitter (true at VHF and up). The
> HF-skywave wrinkle is the cross-link from Track E (§8).
