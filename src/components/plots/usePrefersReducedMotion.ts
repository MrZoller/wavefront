import { useEffect, useState } from 'react';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** Read the current preference, guarding environments without `matchMedia` (SSR, jsdom tests). */
function prefersReduced(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCE_QUERY).matches;
}

/**
 * Tracks the OS-level "reduce motion" accessibility setting (`prefers-reduced-motion: reduce`).
 *
 * The shared gate for auto-motion — the rotating phasor, the carrier-offset spin, the adaptive
 * equalizer's live run. Every auto-animating module seeds its *default* play-state (and its resting
 * frame) from this one hook: paused on a representative static frame when motion is reduced, full
 * motion otherwise. Routing them all through here keeps the behavior consistent and means a future
 * animated module inherits it by calling the same hook rather than re-deriving the media query. The
 * pause/play controls keep working in both cases — this only chooses the *default*.
 *
 * Updates live when the OS setting is toggled (no reload needed). Returns `false` wherever
 * `matchMedia` is unavailable, so non-browser environments simply get full motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReduced);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(REDUCE_QUERY);
    const sync = () => setReduced(mql.matches);
    sync(); // catch a toggle that landed between first render and effect commit
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  return reduced;
}
