import { useState } from 'react';
import { ConstellationPlot } from '@/components/plots/ConstellationPlot';
import { CONSTELLATIONS, bitsToSymbols, type Constellation } from '@/dsp/comms';

const NUM_BITS = 12; // divisible by 1, 2, and 4 → a whole number of symbols for every scheme
const SCHEMES = Object.values(CONSTELLATIONS);

const label = (index: number, k: number) => index.toString(2).padStart(k, '0');

/**
 * Symbol mapping (brief §5, Track B — the start of the transmit chain). A stream of bits becomes a
 * sequence of I/Q symbols: group the bits, look the group up in the constellation, get a point.
 * Toggle bits and switch schemes to watch the same bits land differently — and see that Gray coding
 * puts one-bit-apart groups on neighboring points.
 */
export function SymbolMappingModule() {
  const [scheme, setScheme] = useState<Constellation>(CONSTELLATIONS.QPSK);
  const [bits, setBits] = useState<number[]>(() =>
    Array.from({ length: NUM_BITS }, (_, i) => ((i * 7) % 3 === 0 ? 1 : 0))
  );

  const k = scheme.bitsPerSymbol;
  const symbols = bitsToSymbols(bits, scheme);
  const idealLabels = scheme.points.map((_, i) => label(i, k));

  // Group the flat bit array into per-symbol chunks for display.
  const groups: number[][] = [];
  for (let i = 0; i < bits.length; i += k) groups.push(bits.slice(i, i + k));

  const toggle = (i: number) => setBits((prev) => prev.map((b, j) => (j === i ? (b ? 0 : 1) : b)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <ConstellationPlot
          ideal={scheme.points}
          labels={idealLabels}
          scatter={symbols.map((s) => ({ re: s.re, im: s.im }))}
          ariaLabel={`${scheme.name} constellation with the mapped symbols highlighted`}
        />

        <div className="flex min-w-[260px] flex-1 flex-col gap-4">
          {/* Scheme selector */}
          <div className="flex gap-2">
            {SCHEMES.map((s) => (
              <button
                key={s.name}
                type="button"
                aria-pressed={s.name === scheme.name}
                onClick={() => setScheme(s)}
                className={[
                  'readout rounded-md border px-3 py-1 text-xs transition-colors',
                  s.name === scheme.name
                    ? 'border-signal-dim text-signal'
                    : 'border-border text-text-muted hover:border-signal-dim',
                ].join(' ')}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Bit editor, grouped per symbol */}
          <div>
            <p className="readout mb-1.5 text-xs text-text-faint">
              click a bit to flip it · each group of {k} bit{k > 1 ? 's' : ''} → one symbol
            </p>
            <div className="flex flex-wrap gap-2">
              {groups.map((g, gi) => (
                <div key={gi} className="flex flex-col items-center gap-1">
                  <div className="flex gap-0.5">
                    {g.map((b, bi) => {
                      const idx = gi * k + bi;
                      return (
                        <button
                          key={bi}
                          type="button"
                          onClick={() => toggle(idx)}
                          aria-label={`bit ${idx}, currently ${b}`}
                          className={[
                            'readout h-7 w-6 rounded-sm border text-xs transition-colors',
                            b
                              ? 'border-signal-dim bg-surface-raised text-signal'
                              : 'border-border text-text-muted hover:border-signal-dim',
                          ].join(' ')}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                  <span className="readout text-[10px] text-cyan">
                    → {label(parseInt(g.join(''), 2), k)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Readout label="Scheme" value={`${scheme.name} (${k} bit/sym)`} />
            <Readout label="Symbols" value={`${symbols.length}`} accent />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          more bits per symbol packs the plane tighter — faster, but the points sit closer together,
          so noise (next module) flips them more easily · neighboring points differ by exactly one
          bit (Gray coding), so a small slip costs just one bit
        </p>
      </div>
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
