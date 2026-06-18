import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { RayPathDiagram, type RayPathScene } from '@/components/plots/RayPathDiagram';
import { Slider } from '@/components/Slider';
import { colors } from '@/design/tokens';
import { EARTH_RADIUS_KM, formatDistanceKm, horizonKm, radioHorizonKm } from '@/propagation';

const SPAN_KM = 180; // fixed frame so a growing reach is visible as the antennas slide apart
const CENTER = SPAN_KM / 2;
const H_MIN = 1;
const H_MAX = 500;

/**
 * Radio Horizon / Line-of-Sight (brief §8) — the cleanest interactive in the track. Above HF a
 * link's range is mostly geometry: each antenna can "see" to where its sight line grazes the curve
 * of the Earth, a distance `d ≈ √(2·R·h)`, and two stations reach each other out to the sum,
 * `d ≈ 3.57·(√h₁ + √h₂)` km with heights in metres. Drag the two heights and watch the horizon —
 * the green sight line grazing the bulge — stretch. The aha: it's almost all about how high you are.
 */
export function RadioHorizonModule() {
  const [txM, setTxM] = useState(30);
  const [rxM, setRxM] = useState(10);

  const dTx = horizonKm(txM);
  const dRx = horizonKm(rxM);
  const total = radioHorizonKm(txM, rxM);

  // Place each antenna at its own horizon distance from the shared grazing point at the centre, so
  // the masts' tops land exactly on the bulge peak and the sight line grazes the Earth between them.
  const gTx = CENTER - dTx;
  const gRx = CENTER + dRx;
  const txKm = txM / 1000;
  const rxKm = rxM / 1000;

  const draw = (ctx: CanvasRenderingContext2D, s: RayPathScene) => {
    const a = s.toPx(gTx, s.surfaceKm(gTx) + txKm);
    const b = s.toPx(gRx, s.surfaceKm(gRx) + rxKm);
    // The line of sight: grazes the horizon at the centre tangent point.
    ctx.strokeStyle = colors.signal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    // Mark the grazing (horizon) point.
    const t = s.toPx(CENTER, s.surfaceKm(CENTER));
    ctx.fillStyle = colors.signal;
    ctx.beginPath();
    ctx.arc(t.px, t.py, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = colors.textMuted;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('horizon', t.px + 6, t.py + 14);
  };

  return (
    <div className="flex flex-col gap-5">
      <RayPathDiagram
        spanKm={SPAN_KM}
        maxAltitudeKm={(CENTER * CENTER) / (2 * EARTH_RADIUS_KM) + 0.1}
        antennas={[
          { groundKm: gTx, heightKm: txKm, color: colors.cyan, label: 'Tx' },
          { groundKm: gRx, heightKm: rxKm, color: colors.cyan, label: 'Rx' },
        ]}
        draw={draw}
        deps={[gTx, gRx, txKm, rxKm]}
        height={240}
        yLabel={{ quantity: 'Height', unit: 'km' }}
        ariaLabel="A curved Earth with two antennas; the line of sight between them grazes the horizon"
        hint="vertical scale exaggerated · the green line is the radio horizon — the maximum line-of-sight reach"
      />

      <div className="flex flex-wrap gap-3">
        <Readout label="Tx horizon  √(2·R·h)" value={formatDistanceKm(dTx)} />
        <Readout label="Rx horizon  √(2·R·h)" value={formatDistanceKm(dRx)} />
        <Readout label="Radio horizon  ≈ 3.57·(√h₁ + √h₂)" value={formatDistanceKm(total)} accent />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:gap-6">
        <Slider
          label="Transmit antenna height"
          value={txM}
          min={H_MIN}
          max={H_MAX}
          step={1}
          unit=" m"
          accent={colors.cyan}
          onChange={(v) => setTxM(Math.round(v))}
          ariaLabel="Transmit antenna height in metres"
        />
        <Slider
          label="Receive antenna height"
          value={rxM}
          min={H_MIN}
          max={H_MAX}
          step={1}
          unit=" m"
          accent={colors.cyan}
          onChange={(v) => setRxM(Math.round(v))}
          ariaLabel="Receive antenna height in metres"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            raise either antenna and the horizon stretches — but only with the square root, so the
            first few metres buy the most · this is the geometric horizon; refraction bends rays a
            little farther, the textbook 4/3-Earth nudging the 3.57 up toward 4.12
          </GlossedText>
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
