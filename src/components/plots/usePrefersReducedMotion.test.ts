import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** A controllable matchMedia whose `matches` can be flipped to fire a `change` event at listeners. */
function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: (cb: () => void) => listeners.add(cb),
    removeListener: (cb: () => void) => listeners.delete(cb),
    dispatchEvent: () => false,
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((cb) => cb());
    },
  };
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe('usePrefersReducedMotion', () => {
  it('is false when the user expresses no motion preference', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('is true when "reduce motion" is set', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates live when the OS setting is toggled', () => {
    const { set } = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => set(true));
    expect(result.current).toBe(true);

    act(() => set(false));
    expect(result.current).toBe(false);
  });

  it('uses the legacy addListener API when addEventListener is missing', () => {
    // Older browsers (Safari ≤13) expose MediaQueryList.add/removeListener but not addEventListener.
    let matches = false;
    const listeners = new Set<() => void>();
    const mql = {
      get matches() {
        return matches;
      },
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: (cb: () => void) => listeners.add(cb),
      removeListener: (cb: () => void) => listeners.delete(cb),
      dispatchEvent: () => false,
    };
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });

  it('falls back to full motion where matchMedia is unavailable', () => {
    // @ts-expect-error — simulate a non-browser / unsupported environment
    window.matchMedia = undefined;
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
