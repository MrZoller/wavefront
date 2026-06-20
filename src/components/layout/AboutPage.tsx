import { GlossedText } from '@/components/GlossedText';

/**
 * The About page — a quiet reference destination (reached from the sidebar, beside the Glossary)
 * that states plainly what Wavefront is, what it deliberately isn't, and where it stands. It's the
 * scope discipline the project was already built with, written down for a first-time reader: the
 * load-bearing part is "What it's not" — educational, public, synthetic by design.
 *
 * Reference, not lesson, and nothing on it is interactive, so it's all neutral static text (no live
 * accent). The prose is self-wrapped in {@link GlossedText} like every other prose surface, so any
 * jargon it grows later is glossed automatically.
 */
export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">About Wavefront</h1>

      <GlossedText>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          What Wavefront is, what it deliberately isn&rsquo;t, and where it stands.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="text-base font-medium text-text">What it is</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              Wavefront is an interactive tool for learning digital signal processing and radio,
              built mainly for software developers who aren&rsquo;t electrical engineers. Every
              transform is built from scratch &mdash; no black-box libraries do the interesting math
              &mdash; and each one is checked against independent reference values by the test
              suite, so you can open the code and trust it rather than take a library&rsquo;s word
              for the result. You learn by doing: drag an emitter, sweep a slider, and watch
              everything recompute live.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text">What it&rsquo;s not</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              Wavefront is educational, not operational. Every example signal in it is synthetic and
              illustrative &mdash; there is no captured or real-world data anywhere in the tool. It
              stays at public, textbook-level theory, the kind you&rsquo;d find on Wikipedia or in
              an undergraduate course. It carries no real system parameters, frequencies of
              interest, hop sequences, or call signs, and nothing proprietary, controlled, or
              otherwise sensitive. Where a real signal is named at all it&rsquo;s a civilian, openly
              documented one &mdash; the GPS C/A code, say, never a restricted one &mdash; and any
              concrete numbers are illustrative, and labeled that way.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text">Independence</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              Wavefront is a personal project by Chris Zoller, built on personal time and equipment.
              It isn&rsquo;t affiliated with, sponsored by, or representative of any employer.
            </p>
          </section>
        </div>
      </GlossedText>

      {/*
       * A repo / license line will slot in here once the public-vs-private decision is made — a
       * quiet footer link or two (links are live, so accent-colored). Intentionally omitted for now.
       */}
    </div>
  );
}
