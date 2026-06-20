import { useMemo, useState } from 'react';
import { ControlRail } from '@/components/ControlRail';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { colors } from '@/design/tokens';
import { chirp } from '@/dsp/waveforms';
import {
  CRITICAL_FREQ_DAY_MHZ,
  CRITICAL_FREQ_NIGHT_MHZ,
  echoDelaySecondsForHeight,
  type IonoLayer,
  ionogramTrace,
  LAYER_PEAK_HEIGHT_KM,
  LAYER_SEMI_THICKNESS_KM,
  mufMHz,
  reflectsVertical,
  virtualHeightKm,
} from '@/propagation';

const SWEEP_START_MHZ = 1; // the sounder's lowest probe frequency (illustrative)
const SWEEP_STOP_MHZ = 12; // its highest — comfortably above day/night foF2
const SWEEP_STEPS = 260; // sweep resolution for the assembled trace
const DISPLAY_CEILING_KM = 650; // drop the runaway tail above this (the trace cap)
const Y_TOP_KM = 720; // ionogram y-axis top (ground at 0, height climbing up)
const PING_LEN = 20; // length of the chirp "ping" wavelet (samples)
const PING_AXIS = 280; // single-ping time-axis length (samples)

/** Lay a pulse into a buffer at a sample offset, scaled by `amp` (clipped to the buffer). */
function layPulse(buf: number[], pulse: number[], offset: number, amp: number): void {
  for (let i = 0; i < pulse.length; i++) {
    const k = offset + i;
    if (k >= 0 && k < buf.length) buf[k] += amp * pulse[i];
  }
}

/**
 * The Ionosonde & the Ionogram — the synthesis scene. An ionosonde is **echo-delay radar pointed
 * straight up**: ping the sky, time the echo, and the round-trip delay is a virtual height
 * (`h' = c·t/2`, the radar ranging primitive aimed upward). Sweep the probe frequency and the heights
 * trace out the **ionogram**, which climbs and then cuts off at the **critical frequency** `foF2` —
 * the cutoff the HF Skywave scene only asserts. The secant law then turns that foF2 into the MUF for
 * an oblique path. Everything is illustrative: a single layer, stand-in critical frequencies, no real
 * ionosphere model.
 */
