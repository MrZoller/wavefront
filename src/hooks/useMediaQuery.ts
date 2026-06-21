import { useEffect, useState } from 'react';

/**
 * Tailwind's `lg` breakpoint — its default `64rem`. The drawer's layout is driven by `lg:` utilities
 * (`@media (min-width: 64rem)`), so the JS that gives the open drawer its modal behavior (focus trap,
 * `inert` background, Escape) must key off the *same* rem-based threshold. Naming it once keeps the
 * two in lockstep.
 */
export const LG_BREAKPOINT = '64rem';

/**
 * "Compact" is everything below `lg` — the viewport band where the sidebar is an overlay drawer.
 * Expressed as the exact negation of Tailwind's `(min-width: 64rem)`, in rem, on purpose: a px query
 * like `(max-width: 1023.98px)` would diverge from the rem-based CSS under a non-16px root font,
 * opening a band where the drawer is shown but its `inert`/focus/Escape behavior never engages.
 */
export const COMPACT_VIEWPORT_QUERY = `not all and (min-width: ${LG_BREAKPOINT})`;

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
