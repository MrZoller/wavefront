import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Equalization module. */
export function EqualizationExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Multipath becomes ISI</h3>
          <p>
            A direct ray plus a delayed echo is a short convolution: each symbol leaks into the
            next. That inter-symbol interference is what the Multipath &amp; Fading module shows
            closing the eye. An equalizer&rsquo;s whole job is to undo that convolution.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Measure, then invert</h3>
          <p>
            You can&rsquo;t undo a channel you haven&rsquo;t measured. Pilots give you an estimate
            of the channel response (the Channel Estimation module); the equalizer is built from it.
            In the frequency domain that&rsquo;s just division: <em>Ŝ(f) = Y(f) / H(f)</em> — one
            complex divide per subcarrier, which is why this is nearly free inside OFDM.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Zero-forcing vs. MMSE</h3>
          <p>
            <strong>Zero-forcing</strong> inverts the channel exactly: <em>W = 1/H</em>. But where
            the channel has a deep notch, <em>1/H</em> is huge, so it amplifies the noise sitting
            there.
            <strong> MMSE</strong> uses <em>W = H*/(|H|² + 1/SNR)</em>: at high SNR it matches
            zero-forcing, and in the notches the <em>1/SNR</em> term reins the gain in — a little
            residual ISI in exchange for far less amplified noise.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Learning the inverse: LMS</h3>
          <p>
            The adaptive equalizer never forms <em>1/H</em> at all. It runs an FIR filter and,
            against known symbols, takes one gradient step per sample — <em>w ← w + μ·e·x*</em> — so
            the taps drift to whatever inverts the channel. That&rsquo;s gradient descent on error,
            the same engine under a learned (neural) equalizer.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          A synthetic two-tap channel, block-equalized in the frequency domain. The step size is
          fixed for a stable demo; real adaptive receivers schedule it. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
