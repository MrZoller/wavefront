import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { convolve, raisedCosine, upsample } from '@/dsp/pulse';

const SPS = 8; // samples per symbol
const SPAN = 8; // pulse length in symbols
const SYMBOLS = [1, -1, 1, 1, -1, -1, 1, -1]; // a fixed BPSK pattern

/**
 * Pulse shaping (brief §5, Track B). Symbols are instants, but a wire carries a continuous waveform.
 * Each symbol launches a raised-cosine pulse; summed, they form the transmitted signal. The magic:
 * every pulse is zero at every *other* symbol's sampling instant, so the waveform passes exactly
 * through the symbol values — no inter-symbol interference. Roll-off β trades bandwidth for ringing.
 */
export function PulseShapingModule() {
  const [beta, setBeta] = useState(0.35);

  const pulse = raisedCosine(beta, SPAN, SPS);
  const wave = convolve(upsample(SYMBOLS, SPS), pulse);
  const delay = (pulse.length - 1) / 2; // center of the symmetric pulse

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      // Show one symbol of guard either side of the data.
      const first = delay - SPS;
      const last = delay + SYMBOLS.length * SPS;
      const span = last - first;
      const xOf = (i: number) => ((i - first) / span) * w;
      const yOf = (v: number) => h / 2 - (v / 1.6) * (h / 2 - 8);

      // Zero line.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yOf(0));
      ctx.lineTo(w, yOf(0));
      ctx.stroke();

      // Sampling instants (one per symbol) + the symbol value the waveform must hit.
      for (let s = 0; s < SYMBOLS.length; s++) {
        const idx = delay + s * SPS;
        const x = xOf(idx);
        ctx.strokeStyle = colors.surfaceRaised;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Individual scaled pulses (faint), to show how they sum.
      ctx.strokeStyle = colors.cyanDim;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      for (let s = 0; s < SYMBOLS.length; s++) {
        ctx.beginPath();
        for (let i = 0; i < pulse.length; i++) {
          const idx = s * SPS + i;
          const x = xOf(idx);
          const y = yOf(SYMBOLS[s] * pulse[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Composite transmitted waveform.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = Math.max(0, first); i <= Math.min(wave.length - 1, last); i++) {
        const x = xOf(i);
        const y = yOf(wave[i]);
        if (i === Math.max(0, first)) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Symbol sample dots (the waveform passes through these — ISI-free).
      for (let s = 0; s < SYMBOLS.length; s++) {
        const idx = delay + s * SPS;
        ctx.fillStyle = colors.alert;
        ctx.beginPath();
        ctx.arc(xOf(idx), yOf(wave[idx]), 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [beta]
  );

  // −3 dB-ish excess bandwidth indicator: RC occupies (1+β)/2 of the symbol-rate bandwidth each side.
  const bandwidth = (1 + beta) / 2;

  return (
    <div className="flex flex-col gap-6">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 240 }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label="Raised-cosine pulse-shaped waveform passing through the symbol values at each sampling instant"
      />

      <div className="flex flex-wrap items-center gap-6">
        <Slider
          label="Roll-off β"
          value={beta}
          min={0}
          max={1}
          step={0.05}
          decimals={2}
          onChange={setBeta}
          style={{ minWidth: 240 }}
          ariaLabel="Raised-cosine roll-off factor"
        />
        <Readout
          label="Occupied bandwidth"
          value={`${bandwidth.toFixed(2)} × symbol rate`}
          accent
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            green = transmitted waveform · faint cyan = the individual pulse from each symbol · red
            dots = sampling instants, where the waveform equals the symbol exactly · raise β for a
            wider but better-behaved pulse; lower it toward 0 for a narrow band but long, ringing
            tails
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
