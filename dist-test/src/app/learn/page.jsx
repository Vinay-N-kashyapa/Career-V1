'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LearnPage;
const react_1 = require("react");
const react_2 = require("react");
const navigation_1 = require("next/navigation");
const useAuth_1 = require("@/lib/hooks/useAuth");
const useCareerProfile_1 = require("@/lib/hooks/useCareerProfile");
const TeacherSelector_1 = __importDefault(require("@/components/learn/TeacherSelector"));
const NotesList_1 = __importDefault(require("@/components/learn/NotesList"));
const ChatInterface_1 = __importDefault(require("@/components/learn/ChatInterface"));
const ModeSelector_1 = __importDefault(require("@/components/learn/ModeSelector"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
function LearnInner() {
    const { user } = (0, useAuth_1.useAuth)();
    const { profile, refresh } = (0, useCareerProfile_1.useCareerProfile)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const router = (0, navigation_1.useRouter)();
    const missionId = searchParams.get('mission');
    const suggestedTopic = searchParams.get('topic');
    const { earnPins: learnEarnPins } = (0, CareerOSContext_1.useCareerOS)();
    const [session, setSession] = (0, react_2.useState)(null);
    const [teacherId, setTeacherId] = (0, react_2.useState)(user?.selectedTeacherId || 'priya');
    const [selectedNotes, setSelectedNotes] = (0, react_2.useState)([]);
    const [mode, setMode] = (0, react_2.useState)('explain');
    const [started, setStarted] = (0, react_2.useState)(false);
    const [sessionScore, setSessionScore] = (0, react_2.useState)(null);
    const atsGapTopics = profile?.weak_areas?.slice(0, 4) || [];
    async function startSession() {
        const res = await fetch('/api/chat/session', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ teacherId, mode, noteIds: selectedNotes, studentName: user?.displayName, sourceMissionId: missionId }),
        });
        const { sessionId } = await res.json();
        setSession(sessionId);
        setStarted(true);
        learnEarnPins('study_session', 5, 'Study session started');
    }
    async function endSession(score) {
        if (session) {
            await fetch('/api/study/complete', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sessionId: session, score: score || sessionScore, topic: suggestedTopic, teacherId, durationMinutes: 20 }),
            });
        }
        setStarted(false);
        setSession(null);
        setSessionScore(null);
        refresh();
    }
    if (!started) {
        return (<div style={{ maxWidth: 760, margin: '0 auto' }} className="animate-fade-in">
        <div className="page-header">
          <h1>EduTeach AI</h1>
          <p>AI-powered study sessions that improve your Career DNA and ATS scores</p>
        </div>

        {atsGapTopics.length > 0 && (<div style={{ background: 'var(--accent-light)', border: '1px solid #c7d2fe', borderRadius: 'var(--radius-xl)', padding: '14px 18px', marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              📊 Your ATS gaps — suggested study topics:
            </p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {atsGapTopics.map((topic) => (<button key={topic} onClick={() => router.push(`/learn?topic=${encodeURIComponent(topic)}`)} style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid #c7d2fe', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                  {topic}
                </button>))}
            </div>
          </div>)}

        {missionId && (<div className="alert alert-accent" style={{ marginBottom: 16 }}>
            🎯 This session is linked to your active mission. Completion updates your trust score.
          </div>)}

        {suggestedTopic && (<div className="alert alert-info" style={{ marginBottom: 16 }}>
            📚 Studying: <strong>{suggestedTopic}</strong> — selected from your ATS gaps
          </div>)}

        <TeacherSelector_1.default value={teacherId} onChange={setTeacherId}/>
        <ModeSelector_1.default value={mode} onChange={setMode}/>
        <NotesList_1.default selected={selectedNotes} onSelect={setSelectedNotes}/>

        <button onClick={startSession} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 14, marginTop: 16 }}>
          Start Learning Session →
        </button>
      </div>);
    }
    return (<div className="animate-fade-in">
      <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14, padding: '10px 16px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', fontSize: 12,
        }}>
        <span style={{ color: 'var(--t2)' }}>
          📚 {teacherId === 'priya' ? 'Ms. Priya' : teacherId} · {mode}
          {suggestedTopic ? ` · ${suggestedTopic}` : ''}
          {missionId ? ' · 🎯 Mission Linked' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {profile?.ats_score !== undefined && (<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>
              ATS: {profile.ats_score}/100
            </span>)}
          <button onClick={() => endSession()} className="btn-ghost btn-sm">End Session →</button>
          <button onClick={() => {
            // Export chat session as .txt (master plan requirement)
            const chatEl = document.querySelector('[data-chat-messages]');
            const msgs = chatEl ? chatEl.textContent : 'No chat content';
            const blob = new Blob([`PinIT EduTeach Session Export\n${new Date().toLocaleString()}\nTopic: ${suggestedTopic || 'General'}\nTeacher: ${teacherId}\n\n${'='.repeat(50)}\n\n${msgs}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pinit-study-${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }} className="btn-ghost btn-sm" title="Export session as .txt">
            ↓ Export
          </button>
        </div>
      </div>
      <ChatInterface_1.default sessionId={session} teacherId={teacherId} mode={mode} noteIds={selectedNotes} careerContext={profile ? { weak_areas: profile.weak_areas, ats_score: profile.ats_score, mission_topics: suggestedTopic ? [suggestedTopic] : [] } : null} userId={user?.id}/>
    </div>);
}
function LearnPage() {
    return (<react_1.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading...</div>}>
      <LearnInner />
    </react_1.Suspense>);
}
