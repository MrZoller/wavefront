/**
 * Geolocation math (brief §4, Layer 2) — turning bearings and time differences into a position,
 * and quantifying how geometry limits accuracy.
 *
 * Everything works in plain 2D map coordinates (x right, y up). These assume a straight
 * line-of-bearing to the emitter (true at VHF and up); the HF-skywave wrinkle is Track E (§8).
 */

export interface Point {
  x: number;
  y: number;
}

/** A line of bearing: a site at `x,y` observing the emitter along `bearing` (radians, math convention). */
export interface Bearing extends Point {
  bearing: number;
}

// ── small linear algebra (symmetric 2×2) ─────────────────────────────────────

/** Invert a 2×2 matrix [[a,b],[c,d]]; returns null if (near-)singular. */
export function invert2x2(
  a: number,
  b: number,
  c: number,
  d: number
): [number, number, number, number] | null {
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  return [d * inv, -b * inv, -c * inv, a * inv];
}

/** Eigen-decomposition of a symmetric 2×2 [[a,b],[b,c]] → ascending eigenvalues + angle of the larger. */
export function eigSym2x2(
  a: number,
  b: number,
  c: number
): {
  major: number;
  minor: number;
  angle: number;
} {
  const tr = a + c;
  const det = a * c - b * b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc; // larger
  const l2 = tr / 2 - disc; // smaller
  // Eigenvector of the larger eigenvalue.
  let angle: number;
  if (Math.abs(b) > 1e-12) angle = Math.atan2(l1 - a, b);
  else angle = a >= c ? 0 : Math.PI / 2;
  return { major: l1, minor: l2, angle };
}

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

const unit = (from: Point, to: Point): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const r = Math.hypot(dx, dy) || 1;
  return { x: dx / r, y: dy / r };
};

// ── AoA cross-fixing ─────────────────────────────────────────────────────────

export interface AoaFix {
  /** Least-squares position estimate, or null if the bearings are parallel. */
  fix: Point | null;
  /** 2×2 position covariance [σxx, σxy, σxy, σyy] from the angular error, or null. */
  cov: [number, number, number, number] | null;
}

/**
 * Cross-fix an emitter from ≥2 lines of bearing by least squares. Each LOB constrains the
 * position to its line `nᵀ(x − p) = 0` (n = unit normal to the bearing). Solving
 * `(Σ nnᵀ) x = Σ n (nᵀp)` gives the intersection; weighting each line by `1/(rᵢ·σθ)²`
 * (cross-range error grows with range) yields the position covariance — the error region that
 * elongates for distant emitters and poor geometry.
 */
export function aoaFix(bearings: Bearing[], sigmaTheta: number): AoaFix {
  // Unweighted intersection first (needs ranges, which need the fix).
  let m00 = 0,
    m01 = 0,
    m11 = 0,
    b0 = 0,
    b1 = 0;
  for (const s of bearings) {
    const nx = -Math.sin(s.bearing);
    const ny = Math.cos(s.bearing);
    const np = nx * s.x + ny * s.y;
    m00 += nx * nx;
    m01 += nx * ny;
    m11 += ny * ny;
    b0 += nx * np;
    b1 += ny * np;
  }
  const inv = invert2x2(m00, m01, m01, m11);
  if (!inv) return { fix: null, cov: null };
  const fix = { x: inv[0] * b0 + inv[1] * b1, y: inv[2] * b0 + inv[3] * b1 };

  // Weighted information matrix → covariance.
  let i00 = 0,
    i01 = 0,
    i11 = 0;
  for (const s of bearings) {
    const r = Math.max(distance(fix, s), 1e-6);
    const w = 1 / (r * sigmaTheta) ** 2;
    const nx = -Math.sin(s.bearing);
    const ny = Math.cos(s.bearing);
    i00 += w * nx * nx;
    i01 += w * nx * ny;
    i11 += w * ny * ny;
  }
  const cov = invert2x2(i00, i01, i01, i11);
  return { fix, cov };
}

/** Error-ellipse axes (standard deviations scaled by `nSigma`) from a position covariance. */
export function errorEllipse(
  cov: [number, number, number, number],
  nSigma = 1
): { major: number; minor: number; angle: number } {
  const { major, minor, angle } = eigSym2x2(cov[0], cov[1], cov[3]);
  return {
    major: nSigma * Math.sqrt(Math.max(0, major)),
    minor: nSigma * Math.sqrt(Math.max(0, minor)),
    angle,
  };
}

// ── TDOA hyperbolas + multilateration ────────────────────────────────────────

/** Range difference at `p`: `|p − f1| − |p − f2|` (equals `c·τ` for a measured time difference). */
export const rangeDifference = (p: Point, f1: Point, f2: Point): number =>
  distance(p, f1) - distance(p, f2);

