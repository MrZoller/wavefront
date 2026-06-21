import { useEffect, useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotFrame } from '@/components/plots/PlotFrame';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { useCanvas } from '@/components/plots/useCanvas';
import { Slider } from '@/components/Slider';
import { DesktopAudioControl } from '@/audio/DesktopAudioControl';
import { useSampleLoop } from '@/audio/useSampleLoop';
import { colors } from '@/design/tokens';
import { complex } from '@/dsp/complex';
import { idealSqnrDb, levels, quantize, quantizeSignal, sqnrDb } from '@/dsp/quantization';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';

const AMP = 0.9; // input amplitude as a fraction of full scale
const SPEC_N = 512; // samples analyzed for the spectrum
const SPEC_CYCLES = 12; // bin-centered tone → a clean spike
const TIME_CYCLES = 3;
const TIME_N = 60; // shown samples (sample-and-hold staircase)
const SPEC_FLOOR = -100;

/**
 * Quantization & ADC bit depth (Track F — the analog/digital boundary). An ADC rounds each sample to
 * one of 2^N levels; the discarded remainder is quantization noise. Drag the bit depth and watch the
 * staircase coarsen in time, the noise floor rise in the spectrum, and the dynamic range fall — this
 * is where the IQ samples every other track consumes are born.
 */
export function QuantizationModule() {
  const [bits, setBits] = useState(4);
  const [dither, setDither] = useState(false);
  const audio = useSampleLoop();

  // Spectrum signal: a bin-centered tone, quantized → a spike plus the quantization noise floor.
  const { spectrum, measuredSqnr } = useMemo(() => {
    const clean = Array.from(
      { length: SPEC_N },
      (_, n) => AMP * Math.sin((2 * Math.PI * SPEC_CYCLES * n) / SPEC_N)
    );
    const q = quantizeSignal(clean, bits, { dither });
    return {
      spectrum: magnitudeSpectrumDb(
        q.map((v) => complex(v)),
        'hann',
        SPEC_FLOOR
      ),
      measuredSqnr: sqnrDb(clean, q),
    };
  }, [bits, dither]);

  // Time view: a few cycles, quantized, drawn as a sample-and-hold staircase over the smooth input.
  const staircase = useMemo(
    () =>
      Array.from({ length: TIME_N }, (_, i) =>
        quantize(AMP * Math.sin((2 * Math.PI * TIME_CYCLES * i) / TIME_N), bits, { dither })
      ),
    [bits, dither]
  );

  const timeRef = useCanvas(
    (ctx, w, h) => {
      const yOf = (v: number) => h / 2 - v * (h / 2 - 8);

      // Quantization levels — drawn only while few enough to read as discrete steps.
      if (bits <= 4) {
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        const L = levels(bits);
        for (let k = 0; k <= L; k++) {
          const y = yOf(-1 + (2 * k) / L);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // The smooth continuous input (what the converter sees).
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const t = i / 240;
        const x = t * w;
        const y = yOf(AMP * Math.sin(2 * Math.PI * TIME_CYCLES * t));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // The quantized output — a crisp staircase on the levels.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      const xw = w / staircase.length;
      ctx.beginPath();
      for (let i = 0; i < staircase.length; i++) {
        const y = yOf(staircase[i]);
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * xw, y);
        ctx.lineTo((i + 1) * xw, y);
      }
      ctx.stroke();
    },
    [staircase, bits]
  );

  // Hear the quantized tone; while it's playing, track bit depth / dither live.
  const renderTone = (sampleRate: number) => {
    const f = 330;
    const len = Math.round((sampleRate / f) * 60); // whole periods → seamless loop
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = quantize(0.7 * Math.sin((2 * Math.PI * f * i) / sampleRate), bits, { dither });
    }
    return out;
  };
  useEffect(() => {
    if (audio.playing) audio.play(renderTone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bits, dither]);

  const idealDb = idealSqnrDb(bits);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <PlotTitle>
          input vs. {bits}-bit quantized output{' '}
          <span className="text-text-faint">— the staircase the ADC actually stores</span>
        </PlotTitle>
        <PlotFrame xLabel={AXIS.time} yLabel={AXIS.amplitude}>
          <canvas
            ref={timeRef}
            style={{ width: '100%', height: 150 }}
            className="rounded-md border border-border bg-surface"
            role="img"
            aria-label="Smooth input signal and its quantized staircase output over time"
          />
        </PlotFrame>
      </div>

      <div>
        <PlotTitle>
          spectrum{' '}
          <span className="text-text-faint">— the tone sits above a quantization-noise floor</span>
        </PlotTitle>
        <SpectrumPlot
          data={spectrum}
          floorDb={SPEC_FLOOR}
          height={140}
          yLabel={AXIS.magnitudeDb}
          xLabel={AXIS.normalizedFrequency}
          ariaLabel="Spectrum of the quantized tone, showing the quantization noise floor"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <Readout label="Levels" value={`${levels(bits).toLocaleString()} (${bits}-bit)`} />
        <Readout label="SQNR (ideal)" value={`${idealDb.toFixed(1)} dB`} accent />
        <Readout
          label="Measured SQNR"
          value={Number.isFinite(measuredSqnr) ? `${measuredSqnr.toFixed(1)} dB` : '∞'}
          accent
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <Slider
          label="ADC bit depth"
          value={bits}
          min={2}
          max={16}
          step={1}
          display={`${bits} bit`}
          onChange={(v) => setBits(Math.round(v))}
          style={{ minWidth: 240 }}
          ariaLabel="ADC bit depth in bits"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={dither}
            onClick={() => setDither((d) => !d)}
            className={[
              'readout cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors',
              dither
                ? 'border-signal-dim bg-surface-raised text-signal'
                : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
            ].join(' ')}
          >
            dither {dither ? 'on' : 'off'}
          </button>
          <DesktopAudioControl onSuppress={audio.stop}>
            <button
              type="button"
              aria-pressed={audio.playing}
              onClick={() => (audio.playing ? audio.stop() : audio.play(renderTone))}
              className={[
                'readout cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors',
                audio.playing
                  ? 'border-signal-dim bg-surface-raised text-signal'
                  : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
              ].join(' ')}
            >
              {audio.playing ? '◼ stop' : '► hear it'}
            </button>
          </DesktopAudioControl>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            each added bit halves the quantization step → drops the noise floor ≈6 dB → buys one
            more bit of dynamic range (ideal SQNR ≈ 6.02·N + 1.76 dB) · dither trades a slightly
            higher floor for no harmonic spurs at low bit depths
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
