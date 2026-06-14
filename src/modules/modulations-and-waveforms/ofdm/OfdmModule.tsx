import { useMemo, useState } from 'react';
import { Term } from '@/components/Term';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { CONSTELLATIONS, bitsToSymbols } from '@/dsp/comms';
import { ofdmModulate } from '@/dsp/waveforms';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';
import { mulberry32 } from '@/dsp/random';

const N_SUB = 64;
const CP = 16;
const N_OFDM = 6;

const bitsFor = (n: number) => {
  const rng = mulberry32(99);
  return Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
};

/**
 * OFDM (brief §6). Instead of one fast carrier, send many slow QPSK subcarriers in parallel through
 * an IFFT, then guard each symbol with a cyclic prefix. The payoff: a wideband channel that would
 * smear a single carrier becomes many flat per-subcarrier channels, each trivially equalized.
 */
export function OfdmModule() {
  const [active, setActive] = useState(48); // number of occupied subcarriers (centered)

  const { signal, subSymbols, spectrum } = useMemo(() => {
    const bits = bitsFor(active * 2 * N_OFDM);
    const qpsk = bitsToSymbols(bits, CONSTELLATIONS.QPSK);
    // Occupy the low-frequency bins around DC (which sit at the center after fftShift) and leave the
    // band edges (around Nyquist) empty as guard — so the displayed spectrum is a centered block.
    const halfLo = Math.ceil(active / 2);
    const halfHi = Math.floor(active / 2);
    const data: Complex[] = [];
    let s = 0;
    for (let sym = 0; sym < N_OFDM; sym++) {
      for (let k = 0; k < N_SUB; k++) {
        const isActive = k < halfLo || k >= N_SUB - halfHi;
        data.push(isActive ? qpsk[s++] : { re: 0, im: 0 });
      }
    }
    const { signal } = ofdmModulate(data, N_SUB, CP);
    return {
      signal,
      subSymbols: qpsk.slice(0, active).map((z) => ({ re: z.re, im: z.im }) as ScatterPoint),
      spectrum: magnitudeSpectrumDb(signal, 'hann'),
    };
  }, [active]);

  return (
    <div className="flex flex-col gap-5">
      <SpectrumPlot data={spectrum} height={150} ariaLabel="OFDM occupied-band spectrum" />
      <TimeSeriesPlot
        series={[{ color: colors.signal, samples: signal.slice(0, 320).map((c) => c.re) }]}
        height={110}
        yDomain={[-0.6, 0.6]}
        yLabel="OFDM time waveform (I)"
      />

      <div className="flex flex-wrap items-start gap-6">
        <ConstellationPlot
          ideal={CONSTELLATIONS.QPSK.points}
          scatter={subSymbols}
          limit={1.8}
          size={220}
          ariaLabel="QPSK symbols carried on the OFDM subcarriers"
        />
        <div className="flex min-w-[240px] flex-1 flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="readout flex justify-between text-xs text-text-muted">
              <span>Active subcarriers</span>
              <span className="text-signal">
                {active} / {N_SUB}
              </span>
            </span>
            <input
              type="range"
              min={8}
              max={N_SUB}
              step={4}
              value={active}
              onChange={(e) => setActive(parseInt(e.target.value, 10))}
              className="accent-[var(--color-signal)]"
              aria-label="Number of active OFDM subcarriers"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <Readout label="Subcarriers" value={`${N_SUB} (QPSK)`} />
            <Readout label="Cyclic prefix" value={`${CP} samples`} accent />
          </div>
          <p className="readout text-xs text-text-faint">
            the spectrum is a flat block of {active} occupied subcarriers (guard bands at the edges)
            · the time waveform looks noise-like — the sum of many independent tones · each
            subcarrier carries an ordinary <Term id="qpsk">QPSK</Term> symbol
          </p>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
