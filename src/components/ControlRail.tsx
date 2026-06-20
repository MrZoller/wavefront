import type { CSSProperties, ReactNode } from 'react';

export interface ControlRailProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * A control panel that stays reachable while the visualizations above it scroll — the layout half of
 * Wavefront's direct-manipulation premise ("drag a control, watch the math respond"). On tall modules
 * (the synthesis scenes that stack several representations) the sliders otherwise fall below the fold,
 * away from the plot they drive, which silently severs that feedback loop. Wrapping the primary
 * controls in this rail pins them to the bottom of the scrolling module column, so the sliders are
 * always reachable and at least one plot stays visible while dragging. Put the module's marquee /
 * target plot directly above the rail so the thing you drag against is nearest the sliders.
 *
 * It is full-bleed by design: the negative `-mx-6 -mb-6` cancels the `p-6` padding of `ModuleView`'s
 * scroll column so the rail spans edge-to-edge and sits flush with the bottom, with `pt-4`/`pb-6`
 * restoring the inner inset. `position: sticky` doesn't trap scroll — the column scrolls normally and
 * the rail just stays pinned. See CONTRIBUTING → "Keep controls co-visible with their target plot".
 */
export function ControlRail({ children, className, style }: ControlRailProps) {
  return (
    <div
      className={[
        'sticky bottom-0 z-10 -mx-6 -mb-6 border-t border-border bg-surface px-6 pt-4 pb-6',
        'shadow-[0_-10px_24px_-14px_rgba(0,0,0,0.8)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </div>
  );
}
