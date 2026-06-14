import { useRef, useState, useEffect } from 'react';
import { AXIS } from '@/components/plots/axisLabel';
import { PhasorPlot } from '@/components/plots/PhasorPlot';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { useAnimationFrame } from '@/components/plots/useAnimationFrame';
import { colors } from '@/design/tokens';
import { useToneAudio } from '@/audio/useToneAudio';

const WINDOW_SAMPLES = 240; // points in the scrolling I/Q waveforms
const MIN_F = 0.2;
const MAX_F = 4.0;

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

/**
 * The rotating phasor / IQ module (brief §4, Layer 0) — the first vertical slice.
 *
 * Shows one tone three ways at once: a rotating vector on the complex plane, the I and Q
 * sinusoids scrolling in time, and (optionally) as audible sound. Drag the frequency slider and
 * watch all three respond together — the live-feedback loop that is the soul of the project (§1).
 */
export function PhasorModule() {
  const [frequency, setFrequency] = useState(1.0);
  const [playing, setPlaying] = useState(false);
  const [running, setRunning] = useState(true); // phasor rotation (pause/resume)
  const [frame, setFrame] = useState<Frame>(() => ({
    angle: 0,
    i: prefill(Math.cos, 1.0, 0),
    q: prefill(Math.sin, 1.0, 0),
  }));

  // Accumulate phase across frames so changing frequency never makes the phasor jump.
  const phaseRef = useRef(0);
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

  const toggleAudio = () => {
    if (playing) {
      audio.stop();
      setPlaying(false);
    } else {
      audio.start(toAudioHz(frequency));
      setPlaying(true);
    }
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
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Frequency</span>
            <span className="text-signal">{frequency.toFixed(1)} Hz</span>
          </span>
          <input
            type="range"
            min={MIN_F}
            max={MAX_F}
            step={0.1}
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label="Frequency in hertz"
          />
          <span className="readout text-xs text-text-faint">
            period = {period.toFixed(2)} s · {(frequency * 360).toFixed(0)}°/s
          </span>
        </label>

        <button
          onClick={() => setRunning((r) => !r)}
          aria-pressed={!running}
          className="rounded-md border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-signal-dim hover:text-signal"
        >
          {running ? '⏸ Pause' : '▶ Resume'}
        </button>

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
      </div>
    </div>
  );
}
