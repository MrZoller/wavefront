import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Pulse Compression & Range-Doppler synthesis module. */
export function RangeDopplerExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Active sensing: echo delay is range</h3>
          <p>
            Everywhere else in this app the receiver listens to a signal someone else sent. Radar
            sends its own pulse and waits for the reflection. The echo comes back after the round
            trip, <em>t = 2R/c</em>, so the delay you measure <em>is</em> the range — time-of-flight
            turned into distance.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">
            Pulse compression = a chirp through a matched filter
          </h3>
          <p>
            A short pulse pins down range but carries little energy (a weak echo); a long pulse
            carries energy but smears range. The fix is to transmit a long chirp and matched-filter
            the echo: you get the energy of the long pulse <em>and</em> the resolution of a short
            one. The compressed spike is exactly the cross-correlation peak — the matched filter's
            output. That trick — long and gentle on transmit, sharp on receive — is pulse
            compression, and the resolution it buys scales with the time-bandwidth product, so a
            wider sweep gives a sharper, stronger peak.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Doppler from motion</h3>
          <p>
            A moving target returns the echo at a slightly shifted frequency — the same Doppler
            shift that powers the FDOA module. Send a train of pulses and take an FFT across them
            (the slow-time axis): the bin the energy lands in reads out the target's velocity.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The range-Doppler map</h3>
          <p>
            Stack the matched-filter output across pulses (fast-time → range) and FFT across the
            pulses (slow-time → velocity), and you get the range-Doppler map: a 2D surface with a
            bright blob at the target's (range, velocity). It is the radar cousin of the GDOP
            heatmap. Add a second target or drop the SNR and watch how the blob — and the noise
            floor — respond.
          </p>
        </section>

        <section className="rounded-md border border-signal-dim bg-surface-raised p-3 text-text">
          The &ldquo;aha&rdquo;: every piece here is something you already built — a chirp, a
          matched filter, an FFT. Radar is those three, aimed outward.
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Beyond this module</h3>
          <p>
            Real systems layer much more on top — CFAR detection (an adaptive threshold over the
            noise floor), the full ambiguity function, and synthetic-aperture (SAR) imaging. Those
            are whole topics of their own and are deliberately left as named directions, not built
            here.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Textbook pulse compression and Doppler processing only. All units are synthetic and
          illustrative — range in bins, Doppler in cycles per pulse — with no real waveforms or
          system parameters.
        </section>
      </div>
    </GlossedText>
  );
}