export function IonosondeModule() {
  const [criticalMHz, setCriticalMHz] = useState(CRITICAL_FREQ_DAY_MHZ);
  const [probeMHz, setProbeMHz] = useState(6.5);
  const [peakHeightKm, setPeakHeightKm] = useState(LAYER_PEAK_HEIGHT_KM);
  const [phiDeg, setPhiDeg] = useState(45);

  // All derived from the primitive state, in one memo (the chirp ping + reflection model are cheap,
  // and a single primitive-keyed memo keeps the React Compiler happy — see the range-Doppler scene).
  const { trace, probeReflects, probeHeight, probeDelayMs, muf, pingWave, showMarker } =
    useMemo(() => {
      const layer: IonoLayer = {
        criticalFreqMHz: criticalMHz,
        peakHeightKm,
        semiThicknessKm: LAYER_SEMI_THICKNESS_KM,
      };
      const trace = ionogramTrace(layer, {
        startMHz: SWEEP_START_MHZ,
        stopMHz: SWEEP_STOP_MHZ,
        steps: SWEEP_STEPS,
        maxHeightKm: DISPLAY_CEILING_KM,
      });
      const probeReflects = reflectsVertical(probeMHz, criticalMHz);
      const probeHeight = virtualHeightKm(probeMHz, layer); // null when it penetrates
      const probeDelayMs =
        probeHeight == null ? null : echoDelaySecondsForHeight(probeHeight) * 1000;
      const muf = mufMHz(criticalMHz, phiDeg);

      // The single ping: the transmitted chirp at t≈0, then its echo at the round-trip delay (or none,
      // if the wave penetrated). The delay axis spans heights 0…Y_TOP_KM so it reads against the ionogram.
      const ping = chirp(PING_LEN, -0.35, 0.35).map((c) => c.re);
      const pingWave = new Array<number>(PING_AXIS).fill(0);
      layPulse(pingWave, ping, 0, 1); // transmitted ping
      if (probeReflects && probeHeight != null) {
        const maxDelay = echoDelaySecondsForHeight(Y_TOP_KM);
        const frac = Math.min(1, echoDelaySecondsForHeight(probeHeight) / maxDelay);
        layPulse(pingWave, ping, Math.round(frac * (PING_AXIS - 1)) - PING_LEN / 2, 0.6); // echo
      }

      return {
        trace,
        probeReflects,
        probeHeight,
        probeDelayMs,
        muf,
        pingWave,
        showMarker: probeReflects && probeHeight != null && probeHeight <= Y_TOP_KM,
      };
    }, [criticalMHz, peakHeightKm, probeMHz, phiDeg]);

  return (
    <div className="flex flex-col gap-6">
      {/* Single ping: echo delay → height. The radar echo-delay view, aimed at the sky. */}
      <div>
        <PlotTitle>
          single ping{' '}
          <span className="text-text-faint">
            —{' '}
            {probeReflects
              ? 'echo returns after the round-trip delay'
              : 'no echo — wave penetrated'}
          </span>
        </PlotTitle>
        <TimeSeriesPlot
          series={[{ color: colors.signal, samples: pingWave }]}
          height={110}
          xLabel={{ quantity: 'Round-trip delay', unit: 'ms (illustrative)' }}
          yLabel={{ quantity: 'Amplitude' }}
          ariaLabel={
            probeReflects
              ? 'A sounding ping and its echo returning after the round-trip delay'
              : 'A sounding ping with no echo — the wave penetrated the layer'
          }
        />
      </div>

      {/* Live readouts (green = live), placed above the marquee so they sit over the pinned rail. */}
      <div className="flex flex-wrap gap-3">
        <Readout label="Probe frequency" value={`${probeMHz.toFixed(1)} MHz`} accent />
        <Readout
          label="Virtual height  h′ = c·t/2"
          value={probeHeight == null ? '— (penetrated)' : `${probeHeight.toFixed(0)} km`}
          accent={probeHeight != null}
        />
        <Readout
          label="Echo delay"
          value={probeDelayMs == null ? 'no echo' : `${probeDelayMs.toFixed(2)} ms`}
          accent={probeDelayMs != null}
        />
        <Readout label="Critical frequency  foF2" value={`${criticalMHz.toFixed(1)} MHz`} accent />
        <Readout label="MUF = foF2·sec φ" value={`${muf.toFixed(1)} MHz`} accent />
      </div>

      {/* The marquee — the ionogram. Placed last so it sits directly above the pinned controls: drag
          foF2 and watch the cyan cutoff move and the trace re-cusp against it. */}
      <div>
        <PlotTitle>
          ionogram <span className="text-text-faint">— virtual height vs. swept frequency</span>
        </PlotTitle>
        <XYPlot
          series={[
            {
              x: trace.map((p) => p.freqMHz),
              y: trace.map((p) => p.virtualHeightKm),
              color: colors.signal,
            },
            // The foF2 cutoff: a vertical divider where the echo disappears (the measurement).
            { x: [criticalMHz, criticalMHz], y: [0, Y_TOP_KM], color: colors.cyan },
          ]}
          xDomain={[SWEEP_START_MHZ, SWEEP_STOP_MHZ]}
          yDomain={[0, Y_TOP_KM]}
          marker={showMarker ? { x: probeMHz, y: probeHeight!, color: colors.signal } : undefined}
          height={250}
          xLabel={{ quantity: 'Frequency', unit: 'MHz (illustrative)' }}
          yLabel={{ quantity: 'Virtual height', unit: 'km (illustrative)' }}
          ariaLabel="Ionogram — virtual height versus sweep frequency, the echo trace rising and cutting off at the critical frequency"
        />
        <span className="readout text-xs text-text-faint">
          the trace climbs toward the cyan cutoff and vanishes at foF2 · conceptual — not a real
          ionosphere model · single layer, illustrative critical frequencies · all values synthetic
        </span>
      </div>

      {/* Controls — pinned in the rail so they stay co-visible with the ionogram while it reshapes. */}
      <ControlRail>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="readout text-xs text-text-faint">ionosphere:</span>
            {[
              { label: 'Day', value: CRITICAL_FREQ_DAY_MHZ },
              { label: 'Night', value: CRITICAL_FREQ_NIGHT_MHZ },
            ].map((opt) => {
              const selected = Math.abs(criticalMHz - opt.value) < 0.01;
              return (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCriticalMHz(opt.value)}
                  className={[
                    'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
                    selected
                      ? 'border-signal-dim bg-surface-raised text-signal'
                      : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-6">
            <Slider
              label="Critical frequency (foF2)"
              value={criticalMHz}
              min={2}
              max={11}
              step={0.5}
              unit=" MHz"
              decimals={1}
              onChange={setCriticalMHz}
              ariaLabel="Layer critical frequency foF2 in megahertz"
            />
            <Slider
              label="Probe frequency"
              value={probeMHz}
              min={SWEEP_START_MHZ}
              max={SWEEP_STOP_MHZ}
              step={0.1}
              unit=" MHz"
              decimals={1}
              onChange={setProbeMHz}
              ariaLabel="Single-ping probe frequency in megahertz"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <Slider
              label="Layer peak height"
              value={peakHeightKm}
              min={200}
              max={400}
              step={10}
              unit=" km"
              accent={colors.cyan}
              onChange={(v) => setPeakHeightKm(Math.round(v))}
              ariaLabel="Layer peak height in kilometres"
            />
            <Slider
              label="Oblique path angle  φ"
              value={phiDeg}
              min={0}
              max={80}
              step={5}
              unit="°"
              accent={colors.cyan}
              onChange={setPhiDeg}
              ariaLabel="Oblique path angle of incidence in degrees"
            />
          </div>
          <span className="readout text-xs text-text-faint">
            <GlossedText>
              ping the sky and the echo delay is a virtual height (h′ = c·t/2) · raise the probe
              frequency and the echo climbs, then vanishes at the critical frequency foF2 — that
              cutoff is the measurement · the secant law turns foF2 into the MUF for an oblique
              path, the value the HF Skywave &amp; the Ionosphere scene assumes
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
