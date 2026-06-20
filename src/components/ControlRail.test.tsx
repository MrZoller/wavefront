import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ControlRail } from './ControlRail';

afterEach(cleanup);

/**
 * The rail's whole job is to keep a module's controls reachable while the plots scroll, so the
 * direct-manipulation loop is never severed. jsdom can't measure layout, but it can pin the
 * mechanism: the rail must render its controls and apply sticky-to-bottom positioning. If someone
 * drops the stickiness, this fails before the regression reaches a tall synthesis module.
 */
describe('ControlRail', () => {
  it('renders its controls and sticks to the bottom of the scroll column', () => {
    const { container } = render(
      <ControlRail>
        <button type="button">Drag me</button>
      </ControlRail>
    );
    expect(screen.getByRole('button', { name: 'Drag me' })).toBeInTheDocument();
    const rail = container.firstChild as HTMLElement;
    expect(rail.className).toContain('sticky');
    expect(rail.className).toContain('bottom-0');
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
