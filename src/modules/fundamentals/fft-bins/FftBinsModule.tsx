import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { PlotFrame } from '@/components/plots/PlotFrame';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors, withAlpha } from '@/design/tokens';
import {
  binSpacing,
  frequencyResolution,
  nextPow2,
  oneSidedBinFreqs,
  paddedMagnitudeSpectrum,
  prominentPeakCount,
  toneCapture,
} from '@/dsp/binning';

/**
 * FFT Bins & Zero-Padding (Fundamentals, "Sampling & the Frequency Domain"). The star is the
 * bin-count knob: zero-pad the same capture up to N_fft and the spectrum redraws with more and more
 * dots, smoothing a coarse/blocky curve into the true sinc shape — *more pixels, same picture*. The
 * twist (two close tones) is that more dots never split a merged blob; only a longer capture, which
 * adds real resolution (≈ fs/N_real), can. Rectangular window throughout — the taper tradeoff is the
 * separate Windowing & Leakage lesson.
 */

const FS = 1000; // an illustrative sample rate (Hz), so bin spacing and resolution read as real numbers
const ONE_TONE = [200];
const TWO_TONES = [200, 230]; // a close pair, 30 Hz apart
const ONE_TONE_CAPTURE = 16; // fixed short capture for the one-tone scene, so its bin sweep stays coarse→smooth
const TRUE_NFFT = 4096; // the underlying spectrum, sampled finely enough to read as a continuous curve

