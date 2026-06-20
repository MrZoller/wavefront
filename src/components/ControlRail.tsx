import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * The DOM node where `ControlRail` content is pinned — the module column's footer, below the scroll
 * region. `ModuleView` provides it; `null` (the default) means "render in place" (tests, or any host
 * that doesn't establish the layout).
 */
const ControlRailSlotContext = createContext<HTMLElement | null>(null);

export function ControlRailSlotProvider({
  slot,
  children,
}: {
  slot: HTMLElement | null;
  children: ReactNode;
}) {
  return <ControlRailSlotContext.Provider value={slot}>{children}</ControlRailSlotContext.Provider>;
}

export interface ControlRailProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * A control panel that stays reachable while the visualizations above it scroll — the layout half of
 * Wavefront's direct-manipulation premise ("drag a control, watch the math respond"). On tall modules
 * (the synthesis scenes that stack several plots) the sliders otherwise fall below the fold, away from
 * the plot they drive, silently severing that loop.
 *
 * The rail is **pinned outside the scroll region**, not floated over it: `ModuleView` lays out the
 * module column as a scrolling plot region above a fixed footer, and the rail portals into that footer
 * (`ControlRailSlotProvider`). So the plots scroll *up to* the rail's top edge and stop — they never
 * slide underneath it (an in-flow `sticky` footer can't avoid that; content shares its scroll box).
 * The rail is a solid, opaque floor: a token `bg-surface`, a top border, and a soft upward shadow.
 * Place the module's marquee / target plot last so it sits directly above the rail. When no slot is
 * provided it renders in place. See CONTRIBUTING → "Keep controls co-visible with their target plot".
 */
export function ControlRail({ children, className, style }: ControlRailProps) {
  const slot = useContext(ControlRailSlotContext);
  const rail = (
    <div
      className={[
        'border-t border-border bg-surface px-6 pt-4 pb-6 shadow-[0_-10px_24px_-14px_rgba(0,0,0,0.85)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </div>
  );
  return slot ? createPortal(rail, slot) : rail;
}
