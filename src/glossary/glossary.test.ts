import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLOSSARY, allTerms } from './glossary';
import { getModule } from '@/registry';
// Importing the module barrel registers every module so moduleId links can be resolved.
import '@/modules';

const DOCS_DSP_DIR = join(process.cwd(), 'docs', 'dsp');

/** Recursively collect every .tsx source file under src/. */
function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) tsxFiles(full, out);
    // Skip test files: they intentionally exercise dangling/unknown ids.
    else if (ent.name.endsWith('.tsx') && !ent.name.endsWith('.test.tsx')) out.push(full);
  }
  return out;
}

describe('glossary integrity', () => {
  it('keys match their entry id', () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.id).toBe(key);
    }
  });

  it('every entry has a non-empty term and gloss', () => {
    for (const e of allTerms()) {
      expect(e.term.length).toBeGreaterThan(0);
      expect(e.gloss.trim().length).toBeGreaterThan(0);
    }
  });

  it('every moduleId resolves to a registered module', () => {
    for (const e of allTerms()) {
      if (e.moduleId) {
        expect(getModule(e.moduleId), `glossary "${e.id}" → module "${e.moduleId}"`).toBeDefined();
      }
    }
  });

  it('every docsPage points at a real docs/dsp page', () => {
    const pages = new Set(
      readdirSync(DOCS_DSP_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, ''))
    );
    for (const e of allTerms()) {
      if (e.docsPage) {
        expect(pages.has(e.docsPage), `glossary "${e.id}" → docs/dsp/${e.docsPage}.md`).toBe(true);
      }
    }
  });
});

describe('contributor contract: coverage', () => {
  // The going-forward guarantee: ship a new docs/dsp page (i.e. a new dsp primitive) without a
  // glossary entry referencing it, and this fails CI. Keeps the glossary complete by default.
  it('every docs/dsp page is referenced by at least one glossary entry', () => {
    const referenced = new Set(allTerms().flatMap((e) => (e.docsPage ? [e.docsPage] : [])));
    const pages = readdirSync(DOCS_DSP_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
    const uncovered = pages.filter((p) => !referenced.has(p));
    expect(uncovered, `docs/dsp pages with no glossary entry: ${uncovered.join(', ')}`).toEqual([]);
  });

  it('every <Term id="…"> used in the app resolves to a glossary entry', () => {
    const re = /<Term\s+id=["']([^"']+)["']/g;
    const dangling: string[] = [];
    for (const file of tsxFiles(join(process.cwd(), 'src'))) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(re)) {
        if (!GLOSSARY[m[1]]) dangling.push(`${m[1]} (${file})`);
      }
    }
    expect(dangling, `dangling <Term> ids: ${dangling.join(', ')}`).toEqual([]);
  });
});

describe('contributor contract: per-surface coverage', () => {
  // Restraint is scoped per explanatory *surface*: each side-rail explanation should gloss its own
  // first significant use of a concept-bearing term, independent of the body copy. We can't police
  // "first use" mechanically without false positives, so this is a deliberately conservative net:
  // a curated set of unambiguous, rarely-clustering acronyms that should never sit unglossed in an
  // explanation panel unless that very module is the one teaching the term.
  const SURFACE_CHECK = [
    'fft',
    'ofdm',
    'gdop',
    'tdoa',
    'fdoa',
    'awgn',
    'dsss',
    'fir',
    'pfb',
    'ber',
  ];

  /** The module id registered alongside an explanation file (its sibling index.ts). */
  function ownerModuleId(file: string): string | undefined {
    const idx = join(dirname(file), 'index.ts');
    if (!existsSync(idx)) return undefined;
    return readFileSync(idx, 'utf8').match(/id:\s*'([^']+)'/)?.[1];
  }

  it('explanation panels gloss their load-bearing acronyms (per-surface, not per-page)', () => {
    const violations: string[] = [];
    const files = tsxFiles(join(process.cwd(), 'src')).filter((f) => f.endsWith('Explanation.tsx'));
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      const owner = ownerModuleId(file);
      for (const id of SURFACE_CHECK) {
        const entry = GLOSSARY[id];
        if (!entry || entry.moduleId === owner) continue; // self-taught surfaces are exempt
        const appears = new RegExp(`\\b${entry.term}\\b`).test(src);
        if (appears && !src.includes(`<Term id="${id}"`)) {
          violations.push(`${entry.term} unglossed in ${basename(file)}`);
        }
      }
    }
    expect(violations, `per-surface gaps: ${violations.join(', ')}`).toEqual([]);
  });
});
