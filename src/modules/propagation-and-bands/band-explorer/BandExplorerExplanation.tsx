import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Band Explorer module. */
export function BandExplorerExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">One slider, one equation</h3>
          <p>
            Everything here flows from <span className="readout">λ = c / f</span>: wavelength is the
            speed of light divided by frequency. Low frequencies are physically <em>long</em> (an LF
            wave is hundreds of metres); high ones are <em>short</em> (a UHF wave is centimetres).
            That single fact sets antenna sizes and decides which way the energy travels.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Three ways a wave travels</h3>
          <p>
            <strong>Ground wave</strong> hugs the curve of the Earth and fades with distance — it
            dominates the low bands. <strong>Skywave</strong> bounces off the ionosphere and can
            clear thousands of km in one hop — the HF trick. <strong>Line-of-sight</strong> goes
            straight and stops at the horizon — the rule from VHF up.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why AM, FM, and shortwave differ</h3>
          <p>
            It&rsquo;s the same story three times. AM broadcast sits low, so at night its skywave
            reaches across states. FM sits higher and goes line-of-sight, so it stays local.
            Shortwave sits in between, on HF, and rides the ionosphere around the world.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Modes and reaches here are illustrative textbook bands, not predictions — real range
          depends on power, antennas, terrain, and the ionosphere on the day. All values are
          synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
