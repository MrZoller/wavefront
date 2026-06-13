import { APP_NAME, APP_TAGLINE } from '@/config';
import { TRACKS, getModulesForTrack } from '@/registry';
import { useAppStore } from '@/store/appStore';

/**
 * Navigation rail. Composed entirely from the track + module registry (brief §9) —
 * no hand-maintained routing table.
 */
export function Sidebar() {
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  return (
    <nav
      aria-label="Tracks and modules"
      className="flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-4 py-5"
    >
      <header className="px-1">
        <button
          onClick={() => setActiveModule(null)}
          className="text-left transition-opacity hover:opacity-80"
        >
          <h1 className="text-lg font-semibold tracking-tight text-signal glow-signal">
            {APP_NAME}
          </h1>
          <p className="mt-0.5 text-xs text-text-muted">{APP_TAGLINE}</p>
        </button>
      </header>

      {TRACKS.map((track) => {
        const modules = getModulesForTrack(track.id);
        return (
          <section key={track.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {track.title}
              </h2>
              {track.status !== 'shipping' && (
                <span
                  className={[
                    'rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide',
                    track.status === 'building' ? 'text-cyan' : 'text-text-faint',
                  ].join(' ')}
                >
                  {track.status === 'building' ? 'Building' : 'Planned'}
                </span>
              )}
            </div>

            {modules.length === 0 ? (
              <p className="px-1 text-xs text-text-faint">
                {track.status === 'planned' ? 'Coming later.' : 'Modules in progress…'}
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {modules.map((m) => {
                  const isActive = m.id === activeModuleId;
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => setActiveModule(m.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={[
                          'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-surface-raised text-signal'
                            : 'text-text hover:bg-surface-raised hover:text-text',
                        ].join(' ')}
                      >
                        {m.title}
                        {m.status && m.status !== 'stable' && (
                          <span className="ml-1.5 text-[10px] uppercase text-text-faint">
                            {m.status}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </nav>
  );
}
