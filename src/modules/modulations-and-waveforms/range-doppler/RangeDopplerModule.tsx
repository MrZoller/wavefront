import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { SpectrogramPlot } from '@/components/plots/SpectrogramPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import { chirp } from '@/dsp/waveforms';
import {
  echoPulses,
  pulseCompress,
  rangeDopplerMap,
  timeBandwidthProduct,
  type RadarTarget,
} from '@/dsp/radar';

const M = 64; // chirp length (fast-time samples)
const RANGE_BINS = 64; // displayed range extent
const WINDOW = M + RANGE_BINS; // received-pulse length, so a far target still fits
const PULSE_OPTIONS = [16, 32, 64]; // FFT lengths (powers of two)
const VEL_TO_DOPPLER = 0.4; // |velocity| = 1 ⇒ ±0.4 cycles/pulse (kept under the ±0.5 unambiguous limit)
const FLOOR_DB = -35;

/** Range bins → dB grid, normalized so the global peak is 0 dB (what the spectrogram canvas expects). */
function gridToDb(grid: number[][], floorDb: number): number[][] {
  let peak = 1e-12;
  for (const row of grid) for (const v of row) if (v > peak) peak = v;
  return grid.map((row) => row.map((v) => Math.max(floorDb, 20 * Math.log10((v || 1e-12) / peak))));
}

/**
 * Pulse Compression & Range-Doppler — the synthesis scene. Radar's signal chain is three tools the
 * learner has already built, aimed outward: a chirp, a matched filter, and an FFT. Transmit an LFM
 * chirp; the echo returns delayed by the target's range and Doppler-shifted by its velocity.
 * Matched-filtering compresses the long echo to a sharp peak at the target's range; an FFT across
 * pulses resolves velocity; together they paint the range-Doppler map — the radar cousin of the GDOP
 * heatmap. All units are synthetic and illustrative (range in bins, Doppler in cycles/pulse).
 */
