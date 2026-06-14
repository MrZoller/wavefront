import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the SDR architectures module. */
export function SdrExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">One choice: where to digitize</h3>
          <p>
            Every receiver does the same jobs — select a band, shift it down, sample it, process it.
            What separates the architectures is <em>how early</em> the ADC sits, i.e. how much
            happens in analog hardware versus in software.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The three shapes</h3>
          <p>
            <strong>Superheterodyne</strong> mixes down to a fixed intermediate frequency and
            filters hard there before a (slower) ADC — superb selectivity, lots of analog.{' '}
            <strong>Zero-IF</strong> mixes straight to baseband so a modest ADC suffices — compact
            and cheap, at the cost of DC-offset and IQ-balance quirks.{' '}
            <strong>Direct sampling</strong> digitizes the antenna almost immediately and does
            everything else in code — the purest SDR, limited only by how fast the converter runs.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">That&rsquo;s the whole idea</h3>
          <p>
            Software-defined radio is just &ldquo;move the ADC toward the antenna and do the rest in
            software.&rdquo; A $30 direct-sampling dongle and a $2,000 lab transceiver run the{' '}
            <em>same</em> downconversion, filtering, and demodulation you&rsquo;ve been dragging —
            only the boundary between metal and math moves.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The named SDRs (RTL-SDR, Airspy, HackRF, USRP) are real products, mapped descriptively to
          their dominant architecture; specifics vary by model. All signals in the app are
          synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
