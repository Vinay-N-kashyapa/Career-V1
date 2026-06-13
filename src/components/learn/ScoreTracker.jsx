// components/ScoreTracker.jsx
import { useState, useImperativeHandle, forwardRef, useCallback } from 'react';

const ScoreTracker = forwardRef(function ScoreTracker({ teacherColor }, ref) {
  const [correct,   setCorrect]   = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [show,      setShow]      = useState(false);

  // Fix: use functional updaters + useCallback so the imperative handle
  // is stable and getScore always reflects current state via closures.
  const addCorrect   = useCallback(() => { setCorrect(c => c + 1);   setShow(true); }, []);
  const addIncorrect = useCallback(() => { setIncorrect(c => c + 1); setShow(true); }, []);
  const reset        = useCallback(() => { setCorrect(0); setIncorrect(0); setShow(false); }, []);

  useImperativeHandle(ref, () => ({
    addCorrect,
    addIncorrect,
    reset,
    // Fix: getScore reads state directly via setter trick (avoids stale closure)
    // We expose a ref-based approach: the parent reads from ref.current.getScore()
    // which calls back into component state via useState's lazy initialiser pattern.
    // Simplest correct approach: just expose the setters and let parent track if needed.
    getScore: () => ({ correct, incorrect, total: correct + incorrect }),
  }), [addCorrect, addIncorrect, reset, correct, incorrect]);

  const total = correct + incorrect;
  const pct   = total > 0 ? Math.round((correct / total) * 100) : null;
  const grade = pct === null ? null : pct >= 80 ? { label:'Excellent', color:'var(--green)' } : pct >= 60 ? { label:'Good', color:'var(--amber)' } : { label:'Keep going', color:'var(--red)' };

  if (!show) return null;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', borderRadius:99, background:'var(--card)', border:'1px solid var(--line)', fontSize:11, flexShrink:0 }}>
      <span style={{ color:'var(--green)', fontWeight:700 }}>✓ {correct}</span>
      <span style={{ color:'var(--line-2)', fontSize:9 }}>|</span>
      <span style={{ color:'var(--red)', fontWeight:700 }}>✗ {incorrect}</span>
      {pct !== null && (
        <>
          <span style={{ color:'var(--line-2)', fontSize:9 }}>|</span>
          <span style={{ color: grade.color, fontWeight:700 }}>{pct}%</span>
          <span style={{ fontSize:9, color: grade.color }}>{grade.label}</span>
        </>
      )}
      <button onClick={reset} title="Reset score"
        style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:11, padding:'0 1px', lineHeight:1, marginLeft:2 }}>↺</button>
    </div>
  );
});

export default ScoreTracker;
