import { useState } from 'react';
import { ControlRailSlotProvider } from '@/components/ControlRail';
import { GlossedText } from '@/components/GlossedText';
import { getModule, TRACK_BY_ID } from '@/registry';
import { useAppStore } from '@/store/appStore';

/**
 * Hosts a single module: the interactive canvas dominates, with the explanation
 * in a calm collapsible side rail rather than a wall of text (brief §11).
 *
 * The module column is laid out as a **scrolling plot region between a pinned header and footer**: the
 * plots scroll in `.wf-scroll`, and a module's primary controls portal into the header or footer via
 * `<ControlRail edge>` so they stay co-visible with the plot they drive whichever edge they're
 * anchored on — the plots scroll *up to* the rail and stop, never under it. A **bottom fade** on the
 * scroll region is the "more below" cue (a forced/persistent scrollbar was dropped — modern browsers
 * auto-hide overlay scrollbars regardless). See CONTRIBUTING → "Keep controls co-visible".
 */
export function ModuleView({ moduleId }: { moduleId: string }) {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  const mod = getModule(moduleId);

  if (!mod) {
    return (
      <div className="p-8 text-text-muted">
        Unknown module: <span className="readout">{moduleId}</span>
      </div>
    );
  }

  const Interactive = mod.component;
  const Explanation = mod.explanation;
  const track = TRACK_BY_ID[mod.track];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <button
            onClick={() => setActiveModule(null)}
            className="text-xs text-text-muted transition-colors hover:text-signal"
          >
            ← {track.title}
          </button>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{mod.title}</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-text-muted">
            <GlossedText>{mod.oneLineIntuition}</GlossedText>
          </p>
        </div>
        {Explanation && (
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-signal-dim hover:text-signal"
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? 'Hide' : 'Go deeper'}
          </button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {/* The pinned control-rail header: a top-anchored <ControlRail edge="top"> portals here, so
              the plots scroll up to its bottom edge and stop rather than under it. Zero-height (hidden)
              when a module has no top rail. */}
          <div ref={setHeader} className="relative z-10 empty:hidden" />
          <div className="wf-scroll min-h-0 flex-1 overflow-y-auto p-6">
            <ControlRailSlotProvider top={header} bottom={footer}>
              <Interactive />
            </ControlRailSlotProvider>
          </div>
          {/* The scroll cue: partial plot content fades into the background at the bottom edge, so a
              tall module reads as "more below" without relying on a scrollbar. Also softens the rail's
              top edge. Deep enough that clipped content visibly disappears into it. */}
          <div className="wf-scroll-fade pointer-events-none relative z-10 -mt-12 h-12 bg-gradient-to-b from-transparent to-bg" />
          {/* The pinned control-rail footer: a bottom-anchored <ControlRail> portals here, so the plots
              scroll up to it and stop rather than under it. Zero-height (hidden) when a module has no
              bottom rail. */}
          <div ref={setFooter} className="relative z-10 empty:hidden" />
        </main>
        {Explanation && drawerOpen && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface px-5 py-5 text-sm leading-relaxed text-text-muted">
            <Explanation />
          </aside>
        )}
      </div>
    </div>
  );
}
