import { colors } from '@/design/tokens';
import { useCanvas } from './useCanvas';

export interface PhasorPlotProps {
  /** Current phasor angle in radians. */
  angle: number;
  /** Phasor magnitude in [0, 1] (unit circle is radius 1). */
  amplitude?: number;
  /** Draw dashed projections onto the I and Q axes (the link to the time plots). */
  showProjections?: boolean;
  size?: number;
  className?: string;
}

/**
 * The complex-plane / phasor view (brief §9 shared viz library): a rotating vector on the
 * unit circle, with its real (I) and imaginary (Q) projections. This is the visual heart of
 * the rotating-phasor module — you literally watch the 2D point spin.
 */
export function PhasorPlot({
  angle,
  amplitude = 1,
  showProjections = true,
  size = 280,
  className,
}: PhasorPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2 - 14;

      // Axes.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      // Intrinsic axis labels — the complex plane's axes are always the real (I) and imaginary (Q)
      // parts, so they name themselves. These are the projections the time plots read off.
      ctx.fillStyle = colors.textFaint;
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('I', w - 12, cy - 6);
      ctx.fillText('Q', cx + 6, 12);

      // Unit circle.
      ctx.strokeStyle = colors.surfaceRaised;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();

      // Tip of the phasor (note: screen y grows downward, so negate the imaginary part).
      const tipX = cx + Math.cos(angle) * r * amplitude;
      const tipY = cy - Math.sin(angle) * r * amplitude;

      if (showProjections) {
        ctx.strokeStyle = colors.cyanDim;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        // I projection (onto horizontal axis).
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX, cy);
        // Q projection (onto vertical axis).
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx, tipY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Projection dots.
        ctx.fillStyle = colors.cyan;
        ctx.beginPath();
        ctx.arc(tipX, cy, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, tipY, 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // The phasor vector.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = colors.signal;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tip marker.
      ctx.fillStyle = colors.signal;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4.5, 0, 2 * Math.PI);
      ctx.fill();
    },
    [angle, amplitude, showProjections]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={['rounded-md border border-border bg-surface', className]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label="Rotating phasor on the complex plane"
    />
  );
}
