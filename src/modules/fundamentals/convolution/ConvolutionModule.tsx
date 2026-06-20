import { useMemo, useRef, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { TapStemPlot } from '@/components/plots/TapStemPlot';
import { TimeSeriesPlot } from '@/components/plots/TimeSeriesPlot';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors, withAlpha } from '@/design/tokens';
import { convolve, convolveAt } from '@/dsp/convolution';
import { useAppStore } from '@/store/appStore';

/**
 * Convolution & the Impulse Response (Fundamentals — Systems). Leads with the impulse-response idea,
 * not the mechanics: poke a system once and the response that comes out *is* the system; its output
 * for any signal is a sum of shifted, scaled copies of that response, and that sum is convolution.
 *
 * One central piece of state — the impulse response `h` — drives everything: sketch it by dragging
 * the taps, scrub the flipped copy sliding across the input to watch a single output sample get
 * built, then load preset responses that *are* other modules (a low-pass FIR filter, the matched
 * filter, a multipath echo) and watch the same operation produce wildly different outputs.
 */

const H_LEN = 12; // editable impulse-response taps

// A short asymmetric pulse buried in the input, so the matched-filter preset (its flipped copy) has
// something to lock onto, and the echo preset has a clean feature to duplicate.
const PULSE = [1, 0.6, 0.35, 0.15];
const PULSE_AT = 5;
const N = 28; // input length

// Input = the pulse plus a near-Nyquist ripple, so the low-pass preset visibly has something to
// smooth away. Fully synthetic and fixed (the lesson is about `h`, not the input).
const INPUT: number[] = Array.from({ length: N }, (_, n) => {
  const k = n - PULSE_AT;
  const p = k >= 0 && k < PULSE.length ? PULSE[k] : 0;
  return p + 0.16 * Math.sin(2 * Math.PI * 0.42 * n);
});

const OUT_LEN = N + H_LEN - 1;

/** Pad a short tap list out to the editor's fixed length. */
const pad = (a: number[]): number[] => Array.from({ length: H_LEN }, (_, i) => a[i] ?? 0);

/** A decaying tail — a generic "leaky" system, the default before any preset is chosen. */
const DEFAULT_H = pad(Array.from({ length: 8 }, (_, i) => Math.round(0.7 ** i * 100) / 100));

interface Preset {
  id: string;
  /** Pressable-chip label (a control, so never glossed). */
  label: string;
  h: number[];
  /** Plain-language payoff, glossed automatically. */
  blurb: string;
  /** Registry id + human name of the module this response *is*. */
  linkId: string;
  linkLabel: string;
}

const PRESETS: Preset[] = [
  {
    id: 'lowpass',
    label: 'Moving average',
    h: pad([0.2, 0.2, 0.2, 0.2, 0.2]),
    blurb:
      'Five equal taps average a sliding window — a low-pass FIR filter. The fast ripple smooths away and only the pulse survives.',
    linkId: 'fir-filter',
    linkLabel: 'FIR Filtering',
  },
  {
    id: 'matched',
    label: 'Matched filter',
    h: pad([...PULSE].reverse()),
    blurb:
      'A flipped copy of the pulse hidden in the input. Sliding it lines the pulse up with itself and the sum spikes right where the pulse sits — that peak is a detection.',
    linkId: 'matched-filter',
    linkLabel: 'Matched Filter',
  },
  {
    id: 'echo',
    label: 'Echo',
    h: pad([1, 0, 0, 0, 0, 0.5]),
    blurb:
      "A spike plus a smaller, delayed spike: the channel's impulse response when the signal also arrives by a second, longer path. Every feature of the input comes through twice.",
    linkId: 'multipath-fading',
    linkLabel: 'Multipath & Fading',
  },
];

