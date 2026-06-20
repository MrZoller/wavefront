import { useMemo, useRef, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { ConstellationPlot, type ScatterPoint } from '@/components/plots/ConstellationPlot';
import { EyeDiagramPlot } from '@/components/plots/EyeDiagramPlot';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TapStemPlot } from '@/components/plots/TapStemPlot';
import { XYPlot } from '@/components/plots/XYPlot';
import { AXIS } from '@/components/plots/axisLabel';
import { useAnimationFrame } from '@/components/plots/useAnimationFrame';
import { usePrefersReducedMotion } from '@/components/plots/usePrefersReducedMotion';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import {
  CONSTELLATIONS,
  awgn,
  bitsToSymbols,
  nearestSymbol,
  type Constellation,
} from '@/dsp/comms';
import { applyChannelCircular, equalize, evm, lmsEqualizer, type EqMode } from '@/dsp/equalization';
import { convolve, raisedCosine, upsample } from '@/dsp/pulse';
import { mulberry32 } from '@/dsp/random';

const N_SYM = 256; // power of two — the FFT block the frequency-domain equalizer inverts
const SPS = 8;
const NOISE_SIGMA = 0.04;
const SNR_LINEAR = 1 / (2 * NOISE_SIGMA * NOISE_SIGMA);
const EYE_SYMS = 48;
const RC = raisedCosine(0.35, 8, SPS);
const RC_CENTER = (RC.length - 1) / 2;
const SCHEMES = [CONSTELLATIONS.BPSK, CONSTELLATIONS.QPSK, CONSTELLATIONS.QAM16];

const LMS_TAPS = 9;
const LMS_MU = 0.08;
const LMS_EPOCHS = 3;
const LMS_FRAME_DT = 1 / 30; // step ~30 iterations/second in the live view

type EqChoice = 'off' | EqMode;
const EQ_CHOICES: { id: EqChoice; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'zf', label: 'Zero-forcing' },
  { id: 'mmse', label: 'MMSE' },
];

/** Fold the I-rail of a symbol stream into a pulse-shaped waveform window for the eye diagram. */
function eyeWaveform(symbols: Complex[]): number[] {
  const shaped = convolve(
    upsample(
      symbols.map((s) => s.re),
      SPS
    ),
    RC
  );
  return shaped.slice(RC_CENTER, RC_CENTER + EYE_SYMS * SPS);
}

/**
 * Equalization — the capstone of the Coding & Equalization track. A two-tap multipath channel smears
 * symbols together (inter-symbol interference): the constellation blurs into streaks and the eye
 * closes. Switch the equalizer on and it inverts the channel — the clusters **snap back** to clean
 * points and the eye reopens. Zero-forcing inverts exactly (but amplifies noise in the channel's
 * nulls); MMSE balances. "Go deeper" reveals a from-scratch adaptive LMS equalizer learning the
 * inverse live, tap by tap.
 */
