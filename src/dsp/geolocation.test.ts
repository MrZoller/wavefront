import { describe, it, expect } from 'vitest';
import {
  invert2x2,
  distance,
  aoaFix,
  errorEllipse,
  rangeDifference,
  hyperbolaPoints,
  tdoaSolve,
  gdop,
  type Point,
} from './geolocation';

const deg = (d: number) => (d * Math.PI) / 180;

describe('invert2x2', () => {
  it('inverts a matrix and rejects singular ones', () => {
    expect(invert2x2(1, 0, 0, 1)).toEqual([1, -0, -0, 1]);
    expect(invert2x2(2, 0, 0, 4)).toEqual([0.5, -0, -0, 0.25]);
    expect(invert2x2(1, 1, 1, 1)).toBeNull();
  });
});

describe('AoA cross-fixing', () => {
  it('two bearings intersect at the expected point', () => {
    // Site A at origin looking at 45°; site B at (10,0) looking at 135°. Cross at (5,5).
    const { fix } = aoaFix(
      [
        { x: 0, y: 0, bearing: deg(45) },
        { x: 10, y: 0, bearing: deg(135) },
      ],
      deg(1)
    );
    expect(fix).not.toBeNull();
    expect(fix!.x).toBeCloseTo(5, 9);
    expect(fix!.y).toBeCloseTo(5, 9);
  });

  it('returns null for parallel bearings', () => {
    const { fix } = aoaFix(
      [
        { x: 0, y: 0, bearing: deg(30) },
        { x: 0, y: 5, bearing: deg(30) },
      ],
      deg(1)
    );
    expect(fix).toBeNull();
  });

  it('error ellipse is isotropic for an orthogonal, equal-range crossing', () => {
    const sigma = deg(1);
    const { fix, cov } = aoaFix(
      [
        { x: 0, y: 0, bearing: deg(45) },
        { x: 10, y: 0, bearing: deg(135) },
      ],
      sigma
    );
    expect(fix).not.toBeNull();
    const e = errorEllipse(cov!);
    // Equal ranges + orthogonal LOBs ⇒ circular error ≈ r·σθ, r = √50.
    const r = distance(fix!, { x: 0, y: 0 });
    expect(e.major).toBeCloseTo(r * sigma, 6);
    expect(e.minor).toBeCloseTo(r * sigma, 6);
  });

  it('error region elongates as the emitter gets farther (worse geometry)', () => {
    const sigma = deg(1);
    const near = aoaFix(
      [
        { x: -5, y: 0, bearing: deg(60) },
        { x: 5, y: 0, bearing: deg(120) },
      ],
      sigma
    );
    // Move the sites' bearings so they cross much farther away (shallow crossing angle).
    const far = aoaFix(
      [
        { x: -5, y: 0, bearing: deg(80) },
        { x: 5, y: 0, bearing: deg(100) },
      ],
      sigma
    );
    const eNear = errorEllipse(near.cov!);
    const eFar = errorEllipse(far.cov!);
    expect(eFar.major).toBeGreaterThan(eNear.major);
  });
});

describe('TDOA hyperbola', () => {
  it('rangeDifference matches a hand calc', () => {
    const f1 = { x: -5, y: 0 };
    const f2 = { x: 5, y: 0 };
    const p = { x: 3, y: 4 };
    expect(rangeDifference(p, f1, f2)).toBeCloseTo(Math.hypot(8, 4) - Math.hypot(2, 4), 12);
  });

  it('every generated point has the prescribed range difference', () => {
    const f1 = { x: -6, y: -2 };
    const f2 = { x: 7, y: 3 };
    const dr = 4;
    const pts = hyperbolaPoints(f1, f2, dr, 2, 40);
    expect(pts.length).toBe(40);
    for (const p of pts) {
      expect(rangeDifference(p, f1, f2)).toBeCloseTo(dr, 6);
    }
  });

  it('returns no curve when |Δr| exceeds the focal separation', () => {
    expect(hyperbolaPoints({ x: -5, y: 0 }, { x: 5, y: 0 }, 12, 2, 20)).toHaveLength(0);
  });

  it('extends the branch to reach maxExtent when foci are close', () => {
    // Δr = 0 hyperbola of foci (-5,0),(5,0) is the y-axis; a fixed tMax=2.4 only reaches y≈27,
    // truncating before an emitter at (0,50). maxExtent must push the branch past it.
    const f1 = { x: -5, y: 0 };
    const f2 = { x: 5, y: 0 };
    const pts = hyperbolaPoints(f1, f2, 0, 2.4, 80, 70);
    const reach = Math.max(...pts.map((p) => Math.abs(p.y)));
    expect(reach).toBeGreaterThan(50);
    // Still a valid hyperbola: every point keeps the prescribed range difference.
    for (const p of pts) expect(rangeDifference(p, f1, f2)).toBeCloseTo(0, 6);
  });
});

