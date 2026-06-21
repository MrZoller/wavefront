import { useMemo, useState } from 'react';
import { allTerms, type GlossaryEntry } from '@/glossary/glossary';
import { getModule } from '@/registry';
import { useAppStore } from '@/store/appStore';

/**
 * The Glossary index — a browse/lookup companion to the inline `<Term>` popovers. The inline system
 * answers "what's this word I just hit"; this page answers "show me all of them" and "look up the one
 * I half-remember." It renders entirely from the canonical glossary map ({@link allTerms}), so a term
 * added to the map shows up here automatically — there is no second list to maintain.
 *
 * Reference, not lesson: the definitions are static (neutral text); only the "Learn more" link into
 * the teaching module is accented, per the accent-color semantics.
 */
export function GlossaryPage() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [query, setQuery] = useState('');

  // Alphabetical by display term (case-insensitive), independent of the map's id order.
  const terms = useMemo(
    () => [...allTerms()].sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase())),
    []
  );

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? terms.filter((t) =>
            [t.term, t.expansion ?? '', t.gloss].some((s) => s.toLowerCase().includes(q))
          )
        : terms,
    [terms, q]
  );

  // Group by first letter for a calm, scannable reference layout.
  const groups = useMemo(() => {
    const map = new Map<string, GlossaryEntry[]>();
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      const g = map.get(letter);
      if (g) g.push(t);
      else map.set(letter, [t]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Glossary</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-muted">
        Every term Wavefront uses, in one place — each with a link to the module that teaches it.
        The same definitions pop up inline wherever a term appears; this is where you browse them or
        look one up.
      </p>

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter terms…"
          aria-label="Filter glossary terms"
          className="readout w-full max-w-sm rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal-dim"
        />
        <p className="readout mt-1.5 text-xs text-text-faint">
          {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
          {q ? ` matching “${query.trim()}”` : ''}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="mt-10 text-sm text-text-muted">No terms match that filter.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {groups.map(([letter, entries]) => (
            <section key={letter} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                {letter}
              </h2>
              <dl className="flex flex-col gap-3">
                {entries.map((t) => {
                  const mod = t.moduleId ? getModule(t.moduleId) : undefined;
                  return (
                    <div key={t.id} className="rounded-lg border border-border bg-surface p-4">
                      <dt className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium text-text">{t.term}</span>
                        {t.expansion && (
                          <span className="text-xs text-text-muted">— {t.expansion}</span>
                        )}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-text-muted">{t.gloss}</dd>
                      {mod && (
                        <button
                          type="button"
                          onClick={() => setActiveModule(mod.id)}
                          className="mt-2 text-xs text-signal transition-colors hover:text-cyan"
                        >
                          Learn more → {mod.title}
                        </button>
                      )}
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
