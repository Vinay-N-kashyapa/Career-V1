'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CareerDNAPage;
// app/career-dna/page.tsx — CareerDNA Identity System
// FIXED: buildEvolutionData() no longer uses Math.random().
//        Uses real GET /api/career-dna/history via useCareerDnaHistory() hook.
const react_1 = require("react");
const hooks_1 = require("@/lib/api/hooks");
const client_1 = require("@/lib/api/client");
const react_query_1 = require("@tanstack/react-query");
const charts_1 = require("@/components/ui/charts");
const career_archetypes_1 = require("@/lib/career-archetypes");
const PinsGate_1 = __importDefault(require("@/components/pins/PinsGate"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
// ── 9 DNA dimensions ─────────────────────────────────────────────────────────
const DNA_DIMENSIONS = [
    { label: 'Strength Archetype', key: 'career_dna_score', color: 'var(--accent)', icon: '⭐', desc: 'Overall career DNA composite' },
    { label: 'Learning Style', key: 'consistency_score', color: 'var(--teal)', icon: '📚', desc: 'Study consistency & depth' },
    { label: 'Communication', key: 'communication_score', color: 'var(--purple)', icon: '🎙', desc: 'Interview scores & clarity' },
    { label: 'Leadership Score', key: 'leadership_score', color: 'var(--amber)', icon: '👑', desc: 'Leadership missions & challenges' },
    { label: 'Confidence Index', key: 'confidence_score', color: 'var(--blue)', icon: '💪', desc: 'Self-assessment & test performance' },
    { label: 'Technical Depth', key: 'innovation_score', color: 'var(--green)', icon: '</>', desc: 'Project novelty & technical challenges' },
    { label: 'Consistency Score', key: 'consistency_score', color: 'var(--orange)', icon: '⏰', desc: 'Daily activity & login regularity' },
    { label: 'Interview Personality', key: 'adaptability_score', color: 'var(--pink)', icon: '🎭', desc: 'Adaptability across study modes' },
    { label: 'Career Risk Meter', key: 'career_readiness', color: 'var(--coral)', icon: '🎯', desc: 'Readiness for the job market' },
];
// ── Evolution metric selector ─────────────────────────────────────────────────
const EVOLUTION_METRICS = [
    { key: 'career_dna_score', label: 'Career DNA', color: 'var(--accent)' },
    { key: 'ats_score', label: 'ATS Score', color: 'var(--green)' },
    { key: 'trust_score', label: 'Trust Score', color: 'var(--teal)' },
];
// ── Map history response → AreaChart points ───────────────────────────────────
function historyToPoints(history, metricKey) {
    return history.map((h) => ({
        label: new Date(h.date).toLocaleDateString('en-IN', { month: 'short' }),
        y: typeof h[metricKey] === 'number' ? h[metricKey] : 0,
    }));
}
// ── Archetype derivation ──────────────────────────────────────────────────────
function deriveArchetypeFromProfile(profile) {
    const stored = profile?.career_dna_archetype;
    if (stored && career_archetypes_1.ARCHETYPES.find(a => a.id === stored))
        return stored;
    const scores = {
        strategist: (profile?.leadership_score || 0) * 1.2,
        builder: (profile?.innovation_score || 0) * 1.1 + (profile?.consistency_score || 0) * 0.3,
        visionary: (profile?.career_readiness || 0) + (profile?.innovation_score || 0) * 0.8,
        operator: (profile?.consistency_score || 0) * 1.5,
        analyst: (profile?.adaptability_score || 0) * 1.2,
        creator: (profile?.communication_score || 0) * 1.3,
    };
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}
function SkillRadarChart({ profile }) {
    const axes = [
        { label: 'Leadership', key: 'leadership_score' },
        { label: 'Innovation', key: 'innovation_score' },
        { label: 'Communication', key: 'communication_score' },
        { label: 'Consistency', key: 'consistency_score' },
        { label: 'Adaptability', key: 'adaptability_score' },
        { label: 'Readiness', key: 'career_readiness' },
    ];
    const size = 260;
    const center = size / 2;
    const maxR = size * 0.35;
    const numAxes = axes.length;
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const bgPolygons = levels.map(level => {
        const r = maxR * level;
        const pts = [];
        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            pts.push(`${x},${y}`);
        }
        return pts.join(' ');
    });
    const axisLines = axes.map((axis, i) => {
        const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
        const outerX = center + maxR * Math.cos(angle);
        const outerY = center + maxR * Math.sin(angle);
        const labelX = center + (maxR + 20) * Math.cos(angle);
        const labelY = center + (maxR + 12) * Math.sin(angle);
        return {
            x1: center,
            y1: center,
            x2: outerX,
            y2: outerY,
            labelX,
            labelY,
            label: axis.label,
            align: (Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle')
        };
    });
    const dataPoints = axes.map((axis, i) => {
        const score = Math.round(profile[axis.key] || 40);
        const r = maxR * (score / 100);
        const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');
    return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {bgPolygons.map((pts, i) => (<polygon key={i} points={pts} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth={1}/>))}

        {axisLines.map((line, i) => (<line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="rgba(255, 255, 255, 0.08)" strokeWidth={1}/>))}

        {axisLines.map((line, i) => (<text key={i} x={line.labelX} y={line.labelY} fill="var(--t3)" fontSize={9.5} fontFamily="var(--font-mono)" textAnchor={line.align} dominantBaseline="middle" fontWeight={600}>
            {line.label}
          </text>))}

        <polygon points={dataPoints} fill="rgba(99, 102, 241, 0.15)" stroke="var(--accent)" strokeWidth={2} style={{ transition: 'all 0.5s ease-in-out' }}/>

        {axes.map((axis, i) => {
            const score = Math.round(profile[axis.key] || 40);
            const r = maxR * (score / 100);
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return (<circle key={i} cx={x} cy={y} r={3.5} fill="var(--accent)" stroke="#fff" strokeWidth={1} style={{ transition: 'all 0.5s ease-in-out' }}/>);
        })}
      </svg>
    </div>);
}
function CareerDNAPage() {
    const qc = (0, react_query_1.useQueryClient)();
    const { data: dnaData, isLoading: dnaLoading } = (0, hooks_1.useCareerDna)();
    const { data: histData, isLoading: histLoading } = (0, hooks_1.useCareerDnaHistory)(6);
    const [calculating, setCalculating] = (0, react_1.useState)(false);
    const [editArchetype, setEditArchetype] = (0, react_1.useState)(false);
    const [activeMetric, setActiveMetric] = (0, react_1.useState)('career_dna_score');
    const profile = dnaData?.profile || {};
    const dnaScore = Math.round(profile.career_dna_score || 0);
    const archetypeId = deriveArchetypeFromProfile(profile);
    const archetype = (0, career_archetypes_1.getArchetype)(archetypeId);
    const streak = profile.mission_streak || 0;
    const history = histData?.history || [];
    const evolutionPoints = historyToPoints(history, activeMetric);
    const activeMetricCfg = EVOLUTION_METRICS.find(m => m.key === activeMetric) || EVOLUTION_METRICS[0];
    const { earnPins: cOSEarnPins } = (0, CareerOSContext_1.useCareerOS)();
    async function recalculate() {
        setCalculating(true);
        try {
            await client_1.api.post('/api/career-dna/calculate', {});
            await qc.invalidateQueries({ queryKey: hooks_1.KEYS.careerDna });
            await qc.invalidateQueries({ queryKey: hooks_1.KEYS.careerDnaHistory });
        }
        catch { /* swallow */ }
        finally {
            setCalculating(false);
        }
    }
    async function setArchetype(id) {
        try {
            await client_1.api.patch('/api/career-dna/archetype', { archetype: id });
            await qc.invalidateQueries({ queryKey: hooks_1.KEYS.careerDna });
        }
        catch { }
        setEditArchetype(false);
    }
    if (dnaLoading)
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="page-hero-title">🧬 Career DNA</h1>
          <p className="page-hero-sub">Your 9-dimension career identity score — computed from missions, exams, and vault evidence</p>
        </div>
      </div>

      {[...Array(4)].map((_, i) => (<div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }}/>))}
    </div>);
    return (<div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {/* ─ Archetype Hero ─ */}
      <div style={{
            background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
            border: `2px solid ${archetype.color}33`,
            borderRadius: 'var(--radius-xl)',
            padding: 24, overflow: 'hidden', position: 'relative',
            boxShadow: 'var(--shadow-md)',
        }}>
        <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', width: 200, height: 200, borderRadius: '50%', background: `${archetype.color}10`, border: `2px solid ${archetype.color}22`, pointerEvents: 'none' }}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, background: archetype.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: `0 6px 24px ${archetype.color}44` }}>
            {archetype.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Primary Archetype</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: archetype.color, margin: '0 0 4px', letterSpacing: '-0.8px' }}>{archetype.label}</h1>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 12px', lineHeight: 1.55 }}>{archetype.tagline}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {archetype.traits.map(t => (<span key={t} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11.5, fontWeight: 600, background: `${archetype.color}1a`, color: archetype.color, border: `1px solid ${archetype.color}44` }}>{t}</span>))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
            <button onClick={() => setEditArchetype(e => !e)} className="btn-ghost btn-sm">✏ Change Archetype</button>
            <PinsGate_1.default featureKey="career_dna_calc" onUnlocked={recalculate}>
          <button onClick={recalculate} disabled={calculating} className="btn-ghost btn-sm">
              {calculating ? '⟳ Recalculating...' : '⟳ Recalculate DNA'}
            </button>
          </PinsGate_1.default>
          </div>
        </div>
      </div>

      {/* ─ DNA Profile Card with custom Radar Chart ─ */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={S.cardLabel}>Career DNA Profile</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>Computed multidimensional analysis of your verified skills and assessments.</p>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 900, color: archetype.color, letterSpacing: '-1.5px', lineHeight: 1 }}>
            {dnaScore}<span style={{ fontSize: 16, color: 'var(--t4)', fontWeight: 400 }}>/100</span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'center' }}>
          <SkillRadarChart profile={profile}/>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {DNA_DIMENSIONS.map((dim) => (<DimensionGauge key={dim.label} label={dim.label} value={Math.round(profile[dim.key] || 0)} color={dim.color} icon={dim.icon}/>))}
            </div>
            <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
              🧬 <strong>Advisory:</strong> Your career DNA evolves as you log in, complete quests, and verify credentials. The radar visualization displays balance across leadership, communication, and technological depth. Keep developing weaker axes to lock optimal archetype targets.
          </div>
        </div>
      </div>

      {/* ─ Evolution & Level Cards Grid ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Evolution chart — REAL DATA */}
        <div className="glass-card card-hover" style={{ padding: 20 }}>
          {/* Chart header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={S.cardLabel}>Career DNA Evolution</div>
            {/* Metric selector tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {EVOLUTION_METRICS.map((m) => (<button key={m.key} onClick={() => setActiveMetric(m.key)} style={{
                padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 10.5, fontWeight: 600, fontFamily: 'var(--font-mono)',
                background: activeMetric === m.key ? m.color : 'var(--bg3)',
                color: activeMetric === m.key ? '#fff' : 'var(--t3)',
                transition: 'all 0.15s',
            }}>
                  {m.label}
                </button>))}
            </div>
          </div>

          {/* Chart */}
          {histLoading ? (<div className="skeleton" style={{ height: 180, borderRadius: 8 }}/>) : evolutionPoints.length >= 2 ? (<charts_1.AreaChart points={evolutionPoints} color={activeMetricCfg.color} height={180} yMax={100} yMin={0}/>) : (<div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13, gap: 8 }}>
              <span style={{ fontSize: 28 }}>📈</span>
              <span>Complete missions to build your history chart</span>
            </div>)}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
              {histData?.months || 6} month window
            </div>
            <div style={{ padding: '4px 12px', borderRadius: 100, background: `${activeMetricCfg.color}1a`, color: activeMetricCfg.color, fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {dnaScore}% This Month
            </div>
          </div>
        </div>

        {/* Career level card */}
        <div className="glass-card card-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={S.cardLabel}>Career Level</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: archetype.color }}>
              {dnaScore >= 80 ? 'Elite Candidate' : dnaScore >= 60 ? 'Industry Ready' : dnaScore >= 40 ? 'Interview Ready' : dnaScore >= 20 ? 'Career Builder' : 'Explorer'}
            </div>
            {streak > 0 && (<span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>🔥 {streak}-day streak</span>)}
          </div>
          <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${dnaScore}%`, background: archetype.gradient, borderRadius: 4, transition: 'width 1s ease' }}/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
            {100 - dnaScore} points to next tier
          </div>
        </div>
      </div>
      </div>

      {/* ─ Archetype Showcase / Edit ─ */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.cardLabel}>{editArchetype ? '✏ Select Your Archetype' : 'Discover All Archetypes'}</div>
          {editArchetype && <button onClick={() => setEditArchetype(false)} className="btn-ghost btn-sm">✕ Cancel</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {career_archetypes_1.ARCHETYPES.map((a) => {
            const isActive = a.id === archetypeId;
            return (<button key={a.id} onClick={() => editArchetype ? setArchetype(a.id) : undefined} style={{
                    background: isActive ? `${a.color}14` : 'var(--bg3)',
                    border: `2px solid ${isActive ? a.color : 'var(--border)'}`,
                    borderRadius: 14, padding: '16px 12px', textAlign: 'left',
                    cursor: editArchetype ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                }}>
                {isActive && <div style={{ fontSize: 9.5, color: a.color, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6, textTransform: 'uppercase' }}>▶ You</div>}
                <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: isActive ? a.color : 'var(--t1)', marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.4 }}>{a.description}</div>
              </button>);
        })}
        </div>
      </div>
    </div>);
}
// ── Sub-components ────────────────────────────────────────────────────────────
function DimensionGauge({ label, value, color, icon }) {
    const r = 30;
    const c = 2 * Math.PI * r;
    const dash = (value / 100) * c;
    return (<div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 6px' }}>
        <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={36} cy={36} r={r} fill="none" stroke="var(--bg3)" strokeWidth={7}/>
          <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 12 }}>{icon}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>{value}%</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', lineHeight: 1.2, textAlign: 'center' }}>{label}</div>
    </div>);
}
const S = {
    card: {
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: 20,
        boxShadow: 'var(--shadow-sm)',
    },
    cardLabel: {
        fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase',
        color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 12,
        display: 'block',
    },
};
