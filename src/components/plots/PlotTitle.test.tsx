import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlotTitle } from './PlotTitle';

afterEach(cleanup);

/**
 * The regression this guards: a plot's title and its top-left y-axis label sit in the same corner,
 * so if they share styling they fuse into one two-line caption. {@link PlotTitle} exists to make the
 * title a *heading* role, distinct from the quiet monospace `readout` treatment the axis labels use.
 */
describe('PlotTitle', () => {
  it('renders its children as the plot heading', () => {
    render(
      <PlotTitle>
        Sensor A <span>— reference</span>
      </PlotTitle>
    );
    expect(screen.getByText(/Sensor A/)).toBeInTheDocument();
    expect(screen.getByText(/— reference/)).toBeInTheDocument();
  });

  it('uses the proportional heading treatment, not the monospace `readout` of the axis labels', () => {
    render(<PlotTitle>Amplitude over time</PlotTitle>);
    const el = screen.getByText('Amplitude over time');
    // `readout` is the mono axis-label/numeric face; the title must not borrow it, or it reads as a
    // second axis caption rather than the plot's name.
    expect(el).not.toHaveClass('readout');
    expect(el).toHaveClass('font-medium');
  });

  it('merges extra classes after the base treatment', () => {
    render(<PlotTitle className="text-signal">tuned</PlotTitle>);
    const el = screen.getByText('tuned');
    expect(el).toHaveClass('font-medium');
    expect(el).toHaveClass('text-signal');
  });
});
