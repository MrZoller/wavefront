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
          <main className="h-full overflow-y-auto">
            {glossaryOpen ? <GlossaryPage /> : aboutOpen ? <AboutPage /> : <TrackOverview />}
          </main>
        )}
      </div>
    </div>
  );
}
