import { colors } from '@/design/tokens';
import { useCanvas } from './useCanvas';

export interface XYSeries {
  x: number[];
  y: number[];
  color: string;
}

export interface XYPlotProps {
  series: XYSeries[];
  xDomain: [number, number];
  yDomain: [number, number];
  /** Plot y on a log10 axis (for BER curves). Values are clamped to `yDomain` before the log. */
  logY?: boolean;
  /** A highlighted point (e.g. the current operating point). */
  marker?: { x: number; y: number; color?: string };
  height?: number;
  xLabel?: string;
  yLabel?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * A generic x–y line plot (brief §9 shared viz) — used for the BER-vs-SNR curve and channel
 * frequency response. Supports a log y-axis and a highlighted operating-point marker.
 */
export function XYPlot({
  series,
  xDomain,
  yDomain,
  logY = false,
  marker,
  height = 180,
  xLabel,
  yLabel,
  className,
  ariaLabel = 'x-y plot',
}: XYPlotProps) {
  const tY = (v: number) => {
    const [lo, hi] = yDomain;
    const c = Math.min(hi, Math.max(lo, v));
    return logY
      ? (Math.log10(c) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))
      : (c - lo) / (hi - lo);
  };
  const tX = (v: number) => (v - xDomain[0]) / (xDomain[1] - xDomain[0]);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const px = (x: number) => tX(x) * w;
      const py = (y: number) => h - tY(y) * h;

      // Gridlines (a few horizontal references).
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const yy = (g / 4) * h;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(w, yy);
        ctx.stroke();
      }

      for (const s of series) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.75;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < s.x.length; i++) {
          const X = px(s.x[i]);
          const Y = py(s.y[i]);
          if (i === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }

      if (marker) {
        ctx.fillStyle = marker.color ?? colors.alert;
        ctx.beginPath();
        ctx.arc(px(marker.x), py(marker.y), 4.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [series, xDomain, yDomain, logY, marker]
  );

  return (
    <figure className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label={ariaLabel}
      />
      {(xLabel || yLabel) && (
        <figcaption className="readout mt-1 flex justify-between text-xs text-text-faint">
          <span>{yLabel}</span>
          <span>{xLabel}</span>
        </figcaption>
      )}
    </figure>
  );
}
