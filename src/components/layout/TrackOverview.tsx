import { GlossedText } from '@/components/GlossedText';
import { Wordmark } from '@/components/Wordmark';
import { APP_DESCRIPTION } from '@/config';
import { TRACKS, getTrackLayers } from '@/registry';
import { useAppStore } from '@/store/appStore';

// A recommended first-time path — surfaced from the registry's human module names, not a forced
// course. Each step is the entry module for a stage of the climb; the prose says *why* that order.
const START_STEPS: { id: string; title: string; why: string }[] = [
  {
    id: 'rotating-phasor',
    title: 'The Rotating Phasor / IQ',
    why: 'Start here — a signal is a rotating vector in the complex plane, and every later idea reuses that picture.',
  },
  {
    id: 'sampling-aliasing',
    title: 'Sampling & Aliasing',
    why: 'Then the ground under everything digital: how a continuous wave becomes numbers, and when sampling too slowly makes it lie.',
  },
  {
    id: 'send-a-message',
    title: 'Send a Message',
    why: 'Now put it together end to end: text → bits → symbols → a noisy channel → back to text.',
  },
];

/** The landing view: the track/module map (brief §9, §14). Shown when no module is open. */
export function TrackOverview() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-3xl">
        <Wordmark />
      </h1>
      <p className="mt-3 max-w-2xl text-text-muted">{APP_DESCRIPTION}</p>

      <StartHere />

      <div className="mt-10 flex flex-col gap-4">
        {TRACKS.map((track) => {
          const layers = getTrackLayers(track.id);
          // Layer subheaders only earn their place once a track has more than one stage.
          const showLayerNames = layers.length > 1;
          return (
            <article key={track.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-medium">{track.title}</h2>
                <span
                  className={[
                    'shrink-0 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wide',
                    track.status === 'shipping'
                      ? 'bg-signal-dim/30 text-signal'
                      : track.status === 'building'
                        ? 'border border-border text-cyan'
                        : 'border border-border text-text-faint',
                  ].join(' ')}
                >
                  {track.status === 'shipping'
                    ? 'v1'
                    : track.status === 'building'
                      ? 'building'
                      : 'planned'}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-text-muted">{track.description}</p>

              {layers.length > 0 && (
                <div className="mt-3 flex flex-col gap-3">
                  {layers.map((layer) => (
                    <div key={layer.layer} className="flex flex-col gap-1.5">
                      {showLayerNames && (
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-text-faint">
                          {layer.name}
                        </h3>
                      )}
                      <ul className="flex flex-wrap gap-2">
                        {layer.modules.map((m, i) => (
                          <li key={m.id}>
                            <button
                              onClick={() => setActiveModule(m.id)}
                              className={[
                                'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                                m.isCapstone
                                  ? 'border-signal-dim/60 text-signal hover:border-signal'
                                  : 'border-border text-text hover:border-signal-dim hover:text-signal',
                              ].join(' ')}
                            >
                              {/* Step within the layer — quiet directional cue, matching the sidebar. */}
                              <span className="tabular-nums text-text-faint">{i + 1}</span>
                              <span>{m.title}</span>
                              {m.isCapstone && (
                                <span className="text-[9px] uppercase tracking-wide text-signal">
                                  Capstone
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Scope note — calm and quiet, like a license line (no banner, no "Disclaimer"). */}
      <footer className="mt-10 border-t border-border pt-5">
        <p className="text-xs text-text-faint">
          Wavefront teaches signal processing using publicly available, textbook-level concepts and
          synthetic signals.
        </p>
      </footer>
    </div>
  );
}

/** "New here? Start here" — a recommended entry point and route, phrased as a suggestion. */
function StartHere() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const openGlossary = useAppStore((s) => s.openGlossary);

  return (
    <section className="mt-8 rounded-lg border border-signal-dim/40 bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
        New here? Start here
      </h2>
      <GlossedText>
        <p className="mt-1.5 text-sm text-text-muted">
          A recommended path, not a course you have to finish — once you have your footing, jump
          anywhere.
        </p>
        <ol className="mt-3 flex flex-col gap-2.5">
          {START_STEPS.map((s, i) => (
            <li key={s.id} className="flex gap-2.5">
              <span className="mt-0.5 shrink-0 text-xs tabular-nums text-text-faint">{i + 1}</span>
              <span className="text-sm text-text-muted">
                <button
                  type="button"
                  onClick={() => setActiveModule(s.id)}
                  className="font-medium text-signal underline decoration-signal-dim/60 underline-offset-2 transition-colors hover:decoration-signal"
                >
                  {s.title}
                </button>{' '}
                — {s.why}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-text-muted">
          From there, follow whichever track below pulls you — each module opens with a one-line
          intuition. Hit a word you don&rsquo;t know?{' '}
          <button
            type="button"
            onClick={openGlossary}
            className="text-signal underline decoration-signal-dim/60 underline-offset-2 transition-colors hover:decoration-signal"
          >
            Browse the glossary
          </button>
          .
        </p>
      </GlossedText>
    </section>
  );
}
