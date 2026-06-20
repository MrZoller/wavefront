import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhasorModule } from './PhasorModule';

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
 * The phasor is the front-door "this is alive" cue, so it auto-rotates by default — but that motion is
 * uncomfortable for motion-sensitive users. These pin the `prefers-reduced-motion` contract: motion
 * is opt-in under the preference, and the resting frame still teaches the concept.
 */
describe('PhasorModule honors prefers-reduced-motion', () => {
  it('auto-rotates on arrival when no motion preference is set (Pause control shown)', () => {
    setReducedMotion(false);
    render(<PhasorModule />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('starts paused on a representative static frame when reduce motion is set', () => {
    setReducedMotion(true);
    render(<PhasorModule />);

    // Paused → the control offers Resume (opt into motion), not Pause.
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();

    // The still is informative, not zeroed: a mid-rotation instant with I, Q and θ all populated
    // (θ = 45°, I = Q = cos/sin(π/4) ≈ 0.707).
    expect(screen.getByText('45°')).toBeInTheDocument();
    expect(screen.getAllByText('0.707')).toHaveLength(2);
  });
});
