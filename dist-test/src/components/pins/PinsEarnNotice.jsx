'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PinsEarnNotice;
function PinsEarnNotice({ earnAmount, activity, description }) {
    return (<div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '8px 14px',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(16,185,129,0.06))',
            border: '1px solid rgba(79,70,229,0.18)',
            borderRadius: 10,
            marginBottom: 16,
        }}>
      <span style={{ fontSize: 18 }}>⚡</span>
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
          +{earnAmount} pins
        </span>
        <span style={{ fontSize: 12, color: 'var(--t2)', marginLeft: 6 }}>
          for {activity}
          {description && <span style={{ color: 'var(--t3)', marginLeft: 4 }}>· {description}</span>}
        </span>
      </div>
    </div>);
}
