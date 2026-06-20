import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ControlRail, ControlRailSlotProvider } from './ControlRail';

afterEach(cleanup);

/**
 * The rail keeps a module's controls reachable while the plots scroll, without the plots sliding
 * under it — so it renders as a solid, opaque floor and, when a footer slot is provided, pins itself
 * there (out of the scroll region). jsdom can't measure layout, but it can pin the mechanism: drop
 * the opaque background or the portal-to-footer and this fails before a tall module regresses.
 */
describe('ControlRail', () => {
  it('renders its controls as a solid, opaque rail (not a transparent overlay)', () => {
    const { container } = render(
      <ControlRail>
        <button type="button">Drag me</button>
      </ControlRail>
    );
    expect(screen.getByRole('button', { name: 'Drag me' })).toBeInTheDocument();
    const rail = container.firstChild as HTMLElement;
    expect(rail.className).toContain('bg-surface'); // opaque token background
    expect(rail.className).toContain('border-t'); // a visible boundary, not a blend
  });

  it('pins its controls into the provided footer slot (out of the scroll region)', () => {
    const slot = document.createElement('div');
    document.body.appendChild(slot);
    const { container } = render(
      <ControlRailSlotProvider slot={slot}>
        <ControlRail>
          <button type="button">Pinned</button>
        </ControlRail>
      </ControlRailSlotProvider>
    );
    // Portaled into the footer, not left inline in the scroll flow.
    expect(slot.querySelector('button')?.textContent).toBe('Pinned');
    expect(container.querySelector('button')).toBeNull();
    slot.remove();
  });

  it('merges a caller className', () => {
    const { container } = render(
      <ControlRail className="custom-rail">
        <span>x</span>
      </ControlRail>
    );
    expect((container.firstChild as HTMLElement).className).toContain('custom-rail');
  });
});
