import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Spread Spectrum module. */
export function SpreadSpectrumExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Trade bandwidth for stealth and robustness</h3>
          <p>
            Multiplying slow data by a fast pseudo-noise code spreads the signal across a much wider
            band at a much lower height — so low it can sit beneath the noise floor and look like
            noise to anyone without the code.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Processing gain</h3>
          <p>
            The receiver multiplies by the same code again. The wanted signal de-spreads back into a
            tall narrow peak while interference (uncorrelated with the code) stays spread out. The
            signal-to-interference improvement is the <em>processing gain</em>, 10·log₁₀(L) for a
            spreading factor L.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          DSSS shown (direct-sequence). Frequency-hopping (FHSS) achieves the same hiding by jumping
          carriers on a code-driven schedule. Textbook-level; all signals synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
