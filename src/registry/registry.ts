import { TRACK_BY_ID } from './tracks';
import type { ModuleDef, TrackId } from './types';

/**
 * The module registry. The app composes all navigation from this list (brief §9).
 *
 * To add a module: import its component and push a `ModuleDef` here. That's the
 * entire wiring step — see docs/ARCHITECTURE.md.
 */
const MODULES: ModuleDef[] = [];

/**
 * Register a module. Repeated registration of the same id (e.g. Vite HMR re-evaluating a
 * module entry during `npm run dev`) replaces the existing definition so editing a lesson
 * never crashes the dev session. In production builds a duplicate id is a real collision and
 * throws so it surfaces immediately.
 */
export function registerModule(def: ModuleDef): void {
  const existing = MODULES.findIndex((m) => m.id === def.id);
  if (existing !== -1) {
    if (import.meta.env.PROD) {
      throw new Error(`Duplicate module id: "${def.id}"`);
    }
    MODULES[existing] = def;
    return;
  }
  MODULES.push(def);
}

/** All registered modules, in registration order. */
export function getModules(): readonly ModuleDef[] {
  return MODULES;
}

/** Modules belonging to a given track, in pedagogical sequence (ascending `order`). */
export function getModulesForTrack(track: TrackId): ModuleDef[] {
  return MODULES.filter((m) => m.track === track).sort((a, b) => a.order - b.order);
}

/** Look up a single module by id. */
export function getModule(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}

/**
 * User-facing badge labels for a module's internal `status`. The raw token is **authoring
 * vocabulary** and is never rendered: `stub` means "deliberately lighter / conceptual lesson" to the
 * team, but a "STUB" badge reads as "unfinished / placeholder" to a user and undersells a finished,
 * interactive module — so it surfaces as **"Conceptual"**. `stable` carries no badge. This is the
 * same authoring→presentation mapping as layer names, and the same no-internal-vocabulary rule that
 * keeps `Layer N` / `Track X` out of rendered copy (see CONTRIBUTING).
 */
const MODULE_STATUS_LABELS: Record<NonNullable<ModuleDef['status']>, string | null> = {
  stable: null,
  advanced: 'Advanced',
  stub: 'Conceptual',
};

/** The user-facing badge label for a module's status, or `null` when no badge should render. */
export function moduleStatusBadge(status: ModuleDef['status']): string | null {
  return status ? MODULE_STATUS_LABELS[status] : null;
}

/** A track's layer (stage), with its human name and the ordered modules that belong to it. */
export interface TrackLayer {
  layer: number;
  name: string;
  modules: ModuleDef[];
}

/**
 * The track's modules grouped into ordered layers, each carrying its human name — the single
 * source the sidebar and landing card both render from, so they stay in sync and a new module
 * inherits the staged structure by declaring its `layer`/`order`. Modules within a layer keep
 * pedagogical order; layers are returned ascending.
 */
export function getTrackLayers(track: TrackId): TrackLayer[] {
  const def = TRACK_BY_ID[track];
  const groups = new Map<number, ModuleDef[]>();
  for (const m of getModulesForTrack(track)) {
    const group = groups.get(m.layer);
    if (group) group.push(m);
    else groups.set(m.layer, [m]);
  }
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .map((layer) => ({
      layer,
      name: def?.layerNames?.[layer] ?? `Layer ${layer}`,
      modules: groups.get(layer)!,
    }));
}
