import { useCallback, useRef, useState, useEffect } from 'react';
import { Slider } from '@/components/Slider';
import { AXIS } from '@/components/plots/axisLabel';
import { PhasorPlot } from '@/components/plots/PhasorPlot';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { useAnimationFrame } from '@/components/plots/useAnimationFrame';
import {
  usePrefersReducedMotion,
  useReducedMotionPlayState,
} from '@/components/plots/usePrefersReducedMotion';
import { colors } from '@/design/tokens';
import { DesktopAudioControl } from '@/audio/DesktopAudioControl';
import { useToneAudio } from '@/audio/useToneAudio';

const WINDOW_SAMPLES = 240; // points in the scrolling I/Q waveforms
const MIN_F = 0.2;
const MAX_F = 4.0;

// Where the phasor rests when motion is reduced: a representative mid-rotation instant — not the
// degenerate θ=0 start — so the arrow, both I/Q waveforms, and the I/Q/θ readouts all read the
// concept at a glance. cos and sin are both ≈0.707 here, so neither rail reads as zero.
const REST_ANGLE = Math.PI / 4;

/** Map the visual frequency (Hz) to an audible pitch so frequency changes are hearable. */
const toAudioHz = (f: number) => 110 * Math.pow(2, f); // 0.2..4 Hz → ~126..1760 Hz

interface Frame {
  angle: number;
  i: number[];
  q: number[];
}

/** Pre-fill a waveform window ending at the current phase, so the plot reads full immediately. */
const prefill = (fn: (angle: number) => number, frequency: number, endPhase: number) => {
  const dt = 1 / 60; // nominal frame time
  return Array.from({ length: WINDOW_SAMPLES }, (_, k) =>
    fn(endPhase - 2 * Math.PI * frequency * (WINDOW_SAMPLES - 1 - k) * dt)
  );
};

/** A full static frame — phasor angle plus prefilled I/Q windows — at a given frequency and phase. */
const staticFrame = (frequency: number, angle: number): Frame => ({
  angle,
  i: prefill(Math.cos, frequency, angle),
  q: prefill(Math.sin, frequency, angle),
});

/**
 * The rotating phasor / IQ module (brief §4, Layer 0) — the first vertical slice.
 *
 * Shows one tone three ways at once: a rotating vector on the complex plane, the I and Q
 * sinusoids scrolling in time, and (optionally) as audible sound. Drag the frequency slider and
 * watch all three respond together — the live-feedback loop that is the soul of the project (§1).
 */
