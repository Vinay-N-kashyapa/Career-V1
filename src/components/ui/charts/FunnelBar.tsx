// components/ui/charts/FunnelBar.tsx
// Ported from: git/Internship-ResumeBuilder/src/components/CareerAnalytics.jsx
// Horizontal labeled bar. Stack them for application funnels, score breakdowns,
// or any "X out of total" visualisation.

'use client';

export interface FunnelBarProps {
  label: string;
  value: number;
  /** Reference max for percentage calculation. */
  max: number;
  /** Bar fill color. Pass a CSS variable or hex. */
  color?: string;
  /** Width of the label column in px. Tune when labels are long/short. */
  labelWidth?: number;
  /** Show the raw value on the right. Default: true. */
  showValue?: boolean;
  /** Animate the fill on mount/update. Default: true. */
  animated?: boolean;
}

export default function FunnelBar({
  label,
  value,
  max,
  color = 'var(--accent, #4f46e5)',
  labelWidth = 90,
  showValue = true,
  animated = true,
}: FunnelBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: labelWidth,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--t2, #6b7280)',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 22,
          background: 'var(--bg3, #f3f4f6)',
          borderRadius: 100,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 100,
            transition: animated ? 'width 1s ease' : 'none',
            minWidth: value > 0 ? 8 : 0,
          }}
        />
      </div>
      {showValue && (
        <div
          style={{
            width: 36,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--t1, #374151)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
