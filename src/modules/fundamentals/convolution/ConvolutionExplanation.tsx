import { GlossedText } from '@/components/GlossedText';
import { useAppStore } from '@/store/appStore';

/** "Go deeper" content for the Convolution & the Impulse Response module. */
export function ConvolutionExplanation() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">A system is its impulse response</h3>
          <p>
            For a linear, time-invariant (LTI) system you don&rsquo;t need to know what&rsquo;s
            inside the box. Poke it once with an impulse, record what comes out, and you can predict
            its response to <em>any</em> input: shift and scale that recorded impulse response by
            each input sample, then add the copies up. That add-up is convolution.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">You&rsquo;ve been doing this all along</h3>
          <p>
            An FIR filter&rsquo;s taps <em>are</em> an impulse response. The matched filter
            <em> is</em> convolution with a flipped copy of the pulse. Pulse shaping <em>is</em>{' '}
            convolving symbols with the pulse shape. Multipath <em>is</em> the channel&rsquo;s
            impulse response — a few delayed echoes. Same operation; only the impulse response
            differs.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">
            Time convolution = frequency multiplication
          </h3>
          <p>
            Convolving two signals in time is the same as <em>multiplying</em> their spectra in
            frequency. That is why filtering is often described as &ldquo;multiply the
            spectra,&rdquo; and why the FFT enables fast convolution: transform both, multiply
            point-by-point, transform back. The same two operations, seen from the other domain.
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
          The output of a length-<em>N</em> input with a length-<em>M</em> response has{' '}
          <em>N + M − 1</em> samples — the tails where they only partly overlap. One `convolve`
          primitive, fully tested, backs this module and the filtering ones. All signals are
          synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
