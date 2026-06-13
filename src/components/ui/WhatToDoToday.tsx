'use client';
// apps/web/src/components/ui/WhatToDoToday.tsx
// Generates 3 personalised action cards from existing career_profiles data.
// Zero new API calls — derives everything from the profile already loaded on dashboard.

import Link from 'next/link';

interface Profile {
  ats_score?:           number;
  trust_score?:         number;
  career_dna_score?:    number;
  mission_streak?:      number;
  missions_completed?:  number;
  recruiter_visibility?:number;
  vault_count?:         number;
  interviews_done?:     number;
  weak_areas?:          string[];
  skill_tags?:          string[];
  xp_total?:            number;
}

interface Action {
  icon:    string;
  title:   string;
  desc:    string;
  href:    string;
  cta:     string;
  color:   string;
  urgency: number; // higher = more important, determines order
}

// Scoring function — pick the 3 highest-urgency actions for this user
function pickActions(profile: Profile): Action[] {
  const ats     = profile?.ats_score           || 0;
  const trust   = profile?.trust_score         || 0;
  const streak  = profile?.mission_streak      || 0;
  const vault   = profile?.vault_count         || 0;
  const recVis  = profile?.recruiter_visibility|| 0;
  const done    = profile?.missions_completed  || 0;
  const intDone = profile?.interviews_done     || 0;
  const gaps    = profile?.weak_areas          || [];

  const candidates: Action[] = [
    // Resume / ATS
    {
      icon:'📄', color:'var(--teal)',
      title: ats < 40 ? 'Upload your resume — ATS score is low' : 'Improve your ATS score',
      desc:  ats < 40
        ? 'Your ATS score is below recruiter visibility thresholds. Upload a resume to unlock tailored missions.'
        : `Your ATS score is ${Math.round(ats)}/100. ${gaps.length > 0 ? `Top gap: ${gaps[0]}.` : 'Run AI Improve to push it higher.'}`,
      href: '/resume', cta: ats < 40 ? 'Upload Resume →' : 'AI Improve →',
      urgency: ats < 40 ? 100 : ats < 60 ? 70 : 20,
    },
    // Vault / certifications
    {
      icon:'🗂', color:'var(--purple)',
      title: vault === 0 ? 'Add your first vault item' : 'Expand your vault',
      desc:  vault === 0
        ? 'Your vault is empty. Certifications, project docs, and course badges boost your Trust Score.'
        : `You have ${vault} vault item${vault > 1 ? 's' : ''}. Add another to raise your recruiter visibility.`,
      href: '/vault', cta: 'Open Vault →',
      urgency: vault === 0 ? 85 : vault < 3 ? 50 : 10,
    },
    // Mission streak
    {
      icon:'🔥', color:'var(--amber)',
      title: streak === 0 ? 'Start your mission streak today' : streak < 3 ? 'Keep the streak going' : `${streak}-day streak — don't break it!`,
      desc:  streak === 0
        ? 'Complete one mission today to start building your streak. Streaks directly raise your Career DNA score.'
        : streak < 7
        ? `${streak}-day streak in progress. Consistent students get 3× more recruiter views.`
        : `Outstanding! ${streak} consecutive days. Today's missions are ready.`,
      href: '/missions', cta: 'Do Missions →',
      urgency: streak === 0 ? 90 : streak < 3 ? 60 : 15,
    },
    // Mock interview
    {
      icon:'🎙', color:'var(--blue)',
      title: intDone === 0 ? 'Take your first mock interview' : 'Practice another interview',
      desc:  intDone === 0
        ? 'Your interview score is unset. One session is enough to unlock your Communication score dimension.'
        : `You have ${intDone} session${intDone > 1 ? 's' : ''} done. Regular practice improves your Career DNA by up to 15 points.`,
      href: '/interview', cta: 'Start Interview →',
      urgency: intDone === 0 ? 75 : intDone < 3 ? 40 : 8,
    },
    // Trust score
    {
      icon:'🛡', color:'var(--green)',
      title: trust < 50 ? 'Build your Trust Score' : 'Boost your Trust Score further',
      desc:  trust < 50
        ? 'Trust Score below 50 makes you invisible to recruiters. Verify a skill or add a certificate to your vault.'
        : `Trust at ${Math.round(trust)}/100. Adding verified projects or passing a clean exam pushes it higher.`,
      href: '/vault', cta: 'Verify Skills →',
      urgency: trust < 50 ? 80 : trust < 70 ? 35 : 5,
    },
    // Recruiter visibility
    {
      icon:'📡', color:'var(--coral)',
      title: recVis < 30 ? 'Make yourself visible to recruiters' : 'Improve recruiter visibility',
      desc:  recVis < 30
        ? 'Your profile is nearly invisible. Raise your ATS and Trust scores to enter the recruiter feed.'
        : `${Math.round(recVis)}% visibility. Complete 2 more missions this week to enter the top tier.`,
      href: '/profile', cta: 'Go to Profile →',
      urgency: recVis < 30 ? 65 : recVis < 60 ? 30 : 3,
    },
    // Career DNA
    {
      icon:'🧬', color:'var(--accent)',
      title: 'Explore your Career DNA',
      desc:  'Your archetype shapes which roles and recruiters match you. Review your 9 DNA dimensions and find your highest-impact improvement.',
      href:  '/career-dna', cta: 'View DNA →',
      urgency: done < 5 ? 45 : 12,
    },
  ];

  return candidates
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 3);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WhatToDoToday({ profile }: { profile: Profile | null | undefined }) {
  if (!profile) return null;
  const actions = pickActions(profile);

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '18px 20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:10.5, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--t3)', fontFamily:'var(--font-mono)', fontWeight:600, marginBottom:3 }}>
            What to do today
          </div>
          <div style={{ fontSize:13, color:'var(--t2)' }}>3 actions personalised to your career profile</div>
        </div>
        <Link href="/missions" style={{ fontSize:11, color:'var(--accent)', textDecoration:'none', fontFamily:'var(--font-mono)' }}>
          All missions →
        </Link>
      </div>

      {/* Action cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
        {actions.map((action, i) => (
          <Link key={action.href + i} href={action.href} style={{ textDecoration:'none' }}>
            <div style={{
              background: 'var(--bg3)', border: `1.5px solid ${action.color}22`,
              borderRadius: 'var(--radius-lg)', padding: '14px 16px',
              cursor: 'pointer', transition: 'all 0.15s',
              borderLeft: `4px solid ${action.color}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{action.icon}</span>
                <span style={{ fontSize:11.5, fontWeight:700, color:action.color }}>Priority {i+1}</span>
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--t1)', marginBottom:5, lineHeight:1.3 }}>
                {action.title}
              </div>
              <div style={{ fontSize:11.5, color:'var(--t2)', lineHeight:1.55, marginBottom:10 }}>
                {action.desc}
              </div>
              <div style={{ fontSize:11.5, fontWeight:700, color:action.color }}>
                {action.cta}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
