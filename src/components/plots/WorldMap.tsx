import { useEffect, useRef, useState } from 'react';
import { colors, withAlpha } from '@/design/tokens';

export interface MapPoint {
  id: string;
  x: number;
  y: number;
  color: string;
  label?: string;
  draggable?: boolean;
  /**
   * Marker shape. `site` is a solid dot, `emitter` a star, and `velocity` an open ring handle —
   * the open ring reads as its own grabbable control, distinct from the solid `site` dot it trails,
   * so a velocity-vector tip is visibly draggable *separately* from the platform's position.
   */
  kind?: 'site' | 'emitter' | 'velocity';
  /**
   * Label placement nudge in screen px from the marker (default: up and to the right). Lets a scene
   * push two crowded labels onto opposite sides of their markers so they don't collide. A negative
   * `dx` right-aligns the label, so it grows away from the marker rather than back over it.
   */
  labelOffset?: { dx: number; dy: number };
}

/** Trace a rounded-rectangle path (the legibility backing behind a marker label). */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** World→pixel transform passed to the overlay draw callback. */
export interface MapTransform {
  toPx: (x: number, y: number) => { px: number; py: number };
  toWorld: (px: number, py: number) => { x: number; y: number };
  scale: number;
  width: number;
  height: number;
}

export interface ScalarField {
  /** Value at a world point (e.g. GDOP). */
  value: (x: number, y: number) => number;
  /** Map a value to a CSS color string. */
  color: (v: number) => string;
  /** Grid resolution in cells across the shorter axis (coarser = faster). */
  resolution?: number;
}

export interface WorldMapProps {
  extent: { minX: number; maxX: number; minY: number; maxY: number };
  points: MapPoint[];
  /** Called (in world coords) when a draggable point is moved by pointer or keyboard. */
  onPointMove?: (id: string, x: number, y: number) => void;
  /** Custom overlay drawn above the field, below the points. */
  draw?: (ctx: CanvasRenderingContext2D, t: MapTransform) => void;
  /** Optional scalar field rendered as a heatmap under everything. */
  field?: ScalarField;
  /** Extra dependencies that should trigger a repaint. */
  deps?: readonly unknown[];
  height?: number;
  ariaLabel?: string;
}

/**
 * A 2D "world map" canvas (brief §9, §4 Layer 2) — the shared surface for the geolocation scenes.
 * Renders an optional scalar field (GDOP heatmap), a custom overlay (bearings, hyperbolas, fixes),
 * and draggable site/emitter markers. Markers are operable by pointer drag and by keyboard
 * (Tab to focus, arrow keys to nudge the selected marker) per the accessibility guardrail (§12).
 */
