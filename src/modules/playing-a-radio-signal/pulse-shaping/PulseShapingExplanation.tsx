/** "Go deeper" content for the Pulse Shaping module. */
export function PulseShapingExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">From instants to a waveform</h3>
        <p>
          Symbols are a list of numbers; a radio emits a continuous signal. Pulse shaping bridges
          the two: each symbol scales a <em>pulse</em>, and the pulses add up into the transmitted
          waveform. A naive square pulse would splatter energy across a huge bandwidth — so we
          shape.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">The Nyquist no-ISI trick</h3>
        <p>
          The <em>raised-cosine</em> pulse is 1 at its own center and exactly 0 at every other
          symbol&rsquo;s sampling instant. So when you sample the summed waveform at the right
          times, each symbol&rsquo;s neighbors contribute nothing — zero inter-symbol interference,
          even though the pulses overlap everywhere in between.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">β: bandwidth vs. ringing</h3>
        <p>
          The roll-off β sets the excess bandwidth, (1+β)/2 of the symbol rate per side. Small β is
          spectrally tight but rings for many symbols (and is touchy about timing); large β is
          gentle and forgiving but wider. Real links pick a compromise (0.2–0.35 is common).
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Split the raised cosine into a root-raised-cosine at the transmitter and another at the
        receiver and you also get the maximum-SNR matched filter — the next module. All signals are
        synthetic.
      </section>
    </div>
  );
}
