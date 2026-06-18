import { create } from 'zustand';

/**
 * Lightweight global UI state (brief §10 — Zustand, no heavy frameworks).
 * Kept in memory only; no browser storage (§10).
 *
 * The shell renders one of three destinations from this state: an open module (`activeModuleId`),
 * the browse-all Glossary index (`glossaryOpen`), or — when neither — the landing track overview.
 */
interface AppState {
  /** Currently open module id, or null when no module is open. */
  activeModuleId: string | null;
  /** Whether the Glossary index page is showing (only relevant when no module is open). */
  glossaryOpen: boolean;
  /** Open a module (or pass null to return to the landing); always leaves the Glossary. */
  setActiveModule: (id: string | null) => void;
  /** Open the Glossary index — a deliberate reference destination, not a module. */
  openGlossary: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModuleId: null,
  glossaryOpen: false,
  setActiveModule: (id) => set({ activeModuleId: id, glossaryOpen: false }),
  openGlossary: () => set({ activeModuleId: null, glossaryOpen: true }),
}));
