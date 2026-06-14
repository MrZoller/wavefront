import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Term } from './Term';
import { useAppStore } from '@/store/appStore';
// Registering modules lets the "Learn more →" link resolve a module title.
import '@/modules';

describe('<Term>', () => {
  beforeEach(() => useAppStore.setState({ activeModuleId: null }));
  afterEach(cleanup);

  it('renders the display term when no children are given', () => {
    render(<Term id="fft" />);
    expect(screen.getByRole('button', { name: /FFT/ })).toBeInTheDocument();
  });

  it('renders custom children over the display term', () => {
    render(<Term id="fft">the transform</Term>);
    expect(screen.getByRole('button', { name: 'the transform' })).toBeInTheDocument();
  });

  it('shows the expansion and gloss only after interaction', () => {
    render(<Term id="snr" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Signal-to-Noise Ratio');
    expect(tip).toHaveTextContent(/above the background noise/);
  });

  it('dismisses on Escape', () => {
    render(<Term id="snr" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('navigates to the teaching module via "Learn more"', () => {
    render(<Term id="fft" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: /Learn more/ }));
    expect(useAppStore.getState().activeModuleId).toBe('dft-basis');
  });

  it('hides the self-referential link when already in the teaching module', () => {
    useAppStore.setState({ activeModuleId: 'dft-basis' });
    render(<Term id="fft" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('button', { name: /Learn more/ })).not.toBeInTheDocument();
  });

  it('fails soft on an unknown id by rendering the raw text', () => {
    render(<Term id="not-a-real-term">plain</Term>);
    expect(screen.getByText('plain')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
