'use client';
import Link from 'next/link';

interface Props {
  label:    string;
  value:    number;
  max:      number | null;
  color:    string;
  icon:     string;
  trend?:   number;
  tooltip?: string;
  suffix?:  string;
  href?:    string;
}

export default function ScoreCard({ label, value, max, color, icon, trend, tooltip, suffix, href }: Props) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;

  const card = (
    <div className={`score-card ${color}`} title={tooltip}>
      <div className="sc-header">
        <div className="sc-icon-wrap">{icon}</div>
        {trend !== undefined && trend !== 0 && (
          <span
            className="sc-trend-badge"
            style={{
              background: trend > 0 ? 'var(--green-light)' : 'var(--coral-light)',
              color:      trend > 0 ? 'var(--green)'       : 'var(--coral)',
              border:     `1px solid ${trend > 0 ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>
        )}
      </div>
      <div className="sc-label">{label}</div>
      <div className="sc-value">
        {Math.round(value)}
        {suffix && <span className="sc-suffix"> {suffix}</span>}
        {max   && <span className="sc-max">/{max}</span>}
      </div>
      {max && (
        <div className="sc-bar">
          <div className="sc-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{card}</Link>;
  return card;
}
