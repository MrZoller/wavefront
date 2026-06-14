import type { Complex } from '@/dsp/complex';
import { colors } from '@/design/tokens';
import { useCanvas } from './useCanvas';

export interface ScatterPoint {
  re: number;
  im: number;
  /** Override dot color (e.g. red for a bit error). Defaults to the signal tint. */
  color?: string;
}

export interface ConstellationPlotProps {
  /** The ideal constellation lattice, drawn as reference rings. */
  ideal: Complex[];
  /** Optional bit-group label per ideal point (e.g. "10"). */
  labels?: string[];
  /** Received / noisy symbols, drawn as a translucent scatter cloud. */
  scatter?: ScatterPoint[];
  /** Half-extent of the I and Q axes in symbol units. */
  limit?: number;
  size?: number;
  ariaLabel?: string;
}

/**
 * The I/Q constellation view (brief §9 shared viz, Track B): reference lattice points plus a cloud
 * of received symbols. The visual heart of the symbol-mapping and AWGN-channel modules — you watch
 * bits land on the plane and noise smear them across decision boundaries.
 */
export function ConstellationPlot({
  ideal,
  labels,
  scatter = [],
  limit = 1.6,
  size = 320,
  ariaLabel = 'I/Q constellation diagram',
}: ConstellationPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2 - 16;
      const s = r / limit; // symbol-units → pixels
      const px = (re: number) => cx + re * s;
      const py = (im: number) => cy - im * s; // screen y grows downward

      // Axes.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      // Intrinsic axis labels — a constellation is always In-phase (I) × Quadrature (Q), so the
      // axes name themselves (no caller needed). Both are normalized symbol units, hence no unit.
      ctx.fillStyle = colors.textFaint;
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('I', w - 12, cy - 6);
      ctx.fillText('Q', cx + 6, 12);

      // Received scatter (under the lattice so reference rings stay readable).
      for (const p of scatter) {
        ctx.fillStyle = p.color ?? colors.signal;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(px(p.re), py(p.im), 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Ideal lattice points.
      ctx.font = '10px ui-monospace, monospace';
      for (let i = 0; i < ideal.length; i++) {
        const x = px(ideal[i].re);
        const y = py(ideal[i].im);
        ctx.strokeStyle = colors.cyan;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.stroke();
        if (labels?.[i]) {
          ctx.fillStyle = colors.textFaint;
          ctx.fillText(labels[i], x + 7, y - 6);
        }
      }
    },
    [ideal, labels, scatter, limit]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-md border border-border bg-surface"
      role="img"
      aria-label={ariaLabel}
    />
  );
}
