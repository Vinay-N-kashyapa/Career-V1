'use client';
// Gamified daily missions, quest tracker, and 3D Role-Play Persona Evolution Simulator
import { useState, useEffect } from 'react';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { useAuth } from '@/lib/context/AuthContext';
import MissionCard from '@/components/ui/MissionCard';
import LinguaLab from '@/components/missions/LinguaLab';
import { useMissionsToday, useMissionHistory } from '@/lib/api/hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/store/useAppStore';
import dynamic from 'next/dynamic';
import { speakWithAvatar, stopSpeaking, preloadTTS } from '@/lib/tts';

import PinsGate from '@/components/pins/PinsGate';
import PinsEarnNotice from '@/components/pins/PinsEarnNotice';

// Dynamic import of Three.js avatar renderer to prevent SSR hydration errors
const VRoidInterviewAvatar = dynamic(() => import('@/components/avatar/VRoidInterviewAvatar'), { ssr: false });

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
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { 
    missionStreak: streak, 
    xp, 
    completedMissions, 
    onboardingAnswers,
    setOnboarding,
    completeMission,
    addXp,
    earnPins,
    spendPins,
    canAfford,
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

  // Gamified Sub-tab selections & Language Trainer hooks
  const [activeTab, setActiveTab] = useState<'evolve' | 'language' | 'history'>('evolve');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<any | null>(null);
  const [socraticHistory, setSocraticHistory] = useState<any[]>([]);

  // ── Roleplay Simulator State ──
  const [roleplayActive, setRoleplayActive] = useState(false);
  const updateRoleplayActive = (active: boolean) => {
    setRoleplayActive(active);
    if (active) {
      router.replace('/missions?roleplay=true');
    } else {
      router.replace('/missions');
    }
  };
  const [roleplayLoading, setRoleplayLoading] = useState(false);
  const [roleplayScenario, setScenario] = useState<{
    scenarioTitle: string;
    activeAvatar: string;
    avatarName: string;
    avatarRole: string;
    message: string;
    choices: { text: string; delta: number }[];
    scenarioId: string;
  } | null>(null);
  const [roleplayHistory, setRoleplayHistory] = useState<{ role: 'user' | 'assistant' | 'system'; content: string; delta?: number }[]>([]);
  const [animState, setAnimState] = useState<'idle' | 'listening' | 'thinking' | 'talking'>('idle');
  const [evaluationReport, setEvaluationReport] = useState<string>('');
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [timerCount, setTimerCount] = useState(25);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [showTraditionalMissions, setShowTraditionalMissions] = useState(false);
  const [qt2Delta, setQt2Delta] = useState(0);
  const [cognitiveLoad, setCognitiveLoad] = useState(30);
  const [sessionElapsed, setSessionElapsed] = useState(0);

  // Session elapsed timer
  useEffect(() => {
    if (!roleplayActive || evaluationReport) return;
    const interval = setInterval(() => {
      setSessionElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [roleplayActive, evaluationReport]);

  // Preload TTS model on mount and ensure speech is stopped on page exit/unmount
  useEffect(() => {
    preloadTTS();
    return () => {
      stopSpeaking();
    };
  }, []);

  // Load Socratic simulation history from LocalStorage
  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem('pinit_socratic_history');
      if (rawHistory) {
        setSocraticHistory(JSON.parse(rawHistory));
      }
    } catch (err) {
      console.warn("Failed to load Socratic history:", err);
    }
  }, [activeTab]);

  // Sync simulator active state with URL query param so that the AppShell knows to hide sidebar/topbar and adjust layout width
  useEffect(() => {
    if (roleplayActive) {
      router.replace('/missions?roleplay=true');
    } else {
      router.replace('/missions');
    }
  }, [roleplayActive, router]);

  // Countdown timer for stress and natural blindness drilling
  useEffect(() => {
    if (!roleplayActive || !roleplayScenario || roleplayScenario.choices.length === 0 || evaluationLoading || evaluationReport || animState === 'talking') {
      return;
    }
    const interval = setInterval(() => {
      setTimerCount(prev => {
        if (prev <= 1) {
          // Timer ran out! Auto-select the worst choice (Option C) representing a panic System 1 shortcut
          toast.error("Time Expired! ⏳", "Panic option selected automatically due to stress limit.");
          const worstIdx = roleplayScenario.choices.length - 1;
          handleSelectChoice(worstIdx);
          return 25;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [roleplayActive, roleplayScenario, evaluationLoading, evaluationReport, animState]);

  const initiateRoleplay = async () => {
    if (!canAfford('quest_start')) {
      toast.error("Insufficient Pins", "Initiating a dynamic mindset evolution roleplay costs 5 Pins.");
      return;
    }

    setRoleplayLoading(true);
    setRoleplayActive(true);
    setScenario(null);
    setRoleplayHistory([]);
    setEvaluationReport('');
    setTimerCount(25);
    setCognitiveLoad(30);
    setSessionElapsed(0);
    stopSpeaking();

    try {
      // Spend 5 Pins
      await spendPins('quest_start', "Mindset Roleplay Outage Simulation");

      const res = await fetch('/api/missions/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          qt2: onboardingAnswers?.qt2_score ?? 75,
          role: onboardingAnswers?.role ?? 'Software Developer'
        })
      });
      const data = await res.json();
      if (data && data.ok) {
        setScenario(data);
        const firstMessage = { role: 'assistant' as const, content: data.message };
        setRoleplayHistory([firstMessage]);

        // Speak the message locally via neural voice
        setAnimState('talking');
        speakWithAvatar(data.message, data.activeAvatar, () => setAnimState('talking'), () => setAnimState('listening'), false, true);
      } else {
        throw new Error(data.error || "Initialization failed");
      }
    } catch (err: any) {
      toast.error("Simulation Error", err.message || "Could not launch role-play.");
      setRoleplayActive(false);
    } finally {
      setRoleplayLoading(false);
    }
  };

  const handleSelectChoice = async (idx: number) => {
    if (!roleplayScenario || selectedChoiceIdx !== null) return;
    setSelectedChoiceIdx(idx);
    stopSpeaking();

    const selectedChoice = roleplayScenario.choices[idx];
    const userMsg = { role: 'user' as const, content: selectedChoice.text, delta: selectedChoice.delta };
    const updatedHistory = [...roleplayHistory, userMsg];
    const delta = selectedChoice.delta || 0;
    setCognitiveLoad(prev => Math.min(100, Math.max(10, prev + (delta < 0 ? 15 : -10))));
    setRoleplayHistory(updatedHistory);

    setAnimState('thinking');
    try {
      const res = await fetch('/api/missions/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          choice: selectedChoice.text,
          history: updatedHistory
        })
      });
      const data = await res.json();
      if (data && data.ok) {
        setSelectedChoiceIdx(null);
        setTimerCount(25);

        const serverNodeCount = updatedHistory.filter(h => h.role === 'user').length;
        const forceEnd = data.isEnded || serverNodeCount >= 8;

        if (forceEnd) {
          // Conclude scenario and trigger evaluation
          data.isEnded = true;
          data.choices = [];
          setScenario(data);
          const finalMsg = { role: 'assistant' as const, content: data.message };
          setRoleplayHistory(prev => [...prev, finalMsg]);
          
          setAnimState('talking');
          speakWithAvatar(
            data.message, 
            data.activeAvatar, 
            () => setAnimState('talking'), 
            () => {
              setAnimState('idle');
              setTimeout(() => {
                triggerEvaluation([...updatedHistory, finalMsg]);
              }, 800);
            }, 
            false, 
            true
          );
        } else {
          // Process next dialogue step
          setScenario(data);
          const nextMsg = { role: 'assistant' as const, content: data.message };
          setRoleplayHistory(prev => [...prev, nextMsg]);

          setAnimState('talking');
          speakWithAvatar(data.message, data.activeAvatar, () => setAnimState('talking'), () => setAnimState('listening'), false, true);
        }
      } else {
        throw new Error(data.error || "Response failed");
      }
    } catch (err: any) {
      toast.error("Communication Error", err.message || "Failed to sync avatar response.");
      setSelectedChoiceIdx(null);
      setAnimState('idle');
    }
  };

  const triggerEvaluation = async (finalHistory: any[]) => {
    setEvaluationLoading(true);
    try {
      const res = await fetch('/api/missions/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          history: finalHistory
        })
      });
      const data = await res.json();
      if (data && data.ok) {
        setEvaluationReport(data.report);
        setQt2Delta(data.qt2_delta);

        // Update QT2 Score & Mindset Archetype in local context (which syncs it to Supabase)
        const todayStr = new Date().toDateString();
        const hasCompletedToday = onboardingAnswers?.last_streak_date === todayStr;
        
        const currentQT2 = onboardingAnswers?.qt2_score ?? 75;
        const newQT2 = Math.min(100, Math.max(30, currentQT2 + data.qt2_delta));
        const computedMindsetArchetype = data.mindset_archetype || 'Pattern Hunter';
        setOnboarding({
          ...onboardingAnswers,
          qt2_score: newQT2,
          mindset_archetype: computedMindsetArchetype,
          last_streak_date: todayStr
        });

        // Patch individual skill scores, streak, and archetype to database via profile update endpoint
        const currentComm = Number(user?.communication_score ?? 75);
        const currentExec = Number(user?.execution_score ?? 75);
        const currentLead = Number(user?.leadership_score ?? 75);
        const currentIntel = Number(user?.intelligence_score ?? 75);
        const currentStreak = Number(user?.mission_streak ?? user?.missionStreak ?? 0);

        const newComm = Math.min(100, Math.max(30, currentComm + (data.communication_delta || 0)));
        const newExec = Math.min(100, Math.max(30, currentExec + (data.execution_delta || 0)));
        const newLead = Math.min(100, Math.max(30, currentLead + (data.leadership_delta || 0)));
        const newIntel = Math.min(100, Math.max(30, currentIntel + (data.intelligence_delta || 0)));
        const newStreak = hasCompletedToday ? currentStreak : currentStreak + 1;

        api.patch('/api/auth/profile', {
          communication_score: newComm,
          execution_score: newExec,
          leadership_score: newLead,
          intelligence_score: newIntel,
          mission_streak: newStreak
        }).then(() => {
          // Trigger profile refresh so that the dashboard and Career DNA charts update dynamically
          refresh().catch(() => {});
        }).catch(() => {});

        // Award dynamic rewards
        addXp(150, "Socratic Roleplay Cleared");
        earnPins('mission_complete', 10, "Socratic Roleplay Cleared");
        if (hasCompletedToday) {
          toast.success("Evolution Complete! 🧠", `Socratic review compiled. Mindset Archetype evolved to: ${computedMindsetArchetype}. Streak is active for today! +150 XP and +10 Pins awarded.`);
        } else {
          toast.success("Evolution Complete! 🧠", `Socratic review compiled. Mindset Archetype evolved to: ${computedMindsetArchetype}. Streak: 🔥${newStreak} days! +150 XP and +10 Pins awarded.`);
        }

        // Have the active avatar speak the conclusion out loud explaining where we started and where we ended
        const lastSpeaker = roleplayScenario?.activeAvatar || 'anish';
        setAnimState('talking');
        speakWithAvatar(
          data.spokenConclusion || "We have reached the end of the crisis simulation. Please review your strategic decision and accountability scores inside the blueprint below.",
          lastSpeaker,
          () => setAnimState('talking'),
          () => setAnimState('idle'),
          false,
          true
        );

        // Save to Socratic history in local storage
        try {
          const rawHistory = localStorage.getItem('pinit_socratic_history');
          const historyArr = rawHistory ? JSON.parse(rawHistory) : [];
          const newRecord = {
            id: 'soc_' + Date.now(),
            title: roleplayScenario?.scenarioTitle || "Outage Socratic Crisis Simulation",
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            avatar: roleplayScenario?.activeAvatar || "abhijit",
            avatarName: roleplayScenario?.avatarName || "Mr. Abhijit",
            qt2Delta: data.qt2_delta,
            mindsetArchetype: computedMindsetArchetype,
            report: data.report
          };
          historyArr.unshift(newRecord);
          localStorage.setItem('pinit_socratic_history', JSON.stringify(historyArr));
        } catch (err) {
          console.warn("Failed to write simulation record to history:", err);
        }

        // Dispatch audit log
        api.post('/api/admin/audit-log/add', {
          action: 'interview_complete',
          meta: { scenarioId: roleplayScenario?.scenarioId, qt2Delta: data.qt2_delta, newQT2 }
        }).catch(() => {});
      } else {
        throw new Error(data.error || "Evaluation failed");
      }
    } catch (err: any) {
      toast.error("Evaluation Error", err.message || "Could not generate final persona report.");
    } finally {
      setEvaluationLoading(false);
    }
  };

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
  const { data: firestoreMissions } = useMissionsToday();
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
          role_requirement: `${onboardingAnswers?.role || 'Target Role'} Gap Closure`
        }));
        setExtraMissions(seeded);
      }
    }
  }, [onboardingAnswers?.role]);

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
      role_requirement: `${onboardingAnswers?.role || 'SDE'} Benchmark`
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
      role_requirement: `${onboardingAnswers?.role || 'SDE'} Benchmark`
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

  // Unified theme definitions binding directly to the global variables
  const theme = {
    bg: 'var(--bg)',
    bgCard: 'var(--bg2)',
    bgInside: 'var(--bg3)',
    border: 'var(--border)',
    tPrimary: 'var(--t1)',
    tSecondary: 'var(--t2)',
    tTertiary: 'var(--t3)',
    accentLight: 'var(--accent-light)'
  };

  if (roleplayActive) {
    return (
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        background: theme.bg,
        color: theme.tPrimary,
        padding: '20px',
        borderRadius: '24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }} className="animate-fade-in">
        
        {/* Active 3D Roleplay Workspace Banner */}
        <div style={{
          background: theme.bgCard,
          border: `1.5px solid ${theme.border}`,
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          transition: 'all 0.3s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent)', margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                ⚡ {roleplayScenario?.scenarioTitle || "Synthesizing Crisis..."}
              </h2>
              <span style={{ fontSize: 11, color: theme.tSecondary }}>Mindset scaling active: Onboarding QT2 index</span>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to abort this mindset simulation session? Your progress will not be saved.")) {
                  updateRoleplayActive(false); 
                  stopSpeaking();
                }
              }}
              style={{ 
                background: 'rgba(239, 68, 68, 0.05)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                padding: '5px 12px', 
                borderRadius: 8, 
                fontSize: 11, 
                fontWeight: 600,
                cursor: 'pointer', 
                color: 'var(--red)',
                transition: 'all 0.2s ease-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.borderColor = 'var(--red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              ❌ Abort Session
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20, minHeight: 380 }}>
            
            {/* Left Column Container: 3D Feed + Situation Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Left Column: 3D Telemetry Feed */}
              <div style={{ height: 380, background: theme.bgInside, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--red)', letterSpacing: '0.6px' }}>🔴 LIVE FEED</span>
                  <span 
                    className={timerCount < 8 ? 'timer-pulse-low' : ''}
                    style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      color: timerCount < 8 ? 'var(--red)' : 'var(--accent)', 
                      transition: 'all 0.25s ease-out',
                      display: 'inline-block'
                    }}
                  >
                    {timerCount}s left
                  </span>
                </div>

                {/* Progress countdown bar */}
                <div style={{ height: 4, background: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(timerCount / 25) * 100}%`, background: timerCount < 8 ? 'var(--red)' : 'var(--accent)', transition: 'width 1s linear' }} />
                </div>

                <div 
                  className={animState === 'listening' ? 'avatar-border-listening' : animState === 'thinking' ? 'avatar-border-thinking' : animState === 'talking' ? 'avatar-border-talking' : 'avatar-border-idle'}
                  style={{ flex: 1, borderRadius: 12, overflow: 'hidden', background: '#0a0a0a', transition: 'all 0.3s ease' }}
                >
                  {roleplayScenario?.activeAvatar ? (
                    <VRoidInterviewAvatar 
                      teacherId={roleplayScenario.activeAvatar} 
                      animState={animState} 
                      zoom={1.45} 
                      visible={true} 
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: theme.tTertiary, fontSize: 13 }}>
                      Syncing 3D Node...
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: theme.tPrimary }}>
                    {roleplayScenario?.avatarName || "Scanning..."}
                  </span>
                  <span style={{ fontSize: 9.5, color: theme.tTertiary, fontFamily: 'var(--font-mono)' }}>
                    {roleplayScenario?.avatarRole || "Limbic Sensor Active"}
                  </span>
                </div>
              </div>

              {/* Situation Summary (Conclusion) Panel */}
              <div 
                className="summary-container-glow"
                style={{ 
                  background: theme.bgInside, 
                  border: `1px solid ${theme.border}`, 
                  borderRadius: 16, 
                  padding: 14, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8,
                  transition: 'all 0.3s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(255,255,255,0.06)`, paddingBottom: 6 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.6px' }}>📋 SITUATION SUMMARY</span>
                  <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: theme.tTertiary }}>
                    ⏳ {Math.floor(sessionElapsed / 60).toString().padStart(2, '0')}:{(sessionElapsed % 60).toString().padStart(2, '0')} elapsed
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: theme.tSecondary, fontSize: 10, display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Crisis Context</strong>
                    <span style={{ color: theme.tPrimary }}>{roleplayScenario?.scenarioTitle || "Synthesizing scenario parameters..."}</span>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 6 }}>
                    <strong style={{ color: theme.tSecondary, fontSize: 10, display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>Decisions Logged ({roleplayHistory.filter(h => h.role === 'user').length})</strong>
                    {roleplayHistory.filter(h => h.role === 'user').length === 0 ? (
                      <span style={{ color: theme.tTertiary, fontStyle: 'italic' }}>Awaiting candidate's first action response...</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 90, overflowY: 'auto' }}>
                        {roleplayHistory.filter(h => h.role === 'user').map((c, i) => (
                          <div key={i} style={{ display: 'flex', gap: 4, color: theme.tPrimary }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{i + 1}.</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220 }} title={c.content}>
                              {c.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dialogue Console */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
              
              {/* Chat Bubble Logs */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12, 
                maxHeight: 280, 
                paddingRight: 6,
                background: theme.bgInside,
                borderRadius: 16,
                padding: 14,
                border: `1px solid ${theme.border}`
              }}>
                {roleplayHistory.map((h, i) => {
                  const isUser = h.role === 'user';
                  let speakerName = 'Candidate';
                  let bubbleText = h.content;
                  
                  if (!isUser) {
                    const match = h.content.match(/^([^:]+):\s*(.*)$/);
                    if (match) {
                      speakerName = match[1].trim();
                      bubbleText = match[2].trim();
                      if (bubbleText.startsWith("'") && bubbleText.endsWith("'")) {
                        bubbleText = bubbleText.slice(1, -1);
                      } else if (bubbleText.startsWith('"') && bubbleText.endsWith('"')) {
                        bubbleText = bubbleText.slice(1, -1);
                      }
                    } else {
                      speakerName = roleplayScenario?.avatarName || 'System Mentor';
                    }
                  }

                  return (
                    <div 
                      key={i} 
                      style={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                      }}
                    >
                      <span style={{ 
                        fontSize: 9, 
                        fontWeight: 700, 
                        color: isUser ? 'var(--teal)' : 'var(--accent)', 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.5px'
                      }}>
                        {isUser ? '👤 You' : `🎙️ ${speakerName}`}
                      </span>
                      <div 
                        style={{ 
                          background: isUser ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isUser ? 'rgba(20,184,166,0.18)' : theme.border}`,
                          padding: '10px 14px',
                          borderRadius: '16px',
                          borderTopRightRadius: isUser ? '4px' : '16px',
                          borderTopLeftRadius: isUser ? '16px' : '4px',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: theme.tPrimary }}>
                          {bubbleText}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {roleplayLoading && (
                  <div style={{ color: theme.tTertiary, fontSize: 12, fontStyle: 'italic' }}>
                    ✏️ Synthesizing dynamic branch parameters...
                  </div>
                )}
              </div>

              {/* Interactive Choices Panel */}
              <div>
                {evaluationLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }} className="animate-spin">🔄</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Compiling Socratic Evolution Report...</span>
                    <p style={{ fontSize: 11, color: theme.tTertiary, marginTop: 4 }}>Analyzing natural blindness metrics and System 1/2 triggers against strategic literatures.</p>
                  </div>
                ) : evaluationReport ? (
                  /* Socratic report display box */
                  <div style={{ 
                    background: 'rgba(20,184,166,0.03)', 
                    border: `1.5px solid rgba(20,184,166,0.18)`, 
                    borderRadius: 16, 
                    padding: 16,
                    maxHeight: 280,
                    overflowY: 'auto'
                  }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: 'var(--teal)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🧠 Socratic Evolution Report</span>
                      <span>Score: {qt2Delta > 0 ? `+${qt2Delta}` : qt2Delta} points</span>
                    </h3>
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: theme.tSecondary }} className="socratic-report-content">
                      {evaluationReport.split('\n').map((line, idx) => (
                        <p key={idx} style={{ margin: '0 0 8px' }}>{line}</p>
                      ))}
                    </div>
                    <button 
                      onClick={() => { updateRoleplayActive(false); setEvaluationReport(''); stopSpeaking(); }}
                      className="btn-primary btn-sm"
                      style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
                    >
                      Return to Command Center
                    </button>
                  </div>
                ) : (
                  roleplayScenario && roleplayScenario.choices && roleplayScenario.choices.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: theme.tTertiary, fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
                        Select Tactical Response (System 2 check):
                      </span>
                      {roleplayScenario.choices.map((c, idx) => (
                        <button
                          key={idx}
                          disabled={selectedChoiceIdx !== null}
                          onClick={() => handleSelectChoice(idx)}
                          style={{
                            background: selectedChoiceIdx === idx ? 'rgba(20,184,166,0.08)' : theme.bgInside,
                            border: `1px solid ${selectedChoiceIdx === idx ? 'var(--teal)' : theme.border}`,
                            borderRadius: 12,
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: 12,
                            cursor: 'pointer',
                            color: theme.tPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            opacity: selectedChoiceIdx !== null && selectedChoiceIdx !== idx ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          className="choice-card"
                        >
                          <span style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            background: theme.bgCard, 
                            border: `1.5px solid ${selectedChoiceIdx === idx ? 'var(--teal)' : theme.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 800,
                            color: selectedChoiceIdx === idx ? 'var(--teal)' : theme.tSecondary
                          }}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span style={{ flex: 1 }}>{c.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1140,
      margin: '0 auto',
      background: theme.bg,
      color: theme.tPrimary,
      padding: '20px',
      borderRadius: '24px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: theme.tPrimary }}>Daily Missions</h1>
          <p style={{ color: theme.tSecondary, fontSize: 13 }}>Adaptive challenges dynamically generated by AI to close gaps between Current & Future Self.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const doc = document.documentElement;
                const isDark = doc.getAttribute('data-theme') === 'dark';
                doc.setAttribute('data-theme', isDark ? 'light' : 'dark');
                window.dispatchEvent(new Event('theme-change'));
              }
            }}
            style={{
              background: theme.bgInside,
              border: `1.5px solid ${theme.border}`,
              color: theme.tPrimary,
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            🌗 Toggle Theme
          </button>
        </div>

        {/* Streak & XP info card */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: '12px 18px',
            textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            minWidth: 90,
          }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>⭐</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px', marginTop: 2 }}>
              {xp.toLocaleString()}
            </div>
            <div style={{ fontSize: 9, color: theme.tTertiary, letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Total XP</div>
          </div>
          <div style={{
            background: streak > 0 ? 'var(--amber-light)' : theme.bgCard,
            border: `1px solid ${streak > 0 ? '#fde68a' : theme.border}`,
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
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 24, boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: theme.tPrimary }}>Today's Progress</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: theme.tSecondary, fontWeight: 600 }}>
                    {completed.length}/{allTodayMissions.length} Completed
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 8, background: theme.bgInside, borderRadius: 4, overflow: 'hidden' }}>
                  <div className="progress-fill" style={{ width: `${todayPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tabs Split System (Evolve Yourself vs Learn a Language vs Conclusion History) */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, paddingBottom: 12 }}>
            <button
              onClick={() => { setActiveTab('evolve'); stopSpeaking(); setRoleplayActive(false); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: activeTab === 'evolve' ? 800 : 500,
                color: activeTab === 'evolve' ? 'var(--accent)' : theme.tTertiary,
                borderBottom: activeTab === 'evolve' ? '3px solid var(--accent)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              🧬 Evolve Yourself
            </button>
            <button
              onClick={() => { setActiveTab('language'); stopSpeaking(); setRoleplayActive(false); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: activeTab === 'language' ? 800 : 500,
                color: activeTab === 'language' ? 'var(--accent)' : theme.tTertiary,
                borderBottom: activeTab === 'language' ? '3px solid var(--accent)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              🦜 Learn a Language (Lingua Lab)
            </button>
            <button
              onClick={() => { setActiveTab('history'); stopSpeaking(); setRoleplayActive(false); setSelectedHistoryRecord(null); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: activeTab === 'history' ? 800 : 500,
                color: activeTab === 'history' ? 'var(--accent)' : theme.tTertiary,
                borderBottom: activeTab === 'history' ? '3px solid var(--accent)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              📋 Conclusion History
            </button>
          </div>

          {activeTab === 'evolve' ? (
            /* Initiate Evolution Simulator Banner */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(20,184,166,0.04) 100%)',
                border: `1.5px dashed rgba(168,85,247,0.22)`,
                borderRadius: '24px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.06 }}>🧠</div>
                
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--purple)', fontFamily: 'var(--font-mono)', background: 'rgba(168,85,247,0.1)', padding: '4px 10px', borderRadius: 8, display: 'inline-block', marginBottom: 12 }}>
                  Mindset Persona Simulator
                </span>
                
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: theme.tPrimary, margin: '0 0 10px' }}>
                  Initiate Dynamic Socratic Roleplay
                </h2>
                <p style={{ color: theme.tSecondary, fontSize: 13, maxWidth: 580, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Enter real-life crisis simulations (outages, blame shifting, authority pressure, scope creep). Challenge your natural blindness and evolve System 2 critical thinking. Drawing dynamically from Jocko Willink, Robert Greene, Daniel Kahneman, and Cialdini.
                </p>

                <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, padding: '8px 16px', borderRadius: 12 }}>
                    <span style={{ fontSize: 10, color: theme.tTertiary, display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Mindset Archetype</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--purple)' }}>{onboardingAnswers?.mindset_archetype || 'Pattern Hunter'}</span>
                  </div>
                  <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, padding: '8px 16px', borderRadius: 12 }}>
                    <span style={{ fontSize: 10, color: theme.tTertiary, display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>QT2 Mindset Index</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--teal)' }}>🧠 {onboardingAnswers?.qt2_score || 75} pts</span>
                  </div>
                </div>

                 <button
                  onClick={initiateRoleplay}
                  disabled={roleplayLoading}
                  className="btn-primary"
                  style={{ 
                    padding: '12px 28px', 
                    fontSize: 13.5, 
                    borderRadius: 14, 
                    margin: '0 auto', 
                    boxShadow: '0 4px 14px rgba(168,85,247,0.3)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!roleplayLoading) {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(168,85,247,0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(168,85,247,0.3)';
                  }}
                >
                  {roleplayLoading ? '⚡ Compiling Parameters...' : '⚡ Launch Simulator Session (5 Pins)'}
                </button>

                <div style={{ marginTop: 18 }}>
                  <button 
                    onClick={() => setShowTraditionalMissions(!showTraditionalMissions)}
                    style={{ background: 'none', border: 'none', color: theme.tTertiary, fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showTraditionalMissions ? "Hide traditional missions checklist" : "Show traditional daily checkoff list"}
                  </button>
                </div>
              </div>

              {/* Optional Traditional Missions list */}
              {showTraditionalMissions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">
                  {/* Tabs */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 6, background: theme.bgInside, padding: 4, borderRadius: 12, border: `1px solid ${theme.border}`, width: 'fit-content' }}>
                      <button onClick={() => setTab('today')} style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: tab === 'today' ? theme.bgCard : 'transparent',
                        color: tab === 'today' ? theme.tPrimary : theme.tTertiary,
                        boxShadow: tab === 'today' ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.12s'
                      }}>📅 Today's Gaps</button>
                      <button onClick={() => setTab('history')} style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: tab === 'history' ? theme.bgCard : 'transparent',
                        color: tab === 'history' ? theme.tPrimary : theme.tTertiary,
                        boxShadow: tab === 'history' ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.12s'
                      }}>📋 History</button>
                    </div>
                    {tab === 'today' && (
                      <button onClick={handleTriggerRegenerate} className="btn-ghost btn-sm" disabled={generating} style={{ fontSize: 11, color: theme.tSecondary }}>
                        {generating ? '⟳ Re-generating...' : '⟳ Regenerate'}
                      </button>
                    )}
                  </div>

                  {/* Today Tab */}
                  {tab === 'today' && (
                    pending.length === 0 ? (
                      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
                        <div className="empty-state" style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: theme.tPrimary, marginBottom: 4 }}>All Gaps Successfully Addressed!</div>
                          <div style={{ fontSize: 12.5, color: theme.tTertiary, marginBottom: 16 }}>Your daily roadmap is fully clear. Great work! Come back tomorrow or match new benchmarks.</div>
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
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {pending.map(m => (
                            <div key={m.id} style={{ position: 'relative' }}>
                              <MissionCard mission={m} onComplete={() => completeMission(m.id)} />
                              {m.target_gap && (
                                <div style={{ 
                                  position: 'absolute', 
                                  bottom: 12, 
                                  right: 140, 
                                  fontSize: 10, 
                                  fontFamily: 'var(--font-mono)', 
                                  background: theme.bgInside, 
                                  border: `1px solid ${theme.border}`, 
                                  padding: '2px 8px', 
                                  borderRadius: 6,
                                  color: theme.tSecondary
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
                      <div className="empty-state" style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16 }}>
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No completed history yet</div>
                        <div className="empty-desc">Completed missions appear here. Complete a mission today to build history!</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.tTertiary, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                          ✓ SECURE PROTOCOL VERIFIED COMPLETIONS
                        </div>
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
              )}
            </div>
          ) : activeTab === 'language' ? (
            <LinguaLab streak={streak} theme={theme} />
          ) : (
            /* Conclusion History Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {selectedHistoryRecord ? (
                /* Selected Conclusion Report Detail View */
                <div style={{
                  background: theme.bgCard,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-lg)'
                }} className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: 12, marginBottom: 16 }}>
                    <button 
                      onClick={() => setSelectedHistoryRecord(null)}
                      style={{ background: theme.bgInside, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: theme.tSecondary }}
                    >
                      ← Back to History
                    </button>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: theme.tTertiary }}>
                      Completed on {selectedHistoryRecord.date}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(168,85,247,0.1)', color: 'var(--purple)' }}>
                      Archetype: {selectedHistoryRecord.mindsetArchetype}
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: selectedHistoryRecord.qt2Delta >= 0 ? 'rgba(20,184,166,0.1)' : 'rgba(239,68,68,0.1)', color: selectedHistoryRecord.qt2Delta >= 0 ? 'var(--teal)' : 'var(--red)' }}>
                      QT2 Score Change: {selectedHistoryRecord.qt2Delta >= 0 ? `+${selectedHistoryRecord.qt2Delta}` : selectedHistoryRecord.qt2Delta}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.tPrimary, margin: '0 0 12px' }}>
                    {selectedHistoryRecord.title}
                  </h2>

                  <div style={{ 
                    background: 'rgba(255,255,255,0.01)', 
                    border: `1px solid ${theme.border}`, 
                    borderRadius: 16, 
                    padding: 16, 
                    fontSize: 13, 
                    lineHeight: 1.6, 
                    color: theme.tSecondary,
                    maxHeight: 480,
                    overflowY: 'auto'
                  }}>
                    {selectedHistoryRecord.report ? (
                      selectedHistoryRecord.report.split('\n').map((line: string, idx: number) => {
                        if (line.startsWith('### ')) {
                          return <h4 key={idx} style={{ margin: '14px 0 6px', color: theme.tPrimary, fontWeight: 800 }}>{line.replace('### ', '')}</h4>;
                        }
                        if (line.startsWith('## ')) {
                          return <h3 key={idx} style={{ margin: '18px 0 8px', color: theme.tPrimary, fontWeight: 800 }}>{line.replace('## ', '')}</h3>;
                        }
                        if (line.startsWith('* ')) {
                          return <li key={idx} style={{ marginLeft: 16, marginBottom: 4 }}>{line.replace('* ', '')}</li>;
                        }
                        return <p key={idx} style={{ margin: '0 0 10px' }}>{line}</p>;
                      })
                    ) : (
                      <p style={{ fontStyle: 'italic' }}>No report content generated.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* History List Grid View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.tPrimary, margin: 0 }}>
                      Socratic Evolution History
                    </h3>
                    <span style={{ fontSize: 12, color: theme.tTertiary }}>
                      Review past dynamic outage roleplays, identified natural blindness traps, and mindset evolution conclusions.
                    </span>
                  </div>

                  {socraticHistory.length === 0 ? (
                    <div style={{
                      background: theme.bgCard,
                      border: `1.5px dashed ${theme.border}`,
                      borderRadius: '24px',
                      padding: '40px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: theme.tPrimary, margin: '0 0 6px' }}>No simulation history found</h4>
                      <p style={{ fontSize: 12.5, color: theme.tTertiary, maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.5 }}>
                        Complete your first active Mindset Persona Simulator session to compile your Socratic profile.
                      </p>
                      <button onClick={() => setActiveTab('evolve')} className="btn-primary btn-sm">
                        Start Simulation
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      {socraticHistory.map((item) => (
                        <div 
                          key={item.id}
                          style={{
                            background: theme.bgCard,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            transition: 'transform 0.15s, border-color 0.15s',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedHistoryRecord(item)}
                          className="choice-card"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 11, color: theme.tTertiary, fontFamily: 'var(--font-mono)' }}>
                                {item.date}
                              </span>
                              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: theme.tPrimary, margin: 0 }}>
                                {item.title}
                              </h4>
                            </div>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 6, 
                              fontSize: 10, 
                              fontWeight: 700, 
                              background: item.qt2Delta >= 0 ? 'rgba(20,184,166,0.1)' : 'rgba(239,68,68,0.1)', 
                              color: item.qt2Delta >= 0 ? 'var(--teal)' : 'var(--red)' 
                            }}>
                              QT2: {item.qt2Delta >= 0 ? `+${item.qt2Delta}` : item.qt2Delta}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                            <span style={{ fontSize: 11, color: theme.tSecondary }}>
                              👤 Mentor: <strong style={{ color: theme.tPrimary }}>{item.avatarName}</strong>
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              View Socratic Report →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Mission Insights sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Mission Insights panel */}
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: theme.tTertiary, fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 14 }}>
              📊 Mission Insights
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Daily XP Target */}
              <div>
                <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: theme.tSecondary, marginBottom: 6, justifyContent: 'space-between' }}>
                  <span>Daily XP Goal</span>
                  <span style={{ color: 'var(--teal)' }}>{completed.length * 25} / 100 XP</span>
                </div>
                <div style={{ height: 6, background: theme.bgInside, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (completed.length * 25))}%`, background: 'var(--teal)', borderRadius: 3 }} />
                </div>
              </div>

              {/* Gap Closure progress */}
              <div>
                <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: theme.tSecondary, marginBottom: 6, justifyContent: 'space-between' }}>
                  <span>Target Gap Closure</span>
                  <span style={{ color: 'var(--accent)' }}>{gapClosurePct}%</span>
                </div>
                <div style={{ height: 6, background: theme.bgInside, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gapClosurePct}%`, background: 'var(--accent)', borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 11, color: theme.tTertiary, lineHeight: 1.4, marginTop: 6, marginBlockEnd: 0 }}>
                  Each completed mission satisfies verified skills requirements mapping to your Digital Twin.
                </p>
              </div>

              {/* Target Alignment Card */}
              <div style={{ background: theme.bgInside, padding: 14, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.tTertiary, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  Target Alignment Path
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.tPrimary }}>
                  {onboardingAnswers?.role || 'Not Configured'}
                </div>
                {!onboardingAnswers?.hasCompleted && (
                  <Link href="/career-twin" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'block', marginTop: 6, fontWeight: 600 }}>
                    Configure Twin Roadmap ➔
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Custom Skill Trainer */}
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: theme.tTertiary, fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 14 }}>
              ⚡ Custom Skill Trainer
            </span>
            <p style={{ fontSize: 11.5, color: theme.tSecondary, lineHeight: 1.5, margin: '0 0 14px' }}>
              Want to train a specific skill? Generate custom socratic learning modules to fill the gaps for your career path.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.tSecondary, display: 'block', marginBottom: 4 }}>Skill to Train</label>
                <input
                  type="text"
                  placeholder="e.g. React, Docker, CI/CD, Python"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: theme.bgInside, border: `1px solid ${theme.border}`,
                    color: theme.tPrimary, fontSize: 12.5, outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.tSecondary, display: 'block', marginBottom: 4 }}>Target Career Role</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Engineer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: theme.bgInside, border: `1px solid ${theme.border}`,
                    color: theme.tPrimary, fontSize: 12.5, outline: 'none'
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
          <div style={{ background: theme.bgInside, border: `1px dashed ${theme.border}`, borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{teacher.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.tPrimary }}>{teacher.name}'s Tip</span>
            </div>
            <p style={{ fontSize: 11.5, color: theme.tSecondary, lineHeight: 1.5, margin: 0 }}>
              "Completing missions directly feeds your Consistency Index and raises your Reputation Level. Verified uploads to Vault automatically clear relevant pending missions."
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
