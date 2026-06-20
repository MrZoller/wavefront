import { useMemo, useState } from 'react';
import { ControlRail } from '@/components/ControlRail';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { AcquisitionHeatmap } from '@/components/plots/AcquisitionHeatmap';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import { pnCode, processingGainDb } from '@/dsp/waveforms';
import { prnReceived, acquisitionSurface, acquisitionPeak, codePhaseProfile } from '@/dsp/gps';

const L = 64; // synthetic PRN code length (chips) — the code-phase search extent
const CODE_SEED = 1207; // a fixed synthetic PRN code (no real PRN assignments)
const NOISE_SEED = 2024;
// Coherent integration lengths (powers of two = the Doppler-FFT length). 8 is the shortest kept: a
// 4-period FFT's 4-bin Doppler axis is too coarse for the draggable marker to round-trip a drag —
// its top cell would clamp and collapse the high-Doppler end of the control.
const PERIOD_OPTIONS = [8, 16, 32];
// Fraction of the ±½-cycle/period band the Doppler control sweeps. Held below the coarsest (8-period)
// FFT's edge so the true Doppler the marker draws stays on an interior bin: never the Nyquist bin
// (which fftShift wraps to the opposite row) and never past the top/bottom cell (which the row clamp
// would collapse) — so the green handle and the detected-peak ring stay locked together across the
// whole drag (round(0.36·8) = 3 < 4, and 8·(0.5 + 0.36) = 6.9 < 7).
const DOPPLER_SPAN = 0.36;
const DOPPLER_HZ_MAX = 5000; // illustrative Hz at full deflection (real GPS Doppler is a few kHz)
const FLOOR_DB = -20; // display range — the acquired peak rides ~20–30 dB over the noise once integrated

/** The Doppler control (−1…+1) → its continuous row on the fftShifted Doppler axis (DC at the centre). */
const dopplerRow = (control: number, periods: number) => periods * (0.5 + DOPPLER_SPAN * control);

/**
 * GPS Acquisition — the synthesis scene. GPS is three things the learner already built — spread
 * spectrum, correlation, and multilateration — plus one genuinely new idea: receiving a signal that
 * sits *below the noise floor*, and reading *range* off the correlation peak's position. Each satellite
 * repeats a known PRN spreading code; the received samples are that code delayed by a code phase (the
 * pseudorange) and Doppler-shifted, buried in noise at negative SNR. Correlating against the known code
 * applies the spread-spectrum processing gain in reverse and lifts a peak out of the noise; you know
 * neither the code phase nor the Doppler, so acquisition searches both at once — a code-phase × Doppler
 * surface, the sibling of the radar range-Doppler map. All units are synthetic and illustrative; this
 * is the open civilian signal only.
 */
