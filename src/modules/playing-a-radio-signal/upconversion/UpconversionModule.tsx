import { useMemo, useState } from 'react';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { colors } from '@/design/tokens';
import type { Complex } from '@/dsp/complex';
import { downconvert, lowpass, upconvert } from '@/dsp/carrier';
import { convolve, raisedCosine, upsample } from '@/dsp/pulse';

const SPS = 24; // samples per symbol (= sample rate in symbol-rate units)
const SPAN = 6;
const I_SYMS = [1, -1, 1, 1, -1];
const Q_SYMS = [1, 1, -1, 1, -1];
const S = 1 / Math.SQRT2; // unit-energy QPSK rail amplitude
// Selectable carriers: each divides SPS (so the box low-pass spans whole image periods → exact
// recovery) and stays below Nyquist (SPS/2 = 12) with guard — at fc = 12 the sine rail samples to
// zero and Q would be lost.
const CARRIERS = [2, 3, 4, 6, 8];

/**
 * Up/down-conversion (brief §5, Track B). Baseband I/Q is slow; radios transmit a fast real carrier.
 * The transmitter mixes baseband up — `s = I·cos − Q·sin` — into the single real waveform that goes
 * on the wire; the receiver mixes back down with the same carrier and low-pass filters to recover I
 * and Q unchanged. Pick a carrier frequency and watch the passband tighten while baseband returns.
 */
export function UpconversionModule() {
  const [fc, setFc] = useState(6); // carrier in cycles per symbol

  const { I, Q, passband, recI, recQ } = useMemo(() => {
    const pulse = raisedCosine(0.35, SPAN, SPS);
    const I = convolve(
      upsample(
        I_SYMS.map((s) => s * S),
        SPS
      ),
      pulse
    );
    const Q = convolve(
      upsample(
        Q_SYMS.map((s) => s * S),
        SPS
      ),
      pulse
    );
    const baseband: Complex[] = I.map((re, n) => ({ re, im: Q[n] }));
    const passband = upconvert(baseband, fc, SPS);
    const rec = lowpass(downconvert(passband, fc, SPS), SPS / fc);
    return { I, Q, passband, recI: rec.map((z) => z.re), recQ: rec.map((z) => z.im) };
  }, [fc]);

  return (
    <div className="flex flex-col gap-5">
      <TimeSeriesPlot
        series={[
          { label: 'I', color: colors.signal, samples: I },
          { label: 'Q', color: colors.cyan, samples: Q },
        ]}
        height={120}
        yLabel="baseband I/Q (transmit)"
        xLabel="time"
      />
      <TimeSeriesPlot
        series={[{ label: 'passband', color: colors.trace[2], samples: passband }]}
        height={120}
        yLabel="passband on the wire (I·cos − Q·sin)"
        xLabel="time"
      />
      <TimeSeriesPlot
        series={[
          { label: 'I', color: colors.signal, samples: recI },
          { label: 'Q', color: colors.cyan, samples: recQ },
        ]}
        height={120}
        yLabel="recovered baseband (receive)"
        xLabel="time"
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="readout text-xs text-text-muted">Carrier frequency</span>
        {CARRIERS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === fc}
            onClick={() => setFc(c)}
            className={[
              'readout rounded-md border px-3 py-1 text-xs transition-colors',
              c === fc
                ? 'border-signal-dim text-signal'
                : 'border-border text-text-muted hover:border-signal-dim',
            ].join(' ')}
          >
            {c} cyc/sym
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          top = the I/Q baseband you want to send · middle = the real passband actually radiated (a
          carrier whose amplitude/phase carry I and Q) · bottom = what the receiver recovers after
          mixing down and low-pass filtering — identical to the top, no matter the carrier frequency
        </p>
      </div>
    </div>
  );
}
