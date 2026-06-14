import { Term } from '@/components/Term';

/** "Go deeper" content for the modulation-classification capstone. */
export function ClassifierExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Which scheme is this?</h3>
        <p>
          Given an unknown signal, a receiver often has to <em>identify</em> the modulation before
          it can demodulate. The trick is to summarize the signal with a few features that differ
          sharply between schemes, then compare against known fingerprints.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Three telling features</h3>
        <p>
          <strong>Envelope variation</strong> is near zero for{' '}
          <Term id="constant-envelope">constant-envelope</Term> FSK/MSK and large for
          amplitude-bearing 16-QAM.{' '}
          <strong>
            <Term id="q-rail">Q-rail</Term> fraction
          </strong>{' '}
          is ~0 for real-only BPSK and ~½ for QPSK/QAM. <strong>Spectral spread</strong> separates a
          compact scheme (MSK) from a wide one (FSK). Three numbers place each scheme in a distinct
          corner.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">From features to learning</h3>
        <p>
          This nearest-prototype classifier is the hand-built version of what a neural net (e.g.{' '}
          <Term id="radioml">RadioML</Term>) discovers on its own: the network learns which features
          carry modulation identity. Same idea, learned instead of coded.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        A textbook feature classifier over the schemes in this track — not a production recognizer.
        All signals are synthetic.
      </section>
    </div>
  );
}
