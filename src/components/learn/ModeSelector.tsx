// apps/web/src/components/learn/ModeSelector.tsx
'use client';

const MODES = [
  { id:'explain',   label:'Explain',   icon:'◷', desc:'Teach me this topic' },
  { id:'oral',      label:'Oral Test', icon:'◎', desc:'Quiz me verbally' },
  { id:'written',   label:'Written',   icon:'◫', desc:'Generate quiz questions' },
  { id:'summary',   label:'Summary',   icon:'▦',  desc:'Compact revision notes' },
  { id:'flashcard', label:'Flashcards',icon:'⊹', desc:'Study cards' },
];

interface Props { value: string; onChange: (mode: string) => void; }

export default function ModeSelector({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--t3)', fontFamily:'var(--font-mono)', marginBottom:10 }}>Session Mode</div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            title={m.desc}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', borderRadius:8,
              background: value === m.id ? 'rgba(91,91,214,0.12)' : 'var(--card)',
              border:`1px solid ${value === m.id ? 'rgba(91,91,214,0.35)' : 'var(--border)'}`,
              color: value === m.id ? '#8b8bf5' : 'var(--t2)',
              cursor:'pointer', fontSize:12, fontWeight:500,
              transition:'all 0.15s',
            }}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
