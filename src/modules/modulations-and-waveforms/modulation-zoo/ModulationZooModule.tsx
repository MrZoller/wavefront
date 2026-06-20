import { useMemo, useState } from 'react';
import { ControlRail } from '@/components/ControlRail';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { AXIS } from '@/components/plots/axisLabel';
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
      {/* Controls — pinned in a top rail (a header outside the scroll region) so the SNR slider and the
          scheme chips that drive the plots stay co-visible while the stacked plot rows (constellation,
          time, spectrum, eye, spectrogram) scroll beneath them — the drag-watch loop the app is built
          on, here for top-anchored controls. The chip rows mirror the plot grid so each sits above its
          column. */}
      <ControlRail edge="top">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <Slider
              label="SNR"
              value={snrDb}
              min={0}
              max={30}
              step={1}
              unit=" dB"
              onChange={setSnrDb}
              style={{ minWidth: 220 }}
              ariaLabel="Signal-to-noise ratio in decibels"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SchemeChips name={a} onPick={setA} />
            <SchemeChips name={b} onPick={setB} />
          </div>
        </div>
      </ControlRail>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SchemeColumn name={a} snrDb={snrDb} seed={100} />
        <SchemeColumn name={b} snrDb={snrDb} seed={200} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            five views of the same signal · linear schemes (PSK/QAM) show tidy constellation
            clusters; constant-envelope schemes (FSK/MSK) hide their data in frequency — read the
            spectrum and spectrogram instead · lower the SNR and watch which scheme degrades first
          </GlossedText>
        </p>
      </div>
    </div>
  );
}

/**
 * The scheme-selector chip row for one column. Lifted out of `SchemeColumn` so it can be pinned in the
 * top rail (it drives the plots and is anchored at the top) while the plots scroll beneath.
 */
function SchemeChips({ name, onPick }: { name: string; onPick: (n: string) => void }) {
  return (
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
  );
}

function SchemeColumn({ name, snrDb, seed }: { name: string; snrDb: number; seed: number }) {
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
        yLabel={AXIS.amplitude}
        xLabel={AXIS.time}
        ariaLabel={`${name} I/Q waveform`}
      />
      <SpectrumPlot
        data={spectrum}
        height={110}
        yLabel={AXIS.magnitudeDb}
        xLabel={AXIS.normalizedFrequency}
        ariaLabel={`${name} spectrum`}
      />
      <EyeDiagramPlot
        samples={iq.i}
        sps={SPS}
        height={100}
        xLabel={{ quantity: 'Time (two symbols)' }}
        yLabel={AXIS.amplitude}
        ariaLabel={`${name} eye diagram`}
      />
      <SpectrogramPlot
        data={sgram}
        height={120}
        xLabel={AXIS.time}
        yLabel={AXIS.normalizedFrequency}
        ariaLabel={`${name} spectrogram`}
      />
    </div>
  );
}
