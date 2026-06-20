import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { colors } from '@/design/tokens';
import { type AxisLabel, axisAriaLabel } from './axisLabel';
import { heatColor } from './heat';
import { PlotFrame } from './PlotFrame';
import { useCanvas } from './useCanvas';

/** A point on the surface in data-index coordinates (fractional allowed for smooth tracking). */
export interface AcquisitionMarker {
  /** Column = horizontal-axis index, 0 … cols−1 (range / code phase). */
  col: number;
  /** Row = vertical-axis index, 0 … rows−1, increasing **upward** (Doppler). */
  row: number;
}

export interface AcquisitionHeatmapProps {
  /**
   * `cols × rows` **linear** magnitudes (`data[col][row]`), with `row` increasing upward. The 2D
   * correlation surface — range/code-phase along x, Doppler up y, color = correlation energy. It is
   * normalized to a dB scale internally (the global peak → 0 dB), so callers pass raw magnitudes.
   */
  data: number[][];
  /** Dynamic range floor in dB (anything this far below the peak renders as the noise floor). */
  floorDb?: number;
  height?: number;
  className?: string;
  /** What each axis represents — required (the surface is meaningless without it). */
  xLabel: AxisLabel;
  yLabel: AxisLabel;
  ariaLabel?: string;
  /**
   * The draggable "true target" marker — a signal-green handle with a grab/grabbing cursor and a faint
   * halo (the app's draggable-handle affordance). Omit for a plain surface: the radar range-Doppler
   * map drives its blob from sliders and passes none.
   */
  marker?: AcquisitionMarker;
  /** Called with the clamped (col, row) when the marker is dragged or arrow-key nudged. Required for
   *  the marker to be interactive. */
  onMarkerDrag?: (col: number, row: number) => void;
  /** Accessible name for the draggable handle (used in the canvas aria-label and keyboard hint). */
  markerLabel?: string;
  /** The **detected** peak — a neutral cyan ring marking where the surface actually maxes out. When
   *  acquisition succeeds it sits under the green handle; when the signal sinks into the noise it
   *  jumps to a noise cell, which is exactly the lesson. */
  peak?: AcquisitionMarker;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const HANDLE_HIT_RADIUS = 14;

/**
 * The shared 2D **acquisition heatmap** (brief §9 shared viz) — the correlation surface of a 2D search,
 * with its bright peak read back as a physical measurement. One component, axes parameterized, used by
 * both synthesis scenes it belongs to: the radar **range × Doppler** map and the GPS **code-phase ×
 * Doppler** acquisition surface. Optionally carries a draggable "true target" handle (grab/grabbing
 * cursor + halo, pointer and arrow-key operable per the accessibility guardrail §12) and a neutral ring
 * on the detected peak, so the learner can drag the truth and watch the peak track it — or sink.
 */
export function AcquisitionHeatmap({
  data,
  floorDb = -35,
  height = 240,
  className,
  xLabel,
  yLabel,
  ariaLabel,
  marker,
  onMarkerDrag,
  markerLabel = 'true target',
  peak,
}: AcquisitionHeatmapProps) {
  const cols = data.length;
  const rows = cols > 0 ? data[0].length : 0;
  const dragging = useRef(false);
  const [focused, setFocused] = useState(false);
  const interactive = !!(marker && onMarkerDrag);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      if (cols === 0 || rows === 0) return;
      const cw = w / cols;
      const ch = h / rows;

      // Linear → dB normalization against the global peak, then onto the shared heat ramp.
      let pk = 1e-12;
      for (const column of data) for (const v of column) if (v > pk) pk = v;
      for (let c = 0; c < cols; c++) {
        const column = data[c];
        for (let r = 0; r < rows; r++) {
          const db = 20 * Math.log10((column[r] || 1e-12) / pk);
          const norm = clamp((db - floorDb) / -floorDb, 0, 1);
          ctx.fillStyle = heatColor(norm);
          // Row increases upward (flip y), matching the spectrogram convention.
          ctx.fillRect(c * cw, h - (r + 1) * ch, Math.ceil(cw), Math.ceil(ch));
        }
      }

      // The detected peak — a neutral ring (secondary accent), the measurement read off the surface.
      if (peak) {
        ctx.strokeStyle = colors.cyan;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc((peak.col + 0.5) * cw, h - (peak.row + 0.5) * ch, 7, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // The draggable "true target" — a signal-green handle with a persistent faint halo so it reads
      // as grabbable, plus a dashed focus ring for keyboard users.
      if (marker) {
        const px = (marker.col + 0.5) * cw;
        const py = h - (marker.row + 0.5) * ch;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
        if (focused) {
          ctx.strokeStyle = colors.signal;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = colors.signal;
        ctx.shadowColor = colors.signal;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    },
    [data, floorDb, marker?.col, marker?.row, peak?.col, peak?.row, focused, cols, rows]
  );

  /** Pointer → clamped data-index (col, row). */
  const toData = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = clamp((e.clientX - rect.left) / (rect.width / cols) - 0.5, 0, cols - 1);
    const row = clamp(
      (rect.height - (e.clientY - rect.top)) / (rect.height / rows) - 0.5,
      0,
      rows - 1
    );
    return { col, row };
  };

  /** Whether the pointer is over the draggable handle (within the hit radius). */
  const overHandle = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!marker) return false;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (marker.col + 0.5) * (rect.width / cols);
    const my = rect.height - (marker.row + 0.5) * (rect.height / rows);
    return Math.hypot(e.clientX - rect.left - mx, e.clientY - rect.top - my) <= HANDLE_HIT_RADIUS;
  };

