import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { GLOSSARY } from '@/glossary/glossary';
import { matchTerms, isTermSegment } from '@/glossary/match';
import { useAppStore } from '@/store/appStore';
import { Term } from './Term';

/**
 * Map-driven, render-time glossary marking. Authors write **plain copy**; `<GlossedText>` scans it
 * against the canonical map and marks terms automatically, so highlighting is consistent by
 * construction — "is QAM highlighted?" reduces to "is QAM in the map?", never "did the author wrap
 * it here." It recurses through inline markup (`<em>`, `<strong>`, …) but applies the deliberate
 * suppression rules:
 *
 *  - **Teaching-page exclusion:** a term is never marked on the module that teaches it.
 *  - **First-use restraint, per major section:** a term is marked on its first significant use
 *    within each `<section>` (a reasonable reading chunk), not on every occurrence and not just once
 *    for a whole long page.
 *  - **Excluded surfaces:** headings (`h1`–`h6`) and `code` are never glossed.
 *
 * Escape hatches: wrap a span in `<NoGloss>` to suppress marking, or hand-place a `<Term>` to force
 * one (it's passed through and counts toward the section's first-use).
 */

const SKIP_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'code',
  // Controls: a glossary button must never end up inside a label/control (invalid + steals clicks).
  'label',
  'button',
  'input',
  'select',
  'textarea',
  'option',
]);

/** Suppress auto-glossing for its subtree (the manual escape hatch). */
export function NoGloss({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Turn a plain string into a mix of text and first-use `<Term>` markers. */
function markString(
  text: string,
  marked: Set<string>,
  teachingId: string | undefined,
  keyBase: string
): ReactNode {
  const segs = matchTerms(text);
  if (!segs.some(isTermSegment)) return text;
  return segs.map((seg, i) => {
    if (!isTermSegment(seg)) return seg.text;
    const entry = GLOSSARY[seg.id];
    // Teaching-page exclusion + first-use-per-section restraint.
    if (!entry || (entry.moduleId && entry.moduleId === teachingId) || marked.has(seg.id)) {
      return seg.text;
    }
    marked.add(seg.id);
    return (
      <Term key={`${keyBase}.${i}`} id={seg.id}>
        {seg.text}
      </Term>
    );
  });
}

function process(
  node: ReactNode,
  marked: Set<string>,
  teachingId: string | undefined,
  keyBase: string
): ReactNode {
  if (typeof node === 'string') return markString(node, marked, teachingId, keyBase);
  if (typeof node === 'number') return node;
  if (Array.isArray(node)) {
    return node.map((child, i) => process(child, marked, teachingId, `${keyBase}.${i}`));
  }
  if (!isValidElement(node)) return node;

  const el = node as ReactElement<{ children?: ReactNode }>;
  // Pass already-resolved markers through untouched; a forced <Term> still counts as first-use.
  if (el.type === Term || el.type === NoGloss) {
    const id = (el.props as { id?: unknown }).id;
    if (el.type === Term && typeof id === 'string') marked.add(id);
    return el;
  }

  const tag = typeof el.type === 'string' ? el.type : '';
  if (SKIP_TAGS.has(tag)) return el; // headings / code are never glossed
  const children = el.props.children;
  if (children == null) return el;

  // A <section> is a fresh reading chunk → reset first-use within it.
  const childMarked = tag === 'section' ? new Set<string>() : marked;
  const newChildren = Children.map(children, (child, i) =>
    process(child, childMarked, teachingId, `${keyBase}.${i}`)
  );
  return cloneElement(el, { key: el.key ?? keyBase }, newChildren);
}

/** Auto-mark glossary terms in a block of plain copy. */
export function GlossedText({ children }: { children: ReactNode }) {
  const teachingId = useAppStore((s) => s.activeModuleId) ?? undefined;
  return <>{process(children, new Set<string>(), teachingId, 'g')}</>;
}
