/** "Go deeper" content for the two-element interferometer module. */
export function InterferometerExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">From phase back to a bearing</h3>
        <p>
          Layer 0 turned a direction into a phase difference. An interferometer runs that backwards:
          measure <span className="readout">Δφ</span> between two antennas and solve for the
          bearing.
        </p>
        <p className="readout my-2 text-signal">θ = asin( Δφ · λ / (2π·d) )</p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">A single bearing is just a ray</h3>
        <p>
          One pair gives a <em>line of bearing</em>, not a position — the emitter is somewhere along
          that ray. Crossing rays from a second site is what fixes a location (Layer 2).
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Why several rays can appear</h3>
        <p>
          You only ever measure phase modulo 360°. With <span className="readout">d ≤ λ/2</span>{' '}
          that maps to one bearing. Widen the baseline and the same measured phase fits several true
          angles — every cyan ray is consistent with the measurement, and only one is the truth.
          That&rsquo;s the ambiguity a wide baseline buys (in exchange for finer accuracy).
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Real systems resolve this with multiple baselines or by adding elements — which is exactly
        the array in the beamforming module. All signals here are synthetic.
      </section>
    </div>
  );
}
