import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { colors } from '@/design/tokens';
import { mulberry32 } from '@/dsp/random';
import {
  CONSTELLATIONS,
  awgn,
  bitErrorRate,
  bitsToSymbols,
  nearestSymbol,
  noiseSigma,
  symbolsToBits,
  type Constellation,
} from '@/dsp/comms';

const NUM_SYMBOLS = 600;
const SCHEMES = Object.values(CONSTELLATIONS);

/**
 * The noisy channel (brief §5, Track B). Real channels add thermal noise. Map a fixed bit stream to
 * symbols, add complex AWGN for a chosen Eb/N0, and slice each received point back to its nearest
 * constellation point. Watch the clean lattice bloom into clouds — and bits start to flip once a
 * cloud spills across a decision boundary. Lower Eb/N0 or denser schemes break first.
 */
export function NoisyChannelModule() {
  const [scheme, setScheme] = useState<Constellation>(CONSTELLATIONS.QPSK);
  const [ebN0dB, setEbN0dB] = useState(8);

  const k = scheme.bitsPerSymbol;

  // Fixed transmit stream (seeded → stable across slider moves and screenshots).
  const { bits, tx } = useMemo(() => {
    const rng = mulberry32(1337);
    const bits = Array.from({ length: NUM_SYMBOLS * k }, () => (rng() < 0.5 ? 0 : 1));
    return { bits, tx: bitsToSymbols(bits, scheme) };
  }, [scheme, k]);

  const sigma = noiseSigma(ebN0dB, k);
  const rx = useMemo(() => awgn(tx, sigma, 2024), [tx, sigma]);
  const decodedBits = symbolsToBits(rx, scheme);
  const ber = bitErrorRate(bits, decodedBits);

  // Color each received point by whether it slices back to the transmitted symbol.
  const scatter: ScatterPoint[] = rx.map((z, i) => {
    const txIndex = nearestSymbol(tx[i], scheme); // tx sits exactly on a lattice point
    const ok = nearestSymbol(z, scheme) === txIndex;
    return { re: z.re, im: z.im, color: ok ? colors.signal : colors.alert };
  });
  const symbolErrors = scatter.filter((p) => p.color === colors.alert).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <ConstellationPlot
          ideal={scheme.points}
          scatter={scatter}
          limit={1.8}
          ariaLabel={`${scheme.name} constellation with received symbols spread by noise at ${ebN0dB} dB Eb/N0`}
        />

        <div className="flex min-w-[260px] flex-1 flex-col gap-4">
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

          <div className="flex flex-wrap gap-4">
            <Readout
              label="Bit error rate"
              value={ber === 0 ? '0 (clean)' : ber.toExponential(2)}
              accent
            />
            <Readout label="Symbol errors" value={`${symbolErrors} / ${NUM_SYMBOLS}`} />
            <Readout label="Noise σ (per axis)" value={sigma.toFixed(3)} />
          </div>

          <p className="readout text-xs text-text-faint">
            <GlossedText>
              green = sliced back to the right symbol · red = pushed across a boundary into a bit
              error · slide Eb/N0 down or switch to 16-QAM and watch the clouds collide
            </GlossedText>
          </p>
        </div>
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