  return (
    <PlotFrame className={className} xLabel={xLabel} yLabel={yLabel}>
      <canvas
        ref={canvasRef}
        tabIndex={interactive ? 0 : undefined}
        style={{
          width: '100%',
          height,
          ...(interactive ? { touchAction: 'none', cursor: 'crosshair' } : null),
        }}
        className={[
          'rounded-md border border-border bg-surface',
          interactive ? 'outline-none focus:border-signal-dim' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role={interactive ? 'application' : 'img'}
        aria-label={
          ariaLabel ??
          (interactive
            ? `${axisAriaLabel(yLabel, xLabel)}. Drag the ${markerLabel} handle, or focus it and use the arrow keys.`
            : axisAriaLabel(yLabel, xLabel))
        }
        onPointerDown={
          interactive
            ? (e) => {
                if (!overHandle(e)) return;
                dragging.current = true;
                setFocused(true);
                e.currentTarget.setPointerCapture(e.pointerId);
                e.currentTarget.style.cursor = 'grabbing';
              }
            : undefined
        }
        onPointerMove={
          interactive
            ? (e) => {
                if (dragging.current) {
                  const { col, row } = toData(e);
                  onMarkerDrag!(col, row);
                } else {
                  e.currentTarget.style.cursor = overHandle(e) ? 'grab' : 'crosshair';
                }
              }
            : undefined
        }
        onPointerUp={
          interactive
            ? (e) => {
                dragging.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
                e.currentTarget.style.cursor = overHandle(e) ? 'grab' : 'crosshair';
              }
            : undefined
        }
        onPointerCancel={
          interactive
            ? (e) => {
                // A browser/OS-interrupted touch or stylus drag fires pointercancel, not pointerup —
                // clear the drag here too so a later move can't keep dragging the marker (and the
                // GPS sliders) with no handle held.
                dragging.current = false;
                e.currentTarget.style.cursor = 'crosshair';
              }
            : undefined
        }
        onFocus={interactive ? () => setFocused(true) : undefined}
        onBlur={interactive ? () => setFocused(false) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (!marker) return;
                let { col, row } = marker;
                if (e.key === 'ArrowLeft') col -= 1;
                else if (e.key === 'ArrowRight') col += 1;
                else if (e.key === 'ArrowUp')
                  row += 1; // up = higher Doppler row
                else if (e.key === 'ArrowDown') row -= 1;
                else return;
                e.preventDefault();
                onMarkerDrag!(clamp(col, 0, cols - 1), clamp(row, 0, rows - 1));
              }
            : undefined
        }
      />
    </PlotFrame>
  );
}
