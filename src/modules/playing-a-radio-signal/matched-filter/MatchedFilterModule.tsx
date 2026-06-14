import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { noiseSigma } from '@/dsp/comms';
import { convolve, rootRaisedCosine, upsample } from '@/dsp/pulse';
import { bipolarSequence, gaussianNoise } from '@/dsp/random';

const SPS = 8;
const SPAN = 8;
const BETA = 0.35;
const NUM_SYMBOLS = 40;

/**
 * Matched filter (brief §5, Track B). The receiver correlates the noisy waveform against the same
 * root-raised-cosine pulse used to transmit it — the matched filter, which maximizes signal-to-noise
 * at the sampling instant. The eye diagram overlays every symbol period: a wide-open eye means easy,
 * error-free decisions; drop Eb/N0 and watch noise close the eye until bits start flipping.
 */
export function MatchedFilterModule() {
  const [ebN0dB, setEbN0dB] = useState(9);

  const { rxWave, centers, symbols, decisions, ber } = useMemo(() => {
    const rrc = rootRaisedCosine(BETA, SPAN, SPS);
    const M = rrc.length;
    const symbols = bipolarSequence(NUM_SYMBOLS, 7);
    const txWave = convolve(upsample(symbols, SPS), rrc);

    const sigma = noiseSigma(ebN0dB, 1); // per-sample σ ⇒ unit-energy MF output noise σ
    const noise = gaussianNoise(txWave.length, sigma, 4242);
    const noisy = txWave.map((v, i) => v + noise[i]);
    const rxWave = convolve(noisy, rrc); // matched filter

    const delay = M - 1; // TX pulse delay + MF delay
    const centers = symbols.map((_, i) => i * SPS + delay);
    const decisions = centers.map((c) => (rxWave[c] >= 0 ? 1 : -1));
    const errors = decisions.reduce((n, d, i) => n + (d !== symbols[i] ? 1 : 0), 0);
    return { rxWave, centers, symbols, decisions, ber: errors / NUM_SYMBOLS };
  }, [ebN0dB]);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const yOf = (v: number) => h / 2 - (v / 1.9) * (h / 2 - 8);
      const xOf = (frac: number) => frac * w; // frac in [0,1] across a 2-symbol window

      // Center sampling line + zero line.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yOf(0));
      ctx.lineTo(w, yOf(0));
      ctx.stroke();
      ctx.strokeStyle = colors.cyanDim;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xOf(0.5), 0);
      ctx.lineTo(xOf(0.5), h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Overlay one 2-symbol window per interior symbol; red if that symbol was decided wrong.
      ctx.lineWidth = 1;
      for (let i = 1; i < symbols.length - 1; i++) {
        const c = centers[i];
        const ok = decisions[i] === symbols[i];
        ctx.strokeStyle = ok ? colors.signal : colors.alert;
        ctx.globalAlpha = ok ? 0.32 : 0.85;
        ctx.beginPath();
        for (let j = -SPS; j <= SPS; j++) {
          const x = xOf((j + SPS) / (2 * SPS));
          const y = yOf(rxWave[c + j] ?? 0);
          if (j === -SPS) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    [rxWave, centers, symbols, decisions]
  );

  return (
    <div className="flex flex-col gap-6">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 240 }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label={`Eye diagram of the matched-filter output at ${ebN0dB} dB Eb/N0`}
      />

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 240 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Eb/N0</span>
            <span className="text-signal">{ebN0dB} dB</span>
          </span>
          <input
            type="range"
            min={-2}
            max={16}
            step={1}
            value={ebN0dB}
            onChange={(e) => setEbN0dB(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Energy-per-bit to noise-density ratio in decibels"
          />
        </label>
        <Readout
          label="Bit error rate"
          value={ber === 0 ? '0 (clean)' : ber.toExponential(2)}
          accent
        />
        <Readout label="Symbols" value={`${NUM_SYMBOLS} · BPSK`} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            each faint trace is one symbol period of the matched-filter output, overlaid · the open
            &ldquo;eye&rdquo; at the dashed sampling line is the decision margin · red = a symbol
            that crossed zero and flipped · lower Eb/N0 and the eye slams shut
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
