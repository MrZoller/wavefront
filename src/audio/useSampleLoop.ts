import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Loops a buffer of mono samples via the Web Audio API — for *hearing a processed signal* (a
 * quantized or clipped tone), where {@link useToneAudio}'s pure oscillator can't reveal the effect.
 * The caller renders the samples (so the DSP stays in one place); this just plays them on a loop.
 *
 * Like the tone hook: the AudioContext is created lazily on first `play()` (autoplay policy) and a
 * short gain ramp avoids clicks. Re-calling `play()` swaps the buffer seamlessly, so a caller can
 * restart it as a parameter changes and the sound tracks the visuals.
 */
export function useSampleLoop() {
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [playing, setPlaying] = useState(false);

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

  const teardownSource = useCallback(() => {
    const src = srcRef.current;
    if (src) {
      try {
        src.stop();
      } catch {
        // already stopped
      }
      src.disconnect();
    }
    srcRef.current = null;
    gainRef.current = null;
  }, []);

  /** Render and loop a fresh buffer. `render(sampleRate)` returns the mono samples to play. */
  const play = useCallback(
    (render: (sampleRate: number) => Float32Array) => {
      const ctx = ensureContext();
      if (!ctx) return;
      void ctx.resume();
      teardownSource();

      const data = render(ctx.sampleRate);
      const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buffer.getChannelData(0).set(data);

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
      src.connect(gain).connect(ctx.destination);
      src.start();

      srcRef.current = src;
      gainRef.current = gain;
      setPlaying(true);
    },
    [ensureContext, teardownSource]
  );

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.04);
      srcRef.current?.stop(t + 0.05);
      srcRef.current = null;
      gainRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      teardownSource();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [teardownSource]);

  return useMemo(() => ({ play, stop, playing }), [play, stop, playing]);
}
