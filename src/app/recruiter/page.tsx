'use client';
import { api } from '@/lib/api/client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Candidate {
  id: string;
  display_name: string;
  ats_score: number;
  trust_score: number;
  career_dna_score: number;
  mission_streak: number;
  recruiter_visibility: number;
  communication_score: number;
  execution_score: number;
  skill_tags: string[];
  missions_done: number;
  interviews_done: number;
  vaultItems?: any[];
}

interface Job {
  id?: string;
  title: string;
  company: string;
  department?: string;
  industry?: string;
  location?: string;
  work_mode?: string;
  job_type?: string;
  experience_level?: string;
  salary_range?: string;
  openings?: number;
  deadline?: string;
  skills_required?: string;
  description?: string;
  responsibilities?: string;
}

interface JobApplication {
  id: string;
  uid: string;
  oppId: string;
  status: string;
  appliedAt: string;
  jobTitle: string;
  jobCompany: string;
  user: {
    full_name: string;
    email: string;
    phone: string;
    ats_score: number;
    trust_score: number;
    career_dna_score: number;
  } | null;
}

interface CompanyProfile {
  company_name: string;
  tagline: string;
  logo_url: string;
  industry: string;
  company_size: string;
  founded_year: string;
  website: string;
  headquarters: string;
  about: string;
}

const emptyJob: Job = {
  title: '',
  company: '',
  department: '',
  industry: '',
  location: '',
  work_mode: 'Remote',
  job_type: 'Full-time',
  experience_level: 'Fresher / Entry Level (0–1 yr)',
  salary_range: '',
  openings: 1,
  deadline: '',
  skills_required: '',
  description: '',
  responsibilities: ''
};

const emptyCompany: CompanyProfile = {
  company_name: '',
  tagline: '',
  logo_url: '',
  industry: 'Technology',
  company_size: '1-10 employees',
  founded_year: '',
  website: '',
  headquarters: '',
  about: ''
};

