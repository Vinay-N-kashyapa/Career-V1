'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ParentPage;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const client_1 = require("@/lib/api/client");
const useAppStore_1 = require("@/lib/store/useAppStore");
function ParentPage() {
    const qc = (0, react_query_1.useQueryClient)();
    const [registerNumber, setRegisterNumber] = (0, react_1.useState)('');
    const [selectedStudent, setSelectedStudent] = (0, react_1.useState)(null);
    const { data: students, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['parent', 'students'],
        queryFn: () => client_1.api.get('/api/parent/students').then(r => r.students),
    });
    const { data: overview } = (0, react_query_1.useQuery)({
        queryKey: ['parent', 'overview', selectedStudent],
        queryFn: () => client_1.api.get(`/api/parent/student/${selectedStudent}/overview`),
        enabled: !!selectedStudent,
    });
    const linkMutation = (0, react_query_1.useMutation)({
        mutationFn: (rn) => client_1.api.post('/api/parent/link-student', { registerNumber: rn }),
        onSuccess: () => {
            useAppStore_1.toast.success('Request Sent', 'Student will be notified to approve your request');
            setRegisterNumber('');
            qc.invalidateQueries({ queryKey: ['parent'] });
        },
        onError: (e) => useAppStore_1.toast.error('Failed', e.message),
    });
    return (<div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-hero-title">👨‍👩‍👧 Parent Portal</h1>
          <p className="page-hero-sub">Monitor your child's career development, academic progress, and skill milestones in real time</p>
        </div>
      </div>

      {/* Link student */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Link a Student</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={registerNumber} onChange={e => setRegisterNumber(e.target.value)} placeholder="Enter student register number..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--t1)', fontSize: 13 }}/>
          <button onClick={() => registerNumber && linkMutation.mutate(registerNumber)} disabled={!registerNumber || linkMutation.isPending} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            {linkMutation.isPending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
          The student must approve your request before you can view their progress.
        </p>
      </div>

      {/* Student list */}
      {isLoading ? (<div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Loading...</div>) : !students?.length ? (<div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>
          No linked students yet. Enter a register number above to get started.
        </div>) : (<div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Student sidebar */}
          <div>
            {students.map(s => (<div key={s.id} onClick={() => setSelectedStudent(s.id)} style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                    background: selectedStudent === s.id ? 'var(--accent-light)' : 'var(--card)',
                    border: `1px solid ${selectedStudent === s.id ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.display_name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{s.register_number}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--teal)' }}>ATS: {s.ats_score || 0}</span>
                  <span style={{ fontSize: 11, color: 'var(--amber)' }}>🔥 {s.mission_streak || 0}d</span>
                </div>
              </div>))}
          </div>

          {/* Student detail */}
          <div>
            {!selectedStudent ? (<div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--t3)' }}>
                Select a student to view their progress
              </div>) : !overview ? (<div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Loading...</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Score cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {[
                    { label: 'Career Readiness', value: overview.profile?.career_readiness || 0, color: 'var(--accent)' },
                    { label: 'ATS Score', value: overview.profile?.ats_score || 0, color: 'var(--teal)' },
                    { label: 'Trust Score', value: overview.profile?.trust_score || 0, color: 'var(--green)' },
                    { label: 'Streak', value: `${overview.profile?.mission_streak || 0}d`, color: 'var(--amber)' },
                ].map(card => (<div key={card.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>{card.label}</div>
                    </div>))}
                </div>

                {/* Recent exams */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Recent Exams</div>
                  {overview.recentExams?.length === 0 ? (<p style={{ color: 'var(--t3)', fontSize: 13 }}>No exams taken yet</p>) : (overview.recentExams?.map((exam, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>{exam.exam_name}</span>
                        <span style={{ color: Number(exam.pct) >= 70 ? 'var(--green)' : 'var(--coral)', fontWeight: 600 }}>
                          {exam.pct}%
                        </span>
                      </div>)))}
                </div>

                {/* Weak areas */}
                {overview.profile?.weak_areas?.length > 0 && (<div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Areas to Improve</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {overview.profile.weak_areas.map((area) => (<span key={area} style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--red-light)', color: 'var(--coral)', fontSize: 12 }}>
                          {area}
                        </span>))}
                    </div>
                  </div>)}
              </div>)}
          </div>
        </div>)}
    </div>);
}
