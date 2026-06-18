import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import { CODES, type Code, type CodeId, codingGainDb, uncodedBer } from '@/dsp/coding';

// A smooth Eb/N0 axis for the analytic BER curves (closed form → no Monte-Carlo noise).
const EBN0_AXIS = Array.from({ length: 49 }, (_, i) => i * 0.25); // 0 … 12 dB
const REF_BER = 1e-5;

const CODE_ORDER: CodeId[] = ['none', 'repetition', 'hamming'];

// A fixed data word per code for the worked example; Hamming carries 4 bits, the others 1.
const WORKED_DATA: Record<CodeId, number[]> = {
  none: [1],
  repetition: [1],
  hamming: [1, 0, 1, 1],
};
// Hamming parity bits sit at positions 1, 2, 4 (0-indexed 0, 1, 3).
const HAMMING_PARITY = new Set([0, 1, 3]);

/**
 * Channel Coding (FEC) — structured redundancy lets the receiver *correct* flipped bits, not just
 * notice them. Pick a code (none / repetition / Hamming), drag Eb/N0, and watch the coded BER curve
 * sit to the left of uncoded — same error rate at lower SNR — for the price of a lower code rate. The
 * worked example flips bits in the channel and shows the decoder repair them.
 */
export function ChannelCodingModule() {
  const [codeId, setCodeId] = useState<CodeId>('hamming');
  const [ebN0dB, setEbN0dB] = useState(8);

  const code = CODES[codeId];
  const codedBer = code.ber(ebN0dB);
  const rawBer = uncodedBer(ebN0dB);
  const gain = codingGainDb(code, REF_BER);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PlotTitle>BER vs Eb/N0 — coded sits to the left of uncoded (coding gain)</PlotTitle>
        <XYPlot
          series={[
            {
              x: EBN0_AXIS,
              y: EBN0_AXIS.map(uncodedBer),
              color: colors.textFaint,
            },
            {
              x: EBN0_AXIS,
              y: EBN0_AXIS.map((db) => code.ber(db)),
              color: colors.signal,
            },
          ]}
          xDomain={[0, 12]}
          yDomain={[1e-6, 0.5]}
          logY
          marker={{ x: ebN0dB, y: Math.max(codedBer, 1e-6) }}
          height={210}
          xLabel={{ quantity: 'Eb/N0', unit: 'dB' }}
          yLabel={{ quantity: 'Bit error rate (log)' }}
          ariaLabel="Bit error rate versus Eb/N0 for the coded curve against the uncoded reference"
        />
        <p className="readout mt-1 text-xs text-text-faint">
          <span style={{ color: colors.textFaint }}>— uncoded</span>
          {'   '}
          <span style={{ color: colors.signal }}>— {code.name}</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="readout text-xs text-text-faint">code:</span>
          {CODE_ORDER.map((id) => (
            <Chip key={id} selected={id === codeId} onClick={() => setCodeId(id)}>
              {CODES[id].name}
            </Chip>
          ))}
        </div>

        <Slider
          label="Eb/N0"
          value={ebN0dB}
          min={0}
          max={12}
          step={0.5}
          unit=" dB"
          decimals={1}
          onChange={setEbN0dB}
          ariaLabel="Energy-per-bit to noise-density ratio in decibels"
        />

        <div className="flex flex-wrap gap-4">
          <Readout label="Code rate (data / sent)" value={`${code.dataBits}/${code.codedBits}`} />
          <Readout
            label="Coding gain @ BER 1e-5"
            value={gain === null ? '—' : `${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`}
            accent
          />
          <Readout
            label="BER here (coded)"
            value={codedBer < 1e-6 ? '<1e-6' : codedBer.toExponential(1)}
            accent
          />
          <Readout label="BER here (uncoded)" value={rawBer.toExponential(1)} />
        </div>

        <p className="readout text-xs text-text-faint">
          <GlossedText>
            redundancy buys back errors at a rate cost · Hamming(7,4) sends 7 bits for every 4, and
            its curve falls steeper than uncoded — a real coding gain · repetition is the simplest
            idea (majority vote) but, splitting energy across copies, it barely helps on this
            channel
          </GlossedText>
        </p>
      </div>

      {/* Worked example — remount on code change so the channel flips reset. */}
      <WorkedExample key={codeId} code={code} />
    </div>
  );
}

