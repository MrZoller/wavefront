import { useMemo, useState } from 'react';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { useCanvas } from '@/components/plots/useCanvas';
import { colors } from '@/design/tokens';
import { type Complex } from '@/dsp/complex';
import { fft } from '@/dsp/fft';
import { firResponseDb } from '@/dsp/filter';
import { windowFn } from '@/dsp/window';
import { bareFftProto, channelize, pfbProto } from '@/dsp/channelizer';
import { magnitudeSpectrumDb } from '@/dsp/spectrum';

const N = 512;
const FLOOR = -60;
// Synthetic wideband scene: several tones of different strength scattered across the band.
const TONES = [
  { f: 0.08, a: 1 },
  { f: 0.31, a: 0.7 },
  { f: 0.56, a: 0.9 },
  { f: 0.83, a: 0.5 },
];
const CH_COUNTS = [4, 8, 16];

/**
 * Channelizer (brief §7, Track D Layer 2 marquee). Tile one wide band into many narrow channels and
 * pull any one out. The FFT is already a filter bank — but with a leaky rectangular prototype, so
 * neighbors bleed together. A polyphase filter bank swaps in a designed prototype: sharp, clean
 * channels. Toggle bare-FFT vs PFB and watch the inter-channel leakage appear and vanish.
 */
export function ChannelizerModule() {
  const [nCh, setNCh] = useState(8);
  const [mode, setMode] = useState<'fft' | 'pfb'>('pfb');
  const [sel, setSel] = useState(1);

  const wide = useMemo(() => {
    const w = windowFn('hann', N);
    return Array.from({ length: N }, (_, n) => {
      let re = 0;
      let im = 0;
      for (const t of TONES) {
        re += t.a * Math.cos(2 * Math.PI * t.f * n);
        im += t.a * Math.sin(2 * Math.PI * t.f * n);
      }
      return { re: re * w[n], im: im * w[n] } as Complex;
    });
  }, []);

  const { wideDb, protoResp, extracted } = useMemo(() => {
    const proto = mode === 'fft' ? bareFftProto(nCh) : pfbProto(nCh);
    const X = fft(wide).map((c) => Math.hypot(c.re, c.im));
    const peak = Math.max(...X);
    const wideDb = X.map((m) => Math.max(FLOOR, 20 * Math.log10(m / peak)));
    const chan = channelize(
      Array.from({ length: N }, (_, n) => {
        // unwindowed copy for extraction (the window is only for the display spectrum)
        let re = 0;
        let im = 0;
        for (const t of TONES) {
          re += t.a * Math.cos(2 * Math.PI * t.f * n);
          im += t.a * Math.sin(2 * Math.PI * t.f * n);
        }
        return { re, im };
      }),
      nCh,
      proto
    );
    return {
      wideDb,
      protoResp: firResponseDb(proto, 512),
      extracted: magnitudeSpectrumDb(chan[sel] ?? [], 'hann'),
    };
  }, [wide, nCh, mode, sel]);

  const canvasRef = useCanvas(
    (ctx, w, h) => {
      const xOf = (f: number) => f * w; // f in [0,1)
      const yOf = (db: number) => h - ((db - FLOOR) / -FLOOR) * h;

      // Selected channel band highlight.
      ctx.fillStyle = 'rgba(62, 240, 160, 0.10)';
      ctx.fillRect(xOf(sel / nCh), 0, w / nCh, h);

      // Channel grid.
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      for (let k = 0; k <= nCh; k++) {
        ctx.beginPath();
        ctx.moveTo(xOf(k / nCh), 0);
        ctx.lineTo(xOf(k / nCh), h);
        ctx.stroke();
      }

      // Wide spectrum.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < wideDb.length; i++) {
        const x = xOf(i / wideDb.length);
        const y = yOf(wideDb[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Selected channel's filter shape, centered on the channel (leaky for FFT, sharp for PFB).
      const center = (sel + 0.5) / nCh;
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let j = 0; j < protoResp.length; j++) {
        const fp = -0.5 + j / protoResp.length;
        if (Math.abs(fp) > 2.5 / nCh) continue; // a few channel-widths around the passband
        const f = center + fp;
        if (f < 0 || f > 1) continue;
        const x = xOf(f);
        const y = yOf(Math.max(FLOOR, protoResp[j]));
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [wideDb, protoResp, sel, nCh]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="readout text-xs text-text-muted">Channels</span>
        {CH_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={n === nCh}
            onClick={() => {
              setNCh(n);
              setSel(Math.min(sel, n - 1));
            }}
            className={chip(n === nCh)}
          >
            {n}
          </button>
        ))}
        <span className="ml-3 readout text-xs text-text-muted">Filter bank</span>
        <button
          type="button"
          aria-pressed={mode === 'fft'}
          onClick={() => setMode('fft')}
          className={chip(mode === 'fft')}
        >
          bare FFT
        </button>
        <button
          type="button"
          aria-pressed={mode === 'pfb'}
          onClick={() => setMode('pfb')}
          className={chip(mode === 'pfb')}
        >
          polyphase
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 220 }}
        className="rounded-md border border-border bg-surface"
        role="img"
        aria-label="Wide spectrum tiled into channels, with the selected channel's filter shape overlaid"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="readout text-xs text-text-muted">Channel</span>
        {Array.from({ length: nCh }, (_, k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === sel}
            onClick={() => setSel(k)}
            className={chip(k === sel)}
          >
            {k}
          </button>
        ))}
      </div>

      <div>
        <p className="readout mb-1 text-xs text-text-muted">
          extracted channel {sel} (mixed to baseband, filtered, decimated by {nCh})
        </p>
        <SpectrumPlot
          data={extracted}
          height={120}
          ariaLabel={`Extracted channel ${sel} spectrum`}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-[10px] text-text-faint">
          green = the wide band · vertical lines = channel edges · cyan = the selected
          channel&rsquo;s filter · on <strong>bare FFT</strong> that filter is a leaky sinc with
          tall sidelobes — its neighbors&rsquo; energy bleeds in · switch to{' '}
          <strong>polyphase</strong> and the sidelobes collapse, isolating the channel cleanly
        </p>
      </div>
    </div>
  );
}

const chip = (active: boolean) =>
  [
    'readout rounded-md border px-2.5 py-1 text-xs transition-colors',
    active
      ? 'border-signal-dim text-signal'
      : 'border-border text-text-muted hover:border-signal-dim',
  ].join(' ');
