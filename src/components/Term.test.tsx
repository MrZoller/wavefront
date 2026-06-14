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

  it('exposes the definition to assistive tech without opening (aria-describedby)', () => {
    render(<Term id="snr" />);
    const trigger = screen.getByRole('button');
    const descId = trigger.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    const desc = document.getElementById(descId!);
    expect(desc).toHaveTextContent('Signal-to-Noise Ratio');
    expect(desc).toHaveTextContent(/above the background noise/);
  });

  it('opens a disclosure with a "Learn more" action on click, and Escape dismisses it', () => {
    render(<Term id="snr" />);
    // snr is taught by noisy-channel; with no active module the "Learn more" link shows when open.
    expect(screen.queryByRole('button', { name: /Learn more/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'SNR' }));
    expect(screen.getByRole('button', { name: /Learn more/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: /Learn more/ })).not.toBeInTheDocument();
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
