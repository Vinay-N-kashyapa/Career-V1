// apps/web/src/components/learn/ChatInterface.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Props {
  sessionId:     string;
  teacherId:     string;
  mode:          string;
  noteIds:       string[];
  careerContext: Record<string, unknown> | null;
  userId?:       string;
}

const TEACHER_NAMES: Record<string, string> = {
  priya:'Ms. Priya', aisha:'Ms. Aisha', rohan:'Mr. Rohan', vikram:'Mr. Vikram',
};
const TEACHER_EMOJIS: Record<string, string> = {
  priya:'👩‍💼', aisha:'👩‍🏫', rohan:'👨‍💻', vikram:'👨‍⚖️',
};

export default function ChatInterface({ sessionId, teacherId, mode, noteIds, careerContext, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef   = useRef<HTMLAudioElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);

  // Load existing history
  useEffect(() => {
    fetch(`/api/chat/history/${sessionId}`, { credentials:'include' })
      .then(r => r.json())
      .then(({ messages: m }) => {
        if (m?.length) setMessages(m);
        else {
          // Opening message
          setMessages([{
            role:    'assistant',
            content: `Hi! I'm ${TEACHER_NAMES[teacherId] || 'your teacher'}. Ready to help you study in ${mode} mode. ${noteIds.length ? `I can see your ${noteIds.length} note(s). What would you like to explore?` : 'Upload notes from the sidebar to get started!'}`,
          }]);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', content:msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        credentials:'include',
        body: JSON.stringify({
          message:       msg,
          teacherId,
          mode,
          noteIds,
          sessionId,
          careerContext,
        }),
      });
      const { reply } = await res.json();
      setMessages(prev => [...prev, { role:'assistant', content:reply }]);

      // TTS
      if (reply) {
        try {
          const ttsRes = await fetch('/api/tts', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            credentials:'include',
            body: JSON.stringify({ text: reply.slice(0, 350), teacherId }),
          });
          if (ttsRes.ok) {
            const blob = await ttsRes.blob();
            const url  = URL.createObjectURL(blob);
            if (audioRef.current) {
              audioRef.current.src = url;
              setSpeaking(true);
              audioRef.current.play().catch(() => {});
              audioRef.current.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
            }
          }
        } catch {}
      }
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:"Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, teacherId, mode, noteIds, sessionId, careerContext]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 180px)', background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{ fontSize:22 }}>{TEACHER_EMOJIS[teacherId] || '👩‍🏫'}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700 }}>{TEACHER_NAMES[teacherId] || 'Teacher'}</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>{mode} mode {speaking ? '🔊' : ''}</div>
        </div>
        {careerContext && (
          <div style={{ marginLeft:'auto', fontSize:10, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>
            ATS: {(careerContext as {ats_score?:number}).ats_score || 0}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', gap:8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <span style={{ fontSize:18, flexShrink:0, marginTop:2 }}>{TEACHER_EMOJIS[teacherId] || '👩‍🏫'}</span>
            )}
            <div style={{
              maxWidth:'80%', padding:'10px 14px', borderRadius:10,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
              color: m.role === 'user' ? 'white' : 'var(--t1)',
              fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontSize:18 }}>{TEACHER_EMOJIS[teacherId] || '👩‍🏫'}</span>
            <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:10, display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--t3)', display:'inline-block', animation:`pulse 1.2s ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexShrink:0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Ask ${TEACHER_NAMES[teacherId] || 'teacher'}...`}
          disabled={loading}
          style={{
            flex:1, background:'var(--bg3)', border:'1px solid var(--border)',
            borderRadius:8, padding:'9px 14px', color:'var(--t1)',
            fontSize:13, fontFamily:'var(--font-body)', outline:'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ flexShrink:0 }}
        >
          →
        </button>
      </div>
      <audio ref={audioRef} style={{ display:'none' }} />
    </div>
  );
}
