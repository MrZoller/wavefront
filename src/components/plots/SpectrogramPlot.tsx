import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { AxisCaption } from './AxisCaption';
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

// Dark → cyan → green → amber heat ramp for dB magnitude (t in [0,1]).
function heat(t: number): string {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [7, 11, 14]],
    [0.45, [31, 106, 134]],
    [0.7, [62, 240, 160]],
    [1, [244, 197, 66]],
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const f = (t - lo[0]) / (hi[0] - lo[0] || 1);
  const ch = (k: number) => Math.round(lo[1][k] + f * (hi[1][k] - lo[1][k]));
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
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
          ctx.fillStyle = heat(norm);
          // Frequency increases upward (flip y).
          ctx.fillRect(t * cw, h - (b + 1) * ch, Math.ceil(cw), Math.ceil(ch));
        }
      }
    },
    [data, floorDb]
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
