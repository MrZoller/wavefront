import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { getTerm } from '@/glossary/glossary';
import { getModule } from '@/registry';
import { useAppStore } from '@/store/appStore';

export interface TermProps {
  /** Glossary id — must resolve to an entry in `src/glossary/glossary.ts`. */
  id: string;
  /** Visible text. Defaults to the entry's display `term` when omitted (`<Term id="fft" />`). */
  children?: ReactNode;
}

/**
 * Inline jargon affordance (the `<Term>` add-on). Renders the visible text with a subtle dotted
 * underline; tapping or activating it reveals a small popover with the term's expansion, a one-line
 * plain-language gloss, and an optional "Learn more →" link to the module that teaches it.
 *
 * Accessibility: the definition is exposed to assistive tech via a persistent, visually hidden
 * description tied to the trigger with `aria-describedby`, so keyboard / screen-reader users hear it
 * on focus without having to open anything (and regardless of DOM toggling). The visible popover is
 * a plain disclosure — deliberately **not** `role="tooltip"`, since it can contain the interactive
 * "Learn more" control. Dismisses on outside-tap or Esc; never traps focus.
 *
 * Placement: the popover anchors below-left of the term and self-corrects on open — nudged
 * horizontally to stay within the viewport, and flipped above the term when there isn't room below.
 */
export function Term({ id, children }: TermProps) {
  const entry = getTerm(id);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const descId = useId();
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  // Keep the popover on-screen. It defaults to below-left of the term; on open, measure and (a) nudge
  // horizontally so it doesn't run off the side, and (b) flip above the term when it would overflow
  // the bottom. Bounds are the nearest scroll/clipping ancestor (the module body and rail are scroll
  // containers) intersected with the viewport — measuring against the window alone would miss a term
  // clipped at a scrollport edge that still has window space beyond it. Written imperatively so
  // there's no extra render before paint.
  useLayoutEffect(() => {
    const el = popoverRef.current;
    const trigger = wrapRef.current;
    if (!open || !el || !trigger) return;
    el.style.transform = '';
    el.style.top = '';
    el.style.bottom = '';
    el.style.marginTop = '';
    el.style.marginBottom = '';
    const margin = 8;

    // Nearest ancestor that clips its overflow → the box the popover must stay inside.
    let clip = trigger.parentElement;
    while (clip) {
      const o = getComputedStyle(clip);
      if (/(auto|scroll|hidden)/.test(o.overflowX + o.overflowY + o.overflow)) break;
      clip = clip.parentElement;
    }
    const cb = clip?.getBoundingClientRect();
    const left = Math.max(margin, (cb?.left ?? 0) + margin);
    const right = Math.min(window.innerWidth, cb?.right ?? window.innerWidth) - margin;
    const top = Math.max(margin, (cb?.top ?? 0) + margin);
    const bottom = Math.min(window.innerHeight, cb?.bottom ?? window.innerHeight) - margin;

    const rect = el.getBoundingClientRect();
    let dx = 0;
    if (rect.right > right) dx = right - rect.right;
    if (rect.left + dx < left) dx = left - rect.left;
    el.style.transform = `translateX(${dx}px)`;

    const tRect = trigger.getBoundingClientRect();
    if (rect.bottom > bottom && tRect.top - rect.height - margin > top) {
      el.style.top = 'auto';
      el.style.bottom = '100%';
      el.style.marginTop = '0';
      el.style.marginBottom = '6px';
    }
  }, [open]);

  // Dismiss on outside-tap / Esc while open. Listeners are only attached when needed.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // A dangling id is a bug the coverage test guards against; fail soft in the UI by rendering
  // the raw text so a typo never blanks the page.
  if (!entry) {
    if (import.meta.env.DEV) console.warn(`<Term>: unknown glossary id "${id}"`);
    return <>{children}</>;
  }

  const label = children ?? entry.term;
  // Don't offer a self-referential link into the very module the reader is already in.
  const linkModule =
    entry.moduleId && entry.moduleId !== activeModuleId ? getModule(entry.moduleId) : undefined;

  return (
    <span ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-describedby={descId}
        className="cursor-help text-cyan underline decoration-dotted decoration-cyan/70 underline-offset-[3px] transition-colors hover:text-signal hover:decoration-signal focus-visible:text-signal focus-visible:decoration-signal focus-visible:outline-none"
      >
        {label}
      </button>

      {/* Persistent, screen-reader-only definition: exposes the gloss on focus regardless of the
          popover's open state, so AT never has to rely on a toggled description being re-announced. */}
      <span id={descId} className="sr-only">
        {entry.term}
        {entry.expansion ? `, ${entry.expansion}` : ''}. {entry.gloss}
      </span>

      {open && (
        <span
          ref={popoverRef}
          className="absolute left-0 top-full z-20 mt-1.5 block w-64 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface-raised p-3 text-left shadow-lg"
        >
          {/* Visual presentation only — the canonical description for AT is the sr-only span above. */}
          <span aria-hidden="true" className="block text-sm font-medium text-text">
            {entry.term}
            {entry.expansion && (
              <span className="ml-1.5 font-normal text-text-muted">— {entry.expansion}</span>
            )}
          </span>
          <span aria-hidden="true" className="mt-1 block text-xs leading-relaxed text-text-muted">
            {entry.gloss}
          </span>
          {linkModule && (
            <button
              type="button"
              onClick={() => {
                setActiveModule(linkModule.id);
                setOpen(false);
              }}
              className="mt-2 block text-xs text-signal transition-colors hover:text-cyan"
            >
              Learn more → {linkModule.title}
            </button>
          )}
        </span>
      )}
    </span>
  );
}