/**
 * Points tracing the hyperbola branch of constant range difference `deltaR = |x−f1| − |x−f2|`
 * (foci `f1`, `f2`). Parametrized as `a·cosh t` along the focal axis and `b·sinh t` across it,
 * with `a = deltaR/2`, `c = ½|f2−f1|`, `b = √(c²−a²)`. Returns [] if `|deltaR| ≥ |f2−f1|`.
 *
 * `maxExtent` (e.g. the map diagonal) extends the parameter range so the branch reaches that far
 * from its center — otherwise a fixed `tMax` truncates curves with close foci before they cross the
 * viewport (and visibly miss the emitter). A point's distance from center grows like `½·c·e^t`, so
 * reaching `maxExtent` needs `t ≈ ln(2·maxExtent/c)`; `tMax` stays a lower bound for short spans.
 */
export function hyperbolaPoints(
  f1: Point,
  f2: Point,
  deltaR: number,
  tMax = 2.5,
  n = 80,
  maxExtent?: number
): Point[] {
  const c = distance(f1, f2) / 2;
  const a = deltaR / 2;
  if (c <= 1e-9 || Math.abs(a) >= c) return [];
  const b = Math.sqrt(c * c - a * a);
  if (maxExtent && maxExtent > 0) tMax = Math.max(tMax, Math.log((2 * maxExtent) / c));
  const center = { x: (f1.x + f2.x) / 2, y: (f1.y + f2.y) / 2 };
  const ux = (f2.x - f1.x) / (2 * c);
  const uy = (f2.y - f1.y) / (2 * c);
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const t = -tMax + (2 * tMax * i) / (n - 1);
    const xp = a * Math.cosh(t); // signed: branch toward the nearer focus
    const yp = b * Math.sinh(t);
    out.push({ x: center.x + xp * ux - yp * uy, y: center.y + xp * uy + yp * ux });
  }
  return out;
}

/** RMS of the TDOA range-difference residuals at point `x` (0 at an exact solution). */
function tdoaResidual(x: Point, receivers: Point[], rangeDiffs: number[]): number {
  const ref = receivers[0];
  let sum = 0;
  for (let i = 1; i < receivers.length; i++) {
    const pred = distance(x, receivers[i]) - distance(x, ref);
    const r = pred - rangeDiffs[i - 1];
    sum += r * r;
  }
  return Math.sqrt(sum / Math.max(1, receivers.length - 1));
}

/** One Gauss–Newton run from a single seed. */
function tdoaGaussNewton(
  receivers: Point[],
  rangeDiffs: number[],
  seed: Point,
  iterations: number
): Point {
  const ref = receivers[0];
  let x = seed;
  for (let it = 0; it < iterations; it++) {
    let h00 = 0,
      h01 = 0,
      h11 = 0,
      g0 = 0,
      g1 = 0;
    const u0 = unit(x, ref);
    for (let i = 1; i < receivers.length; i++) {
      const ui = unit(x, receivers[i]);
      const pred = distance(x, receivers[i]) - distance(x, ref);
      const res = pred - rangeDiffs[i - 1];
      // d(pred)/dx = u0 − ui (gradient of distance points away from the receiver).
      const jx = u0.x - ui.x;
      const jy = u0.y - ui.y;
      h00 += jx * jx;
      h01 += jx * jy;
      h11 += jy * jy;
      g0 += jx * res;
      g1 += jy * res;
    }
    const inv = invert2x2(h00, h01, h01, h11);
    if (!inv) break;
    const dx = inv[0] * g0 + inv[1] * g1;
    const dy = inv[2] * g0 + inv[3] * g1;
    x = { x: x.x - dx, y: x.y - dy };
    if (Math.hypot(dx, dy) < 1e-10) break;
  }
  return x;
}

/** A grid of seeds over the receivers' bounding box, expanded so an emitter outside the receiver
 *  hull is still bracketed. Gives Gauss–Newton multiple starting basins. */
function gridSeeds(receivers: Point[], n = 6): Point[] {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const r of receivers) {
    minX = Math.min(minX, r.x);
    maxX = Math.max(maxX, r.x);
    minY = Math.min(minY, r.y);
    maxY = Math.max(maxY, r.y);
  }
  const padX = (maxX - minX) * 0.5 || 1;
  const padY = (maxY - minY) * 0.5 || 1;
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;
  const seeds: Point[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      seeds.push({
        x: minX + ((maxX - minX) * i) / (n - 1),
        y: minY + ((maxY - minY) * j) / (n - 1),
      });
    }
  }
  return seeds;
}

/**
 * Solve for the emitter from TDOA measurements. `rangeDiffs[i]` is the range difference to
 * `receivers[i+1]` relative to the reference `receivers[0]` (`|x−Rᵢ| − |x−R0|`).
 *
 * Gauss–Newton is run from several seeds and the lowest-residual result is kept — TDOA can have
 * multiple local minima / a second hyperbola intersection, so a single seed is not enough. Without a
 * caller-supplied `guess` the seeds span the centroid, a point just inside each receiver (the emitter
 * is often dragged near a receiver, whose own tight basin a coarse grid can miss — and seeding *on* a
 * receiver makes the Jacobian degenerate), and a grid over the receivers' expanded bounding box (so
 * an emitter outside the receiver hull is still reached). `converged` requires the final residual to
 * actually be near zero, not merely a small step, so the caller never displays a confident fix that
 * doesn't sit on the hyperbola intersection.
 */
