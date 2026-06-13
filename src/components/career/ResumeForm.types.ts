// components/career/ResumeForm.types.ts
// Shared types for the structured resume form. Used by both ResumeForm.tsx
// (the editor) and ATSBreakdown.tsx (the scorer), and serialised as JSON to
// the backend at POST /api/resume/structured.
//
// Shape ported from: git/Internship-ResumeBuilder/src/pages/ResumeBuilder.jsx

export interface ResumeExperience {
  id: string;
  role: string;
  company: string;
  startDate: string;        // 'YYYY-MM' or 'YYYY'
  endDate:   string;        // 'YYYY-MM', 'YYYY', or '' if current
  description: string;
  currentlyWorking: boolean;
}

export interface ResumeEducation {
  id: string;
  degree: string;
  institution: string;
  year: string;
  description: string;
  gpa: string;
}

export interface ResumeCertificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

export interface ResumeLanguage {
  id: string;
  language: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
}

export interface ResumeSkills {
  technical:    string;    // comma- or newline-separated
  professional: string;
  personal:     string;
}

export interface ResumeFormData {
  // Contact
  fullName:  string;
  email:     string;
  phone:     string;
  address:   string;
  linkedin:  string;
  portfolio: string;
  photoUrl?: string;
  // Sections
  summary:      string;
  experiences:  ResumeExperience[];
  education:    ResumeEducation[];
  skills:       ResumeSkills;
  certificates: ResumeCertificate[];
  projects:     ResumeProject[];
  languages:    ResumeLanguage[];
  declaration:  string;
}

// ── Empty constructors ──────────────────────────────────────────────
// crypto.randomUUID is available in modern browsers (and Node 19+).

export const emptyExperience  = (): ResumeExperience  => ({ id: crypto.randomUUID(), role: '', company: '', startDate: '', endDate: '', description: '', currentlyWorking: false });
export const emptyEducation   = (): ResumeEducation   => ({ id: crypto.randomUUID(), degree: '', institution: '', year: '', description: '', gpa: '' });
export const emptyCertificate = (): ResumeCertificate => ({ id: crypto.randomUUID(), name: '', issuer: '', date: '', credentialId: '' });
export const emptyProject     = (): ResumeProject     => ({ id: crypto.randomUUID(), name: '', description: '', technologies: '', link: '' });
export const emptyLanguage    = (): ResumeLanguage    => ({ id: crypto.randomUUID(), language: '', proficiency: 'Intermediate' });

export const emptyFormData = (): ResumeFormData => ({
  fullName: '', email: '', phone: '', address: '', linkedin: '', portfolio: '',
  summary: '',
  experiences:  [emptyExperience()],
  education:    [emptyEducation()],
  skills:       { technical: '', professional: '', personal: '' },
  certificates: [],
  projects:     [],
  languages:    [],
  declaration:  'I hereby declare that all information provided above is true to the best of my knowledge.',
});

// ── Section model (drives the form's left-side nav) ──────────────────

export const FORM_SECTIONS = [
  { id: 'basic',        label: 'Basic Info',     icon: '👤' },
  { id: 'summary',      label: 'Summary',        icon: '✏️' },
  { id: 'experience',   label: 'Experience',     icon: '💼' },
  { id: 'education',    label: 'Education',      icon: '🎓' },
  { id: 'skills',       label: 'Skills',         icon: '⚡' },
  { id: 'projects',     label: 'Projects',       icon: '🚀' },
  { id: 'certificates', label: 'Certificates',   icon: '🏆' },
  { id: 'languages',    label: 'Languages',      icon: '🌐' },
  { id: 'declaration',  label: 'Declaration',    icon: '📜' },
] as const;

export type FormSection = typeof FORM_SECTIONS[number]['id'];
