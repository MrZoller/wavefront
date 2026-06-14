/** "Go deeper" content for the Send a Message capstone. */
export function SendMessageExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">The whole chain, in one view</h3>
        <p>
          Everything from this track, wired together: each character becomes 8 bits, the bits group
          into constellation symbols, the symbols cross an AWGN channel, and the receiver slices
          each one to its nearest point and reassembles the text. This is a (simplified) modem.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Why text garbles all at once</h3>
        <p>
          Below a certain Eb/N0 the bit error rate climbs fast (the &ldquo;waterfall&rdquo;), so the
          message goes from perfect to unreadable over just a few dB. A single flipped bit can
          change a character entirely — which is exactly why real systems add error-correcting
          codes.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Rate vs. robustness, made tangible</h3>
        <p>
          16-QAM sends 4 bits per symbol versus QPSK&rsquo;s 2 — twice the throughput — but its
          points are packed tighter, so it garbles at a higher Eb/N0. That trade-off is the daily
          job of a link designer.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Uncoded and hard-decision, with perfect synchronization — coding, equalization, and sync are
        later tracks. All signals are synthetic.
      </section>
    </div>
  );
}
