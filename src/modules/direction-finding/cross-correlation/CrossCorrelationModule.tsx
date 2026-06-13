import { useMemo, useState } from 'react';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { crossCorrelate } from '@/dsp/correlation';
import { bipolarSequence, gaussianNoise } from '@/dsp/random';

const REF_LEN = 16;
const RECV_LEN = 72;
const MAX_LAG = RECV_LEN - REF_LEN; // last full-overlap position

/** Correlation curve over the full-overlap lag range, with peak + scrub markers. */
function CorrelationPlot({
  values,
  peakLag,
  scrubLag,
}: {
  values: number[];
  peakLag: number;
  scrubLag: number;
}) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const n = values.length;
      const maxAbs = Math.max(1e-9, ...values.map(Math.abs));
      const xOf = (lag: number) => (lag / (n - 1)) * w;
      const yOf = (v: number) => h / 2 - (v / maxAbs) * (h / 2 - 6);

      // Zero line.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Scrub marker (where the user is currently sliding).
      ctx.strokeStyle = colors.cyan;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xOf(scrubLag), 0);
      ctx.lineTo(xOf(scrubLag), h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Correlation curve.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xOf(i);
        const y = yOf(values[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Peak marker + dot.
      ctx.fillStyle = colors.signal;
      ctx.beginPath();
      ctx.arc(xOf(peakLag), yOf(values[peakLag]), 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowColor = colors.signal;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    },
    [values, peakLag, scrubLag]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 140 }}
      className="rounded-md border border-border bg-surface"
      role="img"
      aria-label="Cross-correlation versus lag, with the peak marking the detected delay"
    />
  );
}

/**
 * Cross-correlation as a lag finder (brief §4, Layer 0). Slide one noisy copy of a signal past
 * another; the correlation peak reveals the time delay. This sliding dot product is how we
 * measure *when* a signal arrived — the engine of TDOA geolocation.
 */
export function CrossCorrelationModule() {
  const [trueDelay, setTrueDelay] = useState(28);
  const [noise, setNoise] = useState(0.4);
  const [scrubLag, setScrubLag] = useState(12);

  // Fixed reference burst (deterministic so the scene is reproducible).
  const ref = useMemo(() => bipolarSequence(REF_LEN, 7), []);

  // Received record: noise everywhere, with the burst embedded at `trueDelay`.
  const received = useMemo(() => {
    const n = gaussianNoise(RECV_LEN, noise, 1234);
    const out = n.slice();
    for (let i = 0; i < REF_LEN; i++) out[trueDelay + i] += ref[i];
    return out;
  }, [ref, trueDelay, noise]);

  // Correlation over the full-overlap lag range [0, MAX_LAG].
  const corr = useMemo(() => {
    const full = crossCorrelate(ref, received);
    const byLag = new Map(full.lags.map((l, i) => [l, full.values[i]]));
    return Array.from({ length: MAX_LAG + 1 }, (_, lag) => byLag.get(lag) ?? 0);
  }, [ref, received]);

  const detected = corr.indexOf(Math.max(...corr));

  // The reference overlaid at the current scrub position (zeros elsewhere).
  const overlay = useMemo(() => {
    const arr = new Array(RECV_LEN).fill(0);
    for (let i = 0; i < REF_LEN; i++) arr[scrubLag + i] = ref[i];
    return arr;
  }, [ref, scrubLag]);

  const dotAtScrub = corr[scrubLag] ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="readout mb-1 text-xs text-text-muted">
            Reference burst <span className="text-text-faint">— what we&rsquo;re looking for</span>
          </p>
          <TimeSeriesPlot
            series={[{ color: colors.cyan, samples: ref }]}
            yDomain={[-1.3, 1.3]}
            height={80}
          />
        </div>

        <div>
          <p className="readout mb-1 text-xs text-text-muted">
            Received signal{' '}
            <span className="text-text-faint">
              — burst buried in noise (reference overlaid at lag {scrubLag})
            </span>
          </p>
          <TimeSeriesPlot
            series={[
              { color: colors.textMuted, samples: received },
              { color: colors.signal, samples: overlay },
            ]}
            yDomain={[-2, 2]}
            height={120}
          />
        </div>

        <div>
          <p className="readout mb-1 flex justify-between text-xs text-text-muted">
            <span>Cross-correlation (sliding dot product)</span>
            <span className="text-cyan">
              dot @ lag {scrubLag} = {dotAtScrub.toFixed(1)}
            </span>
          </p>
          <CorrelationPlot values={corr} peakLag={detected} scrubLag={scrubLag} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="readout flex flex-col rounded-md border border-signal-dim px-3 py-2 text-xs">
          <span className="text-text-faint">Detected delay (peak)</span>
          <span className="text-signal">{detected} samples</span>
        </div>
        <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
          <span className="text-text-faint">True delay</span>
          <span className={detected === trueDelay ? 'text-signal' : 'text-alert'}>
            {trueDelay} samples {detected === trueDelay ? '✓' : ''}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <label className="flex flex-col gap-1.5">
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Slide the reference (lag)</span>
            <span className="text-cyan">{scrubLag}</span>
          </span>
          <input
            type="range"
            min={0}
            max={MAX_LAG}
            step={1}
            value={scrubLag}
            onChange={(e) => setScrubLag(parseInt(e.target.value, 10))}
            className="accent-[var(--color-cyan)]"
            aria-label="Scrub the reference position"
          />
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="readout flex justify-between text-xs text-text-muted">
              <span>True delay</span>
              <span className="text-signal">{trueDelay}</span>
            </span>
            <input
              type="range"
              min={0}
              max={MAX_LAG}
              step={1}
              value={trueDelay}
              onChange={(e) => setTrueDelay(parseInt(e.target.value, 10))}
              className="accent-[var(--color-signal)]"
              aria-label="True delay applied to the received signal"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="readout flex justify-between text-xs text-text-muted">
              <span>Noise level σ</span>
              <span className="text-signal">{noise.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={noise}
              onChange={(e) => setNoise(parseFloat(e.target.value))}
              className="accent-[var(--color-signal)]"
              aria-label="Noise standard deviation"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
