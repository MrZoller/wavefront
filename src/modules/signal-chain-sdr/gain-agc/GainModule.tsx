import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { Slider } from '@/components/Slider';
import { colors } from '@/design/tokens';
import { complex } from '@/dsp/complex';
import { applyGainSignal, clip, clippedFraction, dbToLinear, headroomDb } from '@/dsp/gain';
import { quantizeSignal } from '@/dsp/quantization';
import { gaussianNoise } from '@/dsp/random';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';

const N = 512;
const CYCLES = 18; // bin-centered tone
const SIG_AMP = 0.02; // a weak antenna signal (−34 dBFS)
const NOISE_SIGMA = 0.001; // analog/thermal noise riding with it
const ADC_BITS = 8; // the converter this front end feeds
const FLOOR = -90;

// A fixed weak signal buried in noise — the gain stage's job is to position it in the ADC's range.
const NOISE = gaussianNoise(N, NOISE_SIGMA, 7);
const INPUT = Array.from(
  { length: N },
  (_, n) => SIG_AMP * Math.sin((2 * Math.PI * CYCLES * n) / N) + NOISE[n]
);

/**
 * Gain, clipping & AGC (Track F — the analog/digital boundary). A weak antenna signal must be
 * amplified to fill the ADC's range: too little gain and it sits in the bottom bits where
 * quantization noise swamps it; too much and it slams into the rails, clipping into harmonic spurs.
 * Drag the gain through the Goldilocks zone — the reason automatic gain control exists.
 */
export function GainModule() {
  const [gainDb, setGainDb] = useState(24);

  const { spectrum, headroom, clipPct } = useMemo(() => {
    const lin = dbToLinear(gainDb);
    const amplified = INPUT.map((x) => x * lin);
    const adc = quantizeSignal(
      amplified.map((x) => clip(x)),
      ADC_BITS
    );
    return {
      spectrum: magnitudeSpectrumDb(
        adc.map((v) => complex(v)),
        'hann',
        FLOOR
      ),
      headroom: headroomDb(amplified), // peak vs the rail: large = buried, ~0 = full, ≤0 = clipping
      clipPct: clippedFraction(amplified.map((x) => clip(x))) * 100,
    };
  }, [gainDb]);

  // Time view: a few cycles of the amplified, clipped waveform (flat tops once it hits the rails).
  const wave = useMemo(() => applyGainSignal(INPUT.slice(0, 96), gainDb), [gainDb]);

  const clipping = clipPct > 0.1;
  const buried = headroom > 14; // peak below ~1/5 of full scale → wasting bits
  const accent = clipping ? colors.alert : colors.signal;
  const state = clipping
    ? 'clipping — too hot'
    : buried
      ? 'buried — too quiet'
      : 'filling the range';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <PlotTitle>
          spectrum{' '}
          <span className="text-text-faint">
            — the tone climbs out of the floor, then clips into spurs
          </span>
        </PlotTitle>
        <SpectrumPlot
          data={spectrum}
          floorDb={FLOOR}
          height={150}
          color={accent}
          yLabel={AXIS.magnitudeDb}
          xLabel={AXIS.normalizedFrequency}
          ariaLabel="Spectrum of the amplified, clipped, and digitized signal"
        />
      </div>

      <div>
        <PlotTitle>
          gained waveform{' '}
          <span className="text-text-faint">— flat tops appear once it hits the rails</span>
        </PlotTitle>
        <TimeSeriesPlot
          series={[{ color: accent, samples: wave }]}
          yDomain={[-1.1, 1.1]}
          height={110}
          yLabel={AXIS.amplitude}
          xLabel={AXIS.time}
          ariaLabel="Amplified waveform, clipping flat at the rails when the gain is too high"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <Readout
          label="Input gain"
          value={`${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(0)} dB`}
          accent
        />
        <Readout
          label="Headroom"
          value={Number.isFinite(headroom) ? `${headroom.toFixed(1)} dB` : '∞'}
          accent
        />
        <div
          className={[
            'readout flex flex-col rounded-md border px-3 py-2 text-xs',
            clipping ? 'border-alert-dim text-alert' : 'border-border',
          ].join(' ')}
        >
          <span className="text-text-faint">Clipping</span>
          <span className={clipping ? '' : 'text-text'}>
            {clipPct < 0.05 ? 'none' : `${clipPct.toFixed(1)}% of samples`}
          </span>
        </div>
        <Readout label="Front end" value={state} accent />
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <Slider
          label="Input gain (the amplifier / AGC)"
          value={gainDb}
          min={-10}
          max={60}
          step={1}
          unit=" dB"
          onChange={(v) => setGainDb(Math.round(v))}
          style={{ minWidth: 300 }}
          ariaLabel="Input gain in decibels"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            too little gain and the signal sits in the bottom bits — quantization noise swamps it
            (the same SNR that sets bit error rates in the noisy-channel module) · too much and it
            clips, splattering harmonics across the band · AGC continuously hunts for the zone
            between
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
