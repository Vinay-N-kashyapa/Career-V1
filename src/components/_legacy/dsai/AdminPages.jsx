import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DB } from '../firebase.js';
import { Btn, Card, Input, Select, Modal, Spinner, EmptyState, Badge, ConfirmModal, Textarea } from '../components/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import dsaiLogo from '../assets/dsaiLogo.js';
import CodingQuestionForm from './CodingQuestionForm.jsx';
import { downloadQuestionTemplate, importQuestionsFromExcel, exportResultsExcel, exportStudentsList, importStudentsFromExcel } from '../utils/excelUtils.js';

/* ── Constants ── */
const BATCHES      = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5'];
const ALL_BATCHES  = ['All Batches', ...BATCHES];
const SEMS         = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
const BATCH_COLORS = { 'Batch 1':'#2563eb', 'Batch 2':'#059669', 'Batch 3':'#7c3aed', 'Batch 4':'#d97706', 'Batch 5':'#dc2626' };

/* ── Shared loader ── */
const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:280, flexDirection:'column', gap:14 }}>
    <Spinner size={34} />
    <p style={{ color:'var(--text-muted)', fontSize:13 }}>Loading…</p>
  </div>
);


/* ══════════════════════════════════════════════
   ADMIN LOGIN
══════════════════════════════════════════════ */
export function AdminLogin({ onBack, onSuccess }) {
  const [user,    setUser]    = useState('');
  const [pass,    setPass]    = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleLogin(e) {
    e.preventDefault();
    if (!user || !pass) { toast('Please fill all fields', 'warning'); return; }
    setLoading(true);
    try {
      const settings = await DB.getAll('admin_settings');
      const creds    = settings.find(s => s.type === 'credentials');
      // Explicit null-check: if no credentials record exists (fresh install),
      // fall back to defaults — but never silently accept any input.
      const validUser = (creds && creds.username) ? creds.username : 'admin';
      const validPass = (creds && creds.password) ? creds.password : 'admin123';
      if (user.trim() !== validUser || pass !== validPass) {
        toast('Invalid credentials', 'error');
        return;
      }
      onSuccess({ username: user.trim() });
    } catch (err) { toast('Login error: ' + err.message, 'error'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg-primary)' }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at 50% 30%, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
      <Card style={{ maxWidth:420, width:'100%', position:'relative', zIndex:1, padding:'40px 36px', boxShadow:'0 8px 40px rgba(37,99,235,0.12)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src={dsaiLogo} alt="DSAI" style={{ width:68, height:68, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(37,99,235,0.2)', display:'block', margin:'0 auto 16px', boxShadow:'0 4px 16px rgba(37,99,235,0.14)' }} />
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>Admin Portal</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:6, fontWeight:500 }}>BGS Institute of Management · DSAI</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Username" value={user} onChange={e => setUser(e.target.value)} placeholder="admin" autoFocus />
          <Input label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
          <Btn type="submit" variant="primary" style={{ width:'100%', justifyContent:'center', marginBottom:10, borderRadius:10, padding:'12px' }} disabled={loading}>
            {loading ? <Spinner size={16} color="white" /> : '🔐 Sign In'}
          </Btn>
        </form>
        <Btn variant="ghost" style={{ width:'100%', justifyContent:'center' }} onClick={onBack}>← Back to Home</Btn>
        <div style={{ marginTop:18, padding:'10px 14px', background:'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.14)', borderRadius:9, textAlign:'center' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)' }}>Default: <strong>admin</strong> / <strong>admin123</strong></p>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ADMIN DASHBOARD SHELL
══════════════════════════════════════════════ */
export function AdminDashboard({ admin, onLogout }) {
  const [tab,       setTab]       = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  // Preload: track which tabs have been hovered to start loading early
  const [preloaded, setPreloaded] = useState(new Set(['dashboard']));
  // Render all hovered tabs (hidden) so data starts loading on hover
  function handleTabHover(id) {
    setPreloaded(prev => { if (prev.has(id)) return prev; const n = new Set(prev); n.add(id); return n; });
  }

  const navItems = [
    { id:'dashboard',     icon:'📊', label:'Dashboard'      },
    { id:'students',      icon:'👨‍🎓', label:'Students'       },
    { id:'teachers',      icon:'👨‍🏫', label:'Teachers'       },
    { id:'papers',        icon:'📋', label:'Papers'         },
    { id:'exams',         icon:'📝', label:'Exam Schedule'  },
    { id:'results',       icon:'📈', label:'Results'        },
    { id:'notes',         icon:'📖', label:'Notes'          },
    { id:'notifications', icon:'🔔', label:'Notifications'  },
    { id:'news',          icon:'📰', label:'News'           },
    { id:'messages',      icon:'💬', label:'Messages'       },
    { id:'settings',      icon:'⚙️', label:'Settings'       },
    { id:'promote',       icon:'🎓', label:'Promote/Demote' },
  ];

  const W = collapsed ? 64 : 222;

  return (
    /* Outer wrapper: fills full viewport, no page-level scroll */
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-primary)' }}>

      {/* ── Sidebar ── fixed height, its own scroll */}
      <aside style={{
        width: W,
        flexShrink: 0,
        background: 'white',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '2px 0 14px rgba(37,99,235,0.07)',
        position: 'relative',
      }}>

        {/* Logo + collapse toggle */}
        <div style={{ padding:'14px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent: collapsed?'center':'space-between', minHeight:62, flexShrink:0 }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
              <img src={dsaiLogo} alt="DSAI" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'1.5px solid rgba(37,99,235,0.2)' }} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>BGS Admin</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', whiteSpace:'nowrap' }}>Management Portal</div>
              </div>
            </div>
          )}
          {collapsed && (
            <img src={dsaiLogo} alt="DSAI" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'1.5px solid rgba(37,99,235,0.2)' }} />
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.12)', cursor:'pointer', color:'var(--accent)', fontSize:12, padding:'5px 7px', flexShrink:0, borderRadius:7, lineHeight:1, fontWeight:700, marginLeft: collapsed?0:6 }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Admin info */}
        {!collapsed && (
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', background:'#f8faff', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'white', flexShrink:0, fontWeight:800, boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}>
                {admin.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin.username}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:500 }}>Administrator</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex:1, padding:'8px 7px', overflowY:'auto' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              title={collapsed ? item.label : ''}
              style={{
                width:'100%', display:'flex', alignItems:'center',
                gap: collapsed ? 0 : 9,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '10px 11px',
                background: tab===item.id ? 'rgba(37,99,235,0.09)' : 'transparent',
                border:     tab===item.id ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent',
                borderRadius: 9, cursor:'pointer',
                color: tab===item.id ? '#1d4ed8' : 'var(--text-secondary)',
                fontWeight: tab===item.id ? 700 : 400,
                fontSize: 13, textAlign:'left', transition:'all 0.14s', marginBottom:2,
                fontFamily:'var(--font-main)', flexShrink:0,
              }}
              onMouseEnter={e => { handleTabHover(item.id); if (tab!==item.id) e.currentTarget.style.background='rgba(37,99,235,0.05)'; }}
              onMouseLeave={e => { if (tab!==item.id) e.currentTarget.style.background='transparent'; }}
            >
              <span style={{ fontSize:17, flexShrink:0, lineHeight:1 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding:'9px 7px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <button
            onClick={onLogout}
            title={collapsed ? 'Logout' : ''}
            style={{ width:'100%', padding: collapsed?'11px 0':'10px 11px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.14)', borderRadius:9, cursor:'pointer', color:'#dc2626', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent: collapsed?'center':'flex-start', gap: collapsed?0:8, fontFamily:'var(--font-main)', transition:'all 0.14s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(220,38,38,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(220,38,38,0.06)'; }}
          >
            <span style={{ fontSize:17, flexShrink:0 }}>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content: fills remaining space, scrolls independently ── */}
      <main style={{ flex:1, overflowY:'auto', overflowX:'hidden', minWidth:0, height:'100vh', padding:0 }}>
        <div style={{ padding:'28px 32px', minHeight:'100%' }}>
          {/* Active tab */}
          <div style={{ display: tab==='dashboard'     ? 'block':'none' }}>{preloaded.has('dashboard')     && <DashboardTab />}</div>
          <div style={{ display: tab==='students'      ? 'block':'none' }}>{preloaded.has('students')      && <StudentsTab />}</div>
          <div style={{ display: tab==='teachers'      ? 'block':'none' }}>{preloaded.has('teachers')      && <TeachersTab />}</div>
          <div style={{ display: tab==='papers'        ? 'block':'none' }}>{preloaded.has('papers')        && <PapersTab />}</div>
          <div style={{ display: tab==='exams'         ? 'block':'none' }}>{preloaded.has('exams')         && <ExamScheduleTab />}</div>
          <div style={{ display: tab==='results'       ? 'block':'none' }}>{preloaded.has('results')       && <ResultsTab />}</div>
          <div style={{ display: tab==='notes'         ? 'block':'none' }}>{preloaded.has('notes')         && <NotesTab />}</div>
          <div style={{ display: tab==='notifications' ? 'block':'none' }}>{preloaded.has('notifications') && <NotificationsTab />}</div>
          <div style={{ display: tab==='news'          ? 'block':'none' }}>{preloaded.has('news')          && <NewsTab />}</div>
          <div style={{ display: tab==='messages'      ? 'block':'none' }}>{preloaded.has('messages')      && <MessagesTab />}</div>
          <div style={{ display: tab==='settings'      ? 'block':'none' }}>{preloaded.has('settings')      && <SettingsTab admin={admin} />}</div>
          <div style={{ display: tab==='promote'       ? 'block':'none' }}>{preloaded.has('promote')       && <PromoteTab />}</div>
        </div>
      </main>

    </div>
  );
}

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
function DashboardTab() {
  const [stats,         setStats]         = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const toast = useToast();

  const load = useCallback(() => {
    Promise.all([
      DB.getAll('students'), DB.getAll('exam_results'),
      DB.getAll('papers'),   DB.getAll('exam_schedule'),
      DB.getAll('teachers'), DB.getAll('notifications'),
    ]).then(([students, results, papers, schedules, teachers, notifs]) => {
      const now     = new Date();
      const live    = schedules.filter(s => now >= new Date(s.startDateTime) && now <= new Date(s.endDateTime));
      const upcoming= schedules.filter(s => new Date(s.startDateTime) > now);
      const batchCounts = {};
      BATCHES.forEach(b => { batchCounts[b] = students.filter(s => s.batch === b).length; });
      const avgScore = results.length
        ? (results.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / results.length).toFixed(1)
        : 0;
      setStats({ students:students.length, results:results.length, papers:papers.length, live:live.length, upcoming:upcoming.length, teachers:teachers.length, notifs:notifs.length, batchCounts, avgScore });
      setRecentResults([...results].reverse().slice(0, 6));
    }).catch(err => {
      // W2 fix: surface DB errors instead of spinning forever
      toast('Failed to load dashboard: ' + err.message, 'error');
      setStats({});
    });
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  if (!stats) return <Loader />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px', marginBottom:4 }}>Welcome back! 👋</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Here's what's happening at BGS Institute today.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:12, marginBottom:22 }}>
        {[
          { value:stats.students,        label:'Students',        icon:'🎓', color:'#2563eb' },
          { value:stats.teachers,        label:'Teachers',        icon:'👨‍🏫', color:'#059669' },
          { value:stats.papers,          label:'Papers',          icon:'📋', color:'#7c3aed' },
          { value:stats.results,         label:'Submissions',     icon:'📊', color:'#d97706' },
          { value:`${stats.avgScore}%`,  label:'Avg Score',       icon:'📈', color:'#2563eb' },
          { value:stats.live,            label:'Live Now 🔴',     icon:'⚡', color:'#dc2626' },
        ].map((s,i) => (
          <div key={i} style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 6px rgba(37,99,235,0.06)' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
        <Card>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>👥 Students per Batch</h3>
          {BATCHES.map((b,i) => {
            const count = stats.batchCounts[b] || 0;
            const pct   = stats.students ? Math.round((count/stats.students)*100) : 0;
            const colors = ['#2563eb','#059669','#7c3aed','#d97706','#dc2626'];
            return (
              <div key={b} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{b}</span>
                  <span style={{ color:'var(--text-muted)' }}>{count} · {pct}%</span>
                </div>
                <div style={{ height:7, background:'#e8f0fe', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${colors[i]},${colors[i]}99)`, borderRadius:4, transition:'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📋 Quick Status</h3>
          {[
            { icon:'🔴', label:'Live Exams',        value:stats.live,     color:'#dc2626', bg:'rgba(220,38,38,0.07)'  },
            { icon:'⏳', label:'Upcoming Exams',    value:stats.upcoming, color:'#d97706', bg:'rgba(217,119,6,0.07)'  },
            { icon:'🔔', label:'Notifications Sent',value:stats.notifs,   color:'#2563eb', bg:'rgba(37,99,235,0.07)'  },
            { icon:'📋', label:'Question Papers',   value:stats.papers,   color:'#7c3aed', bg:'rgba(124,58,237,0.07)' },
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:s.bg, borderRadius:9, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ flex:1, fontSize:13, fontWeight:500, color:'var(--text-secondary)' }}>{s.label}</span>
              <span style={{ fontWeight:800, fontSize:16, color:s.color }}>{s.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {recentResults.length > 0 && (
        <Card>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🕐 Recent Submissions</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Grade</th><th>Date</th></tr></thead>
              <tbody>
                {recentResults.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600, fontSize:13 }}>{r.name||r.studentName}</td>
                    <td style={{ fontSize:13 }}>{r.examTitle}</td>
                    <td><Badge type={parseFloat(r.percentage)>=50?'success':'danger'}>{r.percentage}</Badge></td>
                    <td style={{ fontWeight:700, color:parseFloat(r.percentage)>=50?'var(--success)':'var(--danger)', fontSize:14 }}>{r.grade}</td>
                    <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(r.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   STUDENTS
══════════════════════════════════════════════ */
function StudentsTab() {
  const [allStudents,   setAllStudents]   = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [importing,setImporting]= useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name:'', registerNumber:'', email:'', phone:'', batch:'Batch 1', password:'student123' });
  const excelRef = useRef();
  const toast = useToast();

  const load = useCallback(async () => { setAllStudents(await DB.getAll('students')); }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd(batch) {
    setForm({ name:'', registerNumber:'', email:'', phone:'', batch: batch||'Batch 1', password:'student123' });
    setShowAdd(true);
  }

  async function addStudent(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.registerNumber.trim()) { toast('Name and register number required', 'warning'); return; }
    setSaving(true);
    try {
      await DB.save('students', { ...form, name:form.name.trim(), registerNumber:form.registerNumber.trim(), createdAt:new Date().toISOString() });
      toast('Student added!', 'success'); setShowAdd(false); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleExcel(e) {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    try {
      const { students, warnings } = await importStudentsFromExcel(file);
      for (const s of students) await DB.save('students', s);
      if (warnings.length > 0) {
        toast(`${students.length} students imported, ${warnings.length} blank row(s) skipped.`, 'warning');
      } else {
        toast(`${students.length} students imported!`, 'success');
      }
      load();
    } catch (err) { toast('Import failed: '+err.message, 'error'); }
    finally { setImporting(false); if (excelRef.current) excelRef.current.value=''; }
  }

  if (!allStudents) return <Loader />;
  const batchStudents = selectedBatch ? allStudents.filter(s => s.batch===selectedBatch) : [];

  return (
    <div className="fade-in">
      {!selectedBatch ? (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, marginBottom:3 }}>👨‍🎓 Students</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>{allStudents.length} students across all batches</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn variant="ghost" size="sm" onClick={() => exportStudentsList(allStudents, 'students_export.xlsx')}>
                📥 Export Excel
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => excelRef.current?.click()}>
                {importing ? <Spinner size={14} /> : '📤 Import Excel'}
              </Btn>
              <input ref={excelRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleExcel} />
              <Btn variant="primary" size="sm" onClick={() => openAdd(null)}>+ Add Student</Btn>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px,1fr))', gap:16 }}>
            {BATCHES.map(batch => {
              const count = allStudents.filter(s => s.batch===batch).length;
              const c     = BATCH_COLORS[batch];
              return (
                <div key={batch} onClick={() => setSelectedBatch(batch)} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:16, padding:'26px 22px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(37,99,235,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=c; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 28px ${c}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 10px rgba(37,99,235,0.06)'; }}>
                  <div style={{ width:50, height:50, borderRadius:14, background:`${c}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:14 }}>🎓</div>
                  <h3 style={{ fontSize:17, fontWeight:800, color:c, marginBottom:5 }}>{batch}</h3>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>{count} student{count!==1?'s':''} enrolled</p>
                  <div style={{ fontSize:12, color:c, fontWeight:700 }}>View students →</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
            <Btn variant="ghost" size="sm" onClick={() => setSelectedBatch(null)}>← Batches</Btn>
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:22, fontWeight:800 }}>{selectedBatch}</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>{batchStudents.length} students</p>
            </div>
            <Btn variant="primary" size="sm" onClick={() => openAdd(selectedBatch)}>+ Add Student</Btn>
          </div>
          <Card style={{ padding:0 }}>
            {batchStudents.length===0 ? <div style={{ padding:28 }}><EmptyState icon="👨‍🎓" text={`No students in ${selectedBatch} yet`} /></div> : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead><tr><th>#</th><th>Name</th><th>Register No.</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                  <tbody>
                    {batchStudents.map((s,i) => (
                      <tr key={s.id}>
                        <td style={{ color:'var(--text-muted)', fontWeight:600 }}>{i+1}</td>
                        <td style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>{s.name}</td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent)' }}>{s.registerNumber}</td>
                        <td style={{ fontSize:13 }}>{s.email||'—'}</td>
                        <td style={{ fontSize:13 }}>{s.phone||'—'}</td>
                        <td><Btn variant="danger" size="sm" onClick={() => setDeleteId(s.id)}>Delete</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Student">
        <form onSubmit={addStudent}>
          <Input label="Full Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} placeholder="e.g. Rahul Sharma" autoFocus />
          <Input label="Register Number *" value={form.registerNumber} onChange={e => setForm(p => ({ ...p, registerNumber:e.target.value }))} placeholder="e.g. BGS2024001" />
          <Select label="Batch *" value={form.batch} onChange={e => setForm(p => ({ ...p, batch:e.target.value }))}>
            {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email:e.target.value }))} placeholder="student@email.com" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone:e.target.value }))} placeholder="+91..." />
          <Input label="Password" value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))} placeholder="student123" />
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <Btn variant="ghost" type="button" onClick={() => setShowAdd(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
            <Btn type="submit" variant="primary" style={{ flex:1, justifyContent:'center' }} disabled={saving}>
              {saving ? <Spinner size={14} color="white" /> : 'Add Student'}
            </Btn>
          </div>
        </form>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await DB.delete(`students/${deleteId}`); toast('Deleted','success'); setDeleteId(null); load(); }} title="Delete Student" message="This cannot be undone." confirmText="Delete" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   TEACHERS
