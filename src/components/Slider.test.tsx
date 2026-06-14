import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

afterEach(cleanup);

describe('Slider', () => {
  it('pairs the static field name with its live (accent) value and reports changes', () => {
    const onChange = vi.fn();
    render(
      <Slider
        label="Noise"
        value={0.4}
        min={0}
        max={1.5}
        step={0.05}
        decimals={2}
        onChange={onChange}
      />
    );
    expect(screen.getByText('Noise')).toBeInTheDocument();
    expect(screen.getByText('0.40')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', 'Noise');
  });

  it('renders an explicit display value when the shown value differs from the raw one', () => {
    render(
      <Slider
        label="Baseline d"
        value={0.5}
        min={0.1}
        max={2}
        step={0.05}
        display="0.50 λ"
        onChange={() => {}}
      />
    );
    expect(screen.getByText('0.50 λ')).toBeInTheDocument();
  });
});

/**
 * The point of the shared component is that "every slider looks the same" is true by construction,
 * not by remembering. This is the enforcement: a module that hand-rolls `<input type="range">`
 * skips the affordance treatment (track surface, filled-to-value, grabbable handle) — exactly the
 * bug that let the Sampling & Aliasing slider ship as a bare dot. Fail loudly if one reappears.
 */
describe('every slider goes through the shared <Slider>', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

  it('no module inlines a raw <input type="range">', () => {
    const modulesDir = join(import.meta.dirname, '..', 'modules');
    const offenders = walk(modulesDir)
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => /type=["']range["']/.test(readFileSync(f, 'utf8')));
    expect(
      offenders,
      `These module files inline a raw range input — route them through <Slider> instead:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
