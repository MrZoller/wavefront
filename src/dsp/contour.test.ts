import { describe, it, expect } from 'vitest';
import { isoContour } from './contour';

const EXTENT = { minX: -10, maxX: 10, minY: -10, maxY: 10 };

describe('isoContour (marching squares)', () => {
  it('traces a circle for a radial field', () => {
    // f = x² + y²; the level set f = 25 is the circle of radius 5.
    const segs = isoContour((x, y) => x * x + y * y, EXTENT, 25, 120);
    expect(segs.length).toBeGreaterThan(0);
    for (const [a, b] of segs) {
      expect(Math.hypot(a.x, a.y)).toBeCloseTo(5, 1);
      expect(Math.hypot(b.x, b.y)).toBeCloseTo(5, 1);
    }
  });

  it('traces a straight line for a linear field', () => {
    // f = x; the level set f = 3 is the vertical line x = 3.
    const segs = isoContour((x) => x, EXTENT, 3, 40);
    expect(segs.length).toBeGreaterThan(0);
    for (const [a, b] of segs) {
      expect(a.x).toBeCloseTo(3, 6);
      expect(b.x).toBeCloseTo(3, 6);
    }
  });

  it('returns no segments when the level is never crossed', () => {
    expect(isoContour((x, y) => x * x + y * y, EXTENT, 1000, 40)).toHaveLength(0);
  });
});
