'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/store/useAppStore';
import { useAuth } from '@/lib/context/AuthContext';
import { api } from '@/lib/api/client';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultItem {
  id: string;
  title: string;
  item_type: string;
  organization_name?: string;
  description?: string;
  verified: boolean;
  ai_confidence_score: number;
  skill_tags: string[];
  is_public: boolean;
  used_in_resume?: boolean;
  used_in_portfolio?: boolean;
}

export interface OnboardingAnswers {
  role: string;
  education: string;
  skills: string;
  experience: string;
  hasCompleted: boolean;
}

export interface PinTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  source: PinSource;
  timestamp: number;
}

export type PinSource =
  | 'mission_complete'
  | 'exam_pass'
  | 'interview_session'
  | 'study_session'
  | 'onboarding_complete'
  | 'vault_verify'
  | 'daily_login'
  | 'streak_bonus'
  | 'purchase'
  | 'ai_interview'
  | 'resume_enhance'
  | 'career_twin'
  | 'personality_analysis'
  | 'sentinel_fingerprint'
  | 'career_assets'
  | 'career_dna_calc'
  | 'admin_grant';

// Pin costs per feature — single source of truth
export const PIN_COSTS: Record<string, { cost: number; label: string; icon: string }> = {
  quest_start:           { cost: 5,  label: 'Quest Attempt',            icon: '🗺' },
  ai_interview:          { cost: 20, label: 'AI Interview Round',       icon: '🎙' },
  resume_enhance:        { cost: 15, label: 'Resume AI Enhancement',    icon: '📄' },
  career_twin:           { cost: 30, label: 'Career Twin Simulation',   icon: '✦' },
  personality_analysis:  { cost: 10, label: 'Personality AI Analysis',  icon: '🧠' },
  sentinel_fingerprint:  { cost: 5,  label: 'Sentinel Fingerprint',     icon: '🔐' },
  career_assets:         { cost: 20, label: 'Career Assets Generation', icon: '💼' },
  career_dna_calc:       { cost: 10, label: 'Career DNA Recalculate',   icon: '🧬' },
  jd_match:              { cost: 5,  label: 'JD Match Analysis',        icon: '🎯' },
};

// Pin earn rates
export const PIN_EARN: Record<PinSource, number> = {
  mission_complete:     10,
  exam_pass:            25,
  interview_session:    15,
  study_session:        5,
  onboarding_complete:  50,
  vault_verify:         20,
  daily_login:          3,
  streak_bonus:         15,
  purchase:             0,   // variable — set per purchase
  ai_interview:         0,
  resume_enhance:       0,
  career_twin:          0,
  personality_analysis: 0,
  sentinel_fingerprint: 0,
  career_assets:        0,
  career_dna_calc:      0,
  admin_grant:          0,
};

// ─── Context Interface ────────────────────────────────────────────────────────

interface CareerOSContextType {
  // Vault
  vaultItems: VaultItem[];
  addVaultItem: (item: { title: string; item_type: string; organization_name?: string; description?: string; skill_tags?: string[] }) => void;
  updateVaultItem: (id: string, updates: Partial<VaultItem>) => void;
  // Onboarding
  onboardingAnswers: OnboardingAnswers;
  setOnboarding: (answers: Omit<OnboardingAnswers, 'hasCompleted'>) => void;
  // Missions
  completedMissions: string[];
  completeMission: (missionId: string) => void;
  // JD Skills
  jdMissingSkills: string[];
  setJdMissingSkills: (skills: string[]) => void;
  // XP (legacy, kept for backward compat)
  xp: number;
  addXp: (amount: number, reason: string) => void;
  // Streak
  missionStreak: number;
  // Theme & Focus
  theme: 'light' | 'dark';
  focusMode: boolean;
  toggleTheme: () => void;
  toggleFocusMode: () => void;
  // Derived scores
  careerScore: number;
  dnaScore: number;
  trustScore: number;

  // ─── CREDIT SYSTEM ───────────────────────────────────────────────────────
  pins: number;
  pinHistory: PinTransaction[];
  earnPins: (source: PinSource, overrideAmount?: number, reason?: string) => void;
  spendPins: (featureKey: string, customReason?: string) => boolean; // returns false if insufficient
  canAfford: (featureKey: string) => boolean;
  addPurchasedPins: (amount: number, packName: string) => void;

