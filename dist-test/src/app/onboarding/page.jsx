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
exports.default = OnboardingPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AuthContext_1 = require("@/lib/context/AuthContext");
const client_1 = require("@/lib/api/client");
const react_query_1 = require("@tanstack/react-query");
const hooks_1 = require("@/lib/api/hooks");
const dynamic_1 = __importDefault(require("next/dynamic"));
const tts_1 = require("@/lib/tts");
// Dynamic import for WebGL/ThreeJS avatar to avoid SSR issues
const VRoidInterviewAvatar = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('@/components/avatar/VRoidInterviewAvatar'))), { ssr: false });
function OnboardingPage() {
    const router = (0, navigation_1.useRouter)();
    const qc = (0, react_query_1.useQueryClient)();
    const { user } = (0, AuthContext_1.useAuth)();
    const cOS = (0, CareerOSContext_1.useCareerOS)();
    // Local State
    const [currentStep, setCurrentStep] = (0, react_1.useState)(0);
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [userInput, setUserInput] = (0, react_1.useState)('');
    const [animState, setAnimState] = (0, react_1.useState)('wave');
    const [zoom, setZoom] = (0, react_1.useState)(1.6);
    const [isMuted, setIsMuted] = (0, react_1.useState)(false);
    const [recognizing, setRecognizing] = (0, react_1.useState)(false);
    // Customization States collected from conversation
    const [studentType, setStudentType] = (0, react_1.useState)('');
    const [targetGoal, setTargetGoal] = (0, react_1.useState)('');
    const [accessReason, setAccessReason] = (0, react_1.useState)('');
    // Sync / Loading state
    const [syncing, setSyncing] = (0, react_1.useState)(false);
    const [syncProgress, setSyncProgress] = (0, react_1.useState)(0);
    const [syncStatus, setSyncStatus] = (0, react_1.useState)('Syncing profile...');
    const recognitionRef = (0, react_1.useRef)(null);
    const messagesEndRef = (0, react_1.useRef)(null);
    // Auto-scroll chat to bottom
    (0, react_1.useEffect)(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Initial greeting
    (0, react_1.useEffect)(() => {
        const welcomeText = "Hello there! Welcome to PinIT Career OS. ✦ I'm Ms. Priya, your AI career mentor. I will guide you through compiling your professional credentials and setting up your study quests. To start, what type of student profile describes you best?";
        setMessages([
            {
                id: 'welcome',
                sender: 'ai',
                text: welcomeText,
                timestamp: Date.now()
            }
        ]);
        setTimeout(() => {
            speakReply(welcomeText);
        }, 800);
        return () => {
            (0, tts_1.stopSpeaking)();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Text to Speech voice synthesis using ElevenLabs + native fallback
    const speakReply = (text) => {
        (0, tts_1.speakWithAvatar)(text, 'priya', () => setAnimState('talking'), () => setAnimState('idle'), isMuted);
    };
    // Speech Recognition input helper
    const startVoiceListening = () => {
        if (typeof window === 'undefined')
            return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }
        if (recognizing) {
            recognitionRef.current?.stop();
            setRecognizing(false);
            setAnimState('idle');
            return;
        }
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.onstart = () => {
            setRecognizing(true);
            setAnimState('listening');
        };
        rec.onresult = (e) => {
            const transcript = e.results[0]?.[0]?.transcript;
            if (transcript) {
                handleUserAnswer(transcript);
            }
        };
        rec.onerror = (e) => {
            console.error("Speech recognition error", e);
            setRecognizing(false);
            setAnimState('idle');
        };
        rec.onend = () => {
            setRecognizing(false);
            setAnimState('idle');
        };
        recognitionRef.current = rec;
        rec.start();
    };
    // Handler for text / button / voice answer submission
    const handleUserAnswer = (text) => {
        if (!text.trim())
            return;
        // Push user message to timeline
        const userMsg = {
            id: `msg_${Date.now()}`,
            sender: 'user',
            text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setUserInput('');
        setAnimState('thinking');
        // Dialogue State Machine Transition
        setTimeout(() => {
            if (currentStep === 0) {
                // Step 1 answer -> Student Type
                setStudentType(text);
                setCurrentStep(1);
                setAnimState('nod');
                const aiReply = "Excellent profile base. Now, what is your dream target goal? What role do you want to become? (e.g. Software Engineer, UI/UX Designer, or DevOps Cloud Engineer)";
                setMessages(prev => [...prev, {
                        id: `msg_ai_${Date.now()}`,
                        sender: 'ai',
                        text: aiReply,
                        timestamp: Date.now()
                    }]);
                speakReply(aiReply);
            }
            else if (currentStep === 1) {
                // Step 2 answer -> Target Goal
                setTargetGoal(text);
                setCurrentStep(2);
                setAnimState('nod');
                const aiReply = "Perfect choice, that is a highly valued career trajectory. Lastly, what is your primary objective for accessing PinIT Career OS today?";
                setMessages(prev => [...prev, {
                        id: `msg_ai_${Date.now()}`,
                        sender: 'ai',
                        text: aiReply,
                        timestamp: Date.now()
                    }]);
                speakReply(aiReply);
            }
            else if (currentStep === 2) {
                // Step 3 answer -> Access Reason
                setAccessReason(text);
                setCurrentStep(3);
                setAnimState('wave');
                const aiReply = "Fantastic! I've compiled your preferences and initialized your Command Center. Next, you will need to upload your resume to generate your custom learning quests. Let's begin!";
                setMessages(prev => [...prev, {
                        id: `msg_ai_${Date.now()}`,
                        sender: 'ai',
                        text: aiReply,
                        timestamp: Date.now()
                    }]);
                speakReply(aiReply);
                // Trigger Career Builder roadmap generation and profile sync
                setTimeout(() => {
                    handleOnboardingComplete(studentType, targetGoal, text);
                }, 1500);
            }
        }, 1000);
    };
    // Complete onboarding, generate quest modules, and sync to Supabase
    const handleOnboardingComplete = async (profileType, goalRole, reason) => {
        setSyncing(true);
        setSyncProgress(10);
        setSyncStatus('Registering student trajectory...');
        const userId = user?.id || 'guest';
        const modulesKey = `pinit_${userId}_roadmap_modules`;
        // 1. Identify template path
        const goalLower = goalRole.toLowerCase();
        let selectedPath = 'java_sde';
        let targetRoleLabel = 'Software Engineer';
        let skillsList = 'Java Standard Library, OOP Principles, Spring Boot REST, SQL Databases, System Design';
        if (goalLower.includes('design') || goalLower.includes('ux') || goalLower.includes('ui') || goalLower.includes('front') || goalLower.includes('react')) {
            selectedPath = 'react_frontend';
            targetRoleLabel = 'UI/UX Designer';
            skillsList = 'React Hooks, NextJS SSR, Vanilla CSS, Zustand State, TypeScript Types';
        }
        else if (goalLower.includes('devops') || goalLower.includes('cloud') || goalLower.includes('aws') || goalLower.includes('pipeline') || goalLower.includes('docker')) {
            selectedPath = 'devops_cloud';
            targetRoleLabel = 'DevOps Engineer';
            skillsList = 'Docker Containers, CI/CD Pipelines, AWS Cloud Services, Prometheus & Grafana, Kubernetes Orchestration';
        }
        // 2. Incremental Sync Progress
        setTimeout(() => {
            setSyncProgress(40);
            setSyncStatus('Initializing Career Builder configuration...');
        }, 800);
        setTimeout(() => {
            setSyncProgress(75);
            setSyncStatus('Synchronizing credential vault with cryptographic Sentinel registry...');
        }, 1600);
        setTimeout(async () => {
            setSyncProgress(100);
            setSyncStatus('Activating Command Center dashboard...');
            // 3. Save profile onboarding state via POST to API
            try {
                const payload = {
                    role: 'student', // student only onboarding
                    onboardingStep: 1, // Start at step 1 (Command Center)
                    onboardingAnswers: {
                        role: targetRoleLabel,
                        education: profileType,
                        skills: skillsList,
                        experience: 'fresher',
                        hasCompleted: true
                    },
                    roadmapGenerated: false
                };
                await client_1.api.post('/api/auth/onboarding', payload);
                // Sync context state locally
                cOS.setOnboarding({
                    role: targetRoleLabel,
                    education: profileType,
                    skills: skillsList,
                    experience: 'fresher'
                });
                cOS.setOnboardingStep(1); // Start at step 1
                cOS.setRoadmapGenerated(false); // No roadmap generated yet
                localStorage.removeItem(modulesKey); // Clear any old baseline roadmap data
                await qc.invalidateQueries({ queryKey: hooks_1.KEYS.me });
            }
            catch (err) {
                console.error("Onboarding sync failure", err);
            }
            finally {
                router.push('/dashboard');
            }
        }, 2400);
    };
    // Click handler for quick options
    const handleOptionClick = (option) => {
        handleUserAnswer(option);
    };
    // Selection options based on current step
    const getOptionsForStep = () => {
        if (currentStep === 0) {
            return [
                "Computer Science / IT Student",
                "Non-CS Engineering Student",
                "Self-Taught / Other Learner"
            ];
        }
        if (currentStep === 1) {
            return [
                "Software Engineer",
                "UI/UX Designer",
                "DevOps Engineer"
            ];
        }
        if (currentStep === 2) {
            return [
                "To close skill gaps & earn XP",
                "To build portfolio & find internships",
                "To practice AI mock interviews",
                "To verify credentials in the vault"
            ];
        }
        return [];
    };
    return (<div style={{ height: '100vh', background: '#030508', color: '#f1f5f9', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body), sans-serif' }}>
      
      {/* Decorative Blur Spheres */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(10,15,26,0.3)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14 }}>Pi</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>PinIT Career OS</span>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100, padding: '4px 12px' }}>
          AI ONBOARDING ACTIVE
        </div>
      </header>

      {/* Main Grid Content */}
      <main style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.1fr 1fr', maxWidth: 1280, width: '100%', margin: '0 auto', padding: '12px 24px 24px 24px', gap: 24, zIndex: 5, overflow: 'hidden', height: 'calc(100vh - 72px)' }}>
        
        {/* Left Column: 3D Avatar Viewport */}
        <section style={{ background: 'rgba(10, 15, 26, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <VRoidInterviewAvatar teacherId="priya" animState={animState} zoom={zoom}/>
            
            {/* Visual Listening Overlay */}
            {animState === 'listening' && (<div style={{ position: 'absolute', inset: 0, background: 'rgba(79,70,229,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(i => (<div key={i} className="mic-wave-bar" style={{ width: 4, height: 20, background: 'var(--accent)', borderRadius: 2, animation: `pulse-height 1s ease-in-out infinite alternate ${i * 0.15}s` }}/>))}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>Listening... Speak now</div>
              </div>)}
          </div>

          {/* Floating Controls Overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'rgba(10,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '6px 12px', backdropFilter: 'blur(10px)', zIndex: 12 }}>
            <button onClick={() => setZoom(z => Math.min(2.2, z + 0.1))} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '4px 8px' }} title="Zoom In">🔍+</button>
            <button onClick={() => setZoom(z => Math.max(1.1, z - 0.1))} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '4px 8px' }} title="Zoom Out">🔍-</button>
            <button onClick={() => setIsMuted(m => { const next = !m; if (next && window.speechSynthesis)
        window.speechSynthesis.cancel(); return next; })} style={{ background: 'none', border: 'none', color: isMuted ? '#f87171' : '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '4px 8px' }} title={isMuted ? "Unmute Voice" : "Mute Voice"}>
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>

          <style>{`
            @keyframes pulse-height {
              from { height: 6px; }
              to { height: 28px; }
            }
            .mic-wave-bar { transition: height 0.1s ease; }
          `}</style>
        </section>

        {/* Right Column: Chat Console */}
        <section style={{ display: 'flex', flexDirection: 'column', background: 'rgba(10, 15, 26, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', minHeight: 0 }}>
          
          {/* Chat Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: animState === 'talking' ? '#10b981' : '#6366f1', animation: animState === 'talking' ? 'ping 1.5s infinite' : 'none' }}/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Ms. Priya</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{animState === 'talking' ? 'Speaking...' : animState === 'listening' ? 'Listening...' : animState === 'thinking' ? 'Analyzing...' : 'Online'}</div>
            </div>
          </div>

          {/* Chat Body */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (<div key={m.id} style={{ display: 'flex', justifyContent: isAi ? 'flex-start' : 'flex-end', animation: 'fadeInUp 0.3s ease forwards' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    background: isAi ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    border: isAi ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    color: '#f8fafc',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    boxShadow: isAi ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}>
                    {m.text}
                  </div>
                </div>);
        })}
            <div ref={messagesEndRef}/>
          </div>

          {/* Chat Controls / Input Area */}
          <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            {/* Quick Option Selection Chips */}
            {getOptionsForStep().length > 0 && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, animation: 'fadeIn 0.4s ease' }}>
                {getOptionsForStep().map((opt) => (<button key={opt} onClick={() => handleOptionClick(opt)} style={{
                    background: 'rgba(79, 70, 229, 0.08)',
                    border: '1px solid rgba(79, 70, 229, 0.22)',
                    borderRadius: 12,
                    padding: '8px 14px',
                    color: '#a5b4fc',
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }} onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.22)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}>
                    {opt}
                  </button>))}
              </div>)}

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleUserAnswer(userInput); }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button" onClick={startVoiceListening} style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: recognizing ? '#dc2626' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${recognizing ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            color: recognizing ? '#fff' : '#94a3b8',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: recognizing ? '0 0 12px rgba(220,38,38,0.4)' : 'none'
        }} title={recognizing ? "Stop Voice Input" : "Start Voice Input"}>
                🎤
              </button>
              <input type="text" placeholder="Type your reply here..." value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={currentStep >= 3} style={{
            flex: 1,
            height: 42,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '0 16px',
            color: '#f8fafc',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.2s'
        }} onFocus={(e) => e.target.style.borderColor = 'var(--accent)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}/>
              <button type="submit" disabled={!userInput.trim() || currentStep >= 3} style={{
            height: 42,
            padding: '0 20px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            opacity: (!userInput.trim() || currentStep >= 3) ? 0.5 : 1,
            transition: 'all 0.15s',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
        }}>
                Send
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Syncing Progress Overlay */}
      {syncing && (<div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(3,5,8,0.92)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.3s ease forwards'
            }}>
          {/* Glowing Ring */}
          <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(79,70,229,0.1)' }}/>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: 'var(--accent)', animation: 'spin 1.2s linear infinite' }}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
              {syncProgress}%
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#f8fafc', marginBottom: 8, letterSpacing: '-0.5px' }}>
            Orchestrating Trajectory OS
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-mono)', textAlign: 'center', maxWidth: 400 }}>
            {syncStatus}
          </p>

          <div style={{ width: 300, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 20 }}>
            <div style={{ width: `${syncProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 2, transition: 'width 0.2s ease' }}/>
          </div>
        </div>)}

      {/* Keyframe Styling injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }}/>
    </div>);
}