export function GpsAcquisitionModule() {
  const [codePhase, setCodePhase] = useState(21);
  const [dopplerControl, setDopplerControl] = useState(0.28); // −1 … +1 (relative velocity / satellite)
  const [snrDb, setSnrDb] = useState(-10); // negative ⇒ the signal is genuinely below the noise
  const [periodIdx, setPeriodIdx] = useState(1); // → PERIOD_OPTIONS[periodIdx] (16 periods)

  const periods = PERIOD_OPTIONS[periodIdx];
  const doppler = (DOPPLER_SPAN * dopplerControl) / L; // cycles/sample
  // Reuse the Spread Spectrum module's PRN generator for a fixed synthetic code (stable across renders).
  const code = useMemo(() => pnCode(L, CODE_SEED), []);
  const gainDb = processingGainDb(L * periods); // despread (L) × coherent integration (periods)

  const { surface, peak, profile, rxWave } = useMemo(() => {
    const received = prnReceived(code, { codePhase, doppler, snrDb, periods, seed: NOISE_SEED });
    const surface = acquisitionSurface(received, code, periods);
    return {
      surface,
      peak: acquisitionPeak(surface),
      profile: codePhaseProfile(received, code, doppler, periods),
      rxWave: received.slice(0, 2 * L).map((s) => s.re), // first two code periods, in-phase rail
    };
  }, [code, codePhase, doppler, snrDb, periods]);

  const profileMax = Math.max(1e-6, ...profile);
  const acquired = peak.codePhase === codePhase;
  const dopplerHz = Math.round(dopplerControl * DOPPLER_HZ_MAX);

  return (
    <div className="flex flex-col gap-6">
      {/* The hook: the signal is below the noise. The known code vs. the received samples (just noise). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <PlotTitle>
            known PRN code <span className="text-text-faint">— what the satellite repeats</span>
          </PlotTitle>
          <TimeSeriesPlot
            series={[{ color: colors.cyan, samples: code }]}
            height={100}
            yLabel={AXIS.amplitude}
            xLabel={{ quantity: 'Chip' }}
            ariaLabel="The known PRN spreading code, one period of ±1 chips"
          />
        </div>
        <div>
          <PlotTitle>
            received samples{' '}
            <span className="text-text-faint">— the signal is buried below the noise</span>
          </PlotTitle>
          <TimeSeriesPlot
            series={[{ color: colors.signal, samples: rxWave }]}
            height={100}
            yLabel={AXIS.amplitude}
            xLabel={{ quantity: 'Sample' }}
            ariaLabel="Received samples, in-phase rail — visually indistinguishable from noise"
          />
        </div>
      </div>

      {/* Correlate against the known code: a sharp peak emerges, and WHERE it peaks is the pseudorange. */}
      <div>
        <PlotTitle>
          correlate against the known code{' '}
          <span className="text-text-faint">— the despread peak, and its position is a range</span>
        </PlotTitle>
        <XYPlot
          series={[{ x: profile.map((_, i) => i), y: profile, color: colors.signal }]}
          xDomain={[0, L - 1]}
          yDomain={[0, profileMax * 1.1]}
          marker={{ x: peak.codePhase, y: profile[peak.codePhase], color: colors.signal }}
          height={130}
          xLabel={{ quantity: 'Code phase', unit: 'chips' }}
          yLabel={{ quantity: 'Correlation magnitude' }}
          ariaLabel="Code-phase correlation, with the peak marking the detected code phase (the pseudorange)"
        />
      </div>

      {/* Live readouts (kept above the map so the marquee sits directly over the pinned controls). */}
      <div className="flex flex-wrap gap-4">
        <Readout label="Code phase → pseudorange" value={`${codePhase} chips`} accent />
        <Readout
          label="Doppler (illustrative)"
          value={`${dopplerHz > 0 ? '+' : ''}${dopplerHz} Hz`}
          accent
        />
        <Readout label="SNR" value={`${snrDb} dB`} accent />
        <Readout label="Processing gain" value={`${gainDb.toFixed(1)} dB`} />
        <Readout
          label="Detected code phase"
          value={`${peak.codePhase} chips${acquired ? ' ✓' : ''}`}
        />
      </div>

      {/* The marquee, placed last so it sits directly above the pinned control rail — drag the true
          target (or the sliders) and watch the peak move, or sink into the noise. */}
      <div>
        <PlotTitle>
          acquisition search{' '}
          <span className="text-text-faint">— code phase × Doppler, both unknown at once</span>
        </PlotTitle>
        <AcquisitionHeatmap
          data={surface}
          floorDb={FLOOR_DB}
          height={240}
          xLabel={{ quantity: 'Code phase', unit: 'chips' }}
          yLabel={{ quantity: 'Doppler' }}
          marker={{
            col: codePhase,
            row: Math.max(0, Math.min(periods - 1, dopplerRow(dopplerControl, periods))),
          }}
          peak={{ col: peak.codePhase, row: peak.dopplerBin }}
          markerLabel="true code phase and Doppler"
          onMarkerDrag={(col, row) => {
            setCodePhase(Math.round(col));
            const control = (row / periods - 0.5) / DOPPLER_SPAN;
            setDopplerControl(Math.max(-1, Math.min(1, control)));
          }}
          ariaLabel="GPS acquisition surface — code phase across, Doppler up, a bright peak where the buried signal is acquired; drag the green true-target handle, or focus it and use the arrow keys"
        />
      </div>

      {/* Controls — pinned in a rail so they stay co-visible with the acquisition map while the plots
          above scroll (the drag-watch loop the app is built on). */}
      <ControlRail>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6">
            <Slider
              label="True code phase"
              value={codePhase}
              min={0}
              max={L - 1}
              step={1}
              display={`${codePhase} chips`}
              onChange={setCodePhase}
              ariaLabel="True code phase in chips (the signal's delay, which reads out as range)"
            />
            <Slider
              label="Doppler (which satellite)"
              value={dopplerControl}
              min={-1}
              max={1}
              step={0.05}
              decimals={2}
              onChange={setDopplerControl}
              ariaLabel="Doppler / relative velocity (which satellite is being searched for)"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Slider
              label="SNR"
              value={snrDb}
              min={-25}
              max={5}
              step={1}
              unit=" dB"
              onChange={setSnrDb}
              ariaLabel="Signal-to-noise ratio in decibels (drive it negative to bury the signal)"
            />
            <Slider
              label="Integration (code periods)"
              value={periodIdx}
              min={0}
              max={PERIOD_OPTIONS.length - 1}
              step={1}
              display={`${periods} periods`}
              onChange={setPeriodIdx}
              ariaLabel="Coherent integration length in code periods (longer ⇒ more processing gain)"
            />
          </div>
          <span className="readout text-xs text-text-faint">
            <GlossedText>
              each satellite repeats a known PRN code · the received samples are that code delayed
              by a code phase (its travel time → a pseudorange) and Doppler-shifted, buried below
              the noise · correlating against the code lifts a peak out by the processing gain, and
              acquisition searches code phase × Doppler at once — drag the true target and watch the
              peak track it, then drop the SNR or shorten the integration and watch it sink. Four
              acquired satellites fix a position by multilateration — the geometry from the GDOP
              Heatmap and TDOA Multilateration modules. Open civilian signal; values illustrative.
            </GlossedText>
          </span>
        </div>
      </ControlRail>
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
