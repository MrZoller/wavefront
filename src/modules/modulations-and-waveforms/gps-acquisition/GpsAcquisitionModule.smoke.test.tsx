import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GpsAcquisitionModule } from './GpsAcquisitionModule';

afterEach(cleanup);

/**
 * Render smoke test for the GPS Acquisition synthesis module. Canvas plots draw nothing under jsdom
 * (getContext is null), but the React tree — including the live `dsp/` sub-noise signal, despreading
 * correlation, and the code-phase × Doppler acquisition search in `useMemo` — runs for real, so this
 * catches runtime crashes and exercises the draggable true-target handle.
 */
describe('GPS Acquisition module renders and interacts', () => {
  it('renders the correlation profile and the draggable acquisition surface', () => {
    render(<GpsAcquisitionModule />);
    expect(screen.getByRole('img', { name: /code-phase correlation/i })).toBeInTheDocument();
    expect(
      screen.getByRole('application', { name: /GPS acquisition surface/i })
    ).toBeInTheDocument();
  });

  it('moves the true code phase by nudging the surface handle with the arrow keys', () => {
    render(<GpsAcquisitionModule />);
    const surface = screen.getByRole('application', { name: /GPS acquisition surface/i });
    const codePhase = screen.getByRole('slider', { name: /True code phase/i }) as HTMLInputElement;
    const before = Number(codePhase.value);
    fireEvent.keyDown(surface, { key: 'ArrowRight' });
    expect(Number(codePhase.value)).toBe(before + 1);
  });
});
