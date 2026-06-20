import { useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TrackOverview } from '@/components/layout/TrackOverview';
import { ModuleView } from '@/components/layout/ModuleView';
import { GlossaryPage } from '@/components/layout/GlossaryPage';
import { AboutPage } from '@/components/layout/AboutPage';
import { useAppStore } from '@/store/appStore';

export default function App() {
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const glossaryOpen = useAppStore((s) => s.glossaryOpen);
  const aboutOpen = useAppStore((s) => s.aboutOpen);

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
      <div className="min-w-0 flex-1 overflow-hidden">
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
  );
}
