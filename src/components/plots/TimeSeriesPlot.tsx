import { colors } from '@/design/tokens';
import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { AxisCaption } from './AxisCaption';
import { useCanvas } from './useCanvas';

export interface Series {
  label?: string;
  color: string;
  /** y-values, evenly spaced across the x domain. */
  samples: number[];
}

export interface TimeSeriesPlotProps {
  series: Series[];
  /** Minimum y-axis range; the plot always expands this to fit the data so traces never clip.
   *  Defaults to [-1, 1] (handy for normalized waveforms). */
  yDomain?: [number, number];
  /** What each axis represents — required so no waveform renders unlabeled (see {@link AxisLabel}).
   *  Typically `Time`/`Sample` on x and `Amplitude` on y. */
  xLabel: AxisLabel;
  yLabel: AxisLabel;
  height?: number;
  className?: string;
  /** Richer screen-reader description; defaults to "{y} versus {x}". */
  ariaLabel?: string;
}

/**
 * A generic time-series (waveform) plot on Canvas 2D — the workhorse for showing
 * signals in the time domain (brief §9, §10). Reused across tracks for I/Q tones,
 * pulse shapes, eye diagrams, etc. The y-axis auto-expands to fit the data (with a little
 * headroom) so no trace is ever cut off, using `yDomain` only as a minimum range.
 */
export function TimeSeriesPlot({
  series,
  yDomain = [-1, 1],
  xLabel,
  yLabel,
  height = 160,
  className,
  ariaLabel,
}: TimeSeriesPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      // Fit the axis to the data (never smaller than yDomain), then add 6% headroom.
      let yMin = yDomain[0];
      let yMax = yDomain[1];
      for (const s of series) {
        for (const v of s.samples) {
          if (v < yMin) yMin = v;
          if (v > yMax) yMax = v;
        }
      }
      const pad = (yMax - yMin) * 0.06 || 1;
      yMin -= pad;
      yMax += pad;
      const yToPx = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h;

      // Zero / mid gridline.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const zeroY = yToPx(0);
      ctx.moveTo(0, zeroY);
      ctx.lineTo(w, zeroY);
      ctx.stroke();

      // Traces.
      for (const s of series) {
        const n = s.samples.length;
        if (n === 0) continue;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.75;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = n === 1 ? 0 : (i / (n - 1)) * w;
          const y = yToPx(s.samples[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [series, yDomain]
  );

  return (
    <figure className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label={ariaLabel ?? axisAriaLabel(yLabel, xLabel)}
      />
      <AxisCaption xLabel={xLabel} yLabel={yLabel} />
    </figure>
  );
}
