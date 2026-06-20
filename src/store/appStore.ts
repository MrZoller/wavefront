import { create } from 'zustand';

/**
 * Lightweight global UI state (brief §10 — Zustand, no heavy frameworks).
 * Kept in memory only; no browser storage (§10).
 *
 * The shell renders one of four destinations from this state: an open module (`activeModuleId`),
 * the browse-all Glossary index (`glossaryOpen`), the About page (`aboutOpen`), or — when none is
 * set — the landing track overview. The two reference pages are mutually exclusive with each other
 * and with an open module, so every opener clears the other flags.
 */
interface AppState {
  /** Currently open module id, or null when no module is open. */
  activeModuleId: string | null;
  /** Whether the Glossary index page is showing (only relevant when no module is open). */
  glossaryOpen: boolean;
  /** Whether the About page is showing (only relevant when no module is open). */
  aboutOpen: boolean;
  /** Open a module (or pass null to return to the landing); always leaves the reference pages. */
  setActiveModule: (id: string | null) => void;
  /** Open the Glossary index — a deliberate reference destination, not a module. */
  openGlossary: () => void;
  /** Open the About page — a quiet reference destination (what the tool is, and isn't). */
  openAbout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModuleId: null,
  glossaryOpen: false,
  aboutOpen: false,
  setActiveModule: (id) => set({ activeModuleId: id, glossaryOpen: false, aboutOpen: false }),
  openGlossary: () => set({ activeModuleId: null, glossaryOpen: true, aboutOpen: false }),
  openAbout: () => set({ activeModuleId: null, glossaryOpen: false, aboutOpen: true }),
}));
