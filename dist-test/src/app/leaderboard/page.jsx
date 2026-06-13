'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LeaderboardPage;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const client_1 = require("@/lib/api/client");
const AuthContext_1 = require("@/lib/context/AuthContext");
const TABS = [
    { id: 'trust', label: '🛡 Trust', color: 'var(--green)', desc: 'Most authentic learners' },
    { id: 'ats', label: '🎯 ATS', color: 'var(--teal)', desc: 'Best resume scores' },
    { id: 'dna', label: '🧬 Career DNA', color: 'var(--purple)', desc: 'Highest overall growth' },
    { id: 'streak', label: '🔥 Streak', color: 'var(--amber)', desc: 'Longest daily streak' },
    { id: 'missions', label: '⚡ Missions', color: 'var(--accent)', desc: 'Most missions completed' },
];
function LeaderboardPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const [tab, setTab] = (0, react_1.useState)('trust');
    const activeTab = TABS.find(t => t.id === tab);
    const { data, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['leaderboard', tab],
        queryFn: () => client_1.api.get(`/api/analytics/leaderboard?metric=${tab}`),
        staleTime: 2 * 60 * 1000,
    });
    const leaders = data?.leaders || [];
    const userRank = data?.userRank;
    return (<div style={{ maxWidth: 760, margin: '0 auto' }} className="animate-fade-in">

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 className="page-hero-title">🏆 Leaderboard</h1>
            <p className="page-hero-sub">Top performers across the PinIT platform — updated every hour</p>
          </div>
          {userRank && (<div style={{ background: 'var(--accent-light)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: '10px 16px', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Your Rank</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1px' }}>#{userRank}</div>
            </div>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid',
                borderColor: tab === t.id ? t.color : 'var(--border)',
                background: tab === t.id ? `${t.color}15` : 'var(--bg2)',
                color: tab === t.id ? t.color : 'var(--t2)',
                fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
            }}>
            {t.label}
          </button>))}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeTab.color, display: 'inline-block' }}/>
            {activeTab.desc}
          </span>
          <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>Updated hourly</span>
        </div>

        {isLoading ? (<div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(10)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }}/>)}
          </div>) : leaders.length === 0 ? (<div className="empty-state-enhanced" style={{ margin: 20 }}>
            <div className="empty-icon-lg">🏆</div>
            <div className="empty-title">No data yet</div>
            <div className="empty-desc">Complete missions and exams to appear on the leaderboard</div>
          </div>) : (<div>
            {leaders.map((entry, i) => {
                const isMe = entry.userId === user?.id;
                const medals = { 0: '🥇', 1: '🥈', 2: '🥉' };
                return (<div key={entry.userId} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '13px 20px',
                        borderBottom: i < leaders.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isMe ? 'var(--accent-light)' : i < 3 ? `${activeTab.color}06` : 'transparent',
                        transition: 'background 0.12s',
                    }}>
                  {/* Rank */}
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    {medals[i]
                        ? <span style={{ fontSize: 22 }}>{medals[i]}</span>
                        : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>{i + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: isMe ? 'linear-gradient(135deg, var(--accent), var(--purple))' : `linear-gradient(135deg, hsl(${(i * 53) % 360},65%,58%), hsl(${(i * 53 + 80) % 360},65%,48%))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800, color: 'white',
                        boxShadow: isMe ? '0 2px 10px rgba(79,70,229,0.3)' : 'none',
                    }}>
                    {(entry.displayName || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? 'var(--accent)' : 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {entry.displayName}
                      {isMe && <span className="badge badge-accent">You</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      🔥 {entry.streak}d · {entry.role || 'Student'}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: activeTab.color, letterSpacing: '-0.5px' }}>
                      {Math.round(entry.score)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'var(--font-mono)' }}>
                      {tab === 'streak' ? 'days' : tab === 'missions' ? 'done' : '/100'}
                    </div>
                  </div>
                </div>);
            })}
          </div>)}
      </div>
    </div>);
}
