import { Fragment } from 'react';
import { getModule } from '@/registry';
import { useAppStore } from '@/store/appStore';

export interface DiagramBlock {
  id: string;
  /** Short block name (e.g. "Mixer"). */
  label: string;
  /** What it maps to in software (e.g. "downconvert") — the second line. */
  sub?: string;
  /** Registry id of the module this block routes to. Omit (or an unregistered id) → a quiet,
   *  non-interactive "no software counterpart / not built yet" block. */
  moduleId?: string;
}

export interface BlockDiagramProps {
  /** The chain in left-to-right order; a flow arrow is drawn between each block and the next. */
  blocks: DiagramBlock[];
  ariaLabel: string;
  /** When set, lay the chain out as a **single non-wrapping row aligned to a shared `columns`-wide
   *  grid** (block *i* always sits in column *i*; a shorter chain left-aligns and leaves trailing
   *  columns empty), with the boxes shrinking to fit rather than wrapping. Use it to stack several
   *  diagrams that must share one left-to-right coordinate — e.g. the SDR architectures, where the
   *  ADC has to line up column-for-column so its march toward the antenna reads straight down the
   *  stack. Pass the longest chain's length. Omit it and the chain **wraps responsively** instead
   *  (the default, for a single long chain like the receive/transmit signal chain). */
  columns?: number;
}

/**
 * An interactive "boxes and wires" block diagram. Each block can route to the registry module that
 * simulates its function — so a hardware/orientation learner can click a block (mixer, ADC, filter…)
 * and land in the math behind it. Linked blocks read as pressable controls (accent, hover, keyboard
 * focus, pointer cursor) per the affordance language; blocks with no software counterpart yet (or a
 * not-built track) stay quiet and inert. Reusable as an app-wide orientation map — hence generic
 * over its blocks rather than baking in one chain.
 *
 * Two layouts, one box style. **Default (wrap):** a flow of comfortable, fixed-width blocks that
 * wraps responsively — one clean row when the container fits the chain, breaking onto further rows
 * when it doesn't, each block holding a minimum readable width rather than shrinking, so a long
 * chain (the 8-box receive chain) stays legible at any width. Each arrow stays welded to the block
 * it points into, so a wrapped row begins with its incoming connector and the chain reads as one
 * continuous flow across the break. **Aligned (`columns` set):** a single non-wrapping row on a
 * shared grid, for stacking diagrams that must line up column-for-column (the SDR comparison); here
 * the boxes shrink to fit instead of wrapping. Neither layout ever needs a horizontal scroll.
 */
export function BlockDiagram({ blocks, ariaLabel, columns }: BlockDiagramProps) {
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  // Shared box look. The chain holds a comfortable, scale-aligned fixed width and wraps first; the
  // aligned grid instead lets the box fill its column and shrink with it. `min-w-0` + `break-words`
  // keep a too-narrow container from ever pushing a horizontal scrollbar.
  const boxBase =
    'flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2 text-center leading-tight break-words';
  const sizing = columns ? 'w-full' : 'w-30 max-w-full';
  const lit =
    'cursor-pointer border-signal-dim bg-surface text-signal transition-colors hover:border-signal hover:bg-surface-raised focus-visible:border-signal focus-visible:bg-surface-raised focus-visible:outline-none';
  const quiet = 'border-border bg-surface text-text-muted';

  const renderBox = (n: DiagramBlock) => {
    const linked = Boolean(n.moduleId && getModule(n.moduleId));
    const go = () => linked && n.moduleId && setActiveModule(n.moduleId);
    const cls = `${boxBase} ${sizing} ${linked ? lit : quiet}`;
    const content = (
      <>
        <span className="text-[13px] font-semibold">{n.label}</span>
        {n.sub && <span className="font-mono text-[10.5px] text-text-faint">{n.sub}</span>}
      </>
    );
    return linked ? (
      <button
        type="button"
        aria-label={`${n.label} — open the ${n.label} module`}
        onClick={go}
        className={cls}
      >
        {content}
      </button>
    ) : (
      <div className={cls}>{content}</div>
    );
  };

  // Aligned mode: a fixed grid of `columns` box tracks (minmax(0,1fr) — equal, shrinkable, never
  // overflowing) interleaved with auto-width arrow tracks. Rendering each block then its trailing
  // arrow fills the tracks left-to-right, so block i always lands in box-column i and lines up with
  // block i of any sibling diagram given the same `columns` — that shared coordinate is the point.
  if (columns) {
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className="grid items-center gap-x-1 rounded-md border border-border bg-surface p-4"
        style={{ gridTemplateColumns: Array(columns).fill('minmax(0,1fr)').join(' auto ') }}
      >
        {blocks.map((n, i) => (
          <Fragment key={n.id}>
            {renderBox(n)}
            {i < blocks.length - 1 && <FlowArrow />}
          </Fragment>
        ))}
      </div>
    );
  }

  // Default mode: a responsive flow that wraps. The first block leads; every other block travels
  // glued to the arrow that points into it as one non-wrapping unit, so a wrap breaks between blocks
  // but never strands an arrow at a row's end — each continued row begins with its incoming
  // connector, which reads as "the flow continues here" rather than a fresh, disconnected chain.
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center justify-center gap-x-1 gap-y-3 rounded-md border border-border bg-surface p-4"
    >
      {blocks.map((n, i) =>
        i === 0 ? (
          <Fragment key={n.id}>{renderBox(n)}</Fragment>
        ) : (
          <div key={n.id} className="flex min-w-0 items-center gap-x-1">
            <FlowArrow />
            {renderBox(n)}
          </div>
        )
      )}
    </div>
  );
}

/** A right-pointing flow arrow into the block that follows it — the connective tissue that keeps the
 *  chain reading left-to-right. Decorative: the order is conveyed by the block sequence. */
function FlowArrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="10"
      viewBox="0 0 18 10"
      className="shrink-0 self-center text-text-faint"
    >
      <path
        d="M1 5 H15 M11 1.5 L15.5 5 L11 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
