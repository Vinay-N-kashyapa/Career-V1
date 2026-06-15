'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import PinsBadge from '@/components/pins/PinsBadge';
import MissionCard from '@/components/ui/MissionCard';
import ActivityFeed from '@/components/ui/ActivityFeed';
import NextStepCard from '@/components/ui/NextStepCard';
import WhatToDoToday from '@/components/ui/WhatToDoToday';
import { QUESTS_REGISTRY } from '@/lib/data/questsData';

interface LevelInfo {
  index: number;
  label: string;
  next: string | null;
  xp: number;
  xpToNext: number;
  pct: number;
  color: string;
  emoji: string;
}

const TIERS = [
  { label: 'Explorer',        minDna: 0,  color: '#6366f1', emoji: '🌱' },
  { label: 'Career Builder',  minDna: 20, color: '#0ea5e9', emoji: '🔧' },
  { label: 'Interview Ready', minDna: 40, color: '#14b8a6', emoji: '🎯' },
  { label: 'Industry Ready',  minDna: 60, color: '#a855f7', emoji: '⚡' },
  { label: 'Elite Candidate', minDna: 80, color: '#22c55e', emoji: '🏆' },
] as const;

function computeLevel(xp: number, careerScore: number): LevelInfo {
  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (careerScore >= TIERS[i].minDna) { idx = i; break; }
  }
  const current = TIERS[idx], next = TIERS[idx + 1] ?? null;
  const span = next ? (next.minDna - current.minDna) : 100;
  const within = next ? Math.min(span, careerScore - current.minDna) : span;
  
  return {
    index: idx + 1,
    label: current.label,
    next: next?.label ?? null,
    xp,
    xpToNext: next ? Math.max(0, (next.minDna - idx * 20) * 150) : 0,
    pct: Math.round((within / span) * 100),
    color: current.color,
    emoji: current.emoji
  };
}

function AnimatedNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now(), dur = 900;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
      setDisplay(value * e);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <>{Math.round(display)}</>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const cOS = useCareerOS();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'recruiter') {
        router.push('/recruiter');
      } else if (user.role === 'consultant') {
        router.push('/consultant');
      }
    }
  }, [user, router]);

  const teacherId = user?.selectedTeacherId || 'priya';
  const teacher = {
    priya:  { name: 'Ms. Priya',  emoji: '👩‍💼', role: 'Career Architect', advice: 'Keep your Vault updated with verified projects and certificates. A strong Trust Score is crucial.' },
    aisha:  { name: 'Ms. Aisha',  emoji: '👩‍🏫', role: 'SDE Technical Lead', advice: 'Deep dive into coding assignments. Clean code is your strongest asset.' },
    rohan:  { name: 'Mr. Rohan',  emoji: '👨‍💻', role: 'Fullstack Dev Mentor', advice: 'Consistency is key. Try clearing one coding quest every day.' },
    vikram: { name: 'Mr. Vikram', emoji: '👨‍⚖️', role: 'Executive Recruiter', advice: 'Maintain a high mission streak to build consistency. Recruiters value regular engagement.' },
  }[teacherId] || { name: 'Ms. Priya', emoji: '👩‍💼', role: 'Career Architect', advice: 'Let\'s analyze your weak areas today.' };

  const {
    vaultItems,
    addVaultItem,
    updateVaultItem,
    onboardingAnswers,
    completedMissions,
    jdMissingSkills,
    careerScore,
    dnaScore,
    trustScore,
    xp,
    missionStreak,
    onboardingStep,
    roadmapGenerated,
    completedQuests,
    javaTestPassed,
    earnPins,
    pins,
    generateFusedRoadmap,
    setOnboarding
  } = cOS;

  // AI Verification Scan Simulator States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const scanIntervalRef = useRef<NodeJS.Timeout>();

  const unverifiedItems = vaultItems.filter(v => !v.verified);

  const startVerificationScan = () => {
    if (unverifiedItems.length === 0) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs(['[SYSTEM] Initializing AI Trust Verification Protocol...']);

    const logTemplates = [
      '[SYSTEM] Connected to decentralized verification nodes.',
      '[SCANNER] Fetching metadata signature from Vault ledger...',
      '[SCANNER] Running cryptographic hash check against SHA-256 anchors...',
      '[SECURE] Document verification keys extracted.',
      '[AI] Running optical character recognition (OCR) on proof asset...',
      '[AI] Analyzing issuer credentials and accreditation database...',
      '[AI] Matching skill tags with Career Twin profile...',
      '[SYSTEM] Authenticity score: 98.6% confidence rating.',
      '[SUCCESS] Cryptographic proof verified successfully.',
      '[SYSTEM] Committing verification state to local index...'
    ];

    let step = 0;
    scanIntervalRef.current = setInterval(() => {
      step += 1;
      setScanProgress(prev => Math.min(100, prev + 10));

      if (step <= logTemplates.length) {
        setScanLogs(prev => [...prev, logTemplates[step - 1]]);
      }

      if (step >= 10) {
        clearInterval(scanIntervalRef.current);
        // Verify all unverified items
        unverifiedItems.forEach(item => {
          updateVaultItem(item.id, { verified: true });
        });
        setIsScanning(false);
        setScanProgress(100);
      }
    }, 350);
  };

  const seedDemoCertificate = () => {
    addVaultItem({
      title: 'AWS Certified Cloud Practitioner',
      item_type: 'certification',
      organization_name: 'Amazon Web Services (AWS)',
      description: 'Validation of overall understanding of the AWS Cloud platform.',
      skill_tags: ['Cloud Computing', 'AWS', 'IAM', 'EC2']
    });
  };

  // Inline Trajectory Generator
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  
  const handleChooseTrajectory = async (trackTitle: string) => {
    setIsGeneratingRoadmap(true);
    let skillTags: string[] = [];
    let weakAreas: string[] = [];
    if (trackTitle === 'Java Backend Architect') {
      skillTags = ['Java', 'Spring Boot', 'SQL'];
      weakAreas = ['Caching', 'Distributed Systems'];
    } else if (trackTitle === 'Frontend React Engineer') {
      skillTags = ['React', 'Next.js', 'CSS'];
      weakAreas = ['State Sync', 'Performance'];
    } else if (trackTitle === 'AI Software Engineer') {
      skillTags = ['Python', 'PyTorch', 'LLMs'];
      weakAreas = ['Model Pipelines', 'Vector DBs'];
    } else {
      skillTags = ['Node.js', 'Docker', 'React'];
      weakAreas = ['CI/CD', 'APIs'];
    }
    
    try {
      setOnboarding({
        role: trackTitle,
        education: onboardingAnswers.education || 'B.Tech CS',
        skills: skillTags.join(', '),
        experience: onboardingAnswers.experience || 'None'
      });
      await generateFusedRoadmap(skillTags, weakAreas);
    } catch (e) {
      console.error("Inline roadmap compilation error", e);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Trajectory modules parser
  const [allQuestsMap, setAllQuestsMap] = useState<Record<string, { title: string; category?: string }>>({});
  const [roadmapModules, setRoadmapModules] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedTrajectory, setSelectedTrajectory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const map: Record<string, { title: string; category?: string }> = {};
      QUESTS_REGISTRY.forEach(q => {
        map[q.id] = { title: q.title, category: q.type === 'coding' ? 'assignment' : 'learning' };
      });
      const modulesKey = `pinit_${user?.id || 'guest'}_roadmap_modules`;
      const saved = localStorage.getItem(modulesKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRoadmapModules(parsed);
            parsed.forEach((m: any) => {
              if (Array.isArray(m.quests)) {
                m.quests.forEach((q: any) => {
                  map[q.id] = { title: q.title, category: q.category };
                });
              }
            });
          }
        } catch {}
      } else {
        setRoadmapModules([]);
      }
      setAllQuestsMap(map);
    }
  }, [user?.id, completedQuests, roadmapGenerated]);

  const [animIn, setAnimIn] = useState(false);

  useEffect(() => { 
    if (mounted) {
      setAnimIn(true);
    }
  }, [mounted]);

  const level = computeLevel(xp, careerScore);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  }

  // Derive mock active missions from catalog minus what is completed
  const allMissions = [
    {
      id: 'python_loops',
      title: 'Complete Python loops practice',
      description: 'Solve 3 problems on array manipulation and nested loops.',
      type: 'skill',
      status: completedMissions.includes('python_loops') ? 'completed' : 'pending',
      trust_reward: 15,
      estimated_minutes: 25,
      source_weakness: 'Python',
      target_gap: 'Python Loops & Algorithms',
      role_requirement: 'Swiggy AI Software Engineer Benchmark'
    },
    {
      id: 'react_loops',
      title: 'React Fundamentals Challenge',
      description: 'Implement complex state synchronization hooks across components.',
      type: 'skill',
      status: completedMissions.includes('react_loops') ? 'completed' : 'pending',
      trust_reward: 15,
      estimated_minutes: 20,
      source_weakness: 'React Hooks',
      target_gap: 'React Context & Render Loop',
      role_requirement: 'Razorpay Frontend Developer Benchmark'
    },
    {
      id: 'star_video',
      title: 'Record a video response for STAR story',
      description: 'Describe a situation where you managed a critical frontend crash under time pressure.',
      type: 'communication',
      status: completedMissions.includes('star_video') ? 'completed' : 'pending',
      trust_reward: 20,
      estimated_minutes: 30,
      source_weakness: 'Behavioral STAR',
      target_gap: 'STAR Communication Framework',
      role_requirement: 'Corporate Readiness Benchmark'
    }
  ];

  const pendingMissions = allMissions.filter(m => m.status === 'pending');

  const vaultAchievements = vaultItems.map(item => {
    let icon = '⚡';
    let color = 'var(--teal)';
    if (item.item_type === 'certification') { icon = '🏆'; color = 'var(--amber)'; }
    else if (item.item_type === 'internship') { icon = '🏢'; color = 'var(--blue)'; }
    else if (item.item_type === 'hackathon') { icon = '🚀'; color = 'var(--purple)'; }
    
    return {
      title: item.title,
      org: item.organization_name || 'Verified Evidence',
      verified: item.verified,
      icon,
      color
    };
  });

  const completedQuestAchievements = (completedQuests || []).map(questId => {
    let title = `Quest: ${questId}`;
    let category = 'assignment';
    
    const matched = QUESTS_REGISTRY.find(q => q.id === questId);
    if (matched) {
      title = matched.title;
      category = matched.type === 'coding' ? 'assignment' : 'learning';
    }

    let icon = '💻';
    let color = 'var(--teal)';
    let org = 'Coding Assignment';

    if (category === 'learning') {
      icon = '🎓';
      color = 'rgba(167,139,250,1)';
      org = 'Socratic Lecture Class';
    } else if (category === 'exam') {
      icon = '📝';
      color = 'var(--coral)';
      org = 'Coding Exam';
    }

    return {
      title,
      org,
      verified: true,
      icon,
      color
    };
  });

  const verifiedAchievements = [...vaultAchievements, ...completedQuestAchievements];

  // Derive Daily Recommendations
  const recommendations = [];
  if (jdMissingSkills.length > 0) {
    jdMissingSkills.slice(0, 2).forEach((skill, idx) => {
      recommendations.push({
        title: `Learn ${skill}`,
        desc: `Identified as a critical missing skill in your matched job openings. Closes -${15 + idx * 5}% alignment gap.`,
        label: 'Urgent Target',
        color: 'var(--coral)'
      });
    });
  } else {
    recommendations.push({
      title: 'Learn Python Basics',
      desc: 'Closes -25% of your target SDE internship benchmark gaps.',
      label: 'Recommended',
      color: 'var(--teal)'
    });
  }

  recommendations.push({
    title: 'Verify Skills in Vault',
    desc: 'Add certificates or project docs to your Vault to boost your recruiter visibility and trust score.',
    label: 'Critical Action',
    color: 'var(--coral)'
  });

  // Derived next steps
  let nextStepTitle = 'Setup Your Profile';
  let nextStepDesc = 'Take the onboarding questionnaire to initialize your digital twin.';
  let nextStepHref = '/career-twin';
  let nextStepIcon = '🧬';
  let nextStepColor = 'var(--accent)';

  if (onboardingStep === 0) {
    nextStepTitle = 'Setup Your Career OS Profile';
    nextStepDesc = 'Take the 2-minute onboarding assessment to map your strengths.';
    nextStepHref = '/career-twin';
    nextStepIcon = '🧬';
    nextStepColor = 'var(--accent)';
  } else if (vaultItems.length === 0) {
    nextStepTitle = 'Upload Assets to Your Vault';
    nextStepDesc = 'Certifications, project docs, and course badges boost your Trust Score.';
    nextStepHref = '/vault';
    nextStepIcon = '🗂️';
    nextStepColor = 'var(--purple)';
  } else if (completedMissions.length === 0) {
    nextStepTitle = 'Solve Your First SDE Mission';
    nextStepDesc = 'Every morning, 5 personalised missions are generated to close your skill gaps.';
    nextStepHref = '/missions';
    nextStepIcon = '⚡';
    nextStepColor = 'var(--amber)';
  } else if (!roadmapGenerated) {
    nextStepTitle = 'Choose Your Career Trajectory';
    nextStepDesc = 'Select your target trajectory below to build your custom socratic quest path.';
    nextStepHref = '#trajectory-selector';
    nextStepIcon = '🛠️';
    nextStepColor = 'var(--teal)';
  } else {
    nextStepTitle = 'Launch Your Next Quest';
    nextStepDesc = 'Start coding in our simulated SDE workspace to unlock certificates.';
    nextStepHref = '/quests';
    nextStepIcon = '🗺️';
    nextStepColor = 'var(--blue)';
  }

  // Segmented trust quotient calculations
  const trustLevel = Math.floor(trustScore / 20); // 0 to 5 segments

  return (
    <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 4px' }} className="animate-fade-in">
      <style>{`
        /* redone visual elements & animations */
        .glass-card-redone {
          background: rgba(13, 18, 30, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
        }
        .glass-card-redone:hover {
          border-color: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
        }
        .glowing-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.15;
          transition: all 0.5s ease;
        }
        .pulse-light {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          display: inline-block;
          box-shadow: 0 0 8px var(--green);
          animation: laser-pulse 1.8s infinite;
        }
        .pulse-light-amber {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--amber);
          display: inline-block;
          box-shadow: 0 0 8px var(--amber);
          animation: laser-pulse 1.8s infinite;
        }
        @keyframes laser-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .scan-laser-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--green-mid), transparent);
          box-shadow: 0 0 8px var(--green);
          animation: scanner-sweep 2s infinite linear;
          z-index: 10;
        }
        @keyframes scanner-sweep {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .glow-accent-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .glow-accent-btn:hover {
          box-shadow: 0 0 14px rgba(99, 102, 241, 0.45);
        }
        .timeline-vertical {
          position: relative;
          padding-left: 32px;
          border-left: 2px dashed rgba(255, 255, 255, 0.1);
          margin-left: 12px;
        }
        .timeline-node {
          position: absolute;
          left: -9px;
          top: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--bg3);
          border: 3px solid var(--border2);
          transition: all 0.3s;
        }
        .timeline-node.completed {
          background: var(--green);
          border-color: var(--green-light);
          box-shadow: 0 0 8px var(--green);
        }
        .timeline-node.active {
          background: var(--accent);
          border-color: var(--accent-light);
          box-shadow: 0 0 10px var(--accent);
          animation: pulse-node 1.5s infinite;
        }
        @keyframes pulse-node {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .console-stream {
          background: rgba(8, 11, 20, 0.95);
          font-family: var(--font-mono);
          font-size: 10.5px;
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 12px;
          color: var(--green-mid);
          height: 130px;
          overflow-y: auto;
          line-height: 1.5;
          text-align: left;
          scrollbar-width: none;
        }
        .console-stream::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Welcome Dashboard Banner Header */}
        <div style={{
          padding: '24px 30px',
          background: 'linear-gradient(135deg, var(--bg2), rgba(18, 24, 36, 0.4))',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="glowing-glow" style={{ top: -60, right: -60, width: 220, height: 220, background: 'rgba(99, 102, 241, 0.2)' }} />
          <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.6px', margin: '0 0 6px' }}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'Explorer'} 👋
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulse-light" />
              SDE Career Twin Active &middot; Current Archetype: <strong style={{ color: 'var(--t1)' }}>{onboardingAnswers.role || 'Unassigned'}</strong>
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
            {/* Streak Days Widget */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 12,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.18)',
              boxShadow: '0 0 12px rgba(245,158,11,0.04)',
            }}>
              <span style={{ fontSize: 16, animation: 'float-slow 2s infinite ease-in-out' }}>🔥</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.5px', lineHeight: 1 }}>{missionStreak}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>streak days</div>
              </div>
            </div>

            {/* Pins Balance */}
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 12,
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.18)',
                cursor: 'pointer', transition: 'all 0.15s',
              }} className="glow-accent-btn">
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.5px', lineHeight: 1 }}>{pins}</div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>pins</div>
                </div>
              </div>
            </Link>
            <Link href="/career-assets" className="btn-ghost btn-sm">💼 Assets Studio</Link>
            <Link href="/opportunities" className="btn-primary btn-sm">🎯 Match Jobs</Link>
          </div>
        </div>

        {/* HUD Telemetry Gauges (Section A, B, C) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          
          {/* Card A: Career Score (Radial Glass Gauge) */}
          <div className="glass-card-redone" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="glowing-glow" style={{ top: -30, right: -30, width: 140, height: 140, background: 'rgba(99,102,241,0.25)' }} />
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>🛡 Career Score</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--t1)', marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)' }}><AnimatedNum value={careerScore}/></span><span style={{ fontSize: 14, color: 'var(--t3)' }}> / 100</span>
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55, margin: 0 }}>
                Synthesized capability rating derived from verified skills, active context, and milestones.
              </p>
            </div>

            {/* Glowing SVG Gauge */}
            <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0, zIndex: 1 }}>
              <svg width="96" height="96" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent)" strokeDasharray={`${careerScore}, 100`} strokeWidth="3" strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </svg>
              <div style={{ position: 'absolute', top: '53%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px' }}>
                {careerScore}
              </div>
            </div>
          </div>

          {/* Card B: Trust Quotient Security Shield & Scanning Simulator */}
          <div className="glass-card-redone" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isScanning && <div className="scan-laser-line" />}
            <div className="glowing-glow" style={{ bottom: -30, right: -30, width: 140, height: 140, background: 'rgba(5, 150, 105, 0.15)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>🔐 Credential Trust Quotient</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--green-mid)', marginTop: 4, marginBottom: 0 }}>
                  {trustScore}%
                </h2>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-mid)', background: 'var(--green-light)', padding: '2px 8px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.2)' }}>
                {trustScore >= 70 ? 'High Trust' : 'Moderate Trust'}
              </span>
            </div>

            {/* Segmented Status Bar */}
            <div style={{ display: 'flex', gap: 4, height: 8, width: '100%', zIndex: 1 }}>
              {[1, 2, 3, 4, 5].map((seg) => {
                const filled = trustLevel >= seg;
                let bg = 'rgba(255, 255, 255, 0.05)';
                if (filled) {
                  bg = trustScore >= 70 ? 'var(--green-mid)' : 'var(--amber-mid)';
                }
                return (
                  <div key={seg} style={{ flex: 1, height: '100%', borderRadius: 4, background: bg, boxShadow: filled ? `0 0 8px ${trustScore >= 70 ? 'var(--green)' : 'var(--amber)'}` : 'none', transition: 'all 0.5s ease' }} />
                );
              })}
            </div>

            {/* Scanning Console / Call to Action */}
            <div style={{ marginTop: 2, zIndex: 1 }}>
              {isScanning ? (
                <div className="console-stream">
                  {scanLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                  <div style={{ marginTop: 4, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scanProgress}%`, background: 'var(--green-mid)', transition: 'width 0.25s linear' }} />
                  </div>
                </div>
              ) : unverifiedItems.length > 0 ? (
                <button onClick={startVerificationScan} className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--green) 0%, var(--green-mid) 100%)', border: 'none', padding: '10px', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  ⚡ AI Verification Available ({unverifiedItems.length} Pending)
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--t2)', flex: 1 }}>
                    All uploaded credentials verified. Add certification in Vault to scan again.
                  </div>
                  {vaultItems.length === 0 && (
                    <button onClick={seedDemoCertificate} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11, whiteSpace: 'nowrap' }}>
                      + Seed Demo Proof
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card C: Reputation level */}
          <div className="glass-card-redone" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
            <div className="glowing-glow" style={{ top: -30, left: -30, width: 140, height: 140, background: 'rgba(124, 58, 237, 0.15)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>🎓 Reputation Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 24 }}>{level.emoji}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: level.color }}>{level.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Tier {level.index} &middot; {xp.toLocaleString()} XP</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>
                <span>Level Progress</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{level.pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${level.pct}%`, background: `linear-gradient(90deg, var(--accent), ${level.color})`, borderRadius: 3 }} />
              </div>
            </div>
          </div>

        </div>

        {/* Personalised Gap-Closure Actions Checklist */}
        <WhatToDoToday profile={profileForActions()} />

        {/* Dashboard Command Center Core Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.80fr) minmax(0, 1.20fr)',
          gap: 20
        }}>
          
          {/* LEFT COLUMN: Trajectory Progress Map & Active Quests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Trajectory Progress Timeline Card */}
            <div id="trajectory-selector" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(18, 24, 36, 0.2)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🗺️ SDE Trajectory Progress Map
                </h3>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 6 }}>
                  {roadmapGenerated ? 'Active Track' : 'Trajectory Selection Required'}
                </span>
              </div>

              <div style={{ padding: 24 }}>
                {roadmapGenerated && roadmapModules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: 0, lineHeight: 1.5 }}>
                      Your dynamic roadmap was generated by analyzing your profile context. Complete quests to clear modules.
                    </p>
                    
                    {/* Glowing Vertical Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 4 }}>
                      {roadmapModules.map((module, mIdx) => {
                        const allQuests = module.quests || [];
                        const completedCount = allQuests.filter((q: any) => completedQuests.includes(q.id)).length;
                        const isModuleCompleted = completedCount === allQuests.length && allQuests.length > 0;
                        const isModuleActive = !isModuleCompleted && (mIdx === 0 || (roadmapModules[mIdx - 1]?.quests || []).every((q: any) => completedQuests.includes(q.id)));
                        
                        let nodeClass = 'timeline-node';
                        if (isModuleCompleted) nodeClass += ' completed';
                        else if (isModuleActive) nodeClass += ' active';

                        return (
                          <div key={module.id || mIdx} style={{ position: 'relative' }} className="timeline-vertical">
                            <div className={nodeClass} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                                    {module.title}
                                  </h4>
                                  <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                                    {completedCount}/{allQuests.length} Quests Completed
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: 10,
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: isModuleCompleted ? 'var(--green-light)' : isModuleActive ? 'var(--accent-light)' : 'var(--bg3)',
                                  color: isModuleCompleted ? 'var(--green-mid)' : isModuleActive ? 'var(--accent)' : 'var(--t3)',
                                }}>
                                  {isModuleCompleted ? '✓ Completed' : isModuleActive ? '⚡ Active' : '🔒 Locked'}
                                </span>
                              </div>

                              {/* Quest Chips */}
                              {isModuleActive && (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                  {allQuests.map((quest: any) => {
                                    const isQuestDone = completedQuests.includes(quest.id);
                                    let catIcon = '💻';
                                    let catColor = 'var(--teal)';
                                    if (quest.category === 'learning') { catIcon = '🎓'; catColor = 'var(--purple-mid)'; }
                                    else if (quest.category === 'exam') { catIcon = '📝'; catColor = 'var(--coral-mid)'; }

                                    return (
                                      <Link key={quest.id} href={`/quests`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          padding: '6px 12px',
                                          borderRadius: 10,
                                          background: isQuestDone ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg3)',
                                          border: `1.5px solid ${isQuestDone ? 'rgba(5, 150, 105, 0.2)' : 'var(--border)'}`,
                                          fontSize: 11.5,
                                          fontWeight: 600,
                                          color: isQuestDone ? 'var(--green-mid)' : 'var(--t1)',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s'
                                        }} className="glow-accent-btn">
                                          <span>{isQuestDone ? '✓' : catIcon}</span>
                                          <span>{quest.title}</span>
                                          <span style={{ fontSize: 9.5, opacity: 0.6, color: catColor }}>({quest.category || 'task'})</span>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {isGeneratingRoadmap ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg3)', borderRadius: 16 }}>
                        <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🗺️</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Generating AI Quest Roadmap...</div>
                        <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '4px 0 0', lineHeight: 1.4 }}>
                          Fusing your strengths and trajectory gaps to build a customized socratic quest path.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: '16px 20px', background: 'rgba(220, 38, 38, 0.03)', border: '1px solid rgba(220, 38, 38, 0.12)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 22 }}>🔒</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Roadmap Not Configured</div>
                            <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0, lineHeight: 1.4 }}>
                              Select your desired SDE trajectory below to build your custom socratic quest path.
                            </p>
                          </div>
                        </div>

                        {/* Trajectory selector grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                          {[
                            { title: 'Java Backend Architect', icon: '☕', color: 'var(--accent)', desc: 'Spring Boot, SQL, Distributed Systems, APIs, Caching.' },
                            { title: 'Frontend React Engineer', icon: '⚛️', color: 'var(--teal)', desc: 'Next.js, State Sync, Webpack, Tailwind, WebGL.' },
                            { title: 'AI Software Engineer', icon: '🤖', color: 'var(--purple)', desc: 'Python, LLMs, Vector DBs, Model pipelines, PyTorch.' },
                            { title: 'Fullstack Generalist', icon: '💻', color: 'var(--green)', desc: 'Node.js, Postgres, Docker, React, CI/CD pipelines.' }
                          ].map((track) => (
                            <div key={track.title} onClick={() => handleChooseTrajectory(track.title)} style={{
                              background: 'var(--bg3)',
                              border: `1.5px solid ${selectedTrajectory === track.title ? track.color : 'var(--border)'}`,
                              borderRadius: 16,
                              padding: 16,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: selectedTrajectory === track.title ? `0 0 12px ${track.color}18` : 'none',
                              textAlign: 'left'
                            }}
                            onMouseEnter={() => setSelectedTrajectory(track.title)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 24 }}>{track.icon}</span>
                                {selectedTrajectory === track.title && (
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: track.color, boxShadow: `0 0 8px ${track.color}` }} />
                                )}
                              </div>
                              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px' }}>
                                {track.title}
                              </h4>
                              <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.45, margin: '0 0 12px' }}>
                                {track.desc}
                              </p>
                              <span style={{ fontSize: 11, fontWeight: 700, color: track.color, fontFamily: 'var(--font-mono)' }}>
                                Choose Path ➔
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Active gap-closure missions card */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>
                  ⚡ SDE Practice Missions
                </h3>
                <Link href="/missions" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Solve All ➔</Link>
              </div>

              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingMissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg3)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>All Daily Missions Cleared!</div>
                    <p style={{ fontSize: 11.5, color: 'var(--t3)', maxWidth: 320, margin: '0 auto 12px', lineHeight: 1.4 }}>
                      Excellent commitment. You have successfully resolved all identified alignment gaps.
                    </p>
                    <Link href="/opportunities" className="btn-primary btn-sm">🎯 Match SDE Openings</Link>
                  </div>
                ) : (
                  pendingMissions.slice(0, 2).map((m: any) => (
                    <div key={m.id} style={{ position: 'relative' }}>
                      <MissionCard mission={m} onComplete={() => {}} />
                      {m.target_gap && (
                        <div style={{
                          position: 'absolute',
                          bottom: 12,
                          right: 140,
                          fontSize: 10.5,
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--bg3)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          color: 'var(--t2)'
                        }}>
                          Gap: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{m.target_gap}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Mentor Messenger, Consistency, Recent Portfolio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Mentor Inbox Workspace Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,70,229,0.04), rgba(124,58,237,0.02))', border: '2px solid rgba(99,70,229,0.15)', borderRadius: 24, padding: 22, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
              <div className="glowing-glow" style={{ top: -40, right: -40, width: 120, height: 120, background: 'rgba(99,102,241,0.2)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid var(--border)' }}>
                  {teacher.emoji}
                </div>
                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{teacher.name}</h4>
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{teacher.role}</span>
                </div>
              </div>

              {/* Chat bubble */}
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '0px 14px 14px 14px', padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
                  "{teacher.advice}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/interview" className="btn-primary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🎙️ Mock Interview
                </Link>
                <Link href="/quests" className="btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🎓 Socratic Quests
                </Link>
              </div>
            </div>

            {/* Consistency index flame calendar */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 26, animation: 'float-slow 2s infinite ease-in-out' }}>🔥</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--font-display)' }}>
                    Consistency Index
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                    Streak: {missionStreak} Days
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const active = idx < Math.min(missionStreak, 7);
                  return (
                    <div key={idx} style={{
                      flex: 1,
                      height: 36,
                      borderRadius: '50%',
                      background: active ? 'rgba(245,158,11,0.08)' : 'var(--bg3)',
                      color: active ? '#f59e0b' : 'var(--t4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      border: `1.5px solid ${active ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
                      boxShadow: active ? '0 0 8px rgba(245,158,11,0.15)' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {active ? '🔥' : day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent achievements verified portfolio */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 800, color: 'var(--t1)' }}>
                  🏆 Verified Portfolio
                </h3>
                <Link href="/vault" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Evidence Vault ➔</Link>
              </div>

              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verifiedAchievements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg3)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🗄️</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Portfolio is empty</div>
                    <p style={{ fontSize: 11, color: 'var(--t3)', maxWidth: 280, margin: '0 auto 12px', lineHeight: 1.4 }}>
                      Secure certifications, internships, or completed quest assets in your Vault to showcase them here.
                    </p>
                    <Link href="/vault" className="btn-primary btn-sm">+ Upload Proof</Link>
                  </div>
                ) : (
                  verifiedAchievements.slice(0, 3).map((ach, idx) => (
                    <div key={idx} style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s'
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${ach.color}15`, display: 'flex', alignItems: 'center', fontSize: 16, flexShrink: 0, justifyContent: 'center' }}>
                        {ach.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{ach.title}</span>
                          {ach.verified && <span style={{ fontSize: 8.5, color: 'var(--green)', background: 'var(--green-light)', padding: '1px 5px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.15)', fontFamily: 'var(--font-mono)' }}>✓ Verified</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--t2)' }}>{ach.org}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live activity feed */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, padding: 18, boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 12 }}>⚡ Live Activity Feed</span>
              <ActivityFeed userId={user?.id} />
            </div>

          </div>

        </div>

        {/* Dynamic workflow next-step CTA handoff */}
        <div style={{ marginTop: 8 }}>
          <NextStepCard
            title={nextStepTitle}
            description={nextStepDesc}
            href={nextStepHref}
            icon={nextStepIcon}
            color={nextStepColor}
            eyebrow="Recommended next step"
            ctaLabel="Go ➔"
          />
        </div>

      </div>

    </div>
  );

  function profileForActions() {
    return {
      ats_score: careerScore,
      trust_score: trustScore,
      career_dna_score: dnaScore,
      mission_streak: missionStreak,
      missions_completed: completedMissions.length,
      recruiter_visibility: Number(user?.recruiter_visibility ?? 65),
      vault_count: vaultItems.length,
      interviews_done: Number(user?.interviews_done ?? 0),
      weak_areas: (user?.weak_areas as string[] | undefined) ?? [],
      skill_tags: (user?.skill_tags as string[] | undefined) ?? [],
      xp_total: xp,
    };
  }
}
