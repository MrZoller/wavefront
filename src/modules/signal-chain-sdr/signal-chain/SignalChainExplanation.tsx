import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the receiver signal-chain module. */
export function SignalChainExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Boxes and wires</h3>
          <p>
            A radio is usually drawn as a chain of boxes: antenna, amplifier, filter, mixer,
            converter, and so on. That picture is correct — but each box hides an idea this app
            already lets you poke at. The block diagram is the map; the modules are the territory.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Where software takes over</h3>
          <p>
            The ADC is the border. Everything to its left is analog — voltages, amplifiers, mixers —
            and everything to its right is just numbers: the same filtering, mixing, and
            channelizing you&rsquo;ve been dragging, now done in code. The mixer is downconversion,
            the filters are FIR taps, the channelizer splits one wide band into many, and the
            demodulator turns symbols back into bits.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The same chain, backwards</h3>
          <p>
            Transmit is the mirror: bits become symbols, a DAC turns samples into a waveform, an
            up-converter lifts it to the carrier, and a power amplifier drives the antenna. Same
            blocks, opposite direction — which is why a transceiver reuses most of the chain.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          How early the ADC sits — how much of the chain is software — is exactly what the SDR
          architectures module compares. The grey LNA and power-amp blocks are analog-only and out
          of scope. All signals across the app are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
