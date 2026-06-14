import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import {
  CONSTELLATIONS,
  awgn,
  bitErrorRate,
  bitsToSymbols,
  bitsToText,
  nearestSymbol,
  noiseSigma,
  symbolsToBits,
  textToBits,
  type Constellation,
} from '@/dsp/comms';
import { berVsSnr } from '@/dsp/channel';

const SCHEMES = Object.values(CONSTELLATIONS);
const EBN0_AXIS = Array.from({ length: 21 }, (_, i) => -2 + i); // −2 … 18 dB

/**
 * Send a Message (brief §5, Track B — the capstone). The whole chain end to end: type text, watch it
 * become bits, ride QPSK/QAM symbols across a noisy channel, and get sliced back to text. At high
 * Eb/N0 it arrives perfectly; turn the noise up and characters start to garble as bit errors land.
 */
export function SendMessageModule() {
  const [text, setText] = useState('HELLO WAVEFRONT');
  const [scheme, setScheme] = useState<Constellation>(CONSTELLATIONS.QPSK);
  const [ebN0dB, setEbN0dB] = useState(10);

  const { received, scatter, ber } = useMemo(() => {
    const bits = textToBits(text);
    const tx = bitsToSymbols(bits, scheme);
    const rx = awgn(tx, noiseSigma(ebN0dB, scheme.bitsPerSymbol), 7);
    const decoded = symbolsToBits(rx, scheme);
    const scatter: ScatterPoint[] = rx.map((z, i) => {
      const ok = nearestSymbol(z, scheme) === nearestSymbol(tx[i], scheme);
      return { re: z.re, im: z.im, color: ok ? colors.signal : colors.alert };
    });
    return { received: bitsToText(decoded), scatter, ber: bitErrorRate(bits, decoded) };
  }, [text, scheme, ebN0dB]);

  // BER-vs-Eb/N0 waterfall for the chosen scheme, with the live operating point marked.
  const curve = useMemo(() => berVsSnr(scheme, EBN0_AXIS, 4000, 11), [scheme]);
  const opBer = curve.find((p) => p.ebN0 === ebN0dB)?.ber ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <ConstellationPlot
          ideal={scheme.points}
          scatter={scatter}
          limit={1.8}
          size={300}
          ariaLabel={`${scheme.name} received symbols for the transmitted message at ${ebN0dB} dB Eb/N0`}
        />

        <div className="flex min-w-[280px] flex-1 flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="readout text-xs text-text-muted">Message</span>
            <input
              type="text"
              value={text}
              maxLength={40}
              onChange={(e) => setText(e.target.value)}
              className="readout rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal-dim"
              aria-label="Message text to transmit"
            />
          </label>

          <div className="flex gap-2">
            {SCHEMES.map((s) => (
              <button
                key={s.name}
                type="button"
                aria-pressed={s.name === scheme.name}
                onClick={() => setScheme(s)}
                className={[
                  'readout rounded-md border px-3 py-1 text-xs transition-colors',
                  s.name === scheme.name
                    ? 'border-signal-dim text-signal'
                    : 'border-border text-text-muted hover:border-signal-dim',
                ].join(' ')}
              >
                {s.name}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="readout flex justify-between text-xs text-text-muted">
              <span>Eb/N0</span>
              <span className="text-signal">{ebN0dB} dB</span>
            </span>
            <input
              type="range"
              min={-2}
              max={18}
              step={1}
              value={ebN0dB}
              onChange={(e) => setEbN0dB(parseInt(e.target.value, 10))}
              className="accent-[var(--color-signal)]"
              aria-label="Energy-per-bit to noise-density ratio in decibels"
            />
          </label>

          <div>
            <span className="readout text-xs text-text-muted">Received</span>
            <pre className="readout mt-1 overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-surface-raised px-3 py-2 text-sm">
              {[...received].map((ch, i) => {
                const corrupt = ch !== text[i];
                return (
                  <span key={i} className={corrupt ? 'text-alert' : 'text-text'}>
                    {ch}
                  </span>
                );
              })}
            </pre>
          </div>

          <div className="flex flex-wrap gap-4">
            <Readout
              label="Bit error rate"
              value={ber === 0 ? '0 (clean)' : ber.toExponential(2)}
              accent
            />
            <Readout label="Bits sent" value={`${text.length * 8}`} />
          </div>
        </div>
      </div>

      <div>
        <p className="readout mb-1 text-xs text-text-muted">
          BER vs Eb/N0 ({scheme.name}) — the waterfall, with your current setting marked
        </p>
        <XYPlot
          series={[
            { x: curve.map((p) => p.ebN0), y: curve.map((p) => p.ber), color: colors.signal },
          ]}
          xDomain={[-2, 18]}
          yDomain={[1e-4, 0.5]}
          logY
          marker={{ x: ebN0dB, y: Math.max(opBer, 1e-4) }}
          height={170}
          yLabel="BER (log)"
          xLabel="Eb/N0 (dB)"
          ariaLabel={`Bit error rate versus Eb/N0 curve for ${scheme.name}`}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            this is the whole chain: text → bits → symbols → noisy channel → nearest-point decision
            → bits → text · green points decoded correctly, red flipped · keep Eb/N0 high for a
            clean message; lower it (or pick 16-QAM) and watch characters garble
          </GlossedText>
        </p>
      </div>
    </div>
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
