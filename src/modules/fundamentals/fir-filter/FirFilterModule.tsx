import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
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
        <PlotTitle>impulse response (the {numTaps} taps)</PlotTitle>
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
        <PlotTitle>frequency response |H(f)|</PlotTitle>
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
        <Slider
          label="Cutoff"
          value={cutoff}
          min={0.05}
          max={0.45}
          step={0.01}
          decimals={2}
          unit=" cyc/sample"
          onChange={setCutoff}
          style={{ minWidth: 220 }}
          ariaLabel="Filter cutoff frequency"
        />
        <Slider
          label="Number of taps"
          value={numTaps}
          min={7}
          max={81}
          step={2}
          onChange={setNumTaps}
          style={{ minWidth: 220 }}
          ariaLabel="Number of filter taps"
        />
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