export function tdoaSolve(
  receivers: Point[],
  rangeDiffs: number[],
  guess?: Point,
  iterations = 60
): { fix: Point; converged: boolean } {
  const centroid = {
    x: receivers.reduce((s, r) => s + r.x, 0) / receivers.length,
    y: receivers.reduce((s, r) => s + r.y, 0) / receivers.length,
  };
  // Receiver-adjacent seeds nudged 15% toward the centroid: close to each receiver's basin without
  // sitting on the singular point.
  const nearReceivers = receivers.map((r) => ({
    x: r.x + (centroid.x - r.x) * 0.15,
    y: r.y + (centroid.y - r.y) * 0.15,
  }));
  const seeds: Point[] = guess ? [guess] : [centroid, ...nearReceivers, ...gridSeeds(receivers)];

  let best = seeds[0];
  let bestRes = Infinity;
  for (const seed of seeds) {
    const x = tdoaGaussNewton(receivers, rangeDiffs, seed, iterations);
    const res = tdoaResidual(x, receivers, rangeDiffs);
    if (res < bestRes) {
      bestRes = res;
      best = x;
    }
  }
  return { fix: best, converged: bestRes < 1e-4 };
}

// ── GDOP ─────────────────────────────────────────────────────────────────────

/**
 * Geometric Dilution of Precision at `candidate` for a TDOA receiver layout (brief §4, Layer 2,
 * following the TDOA module). Only range *differences* are observable, so each row of the geometry
 * matrix `H` is the *differenced* line-of-sight `uᵢ − u₀` relative to the reference `receivers[0]`:
 *
 *   `GDOP = √(trace((HᵀH)⁻¹))`,  rows `uᵢ − u₀` for `i ≥ 1`.
 *
 * Low for well-spread geometry; it blows up (→ ∞) as the receivers become collinear or clustered
 * — and, unlike a raw range Jacobian, it correctly penalizes layouts that are poor specifically
 * for time-difference positioning. Needs ≥3 receivers (two independent rows in 2D).
 */
export function gdop(candidate: Point, receivers: Point[]): number {
  if (receivers.length < 3) return Infinity;
  const u0 = unit(candidate, receivers[0]);
  let h00 = 0,
    h01 = 0,
    h11 = 0;
  for (let i = 1; i < receivers.length; i++) {
    const ui = unit(candidate, receivers[i]);
    const rx = ui.x - u0.x;
    const ry = ui.y - u0.y;
    h00 += rx * rx;
    h01 += rx * ry;
    h11 += ry * ry;
  }
  const inv = invert2x2(h00, h01, h01, h11);
  if (!inv) return Infinity;
  const trace = inv[0] + inv[3];
  return trace > 0 ? Math.sqrt(trace) : Infinity;
}

// ── FDOA (Doppler difference) ─────────────────────────────────────────────────

/** A receiver in motion: a site at `x,y` with velocity `(vx, vy)` (same length units / second). */
export interface MovingReceiver extends Point {
  vx: number;
  vy: number;
}

/**
 * Radial rate of a moving receiver relative to an emitter: the component of the receiver's velocity
 * along the line of sight, `v · û` with `û` pointing from the receiver toward the emitter. Positive
 * when the receiver closes on the emitter (a Doppler up-shift), negative when it opens away, zero
 * when it moves purely across the line of sight.
 */
export function radialRate(rx: MovingReceiver, emitter: Point): number {
  const u = unit(rx, emitter);
  return rx.vx * u.x + rx.vy * u.y;
}

/**
 * Frequency Difference of Arrival (FDOA, brief §4, Layer 2) between a moving receiver `rx` and a
 * moving reference `ref`, in hertz. A receiver moving through the field sees the emitter's carrier
 * Doppler-shifted by `(f0/c)·(v·û)`; the *difference* of the two shifts is what two platforms can
 * measure without knowing the emitter's true frequency:
 *
 *   `Δf = (f0 / c) · (v_rx·û_rx − v_ref·û_ref)`.
 *
 * The locus of emitter positions giving a fixed `Δf` is an *isodoppler* curve; a second pair (or a
 * TDOA line) crosses it to a fix. `f0` is the carrier (Hz) and `c` the propagation speed in the same
 * length units as the velocities (e.g. km and km/s).
 */
export function fdoa(
  emitter: Point,
  rx: MovingReceiver,
  ref: MovingReceiver,
  f0: number,
  c: number
): number {
  return (f0 / c) * (radialRate(rx, emitter) - radialRate(ref, emitter));
}
