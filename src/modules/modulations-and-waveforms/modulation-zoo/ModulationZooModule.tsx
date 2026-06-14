import { useMemo, useState } from 'react';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { EyeDiagramPlot } from '@/components/plots/EyeDiagramPlot';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { SpectrogramPlot } from '@/components/plots/SpectrogramPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { CONSTELLATIONS, awgn } from '@/dsp/comms';
import { MODULATORS } from '@/dsp/modulation';
import { magnitudeSpectrumDb, spectrogram } from '@/dsp/spectrum';
import { gaussianNoise } from '@/dsp/random';

const SPS = 8;
const NUM_BITS = 256;
const NAMES = Object.keys(MODULATORS);
const IDEAL: Record<string, Complex[]> = {
  BPSK: CONSTELLATIONS.BPSK.points,
  QPSK: CONSTELLATIONS.QPSK.points,
  '16-QAM': CONSTELLATIONS.QAM16.points,
};

const fixedBits = (() => {
  let a = 1337 >>> 0;
  return Array.from({ length: NUM_BITS }, () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a >>> 31;
  });
})();

const rms = (s: Complex[]) =>
  Math.sqrt(s.reduce((acc, c) => acc + c.re * c.re + c.im * c.im, 0) / s.length);

function addNoise(signal: Complex[], snrDb: number, seed: number): Complex[] {
  // Total noise power = signalPower / SNR; split evenly across the I and Q rails ⇒ σ per rail
  // divides by √2 so the displayed SNR matches the control.
  const sigma = (rms(signal) * 10 ** (-snrDb / 20)) / Math.SQRT2;
  const ni = gaussianNoise(signal.length, sigma, seed);
  const nq = gaussianNoise(signal.length, sigma, seed + 1);
  return signal.map((s, i) => ({ re: s.re + ni[i], im: s.im + nq[i] }));
}

/**
 * Modulation Zoo (brief §6 marquee). Pick a scheme and see its fingerprint across five synchronized
 * views — time-domain I/Q, constellation, spectrum, eye, and spectrogram — then A/B a second scheme
 * at the same SNR. The screen where modulation differences become obvious.
 */
export function ModulationZooModule() {
  const [a, setA] = useState('QPSK');
  const [b, setB] = useState('FSK');
  const [snrDb, setSnrDb] = useState(18);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>SNR</span>
            <span className="text-signal">{snrDb} dB</span>
          </span>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={snrDb}
            onChange={(e) => setSnrDb(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Signal-to-noise ratio in decibels"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SchemeColumn name={a} onPick={setA} snrDb={snrDb} seed={100} />
        <SchemeColumn name={b} onPick={setB} snrDb={snrDb} seed={200} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          five views of the same signal · linear schemes (PSK/QAM) show tidy constellation clusters;
          constant-envelope schemes (FSK/MSK) hide their data in frequency — read the spectrum and
          spectrogram instead · lower the SNR and watch which scheme degrades first
        </p>
      </div>
    </div>
  );
}

function SchemeColumn({
  name,
  onPick,
  snrDb,
  seed,
}: {
  name: string;
  onPick: (n: string) => void;
  snrDb: number;
  seed: number;
}) {
  const mod = MODULATORS[name];

  const { iq, spectrum, sgram, scatter, ideal } = useMemo(() => {
    const { signal, symbols } = mod.modulate(fixedBits, SPS);
    const noisy = addNoise(signal, snrDb, seed);
    const iq = { i: noisy.slice(0, 160).map((c) => c.re), q: noisy.slice(0, 160).map((c) => c.im) };
    const spectrum = magnitudeSpectrumDb(noisy, 'hann');
    const sgram = spectrogram(noisy, 64, 16, 'hann');

    let scatter: ScatterPoint[];
    let ideal: Complex[];
    if (mod.hasConstellation && symbols) {
      const sigma = 10 ** (-snrDb / 20) / Math.SQRT2;
      scatter = awgn(symbols, sigma, seed).map((z) => ({ re: z.re, im: z.im }));
      ideal = IDEAL[name] ?? [];
    } else {
      // Constant-envelope: show the signal's unit-circle locus instead of a constellation.
      scatter = noisy
        .filter((_, i) => i % 2 === 0)
        .map((z) => ({ re: z.re, im: z.im, color: colors.cyan }));
      ideal = [];
    }
    return { iq, spectrum, sgram, scatter, ideal };
  }, [mod, name, snrDb, seed]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {NAMES.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={n === name}
            onClick={() => onPick(n)}
            className={[
              'readout rounded-md border px-2.5 py-1 text-xs transition-colors',
              n === name
                ? 'border-signal-dim text-signal'
                : 'border-border text-text-muted hover:border-signal-dim',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>

      <ConstellationPlot
        ideal={ideal}
        scatter={scatter}
        limit={mod.hasConstellation ? 1.8 : 1.4}
        size={260}
        ariaLabel={`${name} ${mod.hasConstellation ? 'constellation' : 'signal locus'}`}
      />
      <TimeSeriesPlot
        series={[
          { color: colors.signal, samples: iq.i },
          { color: colors.cyan, samples: iq.q },
        ]}
        height={90}
        yDomain={[-2, 2]}
        yLabel={`${name} I/Q`}
      />
      <SpectrumPlot data={spectrum} height={110} ariaLabel={`${name} spectrum`} />
      <EyeDiagramPlot samples={iq.i} sps={SPS} height={100} ariaLabel={`${name} eye diagram`} />
      <SpectrogramPlot data={sgram} height={120} ariaLabel={`${name} spectrogram`} />
    </div>
  );
}