export function PhasorModule() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [frequency, setFrequency] = useState(1.0);
  const [playing, setPlaying] = useState(false);
  // Auto-rotate on arrival — the "this is alive" cue — unless the user prefers reduced motion, in
  // which case start paused on a static frame (and pause live if it's enabled mid-session); Resume
  // opts back into motion.
  const [running, setRunning] = useReducedMotionPlayState(prefersReducedMotion); // phasor rotation
  const startAngle = prefersReducedMotion ? REST_ANGLE : 0;
  const [frame, setFrame] = useState<Frame>(() => staticFrame(frequency, startAngle));

  // Accumulate phase across frames so changing frequency never makes the phasor jump. Seed it at the
  // resting angle so a Resume from the static frame continues smoothly rather than snapping to 0.
  const phaseRef = useRef(startAngle);
  const iBuf = useRef<number[]>(frame.i.slice());
  const qBuf = useRef<number[]>(frame.q.slice());
  const freqRef = useRef(frequency);
  useEffect(() => {
    freqRef.current = frequency;
  }, [frequency]);

  const audio = useToneAudio();

  useAnimationFrame((_elapsed, dt) => {
    // Advance the accumulated angle by 2π·f·dt.
    phaseRef.current = (phaseRef.current + 2 * Math.PI * freqRef.current * dt) % (2 * Math.PI);
    const angle = phaseRef.current;
    // Push the current I/Q value and scroll the window.
    iBuf.current.push(Math.cos(angle));
    iBuf.current.shift();
    qBuf.current.push(Math.sin(angle));
    qBuf.current.shift();
    setFrame({ angle, i: [...iBuf.current], q: [...qBuf.current] });
  }, running);

  // Keep the audio pitch in sync while playing.
  useEffect(() => {
    if (playing) audio.setFrequency(toAudioHz(frequency));
  }, [frequency, playing, audio]);

  const stopAudio = useCallback(() => {
    audio.stop();
    setPlaying(false);
  }, [audio]);

  const toggleAudio = () => {
    if (playing) {
      stopAudio();
    } else {
      audio.start(toAudioHz(frequency));
      setPlaying(true);
    }
  };

  // While paused (e.g. the reduced-motion default) the animation loop isn't running to redraw the
  // I/Q windows, so refresh the static frame here — otherwise the plots would keep their old waveform
  // beside an updated period/Hz readout. While running, the loop already tracks the new frequency.
  const handleFrequency = (f: number) => {
    setFrequency(f);
    if (running) return;
    const next = staticFrame(f, phaseRef.current);
    iBuf.current = next.i.slice();
    qBuf.current = next.q.slice();
    setFrame(next);
  };

  const period = 1 / frequency;
  const angleDeg = ((frame.angle * 180) / Math.PI + 360) % 360;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        {/* The rotating phasor on the complex plane. */}
        <div className="flex flex-col items-center gap-2">
          <PhasorPlot angle={frame.angle} size={300} />
          <div className="readout flex gap-4 text-xs text-text-muted">
            <span>
              I <span className="text-cyan">{Math.cos(frame.angle).toFixed(3)}</span>
            </span>
            <span>
              Q <span className="text-cyan">{Math.sin(frame.angle).toFixed(3)}</span>
            </span>
            <span>
              θ <span className="text-signal">{angleDeg.toFixed(0)}°</span>
            </span>
          </div>
        </div>

        {/* The same tone as I(t) and Q(t) over time. */}
        <div className="flex min-w-[280px] flex-1 flex-col gap-4">
          <div>
            <PlotTitle>
              I(t) = cos(2π·f·t) <span className="text-text-faint">— in-phase</span>
            </PlotTitle>
            <TimeSeriesPlot
              series={[{ color: colors.signal, samples: frame.i }]}
              yDomain={[-1.1, 1.1]}
              height={120}
              yLabel={AXIS.amplitude}
              xLabel={AXIS.time}
              ariaLabel="In-phase component I(t) over time"
            />
          </div>
          <div>
            <PlotTitle>
              Q(t) = sin(2π·f·t) <span className="text-text-faint">— quadrature</span>
            </PlotTitle>
            <TimeSeriesPlot
              series={[{ color: colors.cyan, samples: frame.q }]}
              yDomain={[-1.1, 1.1]}
              height={120}
              yLabel={AXIS.amplitude}
              xLabel={AXIS.time}
              ariaLabel="Quadrature component Q(t) over time"
            />
          </div>
        </div>
      </div>

      {/* Controls — direct manipulation over forms (brief §3.3). */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Slider
            label="Frequency"
            value={frequency}
            min={MIN_F}
            max={MAX_F}
            step={0.1}
            decimals={1}
            unit=" Hz"
            onChange={handleFrequency}
            ariaLabel="Frequency in hertz"
          />
          <span className="readout text-xs text-text-faint">
            period = {period.toFixed(2)} s · {(frequency * 360).toFixed(0)}°/s
          </span>
        </div>

        <button
          onClick={() => setRunning((r) => !r)}
          aria-pressed={!running}
          className="rounded-md border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-signal-dim hover:text-signal"
        >
          {running ? '⏸ Pause' : '▶ Resume'}
        </button>

        <DesktopAudioControl onSuppress={stopAudio}>
          <button
            onClick={toggleAudio}
            aria-pressed={playing}
            className={[
              'rounded-md border px-4 py-2 text-sm transition-colors',
              playing
                ? 'border-signal-dim bg-signal-dim/20 text-signal'
                : 'border-border text-text-muted hover:border-signal-dim hover:text-signal',
            ].join(' ')}
          >
            {playing ? '◼ Stop tone' : '▶ Hear it'}
          </button>
        </DesktopAudioControl>
      </div>
    </div>
  );
}
