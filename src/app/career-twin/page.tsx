'use client';
// Premium Digital Career Twin, Onboarding, & Fused Quests Engine
import { useState, useEffect, useRef } from 'react';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import PinsGate from '@/components/pins/PinsGate';
import PinsEarnNotice from '@/components/pins/PinsEarnNotice';

interface Path { 
  name: string; 
  probability: number; 
  role: string; 
  salary_range: string; 
  timeline: string; 
  requirements: string[]; 
  fit_score: number; 
  risk: string; 
  milestones: Array<{ month: number; milestone: string }>; 
}

interface Simulation { 
  current_trajectory: string; 
  paths: Path[]; 
  startup_founder_fit: number; 
  mba_suitability: number; 
  global_readiness: number; 
  top_recommendation: string; 
  urgent_actions: string[]; 
}

interface QuestStage {
  title: string;
  desc: string;
  href: string;
  icon: string;
  isComplete: (cOS: any) => boolean;
}

interface Quest {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  reward: {
    badge: string;
    xp: number;
    boost: string;
  };
  stages: QuestStage[];
}

const getOnboardingQuestions = (teacherName: string) => [
  { id: 'role', q: `Hi! I'm ${teacherName}, your AI Career Companion. What is your ultimate target role? (e.g. AI Engineer, Software Architect, Product Manager, UI Designer)`, placeholder: "e.g. AI Engineer at a high-scale startup..." },
  { id: 'education', q: "Awesome target! What is your current education level / college degree?", placeholder: "e.g. BCA 2nd Year, NIT CSE Graduate..." },
  { id: 'skills', q: "Got it. What are your current programming languages, frameworks, or skills?", placeholder: "e.g. React, JavaScript, basics of Python..." },
  { id: 'experience', q: "Any notable certificates, personal projects, or internships you have worked on?", placeholder: "e.g. Built a basic portfolio website, AWS certificate..." }
];

// Deep Quests definitions linked directly to live CareerOSContext
const QUESTS: Quest[] = [
  {
    id: 'frontend_dev',
    title: 'Frontend Developer Quest',
    subtitle: 'Master responsive scale systems and UI deployment',
    icon: '</>',
    color: 'var(--accent)',
    reward: { badge: '"Frontend Pro" Badge', xp: 2000, boost: 'Get featured to top recruiters' },
    stages: [
      { title: 'Resume Optimisation',   desc: 'Get your resume ATS score above 60.',             href: '/career-assets', icon: '📄', isComplete: cOS => cOS.vaultItems.some((itm: any) => itm.used_in_resume) },
      { title: 'React Challenge',       desc: 'Complete React Fundamentals mission.',           href: '/missions', icon: '⚛',  isComplete: cOS => cOS.completedMissions.includes('react_loops') },
      { title: 'Mock STAR Interview',   desc: 'Practice with AI and complete STAR preparation.', href: '/missions', icon: '🎙', isComplete: cOS => cOS.completedMissions.includes('star_video') },
      { title: 'Portfolio Upload',      desc: 'Deploy living portfolio website.',                href: '/career-assets', icon: '🚀', isComplete: cOS => cOS.vaultItems.some((itm: any) => itm.used_in_portfolio) },
      { title: 'Evidence In Vault',     desc: 'Upload at least 3 assets to Vault.',              href: '/vault',        icon: '📁', isComplete: cOS => cOS.vaultItems.length >= 3 },
      { title: 'Recruiter Simulation',  desc: 'Raise Career Score above 70.',                    href: '/dashboard',    icon: '🧬', isComplete: cOS => cOS.careerScore >= 70 },
    ],
  },
  {
    id: 'data_scientist',
    title: 'Data Scientist Quest',
    subtitle: 'Master the data stack and land your first data role',
    icon: '📊',
    color: 'var(--teal)',
    reward: { badge: '"Data Pro" Badge', xp: 2200, boost: 'Priority visibility to data recruiters' },
    stages: [
      { title: 'Resume Optimisation',  desc: 'Generate career assets with AI.',                href: '/career-assets', icon: '📄', isComplete: cOS => cOS.vaultItems.some((itm: any) => itm.used_in_resume) },
      { title: 'Python Foundation',    desc: 'Pass the Python Fundamentals mission.',          href: '/missions',     icon: '🐍', isComplete: cOS => cOS.completedMissions.includes('python_loops') },
      { title: 'SQL Mastery',          desc: 'Upload evidence of database projects.',          href: '/vault',        icon: '🗄', isComplete: cOS => cOS.vaultItems.some((itm: any) => itm.skill_tags.some((s: string) => s.toLowerCase().includes('sql') || s.toLowerCase().includes('database'))) },
      { title: 'Data Vault',           desc: 'Upload a data project to your Vault.',           href: '/vault',        icon: '📁', isComplete: cOS => cOS.vaultItems.length >= 2 },
    ],
  },
];

