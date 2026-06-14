import { Term } from '@/components/Term';

/** "Go deeper" content for the Matched Filter module. */
export function MatchedFilterExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Correlate against the pulse you sent</h3>
        <p>
          To pull a known pulse out of noise, correlate the received signal against a copy of that
          pulse. This <em>matched filter</em> is provably the filter that maximizes{' '}
          <Term id="snr">signal-to-noise ratio</Term> at the sampling instant — it gathers all the
          pulse&rsquo;s energy while the noise, uncorrelated with the pulse, partly cancels.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Why root raised cosine</h3>
        <p>
          Put a <em>root</em>-raised-cosine at the transmitter and another at the receiver. Their
          cascade is a full raised cosine — so you get both the matched-filter SNR gain <em>and</em>{' '}
          the <Term id="nyquist">Nyquist</Term> no-ISI property, in one design.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Reading the eye</h3>
        <p>
          Overlay every symbol period and you get the <em>eye diagram</em>. The vertical opening at
          the sampling instant is the noise margin; the horizontal opening is timing tolerance. A
          healthy link has a wide-open eye — as Eb/N0 falls, the traces blur, the eye closes, and
          decisions start landing on the wrong side of zero.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        BPSK shown (a 1-D eye); the same matched filter and eye apply per I/Q rail for QPSK and QAM.
        Timing is assumed perfect here — recovering it is a later track. All signals are synthetic.
      </section>
    </div>
  );
}
