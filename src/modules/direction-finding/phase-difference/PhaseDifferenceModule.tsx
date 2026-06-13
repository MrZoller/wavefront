import { useState } from 'react';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { phaseDifference, pathLengthDifference, isUnambiguous, wrapPhase } from '@/dsp/phase';

const WINDOW_SAMPLES = 240;
const CYCLES = 3; // cycles of the carrier shown in the waveform window

/** Build one of the two sensor waveforms: cos advancing over the window, offset by `phaseOffset`. */
function sensorWave(phaseOffset: number): number[] {
  return Array.from({ length: WINDOW_SAMPLES }, (_, i) => {
    const phase = (2 * Math.PI * CYCLES * i) / (WINDOW_SAMPLES - 1);
    return Math.cos(phase - phaseOffset);
  });
}

/** Geometry view: incoming plane wave, the two sensors, and the extra path to the far one. */
function GeometryView({ dLambda, thetaRad }: { dLambda: number; thetaRad: number }) {
  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const cx = w / 2;
      const baseY = h * 0.6;
      const pxPerLambda = Math.min(70, (w * 0.7) / Math.max(dLambda, 0.5));
      const dpx = dLambda * pxPerLambda;

      const sinT = Math.sin(thetaRad);
      const cosT = Math.cos(thetaRad);
      // Toward the emitter (broadside is straight up); screen y grows downward.
      const eHat = { x: sinT, y: -cosT };
      // Along the wavefront (perpendicular to propagation).
      const wHat = { x: cosT, y: sinT };

      const A = { x: cx - dpx / 2, y: baseY };
      const B = { x: cx + dpx / 2, y: baseY };
      // proj > 0 ⇒ B is closer to the emitter, so A is the "later" sensor (has the extra path).
      const proj = dpx * sinT;
      const later = proj > 0 ? A : B;
      const earlier = proj > 0 ? B : A;
      const extraPx = Math.abs(proj);

      // Incoming wavefront lines (faint), drawn through the earlier sensor and one step back.
      ctx.strokeStyle = colors.cyanDim;
      ctx.lineWidth = 1;
      const half = Math.max(w, h);
      const drawWavefront = (px: number, py: number) => {
        ctx.beginPath();
        ctx.moveTo(px - wHat.x * half, py - wHat.y * half);
        ctx.lineTo(px + wHat.x * half, py + wHat.y * half);
        ctx.stroke();
      };
      ctx.setLineDash([4, 4]);
      drawWavefront(earlier.x, earlier.y);
      ctx.setLineDash([]);

      // Propagation-direction arrow (from the emitter side toward the array).
      const arrowFrom = { x: cx + eHat.x * h * 0.42, y: baseY + eHat.y * h * 0.42 };
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrowFrom.x, arrowFrom.y);
      ctx.lineTo(cx, baseY);
      ctx.stroke();
      // Arrowhead.
      const ang = Math.atan2(baseY - arrowFrom.y, cx - arrowFrom.x);
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx - 10 * Math.cos(ang - 0.4), baseY - 10 * Math.sin(ang - 0.4));
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx - 10 * Math.cos(ang + 0.4), baseY - 10 * Math.sin(ang + 0.4));
      ctx.stroke();

      // The extra-path segment from the later sensor back toward the emitter.
      if (extraPx > 1) {
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(later.x, later.y);
        ctx.lineTo(later.x + eHat.x * extraPx, later.y + eHat.y * extraPx);
        ctx.stroke();
      }

      // Baseline.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      // Sensors.
      const dot = (p: { x: number; y: number }, label: string) => {
        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = colors.textMuted;
        ctx.font = '12px ui-monospace, monospace';
        ctx.fillText(label, p.x - 4, p.y + 22);
      };
      dot(A, 'A');
      dot(B, 'B');
    },
    [dLambda, thetaRad]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 260 }}
      className="rounded-md border border-border bg-surface"
      role="img"
      aria-label="Plane wave arriving at two sensors, showing the extra path length"
    />
  );
}

/**
 * Phase difference module (brief §4, Layer 0). Two sensors receive the same wave from a chosen
 * bearing; the geometric extra path `d·sin(θ)` becomes a measurable phase offset
 * `Δφ = 2π·d·sin(θ)/λ`. Sets up everything in Layer 1 (interferometry & beamforming).
 */
export function PhaseDifferenceModule() {
  const [dLambda, setDLambda] = useState(0.5);
  const [thetaDeg, setThetaDeg] = useState(30);

  const thetaRad = (thetaDeg * Math.PI) / 180;
  const lambda = 1;
  const deltaR = pathLengthDifference(dLambda, thetaRad); // in λ
  const deltaPhi = phaseDifference(dLambda, thetaRad, lambda);
  const deltaPhiDeg = (deltaPhi * 180) / Math.PI;
  const wrappedDeg = (wrapPhase(deltaPhi) * 180) / Math.PI;
  const unambiguous = isUnambiguous(dLambda, lambda);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-[300px] flex-1">
          <GeometryView dLambda={dLambda} thetaRad={thetaRad} />
        </div>

        <div className="flex min-w-[280px] flex-1 flex-col gap-4">
          <div>
            <p className="readout mb-1 text-xs text-text-muted">
              Sensor A <span className="text-text-faint">— reference</span>
            </p>
            <TimeSeriesPlot
              series={[{ color: colors.signal, samples: sensorWave(0) }]}
              yDomain={[-1.1, 1.1]}
              height={110}
            />
          </div>
          <div>
            <p className="readout mb-1 text-xs text-text-muted">
              Sensor B <span className="text-text-faint">— shifted by Δφ</span>
            </p>
            <TimeSeriesPlot
              series={[{ color: colors.cyan, samples: sensorWave(deltaPhi) }]}
              yDomain={[-1.1, 1.1]}
              height={110}
            />
          </div>
        </div>
      </div>

      {/* Readouts */}
      <div className="flex flex-wrap gap-4">
        <Readout label="Extra path Δr" value={`${deltaR.toFixed(3)} λ`} />
        <Readout label="Phase Δφ" value={`${deltaPhiDeg.toFixed(0)}°`} accent />
        <Readout label="Wrapped Δφ" value={`${wrappedDeg.toFixed(0)}°`} />
        <div
          className={[
            'readout flex flex-col rounded-md border px-3 py-2 text-xs',
            unambiguous ? 'border-signal-dim text-signal' : 'border-alert-dim text-alert',
          ].join(' ')}
        >
          <span className="text-text-faint">Spatial sampling</span>
          <span>{unambiguous ? 'unambiguous (d ≤ λ/2)' : 'AMBIGUOUS (d > λ/2)'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface p-4">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="readout flex justify-between text-xs text-text-muted">
            <span>Bearing θ</span>
            <span className="text-signal">{thetaDeg}°</span>
          </span>
          <input
            type="range"
            min={-90}
            max={90}
            step={1}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(parseInt(e.target.value, 10))}
            className="accent-[var(--color-signal)]"
            aria-label="Bearing in degrees from broadside"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
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
