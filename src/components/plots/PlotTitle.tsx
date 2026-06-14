import type { ReactNode } from 'react';

export interface PlotTitleProps {
  /** The plot's name — *what it is* ("Sensor A — reference", "magnitude spectrum |X[k]|"). */
  children: ReactNode;
  /** Extra classes, merged after the base heading treatment. */
  className?: string;
}

/**
 * The heading for a single plot — the *name of the plot* ("Sensor A — reference", "passband on the
 * wire") — rendered directly above it.
 *
 * It is deliberately a different visual *role* from the axis labels that {@link PlotFrame} stacks on
 * the plot itself. The title takes the proportional UI face with a little more weight and size (a
 * heading), while the y-label hugging the canvas below it stays in the quiet monospace `readout`
 * treatment it shares with the x-label. Without that contrast the title and the top-left y-label —
 * both small, dim, monospace, and stacked in the same corner — fuse into what looks like a single
 * two-line caption, and a reader can't tell the plot's name from its vertical-axis label. Owning the
 * treatment here keeps every plot's title consistent, and distinct from its axes, in one place.
 */
export function PlotTitle({ children, className }: PlotTitleProps) {
  return (
    <p
      className={['mb-1.5 text-sm font-medium text-text-muted', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  );
}
