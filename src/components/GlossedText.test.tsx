import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GlossedText, NoGloss } from './GlossedText';
import { Term } from './Term';
import { useAppStore } from '@/store/appStore';

describe('<GlossedText>', () => {
  beforeEach(() => useAppStore.setState({ activeModuleId: null }));
  afterEach(cleanup);

  it('marks a term automatically from plain copy', () => {
    render(
      <GlossedText>
        <p>the FFT turns time into frequency</p>
      </GlossedText>
    );
    expect(screen.getByRole('button', { name: 'FFT' })).toBeInTheDocument();
  });

  it('marks only the first use within a section (restraint)', () => {
    render(
      <GlossedText>
        <p>FFT and then FFT again</p>
      </GlossedText>
    );
    expect(screen.getAllByRole('button', { name: 'FFT' })).toHaveLength(1);
  });

  it('re-marks the same term in a new section', () => {
    render(
      <GlossedText>
        <div>
          <section>
            <p>FFT here</p>
          </section>
          <section>
            <p>FFT again</p>
          </section>
        </div>
      </GlossedText>
    );
    expect(screen.getAllByRole('button', { name: 'FFT' })).toHaveLength(2);
  });

  it('excludes the module that teaches the term', () => {
    useAppStore.setState({ activeModuleId: 'dft-basis' }); // teaches fft
    render(
      <GlossedText>
        <p>the FFT here</p>
      </GlossedText>
    );
    expect(screen.queryByRole('button', { name: 'FFT' })).not.toBeInTheDocument();
    expect(screen.getByText(/the FFT here/)).toBeInTheDocument();
  });

  it('never glosses inside a heading', () => {
    render(
      <GlossedText>
        <div>
          <h3>FFT</h3>
          <p>nothing here</p>
        </div>
      </GlossedText>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('suppresses marking inside <NoGloss>', () => {
    render(
      <GlossedText>
        <p>
          <NoGloss>FFT</NoGloss>
        </p>
      </GlossedText>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('passes a forced <Term> through and lets it satisfy first-use', () => {
    render(
      <GlossedText>
        <p>
          <Term id="fft">the transform</Term> then FFT
        </p>
      </GlossedText>
    );
    expect(screen.getByRole('button', { name: 'the transform' })).toBeInTheDocument();
    // The later plain "FFT" must NOT become a second marker.
    expect(screen.queryByRole('button', { name: 'FFT' })).not.toBeInTheDocument();
  });

  it('marks both halves of a slash pair', () => {
    render(
      <GlossedText>
        <p>use QPSK/QAM here</p>
      </GlossedText>
    );
    expect(screen.getByRole('button', { name: 'QPSK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QAM' })).toBeInTheDocument();
  });
});
