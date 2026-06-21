import { GlossedText } from '@/components/GlossedText';
import { useAppStore } from '@/store/appStore';

/** "Go deeper" content for the FFT Bins & Zero-Padding module. */
export function FftBinsExplanation() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">More dots, same picture</h3>
          <p>
            Zero-padding a capture before the FFT doesn&rsquo;t change the signal — the extra
            samples are zeros, which add nothing. So the transform still measures the <em>same</em>{' '}
            underlying spectrum; it just samples it at more points. Double the bins and every old
            bin reappears untouched, with a new sample dropped exactly between each pair.
            That&rsquo;s sinc interpolation: a smoother, finer-drawn picture of a fixed curve, not a
            finer curve.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Two different Ns</h3>
          <p>
            The trap is conflating two lengths. <em>Bin spacing</em> is fs / N_fft — how finely you{' '}
            <em>draw</em> the spectrum, set by the transform size you chose.{' '}
            <em>Frequency resolution</em> is ≈ fs / N_real — the closest two tones you can actually
            tell apart, set by how many real samples you <em>captured</em>. Zero-padding raises
            N_fft, never N_real, so it can shrink the bin spacing without end while the resolution
            sits exactly where the capture left it. More dots, same blob.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Resolution is bought with time</h3>
          <p>
            To separate two close frequencies you must watch <em>longer</em> — capture more real
            samples. That&rsquo;s the time–frequency tradeoff: data is the currency of resolution,
            bins are not. The same finite-block edge that sets this limit is what smears a tone
            across bins in the first place, and tapering trades one against the other.
          </p>
          <button
            type="button"
            onClick={() => setActiveModule('windowing-leakage')}
            className="mt-2 text-xs text-signal underline decoration-dotted underline-offset-2 transition-colors hover:text-cyan"
          >
            Open Windowing &amp; Leakage →
          </button>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Where the bins come from</h3>
          <p>
            Each bin is the signal dotted with one sinusoid — the change-of-basis the DFT performs.
            Counting bins is just choosing how many of those sinusoids to project onto.
          </p>
          <button
            type="button"
            onClick={() => setActiveModule('dft-basis')}
            className="mt-2 text-xs text-signal underline decoration-dotted underline-offset-2 transition-colors hover:text-cyan"
          >
            Open The DFT as a Change of Basis →
          </button>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The 1 kHz sample rate and 200/230 Hz tones are illustrative, synthetic values chosen to
          make bin spacing and resolution read as round numbers. One tested zero-pad path backs this
          module and reuses the same from-scratch FFT as the rest of the track.
        </section>
      </div>
    </GlossedText>
  );
}
