import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { useAnimationFrame } from '@/components/plots/useAnimationFrame';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { CONSTELLATIONS, awgn, bitsToSymbols } from '@/dsp/comms';
import { mulberry32 } from '@/dsp/random';

const LIMIT = 1.8;

// A fixed noisy QPSK cloud; the offset rotates it relative to the ideal points.
const CLOUD = (() => {
  const rng = mulberry32(9);
  const bits = Array.from({ length: 240 * 2 }, () => (rng() < 0.5 ? 0 : 1));
  return awgn(bitsToSymbols(bits, CONSTELLATIONS.QPSK), 0.12, 3);
})();

/**
 * Carrier frequency & phase offset / Doppler (brief §5, Track B). A receiver recovers the carrier
 * from its own oscillator; if it isn't perfectly matched, the whole constellation rotates. A constant
 * phase error sits it at a fixed angle; a frequency error (or Doppler from motion) makes it spin
 * continuously — which is why receivers must actively track and correct the carrier.
 */
export function CarrierOffsetModule() {
  const [cfoHz, setCfoHz] = useState(0.25); // spin rate (revolutions/second, for display)
  const [phaseDeg, setPhaseDeg] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useAnimationFrame((e) => setElapsed(e));

  const rot = (phaseDeg * Math.PI) / 180 + 2 * Math.PI * cfoHz * elapsed;

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const s = Math.min(w, h) / 2 - 16;
      const px = (re: number) => cx + (re / LIMIT) * s;
      const py = (im: number) => cy - (im / LIMIT) * s;

      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      // Ideal QPSK points (fixed reference).
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 1.5;
      for (const p of CONSTELLATIONS.QPSK.points) {
        ctx.beginPath();
        ctx.arc(px(p.re), py(p.im), 5, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Rotated received cloud.
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      ctx.fillStyle = colors.signal;
      ctx.globalAlpha = 0.5;
      for (const z of CLOUD) {
        const re = z.re * c - z.im * sn;
        const im = z.re * sn + z.im * c;
        ctx.beginPath();
        ctx.arc(px(re), py(im), 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [rot]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-6">
        <canvas
          ref={canvasRef}
          style={{ width: 300, height: 300 }}
          className="rounded-md border border-border bg-surface"
          role="img"
          aria-label="QPSK constellation rotating under a carrier frequency and phase offset"
        />
        <div className="flex min-w-[260px] flex-1 flex-col gap-4">
          <Slider
            label="Frequency offset (spin)"
            value={cfoHz}
            min={0}
            max={1}
            step={0.05}
            decimals={2}
            unit=" rev/s"
            onChange={setCfoHz}
            ariaLabel="Carrier frequency offset (spin rate)"
          />
          <Slider
            label="Phase offset"
            value={phaseDeg}
            min={0}
            max={180}
            step={5}
            unit="°"
            onChange={setPhaseDeg}
            ariaLabel="Carrier phase offset in degrees"
          />
          <p className="readout text-xs text-text-faint">
            <GlossedText>
              cyan rings = where the symbols should land · green cloud = what the receiver sees · a
              phase offset rotates it to a fixed angle; a frequency offset spins it forever — set
              spin to 0 and use phase alone to see the static rotation
            </GlossedText>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            once the cloud rotates past a decision boundary, every symbol decodes wrong — so a real
            receiver runs a carrier-recovery loop to spin it back upright. Same physics as Doppler
            from a moving transmitter (FDOA).
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
