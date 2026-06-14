import { colors } from '@/design/tokens';
import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { PlotFrame } from './PlotFrame';
import { useCanvas } from './useCanvas';

export interface EyeDiagramPlotProps {
  /** Real waveform samples (e.g. the I rail). */
  samples: number[];
  /** Samples per symbol — the fold period. */
  sps: number;
  height?: number;
  color?: string;
  className?: string;
  /** What each axis represents — required. x is time folded over a two-symbol span, y is amplitude.
   *  Defaults to `{ quantity: 'Time (two symbols)' }` and `AXIS.amplitude` at the call sites. */
  xLabel: AxisLabel;
  yLabel: AxisLabel;
  /** Richer screen-reader description; defaults to "{y} versus {x}". */
  ariaLabel?: string;
}

/**
 * Eye diagram (brief §5/§6 shared viz) — fold the waveform into overlapping two-symbol windows. The
 * open "eye" at the center is the decision margin; it narrows as noise/ISI grows.
 */
export function EyeDiagramPlot({
  samples,
  sps,
  height = 150,
  color = colors.signal,
  className,
  xLabel,
  yLabel,
  ariaLabel,
}: EyeDiagramPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const span = 2 * sps;
      let peak = 1e-9;
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
      const yOf = (v: number) => h / 2 - (v / (peak * 1.1)) * (h / 2 - 6);
      const xOf = (j: number) => (j / span) * w;

      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yOf(0));
      ctx.lineTo(w, yOf(0));
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (let start = sps; start + span < samples.length; start += sps) {
        ctx.beginPath();
        for (let j = 0; j <= span; j++) {
          const x = xOf(j);
          const y = yOf(samples[start + j]);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    [samples, sps, color]
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