export default function CareerTwinPage() {
  const cOS = useCareerOS();
  const { user } = useAuth();
  const { onboardingAnswers, setOnboarding, jdMissingSkills, addXp } = cOS;
  const { earnPins: twinEarnPins, spendPins: twinSpendPins, canAfford: twinCanAfford } = useCareerOS();
  const [selected, setSelected] = useState(0);

  const teacherId = user?.selectedTeacherId || 'priya';
  const teacher = {
    priya:  { name: 'Ms. Priya',  emoji: '👩‍💼' },
    aisha:  { name: 'Ms. Aisha',  emoji: '👩‍🏫' },
    rohan:  { name: 'Mr. Rohan',  emoji: '👨‍💻' },
    vikram: { name: 'Mr. Vikram', emoji: '👨‍⚖️' },
  }[teacherId] || { name: 'Ms. Priya', emoji: '👩‍💼' };

  const ONBOARDING_QUESTIONS = getOnboardingQuestions(teacher.name);
  
  // Interactive Onboarding Chat State
  const [onboardingComplete, setOnboardingComplete] = useState(onboardingAnswers.hasCompleted);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(onboardingAnswers as unknown as Record<string, string>);
  const [inputVal, setInputVal] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: `Hi! I'm ${teacher.name}, your AI Career Companion. What is your ultimate target role? (e.g. AI Engineer, Software Architect, Product Manager, UI Designer)` }
  ]);
  const [simulating, setSimulating] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  function handleSendAnswer() {
    if (!inputVal.trim()) return;
    const currentQ = ONBOARDING_QUESTIONS[step];
    const updatedAnswers = { ...answers, [currentQ.id]: inputVal };
    setAnswers(updatedAnswers);
    
    const nextHistory = [
      ...chatHistory,
      { sender: 'user' as const, text: inputVal }
    ];
    setChatHistory(nextHistory);
    setInputVal('');

    if (step < ONBOARDING_QUESTIONS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          { sender: 'ai', text: ONBOARDING_QUESTIONS[nextStep].q }
        ]);
      }, 700);
    } else {
      // Completed onboarding
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          { sender: 'ai', text: "Analyzing your data... constructing your Digital Career Twin and Roadmap blueprint!" }
        ]);
        setSimulating(true);
        setTimeout(() => {
          setOnboardingComplete(true);
          setOnboarding({
            role: updatedAnswers.role || '',
            education: updatedAnswers.education || '',
            skills: updatedAnswers.skills || '',
            experience: updatedAnswers.experience || '',
          });
          setSimulating(false);
        }, 2000);
      }, 700);
    }
  }

  // Merge context missing skills or default
  const baseMissingSkills = jdMissingSkills.length > 0 
    ? jdMissingSkills 
    : ['Python Basics', 'Machine Learning Algorithms', 'System Design Fundamentals', 'PostgreSQL Datastore', 'Behavioral Interview STAR method'];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position:"relative", zIndex:1 }}>
          <h1 className="page-hero-title">✦ Career Twin Simulation</h1>
          <p className="page-hero-sub">AI-powered career path modeling — simulate trajectories, identify gaps, get a personalised roadmap</p>
        </div>
      </div>

      
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Digital Career Twin
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>
            Simulate your career path, run target gap analysis, and receive actionable roadmaps.
          </p>
        </div>
        {onboardingComplete && (
          <PinsGate featureKey="career_twin" onUnlocked={() => { 
            setOnboardingComplete(false); 
            setStep(0); 
            setAnswers({ role: '', education: '', skills: '', experience: '' }); 
            setChatHistory([{ sender: 'ai', text: ONBOARDING_QUESTIONS[0].q }]); 
          }}>
            <button className="btn-ghost btn-sm">
              ✦ Re-Simulate Career Twin
            </button>
          </PinsGate>
        )}
      </div>

      {/* ── Chat Onboarding Flow (AI Career Guide - Ms. Priya) ── */}
      {!onboardingComplete && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          
          {/* Active Chat Window */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', height: 480, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--accent), var(--purple))', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>{teacher.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{teacher.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>AI Career Companion</div>
              </div>
            </div>

            {/* Message Feed */}
            <div style={{ flex: 1, padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'ai' ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.55,
                    background: msg.sender === 'ai' ? 'var(--card)' : 'var(--accent)',
                    color: msg.sender === 'ai' ? 'var(--t1)' : 'white',
                    border: msg.sender === 'ai' ? '1px solid var(--border)' : 'none',
                    borderBottomLeftRadius: msg.sender === 'ai' ? 3 : 12,
                    borderBottomRightRadius: msg.sender === 'user' ? 3 : 12,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {simulating && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 12, fontSize: 12.5, color: 'var(--accent)' }}>
                    ⚡ Running neural simulator...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '12px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAnswer()}
                placeholder={ONBOARDING_QUESTIONS[step]?.placeholder || "Type your response..."}
                style={{ flex: 1, padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--t1)', fontSize: 12.5, outline: 'none' }}
              />
              <button onClick={handleSendAnswer} className="btn-primary" style={{ padding: '8px 18px', fontSize: 12 }}>
                Send →
              </button>
            </div>
          </div>

          {/* Guide Progress Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Blueprint Progress</span>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ONBOARDING_QUESTIONS.map((q, idx) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: idx <= step ? 'var(--t1)' : 'var(--t3)' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: idx < step ? 'var(--green)' : idx === step ? 'var(--accent)' : 'var(--bg3)',
                      color: idx <= step ? 'white' : 'var(--t3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700
                    }}>
                      {idx < step ? '✓' : idx + 1}
                    </div>
                    <span>{q.id.charAt(0).toUpperCase() + q.id.slice(1)} Mapping</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Fused Career Twin Simulation & Gap Roadmap (Onboarding Complete) ── */}
      {onboardingComplete && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {simulating && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 32, animation: 'spin 1s linear infinite', marginBottom: 12 }}>🧬</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>Simulating Career Twin...</h3>
              <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0 }}>{teacher.name} is modeling target milestones and calculating gap roadmaps.</p>
            </div>
          )}

          {!simulating && (
            <>
              {/* Twin Status Summary Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                
                {/* Simulated Blueprint Info */}
                <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(6,182,212,0.03))', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>🚀 Career OS Blueprint</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {[
                      { label: 'Target Role', value: onboardingAnswers.role || 'AI Software Engineer', color: 'var(--t1)' },
                      { label: 'Expected Salary', value: '₹18 - 25 LPA', color: 'var(--green)' },
                      { label: 'Current Level', value: 'Explorer Level 1', color: 'var(--accent)' },
                      { label: 'Time Required', value: '8 - 12 Months', color: 'var(--purple)' }
                    ].map(card => (
                      <div key={card.label} style={{ background: 'var(--bg2)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{card.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: card.color }}>{card.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Trajectory Fit Scores */}
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>📈 Simulated Trajectory Fit</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Startup Founder Fit', score: 82, color: 'var(--coral)' },
                      { label: 'Corporate Readiness', score: 71, color: 'var(--purple)' },
                      { label: 'Global Opportunities Prep', score: 65, color: 'var(--teal)' }
                    ].map(f => (
                      <div key={f.label}>
                        <div style={{ display: 'flex', fontSize: 11.5, color: 'var(--t2)', marginBottom: 3, justifyContent: 'space-between' }}>
                          <span>{f.label}</span>
                          <span style={{ fontWeight: 700, color: f.color }}>{f.score}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${f.score}%`, background: f.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Gap Analysis (Missing Skills Visualizer - Real Time JD Gaps) */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 12, display: 'block' }}>🎯 Missing Skills & Gap Analysis</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: 'var(--bg3)', borderRadius: 14, padding: 16 }}>
                    <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>✓ Matching Strengths (Your Profile)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(onboardingAnswers.skills ? onboardingAnswers.skills.split(',') : ['React', 'JavaScript', 'HTML5', 'CSS3', 'Git']).map(skill => (
                        <span key={skill} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'var(--green-light)', color: 'var(--green)', border: '1px solid rgba(5,150,105,0.15)', fontWeight: 600 }}>{skill.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 14, padding: 16 }}>
                    <div style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>⚠️ Urgent Missing Skills (Close these first)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {baseMissingSkills.map(skill => (
                        <span key={skill} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'var(--coral-light)', color: 'var(--coral)', border: '1px solid rgba(220,38,38,0.15)', fontWeight: 600 }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Trajectory Paths Simulation */}
              <div style={{ display: 'flex', gap: 10, margin: '10px 0' }}>
                {[
                  { name: `Elite SDE Intern (${onboardingAnswers.role || 'SDE'})`, probability: 88, timeline: '6 Months', salary: '₹20-32 LPA' },
                  { name: 'Elite AI Startup Founder', probability: 54, timeline: '12 Months', salary: 'Equity + ₹15 LPA' },
                  { name: 'Core Machine Learning SDE', probability: 68, timeline: '9 Months', salary: '₹18-28 LPA' }
                ].map((p, idx) => (
                  <button key={idx} onClick={() => setSelected(idx)} style={{
                    flex: 1, padding: 16, borderRadius: 16, border: `1.5px solid ${selected === idx ? 'var(--accent)' : 'var(--border)'}`,
                    background: selected === idx ? 'rgba(79,70,229,0.06)' : 'var(--bg2)',
                    cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selected === idx ? 'var(--accent)' : 'var(--t1)' }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{p.probability}% Prob · Timeline: {p.timeline}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginTop: 2 }}>{p.salary}</div>
                  </button>
                ))}
              </div>

              {/* 🧭 Deep active Career Quests (FUSED FROM ORIGINAL QUESTS FEATURE) */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 14, display: 'block' }}>🏆 Active Career Quests</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                  {QUESTS.map(quest => {
                    const stageResults = quest.stages.map((s, i) => ({
                      ...s,
                      index: i + 1,
                      completed: s.isComplete(cOS),
                    }));
                    const completedCount = stageResults.filter(s => s.completed).length;
                    const pct = Math.round((completedCount / quest.stages.length) * 100);
                    const currentStageIdx = stageResults.findIndex(s => !s.completed);
                    const isComplete = completedCount === quest.stages.length;

                    return (
                      <div key={quest.id} style={{
                        background: 'var(--bg2)',
                        border: `1px solid ${isComplete ? quest.color + '44' : 'var(--border)'}`,
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        {/* Quest Header */}
                        <div style={{
                          background: `linear-gradient(135deg, ${quest.color}14, var(--bg3))`,
                          borderBottom: '1px solid var(--border)',
                          padding: '16px 18px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10,
                              background: `${quest.color}22`, border: `1px solid ${quest.color}44`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 16,
                            }}>{quest.icon}</div>
                            <div>
                              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{quest.title}</h3>
                              <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{quest.subtitle}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 5, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: quest.color, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: quest.color }}>
                              {completedCount}/{quest.stages.length} Stages
                            </span>
                          </div>
                        </div>

                        {/* Stages list (depth detail) */}
                        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          {stageResults.map((s) => (
                            <div key={s.index} style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                              borderRadius: 6,
                              background: s.completed ? 'var(--bg3)' : s.index === currentStageIdx + 1 ? `${quest.color}0d` : 'transparent',
                            }}>
                              <span style={{ fontSize: 12 }}>{s.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11.5, fontWeight: s.index === currentStageIdx + 1 ? 700 : 500, color: s.completed ? 'var(--t3)' : 'var(--t1)' }}>
                                  Stg {s.index}: {s.title}
                                </div>
                              </div>
                              {s.completed ? (
                                <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>Complete</span>
                              ) : s.index === currentStageIdx + 1 ? (
                                <Link href={s.href} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: quest.color, textDecoration: 'none', padding: '3px 8px', background: `${quest.color}18`, borderRadius: 4 }}>
                                  Start ➔
                                </Link>
                              ) : (
                                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t4)' }}>🔒 Locked</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Rewards */}
                        <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>🏆 {quest.reward.badge}</span>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: quest.color }}>+{quest.reward.xp} XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Plan */}
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 8 }}>⚡ {teacher.name}'s Recommended Focus Quests</div>
                {[
                  "Upload any certifications related to your target stack to your Vault.",
                  "Complete target SDE missions on your Missions tab.",
                  "Verify your projects via AI Auto-Verification in the Vault."
                ].map((act, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{i + 1}.</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>

            </>
          )}

        </div>
      )}

    </div>
  );
}
