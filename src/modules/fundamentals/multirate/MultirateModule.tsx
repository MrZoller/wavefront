import { useMemo, useState } from 'react';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { type Complex } from '@/dsp/complex';
import { decimate } from '@/dsp/multirate';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';

const N = 1024;
const F_LOW = 0.05; // survives decimation
const F_HIGH = 0.22; // above the post-decimation Nyquist for factor ≥ 3 → aliases without the filter

/**
 * Decimation & multirate (brief §7, Track D Layer 1). A narrowband signal doesn't need a high sample
 * rate. Decimating drops samples — but only safely after a low-pass to the new Nyquist, or the
 * out-of-band tone folds back in. Toggle the anti-alias filter and watch the stray tone appear.
 */
export function MultirateModule() {
  const [factor, setFactor] = useState(3);
  const [antiAlias, setAntiAlias] = useState(true);

  const { original, decimated } = useMemo(() => {
    const sig: Complex[] = Array.from({ length: N }, (_, n) => ({
      re: Math.cos(2 * Math.PI * F_LOW * n) + Math.cos(2 * Math.PI * F_HIGH * n),
      im: Math.sin(2 * Math.PI * F_LOW * n) + Math.sin(2 * Math.PI * F_HIGH * n),
    }));
    return {
      original: magnitudeSpectrumDb(sig, 'hann'),
      decimated: magnitudeSpectrumDb(decimate(sig, factor, antiAlias), 'hann'),
    };
  }, [factor, antiAlias]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="readout mb-1 text-xs text-text-muted">
          original spectrum — a wanted tone (near DC) and an out-of-band tone
        </p>
        <SpectrumPlot data={original} height={130} ariaLabel="Original wideband spectrum" />
      </div>
      <div>
        <p className="readout mb-1 text-xs text-text-muted">
          after decimating by {factor} {antiAlias ? '(with anti-alias filter)' : '(no filter)'}
        </p>
        <SpectrumPlot data={decimated} height={130} ariaLabel="Decimated spectrum" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Decimation factor</span>
            <span className="text-signal">÷{factor}</span>
          </span>
          <input
            type="range"
            min={3}
            max={6}
            step={1}
            value={factor}
            onChange={(e) => setFactor(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Decimation factor"
          />
        </label>
        <button
          type="button"
          aria-pressed={antiAlias}
          onClick={() => setAntiAlias((v) => !v)}
          className={[
            'readout rounded-md border px-3 py-1.5 text-xs transition-colors',
            antiAlias ? 'border-signal-dim text-signal' : 'border-alert text-alert',
          ].join(' ')}
        >
          anti-alias filter: {antiAlias ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-[10px] text-text-faint">
          decimating by N keeps only the central 1/N of the band · with the filter ON the
          out-of-band tone is removed first, so the result is clean · turn it OFF and that tone
          folds back in as a false spur — aliasing, exactly as in the sampling module
        </p>
      </div>
    </div>
  );
}
