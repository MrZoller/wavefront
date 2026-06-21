import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DesktopAudioControl } from './DesktopAudioControl';

/**
 * A controllable matchMedia whose `matches` can be flipped to fire a `change` at listeners — lets a
 * test cross the `lg` breakpoint at runtime (a window dragged narrow, a tablet rotated). jsdom has no
 * matchMedia of its own, so each test installs this.
 */
function mockMatchMedia(initialCompact: boolean) {
  let matches = initialCompact; // useIsCompactViewport matches below `lg`
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockReturnValue({
    get matches() {
      return matches;
    },
    media: '',
    onchange: null,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: (cb: () => void) => listeners.add(cb),
    removeListener: (cb: () => void) => listeners.delete(cb),
    dispatchEvent: () => false,
  }) as unknown as typeof window.matchMedia;
  return {
    set(nextCompact: boolean) {
      matches = nextCompact;
      listeners.forEach((cb) => cb());
    },
  };
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe('DesktopAudioControl', () => {
  it('renders its audio control on desktop (lg+) without stopping anything', () => {
    mockMatchMedia(false);
    const onSuppress = vi.fn();
    render(
      <DesktopAudioControl onSuppress={onSuppress}>
        <button>► hear it</button>
      </DesktopAudioControl>
    );
    expect(screen.getByRole('button', { name: '► hear it' })).toBeInTheDocument();
    expect(onSuppress).not.toHaveBeenCalled();
  });

  it('suppresses the control below lg — no dead button to tap on mobile', () => {
    mockMatchMedia(true);
    render(
      <DesktopAudioControl onSuppress={() => {}}>
        <button>► hear it</button>
      </DesktopAudioControl>
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('stops in-flight playback when the viewport crosses into compact', () => {
    // Start on desktop with the control shown, then drag below `lg`: the button vanishes AND playback
    // is stopped, so audio can't keep running with no visible way to silence it.
    const { set } = mockMatchMedia(false);
    const onSuppress = vi.fn();
    render(
      <DesktopAudioControl onSuppress={onSuppress}>
        <button>► hear it</button>
      </DesktopAudioControl>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(onSuppress).not.toHaveBeenCalled();

    act(() => set(true));

    expect(screen.queryByRole('button')).toBeNull();
    expect(onSuppress).toHaveBeenCalledTimes(1);
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
