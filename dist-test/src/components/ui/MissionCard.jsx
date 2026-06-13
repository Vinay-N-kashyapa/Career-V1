'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MissionCard;
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const TYPE_META = {
    communication: { color: '#6366f1', light: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', icon: '🎙', label: 'Communication' },
    skill: { color: '#0ea5e9', light: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.25)', icon: '⚡', label: 'Skill' },
    personality: { color: '#a855f7', light: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', icon: '🧠', label: 'Personality' },
};
const STATUS_CONFIG = {
    completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
    failed: { label: 'Try Again', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
    submitted: { label: 'Reviewing', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
    pending: { label: 'Pending', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', dot: '#6366f1' },
};
function MissionCard({ mission, onComplete }) {
    const cOS = (0, CareerOSContext_1.useCareerOS)();
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const [proof, setProof] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [localStatus, setLocalStatus] = (0, react_1.useState)(mission.status);
    const [hovered, setHovered] = (0, react_1.useState)(false);
    const meta = TYPE_META[mission.type] || TYPE_META.skill;
    const status = STATUS_CONFIG[localStatus] || STATUS_CONFIG.pending;
    const isDone = localStatus === 'completed' || localStatus === 'failed' || localStatus === 'submitted';
    async function submit() {
        if (!proof.trim())
            return;
        setLoading(true);
        try {
            await client_1.api.post('/api/missions/submit', {
                missionId: mission.id,
                textSubmission: proof,
                proofType: 'text',
                proofText: proof
            });
        }
        catch (e) {
            console.warn("API Submission failed, using CareerOS local state logic.");
        }
        finally {
            // Mark as completed in CareerOSContext dynamically
            setLocalStatus('completed');
            setExpanded(false);
            setLoading(false);
            cOS.completeMission(mission.id);
            // earnPins already handled inside completeMission()
            onComplete();
        }
    }
    return (<div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
            background: isDone ? 'var(--bg2)' : hovered ? 'var(--bg3)' : 'var(--bg2)',
            border: `1px solid ${hovered && !isDone ? meta.border : 'var(--border)'}`,
            borderLeft: `3px solid ${meta.color}`,
            borderRadius: 12,
            padding: '12px 14px',
            transition: 'all 0.18s ease',
            opacity: isDone ? 0.7 : 1
        }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', background: meta.light, color: meta.color, border: `1px solid ${meta.border}`, padding: '2px 8px', borderRadius: 5 }}>
          {meta.icon} {meta.label}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, background: status.bg, color: status.color, padding: '2px 8px', borderRadius: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot }}/>
          {status.label}
        </span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 4, lineHeight: 1.35, fontFamily: 'var(--font-display)', letterSpacing: '-0.2px' }}>
        {mission.title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {mission.description}
      </div>
      
      {mission.source_weakness && (<div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--t4)', fontWeight: 700 }}>Targets: </span>
          <span style={{ background: 'var(--bg3)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--t2)', fontWeight: 600 }}>
            {mission.source_weakness}
          </span>
        </div>)}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '2px 8px', borderRadius: 5 }}>
          +{mission.trust_reward} trust
        </span>
        {mission.estimated_minutes && <span style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>~{mission.estimated_minutes}m</span>}
        {mission.learn_url && !isDone && (<a href={mission.learn_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '2px 8px', background: 'rgba(79,70,229,0.08)', borderRadius: 5, border: '1px solid rgba(99,102,241,0.2)' }}>
            📚 Study
          </a>)}
        {!isDone && (<button onClick={() => setExpanded(e => !e)} style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '5px 14px',
                borderRadius: 8,
                border: 'none',
                background: expanded ? 'var(--bg3)' : meta.color,
                color: expanded ? 'var(--t2)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s'
            }}>
            {expanded ? '✕ Cancel' : '→ Submit Proof'}
          </button>)}
      </div>

      {(localStatus === 'completed' || localStatus === 'failed') && mission.ai_evaluation?.feedback && (<div style={{ marginTop: 10, padding: '10px 12px', background: localStatus === 'completed' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${localStatus === 'completed' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 8, fontSize: 12, lineHeight: 1.55, color: localStatus === 'completed' ? '#22c55e' : '#ef4444' }}>
          <span style={{ fontWeight: 800 }}>{localStatus === 'completed' ? '✓ ' : '✗ '}</span>
          {mission.ai_evaluation.feedback}
          {mission.ai_evaluation.score && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>· {mission.ai_evaluation.score}/100</span>}
        </div>)}

      {expanded && !isDone && (<div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
            Your Proof
          </label>
          <textarea value={proof} onChange={e => setProof(e.target.value)} placeholder="Describe what you did, what you learned, or paste your work here…" rows={4} style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--t1)', fontSize: 12.5, outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}/>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setExpanded(false)} style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--t2)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={submit} disabled={loading || !proof.trim()} style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '6px 16px',
                borderRadius: 7,
                border: 'none',
                background: proof.trim() ? meta.color : 'var(--bg3)',
                color: proof.trim() ? 'white' : 'var(--t4)',
                cursor: proof.trim() ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s'
            }}>
              {loading ? '⏳ Submitting…' : 'Submit for AI Review →'}
            </button>
          </div>
        </div>)}
    </div>);
}
