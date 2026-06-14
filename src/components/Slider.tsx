import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/design/tokens';

export interface SliderProps {
  /** Static field name (neutral), shown at the row's left. */
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Live value to display; defaults to `value` formatted with `decimals` + `unit`. */
  display?: ReactNode;
  unit?: string;
  decimals?: number;
  /**
   * Accent for the handle, the filled track, and the live value — i.e. the "this is live" color
   * (CONTRIBUTING → "Accent color semantics"). Defaults to signal-green; pass `colors.cyan` for the
   * secondary accent.
   */
  accent?: string;
  /** Falls back to `label` when it's a plain string. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The one slider control for the whole app. Wavefront is direct-manipulation first, so every slider
 * must read as a grabbable control rather than a bare dot on a hairline: this pairs the static field
 * name with its live (accent) value and renders a single `<input type="range">` whose track, filled
 * portion, and handle are styled once in `index.css` (the affordance language — see CONTRIBUTING).
 * Routing every slider through here is what makes "consistent app-wide" true by construction rather
 * than by remembering; a test (`Slider.test.tsx`) fails if a module inlines a raw range input.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  unit = '',
  decimals = 0,
  accent = colors.signal,
  ariaLabel,
  className,
  style,
}: SliderProps) {
  const pct = max > min ? ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100 : 0;
  return (
    <label
      className={['flex flex-1 flex-col gap-1.5', className].filter(Boolean).join(' ')}
      style={style}
    >
      <span className="readout flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span style={{ color: accent }}>{display ?? `${value.toFixed(decimals)}${unit}`}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
        style={{ '--wf-accent': accent, '--wf-fill': `${pct}%` } as CSSProperties}
      />
    </label>
  );
}
