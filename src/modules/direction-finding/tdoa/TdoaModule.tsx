import { useState } from 'react';
import { WorldMap, type MapPoint, type MapTransform } from '@/components/plots/WorldMap';
import { colors } from '@/design/tokens';
import {
  hyperbolaPoints,
  rangeDifference,
  tdoaSolve,
  distance,
  type Point,
} from '@/dsp/geolocation';

const WORLD = { minX: -50, maxX: 50, minY: -50, maxY: 50 };

/**
 * TDOA multilateration (brief §4, Layer 2). Each receiver pair sharing a reference defines a
 * hyperbola of constant range difference Δr = c·τ; with ≥3 receivers the hyperbolas intersect
 * at the emitter. Drag receivers or the emitter and watch the geometry deform.
 */
export function TdoaModule() {
  const [receivers, setReceivers] = useState<Point[]>([
    { x: -32, y: -18 },
    { x: 30, y: -22 },
    { x: 8, y: 30 },
  ]);
  const [emitter, setEmitter] = useState<Point>({ x: -6, y: 4 });

  // Range differences relative to receiver 0 (|x−Rᵢ| − |x−R0|), then solve for the emitter.
  const ref = receivers[0];
  const measured = receivers.slice(1).map((r) => distance(emitter, r) - distance(emitter, ref));
  const { fix, converged } = tdoaSolve(receivers, measured, emitter);

  const points: MapPoint[] = [
    ...receivers.map((r, i) => ({
      id: `rx${i}`,
      x: r.x,
      y: r.y,
      color: colors.cyan,
      label: `Rx${i + 1}`,
      kind: 'site' as const,
    })),
    {
      id: 'emitter',
      x: emitter.x,
      y: emitter.y,
      color: colors.alert,
      label: 'emitter',
      kind: 'emitter' as const,
    },
  ];

  const onPointMove = (id: string, x: number, y: number) => {
    if (id === 'emitter') setEmitter({ x, y });
    else {
      const i = Number(id.replace('rx', ''));
      setReceivers((prev) => prev.map((r, j) => (j === i ? { x, y } : r)));
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, t: MapTransform) => {
    // One hyperbola per pair (Rx0, Rxi), each passing through the emitter.
    for (let i = 1; i < receivers.length; i++) {
      const dr = rangeDifference(emitter, ref, receivers[i]);
      const pts = hyperbolaPoints(ref, receivers[i], dr, 2.4, 120);
      if (pts.length === 0) continue;
      ctx.strokeStyle = colors.signalDim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pts.forEach((p, k) => {
        const { px, py } = t.toPx(p.x, p.y);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    // The multilateration fix.
    if (converged) {
      const c = t.toPx(fix.x, fix.y);
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.px, c.py, 7, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <WorldMap
        extent={WORLD}
        points={points}
        onPointMove={onPointMove}
        draw={draw}
        deps={[receivers, emitter, fix, converged]}
        ariaLabel="Receivers with hyperbolas of constant range difference intersecting at the emitter"
      />

      <div className="flex flex-wrap gap-4">
        <Readout label="Receivers" value={`${receivers.length}`} />
        <Readout
          label="Multilateration fix"
          value={converged ? `(${fix.x.toFixed(1)}, ${fix.y.toFixed(1)})` : 'no solution'}
          accent
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-[10px] text-text-faint">
          each hyperbola = points with a constant time difference between Rx1 and another receiver ·
          drag receivers or the emitter and watch the curves intersect at the fix
        </p>
      </div>
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
