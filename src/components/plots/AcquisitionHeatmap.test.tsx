import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AcquisitionHeatmap } from './AcquisitionHeatmap';

afterEach(cleanup);

// A small synthetic surface: data[col][row], 6 code-phase columns × 8 Doppler rows. Canvas draws
// nothing under jsdom (getContext is null), but the React tree, axis labels, role, and the keyboard
// handler all run for real.
const surface = Array.from({ length: 6 }, (_, c) => Array.from({ length: 8 }, (_, r) => c + r));
const axes = { xLabel: { quantity: 'Code phase', unit: 'chips' }, yLabel: { quantity: 'Doppler' } };

describe('AcquisitionHeatmap', () => {
  it('labels both axes and is a plain image when no marker is given (radar uses it this way)', () => {
    render(<AcquisitionHeatmap data={surface} {...axes} />);
    const canvas = screen.getByRole('img', { name: /Doppler versus Code phase \(chips\)/i });
    const figure = canvas.closest('figure')!;
    expect(figure.querySelector('[data-axis="y"]')).toHaveTextContent('Doppler');
    expect(figure.querySelector('[data-axis="x"]')).toHaveTextContent('Code phase (chips)');
  });

  it('becomes an operable application with a draggable handle when given a marker', () => {
    render(
      <AcquisitionHeatmap
        data={surface}
        {...axes}
        marker={{ col: 2, row: 4 }}
        onMarkerDrag={() => {}}
        markerLabel="true code phase and Doppler"
      />
    );
    expect(
      screen.getByRole('application', { name: /Drag the true code phase and Doppler handle/i })
    ).toBeInTheDocument();
  });

  it('nudges the marker by one cell per arrow key, clamped to the surface', () => {
    const onMarkerDrag = vi.fn();
    render(
      <AcquisitionHeatmap
        data={surface}
        {...axes}
        marker={{ col: 0, row: 7 }}
        onMarkerDrag={onMarkerDrag}
      />
    );
    const canvas = screen.getByRole('application');

    fireEvent.keyDown(canvas, { key: 'ArrowRight' });
    expect(onMarkerDrag).toHaveBeenLastCalledWith(1, 7);

    fireEvent.keyDown(canvas, { key: 'ArrowDown' });
    expect(onMarkerDrag).toHaveBeenLastCalledWith(0, 6);

    // At the edges it clamps rather than running off the surface (col 0 left, row 7 = top up).
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' });
    expect(onMarkerDrag).toHaveBeenLastCalledWith(0, 7);
    fireEvent.keyDown(canvas, { key: 'ArrowUp' });
    expect(onMarkerDrag).toHaveBeenLastCalledWith(0, 7);
  });

  it('leaves non-arrow keys alone', () => {
    const onMarkerDrag = vi.fn();
    render(
      <AcquisitionHeatmap
        data={surface}
        {...axes}
        marker={{ col: 2, row: 2 }}
        onMarkerDrag={onMarkerDrag}
      />
    );
    fireEvent.keyDown(screen.getByRole('application'), { key: 'Enter' });
    expect(onMarkerDrag).not.toHaveBeenCalled();
  });
});
