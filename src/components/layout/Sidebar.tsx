import { Wordmark } from '@/components/Wordmark';
import { APP_TAGLINE } from '@/config';
import { TRACKS, getTrackLayers, moduleStatusBadge } from '@/registry';
import { useAppStore } from '@/store/appStore';

/**
 * Navigation rail. Composed entirely from the track + module registry (brief §9) —
 * no hand-maintained routing table.
 */
export function Sidebar() {
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const glossaryOpen = useAppStore((s) => s.glossaryOpen);
  const openGlossary = useAppStore((s) => s.openGlossary);
  const aboutOpen = useAppStore((s) => s.aboutOpen);
  const openAbout = useAppStore((s) => s.openAbout);

  // The two reference destinations share one quiet style — muted until active, never the live accent
  // unless it's the current page (links/active nav are the sanctioned accent use).
  const refLinkClass = (active: boolean) =>
    [
      'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors',
      active
        ? 'bg-surface-raised text-signal'
        : 'text-text-muted hover:bg-surface-raised hover:text-text',
    ].join(' ');

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
          <h1 className="text-lg">
            <Wordmark />
          </h1>
          <p className="mt-0.5 text-xs text-text-muted">{APP_TAGLINE}</p>
        </button>
      </header>

      {/*
       * Anchor "track" as a visible concept: a quiet overline labels the persistent nav's top-level
       * units as tracks, so prose like "this track" / "a later track" resolves to something on screen
       * even when the landing is closed. The nav already names the group for assistive tech via its
       * aria-label, so this is a visual reinforcement (a plain label, not another heading). Structural
       * → neutral, never the live accent.
       */}
      <div>
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-faint">
          Tracks
        </p>
        <div className="flex flex-col gap-6">
          {TRACKS.map((track) => {
            const layers = getTrackLayers(track.id);
            // Layer subheaders only earn their place once a track has more than one stage.
            const showLayerNames = layers.length > 1;
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

                {layers.length === 0 ? (
                  <p className="px-1 text-xs text-text-faint">
                    {track.status === 'planned' ? 'Coming later.' : 'Modules in progress…'}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {layers.map((layer) => (
                      <div key={layer.layer} className="flex flex-col gap-0.5">
                        {showLayerNames && (
                          <h3 className="px-2 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-text-faint">
                            {layer.name}
                          </h3>
                        )}
                        <ul className="flex flex-col gap-0.5">
                          {layer.modules.map((m, i) => {
                            const isActive = m.id === activeModuleId;
                            // Internal status tokens (e.g. `stub`) are mapped to user-facing labels — a
                            // raw "STUB" reads as "unfinished" (CONTRIBUTING → no internal vocabulary).
                            const statusBadge = moduleStatusBadge(m.status);
                            return (
                              <li key={m.id}>
                                <button
                                  onClick={() => setActiveModule(m.id)}
                                  aria-current={isActive ? 'page' : undefined}
                                  className={[
                                    'flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                                    isActive
                                      ? 'bg-surface-raised text-signal'
                                      : 'text-text hover:bg-surface-raised hover:text-text',
                                  ].join(' ')}
                                >
                                  {/* Step within the layer — quiet directional cue. */}
                                  <span className="shrink-0 text-[11px] tabular-nums text-text-faint">
                                    {i + 1}
                                  </span>
                                  <span className="min-w-0 flex-1">{m.title}</span>
                                  {m.isCapstone ? (
                                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-signal">
                                      Capstone
                                    </span>
                                  ) : (
                                    statusBadge && (
                                      <span className="shrink-0 text-[10px] uppercase text-text-faint">
                                        {statusBadge}
                                      </span>
                                    )
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Reference companions — deliberate destinations, set apart from the track climb. */}
      <div className="mt-auto flex flex-col gap-0.5 border-t border-border pt-3">
        <button
          onClick={openGlossary}
          aria-current={glossaryOpen ? 'page' : undefined}
          className={refLinkClass(glossaryOpen)}
        >
          Glossary
        </button>
        <button
          onClick={openAbout}
          aria-current={aboutOpen ? 'page' : undefined}
          className={refLinkClass(aboutOpen)}
        >
          About
        </button>
      </div>
    </nav>
  );
}
