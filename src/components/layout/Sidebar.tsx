import { useEffect, useRef } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { usePrefersReducedMotion } from '@/components/plots/usePrefersReducedMotion';
import { APP_TAGLINE } from '@/config';
import { useIsCompactViewport } from '@/hooks/useMediaQuery';
import { TRACKS, getTrackLayers, moduleStatusBadge } from '@/registry';
import { useAppStore } from '@/store/appStore';

/**
 * Navigation rail. Composed entirely from the track + module registry (brief §9) —
 * no hand-maintained routing table.
 *
 * Responsive shell: at desktop width it's the persistent in-flow rail it has always been. Below the
 * `lg` breakpoint the fixed-width rail would crowd out the content, so it collapses to a hamburger-
 * toggled overlay drawer (`sidebarOpen`) that slides in over a dimming backdrop and slides back out
 * when a nav item, the backdrop, or Escape dismisses it — desktop layout is untouched.
 *
 * On that compact viewport the open drawer is a real modal for the keyboard, not just a visual one:
 * its background is marked `inert` (in {@link import('@/App')}) so Tab can't wander onto content
 * hidden behind the dim, focus moves into the drawer on open (so the advertised Escape dismiss works
 * immediately and Tab cycles within), and focus returns to the opener on close. While *closed* the
 * off-canvas drawer is itself `inert`, so its buttons never sit invisibly in the tab order ahead of
 * the visible hamburger. None of this engages at `lg`, where the rail is just an in-flow column.
 */
export function Sidebar() {
  const activeModuleId = useAppStore((s) => s.activeModuleId);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const glossaryOpen = useAppStore((s) => s.glossaryOpen);
  const openGlossary = useAppStore((s) => s.openGlossary);
  const aboutOpen = useAppStore((s) => s.aboutOpen);
  const openAbout = useAppStore((s) => s.openAbout);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const closeSidebar = useAppStore((s) => s.closeSidebar);
  const reducedMotion = usePrefersReducedMotion();
  const isCompact = useIsCompactViewport();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Modal behavior for the open drawer on a compact viewport. Bind Escape at the document level so it
  // fires no matter where focus sits — notably right after the hamburger (in App) opens the drawer,
  // before focus has moved in — which is the gap a nav-scoped handler would miss. Move focus into the
  // drawer (its close button) so Tab is trapped against the inert background and Escape lands, then
  // restore focus to whatever opened it when it closes, so the keyboard isn't dumped back at the top.
  useEffect(() => {
    if (!isCompact || !sidebarOpen) return;
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isCompact, sidebarOpen, closeSidebar]);

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
    <>
      {/* Backdrop — only on mobile, only while the drawer is open. Tapping it dismisses the drawer.
          Hidden at `lg`, where the rail is always in flow and there's nothing to dim. */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <nav
        aria-label="Tracks and modules"
        // While closed on a compact viewport the drawer is parked off-canvas — `inert` keeps its
        // buttons out of the tab order and the a11y tree (a CSS transform alone would leave them
        // focusable). At `lg` it's never inert: it's the visible, in-flow rail.
        inert={isCompact && !sidebarOpen}
        // Desktop (`lg`): the original in-flow, fixed-width rail. Below `lg`: a fixed overlay drawer
        // that slides in from the left when `sidebarOpen`, sitting above the content + backdrop.
        // `transform`-only animation respects reduced motion.
        className={[
          'flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-4 py-5',
          'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0',
          reducedMotion ? '' : 'transition-transform duration-200 ease-instrument',
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full pointer-events-none lg:pointer-events-auto',
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-2 px-1">
          <button
            onClick={() => setActiveModule(null)}
            className="min-w-0 text-left transition-opacity hover:opacity-80"
          >
            <h1 className="text-lg">
              <Wordmark />
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">{APP_TAGLINE}</p>
          </button>
          {/* Mobile-only dismiss — the in-drawer twin of the hamburger, and the focus target when the
              drawer opens (so Escape and Tab-trapping work at once). Hidden at `lg`. */}
          <button
            ref={closeButtonRef}
            onClick={closeSidebar}
            aria-label="Close navigation"
            className="-mr-1 shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-text lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
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
    </>
  );
}
