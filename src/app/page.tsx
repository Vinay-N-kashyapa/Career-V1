'use client';
// apps/web/src/app/page.tsx
// Public landing page — shown to visitors who are NOT logged in.
// Logged-in users get redirected to /dashboard by AuthContext.
// No external data fetches — fully static, loads instantly.

import Link from 'next/link';
import { useState } from 'react';

// ── Static data ───────────────────────────────────────────────────────────────
const STATS = [
  { value: '10,000+', label: 'Students Onboarded'  },
  { value: '₹499/mo', label: 'Pro Plan'            },
  { value: '9',       label: 'Career DNA Dimensions'},
  { value: '3×',      label: 'More Recruiter Views' },
];

const FEATURES = [
  {
    icon: '🧬', color: 'var(--accent)', title: 'Career DNA',
    desc: 'A 9-dimension intelligence model that maps your strengths, consistency, communication, and execution into a single evolving profile.',
    href: '/career-dna',
  },
  {
    icon: '🎯', color: 'var(--teal)', title: 'ATS Score & Gaps',
    desc: 'Upload your resume and get an instant ATS score with keyword gap analysis — the exact same criteria recruiters use.',
    href: '/resume',
  },
  {
    icon: '🛡', color: 'var(--green)', title: 'Trust Score',
    desc: 'Verified through real behaviour: exam integrity, vault certifications, consistent mission completion. Not self-reported.',
    href: '/trust',
  },
  {
    icon: '⚡', color: 'var(--amber)', title: 'Daily Missions',
    desc: '5 personalised skill missions generated every morning from your profile gaps. Complete them to raise your scores and earn XP.',
    href: '/missions',
  },
  {
    icon: '💼', color: 'var(--purple)', title: 'Opportunity Radar',
    desc: 'Jobs, internships, and scholarships ranked by how well they match your actual skill tags — not just your job title.',
    href: '/opportunities',
  },
  {
    icon: '🎙', color: 'var(--blue)', title: 'AI Interview Coach',
    desc: 'Practice with an AI interviewer across HR, technical, and domain rounds. Get scored feedback on every answer.',
    href: '/interview',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01', icon: '📄', title: 'Upload your resume',
    desc: 'Our AI instantly scores it for ATS compliance, identifies skill gaps, and generates your first Career DNA profile.',
  },
  {
    step: '02', icon: '⚡', title: 'Complete daily missions',
    desc: 'Every morning, 5 personalised skill missions are waiting. Each one closes a real gap in your profile.',
  },
  {
    step: '03', icon: '🎯', title: 'Get matched with opportunities',
    desc: 'As your scores rise, you appear in recruiter searches. Relevant jobs are ranked by match score, not recency.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma', role: 'SDE-1 @ Flipkart', avatar: 'P',
    quote: 'My ATS score went from 42 to 78 in 3 weeks. Got shortlisted by 4 companies the next month.',
    college: 'RV College of Engineering',
  },
  {
    name: 'Arjun Mehta', role: 'Data Analyst @ Infosys', avatar: 'A',
    quote: 'The Career DNA assessment showed me exactly why I was failing interviews. Fixed my communication score, got the offer.',
    college: 'NIT Surathkal',
  },
  {
    name: 'Sneha Iyer', role: 'Product Intern @ Zepto', avatar: 'S',
    quote: 'The mission streak kept me accountable. 30 days of missions, then 3 interview calls in a week.',
    college: 'Christ University',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [email, setEmail] = useState('');

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg, #0f0f11); color: var(--t1, #f1f0ee); font-family: var(--font-body, Inter, sans-serif); }
        .landing { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; zIndex: 10; }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); border-color: var(--accent) !important; }
        .feature-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .logo-box { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .logo-box:hover { transform: scale(1.08) rotate(3deg); }
        .btn-gradient { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-gradient:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.5); filter: brightness(1.08); }
        .btn-outline { transition: all 0.25s ease; }
        .btn-outline:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.3) !important; transform: translateY(-1px); }
      `}</style>

      <div style={{ background:'var(--bg, #0f0f11)', minHeight:'100vh', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Glowing Spheres */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 1 }} />

        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <nav style={{ position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(15,15,17,0.85)', backdropFilter:'blur(12px)' }}>
          <div className="landing" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
              <div className="logo-box" style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', fontFamily:'var(--font-display)' }}>Pi</div>
              <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>PinIT</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-mono)', padding:'2px 7px', border:'1px solid rgba(255,255,255,0.1)', borderRadius:100 }}>Career OS</span>
            </Link>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Link href="/login" style={{ padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', textDecoration:'none', fontFamily:'var(--font-display)', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}>Log in</Link>
              <Link href="/signup" className="btn-gradient" style={{ padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', textDecoration:'none', fontFamily:'var(--font-display)', boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>Get started free</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section style={{ padding:'100px 0 80px', textAlign:'center', position: 'relative', zIndex: 10 }}>
          <div className="landing">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, border:'1px solid rgba(79,70,229,0.3)', background:'rgba(79,70,229,0.06)', marginBottom:28, fontSize:12, fontWeight:600, color:'#818cf8', fontFamily:'var(--font-mono)' }}>
              ✦ AI-powered career intelligence for Indian students
            </div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(38px,6vw,72px)', fontWeight:800, lineHeight:1.08, letterSpacing:'-2px', marginBottom:24, color:'#fff' }}>
              Your career. <br />
              <span style={{ background:'linear-gradient(135deg,#4f46e5,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Engineered by AI.
              </span>
            </h1>
            <p style={{ fontSize:'clamp(15px,2vw,20px)', color:'rgba(255,255,255,0.55)', maxWidth:600, margin:'0 auto 40px', lineHeight:1.65 }}>
              PinIT builds your Career DNA, parses your ATS keyword alignment, and targets custom quests to close your engineering skill gaps.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/signup" className="btn-gradient" style={{ padding:'14px 32px', borderRadius:10, fontSize:15, fontWeight:700, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', textDecoration:'none', fontFamily:'var(--font-display)', boxShadow:'0 6px 24px rgba(79,70,229,0.4)', letterSpacing:'-0.3px' }}>
                Start free — no pin card
              </Link>
              <Link href="/login" className="btn-outline" style={{ padding:'14px 28px', borderRadius:10, fontSize:15, fontWeight:600, border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.85)', textDecoration:'none', fontFamily:'var(--font-display)', background:'rgba(255,255,255,0.03)' }}>
                Sign in →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────────────────── */}
        <section style={{ padding:'20px 0 60px' }}>
          <div className="landing">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:1, background:'rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ padding:'22px 20px', textAlign:'center', background:'rgba(15,15,17,0.9)' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>{s.value}</div>
                  <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.45)', marginTop:4, fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────── */}
        <section style={{ padding:'60px 0' }}>
          <div className="landing">
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'var(--font-mono)', marginBottom:10 }}>How it works</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,4vw,40px)', fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>From confused to career-ready in 30 days</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:28, position:'relative' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(79,70,229,0.6)', letterSpacing:'2px', marginBottom:16 }}>{step.step}</div>
                  <div style={{ fontSize:32, marginBottom:14 }}>{step.icon}</div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'#fff', marginBottom:10 }}>{step.title}</h3>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>{step.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div style={{ position:'absolute', right:-14, top:'50%', transform:'translateY(-50%)', fontSize:20, color:'rgba(255,255,255,0.2)', display:'none' }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────── */}
        <section style={{ padding:'60px 0' }}>
          <div className="landing">
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'var(--font-mono)', marginBottom:10 }}>Features</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,4vw,40px)', fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>Everything your career needs in one OS</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16 }}>
              {FEATURES.map((f, i) => (
                <Link key={i} href={f.href} style={{ textDecoration:'none' }}>
                  <div className="feature-card" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, height:'100%', borderTop:`2px solid ${f.color}` }}>
                    <div style={{ fontSize:28, marginBottom:14 }}>{f.icon}</div>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'#fff', marginBottom:10 }}>{f.title}</h3>
                    <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>{f.desc}</p>
                    <div style={{ marginTop:16, fontSize:12, fontWeight:600, color:f.color }}>Learn more →</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social proof / testimonials ────────────────────────────── */}
        <section style={{ padding:'60px 0' }}>
          <div className="landing">
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,4vw,40px)', fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>Students who used it, got hired</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.65, marginBottom:20, fontStyle:'italic' }}>"{t.quote}"</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff', flexShrink:0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13.5, color:'#fff' }}>{t.name}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{t.role} · {t.college}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing teaser ─────────────────────────────────────────── */}
        <section style={{ padding:'60px 0' }}>
          <div className="landing">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, maxWidth:860, margin:'0 auto' }}>
              {/* Free */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'28px 24px' }}>
                <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.4)', marginBottom:12 }}>FREE FOREVER</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:38, fontWeight:800, color:'#fff', marginBottom:4 }}>₹0</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:24 }}>No pin card needed</div>
                {['3 AI interviews/month','2 resume uploads','30 mission evaluations','Full Career DNA profile'].map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                    <span style={{ color:'#4f46e5' }}>✓</span>{f}
                  </div>
                ))}
                <Link href="/signup" style={{ display:'block', marginTop:20, padding:'11px', borderRadius:9, background:'rgba(79,70,229,0.15)', border:'1px solid rgba(79,70,229,0.3)', color:'#818cf8', textAlign:'center', textDecoration:'none', fontWeight:700, fontSize:14, fontFamily:'var(--font-display)' }}>
                  Get started free
                </Link>
              </div>

              {/* Pro */}
              <div style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.15))', border:'2px solid rgba(79,70,229,0.5)', borderRadius:20, padding:'28px 24px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:16, right:16, fontSize:10, background:'#4f46e5', color:'#fff', padding:'3px 9px', borderRadius:100, fontWeight:700, fontFamily:'var(--font-mono)' }}>MOST POPULAR</div>
                <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.4)', marginBottom:12 }}>PRO MONTHLY</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:38, fontWeight:800, color:'#fff', marginBottom:4 }}>₹499<span style={{ fontSize:14, fontWeight:400, color:'rgba(255,255,255,0.4)' }}>/mo</span></div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:24 }}>₹4,999/year (save 2 months)</div>
                {['Unlimited AI interviews','Unlimited resume uploads','Unlimited missions & exams','AI Resume Improve','Full vault access','All avatar modes','Priority support'].map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                    <span style={{ color:'#818cf8' }}>✓</span>{f}
                  </div>
                ))}
                <Link href="/signup" style={{ display:'block', marginTop:20, padding:'11px', borderRadius:9, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', textAlign:'center', textDecoration:'none', fontWeight:700, fontSize:14, fontFamily:'var(--font-display)', boxShadow:'0 4px 16px rgba(79,70,229,0.4)' }}>
                  Start Pro free trial
                </Link>
              </div>
            </div>
            <div style={{ textAlign:'center', marginTop:28, fontSize:13, color:'rgba(255,255,255,0.4)' }}>
              Institutions and placement cells — <Link href="/signup" style={{ color:'#818cf8' }}>contact us</Link> for bulk pricing (₹49,999/year/college)
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section style={{ padding:'80px 0 100px', textAlign:'center' }}>
          <div className="landing">
            <div style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.12),rgba(6,182,212,0.08))', border:'1px solid rgba(79,70,229,0.2)', borderRadius:24, padding:'60px 40px' }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,5vw,52px)', fontWeight:800, color:'#fff', letterSpacing:'-1.5px', marginBottom:16 }}>
                Start building your career today
              </h2>
              <p style={{ fontSize:16, color:'rgba(255,255,255,0.55)', marginBottom:36, maxWidth:480, margin:'0 auto 36px' }}>
                200 real students. 50 companies. One college at a time.
              </p>
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:16 }}>
                <Link href="/signup" style={{ padding:'15px 36px', borderRadius:10, fontSize:15, fontWeight:700, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', textDecoration:'none', fontFamily:'var(--font-display)', boxShadow:'0 8px 28px rgba(79,70,229,0.5)', letterSpacing:'-0.3px' }}>
                  Sign up free →
                </Link>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>No pin card. No spam. Unsubscribe anytime.</div>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'32px 0' }}>
          <div className="landing" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>© 2025 PinIT Career OS</div>
            <div style={{ display:'flex', gap:24 }}>
              {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '/contact']].map(([l, h]) => (
                <Link key={l} href={h} style={{ fontSize:12, color:'rgba(255,255,255,0.35)', textDecoration:'none' }}>{l}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
