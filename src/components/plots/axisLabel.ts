/**
 * Axis labeling for the shared plot components.
 *
 * Wavefront's premise is that the *visualization* carries the intuition and the prose only
 * supports it — so an unlabeled axis inverts the whole tool. Every shared plot must therefore say
 * what each axis represents. The contract (see CONTRIBUTING.md → "Labeling plot axes"):
 *
 * 1. **Always label the quantity** (and its scale): `Time`, `Frequency`, `Magnitude (dB)`,
 *    `Amplitude`, `Phase (°)`, `Sample`… This is the mandatory, non-optional part — hence
 *    `quantity` is a required field and {@link formatAxisLabel} rejects an empty one.
 * 2. **Show a unit only when the quantity actually has one.** Normalized / unitless axes (a window
 *    taper weight, a sample index) carry no unit, so leave `unit` off rather than inventing one.
 * 3. **Where the scale is the lesson, the label is doing teaching work** — dB, normalized
 *    frequency, and log axes always keep their label/unit.
 *
 * The type splits meaning from unit so the "unit only where it's real" rule is structural, not a
 * convention someone has to remember.
 */
export interface AxisLabel {
  /**
   * What the axis represents — the quantity and, where relevant, its scale (e.g. `Time`,
   * `Magnitude`, `Sample`, `Bit error rate (log)`). **Required and must be non-empty:** a plot
   * that can't name its axis shouldn't render.
   */
  quantity: string;
  /**
   * The real unit, *only* when the quantity genuinely has one — `Hz`, `dB`, `°`, `cycles/sample`.
   * Omit it for normalized or unitless axes instead of fabricating a unit.
   */
  unit?: string;
}

/**
 * Render an {@link AxisLabel} as a single caption string: `Magnitude (dB)` when a unit is present,
 * or just `Sample` when it isn't.
 *
 * Throws on an empty/whitespace `quantity` — this is the runtime half of the "every axis is
 * labeled" guarantee (the type system enforces presence; this enforces non-emptiness, including for
 * dynamically-built labels). The shared plots call this while rendering, so a missing label fails
 * loudly in dev and in tests rather than shipping a silently-unlabeled axis.
 */
export function formatAxisLabel(label: AxisLabel): string {
  const quantity = label.quantity.trim();
  if (!quantity) {
    throw new Error(
      'AxisLabel.quantity is required and must be non-empty — every plot axis must name what it represents.'
    );
  }
  const unit = label.unit?.trim();
  return unit ? `${quantity} (${unit})` : quantity;
}

/**
 * Combine the two axis labels into a screen-reader description, e.g.
 * `Magnitude (dB) versus Frequency (Hz)`. Used as the default `aria-label` for a plot when the
 * caller hasn't supplied a richer one.
 */
export function axisAriaLabel(yLabel: AxisLabel, xLabel: AxisLabel): string {
  return `${formatAxisLabel(yLabel)} versus ${formatAxisLabel(xLabel)}`;
}

/**
 * Canonical labels for the axes that recur across modules, so every spectrum says exactly
 * `Magnitude (dB)` and every normalized axis is worded the same way (consistency the "apply the
 * same line" rule asks for). Module-specific axes pass an inline `{ quantity, unit? }` instead.
 */
export const AXIS = {
  /** Magnitude on a dB scale. The dB *is* the concept here, so it's always shown. */
  magnitudeDb: { quantity: 'Magnitude', unit: 'dB' },
  /** Frequency with no real Hz scale — measured in cycles/sample over the centered band. */
  normalizedFrequency: { quantity: 'Normalized frequency', unit: 'cycles/sample' },
  /** A sample / index position within a block (unitless). */
  sample: { quantity: 'Sample' },
  /** Elapsed time across a sampled waveform (no fixed unit — the oscilloscope x-axis). */
  time: { quantity: 'Time' },
  /** Normalized amplitude / taper weight (unitless). */
  amplitude: { quantity: 'Amplitude' },
} satisfies Record<string, AxisLabel>;
