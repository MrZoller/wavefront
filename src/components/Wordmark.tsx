import { APP_NAME } from '@/config';

/** The single-source glyph, served from `public/` (also the base for the generated favicons). */
const MARK_SRC = '/wavefront-mark.svg';

export interface WordmarkProps {
  className?: string;
}

/**
 * The Wavefront lockup — the wave mark paired with the wordmark — as one reusable unit, so the brand
 * reads identically everywhere it appears (landing header, sidebar). It sizes to the surrounding
 * font: set a text size on the element (e.g. `text-3xl`) and both the mark and the word scale with
 * it. The mark is the single-source glyph in `public/wavefront-mark.svg` (the same file the favicons
 * are generated from); it's decorative here because the adjacent text already names the product.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={['inline-flex items-center gap-[0.4em] text-signal glow-signal', className]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={MARK_SRC}
        alt=""
        aria-hidden="true"
        width="32"
        height="32"
        className="shrink-0"
        style={{ width: '1.1em', height: '1.1em' }}
      />
      <span className="font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  );
}
