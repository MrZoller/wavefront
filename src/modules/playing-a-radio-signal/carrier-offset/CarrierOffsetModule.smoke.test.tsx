import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarrierOffsetModule } from './CarrierOffsetModule';

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
 * Carrier Offset auto-spins the constellation. It has no pause control by default, so under reduced
 * motion it freezes on a static frame and surfaces a spin opt-in — without changing normal mode.
 */
describe('CarrierOffsetModule reduced-motion opt-in', () => {
  it('auto-spins with no extra control when there is no motion preference', () => {
    setReducedMotion(false);
    render(<CarrierOffsetModule />);
    expect(screen.queryByRole('button', { name: /spin/i })).not.toBeInTheDocument();
  });

  it('starts frozen and exposes a play-spin opt-in when reduce motion is set', () => {
    setReducedMotion(true);
    render(<CarrierOffsetModule />);

    const optIn = screen.getByRole('button', { name: /play spin/i });
    expect(optIn).toBeInTheDocument();

    // Opting in flips the control to a pause affordance (the spin is now running).
    fireEvent.click(optIn);
    expect(screen.getByRole('button', { name: /pause spin/i })).toBeInTheDocument();
  });
});
