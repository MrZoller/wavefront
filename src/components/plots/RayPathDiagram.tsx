import { type ReactNode } from 'react';
import { colors } from '@/design/tokens';
import { EARTH_RADIUS_KM } from '@/propagation';
import { type AxisLabel } from './axisLabel';
import { PlotFrame } from './PlotFrame';
import { useCanvas } from './useCanvas';

/** Absolute-altitude transform handed to a {@link RayPathDiagram} overlay. */
export interface RayPathScene {
  /** Map a ground position (km) + altitude above the datum (km) to a pixel. */
  toPx: (groundKm: number, altitudeKm: number) => { px: number; py: number };
  /** Datum altitude of the curved surface at a ground position (km) — the bulge height. */
  surfaceKm: (groundKm: number) => number;
  centerKm: number;
  spanKm: number;
  width: number;
  height: number;
}

export interface RayPathAntenna {
  groundKm: number;
  /** Mast height above the local surface, in km. */
  heightKm: number;
  color: string;
  label?: string;
}

export interface RayPathDiagramProps {
  /** Ground distance shown, in km (the horizontal extent). */
  spanKm: number;
  /** Vertical extent to show, in km of altitude. Fixing it keeps the frame stable as inputs change
   *  (so a growing reach is visible); omit to auto-fit to the antennas/ionosphere. */
  maxAltitudeKm?: number;
  /** Effective Earth radius for the drawn bulge (km). Larger = flatter. Defaults to real Earth. */
  earthRadiusKm?: number;
  antennas?: RayPathAntenna[];
  /** Optional ionosphere layer, drawn as a band at this altitude (km). */
  ionosphereKm?: number;
  ionosphereLabel?: string;
  /** Module overlay — draw the rays (line-of-sight, skywave hop) in absolute altitude coords. */
  draw?: (ctx: CanvasRenderingContext2D, scene: RayPathScene) => void;
  /** Extra repaint dependencies. */
  deps?: readonly unknown[];
  height?: number;
  xLabel?: AxisLabel;
  yLabel?: AxisLabel;
  ariaLabel: string;
  /** One quiet hint line under the figure. */
  hint?: ReactNode;
}

const PAD = { left: 8, right: 8, top: 14, bottom: 8 };

/**
 * A 2D earth-curvature / ray-path cross-section (brief §8 new viz). It draws a gently bulging Earth,
 * antenna masts, and an optional ionospheric layer, then hands an absolute-altitude transform to a
 * `draw` overlay so a module can lay its rays on top — the line-of-sight grazing the horizon, or an
 * HF hop bouncing off the sky. The vertical scale is exaggerated so metre-to-hundred-km heights read
 * against thousand-km spans, so it is a **schematic**: the geometry it illustrates is real, the
 * proportions are not (hence the quiet "vertical scale exaggerated" note callers pass as a hint).
 */
export function RayPathDiagram({
  spanKm,
  maxAltitudeKm,
  earthRadiusKm = EARTH_RADIUS_KM,
  antennas = [],
  ionosphereKm,
  ionosphereLabel,
  draw,
  deps = [],
  height = 300,
  xLabel = { quantity: 'Ground distance', unit: 'km' },
  yLabel = { quantity: 'Altitude', unit: 'km' },
  ariaLabel,
  hint,
}: RayPathDiagramProps) {
  const center = spanKm / 2;
  // Parabolic-earth bulge: surface peaks at the centre and drops to the datum (0) at both edges,
  // sagitta = (span/2)² / 2R. This is the same √(2Rh) geometry the horizon formula uses, so the
  // picture and the numbers agree (up to the deliberate vertical exaggeration).
  const peakKm = (center * center) / (2 * earthRadiusKm);
  const surfaceKm = (g: number) => peakKm - ((g - center) * (g - center)) / (2 * earthRadiusKm);

  // Top of the vertical axis: fixed when given, else auto-fit to the tallest feature.
  const autoTop = Math.max(
    peakKm * 1.1,
    ...antennas.map((a) => (surfaceKm(a.groundKm) + a.heightKm) * 1.15),
    ionosphereKm ? ionosphereKm * 1.2 : 0
  );
  const topKm = maxAltitudeKm ?? (autoTop > 0 ? autoTop : 1);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const x0 = PAD.left;
      const x1 = w - PAD.right;
      const yBottom = h - PAD.bottom;
      const yTop = PAD.top;
      const toPx = (groundKm: number, altitudeKm: number) => ({
        px: x0 + (groundKm / spanKm) * (x1 - x0),
        py: yBottom - (altitudeKm / topKm) * (yBottom - yTop),
      });

      // ── Earth: filled body under the surface curve. ───────────────────────
      ctx.beginPath();
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const g = (i / steps) * spanKm;
        const p = toPx(g, surfaceKm(g));
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.lineTo(x1, h);
      ctx.lineTo(x0, h);
      ctx.closePath();
      // Concrete fills: canvas can't resolve CSS vars. surface #0d1418, raised border #1e2c33.
      ctx.fillStyle = 'rgba(13, 20, 24, 0.95)';
      ctx.fill();
      ctx.strokeStyle = colors.textFaint;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const g = (i / steps) * spanKm;
        const p = toPx(g, surfaceKm(g));
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();

      // ── Ionosphere layer (skywave scenes). ────────────────────────────────
      if (ionosphereKm != null) {
        const a = toPx(0, ionosphereKm);
        const b = toPx(spanKm, ionosphereKm);
        ctx.save();
        ctx.strokeStyle = colors.cyan;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
        ctx.setLineDash([]);
        // Faint shaded layer above the line.
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = colors.cyan;
        ctx.fillRect(a.px, a.py - 10, b.px - a.px, 10);
        ctx.restore();
        if (ionosphereLabel) {
          ctx.fillStyle = colors.textMuted;
          ctx.font = '11px ui-monospace, monospace';
          ctx.fillText(ionosphereLabel, a.px + 6, a.py - 6);
        }
      }

      // ── Module overlay (rays). ────────────────────────────────────────────
      draw?.(ctx, { toPx, surfaceKm, centerKm: center, spanKm, width: w, height: h });

      // ── Antenna masts (drawn last so rays read as coming from the tops). ──
      for (const ant of antennas) {
        const base = toPx(ant.groundKm, surfaceKm(ant.groundKm));
        const tip = toPx(ant.groundKm, surfaceKm(ant.groundKm) + ant.heightKm);
        ctx.strokeStyle = ant.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(base.px, base.py);
        ctx.lineTo(tip.px, tip.py);
        ctx.stroke();
        ctx.fillStyle = ant.color;
        ctx.shadowColor = ant.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(tip.px, tip.py, 3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (ant.label) {
          ctx.fillStyle = colors.textMuted;
          ctx.font = '11px ui-monospace, monospace';
          ctx.fillText(ant.label, tip.px + 7, tip.py - 4);
        }
      }
    },
    [spanKm, topKm, earthRadiusKm, antennas, ionosphereKm, ionosphereLabel, draw, ...deps]
  );

  return (
    <div className="flex flex-col gap-2">
      <PlotFrame xLabel={xLabel} yLabel={yLabel}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height }}
          className="rounded-md border border-border bg-surface"
          role="img"
          aria-label={ariaLabel}
        />
      </PlotFrame>
      {hint && <span className="readout text-xs text-text-faint">{hint}</span>}
    </div>
  );
}
