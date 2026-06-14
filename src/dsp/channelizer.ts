/**
 * Channelization (brief §7, Track D Layer 2 marquee) — splitting one wide band into many narrow
 * channels. A digital downconverter pulls out one channel (mix → low-pass → decimate); a filter
 * bank does all `N` at once. The FFT *is* a filter bank with a rectangular prototype (leaky); a
 * polyphase filter bank swaps in a designed prototype for sharp, clean channels.
 */

import { type Complex } from './complex';
import { firLowpass } from './filter';
import { filterComplex } from './multirate';

/** Mix a signal down by `freq` (cycles/sample): multiply by e^{−j2π·freq·n}. */
function mixDown(signal: Complex[], freq: number): Complex[] {
  return signal.map((s, n) => {
    const a = -2 * Math.PI * freq * n;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    return { re: s.re * c - s.im * sn, im: s.re * sn + s.im * c };
  });
}

const downsample = (signal: Complex[], factor: number): Complex[] => {
  const out: Complex[] = [];
  for (let i = 0; i < signal.length; i += factor) out.push(signal[i]);
  return out;
};

/**
 * Digital downconverter: tune to `centerFreq` (cycles/sample), low-pass to isolate the channel, and
 * decimate by `decim` to its natural rate — the chosen signal slides to baseband and pops out alone.
 */
export function ddc(signal: Complex[], centerFreq: number, decim: number): Complex[] {
  const filtered = filterComplex(
    mixDown(signal, centerFreq),
    firLowpass(0.5 / decim, 8 * decim + 1)
  );
  return downsample(filtered, decim);
}

/** The bare-FFT filter bank's implicit prototype: a length-`nCh` rectangular window (leaky sinc). */
export function bareFftProto(nCh: number): number[] {
  return new Array(nCh).fill(1 / nCh);
}

/** A designed polyphase prototype: a windowed-sinc low-pass spanning `tapsPerBranch` per channel. */
export function pfbProto(nCh: number, tapsPerBranch = 8): number[] {
  return firLowpass(0.5 / nCh, nCh * tapsPerBranch);
}

/**
 * Analysis filter bank: split `signal` into `nCh` decimated baseband channel streams using prototype
 * `proto`. Each channel mixes its center frequency `k/nCh` to zero, filters with the prototype, and
 * decimates by `nCh`. A rectangular `proto` (`bareFftProto`) reproduces the leaky bare-FFT bank; a
 * designed `proto` (`pfbProto`) gives the sharp polyphase bank — same structure, better filter.
 */
export function channelize(signal: Complex[], nCh: number, proto: number[]): Complex[][] {
  const channels: Complex[][] = [];
  for (let k = 0; k < nCh; k++) {
    channels.push(downsample(filterComplex(mixDown(signal, k / nCh), proto), nCh));
  }
  return channels;
}
