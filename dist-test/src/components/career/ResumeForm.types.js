"use strict";
// components/career/ResumeForm.types.ts
// Shared types for the structured resume form. Used by both ResumeForm.tsx
// (the editor) and ATSBreakdown.tsx (the scorer), and serialised as JSON to
// the backend at POST /api/resume/structured.
//
// Shape ported from: git/Internship-ResumeBuilder/src/pages/ResumeBuilder.jsx
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORM_SECTIONS = exports.emptyFormData = exports.emptyLanguage = exports.emptyProject = exports.emptyCertificate = exports.emptyEducation = exports.emptyExperience = void 0;
// ── Empty constructors ──────────────────────────────────────────────
// crypto.randomUUID is available in modern browsers (and Node 19+).
const emptyExperience = () => ({ id: crypto.randomUUID(), role: '', company: '', startDate: '', endDate: '', description: '', currentlyWorking: false });
exports.emptyExperience = emptyExperience;
const emptyEducation = () => ({ id: crypto.randomUUID(), degree: '', institution: '', year: '', description: '', gpa: '' });
exports.emptyEducation = emptyEducation;
const emptyCertificate = () => ({ id: crypto.randomUUID(), name: '', issuer: '', date: '', credentialId: '' });
exports.emptyCertificate = emptyCertificate;
const emptyProject = () => ({ id: crypto.randomUUID(), name: '', description: '', technologies: '', link: '' });
exports.emptyProject = emptyProject;
const emptyLanguage = () => ({ id: crypto.randomUUID(), language: '', proficiency: 'Intermediate' });
exports.emptyLanguage = emptyLanguage;
const emptyFormData = () => ({
    fullName: '', email: '', phone: '', address: '', linkedin: '', portfolio: '',
    summary: '',
    experiences: [(0, exports.emptyExperience)()],
    education: [(0, exports.emptyEducation)()],
    skills: { technical: '', professional: '', personal: '' },
    certificates: [],
    projects: [],
    languages: [],
    declaration: 'I hereby declare that all information provided above is true to the best of my knowledge.',
});
exports.emptyFormData = emptyFormData;
// ── Section model (drives the form's left-side nav) ──────────────────
exports.FORM_SECTIONS = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'summary', label: 'Summary', icon: '✏️' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certificates', label: 'Certificates', icon: '🏆' },
    { id: 'languages', label: 'Languages', icon: '🌐' },
    { id: 'declaration', label: 'Declaration', icon: '📜' },
];
