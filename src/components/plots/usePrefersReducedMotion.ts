import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

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
    // Prefer the standard event API; fall back to the deprecated add/removeListener for browsers
    // (Safari ≤13) whose MediaQueryList predates addEventListener, so the hook never throws on mount.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync);
      return () => mql.removeEventListener('change', sync);
    }
    mql.addListener(sync);
    return () => mql.removeListener(sync);
  }, []);

  return reduced;
}

/**
 * Play-state for an auto-animating module that respects reduced motion. Like `useState<boolean>`, but
 * it starts at `!reduced` (paused when the user prefers reduced motion) and, if the preference is
 * switched on mid-session, flips to paused without a reload. It never force-resumes when the
 * preference is switched off, so a manual Pause/Resume choice is always preserved.
 *
 * Pass the value from `usePrefersReducedMotion()`. This uses React's "adjust state during render"
 * pattern (https://react.dev/learn/you-might-not-need-an-effect) to react to the change without an
 * effect — the canonical home for the convention, so every auto-animating module behaves the same.
 */
export function useReducedMotionPlayState(
  reduced: boolean
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [running, setRunning] = useState(!reduced);
  const [wasReduced, setWasReduced] = useState(reduced);
  if (reduced !== wasReduced) {
    setWasReduced(reduced);
    if (reduced) setRunning(false);
  }
  return [running, setRunning];
}
