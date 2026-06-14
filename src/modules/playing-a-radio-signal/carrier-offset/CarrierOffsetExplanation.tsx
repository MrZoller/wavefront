/** "Go deeper" content for the Carrier Offset & Doppler module. */
export function CarrierOffsetExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">The receiver has its own clock</h3>
        <p>
          To pull baseband back out, the receiver multiplies by its <em>own</em> oscillator at the
          carrier frequency. If that oscillator is even slightly off, the leftover frequency rotates
          every symbol a little more than the last — the constellation spins.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Phase vs. frequency</h3>
        <p>
          A constant <em>phase</em> error rotates the constellation to a fixed angle (set spin to
          0). A <em>frequency</em> error keeps rotating it over time — a continuous spin. Doppler
          from a moving transmitter looks identical: relative motion is a frequency offset.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Why receivers must track</h3>
        <p>
          Spin the constellation far enough and points cross decision boundaries — instant errors.
          So receivers run a carrier-recovery loop (a PLL) that estimates the offset and
          counter-rotates, keeping the constellation upright. That loop is a later track.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        The spin rate here is slowed to be watchable; a real offset rotates far faster. All signals
        are synthetic.
      </section>
    </div>
  );
}
