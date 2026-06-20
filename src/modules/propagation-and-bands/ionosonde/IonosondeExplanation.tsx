import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Ionosonde & the Ionogram module. */
export function IonosondeExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Radar, pointed at the sky</h3>
          <p>
            An ionosonde is the radar echo trick aimed straight up. Transmit a pulse; if the
            ionosphere turns it back, it returns after a round trip, and the delay is a height —{' '}
            <span className="readout">h′ = c·t/2</span>, exactly the round-trip-delay ranging the
            Pulse Compression &amp; Range-Doppler scene uses for a target. It is a{' '}
            <strong>virtual</strong> height because it assumes the pulse travelled at the speed of
            light the whole way; the real reflection is a little lower, since the wave slows down in
            the plasma before it turns.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Higher frequencies reach deeper</h3>
          <p>
            A higher frequency needs denser plasma to turn it back, so it penetrates further into
            the layer before reflecting — and the echo takes longer to return. So as you raise the
            probe frequency, the virtual height climbs.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">
            The critical frequency: where the echo vanishes
          </h3>
          <p>
            Keep climbing and the virtual height runs away to infinity: above a cutoff — the{' '}
            <strong>critical frequency</strong> (foF2 for the F-layer) — the wave punches straight
            through and never comes back. Plotting virtual height against frequency draws the{' '}
            <strong>ionogram</strong>: a trace that rises, cusps up toward the cutoff, and then
            stops. Where the echo disappears <em>is</em> foF2 — the measurement the HF Skywave scene
            simply asserted.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">From foF2 to the MUF</h3>
          <p>
            Vertical sounding reads foF2 straight off the cutoff. The same secant law the HF Skywave
            &amp; the Ionosphere scene uses, <span className="readout">MUF = foF2 · sec φ</span>,
            turns that into the maximum usable frequency for an oblique path — a long hop strikes
            the layer more glancingly and so reflects higher frequencies. So the ionogram measures
            the number the skywave story takes as given.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          A deliberately conceptual sketch — a single layer at an illustrative height, stand-in
          critical frequencies, vertical sounding only. No ordinary/extraordinary ray splitting, no
          multi-layer profile, no true-height inversion, and no real ionograms or station data. All
          values synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
