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
exports.default = InterviewPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const dynamic_1 = __importDefault(require("next/dynamic"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AuthContext_1 = require("@/lib/context/AuthContext");
const tts_1 = require("@/lib/tts");
// Dynamic import of the avatar widget to avoid SSR canvas initialization problems
const VRoidInterviewAvatar = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('@/components/avatar/VRoidInterviewAvatar'))), { ssr: false });
function InterviewPage() {
    const cOS = (0, CareerOSContext_1.useCareerOS)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { javaTestPassed, setJavaTestPassed, earnPins, addXp } = cOS;
    const teacherId = user?.selectedTeacherId || 'priya';
    const teacher = {
        priya: { name: 'Ms. Priya', emoji: '👩‍💼', color: '#ec4899', voice: 'Google UK English Female' },
        aisha: { name: 'Ms. Aisha', emoji: '👩‍🏫', color: '#6366f1', voice: 'Google UK English Female' },
        rohan: { name: 'Mr. Rohan', emoji: '👨‍💻', color: '#f97316', voice: 'Google UK English Male' },
        vikram: { name: 'Mr. Vikram', emoji: '👨‍⚖️', color: '#10b981', voice: 'Google UK English Male' },
    }[teacherId] || { name: 'Ms. Priya', emoji: '👩‍💼', color: '#ec4899', voice: 'Google UK English Female' };
    // States
    const [code, setCode] = (0, react_1.useState)(`public class Solution {\n    public boolean verifySorted(int[] arr) {\n        // Write your sorting validation code here\n        \n    }\n}`);
    const [output, setOutput] = (0, react_1.useState)(null);
    // Conversational Interview States
    const [interviewStage, setInterviewStage] = (0, react_1.useState)('welcome');
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    const [animState, setAnimState] = (0, react_1.useState)('idle');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showHint, setShowHint] = (0, react_1.useState)(false);
    const [zoom, setZoom] = (0, react_1.useState)(1.6);
    // Speech synthesis & recognition refs/states
    const [speaking, setSpeaking] = (0, react_1.useState)(false);
    const [recognizing, setRecognizing] = (0, react_1.useState)(false);
    const recognitionRef = (0, react_1.useRef)(null);
    const bottomRef = (0, react_1.useRef)(null);
    // Auto-scroll chat
    (0, react_1.useEffect)(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Sync avatar dialog messages with user state on load
    (0, react_1.useEffect)(() => {
        let initialGreeting = '';
        if (javaTestPassed) {
            initialGreeting = "Congratulations! You passed the technical assessment and unlocked your Career Twin, Sentinel security portal, and Career DNA readiness index. Your portfolio is now visible to active SDE recruiters!";
            setInterviewStage('completed');
        }
        else {
            initialGreeting = `Hello! I am ${teacher.name}, your SDE evaluator. Today, I'll test your core Java array manipulation and logic. Let me know when you are ready to begin, or ask me any questions!`;
            setInterviewStage('welcome');
        }
        setMessages([
            { role: 'assistant', content: initialGreeting }
        ]);
    }, [javaTestPassed, teacherId]);
    // Stop speaking on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            (0, tts_1.stopSpeaking)();
        };
    }, []);
    // TTS Speech Synthesis Fallback / Audio Player
    const speakReply = (text) => {
        (0, tts_1.speakWithAvatar)(text, teacherId, () => {
            setSpeaking(true);
            setAnimState('talking');
        }, () => {
            setSpeaking(false);
            setAnimState('idle');
        });
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
                handleSendMessage(transcript);
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
    // Conversational response dispatcher (Llama API with local rule fallback)
    const getInterviewerResponse = async (userMsg, stage, history) => {
        const key = globalThis.__GROQ_KEY__ || process.env.NEXT_PUBLIC_GROQ_API_KEY;
        if (key) {
            try {
                let stageContext = '';
                if (stage === 'welcome') {
                    stageContext = `Greet the candidate, introduce yourself as the SDE Technical Interviewer, and briefly introduce the coding task (verify sorted array). Answer any questions they have. Invite them to start coding. Keep it to 2-3 sentences.`;
                }
                else if (stage === 'coding') {
                    stageContext = `The candidate is currently writing code. If they ask questions or need help, explain the logic or give a hint, but don't write the code for them. Keep it brief.`;
                }
                else if (stage === 'complexity') {
                    stageContext = `The candidate has passed the coding tests. You asked them to explain the time and space complexity. Evaluate their answer. If they are correct (which should be O(N) time and O(1) space), praise them and ask a follow-up: 'How would you adapt the algorithm to check for non-increasing (descending) order?'. If incorrect, guide them gently. Max 3 sentences.`;
                }
                else if (stage === 'scenario') {
                    stageContext = `You asked how to adapt the algorithm for descending order. Evaluate their answer (they should suggest swapping the comparison check to arr[i] < arr[i+1]). Give brief positive feedback and state that the interview is successfully completed.`;
                }
                const systemPrompt = `You are ${teacher.name}, a helpful and professional SDE Technical Interviewer. ${stageContext} Be direct, conversational, and encouraging. Max 3 sentences.`;
                const apiMessages = [
                    { role: 'system', content: systemPrompt },
                    ...history.slice(-4),
                    { role: 'user', content: userMsg }
                ];
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
                    body: JSON.stringify({
                        model: 'llama-3.1-8b-instant',
                        max_tokens: 220,
                        temperature: 0.7,
                        messages: apiMessages
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.choices?.[0]?.message?.content || '';
                }
            }
            catch (e) {
                console.warn("Groq fetch failed, falling back to rule-based engine", e);
            }
        }
        // Rule-based deterministic engine fallback
        const cleaned = userMsg.toLowerCase();
        if (stage === 'welcome') {
            if (cleaned.includes('start') || cleaned.includes('ready') || cleaned.includes('begin') || cleaned.includes('code')) {
                setInterviewStage('coding');
                return `Excellent! Let's get started. Look at the Java IDE on the left. Write the verifySorted method to check if the array is sorted, then click 'Run Test Suite' to run the verification tests. Let me know if you need any guidance!`;
            }
            return `I am here to test your algorithmic and Java logic. We'll start with the array sorting checker. Let me know when you are ready to begin, or if you have any questions!`;
        }
        if (stage === 'coding') {
            if (cleaned.includes('hint') || cleaned.includes('help') || cleaned.includes('clue') || cleaned.includes('how')) {
                return `Sure! The idea is to loop through the array and compare adjacent elements. If you find any element that is greater than the next element, you can immediately return false. If the loop completes, return true.`;
            }
            return `Take your time. Write the logic inside the verifySorted method in the editor, and click 'Run Test Suite' when you are ready to submit!`;
        }
        if (stage === 'complexity') {
            const hasTime = cleaned.includes('o(n)') || cleaned.includes('linear') || cleaned.includes('on') || cleaned.includes('single pass');
            const hasSpace = cleaned.includes('o(1)') || cleaned.includes('constant') || cleaned.includes('o1');
            setInterviewStage('scenario');
            if (hasTime && hasSpace) {
                return `Spot on! Time complexity is O(N) since we make a single pass, and space is O(1) as we perform comparisons in-place. For the next step: how would you modify the code to check if the array is sorted in descending (non-increasing) order instead?`;
            }
            else if (hasTime) {
                return `Exactly, the time complexity is O(N) because we iterate through the array. What about the space complexity? Are we using any extra space, or is it constant O(1)? And how would you adapt this for descending order?`;
            }
            else {
                return `Good attempt. Since we loop through the array once, it takes O(N) linear time, and O(1) constant space since we do it in-place. Moving on: how would you adapt the comparison to check for a descending sorted array instead?`;
            }
        }
        if (stage === 'scenario') {
            const hasCheck = cleaned.includes('<') || cleaned.includes('less') || cleaned.includes('reverse') || cleaned.includes('greater') || cleaned.includes('invert');
            setInterviewStage('completed');
            // Award XP & Pins on complete
            setJavaTestPassed(true);
            earnPins('ai_interview');
            addXp(100, 'Passed SDE Code Interview');
            if (hasCheck) {
                return `Perfect! Yes, you simply change the comparison check (e.g., if arr[i] < arr[i+1], return false). You have successfully cleared the SDE Interview Assessment! I have unlocked your Career Twin and Sentinel portal. Fantastic work!`;
            }
            return `Correct, you'd change the comparison check to trigger when a preceding element is less than the succeeding element. Congratulations, you have passed this SDE evaluation! Your dashboard is now updated.`;
        }
        return `Got it. Let me know if you have any other questions as we complete the interview!`;
    };
    const handleSendMessage = async (textToSubmit) => {
        const msg = (textToSubmit ?? input).trim();
        if (!msg || loading)
            return;
        setInput('');
        const newMsgs = [...messages, { role: 'user', content: msg }];
        setMessages(newMsgs);
        setLoading(true);
        setAnimState('thinking');
        try {
            // Evaluate response based on current stage
            const reply = await getInterviewerResponse(msg, interviewStage, newMsgs);
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            setAnimState('nod');
            setTimeout(() => setAnimState('idle'), 2000);
            await speakReply(reply);
        }
        catch (err) {
            const errReply = "Connection error. Let me know your answer again.";
            setMessages(prev => [...prev, { role: 'assistant', content: errReply }]);
            setAnimState('shrug');
            setTimeout(() => setAnimState('idle'), 2000);
        }
        finally {
            setLoading(false);
        }
    };
    // Helper to start coding stage manually via button click
    const handleStartCoding = () => {
        setInterviewStage('coding');
        const introMsg = "Excellent! Let's get started. Look at the Java IDE on the left. Write the verifySorted method to check if the array is sorted, then click 'Run Test Suite' to run the verification tests. Let me know if you need any guidance!";
        setMessages(prev => [...prev, { role: 'assistant', content: introMsg }]);
        speakReply(introMsg);
    };
    // Helper to trigger Hint via avatar speaking
    const handleShowHint = () => {
        setShowHint(true);
        const hintMsg = "Here is a hint for you: Loop through the array from i = 0 to arr.length - 2. If arr[i] > arr[i + 1], return false. If the loop finishes without returning, return true.";
        setMessages(prev => [...prev, { role: 'assistant', content: hintMsg }]);
        speakReply(hintMsg);
    };
    // Java to JS Transpiler
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
    // Compile and run compiler mock sandbox
    const evaluateCode = () => {
        setLoading(true);
        setOutput(null);
        setAnimState('thinking');
        setTimeout(() => {
            try {
                const jsCode = javaToJsTranspiler(code);
                const evaluator = new Function(`
          ${jsCode}
          try {
            if (typeof verifySorted !== 'function') throw new Error("Method verifySorted(int[] arr) not found.");
            
            // Test 1: Empty or 1 element
            if (verifySorted([]) !== true) throw new Error("Failed: verifySorted([]) should return true");
            if (verifySorted([5]) !== true) throw new Error("Failed: verifySorted([5]) should return true");
            
            // Test 2: Sorted array
            if (verifySorted([1, 2, 3, 5, 8]) !== true) throw new Error("Failed: verifySorted([1, 2, 3, 5, 8]) should return true");
            
            // Test 3: Unsorted array
            if (verifySorted([1, 3, 2, 5]) !== false) throw new Error("Failed: verifySorted([1, 3, 2, 5]) should return false");
            
            // Test 4: Equal values
            if (verifySorted([2, 2, 3]) !== true) throw new Error("Failed: verifySorted([2, 2, 3]) should return true");
            
            return { success: true, message: "Verification Passed! All 5 SDE test cases cleared." };
          } catch (e) {
            return { success: false, message: e.message };
          }
        `);
                const res = evaluator();
                setOutput(res);
                if (res.success) {
                    const passMsg = "Perfect! Outstanding execution. All 5 SDE test cases cleared in our emulator environment. Now, let's proceed to the technical review. Could you explain the time and space complexity of your verifySorted implementation?";
                    setMessages(prev => [...prev, { role: 'assistant', content: passMsg }]);
                    setInterviewStage('complexity');
                    setAnimState('nod');
                    setTimeout(() => setAnimState('idle'), 2000);
                    speakReply(passMsg);
                }
                else {
                    const failMsg = `Oops! Some test cases failed in our JVM emulation environment: "${res.message}". Double check that you are comparing adjacent elements correctly (e.g. check if arr[i] > arr[i+1]).`;
                    setMessages(prev => [...prev, { role: 'assistant', content: failMsg }]);
                    setAnimState('shrug');
                    setTimeout(() => setAnimState('idle'), 2000);
                    speakReply(failMsg);
                }
            }
            catch (err) {
                setOutput({ success: false, message: 'Syntax or JVM emulation compiler error: ' + err.message });
                const compileErr = "Hmm, there's a syntax or compile-time error in your Java file structure. Make sure you close all brackets properly.";
                setMessages(prev => [...prev, { role: 'assistant', content: compileErr }]);
                setAnimState('shrug');
                setTimeout(() => setAnimState('idle'), 2000);
                speakReply(compileErr);
            }
            finally {
                setLoading(false);
            }
        }, 1200);
    };
    return (<div style={{ maxWidth: 1300, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>🎙 SDE AI Technical Interview</h1>
        <p>Complete the browser-based IDE challenges to demonstrate your algorithmic readiness to recruiters.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, height: 'calc(100vh - 200px)', minHeight: 600 }}>
        
        {/* Left Side: Browser Java IDE */}
        <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--font-display)' }}>
                Problem: Verify Array is Sorted
              </span>
              <button onClick={handleShowHint} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {showHint ? 'Hint Revealed 💡' : 'Show Hint 💡'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
              Write a method `verifySorted(int[] arr)` that returns `true` if the array is sorted in non-decreasing order, and `false` otherwise. An empty or single-element array is considered sorted.
            </p>
            {showHint && (<div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: 10, borderRadius: 8, marginTop: 10, fontSize: 11, color: 'var(--amber)', lineHeight: 1.4 }}>
                💡 <strong>Hint:</strong> Loop through the array from `i = 0` to `arr.length - 2`. If `arr[i] &gt; arr[i + 1]`, return `false`. If the loop finishes without returning, return `true`.
              </div>)}
          </div>

          {/* Code Textarea */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', border: '1px solid var(--border)', borderBottom: 'none', padding: '6px 12px', borderRadius: '10px 10px 0 0' }}>
              <span style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Solution.java (JVM Emulator Sandbox)</span>
              <span style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>JDK 21 Ready</span>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} disabled={loading || interviewStage === 'welcome' || interviewStage === 'completed'} style={{
            width: '100%',
            flex: 1,
            minHeight: 240,
            background: '#1e1e24',
            color: '#f8f8f2',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            padding: 14,
            border: '1px solid var(--border)',
            borderRadius: '0 0 10px 10px',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.6,
            opacity: (interviewStage === 'welcome' || interviewStage === 'completed') ? 0.6 : 1
        }}/>
          </div>

          {/* Test results output */}
          {output && (<div style={{
                background: output.success ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
                border: `1.5px solid ${output.success ? 'var(--green)' : 'var(--coral)'}`,
                padding: 12,
                borderRadius: 10,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: output.success ? 'var(--green)' : 'var(--coral)'
            }}>
              {output.success ? '🟢 JVM SUCCESS: ' : '🔴 JVM ERROR: '}
              {output.message}
            </div>)}

          {/* IDE actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={evaluateCode} disabled={loading || interviewStage !== 'coding'} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: 13 }}>
              {loading && interviewStage === 'coding' ? '⏳ Running JVM Tests...' : 'Run Test Suite 🚀'}
            </button>
            <button onClick={() => setCode(`public class Solution {\n    public boolean verifySorted(int[] arr) {\n        // Write your sorting validation code here\n        \n    }\n}`)} disabled={loading || interviewStage !== 'coding'} className="btn-ghost" style={{ padding: '11px 16px', fontSize: 13 }}>
              Reset Code
            </button>
          </div>
        </div>

        {/* Right Side: Inline 3D Humanoid Interviewer Viewport & Chat */}
        <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-md)',
        }}>
          {/* 3D Mentor Rendering Canvas Area - Rendering inline 3D Avatar */}
          <div style={{ height: 240, background: 'var(--bg3)', overflow: 'hidden', position: 'relative', borderBottom: '1px solid var(--border)' }}>
            <VRoidInterviewAvatar teacherId={teacherId} animState={animState} zoom={zoom}/>
            
            {/* Status badge overlays */}
            <div style={{
            position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
            padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)',
            color: animState === 'talking' ? '#a5b4fc' : animState === 'thinking' ? '#fde68a' : animState === 'listening' ? '#86efac' : '#888',
            backdropFilter: 'blur(4px)', fontFamily: 'var(--font-mono)'
        }}>
              {animState === 'talking' ? '🎙 Speaking' : animState === 'thinking' ? '💭 Thinking' : animState === 'listening' ? '👂 Listening' : '✓ Active'}
            </div>

            <div style={{
            position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700,
            padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)',
            color: '#fff', backdropFilter: 'blur(4px)', fontFamily: 'var(--font-mono)'
        }}>
              {teacher.emoji} {teacher.name}
            </div>

            {/* Camera Controls Panel */}
            <div style={{
            position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6,
            background: 'rgba(0, 0, 0, 0.6)', padding: '4px 8px', borderRadius: 12,
            backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 10
        }}>
              <button type="button" onClick={() => setZoom(prev => Math.max(1.0, prev - 0.2))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', padding: '2px 4px', fontWeight: 'bold' }} title="Zoom In">
                🔍+
              </button>
              <button type="button" onClick={() => setZoom(prev => Math.min(2.5, prev + 0.2))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', padding: '2px 4px', fontWeight: 'bold' }} title="Zoom Out">
                🔍-
              </button>
              <button type="button" onClick={() => setZoom(1.6)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', padding: '2px 4px', fontFamily: 'var(--font-mono)' }} title="Reset Camera">
                RESET
              </button>
            </div>
          </div>

          {/* Interactive Chat Conversation Pane */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
            
            {/* Scrollable Dialogue Message Box */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (<div key={i} style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: 8,
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                }}>
                    {!isUser && (<span style={{ fontSize: 18, marginTop: 4, flexShrink: 0 }}>
                        {teacher.emoji}
                      </span>)}
                    <div style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    background: isUser ? `linear-gradient(135deg, ${teacher.color} 0%, var(--purple) 100%)` : 'var(--bg3)',
                    color: '#ffffff',
                    border: isUser ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--border)',
                    boxShadow: isUser ? `0 4px 15px ${teacher.color}25` : 'var(--shadow-sm)',
                    whiteSpace: 'pre-wrap',
                }}>
                      <span style={{ color: isUser ? '#ffffff' : 'var(--t1)' }}>{m.content}</span>
                      {!isUser && (<button onClick={() => speakReply(m.content)} style={{
                        display: 'block',
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 10,
                        marginTop: 6,
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 700
                    }} title="Speak answer out loud">
                          🔊 Replay Audio
                        </button>)}
                    </div>
                  </div>);
        })}
              
              {loading && animState === 'thinking' && (<div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', alignItems: 'center', color: 'var(--t3)', fontSize: 12, paddingLeft: 26 }}>
                  <span>{teacher.emoji}</span>
                  <div style={{
                background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 16px', display: 'flex', gap: 4, alignItems: 'center'
            }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)', animation: 'pulse 1.2s infinite ease-in-out' }}></span>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)', animation: 'pulse 1.2s infinite ease-in-out 0.2s' }}></span>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)', animation: 'pulse 1.2s infinite ease-in-out 0.4s' }}></span>
                  </div>
                </div>)}
              
              <div ref={bottomRef}/>
            </div>

            {/* Stage Quick Actions / Next buttons */}
            {interviewStage === 'welcome' && (<div style={{ display: 'flex', padding: '10px 14px', background: 'var(--bg3)', borderTop: '1px solid var(--border)', gap: 10 }}>
                <button onClick={handleStartCoding} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}>
                  🚀 Start Coding Challenge
                </button>
              </div>)}

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{
            display: 'flex',
            gap: 8,
            padding: 10,
            borderTop: '1px solid var(--border)',
            background: 'var(--bg2)',
            alignItems: 'center',
        }}>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={interviewStage === 'completed'
            ? 'Assessment successfully cleared!'
            : interviewStage === 'coding'
                ? `Ask ${teacher.name} for a coding hint...`
                : `Type response to ${teacher.name}...`} style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'var(--bg3)',
            color: 'var(--t1)',
            fontSize: 12.5,
            outline: 'none',
        }} disabled={loading || interviewStage === 'welcome' || interviewStage === 'completed'}/>
              
              {/* Voice button */}
              <button type="button" onClick={startVoiceListening} disabled={loading || interviewStage === 'welcome' || interviewStage === 'completed'} style={{
            background: recognizing ? '#ef4444' : 'var(--bg3)',
            border: '1.5px solid var(--border)',
            borderRadius: '50%',
            width: 34,
            height: 34,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: recognizing ? '#ffffff' : 'var(--t1)',
            transition: 'all 0.15s'
        }} title={recognizing ? 'Stop voice recording' : 'Speak your answer'}>
                🎙
              </button>

              <button type="submit" disabled={!input.trim() || loading || interviewStage === 'welcome' || interviewStage === 'completed'} style={{
            background: input.trim() && !loading ? teacher.color : 'var(--bg3)',
            color: input.trim() && !loading ? '#ffffff' : 'var(--t3)',
            border: 'none',
            borderRadius: '50%',
            width: 34,
            height: 34,
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s',
            boxShadow: input.trim() && !loading ? `0 2px 8px ${teacher.color}40` : 'none',
        }}>
                ➔
              </button>
            </form>

            {/* Unlock actions if assessment passed */}
            {interviewStage === 'completed' && (<div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', gap: 10 }}>
                <link_1.default href="/career-twin" className="btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  Explore Career Twin 🧬
                </link_1.default>
                <link_1.default href="/sentinel" className="btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  Open Sentinel 🔐
                </link_1.default>
              </div>)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>);
}