  // ─── PROGRESSION SYSTEM ──────────────────────────────────────────────────
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  resumeGenerated: boolean;
  setResumeGenerated: (val: boolean) => void;
  roadmapGenerated: boolean;
  setRoadmapGenerated: (val: boolean) => void;
  generateFusedRoadmap: (skillTags: string[], weakAreas: string[]) => Promise<any[] | null>;
  completedQuests: string[];
  addCompletedQuest: (questId: string) => void;
  javaTestPassed: boolean;
  setJavaTestPassed: (val: boolean) => void;
  recruiterVisible: boolean;
  setRecruiterVisible: (val: boolean) => void;
  unlockedTabs: string[];
  forceShowCareerBuilder: boolean;
  setForceShowCareerBuilder: (val: boolean) => void;
  demoTabsUnlocked: boolean;
  setDemoTabsUnlocked: (val: boolean) => void;
}

const CareerOSContext = createContext<CareerOSContextType | null>(null);

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_VAULT_ITEMS: VaultItem[] = []; // Empty vault by default for new redone setup

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CareerOSProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers>({ role: '', education: '', skills: '', experience: '', hasCompleted: false });
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [jdMissingSkills, setJdMissingSkillsState] = useState<string[]>([]);
  const [xp, setXp] = useState(120);
  const [missionStreak, setMissionStreak] = useState(0); // Start streak at 0
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [focusMode, setFocusMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Progression State ──
  const [onboardingStep, setOnboardingStepState] = useState(0);
  const [resumeGenerated, setResumeGeneratedState] = useState(false);
  const [roadmapGenerated, setRoadmapGeneratedState] = useState(false);
  const [completedQuests, setCompletedQuestsState] = useState<string[]>([]);
  const [javaTestPassed, setJavaTestPassedState] = useState(false);
  const [recruiterVisible, setRecruiterVisibleState] = useState(false);
  const [unlockedTabs, setUnlockedTabs] = useState<string[]>(['/dashboard', '/resume', '/career-builder', '/quests']);
  const [forceShowCareerBuilder, setForceShowCareerBuilderState] = useState(false);
  const [demoTabsUnlocked, setDemoTabsUnlockedState] = useState(false);

  // ── Pin state ──────────────────────────────────────────────────────────
  const [pins, setPins] = useState(100);
  const [pinHistory, setPinsHistory] = useState<PinTransaction[]>([]);

  // localStorage key factory
  const keys = {
    vault:     `pinit_${userId}_vault_items`,
    onboard:   `pinit_${userId}_onboarding_answers`,
    missions:  `pinit_${userId}_completed_missions`,
    gaps:      `pinit_${userId}_jd_missing_skills`,
    xp:        `pinit_${userId}_xp`,
    streak:    `pinit_${userId}_streak`,
    theme:     `pinit_${userId}_theme`,
    pins:      `pinit_${userId}_pins`,
    pinHist:   `pinit_${userId}_pin_history`,
    // progression
    obStep:    `pinit_${userId}_ob_step`,
    resGen:    `pinit_${userId}_res_gen`,
    roadGen:   `pinit_${userId}_road_gen`,
    quests:    `pinit_${userId}_completed_quests`,
    javaPass:  `pinit_${userId}_java_pass`,
    recVis:    `pinit_${userId}_rec_vis`,
    forceShowCareer: `pinit_${userId}_force_show_career`,
    demoTabsUnlocked: `pinit_${userId}_demo_tabs_unlocked`
  };

  const save = useCallback((key: string, data: unknown) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    }
  }, []);

  // ── Load all state from localStorage on mount ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const get = (k: string) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };

      setVaultItems(get(keys.vault) ?? DEFAULT_VAULT_ITEMS);
      setOnboardingAnswers(get(keys.onboard) ?? { role:'', education:'', skills:'', experience:'', hasCompleted:false });
      setCompletedMissions(get(keys.missions) ?? []);
      setJdMissingSkillsState(get(keys.gaps) ?? []);
      setXp(get(keys.xp) ?? 120);
      setMissionStreak(get(keys.streak) ?? 0);
      setTheme(get(keys.theme) ?? 'light');
      setPins(get(keys.pins) ?? 100);
      setPinsHistory(get(keys.pinHist) ?? []);
      
      // progression loaders
      setOnboardingStepState(get(keys.obStep) ?? 0);
      setResumeGeneratedState(get(keys.resGen) ?? false);
      setRoadmapGeneratedState(get(keys.roadGen) ?? false);
      setCompletedQuestsState(get(keys.quests) ?? []);
      setJavaTestPassedState(get(keys.javaPass) ?? false);
      setRecruiterVisibleState(get(keys.recVis) ?? false);
      setForceShowCareerBuilderState(get(keys.forceShowCareer) ?? false);
      setDemoTabsUnlockedState(get(keys.demoTabsUnlocked) ?? false);
    } catch {}
    finally { setIsLoaded(true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sync with Firestore profile overrides
  useEffect(() => {
    if (user && typeof user.pins === 'number') {
      const pinsVal = user.pins as number;
      setPins(prev => {
        if (prev !== pinsVal) {
          save(keys.pins, pinsVal);
          return pinsVal;
        }
        return prev;
      });
    }
  }, [user?.pins, keys.pins, save]);


  // ── Theme sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    save(keys.theme, theme);
  }, [theme, keys.theme, save]);

  // ─── Pin helpers ───────────────────────────────────────────────────────

  const pushTransaction = useCallback((tx: PinTransaction, newHistory: PinTransaction[]) => {
    const trimmed = newHistory.slice(0, 100); // keep last 100
    setPinsHistory(trimmed);
    save(keys.pinHist, trimmed);
  }, [keys.pinHist, save]);

  const earnPins = useCallback((source: PinSource, overrideAmount?: number, reason?: string) => {
    const amount = overrideAmount ?? PIN_EARN[source] ?? 0;
    if (amount <= 0) return;
    
    // Update Firestore in background
    api.post('/api/pins/earn', { source, amount }).catch(() => {});

    setPins(prev => {
      const next = prev + amount;
      save(keys.pins, next);
      return next;
    });
    const tx: PinTransaction = { id: `tx_${Date.now()}`, type: 'earn', amount, reason: reason ?? source.replace(/_/g, ' '), source, timestamp: Date.now() };
    setPinsHistory(prev => {
      const updated = [tx, ...prev].slice(0, 100);
      save(keys.pinHist, updated);
      return updated;
    });
    toast.success(`+${amount} Pins Earned ⚡`, reason ?? source.replace(/_/g, ' '));
  }, [keys.pins, keys.pinHist, save]);

  const canAfford = useCallback((featureKey: string): boolean => {
    const cost = PIN_COSTS[featureKey]?.cost ?? 0;
    return pins >= cost;
  }, [pins]);

  const spendPins = useCallback((featureKey: string, customReason?: string): boolean => {
    const meta = PIN_COSTS[featureKey];
    if (!meta) return true; // no cost defined = free
    if (pins < meta.cost) {
      toast.error(`Insufficient Pins 📌`, `Need ${meta.cost} pins for ${meta.label}. Earn more by completing missions, exams, or sessions.`);
      return false;
    }

    // Update Firestore in background
    api.post('/api/pins/spend', { featureKey, cost: meta.cost }).catch(() => {});

    setPins(prev => {
      const next = prev - meta.cost;
      save(keys.pins, next);
      return next;
    });
    const tx: PinTransaction = { id: `tx_${Date.now()}`, type: 'spend', amount: meta.cost, reason: customReason ?? meta.label, source: featureKey as PinSource, timestamp: Date.now() };
    setPinsHistory(prev => {
      const updated = [tx, ...prev].slice(0, 100);
      save(keys.pinHist, updated);
      return updated;
    });
    return true;
  }, [pins, keys.pins, keys.pinHist, save]);

  const addPurchasedPins = useCallback((amount: number, packName: string) => {
    // Update Firestore in background
    api.post('/api/pins/purchase', { amount, packName }).catch(() => {});

    setPins(prev => {
      const next = prev + amount;
      save(keys.pins, next);
      return next;
    });
    const tx: PinTransaction = { id: `tx_${Date.now()}`, type: 'earn', amount, reason: `Purchased: ${packName}`, source: 'purchase', timestamp: Date.now() };
    setPinsHistory(prev => {
      const updated = [tx, ...prev].slice(0, 100);
      save(keys.pinHist, updated);
      return updated;
    });
    toast.success(`⚡ ${amount} Pins Added!`, `${packName} pack activated successfully.`);
  }, [keys.pins, keys.pinHist, save]);

  // ─── Daily Pins Grant Scheduler ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || userId === 'guest') return;
    const lastGrantKey = `pinit_${userId}_last_daily_pins_grant`;
    const lastGrantStr = localStorage.getItem(lastGrantKey);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!lastGrantStr || now - parseInt(lastGrantStr) >= oneDay) {
      // Determine daily grant based on role
      const isPro = user?.role === 'admin' || user?.role === 'recruiter';
      const dailyAmount = isPro ? 50 : 25; // 25 pins is exactly what is required for 5 quests (5 pins each)
      
      setPins(prev => {
        const next = prev + dailyAmount;
        localStorage.setItem(keys.pins, JSON.stringify(next));
        return next;
      });
      localStorage.setItem(lastGrantKey, now.toString());
      
      // Update Firestore in background
      api.post('/api/pins/earn', { source: 'daily_login', amount: dailyAmount }).catch(() => {});

      // Log transaction
      const tx: PinTransaction = {
        id: `tx_daily_${now}`,
        type: 'earn',
        amount: dailyAmount,
        reason: `Daily login grant (${isPro ? 'Pro' : 'Standard'} Tier)`,
        source: 'daily_login',
        timestamp: now
      };
      setPinsHistory(prev => {
        const updated = [tx, ...prev].slice(0, 100);
        localStorage.setItem(keys.pinHist, JSON.stringify(updated));
        return updated;
      });
      toast.success(`⚡ Daily Pins Issued!`, `+${dailyAmount} Pins added for your daily login.`);
    }
  }, [isLoaded, userId, user?.role, keys.pins, keys.pinHist]);

  // ─── Progression Setters ───────────────────────────────────────────────────
  const setOnboardingStep = useCallback((step: number) => {
    setOnboardingStepState(step);
    save(keys.obStep, step);
  }, [keys.obStep, save]);

  const setResumeGenerated = useCallback((val: boolean) => {
    setResumeGeneratedState(val);
    save(keys.resGen, val);
    if (val && onboardingStep < 3) {
      setOnboardingStep(3); // advance step
    }
  }, [keys.resGen, onboardingStep, setOnboardingStep, save]);

  const setRoadmapGenerated = useCallback((val: boolean) => {
    setRoadmapGeneratedState(val);
    save(keys.roadGen, val);
    if (val && onboardingStep < 4) {
      setOnboardingStep(4); // advance step
    }
  }, [keys.roadGen, onboardingStep, setOnboardingStep, save]);

  const generateFusedRoadmap = useCallback(async (skillTags: string[], weakAreas: string[]) => {
    const targetRole = onboardingAnswers.role || 'Software Developer Engineer (SDE)';
    const experienceLevel = onboardingAnswers.experience || 'beginner';
    const modulesKey = `pinit_${userId}_roadmap_modules`;

    try {
      const res = await api.post<{ ok: boolean; modules: any[] }>('/api/career-builder/generate', {
        targetRole,
        skillTags,
        weakAreas,
        experienceLevel
      });

      if (res && res.ok && Array.isArray(res.modules) && res.modules.length > 0) {
        const normalized = res.modules.map((m: any) => ({
          ...m,
          quests: (m.quests || []).map((q: any) => {
            let category = q.category;
            if (!category) {
              if (q.requiresAvatar || q.type === 'lecture' || q.type === 'interactive') {
                category = 'learning';
              } else if (q.id === 'fizzbuzz' || q.id?.includes('exam') || q.title?.toLowerCase().includes('exam') || q.title?.toLowerCase().includes('test')) {
                category = 'exam';
              } else {
                category = 'assignment';
              }
            }
            return { ...q, category };
          })
        }));

        save(modulesKey, normalized);
        setRoadmapGeneratedState(true);
        save(keys.roadGen, true);
        if (onboardingStep < 4) {
          setOnboardingStep(4);
        }
        toast.success('Quest Roadmap Active! 🗺️', 'Fused onboarding preferences and resume skills to create customized quests.');
        return normalized;
      }
    } catch (err) {
      console.error('Failed to generate dynamic AI roadmap:', err);
    }
    return null;
  }, [userId, onboardingAnswers, keys.roadGen, onboardingStep, setOnboardingStep, save]);

  const addCompletedQuest = useCallback((questId: string) => {
    setCompletedQuestsState(prev => {
      if (prev.includes(questId)) return prev;
      const next = [...prev, questId];
      save(keys.quests, next);
      setTimeout(() => {
        addXp(30, 'Completed Coding Quest');
        earnPins('mission_complete');
        if (onboardingStep < 5) {
          setOnboardingStep(5); // unlock AI Interviews
        }
      }, 100);
      return next;
    });
  }, [keys.quests, onboardingStep, setOnboardingStep, earnPins, save]);

  const setJavaTestPassed = useCallback((val: boolean) => {
    setJavaTestPassedState(val);
    save(keys.javaPass, val);
    if (val && onboardingStep < 6) {
      setOnboardingStep(6);
    }
  }, [keys.javaPass, onboardingStep, setOnboardingStep, save]);

  const setRecruiterVisible = useCallback((val: boolean) => {
    setRecruiterVisibleState(val);
    save(keys.recVis, val);
  }, [keys.recVis, save]);

  const setForceShowCareerBuilder = useCallback((val: boolean) => {
    setForceShowCareerBuilderState(val);
    save(keys.forceShowCareer, val);
  }, [keys.forceShowCareer, save]);

  const setDemoTabsUnlocked = useCallback((val: boolean) => {
    setDemoTabsUnlockedState(val);
    save(keys.demoTabsUnlocked, val);
  }, [keys.demoTabsUnlocked, save]);

  // Derive unlocked tabs dynamically
  const ALL_TABS = ['/dashboard', '/vault', '/quests', '/missions', '/career-twin', '/career-dna', '/opportunities'];
  const activeTabs = demoTabsUnlocked ? ALL_TABS : ['/dashboard', '/vault', '/quests', '/missions'];
  if (!demoTabsUnlocked) {
    if (onboardingStep >= 5 || completedQuests.length > 0) {
      activeTabs.push('/career-twin');
    }
    if (onboardingStep >= 6 || javaTestPassed) {
      activeTabs.push('/career-dna');
      activeTabs.push('/opportunities');
    }
  }

  // ─── Existing feature actions (now also earn pins) ─────────────────────

  const toggleTheme = () => setTheme(p => { const n = p === 'light' ? 'dark' : 'light'; toast.info('Theme Switched', `${n === 'light' ? 'Light ☀️' : 'Dark 🌙'} Mode`); return n; });
  const toggleFocusMode = () => setFocusMode(p => { const n = !p; toast[n ? 'success' : 'info'](n ? 'Focus Mode On 🤫' : 'Focus Mode Off', n ? 'Distractions hidden.' : 'Standard layout restored.'); return n; });

  const addVaultItem = async (item: { title: string; item_type: string; organization_name?: string; description?: string; skill_tags?: string[] }) => {
    const tempId = Math.random().toString(36).substr(2,9);
    const newItem: VaultItem = { 
      id: tempId, 
      ...item, 
      organization_name: item.organization_name || '', 
      description: item.description || '', 
      verified: false, 
      ai_confidence_score: 80 + Math.floor(Math.random() * 19), 
      skill_tags: item.skill_tags || [], 
      is_public: false, 
      used_in_resume: false, 
      used_in_portfolio: false 
    };
    
    const updated = [newItem, ...vaultItems];
    setVaultItems(updated); 
    save(keys.vault, updated);
    addXp(15, 'Added proof to Vault');
    toast.success('🔒 Added to Vault', `"${item.title}" saved securely.`);

    if (userId !== 'guest') {
      try {
        const { data, error } = await supabase
          .from('vault_items')
          .insert([{
            user_id: userId,
            title: item.title,
            item_type: item.item_type,
            organization_name: item.organization_name || '',
            description: item.description || 'Uploaded document.',
            verified: false,
            ai_confidence_score: newItem.ai_confidence_score,
            skill_tags: item.skill_tags || [],
            is_public: false
          }])
          .select();
        
        if (!error && data && data.length > 0) {
          const dbItem = data[0];
          setVaultItems(prev => prev.map(v => v.id === tempId ? { ...v, id: dbItem.id } : v));
          // Update local storage with the new DB ID as well
          save(keys.vault, updated.map(v => v.id === tempId ? { ...v, id: dbItem.id } : v));
        }
      } catch (e) {
        console.error('Failed to sync vault item to database:', e);
      }
    }
  };

  const updateVaultItem = (id: string, updates: Partial<VaultItem>) => {
    const updated = vaultItems.map(item => {
      if (item.id !== id) return item;
      const merged = { ...item, ...updates };
      if (updates.verified && !item.verified) {
        toast.success('✓ Proof Verified', `"${item.title}" is officially verified!`);
        setTimeout(() => { addXp(20, 'Proof Verified'); earnPins('vault_verify'); }, 100);
      }
      return merged;
    });
    setVaultItems(updated); save(keys.vault, updated);
  };

  const completeMission = (missionId: string) => {
    if (completedMissions.includes(missionId)) return;
    const updated = [...completedMissions, missionId];
    setCompletedMissions(updated); save(keys.missions, updated);
    const newStreak = missionStreak + 1;
    setMissionStreak(newStreak); save(keys.streak, newStreak);
    addXp(25, 'Mission Completed');
    earnPins('mission_complete');
    if (newStreak % 7 === 0) earnPins('streak_bonus', undefined, `${newStreak}-day streak bonus!`);
    toast.success('🔥 Mission Done!', `Streak: ${newStreak} days · +10 Pins earned`);
  };

  const setOnboarding = (answers: Omit<OnboardingAnswers, 'hasCompleted'>) => {
    const data = { ...answers, hasCompleted: true };
    setOnboardingAnswers(data); save(keys.onboard, data);
    addXp(50, 'Onboarding Complete');
    earnPins('onboarding_complete');
    toast.success('🧬 Career Profile Set', `Target role: ${answers.role}`);
  };

  const setJdMissingSkills = (skills: string[]) => { setJdMissingSkillsState(skills); save(keys.gaps, skills); };

  const addXp = (amount: number, reason: string) => {
    setXp(prev => { const next = prev + amount; save(keys.xp, next); return next; });
  };

  // ─── Derived scores ───────────────────────────────────────────────────────
  const careerScore = typeof user?.atsScore === 'number'
    ? user.atsScore
    : Math.min(98, 60 + (onboardingAnswers.hasCompleted ? 10 : 0) + (vaultItems.filter(v => v.verified).length * 5) + (completedMissions.length * 5));

  const dnaScore    = typeof user?.careerDnaScore === 'number'
    ? user.careerDnaScore
    : Math.min(95, 55 + (onboardingAnswers.hasCompleted ? 15 : 0) + (completedMissions.length * 10));

  const trustScore  = typeof user?.trustScore === 'number'
    ? user.trustScore
    : Math.min(99, 40 + (vaultItems.filter(v => v.verified).length * 15));

  return (
    <CareerOSContext.Provider value={{
      vaultItems, addVaultItem, updateVaultItem,
      onboardingAnswers, setOnboarding,
      completedMissions, completeMission,
      jdMissingSkills, setJdMissingSkills,
      xp, addXp,
      missionStreak,
      theme, focusMode, toggleTheme, toggleFocusMode,
      careerScore, dnaScore, trustScore,
      pins, pinHistory, earnPins, spendPins, canAfford, addPurchasedPins,
      // progression
      onboardingStep, setOnboardingStep,
      resumeGenerated, setResumeGenerated,
      roadmapGenerated, setRoadmapGenerated,
      generateFusedRoadmap,
      completedQuests, addCompletedQuest,
      javaTestPassed, setJavaTestPassed,
      recruiterVisible, setRecruiterVisible,
      unlockedTabs: activeTabs,
      forceShowCareerBuilder, setForceShowCareerBuilder,
      demoTabsUnlocked, setDemoTabsUnlocked
    }}>
      {children}
    </CareerOSContext.Provider>
  );
}

export function useCareerOS() {
  const ctx = useContext(CareerOSContext);
  if (!ctx) throw new Error('useCareerOS must be used within a CareerOSProvider');
  return ctx;
}
