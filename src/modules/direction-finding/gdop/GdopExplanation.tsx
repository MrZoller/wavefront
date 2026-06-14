import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the GDOP heatmap module. */
export function GdopExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Same sensors, different geometry</h3>
          <p>
            Every receiver has the same timing accuracy, yet where you can locate an emitter
            <em> well</em> depends entirely on where the receivers sit relative to it. GDOP —
            Geometric Dilution of Precision — is the multiplier from measurement error to position
            error at each point.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The formula</h3>
          <p>
            Since TDOA only measures range <em>differences</em>, each row of the geometry matrix H
            is a <em>differenced</em> line-of-sight, <span className="readout">uᵢ − u₀</span>,
            relative to a reference receiver:
          </p>
          <p className="readout my-2 text-text">GDOP = √( trace( (HᵀH)⁻¹ ) )</p>
          <p>
            When the receivers surround the point from varied directions, HᵀH is well-conditioned
            and GDOP is small (green). When they bunch up or fall on a line, HᵀH becomes singular
            and GDOP explodes (red) — tiny timing errors swing the fix wildly.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">What to try</h3>
          <p>
            Spread the receivers into a wide ring and notice the broad green basin in the middle.
            Then drag them into a tight cluster, or onto a straight line, and watch the whole field
            go red. This is why station placement is half the battle in real geolocation.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          GDOP is geometry only — it doesn&rsquo;t depend on the emitter, just the receiver layout
          and where you&rsquo;re trying to locate. All scenarios here are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
