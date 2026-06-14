import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Symbol Mapping module. */
export function SymbolMappingExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Bits don&rsquo;t fly — symbols do</h3>
          <p>
            A radio can&rsquo;t send a &ldquo;1&rdquo; or a &ldquo;0&rdquo; directly. It sends a
            brief tone with a chosen <em>amplitude and phase</em> — a point in the I/Q plane.
            Mapping bits to those points is <em>modulation</em>; the set of allowed points is the{' '}
            <em>constellation</em>.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Bits per symbol = rate vs. robustness</h3>
          <p>
            BPSK carries 1 bit/symbol (two points), QPSK 2 (four), 16-QAM 4 (sixteen). More bits per
            symbol sends data faster at the same symbol rate, but the points crowd together — so it
            takes less noise to push a received point across a decision boundary.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Gray coding</h3>
          <p>
            The points are labeled so that any two neighbors differ by exactly <em>one</em> bit.
            When noise nudges a symbol to its nearest wrong neighbor — the most likely error — only
            a single bit flips, not several. It&rsquo;s a free win that every real system uses.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Each constellation here is normalized to unit average symbol energy, so the next
          module&rsquo;s Eb/N0 comparison across schemes is fair. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
