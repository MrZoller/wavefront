import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { SpectrogramPlot } from '@/components/plots/SpectrogramPlot';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { CONSTELLATIONS, awgn } from '@/dsp/comms';
import { MODULATORS } from '@/dsp/modulation';
import { extractFeatures, classify, type Features } from '@/dsp/features';
import { magnitudeSpectrumDb, spectrogram } from '@/dsp/spectrum';
import { gaussianNoise, mulberry32 } from '@/dsp/random';

const SPS = 8;
const NAMES = Object.keys(MODULATORS);
const IDEAL: Record<string, Complex[]> = {
  BPSK: CONSTELLATIONS.BPSK.points,
  QPSK: CONSTELLATIONS.QPSK.points,
  '16-QAM': CONSTELLATIONS.QAM16.points,
};

const trainingBits = (() => {
  const rng = mulberry32(424242);
  return Array.from({ length: 400 }, () => (rng() < 0.5 ? 0 : 1));
})();

function rngBits(seed: number, n: number): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
}

/** Add the same per-sample AWGN the mystery uses (σ ≈ mean envelope / 14 — enough to be visibly
 *  noisy while keeping the constant-envelope pair FSK/MSK separable). */
function addChannelNoise(signal: Complex[], seed: number): Complex[] {
  const sigma = signal.reduce((s, c) => s + Math.hypot(c.re, c.im), 0) / signal.length / 14;
  const ni = gaussianNoise(signal.length, sigma, seed);
  const nq = gaussianNoise(signal.length, sigma, seed + 1);
  return signal.map((s, i) => ({ re: s.re + ni[i], im: s.im + nq[i] }));
}

// Noise-matched prototypes: average each scheme's features over several noisy realizations, so a
// noisy mystery is compared against noisy references (clean prototypes would misread, e.g. noise
// pushes MSK's spectral flatness toward clean FSK).
const PROTOTYPES: Record<string, Features> = Object.fromEntries(
  NAMES.map((n) => {
    const sig = MODULATORS[n].modulate(trainingBits, SPS).signal;
    const reps = Array.from({ length: 6 }, (_, k) =>
      extractFeatures(addChannelNoise(sig, 1000 + k * 13))
    );
    const mean = (sel: (f: Features) => number) =>
      reps.reduce((s, f) => s + sel(f), 0) / reps.length;
    return [
      n,
      {
        envelopeCv: mean((f) => f.envelopeCv),
        spectralSpread: mean((f) => f.spectralSpread),
        qFraction: mean((f) => f.qFraction),
      },
    ];
  })
);

/**
 * Modulation-classification capstone (brief §6 stretch). Here's an unknown signal — which scheme is
 * it, and how can you tell? The same hand-built features that separate the schemes (envelope
 * variation, spectral flatness, I/Q balance) drive a nearest-prototype classifier. Reveal to check.
 */
export function ClassifierModule() {
  const [seed, setSeed] = useState(3);
  const [revealed, setRevealed] = useState(false);

  const { truth, guess, features, scatter, ideal, spectrum, sgram } = useMemo(() => {
    const truth = NAMES[seed % NAMES.length];
    const mod = MODULATORS[truth];
    const { signal, symbols } = mod.modulate(rngBits(seed * 17 + 1, 320), SPS);
    const noisy = addChannelNoise(signal, seed * 2 + 5);

    const features = extractFeatures(noisy);
    const guess = classify(features, PROTOTYPES);

    const scatter: ScatterPoint[] =
      mod.hasConstellation && symbols
        ? // Noise the displayed symbols too, so the clean lattice doesn't give away the answer.
          awgn(symbols, 0.16, seed + 9).map((z) => ({ re: z.re, im: z.im }))
        : noisy
            .filter((_, i) => i % 2 === 0)
            .map((z) => ({ re: z.re, im: z.im, color: colors.cyan }));
    const ideal = mod.hasConstellation ? (IDEAL[truth] ?? []) : [];

    return {
      truth,
      guess,
      features,
      scatter,
      ideal,
      spectrum: magnitudeSpectrumDb(noisy, 'hann'),
      sgram: spectrogram(noisy, 64, 16, 'hann'),
    };
  }, [seed]);

  const correct = guess === truth;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <ConstellationPlot
          ideal={revealed ? ideal : []}
          scatter={scatter}
          limit={1.8}
          size={260}
          ariaLabel="Unknown signal constellation or locus"
        />

        <div className="flex min-w-[260px] flex-1 flex-col gap-4">
          <SpectrumPlot data={spectrum} height={110} ariaLabel="Unknown signal spectrum" />
          <SpectrogramPlot data={sgram} height={110} ariaLabel="Unknown signal spectrogram" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureBar label="Envelope variation" value={features.envelopeCv} max={0.8} />
        <FeatureBar label="Spectral spread" value={features.spectralSpread} max={0.3} />
        <FeatureBar label="Q-rail fraction" value={features.qFraction} max={0.6} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1);
            setRevealed(false);
          }}
          className="readout rounded-md border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-signal-dim hover:text-signal"
        >
          New mystery signal
        </button>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="readout rounded-md border border-signal-dim px-3 py-1.5 text-xs text-signal"
        >
          Reveal
        </button>
        <Readout label="Classifier guess" value={guess} accent />
        {revealed && (
          <Readout
            label="Actual"
            value={`${truth} ${correct ? '✓' : '✗'}`}
            color={correct ? colors.signal : colors.alert}
          />
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            three cheap features place a signal in feature-space: constant-envelope (low envelope
            variation) flags FSK/MSK; near-zero Q-rail flags BPSK; high envelope variation flags
            16-QAM · the classifier just picks the nearest known scheme — the seed of how a neural
            net learns to recognize modulations
          </GlossedText>
        </p>
      </div>
    </div>
  );
}

function FeatureBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="readout flex flex-col gap-1 rounded-md border border-border px-3 py-2 text-xs">
      <span className="flex justify-between text-text-faint">
        <span>{label}</span>
        <span className="text-text">{value.toFixed(3)}</span>
      </span>
      <div className="h-1.5 rounded-sm bg-surface-raised">
        <div className="h-full rounded-sm bg-signal" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  accent,
  color,
}: {
  label: string;
  value: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'} style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}
