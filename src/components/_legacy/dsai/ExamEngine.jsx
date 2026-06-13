import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { DB } from '../firebase.js';
import { Btn, Modal, Spinner, Badge } from '../components/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useIsMobile } from '../utils/hooks.js';

/* ══════════════════════════════════════════════
   LANGUAGE CONFIG
══════════════════════════════════════════════ */
const LANGS = [
  { id: 'python',     label: '🐍 Python',     short: 'Python', badge: '#3b82f6' },
  { id: 'javascript', label: '⚡ JavaScript', short: 'JS',     badge: '#f59e0b' },
  { id: 'java',       label: '☕ Java',        short: 'Java',   badge: '#ef4444' },
  { id: 'cpp',        label: '⚙️ C++',         short: 'C++',    badge: '#8b5cf6' },
  { id: 'c',          label: '🔷 C',           short: 'C',      badge: '#06b6d4' },
];
const CLIENT_LANGS = new Set(['python', 'javascript']);

/* ── Starter templates ── */
function getStarter(lang, fnName) {
  const fn = fnName || 'solution';
  const starters = {
    python:
`def ${fn}(n):
    # Write your solution here
    pass
`,
    javascript:
`function ${fn}(n) {
    // Write your solution here
    return null;
}
`,
    java:
`import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Test your solution
    }

    public static Object ${fn}(Object n) {
        // Write your code here
        return null;
    }
}
`,
    cpp:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello, World!" << endl;
    return 0;
}
`,
    c:
`#include <stdio.h>
#include <string.h>

int main() {
    /* Write your code here */
    printf("Hello, World!\\n");
    return 0;
}
`,
  };
  return starters[lang] || '# Write your solution here\n';
}

/* ══════════════════════════════════════════════
   PYODIDE — load once, reuse forever
══════════════════════════════════════════════ */
const PY_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';
let _pyInstance = null;
let _pyLoading  = null;

// Renamed from loadPyodide → getPyodide to avoid shadowing window.loadPyodide
function getPyodide() {
  if (_pyInstance) return Promise.resolve(_pyInstance);
  if (_pyLoading)  return _pyLoading;
  _pyLoading = new Promise((res, rej) => {
    // Helper to call the real window.loadPyodide (never the local getPyodide)
    function initPy() {
      window.loadPyodide({ indexURL: PY_CDN })
        .then(py => { _pyInstance = py; _pyLoading = null; res(py); })
        .catch(err => { _pyLoading = null; rej(err); });
    }

    if (window.__pyodideScriptLoaded || typeof window.loadPyodide === 'function') {
      initPy();
      return;
    }

    // Guard: don't add a second script tag if one already exists (e.g. hot-reload in dev)
    const existing = document.getElementById('__pyodide__');
    if (existing) {
      // Script tag exists but hasn't fired load yet — wait for it.
      // If it already fired (window.loadPyodide is available), initPy immediately.
      if (typeof window.loadPyodide === 'function') {
        initPy();
      } else {
        existing.addEventListener('load', initPy, { once: true });
        existing.addEventListener('error', () => {
          _pyLoading = null;
          rej(new Error('Pyodide failed to load — check internet.'));
        }, { once: true });
      }
      return;
    }

    const s = document.createElement('script');
    s.id     = '__pyodide__';
    s.src    = PY_CDN + 'pyodide.js';
    s.onload = () => {
      window.__pyodideScriptLoaded = true;
      initPy();
    };
    s.onerror = () => { _pyLoading = null; rej(new Error('Pyodide failed to load — check internet.')); };
    document.head.appendChild(s);
  });
  return _pyLoading;
}

/* ══════════════════════════════════════════════
   OUTPUT NORMALISER
══════════════════════════════════════════════ */
function norm(s) {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .trim();
}

/* ══════════════════════════════════════════════
   PYTHON RUNNER
   Strategy:
   1. Execute student code in isolated namespace
   2. Auto-find the FIRST user-defined function using types.FunctionType
   3. Parse test-case input with ast.literal_eval → call fn(*args)
   4. Capture both return value AND print() output
   5. Compare normalised output against expected
══════════════════════════════════════════════ */
async function runPython(code, testCase) {
  const py  = await getPyodide();
  const inp = String(testCase.input  ?? '').trim();
  const exp = norm(testCase.output ?? '');

  // Use a simple top-level string variable _pyout — avoids PyProxy/toJs() issues entirely.
  // Student code runs inside a fresh namespace dict (_ns) so no variable leakage between runs.
  const harness = `
import sys, io, ast, types, traceback

_buf = io.StringIO()
_real_stdout = sys.stdout
_real_stderr = sys.stderr
sys.stdout = _buf
sys.stderr = _buf

_ns  = {}
_fn  = None
_pyout = ""

try:
    # ── Execute student code in isolated namespace ──
    exec(compile(${JSON.stringify(code)}, "<student>", "exec"), _ns)

    # ── Discover the first user-defined function ──
    for _k, _v in _ns.items():
        if isinstance(_v, types.FunctionType) and not _k.startswith("_"):
            _fn = _v
            break

    if _fn is None:
        raise RuntimeError("No function found. Define at least one function, e.g. def solution(...):")

    # ── Parse input arguments ──
    _raw = ${JSON.stringify(inp)}
    if _raw.strip():
        try:
            _parsed = ast.literal_eval(_raw)
            # Tuple → unpack as multiple args; anything else → single arg
            _args = list(_parsed) if isinstance(_parsed, tuple) else [_parsed]
        except Exception:
            # Fallback: split by comma and parse each piece
            try:
                _parts = [p.strip() for p in _raw.split(",") if p.strip()]
                _args  = [ast.literal_eval(p) for p in _parts]
            except Exception:
                _args = [_raw]
    else:
        _args = []

    # ── Call the function ──
    _ret = _fn(*_args)

    # If nothing was printed but function returned a value, print it
    if _ret is not None and not _buf.getvalue().strip():
        # Use str() not repr() so lists print as "[1, 2, 3]" not "repr form"
        print(str(_ret))

except Exception:
    _buf.write(traceback.format_exc())

finally:
    sys.stdout = _real_stdout
    sys.stderr = _real_stderr

_pyout = _buf.getvalue()
`;

  try {
    await py.runPythonAsync(harness);
    // _pyout is a top-level Python string — globals.get() returns it directly as JS string
    const raw = String(py.globals.get('_pyout') ?? '').trim();

    // If it's a traceback, extract just the last error line
    if (raw.includes('Traceback (most recent call last)')) {
      const lastLine = raw.split('\n').filter(l => l.trim()).pop() ?? raw;
      return { output: '', error: lastLine, passed: false };
    }

    const got = norm(raw);
    return { output: got, error: '', passed: got === exp };
  } catch (e) {
    const msg = String(e).split('\n').pop();
    return { output: '', error: msg, passed: false };
  }
}

/* Run Python without test cases — just capture output */
async function runPythonFree(code) {
  const py = await getPyodide();
  // Use exec() in an isolated namespace — same pattern as runPython().
  // This avoids IndentationError when student code has top-level function
  // definitions or print() calls that would break if naively indented into
  // a try: block.
  const harness = `
import sys, io, traceback

_buf  = io.StringIO()
_real = sys.stdout
_real_err = sys.stderr
sys.stdout = _buf
sys.stderr = _buf

try:
    exec(compile(${JSON.stringify(code)}, "<student>", "exec"), {})
except Exception:
    _buf.write(traceback.format_exc())
finally:
    sys.stdout = _real
    sys.stderr = _real_err

_pyout = _buf.getvalue()
`;
  try {
    await py.runPythonAsync(harness);
    return norm(String(py.globals.get('_pyout') ?? '')) || '(no output)';
  } catch (e) {
    return '❌ ' + String(e).split('\n').pop();
  }
}

/* ══════════════════════════════════════════════
   JAVASCRIPT RUNNER
══════════════════════════════════════════════ */
function runJS(code, testCase) {
  const inp = String(testCase.input ?? '').trim();
  const exp = norm(testCase.output ?? '');

  const captured = [];
  const con = {
    log:   (...a) => captured.push(a.map(x => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')),
    error: (...a) => captured.push('[ERR] ' + a.join(' ')),
    warn:  (...a) => captured.push('[WARN] ' + a.join(' ')),
  };

  try {
    // Parse input args
    let args = [];
    if (inp.trim()) {
      try {
        // eslint-disable-next-line no-new-func
        const parsed = new Function(`return (${inp})`)();
        args = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        try { // eslint-disable-next-line no-new-func
          args = new Function(`return [${inp}]`)();
        } catch { args = [inp]; }
      }
    }

    // Extract all function names from student code via regex
    // Handles: function foo(...), const foo = (...) =>, const foo = function(...)
    const fnNames = [];
    const declRe  = /^(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\())/gm;
    let m;
    while ((m = declRe.exec(code)) !== null) {
      const name = m[1] || m[2];
      if (name && !name.startsWith('_')) fnNames.push(name);
    }

    // Build runner: student code runs in a plain (non-strict) function scope
    // so declared functions are local variables accessible by name
    const fnCallCode = fnNames.length > 0
      ? `
var __fn = ${fnNames[0]};
var __ret = __fn.apply(null, __args__);
if (__ret !== undefined && __ret !== null) {
  console.log(typeof __ret === 'object' ? JSON.stringify(__ret) : String(__ret));
}
`
      : `
// No function found — try running code directly and capturing output
console.log("⚠️ No function found. Define a function e.g: function solution(n) { ... }");
`;

    // C3 fix: wrap in "use strict" to prevent sandbox escape (e.g. delete console.log)
    const runner = `"use strict";\n${code}\n\n${fnCallCode}`;
    // eslint-disable-next-line no-new-func
    new Function('console', '__args__', runner)(con, args);
  } catch (e) {
    return { output: '', error: e.constructor.name + ': ' + e.message, passed: false };
  }

  const got = norm(captured.join('\n'));
  return { output: got, error: '', passed: got === exp };
}

function runJSFree(code) {
  const captured = [];
  const con = {
    log:   (...a) => captured.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')),
    error: (...a) => captured.push('[ERR] ' + a.join(' ')),
    warn:  (...a) => captured.push('[WARN] ' + a.join(' ')),
  };
  try { // eslint-disable-next-line no-new-func
    new Function('console', `"use strict";\n${code}`)(con);
  } catch (e) {
    captured.push('❌ ' + e.constructor.name + ': ' + e.message);
  }
  return captured.join('\n').trim() || '(no output)';
}

/* ══════════════════════════════════════════════
   RUN ALL TEST CASES
══════════════════════════════════════════════ */
async function runAllTests(lang, code, testCases) {
  const results = [];
  let passed = 0, gradable = 0;

  for (const tc of testCases) {
    if (!CLIENT_LANGS.has(lang)) {
      results.push({
        input: tc.input, expected: norm(tc.output ?? ''),
        output: '(server-side)', error: '', passed: null, hidden: tc.hidden,
      });
      continue;
    }
    gradable++;
    try {
      const r = lang === 'python' ? await runPython(code, tc) : runJS(code, tc);
      if (r.passed) passed++;
      results.push({
        input: tc.input, expected: norm(tc.output ?? ''),
        output: r.output, error: r.error, passed: r.passed, hidden: tc.hidden,
      });
    } catch (e) {
      results.push({
        input: tc.input, expected: norm(tc.output ?? ''),
        output: '', error: e.message, passed: false, hidden: tc.hidden,
      });
    }
  }

  const accuracy = gradable > 0
    ? ((passed / gradable) * 100).toFixed(0)
    : (CLIENT_LANGS.has(lang) ? '0' : null);

  return { results, passed, total: testCases.length, gradable, accuracy };
}

/* ══════════════════════════════════════════════
   EXAM START MODAL
══════════════════════════════════════════════ */
export function ExamStartModal({ exam, student, onConfirm, onCancel }) {
  return (
    <Modal open title="📋 Exam Details" onClose={onCancel}>
      <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <h4 style={{ marginBottom: 14, color: 'var(--accent)', fontWeight: 800, fontSize: 15 }}>📝 {exam.title}</h4>
        {[['Duration', `${exam.duration} minutes`], ['Questions', exam.questionCount || 'All'], ['Batch', exam.batch]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.9 }}>
          ⚠️ <strong>Tab-Lock Active</strong> — switches are recorded.<br />
          ⚠️ You can attempt this exam <strong>once only</strong>.<br />
          ⚠️ Auto-submits when time expires.<br />
          ⚠️ Python &amp; JS run live in-browser. Java/C++/C = instructor graded.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Btn variant="ghost"   onClick={onCancel}  style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
        <Btn variant="success" onClick={onConfirm} style={{ flex: 1, justifyContent: 'center' }}>🚀 Start Exam</Btn>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════
   EXAM ENGINE (main component)
══════════════════════════════════════════════ */
export function ExamEngine({ exam, student, onFinish }) {
  const [questions,      setQuestions]      = useState(null);
  const [answers,        setAnswers]        = useState({});
  const [current,        setCurrent]        = useState(0);
  const [timeLeft,       setTimeLeft]       = useState(0);
  const [tabViolations,  setTabViolations]  = useState(0);
  const [showViolation,  setShowViolation]  = useState(false);
  const [phase,          setPhase]          = useState('loading');   // loading|exam|review|submitting|done
  const [codeResults,    setCodeResults]    = useState({});
  const [codeLang,       setCodeLang]       = useState({});
  const [showMobileNav,  setShowMobileNav]  = useState(false);

  // Stable mutable refs (avoid stale closures in timer / submit)
  const timerRef      = useRef(null);
  const timerStarted  = useRef(false);
  const tabRef        = useRef(0);
  const answersRef    = useRef({});
  const timeRef       = useRef(0);
  const questionsRef  = useRef(null);
  const sheetIdRef    = useRef(null);
  const phaseRef      = useRef('loading');
  const autoSubmitted = useRef(false);
  const submitRef     = useRef(null);
  const langRef       = useRef({});
  const accRef        = useRef({});
  const inEditorRef   = useRef(false);
  const debounceRef   = useRef(null);
  // Guard against race condition: timer fires + manual submit at the same instant
  const isSubmittingRef = useRef(false);
  const toast    = useToast();
  const isMobile = useIsMobile();

  // Stable refs for callbacks used inside useEffect([], []) — prevents stale closures
  // when the component re-mounts (e.g. hot-reload in dev).
  // IMPORTANT: toastRef must be initialized with `toast` (not null) because the
  // load-questions useEffect runs on mount before any post-paint useEffect can set it.
  // If initialized to null, toastRef.current() crashes on early DB errors.
  const onFinishRef = useRef(onFinish);
  const toastRef    = useRef(toast);

  // Keep refs in sync with latest prop/hook values on every render
  useEffect(() => { onFinishRef.current = onFinish; });
  useEffect(() => { toastRef.current    = toast;    });

  /* ── Load questions ── */
  useEffect(() => {
    (async () => {
      try {
        let qs = [];

        // 1. Try linked paper
        if (exam.paperId) {
          const paper = await DB.getOne(`papers/${exam.paperId}`);
          if (paper?.questions?.length) qs = paper.questions;
        }

        // 2. Fallback to global question bank
        if (!qs.length) {
          const all = await DB.getAll('questions');
          const bq  = all.filter(q =>
            !q.assignedBatch || q.assignedBatch === 'All Batches' || q.assignedBatch === student.batch
          );
          qs = exam.selectedQuestionIds?.length
            ? bq.filter(q => exam.selectedQuestionIds.includes(q.id))
            : bq;
        }

        // 3. Slice / shuffle
        if (exam.questionCount && +exam.questionCount < qs.length) qs = qs.slice(0, +exam.questionCount);
        if (exam.randomize) qs = [...qs].sort(() => Math.random() - 0.5);
        qs = qs.map((q, i) => ({ ...q, _idx: i, type: q.type || 'mcq' }));

        // Use refs so these callbacks are never stale even if component re-mounts
        if (!qs.length) { toastRef.current('No questions found for this exam', 'error'); onFinishRef.current(); return; }

        // 4. Default language per coding question
        const defLangs = {};
        qs.forEach((q, i) => { if (q.type === 'coding') defLangs[i] = q.defaultLang || 'python'; });
        langRef.current = defLangs;
        setCodeLang(defLangs);

        // 5. Pre-populate starter code for coding questions
        const initAnswers = {};
        qs.forEach((q, i) => {
          if (q.type === 'coding') initAnswers[i] = getStarter(defLangs[i], q.functionName);
        });
        answersRef.current = initAnswers;
        setAnswers(initAnswers);

        // 6. Create answer sheet in DB
        const sid = await DB.save('answer_sheets', {
          studentId: student.registerNumber,
          studentName: student.name,
          batch: student.batch,
          examScheduleId: exam.id,
          examTitle: exam.title,
          startedAt: new Date().toISOString(),
          status: 'In Progress',
          answers: {},
          totalQuestions: qs.length,
        });
        sheetIdRef.current   = sid;
        questionsRef.current = qs;
        timeRef.current      = (exam.duration || 30) * 60;
        phaseRef.current     = 'exam';

        setQuestions(qs);
        setTimeLeft(timeRef.current);
        setPhase('exam');

        // 7. Pre-load Pyodide if any Python coding questions
        if (qs.some(q => q.type === 'coding' && (!q.defaultLang || q.defaultLang === 'python'))) {
          getPyodide().catch(err => { console.error('[Pyodide] Failed to pre-load:', err); });
        }
      } catch (err) {
        toastRef.current('Failed to load exam: ' + err.message, 'error');
        onFinishRef.current();
      }
    })();
  }, []); // intentional: exam/student props are stable for the lifetime of ExamEngine

  /* ── Timer ── */
  useEffect(() => {
    if ((phase !== 'exam' && phase !== 'review') || timerStarted.current) return;
    timerStarted.current = true;
    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      const t = timeRef.current;
      setTimeLeft(t);
      if ([600, 300, 120, 60].includes(t)) {
        // Use ref so toast is never stale inside the interval callback
        toastRef.current(`⏰ ${t >= 60 ? Math.floor(t / 60) + 'm' : t + 's'} remaining!`, 'warning');
      }
      if (t <= 0) {
        clearInterval(timerRef.current);
        if (!autoSubmitted.current) { autoSubmitted.current = true; submitRef.current?.(true); }
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]); // intentional: timer only starts once per phase transition

  /* ── Anti-cheat ── */
  useEffect(() => {
    const block = e => e.preventDefault();
    const onVis = () => {
      if (document.hidden && phaseRef.current === 'exam') {
        tabRef.current++;
        setTabViolations(v => v + 1);
        setShowViolation(true);
      }
    };
    const onBlur = () => {
      // The browser fires window-blur BEFORE the code editor textarea's onFocus,
      // so inEditorRef.current is still false at the instant of blur even when
      // the student just clicked into the code editor.
      // We use a 200ms delay (doubled from 100ms for slow machines) and also
      // check document.activeElement: if focus moved to a textarea/input inside
      // the page, it's an internal focus change — not a real tab switch.
      setTimeout(() => {
        if (phaseRef.current !== 'exam') return;
        if (inEditorRef.current) return;
        // Additional guard: if focus stayed within the document (e.g. clicked
        // a textarea), document.hasFocus() is true — not a real tab switch.
        if (document.hasFocus()) return;
        tabRef.current++;
        setTabViolations(v => v + 1);
      }, 200);
    };
    const onKey  = e => {
      if (inEditorRef.current) return;
      if ((e.ctrlKey && 'cvxusp'.includes(e.key.toLowerCase())) || e.key === 'F12' || e.key === 'F11') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', block);
    ['copy', 'paste', 'cut'].forEach(ev => document.addEventListener(ev, block));
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', block);
      ['copy', 'paste', 'cut'].forEach(ev => document.removeEventListener(ev, block));
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  /* ── Debounced DB save (every 2s max) ── */
  const persist = useCallback((ans) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!sheetIdRef.current) return;
      const payload = {};
      (questionsRef.current || []).forEach((q, idx) => {
        const a = ans[idx];
        if (a != null && a !== '' && !(Array.isArray(a) && !a.length)) {
          payload[`q${idx + 1}`] = {
            questionId:   q.id || String(idx),
            question:     q.question || '',
            questionType: q.type || 'mcq',
            answer:       a,
            ...(q.type === 'coding'
              ? { lang: langRef.current[idx] || 'python', accuracy: accRef.current[idx] ?? null }
              : {}),
            answeredAt: new Date().toISOString(),
          };
        }
      });
      try {
        await DB.patch(`answer_sheets/${sheetIdRef.current}`, {
          answers: payload, lastUpdated: new Date().toISOString(),
        });
      } catch (_) {}
    }, 2000);
  }, []); // eslint-disable-line

  const setAns = useCallback((idx, val) => {
    setAnswers(prev => {
      const n = { ...prev, [idx]: val };
      answersRef.current = n;
      persist(n);
      return n;
    });
  }, [persist]);

  const setLangForQ = useCallback((idx, lang) => {
    setCodeLang(prev => { const n = { ...prev, [idx]: lang }; langRef.current = n; return n; });
    setCodeResults(prev => ({ ...prev, [idx]: null }));
    accRef.current = { ...accRef.current, [idx]: null };
    const q = questionsRef.current?.[idx];
    setAns(idx, getStarter(lang, q?.functionName));
  }, [setAns]);

  const setResult = useCallback((idx, res) => {
    setCodeResults(prev => ({ ...prev, [idx]: res }));
    if (res?.accuracy != null) accRef.current = { ...accRef.current, [idx]: res.accuracy };
  }, []);

  /* ── Submit ── */
  async function handleSubmit(auto = false) {
    // Atomic guard — set synchronously before any async work.
    // Prevents double-submit when the countdown timer fires at the exact
    // same moment as a manual click (phaseRef check alone isn't enough
    // because setPhase() is async and state may not have flushed yet).
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Also guard via phaseRef for re-renders that may call submitRef directly
    if (phaseRef.current === 'submitting' || phaseRef.current === 'done') {
      isSubmittingRef.current = false;
      return;
    }
    clearTimeout(debounceRef.current);  // W5 fix: cancel any pending 2s auto-save
    clearInterval(timerRef.current);
    phaseRef.current = 'submitting';
    setPhase('submitting');

    const ca = answersRef.current;
    const cq = questionsRef.current || [];
    let correct = 0, gradable = 0;

    cq.forEach((q, idx) => {
      const a = ca[idx];
      const t = q.type || 'mcq';

      if (t === 'mcq' || t === 'tf') {
        gradable++;
        if (String(a) === String(q.correct)) correct++;
      } else if (t === 'mcq-multiple') {
        gradable++;
        if (Array.isArray(a) && Array.isArray(q.correct)) {
          const E = new Set(q.correct.map(String));
          const G = new Set(a.map(String));
          if (E.size === G.size && [...E].every(v => G.has(v))) correct++;
        }
      } else if (t === 'fill') {
        gradable++;
        const correctAns = String(Array.isArray(q.options) && q.options[0] ? q.options[0] : q.correct || '');
        if (a && correctAns && String(a).toLowerCase().trim() === correctAns.toLowerCase().trim()) correct++;
      } else if (t === 'coding') {
        const acc = parseFloat(accRef.current[idx] ?? NaN);
        if (!isNaN(acc) && ca[idx]) {
          gradable++;
          correct += acc >= 100 ? 1 : acc >= 50 ? 0.5 : 0;
        }
      }
    });

    const total  = cq.length;
    const score  = `${Number.isInteger(correct) ? correct : correct.toFixed(1)}/${gradable || total}`;
    const pct    = gradable > 0 ? ((correct / gradable) * 100).toFixed(1) : '0.0';
    const pn     = parseFloat(pct);
    const grade  = pn >= 90 ? 'A+' : pn >= 80 ? 'A' : pn >= 70 ? 'B' : pn >= 60 ? 'C' : pn >= 50 ? 'D' : 'F';
    const maxSecs = (exam.duration || 30) * 60;
    const taken   = Math.max(0, Math.min(maxSecs, maxSecs - timeRef.current));
    const ansCount = Object.values(ca).filter(v => v != null && v !== '' && !(Array.isArray(v) && !v.length)).length;

    const fin = {};
    cq.forEach((q, idx) => {
      const a = ca[idx];
      if (a != null && a !== '' && !(Array.isArray(a) && !a.length)) {
        fin[`q${idx + 1}`] = {
          questionId: q.id || String(idx), question: q.question || '',
          questionType: q.type || 'mcq', answer: a,
          ...(q.type === 'coding' ? { lang: langRef.current[idx] || 'python', accuracy: accRef.current[idx] || '0' } : {}),
          answeredAt: new Date().toISOString(),
        };
      }
    });

    const resultData = {
      registerNumber: student.registerNumber,
      name: student.name, batch: student.batch,
      examScheduleId: exam.id, examTitle: exam.title,
      score, percentage: pct + '%', grade,
      timeTaken: `${Math.floor(taken / 60)}m ${taken % 60}s`,
      tabSwitches: tabRef.current,
      submittedAt: new Date().toISOString(),
      status: 'Completed',
      answeredQuestions: ansCount, totalQuestions: total,
      autoSubmitted: auto, answerSheetId: sheetIdRef.current,
    };

    try {
      await DB.save('exam_results', resultData);
      if (sheetIdRef.current) {
        await DB.update(`answer_sheets/${sheetIdRef.current}`, {
          ...resultData,
          studentId: student.registerNumber,
          studentName: student.name,
          status: 'Completed',
          answers: fin,
        });
      }
      phaseRef.current = 'done';
      setPhase('done');
    } catch (err) {
      // DB write failed — reset guards so student can retry manually
      isSubmittingRef.current = false;
      phaseRef.current = 'exam';
      setPhase('exam');
      toast('Submit failed: ' + err.message + '. Please try again.', 'error');
    }
  }
  // Keep submitRef always pointing to the latest handleSubmit without re-assigning on every render
  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  /* ── Derived ── */
  const mins  = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs  = String(timeLeft % 60).padStart(2, '0');
  const timerColor = timeLeft < 120 ? 'var(--danger)' : timeLeft < 300 ? 'var(--warning)' : 'var(--success-light)';
  const answeredCount = useMemo(
    () => Object.values(answers).filter(v => v != null && v !== '' && !(Array.isArray(v) && !v.length)).length,
    [answers],
  );

  /* ── Phase screens ── */
  if (phase === 'loading' || !questions) {
    return (
      <CenterScreen>
        <Spinner size={40} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 12 }}>Preparing your exam…</p>
      </CenterScreen>
    );
  }

  if (phase === 'submitting') {
    return (
      <CenterScreen>
        <Spinner size={40} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 12 }}>Submitting your answers…</p>
      </CenterScreen>
    );
  }

  if (phase === 'done') {
    return (
      <CenterScreen>
        <div style={{
          background: 'white', borderRadius: 20, padding: isMobile ? 28 : 52,
          maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(37,99,235,0.1)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 68, marginBottom: 18 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.85, fontSize: 14 }}>
            Your exam has been submitted.<br />Results will be published by your instructor.
          </p>
          {tabViolations > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--warning)' }}>
                ⚠️ {tabViolations} tab-switch violation{tabViolations !== 1 ? 's' : ''} recorded
              </p>
            </div>
          )}
          <Btn variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={onFinish}>
            ← Back to Dashboard
          </Btn>
        </div>
      </CenterScreen>
    );
  }

  /* ── Review screen ── */
  if (phase === 'review') {
    const unans = questions.length - answeredCount;
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <TopBar exam={exam} mins={mins} secs={secs} timerColor={timerColor} isMobile={isMobile} tabViolations={tabViolations}>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>📋 Review & Submit</span>
        </TopBar>
        <div style={{ maxWidth: 560, margin: '32px auto', padding: '0 16px' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 20 : 32, boxShadow: '0 2px 12px rgba(37,99,235,0.07)' }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 22, textAlign: 'center' }}>📊 Exam Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Answered',   value: answeredCount,      color: '#059669', bg: '#f0fdf4', icon: '✅' },
                { label: 'Unanswered', value: unans,              color: unans > 0 ? '#dc2626' : '#059669', bg: unans > 0 ? '#fef2f2' : '#f0fdf4', icon: unans > 0 ? '⚠️' : '✅' },
                { label: 'Time Left',  value: `${mins}:${secs}`, color: timerColor, bg: '#f8faff', icon: '⏱️' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, padding: '14px 10px', borderRadius: 12, border: `1.5px solid ${s.color}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Question Status</p>
            <div className="exam-question-nav" style={{ marginBottom: 20 }}>
              {questions.map((_, i) => {
                const isA = answers[i] != null && answers[i] !== '' && !(Array.isArray(answers[i]) && !answers[i].length);
                return (
                  <button key={i} className={`q-nav-btn ${isA ? 'answered' : ''}`}
                    onClick={() => { setCurrent(i); setPhase('exam'); }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {unans > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#92400e' }}>
                ⚠️ {unans} unanswered question{unans !== 1 ? 's' : ''}.
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="ghost"   onClick={() => { setCurrent(questions.length - 1); setPhase('exam'); }} style={{ flex: 1, justifyContent: 'center' }}>← Go Back</Btn>
              <Btn variant="success" onClick={() => handleSubmit(false)} style={{ flex: 1, justifyContent: 'center' }}>✅ Submit Exam</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Exam screen ── */
  const q = questions[current];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>

      {/* Tab-switch violation overlay */}
      {showViolation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', border: '2px solid var(--danger)', borderRadius: 20, padding: 36, maxWidth: 420, textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)', marginBottom: 8 }}>Tab Switch Detected</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 13, marginBottom: 6 }}>This violation has been recorded.</p>
            <p style={{ color: 'var(--warning)', fontWeight: 700, marginBottom: 22 }}>Total: {tabViolations} violation{tabViolations !== 1 ? 's' : ''}</p>
            <Btn variant="danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowViolation(false)}>
              I Understand — Return to Exam
            </Btn>
          </div>
        </div>
      )}

      {/* Top bar */}
      <TopBar
        exam={exam} mins={mins} secs={secs} timerColor={timerColor}
        isMobile={isMobile} tabViolations={tabViolations}
        onMenuClick={isMobile ? () => setShowMobileNav(v => !v) : undefined}
      >
        {!isMobile && <Badge type="info">Q {current + 1}/{questions.length}</Badge>}
      </TopBar>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {q.type === 'coding' ? (
          <CodingView
            question={q} questions={questions} current={current} setCurrent={setCurrent}
            answers={answers} setAns={setAns}
            codeLang={codeLang} setLangForQ={setLangForQ}
            codeResults={codeResults} setResult={setResult}
            inEditorRef={inEditorRef} isMobile={isMobile}
            showMobileNav={showMobileNav} setShowMobileNav={setShowMobileNav}
            onReview={() => setPhase('review')}
          />
        ) : (
          <MCQView
            question={q} questions={questions} current={current} setCurrent={setCurrent}
            answers={answers} setAns={setAns}
            answeredCount={answeredCount} student={student}
            isMobile={isMobile} onReview={() => setPhase('review')}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHARED TOP BAR
══════════════════════════════════════════════ */
const TopBar = memo(({ exam, mins, secs, timerColor, isMobile, tabViolations, children, onMenuClick }) => (
  <div style={{
    background: 'white', borderBottom: '1px solid var(--border)',
    padding: isMobile ? '8px 12px' : '10px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0, boxShadow: '0 1px 8px rgba(37,99,235,0.07)', zIndex: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {onMenuClick && (
        <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '2px 6px', flexShrink: 0 }}>☰</button>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: isMobile ? 11 : 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          BGS Institute of Management
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 140 : 320 }}>
          {exam.title}
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>
      {children}
      {tabViolations > 0 && <Badge type="warning">⚠️ {tabViolations}</Badge>}
      <div style={{
        background: `${timerColor}12`, border: `1.5px solid ${timerColor}40`,
        borderRadius: 9, padding: isMobile ? '4px 8px' : '5px 13px', textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 18 : 22, fontWeight: 900, color: timerColor, letterSpacing: 2, lineHeight: 1 }}>
          {mins}:{secs}
        </div>
        {!isMobile && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>TIME LEFT</div>}
      </div>
    </div>
  </div>
));

/* ══════════════════════════════════════════════
   MCQ / STANDARD QUESTION VIEW
══════════════════════════════════════════════ */
const MCQView = memo(({ question: q, questions, current, setCurrent, answers, setAns, answeredCount, student, isMobile, onReview }) => {
  const [showNavDrawer, setShowNavDrawer] = useState(false);

  const typeLabel = {
    mcq: 'Multiple Choice', 'mcq-multiple': 'Multi-Select',
    tf: 'True / False', fill: 'Fill in Blank', essay: 'Essay',
  }[q.type] || q.type;

  // Called as a function (not {renderNavGrid()}) to avoid React treating it as a new
  // component type on every render, which would unmount/remount the drawer.
  const renderNavGrid = () => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>
        Questions · {answeredCount}/{questions.length}
      </div>
      <div className="exam-question-nav" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {questions.map((_, i) => {
          const isA = answers[i] != null && answers[i] !== '' && !(Array.isArray(answers[i]) && !answers[i].length);
          return (
            <button key={i}
              className={`q-nav-btn ${isA ? 'answered' : ''} ${i === current ? 'current' : ''}`}
              onClick={() => { setCurrent(i); setShowNavDrawer(false); }}>
              {i + 1}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
        {[
          { bg: 'rgba(16,185,129,0.25)', border: 'var(--success)', label: 'Answered' },
          { bg: 'var(--accent)',          border: 'var(--accent)', label: 'Current' },
          { bg: 'white',                  border: 'var(--border)', label: 'Unanswered' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `1.5px solid ${l.border}` }} />
            <span style={{ fontWeight: 500 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile nav drawer */}
      {isMobile && showNavDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setShowNavDrawer(false)}>
          <div style={{ width: 220, background: 'white', height: '100%', padding: '16px 14px', overflowY: 'auto', boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            {renderNavGrid()}
          </div>
        </div>
      )}

      {/* Desktop left panel */}
      {!isMobile && (
        <div style={{ width: 188, background: 'white', borderRight: '1px solid var(--border)', padding: '14px 12px', overflowY: 'auto', flexShrink: 0 }}>
          {renderNavGrid()}
        </div>
      )}

      {/* Main question area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px 80px' : '22px 30px' }}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => setShowNavDrawer(true)} style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>
              📋 {answeredCount}/{questions.length}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Q {current + 1}/{questions.length}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge type="info">{typeLabel}</Badge>
            <Badge type="gold">{q.type === 'essay' ? 'Instructor Graded' : '1 pt'}</Badge>
          </div>
          {!isMobile && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Q {current + 1}/{questions.length}</span>}
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? '16px 14px' : '22px 26px', marginBottom: 16, boxShadow: '0 1px 8px rgba(37,99,235,0.06)' }}>
          <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, lineHeight: 1.65, marginBottom: 20, color: 'var(--text-primary)' }}>
            {q.question}
          </p>

          {/* MCQ / TF */}
          {(q.type === 'mcq' || q.type === 'tf') && q.options?.map((opt, i) => (
            <OptionRow key={i} selected={String(answers[current]) === String(i)} radio onClick={() => setAns(current, i)}>
              {opt}
            </OptionRow>
          ))}

          {/* Multi-select */}
          {q.type === 'mcq-multiple' && (
            <>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>Select all that apply</p>
              {q.options?.map((opt, i) => {
                const sel = Array.isArray(answers[current]) && answers[current].includes(i);
                return (
                  <OptionRow key={i} selected={sel} checkbox
                    onClick={() => {
                      const c = Array.isArray(answers[current]) ? answers[current] : [];
                      setAns(current, sel ? c.filter(x => x !== i) : [...c, i]);
                    }}>
                    {opt}
                  </OptionRow>
                );
              })}
            </>
          )}

          {/* Fill */}
          {q.type === 'fill' && (
            <input
              value={answers[current] || ''}
              onChange={e => setAns(current, e.target.value)}
              placeholder="Type your answer here…"
              style={{ fontSize: 14, borderRadius: 9 }}
            />
          )}

          {/* Essay */}
          {q.type === 'essay' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>
                Write a detailed answer. Graded by your instructor.
              </div>
              <textarea
                value={answers[current] || ''}
                onChange={e => setAns(current, e.target.value)}
                placeholder="Write your answer here…"
                rows={7}
                style={{ fontSize: 13, lineHeight: 1.75, resize: 'vertical', borderRadius: 9 }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <Btn variant="ghost"   onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Previous</Btn>
          {current < questions.length - 1
            ? <Btn variant="primary"  onClick={() => setCurrent(c => c + 1)}>Next →</Btn>
            : <Btn variant="success"  onClick={onReview}>Review &amp; Submit →</Btn>}
        </div>
      </div>

      {/* Student info panel — desktop only */}
      {!isMobile && (
        <div style={{ width: 172, background: 'white', borderLeft: '1px solid var(--border)', padding: '16px 13px', flexShrink: 0, overflowY: 'auto' }}>
          <StudentPanel student={student} answeredCount={answeredCount} total={questions.length} />
        </div>
      )}
    </>
  );
});

const OptionRow = memo(({ children, selected, radio, checkbox, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 10, marginBottom: 8, cursor: 'pointer',
    background: selected ? 'rgba(37,99,235,0.07)' : '#fafcff', transition: 'all 0.15s',
  }}>
    {radio && (
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? 'var(--accent)' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected ? 'var(--accent)' : 'white' }}>
        {selected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'white' }} />}
      </div>
    )}
    {checkbox && (
      <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected ? 'var(--accent)' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected ? 'var(--accent)' : 'white' }}>
        {selected && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
      </div>
    )}
    <span style={{ fontWeight: selected ? 600 : 400, fontSize: 14, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>
      {children}
    </span>
  </div>
));

const StudentPanel = memo(({ student, answeredCount, total }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', overflow: 'hidden', border: '2px solid var(--border)' }}>
      {student.photo
        ? <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: 22 }}>👤</span>}
    </div>
    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{student.name}</div>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>{student.registerNumber}</div>
    <Badge type="info">{student.batch}</Badge>
    <div style={{ marginTop: 18, background: '#f8faff', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Progress</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)', marginBottom: 2 }}>{answeredCount}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>of {total} answered</div>
      <div style={{ marginTop: 8, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${total ? (answeredCount / total) * 100 : 0}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  </div>
));

/* ══════════════════════════════════════════════
   CODING VIEW — split problem + editor
══════════════════════════════════════════════ */
const CodingView = memo(({
  question: q, questions, current, setCurrent,
  answers, setAns, codeLang, setLangForQ,
  codeResults, setResult, inEditorRef,
  isMobile, showMobileNav, setShowMobileNav, onReview,
}) => {
  const lang   = codeLang[current] || 'python';
  const code   = answers[current] || getStarter(lang, q.functionName);
  const result = codeResults[current] || null;

  useEffect(() => {
    // Use codeLang[current] rather than the closed-over `lang` which may be stale
    // right after a question switch (codeLang state hasn't re-propagated yet).
    const currentLang = codeLang[current] || 'python';
    if (!answers[current]) setAns(current, getStarter(currentLang, q.functionName));
  }, [current]); // eslint-disable-line

  const ProblemPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Question nav strip */}
      <div style={{ background: '#f8faff', borderBottom: '1px solid var(--border)', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0, alignItems: 'center' }}>
        {questions.map((_, i) => {
          const isA = answers[i] != null && answers[i] !== '' && !(Array.isArray(answers[i]) && !answers[i].length);
          return (
            <button key={i}
              className={`q-nav-btn ${isA ? 'answered' : ''} ${i === current ? 'current' : ''}`}
              onClick={() => { setCurrent(i); setShowMobileNav(false); }}>
              {i + 1}
            </button>
          );
        })}
        {isMobile && (
          <button onClick={() => setShowMobileNav(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '2px 6px' }}>✕</button>
        )}
      </div>

      {/* Scrollable problem content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <Badge type="info">Coding</Badge>
          {q.difficulty && (
            <Badge type={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success'}>
              {q.difficulty}
            </Badge>
          )}
          {result?.accuracy != null && (
            <Badge type={parseFloat(result.accuracy) >= 50 ? 'success' : 'danger'}>
              {result.accuracy}% accuracy
            </Badge>
          )}
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.45, marginBottom: 12 }}>{q.question}</h3>

        {q.description && (
          <div style={{ background: '#eff6ff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 9, padding: '11px 13px', marginBottom: 14, fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {q.description}
          </div>
        )}

        {/* Show non-hidden test cases as examples */}
        {q.testCases?.filter(tc => !tc.hidden).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 8 }}>Examples</div>
            {q.testCases.filter(tc => !tc.hidden).map((tc, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: 8, padding: '10px 13px', marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 12, border: '1px solid #334155' }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Input:  </span>
                  <span style={{ color: '#7dd3fc' }}>{tc.input}</span>
                </div>
                <div style={{ marginBottom: tc.explanation ? 4 : 0 }}>
                  <span style={{ color: '#64748b' }}>Output: </span>
                  <span style={{ color: '#86efac' }}>{tc.output}</span>
                </div>
                {tc.explanation && <div style={{ color: '#64748b', marginTop: 4 }}>// {tc.explanation}</div>}
              </div>
            ))}
            {q.testCases.some(tc => tc.hidden) && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                + {q.testCases.filter(tc => tc.hidden).length} hidden test case(s)
              </div>
            )}
          </div>
        )}

        {q.constraints && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>Constraints</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.constraints}</div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ padding: '10px 13px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <Btn variant="ghost"   size="sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ flex: 1, justifyContent: 'center' }}>← Prev</Btn>
        {current < questions.length - 1
          ? <Btn variant="primary" size="sm" onClick={() => setCurrent(c => c + 1)} style={{ flex: 1, justifyContent: 'center' }}>Next →</Btn>
          : <Btn variant="success" size="sm" onClick={onReview} style={{ flex: 1, justifyContent: 'center' }}>Review →</Btn>}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {showMobileNav && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowMobileNav(false)}>
            <div style={{ width: '82%', maxWidth: 340, background: 'white', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              {ProblemPanel}
            </div>
          </div>
        )}
        <CodingEditor
          question={q} code={code} lang={lang}
          onLangChange={l => setLangForQ(current, l)}
          onChange={v => setAns(current, v)}
          result={result} onResult={r => setResult(current, r)}
          inEditorRef={inEditorRef} isMobile
        />
      </div>
    );
  }

  return (
    <>
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'white', overflow: 'hidden', flexShrink: 0 }}>
        {ProblemPanel}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CodingEditor
          question={q} code={code} lang={lang}
          onLangChange={l => setLangForQ(current, l)}
          onChange={v => setAns(current, v)}
          result={result} onResult={r => setResult(current, r)}
          inEditorRef={inEditorRef} isMobile={false}
        />
      </div>
    </>
  );
});

