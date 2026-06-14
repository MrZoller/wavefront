/** "Go deeper" content for the Multipath & Fading module. */
export function MultipathExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Many paths, one receiver</h3>
        <p>
          Signals bounce off buildings and terrain, so the receiver hears the direct ray plus
          delayed, weaker echoes. Summed, they form an FIR channel:{' '}
          <code>y = Σ gainₖ·x[n−delayₖ]</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Frequency-selective fading</h3>
        <p>
          At frequencies where the echo arrives half a cycle late, it cancels the direct ray — a
          deep notch — and where it&rsquo;s in phase, it adds. So the channel is <em>not</em> flat:
          it fades some frequencies and boosts others, depending on the delay. That&rsquo;s the
          response curve on top.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Inter-symbol interference</h3>
        <p>
          In time, the echo bleeds one symbol into the next, so the sampling instants no longer land
          on clean symbol values — the constellation blurs and the eye closes. Equalizers undo this;
          OFDM sidesteps it by making symbols long compared to the echo (plus the cyclic prefix).
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        A static two-ray channel (direct + one echo). Real channels add many time-varying taps. All
        signals are synthetic.
      </section>
    </div>
  );
}
