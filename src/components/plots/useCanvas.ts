import { useCallback, useEffect, useRef } from 'react';

/**
 * Device-pixel-ratio-aware canvas hook shared by all plot components.
 *
 * Handles HiDPI scaling and element resizing, then invokes `draw` with a context
 * already scaled to CSS pixels and the logical width/height. `draw` re-runs
 * whenever `deps` change (the live-feedback loop, brief §1) or the canvas resizes.
 *
 * Performance: the backing store (`canvas.width`/`height`) is only reassigned when the
 * computed pixel size actually changes — reassigning recreates the backing store and resets
 * context state, so doing it per frame would dominate 60fps animation. Resize handling lives
 * in its own effect (a single ResizeObserver) separate from the per-frame data redraw.
 */
export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  deps: readonly unknown[]
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep the latest draw fn without forcing the paint callback / observer to rebuild.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  // Stable paint routine: resize only when needed, then redraw.
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    // Only touch the backing store when its size truly changed (this clears + resets state).
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawRef.current(ctx, w, h);
  }, []);

  // Redraw on data changes — no observer churn, no unconditional resize.
  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Observe element resizes once; repaint (and thus re-size the backing store) when they happen.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paint]);

  return canvasRef;
}
