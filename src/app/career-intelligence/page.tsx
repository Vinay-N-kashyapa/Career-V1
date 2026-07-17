'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { toast } from '@/lib/store/useAppStore';
import { useApply } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- TYPES & INTERFACES ---
interface Task {
  id: string;
  name: string;
  status: 'Approved' | 'Review' | 'Pending';
}

interface Review {
  week: number;
  text: string;
  status: 'Approved' | 'Pending';
}

interface Internship {
  id: string;
  studentName: string;
  company: string;
  role: string;
  tasks: Task[];
  reviews: Review[];
  performance: number;
  offerStatus: string;
  completed: boolean;
}

interface CompanyProbability {
  company: string;
  pct: number;
  color: string;
  reasons: string[];
}

interface TopCandidate {
  name: string;
  reg: string;
  cgpa: number;
  matchPct: number;
  skills: string[];
}

interface RiskStudent {
  name: string;
  reg: string;
  cgpa: number;
  riskReasons: string[];
}

interface Application {
  id:                  string;
  status:              'applied' | 'viewed' | 'shortlisted' | 'interview_scheduled' | 'offered' | 'rejected' | 'withdrawn';
  applied_at:          string;
  updated_at:          string | null;
  cover_letter:        string | null;
  opportunity_id:      string;
  title:               string | null;
  description:         string | null;
  required_skills:     string[] | null;
  stipend_min:         number | null;
  stipend_max:         number | null;
  duration_weeks:      number | null;
  location_type:       'remote' | 'onsite' | 'hybrid' | null;
  deadline:            string | null;
  opportunity_status:  string | null;
  org_name:            string | null;
}

interface Project {
  id: string;
  title: string;
  company: string;
  budget: number;
  duration: string;
  tech: string[];
  status: 'pending' | 'approved' | 'completed';
  applied: boolean;
  studentName?: string;
  creditsAwarded?: number;
  grade?: string;
}

const TYPE_ICONS: Record<string, string> = { 
  job: '💼', 
  internship: '🏢', 
  scholarship: '🎓', 
  competition: '🏆', 
  certification: '📜', 
  networking: '🤝' 
};

const STATUS_META: Record<Application['status'], { label: string; color: string; emoji: string; order: number; nextAction?: string }> = {
  applied:             { label: 'Applied',             color: 'var(--t2)',     emoji: '📤', order: 1, nextAction: 'Waiting for the recruiter to review.' },
  viewed:              { label: 'Viewed',              color: 'var(--accent)', emoji: '👁',  order: 2, nextAction: 'Recruiter has seen your profile.' },
  shortlisted:         { label: 'Shortlisted',         color: 'var(--teal)',   emoji: '⭐', order: 3, nextAction: 'You may be contacted soon. Check Notifications.' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'var(--purple)', emoji: '🎙', order: 4, nextAction: 'Practice with Interview AI before the date.' },
  offered:             { label: 'Offered',             color: 'var(--green)',  emoji: '🎉', order: 5, nextAction: 'Respond directly to the recruiter.' },
  rejected:            { label: 'Rejected',            color: 'var(--coral)',  emoji: '✕',  order: 6, nextAction: 'Review ATS gaps on your Resume — keep going.' },
  withdrawn:           { label: 'Withdrawn',           color: 'var(--t4)',     emoji: '↩',  order: 7 },
};

type StatusFilter = 'all' | 'active' | Application['status'];

function ApplyButton({ opportunityId, title }: { opportunityId: string; title: string }) {
  const applyMutation = useApply();
  const [applied, setApplied] = useState(false);

  if (applied || applyMutation.isSuccess) {
    return (
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
        ✓ Applied
      </span>
    );
  }

  return (
    <button
      onClick={() => { applyMutation.mutate({ opportunityId }); setApplied(true); }}
      disabled={applyMutation.isPending}
      style={{
        padding: '5px 14px', borderRadius: 8, border: 'none',
        background: 'var(--accent)', color: 'white',
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
        opacity: applyMutation.isPending ? 0.7 : 1,
      }}
    >
      {applyMutation.isPending ? 'Applying...' : '→ Apply Now'}
    </button>
  );
}

