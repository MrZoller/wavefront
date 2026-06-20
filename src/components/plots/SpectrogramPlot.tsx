import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { heatColor } from './heat';
import { PlotFrame } from './PlotFrame';
import { useCanvas } from './useCanvas';

export interface SpectrogramPlotProps {
  /** `frames × bins` dB magnitudes (each row a centered spectrum), 0 dB peak. */
  data: number[][];
  floorDb?: number;
  height?: number;
  className?: string;
  /** What each axis represents — required. Time runs along x, frequency up y (color = energy).
   *  Typically `AXIS.time` and `AXIS.normalizedFrequency`. */
  xLabel: AxisLabel;
  yLabel: AxisLabel;
  /** Richer screen-reader description; defaults to "{y} versus {x}". */
  ariaLabel?: string;
}

/**
 * Spectrogram / waterfall (brief §6, §9 shared viz) — time on x, frequency on y, color = energy.
 * The reusable time–frequency view that makes FSK hops, chirps, and OFDM grids legible.
 */
export function SpectrogramPlot({
  data,
  floorDb = -80,
  height = 180,
  className,
  xLabel,
  yLabel,
  ariaLabel,
}: SpectrogramPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const frames = data.length;
      if (frames === 0) return;
      const bins = data[0].length;
      const cw = w / frames;
      const ch = h / bins;
      for (let t = 0; t < frames; t++) {
        const col = data[t];
        for (let b = 0; b < bins; b++) {
          const norm = Math.min(1, Math.max(0, (col[b] - floorDb) / -floorDb));
          ctx.fillStyle = heatColor(norm);
          // Frequency increases upward (flip y).
          ctx.fillRect(t * cw, h - (b + 1) * ch, Math.ceil(cw), Math.ceil(ch));
        }
      }
    },
    [data, floorDb]
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
