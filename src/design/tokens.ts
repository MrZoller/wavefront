/**
 * Design tokens — the single source of truth for Wavefront's visual language (brief §11).
 *
 * Vibe: a dark "instrument panel / oscilloscope" base with a restrained phosphor accent.
 * These tokens are mirrored as CSS custom properties in `index.css`; keep the two in sync.
 * Plot/canvas code reads from here so every track renders in one consistent palette.
 */

export const colors = {
  // Deep neutral darks — the instrument chassis.
  bg: '#070b0e',
  surface: '#0d1418',
  surfaceRaised: '#121b21',
  border: '#1e2c33',

  // Text.
  text: '#e6f0ee',
  textMuted: '#8aa1a0',
  // Tertiary text — a phosphor-tinted grey: AA-readable (~5.7:1 on the dark surface) yet still
  // dimmer than `textMuted`, so the hierarchy (text > muted > faint) holds.
  textFaint: '#74968a',

  // Phosphor accents — signal-green primary, cyan secondary.
  signal: '#3ef0a0',
  signalDim: '#1f7a55',
  cyan: '#42d4f4',
  cyanDim: '#1f6a86',

  // Warm alert hue (errors, bit-error highlights, danger zones).
  alert: '#ff6b5e',
  alertDim: '#7a2f2a',

  // A small categorical palette for multi-trace plots (constellations, multi-signal scenes).
  trace: ['#3ef0a0', '#42d4f4', '#f4c542', '#c98bff', '#ff8f6b', '#6b8cff'] as const,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
} as const;

export const typography = {
  // Clean geometric sans for UI; crisp monospace for numeric readouts.
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace",
} as const;

/** Standard easing for the "nothing snaps" motion principle (§11). */
export const motion = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  durationFast: 120,
  durationBase: 240,
  durationSlow: 480,
} as const;
