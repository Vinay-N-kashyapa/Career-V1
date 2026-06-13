'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { api } from '@/lib/api/client';

const STAGES = ['onboarding', 'document_collection', 'application', 'visa', 'pre_departure', 'completed'];
const STAGE_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  document_collection: 'Documents',
  application: 'Application',
  visa: 'Visa',
  pre_departure: 'Pre-Departure',
  completed: 'Completed'
};
const VISA_STATUS_COLOR: Record<string, string> = {
  not_started: 'var(--t3)',
  pending: 'var(--amber)',
  approved: 'var(--green)',
  rejected: 'var(--coral)',
  submitted: 'var(--blue)'
};

interface Session {
  id?: string;
  title: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  link?: string;
  notes?: string;
}

export default function ConsultantPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sessions' | 'add' | 'analytics'>('pipeline');
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [selectedStudent, setSelectedStudent] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Checklist Task form
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Add student form
  const [studentForm, setStudentForm] = useState({
    displayName: '', email: '', phone: '', targetCountry: '',
    targetUniversities: '', programType: '', budget: '', intakeYear: '', notes: ''
  });

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionForm, setSessionForm] = useState<Session>({
    title: '', studentId: '', studentName: '', date: '', time: '', link: '', notes: ''
  });
  const [scheduling, setScheduling] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPipeline();
    fetchAnalytics();
    fetchSessions();
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchPipeline() {
    setLoading(true);
    try {
      const d = await api.get<{ pipeline: Record<string, any[]> }>('/api/consultant/pipeline');
      setPipeline(d.pipeline || {});
      // Refresh selected student details if open
      if (selectedStudent) {
        const allStuds = Object.values(d.pipeline || {}).flat();
        const updated = allStuds.find(s => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    } catch {
      triggerToast('Failed to load student pipeline', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const ca = await api.get<Record<string, any>>('/api/consultant/analytics');
      setAnalytics(ca || {});
    } catch {}
  }

  async function fetchSessions() {
    try {
      const d = await api.get<{ sessions: Session[] }>('/api/consultant/sessions');
      setSessions(d.sessions || []);
    } catch {}
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!studentForm.displayName) return;
    try {
      const body = {
        ...studentForm,
        targetUniversities: studentForm.targetUniversities.split(',').map(s => s.trim()).filter(Boolean)
      };
      await api.post('/api/consultant/student/add', body);
      triggerToast('Student added successfully!');
      setStudentForm({ displayName: '', email: '', phone: '', targetCountry: '', targetUniversities: '', programType: '', budget: '', intakeYear: '', notes: '' });
      setActiveTab('pipeline');
      fetchPipeline();
    } catch {
      triggerToast('Failed to add student', 'error');
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/api/consultant/student/${id}`, { status });
      triggerToast(`Stage updated to ${STAGE_LABELS[status]}`);
      fetchPipeline();
    } catch {
      triggerToast('Failed to update stage status', 'error');
    }
  }

  async function handleVerifyDocument(itemId: string, status: 'verified' | 'rejected') {
    if (!selectedStudent) return;
    try {
      await api.post(`/api/consultant/student/${selectedStudent.id}/verify-document`, { itemId, status });
      triggerToast(`Document ${status === 'verified' ? 'verified' : 'rejected'}`);
      fetchPipeline();
    } catch {
      triggerToast('Failed to update document status', 'error');
    }
  }

  async function addTask() {
    if (!newTask.trim() || !selectedStudent) return;
    try {
      await api.post(`/api/consultant/student/${selectedStudent.id}/task`, {
        title: newTask,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || null
      });
      triggerToast('Task checklist item added');
      setNewTask('');
      setNewTaskDueDate('');
      fetchPipeline();
    } catch {
      triggerToast('Failed to add task', 'error');
    }
  }

  async function scheduleSessions(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionForm.title || !sessionForm.studentId || !sessionForm.date) {
      triggerToast('Please fill out required fields', 'error');
      return;
    }
    setScheduling(true);
    try {
      // Find candidate name
      const allStuds = Object.values(pipeline).flat();
      const s = allStuds.find(st => st.id === sessionForm.studentId);
      const studentName = s ? s.displayName : 'Student';
      
      await api.post('/api/consultant/sessions', {
        ...sessionForm,
        studentName
      });
      triggerToast('1:1 Consultation scheduled!');
      setSessionForm({ title: '', studentId: '', studentName: '', date: '', time: '', link: '', notes: '' });
      fetchSessions();
    } catch {
      triggerToast('Failed to schedule session', 'error');
    } finally {
      setScheduling(false);
    }
  }

  const a = analytics;
  const allStudents = Object.values(pipeline).flat();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast alert */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? 'var(--green)' : 'var(--coral)',
          color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: 'var(--shadow-lg)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-hero-title">🎓 Consultant Dashboard</h1>
          <p className="page-hero-sub">Track cohort progress, verify upload credentials, and coordinate consultation sessions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          {(['pipeline', 'sessions', 'add', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)',
                background: activeTab === tab ? 'var(--bg2)' : 'transparent',
                color: activeTab === tab ? 'var(--t1)' : 'var(--t3)',
                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {tab === 'pipeline' ? '📋 Pipeline' : tab === 'sessions' ? '📅 1:1 Sessions' : tab === 'add' ? '+ Add Student' : '📊 Analytics'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: PIPELINE (KANBAN) ───────────────────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 380px' : '1fr', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--t3)' }}>Refreshing student pipeline...</div>
          ) : (
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(195px, 1fr))`, gap: 12, minWidth: 1100 }}>
                {STAGES.map(stage => {
                  const students = pipeline[stage] || [];
                  return (
                    <div
                      key={stage}
                      style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: '16px 12px',
                        minHeight: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-mono)' }}>
                          {STAGE_LABELS[stage]}
                        </span>
                        <span style={{ fontSize: 10, background: 'var(--bg3)', padding: '2px 8px', borderRadius: 10, color: 'var(--t3)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {students.length}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                        {students.map(s => (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStudent(s)}
                            className="glass-card card-hover"
                            style={{
                              background: selectedStudent?.id === s.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg3)',
                              border: `1px solid ${selectedStudent?.id === s.id ? 'var(--accent)' : 'var(--border)'}`,
                              borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--t1)', marginBottom: 4 }}>{s.displayName}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 8 }}>{s.targetCountry} · {s.programType}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: 9.5, padding: '2px 7px', borderRadius: 8,
                                background: `${VISA_STATUS_COLOR[s.visa_status || 'not_started']}15`,
                                color: VISA_STATUS_COLOR[s.visa_status || 'not_started'],
                                border: `1px solid ${VISA_STATUS_COLOR[s.visa_status || 'not_started']}30`,
                                fontFamily: 'var(--font-mono)', fontWeight: 600
                              }}>
                                Visa: {s.visa_status || 'not_started'}
                              </span>
                              
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                <button
                                  title="Schedule 1:1 Consultation Session"
                                  onClick={() => {
                                    setSessionForm(prev => ({ ...prev, studentId: s.id }));
                                    setActiveTab('sessions');
                                  }}
                                  className="btn-ghost"
                                  style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}
                                >
                                  📅
                                </button>
                                {s.vaultItems && s.vaultItems.length > 0 && (
                                  <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    📎{s.vaultItems.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student details panel */}
          {selectedStudent && (
            <div
              className="glass-card"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: 22,
                height: 'fit-content',
                position: 'sticky',
                top: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>{selectedStudent.displayName}</div>
                <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 18 }}>✕</button>
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--t2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
                <div>📧 <strong style={{ color: 'var(--t1)' }}>{selectedStudent.email}</strong></div>
                <div style={{ marginTop: 2 }}>📞 <strong style={{ color: 'var(--t1)' }}>{selectedStudent.phone || 'No phone attached'}</strong></div>
              </div>

              <div style={{ fontSize: 12.5, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                Target: <strong style={{ color: 'var(--accent)' }}>{selectedStudent.targetCountry}</strong> · {selectedStudent.programType}
              </div>

              {/* Status transition dropdown */}
              <div>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Update Stage Status</label>
                <select className="form-input" style={{ width: '100%', marginTop: 6 }} value={selectedStudent.status} onChange={e => updateStatus(selectedStudent.id, e.target.value)}>
                  {STAGES.map(st => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
                </select>
              </div>

              {/* Vault Document Verification */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  Vault Credentials Verification
                </div>
                {(!selectedStudent.vaultItems || selectedStudent.vaultItems.length === 0) ? (
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontStyle: 'italic', padding: 8, background: 'rgba(255,255,255,0.01)', borderRadius: 8, textAlign: 'center' }}>
                    No uploads inside student vault yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedStudent.vaultItems.map((item: any) => (
                      <div key={item.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--t1)' }}>📄 {item.label || item.type}</span>
                          <span className={`badge ${item.status === 'verified' ? 'badge-green' : item.status === 'rejected' ? 'badge-coral' : 'badge-amber'}`} style={{ fontSize: 9, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>
                            {item.status || 'pending'}
                          </span>
                        </div>
                        {item.fileUrl && (
                          <div style={{ marginTop: 2 }}>
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontSize: 11 }}>
                              Review File
                            </a>
                          </div>
                        )}
                        {item.status !== 'verified' && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <button onClick={() => handleVerifyDocument(item.id, 'verified')} className="btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 10.5, flex: 1, justifyContent: 'center' }}>
                              ✓ Verify
                            </button>
                            <button onClick={() => handleVerifyDocument(item.id, 'rejected')} className="btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 10.5, color: 'var(--coral)', border: '1px solid rgba(239,68,68,0.2)', flex: 1, justifyContent: 'center' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks checklist */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  Assigned Checklists
                </div>
                {(!selectedStudent.tasks || selectedStudent.tasks.length === 0) ? (
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontStyle: 'italic', marginBottom: 8 }}>No checklist items assigned.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {((selectedStudent.tasks as any[]) || []).map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11.5, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ color: t.completed ? 'var(--green)' : 'var(--t3)', fontWeight: 'bold' }}>{t.completed ? '✓' : '○'}</span>
                        <span style={{ flex: 1, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--t3)' : 'var(--t1)' }}>
                          {t.title} 
                          {t.priority === 'high' && <span style={{ color: 'var(--coral)', fontSize: 9, marginLeft: 6, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>[HIGH]</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  <input value={newTask} onChange={e => setNewTask(e.target.value)} className="form-input" placeholder="New checklist task..." style={{ fontSize: 11.5 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="form-input" style={{ flex: 1, fontSize: 11, padding: 4 }} value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as any)}>
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium</option>
                      <option value="high">High Priority</option>
                    </select>
                    <button onClick={addTask} className="btn-primary btn-sm" style={{ padding: '4px 12px' }}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: 1:1 SESSIONS ────────────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
          {/* Scheduled Sessions list */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Scheduled Consultations</h3>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', padding: 20, background: 'var(--card)', borderRadius: 10 }}>
                No sessions scheduled yet. Fill out the scheduler form on the right.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map(s => (
                  <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{s.title}</h4>
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>{s.date} @ {s.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                      Student: <strong>{s.studentName}</strong>
                    </div>
                    {s.link && (
                      <div style={{ marginTop: 8, fontSize: 11 }}>
                        Meeting URL: <a href={s.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{s.link}</a>
                      </div>
                    )}
                    {s.notes && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>
                        Notes: {s.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Session form */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, height: 'fit-content' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Schedule a New Session</h3>
            <form onSubmit={scheduleSessions} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Session Title *</label>
                <input className="form-input" style={{ width: '100%' }} value={sessionForm.title} onChange={e => setSessionForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Visa Interview Prep" />
              </div>
              
              <div>
                <label className="form-label">Select Student *</label>
                <select className="form-input" style={{ width: '100%' }} value={sessionForm.studentId} onChange={e => setSessionForm(p => ({ ...p, studentId: e.target.value }))} required>
                  <option value="">-- Choose Candidate --</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.displayName} ({s.targetCountry})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" style={{ width: '100%' }} value={sessionForm.date} onChange={e => setSessionForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Time *</label>
                  <input type="time" className="form-input" style={{ width: '100%' }} value={sessionForm.time} onChange={e => setSessionForm(p => ({ ...p, time: e.target.value }))} required />
                </div>
              </div>

              <div>
                <label className="form-label">Meeting URL</label>
                <input className="form-input" style={{ width: '100%' }} value={sessionForm.link} onChange={e => setSessionForm(p => ({ ...p, link: e.target.value }))} placeholder="https://zoom.us/j/..." />
              </div>

              <div>
                <label className="form-label">Agenda Notes</label>
                <textarea className="form-input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Review documents and mocks..." />
              </div>

              <button type="submit" disabled={scheduling} className="btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>
                {scheduling ? 'Scheduling Session...' : 'Schedule Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB: ADD STUDENT ────────────────────────────────────────────── */}
      {activeTab === 'add' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, maxWidth: 700 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Add New Student Profile</h3>
          <form onSubmit={addStudent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { k: 'displayName', p: 'Full Name *', r: true },
                { k: 'email', p: 'Email Address', r: false },
                { k: 'phone', p: 'Phone Number', r: false },
                { k: 'targetCountry', p: 'Target Country (USA, UK...)', r: false },
                { k: 'programType', p: 'Program (MBA, MS, UG)', r: false },
                { k: 'intakeYear', p: 'Intake Year (e.g. 2026)', r: false },
                { k: 'budget', p: 'Financial Budget Limit', r: false },
              ].map(f => (
                <div key={f.k}>
                  <label className="form-label">{f.p}</label>
                  <input className="form-input" style={{ width: '100%' }} value={(studentForm as Record<string, string>)[f.k]} onChange={e => setStudentForm(x => ({ ...x, [f.k]: e.target.value }))} required={f.r} />
                </div>
              ))}
            </div>
            <div>
              <label className="form-label">Target Universities (comma-separated)</label>
              <input className="form-input" style={{ width: '100%' }} value={studentForm.targetUniversities} onChange={e => setStudentForm(x => ({ ...x, targetUniversities: e.target.value }))} placeholder="Stanford, NYU, NUS" />
            </div>
            <div>
              <label className="form-label">Additional Intake Notes</label>
              <textarea className="form-input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} value={studentForm.notes} onChange={e => setStudentForm(x => ({ ...x, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }}>→ Add Student</button>
          </form>
        </div>
      )}

      {/* ── TAB: ANALYTICS ──────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Active Roster Students', value: a.totalStudents || 0, color: 'var(--accent)' },
            { label: 'Annual Pipeline Revenue', value: `₹${((a.totalRevenue || 0) / 1000).toFixed(0)}K`, color: 'var(--green)' },
            { label: 'Visa Approval Success Rate', value: `${a.visaApprovalRate || 0}%`, color: 'var(--teal)' },
            { label: 'Admissions Offer Success Rate', value: `${a.offerRate || 0}%`, color: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
