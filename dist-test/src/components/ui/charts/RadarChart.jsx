// components/ui/charts/RadarChart.tsx
// Ported from: git/Internship-ResumeBuilder/src/components/CareerAnalytics.jsx
// Spider chart for skills profile. Supports two modes:
//   1. Single-series  → just plot {name, value} (compatible with current SkillRadar shape)
//   2. Dual-series    → plot {name, mine, market} to show user vs market demand
//
// Existing components/ui/SkillRadar.tsx is a simpler version of this. Phase 2 should
// migrate /career-dna and /dashboard to this richer version.
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RadarChart;
function isDual(s) {
    return 'mine' in s && 'market' in s;
}
function RadarChart({ skills, size = 220, primaryColor = 'var(--accent, #3b82f6)', secondaryColor = 'var(--amber, #f59e0b)', }) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;
    const n = skills.length;
    if (n < 3) {
        return (<div style={{
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--t3, #9ca3af)',
                fontSize: 13,
            }}>
        Add more skills to see radar
      </div>);
    }
    const dual = skills.some(isDual);
    const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const point = (i, val) => {
        const a = angle(i);
        const ratio = Math.max(0, Math.min(1, val / 100));
        return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) };
    };
    const labelPt = (i) => {
        const a = angle(i);
        const padFactor = 1.28;
        return { x: cx + r * padFactor * Math.cos(a), y: cy + r * padFactor * Math.sin(a) };
    };
    const polygon = (vals) => vals.map((v, i) => {
        const p = point(i, v);
        return `${p.x},${p.y}`;
    }).join(' ');
    const minePoints = polygon(skills.map((s) => (isDual(s) ? s.mine : s.value)));
    const marketPoints = dual
        ? polygon(skills.map((s) => (isDual(s) ? s.market : 0)))
        : null;
    return (<svg width={size} height={size} style={{ overflow: 'visible' }} role="img" aria-label="Skills radar chart">
      {/* Grid rings at 25/50/75/100 */}
      {[25, 50, 75, 100].map((ring) => (<polygon key={ring} points={skills.map((_, i) => {
                const p = point(i, ring);
                return `${p.x},${p.y}`;
            }).join(' ')} fill="none" stroke="var(--border, #e5e7eb)" strokeWidth="1"/>))}

      {/* Spokes */}
      {skills.map((_, i) => {
            const p = point(i, 100);
            return (<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border, #e5e7eb)" strokeWidth="1"/>);
        })}

      {/* Market demand area (under primary in dual mode) */}
      {marketPoints && (<polygon points={marketPoints} fill={secondaryColor} fillOpacity="0.2" stroke={secondaryColor} strokeWidth="2"/>)}

      {/* User profile area */}
      <polygon points={minePoints} fill={primaryColor} fillOpacity="0.2" stroke={primaryColor} strokeWidth="2"/>

      {/* Axis labels */}
      {skills.map((s, i) => {
            const lp = labelPt(i);
            return (<text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--t1, #374151)">
            {s.name}
          </text>);
        })}
    </svg>);
}
