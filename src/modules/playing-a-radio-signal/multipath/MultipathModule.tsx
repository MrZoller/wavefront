import { useMemo, useState } from 'react';
import { Term } from '@/components/Term';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { EyeDiagramPlot } from '@/components/plots/EyeDiagramPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { CONSTELLATIONS, bitsToSymbols } from '@/dsp/comms';
import { channelResponseDb, multipath, type Tap } from '@/dsp/channel';
import { convolve, raisedCosine, upsample } from '@/dsp/pulse';
import { mulberry32 } from '@/dsp/random';

const SPS = 8;
const SPAN = 8;
const N_SYM = 200;

const bits = (() => {
  const rng = mulberry32(51);
  return Array.from({ length: N_SYM * 2 }, () => (rng() < 0.5 ? 0 : 1));
})();

/**
 * Multipath & fading (brief §5, Track B Layer 2). The signal reaches the receiver by several paths —
 * a direct ray plus delayed echoes. The copies add up to a frequency-selective channel that notches
 * parts of the band and smears symbols into each other (ISI), closing the eye. Drag the echo's delay
 * and strength and watch the notch move and the constellation blur.
 */
export function MultipathModule() {
  const [delay, setDelay] = useState(5);
  const [gain, setGain] = useState(0.6);

  const { response, scatter, eye } = useMemo(() => {
    const taps: Tap[] = [
      { delay: 0, gain: 1 },
      { delay, gain },
    ];
    const syms = bitsToSymbols(bits, CONSTELLATIONS.QPSK);
    const rc = raisedCosine(0.35, SPAN, SPS);
    const I = convolve(
      upsample(
        syms.map((s) => s.re),
        SPS
      ),
      rc
    );
    const Q = convolve(
      upsample(
        syms.map((s) => s.im),
        SPS
      ),
      rc
    );
    const tx: Complex[] = I.map((re, n) => ({ re, im: Q[n] }));
    const rx = multipath(tx, taps);

    const center = (rc.length - 1) / 2;
    const scatter: ScatterPoint[] = syms.map((_, i) => {
      const c = rx[center + i * SPS] ?? { re: 0, im: 0 };
      return { re: c.re, im: c.im };
    });
    return {
      response: channelResponseDb(taps, 256),
      scatter,
      eye: rx.slice(0, 60 * SPS).map((c) => c.re),
    };
  }, [delay, gain]);

  return (
    <div className="flex flex-col gap-5">
      <XYPlot
        series={[
          {
            x: response.map((_, i) => -0.5 + i / response.length),
            y: response,
            color: colors.signal,
          },
        ]}
        xDomain={[-0.5, 0.5]}
        yDomain={[-40, 10]}
        height={140}
        yLabel="channel response |H(f)| dB"
        xLabel="normalized frequency"
        ariaLabel="Multipath channel frequency response with fading notches"
      />

      <div className="flex flex-wrap items-start gap-6">
        <ConstellationPlot
          ideal={CONSTELLATIONS.QPSK.points}
          scatter={scatter}
          limit={2}
          size={240}
          ariaLabel="QPSK constellation blurred by multipath inter-symbol interference"
        />
        <div className="flex min-w-[260px] flex-1 flex-col gap-4">
          <EyeDiagramPlot
            samples={eye}
            sps={SPS}
            height={130}
            ariaLabel="Eye diagram closing under multipath"
          />
          <label className="flex flex-col gap-1.5">
            <span className="readout flex justify-between text-xs text-text-muted">
              <span>Echo delay</span>
              <span className="text-signal">{delay} samples</span>
            </span>
            <input
              type="range"
              min={1}
              max={16}
              step={1}
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value, 10))}
              className="accent-[var(--color-signal)]"
              aria-label="Echo delay in samples"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="readout flex justify-between text-xs text-text-muted">
              <span>Echo strength</span>
              <span className="text-signal">{gain.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={gain}
              onChange={(e) => setGain(parseFloat(e.target.value))}
              className="accent-[var(--color-signal)]"
              aria-label="Echo strength"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          top = the channel the echo creates — deep notches where the direct and delayed rays cancel
          (frequency-selective fading) · the constellation smears and the eye closes as the echo
          grows · this <Term id="isi">ISI</Term> is exactly what equalizers (and{' '}
          <Term id="ofdm">OFDM</Term>&rsquo;s cyclic prefix) exist to undo
        </p>
      </div>
    </div>
  );
}
