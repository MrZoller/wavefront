import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { fft } from '@/dsp/fft';

const N = 64;
const BINS = [2, 5, 9, 14, 20, 27]; // selectable basis frequencies

/**
 * The DFT as a change of basis (brief §7, Track D Layer 0). The spectrum is just a set of dot
 * products: each bin measures how much of one complex sinusoid is in the signal. Toggle a few basis
 * frequencies on and off and watch them appear in the time waveform and light up their exact bins.
 */
export function DftBasisModule() {
  const [active, setActive] = useState<number[]>([5, 14]);

  const { wave, mags } = useMemo(() => {
    const sig: Complex[] = Array.from({ length: N }, (_, n) => {
      let v = 0;
      for (const k of active) v += Math.cos((2 * Math.PI * k * n) / N);
      return { re: v, im: 0 };
    });
    const X = fft(sig);
    return {
      wave: sig.map((s) => s.re),
      mags: X.slice(0, N / 2 + 1).map((c) => Math.hypot(c.re, c.im)),
    };
  }, [active]);

  const toggle = (k: number) =>
    setActive((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const peak = Math.max(1, ...mags);
      const bw = w / mags.length;
      for (let k = 0; k < mags.length; k++) {
        const bh = (mags[k] / peak) * (h - 6);
        ctx.fillStyle = active.includes(k) ? colors.signal : colors.surfaceRaised;
        ctx.fillRect(k * bw + 1, h - bh, Math.max(1, bw - 2), bh);
      }
    },
    [mags, active]
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <PlotTitle>signal = sum of the chosen sinusoids</PlotTitle>
        <TimeSeriesPlot
          series={[{ color: colors.signal, samples: wave }]}
          height={120}
          yDomain={[-BINS.length, BINS.length]}
          yLabel={AXIS.amplitude}
          xLabel={AXIS.sample}
          ariaLabel="Synthesized time-domain signal (sum of the chosen sinusoids)"
        />
      </div>
      <div>
        <PlotTitle>magnitude spectrum |X[k]| — one bar per bin</PlotTitle>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 150 }}
          className="rounded-md border border-border bg-surface"
          role="img"
          aria-label="DFT magnitude spectrum bars, lit at the chosen basis frequencies"
        />
        <div className="readout mt-1 text-center text-xs text-text-faint">
          Bin index k (0 … N/2)
        </div>
      </div>

      <div>
        <p className="readout mb-1.5 text-xs text-text-faint">
          <GlossedText>
            build a signal by choosing its frequencies (the waveform above is their sum):
          </GlossedText>
        </p>
        <div className="flex flex-wrap gap-2">
          {BINS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={active.includes(k)}
              onClick={() => toggle(k)}
              className={[
                'readout rounded-md border px-3 py-1 text-xs transition-colors',
                active.includes(k)
                  ? 'border-signal-dim text-signal'
                  : 'border-border text-text-muted hover:border-signal-dim',
              ].join(' ')}
            >
              bin {k}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            each spectrum bar is the signal correlated with one sinusoid (a dot product) · add a
            frequency and its bin jumps up; the time waveform is just those sinusoids summed · that
            two-way street is the whole FFT
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
