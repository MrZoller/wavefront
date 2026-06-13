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
 */
export function hyperbolaPoints(f1: Point, f2: Point, deltaR: number, tMax = 2.5, n = 80): Point[] {
  const c = distance(f1, f2) / 2;
  const a = deltaR / 2;
  if (c <= 1e-9 || Math.abs(a) >= c) return [];
  const b = Math.sqrt(c * c - a * a);
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

/**
 * Solve for the emitter from TDOA measurements. `rangeDiffs[i]` is the range difference to
 * `receivers[i+1]` relative to the reference `receivers[0]` (`|x−Rᵢ| − |x−R0|`).
 *
 * Gauss–Newton is run from several seeds (the receivers + their centroid, or a caller-supplied
 * `guess`) and the lowest-residual result is kept — TDOA can have multiple local minima / a second
 * hyperbola intersection, so a single seed is not enough. `converged` requires the final residual
 * to actually be near zero, not merely a small step, so the caller never displays a confident fix
 * that doesn't sit on the hyperbola intersection.
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
  const seeds: Point[] = guess
    ? [guess]
    : [
        centroid,
        ...receivers.map((r) => ({ x: (r.x + centroid.x) / 2, y: (r.y + centroid.y) / 2 })),
      ];

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
