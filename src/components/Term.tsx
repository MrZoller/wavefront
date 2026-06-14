import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
 * Inline jargon affordance (the `<Term>` add-on). Wraps a piece of UI text with a subtle dotted
 * underline; tapping or focusing it reveals a small popover with the term's expansion, a one-line
 * plain-language gloss, and an optional "Learn more →" link to the module that teaches it.
 *
 * Restraint is the whole game: define a term on its **first significant use per module**, never
 * inside a heading, and never self-referentially inside the module that teaches it (the popover
 * hides its own "Learn more" link in that case as a runtime safety net).
 *
 * Mobile-first: tap toggles the popover (hover/`title` tooltips don't exist on touch). Dismisses on
 * outside-tap or Esc, is keyboard-focusable, and is described via `aria-describedby` — never traps
 * focus.
 */
export function Term({ id, children }: TermProps) {
  const entry = getTerm(id);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

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
        aria-describedby={open ? popoverId : undefined}
        className="cursor-help text-cyan underline decoration-dotted decoration-cyan/70 underline-offset-[3px] transition-colors hover:text-signal hover:decoration-signal focus-visible:text-signal focus-visible:decoration-signal focus-visible:outline-none"
      >
        {label}
      </button>

      {open && (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 block w-64 rounded-md border border-border bg-surface-raised p-3 text-left shadow-lg"
        >
          <span className="block text-sm font-medium text-text">
            {entry.term}
            {entry.expansion && (
              <span className="ml-1.5 font-normal text-text-muted">— {entry.expansion}</span>
            )}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text-muted">{entry.gloss}</span>
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
