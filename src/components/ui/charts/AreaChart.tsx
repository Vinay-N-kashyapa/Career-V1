// components/ui/charts/AreaChart.tsx
// Ported from: git/Internship-ResumeBuilder/src/components/CareerAnalytics.jsx
// SVG line/area chart for time-series scores (e.g. ATS score trend, DNA over weeks).
// Zero dependencies — pure SVG.

'use client';
import { useId } from 'react';

export interface AreaChartPoint {
  /** X-axis label (e.g. 'Mon', 'Wk 1', 'Jan') */
  label: string;
  /** Y-axis value */
  y: number;
}

export interface AreaChartProps {
  points: AreaChartPoint[];
  /** Stroke + gradient color. Defaults to PinIT accent. */
  color?: string;
  /** Height in pixels. Width fills the container. */
  height?: number;
  /** Y-axis upper bound. Defaults to max(data, 1). Set to 100 for percentage scores. */
  yMax?: number;
  /** Y-axis lower bound. Defaults to min(data). Set to 0 for absolute scales. */
  yMin?: number;
}

export default function AreaChart({
  points,
  color = 'var(--accent, #4f46e5)',
  height = 200,
  yMax,
  yMin,
}: AreaChartProps) {
  const gradientId = useId();

  if (!points || points.length < 2) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--t3, #9ca3af)',
          fontSize: 13,
        }}
      >
        Not enough data yet
      </div>
    );
  }

  const W = 480;
  const H = height;
  const values = points.map((p) => p.y);
  const min = yMin ?? Math.min(...values);
  const max = yMax ?? Math.max(...values, min + 1);
  const pad = { top: 20, bottom: 30, left: 40, right: 20 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const sx = (i: number) =>
    pad.left + (i / (points.length - 1)) * iW;
  const sy = (v: number) =>
    pad.top + iH - ((v - min) / (max - min || 1)) * iH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(p.y)}`)
    .join(' ');

  const areaD = `${pathD} L ${sx(points.length - 1)} ${H - pad.bottom} L ${sx(0)} ${H - pad.bottom} Z`;

  // Generate 5 evenly spaced y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round(min + ((max - min) * i) / 4),
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height }}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Area chart with ${points.length} data points`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={sy(t)}
            y2={sy(t)}
            stroke="var(--border, #e5e7eb)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text
            x={pad.left - 6}
            y={sy(t) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--t3, #9ca3af)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(i)}
          cy={sy(p.y)}
          r="4"
          fill="var(--bg2, white)"
          stroke={color}
          strokeWidth="2.5"
        />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={sx(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--t3, #9ca3af)"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
