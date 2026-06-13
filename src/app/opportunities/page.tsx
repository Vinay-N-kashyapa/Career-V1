'use client';
// Premium Opportunity Radar & AI Interview Coach
import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useApply } from '@/lib/api/hooks';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import Link from 'next/link';

const TYPE_ICONS: Record<string, string> = { 
  job: '💼', 
  internship: '🏢', 
  scholarship: '🎓', 
  competition: '🏆', 
  certification: '📜', 
  networking: '🤝' 
};

const PRIORITY_COLORS: Record<string, string> = { 
  urgent: 'var(--coral)', 
  high: 'var(--amber)', 
  medium: 'var(--accent)', 
  low: 'var(--t3)' 
};


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

export default function OpportunitiesPage() {
  const cOS = useCareerOS();
  const { onboardingAnswers, setJdMissingSkills, addXp } = cOS;

  const [opps, setOpps] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [jd, setJD] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<Record<string, any> | null>(null);

  // AI Interview Coach section states
  const [activeRound, setActiveRound] = useState<'none' | 'hr' | 'tech' | 'domain'>('none');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [mockQuestion, setMockQuestion] = useState('');
  const [mockAnswer, setMockAnswer] = useState('');
  const [interviewResult, setInterviewResult] = useState<string | null>(null);

  useEffect(() => { 
    fetchOpps(); 
  }, [filter, onboardingAnswers.role]);

  async function fetchOpps() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.type = filter;
      if (onboardingAnswers.role) params.targetRole = onboardingAnswers.role;
      const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
      const d = await api.get<{ opportunities: Record<string, any>[] }>(`/api/opportunities${qs}`);
      setOpps(d.opportunities || []);
    } catch {
      setOpps([]);
    } finally {
      setLoading(false);
    }
  }

  async function matchJD() {
    if (!jd.trim()) return;
    setMatching(true);
    try {
      const d = await api.post<{
        match: { match_score: number; verdict: string; matched_skills: string[]; missing_skills: string[]; estimated_preparation_weeks?: number; salary_estimate?: string; }
      }>('/api/opportunities/match', { jd });
      const result = (d.match || {}) as { match_score?: number; verdict?: string; matched_skills?: string[]; missing_skills?: string[]; estimated_preparation_weeks?: number; salary_estimate?: string; };
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

  function launchMockInterview(round: 'hr' | 'tech' | 'domain') {
    // Redirect to the full AI Interview page with the round pre-selected
    window.location.href = `/interview?mode=${round}`;
  }

  function submitMockAnswer() {
    setInterviewStarted(false);
    setInterviewResult("Practice complete! Head to the full AI Interview page for a scored, evaluated session.");
    addXp(25, 'Completed Quick Interview Practice');
  }

  const MATCH_VERDICT_COLOR: Record<string, string> = { 
    strong_match: 'var(--green)', 
    good_match: 'var(--teal)', 
    possible: 'var(--amber)', 
    poor_match: 'var(--coral)' 
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position:"relative", zIndex:1 }}>
          <h1 className="page-hero-title">🎯 Opportunities</h1>
          <p className="page-hero-sub">AI-matched jobs and internships based on your ATS score, skills, and career profile</p>
        </div>
      </div>

      
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Opportunity Radar & Coach
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: 13 }}>
          AI Job Matcher & Real-Time Mock Interview Coach tailored directly to your Vault assets.
        </p>
        
        {/* Dynamic target role subtitle aligned to onboarding answers */}
        {onboardingAnswers.hasCompleted && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--teal)', background: 'rgba(20,184,166,0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(20,184,166,0.2)', fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 8 }}>
            🎯 ALIGNED TO CAREER TWIN ROADMAP: {onboardingAnswers.role.toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        
        {/* Left Column: Job Feed & JD Matcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* JD Matcher */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🎯</span> AI Job Description Matcher
            </div>
            <textarea
              value={jd}
              onChange={e => setJD(e.target.value)}
              placeholder="Paste any corporate SDE or ML job description here to check your exact matching vs. missing skill gaps..."
              rows={4}
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--t1)', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.6, marginBottom: 10 }}
            />
            <button onClick={matchJD} disabled={matching || !jd.trim()} className="btn-primary">
              {matching ? 'Running GAP Analysis...' : '→ Analyze Match Score'}
            </button>

            {matchResult && (() => {
              const m = matchResult as { match_score?: number; verdict?: string; matching_skills?: string[]; missing_skills?: string[]; estimated_preparation_weeks?: number; salary_estimate?: string };
              return (
                <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }} className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: MATCH_VERDICT_COLOR[m.verdict || ''] }}>{m.match_score}%</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: MATCH_VERDICT_COLOR[m.verdict || ''], textTransform: 'uppercase', letterSpacing: 1 }}>{m.verdict?.replace('_', ' ')}</div>
                      <div style={{ fontSize: 11, color: 'var(--t2)' }}>~{m.estimated_preparation_weeks} weeks prep · {m.salary_estimate}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 6 }}>✓ Your Strengths</div>
                      {m.matching_skills?.map((s, i) => <div key={i} style={{ color: 'var(--t2)', marginBottom: 3 }}>• {s}</div>)}
                    </div>
                    <div>
                      <div style={{ color: 'var(--coral)', fontWeight: 700, marginBottom: 6 }}>⚠️ Missing Gaps</div>
                      {m.missing_skills?.map((s, i) => <div key={i} style={{ color: 'var(--t2)', marginBottom: 3 }}>• {s}</div>)}
                    </div>
                  </div>

                  {/* Actions mapping gaps back to missions & Career Twin Gap closures */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <Link 
                      href={`/missions?gaps=${m.missing_skills?.join(',')}`} 
                      className="btn-primary btn-sm"
                      style={{ textDecoration: 'none', fontSize: 11, padding: '6px 12px' }}
                    >
                      ⚡ Generate Missions from Gaps
                    </Link>
                    <Link 
                      href="/career-twin" 
                      className="btn-ghost btn-sm"
                      style={{ textDecoration: 'none', fontSize: 11, padding: '6px 12px' }}
                    >
                      🧬 Highlight in Career Twin
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['all', 'job', 'internship', 'scholarship', 'competition'].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`, background: filter === t ? 'rgba(79,70,229,0.1)' : 'transparent', color: filter === t ? '#8b8bf5' : 'var(--t2)', cursor: 'pointer', fontSize: 12 }}>
                {TYPE_ICONS[t] || '📌'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <button onClick={fetchOpps} className="btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>↺ Refresh Feed</button>
          </div>

          {/* Opportunity Feed */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--t3)' }}>Locating active job fits...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {opps.map((o) => (
                <div key={o.id} style={{ background: 'var(--bg2)', border: `1.5px solid ${o.priority === 'urgent' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`, borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{TYPE_ICONS[o.type] || '📌'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--t1)' }}>{o.title}</span>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: `${PRIORITY_COLORS[o.priority]}15`, color: PRIORITY_COLORS[o.priority], border: `1px solid ${PRIORITY_COLORS[o.priority]}30`, fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{o.priority}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>{o.company_or_org} · {o.location}</div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 8 }}>{o.description}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 700 }}>AI Match: {o.match_score}%</span>
                      {o.salary_or_stipend && <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{o.salary_or_stipend}</span>}
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>Deadline: {o.deadline}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <ApplyButton opportunityId={o.id} title={o.title} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Column: AI Interview Coach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.04), rgba(124,58,237,0.02))', border: '2px solid rgba(79,70,229,0.15)', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🎙️</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>AI Interview Coach</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16 }}>
              Practice technical algorithms, system architectures, and STAR behavioral answers with instant evaluation feedback.
            </p>

            {/* Launch Panel */}
            {!interviewStarted && !interviewResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => launchMockInterview('hr')} className="btn-ghost btn-sm" style={{ justifyContent: 'space-between' }}>
                  <span>💬 HR Behavioral Round</span> ➔
                </button>
                <button onClick={() => launchMockInterview('tech')} className="btn-ghost btn-sm" style={{ justifyContent: 'space-between' }}>
                  <span>💻 Tech Core Algorithms</span> ➔
                </button>
                <button onClick={() => launchMockInterview('domain')} className="btn-ghost btn-sm" style={{ justifyContent: 'space-between' }}>
                  <span>☁ System Design Scaling</span> ➔
                </button>
              </div>
            )}

            {/* Active Interview Panel */}
            {interviewStarted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-fade-in">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Active Question:</div>
                <div style={{ fontSize: 12.5, color: 'var(--t1)', padding: 10, background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)', lineHeight: 1.5 }}>
                  {mockQuestion}
                </div>
                <textarea
                  value={mockAnswer}
                  onChange={e => setMockAnswer(e.target.value)}
                  placeholder="Record or type your response using the STAR method..."
                  rows={4}
                  style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--t1)', fontSize: 12, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={submitMockAnswer} className="btn-primary btn-sm" style={{ flex: 1 }} disabled={!mockAnswer.trim()}>
                    Submit Response
                  </button>
                  <button onClick={() => setInterviewStarted(false)} className="btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Evaluation Result */}
            {interviewResult && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }} className="animate-fade-in">
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>✓ Coach Feedback</div>
                <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {interviewResult}
                </p>
                <button onClick={() => setInterviewResult(null)} className="btn-primary btn-sm">Start Next Round</button>
              </div>
            )}
          </div>

          {/* Past Interview Scores */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 12, display: 'block' }}>📈 Mock Evaluation History</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { round: 'HR Mock Round #3', score: 90, date: 'Yesterday', color: 'var(--green)' },
                { round: 'SDE Algorithms #5', score: 81, date: 'May 24, 2026', color: 'var(--teal)' },
                { round: 'System Scaling #1', score: 62, date: 'May 18, 2026', color: 'var(--amber)' }
              ].map((round, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: 12, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{round.round}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{round.date}</div>
                  </div>
                  <span style={{ fontWeight: 800, color: round.color }}>{round.score}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
