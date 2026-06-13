import { useState } from 'react';
import { WorldMap, type MapPoint, type MapTransform } from '@/components/plots/WorldMap';
import { colors } from '@/design/tokens';
import { aoaFix, errorEllipse, type Bearing } from '@/dsp/geolocation';

const WORLD = { minX: -50, maxX: 50, minY: -50, maxY: 50 };

interface XY {
  x: number;
  y: number;
}

/**
 * AoA cross-fixing (brief §4, Layer 2). Each DF site emits a line of bearing toward the emitter;
 * two LOBs intersect to fix it, and an angular error σθ becomes a position error region that
 * elongates for distant emitters and shallow crossing angles. Drag the sites or the emitter.
 */
export function AoaCrossFixModule() {
  const [sites, setSites] = useState<XY[]>([
    { x: -30, y: -20 },
    { x: 30, y: -20 },
    { x: 0, y: -35 },
  ]);
  const [emitter, setEmitter] = useState<XY>({ x: 5, y: 25 });
  const [sigmaDeg, setSigmaDeg] = useState(2);

  const bearings: Bearing[] = sites.map((s) => ({
    x: s.x,
    y: s.y,
    bearing: Math.atan2(emitter.y - s.y, emitter.x - s.x),
  }));
  const sigma = (sigmaDeg * Math.PI) / 180;
  const { fix, cov } = aoaFix(bearings, sigma);
  const ellipse = cov ? errorEllipse(cov, 2) : null; // 2σ region

  const points: MapPoint[] = [
    ...sites.map((s, i) => ({
      id: `site${i}`,
      x: s.x,
      y: s.y,
      color: colors.cyan,
      label: `DF${i + 1}`,
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
      const i = Number(id.replace('site', ''));
      setSites((prev) => prev.map((s, j) => (j === i ? { x, y } : s)));
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, t: MapTransform) => {
    // Lines of bearing (rays from each site toward the emitter).
    for (const b of bearings) {
      const start = t.toPx(b.x, b.y);
      const end = t.toPx(b.x + Math.cos(b.bearing) * 300, b.y + Math.sin(b.bearing) * 300);
      ctx.strokeStyle = colors.signalDim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(start.px, start.py);
      ctx.lineTo(end.px, end.py);
      ctx.stroke();
    }
    // Error ellipse + fix.
    if (fix && ellipse) {
      const c = t.toPx(fix.x, fix.y);
      ctx.strokeStyle = colors.signal;
      ctx.fillStyle = 'color-mix(in srgb, var(--color-signal) 14%, transparent)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // y-axis is flipped on screen, so negate the world rotation angle.
      ctx.ellipse(
        c.px,
        c.py,
        ellipse.major * t.scale,
        ellipse.minor * t.scale,
        -ellipse.angle,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colors.signal;
      ctx.beginPath();
      ctx.arc(c.px, c.py, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <WorldMap
        extent={WORLD}
        points={points}
        onPointMove={onPointMove}
        draw={draw}
        deps={[bearings, fix, ellipse]}
        ariaLabel="Two or three DF sites with lines of bearing crossing at the emitter"
      />

      <div className="flex flex-wrap gap-4">
        <Readout
          label="Fix"
          value={fix ? `(${fix.x.toFixed(1)}, ${fix.y.toFixed(1)})` : 'no crossing'}
          accent
        />
        <Readout
          label="Error region (2σ)"
          value={ellipse ? `${ellipse.major.toFixed(1)} × ${ellipse.minor.toFixed(1)} km` : '—'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Angular error σθ</span>
            <span className="text-signal">{sigmaDeg.toFixed(1)}°</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.5}
            value={sigmaDeg}
            onChange={(e) => setSigmaDeg(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label="Per-bearing angular error in degrees"
          />
          <span className="readout text-[10px] text-text-faint">
            drag DF sites / emitter · push the emitter far or flatten the crossing to watch the
            error region stretch
          </span>
        </label>
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
