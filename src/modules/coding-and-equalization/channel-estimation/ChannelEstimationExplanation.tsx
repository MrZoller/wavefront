import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Channel Estimation module. */
export function ChannelEstimationExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Known in, unknown out</h3>
          <p>
            The receiver already knows the pilot symbols it was sent. Whatever comes back is those
            known symbols pushed through the unknown channel (plus noise). The difference between
            the two is the channel — that&rsquo;s what estimation extracts.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Least squares</h3>
          <p>
            Stack the pilots into a convolution matrix <em>A</em> and the received samples into{' '}
            <em>y</em>; the taps <em>ĥ</em> that best explain the data solve the normal equations{' '}
            <em>(AᴴA)ĥ = Aᴴy</em>. With no noise this is exact. Noise leaks in, but averaging over
            more pilots shrinks its variance — so the estimate tightens onto the truth as pilots
            grow.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The setup for everything after</h3>
          <p>
            This estimate is the input the equalizer inverts, and OFDM does exactly this per
            subcarrier (one complex gain each). It&rsquo;s also where learned receivers reach first:
            <em> learned channel estimation</em> and CSI-feedback compression replace this fit with
            a trained network.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          A synthetic two-tap channel estimated with four taps, so you can watch the spare taps fall
          to zero as the fit sharpens. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
