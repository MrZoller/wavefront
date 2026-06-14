import { colors } from '@/design/tokens';
import { useCanvas } from './useCanvas';

export interface PolarMarker {
  angleRad: number;
  color: string;
  label?: string;
  dashed?: boolean;
}

export interface PolarPlotProps {
  /** Bearing samples in radians within [−π/2, π/2], ascending. */
  anglesRad: number[];
  /** Normalized magnitude/power in [0, 1] at each angle. */
  values: number[];
  /** Optional radial markers (source bearing, steering direction, candidates…). */
  markers?: PolarMarker[];
  /** If set, plot the radius on a dB scale from `floorDb` (center) to 0 dB (edge), treating
   *  `values` as linear power. This makes low sidelobes visible instead of collapsing to the origin. */
  floorDb?: number;
  size?: number;
  className?: string;
}

/**
 * Half-polar gain/array-pattern plot (brief §9 shared viz). Broadside (0°) points up, ±90° to
 * the sides — matching the phase-difference geometry. Radius encodes normalized power, so the
 * mainlobe and sidelobes of a steered array read directly off the fan.
 */
export function PolarPlot({
  anglesRad,
  values,
  markers = [],
  floorDb,
  size = 300,
  className,
}: PolarPlotProps) {
  // Map a value to a [0,1] radius — linear, or compressed onto a dB scale when `floorDb` is set.
  const radial = (v: number) => {
    if (floorDb == null) return Math.max(0, Math.min(1, v));
    const db = 10 * Math.log10(Math.max(1e-12, v));
    return Math.max(0, Math.min(1, (db - floorDb) / -floorDb));
  };
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h - 18; // origin near the bottom; semicircle opens upward
      const r = Math.min(w / 2 - 16, h - 34);

      // θ measured from broadside (up); +θ to the right. Screen y grows downward.
      const pt = (theta: number, rad: number) => ({
        x: cx + Math.sin(theta) * rad,
        y: cy - Math.cos(theta) * rad,
      });

      // Radial grid arcs (upper semicircle, matching the pt() fan: left → top → right).
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      for (const frac of [0.25, 0.5, 0.75, 1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * frac, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }

      // Angle spokes + labels.
      ctx.fillStyle = colors.textFaint;
      ctx.font = '10px ui-monospace, monospace';
      for (const deg of [-90, -60, -30, 0, 30, 60, 90]) {
        const theta = (deg * Math.PI) / 180;
        const edge = pt(theta, r);
        ctx.strokeStyle = colors.border;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(edge.x, edge.y);
        ctx.stroke();
        const lbl = pt(theta, r + 12);
        ctx.fillText(`${deg}°`, lbl.x - 8, lbl.y + 3);
      }

      // Pattern curve (filled).
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < anglesRad.length; i++) {
        const p = pt(anglesRad[i], r * radial(values[i]));
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      // Canvas fillStyle can't resolve CSS var() — concrete rgba (signal green at 22%).
      ctx.fillStyle = 'rgba(62, 240, 160, 0.22)';
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 1.75;
      ctx.fill();
      ctx.stroke();

      // Markers (radial lines).
      for (const m of markers) {
        const edge = pt(m.angleRad, r);
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(m.dashed ? [4, 4] : []);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(edge.x, edge.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [anglesRad, values, markers, floorDb]
  );

  // Radius encodes power; on a dB scale when `floorDb` is set, otherwise normalized [0, 1].
  const radialLabel = floorDb == null ? 'Power (normalized)' : 'Power (dB)';

  return (
    <figure className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: size }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label="Polar array gain pattern versus bearing"
      />
      {/* The angular axis is already tick-labeled in degrees on the fan; this names both axes. */}
      <figcaption className="readout mt-1 flex justify-between text-xs text-text-faint">
        <span>Radius: {radialLabel}</span>
        <span>Angle: Bearing (°)</span>
      </figcaption>
    </figure>
  );
}
