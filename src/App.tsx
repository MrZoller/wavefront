import { useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TrackOverview } from '@/components/layout/TrackOverview';
import { ModuleView } from '@/components/layout/ModuleView';
import { GlossaryPage } from '@/components/layout/GlossaryPage';
import { AboutPage } from '@/components/layout/AboutPage';
import { Wordmark } from '@/components/Wordmark';
import { useIsCompactViewport } from '@/hooks/useMediaQuery';
import { useAppStore } from '@/store/appStore';

export default function App() {
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const glossaryOpen = useAppStore((s) => s.glossaryOpen);
  const aboutOpen = useAppStore((s) => s.aboutOpen);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const isCompact = useIsCompactViewport();

  // The landing, Glossary, and About share one scroll container (the <main> below), so switching
  // among them swaps the child while the scroller keeps its position. That can open a destination
  // partway down — most visibly the footer "More about the project" link, clicked from the bottom of
  // a scrolled landing, which on a short viewport would reveal About scrolled past its heading and
  // hide the scope statement the link exists to surface. Reset to the top whenever the destination
  // changes so each page opens at its heading.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [activeModuleId, glossaryOpen, aboutOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      {/* Everything but the drawer. While the drawer is open on a compact viewport it's a modal, so
          this whole region (top bar included) goes `inert`: the dimmed-out content can't take focus
          or clicks, which traps Tab inside the drawer. Never inert at `lg`, where the drawer doesn't
          exist as an overlay and the layout is the original side-by-side. */}
      <div
        inert={isCompact && sidebarOpen}
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
      >
        {/* Mobile-only top bar: the hamburger that summons the collapsed nav drawer, plus the
            wordmark as a tap-home affordance. Hidden at `lg`, where the persistent sidebar carries
            both — so the desktop layout is exactly as before, with no bar above the content. */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <button
            onClick={toggleSidebar}
            aria-label="Open navigation"
            className="-ml-1 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M4 6h14M4 11h14M4 16h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={() => setActiveModule(null)}
            className="text-base transition-opacity hover:opacity-80"
          >
            <Wordmark />
          </button>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {activeModuleId ? (
            <ModuleView moduleId={activeModuleId} />
          ) : (
            // The landing and the reference pages own their own vertical scroll (parity with
            // ModuleView) and are the page's <main> landmark — which also disambiguates the landing
            // wordmark from the sidebar's (both are <h1>Wavefront</h1>).
            <main ref={mainRef} className="h-full overflow-y-auto">
              {glossaryOpen ? <GlossaryPage /> : aboutOpen ? <AboutPage /> : <TrackOverview />}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
