/** "Go deeper" content for the Noisy Channel module. */
export function NoisyChannelExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Every channel adds noise</h3>
        <p>
          Thermal noise in the receiver adds a small random complex number to every symbol —{' '}
          <em>additive white Gaussian noise</em>. Each ideal point becomes a fuzzy cloud; the spread
          is the noise standard deviation.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Eb/N0, the fair yardstick</h3>
        <p>
          Signal quality is energy per bit over noise density, <em>Eb/N0</em> (in dB). Measuring per{' '}
          <em>bit</em> (not per symbol) lets BPSK, QPSK, and 16-QAM be compared honestly — a 16-QAM
          symbol carries 4× the bits, so it needs more energy to hold the same per-bit margin.
        </p>
        <p className="readout my-2 text-signal">σ = √(N₀/2), N₀ = Eb / (Eb/N0), Eb = 1/k</p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Decide, then count</h3>
        <p>
          The receiver slices each received point to its <em>nearest</em> constellation point and
          reads off the bits. When a cloud spills across a decision boundary, you get an error. The{' '}
          <em>bit error rate</em> is the fraction of bits that come out wrong — it climbs steeply as
          Eb/N0 drops or the points crowd closer.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Hard-decision, symbol-by-symbol — no pulse shaping or coding yet (later modules). The noise
        is seeded, so the scene is reproducible. All signals are synthetic.
      </section>
    </div>
  );
}
