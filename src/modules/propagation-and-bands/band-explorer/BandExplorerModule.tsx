import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { RayPathDiagram, type RayPathScene } from '@/components/plots/RayPathDiagram';
import { Slider } from '@/components/Slider';
import { colors } from '@/design/tokens';
import {
  BANDS,
  type Band,
  bandFor,
  EARTH_RADIUS_KM,
  formatDistanceKm,
  formatFrequency,
  formatWavelength,
  modeLabel,
  VIRTUAL_HEIGHT_KM,
  wavelengthM,
} from '@/propagation';

const F_MIN = 30e3; // 30 kHz — bottom of LF
const F_MAX = 30e9; // 30 GHz — top of SHF
const LOG_MIN = Math.log10(F_MIN);
const LOG_MAX = Math.log10(F_MAX);

/** Geometric centre of a band (the midpoint on a log axis). */
const bandCenterHz = (b: Band) => Math.sqrt(b.minHz * b.maxHz);

/**
 * Band Explorer — the Propagation & Bands capstone (brief §8). Drag one frequency slider across the
 * whole radio spectrum and watch the three things that actually change with it: the wavelength
 * (`λ = c/f`), the propagation mode that dominates the band, and a rough reach. The payoff is the
 * non-EE "aha": low bands hug the ground or bounce off the sky and travel far, high bands go
 * line-of-sight and stay local — which is why AM crosses states after dark, FM stays in town, and
 * shortwave reaches the other side of the world. Modes and reach are illustrative textbook bands.
 */
export function BandExplorerModule() {
  const [freq, setFreq] = useState(1e6); // start at the AM broadcast band
  const band = bandFor(freq);
  const lambda = wavelengthM(freq);

  const setLogFreq = (logF: number) => setFreq(Math.pow(10, logF));

  return (
    <div className="flex flex-col gap-5">
      <BandStrip freq={freq} band={band} />

      <div className="flex flex-wrap gap-3">
        <Readout label="Frequency" value={formatFrequency(freq)} accent />
        <Readout label="Wavelength  λ = c / f" value={formatWavelength(lambda)} accent />
        <Readout label="Band" value={`${band.abbr} · ${band.name}`} accent />
        <Readout label="Dominant mode" value={modeLabel(band.mode)} accent />
        <Readout label="Rough reach" value={`~ ${formatDistanceKm(band.reachKm)}`} accent />
      </div>

      <div>
        <ReachIllustration band={band} />
        <p className="readout mt-1 text-xs text-text-faint">
          <GlossedText>{band.reach}.</GlossedText>
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {BANDS.map((b) => {
            const selected = b.id === band.id;
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFreq(bandCenterHz(b))}
                title={`${b.name} · ${(b.minHz / 1e3).toLocaleString()}–${(b.maxHz / 1e3).toLocaleString()} kHz`}
                className={[
                  'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
                  selected
                    ? 'border-signal-dim bg-surface-raised text-signal'
                    : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
                ].join(' ')}
              >
                {b.abbr}
              </button>
            );
          })}
        </div>
        <Slider
          label="Frequency"
          value={Math.log10(freq)}
          min={LOG_MIN}
          max={LOG_MAX}
          step={0.01}
          display={formatFrequency(freq)}
          onChange={setLogFreq}
          ariaLabel="Frequency, logarithmic across the radio spectrum"
        />
        <span className="readout text-xs text-text-faint">
          <GlossedText>
            drag across the bands, or tap a band · low and slow reaches far, high and fast stays
            local
          </GlossedText>
        </span>
      </div>
    </div>
  );
}

