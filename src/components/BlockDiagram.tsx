import { useMemo, useState } from 'react';
import { getModule } from '@/registry';
import { useAppStore } from '@/store/appStore';
import { colors } from '@/design/tokens';

export interface DiagramNode {
  id: string;
  /** Short block name (e.g. "Mixer"). */
  label: string;
  /** What it maps to in software (e.g. "downconversion") — the second line. */
  sub?: string;
  /** Registry id of the module this block routes to. Omit (or an unregistered id) → a quiet,
   *  non-interactive "no software counterpart / not built yet" block. */
  moduleId?: string;
  /** Top-left position + size in viewBox units. */
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
}

export interface BlockDiagramProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** viewBox dimensions; the SVG scales to its container width. */
  width: number;
  height: number;
  ariaLabel: string;
}

const NW = 116;
const NH = 54;

/**
 * An interactive "boxes and wires" block diagram. Each node can route to the registry module that
 * simulates its function — so a hardware/orientation learner can click a block (mixer, ADC, filter…)
 * and land in the math behind it. Linked blocks read as pressable controls (accent, grab-attention
 * hover, keyboard focus, pointer cursor) per the affordance language; blocks with no software
 * counterpart yet (or a not-built track) stay quiet and inert. Reusable as an app-wide orientation
 * map — hence generic over its nodes/edges rather than baking in one chain.
 */
export function BlockDiagram({ nodes, edges, width, height, ariaLabel }: BlockDiagramProps) {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [hover, setHover] = useState<string | null>(null);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const right = (n: DiagramNode) => ({ x: n.x + (n.w ?? NW), y: n.y + (n.h ?? NH) / 2 });
  const left = (n: DiagramNode) => ({ x: n.x, y: n.y + (n.h ?? NH) / 2 });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label={ariaLabel}
      className="w-full rounded-md border border-border bg-surface"
    >
      <defs>
        <marker id="bd-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={colors.textFaint} />
        </marker>
      </defs>

      {edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const p0 = right(a);
        const p1 = left(b);
        const midX = (p0.x + p1.x) / 2;
        // Elbow connector so cross-row wires read cleanly; a straight arrow when aligned.
        const d = `M ${p0.x} ${p0.y} H ${midX} V ${p1.y} H ${p1.x}`;
        return (
          <path
            key={`${e.from}-${e.to}`}
            d={d}
            fill="none"
            stroke={colors.border}
            strokeWidth={1.5}
            markerEnd="url(#bd-arrow)"
          />
        );
      })}

      {nodes.map((n) => {
        const w = n.w ?? NW;
        const h = n.h ?? NH;
        const linked = Boolean(n.moduleId && getModule(n.moduleId));
        const active = hover === n.id;
        const stroke = linked ? (active ? colors.signal : colors.signalDim) : colors.border;
        const fill = linked && active ? colors.surfaceRaised : colors.surface;
        const labelColor = linked ? colors.signal : colors.textMuted;

        const go = () => linked && n.moduleId && setActiveModule(n.moduleId);

        return (
          <g
            key={n.id}
            transform={`translate(${n.x} ${n.y})`}
            role={linked ? 'button' : undefined}
            tabIndex={linked ? 0 : undefined}
            aria-label={linked ? `${n.label} — open the ${n.label} module` : n.label}
            className={linked ? 'cursor-pointer outline-none' : undefined}
            onClick={go}
            onKeyDown={(ev) => {
              if (linked && (ev.key === 'Enter' || ev.key === ' ')) {
                ev.preventDefault();
                go();
              }
            }}
            onMouseEnter={() => linked && setHover(n.id)}
            onMouseLeave={() => setHover((cur) => (cur === n.id ? null : cur))}
            onFocus={() => linked && setHover(n.id)}
            onBlur={() => setHover((cur) => (cur === n.id ? null : cur))}
          >
            <rect
              width={w}
              height={h}
              rx={8}
              fill={fill}
              stroke={stroke}
              strokeWidth={active ? 2 : 1.5}
            />
            <text
              x={w / 2}
              y={n.sub ? h / 2 - 4 : h / 2 + 4}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill={labelColor}
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {n.label}
            </text>
            {n.sub && (
              <text
                x={w / 2}
                y={h / 2 + 13}
                textAnchor="middle"
                fontSize={10.5}
                fill={colors.textFaint}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {n.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
