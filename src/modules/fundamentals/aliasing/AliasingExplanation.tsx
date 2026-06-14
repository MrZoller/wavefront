import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Sampling & Aliasing module. */
export function AliasingExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Sampling only sees the tick marks</h3>
          <p>
            A sampler records the signal at evenly spaced instants and nothing in between. If the
            signal wiggles too fast between samples, those samples are equally consistent with a
            much
            <em> slower</em> tone — there's no way to tell them apart.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Nyquist &amp; the fold</h3>
          <p>
            The boundary is half the sample rate — the <em>Nyquist</em> frequency. Below it, a tone
            is captured faithfully. Above it, the apparent frequency <em>folds</em> back down:{' '}
            <code>f_apparent = |f − round(f)|</code> in cycles/sample. The spectrum is periodic, so
            every real tone has an infinite ladder of aliases.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why it matters</h3>
          <p>
            Aliasing is irreversible — once two tones collapse onto the same samples, no filter can
            separate them. That's why anti-alias filters sit <em>before</em> the sampler, and why
            decimation must low-pass first (next layer).
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Frequencies are in cycles per sample (sample rate = 1). The wagon-wheel effect in film is
          this same fold in the time domain. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
