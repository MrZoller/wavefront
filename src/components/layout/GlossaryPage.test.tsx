import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GlossaryPage } from './GlossaryPage';
// Importing the module barrel registers every module so the "Learn more →" links resolve.
import '@/modules';

afterEach(cleanup);

/**
 * The Glossary index is generated from the canonical term map, so these pin the contract: real terms
 * render, the filter narrows the list, an unmatched query shows the empty state, and entries with a
 * `moduleId` expose a "Learn more" link.
 */
describe('GlossaryPage', () => {
  it('renders entries from the glossary map with module links', () => {
    render(<GlossaryPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Glossary' })).toBeInTheDocument();
    expect(screen.getByText('AWGN')).toBeInTheDocument();
    expect(screen.getByText('— Additive White Gaussian Noise')).toBeInTheDocument();
    // Linked terms surface a "Learn more →" control (reusing the registry).
    expect(screen.getAllByText(/Learn more →/).length).toBeGreaterThan(0);
  });

  it('filters the list as you type and shows an empty state', () => {
    render(<GlossaryPage />);
    expect(screen.getByText('AWGN')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'syndrome' } });
    expect(screen.getByText('syndrome')).toBeInTheDocument();
    expect(screen.queryByText('AWGN')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzzzz' } });
    expect(screen.getByText(/No terms match/)).toBeInTheDocument();
  });
});
