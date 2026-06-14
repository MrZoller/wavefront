import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { WorldMap, type MapPoint, type MapTransform } from '@/components/plots/WorldMap';
import { colors } from '@/design/tokens';
import { fdoa, type MovingReceiver, type Point } from '@/dsp/geolocation';
import { isoContour } from '@/dsp/contour';

const WORLD = { minX: -50, maxX: 50, minY: -50, maxY: 50 };
const C = 299792.458; // speed of light, km/s — positions are km, velocities km/s.
// The velocity handle is drawn this many map-units (km) per km/s of speed, so a draggable tip both
// sets and shows each platform's velocity vector.
const VEL_SCALE = 1;

/**
 * FDOA — Doppler-difference geolocation (brief §4, Layer 2). Two platforms sweep past a stationary
 * emitter; each sees the carrier Doppler-shifted by its own motion, and the *difference* of the two
 * shifts is measurable without knowing the emitter's true frequency. The set of emitter positions
 * giving a fixed Δf is an isodoppler curve — the emitter lies on the highlighted one. Drag the
 * receivers, their velocity arrows, or the emitter and watch the field flow.
 */
export function FdoaModule() {
  const [receivers, setReceivers] = useState<MovingReceiver[]>([
    { x: -35, y: -28, vx: 7, vy: 0 },
    { x: 35, y: -28, vx: -7, vy: 0 },
  ]);
  const [emitter, setEmitter] = useState<Point>({ x: 0, y: 22 });
  const [f0MHz, setF0MHz] = useState(300);

  const f0 = f0MHz * 1e6;
  const [rx0, rx1] = receivers; // rx0 = Rx1 (the receiver), rx1 = Rx2 (the reference)
  // Δf at the true emitter (Hz). Argument order matches the displayed formula Δf = v₁·û₁ − v₂·û₂.
  const measured = fdoa(emitter, rx0, rx1, f0, C);

  // Normalize the heatmap to the largest Δf the geometry can produce (both platforms fully radial,
  // opposed): keeps the colour scale meaningful as f0 / velocities change.
  const speed = (r: MovingReceiver) => Math.hypot(r.vx, r.vy);
  const fMax = Math.max(1, (f0 / C) * (speed(rx0) + speed(rx1)));

  const points: MapPoint[] = [
    ...receivers.flatMap((r, i) => [
      {
        id: `rx${i}`,
        x: r.x,
        y: r.y,
        color: colors.cyan,
        label: `Rx${i + 1}`,
        kind: 'site' as const,
      },
      {
        id: `vel${i}`,
        x: r.x + r.vx * VEL_SCALE,
        y: r.y + r.vy * VEL_SCALE,
        color: colors.cyanDim,
        label: `v${i + 1}`,
        kind: 'site' as const,
      },
    ]),
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
    if (id === 'emitter') return setEmitter({ x, y });
    if (id.startsWith('vel')) {
      const i = Number(id.replace('vel', ''));
      return setReceivers((prev) =>
        prev.map((r, j) =>
          j === i ? { ...r, vx: (x - r.x) / VEL_SCALE, vy: (y - r.y) / VEL_SCALE } : r
        )
      );
    }
    const i = Number(id.replace('rx', ''));
    setReceivers((prev) => prev.map((r, j) => (j === i ? { ...r, x, y } : r)));
  };

  const draw = (ctx: CanvasRenderingContext2D, t: MapTransform) => {
    // Velocity arrows from each receiver to its handle.
    for (const r of receivers) {
      const a = t.toPx(r.x, r.y);
      const b = t.toPx(r.x + r.vx * VEL_SCALE, r.y + r.vy * VEL_SCALE);
      ctx.strokeStyle = colors.cyan;
      ctx.fillStyle = colors.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
      const ang = Math.atan2(b.py - a.py, b.px - a.px);
      ctx.beginPath();
      ctx.moveTo(b.px, b.py);
      ctx.lineTo(b.px - 8 * Math.cos(ang - 0.4), b.py - 8 * Math.sin(ang - 0.4));
      ctx.lineTo(b.px - 8 * Math.cos(ang + 0.4), b.py - 8 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    }
    // Isodoppler curve through the emitter (the level set Δf = measured).
    const segs = isoContour((x, y) => fdoa({ x, y }, rx0, rx1, f0, C), WORLD, measured, 90);
    ctx.strokeStyle = colors.signal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [p, q] of segs) {
      const a = t.toPx(p.x, p.y);
      const b = t.toPx(q.x, q.y);
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
    }
    ctx.stroke();
  };

  return (
    <div className="flex flex-col gap-6">
      <WorldMap
        extent={WORLD}
        points={points}
        onPointMove={onPointMove}
        draw={draw}
        field={{
          value: (x, y) => fdoa({ x, y }, rx0, rx1, f0, C),
          color: (v) => fdoaColor(v, fMax),
          resolution: 56,
        }}
        deps={[receivers, emitter, f0]}
        ariaLabel="Two moving receivers over a Doppler-difference field; the highlighted isodoppler curve passes through the emitter"
      />

      <div className="flex flex-wrap gap-4">
        <Readout label="Δf at emitter" value={formatHz(measured)} accent />
        <Readout label="Rx1 speed" value={`${speed(rx0).toFixed(1)} km/s`} />
        <Readout label="Rx2 speed" value={`${speed(rx1).toFixed(1)} km/s`} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <label className="flex flex-col gap-1.5">
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Carrier f₀</span>
            <span className="text-signal">{f0MHz} MHz</span>
          </span>
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={f0MHz}
            onChange={(e) => setF0MHz(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Carrier frequency in megahertz"
          />
        </label>
        <span className="readout text-xs text-text-faint">
          <GlossedText>
            drag receivers, their velocity arrows (v1 / v2), or the emitter · higher f₀ ⇒ a larger
            Doppler shift, so the same geometry yields a bigger Δf
          </GlossedText>
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <span className="text-xs text-cyan">−Δf</span>
        <div
          className="h-3 flex-1 rounded-sm"
          style={{
            background: `linear-gradient(to right, ${fdoaColor(-fMax, fMax)}, ${fdoaColor(0, fMax)}, ${fdoaColor(fMax, fMax)})`,
          }}
        />
        <span className="text-xs text-alert">+Δf</span>
      </div>
    </div>
  );
}

// Diverging heatmap: cyan (receiver pair sees a net down-shift) ↔ neutral (0) ↔ warm (up-shift).
// Alpha grows with |Δf| so the near-zero band stays faint and the isodoppler curve reads clearly.
function fdoaColor(v: number, fMax: number): string {
  const t = Math.max(-1, Math.min(1, v / (fMax || 1)));
  const neg: [number, number, number] = [66, 212, 244]; // cyan
  const pos: [number, number, number] = [255, 150, 80]; // warm
  const end = t < 0 ? neg : pos;
  const m = Math.abs(t);
  const ch = (k: number) => Math.round(18 + (end[k] - 18) * m);
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, ${(0.12 + 0.62 * m).toFixed(3)})`;
}

function formatHz(hz: number): string {
  const a = Math.abs(hz);
  if (a >= 1000) return `${(hz / 1000).toFixed(2)} kHz`;
  return `${hz.toFixed(1)} Hz`;
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