export function FftBinsModule() {
  const [scene, setScene] = useState<'one' | 'two'>('one');
  const [nReal, setNReal] = useState(16); // captured (real) samples — the resolution knob (two-tone scene)
  const [binExp, setBinExp] = useState(5); // FFT size = 2^binExp — the bin-count knob (the star)

  const tones = scene === 'two' ? TWO_TONES : ONE_TONE;
  const captureN = scene === 'two' ? nReal : ONE_TONE_CAPTURE;
  // You can't transform fewer points than you captured, so the smallest FFT is nextPow2(captureN).
  // The bin knob floors here, and the slider's min tracks it (below) — so the displayed bin count is
  // always the size actually transformed, never a smaller number the floor has quietly overridden.
  const floorExp = Math.log2(nextPow2(captureN));
  const binExpEff = Math.max(binExp, floorExp);
  const nFft = 2 ** binExpEff;

  // The underlying spectrum (the "photograph") depends only on the capture, not the bin count.
  const { trueMags, truePeak, resolvable } = useMemo(() => {
    const mags = paddedMagnitudeSpectrum(toneCapture(tones, captureN, FS), TRUE_NFFT);
    return {
      trueMags: mags,
      truePeak: Math.max(...mags),
      resolvable: prominentPeakCount(mags),
    };
  }, [tones, captureN]);

  // The chosen bins: the same capture sampled at N_fft points — the dots laid on the curve.
  const stems = useMemo(() => {
    const mags = paddedMagnitudeSpectrum(toneCapture(tones, captureN, FS), nFft);
    return { mags, freqs: oneSidedBinFreqs(nFft, FS) };
  }, [tones, captureN, nFft]);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const padTop = 12;
      const baseline = h - 6;
      const xOf = (freq: number) => (freq / (FS / 2)) * w;
      const yOf = (m: number) => baseline - (m / truePeak) * (baseline - padTop);

      // Baseline.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      ctx.lineTo(w, baseline);
      ctx.stroke();

      // The underlying spectrum — the fixed curve the bins sample (faint cyan, like the "true tone"
      // in Sampling & Aliasing). It does not move when you change the bin count.
      ctx.strokeStyle = colors.cyanDim;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      const tn = trueMags.length;
      for (let i = 0; i < tn; i++) {
        const x = (i / (tn - 1)) * w;
        const y = yOf(trueMags[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // The live bins: a stem + dot at each sampled point. Few dots → coarse/blocky; many dots →
      // they fill in onto the curve. Green because the bin knob (the live control) drives them.
      const slot = w / stems.mags.length;
      const dotR = Math.max(1, Math.min(3.5, slot * 0.45));
      ctx.strokeStyle = withAlpha(colors.signal, 0.5);
      ctx.fillStyle = colors.signal;
      ctx.lineWidth = 1;
      for (let k = 0; k < stems.mags.length; k++) {
        const x = xOf(stems.freqs[k]);
        const y = yOf(stems.mags[k]);
        ctx.beginPath();
        ctx.moveTo(x, baseline);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [trueMags, truePeak, stems, nFft]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {(
          [
            ['one', 'One tone'],
            ['two', 'Two close tones'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={scene === key}
            onClick={() => setScene(key)}
            className={[
              'readout rounded-md border px-3 py-1 text-xs transition-colors',
              scene === key
                ? 'border-signal-dim bg-surface-raised text-signal'
                : 'border-border text-text-muted hover:border-signal-dim',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <PlotTitle>
          spectrum of the capture — the curve is fixed; the green dots are the bins
        </PlotTitle>
        <PlotFrame
          xLabel={{ quantity: 'Frequency', unit: 'Hz' }}
          yLabel={{ quantity: 'Magnitude' }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 240 }}
            className="rounded-md border border-border bg-surface"
            role="img"
            aria-label="Magnitude spectrum: a fixed underlying curve sampled by the chosen number of FFT bins, shown as stems with dots"
          />
        </PlotFrame>
      </div>

      <div className="flex flex-wrap gap-4">
        <Readout label="FFT size" value={`${nFft} bins`} live />
        <Readout
          label="Bin spacing (fs / N)"
          value={`${binSpacing(FS, nFft).toFixed(1)} Hz`}
          live
        />
        {scene === 'two' && (
          <>
            <Readout
              label="Resolution ≈ fs / Nreal"
              value={`${frequencyResolution(FS, captureN).toFixed(1)} Hz`}
              live
            />
            <Readout label="Tones distinguishable" value={resolvable === 2 ? '2' : '1'} live />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Slider
          label="FFT bins (zero-pad to)"
          value={binExpEff}
          min={floorExp}
          max={11}
          step={1}
          onChange={setBinExp}
          display={`${nFft} bins`}
          ariaLabel="Number of FFT bins (a power of two)"
        />
        {/* Capture lengths 16 → 40 → 64: each sits clearly on one side of the fs/N_real ≈ 30 Hz
            threshold, skipping the crossing near 32 samples where a rectangular window resolves a
            hair early and the count would briefly disagree with the displayed resolution. */}
        {scene === 'two' && (
          <Slider
            label="Capture length (real samples)"
            value={nReal}
            min={16}
            max={64}
            step={24}
            onChange={setNReal}
            display={`${nReal} samples`}
            accent={colors.cyan}
            ariaLabel="Capture length in real samples"
          />
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          {scene === 'one' ? (
            <GlossedText>
              faint cyan = the true spectrum of this capture · green dots = the FFT bins · drag{' '}
              <span className="text-signal">FFT bins</span> up and the same curve fills in with more
              dots — smoother, not different. Zero-padding resamples the picture; it adds no new
              detail. The ripples around the peak are leakage from the bare (rectangular) block —
              the Windowing &amp; Leakage lesson.
            </GlossedText>
          ) : (
            <GlossedText>
              two tones 30 Hz apart, merged into one blob. Crank{' '}
              <span className="text-signal">FFT bins</span> to the max — still one blob; more dots
              can&rsquo;t split it. Now grow the <span className="text-cyan">capture length</span>{' '}
              and the blob splits in two. Resolution rode in with the data, not the bins — bin
              spacing can shrink forever while the resolution (≈ fs / Nreal) stays put. A transform
              can&rsquo;t be smaller than its capture, so a longer capture raises the bin
              slider&rsquo;s floor.
            </GlossedText>
          )}
        </p>
      </div>
    </div>
  );
}

function Readout({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={live ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