/** The log-frequency band ladder with the current frequency marked. */
function BandStrip({ freq, band }: { freq: number; band: Band }) {
  const xFrac = (f: number) => (Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  const markerPct = `${(xFrac(freq) * 100).toFixed(2)}%`;
  return (
    <div className="flex flex-col gap-1">
      <div
        className="relative flex h-14 w-full overflow-hidden rounded-md border border-border"
        role="img"
        aria-label={`Radio-band ladder from 30 kHz to 30 GHz; the marker is in the ${band.name} band`}
      >
        {BANDS.map((b) => {
          const widthPct = (xFrac(b.maxHz) - xFrac(b.minHz)) * 100;
          const active = b.id === band.id;
          return (
            <div
              key={b.id}
              className="flex items-center justify-center border-r border-border/60 transition-colors last:border-r-0"
              style={{
                width: `${widthPct}%`,
                background: active ? 'rgba(62, 240, 160, 0.12)' : 'transparent',
              }}
            >
              <span
                className={[
                  'readout text-[11px] tracking-wide',
                  active ? 'text-signal' : 'text-text-faint',
                ].join(' ')}
              >
                {b.abbr}
              </span>
            </div>
          );
        })}
        {/* Live frequency marker. */}
        <div
          className="pointer-events-none absolute top-0 bottom-0"
          style={{ left: markerPct, width: 2, background: colors.signal }}
        />
      </div>
      <span className="readout text-center text-xs text-text-faint">
        Frequency (log scale, 30 kHz → 30 GHz)
      </span>
    </div>
  );
}

/** A schematic of the band's dominant propagation path — ground wave, skywave, or line-of-sight.
 *  The horizontal span scales with the band's rough reach, so it tracks the readout as you move
 *  between bands that share a mode (LF↔MF, VHF↔UHF↔SHF); skywave stays one representative hop. */
function ReachIllustration({ band }: { band: Band }) {
  const { spanKm, maxAltitudeKm, ionosphereKm, draw, ariaLabel } = useMemo(() => {
    if (band.mode === 'skywave') {
      // Reach here is multi-hop (global), so the sketch shows one representative hop, not the full
      // reach — a 12 000 km span would be a meaningless bulge.
      const span = 3000;
      const peakKm = (span / 2) ** 2 / (2 * EARTH_RADIUS_KM);
      return {
        spanKm: span,
        maxAltitudeKm: peakKm + VIRTUAL_HEIGHT_KM * 1.25,
        ionosphereKm: VIRTUAL_HEIGHT_KM,
        ariaLabel: 'A skywave signal bouncing off the ionosphere on one long hop',
        draw: (ctx: CanvasRenderingContext2D, s: RayPathScene) => {
          const txG = span * 0.12;
          const rxG = span * 0.88;
          emitter(ctx, s, txG);
          ray(ctx, s, [
            [txG, s.surfaceKm(txG)],
            [span * 0.5, s.surfaceKm(span * 0.5) + VIRTUAL_HEIGHT_KM],
            [rxG, s.surfaceKm(rxG)],
          ]);
          groundDot(ctx, s, rxG);
        },
      };
    }
    if (band.mode === 'line-of-sight') {
      // Frame the band's reach, and pick the mast height whose horizon is exactly that reach
      // (d = √(2·R·h) ⇒ h = reach²/2R), so the grazing ray lands at the stated distance.
      const span = band.reachKm * 1.3;
      const txG = span * 0.1;
      const hKm = (band.reachKm * band.reachKm) / (2 * EARTH_RADIUS_KM);
      const peakKm = (span / 2) ** 2 / (2 * EARTH_RADIUS_KM);
      return {
        spanKm: span,
        maxAltitudeKm: (peakKm + hKm) * 1.4,
        ionosphereKm: undefined,
        ariaLabel: 'A line-of-sight ray from an antenna grazing the horizon',
        draw: (ctx: CanvasRenderingContext2D, s: RayPathScene) => {
          emitter(ctx, s, txG, hKm);
          const reach = Math.min(txG + band.reachKm, span);
          ray(ctx, s, [
            [txG, s.surfaceKm(txG) + hKm],
            [reach, s.surfaceKm(reach)],
          ]);
        },
      };
    }
    // ground-wave: a wave hugging the curve of the Earth out to roughly the band's reach.
    const span = band.reachKm * 1.15;
    const peakKm = (span / 2) ** 2 / (2 * EARTH_RADIUS_KM);
    const maxAltitudeKm = peakKm * 1.5 || 1;
    return {
      spanKm: span,
      maxAltitudeKm,
      ionosphereKm: undefined,
      ariaLabel: 'A ground wave following the curve of the Earth',
      draw: (ctx: CanvasRenderingContext2D, s: RayPathScene) => {
        const txG = span * 0.08;
        emitter(ctx, s, txG);
        const pts: [number, number][] = [];
        const end = span * 0.95;
        const hug = maxAltitudeKm * 0.04; // hold a hair above the surface so the wave reads
        for (let i = 0; i <= 40; i++) {
          const g = txG + (i / 40) * (end - txG);
          pts.push([g, s.surfaceKm(g) + hug]);
        }
        ray(ctx, s, pts, true);
      },
    };
  }, [band]);

  return (
    <RayPathDiagram
      spanKm={spanKm}
      maxAltitudeKm={maxAltitudeKm}
      ionosphereKm={ionosphereKm}
      ionosphereLabel={ionosphereKm ? 'ionosphere' : undefined}
      draw={draw}
      deps={[band.mode]}
      height={200}
      ariaLabel={ariaLabel}
      hint="illustrative path — not to scale"
    />
  );
}

// ── small canvas helpers shared by the three mode sketches ───────────────────

function ray(
  ctx: CanvasRenderingContext2D,
  s: RayPathScene,
  pts: [number, number][],
  fade = false
) {
  ctx.save();
  ctx.strokeStyle = colors.signal;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  if (fade) {
    const a = s.toPx(pts[0][0], pts[0][1]);
    const b = s.toPx(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py);
    grad.addColorStop(0, colors.signal);
    grad.addColorStop(1, 'rgba(62, 240, 160, 0)');
    ctx.strokeStyle = grad;
  }
  ctx.beginPath();
  pts.forEach(([g, alt], i) => {
    const p = s.toPx(g, alt);
    if (i === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.stroke();
  ctx.restore();
}

/** A small emitter marker (an upward-pointing source) on the ground, with an optional mast. */
function emitter(ctx: CanvasRenderingContext2D, s: RayPathScene, groundKm: number, mastKm = 0) {
  const base = s.toPx(groundKm, s.surfaceKm(groundKm));
  const tip = s.toPx(groundKm, s.surfaceKm(groundKm) + mastKm);
  if (mastKm > 0) {
    ctx.strokeStyle = colors.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(base.px, base.py);
    ctx.lineTo(tip.px, tip.py);
    ctx.stroke();
  }
  ctx.fillStyle = colors.cyan;
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(tip.px, tip.py, 3.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function groundDot(ctx: CanvasRenderingContext2D, s: RayPathScene, groundKm: number) {
  const p = s.toPx(groundKm, s.surfaceKm(groundKm));
  ctx.fillStyle = colors.signal;
  ctx.beginPath();
  ctx.arc(p.px, p.py, 3, 0, 2 * Math.PI);
  ctx.fill();
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