describe('TDOA multilateration', () => {
  it('recovers a known emitter from exact range differences', () => {
    const receivers: Point[] = [
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 0, y: 9 },
      { x: 12, y: 9 },
    ];
    const truth: Point = { x: 3, y: 7 };
    const ref = receivers[0];
    const rangeDiffs = receivers.slice(1).map((r) => distance(truth, r) - distance(truth, ref));
    const { fix, converged } = tdoaSolve(receivers, rangeDiffs);
    expect(converged).toBe(true);
    expect(fix.x).toBeCloseTo(3, 4);
    expect(fix.y).toBeCloseTo(7, 4);
  });

  it('recovers an emitter that sits outside the receiver hull (grid seeds)', () => {
    // Centroid/midpoint seeds alone stall at a local minimum (residual ≈ 0.15) for this layout;
    // the grid seeds reach the true intersection at (10,−20).
    const receivers: Point[] = [
      { x: -20, y: -40 },
      { x: 40, y: 40 },
      { x: 20, y: 10 },
      { x: 0, y: -20 },
    ];
    const truth: Point = { x: 10, y: -20 };
    const ref = receivers[0];
    const rangeDiffs = receivers.slice(1).map((r) => distance(truth, r) - distance(truth, ref));
    const { fix, converged } = tdoaSolve(receivers, rangeDiffs);
    expect(converged).toBe(true);
    expect(fix.x).toBeCloseTo(10, 3);
    expect(fix.y).toBeCloseTo(-20, 3);
  });

  it('recovers an emitter dragged close to a receiver (receiver-adjacent seeds)', () => {
    // The default scene's receivers; emitter dragged next to Rx2. The tight basin around the
    // receiver is missed by the centroid/grid seeds alone.
    const receivers: Point[] = [
      { x: -32, y: -18 },
      { x: 30, y: -22 },
      { x: 8, y: 30 },
      { x: -22, y: 26 },
    ];
    const truth: Point = { x: 33, y: -24 };
    const ref = receivers[0];
    const rangeDiffs = receivers.slice(1).map((r) => distance(truth, r) - distance(truth, ref));
    const { fix, converged } = tdoaSolve(receivers, rangeDiffs);
    expect(converged).toBe(true);
    expect(fix.x).toBeCloseTo(33, 3);
    expect(fix.y).toBeCloseTo(-24, 3);
  });
});

describe('GDOP (TDOA-differenced)', () => {
  it('equals √(8/9) for three receivers 120° apart (reference = first)', () => {
    // Differenced rows uᵢ−u₀ ⇒ HᵀH = diag(4.5, 1.5) ⇒ trace(inv) = 8/9.
    const receivers = [0, 120, 240].map((d) => ({
      x: 10 * Math.cos(deg(d)),
      y: 10 * Math.sin(deg(d)),
    }));
    expect(gdop({ x: 0, y: 0 }, receivers)).toBeCloseTo(Math.sqrt(8 / 9), 9);
  });

  it('needs at least three receivers', () => {
    expect(
      gdop({ x: 0, y: 0 }, [
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ])
    ).toBe(Infinity);
  });

  it('is low for well-spread geometry and large for clustered receivers', () => {
    const candidate = { x: 0, y: 0 };
    const spread = [
      { x: 10, y: 0 },
      { x: -5, y: 8 },
      { x: -5, y: -8 },
    ];
    const clustered = [
      { x: 10, y: 0.1 },
      { x: 10, y: 0 },
      { x: 10, y: -0.1 },
    ];
    expect(gdop(candidate, spread)).toBeLessThan(2);
    expect(gdop(candidate, clustered)).toBeGreaterThan(20);
  });

  it('flags a collinear (y=0) layout as poor for an off-line candidate', () => {
    // The case range-based GDOP misses: receivers on a line, candidate above them.
    const receivers = [
      { x: -10, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(gdop({ x: 0, y: 50 }, receivers)).toBeGreaterThan(5);
  });

  it('is infinite for collinear line-of-sight (singular geometry)', () => {
    const candidate = { x: 0, y: 0 };
    const collinear = [
      { x: 5, y: 0 },
      { x: 9, y: 0 },
      { x: -3, y: 0 },
    ];
    expect(gdop(candidate, collinear)).toBe(Infinity);
  });
});
