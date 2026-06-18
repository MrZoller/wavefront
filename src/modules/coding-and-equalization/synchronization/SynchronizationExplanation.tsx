import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Synchronization stub. */
export function SynchronizationExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Why it&rsquo;s a loop, not a fit</h3>
          <p>
            Coding and equalization here are block operations: take a chunk, estimate, correct.
            Synchronization is different — the offsets drift, so the receiver runs a closed feedback
            loop that continuously measures a residual error and nudges a correction until it locks,
            then keeps tracking.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Two things to lock</h3>
          <p>
            <strong>Carrier recovery</strong> aligns frequency and phase, so the constellation stops
            spinning. <strong>Timing recovery</strong> aligns the sampling instant, so each symbol
            is read at the matched filter&rsquo;s peak. Same loop shape, different detector.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          A deliberately light sketch — the carrier offset a loop corrects is interactive in the
          Carrier Offset &amp; Doppler module. Loop design (bandwidth, acquisition, phase-locked
          loops) is out of scope here. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
