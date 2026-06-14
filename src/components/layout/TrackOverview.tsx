import { APP_NAME, APP_DESCRIPTION } from '@/config';
import { TRACKS, getTrackLayers } from '@/registry';
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
          const layers = getTrackLayers(track.id);
          // Layer subheaders only earn their place once a track has more than one stage.
          const showLayerNames = layers.length > 1;
          return (
            <article key={track.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-medium">{track.title}</h2>
                <span
                  className={[
                    'shrink-0 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wide',
                    track.status === 'shipping'
                      ? 'bg-signal-dim/30 text-signal'
                      : track.status === 'building'
                        ? 'border border-border text-cyan'
                        : 'border border-border text-text-faint',
                  ].join(' ')}
                >
                  {track.status === 'shipping'
                    ? 'v1'
                    : track.status === 'building'
                      ? 'building'
                      : 'planned'}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-text-muted">{track.description}</p>

              {layers.length > 0 && (
                <div className="mt-3 flex flex-col gap-3">
                  {layers.map((layer) => (
                    <div key={layer.layer} className="flex flex-col gap-1.5">
                      {showLayerNames && (
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-text-faint">
                          {layer.name}
                        </h3>
                      )}
                      <ul className="flex flex-wrap gap-2">
                        {layer.modules.map((m, i) => (
                          <li key={m.id}>
                            <button
                              onClick={() => setActiveModule(m.id)}
                              className={[
                                'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                                m.isCapstone
                                  ? 'border-signal-dim/60 text-signal hover:border-signal'
                                  : 'border-border text-text hover:border-signal-dim hover:text-signal',
                              ].join(' ')}
                            >
                              {/* Step within the layer — quiet directional cue, matching the sidebar. */}
                              <span className="tabular-nums text-text-faint">{i + 1}</span>
                              <span>{m.title}</span>
                              {m.isCapstone && (
                                <span className="text-[9px] uppercase tracking-wide text-signal">
                                  Capstone
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Scope note — calm and quiet, like a license line (no banner, no "Disclaimer"). */}
      <footer className="mt-10 border-t border-border pt-5">
        <p className="text-xs text-text-faint">
          Wavefront teaches signal processing using publicly available, textbook-level concepts and
          synthetic signals.
        </p>
      </footer>
    </div>
  );
}
