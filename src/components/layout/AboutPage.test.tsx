import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

afterEach(cleanup);

/**
 * The About page exists to state the project's scope plainly, so this pins that the load-bearing
 * claims actually render: it's educational (not operational), all signals are synthetic, and it's an
 * independent personal project. If the copy ever drifts away from those, this fails.
 */
describe('AboutPage', () => {
  it('renders the heading and the load-bearing scope statements', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1, name: /About Wavefront/i })).toBeInTheDocument();
    expect(screen.getByText(/educational, not operational/i)).toBeInTheDocument();
    expect(screen.getByText(/synthetic and\s+illustrative/i)).toBeInTheDocument();
    expect(screen.getByText(/personal project/i)).toBeInTheDocument();
  });
});
