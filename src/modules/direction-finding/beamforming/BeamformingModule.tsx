import { useMemo, useState } from 'react';
import { PolarPlot } from '@/components/plots/PolarPlot';
import { colors } from '@/design/tokens';
import { beamPattern, arrayResponse, toDb, gratingLobeAngles } from '@/dsp/array';

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Beamforming / array pattern module (brief §4, Layer 1). Steer an N-element uniform linear
 * array and watch the delay-and-sum gain pattern — mainlobe plus sidelobes — sweep across
 * bearings. More elements ⇒ a sharper mainlobe; a baseline past λ/2 grows grating lobes
 * (the array-scale version of the Layer 0 phase ambiguity).
 */
export function BeamformingModule() {
  const [n, setN] = useState(8);
  const [dLambda, setDLambda] = useState(0.5);
  const [steerDeg, setSteerDeg] = useState(20);
  const [sourceDeg, setSourceDeg] = useState(-15);

  // The visible beam: a mainlobe pointing where we steer.
  const pattern = useMemo(() => beamPattern(n, dLambda, deg(steerDeg), 1), [n, dLambda, steerDeg]);

  // How strongly the steered beam picks up the source (peaks when steer aligns with source).
  const outputPower = arrayResponse(n, dLambda, deg(steerDeg), deg(sourceDeg), 1);
  // Grating lobes actually visible at the current steering angle (not merely d > λ/2).
  const gratingLobes = gratingLobeAngles(dLambda, deg(steerDeg), 1);
  const grating = gratingLobes.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-[300px] flex-1">
          <PolarPlot
            anglesRad={pattern.anglesRad}
            values={pattern.power}
            floorDb={-40}
            markers={[
              { angleRad: deg(steerDeg), color: colors.signal, label: 'steer' },
              { angleRad: deg(sourceDeg), color: colors.cyan, dashed: true, label: 'source' },
            ]}
            size={320}
          />
          <p className="readout mt-1 text-xs text-text-faint">
            radius = gain in dB (0 dB at the rim, −40 dB at the center) · the rings are 10 dB apart,
            so the small bumps beside the mainlobe are the sidelobes
          </p>
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-3">
          <Readout label="Elements N" value={`${n}`} />
          <Readout label="Spacing d" value={`${dLambda.toFixed(2)} λ`} />
          <Readout label="Steering angle" value={`${steerDeg}°`} accent />
          <Readout
            label="Output power @ source"
            value={`${toDb(outputPower).toFixed(1)} dB`}
            accent
          />
          <div
            className={[
              'readout flex flex-col rounded-md border px-3 py-2 text-xs',
              grating ? 'border-alert-dim text-alert' : 'border-signal-dim text-signal',
            ].join(' ')}
          >
            <span className="text-text-faint">Grating lobes</span>
            <span>
              {grating
                ? `visible at ${gratingLobes.map((g) => `${((g * 180) / Math.PI).toFixed(0)}°`).join(', ')}`
                : dLambda > 0.5
                  ? 'none at this steer (d > λ/2)'
                  : 'none (d ≤ λ/2)'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-6">
          <Slider
            label="Steering angle"
            value={steerDeg}
            min={-90}
            max={90}
            step={1}
            unit="°"
            onChange={setSteerDeg}
          />
          <Slider
            label="Source bearing"
            value={sourceDeg}
            min={-90}
            max={90}
            step={1}
            unit="°"
            onChange={setSourceDeg}
            accent={colors.cyan}
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <Slider label="Elements N" value={n} min={2} max={12} step={1} onChange={setN} />
          <Slider
            label="Spacing d"
            value={dLambda}
            min={0.1}
            max={1}
            step={0.05}
            unit=" λ"
            decimals={2}
            onChange={setDLambda}
          />
        </div>
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  decimals = 0,
  accent = colors.signal,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
  accent?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 180 }}>
      <span className="readout flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span style={{ color: accent }}>
          {value.toFixed(decimals)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: accent }}
        aria-label={label}
      />
    </label>
  );
}
