/** "Go deeper" content for the AoA cross-fixing module. */
export function AoaCrossFixExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">One bearing is a ray, two are a fix</h3>
        <p>
          Each DF site measures a direction — a <em>line of bearing</em>. A single LOB only says
          &ldquo;somewhere along this ray.&rdquo; Two LOBs cross at a point: that intersection is
          the fix. A third tightens it.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Error in, error region out</h3>
        <p>
          Real bearings have an uncertainty <span className="readout">σθ</span>. A small angular
          error fans out into a larger <em>cross-range</em> error the farther away the emitter is —
          so the fix isn&rsquo;t a point but an ellipse. We get it by weighting each LOB by{' '}
          <span className="readout">1/(rᵢ·σθ)²</span> and inverting the information matrix.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Geometry matters</h3>
        <p>
          Two bearings crossing near 90° give a tight, round region. As the crossing flattens —
          sites on the same side, or a distant emitter — the ellipse stretches into a long cigar.
          That sensitivity to geometry is the whole story of the GDOP module.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        This assumes a straight line-of-bearing (true at VHF and up). HF skywave bends it — see the
        propagation cross-link (Track E). All scenarios here are synthetic.
      </section>
    </div>
  );
}
