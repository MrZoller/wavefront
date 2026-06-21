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
  /**
   * Whether the nav drawer is open. Only consulted below the desktop breakpoint, where the sidebar
   * collapses to a hamburger-toggled overlay; at desktop width the sidebar is always visible and
   * this flag is inert. Every navigation action clears it, so choosing a destination on a phone
   * dismisses the drawer and reveals the content it routed to.
   */
  sidebarOpen: boolean;
  /** Open a module (or pass null to return to the landing); always leaves the reference pages. */
  setActiveModule: (id: string | null) => void;
  /** Open the Glossary index — a deliberate reference destination, not a module. */
  openGlossary: () => void;
  /** Open the About page — a quiet reference destination (what the tool is, and isn't). */
  openAbout: () => void;
  /** Toggle the mobile nav drawer (hamburger). No-op visually at desktop width. */
  toggleSidebar: () => void;
  /** Close the mobile nav drawer (backdrop tap, Escape, or after navigating). */
  closeSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModuleId: null,
  glossaryOpen: false,
  aboutOpen: false,
  sidebarOpen: false,
  // Navigating always dismisses the mobile drawer so the chosen destination is what's on screen.
  setActiveModule: (id) =>
    set({ activeModuleId: id, glossaryOpen: false, aboutOpen: false, sidebarOpen: false }),
  openGlossary: () =>
    set({ activeModuleId: null, glossaryOpen: true, aboutOpen: false, sidebarOpen: false }),
  openAbout: () =>
    set({ activeModuleId: null, glossaryOpen: false, aboutOpen: true, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
