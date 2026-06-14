import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the rotating-phasor module (progressive disclosure, brief §3.4). */
export function PhasorExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">A complex sample is a 2D point</h3>
          <p>
            Forget &ldquo;imaginary numbers.&rdquo; A complex number is just a 2D vector:{' '}
            <span className="readout text-cyan">(I, Q)</span>. <strong>I</strong> (in-phase) is the
            horizontal part, <strong>Q</strong> (quadrature) is the vertical part. One IQ sample is
            one arrow on this plane.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">A signal spins it</h3>
          <p>
            A tone is that arrow rotating at a steady rate. Its angle advances linearly with time:
          </p>
          <p className="readout my-2 text-signal">x(t) = A · e^(j·2π·f·t)</p>
          <p>
            That&rsquo;s Euler&rsquo;s formula — the real part traces a cosine (the I plot), the
            imaginary part traces a sine (the Q plot). Frequency <span className="readout">f</span>{' '}
            is just how many full turns it makes per second.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why this matters for direction finding</h3>
          <p>
            Everything downstream is built on this. The <em>phase</em> of this arrow — the angle it
            points — is what differs between two antennas when a wave arrives at an angle. Measuring
            that phase difference is how you infer a bearing. It all starts with a spinning 2D
            point.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The audible tone is pitched into the hearing range so you can hear frequency change; the
          visual rotation runs slow enough to watch. Same idea, two speeds. All signals here are
          synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
