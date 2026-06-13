import { APP_NAME, APP_DESCRIPTION } from '@/config';
import { TRACKS, getModulesForTrack } from '@/registry';
import { useAppStore } from '@/store/appStore';

/** The landing view: the track/module map (brief §9, §14). Shown when no module is open. */
export function TrackOverview() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        <span className="text-signal glow-signal">{APP_NAME}</span>
      </h1>
      <p className="mt-3 max-w-2xl text-text-muted">{APP_DESCRIPTION}</p>

      <div className="mt-10 flex flex-col gap-4">
        {TRACKS.map((track) => {
          const modules = getModulesForTrack(track.id);
          return (
            <article key={track.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-medium">{track.title}</h2>
                <span
                  className={[
                    'shrink-0 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wide',
                    track.status === 'shipping'
                      ? 'bg-signal-dim/30 text-signal'
                      : 'border border-border text-text-faint',
                  ].join(' ')}
                >
                  {track.status === 'shipping' ? 'v1' : 'planned'}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-text-muted">{track.description}</p>

              {modules.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {modules.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => setActiveModule(m.id)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-text transition-colors hover:border-signal-dim hover:text-signal"
                      >
                        {m.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
