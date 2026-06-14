import { Term } from '@/components/Term';

/** "Go deeper" content for the OFDM module. */
export function OfdmExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Many slow carriers beat one fast one</h3>
        <p>
          A single high-rate carrier suffers badly from <Term id="multipath">multipath</Term>:
          echoes smear symbols together. OFDM splits the data across many narrow subcarriers, each
          running slowly enough that the channel looks <em>flat</em> across it — so equalization
          becomes one complex multiply per subcarrier.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">The IFFT is the modulator</h3>
        <p>
          Putting a symbol on subcarrier <em>k</em> is exactly placing it in{' '}
          <Term id="fft">FFT</Term> bin <em>k</em>; the inverse FFT sums all the subcarriers into
          the time-domain waveform in one shot. That&rsquo;s why OFDM is cheap: the modulator is
          just an IFFT.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">The cyclic prefix</h3>
        <p>
          Copying each symbol&rsquo;s tail onto its front makes the channel&rsquo;s linear
          convolution look <em>circular</em>, which the per-subcarrier equalizer can undo — as long
          as the echoes are shorter than the prefix. It costs a little rate to buy multipath
          immunity.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        The noise-like time waveform is the sum of many tones — OFDM&rsquo;s high peak-to-average
        ratio, a real design headache. All signals are synthetic.
      </section>
    </div>
  );
}
