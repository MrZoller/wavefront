import type { ReactNode } from 'react';
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
 */
export function DesktopAudioControl({ children }: { children: ReactNode }) {
  const isCompact = useIsCompactViewport();
  if (isCompact) return null;
  return <>{children}</>;
}
