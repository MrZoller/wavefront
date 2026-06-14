import { useCallback, useEffect, useRef, useState } from 'react';

export type AnalogScheme = 'AM' | 'FM' | 'PM';

/**
 * Plays a short clip of an AM/FM/PM-modulated tone via the Web Audio API (brief §6 — "hear the
 * difference"). A low message wobbles an audible carrier: AM becomes tremolo (amplitude wobble), FM
 * and PM become vibrato (pitch wobble). The AudioContext is created lazily on first play (autoplay
 * policy), and a short fade avoids clicks.
 */
export function useModulatedAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
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

  const stop = useCallback(() => {
    const src = srcRef.current;
    if (src) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      srcRef.current = null;
    }
    setPlaying(false);
  }, []);

  const play = useCallback(
    (scheme: AnalogScheme, depth: number) => {
      const ctx = ensureContext();
      if (!ctx) return;
      void ctx.resume();
      stop();

      const sr = ctx.sampleRate;
      const dur = 2.2;
      const n = Math.floor(sr * dur);
      const buf = ctx.createBuffer(1, n, sr);
      const ch = buf.getChannelData(0);

      const fc = 440; // audible carrier (A4)
      const fm = 5; // message wobble rate (Hz)
      const fadeN = Math.floor(sr * 0.03);
      let phase = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const m = Math.sin(2 * Math.PI * fm * t);
        let x: number;
        if (scheme === 'AM') {
          x = ((1 + depth * m) / (1 + depth)) * Math.sin(2 * Math.PI * fc * t);
        } else if (scheme === 'FM') {
          phase += (2 * Math.PI * (fc + depth * 150 * m)) / sr;
          x = Math.sin(phase);
        } else {
          x = Math.sin(2 * Math.PI * fc * t + depth * 6 * m);
        }
        const env = Math.min(1, i / fadeN, (n - i) / fadeN); // click-free fade in/out
        ch[i] = 0.18 * env * x;
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.onended = () => {
        if (srcRef.current === src) {
          srcRef.current = null;
          setPlaying(false);
        }
      };
      src.start();
      srcRef.current = src;
      setPlaying(true);
    },
    [ensureContext, stop]
  );

  useEffect(() => {
    return () => {
      srcRef.current?.stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
      srcRef.current = null;
    };
  }, []);

  return { play, stop, playing };
}
