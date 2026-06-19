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

  // Text = STATIC content, the accent's counterpart. Labels, titles, units, axis captions, prose,
  // and field *names* stay neutral (text > muted > faint hierarchy). See the accent note below.
  text: '#e6f0ee',
  textMuted: '#8aa1a0',
  // Tertiary text — a phosphor-tinted grey: AA-readable (~5.7:1 on the dark surface) yet still
  // dimmer than `textMuted`, so the hierarchy (text > muted > faint) holds.
  textFaint: '#74968a',

  // Phosphor accents = LIVE / INTERACTIVE — the accent's one job. `signal` (primary) and `cyan`
  // (secondary) mark what changes or responds to the user: current readout values, live slider
  // values, the active nav item, links, and draggable-handle accents. Never put them on static
  // labels, titles, units, or formulas — those are neutral `text*`. The learnable rule is
  // "green = the stuff that's alive / that I can act on". (CONTRIBUTING → "Accent color semantics".)
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

/** Parse a `#rrggbb` token into an `[r, g, b]` tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Build an `rgba(...)` string from a token hex + alpha. This is the sanctioned way for `<canvas>`
 * 2D contexts and gradient stops to use a token color — CSS `var(--color-*)` doesn't resolve there,
 * so without this the hex would have to be copied into the component as a literal. Keeps the value
 * in {@link colors} as the single source of truth.
 */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Pre-parsed `[r, g, b]` channels of the signal accent — for canvas colormap / gradient stops that
 *  interpolate raw channels rather than taking a CSS color string. */
export const signalRgb = hexToRgb(colors.signal);

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
