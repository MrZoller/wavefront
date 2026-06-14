import { useMemo, useState } from 'react';
import { Term } from '@/components/Term';
import { SpectrogramPlot } from '@/components/plots/SpectrogramPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { colors } from '@/design/tokens';
import { chirp } from '@/dsp/waveforms';
import { spectrogram } from '@/dsp/spectrum';

const N = 1024;

/**
 * Chirp / LFM (brief §6, focused stub). A tone whose frequency sweeps linearly — its spectrogram is
 * a clean diagonal. Wider sweeps spread energy over more bandwidth, the key to pulse compression:
 * a long low-power chirp correlates to a sharp peak at the receiver.
 */
export function ChirpModule() {
  const [bw, setBw] = useState(0.3); // sweep half-width in cycles/sample

  const { sgram, wave } = useMemo(() => {
    const c = chirp(N, -bw, bw);
    return { sgram: spectrogram(c, 64, 16, 'hann'), wave: c.slice(0, 256).map((s) => s.re) };
  }, [bw]);

  return (
    <div className="flex flex-col gap-5">
      <SpectrogramPlot
        data={sgram}
        height={200}
        ariaLabel="Chirp spectrogram showing the swept-frequency diagonal"
      />
      <TimeSeriesPlot
        series={[{ color: colors.signal, samples: wave }]}
        height={110}
        yLabel="chirp waveform (I) — note the rising frequency"
      />

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 240 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Sweep bandwidth</span>
            <span className="text-signal">±{bw.toFixed(2)} cyc/sample</span>
          </span>
          <input
            type="range"
            min={0.05}
            max={0.45}
            step={0.05}
            value={bw}
            onChange={(e) => setBw(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label="Chirp sweep bandwidth"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          the spectrogram diagonal is the frequency climbing with time · a wider sweep covers more
          bandwidth, which (after <Term id="matched-filter">matched filtering</Term>) compresses to
          a sharper, stronger pulse — long and gentle on transmit, sharp on receive
        </p>
      </div>
    </div>
  );
}
