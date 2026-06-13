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

/** Modules belonging to a given track, in registration order. */
export function getModulesForTrack(track: TrackId): ModuleDef[] {
  return MODULES.filter((m) => m.track === track);
}

/** Look up a single module by id. */
export function getModule(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}
