// components/career/ResumeForm.tsx
// Ported from: git/Internship-ResumeBuilder/src/pages/ResumeBuilder.jsx
//
// Structured 9-section resume editor. Live ATS scoring on the right.
// Save/load is delegated to the parent via the `onSave` prop — this component
// is backend-agnostic so it can be reused for templates, drafts, anonymised
// recruiter-side resume previews, etc.
//
// Removed from the original: Supabase calls, the old AuthContext, the photo
// upload + crop modal (deferred), the AI suggestions panel (deferred to
// Phase 3 — needs `/api/resume/suggestions`), the preview/PDF modal (deferred
// to Phase 4 — needs the Python PDF sidecar).

'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ATSBreakdown from './ATSBreakdown';
import {
  ResumeFormData,
  ResumeExperience,
  ResumeEducation,
  ResumeCertificate,
  ResumeProject,
  ResumeLanguage,
  emptyExperience, emptyEducation, emptyCertificate, emptyProject, emptyLanguage,
  emptyFormData,
  FORM_SECTIONS, FormSection,
} from './ResumeForm.types';

export interface ResumeFormProps {
  /** Initial data — used to hydrate when editing an existing resume. */
  initialData?: ResumeFormData;
  /** Called when the user clicks Save. Should persist and return the saved data. */
  onSave?: (data: ResumeFormData) => Promise<void>;
  /** Show the ATS sidebar. Default: true. */
  showATS?: boolean;
}

// Helpers — calculate completion %. Used by the section nav.
function calcCompletion(d: ResumeFormData): number {
  let total = 0, done = 0;
  // Basic info
  total += 6;
  if (d.fullName?.trim())  done++;
  if (d.email?.trim())     done++;
  if (d.phone?.trim())     done++;
  if (d.address?.trim())   done++;
  if (d.linkedin?.trim())  done++;
  if (d.portfolio?.trim()) done++;
  // Summary
  total += 1;
  if (d.summary?.trim().length >= 50) done++;
  // Experience (at least one filled)
  total += 1;
  if (d.experiences.some((e) => e.role && e.company)) done++;
  // Education
  total += 1;
  if (d.education.some((e) => e.degree && e.institution)) done++;
  // Skills (any of three)
  total += 1;
  if (d.skills.technical || d.skills.professional || d.skills.personal) done++;
  // Projects (optional)
  total += 1;
  if (d.projects.some((p) => p.name)) done++;
  // Certificates (optional)
  total += 1;
  if (d.certificates.some((c) => c.name)) done++;
  // Languages (optional)
  total += 1;
  if (d.languages.some((l) => l.language)) done++;
  return Math.round((done / total) * 100);
}

