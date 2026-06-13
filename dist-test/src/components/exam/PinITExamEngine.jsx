'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PinITExamEngine;
// apps/web/src/components/exam/PinITExamEngine.tsx
// Native exam engine — replaces the _legacy/dsai/ExamEngine.jsx dependency.
// Supports: MCQ, essay, coding (Python via Pyodide, JavaScript via Function()).
// Tab-lock: Visibility API detects tab switches and records them.
// On finish: POSTs to /api/exam/sync-result to persist to PostgreSQL.
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
async function loadPyodideOnce() {
    if (window.pyodide)
        return window.pyodide;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
    document.head.appendChild(script);
    await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
    window.pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' });
    return window.pyodide;
}
function parseInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return [];
    // Tuple syntax → multiple args: (3,5) → [3, 5]
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        try {
            return JSON.parse('[' + trimmed.slice(1, -1) + ']');
        }
        catch { }
    }
    try {
        return [JSON.parse(trimmed)];
    }
    catch { }
    return [trimmed];
}
async function runPython(code, fnName, input) {
    const py = await loadPyodideOnce();
    const args = parseInput(input);
    const argStr = args.map(a => JSON.stringify(a)).join(', ');
    const runCode = `${code}\nimport json\n_result = ${fnName}(${argStr})\nprint(json.dumps(_result) if not isinstance(_result, str) else _result)`;
    await py.runPythonAsync('import sys, io\nsys.stdout = io.StringIO()');
    await py.runPythonAsync(runCode);
    const out = await py.runPythonAsync('sys.stdout.getvalue()');
    return String(out).trim();
}
function runJavaScript(code, fnName, input) {
    const args = parseInput(input);
    const fn = new Function(`${code}\nreturn ${fnName};`)();
    const result = fn(...args);
    return result === undefined ? '' : typeof result === 'string' ? result : JSON.stringify(result);
}
// ── Tab-lock hook ─────────────────────────────────────────────────────────────
function useTabLock(maxSwitches, onExceeded) {
    const [switches, setSwitches] = (0, react_1.useState)(0);
    const switchRef = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        function onVisibility() {
            if (document.hidden) {
                switchRef.current += 1;
                setSwitches(switchRef.current);
                if (switchRef.current >= maxSwitches)
                    onExceeded();
            }
        }
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [maxSwitches, onExceeded]);
    return switchRef.current;
}
// ── Countdown timer hook ──────────────────────────────────────────────────────
function useCountdown(totalSeconds, onExpire) {
    const [remaining, setRemaining] = (0, react_1.useState)(totalSeconds);
    const expired = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            setRemaining(s => {
                if (s <= 1 && !expired.current) {
                    expired.current = true;
                    clearInterval(interval);
                    onExpire();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [onExpire]);
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    return { remaining, display: `${mm}:${ss}`, urgent: remaining < 120 };
}
// ── Main component ────────────────────────────────────────────────────────────
function PinITExamEngine({ exam, studentId, onFinish }) {
    const [currentQ, setCurrentQ] = (0, react_1.useState)(0);
    const [answers, setAnswers] = (0, react_1.useState)({});
    const [code, setCode] = (0, react_1.useState)({});
    const [lang, setLang] = (0, react_1.useState)({});
    const [running, setRunning] = (0, react_1.useState)(false);
    const [results, setResults] = (0, react_1.useState)({});
    const [submitted, setSubmitted] = (0, react_1.useState)(false);
    const [tabWarning, setTabWarning] = (0, react_1.useState)(false);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const maxSwitches = exam.allowedSwitches ?? 3;
    const tabSwitches = useTabLock(maxSwitches, (0, react_1.useCallback)(() => {
        setTabWarning(true);
        setTimeout(() => handleSubmit(), 5000);
    }, [])); // eslint-disable-line
    const { display: timeDisplay, urgent } = useCountdown(exam.durationMinutes * 60, (0, react_1.useCallback)(() => handleSubmit(), []) // eslint-disable-line
    );
    const q = exam.questions[currentQ];
    // ── Auto-scoring ────────────────────────────────────────────────────────
    function scoreExam() {
        let score = 0;
        exam.questions.forEach(q => {
            if (q.type === 'mcq') {
                if (answers[q.id] === q.correctIndex)
                    score += q.marks;
            }
            else if (q.type === 'coding') {
                // Count test case passes from live results
                const r = results[q.id];
                if (r)
                    score += Math.round(q.marks * (r.passed / Math.max(r.total, 1)));
            }
            // Essays: scored manually by instructor; 0 here
        });
        return score;
    }
    // ── Submit ──────────────────────────────────────────────────────────────
    async function handleSubmit() {
        if (submitting || submitted)
            return;
        setSubmitting(true);
        const score = scoreExam();
        const tabCount = tabSwitches;
        try {
            await client_1.api.post('/api/exam/sync-result', {
                examId: exam.id,
                score,
                totalMarks: exam.totalMarks,
                answers,
                tabSwitches: tabCount,
                timeTaken: exam.durationMinutes * 60,
            });
        }
        catch (e) {
            console.warn('[ExamEngine] sync failed:', e);
        }
        setSubmitted(true);
        setSubmitting(false);
        onFinish({ score, totalMarks: exam.totalMarks, percentage: Math.round((score / exam.totalMarks) * 100), tabSwitches: tabCount });
    }
    // ── Run code ─────────────────────────────────────────────────────────────
    async function runCode(question) {
        const userCode = code[question.id] || '';
        const fnName = question.functionName || 'solution';
        const language = lang[question.id] || question.defaultLang || 'python';
        const tcs = (question.testCases || []).filter(tc => !tc.hidden);
        if (!tcs.length) {
            setResults(r => ({ ...r, [question.id]: { passed: 0, total: 0, output: 'No test cases' } }));
            return;
        }
        setRunning(true);
        let passed = 0;
        let lastOutput = '';
        let lastError = '';
        for (const tc of tcs) {
            try {
                let out;
                if (language === 'python')
                    out = await runPython(userCode, fnName, tc.input);
                else if (language === 'javascript')
                    out = runJavaScript(userCode, fnName, tc.input);
                else {
                    lastError = `${language} runs server-side. Submit for instructor grading.`;
                    break;
                }
                lastOutput = out;
                if (out.trim() === tc.output.trim())
                    passed++;
            }
            catch (e) {
                lastError = e instanceof Error ? e.message : String(e);
                break;
            }
        }
        setResults(r => ({ ...r, [question.id]: { passed, total: tcs.length, output: lastOutput, error: lastError } }));
        setRunning(false);
    }
    if (submitted) {
        const score = scoreExam();
        const pct = Math.round((score / exam.totalMarks) * 100);
        return (<div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center', padding: 32, background: 'var(--bg2)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{pct >= 70 ? '🏆' : pct >= 50 ? '📊' : '📝'}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Exam Submitted</h2>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--coral)', marginBottom: 8 }}>
          {pct}%
        </div>
        <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 6 }}>{score} / {exam.totalMarks} marks</div>
        <div style={{ fontSize: 13, color: 'var(--t3)' }}>Tab switches: {tabSwitches}</div>
        {tabSwitches > maxSwitches && (<div style={{ marginTop: 12, padding: '8px 14px', background: 'var(--amber-light)', borderRadius: 8, fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>
            ⚠ Tab switches flagged for instructor review
          </div>)}
      </div>);
    }
    return (<div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '80vh', background: 'var(--bg)', gap: 0 }}>
      {/* ── Question navigator ── */}
      <div style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Timer */}
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: urgent ? 'var(--coral-light)' : 'var(--bg3)', border: `1px solid ${urgent ? 'var(--coral)' : 'var(--border)'}`, textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>TIME LEFT</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: urgent ? 'var(--coral)' : 'var(--t1)' }}>{timeDisplay}</div>
        </div>

        {/* Tab-switch counter */}
        <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--bg3)', fontSize: 11, color: tabSwitches > 0 ? 'var(--amber)' : 'var(--t3)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginBottom: 4 }}>
          ⚠ Tab switches: {tabSwitches}/{maxSwitches}
        </div>

        {/* Q list */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '8px 0 4px' }}>Questions</div>
        {exam.questions.map((ques, i) => {
            const answered = answers[ques.id] !== undefined || code[ques.id];
            return (<button key={ques.id} onClick={() => setCurrentQ(i)} style={{
                    padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: i === currentQ ? 'var(--accent-light)' : answered ? 'rgba(5,150,105,0.08)' : 'var(--bg3)',
                    color: i === currentQ ? 'var(--accent)' : 'var(--t2)',
                    fontSize: 12, fontWeight: i === currentQ ? 700 : 500,
                    borderLeft: `3px solid ${i === currentQ ? 'var(--accent)' : answered ? 'var(--green)' : 'transparent'}`,
                }}>
              Q{i + 1} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)' }}>{ques.marks}m</span>
              <span style={{ float: 'right', fontSize: 10 }}>{ques.type === 'mcq' ? 'MCQ' : ques.type === 'coding' ? 'Code' : 'Essay'}</span>
            </button>);
        })}

        <button onClick={handleSubmit} disabled={submitting} style={{
            marginTop: 'auto', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)',
        }}>
          {submitting ? '⟳ Submitting…' : '✓ Submit Exam'}
        </button>
      </div>

      {/* ── Question area ── */}
      <div style={{ padding: 28, overflowY: 'auto' }}>
        {tabWarning && (<div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--coral-light)', border: '1px solid var(--coral)', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, color: 'var(--coral)' }}>
            ⚠ Maximum tab switches exceeded! Auto-submitting in 5 seconds…
          </div>)}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t3)', letterSpacing: '0.8px' }}>
              Q{currentQ + 1} of {exam.questions.length} · {q.marks} marks · {q.type.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {currentQ > 0 && <button onClick={() => setCurrentQ(i => i - 1)} className="btn-ghost btn-sm">← Prev</button>}
            {currentQ < exam.questions.length - 1 && <button onClick={() => setCurrentQ(i => i + 1)} className="btn-ghost btn-sm">Next →</button>}
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.6, marginBottom: 20 }}>{q.text}</div>

        {/* ── MCQ ── */}
        {q.type === 'mcq' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(q.options || []).map((opt, i) => (<label key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${answers[q.id] === i ? 'var(--accent)' : 'var(--border)'}`,
                    background: answers[q.id] === i ? 'var(--accent-light)' : 'var(--bg2)',
                    cursor: 'pointer', fontSize: 14, color: 'var(--t1)',
                }}>
                <input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => setAnswers(a => ({ ...a, [q.id]: i }))} style={{ marginTop: 2, flexShrink: 0 }}/>
                {opt}
              </label>))}
          </div>)}

        {/* ── Essay ── */}
        {q.type === 'essay' && (<textarea value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} rows={8} placeholder="Write your answer here..." style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--t1)', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.65, resize: 'vertical' }}/>)}

        {/* ── Coding ── */}
        {q.type === 'coding' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Language selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['python', 'javascript', 'java', 'cpp', 'c'].map(l => (<button key={l} type="button" onClick={() => setLang(prev => ({ ...prev, [q.id]: l }))} style={{
                    padding: '4px 12px', borderRadius: 6, border: '1.5px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    borderColor: (lang[q.id] || q.defaultLang || 'python') === l ? 'var(--accent)' : 'var(--border)',
                    background: (lang[q.id] || q.defaultLang || 'python') === l ? 'var(--accent-light)' : 'var(--bg3)',
                    color: (lang[q.id] || q.defaultLang || 'python') === l ? 'var(--accent)' : 'var(--t3)',
                }}>{l}</button>))}
            </div>

            {/* Code editor */}
            <textarea value={code[q.id] || `def ${q.functionName || 'solution'}(n):\n    # Write your solution\n    pass\n`} onChange={e => setCode(prev => ({ ...prev, [q.id]: e.target.value }))} rows={14} spellCheck={false} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#0d1117', color: '#e6edf3', fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: 1.6, resize: 'vertical', tabSize: 4 }} onKeyDown={e => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const s = e.currentTarget;
                    const st = s.selectionStart;
                    const en = s.selectionEnd;
                    const val = s.value;
                    s.value = val.substring(0, st) + '    ' + val.substring(en);
                    s.selectionStart = s.selectionEnd = st + 4;
                    setCode(prev => ({ ...prev, [q.id]: s.value }));
                }
            }}/>

            {/* Constraints */}
            {q.constraints && (<div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--font-mono)', padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
                Constraints: {q.constraints}
              </div>)}

            {/* Run button + results */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => runCode(q)} disabled={running} className="btn-primary" style={{ fontSize: 13 }}>
                {running ? '⟳ Running…' : '▶ Run Tests'}
              </button>
              {results[q.id] && (<span style={{ fontSize: 13, fontWeight: 700, color: results[q.id].passed === results[q.id].total ? 'var(--green)' : 'var(--amber)' }}>
                  {results[q.id].passed}/{results[q.id].total} test cases passed
                </span>)}
            </div>
            {results[q.id]?.error && (<div style={{ padding: '8px 12px', background: 'var(--coral-light)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--coral)' }}>
                {results[q.id].error}
              </div>)}
            {results[q.id]?.output && !results[q.id]?.error && (<div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>
                Last output: {results[q.id].output}
              </div>)}

            {/* Visible test cases */}
            {(q.testCases || []).filter(tc => !tc.hidden).length > 0 && (<div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Sample Test Cases</div>
                {(q.testCases || []).filter(tc => !tc.hidden).map((tc, i) => (<div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    <div><span style={{ color: 'var(--t3)' }}>Input: </span><span style={{ color: 'var(--teal)' }}>{tc.input}</span></div>
                    <div><span style={{ color: 'var(--t3)' }}>Expected: </span><span style={{ color: 'var(--green)' }}>{tc.output}</span></div>
                    {tc.explanation && <div style={{ gridColumn: '1/-1', color: 'var(--t3)', fontSize: 11 }}>{tc.explanation}</div>}
                  </div>))}
              </div>)}
          </div>)}
      </div>
    </div>);
}
