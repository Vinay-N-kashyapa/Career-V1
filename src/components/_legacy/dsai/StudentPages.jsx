import React, { useState, useEffect, useCallback } from 'react';
import { DB } from '../firebase.js';
import { Btn, Input, Card, Spinner, EmptyState, Badge } from '../components/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import dsaiLogo from '../assets/dsaiLogo.js';
import { useIsMobile } from '../utils/hooks.js';

/* ── Base64 download — fetch full note from DB then trigger browser download ──
   FIX (Bug 1): TeacherPages saves notes with field name `fileUrl`, not `fileData`.
   We check both so both upload paths work. ── */
async function downloadNote(noteId, fileName, toast) {
  try {
    const full = await DB.getOne(`notes/${noteId}`);
    // Support both field names: fileUrl (TeacherPages) and fileData (legacy)
    const href = full?.fileUrl || full?.fileData;
    if (!href) {
      if (toast) toast('File not found. The teacher may not have attached a file.', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href     = href;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch(e) {
    if (toast) toast('Download failed: ' + e.message, 'error');
  }
}

/* ── Session cache — cleared on every logout via clearStudentCache() ── */
const _cache = {};
export function clearStudentCache() {
  Object.keys(_cache).forEach(k => delete _cache[k]);
}

const SEM_TABS = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];

/* ── Shared page loader ── */
function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:280, flexDirection:'column', gap:14 }}>
      <Spinner size={32} />
      <p style={{ color:'var(--text-muted)', fontSize:13, fontWeight:500 }}>Loading…</p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   STUDENT LOGIN
────────────────────────────────────────────── */
export function StudentLogin({ onBack, onSuccess }) {
  const [id,      setId]      = useState('');
  const [pass,    setPass]    = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleLogin(e) {
    e.preventDefault();
    if (!id.trim() || !pass) { toast('Please fill all fields', 'warning'); return; }
    setLoading(true);
    try {
      const students = await DB.getAll('students');
      const found    = students.find(s => s.registerNumber?.toLowerCase() === id.trim().toLowerCase());
      if (!found)                                    { toast('Student ID not found. Contact admin.', 'error'); return; }
      if (pass !== (found.password || 'student123')) { toast('Incorrect password', 'error'); return; }
      onSuccess(found);
    } catch (err) { toast('Login failed: ' + err.message, 'error'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg-primary)' }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at 50% 30%, rgba(37,99,235,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />
      <Card style={{ maxWidth:420, width:'100%', position:'relative', zIndex:1, padding:'40px 36px', boxShadow:'0 8px 40px rgba(37,99,235,0.12)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src={dsaiLogo} alt="DSAI" style={{ width:68, height:68, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(37,99,235,0.2)', marginBottom:16, display:'block', margin:'0 auto 16px', boxShadow:'0 4px 16px rgba(37,99,235,0.14)' }} />
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>Student Login</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:6, fontWeight:500 }}>BGS Institute of Management · DSAI</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Student ID / Register Number" value={id} onChange={e => setId(e.target.value)} placeholder="e.g. BGS2024001" autoFocus />
          <Input label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" />
          <Btn type="submit" variant="primary" style={{ width:'100%', justifyContent:'center', marginBottom:10, borderRadius:10, padding:'12px' }} disabled={loading}>
            {loading ? <Spinner size={16} color="white" /> : '🔓 Login to Portal'}
          </Btn>
        </form>
        <Btn variant="ghost" style={{ width:'100%', justifyContent:'center' }} onClick={onBack}>← Back to Home</Btn>
        <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:'var(--text-muted)' }}>Contact admin if you don't know your credentials</p>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────
   STUDENT DASHBOARD
────────────────────────────────────────────── */

