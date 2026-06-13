'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExamPage;
// apps/web/src/app/exam/page.tsx
// LEGACY REMOVED: no longer imports DSAIExamBridge from _legacy/
// Uses native PinITExamEngine with real question loading.
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const AuthContext_1 = require("@/lib/context/AuthContext");
const client_1 = require("@/lib/api/client");
const link_1 = __importDefault(require("next/link"));
const dynamic_1 = __importDefault(require("next/dynamic"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
// PinITExamEngine loads lazily — Pyodide is heavy (~30MB)
const PinITExamEngine = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('@/components/exam/PinITExamEngine'))), {
    ssr: false,
    loading: () => (<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 36, animation: 'spin 1s linear infinite' }}>⚙</div>
        <p style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Initialising exam engine…</p>
        <p style={{ color: 'var(--t3)', fontSize: 11 }}>Loading Python runtime for code evaluation</p>
      </div>),
});
// ── Badge helper ──────────────────────────────────────────────────────────────
function badgeFor(pct) {
    if (pct >= 90)
        return { icon: '🥇', color: '#f59e0b', label: 'Gold', bg: 'rgba(245,158,11,0.1)' };
    if (pct >= 80)
        return { icon: '🥈', color: '#9ca3af', label: 'Silver', bg: 'rgba(156,163,175,0.1)' };
    if (pct >= 70)
        return { icon: '🥉', color: '#d97706', label: 'Bronze', bg: 'rgba(217,119,6,0.1)' };
    return null;
}
// ── Exam List view ────────────────────────────────────────────────────────────
function ExamList({ onTake }) {
    const { data: exams, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['exam', 'available'],
        queryFn: () => client_1.api.get('/api/exam/available').then(r => r.exams || []),
        staleTime: 2 * 60 * 1000,
    });
    if (isLoading)
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }}/>)}
    </div>);
    if (!exams?.length)
        return (<div className="empty-state">
      <div className="empty-icon">📋</div>
      <div className="empty-title">No exams scheduled yet</div>
      <div className="empty-desc">Your institution will publish exam schedules here. Check back soon.</div>
    </div>);
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {exams.map(exam => (<div key={exam.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: exam.exam_type === 'coding' ? 'rgba(79,70,229,0.12)'
                    : exam.exam_type === 'mcq' ? 'rgba(0,201,167,0.12)'
                        : 'rgba(245,158,11,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {exam.exam_type === 'coding' ? '</>' : exam.exam_type === 'mcq' ? '✅' : '📝'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', marginBottom: 4 }}>{exam.title}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
              <span>⏱ {exam.duration_minutes} min</span>
              <span>📝 {exam.question_count} questions</span>
              <span>🎯 {exam.total_marks} marks</span>
              <span>✅ Pass: {exam.passing_marks}</span>
              {exam.difficulty && <span style={{ color: exam.difficulty === 'Hard' ? 'var(--coral)' : exam.difficulty === 'Medium' ? 'var(--amber)' : 'var(--green)' }}>
                {exam.difficulty}
              </span>}
            </div>
          </div>
          <button onClick={() => onTake(exam.id)} className="btn-primary" style={{ flexShrink: 0, fontSize: 13 }}>
            Start Exam →
          </button>
        </div>))}
    </div>);
}
// ── Take Exam view ────────────────────────────────────────────────────────────
function TakeExam({ examId, studentId, onDone }) {
    const { data: examData, isLoading, error } = (0, react_query_1.useQuery)({
        queryKey: ['exam', 'questions', examId],
        queryFn: () => client_1.api.get(`/api/exam/${examId}/questions`).then(r => r.exam),
        staleTime: Infinity, // questions don't change during session
        retry: false,
    });
    if (isLoading)
        return (<div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⚙</div>
      <p style={{ color: 'var(--t2)' }}>Loading exam questions…</p>
    </div>);
    if (error || !examData)
        return (<div className="empty-state" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
      <div className="empty-icon">❌</div>
      <div className="empty-title">Could not load exam</div>
      <div className="empty-desc">
        {error?.message || 'Questions are not available. Please contact your instructor.'}
      </div>
    </div>);
    return (<PinITExamEngine exam={examData} studentId={studentId} onFinish={onDone}/>);
}
// ── Results view ──────────────────────────────────────────────────────────────
function ResultsView() {
    const { data: results, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['exam', 'results'],
        queryFn: () => client_1.api.get('/api/exam/results').then(r => r.results || []),
    });
    if (isLoading)
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 'var(--radius-xl)' }}/>)}
    </div>);
    if (!results?.length)
        return (<div className="empty-state">
      <div className="empty-icon">📋</div>
      <div className="empty-title">No exams taken yet</div>
      <div className="empty-desc">Take an exam to earn verified skill badges.</div>
    </div>);
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {results.map(r => {
            const pct = Math.round(Number(r.percentage) || 0);
            const badge = badgeFor(pct);
            return (<div key={r.id} style={{
                    background: 'var(--bg2)', border: `1px solid ${badge ? 'var(--border2,var(--border))' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-xl)', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)',
                }}>
            {badge
                    ? <span style={{ fontSize: 32, flexShrink: 0 }}>{badge.icon}</span>
                    : <span style={{ fontSize: 28, flexShrink: 0, opacity: 0.4 }}>📋</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>{r.exam_name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>{r.score}/{r.total_marks} marks</span>
                {r.tab_switches > 0 && <span style={{ color: r.tab_switches > 5 ? 'var(--coral)' : 'var(--amber)' }}>⚠ {r.tab_switches} tab switch{r.tab_switches > 1 ? 'es' : ''}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px',
                    color: pct >= 70 ? 'var(--green)' : 'var(--coral)' }}>{pct}%</div>
              {badge
                    ? <div style={{ fontSize: 11, fontWeight: 600, color: badge.color }}>{badge.label} Badge</div>
                    : <div style={{ fontSize: 11, color: 'var(--t3)' }}>Did not pass</div>}
            </div>
          </div>);
        })}
    </div>);
}
// ── Finish result overlay ──────────────────────────────────────────────────────
function FinishOverlay({ result, onBack }) {
    const pct = result.percentage;
    return (<div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 36,
            background: 'var(--bg2)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>
        {pct >= 90 ? '🥇' : pct >= 80 ? '🥈' : pct >= 70 ? '🥉' : pct >= 50 ? '📊' : '📝'}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Exam Complete!</h2>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, letterSpacing: '-2px',
            color: pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--coral)', marginBottom: 6 }}>
        {pct}%
      </div>
      <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 6 }}>{result.score} / {result.totalMarks} marks</div>
      {result.tabSwitches > 0 && (<div style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 12 }}>
          ⚠ {result.tabSwitches} tab switch{result.tabSwitches > 1 ? 'es' : ''} recorded
        </div>)}
      {pct >= 70 && (<div style={{ padding: '10px 16px', background: 'var(--green-light)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 16 }}>
          ✅ Passed! Badge added to your Vault.
        </div>)}
      {pct < 70 && (<div style={{ padding: '10px 16px', background: 'var(--amber-light)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--amber)', fontWeight: 600, marginBottom: 16 }}>
          You need 70% to earn a badge. Review the topics and try again.
        </div>)}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} className="btn-primary">Back to Exams</button>
        <link_1.default href="/vault" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost">View Vault →</button>
        </link_1.default>
        <link_1.default href="/career-dna" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost">Career DNA →</button>
        </link_1.default>
      </div>
    </div>);
}
function ExamInner() {
    const { user } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const qc = (0, react_query_1.useQueryClient)();
    const params = (0, navigation_1.useSearchParams)();
    const urlView = params.get('view');
    const urlExamId = params.get('id');
    const [view, setView] = (0, react_1.useState)(urlView === 'results' ? 'results' : urlExamId ? 'take' : 'list');
    const [activeId, setActiveId] = (0, react_1.useState)(urlExamId || null);
    const [finishRes, setFinishRes] = (0, react_1.useState)(null);
    if (!user) {
        router.push('/login');
        return null;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { earnPins: examEarnPins } = (0, CareerOSContext_1.useCareerOS)();
    function handleTake(examId) {
        setActiveId(examId);
        setView('take');
        window.history.pushState(null, '', `/exam?id=${examId}`);
    }
    function handleFinish(result) {
        setFinishRes(result);
        setView('finish');
        qc.invalidateQueries({ queryKey: ['exam'] });
        qc.invalidateQueries({ queryKey: ['career-dna'] });
        qc.invalidateQueries({ queryKey: ['scores'] });
        window.history.pushState(null, '', '/exam?view=results');
        // Earn pins for passing the exam
        const pct = Number(result?.percentage || 0);
        if (pct >= 60) {
            examEarnPins('exam_pass', 25, `Passed exam with ${Math.round(pct)}% score`);
        }
    }
    function handleBack() {
        setView('list');
        setActiveId(null);
        setFinishRes(null);
        window.history.pushState(null, '', '/exam');
    }
    return (<div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header — hidden during active exam */}
      {view !== 'take' && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>{view === 'results' ? 'My Results' : 'Exams'}</h1>
            <p>{view === 'results' ? 'Your certification history and badge achievements' : 'Take scheduled exams to earn verified skill badges'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {view === 'results'
                ? <button onClick={handleBack} className="btn-ghost btn-sm">📋 Available Exams</button>
                : <link_1.default href="/exam?view=results" style={{ textDecoration: 'none' }}><button className="btn-ghost btn-sm">📊 My Results</button></link_1.default>}
            <link_1.default href="/leaderboard" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost btn-sm">🏆 Leaderboard</button>
            </link_1.default>
          </div>
        </div>)}

      {view === 'list' && <ExamList onTake={handleTake}/>}
      {view === 'take' && activeId && <TakeExam examId={activeId} studentId={user.id} onDone={handleFinish}/>}
      {view === 'finish' && finishRes && <FinishOverlay result={finishRes} onBack={handleBack}/>}
      {view === 'results' && <ResultsView />}
    </div>);
}
function ExamPage() {
    return (<react_1.Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⚙</div>
          <p style={{ color: 'var(--t2)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</p>
        </div>
      </div>}>
      <ExamInner />
    </react_1.Suspense>);
}