export function RangeDopplerModule() {
  const [rangeBin, setRangeBin] = useState(24);
  const [velocity, setVelocity] = useState(0.35); // normalized, −1 … +1
  const [bw, setBw] = useState(0.3); // chirp sweep half-width (cycles/sample)
  const [snrDb, setSnrDb] = useState(18);
  const [pulseIdx, setPulseIdx] = useState(1); // → PULSE_OPTIONS[pulseIdx]
  const [secondTarget, setSecondTarget] = useState(false);

  const nPulses = PULSE_OPTIONS[pulseIdx];
  const doppler = velocity * VEL_TO_DOPPLER;
  const tbp = timeBandwidthProduct(M, 2 * bw);

  const { txWave, echoWave, profile, detected, mapDb } = useMemo(() => {
    const tx = chirp(M, -bw, bw);
    const targets: RadarTarget[] = [{ rangeBin, doppler, amplitude: 1 }];
    if (secondTarget) {
      const r2 = Math.min(RANGE_BINS - 4, Math.max(4, rangeBin + 22));
      targets.push({ rangeBin: r2, doppler: -0.16, amplitude: 0.7 });
    }
    const sigma = Math.pow(10, -snrDb / 20); // echo amplitude is 1 ⇒ σ sets the SNR (illustrative)
    const rx = echoPulses(tx, targets, nPulses, WINDOW, sigma, 2024);
    const profile = pulseCompress(rx[0], tx, RANGE_BINS);
    const detected = profile.indexOf(Math.max(...profile));
    const map = rangeDopplerMap(rx, tx, RANGE_BINS);
    return {
      txWave: tx.map((s) => s.re),
      echoWave: rx[0].map((s) => s.re),
      profile,
      detected,
      mapDb: gridToDb(map, FLOOR_DB),
    };
  }, [rangeBin, doppler, bw, snrDb, nPulses, secondTarget]);

  const profileMax = Math.max(1e-6, ...profile);

  return (
    <div className="flex flex-col gap-6">
      {/* Echo delay = range: the transmitted chirp, then the delayed, noisy echo. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <PlotTitle>
            transmitted chirp <span className="text-text-faint">— what we send out</span>
          </PlotTitle>
          <TimeSeriesPlot
            series={[{ color: colors.cyan, samples: txWave }]}
            height={100}
            yLabel={AXIS.amplitude}
            xLabel={{ quantity: 'Fast-time sample' }}
            ariaLabel="Transmitted chirp, in-phase rail"
          />
        </div>
        <div>
          <PlotTitle>
            received echo{' '}
            <span className="text-text-faint">— delayed by range, buried in noise</span>
          </PlotTitle>
          <TimeSeriesPlot
            series={[{ color: colors.signal, samples: echoWave }]}
            height={100}
            yLabel={AXIS.amplitude}
            xLabel={{ quantity: 'Fast-time sample' }}
            ariaLabel="Received echo waveform, in-phase rail"
          />
        </div>
      </div>

      {/* Pulse compression: the matched-filter output, a sharp peak at the target's range. */}
      <div>
        <PlotTitle>
          pulse compression{' '}
          <span className="text-text-faint">— matched-filter output, one pulse</span>
        </PlotTitle>
        <XYPlot
          series={[{ x: profile.map((_, i) => i), y: profile, color: colors.signal }]}
          xDomain={[0, RANGE_BINS - 1]}
          yDomain={[0, profileMax * 1.1]}
          marker={{ x: detected, y: profile[detected], color: colors.signal }}
          height={150}
          xLabel={{ quantity: 'Range (bins)' }}
          yLabel={{ quantity: 'Matched-filter magnitude' }}
          ariaLabel="Pulse-compressed range profile, with the peak marking the detected range"
        />
      </div>

      {/* The marquee: stack the compressed pulses and FFT across them → the range-Doppler map. */}
      <div>
        <PlotTitle>
          range-Doppler map{' '}
          <span className="text-text-faint">— FFT across pulses adds velocity</span>
        </PlotTitle>
        <SpectrogramPlot
          data={mapDb}
          floorDb={FLOOR_DB}
          height={240}
          xLabel={{ quantity: 'Range (bins)' }}
          yLabel={{ quantity: 'Velocity (Doppler)' }}
          ariaLabel="Range-Doppler map; a bright blob marks the target's range and velocity, stationary targets sitting on the centre row"
        />
      </div>

      {/* Live readouts. */}
      <div className="flex flex-wrap gap-4">
        <Readout label="Target range" value={`${rangeBin} bins`} accent />
        <Readout
          label="Radial velocity"
          value={`${velocity > 0 ? '+' : ''}${velocity.toFixed(2)}`}
          accent
        />
        <Readout label="Doppler" value={`${doppler.toFixed(3)} cyc/pulse`} accent />
        <Readout
          label="Detected range (peak)"
          value={`${detected} bins ${detected === rangeBin ? '✓' : ''}`}
        />
        <Readout label="Time-bandwidth ≈ gain" value={`${tbp.toFixed(0)}×`} />
      </div>

      {/* Controls. */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-6">
          <Slider
            label="Target range"
            value={rangeBin}
            min={4}
            max={RANGE_BINS - 4}
            step={1}
            display={`${rangeBin} bins`}
            onChange={setRangeBin}
            ariaLabel="Target range in range bins"
          />
          <Slider
            label="Radial velocity"
            value={velocity}
            min={-1}
            max={1}
            step={0.05}
            decimals={2}
            onChange={setVelocity}
            ariaLabel="Target radial velocity (sets the Doppler shift)"
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <Slider
            label="Chirp sweep half-width"
            value={bw}
            min={0.05}
            max={0.45}
            step={0.05}
            display={`±${bw.toFixed(2)} cyc/sample`}
            onChange={setBw}
            ariaLabel="Chirp sweep half-width (sets the time-bandwidth product)"
          />
          <Slider
            label="SNR"
            value={snrDb}
            min={-5}
            max={30}
            step={1}
            unit=" dB"
            onChange={setSnrDb}
            ariaLabel="Echo signal-to-noise ratio in decibels"
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Slider
            label="Pulses (slow-time FFT)"
            value={pulseIdx}
            min={0}
            max={PULSE_OPTIONS.length - 1}
            step={1}
            display={`${nPulses} pulses`}
            onChange={setPulseIdx}
            ariaLabel="Number of pulses in the coherent train"
          />
          <button
            type="button"
            aria-pressed={secondTarget}
            onClick={() => setSecondTarget((s) => !s)}
            className={[
              'readout cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors',
              secondTarget
                ? 'border-signal-dim bg-surface-raised text-signal'
                : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
            ].join(' ')}
          >
            Second target
          </button>
        </div>
        <span className="readout text-xs text-text-faint">
          <GlossedText>
            the echo is the chirp delayed by range and Doppler-shifted by velocity ·
            matched-filtering compresses that long echo to the range peak · an FFT across pulses
            resolves velocity, and the bright blob is the target — drag range and velocity and watch
            it move
          </GlossedText>
        </span>
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
