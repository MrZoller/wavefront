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
 * anchored on — the plots scroll *up to* the rail and stop, never under it. A **bottom fade** is the
 * scroll cue on both main scroll regions (the plot region and the explanation side-rail): partial
 * content fades into the background at the bottom edge, signaling "more below" (a forced/persistent
 * scrollbar was dropped — modern browsers auto-hide overlay scrollbars regardless). See CONTRIBUTING →
 * "Keep controls co-visible".
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

      {/* Desktop (`lg`): a two-pane row, each pane its own internal-scroll region (the original
          layout). Below `lg`: the columns would be too narrow, so the body becomes one vertical
          scroll — module content, then the explanation stacked beneath it — and the panes drop their
          independent scrollers to flow naturally into that single scroll. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-visible">
        <main className="flex min-w-0 flex-col lg:flex-1">
          {/* The pinned control-rail header: a top-anchored <ControlRail edge="top"> portals here, so
              the plots scroll up to its bottom edge and stop rather than under it. Zero-height (hidden)
              when a module has no top rail. */}
          <div ref={setHeader} className="relative z-10 empty:hidden" />
          <div className="wf-scroll p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <ControlRailSlotProvider top={header} bottom={footer}>
              <Interactive />
            </ControlRailSlotProvider>
          </div>
          {/* The scroll cue: partial plot content fades into the background at the bottom edge, so a
              tall module reads as "more below" without relying on a scrollbar. Also softens the rail's
              top edge. Deep enough that clipped content visibly disappears into it. Tied to the pane's
              internal scroll, so it's a desktop-only cue — on mobile the whole body scrolls instead. */}
          <div className="wf-scroll-fade pointer-events-none relative z-10 -mt-12 hidden h-12 bg-gradient-to-b from-transparent to-bg lg:block" />
          {/* The pinned control-rail footer: a bottom-anchored <ControlRail> portals here, so the plots
              scroll up to it and stop rather than under it. Zero-height (hidden) when a module has no
              bottom rail. */}
          <div ref={setFooter} className="relative z-10 empty:hidden" />
        </main>
        {Explanation && drawerOpen && (
          // The explanation side-rail is the app's second main scroll region, so it gets the same
          // bottom-fade cue as the plot region: the panel holds the scroller and an overlay fade, and
          // the plain text scrolls within. The fade is token-derived (→ surface, the panel's own bg),
          // so a long explanation fades out at the bottom ("more below") while a short one leaves bare
          // surface under the fade — invisible — so it never dims a non-scrolling panel. On mobile it
          // stacks under the module (full width, top border instead of left) and flows in the body's
          // single scroll, so the internal scroller + fade are desktop-only.
          <aside className="flex w-full shrink-0 flex-col border-t border-border bg-surface lg:w-80 lg:border-t-0 lg:border-l">
            <div className="px-5 py-5 text-sm leading-relaxed text-text-muted lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <Explanation />
            </div>
            <div className="wf-aside-fade pointer-events-none relative z-10 -mt-12 hidden h-12 bg-gradient-to-b from-transparent to-surface lg:block" />
          </aside>
        )}
      </div>
    </div>
  );
}
