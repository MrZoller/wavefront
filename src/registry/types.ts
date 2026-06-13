import type { ComponentType } from 'react';

/**
 * The module registry contract (brief §9).
 *
 * Adding a module to Wavefront = adding a `ModuleDef` to the registry, nothing more.
 * Navigation, routing, and track composition are all derived from these declarations,
 * so new tracks slot in without rewrites. See docs/ARCHITECTURE.md for the full recipe.
 */

/** Stable identifiers for the tracks specified in the brief (§4–§8). */
export type TrackId =
  | 'direction-finding'
  | 'playing-a-radio-signal'
  | 'modulations-and-waveforms'
  | 'fundamentals'
  | 'propagation-and-bands'
  | 'coding-and-equalization';

/** A self-contained learning unit: one intuition + one interactive visualization. */
export interface ModuleDef {
  /** Globally unique, URL-safe id (e.g. "rotating-phasor"). */
  id: string;
  /** Human-readable title shown in navigation and headers. */
  title: string;
  /** Which track this module belongs to. */
  track: TrackId;
  /** The single-sentence intuition shown before the interactive toy (§3.4). */
  oneLineIntuition: string;
  /** The interactive React component — the lesson itself. */
  component: ComponentType;
  /**
   * Optional explanatory / "go deeper" content rendered in the side rail (§3.4).
   * Kept as a component so modules can mix prose, equations, and small diagrams.
   */
  explanation?: ComponentType;
  /** Optional flag for advanced/optional or stretch modules (§4 marks several). */
  status?: 'stable' | 'advanced' | 'stub';
}

/** An ordered collection of modules with shared framing (brief §9). */
export interface TrackDef {
  id: TrackId;
  title: string;
  /** The non-EE-facing framing: the question this track answers. */
  description: string;
  /** Build/ship status so the shell can flag what's live vs. in progress vs. planned. */
  status: 'shipping' | 'building' | 'planned';
}
