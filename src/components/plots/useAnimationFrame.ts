import { useEffect, useRef } from 'react';

/**
 * Runs `callback(elapsedSeconds, dtSeconds)` on every animation frame while `active`.
 *
 * The shared heartbeat for live, "nothing snaps" animation (brief §11). The clock pauses
 * when `active` is false and resumes without jumping, so toggling never causes a time skip.
 */
export function useAnimationFrame(callback: (elapsed: number, dt: number) => void, active = true) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      elapsed += dt;
      cbRef.current(elapsed, dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
