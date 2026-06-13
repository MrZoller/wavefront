import { colors } from '@/design/tokens';
import { useCanvas } from './useCanvas';

export interface Series {
  label?: string;
  color: string;
  /** y-values, evenly spaced across the x domain. */
  samples: number[];
}

export interface TimeSeriesPlotProps {
  series: Series[];
  /** y-axis range. Defaults to [-1, 1] (handy for normalized waveforms). */
  yDomain?: [number, number];
  /** Optional axis labels for the readout. */
  xLabel?: string;
  yLabel?: string;
  height?: number;
  className?: string;
}

/**
 * A generic time-series (waveform) plot on Canvas 2D — the workhorse for showing
 * signals in the time domain (brief §9, §10). Reused across tracks for I/Q tones,
 * pulse shapes, eye diagrams, etc.
 */
export function TimeSeriesPlot({
  series,
  yDomain = [-1, 1],
  xLabel,
  yLabel,
  height = 160,
  className,
}: TimeSeriesPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const [yMin, yMax] = yDomain;
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
        aria-label={[yLabel, xLabel].filter(Boolean).join(' versus ') || 'Time-series plot'}
      />
      {(xLabel || yLabel) && (
        <figcaption className="mt-1 flex justify-between readout text-[10px] text-text-faint">
          <span>{yLabel}</span>
          <span>{xLabel}</span>
        </figcaption>
      )}
    </figure>
  );
}
