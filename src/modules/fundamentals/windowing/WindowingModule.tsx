import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { AXIS } from '@/components/plots/axisLabel';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';
import { windowFn, type WindowName } from '@/dsp/window';

const N = 256;
const TONE = 10.3; // cycles across the window — deliberately off-bin, so leakage shows

const WINDOWS: WindowName[] = ['rectangular', 'hann', 'hamming', 'blackman'];

/**
 * Windowing & spectral leakage (brief §7, Track D Layer 0). A finite block has hard edges that smear
 * a tone's energy across the spectrum. Tapering with a window trades a wider mainlobe (less
 * resolution) for lower sidelobes (less leakage). The reason a filter bank needs a designed window.
 */
export function WindowingModule() {
  const [win, setWin] = useState<WindowName>('hann');

  const { shape, spectrum } = useMemo(() => {
    const tone: Complex[] = Array.from({ length: N }, (_, n) => ({
      re: Math.cos((2 * Math.PI * TONE * n) / N),
      im: Math.sin((2 * Math.PI * TONE * n) / N),
    }));
    return { shape: windowFn(win, N), spectrum: magnitudeSpectrumDb(tone, win) };
  }, [win]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {WINDOWS.map((wname) => (
          <button
            key={wname}
            type="button"
            aria-pressed={wname === win}
            onClick={() => setWin(wname)}
            className={[
              'readout rounded-md border px-3 py-1 text-xs capitalize transition-colors',
              wname === win
                ? 'border-signal-dim text-signal'
                : 'border-border text-text-muted hover:border-signal-dim',
            ].join(' ')}
          >
            {wname}
          </button>
        ))}
      </div>

      <div>
        <p className="readout mb-1 text-xs text-text-muted">window shape (the taper applied)</p>
        <TimeSeriesPlot
          series={[{ color: colors.cyan, samples: shape }]}
          height={90}
          yDomain={[0, 1.05]}
          yLabel={AXIS.amplitude}
          xLabel={AXIS.sample}
          ariaLabel={`${win} window shape`}
        />
      </div>
      <div>
        <p className="readout mb-1 text-xs text-text-muted">
          spectrum of an off-bin tone through this window
        </p>
        <SpectrumPlot
          data={spectrum}
          height={180}
          yLabel={AXIS.magnitudeDb}
          xLabel={AXIS.normalizedFrequency}
          ariaLabel={`${win} window spectral leakage`}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            rectangular = the no-op window: narrowest peak but tall sidelobes that leak everywhere ·
            Hann/Hamming/Blackman taper the edges → the peak widens but the sidelobes drop, so a
            weak tone next door isn&rsquo;t buried · that tradeoff is mainlobe width vs. sidelobe
            level
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
