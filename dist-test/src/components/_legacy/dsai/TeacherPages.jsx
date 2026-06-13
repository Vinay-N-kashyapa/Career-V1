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
exports.TeacherLogin = TeacherLogin;
exports.TeacherDashboard = TeacherDashboard;
const react_1 = __importStar(require("react"));
const firebase_js_1 = require("../firebase.js");
const UI_jsx_1 = require("../components/UI.jsx");
const ToastContext_jsx_1 = require("../contexts/ToastContext.jsx");
const dsaiLogo_js_1 = __importDefault(require("../assets/dsaiLogo.js"));
const excelUtils_js_1 = require("../utils/excelUtils.js");
const hooks_js_1 = require("../utils/hooks.js");
/* ── Download helper ──
   All new uploads are base64 data URLs — downloaded directly without any network request.
   Legacy Firebase Storage URLs (https://...) cannot be fetch()-ed due to CORS restrictions;
   we open them in a new tab as the only safe fallback. */
async function dlFile(url, name) {
    if (!url)
        return;
    const a = document.createElement('a');
    if (url.startsWith('data:')) {
        // Base64 data URL — safe to download directly, no CORS issue
        a.href = url;
        a.download = name || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    else {
        // Legacy Firebase Storage URL — fetch() would fail with CORS, open in tab instead
        window.open(url, '_blank');
    }
}
/* ── Constants (5 batches) ── */
const BATCHES = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5'];
const ALL_BATCHES = ['All Batches', ...BATCHES];
// Shared style for all search/filter <input> elements — ensures consistent appearance
// across TeacherDashboard tabs without duplicating style objects everywhere.
const SEARCH_INPUT_STYLE = {
    flex: 1, minWidth: 180, padding: '8px 12px', fontSize: 13,
    borderRadius: 8, border: '1.5px solid var(--border)',
    background: 'white', fontFamily: 'var(--font-main)',
    color: 'var(--text-primary)', outline: 'none',
};
const SEMS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
const BATCH_COLORS = {
    'Batch 1': '#2563eb', 'Batch 2': '#059669',
    'Batch 3': '#7c3aed', 'Batch 4': '#d97706', 'Batch 5': '#dc2626',
};
function Loader() {
    return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, flexDirection: 'column', gap: 14 }}>
      <UI_jsx_1.Spinner size={32}/>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Loading…</p>
    </div>);
}
/* ─────────────────────────────────────────────────
   FILE ICON HELPER
───────────────────────────────────────────────── */
function fileIcon(name) {
    if (!name)
        return '📄';
    if (name.endsWith('.pdf'))
        return '📕';
    if (name.match(/\.pptx?$/))
        return '📊';
    if (name.match(/\.docx?$/))
        return '📝';
    if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        return '🖼️';
    return '📄';
}
function fmtSize(b) {
    if (!b)
        return '';
    return b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}
