// components/career/ATSBreakdown.tsx
// Ported from: git/Internship-ResumeBuilder/src/components/FreeATSScorer.jsx
//
// 7-category weighted ATS scorer + display.
//
// Exports:
//   - scoreResume(data): pure function — call from server-side too if you want.
//   - <ATSBreakdown resumeData={...} />: live-scoring display panel.
//
// Weights mirror the original: Contact 15 · Summary 10 · Experience 25 ·
// Education 15 · Skills 20 · Projects 10 · Extras 5.

'use client';
import { useMemo } from 'react';
import { FunnelBar } from '@/components/ui/charts';
import type { ResumeFormData } from './ResumeForm.types';

// ── Constants ───────────────────────────────────────────────────────

export const ATS_WEIGHTS = {
  contact:    { weight: 15, label: 'Contact Info' },
  summary:    { weight: 10, label: 'Summary'      },
  experience: { weight: 25, label: 'Experience'   },
  education:  { weight: 15, label: 'Education'    },
  skills:     { weight: 20, label: 'Skills'       },
  projects:   { weight: 10, label: 'Projects'     },
  extras:     { weight:  5, label: 'Extras'       },
} as const;

export type ATSCategory = keyof typeof ATS_WEIGHTS;

const ATS_KEYWORDS = [
  'managed', 'led', 'developed', 'implemented', 'designed', 'improved',
  'increased', 'reduced', 'achieved', 'delivered', 'collaborated', 'analyzed',
  'created', 'built', 'launched', 'optimized', 'automated', 'responsible',
  'experience', 'proficient', 'team', 'project', 'result', 'data', 'system',
  'process', 'solution', 'strategy',
];

export interface ATSResult {
  /** Weighted overall score 0–100 */
  overall: number;
  /** Per-category 0–100 scores */
  scores: Record<ATSCategory, number>;
  /** Specific things the user should fix */
  tips: string[];
  /** Specific things the user is doing well */
  strengths: string[];
}

// ── Scoring ─────────────────────────────────────────────────────────

