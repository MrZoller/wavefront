import { useState } from 'react';
import { WorldMap, type MapPoint } from '@/components/plots/WorldMap';
import { colors } from '@/design/tokens';
import { gdop, type Point } from '@/dsp/geolocation';

const WORLD = { minX: -50, maxX: 50, minY: -50, maxY: 50 };

// Heat stops: low GDOP (good) → high GDOP (bad).
const STOPS: Array<[number, [number, number, number]]> = [
  [1, [62, 240, 160]], // signal green
  [3, [66, 212, 244]], // cyan
  [5, [244, 197, 66]], // amber
  [8, [255, 107, 94]], // alert red
];

function gdopColor(v: number): string {
  if (!Number.isFinite(v)) return 'rgba(122, 47, 42, 0.92)';
  const c = Math.max(STOPS[0][0], Math.min(STOPS[STOPS.length - 1][0], v));
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (c >= STOPS[i][0] && c <= STOPS[i + 1][0]) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const t = (c - lo[0]) / (hi[0] - lo[0] || 1);
  const ch = (k: number) => Math.round(lo[1][k] + t * (hi[1][k] - lo[1][k]));
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, 0.82)`;
}

/**
 * GDOP heatmap (brief §4, Layer 2 marquee). Color the whole field by Geometric Dilution of
 * Precision — how much measurement error blows up into position error at each location. Drag the
 * receivers and watch good geometry (well-spread) vs. bad geometry (clustered / collinear)
 * repaint the map. This is the visual that makes "geometry matters" unforgettable.
 */
export function GdopModule() {
  const [receivers, setReceivers] = useState<Point[]>([
    { x: -28, y: -22 },
    { x: 30, y: -18 },
    { x: 18, y: 28 },
    { x: -24, y: 24 },
  ]);

  const points: MapPoint[] = receivers.map((r, i) => ({
    id: `rx${i}`,
    x: r.x,
    y: r.y,
    color: colors.text,
    label: `Rx${i + 1}`,
    kind: 'site' as const,
  }));

  const onPointMove = (id: string, x: number, y: number) => {
    const i = Number(id.replace('rx', ''));
    setReceivers((prev) => prev.map((r, j) => (j === i ? { x, y } : r)));
  };

  return (
    <div className="flex flex-col gap-6">
      <WorldMap
        extent={WORLD}
        points={points}
        onPointMove={onPointMove}
        field={{ value: (x, y) => gdop({ x, y }, receivers), color: gdopColor, resolution: 60 }}
        deps={[receivers]}
        ariaLabel="GDOP heatmap; drag receivers to reshape the precision field"
      />

      {/* Legend */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <span className="readout text-xs text-text-muted">GDOP</span>
        <span className="text-xs text-signal">good</span>
        <div
          className="h-3 flex-1 rounded-sm"
          style={{
            background: `linear-gradient(to right, ${gdopColor(1)}, ${gdopColor(3)}, ${gdopColor(5)}, ${gdopColor(8)})`,
          }}
        />
        <span className="text-xs text-alert">poor</span>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          green = a small measurement error stays small here · red = it balloons into large position
          error · spread the receivers out for a wide green basin; cluster or line them up and watch
          precision collapse
        </p>
      </div>
    </div>
  );
}
