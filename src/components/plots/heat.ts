import { signalRgb } from '@/design/tokens';

/**
 * The shared dB-magnitude heat ramp for the canvas heatmaps — the spectrogram/waterfall view and the
 * 2D acquisition/correlation surfaces (range-Doppler, code-phase × Doppler) alike. Dark → cyan →
 * signal-green → amber as the normalized level `t` runs 0 → 1, so every heatmap in the app reads the
 * same energy scale (brief §11 design tokens). `t` is expected pre-normalized to [0, 1].
 */
export function heatColor(t: number): string {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [7, 11, 14]],
    [0.45, [31, 106, 134]],
    [0.7, signalRgb],
    [1, [244, 197, 66]],
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const f = (t - lo[0]) / (hi[0] - lo[0] || 1);
  const ch = (k: number) => Math.round(lo[1][k] + f * (hi[1][k] - lo[1][k]));
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
}
