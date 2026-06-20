import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EqualizationModule } from './EqualizationModule';

/** Point window.matchMedia at a fixed reduced-motion answer for the duration of one render. */
function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduce') ? reduce : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Under reduced motion the adaptive (LMS) view opens paused on its converged frame — the informative
 * end state. The Play affordance must still mean something there: from the converged frame it replays
 * the run rather than no-opping (which would leave Reset as the only real opt-in).
 */
describe('EqualizationModule adaptive view under reduced motion', () => {
  it('opens paused on the converged frame, and Play replays from the start', () => {
    setReducedMotion(true);
    render(<EqualizationModule />);
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));

    // Rests on the converged end frame, paused with a Play affordance (not Pause).
    expect(screen.getByText(/converged/i)).toBeInTheDocument();
    const play = screen.getByRole('button', { name: 'Play' });

    // Play from the converged frame restarts the run instead of doing nothing.
    fireEvent.click(play);
    expect(screen.queryByText(/converged/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
});