export default function ResumeForm({ initialData, onSave, showATS = true }: ResumeFormProps) {
  const [data,   setData]   = useState<ResumeFormData>(initialData ?? emptyFormData());
  const [active, setActive] = useState<FormSection>('basic');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Re-hydrate if parent ever swaps initialData
  useEffect(() => { if (initialData) setData(initialData); }, [initialData]);

  const completion = useMemo(() => calcCompletion(data), [data]);

  // ── Mutators ──────────────────────────────────────────────────────
  const set    = <K extends keyof ResumeFormData>(field: K, value: ResumeFormData[K]) => setData((d) => ({ ...d, [field]: value }));
  const setSkill = (k: keyof ResumeFormData['skills'], v: string) => setData((d) => ({ ...d, skills: { ...d.skills, [k]: v } }));

  const updateArr = <T extends { id: string }>(field: 'experiences' | 'education' | 'certificates' | 'projects' | 'languages', id: string, patch: Partial<T>) => {
    setData((d) => ({
      ...d,
      [field]: (d[field] as unknown as T[]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };
  const addArr = (field: 'experiences' | 'education' | 'certificates' | 'projects' | 'languages') => {
    const newItem =
      field === 'experiences'  ? emptyExperience()  :
      field === 'education'    ? emptyEducation()   :
      field === 'certificates' ? emptyCertificate() :
      field === 'projects'     ? emptyProject()     :
                                 emptyLanguage();
    setData((d) => ({ ...d, [field]: [...(d[field] as { id: string }[]), newItem] }));
  };
  const delArr = (field: 'experiences' | 'education' | 'certificates' | 'projects' | 'languages', id: string) => {
    setData((d) => ({ ...d, [field]: (d[field] as { id: string }[]).filter((x) => x.id !== id) }));
  };

  // ── Save ──────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(data);
      setSaved(true);
      setSavedAt(new Date());
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [data, onSave]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: showATS ? '180px 1fr 360px' : '180px 1fr', gap: 20 }}>
      {/* ─ Section nav (left) ─ */}
      <aside style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
        <div style={S.completionCard}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 6 }}>Completion</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-1px' }}>{completion}<span style={{ fontSize: 13, color: 'var(--t4)' }}>%</span></div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${completion}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.5s' }} />
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FORM_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              style={{
                ...S.navBtn,
                background: active === s.id ? 'var(--accent-light)' : 'transparent',
                color:      active === s.id ? 'var(--accent)'       : 'var(--t2)',
                fontWeight: active === s.id ? 700 : 500,
              }}
            >
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={save} disabled={saving || !onSave} className="btn-primary" style={{ marginTop: 16, width: '100%' }}>
          {saving ? '⏳ Saving...' : saved ? '✓ Saved' : '💾 Save Resume'}
        </button>
        {savedAt && !saving && (
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            Last saved {savedAt.toLocaleTimeString()}
          </div>
        )}
      </aside>

      {/* ─ Form (center) ─ */}
      <main style={S.formCard}>
        {active === 'basic'        && <BasicInfoSection  data={data} set={set} />}
        {active === 'summary'      && <SummarySection    data={data} set={set} />}
        {active === 'experience'   && <ExperienceSection items={data.experiences}  update={(id, p) => updateArr<ResumeExperience>('experiences', id, p)}   add={() => addArr('experiences')}   del={(id) => delArr('experiences', id)}   />}
        {active === 'education'    && <EducationSection  items={data.education}    update={(id, p) => updateArr<ResumeEducation>('education', id, p)}      add={() => addArr('education')}      del={(id) => delArr('education', id)}      />}
        {active === 'skills'       && <SkillsSection     skills={data.skills} setSkill={setSkill} />}
        {active === 'projects'     && <ProjectsSection   items={data.projects}     update={(id, p) => updateArr<ResumeProject>('projects', id, p)}         add={() => addArr('projects')}       del={(id) => delArr('projects', id)}       />}
        {active === 'certificates' && <CertsSection      items={data.certificates} update={(id, p) => updateArr<ResumeCertificate>('certificates', id, p)} add={() => addArr('certificates')}   del={(id) => delArr('certificates', id)}   />}
        {active === 'languages'    && <LanguagesSection  items={data.languages}    update={(id, p) => updateArr<ResumeLanguage>('languages', id, p)}       add={() => addArr('languages')}      del={(id) => delArr('languages', id)}      />}
        {active === 'declaration'  && <DeclarationSection data={data} set={set} />}
      </main>

      {/* ─ ATS sidebar (right) ─ */}
      {showATS && (
        <aside style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <ATSBreakdown resumeData={data} compact />
        </aside>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Sub-sections
// Each one is a small focused component that just edits a slice of the form.
// ════════════════════════════════════════════════════════════════════

function FormHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--t3)', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function ItemCard({ title, onDelete, children }: { title: string; onDelete?: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{title}</div>
        {onDelete && (
          <button type="button" onClick={onDelete} style={{ background: 'transparent', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 4 }}>
            ✕ Remove
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="btn-ghost" style={{ width: '100%' }}>
      + {label}
    </button>
  );
}

// ── Basic ───────────────────────────────────────────────────────────
type Setter = <K extends keyof ResumeFormData>(field: K, value: ResumeFormData[K]) => void;
function BasicInfoSection({ data, set }: { data: ResumeFormData; set: Setter }) {
  return (
    <>
      <FormHeader icon="👤" title="Basic Info" subtitle="Recruiters scan this in 6 seconds — make it count." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Full Name *"><input className="input" value={data.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Jane Doe" /></Field>
        <Field label="Email *"><input className="input" type="email" value={data.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" /></Field>
        <Field label="Phone"><input className="input" value={data.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
        <Field label="Location"><input className="input" value={data.address} onChange={(e) => set('address', e.target.value)} placeholder="Bengaluru, India" /></Field>
        <Field label="LinkedIn"><input className="input" value={data.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="linkedin.com/in/janedoe" /></Field>
        <Field label="Portfolio / Website"><input className="input" value={data.portfolio} onChange={(e) => set('portfolio', e.target.value)} placeholder="janedoe.dev" /></Field>
      </div>
    </>
  );
}

// ── Summary ─────────────────────────────────────────────────────────
function SummarySection({ data, set }: { data: ResumeFormData; set: Setter }) {
  return (
    <>
      <FormHeader icon="✏️" title="Professional Summary" subtitle="2–3 punchy sentences. Lead with your strongest result." />
      <Field label="Summary" hint="Aim for 100–250 chars · use action verbs (built, led, designed, increased)">
        <textarea
          className="input"
          rows={6}
          value={data.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder="Full-stack engineer with 3 years building production React + Node systems. Shipped..."
        />
      </Field>
      <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
        {data.summary.length} characters
      </div>
    </>
  );
}

// ── Experience ──────────────────────────────────────────────────────
function ExperienceSection({ items, update, add, del }: { items: ResumeExperience[]; update: (id: string, p: Partial<ResumeExperience>) => void; add: () => void; del: (id: string) => void }) {
  return (
    <>
      <FormHeader icon="💼" title="Work Experience" subtitle="Most recent first. Quantify everything you can." />
      {items.map((exp, i) => (
        <ItemCard key={exp.id} title={`Experience #${i + 1}`} onDelete={items.length > 1 ? () => del(exp.id) : undefined}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Role"><input className="input" value={exp.role} onChange={(e) => update(exp.id, { role: e.target.value })} placeholder="Software Engineer Intern" /></Field>
            <Field label="Company"><input className="input" value={exp.company} onChange={(e) => update(exp.id, { company: e.target.value })} placeholder="Acme Corp" /></Field>
            <Field label="Start Date"><input className="input" type="month" value={exp.startDate} onChange={(e) => update(exp.id, { startDate: e.target.value })} /></Field>
            <Field label="End Date">
              <input className="input" type="month" value={exp.endDate} disabled={exp.currentlyWorking} onChange={(e) => update(exp.id, { endDate: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)', marginTop: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={exp.currentlyWorking} onChange={(e) => update(exp.id, { currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })} />
                Currently working here
              </label>
            </Field>
          </div>
          <Field label="Description" hint="Bullet points. Start with action verbs. Add numbers.">
            <textarea className="input" rows={4} value={exp.description} onChange={(e) => update(exp.id, { description: e.target.value })}
              placeholder="• Built X that improved Y by 30%&#10;• Led migration from A to B&#10;• Owned the C pipeline..." />
          </Field>
        </ItemCard>
      ))}
      <AddButton onClick={add} label="Add Another Experience" />
    </>
  );
}

// ── Education ───────────────────────────────────────────────────────
function EducationSection({ items, update, add, del }: { items: ResumeEducation[]; update: (id: string, p: Partial<ResumeEducation>) => void; add: () => void; del: (id: string) => void }) {
  return (
    <>
      <FormHeader icon="🎓" title="Education" />
      {items.map((edu, i) => (
        <ItemCard key={edu.id} title={`Education #${i + 1}`} onDelete={items.length > 1 ? () => del(edu.id) : undefined}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Degree"><input className="input" value={edu.degree} onChange={(e) => update(edu.id, { degree: e.target.value })} placeholder="B.Tech Computer Science" /></Field>
            <Field label="Institution"><input className="input" value={edu.institution} onChange={(e) => update(edu.id, { institution: e.target.value })} placeholder="IIT Bombay" /></Field>
            <Field label="Year"><input className="input" value={edu.year} onChange={(e) => update(edu.id, { year: e.target.value })} placeholder="2020 – 2024" /></Field>
            <Field label="GPA / Score"><input className="input" value={edu.gpa} onChange={(e) => update(edu.id, { gpa: e.target.value })} placeholder="8.7 / 10" /></Field>
          </div>
          <Field label="Description (optional)">
            <textarea className="input" rows={3} value={edu.description} onChange={(e) => update(edu.id, { description: e.target.value })} placeholder="Specialization, key projects, honors..." />
          </Field>
        </ItemCard>
      ))}
      <AddButton onClick={add} label="Add Another Degree" />
    </>
  );
}

// ── Skills ──────────────────────────────────────────────────────────
function SkillsSection({ skills, setSkill }: { skills: ResumeFormData['skills']; setSkill: (k: keyof ResumeFormData['skills'], v: string) => void }) {
  return (
    <>
      <FormHeader icon="⚡" title="Skills" subtitle="Split across three buckets. Comma-separated." />
      <Field label="Technical Skills" hint="Languages, frameworks, tools, databases">
        <textarea className="input" rows={3} value={skills.technical} onChange={(e) => setSkill('technical', e.target.value)} placeholder="Python, React, Node.js, PostgreSQL, Docker, AWS" />
      </Field>
      <Field label="Professional Skills" hint="Communication, project management, mentoring">
        <textarea className="input" rows={3} value={skills.professional} onChange={(e) => setSkill('professional', e.target.value)} placeholder="Agile, Cross-functional collaboration, Public speaking" />
      </Field>
      <Field label="Personal Skills" hint="Soft skills, hobbies-as-strengths">
        <textarea className="input" rows={3} value={skills.personal} onChange={(e) => setSkill('personal', e.target.value)} placeholder="Adaptability, Critical thinking, Curiosity" />
      </Field>
    </>
  );
}

// ── Projects ────────────────────────────────────────────────────────
function ProjectsSection({ items, update, add, del }: { items: ResumeProject[]; update: (id: string, p: Partial<ResumeProject>) => void; add: () => void; del: (id: string) => void }) {
  return (
    <>
      <FormHeader icon="🚀" title="Projects" subtitle="Side projects, hackathons, OSS contributions." />
      {items.length === 0 && <div style={S.emptyHint}>No projects yet — projects are a strong ATS signal, especially for early-career roles.</div>}
      {items.map((p, i) => (
        <ItemCard key={p.id} title={`Project #${i + 1}`} onDelete={() => del(p.id)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Project Name"><input className="input" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} placeholder="Career Twin" /></Field>
            <Field label="Link"><input className="input" value={p.link} onChange={(e) => update(p.id, { link: e.target.value })} placeholder="github.com/you/project" /></Field>
          </div>
          <Field label="Technologies" hint="Comma-separated">
            <input className="input" value={p.technologies} onChange={(e) => update(p.id, { technologies: e.target.value })} placeholder="Next.js, Postgres, Redis" />
          </Field>
          <Field label="Description"><textarea className="input" rows={3} value={p.description} onChange={(e) => update(p.id, { description: e.target.value })} placeholder="What it does, what you built, what you learned" /></Field>
        </ItemCard>
      ))}
      <AddButton onClick={add} label="Add Project" />
    </>
  );
}

// ── Certificates ────────────────────────────────────────────────────
function CertsSection({ items, update, add, del }: { items: ResumeCertificate[]; update: (id: string, p: Partial<ResumeCertificate>) => void; add: () => void; del: (id: string) => void }) {
  return (
    <>
      <FormHeader icon="🏆" title="Certifications" subtitle="Coursera, AWS, GCP, anything that has a verifiable cert." />
      {items.length === 0 && <div style={S.emptyHint}>Certifications are part of the Trust Score — even one helps.</div>}
      {items.map((c, i) => (
        <ItemCard key={c.id} title={`Certificate #${i + 1}`} onDelete={() => del(c.id)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name"><input className="input" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} placeholder="AWS Certified Cloud Practitioner" /></Field>
            <Field label="Issuer"><input className="input" value={c.issuer} onChange={(e) => update(c.id, { issuer: e.target.value })} placeholder="Amazon Web Services" /></Field>
            <Field label="Date Issued"><input className="input" type="month" value={c.date} onChange={(e) => update(c.id, { date: e.target.value })} /></Field>
            <Field label="Credential ID"><input className="input" value={c.credentialId} onChange={(e) => update(c.id, { credentialId: e.target.value })} placeholder="ABC-123-XYZ" /></Field>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={add} label="Add Certificate" />
    </>
  );
}

// ── Languages ───────────────────────────────────────────────────────
function LanguagesSection({ items, update, add, del }: { items: ResumeLanguage[]; update: (id: string, p: Partial<ResumeLanguage>) => void; add: () => void; del: (id: string) => void }) {
  return (
    <>
      <FormHeader icon="🌐" title="Languages" />
      {items.length === 0 && <div style={S.emptyHint}>Add languages you can work in professionally.</div>}
      {items.map((l, i) => (
        <ItemCard key={l.id} title={`Language #${i + 1}`} onDelete={() => del(l.id)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Language"><input className="input" value={l.language} onChange={(e) => update(l.id, { language: e.target.value })} placeholder="English" /></Field>
            <Field label="Proficiency">
              <select className="input" value={l.proficiency} onChange={(e) => update(l.id, { proficiency: e.target.value as ResumeLanguage['proficiency'] })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Native</option>
              </select>
            </Field>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={add} label="Add Language" />
    </>
  );
}

// ── Declaration ─────────────────────────────────────────────────────
function DeclarationSection({ data, set }: { data: ResumeFormData; set: Setter }) {
  return (
    <>
      <FormHeader icon="📜" title="Declaration" subtitle="The standard close on Indian / South-Asian-style resumes. Optional elsewhere." />
      <Field label="Declaration Text">
        <textarea className="input" rows={4} value={data.declaration} onChange={(e) => set('declaration', e.target.value)} />
      </Field>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const S = {
  completionCard: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 14,
    marginBottom: 12,
    boxShadow: 'var(--shadow-sm)',
  } as const,
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '8px 11px',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.12s',
  } as const,
  formCard: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 26,
    boxShadow: 'var(--shadow-sm)',
    minHeight: 540,
  } as const,
  emptyHint: {
    fontSize: 12,
    color: 'var(--t3)',
    fontStyle: 'italic',
    padding: '12px 14px',
    background: 'var(--bg3)',
    borderRadius: 'var(--radius)',
    marginBottom: 12,
  } as const,
};
