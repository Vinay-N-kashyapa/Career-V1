// components/ui/charts/DonutChart.tsx
// Ported from: git/Internship-ResumeBuilder/src/components/CareerAnalytics.jsx
// Segmented donut chart. Use for "Who is viewing you" (recruiter / candidate / admin breakdowns),
// time-on-platform splits, or any categorical total.

'use client';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Total displayed in the centre. Defaults to sum of segment values. */
  total?: number;
  /** Label below the total. */
  centerLabel?: string;
  size?: number;
  /** Show legend below the donut. */
  showLegend?: boolean;
}

export default function DonutChart({
  segments,
  total,
  centerLabel = 'Total',
  size = 180,
  showLegend = true,
}: DonutChartProps) {
  const computedTotal = total ?? segments.reduce((sum, s) => sum + s.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.14;

  let cumAngle = -Math.PI / 2;
  const arcs = segments.map((seg) => {
    const pct = computedTotal > 0 ? seg.value / computedTotal : 0;
    const start = cumAngle;
    const end = cumAngle + pct * 2 * Math.PI;
    cumAngle = end;
    const lx1 = cx + r * Math.cos(start);
    const ly1 = cy + r * Math.sin(start);
    const lx2 = cx + r * Math.cos(end);
    const ly2 = cy + r * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return {
      ...seg,
      d: `M ${lx1} ${ly1} A ${r} ${r} 0 ${large} 1 ${lx2} ${ly2}`,
      pct,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`Donut chart, ${centerLabel}: ${computedTotal}`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--bg3, #f3f4f6)"
          strokeWidth={strokeW}
        />

        {/* Segment arcs */}
        {arcs.map((arc, i) =>
          arc.pct > 0 ? (
            <path
              key={i}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeW}
              strokeLinecap="butt"
              style={{ transition: 'all 0.8s ease' }}
            />
          ) : null,
        )}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="26"
          fontWeight="800"
          fill="var(--t1, #1f2937)"
        >
          {computedTotal}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="11"
          fill="var(--t3, #9ca3af)"
        >
          {centerLabel}
        </text>
      </svg>

      {showLegend && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '6px 12px',
            width: '100%',
            maxWidth: 320,
          }}
        >
          {arcs.map((arc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--t2, #6b7280)',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: arc.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {arc.label}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--t1, #374151)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {arc.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
