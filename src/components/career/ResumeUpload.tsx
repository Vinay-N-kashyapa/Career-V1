// components/career/ResumeUpload.tsx
// Extracted from: apps/web/src/app/resume/page.tsx (original Upload-only flow).
// Self-contained component used by the "Upload" tab of /resume.
//
// Flow: drag-drop / browse → POST /api/resume/upload → display Claude analysis
// → optional POST /api/resume/:id/improve → show AI rewrite.

'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api/client';
import NextStepCard from '@/components/ui/NextStepCard';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { toast } from '@/lib/store/useAppStore';

interface Analysis {
  ats_score: number;
  format_quality: number;
  skill_tags: string[];
  weak_areas: string[];
  keyword_gaps: string[];
  strengths: string[];
  improvement_suggestions: string[];
  certifications_detected: string[];
  experience_level: string;
  domain: string;
}

interface AnalysisResult {
  resumeId: string;
  analysis: Analysis;
  message: string;
}

interface Improved {
  rewritten_summary?: string;
  projected_ats_score?: number;
  [k: string]: unknown;
}

export default function ResumeUpload() {
  const { vaultItems, setResumeGenerated, generateFusedRoadmap } = useCareerOS();
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState<AnalysisResult | null>(null);
  const [error,     setError]     = useState('');
  const [improving, setImproving] = useState(false);
  const [improved,  setImproved]  = useState<Improved | null>(null);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [selectedVaultItemId, setSelectedVaultItemId] = useState<string>('demo-resume-draft');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vaultItems && vaultItems.length > 0) {
      setSelectedVaultItemId(vaultItems[0].id);
    }
  }, [vaultItems]);

  const handleImportFromVault = async (itemId: string) => {
    setUploading(true);
    setError(''); setResult(null); setImproved(null);
    try {
      const res = await api.post<{ ok: boolean; resumeId: string; analysis: any; structuredData: any }>(
        '/api/resume/generate-from-vault',
        { itemId }
      );
      if (res.analysis) {
        setResult({
          resumeId: res.resumeId,
          analysis: res.analysis,
          message: 'Analyzed from Secure Vault'
        });
        setResumeGenerated(true);
        const skillTags = res.analysis.skill_tags || [];
        const weakAreas = res.analysis.weak_areas || [];
        generateFusedRoadmap(skillTags, weakAreas);
        toast.success('Secure Vault Document Synced!', 'AI analyzed details, computed ATS scores, and updated roadmap quests.');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Vault import failed');
    } finally {
      setUploading(false);
      setShowVaultModal(false);
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      setError('Only PDF, DOCX, DOC, TXT files allowed');
      return;
    }
    setUploading(true);
    setError(''); setResult(null); setImproved(null);
    const form = new FormData();
    form.append('resume', file);
    try {
      const res  = await fetch('/api/resume/upload', { method: 'POST', body: form, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResult(data);
      setResumeGenerated(true);
      if (data.analysis) {
        const skillTags = data.analysis.skill_tags || [];
        const weakAreas = data.analysis.weak_areas || [];
        generateFusedRoadmap(skillTags, weakAreas);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  async function improve() {
    if (!result?.resumeId) return;
    setImproving(true);
    try {
      const data = await api.post<{ improvements: Improved }>(`/api/resume/${result.resumeId}/improve`, {});
      // The backend wraps the data in either { improvements: ... } or returns it directly.
      setImproved((data as { improvements?: Improved })?.improvements ?? (data as Improved));
    } catch {
      // swallowed — `improved` stays null, UI just won't render the panel
    } finally {
      setImproving(false);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const a = result?.analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Drop zone — hidden once a result is loaded */}
      {!result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '56px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--accent-light)' : 'var(--bg2)',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 14 }}>{uploading ? '⏳' : '📄'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {uploading ? 'Claude is analyzing your resume...' : 'Drop your resume here'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 16 }}>
              PDF, DOCX, DOC, TXT · Max 10MB
            </div>
            {!uploading && <span className="btn-primary btn-sm" style={{ pointerEvents: 'none' }}>Browse Files</span>}
            {uploading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent)' }}>
                <span style={{ fontSize: 14 }} className="animate-spin">⟳</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>Analyzing with Claude AI...</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
            />
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowVaultModal(true); }}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 'var(--radius-lg)',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              color: 'var(--accent)',
              cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
              transition: 'all 0.15s',
              fontFamily: 'var(--font-display)',
              boxShadow: 'var(--shadow-sm)',
            }}
            className="hover-card"
          >
            <span>📂</span> Import from Secure Vault
          </button>
        </div>
      )}

      {showVaultModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(8px)', padding: 20
        }}>
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 30,
            maxWidth: 500,
            width: '100%',
            boxShadow: 'var(--shadow-2xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }} className="animate-fade-in">
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--t1)' }}>
                📁 Secure Mobile Vault Documents
              </h2>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0' }}>
                Select a document from your secure vault to compile and analyze.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {vaultItems.length === 0 ? (
                [
                  { id: 'demo-resume-draft', title: 'college_resume_draft.pdf', type: 'resume' },
                  { id: 'demo-cert', title: 'java_basic_cert.pdf', type: 'certification' }
                ].map(item => {
                  const isSelected = selectedVaultItemId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedVaultItemId(item.id)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--t1)',
                        cursor: 'pointer',
                        padding: '10px 14px', borderRadius: 10,
                        background: isSelected ? 'rgba(79,70,229,0.08)' : 'var(--bg3)',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{isSelected ? '🟢' : '⚪'}</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{item.title}</span>
                      <span style={{ fontSize: 9.5, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>{item.type}</span>
                    </div>
                  );
                })
              ) : (
                vaultItems.map(item => {
                  const isSelected = selectedVaultItemId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedVaultItemId(item.id)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--t1)',
                        cursor: 'pointer',
                        padding: '10px 14px', borderRadius: 10,
                        background: isSelected ? 'rgba(79,70,229,0.08)' : 'var(--bg3)',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{isSelected ? '🟢' : '⚪'}</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{item.title}</span>
                      <span style={{ fontSize: 9.5, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>{item.item_type}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button 
                type="button"
                className="btn-ghost" 
                onClick={() => setShowVaultModal(false)}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={() => handleImportFromVault(selectedVaultItemId)}
                style={{ padding: '8px 20px', fontSize: 13 }}
              >
                Compile Document
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <span>⚠</span> {error}
        </div>
      )}

      {a && (
        <>
          {/* Score row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'ATS Score',      val: Math.round(a.ats_score),      color: 'teal',   max: '/100', isNum: true  },
              { label: 'Format Quality', val: Math.round(a.format_quality), color: 'purple', max: '/100', isNum: true  },
              { label: 'Experience',     val: a.experience_level,           color: 'amber',  max: '',     isNum: false },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '18px 20px',
                borderTop: `3px solid var(--${s.color})`,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: s.isNum ? 32 : 22, fontWeight: 800, color: `var(--${s.color})`, letterSpacing: '-1px' }}>
                  {s.val}
                  {s.isNum && <span style={{ fontSize: 14, color: 'var(--t4)', fontWeight: 400, letterSpacing: 0 }}>{s.max}</span>}
                </div>
                {s.isNum && (
                  <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 4, marginTop: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ height: '100%', width: `${s.val as number}%`, background: `var(--${s.color})`, borderRadius: 4 }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Strengths + Improvements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={cardStyle}>
              <div style={cardLabel}>✓ Strengths</div>
              {(a.strengths || []).map((s, i) => (
                <div key={i} style={listRow}>
                  <span style={{ color: 'var(--green)', marginTop: 1, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {s}
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={cardLabel}>→ Improvements</div>
              {(a.improvement_suggestions || []).map((s, i) => (
                <div key={i} style={listRow}>
                  <span style={{ color: 'var(--amber)', marginTop: 1, fontWeight: 700, flexShrink: 0 }}>→</span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Detected skills */}
          <div style={cardStyle}>
            <div style={cardLabel}>Detected Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {(a.skill_tags || []).map((s) => <span key={s} className="skill-tag teal">{s}</span>)}
            </div>
          </div>

          {/* Keyword gaps → Learn link (this is the existing cross-module wire) */}
          {(a.keyword_gaps || []).length > 0 && (
            <div style={{ background: 'var(--coral-light)', border: '1px solid #fecaca', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
              <div style={{ fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--coral)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 6 }}>⚠ Missing Keywords</div>
              <div style={{ fontSize: 11, color: 'var(--coral)', marginBottom: 10, opacity: 0.8 }}>Click any gap to open a targeted study session →</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {a.keyword_gaps.map((k) => (
                  <a key={k} href={`/learn?topic=${encodeURIComponent(k)}`} style={{ textDecoration: 'none' }} title={`Study ${k} in Learn`}>
                    <span className="skill-tag danger" style={{ cursor: 'pointer' }}>📚 {k}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={improve} disabled={improving} className="btn-primary">
              {improving ? '⏳ Claude is improving...' : '✦ AI Improve Resume'}
            </button>
            <button onClick={() => { setResult(null); setImproved(null); }} className="btn-ghost">
              Upload Different Resume
            </button>
          </div>

          {improved && (
            <div style={{ background: 'var(--accent-light)', border: '1px solid #c7d2fe', borderRadius: 'var(--radius-xl)', padding: 22 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--accent)', letterSpacing: '-0.3px' }}>
                ✦ AI-Improved Resume Sections
              </div>
              {improved.rewritten_summary && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...cardLabel, color: 'var(--accent)', marginBottom: 7 }}>Professional Summary</div>
                  <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.7, background: 'var(--bg2)', padding: '13px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {improved.rewritten_summary}
                  </div>
                </div>
              )}
              {improved.projected_ats_score && (
                <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  ↑ Projected ATS: {improved.projected_ats_score}/100
                  <span style={{ color: 'var(--t3)', fontWeight: 400 }}> (from {Math.round(a.ats_score)})</span>
                </div>
              )}
            </div>
          )}

          {/* Next-step CTAs — close the cross-page workflow gap.
              Surfaced once analysis is loaded so the user has a clear path forward. */}
          <div style={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{
              fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase',
              color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 600,
              marginBottom: 2,
            }}>
              What to do next
            </div>
            {(a.keyword_gaps || []).length > 0 && (
              <NextStepCard
                eyebrow="Step 1 of 2"
                title="Close your top skill gap"
                description={`You're missing ${a.keyword_gaps.length} keyword${a.keyword_gaps.length > 1 ? 's' : ''} that recruiters search for. Study the most common one first.`}
                href={`/learn?topic=${encodeURIComponent(a.keyword_gaps[0])}`}
                ctaLabel={`Study ${a.keyword_gaps[0]} →`}
                icon="📚"
                color="var(--coral)"
              />
            )}
            <NextStepCard
              eyebrow={(a.keyword_gaps || []).length > 0 ? 'Step 2 of 2' : 'Next step'}
              title="See opportunities that match"
              description={`Your ATS profile is ready. ${Math.round(a.ats_score) >= 70 ? "You're well-positioned for matches." : 'Match accuracy improves as your ATS score climbs.'}`}
              href="/opportunities"
              ctaLabel="Browse →"
              icon="🎯"
              color="var(--teal)"
            />
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  padding: '18px 20px',
  boxShadow: 'var(--shadow-sm)',
} as const;

const cardLabel = {
  fontSize: 10.5,
  letterSpacing: '0.8px',
  textTransform: 'uppercase' as const,
  color: 'var(--t3)',
  fontFamily: 'var(--font-mono)',
  fontWeight: 600,
  marginBottom: 12,
};

const listRow = {
  display: 'flex',
  gap: 9,
  marginBottom: 7,
  fontSize: 12.5,
  color: 'var(--t1)',
  alignItems: 'flex-start' as const,
};
