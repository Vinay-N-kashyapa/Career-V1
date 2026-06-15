'use client';
import { api } from '@/lib/api/client';
import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth }          from '@/lib/hooks/useAuth';
import { useCareerProfile } from '@/lib/hooks/useCareerProfile';
import TeacherSelector      from '@/components/learn/TeacherSelector';
import NotesList            from '@/components/learn/NotesList';
import ChatInterface        from '@/components/learn/ChatInterface';
import ModeSelector         from '@/components/learn/ModeSelector';

import PinsGate from '@/components/pins/PinsGate';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import PinsEarnNotice from '@/components/pins/PinsEarnNotice';

function LearnInner() {
  const { user }          = useAuth();
  const { profile, refresh } = useCareerProfile();
  const searchParams      = useSearchParams();
  const router            = useRouter();
  const missionId         = searchParams.get('mission');
  const suggestedTopic    = searchParams.get('topic');

  const { earnPins: learnEarnPins } = useCareerOS();
  const [session,       setSession]       = useState<string|null>(null);
  const [teacherId,     setTeacherId]     = useState(user?.selectedTeacherId||'priya');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [mode,          setMode]          = useState('explain');
  const [started,       setStarted]       = useState(false);
  const [sessionScore,  setSessionScore]  = useState<number|null>(null);

  const atsGapTopics = profile?.weak_areas?.slice(0,4)||[];

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

  async function endSession(score?: number) {
    if (session) {
      await fetch('/api/study/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: session, score: score||sessionScore, topic: suggestedTopic, teacherId, durationMinutes: 20 }),
      });
    }
    setStarted(false);
    setSession(null);
    setSessionScore(null);
    refresh();
  }

  if (!started) {
    return (
      <div style={{ maxWidth:760, margin:'0 auto' }} className="animate-fade-in">
        <div className="page-header">
          <h1>EduTeach AI</h1>
          <p>AI-powered study sessions that improve your Career DNA and ATS scores</p>
        </div>

        {atsGapTopics.length > 0 && (
          <div style={{ background:'var(--accent-light)', border:'1px solid #c7d2fe', borderRadius:'var(--radius-xl)', padding:'14px 18px', marginBottom:18 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'var(--accent)', marginBottom:9, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.8px' }}>
              📊 Your ATS gaps — suggested study topics:
            </p>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {atsGapTopics.map((topic: string) => (
                <button key={topic} onClick={() => router.push(`/learn?topic=${encodeURIComponent(topic)}`)}
                  style={{ padding:'4px 12px', borderRadius:8, background:'var(--bg2)', border:'1px solid #c7d2fe', color:'var(--accent)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-mono)' }}>
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {missionId && (
          <div className="alert alert-accent" style={{ marginBottom:16 }}>
            🎯 This session is linked to your active mission. Completion updates your trust score.
          </div>
        )}

        {suggestedTopic && (
          <div className="alert alert-info" style={{ marginBottom:16 }}>
            📚 Studying: <strong>{suggestedTopic}</strong> — selected from your ATS gaps
          </div>
        )}

        <TeacherSelector value={teacherId} onChange={setTeacherId} />
        <ModeSelector    value={mode}      onChange={setMode}      />
        <NotesList selected={selectedNotes} onSelect={setSelectedNotes} />

        <button onClick={startSession} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px 18px', fontSize:14, marginTop:16 }}>
          Start Learning Session →
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:14, padding:'10px 16px',
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-lg)', fontSize:12,
      }}>
        <span style={{ color:'var(--t2)' }}>
          📚 {teacherId==='priya'?'Ms. Priya':teacherId} · {mode}
          {suggestedTopic ? ` · ${suggestedTopic}` : ''}
          {missionId ? ' · 🎯 Mission Linked' : ''}
        </span>
        <div style={{ display:'flex', gap:8 }}>
          {profile?.ats_score !== undefined && (
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--teal)', fontWeight:600 }}>
              ATS: {profile.ats_score}/100
            </span>
          )}
          <button onClick={() => endSession()} className="btn-ghost btn-sm">End Session →</button>
          <button
            onClick={() => {
              // Export chat session as .txt (master plan requirement)
              const chatEl = document.querySelector('[data-chat-messages]');
              const msgs   = chatEl ? chatEl.textContent : 'No chat content';
              const blob   = new Blob([`PinIT EduTeach Session Export\n${new Date().toLocaleString()}\nTopic: ${suggestedTopic || 'General'}\nTeacher: ${teacherId}\n\n${'='.repeat(50)}\n\n${msgs}`], { type:'text/plain' });
              const url    = URL.createObjectURL(blob);
              const a      = document.createElement('a');
              a.href = url; a.download = `pinit-study-${Date.now()}.txt`;
              a.click(); URL.revokeObjectURL(url);
            }}
            className="btn-ghost btn-sm"
            title="Export session as .txt"
          >
            ↓ Export
          </button>
        </div>
      </div>
      <ChatInterface
        sessionId={session!} teacherId={teacherId} mode={mode}
        noteIds={selectedNotes}
        careerContext={profile ? { weak_areas: profile.weak_areas, ats_score: profile.ats_score, mission_topics: suggestedTopic ? [suggestedTopic] : [] } : null}
        userId={user?.id}
      />
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading...</div>}>
      <LearnInner />
    </Suspense>
  );
}
