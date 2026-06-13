/**
 * CodingQuestionForm.jsx
 * Drop-in coding question form for AdminPages PapersTab.
 *
 * Renders when manualQ.type === 'coding'.
 * Props:
 *   value    = { description, functionName, difficulty, defaultLang, constraints, testCases }
 *   onChange = (newValue) => void
 */
import React, { useState } from 'react';
import { Input, Select, Textarea, Btn } from '../components/UI.jsx';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const LANGUAGES = [
  { id: 'python',     label: '🐍 Python'     },
  { id: 'javascript', label: '⚡ JavaScript' },
  { id: 'java',       label: '☕ Java'        },
  { id: 'cpp',        label: '⚙️ C++'         },
  { id: 'c',          label: '🔷 C'           },
];

const emptyTC = () => ({ input: '', output: '', explanation: '', hidden: false });

export default function CodingQuestionForm({ value, onChange }) {
  const [activeTC, setActiveTC] = useState(null);

  const v = {
    description:  '',
    functionName: '',
    difficulty:   'Medium',
    defaultLang:  'python',
    constraints:  '',
    testCases:    [],
    ...value,
  };

  function upd(key, val) { onChange({ ...v, [key]: val }); }

  function addTC() {
    const tcs = [...v.testCases, emptyTC()];
    upd('testCases', tcs);
    setActiveTC(tcs.length - 1);
  }

  function updTC(idx, key, val) {
    upd('testCases', v.testCases.map((tc, i) => i === idx ? { ...tc, [key]: val } : tc));
  }

  function removeTC(idx) {
    upd('testCases', v.testCases.filter((_, i) => i !== idx));
    if (activeTC === idx) setActiveTC(null);
  }

  return (
    <div>
      {/* Problem description */}
      <Textarea
        label="Problem Description *"
        value={v.description}
        onChange={e => upd('description', e.target.value)}
        rows={4}
        placeholder="Describe the problem clearly. What does the function receive and return?"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          label="Function Name"
          value={v.functionName}
          onChange={e => upd('functionName', e.target.value)}
          placeholder="e.g. reverseString, twoSum"
        />
        <Select
          label="Difficulty"
          value={v.difficulty}
          onChange={e => upd('difficulty', e.target.value)}
        >
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>

      {/* Language selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Default Language
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => upd('defaultLang', l.id)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: `1.5px solid ${v.defaultLang === l.id ? 'var(--accent)' : 'var(--border)'}`,
                background: v.defaultLang === l.id ? 'rgba(37,99,235,0.09)' : 'white',
                color: v.defaultLang === l.id ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: v.defaultLang === l.id ? 700 : 500,
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-main)',
              }}
            >{l.label}</button>
          ))}
        </div>
      </div>

      {/* Test cases */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Test Cases ({v.testCases.length})
          </label>
          <button
            type="button"
            onClick={addTC}
            style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Add Test Case
          </button>
        </div>

        {v.testCases.length === 0 ? (
          <div style={{ background: '#f8faff', border: '1px dashed var(--border)', borderRadius: 10, padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No test cases yet. Add test cases to enable auto-grading for Python &amp; JavaScript.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {v.testCases.map((tc, i) => (
              <div key={i} style={{ border: `1.5px solid ${activeTC === i ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}>
                {/* Collapsed header */}
                <div
                  onClick={() => setActiveTC(activeTC === i ? null : i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: activeTC === i ? 'rgba(37,99,235,0.05)' : 'white', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>TC {i + 1}</span>
                    {tc.input && (
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        in: {tc.input}
                      </span>
                    )}
                    {tc.output && (
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--success)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        → {tc.output}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {tc.hidden && <span style={{ fontSize: 10, background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>Hidden</span>}
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{activeTC === i ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded editor */}
                {activeTC === i && (
                  <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: '#fafcff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Input</label>
                        <input
                          value={tc.input}
                          onChange={e => updTC(i, 'input', e.target.value)}
                          placeholder='e.g. "hello" or 5 or [1,2,3] or (3,5)'
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          String → <code>"hello"</code> · Number → <code>42</code> · Two args → <code>(3,5)</code>
                        </p>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expected Output</label>
                        <input
                          value={tc.output}
                          onChange={e => updTC(i, 'output', e.target.value)}
                          placeholder='e.g. "olleh" or 15 or True'
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Exact string the function should print or return
                        </p>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Explanation (optional)</label>
                      <input
                        value={tc.explanation || ''}
                        onChange={e => updTC(i, 'explanation', e.target.value)}
                        placeholder='e.g. Reversed "hello" → "olleh"'
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={!!tc.hidden}
                          onChange={e => updTC(i, 'hidden', e.target.checked)}
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                          Hidden test case{' '}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(not shown to student, but still graded)</span>
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeTC(i)}
                        style={{ fontSize: 12, color: 'var(--danger)', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Constraints */}
      <Textarea
        label="Constraints (optional)"
        value={v.constraints}
        onChange={e => upd('constraints', e.target.value)}
        rows={2}
        placeholder="e.g. 1 ≤ n ≤ 10^5, string length ≤ 1000"
      />

      {/* Info box */}
      <div style={{ background: '#eff6ff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 9, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>💡 Auto-Grading Info</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          <strong>Python &amp; JavaScript:</strong> Test cases run live in the browser. The engine auto-discovers your function and calls it with the parsed input.<br />
          <strong>Java, C++, C:</strong> Code is saved for manual instructor grading.<br />
          <strong>Input format:</strong> Use Python/JS literal syntax — strings in quotes <code>"hello"</code>, numbers without quotes <code>42</code>, lists as <code>[1,2,3]</code>, multiple args as tuple <code>(3,5)</code>.<br />
          <strong>Expected output:</strong> Write exactly what the function returns or prints — e.g. if it returns <code>42</code>, write <code>42</code>. If it returns <code>"hello"</code>, write <code>hello</code> (no quotes).
        </div>
      </div>
    </div>
  );
}