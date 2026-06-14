import { Term } from '@/components/Term';

/** "Go deeper" content for the TDOA multilateration module. */
export function TdoaExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Time differences, not times</h3>
        <p>
          You usually don&rsquo;t know <em>when</em> the emitter transmitted, so absolute travel
          time is unknown. But the <em>difference</em> in arrival time between two receivers is
          measurable (that&rsquo;s the <Term id="cross-correlation">cross-correlation</Term> peak
          from Layer 0).
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">A time difference is a hyperbola</h3>
        <p>A fixed difference in arrival time means a fixed difference in distance:</p>
        <p className="readout my-2 text-signal">Δr = |x − R₁| − |x − R₂| = c · τ</p>
        <p>
          The set of points with a constant range difference to two foci <em>is</em> a hyperbola.
          One receiver pair pins you to that curve.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">How many receivers fix it</h3>
        <p>
          In 2D, three receivers give only <em>two</em> independent hyperbolas — and two curves can
          cross at <em>two</em> points, so a single extra intersection survives. A fourth receiver
          adds a third hyperbola that passes through only the true point, removing the ambiguity
          (this scene ships with four). We then recover the position by Gauss–Newton least squares
          on the range-difference equations — watch the fix track the emitter as you drag.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        How well the curves cross depends on receiver geometry — the next module makes that precise.
        All scenarios here are synthetic.
      </section>
    </div>
  );
}
