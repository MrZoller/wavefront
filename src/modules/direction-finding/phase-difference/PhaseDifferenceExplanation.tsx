import { Term } from '@/components/Term';

/** "Go deeper" content for the phase-difference module. */
export function PhaseDifferenceExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Two ears, one sound</h3>
        <p>
          You locate a sound because it reaches your two ears at slightly different times. Two
          antennas do the same with a radio wave: the wave hits the nearer sensor first and the
          farther one a moment later.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Extra path → phase</h3>
        <p>
          For a wave arriving at bearing <span className="readout">θ</span> (measured from
          broadside) on sensors a distance <span className="readout">d</span> apart, the far sensor
          sees an extra path length:
        </p>
        <p className="readout my-2 text-cyan">Δr = d · sin(θ)</p>
        <p>
          That delay, expressed as a phase of the <Term id="carrier">carrier</Term>, is:
        </p>
        <p className="readout my-2 text-signal">Δφ = 2π · d · sin(θ) / λ</p>
        <p>
          Watch sensor B&rsquo;s waveform slide relative to A as you change θ — that slide{' '}
          <em>is</em> Δφ.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">The d ≤ λ/2 rule</h3>
        <p>
          A phase only lives in (−180°, 180°]. Once the baseline exceeds half a wavelength, Δφ can
          exceed that range and wrap, so several bearings produce the <em>same</em> measured phase —
          ambiguous, like a wagon wheel spinning backwards. Keep{' '}
          <span className="readout">d ≤ λ/2</span> and every phase maps to exactly one bearing.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        This is the seed of <Term id="aoa">angle-of-arrival</Term> direction finding: invert Δφ to
        get θ. Layer 1 scales it up to a whole array. All signals here are synthetic.
      </section>
    </div>
  );
}
