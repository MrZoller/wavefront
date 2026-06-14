import { useMemo, useState } from 'react';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { colors } from '@/design/tokens';
import { am, fm, pm } from '@/dsp/modulation';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';

const N = 512;
const MSG_CYCLES = 6; // message tone cycles across the window
const SCHEMES = ['AM', 'FM', 'PM'] as const;
type Scheme = (typeof SCHEMES)[number];

/**
 * Analog on-ramp (brief §6). The most relatable entry point a non-EE has: how does a car radio
 * actually work? One message tone, modulated three ways onto a carrier — AM moves the amplitude, FM
 * the frequency, PM the phase — each with a distinct spectrum. Drag the depth and watch sidebands grow.
 */
export function AnalogModule() {
  const [scheme, setScheme] = useState<Scheme>('FM');
  const [depth, setDepth] = useState(0.6);

  const { message, signalI, spectrum } = useMemo(() => {
    const message = Array.from({ length: N }, (_, n) =>
      Math.sin((2 * Math.PI * MSG_CYCLES * n) / N)
    );
    const signal =
      scheme === 'AM'
        ? am(message, depth)
        : scheme === 'FM'
          ? fm(message, depth * 0.08)
          : pm(message, depth * Math.PI);
    return {
      message,
      signalI: signal.slice(0, 256).map((c) => c.re),
      spectrum: magnitudeSpectrumDb(signal, 'hann'),
    };
  }, [scheme, depth]);

  const depthLabel =
    scheme === 'AM'
      ? 'Modulation depth μ'
      : scheme === 'FM'
        ? 'Frequency deviation'
        : 'Phase deviation';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {SCHEMES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === scheme}
            onClick={() => setScheme(s)}
            className={[
              'readout rounded-md border px-3 py-1 text-xs transition-colors',
              s === scheme
                ? 'border-signal-dim text-signal'
                : 'border-border text-text-muted hover:border-signal-dim',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>

      <TimeSeriesPlot
        series={[{ color: colors.cyan, samples: message.slice(0, 256) }]}
        height={90}
        yLabel="message"
      />
      <TimeSeriesPlot
        series={[{ color: colors.signal, samples: signalI }]}
        height={110}
        yDomain={scheme === 'AM' ? [-2, 2] : [-1.2, 1.2]}
        yLabel={`${scheme} signal (I)`}
      />
      <SpectrumPlot data={spectrum} height={150} ariaLabel={`${scheme} spectrum`} />

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 240 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>{depthLabel}</span>
            <span className="text-signal">{depth.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={depth}
            onChange={(e) => setDepth(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label={depthLabel}
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-[10px] text-text-faint">
          AM rides the message on the carrier&rsquo;s amplitude → a carrier line plus two sidebands
          · FM/PM bend the frequency/phase → a fan of sidebands that widens with deviation
          (Carson&rsquo;s rule) while the amplitude stays flat
        </p>
      </div>
    </div>
  );
}
