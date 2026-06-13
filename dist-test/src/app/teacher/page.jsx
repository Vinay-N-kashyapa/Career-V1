'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TeacherPage;
// apps/web/src/app/teacher/page.tsx
// Native teacher portal — replaces the legacy DSAI TeacherPages.jsx dependency.
// 4 tabs: Classes · Student Progress · Exam Results · Attendance
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/api/client");
// ── Helpers ────────────────────────────────────────────────────────────────────
function pct(score, total) {
    return total > 0 ? Math.round((score / total) * 100) : 0;
}
function grade(p) {
    return p >= 90 ? 'O' : p >= 80 ? 'A+' : p >= 70 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : 'F';
}
// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreBadge({ value, color }) {
    return (<span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color }}>
      {Math.round(value)}
    </span>);
}
function Skeleton({ h = 48 }) {
    return <div className="skeleton" style={{ height: h, borderRadius: 'var(--radius)', marginBottom: 6 }}/>;
}
function StatCard({ label, value, color, icon }) {
    return (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
            padding: '14px 18px', textAlign: 'center', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3 }}>{label}</div>
    </div>);
}
function ProgressBar({ value, max = 100, color }) {
    const p = Math.min(100, (value / max) * 100);
    return (<div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }}/>
    </div>);
}
// ── Main page ─────────────────────────────────────────────────────────────────
function TeacherPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const [tab, setTab] = (0, react_1.useState)('classes');
    const [students, setStudents] = (0, react_1.useState)([]);
    const [exams, setExams] = (0, react_1.useState)([]);
    const [attend, setAttend] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [search, setSearch] = (0, react_1.useState)('');
    const [sortBy, setSortBy] = (0, react_1.useState)('ats_score');
    const [sortDir, setSortDir] = (0, react_1.useState)('desc');
    (0, react_1.useEffect)(() => {
        if (!user)
            return;
        if (!['teacher', 'admin'].includes(user.role)) {
            router.push('/dashboard');
            return;
        }
        loadAll();
    }, [user]); // eslint-disable-line
    const loadAll = (0, react_1.useCallback)(async () => {
        setLoading(true);
        await Promise.all([loadStudents(), loadExams(), loadAttendance()]);
        setLoading(false);
    }, []); // eslint-disable-line
    async function loadStudents() {
        try {
            const d = await client_1.api.get('/api/admin/users?role=student&limit=200');
            setStudents(d.users || []);
        }
        catch {
            setStudents([]);
        }
    }
    async function loadExams() {
        try {
            const d = await client_1.api.get('/api/exam/results?limit=200');
            setExams(d.results || []);
        }
        catch {
            setExams([]);
        }
    }
    async function loadAttendance() {
        try {
            const d = await client_1.api.get('/api/attendance/logs?limit=500');
            setAttend(d.logs || []);
        }
        catch {
            setAttend([]);
        }
    }
    // ── Derived stats ─────────────────────────────────────────────────────────
    const filtered = students.filter(s => !search || s.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.register_number?.toLowerCase().includes(search.toLowerCase()));
    const sorted = [...filtered].sort((a, b) => {
        const av = a[sortBy] || 0;
        const bv = b[sortBy] || 0;
        return sortDir === 'desc' ? bv - av : av - bv;
    });
    const avgAts = students.length ? Math.round(students.reduce((s, x) => s + (x.ats_score || 0), 0) / students.length) : 0;
    const avgTrust = students.length ? Math.round(students.reduce((s, x) => s + (x.trust_score || 0), 0) / students.length) : 0;
    const avgDna = students.length ? Math.round(students.reduce((s, x) => s + (x.career_dna_score || 0), 0) / students.length) : 0;
    const onStreak = students.filter(s => (s.mission_streak || 0) >= 3).length;
    const passRate = exams.length ? Math.round((exams.filter(e => e.percentage >= 50).length / exams.length) * 100) : 0;
    const presentToday = attend.filter(a => {
        const today = new Date().toISOString().slice(0, 10);
        return a.date?.slice(0, 10) === today && a.status === 'present';
    }).length;
    function toggleSort(col) {
        if (sortBy === col)
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else {
            setSortBy(col);
            setSortDir('desc');
        }
    }
    const SortArrow = ({ col }) => sortBy === col ? <span style={{ color: 'var(--accent)' }}>{sortDir === 'desc' ? ' ↓' : ' ↑'}</span> : null;
    // ── Attendance calendar helpers ───────────────────────────────────────────
    const attendByDate = {};
    attend.forEach(a => {
        const d = a.date?.slice(0, 10) || '';
        if (!attendByDate[d])
            attendByDate[d] = { present: 0, absent: 0, late: 0 };
        attendByDate[d][a.status] = (attendByDate[d][a.status] || 0) + 1;
    });
    const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
    });
    const tabs = [
        { id: 'classes', label: 'Classes', icon: '🏫' },
        { id: 'progress', label: 'Student Progress', icon: '📊' },
        { id: 'exams', label: 'Exam Results', icon: '📝' },
        { id: 'attendance', label: 'Attendance', icon: '✅' },
    ];
    return (<div style={{ maxWidth: 1280, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 4 }}>📚 Teacher Portal</h1>
        <p style={{ color: "var(--t2)", fontSize: 13.5 }}>Manage student progress, exam results, and attendance across your classes</p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
            { label: 'Total Students', value: students.length, color: 'var(--accent)', icon: '👥' },
            { label: 'Avg ATS Score', value: `${avgAts}/100`, color: 'var(--teal)', icon: '🎯' },
            { label: 'Avg Trust', value: `${avgTrust}/100`, color: 'var(--green)', icon: '🛡' },
            { label: 'Avg DNA', value: `${avgDna}/100`, color: 'var(--purple)', icon: '🧬' },
            { label: 'On Streak 3d+', value: onStreak, color: 'var(--amber)', icon: '🔥' },
            { label: 'Exam Pass Rate', value: `${passRate}%`, color: 'var(--blue)', icon: '📝' },
            { label: 'Present Today', value: presentToday, color: 'var(--green)', icon: '✅' },
        ].map(s => <StatCard key={s.label} {...s}/>)}
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4,
            borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            marginBottom: 20, width: 'fit-content' }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '7px 16px', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)',
                background: tab === t.id ? 'var(--bg2)' : 'transparent',
                color: tab === t.id ? 'var(--t1)' : 'var(--t3)',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
            }}>
            {t.icon} {t.label}
          </button>))}
      </div>

      {/* ── CLASSES TAB ───────────────────────────────────────────────────── */}
      {tab === 'classes' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Score distribution */}
          <div style={card}>
            <div style={cardLabel}>ATS Score Distribution</div>
            {loading ? <>{[...Array(4)].map((_, i) => <Skeleton key={i} h={36}/>)}</>
                : [
                    { label: '80–100 (Excellent)', count: students.filter(s => s.ats_score >= 80).length, color: 'var(--green)' },
                    { label: '60–79 (Good)', count: students.filter(s => s.ats_score >= 60 && s.ats_score < 80).length, color: 'var(--teal)' },
                    { label: '40–59 (Average)', count: students.filter(s => s.ats_score >= 40 && s.ats_score < 60).length, color: 'var(--amber)' },
                    { label: '0–39 (Needs help)', count: students.filter(s => s.ats_score < 40).length, color: 'var(--coral)' },
                ].map(r => (<div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 120, flexShrink: 0, fontSize: 12, color: 'var(--t2)' }}>{r.label}</div>
                  <div style={{ flex: 1 }}><ProgressBar value={r.count} max={Math.max(students.length, 1)} color={r.color}/></div>
                  <div style={{ width: 28, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: r.color }}>{r.count}</div>
                </div>))}
          </div>

          {/* Top skills needed */}
          <div style={card}>
            <div style={cardLabel}>Top Skill Gaps Across Class</div>
            {loading ? <>{[...Array(5)].map((_, i) => <Skeleton key={i} h={30}/>)}</> : (() => {
                const gapCounts = {};
                students.forEach(s => (s.weak_areas || []).forEach(g => { gapCounts[g] = (gapCounts[g] || 0) + 1; }));
                const topGaps = Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
                return topGaps.length === 0
                    ? <div style={{ color: 'var(--t3)', fontSize: 13 }}>No skill gap data yet — students need to upload resumes.</div>
                    : topGaps.map(([gap, count]) => (<div key={gap} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, flex: 1, color: 'var(--t1)' }}>{gap}</span>
                      <ProgressBar value={count} max={Math.max(students.length, 1)} color="var(--coral)"/>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--coral)', width: 30, textAlign: 'right' }}>{count}</span>
                    </div>));
            })()}
          </div>

          {/* Mission streaks */}
          <div style={card}>
            <div style={cardLabel}>Mission Engagement</div>
            {loading ? <Skeleton h={80}/> : (() => {
                const tiers = [
                    { label: '7+ day streak 🔥', count: students.filter(s => s.mission_streak >= 7).length, color: 'var(--amber)' },
                    { label: '3–6 day streak', count: students.filter(s => s.mission_streak >= 3 && s.mission_streak < 7).length, color: 'var(--teal)' },
                    { label: '1–2 day streak', count: students.filter(s => s.mission_streak >= 1 && s.mission_streak < 3).length, color: 'var(--accent)' },
                    { label: 'No streak', count: students.filter(s => !s.mission_streak).length, color: 'var(--t3)' },
                ];
                return tiers.map(t => (<div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 130, fontSize: 12, color: 'var(--t2)' }}>{t.label}</div>
                  <ProgressBar value={t.count} max={Math.max(students.length, 1)} color={t.color}/>
                  <div style={{ width: 28, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: t.color }}>{t.count}</div>
                </div>));
            })()}
          </div>

          {/* Exam summary */}
          <div style={card}>
            <div style={cardLabel}>Recent Exam Summary</div>
            {loading ? <Skeleton h={80}/> : (exams.length === 0
                ? <div style={{ color: 'var(--t3)', fontSize: 13 }}>No exam results yet.</div>
                : (() => {
                    const byExam = {};
                    exams.forEach(e => {
                        if (!byExam[e.exam_name])
                            byExam[e.exam_name] = [];
                        byExam[e.exam_name].push(e.percentage);
                    });
                    return Object.entries(byExam).slice(0, 6).map(([name, scores]) => {
                        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                        const pass = Math.round((scores.filter(s => s >= 50).length / scores.length) * 100);
                        return (<div key={name} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                              avg {avg}% · {pass}% pass
                            </span>
                          </div>
                          <ProgressBar value={avg} color={avg >= 70 ? 'var(--green)' : avg >= 50 ? 'var(--amber)' : 'var(--coral)'}/>
                        </div>);
                    });
                })())}
          </div>
        </div>)}

      {/* ── STUDENT PROGRESS TAB ──────────────────────────────────────────── */}
      {tab === 'progress' && (<>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input placeholder="Search student / reg no." value={search} onChange={e => setSearch(e.target.value)} className="form-input" style={{ flex: 1, minWidth: 180, maxWidth: 300 }}/>
          </div>

          {loading ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...Array(8)].map((_, i) => <Skeleton key={i} h={56}/>)}
            </div>) : (<div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)' }}>
                    <th style={th}>#</th>
                    <th style={th}>Student</th>
                    <th style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort('ats_score')}>
                      ATS<SortArrow col="ats_score"/>
                    </th>
                    <th style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort('trust_score')}>
                      Trust<SortArrow col="trust_score"/>
                    </th>
                    <th style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort('career_dna_score')}>
                      DNA<SortArrow col="career_dna_score"/>
                    </th>
                    <th style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort('mission_streak')}>
                      Streak<SortArrow col="mission_streak"/>
                    </th>
                    <th style={th}>Skills</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (<tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--t3)' }}>No students found</td></tr>) : sorted.map((s, i) => {
                    const overall = Math.round((s.ats_score + s.trust_score + s.career_dna_score) / 3);
                    return (<tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg2)' : 'transparent' }}>
                        <td style={td}><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)', fontSize: 11 }}>#{i + 1}</span></td>
                        <td style={td}>
                          <div style={{ fontWeight: 600 }}>{s.display_name}</div>
                          {s.register_number && <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{s.register_number}</div>}
                        </td>
                        <td style={td}><ScoreBadge value={s.ats_score} color="var(--teal)"/></td>
                        <td style={td}><ScoreBadge value={s.trust_score} color="var(--green)"/></td>
                        <td style={td}><ScoreBadge value={s.career_dna_score} color="var(--purple)"/></td>
                        <td style={td}><span style={{ color: 'var(--amber)', fontWeight: 700 }}>{'🔥'.repeat(Math.min(s.mission_streak || 0, 3))}{s.mission_streak || 0}d</span></td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {(s.skill_tags || []).slice(0, 2).map(t => (<span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,201,167,0.1)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,0.2)' }}>{t}</span>))}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, fontWeight: 700,
                            background: overall >= 70 ? 'var(--green-light)' : overall >= 50 ? 'var(--amber-light)' : 'var(--coral-light)',
                            color: overall >= 70 ? 'var(--green)' : overall >= 50 ? 'var(--amber)' : 'var(--coral)',
                        }}>
                            {overall >= 70 ? '✅ Ready' : overall >= 50 ? '⚡ Progressing' : '⚠ Needs help'}
                          </span>
                        </td>
                      </tr>);
                })}
                </tbody>
              </table>
            </div>)}
        </>)}

      {/* ── EXAM RESULTS TAB ──────────────────────────────────────────────── */}
      {tab === 'exams' && (<>
          {loading ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...Array(8)].map((_, i) => <Skeleton key={i} h={52}/>)}
            </div>) : exams.length === 0 ? (<div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">No exam results yet</div>
              <div className="empty-desc">Results appear here once students complete exams.</div>
            </div>) : (<div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)' }}>
                    {['Student', 'Exam', 'Score', '%', 'Grade', 'Tab Switches', 'Status', 'Date'].map(h => (<th key={h} style={th}>{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e, i) => (<tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg2)' : 'transparent' }}>
                      <td style={td}><span style={{ fontWeight: 600 }}>{e.display_name || e.user_id?.slice(0, 8)}</span></td>
                      <td style={td}><span style={{ fontSize: 12 }}>{e.exam_name}</span></td>
                      <td style={td}><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{e.score}/{e.total_marks}</span></td>
                      <td style={td}>
                        <span style={{ fontWeight: 700, color: e.percentage >= 70 ? 'var(--green)' : e.percentage >= 50 ? 'var(--amber)' : 'var(--coral)' }}>
                          {Math.round(e.percentage)}%
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800,
                        color: e.percentage >= 80 ? 'var(--green)' : e.percentage >= 60 ? 'var(--teal)' : e.percentage >= 50 ? 'var(--amber)' : 'var(--coral)' }}>
                          {grade(e.percentage)}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{ color: e.tab_switches > 5 ? 'var(--coral)' : e.tab_switches > 2 ? 'var(--amber)' : 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {e.tab_switches > 5 ? '⚠ ' : ''}{e.tab_switches}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, fontWeight: 700,
                        background: e.status === 'passed' ? 'var(--green-light)' : 'var(--coral-light)',
                        color: e.status === 'passed' ? 'var(--green)' : 'var(--coral)' }}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ ...td, color: 'var(--t3)', fontSize: 11 }}>{new Date(e.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </>)}

      {/* ── ATTENDANCE TAB ────────────────────────────────────────────────── */}
      {tab === 'attendance' && (<>
          {/* 14-day heatmap */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={cardLabel}>14-Day Attendance Heatmap</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {last14Days.map(date => {
                const a = attendByDate[date] || { present: 0, absent: 0, late: 0 };
                const tot = a.present + a.absent + a.late;
                const r = tot > 0 ? a.present / tot : 0;
                return (<div key={date} title={`${date}: ${a.present}P / ${a.absent}A / ${a.late}L`} style={{ textAlign: 'center', cursor: 'default' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8,
                        background: tot === 0 ? 'var(--bg3)'
                            : r >= 0.9 ? 'rgba(5,150,105,0.8)'
                                : r >= 0.7 ? 'rgba(5,150,105,0.4)'
                                    : r >= 0.5 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: tot === 0 ? 'var(--t3)' : '#fff' }}>
                      {tot === 0 ? '-' : a.present}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>
                      {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>);
            })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--t2)' }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(5,150,105,0.8)', marginRight: 4 }}/>90%+</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(5,150,105,0.4)', marginRight: 4 }}/>70–89%</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.5)', marginRight: 4 }}/>50–69%</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.4)', marginRight: 4 }}/>&lt;50%</span>
            </div>
          </div>

          {/* Today's attendance list */}
          {loading ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} h={48}/>)}
            </div>) : (() => {
                const today = new Date().toISOString().slice(0, 10);
                const todayLogs = attend.filter(a => a.date?.slice(0, 10) === today);
                return (<div style={card}>
                <div style={cardLabel}>Today's Attendance Log — {todayLogs.length} records</div>
                {todayLogs.length === 0
                        ? <div style={{ color: 'var(--t3)', fontSize: 13 }}>No attendance marked today yet.</div>
                        : todayLogs.map(a => (<div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 16 }}>
                          {a.status === 'present' ? '✅' : a.status === 'late' ? '⏰' : '❌'}
                        </span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{a.display_name || a.user_id?.slice(0, 8)}</span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{a.method || 'manual'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700,
                                color: a.status === 'present' ? 'var(--green)' : a.status === 'late' ? 'var(--amber)' : 'var(--coral)' }}>
                          {a.status}
                        </span>
                      </div>))}
              </div>);
            })()}
        </>)}
    </div>);
}
// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-sm)',
};
const cardLabel = {
    fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase',
    color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600,
    marginBottom: 14, display: 'block',
};
const th = {
    padding: '10px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700,
    color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px',
    borderBottom: '1px solid var(--border)',
};
const td = {
    padding: '10px 12px', verticalAlign: 'middle',
};