export function WorldMap({
  extent,
  points,
  onPointMove,
  draw,
  field,
  deps = [],
  height = 420,
  ariaLabel = 'Geolocation map',
}: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  // Keep the latest props available to the (size-driven) paint effect without rebuilding it.
  const latest = useRef({ extent, points, draw, field, activeId });
  useEffect(() => {
    latest.current = { extent, points, draw, field, activeId };
  });

  const makeTransform = (w: number, h: number): MapTransform => {
    const { minX, maxX, minY, maxY } = extent;
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const pad = 14;
    const scale = Math.min((w - 2 * pad) / worldW, (h - 2 * pad) / worldH);
    const ox = (w - worldW * scale) / 2;
    const oy = (h - worldH * scale) / 2;
    return {
      scale,
      width: w,
      height: h,
      toPx: (x, y) => ({ px: ox + (x - minX) * scale, py: oy + (maxY - y) * scale }),
      toWorld: (px, py) => ({ x: minX + (px - ox) / scale, y: maxY - (py - oy) / scale }),
    };
  };

  // Paint.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const t = makeTransform(w, h);

    // 1) Scalar field (heatmap) under everything.
    if (field) {
      const res = field.resolution ?? 64;
      const cell = Math.max(2, Math.floor(Math.min(w, h) / res));
      for (let py = 0; py < h; py += cell) {
        for (let px = 0; px < w; px += cell) {
          const wd = t.toWorld(px + cell / 2, py + cell / 2);
          ctx.fillStyle = field.color(field.value(wd.x, wd.y));
          ctx.fillRect(px, py, cell, cell);
        }
      }
    }

    // 2) Custom overlay.
    draw?.(ctx, t);

    // 3) Draggable markers.
    for (const p of points) {
      const { px, py } = t.toPx(p.x, p.y);
      const draggable = p.draggable !== false;
      const focused = p.id === activeId;
      // Persistent faint "handle" ring so draggable markers read as grabbable, not plotted data.
      if (draggable) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, p.kind === 'emitter' ? 11 : 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
      if (focused) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      if (p.kind === 'emitter') {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
          const fn = k === 0 ? 'moveTo' : 'lineTo';
          ctx[fn](px + Math.cos(a) * 8, py + Math.sin(a) * 8);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === 'velocity') {
        // Open ring handle: the velocity-vector tip is grabbable on its own (drag it to re-aim the
        // arrow), visibly distinct from the solid receiver dot it trails.
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (p.label) {
        const off = p.labelOffset ?? { dx: 10, dy: -8 };
        const align: CanvasTextAlign = off.dx < 0 ? 'right' : 'left';
        const lx = px + off.dx;
        const ly = py + off.dy;
        ctx.font = '11px ui-monospace, monospace';
        ctx.textAlign = align;
        ctx.textBaseline = 'alphabetic';
        // Quiet legibility backing so the muted label reads over a heatmap field — either half of a
        // diverging gradient, plus the bright contour line — without washing the field out.
        const tw = ctx.measureText(p.label).width;
        const padX = 3.5;
        const rectX = (align === 'right' ? lx - tw : lx) - padX;
        roundRectPath(ctx, rectX, ly - 9, tw + 2 * padX, 13, 3);
        ctx.fillStyle = withAlpha(colors.bg, 0.72);
        ctx.fill();
        ctx.fillStyle = colors.textMuted;
        ctx.fillText(p.label, lx, ly);
        ctx.textAlign = 'left';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, points, activeId, field, draw, ...deps]);

  // Track size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => setSize({ w: canvas.clientWidth, h: canvas.clientHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const hitTest = (px: number, py: number): string | null => {
    const t = makeTransform(size.w, size.h);
    let best: string | null = null;
    let bestD = 16; // px hit radius
    for (const p of points) {
      if (p.draggable === false) continue;
      const { px: cx, py: cy } = t.toPx(p.x, p.y);
      const d = Math.hypot(px - cx, py - cy);
      if (d < bestD) {
        bestD = d;
        best = p.id;
      }
    }
    return best;
  };

  const clamp = (x: number, y: number) => ({
    x: Math.max(extent.minX, Math.min(extent.maxX, x)),
    y: Math.max(extent.minY, Math.min(extent.maxY, y)),
  });

  /** Move a marker by one keyboard step for an arrow key; returns true if it handled the key. */
  const nudge = (id: string, key: string): boolean => {
    if (!onPointMove) return false;
    const p = points.find((q) => q.id === id);
    if (!p) return false;
    const step = (extent.maxX - extent.minX) / 100;
    let dx = 0;
    let dy = 0;
    if (key === 'ArrowLeft') dx = -step;
    else if (key === 'ArrowRight') dx = step;
    else if (key === 'ArrowUp') dy = step;
    else if (key === 'ArrowDown') dy = -step;
    else return false;
    const c = clamp(p.x + dx, p.y + dy);
    onPointMove(id, c.x, c.y);
    return true;
  };

  const draggablePoints = points.filter((p) => p.draggable !== false);

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        style={{ width: '100%', height, touchAction: 'none', cursor: 'crosshair' }}
        className="rounded-md border border-border bg-surface outline-none focus:border-signal-dim"
        role="application"
        aria-label={`${ariaLabel}. Use the marker buttons below to select a marker, then arrow keys to move it.`}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const id = hitTest(e.clientX - rect.left, e.clientY - rect.top);
          if (id) {
            dragId.current = id;
            setActiveId(id);
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.style.cursor = 'grabbing';
          }
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const lx = e.clientX - rect.left;
          const ly = e.clientY - rect.top;
          if (dragId.current && onPointMove) {
            const t = makeTransform(size.w, size.h);
            const wd = t.toWorld(lx, ly);
            const c = clamp(wd.x, wd.y);
            onPointMove(dragId.current, c.x, c.y);
          } else {
            // The cursor announces the affordance: grab over a draggable handle, crosshair elsewhere.
            e.currentTarget.style.cursor = hitTest(lx, ly) ? 'grab' : 'crosshair';
          }
        }}
        onPointerUp={(e) => {
          dragId.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.cursor = hitTest(e.clientX - rect.left, e.clientY - rect.top)
            ? 'grab'
            : 'crosshair';
        }}
        onKeyDown={(e) => {
          const id = activeId ?? draggablePoints[0]?.id;
          if (id && nudge(id, e.key)) {
            e.preventDefault();
            if (!activeId) setActiveId(id);
          }
        }}
      />

      {/* Keyboard-accessible marker selection: Tab to a marker, arrow keys to move it. */}
      {onPointMove && draggablePoints.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="readout text-xs text-text-faint">select:</span>
          {draggablePoints.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === activeId}
              onFocus={() => setActiveId(p.id)}
              onClick={() => setActiveId(p.id)}
              onKeyDown={(e) => {
                if (nudge(p.id, e.key)) e.preventDefault();
              }}
              className={[
                'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
                p.id === activeId
                  ? 'border-signal-dim bg-surface-raised text-signal'
                  : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
              ].join(' ')}
              style={{ outlineColor: p.color }}
            >
              {p.label ?? p.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
