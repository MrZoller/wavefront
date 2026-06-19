import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the DFT-as-a-change-of-basis module. */
export function DftBasisExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">A spectrum is a set of dot products</h3>
          <p>
            The DFT compares the signal against a bank of complex sinusoids, one per bin:{' '}
            <code>X[k] = Σ x[n]·e^{'{−j2πkn/N}'}</code>. Each output is the correlation of the
            signal with that one frequency — exactly the sliding dot product from cross-correlation,
            but with a pure tone as the reference.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Change of basis</h3>
          <p>
            The sinusoids form an orthogonal basis, so the DFT just re-expresses the same vector in
            new coordinates — like rotating axes. No information is created or lost (the inverse DFT
            rebuilds the signal exactly); you're only choosing to describe it by{' '}
            <em>frequency content</em>
            instead of <em>sample values</em>. Here, though, the bins double as a signal{' '}
            <em>editor</em> — a graphic equalizer: toggling one doesn&rsquo;t re-view a fixed
            signal, it defines a <em>new</em> one, so the time waveform updates to match.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          A real cosine at bin <em>k</em> shows up at bins <em>k</em> and <em>N−k</em> (its positive
          and negative frequency); only the lower half is shown here. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
