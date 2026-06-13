import { useEffect, useRef } from 'react';

/**
 * Device-pixel-ratio-aware canvas hook shared by all plot components.
 *
 * Handles HiDPI scaling and element resizing, then invokes `draw` with a context
 * already scaled to CSS pixels and the logical width/height. `draw` re-runs
 * whenever `deps` change (the live-feedback loop, brief §1) or the canvas resizes.
 */
export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  deps: readonly unknown[]
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep the latest draw fn without forcing a resize-observer rebuild.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth: w, clientHeight: h } = canvas;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawRef.current(ctx, w, h);
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}