export function ConvolutionModule() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [h, setH] = useState<number[]>(DEFAULT_H);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selected, setSelected] = useState(0); // keyboard-focused tap in the editor
  const [slide, setSlide] = useState(12); // slide position k of the convolution sum

  const output = useMemo(() => convolve(INPUT, h), [h]);
  const yk = convolveAt(INPUT, h, slide);
  const active = PRESETS.find((p) => p.id === activePreset);

  /** Edit one tap (drag or keyboard) — any hand edit drops us out of "preset" mode. */
  const editTap = (i: number, v: number) => {
    setH((prev) => {
      const next = prev.slice();
      next[i] = Math.max(-1, Math.min(1, Math.round(v * 100) / 100));
      return next;
    });
    setActivePreset(null);
  };

  const loadPreset = (p: Preset) => {
    setH(p.h);
    setActivePreset(p.id);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Section A: define the system by its impulse response ───────────────────────────── */}
      <section className="flex flex-col gap-3">
        <PlotTitle>Ping the system: its impulse response is the whole system</PlotTitle>
        <ImpulseResponseEditor h={h} selected={selected} onSelect={setSelected} onEdit={editTap} />
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            Feed in a single impulse and out comes the impulse response — drag a tap (or focus the
            plot and arrow-key it) to change how the system answers. A decaying tail, an echo, a
            smoothing average: each one is a different system.
          </GlossedText>
        </p>
      </section>

      {/* ── Section B: the sliding multiply-and-sum mechanism ─────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <PlotTitle>Slide, multiply, sum — one output sample at a time</PlotTitle>
        <SlideView input={INPUT} h={h} slide={slide} />
        <div className="flex flex-wrap items-center gap-6">
          <Slider
            label="Slide position k"
            value={slide}
            min={0}
            max={OUT_LEN - 1}
            step={1}
            display={`k = ${slide}`}
            onChange={setSlide}
            style={{ minWidth: 240 }}
            ariaLabel="Convolution slide position"
          />
          <Readout label="Output y[k]" value={yk.toFixed(2)} accent />
        </div>
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            At each slide position the flipped impulse response overlaps the input; multiply the
            overlapping pairs and add them up, and that single number is one output sample. Scrub k
            and watch the output build left to right.
          </GlossedText>
        </p>
      </section>

      {/* ── Section C: same operation, different impulse response ──────────────────────────── */}
      <section className="flex flex-col gap-3">
        <PlotTitle>Same operation, different impulse response</PlotTitle>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => loadPreset(p)}
                aria-pressed={on}
                className={[
                  'rounded-md border px-3 py-1.5 text-xs transition-colors',
                  on
                    ? 'border-signal-dim bg-surface-raised text-signal'
                    : 'border-border text-text-muted hover:border-signal-dim hover:text-signal',
                ].join(' ')}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div>
            <PlotTitle>impulse response h[n]</PlotTitle>
            <TapStemPlot
              weights={h}
              limit={1.05}
              height={120}
              color={colors.cyan}
              xLabel={AXIS.sample}
              yLabel={{ quantity: 'Tap weight h[n]' }}
              ariaLabel="The impulse response now in use"
            />
          </div>
          <div>
            <PlotTitle>output = input ⊛ h</PlotTitle>
            <TimeSeriesPlot
              series={[{ color: colors.signal, samples: output }]}
              height={120}
              yLabel={{ quantity: 'Amplitude' }}
              xLabel={AXIS.sample}
              ariaLabel="The output of convolving the input with the current impulse response"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          {active ? (
            <p className="text-xs leading-relaxed text-text-faint">
              <GlossedText>{active.blurb}</GlossedText>{' '}
              <button
                type="button"
                onClick={() => setActiveModule(active.linkId)}
                className="text-signal underline decoration-dotted underline-offset-2 transition-colors hover:text-cyan"
              >
                Open {active.linkLabel} →
              </button>
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-text-faint">
              <GlossedText>
                That output is your hand-drawn impulse response in action. Load a preset to see the
                same slide-multiply-sum become a low-pass filter, a matched filter, or a multipath
                echo — only the impulse response changed.
              </GlossedText>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/** Static field name + live (accent) value — the sanctioned readout pattern. */
function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}

// ── The draggable impulse-response editor ──────────────────────────────────────────────────
// A single impulse goes in on the left; its response (the editable taps) comes out on the right.
const RESP_X0 = 0.18; // response zone starts at this fraction of the width
const VPAD = 0.12; // fractional vertical padding so a tap at ±1 isn't flush to the edge
const yFracOf = (v: number) => 0.5 - (Math.max(-1, Math.min(1, v)) / 1) * (0.5 - VPAD);
const valFromFrac = (fy: number) => Math.max(-1, Math.min(1, ((0.5 - fy) / (0.5 - VPAD)) * 1));

function ImpulseResponseEditor({
  h,
  selected,
  onSelect,
  onEdit,
}: {
  h: number[];
  selected: number;
  onSelect: (i: number) => void;
  onEdit: (i: number, v: number) => void;
}) {
  const dragging = useRef(false);
  const [focused, setFocused] = useState(false);

  const ref = useCanvas(
    (ctx, w, ht) => {
      const respX = (i: number) => (RESP_X0 + ((i + 0.5) / H_LEN) * (1 - RESP_X0)) * w;
      const inX = (RESP_X0 / 2) * w;
      const yOf = (v: number) => yFracOf(v) * ht;
      const zeroY = yOf(0);

      // Zero line across the response zone.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(w, zeroY);
      ctx.stroke();

      // The input impulse δ[n] (static, neutral) and an arrow into the response zone.
      ctx.strokeStyle = colors.textMuted;
      ctx.fillStyle = colors.textMuted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(inX, zeroY);
      ctx.lineTo(inX, yOf(1));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(inX, yOf(1), 3.5, 0, 2 * Math.PI);
      ctx.fill();
      // Arrow → marking "in becomes out".
      const ax = RESP_X0 * w - 12;
      ctx.strokeStyle = colors.textFaint;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax - 8, zeroY);
      ctx.lineTo(ax, zeroY);
      ctx.moveTo(ax - 4, zeroY - 4);
      ctx.lineTo(ax, zeroY);
      ctx.lineTo(ax - 4, zeroY + 4);
      ctx.stroke();

      // The response taps (live / draggable → accent), each with a persistent grab halo.
      for (let i = 0; i < H_LEN; i++) {
        const x = respX(i);
        const y = yOf(h[i]);
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, zeroY);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Halo ring marks the tip as grabbable (not plotted data).
        ctx.strokeStyle = withAlpha(colors.signal, i === selected && focused ? 0.9 : 0.3);
        ctx.lineWidth = i === selected && focused ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(x, y, i === selected && focused ? 9 : 7, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = colors.signal;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [h, selected, focused]
  );

  const tapFromPointer = (e: React.PointerEvent<HTMLCanvasElement>): number | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return null;
    const fx = (e.clientX - rect.left) / rect.width;
    const respFrac = (fx - RESP_X0) / (1 - RESP_X0);
    if (respFrac < 0) return null; // pointer is in the input-impulse zone
    return Math.max(0, Math.min(H_LEN - 1, Math.floor(respFrac * H_LEN)));
  };

  const valueFromPointer = (e: React.PointerEvent<HTMLCanvasElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    return valFromFrac((e.clientY - rect.top) / rect.height);
  };

  return (
    <canvas
      ref={ref}
      tabIndex={0}
      style={{ width: '100%', height: 200, touchAction: 'none', cursor: 'grab' }}
      className="rounded-md border border-border bg-surface outline-none focus-visible:border-signal-dim"
      role="img"
      aria-label="A single impulse entering the system and its draggable impulse response coming out"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPointerDown={(e) => {
        const i = tapFromPointer(e);
        if (i === null) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = 'grabbing';
        onSelect(i);
        onEdit(i, valueFromPointer(e));
      }}
      onPointerMove={(e) => {
        if (dragging.current) onEdit(selected, valueFromPointer(e));
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
        e.currentTarget.style.cursor = 'grab';
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          onSelect(Math.max(0, selected - 1));
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          onSelect(Math.min(H_LEN - 1, selected + 1));
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          onEdit(selected, h[selected] + 0.05);
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          onEdit(selected, h[selected] - 0.05);
          e.preventDefault();
        }
      }}
    />
  );
}

