'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
// Premium Career Command Center Dashboard
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const AuthContext_1 = require("@/lib/context/AuthContext");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const MissionCard_1 = __importDefault(require("@/components/ui/MissionCard"));
const ActivityFeed_1 = __importDefault(require("@/components/ui/ActivityFeed"));
const NextStepCard_1 = __importDefault(require("@/components/ui/NextStepCard"));
const WhatToDoToday_1 = __importDefault(require("@/components/ui/WhatToDoToday"));
const questsData_1 = require("@/lib/data/questsData");
const TIERS = [
    { label: 'Explorer', minDna: 0, color: '#6366f1', emoji: '🌱' },
    { label: 'Career Builder', minDna: 20, color: '#0ea5e9', emoji: '🔧' },
    { label: 'Interview Ready', minDna: 40, color: '#14b8a6', emoji: '🎯' },
    { label: 'Industry Ready', minDna: 60, color: '#a855f7', emoji: '⚡' },
    { label: 'Elite Candidate', minDna: 80, color: '#22c55e', emoji: '🏆' },
];
function computeLevel(xp, careerScore) {
    let idx = 0;
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (careerScore >= TIERS[i].minDna) {
            idx = i;
            break;
        }
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
function AnimatedNum({ value }) {
    const [display, setDisplay] = (0, react_1.useState)(0);
    const raf = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        const start = performance.now(), dur = 900;
        function tick(now) {
            const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
            setDisplay(value * e);
            if (t < 1)
                raf.current = requestAnimationFrame(tick);
        }
        raf.current = requestAnimationFrame(tick);
        return () => { if (raf.current)
            cancelAnimationFrame(raf.current); };
    }, [value]);
    return <>{Math.round(display)}</>;
}
function DashboardPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (user) {
            if (user.role === 'admin') {
                router.push('/admin');
            }
            else if (user.role === 'recruiter') {
                router.push('/recruiter');
            }
            else if (user.role === 'consultant') {
                router.push('/consultant');
            }
        }
    }, [user, router]);
    const cOS = (0, CareerOSContext_1.useCareerOS)();
    const teacherId = user?.selectedTeacherId || 'priya';
    const teacher = {
        priya: { name: 'Ms. Priya', emoji: '👩‍💼' },
        aisha: { name: 'Ms. Aisha', emoji: '👩‍🏫' },
        rohan: { name: 'Mr. Rohan', emoji: '👨‍💻' },
        vikram: { name: 'Mr. Vikram', emoji: '👨‍⚖️' },
    }[teacherId] || { name: 'Ms. Priya', emoji: '👩‍💼' };
    const { earnPins, pins } = cOS;
    const { vaultItems, onboardingAnswers, completedMissions, jdMissingSkills, careerScore, dnaScore, trustScore, xp, missionStreak, onboardingStep, roadmapGenerated, completedQuests, javaTestPassed } = cOS;
    const [allQuestsMap, setAllQuestsMap] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        if (typeof window !== 'undefined') {
            const map = {};
            questsData_1.QUESTS_REGISTRY.forEach(q => {
                map[q.id] = { title: q.title, category: q.type === 'coding' ? 'assignment' : 'learning' };
            });
            const modulesKey = `pinit_${user?.id || 'guest'}_roadmap_modules`;
            const saved = localStorage.getItem(modulesKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((m) => {
                            if (Array.isArray(m.quests)) {
                                m.quests.forEach((q) => {
                                    map[q.id] = { title: q.title, category: q.category };
                                });
                            }
                        });
                    }
                }
                catch { }
            }
            setAllQuestsMap(map);
        }
    }, [user?.id, completedQuests]);
    const [animIn, setAnimIn] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setAnimIn(true);
    }, []);
    const level = computeLevel(xp, careerScore);
    if (onboardingStep <= 1) {
        return (<div style={{ maxWidth: 1340, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }} className="animate-fade-in">
        <div style={{
                background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '60px 40px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                maxWidth: 600,
                margin: '0 auto',
                position: 'relative',
                overflow: 'hidden'
            }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: 48, marginBottom: 20 }}>👋</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.6px', marginBottom: 12 }}>
            Welcome to PinIT Career OS
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 24 }}>
            Your dashboard is currently empty. Head over to the <strong style={{ color: 'var(--accent)' }}>Resume Builder</strong> tab to sync your documents from the mobile vault and start building your career path!
          </p>
          <link_1.default href="/resume" className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto', padding: '12px 24px', fontSize: 14 }}>
            Go to Resume Builder ➔
          </link_1.default>
        </div>
      </div>);
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
    const pending = allMissions.filter(m => m.status === 'pending');
    // Load verified items from Vault context
    const vaultAchievements = vaultItems.map(item => {
        let icon = '⚡';
        let color = 'var(--teal)';
        if (item.item_type === 'certification') {
            icon = '🏆';
            color = 'var(--amber)';
        }
        else if (item.item_type === 'internship') {
            icon = '🏢';
            color = 'var(--blue)';
        }
        else if (item.item_type === 'hackathon') {
            icon = '🚀';
            color = 'var(--purple)';
        }
        return {
            title: item.title,
            org: item.organization_name || 'Verified Evidence',
            verified: item.verified,
            icon,
            color
        };
    });
    const completedQuestAchievements = (completedQuests || []).map(questId => {
        const qInfo = allQuestsMap[questId];
        const title = qInfo ? qInfo.title : `Quest: ${questId}`;
        const category = qInfo?.category || 'assignment';
        let icon = '💻';
        let color = 'var(--teal)';
        let org = 'Coding Assignment';
        if (category === 'learning') {
            icon = '🎓';
            color = 'rgba(167,139,250,1)';
            org = 'Socratic Lecture Class';
        }
        else if (category === 'exam') {
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
    // Calculate alignment score based on onboarding answers
    const alignmentPct = onboardingAnswers.hasCompleted ? 82 : 40;
    // Build AI Recommendations dynamically using jdMissingSkills from context!
    const recommendations = [];
    if (jdMissingSkills.length > 0) {
        // JD matcher had missing skills
        jdMissingSkills.slice(0, 2).forEach((skill, idx) => {
            recommendations.push({
                title: `Learn ${skill}`,
                desc: `Identified as a critical missing skill in your matched job openings. Closes -${15 + idx * 5}% alignment gap.`,
                label: 'Urgent Target',
                color: 'var(--coral)'
            });
        });
    }
    else {
        // Default fallback recommendations
        recommendations.push({
            title: 'Learn Python Basics',
            desc: 'Closes -25% of your target SDE internship benchmark gaps.',
            label: 'Recommended',
            color: 'var(--teal)'
        });
    }
    // Add generic actionable recommendations
    recommendations.push({
        title: 'Improve Resume ATS score',
        desc: 'Select more verified credentials from Vault inside Assets Studio to target ATS matching.',
        label: 'Critical Action',
        color: 'var(--coral)'
    });
    recommendations.push({
        title: 'Verify Pending Vault Assets',
        desc: 'Trigger AI Auto-Verification on your local uploads to boost your Trust Quotient.',
        label: 'Trust Boost',
        color: 'var(--purple)'
    });
    // Daily login pin earn
    (0, react_1.useEffect)(() => {
        if (typeof window !== 'undefined') {
            const today = new Date().toDateString();
            const lastLogin = localStorage.getItem('pinit_last_login_pin');
            if (lastLogin !== today) {
                localStorage.setItem('pinit_last_login_pin', today);
                setTimeout(() => earnPins('daily_login', 3, 'Daily login bonus'), 1500);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const profileForActions = {
        ats_score: careerScore,
        trust_score: trustScore,
        career_dna_score: dnaScore,
        mission_streak: missionStreak,
        missions_completed: completedMissions.length,
        recruiter_visibility: Number(user?.recruiter_visibility ?? 65),
        vault_count: vaultItems.length,
        interviews_done: Number(user?.interviews_done ?? 0),
        weak_areas: user?.weak_areas ?? [],
        skill_tags: user?.skill_tags ?? [],
        xp_total: xp,
    };
    // Dynamic Next Step Action Card
    let nextStepTitle = "Complete Onboarding";
    let nextStepDesc = "Onboard your Career Twin with standard traits.";
    let nextStepHref = "/career-twin";
    let nextStepIcon = "🧬";
    let nextStepColor = "var(--accent)";
    if (onboardingStep === 0) {
        nextStepTitle = "Setup Your Career OS Profile";
        nextStepDesc = "Take the 2-minute onboarding assessment to map your strengths.";
        nextStepHref = "/career-twin";
        nextStepIcon = "🧬";
        nextStepColor = "var(--accent)";
    }
    else if (vaultItems.length < 3) {
        nextStepTitle = "Upload Assets to Your Vault";
        nextStepDesc = "Certifications, project docs, and course badges boost your Trust Score.";
        nextStepHref = "/vault";
        nextStepIcon = "🗂️";
        nextStepColor = "var(--purple)";
    }
    else if (completedMissions.length === 0) {
        nextStepTitle = "Solve Your First SDE Mission";
        nextStepDesc = "Every morning, 5 personalised missions are generated to close your skill gaps.";
        nextStepHref = "/missions";
        nextStepIcon = "⚡";
        nextStepColor = "var(--amber)";
    }
    else if (!roadmapGenerated) {
        nextStepTitle = "Generate Career Quest Roadmap";
        nextStepDesc = "Select your target trajectory (e.g. Java Backend Engineer) to construct your quest path.";
        nextStepHref = "/career-builder";
        nextStepIcon = "🛠️";
        nextStepColor = "var(--teal)";
    }
    else if (completedQuests.length === 0) {
        nextStepTitle = "Launch Your First Programming Quest";
        nextStepDesc = "Start coding in our simulated SDE environment to unlock certifications.";
        nextStepHref = "/quests";
        nextStepIcon = "🗺️";
        nextStepColor = "var(--blue)";
    }
    else if (!javaTestPassed) {
        nextStepTitle = "Take Your AI Mock Interview";
        nextStepDesc = "Run a live verbal and code-evaluation assessment with your AI interviewer.";
        nextStepHref = "/interview";
        nextStepIcon = "🎙️";
        nextStepColor = "var(--accent)";
    }
    else {
        nextStepTitle = "Explore Opportunities Matches";
        nextStepDesc = "Apply to SDE positions ranked by how well your actual skills match the description.";
        nextStepHref = "/opportunities";
        nextStepIcon = "🎯";
        nextStepColor = "var(--green)";
    }
    return (<div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 4px' }} className="animate-fade-in">
      <style>{`
        .dashboard-content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.2fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .dashboard-content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ opacity: animIn ? 1 : 0, transform: animIn ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.4s ease, transform 0.4s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Welcome Section */}
        <div style={{
            padding: '24px 30px',
            background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
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
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.6px', margin: '0 0 6px' }}>
              Welcome to Career Command Center, {user?.displayName?.split(' ')[0] || 'Explorer'} 👋
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>
              Your unified diagnostic workspace for quests, mock interviews, and credential verification.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
            {/* Streak Counter Pill */}
            <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 12,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
            boxShadow: '0 0 12px rgba(245,158,11,0.04)',
            transition: 'all 0.15s',
        }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.5px', lineHeight: 1 }}>{missionStreak}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>streak days</div>
              </div>
            </div>

            {/* Pin Balance Widget */}
            <link_1.default href="/pricing" style={{ textDecoration: 'none' }}>
              <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 12,
            background: pins < 20 ? 'rgba(220,38,38,0.1)' : 'rgba(79,70,229,0.1)',
            border: `1px solid ${pins < 20 ? 'rgba(220,38,38,0.2)' : 'rgba(79,70,229,0.2)'}`,
            cursor: 'pointer', transition: 'all 0.15s',
        }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900, color: pins < 20 ? 'var(--coral)' : 'var(--accent)', letterSpacing: '-0.5px', lineHeight: 1 }}>{pins}</div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>pins</div>
                </div>
              </div>
            </link_1.default>
            <link_1.default href="/career-assets" className="btn-ghost btn-sm">💼 Career Assets Studio</link_1.default>
            <link_1.default href="/opportunities" className="btn-primary btn-sm">🎯 Match Jobs</link_1.default>
          </div>
        </div>

        {/* Section A & B: Core Metrics Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          
          {/* Radial Career Score Card (Section A) */}
          <div className="glass-card card-hover" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>🛡 Career Score</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)' }}><AnimatedNum value={careerScore}/></span><span style={{ fontSize: 14, color: 'var(--t3)' }}> / 100</span>
              </h2>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
                Weighted index calculated from verified credentials, ATS score, and consistent execution.
              </p>
            </div>
            
            {/* Visual Radial Progress Arc */}
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0, zIndex: 1 }}>
              <svg width="90" height="90" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg3)" strokeWidth="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent)" strokeDasharray={`${careerScore}, 100`} strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>
                {careerScore}%
              </div>
            </div>
          </div>

          {/* Digital Career Twin Gap (Section B) */}
          <div className="glass-card card-hover" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -50, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(8, 145, 178, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>🧬 Career Twin Alignment</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginTop: 4 }}>
                  Current Self ➔ <span style={{ color: onboardingAnswers.hasCompleted ? 'var(--teal)' : 'var(--t3)' }}>{onboardingAnswers.role || 'Take Onboarding'}</span>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: onboardingAnswers.hasCompleted ? 'var(--teal)' : 'var(--coral)', background: onboardingAnswers.hasCompleted ? 'var(--teal-light)' : 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 10, border: onboardingAnswers.hasCompleted ? '1px solid rgba(8, 145, 178, 0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                {alignmentPct}% Alignment
              </span>
            </div>
            
            {/* Progress Meter */}
            <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', fontSize: 11, color: 'var(--t3)', marginBottom: 6, justifyContent: 'space-between' }}>
                <span>Student Self</span>
                <span>{onboardingAnswers.role || 'Future Self'}</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${alignmentPct}%`, background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 5 }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Personalised Actions Section */}
        <WhatToDoToday_1.default profile={profileForActions}/>

        {/* Section C, D & E Grid */}
        <div className="dashboard-content-grid">
          
          {/* Left Column: Active Missions & Achievements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Section C: Active Missions */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>
                  ⚡ Top Active Missions
                </h3>
                <link_1.default href="/missions" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Quest Engine ➔</link_1.default>
              </div>
              
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.length === 0 ? (<div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg3)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>All Daily Missions Cleared!</div>
                    <p style={{ fontSize: 11.5, color: 'var(--t3)', maxWidth: 320, margin: '0 auto 12px', lineHeight: 1.4 }}>
                      Outstanding work. You've closed all active gap assignments. Ready to match new jobs or generate credentials?
                    </p>
                    <link_1.default href="/opportunities" className="btn-primary btn-sm">🎯 Match SDE Roles</link_1.default>
                  </div>) : (pending.slice(0, 2).map((m) => (<div key={m.id} style={{ position: 'relative' }}>
                      <MissionCard_1.default mission={m} onComplete={() => { }}/>
                      {m.target_gap && (<div style={{
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
                          ⚡ Gap: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{m.target_gap}</span>
                        </div>)}
                    </div>)))}
              </div>
            </div>

            {/* Section D: Recent Achievements */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>
                  🏆 Recent Verified Achievements
                </h3>
                <link_1.default href="/vault" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Evidence Vault ➔</link_1.default>
              </div>
              
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verifiedAchievements.length === 0 ? (<div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg3)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🗄️</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>No Evidence Added</div>
                    <p style={{ fontSize: 11, color: 'var(--t3)', maxWidth: 300, margin: '0 auto 12px', lineHeight: 1.4 }}>
                      Securely store projects, internships, or certifications in your AES-256 encrypted Vault to generate credentials.
                    </p>
                    <link_1.default href="/vault" className="btn-primary btn-sm">+ Upload Proof to Vault</link_1.default>
                  </div>) : (verifiedAchievements.slice(0, 3).map((ach, idx) => (<div key={idx} style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.15s'
            }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ach.color}15`, display: 'flex', alignItems: 'center', fontSize: 18, flexShrink: 0, justifyContent: 'center' }}>
                        {ach.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{ach.title}</span>
                          {ach.verified && <span style={{ fontSize: 9, color: 'var(--green)', background: 'var(--green-light)', padding: '1px 6px', borderRadius: 10, border: '1px solid rgba(5,150,105,0.15)', fontFamily: 'var(--font-mono)' }}>✓ Verified</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{ach.org}</div>
                      </div>
                    </div>)))}
              </div>
            </div>

          </div>

          {/* Right Column: AI Advisory & Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Section E: AI Recommendations */}
            <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.04), rgba(124,58,237,0.02))', border: '2px solid rgba(79,70,229,0.15)', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{teacher.emoji}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>{teacher.name}'s Advisory</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recommendations.map((rec, i) => (<div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{rec.title}</span>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', background: `${rec.color}15`, color: rec.color, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{rec.label}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>{rec.desc}</p>
                  </div>))}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--font-display)' }}>⚡ Live Activity Feed</span>
              </div>
              <ActivityFeed_1.default userId={user?.id}/>
            </div>

            {/* Streak & Consistency Index */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 26 }}>🔥</span>
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
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (<div key={i} style={{
                flex: 1,
                height: 30,
                borderRadius: '50%',
                background: i < Math.min(missionStreak, 7) ? 'var(--amber)' : 'var(--bg3)',
                color: i < Math.min(missionStreak, 7) ? 'white' : 'var(--t4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border)'
            }}>{d}</div>))}
              </div>
            </div>

            {/* Reputation Level Tracker */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--font-display)' }}>Reputation Level</span>
                <span style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{xp.toLocaleString()} XP</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{level.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: level.color }}>{level.label}</span>
                <span style={{ fontSize: 10, color: 'var(--t3)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>Tier {level.index}</span>
              </div>
              
              <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${level.pct}%`, background: `linear-gradient(90deg, var(--accent), ${level.color})`, borderRadius: 3 }}/>
              </div>
            </div>

          </div>

        </div>

        {/* Next Step Workflow Hand-off */}
        <div style={{ marginTop: 10 }}>
          <NextStepCard_1.default title={nextStepTitle} description={nextStepDesc} href={nextStepHref} icon={nextStepIcon} color={nextStepColor} eyebrow="Recommended next step" ctaLabel="Go ➔"/>
        </div>

      </div>

    </div>);
}