export default function CareerIntelligencePage() {
  const { user } = useAuth();
  const cOS = useCareerOS();
  const { onboardingAnswers, setJdMissingSkills, addXp } = cOS;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Page level tabs: 'tracker' | 'opportunities' | 'applications' | 'projects'
  const [activeTab, setActiveTab] = useState<'tracker' | 'opportunities' | 'applications' | 'projects'>('tracker');
  const [activeRole, setActiveRole] = useState<'student' | 'recruiter' | 'placement' | 'faculty'>('student');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as any;
    const validTabs = ['tracker', 'opportunities', 'applications', 'projects'];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (nextTab: typeof activeTab) => {
    setActiveTab(nextTab);
    router.replace(`/career-intelligence?tab=${nextTab}`);
  };

  // Load default switch based on auth role if logged in
  useEffect(() => {
    if (user?.role === 'recruiter') setActiveRole('recruiter');
    else if (['teacher', 'faculty'].includes(user?.role || '')) setActiveRole('faculty');
    else if (user?.role === 'admin') setActiveRole('placement');
  }, [user]);

  // --- DATA STATES ---

  // 1. Internship Tracker Dataset
  const [trackerSubTab, setTrackerSubTab] = useState<'current' | 'completed'>('current');
  const [internships, setInternships] = useState<Internship[]>([
    {
      id: 'int1',
      studentName: 'Ashwanth Kumar',
      company: 'Stripe Security',
      role: 'Software Engineering Intern',
      tasks: [
        { id: 't1', name: 'Complete security onboarding and SSH setup', status: 'Approved' },
        { id: 't2', name: 'Optimize concurrent billing ledger database queues', status: 'Review' },
        { id: 't3', name: 'Refactor multi-currency indexing tables in schema', status: 'Pending' }
      ],
      reviews: [
        { week: 1, text: 'Ashwanth adapted very quickly to the Stripe codebase and met all requirements.', status: 'Approved' },
        { week: 2, text: 'Completed queue performance benchmarks with 14% latency reductions.', status: 'Pending' }
      ],
      performance: 92,
      offerStatus: 'Eligible for Pre-Placement Offer (PPO) review in Week 8',
      completed: false
    },
    {
      id: 'int2',
      studentName: 'Ashwanth Kumar',
      company: 'Hana Web Agency',
      role: 'Frontend Developer Intern',
      tasks: [],
      reviews: [],
      performance: 88,
      offerStatus: 'No conversion review (Stipend internship)',
      completed: true
    }
  ]);

  const [mentees, setMentees] = useState<Internship[]>([
    {
      id: 'int_m1',
      studentName: 'Rajesh Kumar',
      company: 'Infosys Labs',
      role: 'SDE Intern',
      tasks: [
        { id: 'm_t1', name: 'Implement REST APIs for inventory modules', status: 'Review' }
      ],
      reviews: [
        { week: 1, text: 'Weekly logs submitted for inventory routes.', status: 'Pending' }
      ],
      performance: 78,
      offerStatus: 'Eligible for conversion review',
      completed: false
    },
    {
      id: 'int_m2',
      studentName: 'Aisha Khan',
      company: 'Amazon Cloud',
      role: 'Cloud Engineering Intern',
      tasks: [],
      reviews: [],
      performance: 85,
      offerStatus: 'Pending final evaluation',
      completed: false
    }
  ]);

  const approveWeekLog = (menteeId: string, weekNum: number) => {
    setMentees(mentees.map(m => {
      if (m.id === menteeId) {
        return {
          ...m,
          reviews: m.reviews.map(r => r.week === weekNum ? { ...r, status: 'Approved' } : r)
        };
      }
      return m;
    }));
    toast.success('Log Approved', 'Successfully verified student weekly log deliverables.');
  };

  const probabilities: CompanyProbability[] = [
    { company: 'Infosys', pct: 94, color: 'var(--green)', reasons: ['Excellent Socratic communication index', '12-day coding quest streak is active', 'AWS Developer certification verified'] },
    { company: 'Stripe Security', pct: 45, color: 'var(--amber)', reasons: ['Requires Stripe cryptography project verification from faculty', 'Assessed dynamic programming speed is low'] },
    { company: 'Amazon', pct: 32, color: 'var(--coral)', reasons: ['Improve Dynamic Programming quest scores', 'Increase Round 2 coding test case accuracy above 50%'] },
    { company: 'Google Labs', pct: 18, color: 'var(--coral)', reasons: ['Enhance system scaling knowledge', 'Practice event-driven whiteboard layout nodes'] }
  ];

  const topCandidates: TopCandidate[] = [
    { name: 'Vikram Rao', reg: 'PIN-2026-4402', cgpa: 8.5, matchPct: 96, skills: ['Next.js', 'Go Lang', 'Docker', 'WebCrypto'] },
    { name: 'Neha Patel', reg: 'PIN-2026-9041', cgpa: 7.3, matchPct: 88, skills: ['TypeScript', 'React', 'Python', 'Algorithms'] },
    { name: 'Abhijit Sen', reg: 'PIN-2026-3024', cgpa: 7.1, matchPct: 81, skills: ['Next.js', 'REST APIs', 'SQL'] }
  ];

  const riskStudents: RiskStudent[] = [
    { name: 'Rajesh Kumar', reg: 'PIN-2026-1049', cgpa: 6.2, riskReasons: ['Low lecture attendance (64%)', 'Failing grades in data structures mock tests'] },
    { name: 'Aisha Khan', reg: 'PIN-2026-2184', cgpa: 6.8, riskReasons: ['Struggling with system scaling concepts', 'Round 2 compiler accuracy under 40%'] }
  ];

  // 2. Opportunities Dataset
  const [opps, setOpps] = useState<Record<string, any>[]>([]);
  const [oppsLoading, setOppsLoading] = useState(true);
  const [oppsFilter, setOppsFilter] = useState('all');
  const [jd, setJD] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<Record<string, any> | null>(null);

  useEffect(() => { 
    if (activeTab === 'opportunities') fetchOpps(); 
  }, [oppsFilter, onboardingAnswers.role, activeTab]);

  async function fetchOpps() {
    setOppsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (oppsFilter !== 'all') params.type = oppsFilter;
      if (onboardingAnswers.role) params.targetRole = onboardingAnswers.role;
      const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
      const d = await api.get<{ opportunities: Record<string, any>[] }>(`/api/opportunities${qs}`);
      setOpps(d.opportunities || []);
    } catch {
      setOpps([]);
    } finally {
      setOppsLoading(false);
    }
  }

  async function matchJD() {
    if (!jd.trim()) return;
    setMatching(true);
    try {
      const d = await api.post<{
        match: { match_score: number; verdict: string; matched_skills: string[]; missing_skills: string[]; estimated_preparation_weeks?: number; salary_estimate?: string; }
      }>('/api/opportunities/match', { jd });
      const result = (d.match || {}) as any;
      setMatchResult({
        match_score: result.match_score || 0,
        verdict: result.verdict || 'possible',
        estimated_preparation_weeks: result.estimated_preparation_weeks || 4,
        salary_estimate: result.salary_estimate || '₹12 - 20 LPA',
        matching_skills: result.matched_skills || [],
        missing_skills: result.missing_skills || [],
      });
      setJdMissingSkills(result.missing_skills || []);
      addXp(20, 'JD matched & skill gaps broadcasted');
    } catch {
      setMatchResult(null);
    } finally {
      setMatching(false);
    }
  }

  // 3. Applications Dataset
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsFilter, setAppsFilter] = useState<StatusFilter>('active');

  useEffect(() => {
    if (activeTab === 'applications') {
      api.get<{ applications: Application[] }>('/api/opportunities/applications')
        .then(d => setApps(d.applications || []))
        .catch(() => setApps([]))
        .finally(() => setAppsLoading(false));
    }
  }, [activeTab]);

  const appsFunnel = useMemo(() => {
    const counts: Record<Application['status'], number> = {
      applied: 0, viewed: 0, shortlisted: 0, interview_scheduled: 0, offered: 0, rejected: 0, withdrawn: 0,
    };
    for (const a of apps) counts[a.status]++;
    return counts;
  }, [apps]);

  const visibleApps = useMemo(() => {
    if (appsFilter === 'all')    return apps;
    if (appsFilter === 'active') return apps.filter(a => !['rejected','withdrawn'].includes(a.status));
    return apps.filter(a => a.status === appsFilter);
  }, [apps, appsFilter]);

  const activeAppsCount = apps.filter(a => !['rejected','withdrawn'].includes(a.status)).length;

  // 4. Industry Projects Dataset
  const [projectsTab, setProjectsTab] = useState<'browse' | 'track'>('browse');
  const [projects, setProjects] = useState<Project[]>([
    { id: 'proj1', title: 'Zero-Knowledge Database Adapter', company: 'Stripe Security', budget: 2500, duration: '4 Weeks', tech: ['Next.js', 'WebCrypto API', 'SQL'], status: 'approved', applied: false },
    { id: 'proj2', title: 'Distributed Log Telemetry Aggregator', company: 'Datadog Core', budget: 4000, duration: '6 Weeks', tech: ['Go Lang', 'gRPC', 'Docker'], status: 'approved', applied: true, studentName: 'Ashwanth Kumar' },
    { id: 'proj3', title: 'Socratic Dialogue Finetuner Module', company: 'OpenAI Labs', budget: 3500, duration: '5 Weeks', tech: ['Python', 'PyTorch', 'HuggingFace'], status: 'pending', applied: false },
    { id: 'proj4', title: 'Real-time Canvas Whiteboard Engine', company: 'Figma Dev', budget: 3000, duration: '4 Weeks', tech: ['React', 'WebSockets', 'Canvas API'], status: 'completed', applied: true, studentName: 'Ashwanth Kumar', creditsAwarded: 4, grade: 'A+' }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newTech, setNewTech] = useState('');
  const [gradingProjId, setGradingProjId] = useState<string | null>(null);
  const [selectedCredits, setSelectedCredits] = useState(4);
  const [selectedGrade, setSelectedGrade] = useState('A+');

  const applyToProject = (id: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, applied: true, studentName: user?.displayName || 'Ashwanth Kumar' } : p));
    toast.success('Application Submitted', 'The company recruiter will review your developer portfolio.');
  };

  const createProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: newTitle,
      company: user?.displayName || 'Stripe Security',
      budget: 2500,
      duration: '4 Weeks',
      tech: newTech.split(',').map(s => s.trim()).filter(Boolean),
      status: 'pending',
      applied: false
    };
    setProjects([...projects, newProj]);
    setNewTitle('');
    setNewTech('');
    toast.success('Project Created', 'Your project has been submitted for placement officer review.');
  };

  const approveProject = (id: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    toast.success('Project Approved', 'The project is now live in the student browse marketplace.');
  };

  const submitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingProjId) return;
    setProjects(projects.map(p => p.id === gradingProjId ? { ...p, status: 'completed', creditsAwarded: selectedCredits, grade: selectedGrade } : p));
    setGradingProjId(null);
    toast.success('Evaluation Completed', 'Student has been awarded academic credits.');
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20, display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
            💼 Career Intelligence Center
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13.5, margin: 0 }}>
            Unified directory covering internships, opportunities, applications pipeline, and industry projects.
          </p>
        </div>

        {/* Demo Switcher */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg3)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          {[
            { id: 'student', label: '🧑‍🎓 Student' },
            { id: 'recruiter', label: '🏢 Recruiter' },
            { id: 'placement', label: '🎓 Placement' },
            { id: 'faculty', label: '👩‍🏫 Faculty' }
          ].map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: activeRole === role.id ? 'var(--accent)' : 'transparent',
                color: activeRole === role.id ? '#fff' : 'var(--t2)',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Segmented Switcher */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content', marginBottom: 24 }}>
        {[
          { id: 'tracker', label: '🏢 Internship Tracker' },
          { id: 'opportunities', label: '🎯 Opportunity Radar' },
          { id: 'applications', label: '📋 Application Pipeline' },
          { id: 'projects', label: '💼 Industry Projects' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id as any)}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeTab === t.id ? 'var(--bg2)' : 'transparent',
              color: activeTab === t.id ? 'var(--accent)' : 'var(--t3)',
              transition: 'all 0.15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: INTERNSHIP TRACKER & PREDICTOR */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'tracker' && (
        <div>
          {activeRole === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
              <div style={card}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={cardLabel}>🏢 Live Internships</div>
                  <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <button onClick={() => setTrackerSubTab('current')} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer', background: trackerSubTab === 'current' ? 'var(--bg2)' : 'transparent', color: trackerSubTab === 'current' ? 'var(--accent)' : 'var(--t2)' }}>Current</button>
                    <button onClick={() => setTrackerSubTab('completed')} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer', background: trackerSubTab === 'completed' ? 'var(--bg2)' : 'transparent', color: trackerSubTab === 'completed' ? 'var(--accent)' : 'var(--t2)' }}>Completed</button>
                  </div>
                </div>

                {internships.filter(i => i.completed === (trackerSubTab === 'completed')).map(internship => (
                  <div key={internship.id} style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg3)', padding: 16, borderRadius: 14, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>{internship.company}</h3>
                        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{internship.role}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 800 }}>{internship.performance}% Performance</span>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', marginBottom: 6 }}>TASKS REGISTER</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {internship.tasks.map(t => (
                          <div key={t.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 12, color: 'var(--t2)' }}>{t.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: t.status === 'Approved' ? 'var(--green)' : t.status === 'Review' ? 'var(--amber)' : 'var(--t3)' }}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={cardLabel}>🔮 AI Placement Predictor</div>
                <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16 }}>
                  Simulated matching models mapping your current trust, streak, and mock exam matrices to standard hiring thresholds.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {probabilities.map(p => (
                    <div key={p.company} style={{ background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{p.company}</span>
                        <span style={{ fontSize: 12, color: p.color, fontWeight: 800 }}>{p.pct}% Probability</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {p.reasons.map((r, idx) => (
                          <div key={idx} style={{ fontSize: 11.5, color: 'var(--t3)' }}>• {r}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeRole === 'faculty' && (
            <div style={card}>
              <div style={cardLabel}>Faculty Mentoring Dashboard</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mentees.map(mentee => (
                  <div key={mentee.id} style={{ background: 'var(--bg3)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{mentee.studentName}</div>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>{mentee.company} — {mentee.role}</div>
                    </div>
                    {mentee.reviews.map(r => (
                      <div key={r.week} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--t2)' }}>Week {r.week}: {r.text}</span>
                        {r.status === 'Pending' ? (
                          <button onClick={() => approveWeekLog(mentee.id, r.week)} style={{ padding: '6px 12px', fontSize: 11, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 800 }}>Approve Log</button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 800 }}>✓ Verified</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeRole === 'recruiter' || activeRole === 'placement') && (
            <div style={card}>
              <div style={cardLabel}>Hiring & Risk Management</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 850, marginBottom: 10 }}>Top Candidate Matches</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topCandidates.map(c => (
                      <div key={c.reg} style={{ background: 'var(--bg3)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>
                          <span>{c.name}</span>
                          <span style={{ color: 'var(--green)' }}>{c.matchPct}% Match</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>CGPA: {c.cgpa} · Skills: {c.skills.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 850, marginBottom: 10 }}>Placement Gaps Alert (At Risk)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {riskStudents.map(c => (
                      <div key={c.reg} style={{ background: 'var(--bg3)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>
                          <span>{c.name}</span>
                          <span style={{ color: 'var(--coral)' }}>High Risk</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Gaps: {c.riskReasons.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: OPPORTUNITIES */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'opportunities' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={card}>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={cardLabel}>🔍 Opportunity Radar</div>
              <select value={oppsFilter} onChange={e => setOppsFilter(e.target.value)} style={{ padding: '6px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--t1)', fontSize: 12 }}>
                <option value="all">All Gaps</option>
                <option value="job">Jobs</option>
                <option value="internship">Internships</option>
              </select>
            </div>

            {oppsLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>Scanning network openings...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {opps.map(opp => (
                  <div key={opp.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: 14, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <span style={{ marginRight: 6 }}>{TYPE_ICONS[opp.type] || '💼'}</span>
                        <strong style={{ fontSize: 14 }}>{opp.title}</strong>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>{opp.match_score}% Match</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>{opp.company} · {opp.location} · {opp.salary || 'Salary Undisclosed'}</div>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--t4)' }}>Deadline: {opp.deadline || 'Ongoing'}</span>
                      <ApplyButton opportunityId={opp.id} title={opp.title} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={card}>
            <div style={cardLabel}>📄 Socratic JD Analyzer</div>
            <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 14 }}>
              Paste a job description below to parse missing skills and broadcast target roadmap nodes.
            </p>
            <textarea
              value={jd}
              onChange={e => setJD(e.target.value)}
              placeholder="Paste job details here..."
              style={{ width: '100%', height: 120, padding: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--t1)', fontSize: 12.5, marginBottom: 12, fontFamily: 'var(--font-mono)' }}
            />
            <button onClick={matchJD} disabled={matching} className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: 12.5, fontWeight: 800 }}>
              {matching ? 'Analyzing gaps...' : 'Run Socratic Scan'}
            </button>

            {matchResult && (
              <div style={{ marginTop: 16, background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent)', marginBottom: 10 }}>Score: {matchResult.match_score}%</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--coral)', marginBottom: 4 }}>MISSING SKILLS:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {matchResult.missing_skills.map((s: string) => (
                    <span key={s} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 4, background: 'var(--coral-light)', color: 'var(--coral)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: APPLICATIONS PIPELINE */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!appsLoading && apps.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{apps.length}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Total</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>{activeAppsCount}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Active</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--teal)' }}>{appsFunnel.shortlisted}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Shortlisted</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--green)' }}>{appsFunnel.offered}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Offers</div>
              </div>
            </div>
          )}

          <div style={card}>
            <div style={cardLabel}>📋 Live Pipeline Tracker</div>
            {appsLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>Syncing pipeline applications...</div>
            ) : apps.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--t3)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                No active applications. Select "Opportunity Radar" to apply for matching openings.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visibleApps.map(a => {
                  const meta = STATUS_META[a.status] || { label: a.status, color: 'var(--t3)', emoji: '📥' };
                  return (
                    <div key={a.id} style={{ background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13.5 }}>{a.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{a.org_name} · Applied: {new Date(a.applied_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${meta.color}14`, color: meta.color }}>
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 4: INDUSTRY PROJECTS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div>
          {activeRole === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 8, border: '1px solid var(--border)', width: 'fit-content' }}>
                <button onClick={() => setProjectsTab('browse')} style={{ padding: '6px 16px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: projectsTab === 'browse' ? 'var(--bg2)' : 'transparent', color: projectsTab === 'browse' ? 'var(--accent)' : 'var(--t3)' }}>🔍 Browse Projects</button>
                <button onClick={() => setProjectsTab('track')} style={{ padding: '6px 16px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: projectsTab === 'track' ? 'var(--bg2)' : 'transparent', color: projectsTab === 'track' ? 'var(--accent)' : 'var(--t3)' }}>📋 Track My Work</button>
              </div>

              {projectsTab === 'browse' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                  {projects.filter(p => p.status === 'approved' && !p.applied).map(proj => (
                    <div key={proj.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'space-between', minHeight: 180 }}>
                      <div>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: 0 }}>{proj.title}</h3>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>₹{proj.budget}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 8 }}>{proj.company} · Duration: {proj.duration}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                          {proj.tech.map(t => (
                            <span key={t} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => applyToProject(proj.id)} className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: 11.5 }}>Apply to Project</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={card}>
                  <div style={cardLabel}>Active Portfolio Projects</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {projects.filter(p => p.applied).map(proj => (
                      <div key={proj.id} style={{ background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{proj.title}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{proj.company} · Budget: ₹{proj.budget}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: proj.status === 'completed' ? 'var(--green)' : 'var(--amber)' }}>
                          {proj.status === 'completed' ? `Completed (${proj.grade})` : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeRole === 'recruiter' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.0fr', gap: 20 }}>
              <div style={card}>
                <div style={cardLabel}>Active Client Briefs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {projects.map(proj => (
                    <div key={proj.id} style={{ background: 'var(--bg3)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{proj.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>Budget: ₹{proj.budget} · Status: {proj.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={cardLabel}>Publish Client Project</div>
                <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Project Title" style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--t1)', fontSize: 12.5 }} />
                  <input type="text" value={newTech} onChange={e => setNewTech(e.target.value)} placeholder="Required Tech (comma separated)" style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--t1)', fontSize: 12.5 }} />
                  <button type="submit" className="btn-primary" style={{ padding: '10px' }}>Submit Brief</button>
                </form>
              </div>
            </div>
          )}

          {activeRole === 'placement' && (
            <div style={card}>
              <div style={cardLabel}>Pending Project Approvals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.filter(p => p.status === 'pending').map(proj => (
                  <div key={proj.id} style={{ background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800 }}>{proj.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>{proj.company} · Budget: ₹{proj.budget}</div>
                    </div>
                    <button onClick={() => approveProject(proj.id)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 11 }}>Approve Listing</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeRole === 'faculty' && (
            <div style={card}>
              <div style={cardLabel}>Project Evaluations & Academic Credits</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.filter(p => p.applied && p.status !== 'completed').map(proj => (
                  <div key={proj.id} style={{ background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800 }}>{proj.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>Student: {proj.studentName}</div>
                    </div>
                    {gradingProjId === proj.id ? (
                      <form onSubmit={submitGrade} style={{ display: 'flex', gap: 6 }}>
                        <select value={selectedCredits} onChange={e => setSelectedCredits(Number(e.target.value))} style={{ padding: '4px', background: 'var(--bg2)', color: 'var(--t1)', border: '1px solid var(--border)', borderRadius: 4 }}>
                          <option value={2}>2 Credits</option>
                          <option value={4}>4 Credits</option>
                        </select>
                        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ padding: '4px', background: 'var(--bg2)', color: 'var(--t1)', border: '1px solid var(--border)', borderRadius: 4 }}>
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                        <button type="submit" style={{ padding: '4px 8px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                      </form>
                    ) : (
                      <button onClick={() => setGradingProjId(proj.id)} style={{ padding: '6px 12px', fontSize: 11, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 800 }}>Evaluate Task</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-sm)'
};
const cardLabel: React.CSSProperties = {
  fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase',
  color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600,
  marginBottom: 14, display: 'block'
};
