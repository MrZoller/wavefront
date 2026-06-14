import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AXIS } from './axisLabel';
import { EyeDiagramPlot } from './EyeDiagramPlot';
import { PolarPlot } from './PolarPlot';
import { SpectrogramPlot } from './SpectrogramPlot';
import { SpectrumPlot } from './SpectrumPlot';
import { TimeSeriesPlot } from './TimeSeriesPlot';
import { XYPlot } from './XYPlot';

afterEach(cleanup);

/**
 * The structural guarantee behind the axis-label convention: the shared Cartesian plots require
 * `xLabel`/`yLabel` (a compile-time check, exercised by `npm run build`) and render them as a quiet
 * caption. These tests pin the runtime half — the captions actually appear, the aria-label is built
 * from them, and an empty quantity is rejected rather than rendered as a nameless axis.
 */
describe('shared Cartesian plots label both axes', () => {
  const cases = [
    {
      name: 'TimeSeriesPlot',
      element: (
        <TimeSeriesPlot
          series={[{ color: '#fff', samples: [0, 1, 0, -1] }]}
          yLabel={AXIS.amplitude}
          xLabel={AXIS.sample}
        />
      ),
      y: 'Amplitude',
      x: 'Sample',
    },
    {
      name: 'SpectrumPlot',
      element: (
        <SpectrumPlot
          data={[0, -10, -20]}
          yLabel={AXIS.magnitudeDb}
          xLabel={AXIS.normalizedFrequency}
        />
      ),
      y: 'Magnitude (dB)',
      x: 'Normalized frequency (cycles/sample)',
    },
    {
      name: 'XYPlot',
      element: (
        <XYPlot
          series={[{ x: [0, 1], y: [0, 1], color: '#fff' }]}
          xDomain={[0, 1]}
          yDomain={[0, 1]}
          yLabel={{ quantity: 'Bit error rate (log)' }}
          xLabel={{ quantity: 'Eb/N0', unit: 'dB' }}
        />
      ),
      y: 'Bit error rate (log)',
      x: 'Eb/N0 (dB)',
    },
    {
      name: 'SpectrogramPlot',
      element: (
        <SpectrogramPlot
          data={[
            [0, -10],
            [-5, -20],
          ]}
          xLabel={AXIS.time}
          yLabel={AXIS.normalizedFrequency}
        />
      ),
      y: 'Normalized frequency (cycles/sample)',
      x: 'Time',
    },
    {
      name: 'EyeDiagramPlot',
      element: (
        <EyeDiagramPlot
          samples={[0, 1, 0, -1, 0, 1, 0, -1]}
          sps={2}
          xLabel={{ quantity: 'Time (two symbols)' }}
          yLabel={AXIS.amplitude}
        />
      ),
      y: 'Amplitude',
      x: 'Time (two symbols)',
    },
  ];

  it.each(cases)('$name shows its y and x quantity captions', ({ element, y, x }) => {
    render(element);
    const figure = screen.getByRole('img').closest('figure');
    expect(figure).not.toBeNull();
    expect(within(figure!).getByText(y)).toBeInTheDocument();
    expect(within(figure!).getByText(x)).toBeInTheDocument();
  });

  it('builds the default aria-label as "{y} versus {x}", and an explicit ariaLabel overrides it', () => {
    const { rerender } = render(
      <SpectrumPlot data={[0, -10]} yLabel={AXIS.magnitudeDb} xLabel={AXIS.normalizedFrequency} />
    );
    expect(
      screen.getByRole('img', {
        name: 'Magnitude (dB) versus Normalized frequency (cycles/sample)',
      })
    ).toBeInTheDocument();

    rerender(
      <SpectrumPlot
        data={[0, -10]}
        yLabel={AXIS.magnitudeDb}
        xLabel={AXIS.normalizedFrequency}
        ariaLabel="QPSK spectrum"
      />
    );
    expect(screen.getByRole('img', { name: 'QPSK spectrum' })).toBeInTheDocument();
  });

  it('refuses to render a plot whose quantity label is empty', () => {
    // React surfaces a render-phase throw via console.error; silence it for a clean run.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <SpectrumPlot data={[0, -10]} yLabel={{ quantity: '' }} xLabel={AXIS.normalizedFrequency} />
      )
    ).toThrow(/quantity is required/i);
    spy.mockRestore();
  });
});

describe('intrinsic-axis plots name their axes by construction', () => {
  it('PolarPlot captions the angular (bearing) and radial (power) axes', () => {
    const { rerender } = render(<PolarPlot anglesRad={[-0.1, 0, 0.1]} values={[0.2, 1, 0.2]} />);
    expect(screen.getByText('Angle: Bearing (°)')).toBeInTheDocument();
    // No floorDb → radius is normalized power.
    expect(screen.getByText('Radius: Power (normalized)')).toBeInTheDocument();

    // With a dB floor the radial axis switches to a dB scale (the scale is the lesson).
    rerender(<PolarPlot anglesRad={[-0.1, 0, 0.1]} values={[0.2, 1, 0.2]} floorDb={-40} />);
    expect(screen.getByText('Radius: Power (dB)')).toBeInTheDocument();
  });
});
