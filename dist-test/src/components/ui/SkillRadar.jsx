// apps/web/src/components/ui/SkillRadar.tsx
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SkillRadar;
function SkillRadar({ scores }) {
    const labels = Object.keys(scores);
    const values = Object.values(scores);
    const n = labels.length;
    const cx = 140;
    const cy = 130;
    const r = 100;
    const levels = [20, 40, 60, 80, 100];
    function angleFor(i) {
        return (i / n) * 2 * Math.PI - Math.PI / 2;
    }
    function point(val, i) {
        const a = angleFor(i);
        const rv = (val / 100) * r;
        return { x: cx + rv * Math.cos(a), y: cy + rv * Math.sin(a) };
    }
    // Grid rings
    const gridRings = levels.map(level => {
        const pts = labels.map((_, i) => {
            const a = angleFor(i);
            const rv = (level / 100) * r;
            return `${cx + rv * Math.cos(a)},${cy + rv * Math.sin(a)}`;
        });
        return pts.join(' ');
    });
    // Axes
    const axes = labels.map((_, i) => {
        const a = angleFor(i);
        return { x1: cx, y1: cy, x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a) };
    });
    // Data polygon
    const dataPoints = values.map((v, i) => {
        const p = point(v, i);
        return `${p.x},${p.y}`;
    });
    // Label positions
    const labelPos = labels.map((_, i) => {
        const a = angleFor(i);
        const lr = r + 22;
        return { x: cx + lr * Math.cos(a), y: cy + lr * Math.sin(a) };
    });
    return (<svg viewBox="0 0 280 260" style={{ width: '100%', maxWidth: 280, margin: '0 auto', display: 'block' }}>
      {/* Grid rings */}
      {gridRings.map((pts, i) => (<polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.5}/>))}

      {/* Axes */}
      {axes.map((ax, i) => (<line key={i} x1={ax.x1} y1={ax.y1} x2={ax.x2} y2={ax.y2} stroke="var(--border)" strokeWidth={0.5}/>))}

      {/* Data area */}
      <polygon points={dataPoints.join(' ')} fill="rgba(91,91,214,0.12)" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round"/>

      {/* Data points */}
      {values.map((v, i) => {
            const p = point(v, i);
            return (<circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.5}/>);
        })}

      {/* Labels */}
      {labels.map((label, i) => {
            const pos = labelPos[i];
            return (<text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--t3)" fontFamily="var(--font-mono)">
            {label}
            <tspan x={pos.x} dy={10} fontSize={9} fill="var(--t2)" fontWeight={600}>
              {Math.round(values[i])}
            </tspan>
          </text>);
        })}
    </svg>);
}
