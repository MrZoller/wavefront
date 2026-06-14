import { useState } from 'react';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { aliasedFrequency } from '@/dsp/sampling';

const PERIODS = 12; // sample instants shown
const OS = 40; // oversampling for the "continuous" curve

/**
 * Sampling & aliasing (brief §7, Track D Layer 0). Sampling only sees a signal at the tick marks, so
 * a tone above the Nyquist rate (½ the sample rate) is indistinguishable from a slower one — the
 * wagon-wheel effect. Sweep the frequency past 0.5 and watch a fast tone masquerade as a slow one.
 */
export function AliasingModule() {
  const [freq, setFreq] = useState(0.3); // cycles per sample

  const apparent = aliasedFrequency(freq, 1);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const xOf = (t: number) => (t / PERIODS) * w;
      const yOf = (v: number) => h / 2 - v * (h / 2 - 10);

      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // True continuous tone (faint).
      ctx.strokeStyle = colors.cyanDim;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let i = 0; i <= PERIODS * OS; i++) {
        const t = i / OS;
        const x = xOf(t);
        const y = yOf(Math.cos(2 * Math.PI * freq * t));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Aliased reconstruction — the slow tone the samples imply. For a cosine,
      // cos(2π·f·k) = cos(2π·apparent·k) at every integer sample, so this passes through every dot.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= PERIODS * OS; i++) {
        const t = i / OS;
        const x = xOf(t);
        const y = yOf(Math.cos(2 * Math.PI * apparent * t));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Sample instants.
      ctx.fillStyle = colors.alert;
      for (let k = 0; k <= PERIODS; k++) {
        ctx.beginPath();
        ctx.arc(xOf(k), yOf(Math.cos(2 * Math.PI * freq * k)), 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [freq, apparent]
  );

  const aliased = freq > 0.5;

  return (
    <div className="flex flex-col gap-5">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 220 }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label="A continuous tone, its samples, and the aliased low-frequency reconstruction"
      />

      <div className="flex flex-wrap gap-4">
        <Readout label="Signal frequency" value={`${freq.toFixed(2)} cyc/sample`} />
        <Readout label="Nyquist limit" value="0.50 cyc/sample" />
        <Readout
          label="Apparent frequency"
          value={`${apparent.toFixed(2)} cyc/sample`}
          accent={aliased}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 240 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Signal frequency</span>
            <span className="text-signal">{freq.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.02}
            max={1.5}
            step={0.02}
            value={freq}
            onChange={(e) => setFreq(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label="Signal frequency in cycles per sample"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-[10px] text-text-faint">
          faint cyan = the true tone · red dots = the samples (all the receiver gets) · green = the
          slowest tone that fits those dots · below 0.5 they match; above 0.5 the green
          &ldquo;alias&rdquo; is slower than the truth — the fast tone is gone
        </p>
      </div>
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-alert' : 'text-text'}>{value}</span>
    </div>
  );
}
