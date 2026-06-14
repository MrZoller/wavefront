import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Windowing & Leakage module. */
export function WindowingExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Why a finite block leaks</h3>
          <p>
            The DFT assumes the block repeats forever. Unless the tone fits a whole number of cycles
            in the window, the wrap-around has a jump — and a jump is broadband, so the energy
            smears into every bin. That smear is <em>spectral leakage</em>.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Tapering the edges</h3>
          <p>
            A window fades the block in and out so there's no edge jump. The cost is a wider
            mainlobe (you can resolve two close tones less easily); the benefit is far lower
            sidelobes (a strong tone no longer drowns a weak neighbor). Blackman is the gentlest
            here — widest lobe, lowest sidelobes; rectangular is the opposite.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          This is exactly why a polyphase filter bank replaces the FFT's implicit rectangular window
          with a <em>designed</em> prototype — exactly what the channelizer module does. All signals
          are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