/** data → encoded → one (or more) bits flipped in the channel → decoder corrects (or can't). */
function WorkedExample({ code }: { code: Code }) {
  const data = WORKED_DATA[code.id];
  const encoded = code.encode(data);
  const [flipped, setFlipped] = useState<boolean[]>(() => encoded.map(() => false));
  const received = encoded.map((b, i) => (flipped[i] ? b ^ 1 : b));
  const decoded = code.decode(received);
  const ok = decoded.length === data.length && decoded.every((b, i) => b === data[i]);
  const numFlips = flipped.filter(Boolean).length;
  const isHamming = code.id === 'hamming';

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-3">
        <BitRow label="Data" bits={data} />
        <div className="flex flex-col gap-1">
          <span className="readout text-xs text-text-faint">
            Sent (click a bit to flip it in the channel)
          </span>
          <div className="flex flex-wrap gap-1">
            {encoded.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFlipped((f) => f.map((v, j) => (j === i ? !v : v)))}
                aria-label={`sent bit ${i}${isHamming ? (HAMMING_PARITY.has(i) ? ' (parity)' : ' (data)') : ''}, ${flipped[i] ? 'flipped' : 'intact'}`}
                aria-pressed={flipped[i]}
                className={[
                  'readout h-8 w-7 cursor-pointer rounded-sm border text-xs transition-colors',
                  flipped[i]
                    ? 'border-alert bg-alert-dim/40 text-alert'
                    : isHamming && HAMMING_PARITY.has(i)
                      ? 'border-cyan-dim text-cyan hover:border-cyan'
                      : 'border-border text-text hover:border-signal-dim',
                ].join(' ')}
              >
                {received[i]}
              </button>
            ))}
          </div>
          {isHamming && (
            <span className="readout text-[10px] text-text-faint">
              <span className="text-cyan">cyan</span> = parity bits · the rest carry data
            </span>
          )}
        </div>
        <BitRow label="Decoded" bits={decoded} reference={data} />
      </div>

      <div
        className={[
          'readout flex items-center gap-2 rounded-md border px-3 py-2 text-xs',
          ok ? 'border-signal-dim text-signal' : 'border-alert-dim text-alert',
        ].join(' ')}
      >
        {numFlips === 0
          ? 'No channel errors yet — flip a sent bit to test the code.'
          : ok
            ? `Corrected — ${numFlips} flipped bit${numFlips > 1 ? 's' : ''} repaired, data recovered.`
            : `Decoding error — ${numFlips} flips exceeded what this code can correct.`}
      </div>

      <p className="readout text-xs text-text-faint">
        <GlossedText>
          {code.id === 'none'
            ? 'with no coding, a single flip is an uncorrectable bit error — there is no redundancy to lean on'
            : code.id === 'repetition'
              ? 'majority vote fixes a single flip in the group of three; flip two and the vote tips the wrong way'
              : 'the syndrome (parity-check result) names the flipped position, so any single error is corrected; two errors in a block defeat it'}
        </GlossedText>
      </p>
    </div>
  );
}

function BitRow({
  label,
  bits,
  reference,
}: {
  label: string;
  bits: number[];
  reference?: number[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="readout text-xs text-text-faint">{label}</span>
      <div className="flex flex-wrap gap-1">
        {bits.map((b, i) => {
          const wrong = reference ? b !== reference[i] : false;
          return (
            <span
              key={i}
              className={[
                'readout flex h-8 w-7 items-center justify-center rounded-sm border text-xs',
                wrong ? 'border-alert text-alert' : 'border-border text-text',
              ].join(' ')}
            >
              {b}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
        selected
          ? 'border-signal-dim bg-surface-raised text-signal'
          : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
