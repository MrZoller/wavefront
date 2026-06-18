import { colors } from '@/design/tokens';
import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { PlotFrame } from './PlotFrame';
import { useCanvas } from './useCanvas';

export interface TapStemPlotProps {
  /** Filter tap weights (signed), drawn as stems at integer tap indices. */
  weights: number[];
  /** Optional reference taps (e.g. the ideal channel inverse) drawn as faint hollow targets. */
  target?: number[];
  /** Half-height of the symmetric y-axis in weight units; auto-fits the data when omitted. */
  limit?: number;
  height?: number;
  color?: string;
  className?: string;
  xLabel: AxisLabel;
  yLabel: AxisLabel;
  ariaLabel?: string;
}

/**
 * A stem ("lollipop") plot for a short set of FIR tap weights — a stem from the zero line to each
 * tap's value with a dot at the tip. Used by the adaptive-equalizer view to show the tap weights
 * climbing toward the channel inverse as the filter learns; the generic line plots assume a dense
 * waveform, so a handful of discrete, signed taps reads better as stems.
 */
export function TapStemPlot({
  weights,
  target,
  limit,
  height = 150,
  color = colors.signal,
  className,
  xLabel,
  yLabel,
  ariaLabel,
}: TapStemPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const n = weights.length;
      const peak =
        limit ?? Math.max(0.2, ...weights.map(Math.abs), ...(target ?? []).map(Math.abs)) * 1.15;
      const slot = w / n;
      const xOf = (i: number) => slot * (i + 0.5);
      const yOf = (v: number) => h / 2 - (v / peak) * (h / 2 - 8);

      // Zero line.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yOf(0));
      ctx.lineTo(w, yOf(0));
      ctx.stroke();

      // Reference targets (faint hollow rings), if given.
      if (target) {
        ctx.strokeStyle = colors.textFaint;
        ctx.lineWidth = 1;
        for (let i = 0; i < target.length; i++) {
          ctx.beginPath();
          ctx.arc(xOf(i), yOf(target[i]), 3, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // Live tap stems.
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const x = xOf(i);
        const y = yOf(weights[i]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, yOf(0));
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [weights, target, limit, color]
  );

  return (
    <PlotFrame className={className} xLabel={xLabel} yLabel={yLabel}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label={ariaLabel ?? axisAriaLabel(yLabel, xLabel)}
      />
    </PlotFrame>
  );
}
