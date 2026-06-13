'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QuestsPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AuthContext_1 = require("@/lib/context/AuthContext");
const questsData_1 = require("@/lib/data/questsData");
function QuestsPage() {
    const router = (0, navigation_1.useRouter)();
    const { user } = (0, AuthContext_1.useAuth)();
    const userId = user?.id || 'guest';
    const { roadmapGenerated, resumeGenerated, completedQuests, pins, onboardingStep } = (0, CareerOSContext_1.useCareerOS)();
    const [modules, setModules] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        if (typeof window !== 'undefined') {
            const modulesKey = `pinit_${userId}_roadmap_modules`;
            const saved = localStorage.getItem(modulesKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setModules(parsed);
                    }
                }
                catch (e) {
                    console.error('Error loading roadmap modules:', e);
                }
            }
        }
    }, [userId, roadmapGenerated]);
    if (!resumeGenerated) {
        return (<div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }} className="animate-fade-in">
        <div style={{
                background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '60px 40px',
                boxShadow: 'var(--shadow-xl)',
                maxWidth: 600,
                margin: '0 auto'
            }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 10 }}>
            Quests Locked
          </h2>
          <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 24 }}>
            Please upload or build a resume in the <strong style={{ color: 'var(--accent)' }}>Resume Builder</strong> first. Your resume and onboarding choices will fuse to compile your customized coding quests.
          </p>
          <link_1.default href="/resume" className="btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', fontSize: 13.5 }}>
            Go to Resume Builder ➔
          </link_1.default>
        </div>
      </div>);
    }
    if (!roadmapGenerated) {
        return (<div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }} className="animate-fade-in">
        <div style={{
                background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '60px 40px',
                boxShadow: 'var(--shadow-xl)',
                maxWidth: 600,
                margin: '0 auto'
            }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 10 }}>
            Quests Not Yet Active
          </h2>
          <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 24 }}>
            Your resume is synced! Please select your target path and generate your career quest roadmap inside the <strong style={{ color: 'var(--accent)' }}>Career Builder</strong> tab first to initiate daily exercises.
          </p>
          <link_1.default href="/career-builder" className="btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', fontSize: 13.5 }}>
            Go to Career Builder ➔
          </link_1.default>
        </div>
      </div>);
    }
    const allQuestsInRoadmap = modules.length > 0
        ? modules.flatMap(m => m.quests)
        : questsData_1.QUESTS_REGISTRY;
    const totalQuestsCount = allQuestsInRoadmap.length;
    const completedCount = allQuestsInRoadmap.filter(q => completedQuests.includes(q.id)).length;
    const getQuestMetadata = (id, type) => {
        switch (id) {
            case 'fizzbuzz': return { difficulty: 'Easy', xp: 100, pins: 5, color: 'var(--green)' };
            case 'reverser': return { difficulty: 'Easy', xp: 100, pins: 5, color: 'var(--green)' };
            case 'arraysum': return { difficulty: 'Medium', xp: 200, pins: 10, color: 'var(--amber)' };
            case 'palindrome': return { difficulty: 'Medium', xp: 200, pins: 10, color: 'var(--amber)' };
            case 'findmax': return { difficulty: 'Hard', xp: 300, pins: 15, color: 'var(--coral)' };
            case 'jvm-intro': return { difficulty: 'Medium', xp: 150, pins: 8, color: 'var(--purple)' };
            case 'java-oop-principles': return { difficulty: 'Medium', xp: 150, pins: 8, color: 'var(--purple)' };
            case 'java-basic-syntax': return { difficulty: 'Easy', xp: 120, pins: 6, color: 'var(--green)' };
            case 'sde-leadership': return { difficulty: 'Hard', xp: 250, pins: 12, color: 'var(--coral)' };
            case 'system-design-communication': return { difficulty: 'Hard', xp: 300, pins: 15, color: 'var(--coral)' };
            default: return { difficulty: 'Medium', xp: 150, pins: 8, color: 'var(--accent)' };
        }
    };
    return (<div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>🗺 Career Roadmap Quests</h1>
        <p>Participate in simulated SDE coding tasks and socratic AI lessons. Unlock interviews by progressing through your milestones.</p>
      </div>

      {/* Daily Progress Panel */}
      <div className="glass-card" style={{
            padding: '18px 24px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: 'var(--shadow-md)'
        }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎯 Trajectory Quest Progress</span>
            <span style={{ fontSize: 10, background: 'rgba(79,70,229,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              5 Pins / Start
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
            Unlock lessons and exams using pins. Current balance: <strong style={{ color: 'var(--accent)' }}>⚡ {pins} Pins</strong>.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: completedCount === totalQuestsCount ? 'var(--green)' : 'var(--accent)' }}>
            {completedCount} / {totalQuestsCount} Completed
          </div>
          <div style={{ width: 140, height: 10, background: 'var(--bg3)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{
            width: `${Math.min(100, (completedCount / totalQuestsCount) * 100)}%`,
            height: '100%',
            background: completedCount === totalQuestsCount ? 'var(--green)' : 'linear-gradient(90deg, var(--accent), var(--teal))',
            transition: 'width 0.3s'
        }}/>
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {(() => {
            const fallbackModules = [
                {
                    id: 'fallback_mod_1',
                    title: 'Foundational Coding Challenges',
                    desc: 'Master the basics of algorithms, arrays, loops, and logic implementation in Java.',
                    difficulty: 'Beginner',
                    estimatedWeeks: 2,
                    quests: questsData_1.QUESTS_REGISTRY.slice(0, 3)
                },
                {
                    id: 'fallback_mod_2',
                    title: 'Intermediate Algorithms',
                    desc: 'Build efficiency with string manipulation, palindrome checks, and search algorithms.',
                    difficulty: 'Intermediate',
                    estimatedWeeks: 3,
                    quests: questsData_1.QUESTS_REGISTRY.slice(3, 5)
                },
                {
                    id: 'fallback_mod_3',
                    title: 'SDE Theory & Core Concepts',
                    desc: 'Dive into Java compilation mechanics, OOP design, and developer leadership.',
                    difficulty: 'Advanced',
                    estimatedWeeks: 3,
                    quests: questsData_1.QUESTS_REGISTRY.slice(5)
                }
            ];
            const activeModules = modules.length > 0 ? modules : fallbackModules;
            return activeModules.map((mod, modIdx) => {
                const modCompletedQuests = (mod.quests || []).filter(q => completedQuests.includes(q.id)).length;
                const isModCompleted = modCompletedQuests === (mod.quests || []).length;
                return (<div key={mod.id || modIdx} style={{
                        background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
                        border: '1px solid var(--border)',
                        borderRadius: 20,
                        padding: '24px',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                {/* Module Header */}
                <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 16,
                        marginBottom: 20,
                        flexWrap: 'wrap',
                        gap: 12
                    }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 10,
                        background: 'rgba(79,70,229,0.15)',
                        color: 'var(--accent)',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)'
                    }}>
                        STAGE {modIdx + 1}
                      </span>
                      <span style={{
                        fontSize: 10,
                        background: mod.difficulty === 'Beginner' ? 'rgba(5,150,105,0.1)' : mod.difficulty === 'Advanced' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                        color: mod.difficulty === 'Beginner' ? 'var(--green)' : mod.difficulty === 'Advanced' ? 'var(--coral)' : 'var(--amber)',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontWeight: 800
                    }}>
                        {mod.difficulty || 'Intermediate'}
                      </span>
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--t1)', marginTop: 8, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
                      {mod.title}
                    </h2>
                    <p style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 4, lineHeight: 1.4 }}>
                      {mod.desc}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t3)', fontWeight: 600 }}>
                      ⏳ {mod.estimatedWeeks || 2} Weeks
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: isModCompleted ? 'var(--green)' : 'var(--accent)' }}>
                      {modCompletedQuests} / {mod.quests?.length || 0} Quests Completed
                    </span>
                  </div>
                </div>

                {/* Quests inside module */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {(mod.quests || []).map((ex, exIdx) => {
                        const completed = completedQuests.includes(ex.id);
                        // Compute locked status based on stage progression
                        let locked = false;
                        if (exIdx > 0) {
                            locked = !completedQuests.includes(mod.quests[exIdx - 1].id);
                        }
                        else if (modIdx > 0) {
                            const prevMod = activeModules[modIdx - 1];
                            locked = (prevMod.quests || []).some(pq => !completedQuests.includes(pq.id));
                        }
                        const meta = getQuestMetadata(ex.id, ex.type);
                        // Category badge styles
                        let badgeLabel = '💻 Assignment';
                        let badgeBg = 'rgba(8,145,178,0.1)';
                        let badgeColor = 'var(--teal)';
                        const cat = ex.category || (ex.requiresAvatar || ex.type === 'lecture' || ex.type === 'interactive' ? 'learning' : 'assignment');
                        if (cat === 'learning') {
                            badgeLabel = '🎓 Learning Class';
                            badgeBg = 'rgba(124,58,237,0.1)';
                            badgeColor = 'rgba(167,139,250,1)';
                        }
                        else if (cat === 'exam') {
                            badgeLabel = '📝 Coding Exam';
                            badgeBg = 'rgba(220,38,38,0.1)';
                            badgeColor = 'var(--coral)';
                        }
                        return (<div key={ex.id} onClick={() => !locked && router.push(`/quests/${ex.id}`)} className={`glass-card ${locked ? '' : 'card-hover'}`} style={{
                                padding: '20px',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                opacity: locked ? 0.55 : 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: 16,
                                border: `1px solid ${completed ? 'var(--green)' : locked ? 'var(--border)' : 'rgba(99, 102, 241, 0.2)'}`,
                                position: 'relative',
                                overflow: 'hidden',
                                height: '100%',
                                minHeight: 180
                            }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: completed ? 'rgba(5,150,105,0.15)' : locked ? 'var(--bg3)' : 'rgba(99, 102, 241, 0.15)',
                                color: completed ? 'var(--green)' : locked ? 'var(--t3)' : 'var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 800, flexShrink: 0
                            }}>
                            {completed ? '✓' : locked ? '🔒' : exIdx + 1}
                          </div>
                          
                          <span style={{
                                fontSize: 10,
                                background: badgeBg,
                                color: badgeColor,
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)'
                            }}>
                            {badgeLabel}
                          </span>
                        </div>

                        <div style={{ flex: 1, marginTop: 8 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>{ex.title}</h3>
                          <p style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {ex.desc}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, color: 'var(--t2)', fontWeight: 600 }}>
                              +{meta.xp} XP
                            </span>
                            <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent)', fontWeight: 600 }}>
                              +{meta.pins} Pins
                            </span>
                          </div>

                          {completed ? (<span style={{ fontSize: 9.5, color: 'var(--green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>DONE</span>) : locked ? (<span style={{ fontSize: 9.5, color: 'var(--t4)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>LOCKED</span>) : (<span style={{ fontSize: 9.5, color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 2 }}>
                              START ➔
                            </span>)}
                        </div>
                      </div>);
                    })}
                </div>
              </div>);
            });
        })()}
      </div>

        {completedCount > 0 && (<div className="glass-card" style={{
                padding: '24px 20px',
                marginTop: 16,
                textAlign: 'center',
                border: '1px solid rgba(5,150,105,0.2)',
                background: 'rgba(5,150,105,0.02)'
            }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎙️</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>AI Interview Simulator Active!</div>
            <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: '6px 0 16px', lineHeight: 1.5, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              You have cleared multiple coding modules. Ready to demonstrate your skills to AI interviewers in a live assessment?
            </p>
            <link_1.default href="/interview" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: 13 }}>
              Go to AI Interviews ➔
            </link_1.default>
          </div>)}
    </div>);
}
