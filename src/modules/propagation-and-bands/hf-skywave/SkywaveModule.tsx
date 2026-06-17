import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { RayPathDiagram, type RayPathScene } from '@/components/plots/RayPathDiagram';
import { Slider } from '@/components/Slider';
import { colors } from '@/design/tokens';
import {
  CRITICAL_FREQ_DAY_MHZ,
  CRITICAL_FREQ_NIGHT_MHZ,
  EARTH_RADIUS_KM,
  incidenceAngleDeg,
  mufMHz,
  reflectsSkywave,
  VIRTUAL_HEIGHT_KM,
} from '@/propagation';

const SPAN_KM = 3600; // fixed frame; the hop is centred inside it
const CENTER = SPAN_KM / 2;
// The drawn Earth bulges to this height at the centre; the ionosphere shell rides above it, so the
// frame must clear the peak + the layer height (with headroom for the escape ray).
const PEAK_KM = (CENTER * CENTER) / (2 * EARTH_RADIUS_KM);
const MAX_ALT_KM = PEAK_KM + VIRTUAL_HEIGHT_KM * 1.45;

/**
 * HF Skywave & the Ionosphere — a conceptual stub (brief §8). A single HF hop climbs to a reflecting
 * layer and comes back down; whether it reflects or punches through to space is the MUF idea. Day vs.
 * night sets how strongly the layer is ionised (its critical frequency), the hop length sets how
 * obliquely the ray strikes it, and the secant law turns those into the maximum usable frequency.
 * Everything is illustrative — there is no real ionosphere model here.
 */
export function SkywaveModule() {
  const [freqMHz, setFreqMHz] = useState(14);
  const [hopKm, setHopKm] = useState(2000);
  const [night, setNight] = useState(false);

  const critical = night ? CRITICAL_FREQ_NIGHT_MHZ : CRITICAL_FREQ_DAY_MHZ;
  const incidence = incidenceAngleDeg(hopKm, VIRTUAL_HEIGHT_KM);
  const muf = mufMHz(critical, incidence);
  const reflects = reflectsSkywave(freqMHz, muf);

  const gTx = CENTER - hopKm / 2;
  const gRx = CENTER + hopKm / 2;
  const rayColor = reflects ? colors.signal : colors.alert;

  const draw = (ctx: CanvasRenderingContext2D, s: RayPathScene) => {
    const tx = s.toPx(gTx, s.surfaceKm(gTx));
    // The reflection point sits on the ionospheric shell — VIRTUAL_HEIGHT_KM above the local surface.
    const apex = s.toPx(CENTER, s.surfaceKm(CENTER) + VIRTUAL_HEIGHT_KM);

    ctx.lineWidth = 2;
    ctx.strokeStyle = rayColor;
    ctx.beginPath();
    ctx.moveTo(tx.px, tx.py);
    ctx.lineTo(apex.px, apex.py);

    if (reflects) {
      // Down the far side to the receiver — a completed hop.
      const rx = s.toPx(gRx, s.surfaceKm(gRx));
      ctx.lineTo(rx.px, rx.py);
      ctx.stroke();
      ground(ctx, s, gRx, colors.signal, 'Rx');
    } else {
      ctx.stroke();
      // Punch through: continue past the layer to the top of the frame and escape.
      const escape = s.toPx(CENTER + hopKm / 2, MAX_ALT_KM);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = colors.alert;
      ctx.beginPath();
      ctx.moveTo(apex.px, apex.py);
      ctx.lineTo(escape.px, escape.py);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = colors.alert;
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('escapes to space', escape.px - 96, escape.py + 14);
      ground(ctx, s, gRx, colors.textFaint, 'Rx (no signal)');
    }

    // The reflection / turning point on the layer.
    ctx.fillStyle = rayColor;
    ctx.beginPath();
    ctx.arc(apex.px, apex.py, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ground(ctx, s, gTx, colors.cyan, 'Tx');
  };

  return (
    <div className="flex flex-col gap-5">
      <RayPathDiagram
        spanKm={SPAN_KM}
        maxAltitudeKm={MAX_ALT_KM}
        ionosphereKm={VIRTUAL_HEIGHT_KM}
        ionosphereLabel={`ionosphere (~${VIRTUAL_HEIGHT_KM} km)`}
        draw={draw}
        deps={[gTx, gRx, reflects, hopKm]}
        height={240}
        yLabel={{ quantity: 'Altitude', unit: 'km' }}
        ariaLabel={
          reflects
            ? 'An HF ray reflecting off the ionosphere back down to a receiver'
            : 'An HF ray punching through the ionosphere and escaping to space'
        }
        hint="vertical scale exaggerated · conceptual — not a real ionosphere model"
      />

      <div className="flex flex-wrap gap-3">
        <Readout label="Frequency" value={`${freqMHz.toFixed(1)} MHz`} accent />
        <Readout
          label={`Critical f (${night ? 'night' : 'day'})`}
          value={`${critical.toFixed(1)} MHz`}
        />
        <Readout label="Incidence  φ" value={`${incidence.toFixed(0)}°`} />
        <Readout label="MUF = fc·sec φ" value={`${muf.toFixed(1)} MHz`} accent />
        <div
          className={[
            'readout flex flex-col rounded-md border px-3 py-2 text-xs',
            reflects ? 'border-signal-dim' : 'border-alert-dim text-alert',
          ].join(' ')}
        >
          <span className="text-text-faint">Outcome</span>
          <span className={reflects ? 'text-signal' : ''}>
            {reflects ? 'reflects — skywave hop' : 'penetrates — escapes to space'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="readout text-xs text-text-faint">ionosphere:</span>
          {[
            { label: 'Day', value: false },
            { label: 'Night', value: true },
          ].map((opt) => {
            const selected = night === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                aria-pressed={selected}
                onClick={() => setNight(opt.value)}
                className={[
                  'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
                  selected
                    ? 'border-signal-dim bg-surface-raised text-signal'
                    : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <Slider
          label="Frequency"
          value={freqMHz}
          min={1}
          max={30}
          step={0.5}
          unit=" MHz"
          decimals={1}
          onChange={setFreqMHz}
          ariaLabel="Operating frequency in megahertz"
        />
        <Slider
          label="Hop distance (ground range)"
          value={hopKm}
          min={200}
          max={3400}
          step={50}
          unit=" km"
          accent={colors.cyan}
          onChange={(v) => setHopKm(Math.round(v))}
          ariaLabel="Hop ground range in kilometres"
        />
        <span className="readout text-xs text-text-faint">
          <GlossedText>
            below the MUF the layer reflects the wave; above it the wave punches through · night
            weakens the layer (lower MUF); longer hops strike it more obliquely (higher MUF)
          </GlossedText>
        </span>
      </div>
    </div>
  );
}

/** A small ground station marker with a label. */
function ground(
  ctx: CanvasRenderingContext2D,
  s: RayPathScene,
  groundKm: number,
  color: string,
  label: string
) {
  const p = s.toPx(groundKm, s.surfaceKm(groundKm));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.px, p.py, 3.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = colors.textMuted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(label, p.px + 6, p.py + 14);
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
      <span className="text-text-faint">{label}</span>
      <span className={accent ? 'text-signal' : 'text-text'}>{value}</span>
    </div>
  );
}