/* ═══════════════════════════════════════════════
   TEACHER LOGIN
═══════════════════════════════════════════════ */
function TeacherLogin({ onBack, onSuccess }) {
    const [user, setUser] = (0, react_1.useState)('');
    const [pass, setPass] = (0, react_1.useState)('');
    const [showPass, setShowPass] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const toast = (0, ToastContext_jsx_1.useToast)();
    async function handleLogin(e) {
        e.preventDefault();
        const username = user.trim();
        const password = pass.trim();
        if (!username || !password) {
            toast('Fill all fields', 'warning');
            return;
        }
        setLoading(true);
        try {
            const teachers = await firebase_js_1.DB.getAll('teachers');
            if (!teachers.length) {
                toast('No teacher accounts found. Ask admin.', 'warning');
                return;
            }
            const found = teachers.find(t => t.username?.trim().toLowerCase() === username.toLowerCase() &&
                t.password?.trim() === password);
            if (found) {
                onSuccess(found);
            }
            else {
                const userExists = teachers.find(t => t.username?.trim().toLowerCase() === username.toLowerCase());
                toast(userExists ? 'Wrong password for this username' : `Username "${username}" not found.`, 'error');
            }
        }
        catch (err) {
            toast('Login error: ' + err.message, 'error');
        }
        finally {
            setLoading(false);
        }
    }
    return (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-primary)' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(5,150,105,0.07) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <UI_jsx_1.Card style={{ maxWidth: 420, width: '100%', position: 'relative', zIndex: 1, padding: '40px 36px', boxShadow: '0 8px 40px rgba(5,150,105,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={dsaiLogo_js_1.default} alt="DSAI" style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(5,150,105,0.2)', display: 'block', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(5,150,105,0.15)' }}/>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Teacher Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>BGS Institute of Management · DSAI</p>
        </div>
        <form onSubmit={handleLogin}>
          <UI_jsx_1.Input label="Username" value={user} onChange={e => setUser(e.target.value)} placeholder="Enter your username" autoFocus/>
          <div style={{ position: 'relative' }}>
            <UI_jsx_1.Input label="Password" type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"/>
            <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '2px 6px' }}>
              {showPass ? '🙈 Hide' : '👁 Show'}
            </button>
          </div>
          <UI_jsx_1.Btn type="submit" variant="success" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, marginTop: 4, borderRadius: 10, padding: '12px' }} disabled={loading}>
            {loading ? <UI_jsx_1.Spinner size={16} color="white"/> : '🔓 Sign In'}
          </UI_jsx_1.Btn>
        </form>
        <UI_jsx_1.Btn variant="ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onBack}>← Back to Home</UI_jsx_1.Btn>
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 9, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Teacher accounts are created by Admin. Contact your administrator for credentials.</p>
        </div>
      </UI_jsx_1.Card>
    </div>);
}
/* ═══════════════════════════════════════════════
   TEACHER DASHBOARD — sidebar layout
═══════════════════════════════════════════════ */
function TeacherDashboard({ teacher, onLogout }) {
    const isMobile = (0, hooks_js_1.useIsMobile)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('dashboard');
    const [collapsed, setCollapsed] = (0, react_1.useState)(false);
    const [preloaded, setPreloaded] = (0, react_1.useState)(new Set(['dashboard']));
    function handleTabHover(id) {
        setPreloaded(prev => { if (prev.has(id))
            return prev; const n = new Set(prev); n.add(id); return n; });
    }
    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'results', icon: '📋', label: 'Results' },
        { id: 'analytics', icon: '📈', label: 'Analytics' },
        { id: 'grade', icon: '✏️', label: 'Grade Essays' },
        { id: 'sheets', icon: '📄', label: 'Answer Sheets' },
        { id: 'students', icon: '👨‍🎓', label: 'Students' },
        { id: 'papers', icon: '📝', label: 'Papers' },
        { id: 'exams', icon: '🗓️', label: 'Exam Schedule' },
        { id: 'notes', icon: '📚', label: 'Study Notes' },
        { id: 'notifications', icon: '🔔', label: 'Notifications' },
        { id: 'news', icon: '📰', label: 'News' },
        { id: 'messages', icon: '💬', label: 'Messages' },
    ];
    const W = collapsed ? 64 : 220;
    return (<div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
            width: W, flexShrink: 0, background: 'white',
            borderRight: '1px solid var(--border)', display: 'flex',
            flexDirection: 'column', height: '100vh', overflowY: 'auto',
            overflowX: 'hidden', transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '2px 0 14px rgba(5,150,105,0.07)', position: 'relative',
        }}>

        {/* Logo + collapse */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', minHeight: 62, flexShrink: 0 }}>
          {!collapsed && (<div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <img src={dsaiLogo_js_1.default} alt="DSAI" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(5,150,105,0.25)' }}/>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>BGS Teacher</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Teacher Portal</div>
              </div>
            </div>)}
          {collapsed && <img src={dsaiLogo_js_1.default} alt="DSAI" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(5,150,105,0.25)' }}/>}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.15)', cursor: 'pointer', color: 'var(--success)', fontSize: 12, padding: '5px 7px', flexShrink: 0, borderRadius: 7, lineHeight: 1, fontWeight: 700, marginLeft: collapsed ? 0 : 6 }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Teacher info */}
        {!collapsed && (<div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: '#f0fdf4', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'white', flexShrink: 0, fontWeight: 800, boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
                {teacher.name?.[0]?.toUpperCase() || 'T'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.name || teacher.username}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{teacher.batch ? `${teacher.batch} · ` : ''}Teacher</div>
              </div>
            </div>
          </div>)}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 7px', overflowY: 'auto' }}>
          {navItems.map(item => (<button key={item.id} onClick={() => setActiveTab(item.id)} title={collapsed ? item.label : ''} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 9, justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '10px 11px',
                background: activeTab === item.id ? 'rgba(5,150,105,0.09)' : 'transparent',
                border: activeTab === item.id ? '1px solid rgba(5,150,105,0.2)' : '1px solid transparent',
                borderRadius: 9, cursor: 'pointer',
                color: activeTab === item.id ? '#047857' : 'var(--text-secondary)',
                fontWeight: activeTab === item.id ? 700 : 400,
                fontSize: 13, textAlign: 'left', transition: 'all 0.14s', marginBottom: 2,
                fontFamily: 'var(--font-main)', flexShrink: 0,
            }} onMouseEnter={e => { handleTabHover(item.id); if (activeTab !== item.id)
            e.currentTarget.style.background = 'rgba(5,150,105,0.05)'; }} onMouseLeave={e => { if (activeTab !== item.id)
            e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '9px 7px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={onLogout} title={collapsed ? 'Logout' : ''} style={{ width: '100%', padding: collapsed ? '11px 0' : '10px 11px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.14)', borderRadius: 9, cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: collapsed ? 0 : 8, fontFamily: 'var(--font-main)', transition: 'all 0.14s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0, height: isMobile ? 'auto' : '100vh', minHeight: '100vh' }}>
        <div style={{ padding: '28px 32px', minHeight: '100%' }}>
          <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>{preloaded.has('dashboard') && <TeacherDashboardTab teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'results' ? 'block' : 'none' }}>{preloaded.has('results') && <TeacherResults teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>{preloaded.has('analytics') && <TeacherAnalytics />}</div>
          <div style={{ display: activeTab === 'grade' ? 'block' : 'none' }}>{preloaded.has('grade') && <GradeEssays />}</div>
          <div style={{ display: activeTab === 'sheets' ? 'block' : 'none' }}>{preloaded.has('sheets') && <AnswerSheets />}</div>
          <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>{preloaded.has('students') && <TeacherStudents />}</div>
          <div style={{ display: activeTab === 'papers' ? 'block' : 'none' }}>{preloaded.has('papers') && <TeacherPapers teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'exams' ? 'block' : 'none' }}>{preloaded.has('exams') && <TeacherExams teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>{preloaded.has('notes') && <TeacherNotes teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>{preloaded.has('notifications') && <TeacherNotifications teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'news' ? 'block' : 'none' }}>{preloaded.has('news') && <TeacherNews teacher={teacher}/>}</div>
          <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>{preloaded.has('messages') && <TeacherMessages teacher={teacher}/>}</div>
        </div>
      </main>
    </div>);
}
/* ═══════════════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════════════ */
function TeacherDashboardTab({ teacher }) {
    const [stats, setStats] = (0, react_1.useState)(null);
    const [recent, setRecent] = (0, react_1.useState)([]);
    const load = (0, react_1.useCallback)(() => {
        Promise.all([
            firebase_js_1.DB.getAll('exam_results'),
            firebase_js_1.DB.getAll('exam_schedule'),
            firebase_js_1.DB.getAll('students'),
            firebase_js_1.DB.getAll('notes'),
        ]).then(([results, schedules, students, notes]) => {
            const now = new Date();
            const live = schedules.filter(s => now >= new Date(s.startDateTime) && now <= new Date(s.endDateTime));
            const total = results.length;
            const avg = total ? (results.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / total).toFixed(1) : 0;
            const passed = results.filter(r => parseFloat(r.percentage) >= 50).length;
            // batch breakdown
            const batchMap = {};
            BATCHES.forEach(b => {
                const bRes = results.filter(r => r.batch === b);
                batchMap[b] = {
                    students: students.filter(s => s.batch === b).length,
                    submissions: bRes.length,
                    avg: bRes.length ? (bRes.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / bRes.length).toFixed(1) : '—',
                };
            });
            setStats({ total, avg, passed, failed: total - passed, live: live.length, notes: notes.length, batchMap });
            setRecent([...results].reverse().slice(0, 5));
        }).catch(err => { console.error('Dashboard load error:', err); setStats({}); setRecent([]); });
    }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!stats)
        return <Loader />;
    return (<div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Welcome, {teacher.name || teacher.username}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Here's the academic overview at BGS Institute.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: 22 }}>
        {[
            { value: stats.total, label: 'Total Submissions', icon: '📊', color: '#2563eb' },
            { value: `${stats.avg}%`, label: 'Overall Average', icon: '📈', color: '#059669' },
            { value: stats.passed, label: 'Passed (≥50%)', icon: '✅', color: '#059669' },
            { value: stats.failed, label: 'Failed (<50%)', icon: '❌', color: '#dc2626' },
            { value: stats.live, label: 'Live Exams 🔴', icon: '⚡', color: '#dc2626' },
            { value: stats.notes, label: 'Study Notes', icon: '📚', color: '#7c3aed' },
        ].map((s, i) => (<div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 6px rgba(37,99,235,0.06)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Batch breakdown */}
        <UI_jsx_1.Card>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📦 Performance by Batch</h3>
          {BATCHES.map((b, i) => {
            const d = stats.batchMap[b];
            const pct = d.avg !== '—' ? parseFloat(d.avg) : 0;
            const color = BATCH_COLORS[b] || '#2563eb';
            return (<div key={b} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color }}>{b}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.submissions} submissions · avg {d.avg}%</span>
                </div>
                <div style={{ height: 7, background: '#e8f0fe', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: 4, transition: 'width 0.5s' }}/>
                </div>
              </div>);
        })}
        </UI_jsx_1.Card>

        {/* Recent submissions */}
        <UI_jsx_1.Card>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🕐 Recent Submissions</h3>
          {recent.length === 0 ? <UI_jsx_1.EmptyState icon="📊" text="No submissions yet"/> : recent.map(r => (<div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{r.name || r.studentName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.examTitle} · {r.batch}</div>
              </div>
              <UI_jsx_1.Badge type={parseFloat(r.percentage) >= 50 ? 'success' : 'danger'}>{r.percentage}</UI_jsx_1.Badge>
            </div>))}
        </UI_jsx_1.Card>
      </div>
    </div>);
}
/* ═══════════════════════════════════════════════
   RESULTS TAB
═══════════════════════════════════════════════ */
function TeacherResults({ teacher }) {
    const [results, setResults] = (0, react_1.useState)(null);
    const [filterBatch, setFilterBatch] = (0, react_1.useState)(teacher?.batch || 'all');
    const [filterExam, setFilterExam] = (0, react_1.useState)('all');
    const [search, setSearch] = (0, react_1.useState)('');
    const toast = (0, ToastContext_jsx_1.useToast)();
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('exam_results').then(setResults).catch(err => { console.error('Results load error:', err); setResults([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!results)
        return <Loader />;
    const batches = ['all', ...BATCHES];
    const exams = ['all', ...new Set(results.map(r => r.examTitle).filter(Boolean))];
    const filtered = results.filter(r => (filterBatch === 'all' || r.batch === filterBatch) &&
        (filterExam === 'all' || r.examTitle === filterExam) &&
        (!search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            r.registerNumber?.toLowerCase().includes(search.toLowerCase())));
    const avg = filtered.length ? (filtered.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / filtered.length).toFixed(1) : 0;
    const passed = filtered.filter(r => parseFloat(r.percentage) >= 50).length;
    async function downloadExcel() {
        if (!filtered.length) {
            toast('No results to export', 'warning');
            return;
        }
        try {
            await (0, excelUtils_js_1.exportResultsExcel)(filtered, 'BGS_Exam_Results.xlsx');
            toast('Downloaded!', 'success');
        }
        catch (err) {
            toast('Download failed: ' + err.message, 'error');
        }
    }
    return (<div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>📋 Exam Results</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{filtered.length} results · avg {avg}% · {passed} passed</p>
        </div>
        <UI_jsx_1.Btn variant="success" size="sm" onClick={downloadExcel}>📥 Export Excel</UI_jsx_1.Btn>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name or reg no…" style={SEARCH_INPUT_STYLE}/>
        <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}>
          {batches.map(b => <option key={b} value={b}>{b === 'all' ? 'All Batches' : b}</option>)}
        </select>
        <select value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}>
          {exams.map(e => <option key={e} value={e}>{e === 'all' ? 'All Exams' : e}</option>)}
        </select>
      </div>

      <UI_jsx_1.Card style={{ padding: 0 }}>
        {filtered.length === 0 ? <div style={{ padding: 32 }}><UI_jsx_1.EmptyState icon="📊" text="No results found"/></div> : (<div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Student</th><th>Reg No.</th><th>Batch</th><th>Exam</th><th>Score</th><th>%</th><th>Grade</th><th>Tab Switches</th><th>Date</th></tr></thead>
              <tbody>
                {filtered.map(r => (<tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{r.name || r.studentName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{r.registerNumber}</td>
                    <td><UI_jsx_1.Badge type="info">{r.batch}</UI_jsx_1.Badge></td>
                    <td style={{ fontSize: 13 }}>{r.examTitle}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{r.score}</td>
                    <td><UI_jsx_1.Badge type={parseFloat(r.percentage) >= 50 ? 'success' : 'danger'}>{r.percentage}</UI_jsx_1.Badge></td>
                    <td style={{ fontWeight: 800, color: parseFloat(r.percentage) >= 50 ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>{r.grade}</td>
                    <td><UI_jsx_1.Badge type={r.tabSwitches > 0 ? 'warning' : 'success'}>{r.tabSwitches || 0}</UI_jsx_1.Badge></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </UI_jsx_1.Card>
    </div>);
}
/* ═══════════════════════════════════════════════
   ANALYTICS TAB
═══════════════════════════════════════════════ */
function TeacherAnalytics() {
    const [stats, setStats] = (0, react_1.useState)(null);
    const load = (0, react_1.useCallback)(() => {
        firebase_js_1.DB.getAll('exam_results').then(results => {
            const total = results.length;
            const avg = total ? (results.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / total).toFixed(1) : 0;
            const passed = results.filter(r => parseFloat(r.percentage) >= 50).length;
            const batchStats = BATCHES.map(b => {
                const bRes = results.filter(r => r.batch === b);
                const bAvg = bRes.length ? (bRes.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / bRes.length).toFixed(1) : '0';
                const bPassed = bRes.filter(r => parseFloat(r.percentage) >= 50).length;
                return { batch: b, count: bRes.length, avg: bAvg, passed: bPassed, failed: bRes.length - bPassed, students: new Set(bRes.map(r => r.registerNumber)).size };
            });
            // grade distribution
            const grades = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
            results.forEach(r => { if (grades[r.grade] !== undefined)
                grades[r.grade]++; });
            setStats({ total, avg, passed, failed: total - passed, batchStats, grades });
        }).catch(err => { console.error('Analytics load error:', err); setStats({}); });
    }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!stats)
        return <Loader />;
    return (<div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>📈 Analytics Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Performance across all batches</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
        {[
            { value: stats.total, label: 'Total Submissions', icon: '📊', color: '#2563eb', bg: '#eff6ff' },
            { value: `${stats.avg}%`, label: 'Overall Average', icon: '📈', color: '#059669', bg: '#f0fdf4' },
            { value: stats.passed, label: 'Passed (≥50%)', icon: '✅', color: '#059669', bg: '#f0fdf4' },
            { value: stats.failed, label: 'Failed (<50%)', icon: '❌', color: '#dc2626', bg: '#fef2f2' },
        ].map((s, i) => (<div key={i} style={{ background: s.bg, border: `1.5px solid ${s.color}22`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Batch performance table */}
        <UI_jsx_1.Card style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 14 }}>📦 Performance by Batch</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Batch</th><th>Students</th><th>Submissions</th><th>Avg</th><th>Pass Rate</th></tr></thead>
            <tbody>
              {stats.batchStats.map(b => (<tr key={b.batch}>
                  <td style={{ fontWeight: 700, color: BATCH_COLORS[b.batch] }}>{b.batch}</td>
                  <td>{b.students}</td>
                  <td>{b.count}</td>
                  <td><UI_jsx_1.Badge type={parseFloat(b.avg) >= 50 ? 'success' : 'danger'}>{b.avg}%</UI_jsx_1.Badge></td>
                  <td style={{ fontSize: 12 }}>{b.count ? `${((b.passed / b.count) * 100).toFixed(0)}%` : '—'}</td>
                </tr>))}
            </tbody>
          </table>
        </UI_jsx_1.Card>

        {/* Grade distribution */}
        <UI_jsx_1.Card>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🎓 Grade Distribution</h3>
          {Object.entries(stats.grades).map(([grade, count]) => {
            const pct = stats.total ? ((count / stats.total) * 100).toFixed(0) : 0;
            const colors = { 'A+': '#059669', A: '#10b981', B: '#2563eb', C: '#d97706', D: '#f59e0b', F: '#dc2626' };
            return (<div key={grade} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: colors[grade] }}>Grade {grade}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{count} students · {pct}%</span>
                </div>
                <div style={{ height: 7, background: '#e8f0fe', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: colors[grade], borderRadius: 4, transition: 'width 0.5s' }}/>
                </div>
              </div>);
        })}
        </UI_jsx_1.Card>
      </div>
    </div>);
}
/* ═══════════════════════════════════════════════
   GRADE ESSAYS TAB
═══════════════════════════════════════════════ */
function GradeEssays() {
    const [sheets, setSheets] = (0, react_1.useState)(null);
    const [selected, setSelected] = (0, react_1.useState)(null);
    const [grades, setGrades] = (0, react_1.useState)({});
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [search, setSearch] = (0, react_1.useState)('');
    const [filter, setFilter] = (0, react_1.useState)('all'); // all | pending | graded
    const toast = (0, ToastContext_jsx_1.useToast)();
    const load = (0, react_1.useCallback)(() => {
        firebase_js_1.DB.getAll('answer_sheets').then(all => setSheets(all.filter(s => s.status === 'Completed'))).catch(err => { console.error('GradeEssays load error:', err); setSheets([]); });
    }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    async function saveGrades() {
        if (!selected)
            return;
        setSaving(true);
        try {
            const gradedAt = new Date().toISOString();
            // 1. Save teacher grades onto the answer sheet
            await firebase_js_1.DB.update(`answer_sheets/${selected.id}`, {
                ...selected, teacherGrades: grades, gradedAt,
            });
            // 2. Recalculate and update the matching exam_result
            try {
                const allResults = await firebase_js_1.DB.getAll('exam_results');
                const result = allResults.find(r => r.registerNumber === selected.studentId &&
                    String(r.examScheduleId) === String(selected.examScheduleId));
                if (result) {
                    // Sum teacher-assigned points (each question max 20 pts as per UI)
                    const teacherPoints = Object.values(grades)
                        .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                    const gradedQCount = Object.keys(grades).length;
                    // Parse existing AUTO score e.g. "3/5" — use the ORIGINAL auto score stored on the result,
                    // not the current one, so re-grading doesn't stack on a previously teacher-adjusted score.
                    const autoScore = result.autoScore || result.score || '0/0';
                    const parts = String(autoScore).split('/');
                    const autoCorrect = parseFloat(parts[0]) || 0;
                    const autoGradable = parseFloat(parts[1]) || 0;
                    // Convert teacher points to same 0-1-per-question scale as auto grading
                    const MAX_PER_Q = 20;
                    const teacherCredit = gradedQCount > 0
                        ? (teacherPoints / (gradedQCount * MAX_PER_Q)) * gradedQCount
                        : 0;
                    const totalCorrect = autoCorrect + teacherCredit;
                    const totalGradable = autoGradable + gradedQCount;
                    const pct = totalGradable > 0
                        ? ((totalCorrect / totalGradable) * 100).toFixed(1)
                        : '0.0';
                    const pn = parseFloat(pct);
                    const grade = pn >= 90 ? 'A+' : pn >= 80 ? 'A' : pn >= 70 ? 'B' : pn >= 60 ? 'C' : pn >= 50 ? 'D' : 'F';
                    const score = `${Number.isInteger(totalCorrect) ? totalCorrect : totalCorrect.toFixed(1)}/${totalGradable}`;
                    // Preserve original auto score for idempotent re-grading
                    await firebase_js_1.DB.patch(`exam_results/${result.id}`, {
                        score, percentage: pct + '%', grade, gradedAt,
                        autoScore: result.autoScore || result.score, // save once, never overwrite
                    });
                }
            }
            catch (_) {
                // Non-fatal: answer sheet is graded even if result sync fails
            }
            toast('Grades saved!', 'success');
            setSelected(null);
            load();
        }
        catch (err) {
            toast(err.message, 'error');
        }
        finally {
            setSaving(false);
        }
    }
    if (!sheets)
        return <Loader />;
    const displayed = sheets.filter(s => (filter === 'all' || (filter === 'graded' ? !!s.gradedAt : !s.gradedAt)) &&
        (!search || s.studentName?.toLowerCase().includes(search.toLowerCase()) || s.examTitle?.toLowerCase().includes(search.toLowerCase())));
    if (selected) {
        const entries = Object.entries(selected.answers || {}).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
        return (<div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>✏️ Grade: {selected.studentName}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selected.examTitle} · {selected.batch}</p>
          </div>
          <UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => setSelected(null)}>← Back</UI_jsx_1.Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
          {[['Student', selected.studentName], ['Exam', selected.examTitle], ['Auto Score', selected.score || '—'], ['Tab Switches', String(selected.tabSwitches || 0)]].map(([k, v]) => (<div key={k} style={{ background: '#f8faff', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 3 }}>{k}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{v}</div>
            </div>))}
        </div>

        <UI_jsx_1.Card>
          {entries.length === 0 ? <UI_jsx_1.EmptyState icon="📝" text="No answers recorded"/> : entries.map(([key, ans]) => (<div key={key} style={{ marginBottom: 18, padding: '14px', background: '#f8faff', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Q{key.replace('q', '')} {ans.questionType && <UI_jsx_1.Badge type="info">{ans.questionType}</UI_jsx_1.Badge>}</span>
                {ans.answeredAt && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{new Date(ans.answeredAt).toLocaleTimeString()}</span>}
              </div>
              {ans.question && <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 500, lineHeight: 1.5 }}>{ans.question}</div>}
              <div style={{ background: 'white', padding: '10px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-primary)', border: '1px solid var(--border)', lineHeight: 1.7, minHeight: 40 }}>
                {typeof ans.answer === 'string' ? ans.answer || '(No answer)' : JSON.stringify(ans.answer)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Points (0–20):</label>
                <input type="number" min={0} max={20} value={grades[key] || ''} onChange={e => setGrades(g => ({ ...g, [key]: e.target.value }))} style={{ width: 80, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-main)', background: '#f8faff', color: 'var(--text-primary)' }}/>
                {grades[key] && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ {grades[key]} pts</span>}
              </div>
            </div>))}
          <UI_jsx_1.Btn variant="success" onClick={saveGrades} disabled={saving} style={{ marginTop: 6 }}>
            {saving ? <UI_jsx_1.Spinner size={14} color="white"/> : '💾 Save All Grades'}
          </UI_jsx_1.Btn>
        </UI_jsx_1.Card>
      </div>);
    }
    return (<div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>✏️ Grade Essays & Coding</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{sheets.length} completed submission{sheets.length !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or exam…" style={SEARCH_INPUT_STYLE}/>
        <div style={{ display: 'flex', background: '#f0f4ff', borderRadius: 9, padding: 3, gap: 2 }}>
          {[['all', 'All'], ['pending', 'Pending'], ['graded', 'Graded']].map(([v, l]) => (<button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: filter === v ? 'white' : 'transparent', color: filter === v ? '#2563eb' : 'var(--text-muted)', fontWeight: filter === v ? 700 : 500, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', boxShadow: filter === v ? '0 2px 6px rgba(37,99,235,0.12)' : 'none', fontFamily: 'var(--font-main)' }}>{l}</button>))}
        </div>
      </div>

      <UI_jsx_1.Card style={{ padding: 0 }}>
        {displayed.length === 0 ? <div style={{ padding: 32 }}><UI_jsx_1.EmptyState icon="✏️" text="No submissions found"/></div> : (<table className="data-table">
            <thead><tr><th>Student</th><th>Batch</th><th>Exam</th><th>Submitted</th><th>Auto Score</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {displayed.map(s => (<tr key={s.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{s.studentName}</td>
                  <td><UI_jsx_1.Badge type="info">{s.batch}</UI_jsx_1.Badge></td>
                  <td style={{ fontSize: 13 }}>{s.examTitle}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{s.score || '—'}</td>
                  <td><UI_jsx_1.Badge type={s.gradedAt ? 'success' : 'warning'}>{s.gradedAt ? 'Graded' : 'Pending'}</UI_jsx_1.Badge></td>
                  <td><UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => { setSelected(s); setGrades(s.teacherGrades || {}); }}>{s.gradedAt ? '✏️ Review' : '✏️ Grade'}</UI_jsx_1.Btn></td>
                </tr>))}
            </tbody>
          </table>)}
      </UI_jsx_1.Card>
    </div>);
}
/* ═══════════════════════════════════════════════
   ANSWER SHEETS TAB
═══════════════════════════════════════════════ */
function AnswerSheets() {
    const [sheets, setSheets] = (0, react_1.useState)(null);
    const [viewSheet, setViewSheet] = (0, react_1.useState)(null);
    const [filterExam, setFilterExam] = (0, react_1.useState)('all');
    const [filterBatch, setFilterBatch] = (0, react_1.useState)('all');
    const [search, setSearch] = (0, react_1.useState)('');
    const load = (0, react_1.useCallback)(() => {
        firebase_js_1.DB.getAll('answer_sheets').then(all => setSheets(all.filter(s => s.status === 'Completed'))).catch(err => { console.error('AnswerSheets load error:', err); setSheets([]); });
    }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!sheets)
        return <Loader />;
    const exams = ['all', ...new Set(sheets.map(s => s.examTitle).filter(Boolean))];
    const filtered = sheets.filter(s => (filterBatch === 'all' || s.batch === filterBatch) &&
        (filterExam === 'all' || s.examTitle === filterExam) &&
        (!search || s.studentName?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.toLowerCase().includes(search.toLowerCase())));
    return (<div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>📄 Answer Sheets</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>View every student's submitted answers</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name or ID…" style={SEARCH_INPUT_STYLE}/>
        <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 9, border: '1.5px solid var(--border)', background: 'white', fontFamily: 'var(--font-main)' }}>
          <option value="all">All Batches</option>
          {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 9, border: '1.5px solid var(--border)', background: 'white', fontFamily: 'var(--font-main)' }}>
          {exams.map(e => <option key={e} value={e}>{e === 'all' ? 'All Exams' : e}</option>)}
        </select>
      </div>

      <UI_jsx_1.Card style={{ padding: 0 }}>
        {filtered.length === 0 ? <div style={{ padding: 32 }}><UI_jsx_1.EmptyState icon="📄" text="No answer sheets found"/></div> : (<div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Student</th><th>Reg No.</th><th>Batch</th><th>Exam</th><th>Score</th><th>Grade</th><th>Submitted</th><th>Tab Switches</th><th>View</th></tr></thead>
              <tbody>
                {filtered.map(s => (<tr key={s.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{s.studentName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{s.studentId}</td>
                    <td><UI_jsx_1.Badge type="info">{s.batch}</UI_jsx_1.Badge></td>
                    <td style={{ fontSize: 13 }}>{s.examTitle}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{s.score || '—'}</td>
                    <td style={{ fontWeight: 800, color: parseFloat(s.percentage) >= 50 ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>{s.grade || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}</td>
                    <td><UI_jsx_1.Badge type={s.tabSwitches > 0 ? 'warning' : 'success'}>{s.tabSwitches || 0}</UI_jsx_1.Badge></td>
                    <td><UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => setViewSheet(s)}>📄 View</UI_jsx_1.Btn></td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </UI_jsx_1.Card>

      {/* Answer Sheet Modal */}
      <UI_jsx_1.Modal open={!!viewSheet} onClose={() => setViewSheet(null)} title={`📄 ${viewSheet?.studentName} — ${viewSheet?.examTitle}`} wide>
        {viewSheet && (<div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
              {[
                ['Student', viewSheet.studentName], ['Register No', viewSheet.studentId],
                ['Batch', viewSheet.batch], ['Exam', viewSheet.examTitle],
                ['Score', viewSheet.score || '—'], ['Grade', viewSheet.grade || '—'],
                ['Tab Switches', String(viewSheet.tabSwitches || 0)],
                ['Submitted', viewSheet.submittedAt ? new Date(viewSheet.submittedAt).toLocaleString() : '—'],
                ['Graded', viewSheet.gradedAt ? '✅ Yes' : '⏳ Pending'],
            ].map(([k, v]) => (<div key={k} style={{ background: '#f8faff', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{v}</div>
                </div>))}
            </div>
            <h4 style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Answers</h4>
            {viewSheet.answers && Object.keys(viewSheet.answers).length > 0 ? (<div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(viewSheet.answers)
                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                    .map(([key, ans]) => (<div key={key} style={{ background: '#f8faff', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>Q{key.replace('q', '')}</span>
                        {ans.answeredAt && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(ans.answeredAt).toLocaleTimeString()}</span>}
                      </div>
                      {ans.question && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{ans.question}</div>}
                      <div style={{ background: 'white', padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                        {typeof ans.answer === 'string' ? ans.answer || '(No answer)' : JSON.stringify(ans.answer)}
                      </div>
                      {viewSheet.teacherGrades?.[key] && (<div style={{ marginTop: 6, fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✅ Teacher grade: {viewSheet.teacherGrades[key]} pts</div>)}
                    </div>))}
              </div>) : <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '14px 0' }}>No answers recorded.</p>}
          </div>)}
      </UI_jsx_1.Modal>
    </div>);
}
/* ═══════════════════════════════════════════════
   STUDY NOTES TAB — Teachers can upload notes
═══════════════════════════════════════════════ */
function TeacherNotes({ teacher }) {
    const [notes, setNotes] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({ title: '', subject: '', description: '', batch: teacher?.batch || 'All Batches', semester: '' });
    const [file, setFile] = (0, react_1.useState)(null);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [delId, setDelId] = (0, react_1.useState)(null);
    const [search, setSearch] = (0, react_1.useState)('');
    const fileRef = (0, react_1.useRef)();
    const toast = (0, ToastContext_jsx_1.useToast)();
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('notes').then(setNotes).catch(err => { console.error('Notes load error:', err); setNotes([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    function fIco(name) {
        if (!name)
            return '📄';
        if (name.endsWith('.pdf'))
            return '📕';
        if (name.match(/\.pptx?$/))
            return '📊';
        if (name.match(/\.docx?$/))
            return '📝';
        if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            return '🖼️';
        return '📄';
    }
    function fmt(b) {
        if (!b)
            return '';
        return b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
    }
    async function handleUpload() {
        if (!form.title.trim()) {
            toast('Title is required', 'warning');
            return;
        }
        if (!form.batch) {
            toast('Select a batch', 'warning');
            return;
        }
        if (!file) {
            toast('Please select a file to upload', 'warning');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast('File too large (max 10 MB)', 'error');
            return;
        }
        setSaving(true);
        try {
            /* ── Firebase Storage path ── */
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            // base64 encode — works without Firebase Storage, max 10MB
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });
            await firebase_js_1.DB.save('notes', {
                ...form,
                uploadedBy: teacher.name || teacher.username,
                teacherId: teacher.id || '',
                fileUrl: base64Data,
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
            });
            toast('Note uploaded successfully!', 'success');
            setForm({ title: '', subject: '', description: '', batch: teacher?.batch || 'All Batches', semester: '' });
            setFile(null);
            if (fileRef.current)
                fileRef.current.value = '';
            load();
        }
        catch (err) {
            toast('Upload failed: ' + err.message, 'error');
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDelete(note) {
        try {
            await firebase_js_1.DB.delete(`notes/${note.id}`);
            toast('Note deleted', 'success');
            load();
        }
        catch (err) {
            toast('Delete failed: ' + err.message, 'error');
        }
        finally {
            setDelId(null);
        }
    }
    if (!notes)
        return <Loader />;
    const displayed = notes.filter(n => !search ||
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.subject?.toLowerCase().includes(search.toLowerCase()));
    return (<div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>📚 Study Notes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Upload materials for your students</p>
      </div>

      {/* Upload form */}
      <UI_jsx_1.Card style={{ marginBottom: 18 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📤 Upload New Note</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <UI_jsx_1.Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Unit 1 Notes" style={{ marginBottom: 0 }}/>
          <UI_jsx_1.Input label="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Data Science" style={{ marginBottom: 0 }}/>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch *</label>
            <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-main)', background: '#f8faff' }}>
              {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semester</label>
            <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-main)', background: '#f8faff' }}>
              <option value="">All Semesters</option>
              {SEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <UI_jsx_1.Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description…" rows={2} style={{ marginBottom: 0 }}/>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File * (PDF, PPTX, DOCX, Images — max 10MB)</label>
            <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp" onChange={e => setFile(e.target.files[0] || null)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-main)', background: '#f8faff' }}/>
            {file && (<div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid rgba(5,150,105,0.2)' }}>
                <span style={{ fontSize: 18 }}>{fIco(file.name)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#047857' }}>{file.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({fmt(file.size)})</span>
              </div>)}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <UI_jsx_1.Btn variant="success" onClick={handleUpload} disabled={saving}>
            {saving ? <><UI_jsx_1.Spinner size={14} color="white"/> Uploading…</> : '📤 Upload Note'}
          </UI_jsx_1.Btn>
        </div>
      </UI_jsx_1.Card>

      {/* Notes list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14 }}>All Notes ({notes.length})</h3>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ ...SEARCH_INPUT_STYLE, flex: 'none', width: 220 }}/>
      </div>

      {displayed.length === 0 ? (<UI_jsx_1.Card><UI_jsx_1.EmptyState icon="📚" text="No notes uploaded yet"/></UI_jsx_1.Card>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map(n => (<div key={n.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(37,99,235,0.05)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(37,99,235,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{fIco(n.fileName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {n.title} <UI_jsx_1.Badge type="info">{n.batch}</UI_jsx_1.Badge> {n.semester && <UI_jsx_1.Badge type="success">{n.semester}</UI_jsx_1.Badge>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {n.subject || 'General'} · {n.fileName || 'File'} {n.fileSize ? `(${fmt(n.fileSize)})` : ''} · {new Date(n.uploadedAt).toLocaleDateString()}
                  {n.uploadedBy && <span> · by {n.uploadedBy}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {n.fileUrl && <UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => dlFile(n.fileUrl, n.fileName)}>📥 Download</UI_jsx_1.Btn>}
                <UI_jsx_1.Btn variant="danger" size="sm" onClick={() => setDelId(n.id)}>🗑️</UI_jsx_1.Btn>
              </div>
            </div>))}
        </div>)}

      {/* Delete confirm */}
      <UI_jsx_1.Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Note">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>Are you sure you want to delete this note? This cannot be undone.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <UI_jsx_1.Btn variant="ghost" onClick={() => setDelId(null)}>Cancel</UI_jsx_1.Btn>
          <UI_jsx_1.Btn variant="danger" onClick={() => { const n = notes.find(x => x.id === delId); if (n)
        handleDelete(n); }}>Delete</UI_jsx_1.Btn>
        </div>
      </UI_jsx_1.Modal>
    </div>);
}
/* ═══════════════════════════════════════════════
   NOTIFICATIONS TAB — Teachers can send notifications
═══════════════════════════════════════════════ */
function TeacherNotifications({ teacher }) {
    const [notifs, setNotifs] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({ title: '', message: '', batch: teacher?.batch || 'All Batches', type: 'Info' });
    const [saving, setSaving] = (0, react_1.useState)(false);
    const toast = (0, ToastContext_jsx_1.useToast)();
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('notifications').then(setNotifs).catch(err => { console.error('Notifications load error:', err); setNotifs([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    async function sendNotif() {
        if (!form.title.trim() || !form.message.trim()) {
            toast('Fill all fields', 'warning');
            return;
        }
        setSaving(true);
        try {
            await firebase_js_1.DB.save('notifications', {
                ...form,
                sentBy: teacher.name || teacher.username,
                createdAt: new Date().toISOString(),
            });
            toast('Notification sent!', 'success');
            setForm({ title: '', message: '', batch: teacher?.batch || 'All Batches', type: 'Info' });
            load();
        }
        catch (err) {
            toast('Error: ' + err.message, 'error');
        }
        finally {
            setSaving(false);
        }
    }
    async function deleteNotif(id) {
        try {
            await firebase_js_1.DB.delete(`notifications/${id}`);
            toast('Deleted', 'success');
            load();
        }
        catch (err) {
            toast(err.message, 'error');
        }
    }
    if (!notifs)
        return <Loader />;
    return (<div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>🔔 Notifications</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Send announcements to students</p>
      </div>

      <UI_jsx_1.Card style={{ marginBottom: 18 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📢 Send Notification</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <UI_jsx_1.Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title" style={{ marginBottom: 0 }}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch</label>
              <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-main)', background: '#f8faff' }}>
                {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-main)', background: '#f8faff' }}>
                {['Info', 'Warning', 'Alert'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <UI_jsx_1.Textarea label="Message" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your notification message…" rows={3} style={{ marginBottom: 0 }}/>
          </div>
        </div>
        <UI_jsx_1.Btn variant="primary" onClick={sendNotif} disabled={saving}>
          {saving ? <UI_jsx_1.Spinner size={14} color="white"/> : '🔔 Send Notification'}
        </UI_jsx_1.Btn>
      </UI_jsx_1.Card>

      <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>All Notifications ({notifs.length})</h3>
      {notifs.length === 0 ? <UI_jsx_1.Card><UI_jsx_1.EmptyState icon="🔔" text="No notifications yet"/></UI_jsx_1.Card> : (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...notifs].reverse().map(n => (<div key={n.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px', boxShadow: '0 1px 4px rgba(37,99,235,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{n.title}</span>
                  <UI_jsx_1.Badge type={n.type === 'Warning' ? 'warning' : n.type === 'Alert' ? 'danger' : 'info'}>{n.type || 'Info'}</UI_jsx_1.Badge>
                  <UI_jsx_1.Badge type="info">{n.batch}</UI_jsx_1.Badge>
                </div>
                <UI_jsx_1.Btn variant="danger" size="sm" onClick={() => deleteNotif(n.id)}>🗑️</UI_jsx_1.Btn>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{n.message}</p>
              <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {new Date(n.createdAt).toLocaleString()}{n.sentBy ? ` · by ${n.sentBy}` : ''}
              </small>
            </div>))}
        </div>)}
    </div>);
}
/* ═══════════════════════════════════════════════
   NEWS TAB — Teachers can post & view news
═══════════════════════════════════════════════ */
function TeacherNews({ teacher }) {
    const [news, setNews] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({ title: '', content: '' });
    const [saving, setSaving] = (0, react_1.useState)(false);
    const toast = (0, ToastContext_jsx_1.useToast)();
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('news').then(setNews).catch(err => { console.error('News load error:', err); setNews([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    async function postNews() {
        if (!form.title.trim() || !form.content.trim()) {
            toast('Fill all fields', 'warning');
            return;
        }
        setSaving(true);
        try {
            await firebase_js_1.DB.save('news', {
                ...form,
                postedBy: teacher.name || teacher.username,
                createdAt: new Date().toISOString(),
            });
            toast('News posted!', 'success');
            setForm({ title: '', content: '' });
            load();
        }
        catch (err) {
            toast('Error: ' + err.message, 'error');
        }
        finally {
            setSaving(false);
        }
    }
    async function deleteNews(id) {
        try {
            await firebase_js_1.DB.delete(`news/${id}`);
            toast('Deleted', 'success');
            load();
        }
        catch (err) {
            toast(err.message, 'error');
        }
    }
    if (!news)
        return <Loader />;
    return (<div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>📰 News & Announcements</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Post updates visible to all students</p>
      </div>

      <UI_jsx_1.Card style={{ marginBottom: 18 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>✍️ Post News</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <UI_jsx_1.Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="News headline" style={{ marginBottom: 0 }}/>
          <UI_jsx_1.Textarea label="Content" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Write the full news content…" rows={4} style={{ marginBottom: 0 }}/>
          <UI_jsx_1.Btn variant="primary" onClick={postNews} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? <UI_jsx_1.Spinner size={14} color="white"/> : '📰 Post News'}
          </UI_jsx_1.Btn>
        </div>
      </UI_jsx_1.Card>

      <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>All News ({news.length})</h3>
      {news.length === 0 ? <UI_jsx_1.Card><UI_jsx_1.EmptyState icon="📰" text="No news posted yet"/></UI_jsx_1.Card> : (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...news].reverse().map(n => (<div key={n.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(37,99,235,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{n.title}</div>
                <UI_jsx_1.Btn variant="danger" size="sm" onClick={() => deleteNews(n.id)}>🗑️</UI_jsx_1.Btn>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>{n.content}</p>
              <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Posted {new Date(n.createdAt).toLocaleDateString()}{n.postedBy ? ` · by ${n.postedBy}` : ''}
              </small>
            </div>))}
        </div>)}
    </div>);
}
/* ═══════════════════════════════════════════════
   TEACHER: STUDENTS (view only)
═══════════════════════════════════════════════ */
function TeacherStudents() {
    const [students, setStudents] = (0, react_1.useState)(null);
    const [search, setSearch] = (0, react_1.useState)('');
    const [batch, setBatch] = (0, react_1.useState)('all');
    const BATCHES_T = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5'];
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('students').then(setStudents).catch(err => { console.error('Students load error:', err); setStudents([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!students)
        return <Loader />;
    const filtered = students.filter(s => (batch === 'all' || s.batch === batch) &&
        (!search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.registerNumber?.toLowerCase().includes(search.toLowerCase())));
    return (<div className="fade-in">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>👨‍🎓 Students ({students.length})</h1>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or reg no…" style={SEARCH_INPUT_STYLE}/>
        <select value={batch} onChange={e => setBatch(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', fontFamily: 'var(--font-main)' }}>
          <option value="all">All Batches</option>
          {BATCHES_T.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <UI_jsx_1.Card style={{ padding: 0 }}>
        {filtered.length === 0 ? <div style={{ padding: 32 }}><UI_jsx_1.EmptyState icon="👨‍🎓" text="No students found"/></div> : (<div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Reg No.</th><th>Batch</th><th>Email</th><th>Phone</th></tr></thead>
              <tbody>
                {filtered.map(s => (<tr key={s.id}>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{s.registerNumber}</td>
                    <td><UI_jsx_1.Badge type="info">{s.batch}</UI_jsx_1.Badge></td>
                    <td style={{ fontSize: 12 }}>{s.email || '—'}</td>
                    <td style={{ fontSize: 12 }}>{s.phone || '—'}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </UI_jsx_1.Card>
    </div>);
}
/* ═══════════════════════════════════════════════
   TEACHER: PAPERS (view only)
═══════════════════════════════════════════════ */
function TeacherPapers() {
    const [papers, setPapers] = (0, react_1.useState)(null);
    const [active, setActive] = (0, react_1.useState)(null);
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('papers').then(setPapers).catch(err => { console.error('Papers load error:', err); setPapers([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!papers)
        return <Loader />;
    if (active) {
        const qs = active.questions || [];
        return (<div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 3 }}>📝 {active.title || active.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{qs.length} questions</p>
          </div>
          <UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => setActive(null)}>← Back</UI_jsx_1.Btn>
        </div>
        <UI_jsx_1.Card style={{ padding: 0 }}>
          {qs.length === 0 ? <div style={{ padding: 28 }}><UI_jsx_1.EmptyState icon="📝" text="No questions"/></div> : (<table className="data-table">
              <thead><tr><th>#</th><th>Question</th><th>Type</th></tr></thead>
              <tbody>
                {qs.map((q, i) => (<tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontSize: 13, maxWidth: 400 }}>{q.question}</td>
                    <td><UI_jsx_1.Badge type="info">{q.type || 'mcq'}</UI_jsx_1.Badge></td>
                  </tr>))}
              </tbody>
            </table>)}
        </UI_jsx_1.Card>
      </div>);
    }
    return (<div className="fade-in">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>📝 Question Papers ({papers.length})</h1>
      <UI_jsx_1.Card style={{ padding: 0 }}>
        {papers.length === 0 ? <div style={{ padding: 28 }}><UI_jsx_1.EmptyState icon="📝" text="No papers yet"/></div> : (<table className="data-table">
            <thead><tr><th>Paper Name</th><th>Questions</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {papers.map(p => (<tr key={p.id}>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{p.title || p.name}</td>
                  <td>{(p.questions || []).length}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                  <td><UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => setActive(p)}>👁 View</UI_jsx_1.Btn></td>
                </tr>))}
            </tbody>
          </table>)}
      </UI_jsx_1.Card>
    </div>);
}
/* ═══════════════════════════════════════════════
   TEACHER: EXAM SCHEDULE (view only)
═══════════════════════════════════════════════ */
function TeacherExams() {
    const [exams, setExams] = (0, react_1.useState)(null);
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('exam_schedule').then(setExams).catch(err => { console.error('Exams load error:', err); setExams([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    if (!exams)
        return <Loader />;
    const now = new Date();
    const live = exams.filter(e => now >= new Date(e.startDateTime) && now <= new Date(e.endDateTime));
    const upcoming = exams.filter(e => new Date(e.startDateTime) > now);
    const past = exams.filter(e => new Date(e.endDateTime) < now);
    const ExamList = ({ items, label, color }) => (<UI_jsx_1.Card style={{ marginBottom: 14, border: `1.5px solid ${color}22` }}>
      <h3 style={{ fontWeight: 700, fontSize: 14, color, marginBottom: 12 }}>{label} ({items.length})</h3>
      {items.length === 0 ? <UI_jsx_1.EmptyState icon="🗓️" text="None"/> : items.map(e => (<div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.batch} · {e.duration} min · {new Date(e.startDateTime).toLocaleString()}</div>
          </div>
          <UI_jsx_1.Badge type={label.includes('Live') ? 'danger' : label.includes('Upcoming') ? 'info' : 'success'}>{label.split(' ')[0]}</UI_jsx_1.Badge>
        </div>))}
    </UI_jsx_1.Card>);
    return (<div className="fade-in">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🗓️ Exam Schedule</h1>
      <ExamList items={live} label="🔴 Live Exams" color="#dc2626"/>
      <ExamList items={upcoming} label="⏳ Upcoming Exams" color="#2563eb"/>
      <ExamList items={past} label="✅ Past Exams" color="#059669"/>
    </div>);
}
/* ═══════════════════════════════════════════════
   TEACHER: MESSAGES (view + reply)
═══════════════════════════════════════════════ */
function TeacherMessages() {
    const [messages, setMessages] = (0, react_1.useState)(null);
    const [replyModal, setReplyModal] = (0, react_1.useState)(null);
    const [replyText, setReplyText] = (0, react_1.useState)('');
    const toast = (0, ToastContext_jsx_1.useToast)();
    const load = (0, react_1.useCallback)(() => { firebase_js_1.DB.getAll('student_messages').then(setMessages).catch(err => { console.error('Messages load error:', err); setMessages([]); }); }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    async function sendReply() {
        if (!replyText.trim()) {
            toast('Write a reply', 'warning');
            return;
        }
        await firebase_js_1.DB.update(`student_messages/${replyModal.id}`, { ...replyModal, reply: replyText, status: 'Replied', repliedAt: new Date().toISOString() });
        toast('Reply sent!', 'success');
        setReplyModal(null);
        setReplyText('');
        load();
    }
    if (!messages)
        return <Loader />;
    return (<div className="fade-in">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>💬 Student Messages ({messages.length})</h1>
      <UI_jsx_1.Card style={{ padding: 0 }}>
        {messages.length === 0 ? <div style={{ padding: 28 }}><UI_jsx_1.EmptyState icon="💬" text="No messages"/></div> : messages.map(m => (<div key={m.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{m.subject}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>{m.studentName} · {m.batch}</span>
              </div>
              <UI_jsx_1.Badge type={m.status === 'Replied' ? 'success' : 'warning'}>{m.status || 'Pending'}</UI_jsx_1.Badge>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>{m.message}</p>
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(m.sentAt).toLocaleString()}</small>
            {m.reply ? (<div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(5,150,105,0.07)', borderRadius: 8, borderLeft: '3px solid var(--success)' }}>
                <strong style={{ fontSize: 12, color: '#059669' }}>Your reply: </strong>
                <span style={{ fontSize: 13 }}>{m.reply}</span>
              </div>) : (<UI_jsx_1.Btn variant="ghost" size="sm" onClick={() => { setReplyModal(m); setReplyText(''); }} style={{ marginTop: 8 }}>↩ Reply</UI_jsx_1.Btn>)}
          </div>))}
      </UI_jsx_1.Card>
      <UI_jsx_1.Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Message">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Subject: <strong>{replyModal?.subject}</strong></p>
        <UI_jsx_1.Textarea label="Reply" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply…" rows={4}/>
        <div style={{ display: 'flex', gap: 12 }}>
          <UI_jsx_1.Btn variant="ghost" onClick={() => setReplyModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</UI_jsx_1.Btn>
          <UI_jsx_1.Btn variant="primary" onClick={sendReply} style={{ flex: 1, justifyContent: 'center' }}>Send Reply</UI_jsx_1.Btn>
        </div>
      </UI_jsx_1.Modal>
    </div>);
}
