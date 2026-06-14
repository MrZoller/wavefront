import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { getModule, TRACK_BY_ID } from '@/registry';
import { useAppStore } from '@/store/appStore';

/**
 * Hosts a single module: the interactive canvas dominates, with the explanation
 * in a calm collapsible side rail rather than a wall of text (brief §11).
 */
export function ModuleView({ moduleId }: { moduleId: string }) {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [drawerOpen, setDrawerOpen] = useState(true);
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
        <main className="min-w-0 flex-1 overflow-auto p-6">
          <Interactive />
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
