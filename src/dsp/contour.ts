/**
 * Iso-contour extraction (marching squares). A small, reusable helper for drawing the level set
 * `f(x,y) = level` of any scalar field over a rectangular extent — used by the FDOA scene to trace
 * isodoppler curves, but field-agnostic.
 */

import type { Point } from './geolocation';

export interface Extent {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Marching-squares case → edges to connect. Edges: 0 bottom, 1 right, 2 top, 3 left.
// Indexed by a 4-bit corner mask (bl=1, br=2, tr=4, tl=8 for "value > level").
const CASES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [], // 0
  [[3, 0]], // 1  bl
  [[0, 1]], // 2  br
  [[3, 1]], // 3  bl br
  [[1, 2]], // 4  tr
  [
    [3, 0],
    [1, 2],
  ], // 5  bl tr (saddle)
  [[0, 2]], // 6  br tr
  [[2, 3]], // 7  bl br tr
  [[2, 3]], // 8  tl
  [[0, 2]], // 9  bl tl
  [
    [0, 1],
    [2, 3],
  ], // 10 br tl (saddle)
  [[1, 2]], // 11 bl br tl
  [[3, 1]], // 12 tr tl
  [[0, 1]], // 13 bl tr tl
  [[3, 0]], // 14 br tr tl
  [], // 15
];

/**
 * Line segments approximating the level set `f(x,y) = level` over `extent`, sampled on a
 * `res × res` grid of cells with linear interpolation along crossed edges. Returns an unordered list
 * of segments (`[from, to]`), which is all canvas stroking needs. Coarser `res` is faster; finer is
 * smoother.
 */
export function isoContour(
  f: (x: number, y: number) => number,
  extent: Extent,
  level: number,
  res = 80
): Array<[Point, Point]> {
  const { minX, maxX, minY, maxY } = extent;
  const dx = (maxX - minX) / res;
  const dy = (maxY - minY) / res;

  // Sample the field once per grid vertex.
  const g: number[][] = [];
  for (let i = 0; i <= res; i++) {
    const col: number[] = [];
    const x = minX + i * dx;
    for (let j = 0; j <= res; j++) col.push(f(x, minY + j * dy));
    g.push(col);
  }

  const segments: Array<[Point, Point]> = [];
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const x0 = minX + i * dx;
      const y0 = minY + j * dy;
      const x1 = x0 + dx;
      const y1 = y0 + dy;
      const vbl = g[i][j];
      const vbr = g[i + 1][j];
      const vtr = g[i + 1][j + 1];
      const vtl = g[i][j + 1];
      if (!(isFinite(vbl) && isFinite(vbr) && isFinite(vtr) && isFinite(vtl))) continue;

      const mask =
        (vbl > level ? 1 : 0) |
        (vbr > level ? 2 : 0) |
        (vtr > level ? 4 : 0) |
        (vtl > level ? 8 : 0);
      const edges = CASES[mask];
      if (edges.length === 0) continue;

      // Interpolated crossing point on a given cell edge.
      const lerp = (a: number, b: number, va: number, vb: number) => {
        const t = (level - va) / (vb - va || 1);
        return a + t * (b - a);
      };
      const edgePoint = (edge: number): Point => {
        switch (edge) {
          case 0: // bottom: bl → br
            return { x: lerp(x0, x1, vbl, vbr), y: y0 };
          case 1: // right: br → tr
            return { x: x1, y: lerp(y0, y1, vbr, vtr) };
          case 2: // top: tr → tl
            return { x: lerp(x1, x0, vtr, vtl), y: y1 };
          default: // left: tl → bl
            return { x: x0, y: lerp(y1, y0, vtl, vbl) };
        }
      };

      for (const [a, b] of edges) segments.push([edgePoint(a), edgePoint(b)]);
    }
  }
  return segments;
}
