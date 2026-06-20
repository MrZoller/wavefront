import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useAppStore } from '@/store/appStore';
// The sidebar is composed from the registry, so the modules must be registered for App to render.
import '@/modules';

afterEach(() => {
  cleanup();
  act(() => useAppStore.getState().setActiveModule(null)); // back to the landing for the next test
});

/**
 * The landing, Glossary, and About share one <main> scroll container, so switching among them swaps
 * the child without resetting the scroller — which can open a destination scrolled partway down (the
 * footer "About" link, clicked from the bottom of the landing, is the case that surfaced it). The
 * shell resets the scroller to the top on every destination change; this guards that wiring stays.
 */
describe('App shell resets the shared scroller on destination change', () => {
  it('scrolls <main> back to the top when the destination changes', () => {
    const scrollTo = vi.fn();
    // jsdom doesn't implement Element.scrollTo; provide a spy so we can assert the reset fires.
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: scrollTo,
      writable: true,
      configurable: true,
    });

    render(<App />);
    scrollTo.mockClear(); // ignore the initial mount's reset

    act(() => useAppStore.getState().openAbout());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