export function EqualizationModule() {
  const [scheme, setScheme] = useState<Constellation>(CONSTELLATIONS.QPSK);
  const [severity, setSeverity] = useState(0.5);
  const [eqChoice, setEqChoice] = useState<EqChoice>('zf');
  const [showLms, setShowLms] = useState(false);

  const baseBits = useMemo(() => {
    const rng = mulberry32(2025);
    return Array.from({ length: N_SYM * 4 }, () => (rng() < 0.5 ? 0 : 1));
  }, []);

  const tx = useMemo(
    () => bitsToSymbols(baseBits.slice(0, N_SYM * scheme.bitsPerSymbol), scheme),
    [baseBits, scheme]
  );

  const { rx, taps } = useMemo(() => {
    const taps: Complex[] = [
      { re: 1, im: 0 },
      { re: severity, im: 0 },
    ];
    return { taps, rx: awgn(applyChannelCircular(tx, taps), NOISE_SIGMA, 4242) };
  }, [tx, severity]);

  const eqOut = useMemo(
    () => (eqChoice === 'off' ? rx : equalize(rx, taps, eqChoice, SNR_LINEAR)),
    [rx, taps, eqChoice]
  );

  // Channel output: the distorted cloud (the problem). Equalizer output: colored by whether each
  // symbol now slices back to the right point (green) or not (red) — the snap-back made legible.
  const channelScatter: ScatterPoint[] = rx.map((z) => ({
    re: z.re,
    im: z.im,
    color: colors.cyan,
  }));
  const eqScatter: ScatterPoint[] = eqOut.map((z, i) => ({
    re: z.re,
    im: z.im,
    color: nearestSymbol(z, scheme) === nearestSymbol(tx[i], scheme) ? colors.signal : colors.alert,
  }));

  const evmBefore = evm(rx, tx);
  const evmAfter = evm(eqOut, tx);
  const eyeBefore = useMemo(() => eyeWaveform(rx), [rx]);
  const eyeAfter = useMemo(() => eyeWaveform(eqOut), [eqOut]);

  return (
    <div className="flex flex-col gap-6">
      {/* The marquee: distorted → snapped, with the eye closing → reopening alongside. */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <PlotTitle>Channel output — smeared by multipath (ISI)</PlotTitle>
          <ConstellationPlot
            ideal={scheme.points}
            scatter={channelScatter}
            limit={2}
            size={260}
            ariaLabel="Constellation smeared by multipath inter-symbol interference"
          />
          <EyeDiagramPlot
            samples={eyeBefore}
            sps={SPS}
            height={120}
            color={colors.cyan}
            xLabel={{ quantity: 'Time (two symbols)' }}
            yLabel={AXIS.amplitude}
            ariaLabel="Eye diagram closed by inter-symbol interference"
          />
        </div>

        <div className="flex flex-col gap-2">
          <PlotTitle>
            {eqChoice === 'off' ? 'Equalizer output — bypassed' : 'Equalizer output — snapped back'}
          </PlotTitle>
          <ConstellationPlot
            ideal={scheme.points}
            scatter={eqScatter}
            limit={2}
            size={260}
            ariaLabel={
              eqChoice === 'off'
                ? 'Constellation with the equalizer bypassed, still smeared'
                : 'Constellation re-clustered after equalization'
            }
          />
          <EyeDiagramPlot
            samples={eyeAfter}
            sps={SPS}
            height={120}
            color={eqChoice === 'off' ? colors.cyan : colors.signal}
            xLabel={{ quantity: 'Time (two symbols)' }}
            yLabel={AXIS.amplitude}
            ariaLabel={
              eqChoice === 'off'
                ? 'Eye diagram still closed'
                : 'Eye diagram reopened by equalization'
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="readout text-xs text-text-faint">modulation:</span>
          {SCHEMES.map((s) => (
            <Chip key={s.name} selected={s.name === scheme.name} onClick={() => setScheme(s)}>
              {s.name}
            </Chip>
          ))}
          <span className="readout ml-3 text-xs text-text-faint">equalizer:</span>
          {EQ_CHOICES.map((c) => (
            <Chip key={c.id} selected={c.id === eqChoice} onClick={() => setEqChoice(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>

        <Slider
          label="Channel severity (echo strength)"
          value={severity}
          min={0}
          max={0.8}
          step={0.05}
          decimals={2}
          onChange={setSeverity}
          ariaLabel="Multipath echo strength"
        />

        <div className="flex flex-wrap gap-4">
          <Readout label="EVM — channel output" value={`${(evmBefore * 100).toFixed(1)}%`} />
          <Readout
            label="EVM — equalizer output"
            value={`${(evmAfter * 100).toFixed(1)}%`}
            accent
          />
        </div>

        <p className="readout text-xs text-text-faint">
          <GlossedText>
            the echo notches the channel and bleeds symbols together (ISI) — the constellation
            streaks and the eye shuts · the equalizer inverts the channel and the points snap back ·
            push the echo toward 0.8 with zero-forcing and watch noise blow up in the deep notch —
            then switch to MMSE, which backs off there
          </GlossedText>
        </p>
      </div>

      {/* Progressive disclosure: the real-DSP adaptive equalizer. */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowLms((v) => !v)}
          aria-expanded={showLms}
          className="self-start rounded-md border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-signal-dim hover:text-signal"
        >
          {showLms ? 'Hide the adaptive equalizer' : 'Go deeper: watch an adaptive equalizer learn'}
        </button>

        {/* Keyed on the run so a new channel/scheme remounts the view and restarts the animation. */}
        {showLms && (
          <LmsView key={`${scheme.name}:${severity}`} rx={rx} tx={tx} severity={severity} />
        )}
      </div>
    </div>
  );
}

/** The "go deeper" adaptive-equalizer view: an LMS run animated tap-by-tap, plus the ML throughline. */
function LmsView({ rx, tx, severity }: { rx: Complex[]; tx: Complex[]; severity: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lms = useMemo(() => {
    const run = lmsEqualizer(rx, tx, LMS_TAPS, LMS_MU, { epochs: LMS_EPOCHS });
    // Smooth the noisy instantaneous error into a readable convergence curve.
    const win = 12;
    const smooth = run.history.map((_, i) => {
      let s = 0;
      let c = 0;
      for (let j = Math.max(0, i - win); j <= i; j++, c++) s += run.history[j].errorSq;
      return s / c;
    });
    const stride = Math.max(1, Math.floor(run.history.length / 100));
    const frames: { weights: number[]; error: number }[] = [];
    for (let i = 0; i < run.history.length; i += stride) {
      frames.push({ weights: run.history[i].weights.map((c) => c.re), error: smooth[i] });
    }
    frames.push({ weights: run.weights.map((c) => c.re), error: smooth[smooth.length - 1] });
    const target = Array.from({ length: LMS_TAPS }, (_, k) => (-severity) ** k); // 1/(1 + g·z⁻¹)
    return { frames, target, errorMax: Math.max(...frames.map((f) => f.error)) };
  }, [rx, tx, severity]);

  // Normally the run plays from the start on reveal. Under reduced motion, rest on the *converged*
  // frame (taps learned onto the target rings, error fallen) — the informative end state — paused,
  // so the still shows the payoff; Reset replays the convergence for anyone who wants the motion.
  const [step, setStep] = useState(prefersReducedMotion ? lms.frames.length - 1 : 0);
  const [playing, setPlaying] = useState(!prefersReducedMotion);
  const accRef = useRef(0);

  useAnimationFrame((_, dt) => {
    accRef.current += dt;
    if (accRef.current < LMS_FRAME_DT) return;
    accRef.current = 0;
    setStep((s) => Math.min(s + 1, lms.frames.length - 1));
  }, playing);

  const atEnd = step >= lms.frames.length - 1;
  const frame = lms.frames[Math.min(step, lms.frames.length - 1)];

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">
        <GlossedText>
          An <strong>LMS</strong> equalizer doesn&rsquo;t need the channel handed to it — it starts
          from nothing and adjusts its tap weights one step at a time, nudging each one downhill on
          its own error. Watch the taps climb toward the channel inverse (hollow rings) as the error
          falls.
        </GlossedText>
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <PlotTitle>Tap weights — learning the inverse</PlotTitle>
          <TapStemPlot
            weights={frame.weights}
            target={lms.target}
            height={150}
            xLabel={{ quantity: 'Tap index' }}
            yLabel={{ quantity: 'Weight' }}
            ariaLabel="Adaptive equalizer tap weights converging toward the channel inverse"
          />
        </div>
        <div>
          <PlotTitle>Error — falling per iteration</PlotTitle>
          <XYPlot
            series={[
              {
                x: lms.frames.slice(0, step + 1).map((_, i) => i),
                y: lms.frames.slice(0, step + 1).map((f) => f.error),
                color: colors.signal,
              },
            ]}
            xDomain={[0, lms.frames.length - 1]}
            yDomain={[0, lms.errorMax || 1]}
            marker={{ x: step, y: frame.error }}
            height={150}
            xLabel={{ quantity: 'Training iteration' }}
            yLabel={{ quantity: 'Mean squared error' }}
            ariaLabel="Adaptive equalizer mean squared error falling across training iterations"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip selected={playing && !atEnd} onClick={() => setPlaying((p) => !p)}>
          {playing && !atEnd ? 'Pause' : 'Play'}
        </Chip>
        <Chip
          selected={false}
          onClick={() => {
            setStep(0);
            setPlaying(true);
            accRef.current = 0;
          }}
        >
          Reset
        </Chip>
        <span className="readout text-xs text-text-faint">
          iteration {step} / {lms.frames.length - 1}
          {atEnd ? ' · converged' : ''}
        </span>
      </div>

      <div className="rounded-md border border-signal-dim/40 bg-surface-raised p-3">
        <h3 className="mb-1 text-sm font-medium text-text">This is where you&rsquo;d plug in ML</h3>
        <p className="text-xs text-text-muted">
          <GlossedText>
            That update rule — step the weights downhill on the error — is gradient descent. The LMS
            equalizer is the linear ancestor of a <em>learned</em> one: swap its handful of taps for
            a neural network trained on the same error signal and you have a neural equalizer. Where
            classical equalizers strain — nonlinear distortion, channels too messy to model, joint
            estimate-and-equalize — is exactly where learned receivers are an active research
            frontier. It&rsquo;s the same move the Modulation Classifier makes: hand-crafted
            features give way to learned ones.
          </GlossedText>
        </p>
      </div>
    </div>
  );
}

function Chip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
        selected
          ? 'border-signal-dim bg-surface-raised text-signal'
          : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
      ].join(' ')}
    >
      {children}
    </button>
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
