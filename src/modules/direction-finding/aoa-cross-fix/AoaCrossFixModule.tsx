import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { WorldMap, type MapPoint, type MapTransform } from '@/components/plots/WorldMap';
import { colors } from '@/design/tokens';
import { aoaFix, errorEllipse, type Bearing } from '@/dsp/geolocation';
import { skywaveApparentBearingRad } from '@/propagation';

type Propagation = 'los' | 'skywave';

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
  const [mode, setMode] = useState<Propagation>('los');

  // The bearings a site *measures*. On line-of-sight they point straight at the emitter. On HF
  // skywave the wave arrives after an ionospheric bounce, so each apparent bearing is deflected — the
  // single physics knob that makes a fix built on the straight-line assumption walk off the emitter.
  const bearings: Bearing[] = sites.map((s) => {
    const trueBearing = Math.atan2(emitter.y - s.y, emitter.x - s.x);
    return {
      x: s.x,
      y: s.y,
      bearing: mode === 'skywave' ? skywaveApparentBearingRad(trueBearing) : trueBearing,
    };
  });
  const sigma = (sigmaDeg * Math.PI) / 180;
  const { fix, cov } = aoaFix(bearings, sigma);
  const ellipse = cov ? errorEllipse(cov, 2) : null; // 2σ region
  // How far the naive fix has walked from the true emitter (skywave only).
  const drift = fix ? Math.hypot(fix.x - emitter.x, fix.y - emitter.y) : null;

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
      label: mode === 'skywave' ? 'true emitter' : 'emitter',
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
      // Canvas fillStyle can't resolve CSS var()/custom properties — use a concrete rgba
      // (signal green #3ef0a0 at 14% — see src/design/tokens.ts).
      ctx.fillStyle = 'rgba(62, 240, 160, 0.14)';
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

      // On skywave, draw the gap between the naive fix and the true emitter — the drift.
      if (mode === 'skywave' && drift != null) {
        const e = t.toPx(emitter.x, emitter.y);
        ctx.save();
        ctx.strokeStyle = colors.alert;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(c.px, c.py);
        ctx.lineTo(e.px, e.py);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = colors.alert;
        ctx.font = '11px ui-monospace, monospace';
        ctx.fillText(`drift ${drift.toFixed(1)} km`, (c.px + e.px) / 2 + 6, (c.py + e.py) / 2 - 4);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <WorldMap
        extent={WORLD}
        points={points}
        onPointMove={onPointMove}
        draw={draw}
        deps={[bearings, fix, ellipse, mode, drift]}
        ariaLabel="Two or three DF sites with lines of bearing crossing at the emitter"
      />

      <div className="flex flex-wrap gap-4">
        <Readout
          label={mode === 'skywave' ? 'Naive fix' : 'Fix'}
          value={fix ? `(${fix.x.toFixed(1)}, ${fix.y.toFixed(1)})` : 'no crossing'}
          accent
        />
        <Readout
          label="Error region (2σ)"
          value={ellipse ? `${ellipse.major.toFixed(1)} × ${ellipse.minor.toFixed(1)} km` : '—'}
        />
        <div
          className={[
            'readout flex flex-col rounded-md border px-3 py-2 text-xs',
            mode === 'skywave' ? 'border-alert-dim text-alert' : 'border-border',
          ].join(' ')}
        >
          <span className="text-text-faint">Fix error vs true emitter</span>
          <span className={mode === 'skywave' ? '' : 'text-text'}>
            {mode === 'skywave' && drift != null ? `${drift.toFixed(1)} km off` : 'on the emitter'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <span className="readout text-xs text-text-faint">line of bearing</span>
          <div className="flex gap-2">
            {(
              [
                ['los', 'Line-of-sight'],
                ['skywave', 'HF skywave'],
              ] as const
            ).map(([value, label]) => {
              const selected = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMode(value)}
                  className={[
                    'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
                    selected
                      ? 'border-signal-dim bg-surface-raised text-signal'
                      : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <Slider
            label="Angular error σθ"
            value={sigmaDeg}
            min={0.5}
            max={8}
            step={0.5}
            decimals={1}
            unit="°"
            onChange={setSigmaDeg}
            ariaLabel="Per-bearing angular error in degrees"
          />
          <span className="readout text-xs text-text-faint">
            <GlossedText>
              drag DF sites / emitter · flip to skywave and watch the straight-ray fix walk off the
              true emitter
            </GlossedText>
          </span>
        </div>
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
