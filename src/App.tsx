import { Sidebar } from '@/components/layout/Sidebar';
import { TrackOverview } from '@/components/layout/TrackOverview';
import { ModuleView } from '@/components/layout/ModuleView';
import { useAppStore } from '@/store/appStore';

export default function App() {
  const activeModuleId = useAppStore((s) => s.activeModuleId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-hidden">
        {activeModuleId ? (
          <ModuleView moduleId={activeModuleId} />
        ) : (
          // The overview owns its own vertical scroll so cards stay reachable on short
          // viewports and as the registry grows (ModuleView manages its own scrolling).
          <div className="h-full overflow-y-auto">
            <TrackOverview />
          </div>
        )}
      </div>
    </div>
  );
}
