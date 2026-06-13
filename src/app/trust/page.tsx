'use client';
import { api } from '@/lib/api/client';
import { useState } from 'react';
import { useTrustScore } from '@/lib/api/hooks';

interface Breakdown { missionAuthenticity:number; examIntegrity:number; behavioralConsistency:number; overall:number; }
interface Signal { documents?:Array<{hash:string;docType:string;timestamp:string}>; speakingMetrics?:unknown[]; loginPattern?:unknown[]; }

export default function TrustPage() {
  const [evaluating, setEvaluating] = useState(false);
  const { data: trustData, isLoading: loading, refetch } = useTrustScore();
  const score     = (trustData as any)?.score     || 0;
  const breakdown = (trustData as any)?.breakdown || null;
  const signals   = (trustData as any)?.signals   || null;

  async function recalculate() { setEvaluating(true); await api.post('/api/trust/evaluate', {}); await refetch(); setEvaluating(false); }

  const pct   = Math.round(score);
  const color = pct>=70?'var(--green)':pct>=40?'var(--amber)':'var(--coral)';
  const tier  = pct>=80?'High Trust':pct>=60?'Trusted':pct>=40?'Building Trust':'Low Trust';
  const tierBadge = pct>=80?'badge-green':pct>=60?'badge-teal':pct>=40?'badge-amber':'badge-coral';

  const SIGNALS = [
    { label:'Mission Proofs',     value: breakdown?.missionAuthenticity||0,  color:'var(--accent)', weight:'30%' },
    { label:'Exam Integrity',     value: breakdown?.examIntegrity||0,         color:'var(--blue)',   weight:'15%' },
    { label:'Behavioral Pattern', value: breakdown?.behavioralConsistency||0, color:'var(--purple)', weight:'20%' },
    { label:'Study Engagement',   value: ((breakdown as any)?.studyEngage||50), color:'var(--teal)', weight:'15%' },
    { label:'Sentinel Verified',  value: ((breakdown as any)?.sentinelVerif||70), color:'var(--pink)', weight:'10%' },
  ];

  const ACTIONS = [
    { action:'Complete daily missions with detailed proof', impact:'+2–5 pts / mission' },
    { action:'Keep exam tab switches to zero',              impact:'+3 pts / clean exam' },
    { action:'Upload vault items with org verification',    impact:'+3–8 pts / item' },
    { action:'Maintain 7+ day mission streak',             impact:'+5 pts' },
    { action:'Fingerprint documents with Sentinel',        impact:'+2 pts / doc' },
    { action:'Complete 10+ study sessions',                impact:'+4 pts' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }} className="animate-fade-in">

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-hero-title">🛡 Trust Engine</h1>
            <p className="page-hero-sub">Multi-layer authenticity verification. Recruiters see this score first — it signals integrity beyond grades.</p>
          </div>
          <button onClick={recalculate} disabled={evaluating}
            className={evaluating ? 'btn-ghost btn-sm' : 'btn-primary btn-sm'}
            style={{ flexShrink: 0 }}>
            {evaluating ? '⟳ Recalculating...' : '⟳ Recalculate Now'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding: 80, color:'var(--t3)' }}>
          <div style={{ fontSize: 32, animation: 'spin 1s linear infinite', marginBottom: 12 }}>⚙</div>
          Loading trust data...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Big score hero */}
          <div style={{
            border: `1px solid ${color}30`,
            borderRadius: 20,
            padding: '36px 32px',
            textAlign: 'center',
            background: `radial-gradient(ellipse at 50% 0%, ${color}10 0%, transparent 65%), var(--bg2)`,
            boxShadow: 'var(--shadow-md)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${color}08, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 14 }}>Trust Score</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 100, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-4px', marginBottom: 8 }}>{pct}</div>
            <span className={`badge ${tierBadge}`} style={{ fontSize: 12, padding: '4px 14px' }}>{tier}</span>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 6, width: 240, margin: '20px auto 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 6, transition: 'width 1.2s ease', boxShadow: `0 0 12px ${color}50` }} />
            </div>
          </div>

          {/* Signal breakdown + Actions grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Signal breakdown */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 18 }}>Score Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {SIGNALS.map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500 }}>{s.label}</span>
                        <span style={{ fontSize: 9.5, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>w:{s.weight}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', color: s.color, fontWeight: 700, fontSize: 12 }}>{s.value}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 3, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to improve */}
            <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--accent)', marginBottom: 14 }}>→ How to Improve</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ACTIONS.map((a, i) => (
                  <div key={i} className="action-item" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <span className="action-item-arrow">→</span>
                    <div>
                      <div className="action-item-title">{a.action}</div>
                      <div className="action-item-impact">{a.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Behavioral signals */}
          {signals && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 16 }}>Behavioral Signals</div>
              <div className="metric-grid" style={{ margin: 0 }}>
                {[
                  { label:'Documents Fingerprinted', value:(signals.documents||[]).length, color:'var(--pink)',   icon:'📄' },
                  { label:'Speaking Sessions',        value:(signals.speakingMetrics||[]).length, color:'var(--blue)', icon:'🎙' },
                  { label:'Login Events',             value:(signals.loginPattern||[]).length, color:'var(--teal)', icon:'🔑' },
                ].map(s => (
                  <div key={s.label} className="metric-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                    <div className="metric-value" style={{ color: s.color, fontSize: 32 }}>{s.value}</div>
                    <div className="metric-label" style={{ marginBottom: 0 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
