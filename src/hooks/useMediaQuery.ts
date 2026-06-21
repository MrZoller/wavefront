import { useEffect, useState } from 'react';

/**
 * Tailwind's `lg` breakpoint is 1024px; "compact" is everything below it — the viewport band where
 * the sidebar collapses into the overlay drawer. Kept as one constant so the JS that gives the open
 * drawer its modal behavior (focus trap, `inert` background, Escape) and the `lg:` CSS that drives
 * its layout share a single source and can't drift out of agreement.
 */
export const COMPACT_VIEWPORT_QUERY = '(max-width: 1023.98px)';

/** Read a media query now, guarding environments without `matchMedia` (SSR, jsdom tests → false). */
function read(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

/**
 * Track whether a CSS media query currently matches, updating live as the viewport crosses it.
 *
 * Modeled on {@link import('@/components/plots/usePrefersReducedMotion')} — same `matchMedia` guard
 * for non-browser environments and the same `addListener` fallback for browsers (Safari ≤13) whose
 * `MediaQueryList` predates `addEventListener`, so the hook never throws on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => read(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync(); // catch a change that landed between first render and effect commit
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync);
      return () => mql.removeEventListener('change', sync);
    }
    mql.addListener(sync);
    return () => mql.removeListener(sync);
  }, [query]);

  return matches;
}

/** True below Tailwind's `lg` breakpoint — the band where the nav is a collapsible overlay drawer. */
export function useIsCompactViewport(): boolean {
  return useMediaQuery(COMPACT_VIEWPORT_QUERY);
}
