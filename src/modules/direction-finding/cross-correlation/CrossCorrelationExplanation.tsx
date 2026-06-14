import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the cross-correlation module. */
export function CrossCorrelationExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">A sliding dot product</h3>
          <p>
            Cross-correlation is just this loop: shift one signal by some lag, multiply it
            point-by-point against the other, and sum. That sum is one number per lag:
          </p>
          <p className="readout my-2 text-signal">c[ℓ] = Σ&thinsp;ref[n] · sig[n + ℓ]</p>
          <p>
            Drag the reference across the noisy record and watch the dot product. When the burst
            lines up with its buried copy, every term reinforces and the sum spikes.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why the peak finds the delay</h3>
          <p>
            Random noise is just as likely to be positive as negative, so off the alignment it
            mostly cancels in the sum. Only at the true lag does the signal correlate with itself.
            The lag of the peak <em>is</em> the delay between the two recordings.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Noise vs. the peak</h3>
          <p>
            Turn the noise up and the baseline gets ragged, but the peak survives well past the
            point where you could spot the burst by eye — correlation is a remarkably robust
            detector. Push it far enough and the peak finally drowns; that&rsquo;s the detection
            limit.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          This is the engine of TDOA: measure the same emitter at two receivers, correlate, and the
          peak lag gives the time-difference-of-arrival that Layer 2 turns into a hyperbola. All
          signals here are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
