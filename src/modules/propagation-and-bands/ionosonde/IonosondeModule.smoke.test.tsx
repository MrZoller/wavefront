import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IonosondeModule } from './IonosondeModule';

afterEach(cleanup);

/**
 * Render smoke test for the Ionosonde & the Ionogram synthesis module. Canvas plots draw nothing
 * under jsdom (getContext is null), but the React tree — including the live `propagation/` reflection
 * model and ionogram assembly — runs for real, so this catches runtime crashes and exercises the
 * day/night critical-frequency toggle.
 */
describe('Ionosonde & the Ionogram module renders and interacts', () => {
  it('renders the single ping and the ionogram', () => {
    render(<IonosondeModule />);
    expect(screen.getByRole('img', { name: /sounding ping/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /ionogram/i })).toBeInTheDocument();
  });

  it('switches the critical frequency between day and night', () => {
    render(<IonosondeModule />);
    const day = screen.getByRole('button', { name: 'Day' });
    const night = screen.getByRole('button', { name: 'Night' });
    expect(day).toHaveAttribute('aria-pressed', 'true'); // defaults to the daytime layer
    fireEvent.click(night);
    expect(night).toHaveAttribute('aria-pressed', 'true');
    expect(day).toHaveAttribute('aria-pressed', 'false');
  });
});
