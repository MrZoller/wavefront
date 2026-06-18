import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Radio Horizon module. */
export function RadioHorizonExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Why the Earth ends the line</h3>
          <p>
            A line-of-sight wave travels straight, but the ground curves away beneath it. An antenna
            of height <span className="readout">h</span> can see until its sight line goes tangent
            to the sphere — the horizon. Geometry gives that distance as{' '}
            <span className="readout">d = √(2·R·h)</span>, with R the Earth&rsquo;s radius.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Two antennas add their horizons</h3>
          <p>
            A link closes when each end can see the same point on the horizon, so the reach is the
            sum: <span className="readout">d ≈ 3.57·(√h₁ + √h₂)</span> km for heights in metres. The
            3.57 is just <span className="readout">√(2R)</span> with the units folded in. Notice the
            square root — doubling a height doesn&rsquo;t double the range.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Height beats power</h3>
          <p>
            That&rsquo;s why broadcast and relay antennas climb towers and hilltops: above HF, where
            there&rsquo;s no skywave to borrow, raising the antenna is the cheapest way to reach
            farther. It&rsquo;s the same horizon a ship&rsquo;s lookout gains from the crow&rsquo;s
            nest.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The picture exaggerates the vertical scale so metre-high masts read against a hundred-km
          horizon. Distances come from the formula; the curvature is schematic. All values
          synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
