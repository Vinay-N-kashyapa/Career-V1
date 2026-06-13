'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScoreCard;
const link_1 = __importDefault(require("next/link"));
function ScoreCard({ label, value, max, color, icon, trend, tooltip, suffix, href }) {
    const pct = max ? Math.min(100, (value / max) * 100) : 0;
    const card = (<div className={`score-card ${color}`} title={tooltip}>
      <div className="sc-header">
        <div className="sc-icon-wrap">{icon}</div>
        {trend !== undefined && trend !== 0 && (<span className="sc-trend-badge" style={{
                background: trend > 0 ? 'var(--green-light)' : 'var(--coral-light)',
                color: trend > 0 ? 'var(--green)' : 'var(--coral)',
                border: `1px solid ${trend > 0 ? '#a7f3d0' : '#fecaca'}`,
            }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>)}
      </div>
      <div className="sc-label">{label}</div>
      <div className="sc-value">
        {Math.round(value)}
        {suffix && <span className="sc-suffix"> {suffix}</span>}
        {max && <span className="sc-max">/{max}</span>}
      </div>
      {max && (<div className="sc-bar">
          <div className="sc-bar-fill" style={{ width: `${pct}%` }}/>
        </div>)}
    </div>);
    if (href)
        return <link_1.default href={href} style={{ textDecoration: 'none' }}>{card}</link_1.default>;
    return card;
}
