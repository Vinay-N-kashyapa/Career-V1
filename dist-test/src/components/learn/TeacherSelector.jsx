// apps/web/src/components/learn/TeacherSelector.tsx
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TeacherSelector;
const TEACHERS = [
    { id: 'priya', name: 'Ms. Priya', desc: 'Warm & encouraging', emoji: '👩‍💼' },
    { id: 'aisha', name: 'Ms. Aisha', desc: 'Structured & clear', emoji: '👩‍🏫' },
    { id: 'rohan', name: 'Mr. Rohan', desc: 'Fun & energetic', emoji: '👨‍💻' },
    { id: 'vikram', name: 'Mr. Vikram', desc: 'Strict & rigorous', emoji: '👨‍⚖️' },
];
function TeacherSelector({ value, onChange }) {
    return (<div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Choose Your Teacher</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TEACHERS.map(t => (<button key={t.id} onClick={() => onChange(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: value === t.id ? 'rgba(91,91,214,0.12)' : 'var(--card)',
                border: `1px solid ${value === t.id ? 'rgba(91,91,214,0.35)' : 'var(--border)'}`,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
            <span style={{ fontSize: 22 }}>{t.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{t.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{t.desc}</div>
            </div>
          </button>))}
      </div>
    </div>);
}
