import { describe, expect, it } from 'vitest';
import { matchTerms, isTermSegment, type Segment } from './match';

/** Convenience: the list of (id, text) for the term segments only. */
const terms = (segs: Segment[]) =>
  segs.filter(isTermSegment).map((s) => ({ id: s.id, text: s.text }));

/** Reassembling all segments must reproduce the input exactly (no dropped/added chars). */
const roundtrip = (text: string) =>
  matchTerms(text)
    .map((s) => s.text)
    .join('');

describe('matchTerms tokenization', () => {
  it('marks both halves of a slash pair (QPSK/QAM)', () => {
    expect(terms(matchTerms('use QPSK/QAM here'))).toEqual([
      { id: 'qpsk', text: 'QPSK' },
      { id: 'qam', text: 'QAM' },
    ]);
  });

  it('matches 16-QAM as a single unit, not QAM inside it', () => {
    expect(terms(matchTerms('switch to 16-QAM now'))).toEqual([{ id: 'qam', text: '16-QAM' }]);
  });

  it('does not false-match acronyms inside words', () => {
    for (const word of ['confirm', 'amplitude', 'unique', 'diagram', 'examine', 'firm']) {
      expect(terms(matchTerms(`the ${word} thing`)), word).toEqual([]);
    }
  });

  it('matches multi-word phrases', () => {
    expect(terms(matchTerms('a matched filter helps'))).toEqual([
      { id: 'matched-filter', text: 'matched filter' },
    ]);
    expect(terms(matchTerms('spectral leakage smears'))).toEqual([
      { id: 'spectral-leakage', text: 'spectral leakage' },
    ]);
  });

  it('matches simple plurals to the singular entry', () => {
    expect(terms(matchTerms('the constellations blur'))).toEqual([
      { id: 'constellation', text: 'constellations' },
    ]);
  });

  it('matches a sentence-initial capital of a lowercase term', () => {
    expect(terms(matchTerms('Carrier rides the wave'))).toEqual([
      { id: 'carrier', text: 'Carrier' },
    ]);
  });

  it('matches I/Q and respects the slash boundary', () => {
    expect(terms(matchTerms('an I/Q sample'))).toEqual([{ id: 'iq', text: 'I/Q' }]);
  });

  it('matches aliases (angle-of-arrival → aoa, Doppler → doppler)', () => {
    expect(terms(matchTerms('angle-of-arrival finding'))).toEqual([
      { id: 'aoa', text: 'angle-of-arrival' },
    ]);
    expect(terms(matchTerms('a Doppler shift'))[0]).toEqual({
      id: 'doppler',
      text: 'Doppler shift',
    });
  });

  it('prefers dBm over dB at the same position (longest-match)', () => {
    expect(terms(matchTerms('-90 dBm received'))).toEqual([{ id: 'dbm', text: 'dBm' }]);
    expect(terms(matchTerms('3 dB down'))).toEqual([{ id: 'db', text: 'dB' }]);
  });

  it('never drops or duplicates characters', () => {
    const samples = [
      'use QPSK/QAM and 16-QAM with an I/Q matched filter at 3 dB',
      'plain text with no terms at all',
      'FFT, FFT, and FFT again',
    ];
    for (const s of samples) expect(roundtrip(s)).toBe(s);
  });
});
