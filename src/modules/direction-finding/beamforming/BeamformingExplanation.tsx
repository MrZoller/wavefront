/** "Go deeper" content for the beamforming module. */
export function BeamformingExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Listening in a direction</h3>
        <p>
          A single antenna hears everything at once. Line up several and you can{' '}
          <em>add them up with the right delays</em> so signals from one bearing reinforce and
          everything else partially cancels — an electronically steerable &ldquo;ear.&rdquo;
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">The steering vector</h3>
        <p>
          A wave from bearing θ hits each element with a constant phase step{' '}
          <span className="readout">β = 2π·d·sin(θ)/λ</span>, so the array sees:
        </p>
        <p className="readout my-2 text-signal">a(θ) = [1, e^(jβ), e^(j2β), …, e^(j(N−1)β)]</p>
        <p>
          To steer at an angle, weight the elements by <span className="readout">a(θ)</span> and
          sum. The output power versus look angle is the gain pattern you see.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Mainlobe, sidelobes, resolution</h3>
        <p>
          The big lobe is where the array is looking; the little ones are sidelobes — leakage from
          other directions. Add elements and the mainlobe narrows: more aperture = finer angular
          resolution.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Grating lobes (ambiguity, again)</h3>
        <p>
          Push the spacing past <span className="readout">λ/2</span> and a second full-height lobe
          appears at another angle — a grating lobe. It&rsquo;s the same wrap-around ambiguity from
          the two-element case, now visible as a duplicate beam.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Next: super-resolution (MUSIC) sharpens past the mainlobe width to split sources the
        delay-and-sum beam smears together. All signals here are synthetic.
      </section>
    </div>
  );
}
