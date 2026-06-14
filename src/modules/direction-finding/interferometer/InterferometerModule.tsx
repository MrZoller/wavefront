import { useEffect, useRef, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { phaseDifference, wrapPhase, candidateBearings } from '@/dsp/phase';

const toDeg = (r: number) => (r * 180) / Math.PI;

interface Emitter {
  fx: number;
  fy: number;
} // normalized [0,1] canvas position

/**
 * Two-element interferometer (brief §4, Layer 1). Drag the emitter around a pair of antennas:
 * the geometric path difference becomes a phase difference, which is inverted to a line of
 * bearing. When the baseline exceeds λ/2, several bearings explain the same measured phase and
 * the ambiguous candidate rays light up together.
 */
export function InterferometerModule() {
  const [dLambda, setDLambda] = useState(0.5);
  const [emitter, setEmitter] = useState<Emitter>({ fx: 0.68, fy: 0.22 });
  // Actual canvas size in CSS px, so the bearing is computed in the same pixel geometry the
  // draw callback uses (a non-square canvas would skew a fraction-based angle).
  const [size, setSize] = useState({ w: 1, h: 1 });
  const dragging = useRef(false);

  const cx = size.w / 2;
  const baseY = size.h * 0.82;
  const emX = emitter.fx * size.w;
  const emY = Math.min(emitter.fy * size.h, baseY - 14);
  const trueTheta = Math.atan2(emX - cx, -(emY - baseY));
  const deltaPhi = phaseDifference(dLambda, trueTheta, 1);
  const wrapped = wrapPhase(deltaPhi);
  const candidates = candidateBearings(wrapped, dLambda, 1);
  // The lesson should match what's drawn: a measurement is ambiguous only when this particular
  // phase yields more than one candidate ray (not merely whenever d > λ/2).
  const unambiguous = candidates.length === 1;

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const cx = w / 2;
      const baseY = h * 0.82;
      const pxPerLambda = Math.min(80, (w * 0.5) / Math.max(dLambda, 0.5));
      const dpx = dLambda * pxPerLambda;
      const emX = emitter.fx * w;
      const emY = Math.min(emitter.fy * h, baseY - 14);

      const big = Math.hypot(w, h);
      const ray = (theta: number, color: string, dashed: boolean, width: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dashed ? [5, 5] : []);
        ctx.beginPath();
        ctx.moveTo(cx, baseY);
        ctx.lineTo(cx + Math.sin(theta) * big, baseY - Math.cos(theta) * big);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Broadside reference.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Candidate lines of bearing (the inferred directions).
      for (const theta of candidates) ray(theta, colors.cyan, true, 1.5);

      // The true bearing to the emitter.
      ray(trueTheta, colors.signal, false, 2);

      // Baseline + the two elements.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - dpx / 2, baseY);
      ctx.lineTo(cx + dpx / 2, baseY);
      ctx.stroke();
      for (const sx of [-1, 1]) {
        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(cx + (sx * dpx) / 2, baseY, 5, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Emitter (draggable).
      ctx.fillStyle = colors.alert;
      ctx.shadowColor = colors.alert;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(emX, emY, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors.textMuted;
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('emitter — drag me', emX + 12, emY + 4);
    },
    [dLambda, emitter, trueTheta, candidates]
  );

  // Keep `size` in sync with the canvas's CSS pixel dimensions.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => setSize({ w: canvas.clientWidth, h: canvas.clientHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [canvasRef]);

  const updateFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const fx = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    const fy = Math.max(0.02, Math.min(0.74, (e.clientY - rect.top) / rect.height));
    setEmitter({ fx, fy });
  };

  // Keyboard-operable alternative to dragging: place the emitter along a chosen bearing at a
  // fixed display radius (distance doesn't affect the plane-wave phase, so bearing is the
  // meaningful control). Keeps the lesson usable without a pointer (brief §12 accessibility).
  const setBearing = (thetaDeg: number) => {
    const theta = (thetaDeg * Math.PI) / 180;
    const r = Math.min(size.w, size.h) * 0.55;
    const fx = (size.w / 2 + Math.sin(theta) * r) / size.w;
    const fy = (size.h * 0.82 - Math.cos(theta) * r) / size.h;
    setEmitter({
      fx: Math.max(0.02, Math.min(0.98, fx)),
      fy: Math.max(0.02, Math.min(0.74, fy)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 340, touchAction: 'none', cursor: 'crosshair' }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label="Two antennas with a draggable emitter and its lines of bearing"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateFromPointer(e);
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      />

      <div className="flex flex-wrap gap-4">
        <Readout label="True bearing" value={`${toDeg(trueTheta).toFixed(1)}°`} />
        <Readout label="Phase Δφ" value={`${toDeg(deltaPhi).toFixed(0)}°`} accent />
        <Readout label="Wrapped Δφ" value={`${toDeg(wrapped).toFixed(0)}°`} />
        <div
          className={[
            'readout flex flex-col rounded-md border px-3 py-2 text-xs',
            unambiguous ? 'border-signal-dim text-signal' : 'border-alert-dim text-alert',
          ].join(' ')}
        >
          <span className="text-text-faint">Candidate bearings</span>
          <span>
            {candidates.map((c) => `${toDeg(c).toFixed(0)}°`).join(', ')}
            {unambiguous ? ' (unique)' : ' — ambiguous'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Emitter bearing θ</span>
            <span className="text-signal">{toDeg(trueTheta).toFixed(0)}°</span>
          </span>
          <input
            type="range"
            min={-85}
            max={85}
            step={1}
            value={Math.round(toDeg(trueTheta))}
            onChange={(e) => setBearing(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Emitter bearing in degrees (keyboard alternative to dragging)"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Baseline d</span>
            <span className="text-signal">{dLambda.toFixed(2)} λ</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.05}
            value={dLambda}
            onChange={(e) => setDLambda(parseFloat(e.target.value))}
            className="accent-[var(--color-signal)]"
            aria-label="Baseline separation in wavelengths"
          />
          <span className="readout text-xs text-text-faint">
            <GlossedText>
              cyan rays = inferred bearings · green ray = truth · drag the emitter or use the
              bearing slider
            </GlossedText>
          </span>
        </label>
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
