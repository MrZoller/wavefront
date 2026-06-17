import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the HF Skywave module. */
export function SkywaveExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">A mirror in the sky</h3>
          <p>
            The Sun ionises the upper atmosphere into layers that can act like a mirror for radio.
            An HF wave aimed upward bends back down and lands far over the horizon — one skywave hop
            can span a continent, which is how shortwave reaches around the world.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Reflect or punch through</h3>
          <p>
            The layer only bends a wave back if it isn&rsquo;t too high in frequency. The cutoff for
            a given path is the <strong>maximum usable frequency</strong>:{' '}
            <span className="readout">MUF = fc · sec φ</span>, the layer&rsquo;s critical frequency
            scaled by how obliquely the ray strikes it. Below the MUF it reflects; above it, the
            wave sails through into space.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why night changes everything</h3>
          <p>
            After dark the layer recombines and weakens, so its critical frequency — and the MUF —
            drop. A daytime frequency that reflected cleanly can punch through at night, and lower
            frequencies that were absorbed by day come alive. It&rsquo;s the same physics behind AM
            stations carrying for hundreds of miles after sunset.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          This is a deliberately conceptual sketch — a single layer at a fixed height, illustrative
          critical frequencies, one hop. A real ionosphere has several shifting layers and
          absorption. All values synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