// ── The sliding mechanism: input + flipped kernel on top, the output building below ─────────
function SlideView({ input, h, slide }: { input: number[]; h: number[]; slide: number }) {
  const output = useMemo(() => convolve(input, h), [input, h]);

  const ref = useCanvas(
    (ctx, w, ht) => {
      const xOf = (i: number) => ((i + 0.5) / OUT_LEN) * w;
      const topMid = ht * 0.28;
      const botMid = ht * 0.78;
      const topHalf = ht * 0.22;
      const botHalf = ht * 0.18;
      const aTop = Math.max(1.2, ...input.map(Math.abs), ...h.map(Math.abs));
      const aBot = Math.max(1.2, ...output.map(Math.abs));
      const yTop = (v: number) => topMid - (v / aTop) * topHalf;
      const yBot = (v: number) => botMid - (v / aBot) * botHalf;

      // Zero lines for the two bands.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      for (const my of [topMid, botMid]) {
        ctx.beginPath();
        ctx.moveTo(0, my);
        ctx.lineTo(w, my);
        ctx.stroke();
      }

      // Overlap window the flipped kernel currently covers: input indices [slide−H+1, slide].
      const j0 = Math.max(0, slide - H_LEN + 1);
      const j1 = Math.min(N - 1, slide);
      if (j1 >= j0) {
        ctx.fillStyle = withAlpha(colors.cyan, 0.08);
        ctx.fillRect(xOf(j0) - 6, 0, xOf(j1) - xOf(j0) + 12, topMid + topHalf + 6);
      }

      // Input samples (static data → neutral, faint dots).
      ctx.fillStyle = colors.textFaint;
      for (let n = 0; n < N; n++) {
        ctx.beginPath();
        ctx.arc(xOf(n), yTop(input[n]), 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }

      // The flipped, shifted impulse response (cyan stems) and the products it forms (green dots).
      for (let j = j0; j <= j1; j++) {
        const weight = h[slide - j]; // h flipped + shifted to position k
        const x = xOf(j);
        ctx.strokeStyle = withAlpha(colors.cyan, 0.85);
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(x, topMid);
        ctx.lineTo(x, yTop(weight));
        ctx.stroke();
        ctx.fillStyle = colors.cyan;
        ctx.beginPath();
        ctx.arc(x, yTop(weight), 2.75, 0, 2 * Math.PI);
        ctx.fill();
        // The product x[j]·h[k−j] — one contribution to the sum.
        ctx.fillStyle = colors.signal;
        ctx.beginPath();
        ctx.arc(x, yTop(input[j] * weight), 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Output: samples already built (green stems up to k), the leading one bright, the rest hollow.
      for (let m = 0; m < OUT_LEN; m++) {
        const x = xOf(m);
        if (m < slide) {
          ctx.strokeStyle = withAlpha(colors.signal, 0.5);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, botMid);
          ctx.lineTo(x, yBot(output[m]));
          ctx.stroke();
          ctx.fillStyle = withAlpha(colors.signal, 0.7);
          ctx.beginPath();
          ctx.arc(x, yBot(output[m]), 2, 0, 2 * Math.PI);
          ctx.fill();
        } else if (m === slide) {
          ctx.strokeStyle = colors.signal;
          ctx.lineWidth = 2.25;
          ctx.beginPath();
          ctx.moveTo(x, botMid);
          ctx.lineTo(x, yBot(output[m]));
          ctx.stroke();
          ctx.fillStyle = colors.signal;
          ctx.beginPath();
          ctx.arc(x, yBot(output[m]), 4, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.strokeStyle = colors.border;
          ctx.fillStyle = colors.border;
          ctx.beginPath();
          ctx.arc(x, botMid, 1.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Guide line tying the kernel's current position to the output sample it produces.
      ctx.strokeStyle = withAlpha(colors.signal, 0.35);
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xOf(slide), topMid + topHalf + 6);
      ctx.lineTo(xOf(slide), yBot(output[slide]));
      ctx.stroke();
      ctx.setLineDash([]);

      // Quiet band labels (structural, not instructional).
      ctx.fillStyle = colors.textFaint;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText('input  ·  flipped h', 4, 12);
      ctx.fillText('output', 4, botMid - botHalf - 8);
    },
    [input, h, slide, output]
  );

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: 240 }}
      className="rounded-md border border-border bg-surface"
      role="img"
      aria-label="The flipped impulse response sliding across the input, building one output sample at the current position"
    />
  );
}
