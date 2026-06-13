import { create } from 'zustand';

/**
 * Lightweight global UI state (brief §10 — Zustand, no heavy frameworks).
 * Kept in memory only; no browser storage (§10).
 */
interface AppState {
  /** Currently open module id, or null for the track overview. */
  activeModuleId: string | null;
  setActiveModule: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModuleId: null,
  setActiveModule: (id) => set({ activeModuleId: id }),
}));
