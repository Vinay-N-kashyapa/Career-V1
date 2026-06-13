'use client';
// Gamified daily missions and quest tracker
import { useState, useEffect } from 'react';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { useAuth } from '@/lib/context/AuthContext';
import MissionCard from '@/components/ui/MissionCard';
import { useMissionsToday, useMissionHistory } from '@/lib/api/hooks';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/store/useAppStore';

import PinsGate from '@/components/pins/PinsGate';
import PinsEarnNotice from '@/components/pins/PinsEarnNotice';

interface Mission { 
  id: string; 
  title: string; 
  description: string; 
  type: string; 
  status: string; 
  trust_reward: number; 
  estimated_minutes: number; 
  source_weakness: string; 
  target_gap?: string; 
  role_requirement?: string; 
}

const TYPE_META: Record<string, { icon: string; color: string; light: string }> = {
  communication: { icon: '🎙️', color: 'var(--blue)',   light: 'rgba(59,130,246,0.1)'   },
  skill:         { icon: '⚡',  color: 'var(--teal)',   light: 'rgba(20,184,166,0.1)'   },
  personality:   { icon: '🧠', color: 'var(--purple)', light: 'rgba(168,85,247,0.1)' },
};

export default function MissionsPage() {
  const cOS = useCareerOS();
  const { user } = useAuth();
  const { 
    missionStreak: streak, 
    xp, 
    completedMissions, 
    onboardingAnswers,
    earnPins,
  } = cOS;

  const teacherId = user?.selectedTeacherId || 'priya';
  const teacher = {
    priya:  { name: 'Ms. Priya',  emoji: '👩‍💼' },
    aisha:  { name: 'Ms. Aisha',  emoji: '👩‍🏫' },
    rohan:  { name: 'Mr. Rohan',  emoji: '👨‍💻' },
    vikram: { name: 'Mr. Vikram', emoji: '👨‍⚖️' },
  }[teacherId] || { name: 'Ms. Priya', emoji: '👩‍💼' };

  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [extraMissions, setExtraMissions] = useState<Mission[]>([]);
  const [generating, setGenerating] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [customRole, setCustomRole] = useState(onboardingAnswers?.role || 'Software Developer');
  const [generatingSkill, setGeneratingSkill] = useState(false);

  useEffect(() => {
    if (onboardingAnswers?.role) {
      setCustomRole(onboardingAnswers.role);
    }
  }, [onboardingAnswers?.role]);

  const handleGenerateCustomQuests = async () => {
    if (!customSkill.trim()) {
      toast.error('Skill Required', 'Please enter a skill to train.');
      return;
    }
    setGeneratingSkill(true);
    try {
      await api.post('/api/missions/generate-custom-skill', {
        targetRole: customRole,
        skill: customSkill.trim()
      });
      toast.success('Skill Quests Active! ⚡', `Learning modules for "${customSkill}" have been injected.`);
      setCustomSkill('');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      toast.error('Generation Failed', err.message || 'Could not generate custom quests.');
    } finally {
      setGeneratingSkill(false);
    }
  };

  // Real Firestore missions (merged with local adaptive missions)
  const { data: firestoreMissions, isLoading: fsLoading } = useMissionsToday();
  const { data: historyData } = useMissionHistory();
  const historyMissions = historyData || [];

  // Pre-seed personal gap closure missions if passed in URL gaps query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const gapsParam = new URLSearchParams(window.location.search).get('gaps');
      if (gapsParam) {
        const gapSkills = gapsParam.split(',');
        const seeded: Mission[] = gapSkills.map((skill, idx) => ({
          id: `seeded_${skill.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          title: `Master ${skill.trim()} Fundamentals`,
          description: `Review core syntax, complete hands-on assignments, and submit evidence of building a sandbox app using ${skill.trim()}.`,
          type: 'skill',
          status: 'pending',
          trust_reward: 25,
          estimated_minutes: 35,
          source_weakness: skill.trim(),
          target_gap: `${skill.trim()} Core Competency`,
          role_requirement: `${onboardingAnswers.role || 'Target Role'} Gap Closure`
        }));
        setExtraMissions(seeded);
      }
    }
  }, [onboardingAnswers.role]);

  // Catalog of standard daily adaptive missions
  const baseMissions: Mission[] = [
    { 
      id: 'python_loops', 
      title: 'Complete Python Loops Practice', 
      description: 'Solve 3 advanced problems on array manipulation and nested loops.', 
      type: 'skill', 
      status: completedMissions.includes('python_loops') ? 'completed' : 'pending', 
      trust_reward: 15, 
      estimated_minutes: 25, 
      source_weakness: 'Python', 
      target_gap: 'Python Loops & Algorithms',
      role_requirement: `${onboardingAnswers.role || 'SDE'} Benchmark`
    },
    { 
      id: 'react_loops', 
      title: 'React Fundamentals Challenge', 
      description: 'Implement complex state synchronization hooks across deeply nested components.', 
      type: 'skill', 
      status: completedMissions.includes('react_loops') ? 'completed' : 'pending', 
      trust_reward: 15, 
      estimated_minutes: 20, 
      source_weakness: 'React Hooks', 
      target_gap: 'React Context & Render Loop',
      role_requirement: `${onboardingAnswers.role || 'SDE'} Benchmark`
    },
    { 
      id: 'star_video', 
      title: 'Record Video Response for STAR Story', 
      description: 'Describe a situation where you managed a critical frontend crash under intense time pressure.', 
      type: 'communication', 
      status: completedMissions.includes('star_video') ? 'completed' : 'pending', 
      trust_reward: 20, 
      estimated_minutes: 30, 
      source_weakness: 'Behavioral STAR', 
      target_gap: 'STAR Communication Framework',
      role_requirement: 'Corporate Readiness Benchmark'
    }
  ];

  // Merge extra gap seeded missions into today's list
  const activeExtra = extraMissions.map(m => ({
    ...m,
    status: completedMissions.includes(m.id) ? 'completed' : 'pending'
  }));

  // Merge Firestore missions with local adaptive missions (deduplicated by id)
  const fsBaseMissions = (firestoreMissions || []).map((m: any) => ({
    ...m,
    status: completedMissions.includes(m.id) ? 'completed' : (m.status || 'pending'),
  }));
  const localIds = new Set([...activeExtra.map(m => m.id), ...baseMissions.map(m => m.id)]);
  const uniqueFs = fsBaseMissions.filter((m: any) => !localIds.has(m.id));
  const allTodayMissions = [...activeExtra, ...baseMissions, ...uniqueFs];
  
  // Filter lists
  const pending = allTodayMissions.filter(m => m.status === 'pending');
  const completed = allTodayMissions.filter(m => m.status === 'completed');
  const todayPct = allTodayMissions.length ? (completed.length / allTodayMissions.length) * 100 : 0;

  // Use history already fetched above
  const pastCompleted = historyMissions.filter((m: any) => m.status === 'completed' || m.status === 'submitted');

  function handleTriggerRegenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
    }, 1000);
  }

  // Calculate gap closure % dynamically
  const gapClosurePct = allTodayMissions.length 
    ? Math.round((completed.length / allTodayMissions.length) * 100)
    : 0;

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>Daily Missions</h1>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>Adaptive challenges dynamically generated by AI to close gaps between Current & Future Self.</p>
        </div>

        {/* Streak & XP info card */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: '12px 18px',
            textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            minWidth: 90,
          }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>⭐</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px', marginTop: 2 }}>
              {xp.toLocaleString()}
            </div>
            <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Total XP</div>
          </div>
          <div style={{
            background: streak > 0 ? 'var(--amber-light)' : 'var(--bg2)',
            border: `1px solid ${streak > 0 ? '#fde68a' : 'var(--border)'}`,
            borderRadius: 16, padding: '12px 18px',
            textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            minWidth: 90,
          }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>🔥</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.5px', marginTop: 2 }}>{streak}</div>
            <div style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Day Streak</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Tab contents */}
        <div>
          {/* Progress bar */}
          {allTodayMissions.length > 0 && (
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 24, boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Today's Progress</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontWeight: 600 }}>
                    {completed.length}/{allTodayMissions.length} Completed
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div className="progress-fill" style={{ width: `${todayPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 6, background: 'var(--bg3)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content' }}>
              <button onClick={() => setTab('today')} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: tab === 'today' ? 'var(--bg2)' : 'transparent',
                color: tab === 'today' ? 'var(--t1)' : 'var(--t3)',
                boxShadow: tab === 'today' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.12s'
              }}>📅 Today's Quests</button>
              <button onClick={() => setTab('history')} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: tab === 'history' ? 'var(--bg2)' : 'transparent',
                color: tab === 'history' ? 'var(--t1)' : 'var(--t3)',
                boxShadow: tab === 'history' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.12s'
              }}>📋 History</button>
            </div>
            {tab === 'today' && (
              <button onClick={handleTriggerRegenerate} className="btn-ghost btn-sm" disabled={generating} style={{ fontSize: 11 }}>
                {generating ? '⟳ Re-generating...' : '⟳ Regenerate'}
              </button>
            )}
          </div>

          {/* Today Tab */}
          {tab === 'today' && (
            pending.length === 0 ? (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
                <div className="empty-state" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>All Gaps Successfully Addressed!</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 16 }}>Your daily roadmap is fully clear. Great work! Come back tomorrow or match new benchmarks.</div>
                  <Link href="/dashboard" className="btn-primary btn-sm">Command Center →</Link>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  {Object.entries(TYPE_META).map(([type, cfg]) => {
                    const count = pending.filter(m => m.type === type).length;
                    return count > 0 ? (
                      <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: cfg.light, color: cfg.color }}>
                        {cfg.icon} {count} {type.charAt(0).toUpperCase() + type.slice(1)} pending
                      </span>
                    ) : null;
                  })}
                </div>
                
                {/* Active Pending Missions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pending.map(m => (
                    <div key={m.id} style={{ position: 'relative' }}>
                      <MissionCard mission={m} onComplete={() => {}} />
                      
                      {/* Sub-label reflecting which target role path this mission closes */}
                      {m.target_gap && (
                        <div style={{ 
                          position: 'absolute', 
                          bottom: 12, 
                          right: 140, 
                          fontSize: 10, 
                          fontFamily: 'var(--font-mono)', 
                          background: 'var(--bg3)', 
                          border: '1px solid var(--border)', 
                          padding: '2px 8px', 
                          borderRadius: 6,
                          color: 'var(--t2)'
                        }}>
                          ⚡ Closes: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{m.target_gap}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* History Tab */}
          {tab === 'history' && (
            completedMissions.length === 0 ? (
              <div className="empty-state" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div className="empty-icon">📋</div>
                <div className="empty-title">No completed history yet</div>
                <div className="empty-desc">Completed missions appear here. Complete a mission today to build history!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  ✓ SECURE PROTOCOL VERIFIED COMPLETIONS
                </div>
                
                {/* Completed items from context dynamically */}
                {allTodayMissions.filter(m => completedMissions.includes(m.id)).map(m => (
                  <div key={m.id}>
                    <MissionCard mission={{ ...m, status: 'completed' }} onComplete={() => {}} />
                  </div>
                ))}

                {pastCompleted.slice(0, 5).map((m: any) => (
                  <div key={m.id}>
                    <MissionCard mission={{ ...m, status: 'completed' }} onComplete={() => {}} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right Column: Mission Insights sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Mission Insights panel */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 14 }}>
              📊 Mission Insights
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Daily XP Target */}
              <div>
                <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 6, justifyContent: 'space-between' }}>
                  <span>Daily XP Goal</span>
                  <span style={{ color: 'var(--teal)' }}>{completed.length * 25} / 100 XP</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (completed.length * 25))}%`, background: 'var(--teal)', borderRadius: 3 }} />
                </div>
              </div>

              {/* Gap Closure progress */}
              <div>
                <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 6, justifyContent: 'space-between' }}>
                  <span>Target Gap Closure</span>
                  <span style={{ color: 'var(--accent)' }}>{gapClosurePct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gapClosurePct}%`, background: 'var(--accent)', borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4, marginTop: 6, marginBlockEnd: 0 }}>
                  Each completed mission satisfies verified skills requirements mapping to your Digital Twin.
                </p>
              </div>

              {/* Target Alignment Card */}
              <div style={{ background: 'var(--bg3)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  Target Alignment Path
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
                  {onboardingAnswers.role || 'Not Configured'}
                </div>
                {!onboardingAnswers.hasCompleted && (
                  <Link href="/career-twin" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'block', marginTop: 6, fontWeight: 600 }}>
                    Configure Twin Roadmap ➔
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Custom Skill Trainer */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 14 }}>
              ⚡ Custom Skill Trainer
            </span>
            <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5, margin: '0 0 14px' }}>
              Want to train a specific skill? Generate custom socratic learning modules to fill the gaps for your career path.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>Skill to Train</label>
                <input
                  type="text"
                  placeholder="e.g. React, Docker, CI/CD, Python"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--t1)', fontSize: 12.5, outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>Target Career Role</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Engineer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--t1)', fontSize: 12.5, outline: 'none'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateCustomQuests}
                disabled={generatingSkill}
                className="btn-primary btn-sm"
                style={{ justifyContent: 'center', marginTop: 4, width: '100%' }}
              >
                {generatingSkill ? '⚡ Generating...' : 'Generate Training Modules'}
              </button>
            </div>
          </div>

          {/* Quick Help Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.03) 0%, rgba(168,85,247,0.03) 100%)', border: '1px dashed var(--border2)', borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{teacher.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{teacher.name}'s Tip</span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
              "Completing missions directly feeds your Consistency Index and raises your Reputation Level. Verified uploads to Vault automatically clear relevant pending missions."
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
