import { useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { colors } from '@/design/tokens';
import { useAppStore } from '@/store/appStore';

type Flavor = 'carrier' | 'timing';

const FLAVORS: Record<
  Flavor,
  {
    label: string;
    detector: string;
    detectorSub: string;
    corrector: string;
    correctorSub: string;
    error: string;
    blurb: string;
    seeModule: string;
    seeLabel: string;
  }
> = {
  carrier: {
    label: 'Carrier recovery',
    detector: 'Phase detector',
    detectorSub: 'measure phase error',
    corrector: 'NCO',
    correctorSub: 'de-rotate',
    error: 'phase error',
    blurb:
      'A free-running receiver oscillator leaves the constellation slowly spinning. A carrier loop measures the residual phase, filters it, and steers a local oscillator to cancel it — locking the constellation still.',
    seeModule: 'carrier-offset',
    seeLabel: 'Carrier Offset & Doppler',
  },
  timing: {
    label: 'Timing recovery',
    detector: 'Timing detector',
    detectorSub: 'measure timing error',
    corrector: 'Interpolator',
    correctorSub: 're-sample',
    error: 'timing error',
    blurb:
      'The receiver must sample each symbol at exactly the right instant — the peak of the matched filter. A timing loop measures how early or late it is sampling and slides the sampling phase until it lands on the peak.',
    seeModule: 'matched-filter',
    seeLabel: 'Matched Filter',
  },
};

// A compact left-to-right loop with a feedback path drawn underneath.
const BOXES = [
  { id: 'detector', x: 150 },
  { id: 'filter', x: 300 },
  { id: 'corrector', x: 450 },
] as const;
const BW = 120;
const BH = 50;
const BY = 24;
const FEEDBACK_Y = 130;

/**
 * Synchronization — a clearly-labeled conceptual stub. Carrier and timing recovery are tracking
 * loops: a detector measures a residual error, a loop filter smooths it, and a corrector drives it
 * back toward zero — the closed loop that keeps a receiver locked. It's a different flavor from the
 * rest of this track (feedback loops, not block estimators) and is only sketched here; the spinning
 * constellation a carrier loop fixes lives in the Carrier Offset & Doppler module.
 */
export function SynchronizationModule() {
  const [flavor, setFlavor] = useState<Flavor>('carrier');
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const f = FLAVORS[flavor];

  const box = (id: string) => BOXES.find((b) => b.id === id)!;
  const cx = (id: string) => box(id).x + BW / 2;
  const labels: Record<string, { label: string; sub: string }> = {
    detector: { label: f.detector, sub: f.detectorSub },
    filter: { label: 'Loop filter', sub: 'smooth' },
    corrector: { label: f.corrector, sub: f.correctorSub },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FLAVORS) as Flavor[]).map((id) => (
          <Chip key={id} selected={id === flavor} onClick={() => setFlavor(id)}>
            {FLAVORS[id].label}
          </Chip>
        ))}
        <span className="ml-auto rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-faint">
          Conceptual
        </span>
      </div>

      <svg
        viewBox="0 0 600 170"
        role="img"
        aria-label="Tracking-loop block diagram: a detector measures the error, a loop filter smooths it, and a corrector feeds back to drive the error to zero"
        className="w-full rounded-md border border-border bg-surface"
      >
        <defs>
          <marker id="sync-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={colors.textFaint} />
          </marker>
        </defs>

        {/* Forward path: input → detector → loop filter → corrector → locked output. */}
        <Wire x1={24} y1={BY + BH / 2} x2={box('detector').x} y2={BY + BH / 2} />
        <Wire x1={box('detector').x + BW} y1={BY + BH / 2} x2={box('filter').x} y2={BY + BH / 2} />
        <Wire x1={box('filter').x + BW} y1={BY + BH / 2} x2={box('corrector').x} y2={BY + BH / 2} />
        <Wire x1={box('corrector').x + BW} y1={BY + BH / 2} x2={584} y2={BY + BH / 2} />

        {/* Feedback: corrector output drops down, runs back, and re-enters the detector. */}
        <path
          d={`M ${cx('corrector')} ${BY + BH} V ${FEEDBACK_Y} H ${cx('detector')} V ${BY + BH}`}
          fill="none"
          stroke={colors.signalDim}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          markerEnd="url(#sync-arrow)"
        />
        <text
          x={(cx('detector') + cx('corrector')) / 2}
          y={FEEDBACK_Y + 16}
          textAnchor="middle"
          fontSize={11}
          fill={colors.signal}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          feedback — drive {f.error} → 0
        </text>

        <text x={24} y={BY - 6} fontSize={10.5} fill={colors.textFaint} style={MONO}>
          from receiver
        </text>
        <text x={584} y={BY - 6} textAnchor="end" fontSize={10.5} fill={colors.signal} style={MONO}>
          locked output
        </text>

        {BOXES.map((b) => (
          <g key={b.id} transform={`translate(${b.x} ${BY})`}>
            <rect
              width={BW}
              height={BH}
              rx={8}
              fill={colors.surface}
              stroke={colors.signalDim}
              strokeWidth={1.5}
            />
            <text
              x={BW / 2}
              y={BH / 2 - 3}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill={colors.text}
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {labels[b.id].label}
            </text>
            <text
              x={BW / 2}
              y={BH / 2 + 13}
              textAnchor="middle"
              fontSize={10.5}
              fill={colors.textFaint}
              style={MONO}
            >
              {labels[b.id].sub}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-text-muted">
          <GlossedText>{f.blurb}</GlossedText>
        </p>
        <button
          type="button"
          onClick={() => setActiveModule(f.seeModule)}
          className="self-start rounded-md border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-signal-dim hover:text-signal"
        >
          See it in action → {f.seeLabel}
        </button>
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            both flavors share one shape: measure an error, smooth it, feed a correction back — a
            loop that locks · this is a sketch of the idea, not a built-out lesson; the loop
            dynamics (acquisition, lock range, loop bandwidth) are a track of their own
          </GlossedText>
        </p>
      </div>
    </div>
  );
}

const MONO = { fontFamily: 'JetBrains Mono, monospace' } as const;

function Wire({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={colors.border}
      strokeWidth={1.5}
      markerEnd="url(#sync-arrow)"
    />
  );
}

function Chip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'readout cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
        selected
          ? 'border-signal-dim bg-surface-raised text-signal'
          : 'border-border bg-surface text-text-muted hover:border-signal-dim hover:text-text',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
