import { colors, withAlpha } from '@/design/tokens';
import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { PlotFrame } from './PlotFrame';
import { useCanvas } from './useCanvas';

export interface SpectrumPlotProps {
  /** Centered magnitude spectrum in dB (−fs/2 … +fs/2), 0 dB at the peak. */
  data: number[];
  floorDb?: number;
  color?: string;
  height?: number;
  className?: string;
  /** What each axis represents — required so a spectrum never renders unlabeled. y is essentially
   *  always `AXIS.magnitudeDb` (the dB *is* the lesson); x is `AXIS.normalizedFrequency` unless
   *  there's a real sample rate, in which case pass `{ quantity: 'Frequency', unit: 'Hz' }`. */
  yLabel: AxisLabel;
  xLabel: AxisLabel;
  /** Richer screen-reader description; defaults to "{y} versus {x}". */
  ariaLabel?: string;
}

/**
 * Magnitude-spectrum plot (brief §9 shared viz) — a filled dB curve over centered frequency. The
 * frequency-domain half of "always pair representations"; reused by the Modulation Zoo and OFDM.
 */
export function SpectrumPlot({
  data,
  floorDb = -80,
  color = colors.signal,
  height = 150,
  className,
  yLabel,
  xLabel,
  ariaLabel,
}: SpectrumPlotProps) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const n = data.length;
      if (n === 0) return;
      const xOf = (i: number) => (i / (n - 1)) * w;
      const yOf = (db: number) => h - ((db - floorDb) / -floorDb) * h;

      // Zero-frequency guide.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      // Filled spectrum.
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < n; i++) ctx.lineTo(xOf(i), yOf(data[i]));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = withAlpha(colors.signal, 0.12);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xOf(i);
        const y = yOf(data[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [data, floorDb, color]
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
