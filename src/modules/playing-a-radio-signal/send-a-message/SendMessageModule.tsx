import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import {
  CONSTELLATIONS,
  analyticBer,
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

const SCHEMES = Object.values(CONSTELLATIONS);
const EBN0_AXIS = Array.from({ length: 21 }, (_, i) => -2 + i); // −2 … 18 dB
const BER_FLOOR = 1e-6; // y-axis bottom; the curve dives off the chart here rather than faking a floor

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

  // BER-vs-Eb/N0 waterfall for the chosen scheme — the analytic curve (Q(√(2·Eb/N0)) for BPSK/QPSK,
  // the Gray approximation for 16-QAM). The simulation is shown live by the constellation + readout;
  // the reference curve must keep plunging (no Monte-Carlo error floor). Keep the descent plus the
  // first sub-floor point — XYPlot clamps it to the axis floor — so the curve visibly dives to the
  // bottom and connects to a high-SNR marker, rather than stopping short above the floor.
  const curve = useMemo(() => {
    const full = EBN0_AXIS.map((ebN0) => ({ ebN0, ber: analyticBer(scheme, ebN0) }));
    const firstBelow = full.findIndex((p) => p.ber < BER_FLOOR);
    return firstBelow === -1 ? full : full.slice(0, firstBelow + 1);
  }, [scheme]);
  const opBer = analyticBer(scheme, ebN0dB);

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

          <Slider
            label="Eb/N0"
            value={ebN0dB}
            min={-2}
            max={18}
            step={1}
            unit=" dB"
            onChange={setEbN0dB}
            ariaLabel="Energy-per-bit to noise-density ratio in decibels"
          />

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
        <PlotTitle>
          BER vs Eb/N0 ({scheme.name}) — the theoretical waterfall, with your current setting marked
        </PlotTitle>
        <XYPlot
          series={[
            { x: curve.map((p) => p.ebN0), y: curve.map((p) => p.ber), color: colors.signal },
          ]}
          xDomain={[-2, 18]}
          yDomain={[BER_FLOOR, 0.5]}
          logY
          marker={{ x: ebN0dB, y: Math.max(opBer, BER_FLOOR) }}
          height={170}
          yLabel={{ quantity: 'Bit error rate (log)' }}
          xLabel={{ quantity: 'Eb/N0', unit: 'dB' }}
          ariaLabel={`Theoretical bit error rate versus Eb/N0 curve for ${scheme.name}`}
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
