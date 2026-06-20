import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Which edge of the module scroll region a rail pins to. Controls pin to whichever edge they're
 * anchored on: bottom-anchored controls (footers — the default) pin as a floor, top-anchored controls
 * (headers) pin as a ceiling. Either way the plots scroll _up to_ the rail and stop, never under it.
 */
export type ControlRailEdge = 'top' | 'bottom';

/**
 * The DOM nodes where `ControlRail` content is pinned — the module column's header (above the scroll
 * region) and footer (below it). `ModuleView` provides them; a `null` slot (the default for an edge no
 * host wired up) means "render in place" (tests, or any host that doesn't establish the layout).
 */
interface ControlRailSlots {
  top: HTMLElement | null;
  bottom: HTMLElement | null;
}

const ControlRailSlotContext = createContext<ControlRailSlots>({ top: null, bottom: null });

export function ControlRailSlotProvider({
  top = null,
  bottom = null,
  children,
}: {
  top?: HTMLElement | null;
  bottom?: HTMLElement | null;
  children: ReactNode;
}) {
  const slots = useMemo(() => ({ top, bottom }), [top, bottom]);
  return (
    <ControlRailSlotContext.Provider value={slots}>{children}</ControlRailSlotContext.Provider>
  );
}

export interface ControlRailProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** The edge the controls are anchored on — `'bottom'` (a pinned footer, the default) or `'top'` (a
      pinned header, e.g. Modulation Zoo's SNR slider + scheme chips). */
  edge?: ControlRailEdge;
}

/**
 * A control panel that stays reachable while the visualizations scroll — the layout half of
 * Wavefront's direct-manipulation premise ("drag a control, watch the math respond"). On tall modules
 * (the synthesis scenes that stack several plots) the controls otherwise fall off the fold, away from
 * the plot they drive, silently severing that loop — whether they sit at the bottom (radar's footer)
 * or the top (Modulation Zoo's SNR + scheme chips, with plot rows stacked below).
 *
 * The rail is **pinned outside the scroll region**, not floated over it: `ModuleView` lays out the
 * module column as a scrolling plot region between a header and a footer slot, and the rail portals
 * into the slot for its `edge` (`ControlRailSlotProvider`). So the plots scroll *up to* the rail's
 * edge and stop — they never slide underneath it (an in-flow `sticky` rail can't avoid that; content
 * shares its scroll box and shows a peek-through strip). The rail is a solid, opaque floor/ceiling: a
 * token `bg-surface`, a border, and a soft shadow cast _away_ from the scroll region (down for a top
 * rail, up for a bottom rail). For a bottom rail, place the module's marquee / target plot last so it
 * sits directly above the rail. When no slot is provided for the edge it renders in place. See
 * CONTRIBUTING → "Keep controls co-visible with their target plot".
 */
export function ControlRail({ children, className, style, edge = 'bottom' }: ControlRailProps) {
  const slots = useContext(ControlRailSlotContext);
  const slot = slots[edge];
  // Edge-specific chrome — the opaque bg + border + shadow are shared; only the side flips so the
  // boundary and its shadow always face the scrolling plots (a top rail borders/shadows downward as a
  // ceiling; a bottom rail borders/shadows upward as a floor).
  const edgeClass =
    edge === 'top'
      ? 'border-b pt-5 pb-4 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.85)]'
      : 'border-t pt-4 pb-6 shadow-[0_-10px_24px_-14px_rgba(0,0,0,0.85)]';
  const rail = (
    <div
      className={['wf-rail border-border bg-surface px-6', edgeClass, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </div>
  );
  return slot ? createPortal(rail, slot) : rail;
}
