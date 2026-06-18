import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';
// Registering the modules gives the nav real data — including the internally `stub`-status module.
import '@/modules';

afterEach(cleanup);

/**
 * Badges are part of the no-internal-vocabulary rule: a module's `status` is authoring vocabulary, so
 * the rendered badge must be a user-facing label, never the raw token. `stub` is the trap — shown raw
 * it reads as "unfinished" and undersells a finished, interactive lesson, so it must surface as
 * "Conceptual". This render test guards that the mapping is actually applied at the badge.
 */
describe('Sidebar status badges never leak the raw internal token', () => {
  it('renders conceptual (internally "stub") modules as "Conceptual", not "STUB"', () => {
    render(<Sidebar />);
    // One badge per stub-status module (e.g. HF Skywave, Synchronization) — all mapped, none raw.
    expect(screen.getAllByText('Conceptual').length).toBeGreaterThan(0);
    expect(screen.queryByText('stub')).toBeNull();
    expect(screen.queryByText('STUB')).toBeNull();
  });
});
