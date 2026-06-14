import type { ReactNode } from 'react';
import { type AxisLabel, formatAxisLabel } from './axisLabel';

export interface PlotFrameProps {
  /** The plot canvas. */
  children: ReactNode;
  xLabel: AxisLabel;
  yLabel: AxisLabel;
  className?: string;
}

/**
 * Shared frame that puts each axis label on the *correct* axis: the y-label (the vertical /
 * dependent quantity) sits at the top-left, above the vertical axis, and the x-label runs centered
 * along the bottom edge. Doing it once here keeps every Cartesian plot consistent — and fixes the
 * earlier mistake of dropping both labels into a single bottom footer, which mislabeled the vertical
 * quantity as an x-axis caption.
 *
 * The y-label uses the compact top-left placement rather than rotated vertical text: several labels
 * (e.g. "Normalized frequency (cycles/sample)") are longer than the shorter plots are tall, so
 * rotated text would overflow the canvas at our sizes. Top-left stays legible at every height while
 * still clearly belonging to the vertical axis — never the bottom row.
 */
export function PlotFrame({ children, xLabel, yLabel, className }: PlotFrameProps) {
  return (
    <figure className={className}>
      <div data-axis="y" className="readout mb-1 text-xs text-text-faint">
        {formatAxisLabel(yLabel)}
      </div>
      {children}
      <figcaption data-axis="x" className="readout mt-1 text-center text-xs text-text-faint">
        {formatAxisLabel(xLabel)}
      </figcaption>
    </figure>
  );
}
