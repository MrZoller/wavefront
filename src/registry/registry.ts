import type { ModuleDef, TrackId } from './types';

/**
 * The module registry. The app composes all navigation from this list (brief §9).
 *
 * To add a module: import its component and push a `ModuleDef` here. That's the
 * entire wiring step — see docs/ARCHITECTURE.md.
 */
const MODULES: ModuleDef[] = [];

/** Register a module. Throws on duplicate ids so collisions surface immediately. */
export function registerModule(def: ModuleDef): void {
  if (MODULES.some((m) => m.id === def.id)) {
    throw new Error(`Duplicate module id: "${def.id}"`);
  }
  MODULES.push(def);
}

/** All registered modules, in registration order. */
export function getModules(): readonly ModuleDef[] {
  return MODULES;
}

/** Modules belonging to a given track, in registration order. */
export function getModulesForTrack(track: TrackId): ModuleDef[] {
  return MODULES.filter((m) => m.track === track);
}

/** Look up a single module by id. */
export function getModule(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}
