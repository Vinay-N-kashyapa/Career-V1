'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QuestWorkspaceClient;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const dynamic_1 = __importDefault(require("next/dynamic"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AuthContext_1 = require("@/lib/context/AuthContext");
const questsData_1 = require("@/lib/data/questsData");
const useAppStore_1 = require("@/lib/store/useAppStore");
// Dynamically import Three.js avatar widget to ensure zero Next.js SSR build errors
const AvatarMentorWidget = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('@/components/avatar/AvatarMentorWidget'))), { ssr: false });
const TEACHERS = [
    {
        id: 'priya',
        name: 'Ms. Priya',
        emoji: '👩‍💼',
        color: '#4f46e5',
        nature: 'Warm & Career-oriented',
        characteristics: 'Focuses on Socratic hinting, general trajectory guidance, and soft-skills checkpoints.',
        memory: 'Maintains career milestones, resume logs, and mock session histories.'
    },
    {
        id: 'aisha',
        name: 'Ms. Aisha',
        emoji: '👩‍🏫',
        color: '#7c3aed',
        nature: 'Rigorous & Scientific',
        characteristics: 'Explains computer science theory, Java internals, memory areas, and complex algorithms.',
        memory: 'Tracks structured notes, syllabus checkmarks, and technical weak areas.'
    },
    {
        id: 'rohan',
        name: 'Mr. Rohan',
        emoji: '👨‍💻',
        color: '#0891b2',
        nature: 'Hands-on SDE Lead',
        characteristics: 'Focuses on production engineering patterns, clean code rules, edge cases, and systems architecture.',
        memory: 'Logs code check-in structures, refactoring logs, and syntax guidelines.'
    },
    {
        id: 'vikram',
        name: 'Mr. Vikram',
        emoji: '👨‍⚖️',
        color: '#059669',
        nature: 'Strict Technical Recruiter',
        characteristics: 'Runs behavioral integrity checks, direct performance audits, and ATS keywords optimizations.',
        memory: 'Tracks candidate visibility parameters, interview scoreboard, and job matches.'
    }
];
function QuestWorkspaceClient({ questId }) {
    const router = (0, navigation_1.useRouter)();
    const { completedQuests, addCompletedQuest, pins, spendPins } = (0, CareerOSContext_1.useCareerOS)();
    const { user } = (0, AuthContext_1.useAuth)();
    const userId = user?.id || 'guest';
    const quest = (0, react_1.useMemo)(() => {
        if (typeof window === 'undefined')
            return null;
        const regQuest = questsData_1.QUESTS_REGISTRY.find(q => q.id === questId);
        if (regQuest)
            return regQuest;
        try {
            const saved = localStorage.getItem(`pinit_${userId}_roadmap_modules`);
            if (saved) {
                const mods = JSON.parse(saved);
                for (const m of mods) {
                    const q = m.quests?.find((qi) => qi.id === questId);
                    if (q)
                        return q;
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return null;
    }, [questId, userId]);
    const category = (0, react_1.useMemo)(() => {
        if (!quest)
            return 'assignment';
        if (quest.category)
            return quest.category;
        if (quest.requiresAvatar || quest.type === 'lecture' || quest.type === 'interactive') {
            return 'learning';
        }
        if (quest.id === 'fizzbuzz' || quest.id.includes('exam')) {
            return 'exam';
        }
        return 'assignment';
    }, [quest]);
    // Countdown Timer state for Taking Exam
    const [timeLeft, setTimeLeft] = (0, react_1.useState)('45:00');
    (0, react_1.useEffect)(() => {
        if (category !== 'exam')
            return;
        let sec = 2700; // 45 minutes
        const timer = setInterval(() => {
            sec--;
            if (sec <= 0) {
                clearInterval(timer);
                setTimeLeft('00:00');
                return;
            }
            const m = Math.floor(sec / 60).toString().padStart(2, '0');
            const s = (sec % 60).toString().padStart(2, '0');
            setTimeLeft(`${m}:${s}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [category]);
    // States
    const [selectedTeacherId, setSelectedTeacherId] = (0, react_1.useState)('priya');
    const [questTeacher, setQuestTeacher] = (0, react_1.useState)(null);
    const [isUnlocked, setIsUnlocked] = (0, react_1.useState)(false);
    const [code, setCode] = (0, react_1.useState)('');
    const [output, setOutput] = (0, react_1.useState)(null);
    const [showHint, setShowHint] = (0, react_1.useState)(false);
    const [isCompleteView, setIsCompleteView] = (0, react_1.useState)(false);
    // Load unlock status and selected teacher from localStorage on mount
    (0, react_1.useEffect)(() => {
        if (!questId)
            return;
        const teacherStored = localStorage.getItem(`pinit_quest_teacher_${questId}`);
        if (teacherStored) {
            setQuestTeacher(teacherStored);
            setIsUnlocked(true);
        }
        else if (completedQuests.includes(questId)) {
            setQuestTeacher('priya'); // Fallback if already completed previously
            setIsUnlocked(true);
        }
    }, [questId, completedQuests]);
    // Set default starter code
    (0, react_1.useEffect)(() => {
        if (quest?.starterCode) {
            setCode(quest.starterCode);
        }
    }, [quest]);
    if (!quest) {
        return (<div style={{ maxWidth: 600, margin: '100px auto', textAlign: 'center' }}>
        <h2>Quest Not Found</h2>
        <p style={{ color: 'var(--t3)', margin: '10px 0 20px' }}>The quest trajectory you requested could not be resolved.</p>
        <link_1.default href="/quests" className="btn-primary">Return to Quests Tab</link_1.default>
      </div>);
    }
    // Spend pins to unlock the quest
    const handleUnlockQuest = () => {
        const teacher = TEACHERS.find(t => t.id === selectedTeacherId) || TEACHERS[0];
        if (spendPins('quest_start', `Unlock Quest: ${quest.title.split(':')[1]?.trim() || quest.title}`)) {
            localStorage.setItem(`pinit_quest_teacher_${questId}`, selectedTeacherId);
            setQuestTeacher(selectedTeacherId);
            setIsUnlocked(true);
            useAppStore_1.toast.success('Quest Active! ⚡', `Unlocked with ${teacher.name} as your instructor.`);
        }
    };
    // Compile java simulated logic
    const javaToJsTranspiler = (javaCode) => {
        let js = javaCode;
        js = js.replace(/public\s+class\s+\w+\s*\{/, '');
        js = js.trim();
        if (js.endsWith('}'))
            js = js.slice(0, -1);
        const keywords = new Set(['if', 'for', 'while', 'switch', 'catch', 'synchronized']);
        js = js.replace(/(public|protected|private|static|\s)+([a-zA-Z0-9_<>\s\[\]]+)\s+(\w+)\s*\(([^)]*)\)/g, (match, access, retType, name, args) => {
            if (keywords.has(name))
                return match;
            const cleanArgs = args.replace(/(int|String|double|float|boolean|char|int\[\])\s+/g, '');
            return `function ${name}(${cleanArgs})`;
        });
        js = js.replace(/new\s+int\[\]\s*\{/g, '[');
        js = js.replace(/\b(int|String|double|float|boolean|char)\b(?!\.)\s+(\w+)/g, 'let $2');
        js = js.replace(/String\.valueOf\(/g, 'String(');
        js = js.replace(/\.length\(\)/g, '.length');
        js = js.replace(/System\.out\.println/g, 'console.log');
        return js;
    };
    const handleVerifySolution = () => {
        setOutput(null);
        try {
            const jsCode = javaToJsTranspiler(code);
            const evaluator = new Function(`
        ${jsCode}
        try {
          ${quest.testSuite}
          return { success: true, message: "Verification Passed! All test cases cleared." };
        } catch (e) {
          return { success: false, message: e.message };
        }
      `);
            const res = evaluator();
            setOutput(res);
            if (res.success) {
                addCompletedQuest(quest.id);
                setIsCompleteView(true);
            }
        }
        catch (err) {
            setOutput({ success: false, message: 'Syntax or compiler emulation error: ' + err.message });
        }
    };
    const handleCompleteLecture = () => {
        addCompletedQuest(quest.id);
        setIsCompleteView(true);
    };
    const currentTeacher = TEACHERS.find(t => t.id === questTeacher) || TEACHERS[0];
    // 1. TEACHER SELECTION VIEW
    if (!isUnlocked) {
        return (<div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <link_1.default href="/quests" style={{ textDecoration: 'none', color: 'var(--t3)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Return to Quests Tab
          </link_1.default>
          <h1 style={{ marginTop: 12, fontSize: 28 }}>Choose Your Instructor</h1>
          <p style={{ color: 'var(--t2)', fontSize: 14 }}>
            Select a mentor to guide you through <strong style={{ color: 'var(--t1)' }}>{quest.title}</strong> based on their pedagogical nature, socratic style, and analytical focus.
          </p>
        </div>

        {/* Teachers Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          {TEACHERS.map(t => {
                const isSelected = selectedTeacherId === t.id;
                return (<div key={t.id} onClick={() => setSelectedTeacherId(t.id)} style={{
                        background: 'var(--bg2)',
                        border: `2px solid ${isSelected ? t.color : 'var(--border)'}`,
                        borderRadius: 20,
                        padding: 22,
                        cursor: 'pointer',
                        boxShadow: isSelected ? `0 10px 30px -10px ${t.color}30` : 'var(--shadow-sm)',
                        transition: 'all 0.25s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        position: 'relative'
                    }}>
                {isSelected && (<span style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            background: t.color,
                            color: 'white',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 'bold'
                        }}>
                    ✓
                  </span>)}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{t.emoji}</span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--t1)' }}>{t.name}</h3>
                    <span style={{ fontSize: 10, color: t.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.nature}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: 'var(--t2)', fontSize: 11 }}>Characteristics:</strong>
                    <p style={{ color: 'var(--t3)', margin: '2px 0 0' }}>{t.characteristics}</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--t2)', fontSize: 11 }}>Memory State:</strong>
                    <p style={{ color: 'var(--t3)', margin: '2px 0 0' }}>{t.memory}</p>
                  </div>
                </div>
              </div>);
            })}
        </div>

        {/* Start Button */}
        <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '24px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                boxShadow: 'var(--shadow-md)'
            }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.8px' }}>
              Quest Startup Gate
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginTop: 4 }}>
              Cost: <span style={{ color: 'var(--accent)' }}>⚡ 5 Pins</span> · Current Balance: <span style={{ color: 'var(--green)' }}>⚡ {pins} Pins</span>
            </div>
          </div>
          <button onClick={handleUnlockQuest} className="btn-primary" style={{ padding: '12px 32px', fontSize: 14 }} id="btn-start-quest">
            Start Quest & Spend 5 Pins ➔
          </button>
        </div>
      </div>);
    }
    // 2. CONGRATULATIONS / SUCCESS SCREEN
    if (isCompleteView) {
        return (<div style={{ maxWidth: 600, margin: '60px auto', padding: '40px 24px', textAlign: 'center' }} className="animate-fade-in">
        <div style={{
                background: 'var(--bg2)',
                border: '1.5px solid var(--green)',
                borderRadius: 24,
                padding: '50px 40px',
                boxShadow: '0 20px 40px -15px rgba(5,150,105,0.15)'
            }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)', marginBottom: 8 }}>
            Quest Completed!
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            Congratulations! You have completed the quest <strong style={{ color: 'var(--t1)' }}>"{quest.title}"</strong> under the guidance of <strong style={{ color: currentTeacher.color }}>{currentTeacher.name}</strong>.
          </p>

          {/* Rewards pill */}
          <div style={{
                display: 'inline-flex',
                gap: 16,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                padding: '12px 24px',
                borderRadius: 30,
                marginBottom: 36,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700
            }}>
            <span style={{ color: 'var(--accent)' }}>⚡ +30 XP</span>
            <span style={{ color: 'var(--green)' }}>📌 +10 Pins</span>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <link_1.default href="/quests" className="btn-primary" style={{ padding: '10px 24px' }}>
              Return to Quests Tab
            </link_1.default>
            <link_1.default href="/career-builder" className="btn-ghost" style={{ padding: '10px 24px' }}>
              View Career Roadmap
            </link_1.default>
          </div>
        </div>
      </div>);
    }
    // 3. EXAM ENVIRONMENT VIEW
    if (category === 'exam') {
        return (<div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
        {/* Workspace Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <link_1.default href="/quests" style={{ textDecoration: 'none', color: 'var(--t3)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ← Return to Quests Tab
            </link_1.default>
            <h2 style={{ margin: '8px 0 0', fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
              📝 Taking Exam: {quest.title}
              <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: 'var(--coral)', padding: '2px 8px', borderRadius: 6, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                PROCTOR EXAM
              </span>
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)', marginRight: 12 }}>Instructor: <strong style={{ color: currentTeacher.color }}>{currentTeacher.name} {currentTeacher.emoji}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Timer: <strong style={{ color: 'var(--coral)', fontFamily: 'var(--font-mono)' }}>⏱ {timeLeft}</strong></span>
          </div>
        </div>

        {/* 2-Column Compiler Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'flex-start' }}>
          
          {/* Left Column: Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 20, padding: 24, borderTop: '4px solid var(--coral)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--t1)' }}>Exam Instructions</h3>
              <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6, margin: '0 0 16px 0' }}>{quest.desc}</p>
              
              <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 12, padding: 14, fontSize: 12.5, color: 'var(--coral)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span>⚠️</span>
                <div>
                  <strong>Proctored Session:</strong> Tab-switches or exiting this browser view are logged in the cryptographically signed Sentinel trust ledger. Do not exit full-screen.
                </div>
              </div>
            </div>

            {quest.hint && (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <button onClick={() => setShowHint(h => !h)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  {showHint ? '💡 Hide Exam Hint' : '💡 Show Exam Hint'}
                </button>
                {showHint && (<p style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: 12, borderRadius: 10, marginTop: 8, fontSize: 12, color: 'var(--amber)', lineHeight: 1.5, margin: '8px 0 0' }}>
                    {quest.hint}
                  </p>)}
              </div>)}

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--t1)' }}>Requirements</h3>
              <ul style={{ paddingLeft: 18, fontSize: 12.5, color: 'var(--t3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Implement a class method inside the compiler editor that complies with the signature.</li>
                <li>Write a solution that satisfies all automated test cases.</li>
                <li>Submit your solution for compilation and proctored grading.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Code Editor */}
          <div style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', border: '1px solid var(--border)', borderBottom: 'none', padding: '8px 14px', borderRadius: '12px 12px 0 0' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Solution.java (Proctored Compiler)</span>
                <span style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>EXAM ENVIRONMENT</span>
              </div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} style={{
                width: '100%',
                height: 320,
                background: '#0d0e12',
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                padding: 16,
                border: '1.5px solid var(--border)',
                borderRadius: '0 0 12px 12px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6
            }}/>
            </div>

            {output && (<div style={{
                    background: output.success ? 'rgba(5,150,105,0.06)' : 'rgba(220,38,38,0.06)',
                    border: `1.5px solid ${output.success ? 'var(--green)' : 'var(--coral)'}`,
                    padding: 14,
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: output.success ? 'var(--green)' : 'var(--coral)',
                    whiteSpace: 'pre-wrap'
                }}>
                {output.success ? '🟢 ' : '🔴 '}
                {output.message}
              </div>)}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleVerifySolution} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 13, background: 'var(--coral)', border: '1px solid var(--coral)', boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}>
                Submit Exam Solution ✓
              </button>
              <button onClick={() => setCode(quest.starterCode || '')} className="btn-ghost" style={{ padding: 12, fontSize: 13 }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>);
    }
    // 4. ASSIGNMENT SANDBOX WORKSPACE
    if (category === 'assignment') {
        return (<div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
        {/* Workspace Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <link_1.default href="/quests" style={{ textDecoration: 'none', color: 'var(--t3)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ← Return to Quests Tab
            </link_1.default>
            <h2 style={{ margin: '8px 0 0', fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
              💻 Completing Assignment: {quest.title}
              <span style={{ fontSize: 10, background: 'rgba(79,70,229,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 6, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                ASSIGNMENT CHALLENGE
              </span>
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)', marginRight: 12 }}>Instructor: <strong style={{ color: currentTeacher.color }}>{currentTeacher.name} {currentTeacher.emoji}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Balance: <strong style={{ color: 'var(--accent)' }}>⚡ {pins} Pins</strong></span>
          </div>
        </div>

        {/* 2-Column Compiler Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'flex-start' }}>
          
          {/* Left Column: Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--t1)' }}>Assignment Description</h3>
              <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>{quest.desc}</p>
            </div>

            {quest.hint && (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <button onClick={() => setShowHint(h => !h)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  {showHint ? '💡 Show Assignment Hint' : '💡 Show Assignment Hint'}
                </button>
                {showHint && (<p style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: 12, borderRadius: 10, marginTop: 8, fontSize: 12, color: 'var(--amber)', lineHeight: 1.5, margin: '8px 0 0' }}>
                    {quest.hint}
                  </p>)}
              </div>)}

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--t1)' }}>Requirements</h3>
              <ul style={{ paddingLeft: 18, fontSize: 12.5, color: 'var(--t3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Write a Java class method that implements the requested interface/class functionality.</li>
                <li>Verify your solution using the live sandbox compiler execution block.</li>
                <li>Submit to satisfy all test cases.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Code Editor */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', border: '1px solid var(--border)', borderBottom: 'none', padding: '8px 14px', borderRadius: '12px 12px 0 0' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Solution.java (Coding Sandbox)</span>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>JAVA COMPILER</span>
              </div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} style={{
                width: '100%',
                height: 320,
                background: '#15171e',
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                padding: 16,
                border: '1px solid var(--border)',
                borderRadius: '0 0 12px 12px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6
            }}/>
            </div>

            {output && (<div style={{
                    background: output.success ? 'rgba(5,150,105,0.06)' : 'rgba(220,38,38,0.06)',
                    border: `1.5px solid ${output.success ? 'var(--green)' : 'var(--coral)'}`,
                    padding: 14,
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: output.success ? 'var(--green)' : 'var(--coral)',
                    whiteSpace: 'pre-wrap'
                }}>
                {output.success ? '🟢 ' : '🔴 '}
                {output.message}
              </div>)}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleVerifySolution} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 13 }}>
                Submit Assignment ✓
              </button>
              <button onClick={() => setCode(quest.starterCode || '')} className="btn-ghost" style={{ padding: 12, fontSize: 13 }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>);
    }
    // 5. LECTURE & INTERACTIVE WORKSPACE (category === 'learning')
    return (<div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <link_1.default href="/quests" style={{ textDecoration: 'none', color: 'var(--t3)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Return to Quests Tab
          </link_1.default>
          <h2 style={{ margin: '8px 0 0', fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            🎓 Learning Class: {quest.title}
            <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.1)', color: 'rgba(167,139,250,1)', padding: '2px 8px', borderRadius: 6, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              SOCRATIC CLASS
            </span>
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: 'var(--t3)', marginRight: 12 }}>Instructor: <strong style={{ color: currentTeacher.color }}>{currentTeacher.name} {currentTeacher.emoji}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Balance: <strong style={{ color: 'var(--accent)' }}>⚡ {pins} Pins</strong></span>
        </div>
      </div>

      {/* 2-Column Socratic Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'stretch' }}>
        
        {/* Left Column: Syllabus & Complete Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quest Objectives */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--t1)' }}>Quest Objective</h3>
              <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>{quest.desc}</p>
            </div>

            {/* Lecture Syllabus Checklist */}
            {quest.syllabus && (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--t1)' }}>Syllabus Checklist</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quest.syllabus.map((topic, i) => (<div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: 14 }}>•</span>
                      <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.4 }}>{topic}</span>
                    </div>))}
                </div>
              </div>)}

            {/* Guidance instructions */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: 'var(--t1)' }}>Socratic Interactive Guidelines</h3>
              <p style={{ fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5, margin: 0 }}>
                Communicate with the avatar using the chat panel on the right. Ask questions about the JVM memory model, stack/heap boundaries, or OOP concepts. Your teacher will evaluate your answers socratically.
              </p>
            </div>
          </div>

          {/* Complete Lesson Action Box */}
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)' }}>Completed your discussion?</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Ready to finalize this milestone lesson?</div>
            </div>
            <button onClick={handleCompleteLecture} className="btn-primary" style={{ padding: '10px 24px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ✓ Complete Lesson
            </button>
          </div>
        </div>

        {/* Right Column: VRoid Avatar and Chat Box */}
        <div style={{
            background: 'var(--bg2)',
            border: '1.5px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 620,
            boxShadow: 'var(--shadow-lg)'
        }}>
          <AvatarMentorWidget userId={user?.id} careerProfile={{ ats_score: 75 }} // Mock profile metrics to avoid TS issues
     teacherId={questTeacher || 'priya'} activeQuest={quest} minimized={false}/>
        </div>
      </div>
    </div>);
}