export function scoreResume(data: Partial<ResumeFormData> | null | undefined): ATSResult | null {
  if (!data) return null;

  const scores = {} as Record<ATSCategory, number>;
  const tips: string[] = [];
  const strengths: string[] = [];

  // ── Contact (15%) ─────────────────────────────────────────────────
  let contact = 0;
  if (data.fullName?.trim())  { contact += 4; strengths.push('Full name present');         } else tips.push('Add your full name');
  if (data.email?.trim())     { contact += 4; strengths.push('Email address included');    } else tips.push('Add your email address');
  if (data.phone?.trim())     { contact += 3;                                              } else tips.push('Add a phone number');
  if (data.address?.trim())   { contact += 2;                                              } else tips.push('Add your location / city');
  if (data.linkedin?.trim())  { contact += 1; strengths.push('LinkedIn profile linked');   } else tips.push('Add your LinkedIn profile URL');
  if (data.portfolio?.trim()) { contact += 1; }
  scores.contact = Math.min(100, Math.round((contact / 15) * 100));

  // ── Summary (10%) ─────────────────────────────────────────────────
  const summary = data.summary?.trim() || '';
  let summaryS = 0;
  if (summary.length > 0) {
    summaryS += 30;
    if (summary.length >= 100) { summaryS += 30; strengths.push('Detailed professional summary'); }
    else                       { tips.push('Expand your summary to at least 100 characters'); }
    if (summary.length >= 200) summaryS += 20;
    const kwHits = ATS_KEYWORDS.filter((k) => summary.toLowerCase().includes(k)).length;
    summaryS += Math.min(20, kwHits * 5);
    if (kwHits >= 3) strengths.push('Summary uses strong action keywords');
    else             tips.push('Use more action words in your summary');
  } else {
    tips.push('Add a professional summary — ATS systems rank it highly');
  }
  scores.summary = Math.min(100, summaryS);

  // ── Experience (25%) ──────────────────────────────────────────────
  const exps = (data.experiences || []).filter((e) => e.role || e.company);
  let expS = 0;
  if (exps.length === 0) {
    tips.push('Add at least one work experience entry');
  } else {
    expS += Math.min(40, exps.length * 15);
    if (exps.length >= 2) strengths.push(`${exps.length} experience entries found`);
    let hasDesc = 0;
    let hasDate = 0;
    let kwTotal = 0;
    exps.forEach((e) => {
      if ((e.description?.trim().length || 0) > 50) hasDesc++;
      if (e.startDate) hasDate++;
      kwTotal += ATS_KEYWORDS.filter((k) =>
        (e.description || '').toLowerCase().includes(k),
      ).length;
    });
    if (hasDesc > 0) { expS += 25; strengths.push('Experience includes descriptions'); }
    else             { tips.push('Add descriptions to your experience entries'); }
    if (hasDate > 0) { expS += 15; }
    else             { tips.push('Add start/end dates to your experience'); }
    if (kwTotal >= 5) { expS += 20; strengths.push('Experience uses strong action verbs'); }
    else              { tips.push('Use more action verbs in experience descriptions'); }
  }
  scores.experience = Math.min(100, expS);

  // ── Education (15%) ───────────────────────────────────────────────
  const edus = (data.education || []).filter((e) => e.degree || e.institution);
  let eduS = 0;
  if (edus.length === 0) {
    tips.push('Add your education details');
  } else {
    eduS += Math.min(50, edus.length * 30);
    strengths.push('Education section present');
    if (edus.some((e) => e.institution?.trim())) eduS += 25;
    else                                          tips.push('Add institution names');
    if (edus.some((e) => e.year?.trim()))         eduS += 25;
    else                                          tips.push('Add graduation year');
  }
  scores.education = Math.min(100, eduS);

  // ── Skills (20%) ──────────────────────────────────────────────────
  const skills = data.skills || { technical: '', professional: '', personal: '' };
  const allSkills = [skills.technical, skills.professional, skills.personal]
    .filter(Boolean).join(' ').trim();
  let skillS = 0;
  if (!allSkills) {
    tips.push('Add skills — this is one of the most important ATS sections');
  } else {
    const skillCount = allSkills.split(/[,\n]+/).filter((s) => s.trim()).length;
    skillS += Math.min(60, skillCount * 8);
    if (skillCount >= 5) strengths.push(`${skillCount} skills listed`);
    else                 tips.push('Add more skills — aim for at least 5');
    if (skills.technical?.trim())    { skillS += 20; strengths.push('Technical skills section filled'); }
    else                              tips.push('Add technical skills');
    if (skills.professional?.trim()) skillS += 10;
    else                              tips.push('Add professional skills');
    if (skills.personal?.trim())      skillS += 10;
  }
  scores.skills = Math.min(100, skillS);

  // ── Projects (10%) ────────────────────────────────────────────────
  const projs = (data.projects || []).filter((p) => p.name);
  let projS = 0;
  if (projs.length === 0) {
    tips.push('Add projects to showcase your work');
  } else {
    projS += Math.min(50, projs.length * 20);
    strengths.push(`${projs.length} project(s) listed`);
    if (projs.some((p) => p.description?.trim())) projS += 30;
    else                                           tips.push('Add descriptions to your projects');
    if (projs.some((p) => p.technologies?.trim())) projS += 20;
    else                                           tips.push('Add technologies used in your projects');
  }
  scores.projects = Math.min(100, projS);

  // ── Extras (5%) ───────────────────────────────────────────────────
  const certs = (data.certificates || []).filter((c) => c.name);
  const langs = (data.languages || []).filter((l) => l.language);
  let extrasS = 0;
  if (certs.length > 0) { extrasS += 50; strengths.push(`${certs.length} certification(s) added`); }
  else                  { tips.push('Add certifications to stand out'); }
  if (langs.length > 0) extrasS += 30;
  if (data.declaration?.trim()) extrasS += 20;
  scores.extras = Math.min(100, extrasS);

  // ── Weighted overall ──────────────────────────────────────────────
  const overall = Math.round(
    (Object.keys(ATS_WEIGHTS) as ATSCategory[]).reduce(
      (sum, key) => sum + (scores[key] * ATS_WEIGHTS[key].weight) / 100,
      0,
    ),
  );

  return { overall, scores, tips, strengths };
}

// ── Display ─────────────────────────────────────────────────────────

const tierColor   = (v: number) => v >= 80 ? 'var(--green, #10b981)' : v >= 60 ? 'var(--amber, #f59e0b)' : 'var(--coral, #ef4444)';
const tierLabel   = (v: number) => v >= 80 ? 'Excellent ✨'           : v >= 60 ? 'Good 👍'                : 'Needs Work 🔧';
const tierBgLight = (v: number) => v >= 80 ? 'rgba(16,185,129,0.12)' : v >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

function ScoreRing({ score }: { score: number }) {
  const color = tierColor(score);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border, #e5e7eb)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: 'var(--t3, #9ca3af)', fontWeight: 600 }}>/100</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2 }}>{tierLabel(score)}</span>
      </div>
    </div>
  );
}

export interface ATSBreakdownProps {
  resumeData: Partial<ResumeFormData> | null | undefined;
  /** Compact display: hide the strengths/tips columns. Used in form sidebars. */
  compact?: boolean;
}