══════════════════════════════════════════════ */
function TeachersTab() {
  const [teachers,      setTeachers]      = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [deleteId,setDeleteId]= useState(null);
  const [form, setForm] = useState({ name:'', username:'', password:'teacher123', subject:'', batch:'Batch 1' });
  const toast = useToast();

  const load = useCallback(async () => { setTeachers(await DB.getAll('teachers')); }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd(batch) {
    setForm({ name:'', username:'', password:'teacher123', subject:'', batch:batch||'Batch 1' });
    setShowAdd(true);
  }

  async function add(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim()) { toast('Name and username required', 'warning'); return; }
    if (form.password.length < 6) { toast('Password must be ≥ 6 characters', 'warning'); return; }
    setSaving(true);
    try {
      const dup = (teachers||[]).find(t => t.username.toLowerCase()===form.username.trim().toLowerCase());
      if (dup) { toast(`Username "${form.username}" already exists`, 'error'); setSaving(false); return; }
      await DB.save('teachers', { name:form.name.trim(), username:form.username.trim(), password:form.password, subject:form.subject.trim(), batch:form.batch, createdAt:new Date().toISOString() });
      toast('Teacher added!','success'); setShowAdd(false); load();
    } catch (err) { toast('Failed: '+err.message,'error'); }
    finally { setSaving(false); }
  }

  if (!teachers) return <Loader />;
  const batchTeachers = selectedBatch ? teachers.filter(t => t.batch===selectedBatch) : [];

  return (
    <div className="fade-in">
      {!selectedBatch ? (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, marginBottom:3 }}>👨‍🏫 Teachers</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>{teachers.length} teachers total</p>
            </div>
            <Btn variant="primary" size="sm" onClick={() => openAdd(null)}>+ Add Teacher</Btn>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px,1fr))', gap:16 }}>
            {BATCHES.map(batch => {
              const count = teachers.filter(t => t.batch===batch).length;
              const c     = BATCH_COLORS[batch];
              return (
                <div key={batch} onClick={() => setSelectedBatch(batch)} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:16, padding:'26px 22px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(37,99,235,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=c; e.currentTarget.style.transform='translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}>
                  <div style={{ width:50, height:50, borderRadius:14, background:`${c}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:14 }}>👨‍🏫</div>
                  <h3 style={{ fontSize:17, fontWeight:800, color:c, marginBottom:5 }}>{batch}</h3>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>{count} teacher{count!==1?'s':''}</p>
                  <div style={{ fontSize:12, color:c, fontWeight:700 }}>View teachers →</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
            <Btn variant="ghost" size="sm" onClick={() => setSelectedBatch(null)}>← Batches</Btn>
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:22, fontWeight:800 }}>{selectedBatch} — Teachers</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>{batchTeachers.length} teachers</p>
            </div>
            <Btn variant="primary" size="sm" onClick={() => openAdd(selectedBatch)}>+ Add Teacher</Btn>
          </div>
          <Card style={{ padding:0 }}>
            {batchTeachers.length===0 ? <div style={{ padding:28 }}><EmptyState icon="👨‍🏫" text={`No teachers in ${selectedBatch} yet`} /></div> : (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Username</th><th>Subject</th><th>Actions</th></tr></thead>
                <tbody>
                  {batchTeachers.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>{t.name}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent)' }}>{t.username}</td>
                      <td style={{ fontSize:13 }}>{t.subject||'—'}</td>
                      <td><Btn variant="danger" size="sm" onClick={() => setDeleteId(t.id)}>Delete</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Teacher">
        <form onSubmit={add}>
          <Input label="Full Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} placeholder="e.g. Dr. Ramesh Kumar" autoFocus />
          <Input label="Username *" value={form.username} onChange={e => setForm(p => ({ ...p, username:e.target.value }))} placeholder="e.g. ramesh.kumar" />
          <Input label="Password (min 6)" value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))} placeholder="teacher123" />
          <Input label="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject:e.target.value }))} placeholder="e.g. Data Science" />
          <Select label="Batch" value={form.batch} onChange={e => setForm(p => ({ ...p, batch:e.target.value }))}>
            {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <Btn variant="ghost" type="button" onClick={() => setShowAdd(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
            <Btn type="submit" variant="primary" style={{ flex:1, justifyContent:'center' }} disabled={saving}>
              {saving ? <Spinner size={14} color="white" /> : 'Add Teacher'}
            </Btn>
          </div>
        </form>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await DB.delete(`teachers/${deleteId}`); toast('Deleted','success'); setDeleteId(null); load(); }} title="Delete Teacher" message="Remove this teacher account?" confirmText="Delete" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAPERS
══════════════════════════════════════════════ */
function PapersTab() {
  const [papers,          setPapers]          = useState(null);
  const [view,            setView]            = useState('list');
  const [activePaper,     setActivePaper]     = useState(null);
  const [showCreate,      setShowCreate]      = useState(false);
  const [showAddQ,        setShowAddQ]        = useState(false);
  const [showCopy,        setShowCopy]        = useState(false);
  const [deleteId,        setDeleteId]        = useState(null);
  const [deleteQId,       setDeleteQId]       = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [importing,       setImporting]       = useState(false);
  const [form, setForm]   = useState({ title:'', description:'', batch:'All Batches', subject:'' });
  const [copyName,        setCopyName]        = useState('');
  const [pickMode,        setPickMode]        = useState('manual');
  const [manualQ, setManualQ] = useState({
    question: '', type: 'mcq', options: ['','','',''], correct: 0, description: '',
    codingData: { description:'', functionName:'', difficulty:'Medium', defaultLang:'python', constraints:'', testCases:[] },
  });
  const paperExcelRef = useRef();
  const toast = useToast();

  const load = useCallback(async () => { setPapers(await DB.getAll('papers')); }, []);
  useEffect(() => { load(); }, [load]);

  async function createPaper(e) {
    e.preventDefault();
    if (!form.title.trim()) { toast('Title required','warning'); return; }
    await DB.save('papers', { ...form, questions:[], createdAt:new Date().toISOString() });
    toast('Paper created!','success');
    setForm({ title:'', description:'', batch:'All Batches', subject:'' });
    setShowCreate(false); load();
  }

  async function refreshActive() {
    const updated = await DB.getAll('papers');
    const found   = updated.find(p => p.id===activePaper.id);
    if (found) setActivePaper(found);
    setPapers(updated);
  }

  async function addManualQ(e) {
    e.preventDefault();
    if (!manualQ.question.trim()) { toast('Question required','warning'); return; }
    const existing = Array.isArray(activePaper.questions) ? activePaper.questions : [];
    const q = {
      id:           (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      question:     manualQ.question.trim(),
      type:         manualQ.type,
      description:  manualQ.codingData?.description || manualQ.description?.trim() || '',
      functionName: manualQ.codingData?.functionName || '',
      difficulty:   manualQ.codingData?.difficulty   || 'Medium',
      defaultLang:  manualQ.codingData?.defaultLang  || 'python',
      constraints:  manualQ.codingData?.constraints  || '',
      testCases:    manualQ.codingData?.testCases    || [],
      options:      manualQ.type === 'mcq' ? manualQ.options.filter(o => o.trim())
                  : manualQ.type === 'tf'  ? ['True','False'] : [],
      correct:      parseInt(manualQ.correct) || 0,
    };
    await DB.update(`papers/${activePaper.id}`, { ...activePaper, questions:[...existing, q] });
    toast('Question added!','success');
    setManualQ({
      question: '', type: 'mcq', options: ['','','',''], correct: 0, description: '',
      codingData: { description:'', functionName:'', difficulty:'Medium', defaultLang:'python', constraints:'', testCases:[] },
    });
    setShowAddQ(false); refreshActive();
  }

  async function addFromExcel(e) {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    try {
      const { questions: newQs, warnings } = await importQuestionsFromExcel(file);
      const existing = Array.isArray(activePaper.questions) ? activePaper.questions : [];
      await DB.update(`papers/${activePaper.id}`, { ...activePaper, questions:[...existing,...newQs] });
      if (warnings.length > 0) {
        toast(`⚠️ ${newQs.length} questions imported, ${warnings.length} blank row(s) skipped.`, 'warning');
      } else {
        toast(`✅ ${newQs.length} questions imported!`, 'success');
      }
      setShowAddQ(false); refreshActive();
    } catch (err) { toast('Import failed: '+err.message,'error'); }
    finally { setImporting(false); if (e.target) e.target.value=''; }
  }

  async function removeQuestion(qId) {
    const updated = (Array.isArray(activePaper.questions)?activePaper.questions:[]).filter(q => String(q.id)!==String(qId));
    await DB.update(`papers/${activePaper.id}`, { ...activePaper, questions:updated });
    toast('Removed','success'); setDeleteQId(null); refreshActive();
  }

  async function deletePaper(id) {
    await DB.delete(`papers/${id}`);
    toast('Deleted','success'); setDeleteId(null);
    if (activePaper?.id===id) { setView('list'); setActivePaper(null); }
    load();
  }

  async function copyPaper() {
    if (!copyName.trim()) { toast('Enter a name','warning'); return; }
    await DB.save('papers', { ...activePaper, id:undefined, title:copyName, createdAt:new Date().toISOString() });
    toast('Paper copied!','success'); setCopyName(''); setShowCopy(false); load();
  }

  if (!papers) return <Loader />;

  const typeLabels = { mcq:'MCQ', tf:'T/F', 'mcq-multiple':'Multi', fill:'Fill', essay:'Essay', coding:'Code' };
  const typeColors = { mcq:'info', tf:'success', 'mcq-multiple':'warning', fill:'gold', essay:'danger', coding:'info' };

  /* Paper Detail */
  if (view==='detail' && activePaper) {
    const qs = Array.isArray(activePaper.questions) ? activePaper.questions : [];
    return (
      <div className="fade-in">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22, flexWrap:'wrap' }}>
          <Btn variant="ghost" size="sm" onClick={() => { setView('list'); setActivePaper(null); }}>← Papers</Btn>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ fontSize:20, fontWeight:800 }}>{activePaper.title}</h2>
            <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>{activePaper.subject||'No subject'}</span>
              <Badge type="info">{activePaper.batch}</Badge>
              <Badge type="success">{qs.length} questions</Badge>
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setShowCopy(true)}>📄 Copy</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setConfirmClearAll(true)}>🗑 Clear All</Btn>
          <Btn variant="danger" size="sm" onClick={() => setDeleteId(activePaper.id)}>Delete Paper</Btn>
          <Btn variant="primary" size="sm" onClick={() => setShowAddQ(true)}>+ Add Questions</Btn>
        </div>

        <Card style={{ padding:0 }}>
          {qs.length===0 ? <div style={{ padding:28 }}><EmptyState icon="📋" text="No questions yet. Click + Add Questions." /></div> : (
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Actions</th></tr></thead>
                <tbody>
                  {qs.map((q,i) => (
                    <tr key={q.id||i}>
                      <td style={{ color:'var(--text-muted)', fontWeight:600 }}>{i+1}</td>
                      <td style={{ fontSize:13 }}>{q.question?.substring(0,100)}{(q.question?.length||0)>100?'…':''}</td>
                      <td><Badge type={typeColors[q.type]||'info'}>{typeLabels[q.type]||q.type}</Badge></td>
                      <td><Btn variant="danger" size="sm" onClick={() => setDeleteQId(String(q.id||i))}>Remove</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add Questions Modal */}
        <Modal open={showAddQ} onClose={() => { setShowAddQ(false); setPickMode('manual'); }} title="Add Questions" wide>
          <div style={{ display:'flex', gap:6, marginBottom:20 }}>
            {[['manual','✍️ Manual'],['excel','📤 From Excel']].map(([m,l]) => (
              <button key={m} onClick={() => setPickMode(m)} style={{ padding:'8px 16px', borderRadius:8, border:`1.5px solid ${pickMode===m?'var(--accent)':'var(--border)'}`, background:pickMode===m?'rgba(37,99,235,0.09)':'white', color:pickMode===m?'var(--accent)':'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'var(--font-main)' }}>{l}</button>
            ))}
          </div>

          {pickMode==='manual' && (
            <form onSubmit={addManualQ}>
              <Textarea label="Question *" value={manualQ.question} onChange={e => setManualQ(p => ({ ...p, question:e.target.value }))} rows={3} placeholder="Enter question..." />
              <Select label="Type" value={manualQ.type} onChange={e => setManualQ(p => ({ ...p, type:e.target.value, correct:0 }))}>
                <option value="mcq">MCQ</option>
                <option value="tf">True / False</option>
                <option value="fill">Fill in Blank</option>
                <option value="essay">Essay</option>
                <option value="coding">Coding (HackerRank-style)</option>
              </Select>
              {manualQ.type==='mcq' && manualQ.options.map((opt,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <input type="radio" name="mc" checked={manualQ.correct===i} onChange={() => setManualQ(p => ({ ...p, correct:i }))} style={{ width:16, height:16, flexShrink:0 }} />
                  <input value={opt} onChange={e => { const o=[...manualQ.options]; o[i]=e.target.value; setManualQ(p => ({ ...p, options:o })); }} placeholder={`Option ${i+1}`} style={{ flex:1 }} />
                </div>
              ))}
              {manualQ.type==='fill' && <Input label="Correct Answer" value={manualQ.options[0]||''} onChange={e => setManualQ(p => ({ ...p, options:[e.target.value] }))} />}
              {manualQ.type==='coding' && (
                <CodingQuestionForm
                  value={manualQ.codingData}
                  onChange={data => setManualQ(p => ({ ...p, codingData: data }))}
                />
              )}
              <div style={{ display:'flex', gap:12, marginTop:14 }}>
                <Btn variant="ghost" onClick={() => setShowAddQ(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
                <Btn type="submit" variant="primary" style={{ flex:1, justifyContent:'center' }}>Add Question</Btn>
              </div>
            </form>
          )}

          {pickMode==='excel' && (
            <div style={{ padding:'16px 0' }}>
              <div style={{ background:'#f8faff', border:'1px solid var(--border)', borderRadius:10, padding:'18px', marginBottom:18 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>Template has 2 sheets:</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.8 }}>
                  <strong>MCQ_Questions</strong> — mcq · tf · fill · essay<br/>
                  <strong>Coding_Questions</strong> — coding with test cases (tc1_input, tc1_output, tc1_hidden...)<br/>
                  <strong>correct</strong> = 0-indexed (0=A, 1=B, 2=C, 3=D). For fill, put answer in optionA.<br/>
                  <strong>Input format:</strong> <code>"hello"</code> string · <code>42</code> number · <code>[1,2,3]</code> list · <code>(3,5)</code> two args
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                <Btn variant="ghost" size="sm" onClick={() => downloadQuestionTemplate()}>
                  📥 Download Template
                </Btn>
                <Btn variant="primary" onClick={() => paperExcelRef.current?.click()}>
                  {importing ? <Spinner size={16} color="white" /> : '📤 Choose File to Upload'}
                </Btn>
              </div>
              <input ref={paperExcelRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={addFromExcel} />
            </div>
          )}
        </Modal>

        <Modal open={showCopy} onClose={() => setShowCopy(false)} title="Copy Paper">
          <Input label="New Paper Name" value={copyName} onChange={e => setCopyName(e.target.value)} placeholder="e.g. Unit Test 2 - Copy" autoFocus />
          <div style={{ display:'flex', gap:12 }}>
            <Btn variant="ghost" onClick={() => setShowCopy(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
            <Btn variant="primary" onClick={copyPaper} style={{ flex:1, justifyContent:'center' }}>Copy</Btn>
          </div>
        </Modal>

        <ConfirmModal open={!!deleteQId} onClose={() => setDeleteQId(null)} onConfirm={() => removeQuestion(deleteQId)} title="Remove Question" message="Remove this question from the paper?" confirmText="Remove" />
        <ConfirmModal open={confirmClearAll} onClose={() => setConfirmClearAll(false)} onConfirm={async () => { await DB.update(`papers/${activePaper.id}`,{...activePaper,questions:[]}); toast('Cleared','success'); setConfirmClearAll(false); refreshActive(); }} title="Clear All Questions" message="Remove all questions from this paper?" confirmText="Clear All" />
        <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deletePaper(deleteId)} title="Delete Paper" message="Delete this entire paper?" confirmText="Delete" />
      </div>
    );
  }

  /* Paper List */
  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, marginBottom:3 }}>📋 Question Papers</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{papers.length} papers</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Create Paper</Btn>
      </div>

      {papers.length===0 ? <Card><EmptyState icon="📋" text="No papers yet. Create your first paper!" /></Card> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px,1fr))', gap:16 }}>
          {papers.map(p => {
            const qs = Array.isArray(p.questions) ? p.questions : [];
            return (
              <div key={p.id} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:16, padding:'22px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(37,99,235,0.06)', display:'flex', flexDirection:'column' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(37,99,235,0.13)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 10px rgba(37,99,235,0.06)'; }}>
                <div onClick={() => { setActivePaper(p); setView('detail'); }} style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📋</div>
                    <Badge type="info">{p.batch}</Badge>
                  </div>
                  <h3 style={{ fontWeight:700, fontSize:15, marginBottom:4, color:'var(--text-primary)', lineHeight:1.3 }}>{p.title}</h3>
                  <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>{p.subject||'No subject'}</p>
                  {p.description && <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:10, lineHeight:1.5 }}>{p.description.substring(0,60)}{p.description.length>60?'…':''}</p>}
                  <div style={{ display:'flex', gap:6, marginBottom:14, alignItems:'center' }}>
                    <Badge type="success">{qs.length} questions</Badge>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn variant="primary" size="sm" style={{ flex:1, justifyContent:'center' }} onClick={() => { setActivePaper(p); setView('detail'); }}>Open</Btn>
                  <Btn variant="danger" size="sm" onClick={e => { e.stopPropagation(); setDeleteId(p.id); }}>Delete</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Paper">
        <form onSubmit={createPaper}>
          <Input label="Paper Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} placeholder="e.g. Unit Test 1 - Power BI" autoFocus />
          <Input label="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject:e.target.value }))} placeholder="e.g. Data Science" />
          <Select label="Batch" value={form.batch} onChange={e => setForm(p => ({ ...p, batch:e.target.value }))}>
            {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} rows={2} placeholder="Optional..." />
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={() => setShowCreate(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
            <Btn type="submit" variant="primary" style={{ flex:1, justifyContent:'center' }}>Create Paper</Btn>
          </div>
        </form>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deletePaper(deleteId)} title="Delete Paper" message="Delete this paper permanently?" confirmText="Delete" />
    </div>
  );
}

/* ── ScheduleForm extracted outside ExamScheduleTab to prevent remount on each keystroke ── */
function ScheduleForm({ form, setForm, papers, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <Input label="Exam Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} placeholder="e.g. Unit Test 1 - Data Science" autoFocus />

      {/* Paper link */}
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', marginBottom:6, fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Link Question Paper</label>
        <select value={form.paperId} onChange={e => setForm(p => ({ ...p, paperId:e.target.value }))}
          style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--border)', fontFamily:'var(--font-main)', fontSize:13, background:'#f8faff', color:'var(--text-primary)' }}>
          <option value="">— No paper linked —</option>
          {papers.map(p => <option key={p.id} value={p.id}>{p.title} ({Array.isArray(p.questions)?p.questions.length:0} questions) · {p.batch}</option>)}
        </select>
        {form.paperId && (
          <div style={{ marginTop:6, fontSize:12, color:'var(--accent)', fontWeight:600 }}>
            ✅ Linked: {papers.find(p => p.id===form.paperId)?.title}
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Select label="Batch" value={form.batch} onChange={e => setForm(p => ({ ...p, batch:e.target.value }))}>
          {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Input label="Duration (min) *" type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration:e.target.value }))} min="1" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Input label="Start Date & Time *" type="datetime-local" value={form.startDateTime} onChange={e => setForm(p => ({ ...p, startDateTime:e.target.value }))} />
        <Input label="End Date & Time *"   type="datetime-local" value={form.endDateTime}   onChange={e => setForm(p => ({ ...p, endDateTime:e.target.value }))} />
      </div>
      <Input label="No. of Questions (blank = all)" type="number" value={form.questionCount} onChange={e => setForm(p => ({ ...p, questionCount:e.target.value }))} />
      <label style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, cursor:'pointer', marginBottom:20, fontWeight:500 }}>
        <input type="checkbox" checked={form.randomize} onChange={e => setForm(p => ({ ...p, randomize:e.target.checked }))} style={{ width:16, height:16 }} />
        Randomize question order
      </label>
      <div style={{ display:'flex', gap:12 }}>
        <Btn variant="ghost" type="button" onClick={onCancel} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
        <Btn type="submit" variant="primary" style={{ flex:1, justifyContent:'center' }}>Schedule Exam</Btn>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════
   EXAM SCHEDULE  (batch drill-down + paper link)
══════════════════════════════════════════════ */
function ExamScheduleTab() {
  const [exams,         setExams]         = useState(null);
  const [papers,        setPapers]        = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [deleteId,      setDeleteId]      = useState(null);
  const [form, setForm] = useState({ title:'', batch:'All Batches', paperId:'', startDateTime:'', endDateTime:'', duration:30, questionCount:'', randomize:true });
  const toast = useToast();

  const load = useCallback(async () => {
    const [e, p] = await Promise.all([DB.getAll('exam_schedule'), DB.getAll('papers')]);
    setExams(e); setPapers(p);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    if (!form.title || !form.startDateTime || !form.endDateTime) { toast('Fill required fields','warning'); return; }
    if (new Date(form.endDateTime) <= new Date(form.startDateTime)) { toast('End time must be after start time','warning'); return; }
    await DB.save('exam_schedule', { ...form, duration:parseInt(form.duration), questionCount:form.questionCount?parseInt(form.questionCount):null, createdAt:new Date().toISOString() });
    toast('Exam scheduled!','success'); setShowAdd(false); load();
  }

  function openAdd(batch) {
    setForm({ title:'', batch:batch||'All Batches', paperId:'', startDateTime:'', endDateTime:'', duration:30, questionCount:'', randomize:true });
    setShowAdd(true);
  }

  if (!exams) return <Loader />;

  /* Batch overview */
  if (!selectedBatch) {
    return (
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, marginBottom:3 }}>📝 Exam Schedule</h1>
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>{exams.length} total exams scheduled</p>
          </div>
          <Btn variant="primary" size="sm" onClick={() => openAdd('All Batches')}>+ Schedule Exam</Btn>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px,1fr))', gap:16 }}>
          <div onClick={() => setSelectedBatch('All Batches')} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:16, padding:'26px 22px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(37,99,235,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.transform='translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🌐</div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#2563eb', marginBottom:5 }}>All Batches</h3>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>{exams.filter(e => e.batch==='All Batches').length} exams</p>
          </div>
          {BATCHES.map(batch => {
            const bExams = exams.filter(e => e.batch===batch);
            const now    = new Date();
            const live   = bExams.filter(e => now>=new Date(e.startDateTime) && now<=new Date(e.endDateTime)).length;
            const c      = BATCH_COLORS[batch];
            return (
              <div key={batch} onClick={() => setSelectedBatch(batch)} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:16, padding:'26px 22px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(37,99,235,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=c; e.currentTarget.style.transform='translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📝</div>
                <h3 style={{ fontSize:17, fontWeight:800, color:c, marginBottom:5 }}>{batch}</h3>
                <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>{bExams.length} exams</p>
                {live>0 && <Badge type="danger">🔴 {live} Live</Badge>}
              </div>
            );
          })}
        </div>
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Schedule Exam" wide>
          <ScheduleForm form={form} setForm={setForm} papers={papers} onSubmit={add} onCancel={() => setShowAdd(false)} />
        </Modal>
      </div>
    );
  }

  /* Batch exam list */
  const batchExams = exams.filter(e => e.batch===selectedBatch);
  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
        <Btn variant="ghost" size="sm" onClick={() => setSelectedBatch(null)}>← Batches</Btn>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:22, fontWeight:800 }}>{selectedBatch} — Exams</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{batchExams.length} exams scheduled</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => openAdd(selectedBatch)}>+ Schedule Exam</Btn>
      </div>

      {batchExams.length===0 ? <Card><EmptyState icon="📝" text={`No exams scheduled for ${selectedBatch}`} /></Card> : (
        <Card style={{ padding:0 }}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Linked Paper</th><th>Start</th><th>End</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {batchExams.map(ex => {
                const now    = new Date();
                const start  = new Date(ex.startDateTime), end = new Date(ex.endDateTime);
                const status = now>=start && now<=end ? 'live' : now<start ? 'upcoming' : 'ended';
                const linked = papers.find(p => p.id===ex.paperId);
                return (
                  <tr key={ex.id}>
                    <td style={{ fontWeight:700, fontSize:13 }}>{ex.title}</td>
                    <td style={{ fontSize:12 }}>{linked ? <Badge type="success">📋 {linked.title}</Badge> : <span style={{ color:'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontSize:12 }}>{start.toLocaleString()}</td>
                    <td style={{ fontSize:12 }}>{end.toLocaleString()}</td>
                    <td style={{ fontWeight:600 }}>{ex.duration} min</td>
                    <td><Badge type={status==='live'?'danger':status==='upcoming'?'warning':'info'}>{status==='live'?'🔴 Live':status==='upcoming'?'⏳ Upcoming':'✅ Ended'}</Badge></td>
                    <td><Btn variant="danger" size="sm" onClick={() => setDeleteId(ex.id)}>Delete</Btn></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Schedule Exam" wide>
        <ScheduleForm form={form} setForm={setForm} papers={papers} onSubmit={add} onCancel={() => setShowAdd(false)} />
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await DB.delete(`exam_schedule/${deleteId}`); toast('Deleted','success'); setDeleteId(null); load(); }} title="Delete Exam" message="Remove this exam?" confirmText="Delete" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   RESULTS  (with visibility control + answer sheets)
══════════════════════════════════════════════ */
function ResultsTab() {
  const [subTab,      setSubTab]      = useState('visibility'); // 'visibility' | 'results'
  const [results,     setResults]     = useState(null);
  const [sheets,      setSheets]      = useState(null);
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterExam,  setFilterExam]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [viewSheet,   setViewSheet]   = useState(null);
  const [revealMap,   setRevealMap]   = useState({});
  const [togglingId,  setTogglingId]  = useState(null);
  const [deleteResultId, setDeleteResultId] = useState(null);
  const [deleteSheetId,  setDeleteSheetId]  = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const [r, s, vis] = await Promise.all([
      DB.getAll('exam_results'),
      DB.getAll('answer_sheets'),
      DB.getAll('result_visibility'),
    ]);
    setResults(r); setSheets(s);
    const map = {};
    vis.forEach(v => { map[v.examScheduleId] = v.revealed===true; });
    setRevealMap(map);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggleReveal(examScheduleId, examTitle) {
    setTogglingId(examScheduleId);
    try {
      const nowRevealed = !!revealMap[examScheduleId];
      const vis   = await DB.getAll('result_visibility');
      const entry = vis.find(v => v.examScheduleId===examScheduleId);
      if (entry) {
        await DB.update(`result_visibility/${entry.id}`, { ...entry, revealed:!nowRevealed, updatedAt:new Date().toISOString() });
      } else {
        await DB.update(`result_visibility/${examScheduleId}`, { examScheduleId, examTitle, revealed:true, createdAt:new Date().toISOString() });
      }
      setRevealMap(prev => ({ ...prev, [examScheduleId]:!nowRevealed }));
      toast(!nowRevealed ? `✅ Results revealed for "${examTitle}"` : `🔒 Results hidden for "${examTitle}"`, 'success');
    } catch(err) { toast('Error: '+err.message,'error'); }
    finally { setTogglingId(null); }
  }

  if (!results || !sheets) return <Loader />;

  // computed above in return

  const filtered = (results||[]).filter(r =>
    (filterBatch==='all'||r.batch===filterBatch) &&
    (filterExam==='all' ||r.examTitle===filterExam) &&
    (!search || (r.name||r.studentName||'').toLowerCase().includes(search.toLowerCase()) ||
      (r.registerNumber||'').toLowerCase().includes(search.toLowerCase()))
  );
  const examGroups2 = [];
  const seen2 = new Set();
  (results||[]).forEach(r => {
    if (r.examScheduleId && !seen2.has(r.examScheduleId)) {
      seen2.add(r.examScheduleId);
      examGroups2.push({ id:r.examScheduleId, title:r.examTitle, count:(results||[]).filter(x=>x.examScheduleId===r.examScheduleId).length });
    }
  });

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800 }}>📈 Results</h1>
        {subTab==='results' && filtered.length>0 && (
          <Btn variant="danger" size="sm" onClick={() => setDeleteAllConfirm(true)}>🗑️ Delete All ({filtered.length})</Btn>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, background:'#f0f4ff', borderRadius:10, padding:4, width:'fit-content' }}>
        {[['visibility','🔐 Visibility Control'],['results','📊 Student Results']].map(([id,label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:subTab===id?'white':'transparent', color:subTab===id?'var(--accent)':'var(--text-muted)', fontWeight:subTab===id?700:500, fontSize:13, cursor:'pointer', transition:'all 0.15s', boxShadow:subTab===id?'0 2px 8px rgba(37,99,235,0.15)':'none', fontFamily:'var(--font-main)' }}>{label}</button>
        ))}
      </div>

      {/* ── Visibility Control Sub-tab ── */}
      {subTab === 'visibility' && (
      <Card style={{ marginBottom:20, border:'1.5px solid rgba(37,99,235,0.2)', background:'#f8faff' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🔐</div>
          <div>
            <h3 style={{ fontWeight:700, fontSize:14 }}>Result Visibility Control</h3>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>Students cannot see results until you press Reveal. Admin always has full access.</p>
          </div>
        </div>
        {examGroups2.length===0 ? <p style={{ fontSize:13, color:'var(--text-muted)' }}>No exam results yet</p> : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {examGroups2.map(eg => {
              const revealed = !!revealMap[eg.id];
              return (
                <div key={eg.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:revealed?'rgba(5,150,105,0.07)':'rgba(220,38,38,0.05)', border:`1.5px solid ${revealed?'rgba(5,150,105,0.2)':'rgba(220,38,38,0.15)'}`, borderRadius:10 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{eg.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{eg.count} submission{eg.count!==1?'s':''} · {revealed?'✅ Visible to students':'🔒 Hidden from students'}</div>
                  </div>
                  <Btn variant={revealed?'danger':'success'} size="sm" disabled={togglingId===eg.id} onClick={() => toggleReveal(eg.id, eg.title)}>
                    {togglingId===eg.id ? <Spinner size={12} color="white" /> : revealed ? '🔒 Hide Results' : '👁 Reveal Results'}
                  </Btn>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      )}

      {/* ── Student Results Sub-tab ── */}
      {subTab === 'results' && (
      <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student name or reg no…"
          style={{ flex:1, minWidth:200, padding:'8px 12px', fontSize:13, borderRadius:8, border:'1.5px solid var(--border)', background:'white', fontFamily:'var(--font-main)' }} />
        <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ width:'auto', padding:'8px 12px', fontSize:13, borderRadius:8, border:'1.5px solid var(--border)', background:'white', fontFamily:'var(--font-main)' }}>
          <option value="all">All Batches</option>{BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ width:'auto', padding:'8px 12px', fontSize:13, borderRadius:8, border:'1.5px solid var(--border)', background:'white', fontFamily:'var(--font-main)' }}>
          <option value="all">All Exams</option>{[...new Set((results||[]).map(r=>r.examTitle).filter(Boolean))].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{filtered.length} results</span>
      </div>

      <Card style={{ padding:0 }}>
        {filtered.length===0 ? <div style={{ padding:32 }}><EmptyState icon="📊" text="No results found" /></div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Student</th><th>Reg No.</th><th>Batch</th><th>Exam</th><th>Score</th><th>%</th><th>Grade</th><th>Tab Switches</th><th>Date</th><th>Sheet</th><th></th></tr></thead>
              <tbody>
                {filtered.map(r => {
                  const sheet = sheets.find(s => s.examScheduleId===r.examScheduleId && s.studentId===r.registerNumber);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight:700, fontSize:13 }}>{r.name||r.studentName}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent)' }}>{r.registerNumber}</td>
                      <td><Badge type="info">{r.batch}</Badge></td>
                      <td style={{ fontSize:13 }}>{r.examTitle}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600 }}>{r.score}</td>
                      <td><Badge type={parseFloat(r.percentage)>=50?'success':'danger'}>{r.percentage}</Badge></td>
                      <td style={{ fontWeight:800, color:parseFloat(r.percentage)>=50?'var(--success)':'var(--danger)', fontSize:14 }}>{r.grade}</td>
                      <td><Badge type={r.tabSwitches>0?'warning':'success'}>{r.tabSwitches||0}</Badge></td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                      <td>{sheet ? <Btn variant="ghost" size="sm" onClick={() => setViewSheet(sheet)}>📄 View</Btn> : <span style={{ color:'var(--text-muted)', fontSize:11 }}>—</span>}</td>
                      <td><Btn variant="danger" size="sm" onClick={() => setDeleteResultId(r.id)}>🗑️</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      </div>
      )}

      {/* Answer Sheet Modal */}
      <Modal open={!!viewSheet} onClose={() => setViewSheet(null)} title={`📄 ${viewSheet?.studentName} — ${viewSheet?.examTitle}`} wide>
        {viewSheet && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
              {[['Student',viewSheet.studentName],['Register No',viewSheet.studentId],['Exam',viewSheet.examTitle],['Score',viewSheet.score||'—'],['Grade',viewSheet.grade||'—'],['Tab Switches',String(viewSheet.tabSwitches||0)]].map(([k,v]) => (
                <div key={k} style={{ background:'#f8faff', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-muted)', marginBottom:3 }}>{k}</div>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
            </div>
            <h4 style={{ fontWeight:700, fontSize:12, marginBottom:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Student Answers</h4>
            {viewSheet.answers && Object.keys(viewSheet.answers).length>0 ? (
              <div style={{ maxHeight:400, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
                {Object.entries(viewSheet.answers).sort(([a],[b]) => a.localeCompare(b,undefined,{numeric:true})).map(([key,ans]) => (
                  <div key={key} style={{ background:'#f8faff', border:'1px solid var(--border)', borderRadius:10, padding:'11px 13px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:'var(--text-secondary)' }}>Q{key.replace('q','')}</span>
                      {ans.answeredAt && <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(ans.answeredAt).toLocaleTimeString()}</span>}
                    </div>
                    {ans.question && <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:6, fontWeight:500 }}>{ans.question}</div>}
                    <div style={{ background:'white', padding:'9px 11px', borderRadius:7, border:'1px solid var(--border)', fontFamily:typeof ans.answer==='string'&&ans.answer.includes('\n')?'var(--font-mono)':'inherit', fontSize:13, color:'var(--text-primary)', whiteSpace:'pre-wrap', lineHeight:1.7 }}>
                      {typeof ans.answer==='string' ? ans.answer||'(No answer)' : JSON.stringify(ans.answer)}
                    </div>
                    {viewSheet.teacherGrades?.[key] && (
                      <div style={{ marginTop:6, fontSize:12, color:'var(--success)', fontWeight:700 }}>✅ Teacher grade: {viewSheet.teacherGrades[key]} pts</div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p style={{ color:'var(--text-muted)', fontSize:13, padding:'14px 0' }}>No answers recorded.</p>}
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleteResultId} onClose={() => setDeleteResultId(null)}
        onConfirm={async () => { await DB.delete(`exam_results/${deleteResultId}`); toast('Result deleted','success'); setDeleteResultId(null); load(); }}
        title="Delete Result" message="Permanently delete this exam result?" confirmText="Delete" variant="danger" />
      <ConfirmModal open={!!deleteSheetId} onClose={() => setDeleteSheetId(null)}
        onConfirm={async () => { await DB.delete(`answer_sheets/${deleteSheetId}`); toast('Answer sheet deleted','success'); setDeleteSheetId(null); load(); }}
        title="Delete Answer Sheet" message="Permanently delete this answer sheet?" confirmText="Delete" variant="danger" />
      <ConfirmModal open={deleteAllConfirm} onClose={() => setDeleteAllConfirm(false)}
        onConfirm={async () => { await Promise.all(filtered.map(r => DB.delete(`exam_results/${r.id}`))); toast(`${filtered.length} results deleted`,'success'); setDeleteAllConfirm(false); load(); }}
        title="Delete All Results" message={`Delete all ${filtered.length} filtered results? This cannot be undone.`} confirmText="Delete All" variant="danger" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTES  (sem dropdown for admin upload)
══════════════════════════════════════════════ */
function NotesTab() {
  const [notes,     setNotes]     = useState(null);
  const [form, setForm] = useState({ title:'', subject:'', description:'', batch:'All Batches', semester:'' });
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const fileRef = useRef();
  const toast = useToast();

  const load = useCallback(async () => {
    const all = await DB.getAll('notes');
    // Strip fileData from list — only load blob on download to avoid huge payload
    setNotes(all.map(({ fileData, ...meta }) => meta));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    if (!form.title) { toast('Title required','warning'); return; }
    if (!file)       { toast('Please select a file','warning'); return; }
    if (file.size > 7*1024*1024) { toast('File must be under 7 MB (Firebase limit)','warning'); return; }
    setUploading(true);
    try {
      const base64Data = await uploadNoteBase64(file);
      await DB.save('notes', { ...form, fileData: base64Data, fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() });
      toast('Note uploaded!','success');
      setForm({ title:'', subject:'', description:'', batch:'All Batches', semester:'' });
      setFile(null); if (fileRef.current) fileRef.current.value='';
      load();
    } catch(err) { toast('Upload failed: '+err.message,'error'); }
    finally { setUploading(false); }
  }

  async function uploadNoteBase64(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 7 * 1024 * 1024) { reject(new Error('File too large. Max 7 MB.')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data:mime;base64,xxx
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function deleteNote(note) {
    await DB.delete(`notes/${note.id}`);
    toast('Deleted','success'); setDeleteId(null); load();
  }

  const fmt  = b => !b?'':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB';
  const fIco = n => !n?'📄':n.endsWith('.pdf')?'📕':n.match(/\.pptx?$/)?'📊':n.match(/\.docx?$/)?'📝':n.match(/\.(jpg|jpeg|png|gif)$/i)?'🖼️':'📄';

  if (!notes) return <Loader />;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>📖 Study Notes</h1>
      <Card style={{ marginBottom:20 }}>
        <h3 style={{ fontWeight:700, marginBottom:16, fontSize:14 }}>📤 Upload New Note</h3>
        <form onSubmit={add}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} placeholder="e.g. Power BI Chapter 3" />
            <Input label="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject:e.target.value }))} placeholder="e.g. Data Science" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Select label="Batch" value={form.batch} onChange={e => setForm(p => ({ ...p, batch:e.target.value }))}>
              {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
            <Select label="Semester (optional)" value={form.semester} onChange={e => setForm(p => ({ ...p, semester:e.target.value }))}>
              <option value="">— General / All Sems —</option>
              {SEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} rows={2} placeholder="Optional..." />
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', marginBottom:6, fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }}>File * (max 10 MB)</label>
            <label style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'26px 20px', border:`2px dashed ${file?'var(--accent)':'var(--border)'}`, borderRadius:10, background:file?'rgba(37,99,235,0.04)':'#fafcff', cursor:'pointer', transition:'all 0.2s' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{file?fIco(file.name):'☁️'}</div>
              {file ? (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'var(--accent)' }}>{file.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{fmt(file.size)}</div>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'var(--text-secondary)' }}>Click to upload</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>PDF, DOCX, PPTX, images — up to 10 MB</div>
                </div>
              )}
              <input ref={fileRef} type="file" style={{ display:'none' }} onChange={e => setFile(e.target.files[0]||null)} />
            </label>
            {file && <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value=''; }} style={{ marginTop:6, fontSize:12, color:'var(--danger)', background:'none', border:'none', cursor:'pointer' }}>✕ Remove</button>}
          </div>
          <Btn type="submit" variant="primary" disabled={uploading}>
            {uploading ? <><Spinner size={16} color="white" /> Uploading…</> : '📚 Upload Note'}
          </Btn>
        </form>
      </Card>

      <Card style={{ padding:0 }}>
        {notes.length===0 ? <div style={{ padding:28 }}><EmptyState icon="📚" text="No notes uploaded yet" /></div> : notes.map(n => (
          <div key={n.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid var(--border)', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:'rgba(37,99,235,0.09)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{fIco(n.fileName)}</div>
              <div>
                <div style={{ fontWeight:600, marginBottom:3, fontSize:13, display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
                  {n.title} <Badge type="info">{n.batch}</Badge> {n.semester && <Badge type="success">{n.semester}</Badge>}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{n.subject||'General'} · {n.fileName||'File'} {n.fileSize?`(${fmt(n.fileSize)})`:''}  · {new Date(n.uploadedAt).toLocaleDateString()}</div>
                {n.description && <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{n.description}</p>}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              {(n.fileData || n.fileUrl) && <Btn variant="ghost" size="sm" onClick={async () => { try { const full = await DB.getOne(`notes/${n.id}`); const src = full?.fileData || full?.fileUrl; if (!src) { toast('File not found','error'); return; } const a = document.createElement('a'); a.href = src; a.download = n.fileName || 'file'; document.body.appendChild(a); a.click(); document.body.removeChild(a); } catch(e) { toast('Download failed: '+e.message,'error'); } }}>📥 Download</Btn>}
              <Btn variant="danger" size="sm" onClick={() => setDeleteId(n.id)}>Delete</Btn>
            </div>
          </div>
        ))}
      </Card>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { const n=notes.find(x => x.id===deleteId); deleteNote(n); }} title="Delete Note" message="This will permanently delete the note and its file." confirmText="Delete" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════ */
function NotificationsTab() {
  const [notifs, setNotifs] = useState(null);
  const [form, setForm]     = useState({ title:'', message:'', type:'Info', batch:'All Batches' });
  const [deleteId,setDeleteId]= useState(null);
  const toast = useToast();

  const load = useCallback(async () => { setNotifs(await DB.getAll('notifications')); }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    if (!form.title || !form.message) { toast('Fill required fields','warning'); return; }
    await DB.save('notifications', { ...form, createdAt:new Date().toISOString() });
    toast('Sent!','success'); setForm({ title:'', message:'', type:'Info', batch:'All Batches' }); load();
  }

  if (!notifs) return <Loader />;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>🔔 Notifications</h1>
      <Card style={{ marginBottom:18 }}>
        <h3 style={{ fontWeight:700, marginBottom:14, fontSize:14 }}>Send New Notification</h3>
        <form onSubmit={add}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} />
            <Select label="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type:e.target.value }))}>
              <option>Info</option><option>Warning</option><option>Alert</option><option>Exam</option>
            </Select>
          </div>
          <Select label="Batch" value={form.batch} onChange={e => setForm(p => ({ ...p, batch:e.target.value }))}>
            {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Textarea label="Message *" value={form.message} onChange={e => setForm(p => ({ ...p, message:e.target.value }))} />
          <Btn type="submit" variant="primary">📤 Send Notification</Btn>
        </form>
      </Card>
      <Card style={{ padding:0 }}>
        {notifs.length===0 ? <div style={{ padding:28 }}><EmptyState icon="🔔" text="No notifications sent" /></div> : notifs.map(n => (
          <div key={n.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 20px', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight:600, marginBottom:3, fontSize:13, display:'flex', gap:6, alignItems:'center' }}>{n.title} <Badge type="info">{n.type}</Badge></div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{n.batch} · {new Date(n.createdAt).toLocaleDateString()}</div>
            </div>
            <Btn variant="danger" size="sm" onClick={() => setDeleteId(n.id)}>Delete</Btn>
          </div>
        ))}
      </Card>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await DB.delete(`notifications/${deleteId}`); toast('Deleted','success'); setDeleteId(null); load(); }} title="Delete" message="Remove this notification?" confirmText="Delete" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   NEWS
══════════════════════════════════════════════ */
function NewsTab() {
  const [news, setNews]     = useState(null);
  const [form, setForm]     = useState({ title:'', content:'' });
  const [deleteId,setDeleteId]= useState(null);
  const toast = useToast();

  const load = useCallback(async () => { setNews(await DB.getAll('news')); }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    if (!form.title || !form.content) { toast('Fill all fields','warning'); return; }
    await DB.save('news', { ...form, createdAt:new Date().toISOString() });
    toast('Posted!','success'); setForm({ title:'', content:'' }); load();
  }

  if (!news) return <Loader />;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>📰 News & Announcements</h1>
      <Card style={{ marginBottom:18 }}>
        <h3 style={{ fontWeight:700, marginBottom:14, fontSize:14 }}>Post New Announcement</h3>
        <form onSubmit={add}>
          <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} />
          <Textarea label="Content *" value={form.content} onChange={e => setForm(p => ({ ...p, content:e.target.value }))} rows={4} />
          <Btn type="submit" variant="primary">📰 Post News</Btn>
        </form>
      </Card>
      <Card style={{ padding:0 }}>
        {news.length===0 ? <div style={{ padding:28 }}><EmptyState icon="📰" text="No news posted" /></div> : news.map(n => (
          <div key={n.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight:700, marginBottom:4, fontSize:13 }}>{n.title}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{n.content?.substring(0,120)}{n.content?.length>120?'…':''}</div>
            </div>
            <Btn variant="danger" size="sm" onClick={() => setDeleteId(n.id)} style={{ flexShrink:0, marginLeft:12 }}>Delete</Btn>
          </div>
        ))}
      </Card>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await DB.delete(`news/${deleteId}`); toast('Deleted','success'); setDeleteId(null); load(); }} title="Delete News" message="Remove this news post?" confirmText="Delete" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MESSAGES
══════════════════════════════════════════════ */
function MessagesTab() {
  const [messages,   setMessages]   = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText,  setReplyText]  = useState('');
  const [deleteId,   setDeleteId]   = useState(null);
  const toast = useToast();

  const load = useCallback(async () => { setMessages(await DB.getAll('student_messages')); }, []);
  useEffect(() => { load(); }, [load]);

  async function sendReply() {
    if (!replyText.trim()) { toast('Write a reply','warning'); return; }
    await DB.update(`student_messages/${replyModal.id}`, { ...replyModal, reply:replyText, status:'Replied', repliedAt:new Date().toISOString() });
    toast('Reply sent!','success'); setReplyModal(null); setReplyText(''); load();
  }

  if (!messages) return <Loader />;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>💬 Student Messages <span style={{ fontSize:15, fontWeight:500, color:'var(--text-muted)' }}>({messages.length})</span></h1>
      <Card style={{ padding:0 }}>
        {messages.length===0 ? <div style={{ padding:28 }}><EmptyState icon="💬" text="No messages" /></div> : messages.map(m => (
          <div key={m.id} style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <span style={{ fontWeight:700, fontSize:14 }}>{m.subject}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:10 }}>{m.studentName} · {m.batch}</span>
              </div>
              <Badge type={m.status==='Replied'?'success':'warning'}>{m.status||'Pending'}</Badge>
            </div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6, lineHeight:1.6 }}>{m.message}</p>
            <small style={{ color:'var(--text-muted)', fontSize:11 }}>{new Date(m.sentAt).toLocaleString()}</small>
            <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center', flexWrap:'wrap' }}>
              {m.reply ? (
                <div style={{ flex:1, padding:'10px 12px', background:'rgba(5,150,105,0.07)', borderRadius:8, borderLeft:'3px solid var(--success)' }}>
                  <strong style={{ fontSize:12, color:'#059669' }}>Your reply: </strong>
                  <span style={{ fontSize:13 }}>{m.reply}</span>
                </div>
              ) : (
                <Btn variant="ghost" size="sm" onClick={() => { setReplyModal(m); setReplyText(''); }}>↩ Reply</Btn>
              )}
              <Btn variant="danger" size="sm" onClick={() => setDeleteId(m.id)}>🗑️ Delete</Btn>
            </div>
          </div>
        ))}
      </Card>
      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Message">
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>Subject: <strong>{replyModal?.subject}</strong></p>
        <Textarea label="Your Reply" value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Type your reply…" />
        <div style={{ display:'flex', gap:12 }}>
          <Btn variant="ghost" onClick={() => setReplyModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
          <Btn variant="primary" onClick={sendReply} style={{ flex:1, justifyContent:'center' }}>Send Reply</Btn>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await DB.delete(`student_messages/${deleteId}`); toast('Deleted','success'); setDeleteId(null); load(); }}
        title="Delete Message" message="Permanently delete this message?" confirmText="Delete" variant="danger" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════ */
function SettingsTab({ admin }) {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'', newUsername:admin.username||'admin' });
  const toast = useToast();

  async function update(e) {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) { toast('Fill all fields','warning'); return; }
    if (form.newPassword !== form.confirmPassword)  { toast('Passwords do not match','error'); return; }
    if (form.newPassword.length < 6)               { toast('Password must be ≥ 6 characters','error'); return; }
    try {
      const settings = await DB.getAll('admin_settings');
      const creds    = settings.find(s => s.type==='credentials');
      if (form.currentPassword !== (creds?.password||'admin123')) { toast('Current password incorrect','error'); return; }
      const payload = { type:'credentials', username:form.newUsername, password:form.newPassword, updatedAt:new Date().toISOString() };
      if (creds) await DB.update(`admin_settings/${creds.id}`, payload);
      else       await DB.save('admin_settings', payload);
      toast('Credentials updated! Please login again.','success');
    } catch(err) { toast(err.message,'error'); }
  }

  return (
    <div className="fade-in">
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>⚙️ Settings</h1>
      <Card style={{ maxWidth:500 }}>
        <h3 style={{ fontWeight:700, marginBottom:20, fontSize:14 }}>🔐 Change Admin Credentials</h3>
        <form onSubmit={update}>
          <Input label="New Username" value={form.newUsername} onChange={e => setForm(p => ({ ...p, newUsername:e.target.value }))} />
          <Input label="Current Password *" type="password" value={form.currentPassword} onChange={e => setForm(p => ({ ...p, currentPassword:e.target.value }))} />
          <Input label="New Password *" type="password" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword:e.target.value }))} />
          <Input label="Confirm New Password *" type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword:e.target.value }))} />
          <Btn type="submit" variant="primary">Update Credentials</Btn>
        </form>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROMOTE / DEMOTE  (batch only, with mode toggle)
══════════════════════════════════════════════ */
function PromoteTab() {
  const [students, setStudents] = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [promoting,setPromoting]= useState(false);
  const [confirm,  setConfirm]  = useState(false);
  const [mode,     setMode]     = useState('promote');
  const toast = useToast();

  const BATCH_ORDER = ['Batch 1','Batch 2','Batch 3','Batch 4'];

  const load = useCallback(async () => { setStudents(await DB.getAll('students')); }, []);
  useEffect(() => { load(); }, [load]);

  function buildPreview(from, to) {
    if (!students) return;
    setPreview({ from, to, affected:students.filter(s => s.batch===from), field:'batch' });
  }

  async function doAction() {
    if (!preview?.affected.length) return;
    setPromoting(true);
    try {
      let count = 0;
      for (const s of preview.affected) {
        await DB.patch(`students/${s.id}`, { batch:preview.to });
        count++;
      }
      toast(`✅ ${count} students ${mode==='promote'?'promoted':'demoted'}: ${preview.from} → ${preview.to}!`, 'success');
      setPreview(null); setConfirm(false); load();
    } catch(err) { toast('Failed: '+err.message,'error'); }
    finally { setPromoting(false); }
  }

  if (!students) return <Loader />;

  const batchCounts = {};
  BATCH_ORDER.forEach(b => { batchCounts[b] = students.filter(s => s.batch===b).length; });

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>🎓 Promote / Demote Students</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Move all students from one batch to another. This updates every student in the selected group.</p>
      </div>

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:4, background:'#f0f4ff', borderRadius:10, padding:3, width:'fit-content', marginBottom:24 }}>
        {[['promote','⬆️ Promote'],['demote','⬇️ Demote']].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:mode===m?'white':'transparent', color:mode===m?(m==='promote'?'#2563eb':'#dc2626'):'var(--text-muted)', fontWeight:mode===m?700:500, fontSize:13, cursor:'pointer', transition:'all 0.15s', boxShadow:mode===m?'0 2px 8px rgba(0,0,0,0.08)':'none', fontFamily:'var(--font-main)' }}>{l}</button>
        ))}
      </div>

      {/* Batch count cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {BATCH_ORDER.map(b => {
          const c = BATCH_COLORS[b];
          return (
            <div key={b} style={{ background:`${c}0d`, border:`1.5px solid ${c}28`, borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:13, color:c, marginBottom:3 }}>{b}</div>
              <div style={{ fontSize:26, fontWeight:900, color:c, lineHeight:1.1 }}>{batchCounts[b]}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>students</div>
            </div>
          );
        })}
      </div>

      <Card style={{ marginBottom:20 }}>
        <h3 style={{ fontWeight:800, fontSize:15, marginBottom:18 }}>{mode==='promote'?'⬆️ Promote Batch':'⬇️ Demote Batch'}</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {(mode==='promote' ? BATCH_ORDER.slice(0,-1) : BATCH_ORDER.slice(1)).map((from, i) => {
            const to    = mode==='promote' ? BATCH_ORDER[i+1] : BATCH_ORDER[i];
            const count = batchCounts[from];
            const c     = BATCH_COLORS[from];
            return (
              <div key={from} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:mode==='promote'?'#f8faff':'#fff8f8', borderRadius:10, border:`1.5px solid ${mode==='promote'?'var(--border)':'rgba(220,38,38,0.1)'}` }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:600, flex:1 }}>
                  <span style={{ color:c }}>{from}</span>
                  <span style={{ color:'var(--text-muted)', margin:'0 8px' }}>→</span>
                  <span style={{ color:BATCH_COLORS[to] }}>{to}</span>
                  <span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:12, marginLeft:8 }}>({count} student{count!==1?'s':''})</span>
                </span>
                <Btn variant={mode==='promote'?'primary':'danger'} size="sm" disabled={count===0} onClick={() => { buildPreview(from, to); setConfirm(true); }}>
                  {mode==='promote' ? 'Promote →' : '← Demote'}
                </Btn>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ background:'#fffbeb', border:'1px solid rgba(217,119,6,0.22)', borderRadius:10, padding:'13px 16px', fontSize:13, color:'#92400e', lineHeight:1.7 }}>
        <strong>⚠️ Important:</strong> This updates the <code style={{ background:'rgba(217,119,6,0.1)', padding:'1px 5px', borderRadius:4 }}>batch</code> field on every matching student. This action cannot be automatically undone.
      </div>

      {/* Confirm Modal */}
      <Modal open={confirm && !!preview} onClose={() => { setConfirm(false); setPreview(null); }} title={mode==='promote'?'Confirm Promotion':'Confirm Demotion'}>
        {preview && (
          <div>
            <div style={{ background:mode==='promote'?'rgba(37,99,235,0.06)':'rgba(220,38,38,0.06)', border:`1px solid ${mode==='promote'?'rgba(37,99,235,0.15)':'rgba(220,38,38,0.15)'}`, borderRadius:10, padding:'18px', marginBottom:18, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{mode==='promote'?'⬆️':'⬇️'}</div>
              <div style={{ fontSize:16, fontWeight:800 }}>
                <span style={{ color:BATCH_COLORS[preview.from] }}>{preview.from}</span>
                <span style={{ color:'var(--text-muted)', margin:'0 10px' }}>→</span>
                <span style={{ color:BATCH_COLORS[preview.to] }}>{preview.to}</span>
              </div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:6 }}>{preview.affected.length} student{preview.affected.length!==1?'s':''} will be {mode==='promote'?'promoted':'demoted'}</div>
            </div>
            {preview.affected.length > 0 && (
              <div style={{ maxHeight:200, overflowY:'auto', border:'1px solid var(--border)', borderRadius:8, marginBottom:16 }}>
                {preview.affected.map(s => (
                  <div key={s.id} style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)', fontSize:13, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:600 }}>{s.name}</span>
                    <span style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:11 }}>{s.registerNumber}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:12 }}>
              <Btn variant="ghost" type="button" onClick={() => { setConfirm(false); setPreview(null); }} style={{ flex:1, justifyContent:'center' }}>Cancel</Btn>
              <Btn variant={mode==='promote'?'primary':'danger'} onClick={doAction} style={{ flex:1, justifyContent:'center' }} disabled={promoting}>
                {promoting ? <Spinner size={14} color="white" /> : `${mode==='promote'?'Promote':'Demote'} ${preview.affected.length} Students`}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}