import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { XYPlot } from '@/components/plots/XYPlot';
import { AXIS } from '@/components/plots/axisLabel';
import { colors } from '@/design/tokens';
import { type Complex, magnitude, sub } from '@/dsp/complex';
import { awgn } from '@/dsp/comms';
import { fftShift } from '@/dsp/fft';
import {
  applyChannelLinear,
  channelFreqResponse,
  estimateChannelLS,
  responseDb,
} from '@/dsp/equalization';
import { mulberry32 } from '@/dsp/random';

const N_RESP = 128; // frequency bins for the response overlay
const EST_TAPS = 4; // we estimate a few taps (the true channel has 2 — the extras should vanish)
const MAX_PILOTS = 200;

// A fixed synthetic two-tap channel with a visible notch near the band edge.
const TRUE_TAPS: Complex[] = [
  { re: 1, im: 0 },
  { re: 0.7, im: 0 },
];

// A long known pilot sequence (QPSK); the module uses a prefix of it.
const PILOTS: Complex[] = (() => {
  const rng = mulberry32(777);
  return Array.from({ length: MAX_PILOTS }, () => ({
    re: (rng() < 0.5 ? -1 : 1) / Math.SQRT2,
    im: (rng() < 0.5 ? -1 : 1) / Math.SQRT2,
  }));
})();

const FREQ_AXIS = Array.from({ length: N_RESP }, (_, i) => -0.5 + i / N_RESP);
const TRUE_RESP = fftShift(responseDb(channelFreqResponse(TRUE_TAPS, N_RESP)));

/**
 * Channel Estimation — you can't undo a channel you haven't measured. The transmitter sends known
 * pilot symbols; the receiver compares received-vs-known and solves a least-squares fit for the
 * channel taps. Raise the pilot count or lower the noise and watch the estimated response
 * (green) lock onto the true one (cyan). This is the measurement the equalizer then inverts.
 */
export function ChannelEstimationModule() {
  const [numPilots, setNumPilots] = useState(24);
  const [noise, setNoise] = useState(0.1);

  const { estResp, tapError, estTaps } = useMemo(() => {
    const pilots = PILOTS.slice(0, numPilots);
    const received = awgn(applyChannelLinear(pilots, TRUE_TAPS), noise, 2718);
    const estTaps = estimateChannelLS(pilots, received, EST_TAPS);
    const estResp = fftShift(responseDb(channelFreqResponse(estTaps, N_RESP)));
    // L2 distance between the estimate and the true taps (zero-padded to the estimate length).
    let err = 0;
    for (let k = 0; k < EST_TAPS; k++) {
      err += magnitude(sub(estTaps[k], TRUE_TAPS[k] ?? { re: 0, im: 0 })) ** 2;
    }
    return { estResp, tapError: Math.sqrt(err), estTaps };
  }, [numPilots, noise]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PlotTitle>Estimated channel response (green) converging to the truth (cyan)</PlotTitle>
        <XYPlot
          series={[
            { x: FREQ_AXIS, y: TRUE_RESP, color: colors.cyan },
            { x: FREQ_AXIS, y: estResp, color: colors.signal },
          ]}
          xDomain={[-0.5, 0.5]}
          yDomain={[-30, 10]}
          height={210}
          xLabel={AXIS.normalizedFrequency}
          yLabel={{ quantity: 'Channel response |H(f)|', unit: 'dB' }}
          ariaLabel="Estimated channel frequency response overlaid on the true response"
        />
        <p className="readout mt-1 text-xs text-text-faint">
          <span style={{ color: colors.cyan }}>— true H(f)</span>
          {'   '}
          <span style={{ color: colors.signal }}>— estimate Ĥ(f)</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <Slider
          label="Pilot symbols"
          value={numPilots}
          min={4}
          max={MAX_PILOTS}
          step={1}
          onChange={(v) => setNumPilots(Math.round(v))}
          ariaLabel="Number of known pilot symbols"
        />
        <Slider
          label="Noise level (σ)"
          value={noise}
          min={0}
          max={0.5}
          step={0.01}
          decimals={2}
          accent={colors.cyan}
          onChange={setNoise}
          ariaLabel="Channel noise standard deviation"
        />

        <div className="flex flex-wrap gap-4">
          <Readout label="Pilots" value={`${numPilots}`} />
          <Readout label="Estimate error ‖Ĥ − H‖" value={tapError.toFixed(3)} accent />
          <Readout
            label="Estimated taps"
            value={estTaps
              .slice(0, 2)
              .map((t) => t.re.toFixed(2))
              .join(', ')}
          />
          <Readout label="True taps" value={TRUE_TAPS.map((t) => t.re.toFixed(2)).join(', ')} />
        </div>

        <p className="readout text-xs text-text-faint">
          <GlossedText>
            more pilots and less noise average down the estimate error — the green curve snaps onto
            the cyan one, notch and all · measure the channel with known symbols, and now you know
            exactly what the equalizer has to undo · this is the same per-subcarrier estimate OFDM
            leans on
          </GlossedText>
        </p>
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
