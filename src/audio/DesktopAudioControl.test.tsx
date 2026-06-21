import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DesktopAudioControl } from './DesktopAudioControl';

/** Pin matchMedia so the compact-viewport query resolves deterministically (jsdom lacks it). */
function setViewport(compact: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: compact, // useIsCompactViewport matches below `lg`
    media: '',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe('DesktopAudioControl', () => {
  it('renders its audio control on desktop (lg+)', () => {
    setViewport(false);
    render(
      <DesktopAudioControl>
        <button>► hear it</button>
      </DesktopAudioControl>
    );
    expect(screen.getByRole('button', { name: '► hear it' })).toBeInTheDocument();
  });

  it('suppresses the audio control below lg — no dead button to tap on mobile', () => {
    setViewport(true);
    render(
      <DesktopAudioControl>
        <button>► hear it</button>
      </DesktopAudioControl>
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

/**
 * Audio is a desktop-only enrichment: on mobile a "hear it" tap leads to silence (autoplay/gesture
 * rules), which reads as a broken, dead button. The fix is one gate — <DesktopAudioControl> — that
 * suppresses the control below `lg`. This enforces it by construction, the way <Slider> enforces "no
 * raw range input": any module that pulls in a Web Audio playback hook must route its trigger through
 * the gate, so a new audio module can't reintroduce a dead mobile button by forgetting to.
 */
describe('every audio control is gated through <DesktopAudioControl>', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

  it('every module using a Web Audio playback hook also gates it for mobile', () => {
    const modulesDir = join(import.meta.dirname, '..', 'modules');
    const offenders = walk(modulesDir)
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        return /@\/audio\/use\w+/.test(src) && !src.includes('DesktopAudioControl');
      });
    expect(
      offenders,
      `These modules trigger Web Audio but don't gate the control behind <DesktopAudioControl>, so they would show a dead "hear it" button on mobile:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
