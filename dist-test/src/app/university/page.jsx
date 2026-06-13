'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UniversityPage;
// apps/web/src/app/university/page.tsx
// Institution Dashboard — TPO / placement officer view.
// Backend endpoints: /api/university/dashboard, /api/university/employability-report,
//                   /api/university/skill-gaps
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/api/client");
// ── Reusable components ───────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }) {
    return (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
            padding: '18px 20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 5 }}>{sub}</div>}
    </div>);
}
function Bar({ value, max, color, label }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (<div style={{ marginBottom: 10 }}>
      {label && (<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--t1)' }}>{label}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color }}>
            {value} <span style={{ color: 'var(--t3)' }}>({Math.round(pct)}%)</span>
          </span>
        </div>)}
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }}/>
      </div>
    </div>);
}
function Skeleton({ h = 48 }) {
    return <div className="skeleton" style={{ height: h, borderRadius: 'var(--radius)', marginBottom: 8 }}/>;
}
// ── Main page ─────────────────────────────────────────────────────────────────
function UniversityPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const [tab, setTab] = (0, react_1.useState)('overview');
    const [stats, setStats] = (0, react_1.useState)(null);
    const [topStudents, setTop] = (0, react_1.useState)([]);
    const [deptStats, setDept] = (0, react_1.useState)([]);
    const [employ, setEmploy] = (0, react_1.useState)(null);
    const [gaps, setGaps] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (!user)
            return;
        if (!['admin', 'institution'].includes(user.role)) {
            router.push('/dashboard');
            return;
        }
        loadAll();
    }, [user]); // eslint-disable-line
    async function loadAll() {
        setLoading(true);
        await Promise.all([loadDashboard(), loadEmployability(), loadSkillGaps()]);
        setLoading(false);
    }
    async function loadDashboard() {
        try {
            const d = await client_1.api.get('/api/university/dashboard');
            setStats(d.placementStats);
            setTop(d.topStudents || []);
            setDept(d.deptStats || []);
        }
        catch { }
    }
    async function loadEmployability() {
        try {
            const d = await client_1.api.get('/api/university/employability-report');
            setEmploy(d.report);
        }
        catch { }
    }
    async function loadSkillGaps() {
        try {
            const d = await client_1.api.get('/api/university/skill-gaps');
            setGaps(d.gaps || []);
        }
        catch { }
    }
    const placementPct = stats ? Math.round((stats.placement_ready / Math.max(stats.total_students, 1)) * 100) : 0;
    const atsPct = stats ? Math.round((stats.ats_qualified / Math.max(stats.total_students, 1)) * 100) : 0;
    const engagePct = stats ? Math.round((stats.engaged_students / Math.max(stats.total_students, 1)) * 100) : 0;
    const maxGapFreq = Math.max(...gaps.map(g => g.frequency), 1);
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'students', label: 'Top Students', icon: '🏆' },
        { id: 'skills', label: 'Skill Gaps', icon: '📉' },
        { id: 'report', label: 'Placement Report', icon: '📋' },
    ];
    return (<div style={{ maxWidth: 1280, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 4 }}>🏛 Institution Dashboard</h1>
        <p style={{ color: "var(--t2)", fontSize: 13.5 }}>Placement intelligence, employability analytics, and student performance for TPOs</p>
      </div>

      {/* Primary KPIs */}
      {loading ? (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} h={100}/>)}
        </div>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Total Students" value={stats?.total_students || 0} sub="On PinIT" color="var(--accent)" icon="👥"/>
          <KpiCard label="Placement Ready" value={`${placementPct}%`} sub={`${stats?.placement_ready || 0} students`} color="var(--green)" icon="🎯"/>
          <KpiCard label="ATS Qualified 70+" value={`${atsPct}%`} sub={`${stats?.ats_qualified || 0} students`} color="var(--teal)" icon="📄"/>
          <KpiCard label="Avg ATS Score" value={`${stats?.avg_ats || 0}/100`} sub="Platform average" color="var(--blue)" icon="🏅"/>
          <KpiCard label="Avg Trust Score" value={`${stats?.avg_trust || 0}/100`} sub="Verified behaviour" color="var(--purple)" icon="🛡"/>
          <KpiCard label="Actively Engaged" value={`${engagePct}%`} sub="3+ day mission streak" color="var(--amber)" icon="🔥"/>
        </div>)}

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

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Employability funnel */}
          <div style={card}>
            <div style={cardLabel}>Employability Funnel</div>
            {loading || !employ ? <>{[...Array(4)].map((_, i) => <Skeleton key={i} h={30}/>)}</> : (<>
                <Bar label={`Highly Employable (ATS 80+)`} value={employ.highly_employable} max={stats?.total_students || 1} color="var(--green)"/>
                <Bar label={`Employable (ATS 60–79)`} value={employ.employable} max={stats?.total_students || 1} color="var(--teal)"/>
                <Bar label={`Needs Development (<60)`} value={employ.needs_development} max={stats?.total_students || 1} color="var(--coral)"/>
                <Bar label={`High Trust Score (70+)`} value={employ.high_trust} max={stats?.total_students || 1} color="var(--purple)"/>
                <Bar label={`Certified (any cert)`} value={employ.certified} max={stats?.total_students || 1} color="var(--blue)"/>
                <Bar label={`Highly Engaged (30d streak)`} value={employ.highly_engaged} max={stats?.total_students || 1} color="var(--amber)"/>
              </>)}
          </div>

          {/* Department breakdown */}
          <div style={card}>
            <div style={cardLabel}>Department Performance</div>
            {loading ? <>{[...Array(5)].map((_, i) => <Skeleton key={i} h={36}/>)}</> :
                deptStats.length === 0 ? (<div style={{ color: 'var(--t3)', fontSize: 13 }}>Department data not available — register numbers needed.</div>) : deptStats.map(d => (<div key={d.dept_code} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{d.dept_code || 'N/A'}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>
                      <span style={{ color: 'var(--teal)' }}>ATS: {d.avg_ats}</span>
                      <span style={{ color: 'var(--green)' }}>Trust: {d.avg_trust}</span>
                      <span style={{ color: 'var(--t3)' }}>{d.student_count} students</span>
                    </div>
                  </div>
                  <Bar value={d.avg_ats} max={100} color={d.avg_ats >= 70 ? 'var(--green)' : d.avg_ats >= 50 ? 'var(--teal)' : 'var(--amber)'}/>
                </div>))}
          </div>

          {/* Readiness radar quick view */}
          <div style={{ ...card, gridColumn: '1/-1' }}>
            <div style={cardLabel}>Platform-Wide Averages</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
              {[
                { label: 'ATS Score', value: `${stats?.avg_ats || 0}`, max: 100, color: 'var(--teal)' },
                { label: 'Trust Score', value: `${stats?.avg_trust || 0}`, max: 100, color: 'var(--green)' },
                { label: 'Career DNA', value: `${stats?.avg_dna || 0}`, max: 100, color: 'var(--purple)' },
            ].map(m => (<div key={m.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: m.color, marginBottom: 8 }}>{m.value}<span style={{ fontSize: 12, color: 'var(--t3)' }}>/100</span></div>
                  <Bar value={parseFloat(m.value)} max={m.max} color={m.color}/>
                </div>))}
            </div>
          </div>
        </div>)}

      {/* ── TOP STUDENTS TAB ─────────────────────────────────────────────── */}
      {tab === 'students' && (<div style={card}>
          <div style={cardLabel}>Top 10 Students by Placement Readiness</div>
          {loading ? <>{[...Array(10)].map((_, i) => <Skeleton key={i} h={52}/>)}</> :
                topStudents.length === 0
                    ? <div style={{ color: 'var(--t3)', fontSize: 13 }}>No student data yet.</div>
                    : (<div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg3)' }}>
                        {['Rank', 'Student', 'Reg No.', 'ATS', 'Trust', 'DNA', 'Visibility'].map(h => (<th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)' }}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {topStudents.map((s, i) => (<tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ display: 'inline-flex', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: i < 3 ? 'var(--accent)' : 'var(--bg3)', color: i < 3 ? '#fff' : 'var(--t3)', fontSize: 11, fontWeight: 700 }}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{s.display_name}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--t3)', fontSize: 11 }}>{s.register_number || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>{Math.round(s.ats_score)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{Math.round(s.trust_score)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>{Math.round(s.career_dna_score)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, fontWeight: 700,
                                background: s.recruiter_visibility >= 60 ? 'var(--green-light)' : s.recruiter_visibility >= 30 ? 'var(--amber-light)' : 'var(--coral-light)',
                                color: s.recruiter_visibility >= 60 ? 'var(--green)' : s.recruiter_visibility >= 30 ? 'var(--amber)' : 'var(--coral)' }}>
                              {s.recruiter_visibility >= 60 ? '✅ High' : s.recruiter_visibility >= 30 ? '⚡ Medium' : '⚠ Low'}
                            </span>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
        </div>)}

      {/* ── SKILL GAPS TAB ───────────────────────────────────────────────── */}
      {tab === 'skills' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <div style={cardLabel}>Top Skill Gaps (all students)</div>
            {loading ? <>{[...Array(8)].map((_, i) => <Skeleton key={i} h={36}/>)}</> :
                gaps.length === 0
                    ? <div style={{ color: 'var(--t3)', fontSize: 13 }}>No skill gap data available yet.</div>
                    : gaps.slice(0, 15).map(g => (<div key={g.skill_gap} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{g.skill_gap}</span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--coral)' }}>
                          {g.frequency} students ({Math.round(g.frequency / maxGapFreq * 100)}%)
                        </span>
                      </div>
                      <Bar value={g.frequency} max={maxGapFreq} color="var(--coral)"/>
                    </div>))}
          </div>
          <div style={card}>
            <div style={cardLabel}>Recommended Interventions</div>
            {loading ? <>{[...Array(4)].map((_, i) => <Skeleton key={i} h={60}/>)}</> : (gaps.slice(0, 5).map((g, i) => (<div key={g.skill_gap} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--t3)', flexShrink: 0 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{g.skill_gap}</div>
                      <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
                        {g.frequency} students need this. Consider adding a dedicated workshop session or targeted missions for this skill.
                      </div>
                    </div>
                  </div>
                </div>)))}
          </div>
        </div>)}

      {/* ── PLACEMENT REPORT TAB ─────────────────────────────────────────── */}
      {tab === 'report' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Export button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={() => window.print()}>
              🖨 Print / Export Report
            </button>
          </div>

          <div style={card}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              Annual Placement Readiness Report
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 20 }}>
              Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {loading ? <>{[...Array(4)].map((_, i) => <Skeleton key={i} h={60}/>)}</> : (<>
                {/* Summary section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Students Assessed', value: stats?.total_students || 0, color: 'var(--accent)' },
                    { label: 'Placement Ready', value: `${placementPct}%`, color: 'var(--green)' },
                    { label: 'ATS Qualified (70+)', value: `${atsPct}%`, color: 'var(--teal)' },
                ].map(s => (<div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{s.label}</div>
                    </div>))}
                </div>

                {/* Employability breakdown */}
                {employ && (<>
                    <div style={cardLabel}>Employability Breakdown</div>
                    {[
                        { label: `Highly Employable`, v: employ.highly_employable, desc: 'ATS score ≥ 80', color: 'var(--green)' },
                        { label: `Employable`, v: employ.employable, desc: 'ATS score 60–79', color: 'var(--teal)' },
                        { label: `Needs Development`, v: employ.needs_development, desc: 'ATS score < 60', color: 'var(--coral)' },
                        { label: `Certified Students`, v: employ.certified, desc: 'Has certifications', color: 'var(--blue)' },
                        { label: `Highly Engaged`, v: employ.highly_engaged, desc: '30+ day streak', color: 'var(--amber)' },
                    ].map(r => (<div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 160, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                        <div style={{ flex: 1 }}><Bar value={r.v} max={stats?.total_students || 1} color={r.color}/></div>
                        <div style={{ width: 100, textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: r.color }}>
                          {r.v} ({Math.round(r.v / (stats?.total_students || 1) * 100)}%)
                        </div>
                        <div style={{ width: 140, fontSize: 11, color: 'var(--t3)' }}>{r.desc}</div>
                      </div>))}
                  </>)}

                {/* Top 5 skill gaps */}
                {gaps.length > 0 && (<div style={{ marginTop: 20 }}>
                    <div style={cardLabel}>Critical Skill Gaps to Address</div>
                    {gaps.slice(0, 5).map((g, i) => (<div key={g.skill_gap} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--coral)', fontWeight: 700, width: 20 }}>{i + 1}.</span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{g.skill_gap}</span>
                        <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{g.frequency} students affected</span>
                      </div>))}
                  </div>)}
              </>)}
          </div>
        </div>)}
    </div>);
}
const card = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-sm)',
};
const cardLabel = {
    fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase',
    color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600,
    marginBottom: 14, display: 'block',
};
