import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the quantization & bit-depth module. */
export function QuantizationExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Where samples are born</h3>
          <p>
            Every other track consumes IQ samples as if they fell from the sky. They don&rsquo;t —
            an ADC makes them. It can only output discrete levels, 2<sup>N</sup> of them for N bits,
            and rounds each reading to the nearest. The leftover (up to ±½ a level) is quantization
            noise. Sampling decides <em>when</em> the converter looks; bit depth decides{' '}
            <em>how finely</em> it can record what it sees.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Six dB per bit</h3>
          <p>
            One more bit halves the step size, which halves the rounding error and drops the noise
            power ≈6 dB. For a full-scale sinusoid the signal-to-quantization-noise ratio is:
          </p>
          <p className="readout my-2 text-text">SQNR ≈ 6.02·N + 1.76 dB</p>
          <p>
            So 8 bits buys ~50 dB of dynamic range, 12 bits ~74 dB — the gap between the strongest
            and faintest signal the converter can represent at once. More bits = a lower noise
            floor.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why dither</h3>
          <p>
            At low bit depths the rounding error correlates with the signal, so a quiet tone grows
            harmonic spurs — or, below one level, vanishes. Adding a sliver of noise <em>before</em>{' '}
            rounding (dither) decorrelates it: the floor rises a touch, but it&rsquo;s smooth, and
            detail under one LSB survives. A real cost worth paying.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Filling that range is the gain stage&rsquo;s job next door: too little gain wastes bits,
          too much clips. All signals here are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
