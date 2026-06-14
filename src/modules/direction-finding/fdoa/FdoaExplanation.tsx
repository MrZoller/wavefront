import { Term } from '@/components/Term';

/** "Go deeper" content for the FDOA (Doppler-difference) module. */
export function FdoaExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Motion bends frequency</h3>
        <p>
          A receiver sweeping through the field sees the emitter&rsquo;s carrier{' '}
          <Term id="doppler">Doppler-shifted</Term> by its motion <em>along the line of sight</em>:
          closing on the emitter shifts it up, opening away shifts it down, moving across it does
          nothing.
        </p>
        <p className="readout my-2 text-signal">Δf₍ᵢ₎ = (f₀ / c) · (vᵢ · ûᵢ)</p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Difference, not absolute</h3>
        <p>
          You don&rsquo;t know the emitter&rsquo;s true frequency, so a single shift is unusable.
          But the <em>difference</em> between two platforms&rsquo; shifts is measurable and depends
          only on geometry and motion:
        </p>
        <p className="readout my-2 text-signal">Δf = (f₀ / c) · (v₁·û₁ − v₂·û₂)</p>
        <p>
          This is the frequency twin of <Term id="tdoa">TDOA</Term>&rsquo;s time difference — same
          idea, a different observable.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">A constant Δf is an isodoppler curve</h3>
        <p>
          Fixing Δf carves out a curve of emitter positions — the highlighted line through the
          emitter. It isn&rsquo;t a tidy conic like a TDOA hyperbola, but it pins the emitter to a
          curve all the same; a second platform pair (or a TDOA line) crosses it to a fix. FDOA is
          what makes single-pass geolocation from a moving platform possible.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Positions are in km and velocities in km/s (platform speeds here are satellite-scale). All
        scenarios are synthetic.
      </section>
    </div>
  );
}
