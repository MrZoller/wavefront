import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the gain, clipping & AGC module. */
export function GainExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Fill the range</h3>
          <p>
            The converter&rsquo;s levels span a fixed range. An antenna signal can be microvolts —
            far too small to register — so an amplifier scales it up to use that range. Get it right
            and the signal spans most of the levels, every bit working. The whole game is
            positioning the signal between two failures.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Two ways to lose</h3>
          <p>
            <strong>Too little gain:</strong> the signal sits in the bottom few bits, so the
            quantization noise floor swamps it — you&rsquo;ve thrown away dynamic range you paid
            for.
            <strong> Too much gain:</strong> the peaks slam into the rails and clip. A clipped sine
            is no longer a sine — the flattened tops add odd harmonics and spurs that smear energy
            across the band, and once that detail is gone, no later stage recovers it.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why AGC exists</h3>
          <p>
            Signals fade and surge as antennas move and conditions change, so the sweet spot keeps
            shifting. Automatic gain control closes a loop — measure the level, nudge the gain,
            repeat — to keep the signal filling the range without clipping. <em>Headroom</em> is how
            much room is left before the rails.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The cost of too little gain is the same SNR that drives bit error rates in the
          noisy-channel module — here it&rsquo;s set by the converter, not the channel. All signals
          are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
