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
}

/**
 * An interactive "boxes and wires" block diagram. Each block can route to the registry module that
 * simulates its function — so a hardware/orientation learner can click a block (mixer, ADC, filter…)
 * and land in the math behind it. Linked blocks read as pressable controls (accent, hover, keyboard
 * focus, pointer cursor) per the affordance language; blocks with no software counterpart yet (or a
 * not-built track) stay quiet and inert. Reusable as an app-wide orientation map — hence generic
 * over its blocks rather than baking in one chain.
 *
 * Layout: a flow of comfortable, fixed-width blocks that **wraps responsively** — one clean row when
 * the chain fits the container, breaking onto further rows when it doesn't. Each block keeps a
 * minimum readable width rather than shrinking to fit, so a long chain (the 8-box receive chain)
 * stays legible at any width. The right-pointing arrows between blocks carry the left-to-right
 * reading across a wrap (the standard block-diagram idiom — flow continues on the next row), so the
 * row can break without ever needing a horizontal scroll.
 */
export function BlockDiagram({ blocks, ariaLabel }: BlockDiagramProps) {
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  // A comfortable, scale-aligned box: wide enough that a two-line label ("Channelizer" / "split
  // band") never crowds, the same on every row. It holds this width and the chain wraps first; only
  // a container too narrow for even one box lets it shrink (min-w-0 + break-words) rather than ever
  // pushing a horizontal scrollbar.
  const base =
    'flex min-h-14 w-30 min-w-0 max-w-full flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2 text-center leading-tight break-words';
  const lit =
    'cursor-pointer border-signal-dim bg-surface text-signal transition-colors hover:border-signal hover:bg-surface-raised focus-visible:border-signal focus-visible:bg-surface-raised focus-visible:outline-none';
  const quiet = 'border-border bg-surface text-text-muted';

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center justify-center gap-x-1 gap-y-3 rounded-md border border-border bg-surface p-4"
    >
      {blocks.map((n, i) => {
        const linked = Boolean(n.moduleId && getModule(n.moduleId));
        const go = () => linked && n.moduleId && setActiveModule(n.moduleId);

        const content = (
          <>
            <span className="text-[13px] font-semibold">{n.label}</span>
            {n.sub && <span className="font-mono text-[10.5px] text-text-faint">{n.sub}</span>}
          </>
        );

        return (
          <Fragment key={n.id}>
            {linked ? (
              <button
                type="button"
                aria-label={`${n.label} — open the ${n.label} module`}
                onClick={go}
                className={`${base} ${lit}`}
              >
                {content}
              </button>
            ) : (
              <div className={`${base} ${quiet}`}>{content}</div>
            )}
            {i < blocks.length - 1 && <FlowArrow />}
          </Fragment>
        );
      })}
    </div>
  );
}

/** A right-pointing flow arrow between two blocks — the connective tissue that keeps the chain
 *  reading left-to-right across a wrap. Decorative: the order is conveyed by the block sequence. */
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
