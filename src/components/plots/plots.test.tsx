import { cleanup, render, screen } from '@testing-library/react';
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

  it.each(cases)(
    '$name puts the y-label on the vertical axis and the x-label on the horizontal axis',
    ({ element, y, x }) => {
      render(element);
      const canvas = screen.getByRole('img');
      const figure = canvas.closest('figure');
      expect(figure).not.toBeNull();

      const yEl = figure!.querySelector('[data-axis="y"]');
      const xEl = figure!.querySelector('[data-axis="x"]');
      expect(yEl).not.toBeNull();
      expect(xEl).not.toBeNull();

      // The right text is wired to the right axis.
      expect(yEl).toHaveTextContent(y);
      expect(xEl).toHaveTextContent(x);

      // Placement is the whole point of this test: the y-label (the vertical quantity) renders
      // *before* the plot canvas — above the vertical axis — while the x-label renders *after* it,
      // along the bottom edge. The earlier bug dropped both into one bottom footer, which this
      // ordering check would have caught (the y-label would have followed the canvas, not preceded).
      expect(canvas.compareDocumentPosition(yEl!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
      expect(canvas.compareDocumentPosition(xEl!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // And the vertical quantity must not also sit in the bottom (x) caption.
      expect(xEl).not.toHaveTextContent(y);
    }
  );

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
