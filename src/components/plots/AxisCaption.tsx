import { type AxisLabel, formatAxisLabel } from './axisLabel';

export interface AxisCaptionProps {
  xLabel: AxisLabel;
  yLabel: AxisLabel;
}

/**
 * The shared, quiet axis caption sitting under a Cartesian plot: the y quantity on the left, the x
 * quantity on the right — a single lightweight line styled from the design tokens, not tick-label
 * or gridline spam that would fight the instrument aesthetic (brief scope guard).
 *
 * Centralizing it here means every Tier-1 plot labels its axes the same way, and the mandatory
 * `quantity` is validated by {@link formatAxisLabel} on render.
 */
export function AxisCaption({ xLabel, yLabel }: AxisCaptionProps) {
  return (
    <figcaption className="readout mt-1 flex justify-between text-xs text-text-faint">
      <span>{formatAxisLabel(yLabel)}</span>
      <span>{formatAxisLabel(xLabel)}</span>
    </figcaption>
  );
}
