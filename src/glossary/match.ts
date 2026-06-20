import { GLOSSARY, allTerms } from './glossary';

/**
 * The glossary matcher — the single place that decides *which* spans of plain copy are glossary
 * terms. Marking is map-driven and render-time (see `<GlossedText>`), so highlighting can't drift
 * page-to-page: "is QAM highlighted?" reduces to "is QAM in the map?", never "did the author
 * remember to wrap it here."
 *
 * Tokenization rules (all solved here so authors never think about them):
 *  - **Whole-token, boundary-aware, case-sensitive.** A match must sit on token boundaries, so we
 *    never highlight `FM` inside "confirm", `AM` inside "amplitude", or `IQ` inside "unique".
 *    Lowercase word-terms also match a sentence-initial capital ("carrier" → "Carrier").
 *  - **Separator-aware.** `/` and `-` are boundaries, so `QPSK/QAM` marks *both* halves.
 *  - **Longest-match-first.** `16-QAM` matches as one unit (the QAM gloss) rather than marking
 *    `QAM` inside it.
 *  - **Phrases + simple plurals.** Multi-word forms ("matched filter", "spectral leakage") and a
 *    trailing `s`/`es` ("constellations") match their map entry.
 */

/**
 * Extra surface forms that map onto a canonical entry. Kept here (not in glossary.ts) so the
 * glossary stays the single source of *meaning* while this file owns the *matching* forms.
 */
const ALIASES: Record<string, string[]> = {
  aliasing: ['alias'],
  aoa: ['angle-of-arrival', 'angle of arrival'],
  awgn: ['additive white Gaussian noise'],
  ber: ['bit error rate'],
  'channel-estimation': ['channel estimate', 'channel estimator', 'estimated channel'],
  'constant-envelope': ['constant envelope'],
  'critical-frequency': ['foF2'],
  ddc: ['digital downconverter', 'digital down-conversion', 'digital downconversion'],
  decimation: ['decimate', 'decimating'],
  'direct-sampling': ['direct-sampling'],
  doppler: ['Doppler', 'Doppler-shifted'],
  equalizer: ['equalization', 'equalizing'],
  fec: ['forward error correction'],
  hamming: ['Hamming(7,4)', 'Hamming'],
  'great-circle': ['great circle'],
  'ground-wave': ['ground-wave'],
  ionosphere: ['ionospheric'],
  iq: ['I/Q'],
  isi: ['inter-symbol interference'],
  'line-of-sight': ['LOS', 'line of sight'],
  'matched-filter': ['matched filtering', 'matched-filter'],
  nyquist: ['Nyquist'],
  pfb: ['polyphase filter bank'],
  'pulse-compression': ['pulse-compressed'],
  'pulse-shaping': ['pulse-shaping'],
  qam: ['16-QAM', '64-QAM', '256-QAM'],
  'range-doppler': ['range-Doppler', 'range-doppler'],
  snr: ['signal-to-noise ratio'],
  'steering-vector': ['steering vectors'],
  'time-bandwidth': ['time-bandwidth', 'TBP'],
};

interface Form {
  id: string;
  form: string;
}

const isWordChar = (ch: string | undefined): boolean => ch !== undefined && /[A-Za-z0-9]/.test(ch);
const isBoundary = (ch: string | undefined): boolean => !isWordChar(ch);

/** All matchable forms, longest first so longest-match-at-a-position wins. */
const FORMS: Form[] = (() => {
  const out: Form[] = [];
  for (const e of allTerms()) {
    const bases = [e.term, ...(ALIASES[e.id] ?? [])];
    for (const b of bases) {
      out.push({ id: e.id, form: b });
      // Lowercase word/phrase terms also match a sentence-initial capital.
      if (/^[a-z]/.test(b)) out.push({ id: e.id, form: b[0].toUpperCase() + b.slice(1) });
    }
  }
  return out.sort((a, b) => b.form.length - a.form.length);
})();

export interface PlainSegment {
  text: string;
}
export interface TermSegment {
  id: string;
  text: string;
}
export type Segment = PlainSegment | TermSegment;

export const isTermSegment = (s: Segment): s is TermSegment => 'id' in s;

/** Split a plain string into plain and glossary-term segments (in order). */
export function matchTerms(text: string): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  let plainStart = 0;

  while (i < text.length) {
    let hit: { id: string; len: number } | null = null;

    for (const f of FORMS) {
      if (!text.startsWith(f.form, i)) continue;
      if (!isBoundary(text[i - 1])) continue; // left boundary
      // Optional simple plural directly after the form.
      let end = i + f.form.length;
      if (text[end] === 's' && isBoundary(text[end + 1])) end += 1;
      else if (text.startsWith('es', end) && isBoundary(text[end + 2])) end += 2;
      if (!isBoundary(text[end])) continue; // right boundary
      hit = { id: f.id, len: end - i };
      break; // FORMS is longest-first, so the first hit is the longest
    }

    if (hit) {
      if (plainStart < i) segs.push({ text: text.slice(plainStart, i) });
      segs.push({ id: hit.id, text: text.slice(i, i + hit.len) });
      i += hit.len;
      plainStart = i;
    } else {
      i += 1;
    }
  }

  if (plainStart < text.length) segs.push({ text: text.slice(plainStart) });
  return segs;
}

/** True when `id` resolves to a real glossary entry (guards alias typos). */
export function isKnownTerm(id: string): boolean {
  return id in GLOSSARY;
}
