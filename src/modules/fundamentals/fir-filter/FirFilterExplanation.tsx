import { Term } from '@/components/Term';

/** "Go deeper" content for the FIR Filtering module. */
export function FirFilterExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Filtering is a sliding dot product</h3>
        <p>
          An FIR filter slides a short list of weights along the signal and takes a weighted sum at
          each step — convolution, the same move as correlation. Feed in a single impulse and the
          output <em>is</em> the weights: the taps are the impulse response.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Two domains, one filter</h3>
        <p>
          The frequency response is the Fourier transform of the taps, and convolution in time is
          multiplication in frequency. So a low-pass is just taps whose transform is ~1 in the
          passband and ~0 in the stopband — here a windowed sinc.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">The length tradeoff</h3>
        <p>
          More taps buy a sharper transition and deeper stopband but cost more multiplies per
          sample. The window (Hann here) sets the sidelobe floor — the same resolution-vs-leakage
          tradeoff as the previous module.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Linear-phase, odd-length, unit-DC-gain design. The same `firLowpass` powers{' '}
        <Term id="decimation">decimation</Term> and the channelizer. All signals are synthetic.
      </section>
    </div>
  );
}
