import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the Channel Coding module. */
export function ChannelCodingExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Detect vs. correct</h3>
          <p>
            A single parity bit can <em>detect</em> an error (the count of 1s came out wrong) but
            can&rsquo;t say <em>which</em> bit flipped, so it can&rsquo;t fix it. Forward error
            correction adds enough structured redundancy that the receiver can locate and repair the
            error on its own — no retransmission.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Hamming(7,4) and the syndrome</h3>
          <p>
            Three parity bits each cover a different overlapping subset of the seven positions. Read
            them back and the three results form a 3-bit number — the <em>syndrome</em> — that is
            exactly the position of the flipped bit (0 means none). Four data bits, three parity
            bits: a code rate of 4/7, and any single error in the block is corrected.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Coding gain costs bandwidth</h3>
          <p>
            Plotting BER against Eb/N0 — energy per <em>information</em> bit — keeps the comparison
            honest: a rate-R code spends less energy per transmitted bit, so each coded bit is
            noisier. A good code still wins: its curve falls steeper and sits to the left, needing
            less SNR for the same BER. That left-shift is the coding gain; the price is the extra
            bandwidth the redundant bits occupy.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Why repetition is weak</h3>
          <p>
            Repetition is the most intuitive code, but on an AWGN channel it splits each bit&rsquo;s
            energy across its copies, so every copy is noisier. Hard-decision majority vote then
            barely breaks even per bit-energy — structured parity beats brute repetition.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The BER curves are the standard closed-form approximations for BPSK over AWGN with
          hard-decision decoding. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
