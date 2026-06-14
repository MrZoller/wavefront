import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Modulation Zoo. */
export function ModulationZooExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Every scheme has a fingerprint</h3>
          <p>
            The same bits, modulated different ways, look completely different — but only if you
            look in the right domain. Five views show the same signal at once: time-domain I/Q, the
            constellation, the spectrum, the eye, and the spectrogram.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Linear vs. constant-envelope</h3>
          <p>
            PSK and QAM are <em>linear</em>: bits map to points on the plane, so the constellation
            is the natural view. FSK and MSK are <em>constant-envelope</em>: the data lives in
            frequency, so the amplitude never changes — their &ldquo;constellation&rdquo; is just a
            ring, and you read them in the spectrum and spectrogram instead. That difference is
            itself the lesson.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">A/B at the same SNR</h3>
          <p>
            Put two schemes side by side and drop the SNR. Denser constellations (16-QAM) blur and
            mis-decide first; constant-envelope schemes shrug off amplitude noise but pay in
            bandwidth. That is the rate-vs-robustness-vs-bandwidth triangle every link lives inside.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          All schemes share one pluggable modulator interface and one channel, so the comparison is
          apples-to-apples. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