export default function ATSBreakdown({ resumeData, compact = false }: ATSBreakdownProps) {
  const result = useMemo(() => scoreResume(resumeData), [resumeData]);
  const canScore = !!resumeData?.fullName && !!resumeData?.email;

  if (!canScore) {
    return (
      <div style={S.wrapper}>
        <div style={S.header}>
          <h2 style={S.title}>📊 ATS Score Analyzer</h2>
          <p style={S.sub}>Real-time resume compatibility scoring</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--t3, #9ca3af)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 600, color: 'var(--t2, #6b7280)' }}>
            Fill in your name and email first to see your ATS score
          </p>
        </div>
      </div>
    );
  }
  if (!result) return null;

  return (
    <div style={S.wrapper}>
      {!compact && (
        <div style={S.header}>
          <h2 style={S.title}>📊 ATS Score Analyzer</h2>
          <p style={S.sub}>Real-time scoring — updates as you fill in your resume</p>
        </div>
      )}

      <div style={S.scoreSection}>
        <ScoreRing score={result.overall} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ ...S.scoreBadge, background: tierBgLight(result.overall), color: tierColor(result.overall) }}>
            {tierLabel(result.overall)}
          </div>
          <p style={{ color: 'var(--t2, #4b5563)', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
            {result.overall >= 80
              ? 'Your resume is well-optimized for ATS systems.'
              : result.overall >= 60
                ? 'Your resume is decent but has room to improve. Follow the tips below.'
                : 'Your resume needs more work. Complete the missing sections to significantly improve your score.'}
          </p>
        </div>
      </div>

      <div style={S.section}>
        <h3 style={S.sectionTitle}>📈 Category Breakdown</h3>
        {(Object.keys(ATS_WEIGHTS) as ATSCategory[]).map((key) => (
          <FunnelBar
            key={key}
            label={ATS_WEIGHTS[key].label}
            value={result.scores[key]}
            max={100}
            color={tierColor(result.scores[key])}
            labelWidth={100}
          />
        ))}
      </div>

      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div style={{ ...S.feedCard, borderLeftColor: 'var(--green, #10b981)' }}>
            <h4 style={{ ...S.feedTitle, color: 'var(--green-dark, #065f46)' }}>
              ✅ Strengths ({result.strengths.length})
            </h4>
            {result.strengths.length === 0 ? (
              <p style={{ color: 'var(--t3, #9ca3af)', fontSize: 12 }}>Complete more sections to see strengths</p>
            ) : (
              <ul style={S.feedList}>
                {result.strengths.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
              </ul>
            )}
          </div>
          <div style={{ ...S.feedCard, borderLeftColor: 'var(--amber, #f59e0b)' }}>
            <h4 style={{ ...S.feedTitle, color: 'var(--amber-dark, #92400e)' }}>
              💡 Improvement Tips ({result.tips.length})
            </h4>
            {result.tips.length === 0 ? (
              <p style={{ color: 'var(--green, #10b981)', fontWeight: 600, fontSize: 12 }}>🎉 No major issues found!</p>
            ) : (
              <ul style={S.feedList}>
                {result.tips.map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--bg3, #f9fafb)', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: 'var(--coral, #ef4444)' }}>● 0–59 Needs Work</span>
        <span style={{ color: 'var(--t3, #9ca3af)' }}>|</span>
        <span style={{ color: 'var(--amber, #f59e0b)' }}>● 60–79 Good</span>
        <span style={{ color: 'var(--t3, #9ca3af)' }}>|</span>
        <span style={{ color: 'var(--green, #10b981)' }}>● 80–100 Excellent</span>
        <span style={{ marginLeft: 'auto', color: 'var(--t3, #9ca3af)', fontWeight: 400, fontStyle: 'italic' }}>Updates automatically</span>
      </div>
    </div>
  );
}

const S = {
  wrapper: {
    background: 'var(--bg2, white)',
    borderRadius: 'var(--radius-xl, 16px)',
    padding: 24,
    boxShadow: 'var(--shadow-sm, 0 4px 20px rgba(0,0,0,0.08))',
    border: '1px solid var(--border, #e5e7eb)',
  } as const,
  header: { textAlign: 'center', marginBottom: 20 } as const,
  title:  { fontSize: 19, fontWeight: 800, color: 'var(--t1, #1f2937)', marginBottom: 4 } as const,
  sub:    { color: 'var(--t3, #9ca3af)', fontSize: 12 } as const,
  scoreSection: {
    display: 'flex', alignItems: 'center', gap: 22,
    background: 'var(--bg3, #f9fafb)',
    borderRadius: 12, padding: 18, marginBottom: 16, flexWrap: 'wrap',
  } as const,
  scoreBadge: {
    display: 'inline-block', padding: '5px 14px',
    borderRadius: 100, fontSize: 13, fontWeight: 700,
  } as const,
  section: {
    background: 'var(--bg3, #f9fafb)',
    borderRadius: 12, padding: 18, marginBottom: 12,
  } as const,
  sectionTitle: { fontSize: 14, fontWeight: 700, color: 'var(--t1, #1f2937)', marginBottom: 14 } as const,
  feedCard: {
    background: 'var(--bg2, white)',
    border: '1px solid var(--border, #e5e7eb)',
    borderLeft: '4px solid',
    borderRadius: 12, padding: 14,
  } as const,
  feedTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 } as const,
  feedList:  { paddingLeft: 18, color: 'var(--t2, #4b5563)', fontSize: 12, lineHeight: 1.7, margin: 0 } as const,
};