export default function RecruiterPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'applications' | 'company'>('candidates');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ minTrust: '', minAts: '', domain: '' });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState<Job>(emptyJob);
  const [jobSaving, setJobSaving] = useState(false);
  
  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appReviewing, setAppReviewing] = useState<JobApplication | null>(null);
  const [updatingAppStatus, setUpdatingAppStatus] = useState<string | null>(null);

  // Company state
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(emptyCompany);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyEditing, setCompanyEditing] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (user && !['recruiter', 'admin'].includes(user.role)) {
      router.push('/dashboard');
    } else if (user) {
      fetchCandidates();
      fetchAnalytics();
      fetchJobs();
      fetchApplications();
      fetchCompany();
    }
  }, [user]);

  // Toast helper
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchCandidates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.minTrust) params.set('minTrust', filters.minTrust);
      if (filters.minAts) params.set('minAts', filters.minAts);
      if (filters.domain) params.set('domain', filters.domain);
      const d = await api.get<{ candidates: Candidate[] }>(`/api/recruiter/candidates?${params}`);
      setCandidates(d.candidates || []);
    } catch {
      triggerToast('Failed to load candidates', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const d = await api.get<{ analytics: Record<string, number> }>('/api/recruiter/analytics');
      setAnalytics(d.analytics || {});
    } catch {}
  }

  async function fetchJobs() {
    try {
      const d = await api.get<{ jobs: Job[] }>('/api/recruiter/jobs');
      setJobs(d.jobs || []);
    } catch {}
  }

  async function fetchApplications() {
    try {
      const d = await api.get<{ applications: JobApplication[] }>('/api/recruiter/applications');
      setApplications(d.applications || []);
    } catch {}
  }

  async function fetchCompany() {
    setCompanyLoading(true);
    try {
      const d = await api.get<{ company: CompanyProfile | null }>('/api/recruiter/company');
      if (d.company) {
        setCompanyProfile(d.company);
      } else {
        setCompanyProfile(prev => ({ ...prev, company_name: user?.displayName || 'My Enterprise' }));
      }
    } catch {
      triggerToast('Failed to load company profile', 'error');
    } finally {
      setCompanyLoading(false);
    }
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompanySaving(true);
    try {
      await api.post('/api/recruiter/company', companyProfile);
      triggerToast('Company profile saved successfully!');
      setCompanyEditing(false);
    } catch {
      triggerToast('Failed to save company profile', 'error');
    } finally {
      setCompanySaving(false);
    }
  }

  async function postJob(e: React.FormEvent) {
    e.preventDefault();
    if (!jobForm.title) {
      triggerToast('Job title is required', 'error');
      return;
    }
    setJobSaving(true);
    try {
      await api.post('/api/recruiter/jobs', {
        ...jobForm,
        company: companyProfile.company_name
      });
      triggerToast('Job posted successfully!');
      setShowJobModal(false);
      setJobForm(emptyJob);
      fetchJobs();
    } catch {
      triggerToast('Failed to post job', 'error');
    } finally {
      setJobSaving(false);
    }
  }

  async function handleDeleteJob(id: string) {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.delete(`/api/recruiter/jobs/${id}`);
      triggerToast('Job posting deleted.');
      fetchJobs();
    } catch {
      triggerToast('Failed to delete job', 'error');
    }
  }

  async function handleUpdateAppStatus(applicationId: string, status: string) {
    setUpdatingAppStatus(status);
    try {
      await api.post('/api/recruiter/applications', { applicationId, status });
      triggerToast(`Application status updated to ${status}`);
      setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status } : a));
      if (appReviewing?.id === applicationId) {
        setAppReviewing(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      triggerToast('Failed to update status', 'error');
    } finally {
      setUpdatingAppStatus(null);
    }
  }

  async function viewCandidate(id: string) {
    try {
      const d = await api.get<{ candidate: Candidate }>(`/api/recruiter/candidate/${id}`);
      setSelectedCandidate(d.candidate || null);
    } catch {
      triggerToast('Failed to fetch candidate details', 'error');
    }
  }

  async function shortlist(id: string) {
    try {
      await api.post('/api/recruiter/shortlist', { candidateId: id });
      triggerToast('Candidate shortlisted for review');
    } catch {}
  }

  async function sendContactRequest(id: string) {
    try {
      await api.post('/api/recruiter/contact-request', { candidateId: id });
      triggerToast('Contact request sent successfully');
    } catch {}
  }

  async function scheduleInterview(candidateId: string) {
    const dt = prompt('Schedule interview date & time (e.g. YYYY-MM-DD HH:MM):');
    if (!dt) return;
    const mode = prompt('Interview mode (video / phone / in-person):') || 'video';
    try {
      await api.post('/api/recruiter/schedule-interview', {
        candidateId,
        scheduledAt: new Date(dt).toISOString(),
        mode
      });
      triggerToast('Interview invitation dispatched');
    } catch {
      triggerToast('Invalid date format', 'error');
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? 'var(--green)' : toast.type === 'error' ? 'var(--coral)' : 'var(--blue)',
          color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: 'var(--shadow-lg)', animation: 'slideIn 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-hero-title">👥 Recruiter Dashboard</h1>
            <p className="page-hero-sub">AI-ranked candidates, job postings manager, and verified credentials checker</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span className="badge badge-green">Live Data</span>
            <span className="badge badge-purple">ATS Ranker</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: -1 }}>
          {(['candidates', 'jobs', 'applications', 'company'] as const).map(tab => (
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
              {tab === 'candidates' ? '🔍 Candidates' : tab === 'jobs' ? '💼 Active Jobs' : tab === 'applications' ? '📨 Applications' : '🏢 Company Profile'}
            </button>
          ))}
        </div>
        
        {activeTab === 'jobs' && (
          <button onClick={() => setShowJobModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
            + Post New Job
          </button>
        )}
      </div>

      {/* ── TAB: CANDIDATES ─────────────────────────────────────────────── */}
      {activeTab === 'candidates' && (
        <>
          {/* Analytics Widgets */}
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Candidates', value: analytics.total_students || 0, icon: '👥', color: 'var(--accent)' },
              { label: 'Avg ATS Score', value: analytics.avg_ats || 0, icon: '🎯', color: 'var(--teal)' },
              { label: 'Avg Trust Score', value: analytics.avg_trust || 0, icon: '🛡', color: 'var(--green)' },
              { label: 'Avg Career DNA', value: analytics.avg_dna || 0, icon: '🧬', color: 'var(--purple)' }
            ].map(s => (
              <div key={s.label} className="metric-card">
                <div className="metric-label">{s.icon} {s.label}</div>
                <div className="metric-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Min Trust Score" value={filters.minTrust} onChange={e => setFilters(f => ({ ...f, minTrust: e.target.value }))} className="form-input" style={{ width: 150 }} />
            <input placeholder="Min ATS Score" value={filters.minAts} onChange={e => setFilters(f => ({ ...f, minAts: e.target.value }))} className="form-input" style={{ width: 150 }} />
            <input placeholder="Domain / Skill (e.g. React)" value={filters.domain} onChange={e => setFilters(f => ({ ...f, domain: e.target.value }))} className="form-input" style={{ width: 180 }} />
            <button onClick={fetchCandidates} className="btn-primary">Search Candidates</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedCandidate ? '1fr 380px' : '1fr', gap: 20 }}>
            {/* Candidate List */}
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--t3)' }}>Searching repository...</div>
              ) : candidates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No candidate match</div>
                  <div className="empty-desc">Adjust filters or check skill keywords.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {candidates.map((c, i) => (
                    <div
                      key={c.id}
                      onClick={() => viewCandidate(c.id)}
                      className="glass-card card-hover"
                      style={{
                        background: selectedCandidate?.id === c.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg2)',
                        border: `1px solid ${selectedCandidate?.id === c.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: i < 3 ? 'linear-gradient(135deg, var(--accent), var(--teal))' : 'var(--bg3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: i < 3 ? 'white' : 'var(--t3)',
                        boxShadow: i < 3 ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none',
                        flexShrink: 0
                      }}>
                        #{i + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--t1)' }}>{c.display_name}</span>
                          <span style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                            (🎯 {c.missions_done || 0} quests · 🎙 {c.interviews_done || 0} interviews)
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(c.skill_tags || []).slice(0, 4).map(s => (
                            <span key={s} style={{
                              fontSize: 10, padding: '2px 7px', borderRadius: 4,
                              background: 'var(--bg3)', color: 'var(--t2)',
                              border: '1px solid var(--border)', fontFamily: 'var(--font-mono)'
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
                        {[
                          { label: 'ATS Match', value: c.ats_score, color: 'var(--teal)', glow: 'rgba(20,184,166,0.1)' },
                          { label: 'Trust Verification', value: c.trust_score, color: 'var(--green)', glow: 'rgba(34,197,94,0.1)' },
                          { label: 'Career DNA', value: c.career_dna_score, color: 'var(--accent)', glow: 'rgba(99,102,241,0.1)' }
                        ].map(s => (
                          <div key={s.label} style={{
                            background: 'rgba(10, 15, 30, 0.4)',
                            border: `1px solid ${s.color}33`,
                            boxShadow: `0 0 8px ${s.glow}`,
                            borderRadius: 10,
                            padding: '6px 12px',
                            textAlign: 'center',
                            minWidth: 70
                          }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: s.color }}>
                              {Math.round(s.value)}%
                            </div>
                            <div style={{ fontSize: 8.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                              {s.label.split(' ')[0]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Candidate Side Drawer */}
            {selectedCandidate && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>{selectedCandidate.display_name}</div>
                  <button onClick={() => setSelectedCandidate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {[
                    { l: 'ATS Match', v: Math.round(selectedCandidate.ats_score), c: 'var(--teal)' },
                    { l: 'Trust Score', v: Math.round(selectedCandidate.trust_score), c: 'var(--green)' },
                    { l: 'Career DNA', v: Math.round(selectedCandidate.career_dna_score), c: 'var(--purple)' },
                    { l: 'Interviews', v: selectedCandidate.interviews_done, c: 'var(--blue)' }
                  ].map(s => (
                    <div key={s.l} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: 0.5, marginBottom: 3 }}>{s.l}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Proof Vault items */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Verified Proof Vault</div>
                  {(!selectedCandidate.vaultItems || selectedCandidate.vaultItems.length === 0) ? (
                    <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>No document proofs attached yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedCandidate.vaultItems.map((item: any) => (
                        <div key={item.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>📄 {item.label || item.type}</span>
                            <span className={`badge ${item.status === 'verified' ? 'badge-green' : 'badge-coral'}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                              {item.status || 'pending'}
                            </span>
                          </div>
                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 4, color: 'var(--accent)', textDecoration: 'underline' }}>
                              View Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => shortlist(selectedCandidate.id)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    ★ Shortlist Candidate
                  </button>
                  <button onClick={() => sendContactRequest(selectedCandidate.id)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', background: 'var(--bg3)' }}>
                    ✉ Send Contact Request
                  </button>
                  <button onClick={() => scheduleInterview(selectedCandidate.id)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--teal)', background: 'var(--bg3)' }}>
                    📅 Schedule Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: ACTIVE JOBS ─────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div>
          {jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <h3 className="empty-title">No job postings created</h3>
              <p className="empty-desc">Create details of your employment opportunities to start matching candidates.</p>
              <button onClick={() => setShowJobModal(true)} className="btn-primary" style={{ marginTop: 12 }}>+ Post Job</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="glass-card card-hover"
                  style={{
                    borderRadius: 18, padding: 20,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    border: '1px solid var(--border)', transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--t1)', margin: 0 }}>{job.title}</h4>
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>{job.job_type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, marginBottom: 8 }}>🏢 {job.company}</div>
                    
                    {job.location && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 4 }}>📍 {job.location} ({job.work_mode})</div>}
                    {job.department && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 4 }}>🏛 {job.department}</div>}
                    {job.salary_range && <div style={{ fontSize: 11.5, color: 'var(--teal)', fontWeight: 700, marginBottom: 4 }}>💰 {job.salary_range}</div>}
                    {job.skills_required && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                        {job.skills_required.split(',').slice(0, 4).map(s => (
                          <span key={s} style={{ fontSize: 9.5, padding: '2px 7px', background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <button
                      onClick={() => {
                        setJobForm(job);
                        setShowJobModal(true);
                      }}
                      className="btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px', flex: 1, justifyContent: 'center' }}
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/opportunities?jobId=${job.id}`;
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          triggerToast('Job listing URL copied to clipboard!', 'success');
                        }).catch(() => {
                          triggerToast('Could not copy link.', 'error');
                        });
                      }}
                      className="btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px', flex: 1, justifyContent: 'center' }}
                    >
                      🔗 Share
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id!)}
                      className="btn-ghost btn-sm"
                      style={{ color: 'var(--coral)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 11, padding: '4px 10px', flex: 1, justifyContent: 'center' }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: APPLICATIONS ───────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div style={{ display: 'grid', gridTemplateColumns: appReviewing ? '1fr 380px' : '1fr', gap: 20 }}>
          <div>
            {applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📨</div>
                <h3 className="empty-title">No applications received yet</h3>
                <p className="empty-desc">Once candidates apply to your postings, they will appear here.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position Applied</th>
                    <th>ATS</th>
                    <th>Trust</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.user?.full_name || 'Student'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>{app.jobCompany}</div>
                      </td>
                      <td style={{ color: 'var(--teal)', fontWeight: 700 }}>{app.user?.ats_score || 50}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>{app.user?.trust_score || 50}</td>
                      <td>
                        <span className={`badge ${
                          app.status === 'hired' ? 'badge-green' : 
                          app.status === 'shortlisted' ? 'badge-purple' : 
                          app.status === 'rejected' ? 'badge-coral' : 'badge-amber'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setAppReviewing(app)} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Application Review Drawer */}
          {appReviewing && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Review Application</div>
                <button onClick={() => setAppReviewing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 16 }}>✕</button>
              </div>

              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{appReviewing.user?.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{appReviewing.user?.email} · {appReviewing.user?.phone}</div>
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  Applied For: <strong>{appReviewing.jobTitle}</strong>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 11 }}>Update Stage Status</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {[
                    { id: 'pending', label: '⏳ Mark Pending', color: 'var(--t2)' },
                    { id: 'shortlisted', label: '⭐ Shortlist', color: 'var(--purple)' },
                    { id: 'hired', label: '🎉 Hire Candidate', color: 'var(--green)' },
                    { id: 'rejected', label: '❌ Reject Application', color: 'var(--coral)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleUpdateAppStatus(appReviewing.id, opt.id)}
                      disabled={updatingAppStatus !== null}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: `1px solid ${appReviewing.status === opt.id ? opt.color : 'var(--border)'}`,
                        background: appReviewing.status === opt.id ? `${opt.color}15` : 'transparent',
                        color: appReviewing.status === opt.id ? opt.color : 'var(--t1)',
                        cursor: 'pointer', fontSize: 11, textAlign: 'left', fontWeight: 600
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: COMPANY PROFILE ─────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, maxWidth: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, margin: 0 }}>Company Profile</h3>
            {!companyEditing && (
              <button onClick={() => setCompanyEditing(true)} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>
                ✏ Edit Profile
              </button>
            )}
          </div>

          {companyLoading ? (
            <div>Loading profile details...</div>
          ) : !companyEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {companyProfile.logo_url ? <img src={companyProfile.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : '🏢'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>{companyProfile.company_name}</h4>
                  <p style={{ color: 'var(--t3)', fontSize: 12, margin: '2px 0 0' }}>{companyProfile.tagline || 'No tagline added'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--t3)' }}>Industry: </span><strong>{companyProfile.industry}</strong>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--t3)' }}>Staff Size: </span><strong>{companyProfile.company_size}</strong>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--t3)' }}>Founded: </span><strong>{companyProfile.founded_year || '—'}</strong>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--t3)' }}>HQ: </span><strong>{companyProfile.headquarters || '—'}</strong>
                </div>
              </div>

              {companyProfile.website && (
                <div style={{ fontSize: 12 }}>
                  Website: <a href={companyProfile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{companyProfile.website}</a>
                </div>
              )}

              {companyProfile.about && (
                <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, fontSize: 12, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>About us</div>
                  {companyProfile.about}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={saveCompany} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input className="form-input" style={{ width: '100%' }} value={companyProfile.company_name} onChange={e => setCompanyProfile(p => ({ ...p, company_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Tagline</label>
                  <input className="form-input" style={{ width: '100%' }} value={companyProfile.tagline} onChange={e => setCompanyProfile(p => ({ ...p, tagline: e.target.value }))} placeholder="We deliver excellence" />
                </div>
                <div>
                  <label className="form-label">Logo URL</label>
                  <input className="form-input" style={{ width: '100%' }} value={companyProfile.logo_url} onChange={e => setCompanyProfile(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className="form-label">Website</label>
                  <input className="form-input" style={{ width: '100%' }} value={companyProfile.website} onChange={e => setCompanyProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className="form-label">Industry</label>
                  <select className="form-input" style={{ width: '100%' }} value={companyProfile.industry} onChange={e => setCompanyProfile(p => ({ ...p, industry: e.target.value }))}>
                    {['Technology', 'Finance & Banking', 'Healthcare', 'Education', 'E-Commerce', 'Consulting', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Company Size</label>
                  <select className="form-input" style={{ width: '100%' }} value={companyProfile.company_size} onChange={e => setCompanyProfile(p => ({ ...p, company_size: e.target.value }))}>
                    {['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Founded Year</label>
                  <input className="form-input" style={{ width: '100%' }} value={companyProfile.founded_year} onChange={e => setCompanyProfile(p => ({ ...p, founded_year: e.target.value }))} placeholder="e.g. 2018" />
                </div>
                <div>
                  <label className="form-label">Headquarters</label>
                  <input className="form-input" style={{ width: '100%' }} value={companyProfile.headquarters} onChange={e => setCompanyProfile(p => ({ ...p, headquarters: e.target.value }))} placeholder="e.g. Bangalore, India" />
                </div>
              </div>
              <div>
                <label className="form-label">About Description</label>
                <textarea className="form-input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} value={companyProfile.about} onChange={e => setCompanyProfile(p => ({ ...p, about: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setCompanyEditing(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={companySaving} className="btn-primary">
                  {companySaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── JOB FORM MODAL ── */}
      {showJobModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>🚀 Post a New Job</h3>
              <button onClick={() => setShowJobModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            
            <form onSubmit={postJob} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" style={{ width: '100%' }} value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Senior Frontend Engineer" />
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <input className="form-input" style={{ width: '100%' }} value={jobForm.department} onChange={e => setJobForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Engineering" />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input className="form-input" style={{ width: '100%' }} value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Bangalore, KA" />
                </div>
                <div>
                  <label className="form-label">Work Mode</label>
                  <select className="form-input" style={{ width: '100%' }} value={jobForm.work_mode} onChange={e => setJobForm(p => ({ ...p, work_mode: e.target.value }))}>
                    {['Remote', 'On-site', 'Hybrid', 'Flexible'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Job Type</label>
                  <select className="form-input" style={{ width: '100%' }} value={jobForm.job_type} onChange={e => setJobForm(p => ({ ...p, job_type: e.target.value }))}>
                    {['Full-time', 'Part-time', 'Contract', 'Internship'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Experience Level</label>
                  <select className="form-input" style={{ width: '100%' }} value={jobForm.experience_level} onChange={e => setJobForm(p => ({ ...p, experience_level: e.target.value }))}>
                    {['Fresher / Entry Level (0–1 yr)', 'Junior (1–3 yrs)', 'Mid-Level (3–5 yrs)', 'Senior (5–8 yrs)', 'Lead (8+ yrs)'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Salary Range</label>
                  <input className="form-input" style={{ width: '100%' }} value={jobForm.salary_range} onChange={e => setJobForm(p => ({ ...p, salary_range: e.target.value }))} placeholder="e.g. ₹12L - ₹18L per annum" />
                </div>
                <div>
                  <label className="form-label">Number of Openings</label>
                  <input type="number" min={1} className="form-input" style={{ width: '100%' }} value={jobForm.openings} onChange={e => setJobForm(p => ({ ...p, openings: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className="form-label">Application Deadline</label>
                  <input type="date" className="form-input" style={{ width: '100%' }} value={jobForm.deadline} onChange={e => setJobForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Skills Required (comma-separated)</label>
                  <input className="form-input" style={{ width: '100%' }} value={jobForm.skills_required} onChange={e => setJobForm(p => ({ ...p, skills_required: e.target.value }))} placeholder="React, Node.js, TypeScript" />
                </div>
              </div>

              <div>
                <label className="form-label">Job Description</label>
                <textarea className="form-input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowJobModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={jobSaving} className="btn-primary">
                  {jobSaving ? 'Posting...' : 'Post Job opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
