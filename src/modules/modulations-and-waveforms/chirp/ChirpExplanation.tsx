import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Chirp / LFM module. */
export function ChirpExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">A tone that sweeps</h3>
          <p>
            A linear-FM &ldquo;chirp&rdquo; ramps its frequency steadily across the pulse. On a
            spectrogram that&rsquo;s an unmistakable diagonal line — the same shape a slide whistle
            would draw.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Pulse compression</h3>
          <p>
            Because the chirp spreads its energy over both time <em>and</em> a wide bandwidth, a
            receiver can matched-filter it down to a sharp, high-amplitude spike. That lets a radar
            transmit a long, low-power pulse (easy on the hardware) yet resolve targets as if it
            sent a very short, very strong one.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Textbook LFM only — a swept complex exponential and its spectrogram. All signals are
          synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
