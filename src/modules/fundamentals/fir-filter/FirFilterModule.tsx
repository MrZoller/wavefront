import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { AXIS } from '@/components/plots/axisLabel';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import { firLowpass, firResponseDb } from '@/dsp/filter';

/**
 * FIR filtering (brief §7, Track D Layer 1). A filter is just an array of tap weights slid along the
 * signal (a dot product at every step). The taps ARE the impulse response, and their Fourier
 * transform is the frequency response — the same object in two domains. Tune the cutoff and length.
 */
export function FirFilterModule() {
  const [cutoff, setCutoff] = useState(0.15);
  const [numTaps, setNumTaps] = useState(41);

  const { taps, response } = useMemo(() => {
    const taps = firLowpass(cutoff, numTaps);
    return { taps, response: firResponseDb(taps, 256) };
  }, [cutoff, numTaps]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="readout mb-1 text-xs text-text-muted">
          impulse response (the {numTaps} taps)
        </p>
        <TimeSeriesPlot
          series={[{ color: colors.cyan, samples: taps }]}
          height={110}
          yDomain={[-Math.max(...taps) * 0.5, Math.max(...taps) * 1.1]}
          yLabel={{ quantity: 'Tap weight h[n]' }}
          xLabel={AXIS.sample}
          ariaLabel="FIR impulse response (filter taps)"
        />
      </div>
      <div>
        <p className="readout mb-1 text-xs text-text-muted">frequency response |H(f)|</p>
        <XYPlot
          series={[
            {
              x: response.map((_, i) => -0.5 + i / response.length),
              y: response,
              color: colors.signal,
            },
          ]}
          xDomain={[-0.5, 0.5]}
          yDomain={[-90, 5]}
          marker={{ x: cutoff, y: -6, color: colors.alert }}
          height={160}
          yLabel={{ quantity: 'Magnitude |H(f)|', unit: 'dB' }}
          xLabel={AXIS.normalizedFrequency}
          ariaLabel="FIR low-pass frequency response"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Cutoff</span>
            <span className="text-signal">{cutoff.toFixed(2)} cyc/sample</span>
          </span>
          <input
            type="range"
            min={0.05}
            max={0.45}
            step={0.01}
            value={cutoff}
            onChange={(e) => setCutoff(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label="Filter cutoff frequency"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Number of taps</span>
            <span className="text-signal">{numTaps}</span>
          </span>
          <input
            type="range"
            min={7}
            max={81}
            step={2}
            value={numTaps}
            onChange={(e) => setNumTaps(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Number of filter taps"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            the taps are a windowed sinc — narrow them (lower cutoff) and the sinc stretches out ·
            more taps = a sharper transition and deeper stopband, but more compute · the red dot
            marks the −6 dB cutoff
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
