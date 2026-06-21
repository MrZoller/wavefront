import { useEffect, useRef, type ReactNode } from 'react';
import { useIsCompactViewport } from '@/hooks/useMediaQuery';

/**
 * Audio is a desktop-only enrichment — so this hides its audio control where audio can't deliver.
 *
 * Mobile browsers gate the Web Audio API behind autoplay / gesture rules (and a suspended
 * AudioContext) that a single "hear it" tap can't reliably satisfy, so on a phone the control taps to
 * silence — a dead button that reads as broken. Rather than chase per-device resume hacks, we simply
 * don't offer the affordance where it falls short: the visuals carry the module on mobile, and audio
 * stays a desktop feature.
 *
 * Renders its child on `lg+` and suppresses it below `lg` — keyed off the *same* breakpoint as the
 * overlay-drawer layout (see {@link useIsCompactViewport}) so "mobile" means one thing app-wide. On
 * desktop it wraps the control in a Fragment, leaving it a direct child of its flex row exactly as
 * before, so desktop layout and behavior are untouched. Suppression is visibility-only: the audio
 * hooks build their AudioContext lazily on the button press, so a hidden button never initializes
 * audio — nothing audio-related runs on mobile. Wrap every audio trigger in this (guarded by a test).
 *
 * Crossing *into* compact while audio is playing (a desktop window dragged narrow, a tablet rotated,
 * a split-screen) would otherwise strand the sound: the trigger is the only stop control, and hiding
 * it leaves the oscillator running with no way to silence it. So pass `onSuppress` — the module's
 * audio `stop` — and the gate calls it as it suppresses the control, keeping "no control" and "no
 * sound" in lockstep. The callback also fires if the module first mounts already compact (a harmless
 * no-op there, since nothing is playing yet).
 */
export function DesktopAudioControl({
  children,
  onSuppress,
}: {
  children: ReactNode;
  onSuppress?: () => void;
}) {
  const isCompact = useIsCompactViewport();

  // Hold the latest callback in a ref so the suppress effect fires once on the transition into
  // compact — not on every render while compact, and regardless of whether the caller memoizes it.
  const onSuppressRef = useRef(onSuppress);
  useEffect(() => {
    onSuppressRef.current = onSuppress;
  }, [onSuppress]);

  useEffect(() => {
    if (isCompact) onSuppressRef.current?.();
  }, [isCompact]);

  if (isCompact) return null;
  return <>{children}</>;
}
