import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChannelCodingModule } from './channel-coding/ChannelCodingModule';
import { ChannelEstimationModule } from './channel-estimation/ChannelEstimationModule';
import { EqualizationModule } from './equalization/EqualizationModule';
import { SynchronizationModule } from './synchronization/SynchronizationModule';

afterEach(cleanup);

/**
 * Render smoke tests for the Coding & Equalization modules. The shared canvas plots draw nothing in
 * jsdom (getContext is stubbed to null), but the React tree — including the live `dsp/` computations
 * each module runs in `useMemo` — executes for real, so these catch runtime crashes and exercise the
 * key interactions (the worked-example flip, the "go deeper" LMS reveal, the sync-flavor toggle).
 */
describe('Coding & Equalization modules render and interact', () => {
  it('Channel Coding renders the BER curve and corrects a single flipped bit', () => {
    render(<ChannelCodingModule />);
    expect(screen.getByRole('img', { name: /bit error rate versus Eb\/N0/i })).toBeInTheDocument();
    // Default code is Hamming(7,4) — flipping one sent bit must be corrected.
    fireEvent.click(screen.getByRole('button', { name: /sent bit 0/i }));
    expect(screen.getByText(/repaired, data recovered/i)).toBeInTheDocument();
  });

  it('Channel Estimation renders the estimate-vs-truth overlay', () => {
    render(<ChannelEstimationModule />);
    expect(
      screen.getByRole('img', { name: /estimated channel frequency response/i })
    ).toBeInTheDocument();
  });

  it('Equalization renders both constellations and reveals the adaptive LMS view', () => {
    render(<EqualizationModule />);
    expect(screen.getByRole('img', { name: /smeared by multipath/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /re-clustered after equalization/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(
      screen.getByRole('img', { name: /tap weights converging toward the channel inverse/i })
    ).toBeInTheDocument();
  });

  it('Synchronization renders the loop diagram and toggles flavor', () => {
    render(<SynchronizationModule />);
    expect(screen.getByRole('img', { name: /tracking-loop block diagram/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Timing recovery' }));
    expect(screen.getByText('Interpolator')).toBeInTheDocument();
  });
});
