import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RangeDopplerModule } from './RangeDopplerModule';

afterEach(cleanup);

/**
 * Render smoke test for the Pulse Compression & Range-Doppler synthesis module. Canvas plots draw
 * nothing under jsdom (getContext is null), but the React tree — including the live `dsp/` echo,
 * pulse-compression, and range-Doppler computations in `useMemo` — runs for real, so this catches
 * runtime crashes and exercises the second-target toggle.
 */
describe('Pulse Compression & Range-Doppler module renders and interacts', () => {
  it('renders the compressed range profile and the range-Doppler map', () => {
    render(<RangeDopplerModule />);
    expect(
      screen.getByRole('img', { name: /pulse-compressed range profile/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /range-Doppler map/i })).toBeInTheDocument();
  });

  it('toggles a second target without crashing', () => {
    render(<RangeDopplerModule />);
    const toggle = screen.getByRole('button', { name: /second target/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});
