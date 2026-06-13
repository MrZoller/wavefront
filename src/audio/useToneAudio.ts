import { useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Plays a continuous sine tone via the Web Audio API (brief §3.2 — "let the user hear it").
 *
 * Returns `{ start, stop, setFrequency }`. The AudioContext is created lazily on first
 * `start()` so we respect browsers' autoplay policy (audio only after a user gesture).
 * A short gain ramp avoids clicks (the "nothing snaps" principle, applied to sound).
 */
export function useToneAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  const start = useCallback(
    (frequency: number) => {
      const ctx = ensureContext();
      if (!ctx) return;
      void ctx.resume();
      if (oscRef.current) return; // already playing

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    },
    [ensureContext]
  );

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    const gain = gainRef.current;
    if (!ctx || !osc || !gain) return;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.04);
    osc.stop(t + 0.05);
    oscRef.current = null;
    gainRef.current = null;
  }, []);

  const setFrequency = useCallback((frequency: number) => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    if (!ctx || !osc) return;
    osc.frequency.linearRampToValueAtTime(frequency, ctx.currentTime + 0.03);
  }, []);

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
      oscRef.current = null;
      gainRef.current = null;
    };
  }, []);

  // Stable identity so consumers can safely list the controls in effect deps without the
  // object changing on every render (e.g. an animation loop re-rendering at frame rate).
  return useMemo(() => ({ start, stop, setFrequency }), [start, stop, setFrequency]);
}
