// components/StepBar.jsx — shared step progress indicator
const STEPS = [
  { n: 1, label: 'Sign Up' },
  { n: 2, label: 'Teacher' },
  { n: 3, label: 'Dashboard' },
  { n: 4, label: 'Learn' },
];

export default function StepBar({ current }) {
  return (
    <div className="steps">
      {STEPS.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="step-item">
              <div className={`step-dot ${done ? 'done' : active ? 'active' : 'idle'}`}>
                {done ? '✓' : s.n}
              </div>
              <span className={`step-label ${active ? 'active' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${done ? 'done' : 'idle'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
