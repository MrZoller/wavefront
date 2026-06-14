import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Analog on-ramp. */
export function AnalogExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Three knobs on one carrier</h3>
          <p>
            A carrier is a pure tone with an amplitude, a frequency, and a phase. Analog modulation
            wiggles exactly one of them with your message: <em>AM</em> the amplitude, <em>FM</em>{' '}
            the frequency, <em>PM</em> the phase. That&rsquo;s the whole idea behind a car radio.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why the spectra differ</h3>
          <p>
            AM of a single tone is exact: a carrier line plus two sidebands at ±the message
            frequency. FM and PM are nonlinear — they spray a <em>fan</em> of sidebands whose width
            grows with the deviation (Carson&rsquo;s rule), which is why FM needs more bandwidth
            than AM but rejects amplitude noise.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">FM&rsquo;s noise win</h3>
          <p>
            Because FM/PM carry information in angle, not amplitude, a receiver can hard-limit the
            signal and throw away amplitude noise entirely — the reason FM radio sounds clean where
            AM hisses. The constant envelope you see here is exactly that property.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Shown as complex baseband around 0 Hz; a real transmitter slides this up to the
          station&rsquo;s carrier (up-conversion). All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
