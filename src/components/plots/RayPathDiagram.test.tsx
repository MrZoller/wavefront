import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RayPathDiagram } from './RayPathDiagram';

afterEach(cleanup);

describe('RayPathDiagram', () => {
  it('labels both axes and exposes the figure under its aria-label', () => {
    render(
      <RayPathDiagram
        spanKm={170}
        maxAltitudeKm={1.2}
        antennas={[{ groundKm: 20, heightKm: 0.05, color: '#fff', label: 'Tx' }]}
        ariaLabel="Curved earth with two antennas at their radio horizon"
        hint="vertical scale exaggerated"
      />
    );
    const canvas = screen.getByRole('img', {
      name: /curved earth with two antennas/i,
    });
    const figure = canvas.closest('figure');
    expect(figure).not.toBeNull();
    expect(figure!.querySelector('[data-axis="y"]')).toHaveTextContent('Altitude (km)');
    expect(figure!.querySelector('[data-axis="x"]')).toHaveTextContent('Ground distance (km)');
    expect(screen.getByText('vertical scale exaggerated')).toBeInTheDocument();
  });
});
