'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';

interface AnalyticsData {
  scores: Record<string,number>;
  missions: Record<string,number>;
  exams: Record<string,number>;
  interviews: Record<string,number>;
  score_history?: Array<{date:string; ats:number; dna:number; trust:number}>;
}

function MiniLineChart({ data, color, height=40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return <div style={{ height, background:'var(--bg3)', borderRadius:6 }} />;
  const max = Math.max(...data, 1);
  const w = 100 / (data.length - 1);
  const pts = data.map((v, i) => `${i * w},${height - (v / max) * height}`).join(' ');
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width:'100%', height }} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} vectorEffect="non-scaling-stroke" />
      <polyline fill={`${color}18`} stroke="none" points={`0,${height} ${pts} 100,${height}`} />
    </svg>
  );
}

function StatCard({ icon, label, value, sub, color, trend, href }: {
  icon: string; label: string; value: string|number; sub?: string;
  color: string; trend?: number; href?: string;
}) {
  const card = (
    <div className="score-card card-hover" style={{ cursor: href ? 'pointer' : 'default' }}>
      <div className="sc-header">
        <div className="sc-icon-wrap" style={{ background:`${color}18` }}>
          <span style={{ fontSize:16 }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:6, background: trend>=0?'var(--green-light)':'var(--coral-light)', color: trend>=0?'var(--green)':'var(--coral)' }}>
            {trend>=0?'↑':'↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="sc-label">{label}</div>
      <div className="sc-value">{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration:'none' }}>{card}</Link> : card;
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics','dashboard'],
    queryFn:  () => api.get<AnalyticsData>('/api/analytics/dashboard'),
    staleTime: 2 * 60 * 1000,
  });

  const s  = data?.scores     || {};
  const m  = data?.missions   || {};
  const ex = data?.exams      || {};
  const iv = data?.interviews || {};

  const historyAts   = data?.score_history?.map(h => h.ats)   || [0, s.ats_score   || 0];
  const historyDna   = data?.score_history?.map(h => h.dna)   || [0, s.career_dna_score || 0];
  const historyTrust = data?.score_history?.map(h => h.trust) || [0, s.trust_score  || 0];

  const STATS = [
    { icon:'🎯', label:'ATS Score',          value:Math.round(s.ats_score||0),             color:'var(--teal)',   href:'/resume'     },
    { icon:'🧬', label:'Career DNA',         value:Math.round(s.career_dna_score||0),      color:'var(--purple)', href:'/career-dna' },
    { icon:'🛡', label:'Trust Score',        value:Math.round(s.trust_score||0),           color:'var(--green)',  href:'/trust'      },
    { icon:'📡', label:'Recruiter Rank',     value:Math.round(s.recruiter_visibility||0),  color:'var(--amber)',  href:'/recruiter'  },
    { icon:'🔥', label:'Day Streak',         value:s.mission_streak||0,                    color:'var(--coral)'  },
    { icon:'⚡', label:'Missions Done',      value:m.completed||0,                         color:'var(--accent)', href:'/missions'  },
    { icon:'📋', label:'Exams Taken',        value:ex.total||0,                            color:'var(--blue)',   href:'/exam'      },
    { icon:'📊', label:'Avg Exam Score',     value:`${Math.round(ex.avg_pct||0)}%`,        color:'var(--teal)'   },
    { icon:'🎙', label:'Interviews Done',    value:iv.total||0,                            color:'var(--purple)', href:'/interview' },
    { icon:'🏆', label:'Career Readiness',   value:`${Math.round(s.career_readiness||0)}/100`, color:'var(--green)', href:'/career-dna' },
  ];

  if (isLoading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
      {[...Array(10)].map((_,i) => <div key={i} className="skeleton score-skeleton" />)}
    </div>
  );

  return (
    <div style={{ maxWidth:1080, margin:'0 auto' }} className="animate-fade-in">
      <div className="page-hero" style={{ marginBottom: 24 }}>
        <div style={{ position:'relative', zIndex:1 }}>
          <h1 className="page-hero-title">📊 Analytics</h1>
          <p className="page-hero-sub">Your complete career growth intelligence — all modules in one view</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="metric-grid" style={{ marginBottom: 24 }}>
        {STATS.map(st => <StatCard key={st.label} {...st} />)}
      </div>

      {/* Score trend charts */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:'ATS Score Trend',    data:historyAts,   color:'var(--teal)',   val:Math.round(s.ats_score||0)          },
          { label:'Career DNA Trend',   data:historyDna,   color:'var(--purple)', val:Math.round(s.career_dna_score||0)   },
          { label:'Trust Score Trend',  data:historyTrust, color:'var(--green)',  val:Math.round(s.trust_score||0)        },
        ].map(chart => (
          <div key={chart.label} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:16, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:11.5, fontWeight:600, color:'var(--t2)' }}>{chart.label}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:chart.color }}>{chart.val}</div>
            </div>
            <MiniLineChart data={chart.data} color={chart.color} height={48} />
          </div>
        ))}
      </div>

      {/* Mission breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:18, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-display)', marginBottom:14 }}>Mission Breakdown</div>
          {[
            { label:'Completed', val:m.completed||0, color:'var(--green)',  pct:(m.completed||0)/Math.max(m.total||1,1)*100 },
            { label:'Pending',   val:m.pending||0,   color:'var(--amber)',  pct:(m.pending||0)/Math.max(m.total||1,1)*100   },
            { label:'Failed',    val:m.failed||0,    color:'var(--coral)',  pct:(m.failed||0)/Math.max(m.total||1,1)*100    },
          ].map(item => (
            <div key={item.label} style={{ marginBottom:11 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'var(--t2)' }}>{item.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:item.color, fontFamily:'var(--font-mono)' }}>{item.val}</span>
              </div>
              <div className="progress-bar" style={{ height:5 }}>
                <div className="progress-fill" style={{ width:`${item.pct}%`, background:item.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Exam performance */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:18, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-display)', marginBottom:14 }}>Exam Performance</div>
          {[
            { label:'Pass Rate',    val:`${Math.round(ex.pass_rate||0)}%`, color:'var(--green)'   },
            { label:'Avg Score',    val:`${Math.round(ex.avg_pct||0)}%`,   color:'var(--teal)'    },
            { label:'Gold Badges',  val:ex.gold||0,                         color:'#f59e0b'        },
            { label:'Silver Badges',val:ex.silver||0,                       color:'#9ca3af'        },
            { label:'Bronze Badges',val:ex.bronze||0,                       color:'#d97706'        },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--t2)' }}>{item.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:item.color, fontFamily:'var(--font-mono)' }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[
          { href:'/leaderboard', label:'🏆 Leaderboard'   },
          { href:'/career-dna',  label:'🧬 Career DNA'    },
          { href:'/trust',       label:'🛡 Trust Score'   },
          { href:'/missions',    label:'⚡ My Missions'   },
          { href:'/resume',      label:'📄 ATS Analysis'  },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{ textDecoration:'none' }}>
            <button className="btn-ghost btn-sm">{l.label}</button>
          </Link>
        ))}
      </div>
    </div>
  );
}