/* ══════════════════════════════════════════════
   CODING EDITOR + OUTPUT PANEL
══════════════════════════════════════════════ */
function CodingEditor({ question, code, lang, onLangChange, onChange, result, onResult, inEditorRef, isMobile }) {
  const [running, setRunning] = useState(false);
  const [tab,     setTab]     = useState('output');
  const [pyState, setPyState] = useState(() => (_pyInstance ? 'ready' : 'idle'));

  const isServer  = !CLIENT_LANGS.has(lang);
  const langInfo  = LANGS.find(l => l.id === lang) || LANGS[0];
  const accuracyN = parseFloat(result?.accuracy ?? NaN);
  const hasAcc    = !isNaN(accuracyN) && result?.type === 'testcases';

  /* Pre-load Pyodide when Python is selected */
  useEffect(() => {
    if (lang !== 'python' || pyState !== 'idle') return;
    setPyState('loading');
    getPyodide()
      .then(() => setPyState('ready'))
      .catch(() => setPyState('error'));
  }, [lang]); // eslint-disable-line

  async function handleRun() {
    if (isServer) {
      onResult({ type: 'info', text: `✅ ${langInfo.short} code saved.\n\nYour instructor will compile and evaluate it server-side.\nAll test cases will be verified during grading.` });
      setTab('output');
      return;
    }

    // Handle Python not loaded
    if (lang === 'python' && pyState !== 'ready') {
      if (pyState === 'error') {
        onResult({ type: 'error', text: '❌ Python runtime failed to load. Check your internet and reload.' });
        return;
      }
      // pyState === 'loading' — wait for it to finish before proceeding
      try {
        await getPyodide();
        setPyState('ready');
      } catch (e) {
        setPyState('error');
        onResult({ type: 'error', text: '❌ ' + e.message });
        return;
      }
    }

    setRunning(true);
    try {
      const tcs = question.testCases?.length ? question.testCases : [];

      if (tcs.length > 0) {
        const r = await runAllTests(lang, code, tcs);
        onResult({ type: 'testcases', ...r });
        setTab('testcases');
      } else {
        // No test cases — just run and show output
        const out = lang === 'python' ? await runPythonFree(code) : runJSFree(code);
        onResult({ type: 'output', text: out });
        setTab('output');
      }
    } catch (e) {
      onResult({ type: 'error', text: '❌ ' + e.message });
    } finally {
      setRunning(false);
    }
  }

  const btnLabel = running
    ? (lang === 'python' && pyState !== 'ready' ? 'Loading…' : 'Running…')
    : isServer ? '💾 Save Code' : '▶ Run';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#161b22', borderBottom: '1px solid #21262d', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {LANGS.map(l => (
            <button key={l.id} onClick={() => onLangChange(l.id)} style={{
              padding: isMobile ? '4px 7px' : '5px 10px', borderRadius: 6,
              border: `1.5px solid ${lang === l.id ? l.badge : '#30363d'}`,
              background: lang === l.id ? `${l.badge}22` : 'transparent',
              color: lang === l.id ? l.badge : '#8b949e',
              fontWeight: lang === l.id ? 700 : 400,
              fontSize: isMobile ? 10 : 11, cursor: 'pointer',
              fontFamily: 'var(--font-main)', transition: 'all 0.15s',
            }}>{isMobile ? l.short : l.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {lang === 'python' && pyState === 'loading' && (
            <span style={{ fontSize: 11, color: '#7dd3fc', display: 'flex', gap: 5, alignItems: 'center' }}>
              <Spinner size={10} color="#7dd3fc" /> Loading Python…
            </span>
          )}
          {lang === 'python' && pyState === 'error' && (
            <span style={{ fontSize: 11, color: '#fca5a5' }}>⚠️ Python unavailable</span>
          )}
          {hasAcc && (
            <span style={{ fontSize: 12, fontWeight: 700, color: accuracyN >= 50 ? '#86efac' : '#fca5a5', background: accuracyN >= 50 ? '#16a34a22' : '#dc262622', padding: '3px 10px', borderRadius: 6 }}>
              {result.passed}/{result.total} · {result.accuracy}%
            </span>
          )}
          <Btn variant="success" size="sm" onClick={handleRun} disabled={running} style={{ fontWeight: 700, minWidth: isMobile ? 72 : 100 }}>
            {running ? <><Spinner size={12} color="white" />&nbsp;</> : null}
            {running ? (isMobile ? '…' : btnLabel) : btnLabel}
          </Btn>
        </div>
      </div>

      {/* Code textarea */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <textarea
          className="code-editor"
          value={code}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          onMouseDown={() => { inEditorRef.current = true; }}
          onFocus={() => { inEditorRef.current = true; }}
          onBlur={() => { inEditorRef.current = false; }}
          style={{
            width: '100%', height: '100%', borderRadius: 0, border: 'none', resize: 'none',
            fontSize: isMobile ? 12 : 13.5, lineHeight: 1.75, padding: '13px 16px',
            boxSizing: 'border-box', background: '#0d1117', color: '#e2e8f0',
            caretColor: '#e2e8f0', outline: 'none', boxShadow: 'none',
          }}
          onKeyDown={e => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const s = e.target.selectionStart, end = e.target.selectionEnd;
              onChange(code.substring(0, s) + '    ' + code.substring(end));
              setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
            }
            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); if (!running) handleRun(); }
          }}
          placeholder={`Write your ${langInfo.short} solution here…${isServer ? '' : '\n\nCtrl+Enter → Run Code'}`}
        />
      </div>

      {/* Output panel */}
      <div style={{ height: isMobile ? 180 : 240, borderTop: '1px solid #21262d', background: '#0d1117', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #21262d', background: '#161b22', flexShrink: 0 }}>
          {[
            ['output', '💻 Output'],
            ['testcases', `🧪 Tests${result?.type === 'testcases' ? ` (${result.passed}/${result.total})` : ''}`],
          ].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 13px', border: 'none', background: 'none',
              color: tab === t ? '#e6edf3' : '#8b949e',
              fontWeight: tab === t ? 700 : 400, fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
            }}>{l}</button>
          ))}
          {hasAcc && (
            <div style={{ marginLeft: 'auto', padding: '3px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#86efac', fontWeight: 700 }}>{result.passed}/{result.total}</span>
              <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', color: accuracyN >= 50 ? '#86efac' : '#fca5a5', background: accuracyN >= 50 ? '#16a34a22' : '#dc262622', padding: '2px 7px', borderRadius: 5 }}>
                {result.accuracy}%
              </span>
            </div>
          )}
        </div>

        {/* Output content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '9px 13px' }}>
          {!result ? (
            <div style={{ color: '#4b5563', fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: 2 }}>
              {isServer
                ? `${langInfo.short} code is saved automatically.\nClick "💾 Save Code" to confirm.\nYour instructor will compile and grade it.`
                : `Click ▶ Run  (or Ctrl+Enter)\n\n🐍 Python  →  real CPython 3.x via Pyodide WASM\n⚡ JS       →  browser sandbox\n\nTest cases run automatically against expected output.`}
            </div>
          ) : tab === 'testcases' && result.type === 'testcases' ? (
            <TestCaseResults result={result} />
          ) : (
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: result.type === 'error' ? '#fca5a5' : result.type === 'info' ? '#fbbf24' : '#e6edf3', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {result.text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TEST CASE RESULTS DISPLAY
══════════════════════════════════════════════ */
const TestCaseResults = memo(({ result }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
      <span style={{ background: '#16a34a22', border: '1px solid #16a34a44', borderRadius: 6, padding: '3px 9px', fontSize: 11, color: '#86efac', fontWeight: 700 }}>✓ {result.passed} Passed</span>
      <span style={{ background: '#dc262622', border: '1px solid #dc262644', borderRadius: 6, padding: '3px 9px', fontSize: 11, color: '#fca5a5', fontWeight: 700 }}>✗ {result.total - result.passed} Failed</span>
      {result.accuracy != null && (
        <span style={{ background: '#3b82f622', border: '1px solid #3b82f644', borderRadius: 6, padding: '3px 9px', fontSize: 11, color: '#93c5fd', fontWeight: 700 }}>
          Accuracy: {result.accuracy}%
        </span>
      )}
    </div>
    {result.results.map((r, i) => (
      <div key={i} style={{ background: '#161b22', borderRadius: 8, padding: '8px 12px', border: `1px solid ${r.passed === null ? '#f59e0b44' : r.passed ? '#16a34a44' : '#dc262644'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e6edf3', fontFamily: 'var(--font-mono)' }}>Test {i + 1}{r.hidden ? ' 🔒' : ''}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: r.passed === null ? '#fbbf24' : r.passed ? '#86efac' : '#fca5a5' }}>
            {r.passed === null ? '⏳ Instructor' : r.passed ? '✓ Passed' : '✗ Failed'}
          </span>
        </div>
        {!r.hidden && (
          <>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#8b949e' }}>
              Input: <span style={{ color: '#7dd3fc' }}>{String(r.input)}</span>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#8b949e' }}>
              Expected: <span style={{ color: '#86efac' }}>{r.expected}</span>
            </div>
          </>
        )}
        {r.passed === false && (
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#8b949e' }}>
            Got: <span style={{ color: '#fca5a5' }}>{r.output || r.error || '(no output)'}</span>
          </div>
        )}
        {r.error && r.error !== r.output && r.passed === false && (
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#f87171', marginTop: 2 }}>
            Error: {r.error.substring(0, 120)}
          </div>
        )}
      </div>
    ))}
  </div>
));

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function CenterScreen({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, background: 'var(--bg-primary)', padding: 20 }}>
      {children}
    </div>
  );
}