export function StudentDashboard({ student, onLogout, onStartExam, examCheckLoading }) {
  const [activeTab,    setActiveTab]    = useState('home');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { id:'home',          icon:'🏠', label:'Home'          },
    { id:'exams',         icon:'📝', label:'My Exams'      },
    { id:'results',       icon:'📊', label:'My Results'    },
    { id:'notes',         icon:'📚', label:'Study Notes'   },
    { id:'notifications', icon:'🔔', label:'Notifications' },
    { id:'news',          icon:'📰', label:'News'          },
    { id:'profile',       icon:'👤', label:'Profile'       },
    { id:'contact',       icon:'💬', label:'Contact Admin' },
  ];

  // Mobile: show only 5 most used tabs in bottom bar
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-primary)' }}>
      {/* Sidebar — hidden on mobile */}
      {!isMobile && (
        <aside style={{ width:215, flexShrink:0, background:'white', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto', boxShadow:'2px 0 12px rgba(37,99,235,0.06)' }}>
          <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <img src={dsaiLogo} alt="DSAI" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'1.5px solid rgba(37,99,235,0.2)', flexShrink:0 }} />
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:'var(--text-primary)' }}>BGS Institute</div>
                <div style={{ fontSize:10, color:'var(--accent)', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>Student Portal</div>
              </div>
            </div>
          </div>

          <div style={{ padding:'14px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,#eff6ff,#f8faff)', textAlign:'center' }}>
            <div style={{ width:50, height:50, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', fontSize:20, color:'white', overflow:'hidden', border:'2px solid white', boxShadow:'0 2px 10px rgba(37,99,235,0.2)' }}>
              {student.photo ? <img src={student.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : '👤'}
            </div>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:2, color:'var(--text-primary)' }}>{student.name}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:6, fontFamily:'var(--font-mono)' }}>{student.registerNumber}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:20, padding:'3px 10px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563eb', display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#1d4ed8' }}>{student.batch}</span>
            </div>
          </div>

          <nav style={{ flex:1, padding:'8px 7px' }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 10px',
                background: activeTab===item.id ? 'rgba(37,99,235,0.09)' : 'transparent',
                border: activeTab===item.id ? '1px solid rgba(37,99,235,0.18)' : '1px solid transparent',
                borderRadius:9, cursor:'pointer',
                color: activeTab===item.id ? '#1d4ed8' : 'var(--text-secondary)',
                fontWeight: activeTab===item.id ? 700 : 400,
                fontSize:13, textAlign:'left', transition:'all 0.15s', marginBottom:2,
                fontFamily:'var(--font-main)',
              }}>
                <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>

          <div style={{ padding:'9px 7px', borderTop:'1px solid var(--border)' }}>
            <button onClick={onLogout} style={{ width:'100%', padding:'9px 10px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.14)', borderRadius:9, cursor:'pointer', color:'#dc2626', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-main)' }}>
              🚪 Logout
            </button>
          </div>
        </aside>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, background:'white', borderBottom:'1px solid var(--border)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(37,99,235,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <img src={dsaiLogo} alt="DSAI" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--text-primary)', lineHeight:1.2 }}>BGS Institute</div>
              <div style={{ fontSize:9, color:'var(--accent)', fontWeight:700, textTransform:'uppercase' }}>Student Portal</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>{student.name.split(' ')[0]}</span>
            <button onClick={onLogout} style={{ background:'rgba(220,38,38,0.07)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:7, padding:'5px 9px', cursor:'pointer', color:'#dc2626', fontWeight:700, fontSize:11, fontFamily:'var(--font-main)' }}>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', padding: isMobile ? '70px 14px 80px' : '26px 30px', minWidth:0 }}>
        {activeTab==='home'          && <HomeTab          student={student} onStartExam={onStartExam} examCheckLoading={examCheckLoading} />}
        {activeTab==='exams'         && <ExamsTab         student={student} onStartExam={onStartExam} examCheckLoading={examCheckLoading} />}
        {activeTab==='results'       && <ResultsTab       student={student} />}
        {activeTab==='notes'         && <NotesTab         student={student} />}
        {activeTab==='notifications' && <NotificationsTab student={student} />}
        {activeTab==='news'          && <NewsTab />}
        {activeTab==='profile'       && <ProfileTab       student={student} />}
        {activeTab==='contact'       && <ContactTab       student={student} />}
      </main>

      {/* Mobile bottom nav bar */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid var(--border)', display:'flex', zIndex:50, boxShadow:'0 -2px 12px rgba(37,99,235,0.09)' }}>
          {mobileNavItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMoreMenuOpen(false); }}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 4px', background:'none', border:'none', cursor:'pointer', color: active ? 'var(--accent)' : 'var(--text-muted)', fontFamily:'var(--font-main)', transition:'all 0.15s' }}>
                <span style={{ fontSize:20, lineHeight:1, marginBottom:3 }}>{item.icon}</span>
                <span style={{ fontSize:9, fontWeight: active ? 700 : 500 }}>{item.label}</span>
                {active && <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', marginTop:2 }} />}
              </button>
            );
          })}
          {/* More button — opens a tray showing remaining tabs */}
          <div style={{ flex:1, position:'relative' }}>
            {moreMenuOpen && (
              <>
                {/* Backdrop */}
                <div onClick={() => setMoreMenuOpen(false)}
                  style={{ position:'fixed', inset:0, zIndex:48 }} />
                {/* Tray */}
                <div style={{ position:'absolute', bottom:'100%', right:0, background:'white', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 -4px 24px rgba(37,99,235,0.13)', padding:'8px', zIndex:49, minWidth:160, marginBottom:6 }}>
                  {navItems.slice(5).map(item => {
                    const active = activeTab === item.id;
                    return (
                      <button key={item.id}
                        onClick={() => { setActiveTab(item.id); setMoreMenuOpen(false); }}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background: active ? 'rgba(37,99,235,0.09)' : 'transparent', border:'none', borderRadius:8, cursor:'pointer', color: active ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: active ? 700 : 500, fontSize:13, fontFamily:'var(--font-main)', transition:'all 0.12s' }}>
                        <span style={{ fontSize:16 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <button
              onClick={() => setMoreMenuOpen(o => !o)}
              style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 4px', background:'none', border:'none', cursor:'pointer', color: navItems.slice(5).some(t => t.id === activeTab) ? 'var(--accent)' : 'var(--text-muted)', fontFamily:'var(--font-main)', transition:'all 0.15s' }}>
              <span style={{ fontSize:20, lineHeight:1, marginBottom:3 }}>
                {navItems.slice(5).find(t => t.id === activeTab)?.icon ?? '⋯'}
              </span>
              <span style={{ fontSize:9, fontWeight: navItems.slice(5).some(t => t.id === activeTab) ? 700 : 500 }}>More</span>
              {navItems.slice(5).some(t => t.id === activeTab) && <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', marginTop:2 }} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeTab({ student, onStartExam, examCheckLoading }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [results, schedules, notifications, news] = await Promise.all([
        DB.getAll('exam_results'), DB.getAll('exam_schedule'),
        DB.getAll('notifications'), DB.getAll('news'),
      ]);
      if (cancelled) return;
      const now          = new Date();
      const myResults    = results.filter(r => r.registerNumber === student.registerNumber);
      const activeExams  = schedules.filter(s => {
        const start = new Date(s.startDateTime), end = new Date(s.endDateTime);
        return now >= start && now <= end && (s.batch === student.batch || s.batch === 'All Batches');
      });
      const attemptedIds = myResults.map(r => r.examScheduleId);
      const myNotifs     = notifications.filter(n => n.batch === student.batch || n.batch === 'All Batches');
      const avg          = myResults.length
        ? (myResults.reduce((s, r) => s + parseFloat(r.percentage || 0), 0) / myResults.length).toFixed(1)
        : 0;
      setData({ myResults, activeExams, myNotifs, news, avg, attemptedIds });
    }
    load();
    return () => { cancelled = true; };
  // FIX: depend on stable primitives, not the whole student object (prevents infinite re-fetch loop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.registerNumber, student.batch]);

  if (!data) return <PageLoader />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>Welcome back, {student.name.split(' ')[0]}! 👋</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>Here's your academic overview</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          { value:data.activeExams.length, label:'Active Exams',  icon:'🔴', color:'#dc2626', bg:'#fff1f2' },
          { value:data.myResults.length,   label:'Completed',     icon:'✅', color:'#059669', bg:'#f0fdf4' },
          { value:`${data.avg}%`,          label:'Avg Score',     icon:'📊', color:'#2563eb', bg:'#eff6ff' },
          { value:data.myNotifs.length,    label:'Notifications', icon:'🔔', color:'#d97706', bg:'#fffbeb' },
        ].map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1.5px solid ${s.color}20`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Live exams */}
      {data.activeExams.length > 0 && (
        <div style={{ marginBottom:18, background:'white', border:'2px solid #dc2626', borderRadius:14, padding:'16px 18px', boxShadow:'0 4px 18px rgba(220,38,38,0.09)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            <h3 style={{ fontWeight:800, fontSize:13, color:'#dc2626' }}>LIVE EXAMS AVAILABLE</h3>
          </div>
          {data.activeExams.map(exam => {
            const attempted = data.attemptedIds.includes(exam.id);
            return (
              <div key={exam.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', background:attempted?'#f8faff':'#fef2f2', borderRadius:10, marginBottom:8, border:`1px solid ${attempted?'var(--border)':'rgba(220,38,38,0.15)'}` }}>
                <div>
                  <div style={{ fontWeight:700, marginBottom:3, fontSize:13 }}>{exam.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>⏱ {exam.duration} min · Ends {new Date(exam.endDateTime).toLocaleTimeString()}</div>
                </div>
                {attempted ? <Badge type="success">✅ Completed</Badge> : (
                  <Btn variant="primary" size="sm" onClick={() => onStartExam(exam)} disabled={examCheckLoading}>
                    {examCheckLoading ? <><Spinner size={12} color="white" /> Checking…</> : 'Start →'}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {data.myNotifs.length > 0 && (
          <Card>
            <h3 style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>🔔 Recent Notifications</h3>
            {data.myNotifs.slice(0,3).map(n => (
              <div key={n.id} style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                <Badge type={n.type==='Warning'?'warning':n.type==='Alert'?'danger':'info'}>{n.type||'Info'}</Badge>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{n.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{n.message}</div>
                </div>
              </div>
            ))}
          </Card>
        )}
        {data.news.length > 0 && (
          <Card>
            <h3 style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>📰 Latest News</h3>
            {data.news.slice(0,3).map(n => (
              <div key={n.id} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{n.title}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{n.content.slice(0,100)}{n.content.length>100?'…':''}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   EXAMS TAB
────────────────────────────────────────────── */
function ExamsTab({ student, onStartExam, examCheckLoading }) {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const [schedules, results] = await Promise.all([DB.getAll('exam_schedule'), DB.getAll('exam_results')]);
    const now          = new Date();
    const attemptedIds = results.filter(r => r.registerNumber === student.registerNumber).map(r => r.examScheduleId);
    const myExams      = schedules.filter(s => s.batch === student.batch || s.batch === 'All Batches');
    setData({
      active:   myExams.filter(s => now >= new Date(s.startDateTime) && now <= new Date(s.endDateTime)),
      upcoming: myExams.filter(s => new Date(s.startDateTime) > now),
      past:     myExams.filter(s => new Date(s.endDateTime) < now),
      attemptedIds,
    });
  // FIX: stable primitives only — avoid object-identity dep causing infinite reload
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.registerNumber, student.batch]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <PageLoader />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>📝 My Exams</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>{student.batch}</p>
      </div>

      <Card style={{ marginBottom:14, border:'1.5px solid rgba(220,38,38,0.2)' }}>
        <h3 style={{ fontWeight:700, fontSize:13, color:'#dc2626', marginBottom:12 }}>🔴 Active Exams</h3>
        {data.active.length===0 ? <EmptyState icon="📝" text="No active exams right now" /> : data.active.map(exam => {
          const attempted = data.attemptedIds.includes(exam.id);
          return (
            <div key={exam.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:attempted?'#f8faff':'#fef2f2', borderRadius:10, marginBottom:8, border:`1px solid ${attempted?'var(--border)':'rgba(220,38,38,0.15)'}` }}>
              <div>
                <div style={{ fontWeight:700, marginBottom:3, fontSize:13 }}>{exam.title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>⏱ {exam.duration} min · Ends {new Date(exam.endDateTime).toLocaleString()}</div>
              </div>
              {attempted ? <Badge type="success">✅ Done</Badge> : (
                <Btn variant="primary" size="sm" onClick={() => onStartExam(exam)} disabled={examCheckLoading}>
                  {examCheckLoading ? <><Spinner size={12} color="white" /> Checking…</> : 'Start →'}
                </Btn>
              )}
            </div>
          );
        })}
      </Card>

      <Card style={{ marginBottom:14 }}>
        <h3 style={{ fontWeight:700, fontSize:13, color:'#2563eb', marginBottom:12 }}>⏳ Upcoming Exams</h3>
        {data.upcoming.length===0 ? <EmptyState icon="📅" text="No upcoming exams" /> : data.upcoming.map(exam => (
          <div key={exam.id} style={{ padding:'10px 14px', background:'#f8faff', borderRadius:10, marginBottom:8, border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:600, marginBottom:2, fontSize:13 }}>{exam.title}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>⏱ {exam.duration} min · Starts {new Date(exam.startDateTime).toLocaleString()}</div>
          </div>
        ))}
      </Card>

      <Card>
        <h3 style={{ fontWeight:700, fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>✅ Past Exams</h3>
        {data.past.length===0 ? <EmptyState icon="📋" text="No past exams" /> : data.past.map(exam => (
          <div key={exam.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{exam.title}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(exam.startDateTime).toLocaleDateString()}</div>
            </div>
            {data.attemptedIds.includes(exam.id) ? <Badge type="success">Submitted</Badge> : <Badge type="danger">Missed</Badge>}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────
   RESULTS TAB — gated by admin result_visibility
────────────────────────────────────────────── */
function ResultsTab({ student }) {
  const [results,   setResults]   = useState(null);
  const [revealMap, setRevealMap] = useState(null);

  const load = useCallback(async () => {
    const [all, vis] = await Promise.all([
      DB.getAll('exam_results'),
      DB.getAll('result_visibility'),
    ]);
    const map = {};
    // FIX: revealed is stored as boolean true, compare strictly
    vis.forEach(v => { map[v.examScheduleId] = v.revealed === true; });
    setResults(all.filter(r => r.registerNumber === student.registerNumber));
    setRevealMap(map);
  }, [student.registerNumber]);
  useEffect(() => { load(); }, [load]);

  if (!results || !revealMap) return <PageLoader />;

  const visible = results.filter(r => !!revealMap[r.examScheduleId]);
  const hidden  = results.length - visible.length;
  const avg     = visible.length ? (visible.reduce((s, r) => s + parseFloat(r.percentage || 0), 0) / visible.length).toFixed(1) : 0;
  const best    = visible.length ? Math.max(...visible.map(r => parseFloat(r.percentage || 0))).toFixed(1) : 0;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>📊 My Results</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>{results.length} exam{results.length!==1?'s':''} taken · {student.batch}</p>
      </div>

      {hidden > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fffbeb', border:'1.5px solid rgba(217,119,6,0.25)', borderRadius:12, padding:'11px 14px', marginBottom:14 }}>
          <span style={{ fontSize:18 }}>🔒</span>
          <p style={{ color:'#92400e', fontWeight:500, fontSize:12, margin:0 }}>
            <strong>{hidden}</strong> result{hidden!==1?' are':' is'} pending release by admin.
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <Card><EmptyState icon="📊" text={results.length>0 ? 'Results not yet published by admin' : 'No results yet. Take your first exam!'} /></Card>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
            {[
              { label:'Exams Taken',   value:visible.length, icon:'📝', color:'#2563eb', bg:'#eff6ff' },
              { label:'Average Score', value:`${avg}%`,      icon:'📊', color:'#059669', bg:'#f0fdf4' },
              { label:'Best Score',    value:`${best}%`,     icon:'🏆', color:'#d97706', bg:'#fffbeb' },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, border:`1.5px solid ${s.color}20`, borderRadius:12, padding:'13px 15px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:18, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, fontWeight:600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <Card style={{ padding:0 }}>
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>Exam</th><th>Date</th><th>Score</th><th>%</th><th>Grade</th><th>Tab Switches</th></tr></thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>{r.examTitle||'Exam'}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600 }}>{r.score}</td>
                      <td><Badge type={parseFloat(r.percentage)>=50?'success':'danger'}>{r.percentage}</Badge></td>
                      <td style={{ fontWeight:800, color:parseFloat(r.percentage)>=50?'var(--success)':'var(--danger)', fontSize:14 }}>{r.grade}</td>
                      <td><Badge type={r.tabSwitches>0?'warning':'success'}>{r.tabSwitches||0}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   NOTES TAB — 6 semester tabs + search
────────────────────────────────────────────── */
function NotesTab({ student }) {
  const [notes,     setNotes]     = useState(null);
  const [activeSem, setActiveSem] = useState('All');
  const [search,    setSearch]    = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    const all      = await DB.getAll('notes');
    // Strip file blob fields from list — fetched individually on download
    // FIX: strip both fileUrl AND fileData so neither blob sits in cache memory
    const filtered = all
      .filter(n => n.batch === student.batch || n.batch === 'All Batches')
      .map(({ fileData, fileUrl, ...meta }) => meta);
    _cache[`notes_${student.batch}`] = filtered;
    setNotes(filtered);
  }, [student.batch]);

  useEffect(() => {
    const cached = _cache[`notes_${student.batch}`];
    if (cached) { setNotes(cached); return; }
    load();
  }, [load, student.batch]);

  function fileIcon(n) {
    if (!n)                                     return '📄';
    if (n.endsWith('.pdf'))                     return '📕';
    if (n.match(/\.pptx?$/))                   return '📊';
    if (n.match(/\.docx?$/))                   return '📝';
    if (n.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️';
    return '📄';
  }
  function fmt(b) {
    if (!b) return '';
    return b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';
  }

  if (!notes) return <PageLoader />;

  const bySem    = activeSem === 'All' ? notes : notes.filter(n => n.semester === activeSem);
  const filtered = bySem.filter(n =>
    !search ||
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom:14 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>📚 Study Notes</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Materials for {student.batch}</p>
      </div>

      {/* Semester tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:12, background:'white', border:'1px solid var(--border)', borderRadius:10, padding:3, width:'fit-content', flexWrap:'wrap', boxShadow:'0 1px 6px rgba(37,99,235,0.06)' }}>
        {SEM_TABS.map(s => {
          const count  = s==='All' ? notes.length : notes.filter(n => n.semester===s).length;
          const active = activeSem===s;
          return (
            <button key={s} onClick={() => { setActiveSem(s); setSearch(''); }} style={{
              padding:'6px 12px', borderRadius:7, border:'none',
              background: active ? '#2563eb' : 'transparent',
              color: active ? 'white' : count===0 ? '#cbd5e1' : 'var(--text-secondary)',
              fontWeight: active ? 700 : 500, fontSize:12,
              cursor: count===0 && s!=='All' ? 'default' : 'pointer',
              transition:'all 0.15s', whiteSpace:'nowrap',
              display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-main)',
            }}>
              {s}
              {count > 0 && (
                <span style={{ background:active?'rgba(255,255,255,0.25)':'rgba(37,99,235,0.1)', color:active?'white':'#2563eb', borderRadius:10, padding:'1px 5px', fontSize:10, fontWeight:700 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--text-muted)' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or subject…"
          style={{ paddingLeft:32, borderRadius:9, fontSize:13, padding:'9px 12px 9px 32px', width:'100%', background:'white', border:'1.5px solid var(--border)' }} />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon="📚" text={search?`No notes matching "${search}"`:activeSem==='All'?'No notes uploaded yet':`No notes for ${activeSem} yet`} /></Card>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:12 }}>
          {filtered.map(n => (
            <div key={n.id} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:12, padding:'14px', transition:'all 0.18s', boxShadow:'0 1px 6px rgba(37,99,235,0.05)', display:'flex', flexDirection:'column' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,0.11)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 6px rgba(37,99,235,0.05)'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(37,99,235,0.09)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{fileIcon(n.fileName)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-primary)' }}>{n.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{n.subject||'General'}</div>
                </div>
                {n.semester && (
                  <span style={{ background:'rgba(37,99,235,0.09)', color:'#1d4ed8', borderRadius:6, padding:'2px 6px', fontSize:10, fontWeight:700, flexShrink:0 }}>{n.semester}</span>
                )}
              </div>
              {n.description && (
                <p style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.55, marginBottom:10, flexGrow:1 }}>
                  {n.description.slice(0,70)}{n.description.length>70?'…':''}
                </p>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:500 }}>
                  {n.fileSize ? fmt(n.fileSize)+' · ' : ''}{new Date(n.uploadedAt).toLocaleDateString()}
                </div>
                {n.fileName && (
                  <Btn variant="primary" size="sm" style={{ fontSize:11, padding:'5px 10px' }}
                    onClick={() => downloadNote(n.id, n.fileName, toast)}>
                    📥 Download
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   NOTIFICATIONS TAB
────────────────────────────────────────────── */
function NotificationsTab({ student }) {
  const [notifs, setNotifs] = useState(null);

  const load = useCallback(async () => {
    const all      = await DB.getAll('notifications');
    const filtered = all.filter(n => n.batch === student.batch || n.batch === 'All Batches');
    _cache[`notifs_${student.batch}`] = filtered;
    setNotifs(filtered);
  }, [student.batch]);

  useEffect(() => {
    const cached = _cache[`notifs_${student.batch}`];
    if (cached) { setNotifs(cached); return; }
    load();
  }, [load, student.batch]);

  if (!notifs) return <PageLoader />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>🔔 Notifications</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>{notifs.length} notification{notifs.length!==1?'s':''}</p>
      </div>
      {notifs.length===0 ? <Card><EmptyState icon="🔔" text="No notifications" /></Card> : notifs.map(n => (
        <div key={n.id} style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, padding:'13px 15px', marginBottom:10, boxShadow:'0 1px 6px rgba(37,99,235,0.05)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>{n.title}</span>
            <Badge type={n.type==='Warning'?'warning':n.type==='Alert'?'danger':'info'}>{n.type||'Info'}</Badge>
          </div>
          <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{n.message}</p>
          <small style={{ color:'var(--text-muted)', fontSize:11, marginTop:5, display:'block' }}>{new Date(n.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   NEWS TAB
────────────────────────────────────────────── */
function NewsTab() {
  const [news, setNews] = useState(null);

  useEffect(() => {
    if (_cache['news']) { setNews(_cache['news']); return; }
    DB.getAll('news').then(d => { _cache['news'] = d; setNews(d); });
  }, []);

  if (!news) return <PageLoader />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>📰 News & Announcements</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Latest from BGS Institute</p>
      </div>
      {news.length===0 ? <Card><EmptyState icon="📰" text="No news" /></Card> : news.map(n => (
        <div key={n.id} style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', marginBottom:10, boxShadow:'0 1px 6px rgba(37,99,235,0.05)' }}>
          <div style={{ fontWeight:700, marginBottom:5, fontSize:14, color:'var(--text-primary)' }}>{n.title}</div>
          <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:7 }}>{n.content}</p>
          <small style={{ color:'var(--text-muted)', fontSize:11 }}>Posted {new Date(n.createdAt).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   PROFILE TAB
────────────────────────────────────────────── */
function ProfileTab({ student }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>👤 My Profile</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Your student account details</p>
      </div>
      <div style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:16, overflow:'hidden', maxWidth:520, boxShadow:'0 2px 14px rgba(37,99,235,0.08)' }}>
        <div style={{ background:'linear-gradient(135deg,#eff6ff,#f5f3ff)', padding:'26px', textAlign:'center', borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:30, color:'white', overflow:'hidden', border:'3px solid white', boxShadow:'0 4px 16px rgba(37,99,235,0.2)' }}>
            {student.photo ? <img src={student.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
          </div>
          <h2 style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.3px', color:'var(--text-primary)', marginBottom:6 }}>{student.name}</h2>
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700, color:'#1d4ed8' }}>
            🎓 {student.batch}
          </div>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Register Number', value:student.registerNumber, mono:true },
              { label:'Email',           value:student.email||'N/A'             },
              { label:'Phone',           value:student.phone||'N/A'             },
              { label:'Batch',           value:student.batch                     },
              { label:'Joined',          value:student.createdAt?new Date(student.createdAt).toLocaleDateString():'N/A' },
            ].map((f,i) => (
              <div key={i} style={{ background:'#f8faff', padding:'11px 13px', borderRadius:9, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-muted)', marginBottom:4 }}>{f.label}</div>
                <div style={{ fontWeight:600, fontSize:13, fontFamily:f.mono?'var(--font-mono)':'inherit', color:'var(--text-primary)' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   CONTACT TAB
────────────────────────────────────────────── */
function ContactTab({ student }) {
  const [messages, setMessages] = useState(null);
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const all = await DB.getAll('student_messages');
    setMessages(all.filter(m => m.studentId === student.registerNumber));
  }, [student.registerNumber]);
  useEffect(() => { load(); }, [load]);

  async function sendMsg() {
    if (!subject.trim() || !message.trim()) { toast('Fill all fields', 'warning'); return; }
    setSending(true);
    try {
      await DB.save('student_messages', {
        studentId:   student.registerNumber,
        studentName: student.name,
        batch:       student.batch,
        subject:     subject.trim(),
        message:     message.trim(),
        status:      'Pending',
        sentAt:      new Date().toISOString(),
      });
      toast('Message sent!', 'success'); setSubject(''); setMessage(''); load();
    } catch (err) { toast('Error: '+err.message, 'error'); }
    finally { setSending(false); }
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:3 }}>💬 Contact Admin</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Send a message to the admin team</p>
      </div>

      <Card style={{ marginBottom:14 }}>
        <h3 style={{ fontWeight:700, fontSize:13, marginBottom:13 }}>Send a Message</h3>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
          style={{ marginBottom:10, width:'100%', padding:'10px 13px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'var(--font-main)', background:'#f8faff' }} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your message…" rows={4}
          style={{ marginBottom:13, width:'100%', padding:'10px 13px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'var(--font-main)', resize:'vertical', background:'#f8faff' }} />
        <Btn variant="primary" onClick={sendMsg} disabled={sending}>
          {sending ? <Spinner size={14} color="white" /> : '📤 Send'}
        </Btn>
      </Card>

      <Card>
        <h3 style={{ fontWeight:700, fontSize:13, marginBottom:13 }}>Message History</h3>
        {!messages ? <div style={{ textAlign:'center', padding:20 }}><Spinner size={22} /></div>
          : messages.length===0 ? <EmptyState icon="💬" text="No messages yet" />
          : messages.map(m => (
            <div key={m.id} style={{ padding:'12px', background:'#f8faff', borderRadius:10, marginBottom:10, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <strong style={{ fontSize:13, color:'var(--text-primary)' }}>{m.subject}</strong>
                <Badge type={m.status==='Replied'?'success':'warning'}>{m.status||'Pending'}</Badge>
              </div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:5, lineHeight:1.6 }}>{m.message}</p>
              <small style={{ color:'var(--text-muted)', fontSize:11 }}>{new Date(m.sentAt).toLocaleString()}</small>
              {m.reply && (
                <div style={{ marginTop:9, padding:'9px 12px', background:'rgba(5,150,105,0.07)', borderRadius:8, borderLeft:'3px solid var(--success)' }}>
                  <strong style={{ fontSize:12, color:'#059669' }}>Admin Reply: </strong>
                  <span style={{ fontSize:13 }}>{m.reply}</span>
                </div>
              )}
            </div>
          ))
        }
      </Card>
    </div>
  );
}