import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ControlRail, ControlRailSlotProvider } from './ControlRail';

afterEach(cleanup);

/**
 * The rail keeps a module's controls reachable while the plots scroll, without the plots sliding
 * under it — so it renders as a solid, opaque floor/ceiling and, when the matching edge slot is
 * provided, pins itself there (out of the scroll region). jsdom can't measure layout, but it can pin
 * the mechanism: drop the opaque background, the edge-correct border, or the portal-to-slot and this
 * fails before a tall module regresses.
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
    expect(rail.className).toContain('border-t'); // a bottom rail's boundary faces up, not a blend
  });

  it('borders the edge it pins to: a top rail is a ceiling (border-b), a bottom rail a floor (border-t)', () => {
    const { container: top } = render(
      <ControlRail edge="top">
        <span>x</span>
      </ControlRail>
    );
    const topRail = top.firstChild as HTMLElement;
    expect(topRail.className).toContain('border-b');
    expect(topRail.className).not.toContain('border-t');

    const { container: bottom } = render(
      <ControlRail edge="bottom">
        <span>x</span>
      </ControlRail>
    );
    expect((bottom.firstChild as HTMLElement).className).toContain('border-t');
  });

  it('pins its controls into the provided footer (bottom) slot, out of the scroll region', () => {
    const slot = document.createElement('div');
    document.body.appendChild(slot);
    const { container } = render(
      <ControlRailSlotProvider bottom={slot}>
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

  it('pins a top-anchored rail into the header (top) slot', () => {
    const top = document.createElement('div');
    const bottom = document.createElement('div');
    document.body.append(top, bottom);
    const { container } = render(
      <ControlRailSlotProvider top={top} bottom={bottom}>
        <ControlRail edge="top">
          <button type="button">Pinned top</button>
        </ControlRail>
      </ControlRailSlotProvider>
    );
    // Goes to the header slot for its edge, not the footer and not the inline flow.
    expect(top.querySelector('button')?.textContent).toBe('Pinned top');
    expect(bottom.querySelector('button')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    top.remove();
    bottom.remove();
  });

  it('renders in place when the edge it wants has no slot', () => {
    // A bottom slot is provided but the rail is top-anchored: it falls back to rendering in place
    // rather than mis-pinning into the wrong edge.
    const bottom = document.createElement('div');
    document.body.appendChild(bottom);
    const { container } = render(
      <ControlRailSlotProvider bottom={bottom}>
        <ControlRail edge="top">
          <button type="button">In place</button>
        </ControlRail>
      </ControlRailSlotProvider>
    );
    expect(container.querySelector('button')?.textContent).toBe('In place');
    expect(bottom.querySelector('button')).toBeNull();
    bottom.remove();
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
