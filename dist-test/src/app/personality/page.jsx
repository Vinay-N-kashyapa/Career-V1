'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PersonalityPage;
const client_1 = require("@/lib/api/client");
const react_1 = require("react");
const PinsGate_1 = __importDefault(require("@/components/pins/PinsGate"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const PinsEarnNotice_1 = __importDefault(require("@/components/pins/PinsEarnNotice"));
const TRAIT_CONFIG = {
    confidence: { icon: '💪', color: 'var(--amber)', desc: 'Self-assurance in communication' },
    communication: { icon: '🎙️', color: 'var(--blue)', desc: 'Clarity and articulation' },
    leadership: { icon: '👑', color: 'var(--purple)', desc: 'Influence and team direction' },
    discipline: { icon: '⏰', color: 'var(--teal)', desc: 'Consistency and routine adherence' },
    empathy: { icon: '🤝', color: 'var(--pink)', desc: 'Understanding others\' perspectives' },
    adaptability: { icon: '🔄', color: 'var(--green)', desc: 'Flexibility under pressure' },
    professionalism: { icon: '💼', color: 'var(--accent)', desc: 'Workplace conduct and reliability' },
};
const CHALLENGES = [
    { type: 'pitch', label: '60-Second Pitch', icon: '🚀', desc: 'Sell yourself in under a minute' },
    { type: 'debate', label: 'Debate Challenge', icon: '⚡', desc: 'Argue a position confidently' },
    { type: 'introduce', label: 'Self Introduction', icon: '👋', desc: 'First impression, lasting impact' },
    { type: 'explain', label: 'Explain a Topic', icon: '📚', desc: 'Teach something you know well' },
    { type: 'leadership', label: 'Leadership Story', icon: '👑', desc: 'Share a moment you led others' },
];
function PersonalityPage() {
    const { earnPins } = (0, CareerOSContext_1.useCareerOS)();
    const [traits, setTraits] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [mode, setMode] = (0, react_1.useState)('report');
    const [challenge, setChallenge] = (0, react_1.useState)(null);
    const [response, setResponse] = (0, react_1.useState)('');
    const [analysis, setAnalysis] = (0, react_1.useState)(null);
    const [analyzing, setAnalyzing] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => { fetchReport(); }, []);
    async function fetchReport() {
        setLoading(true);
        const d = await client_1.api.get('/api/personality/report');
        setTraits(d.traits || {});
        setLoading(false);
    }
    async function getChallenge(type) {
        const d = await client_1.api.post('/api/personality/session', { challengeType: type });
        setChallenge(d);
        setMode('challenge');
        setResponse('');
        setAnalysis(null);
    }
    async function analyzeResponse() {
        if (!response.trim())
            return;
        setAnalyzing(true);
        try {
            const d = await client_1.api.post('/api/personality/analyze', { text: response, sessionType: 'speaking' });
            setAnalysis(d.analysis || null);
        }
        catch { }
        setAnalyzing(false);
        fetchReport();
    }
    if (loading)
        return (<div style={{ textAlign: 'center', padding: 80, color: 'var(--t3)' }}>
      <div style={{ fontSize: 32, animation: 'spin 1s linear infinite', marginBottom: 12 }}>🧠</div>
      Loading personality data...
    </div>);
    const topTrait = Object.entries(traits).sort((a, b) => b[1] - a[1])[0];
    const avgScore = Object.values(traits).length ? Math.round(Object.values(traits).reduce((a, b) => a + b, 0) / Object.values(traits).length) : 0;
    return (<div style={{ maxWidth: 980, margin: '0 auto' }} className="animate-fade-in">

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-hero-title">🧠 Personality Engine</h1>
            <p className="page-hero-sub">Track and grow your communication, confidence, and leadership traits through AI-powered challenges</p>
          </div>
          {avgScore > 0 && (<div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Avg Score</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--purple)' }}>{avgScore}</div>
            </div>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, width: 'fit-content' }}>
        {[['report', '📊 Trait Report'], ['challenge', '🎙️ Speaking Challenge'], ['analyze', '🔍 Analyze']].map(([t, label]) => (<button key={t} onClick={() => setMode(t)} style={{
                padding: '7px 18px', borderRadius: 8,
                background: mode === t ? 'var(--accent)' : 'transparent',
                color: mode === t ? 'white' : 'var(--t2)',
                border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}>
            {label}
          </button>))}
      </div>

      {/* Report mode */}
      {mode === 'report' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Trait cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 12 }}>
            {Object.entries(TRAIT_CONFIG).map(([trait, cfg]) => {
                const score = traits[trait] || 50;
                const isTop = topTrait?.[0] === trait;
                return (<div key={trait} style={{
                        background: 'var(--bg2)',
                        border: `1px solid ${isTop ? cfg.color + '44' : 'var(--border)'}`,
                        borderRadius: 14,
                        padding: 18,
                        borderTop: `3px solid ${cfg.color}`,
                        boxShadow: isTop ? `0 4px 14px ${cfg.color}20` : 'var(--shadow-sm)',
                        transition: 'all 0.15s',
                        position: 'relative', overflow: 'hidden',
                    }}>
                  {isTop && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, background: `${cfg.color}15`, color: cfg.color, padding: '1px 7px', borderRadius: 10 }}>Top Trait</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: 'var(--t1)' }}>{trait}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{cfg.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: cfg.color, letterSpacing: '-1px', marginBottom: 8 }}>{score}</div>
                  <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, borderRadius: 3, transition: 'width 1s ease' }}/>
                  </div>
                </div>);
            })}
          </div>

          {/* Practice challenges */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div className="content-card-header">
              <span className="section-title">🎙️ Practice Challenges</span>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>Pick a challenge to improve your scores</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10 }}>
              {CHALLENGES.map(c => (<button key={c.type} onClick={() => getChallenge(c.type)} style={{
                    padding: '14px 12px', borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--bg3)', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s',
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.3 }}>{c.desc}</div>
                </button>))}
            </div>
          </div>
        </div>)}

      {/* Challenge mode */}
      {mode === 'challenge' && challenge && (<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="info-banner info" style={{ borderRadius: 14 }}>
            <span className="info-banner-icon">🎯</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{challenge.challenge}</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{challenge.instructions}</div>
            </div>
          </div>

          <PinsEarnNotice_1.default earnAmount={0} activity="personality analysis" description="10 pins per AI analysis"/>
          <textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Type your response here (or describe what you said if speaking aloud)..." rows={8} style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', color: 'var(--t1)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.7 }}/>

          <div style={{ display: 'flex', gap: 8 }}>
            <PinsGate_1.default featureKey="personality_analysis" onUnlocked={analyzeResponse}>
              <button disabled={analyzing || !response.trim()} className="btn-primary">
                {analyzing ? '🔍 Analyzing...' : '→ Analyze with AI'}
              </button>
            </PinsGate_1.default>
            <button onClick={() => setMode('report')} className="btn-ghost">← Back to Report</button>
          </div>

          {analysis && (() => {
                const a = analysis;
                return (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div className="content-card-header">
                  <span className="section-title" style={{ color: 'var(--accent)' }}>AI Personality Analysis</span>
                </div>
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {a.summary && <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 10, borderLeft: '3px solid var(--accent)' }}>{a.summary}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>✓ Strengths</div>
                      {a.strengths?.map((s, i) => <div key={i} style={{ fontSize: 12.5, color: 'var(--t1)', marginBottom: 5, display: 'flex', gap: 6 }}><span style={{ color: 'var(--green)' }}>•</span>{s}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>→ Improve</div>
                      {a.improvements?.map((s, i) => <div key={i} style={{ fontSize: 12.5, color: 'var(--t1)', marginBottom: 5, display: 'flex', gap: 6 }}><span style={{ color: 'var(--amber)' }}>→</span>{s}</div>)}
                    </div>
                  </div>
                  {(a.filler_words?.length ?? 0) > 0 && (<div style={{ padding: '10px 14px', background: 'var(--coral-light)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, fontSize: 12 }}>
                      <span style={{ color: 'var(--coral)', fontWeight: 700 }}>Filler words detected: </span>
                      {a.filler_words?.join(', ')}
                    </div>)}
                </div>
              </div>);
            })()}
        </div>)}
    </div>);
}
