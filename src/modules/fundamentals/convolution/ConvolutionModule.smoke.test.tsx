import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConvolutionModule } from './ConvolutionModule';

afterEach(cleanup);

/**
 * Render smoke test. The shared/bespoke canvases draw nothing in jsdom (getContext is stubbed to
 * null), but the React tree and the live `dsp/` convolution run for real — so this catches runtime
 * crashes and exercises the key interactions: the impulse-response editor, the slide scrubber, and
 * the preset payoff that swaps the impulse response.
 */
describe('Convolution & the Impulse Response module', () => {
  it('renders the editor, the sliding mechanism, and the output', () => {
    render(<ConvolutionModule />);
    expect(screen.getByRole('img', { name: /draggable impulse response/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /flipped impulse response sliding across the input/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /slide position/i })).toBeInTheDocument();
  });

  it('loads a preset impulse response and surfaces its cross-link', () => {
    render(<ConvolutionModule />);
    // Before any preset, the hand-drawn copy shows. (Asserts on a term-free phrase: rendered outside
    // ModuleView the teaching-page gloss exclusion is off, so "impulse response" splits the text node.)
    expect(screen.getByText(/Load a preset to see/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Matched filter' }));
    // The payoff blurb + the by-human-name cross-link appear.
    expect(screen.getByText(/that peak is a detection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Matched Filter/i })).toBeInTheDocument();
  });
});
