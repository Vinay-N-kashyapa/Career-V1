'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResumePage;
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
const ResumeUpload_1 = __importDefault(require("@/components/career/ResumeUpload"));
const ResumeForm_1 = __importDefault(require("@/components/career/ResumeForm"));
const ResumeForm_types_1 = require("@/components/career/ResumeForm.types");
const PinsGate_1 = __importDefault(require("@/components/pins/PinsGate"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AuthContext_1 = require("@/lib/context/AuthContext");
const printResume_1 = require("@/lib/printResume");
const useAppStore_1 = require("@/lib/store/useAppStore");
const TABS = [
    { id: 'upload', label: 'Upload', icon: '📄', hint: 'Drop an existing resume — AI analyses it for ATS gaps' },
    { id: 'build', label: 'Build', icon: '✏️', hint: 'Build from scratch with live ATS scoring as you fill in' },
];
function ResumePage() {
    const [tab, setTab] = (0, react_1.useState)('upload');
    const [initialData, setInitialData] = (0, react_1.useState)(undefined);
    const [resumeId, setResumeId] = (0, react_1.useState)(null);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [saveState, setSaveState] = (0, react_1.useState)('idle');
    const [saveError, setSaveError] = (0, react_1.useState)('');
    // AI improve state
    const [improving, setImproving] = (0, react_1.useState)(false);
    const [improvements, setImprovements] = (0, react_1.useState)(null);
    const [improveError, setImproveError] = (0, react_1.useState)('');
    // PDF download state
    const [downloading, setDownloading] = (0, react_1.useState)(false);
    const [downloadError, setDownloadError] = (0, react_1.useState)('');
    const saveTimeoutRef = (0, react_1.useRef)(null);
    // Load existing structured resume on mount
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await client_1.api.get('/api/resume/structured/me');
                if (!cancelled) {
                    if (data?.data)
                        setInitialData(data.data);
                    if (data?.resumeId)
                        setResumeId(data.resumeId);
                }
            }
            catch {
                // No existing data — form starts blank
            }
            finally {
                if (!cancelled)
                    setLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);
    // ── Save handler ────────────────────────────────────────────────────────────
    async function handleSave(data) {
        setSaveState('saving');
        setSaveError('');
        if (saveTimeoutRef.current)
            clearTimeout(saveTimeoutRef.current);
        try {
            const res = await client_1.api.post('/api/resume/structured', data);
            setInitialData(data);
            if (res.resumeId)
                setResumeId(res.resumeId);
            setSaveState('saved');
            setResumeGenerated(true);
            const skillTags = data.skills?.technical ? data.skills.technical.split(',').map((s) => s.trim()).filter(Boolean) : [];
            const weakAreas = ['Docker', 'CI/CD', 'System Design'];
            generateFusedRoadmap(skillTags, weakAreas);
            // Reset saved badge after 3s
            saveTimeoutRef.current = setTimeout(() => setSaveState('idle'), 3000);
            // Clear stale improvements whenever the form is saved (data may have changed)
            setImprovements(null);
            setImproveError('');
        }
        catch (e) {
            setSaveState('error');
            setSaveError(e instanceof Error ? e.message : 'Save failed');
        }
    }
    const { vaultItems, resumeGenerated, setResumeGenerated, generateFusedRoadmap, onboardingStep, completedQuests, javaTestPassed, earnPins: resumeEarnPins, addVaultItem } = (0, CareerOSContext_1.useCareerOS)();
    // Dummy upload states
    const [uploadDocName, setUploadDocName] = (0, react_1.useState)('');
    const [uploadDocType, setUploadDocType] = (0, react_1.useState)('resume');
    const handleUploadToVault = async () => {
        if (!uploadDocName.trim())
            return;
        try {
            await addVaultItem({
                title: uploadDocName.trim(),
                item_type: uploadDocType,
                description: `Uploaded evidence for career resume generation.`,
                skill_tags: uploadDocType === 'resume' ? ['Java', 'Spring Boot', 'SQL', 'Git'] : []
            });
            setUploadDocName('');
        }
        catch (e) {
            console.error('Failed dummy upload:', e);
        }
    };
    const { user } = (0, AuthContext_1.useAuth)();
    const teacherId = user?.selectedTeacherId || 'priya';
    const teacher = {
        priya: { name: 'Ms. Priya', emoji: '👩‍💼' },
        aisha: { name: 'Ms. Aisha', emoji: '👩‍🏫' },
        rohan: { name: 'Mr. Rohan', emoji: '👨‍💻' },
        vikram: { name: 'Mr. Vikram', emoji: '👨‍⚖️' },
    }[teacherId] || { name: 'Ms. Priya', emoji: '👩‍💼' };
    const isRoadmapCompleted = completedQuests.length >= 3 || javaTestPassed || onboardingStep >= 5;
    const shouldShowAssets = resumeGenerated || isRoadmapCompleted;
    const [generating, setGenerating] = (0, react_1.useState)(false);
    const [genProgress, setGenProgress] = (0, react_1.useState)(0);
    const [selectedVaultItemId, setSelectedVaultItemId] = (0, react_1.useState)('demo-resume-draft');
    // Set default selected vault item once loaded
    (0, react_1.useEffect)(() => {
        if (vaultItems && vaultItems.length > 0) {
            setSelectedVaultItemId(vaultItems[0].id);
        }
    }, [vaultItems]);
    // Portfolio Theme Builder Simulator States
    const [portfolioTheme, setPortfolioTheme] = (0, react_1.useState)('modern');
    const [showPortfolioPreview, setShowPortfolioPreview] = (0, react_1.useState)(false);
    const handleGenerateAIAssets = async () => {
        setGenerating(true);
        setGenProgress(5);
        // Simulate loading progress on client while AI compiles the file
        const progressTimer = setInterval(() => {
            setGenProgress(prev => {
                if (prev >= 94) {
                    clearInterval(progressTimer);
                    return prev;
                }
                return prev + Math.floor(Math.random() * 6) + 2;
            });
        }, 280);
        try {
            const res = await client_1.api.post('/api/resume/generate-from-vault', { itemId: selectedVaultItemId });
            clearInterval(progressTimer);
            setGenProgress(100);
            // Update form initial data
            if (res.structuredData) {
                setInitialData(res.structuredData);
            }
            if (res.resumeId) {
                setResumeId(res.resumeId);
            }
            // Update global context states to unlock downstream features
            setTimeout(() => {
                setResumeGenerated(true);
                setGenerating(false);
                const skillTags = res.analysis?.skill_tags || [];
                const weakAreas = res.analysis?.weak_areas || [];
                generateFusedRoadmap(skillTags, weakAreas);
                useAppStore_1.toast.success('Resume & CV Generated! 💼', 'Targeted quests have been added to your roadmap pipeline.');
            }, 500);
        }
        catch (err) {
            clearInterval(progressTimer);
            setGenerating(false);
            alert('AI Generation failed: ' + err.message);
        }
    };
    // ── AI Improve handler ──────────────────────────────────────────────────────
    async function handleImprove() {
        if (!resumeId) {
            setImproveError('Save your resume first, then click AI Improve.');
            return;
        }
        setImproving(true);
        setImproveError('');
        setImprovements(null);
        try {
            const res = await client_1.api.post(`/api/resume/structured/${resumeId}/enhance`, {});
            setImprovements(res.improvements);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'AI improve failed';
            // 402/403 = paywall, 501 = not yet implemented, etc.
            if (msg.includes('402') || msg.includes('403') || msg.toLowerCase().includes('tier')) {
                setImproveError('AI Improve is a Pro feature. Upgrade to unlock it.');
            }
            else {
                setImproveError(msg);
            }
        }
        finally {
            setImproving(false);
        }
    }
    // ── PDF Download handler ────────────────────────────────────────────────────
    async function handleDownloadPdf() {
        if (!resumeId || !initialData) {
            setDownloadError('Save your resume first before downloading.');
            return;
        }
        setDownloading(true);
        setDownloadError('');
        try {
            (0, printResume_1.printResumeClientSide)(initialData);
        }
        catch (e) {
            setDownloadError(e instanceof Error ? e.message : 'Download failed');
        }
        finally {
            setDownloading(false);
        }
    }
    // ── Build tab action bar ─────────────────────────────────────────────────────
    const BuildActions = () => (<div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            marginBottom: 20,
        }}>
      {/* Download PDF */}
      <button onClick={handleDownloadPdf} disabled={!resumeId || downloading} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 'var(--radius)',
            border: 'none', cursor: resumeId ? 'pointer' : 'not-allowed',
            background: resumeId ? 'var(--accent)' : 'var(--bg3)',
            color: resumeId ? '#fff' : 'var(--t3)',
            fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-display)',
            opacity: downloading ? 0.7 : 1,
            transition: 'all 0.15s',
            boxShadow: resumeId ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
        }}>
        {downloading ? (<><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Generating…</>) : (<>⬇ Download PDF</>)}
      </button>

      {/* AI Improve — gated by pins */}
      <PinsGate_1.default featureKey="resume_enhance" onUnlocked={handleImprove}>
        <button disabled={!resumeId || improving} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 'var(--radius)',
            border: '1.5px solid var(--accent)', cursor: resumeId ? 'pointer' : 'not-allowed',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-display)',
            opacity: improving ? 0.7 : 1,
            transition: 'all 0.15s',
        }}>
          {improving ? (<><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Improving…</>) : (<>✨ AI Improve</>)}
        </button>
      </PinsGate_1.default>

      {/* Save state badge */}
      {saveState === 'saving' && (<span style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Saving…
        </span>)}
      {saveState === 'saved' && (<span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Saved</span>)}
      {saveState === 'error' && (<span style={{ fontSize: 12, color: 'var(--coral)' }}>⚠ {saveError}</span>)}

      {/* No resume ID hint */}
      {!resumeId && (<span style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>
          Fill in your details and save to enable PDF &amp; AI Improve
        </span>)}
    </div>);
    // ── Improvement panel ────────────────────────────────────────────────────────
    const ImprovementPanel = () => {
        if (!improvements)
            return null;
        return (<div style={{
                marginTop: 24,
                border: '1.5px solid var(--accent)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-light)',
                overflow: 'hidden',
            }}>
        {/* Header */}
        <div style={{
                padding: '14px 20px',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                AI Improvements Ready
              </div>
              {improvements.projected_ats_score !== undefined && (<div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  Projected ATS score: <strong style={{ color: '#fff' }}>{improvements.projected_ats_score}/100</strong>
                </div>)}
            </div>
          </div>
          <button onClick={() => setImprovements(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Key changes */}
          {(improvements.key_changes?.length || 0) > 0 && (<div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Key Changes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {improvements.key_changes.map((c, i) => (<div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--t1)' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                    <span>{c}</span>
                  </div>))}
              </div>
            </div>)}

          {/* Improved summary */}
          {improvements.summary && (<SuggestionBlock label="Improved Summary" content={improvements.summary} copyText={improvements.summary}/>)}

          {/* Improved experience bullets */}
          {(improvements.experience_bullets?.length || 0) > 0 && (<div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Improved Experience Bullets
              </div>
              {improvements.experience_bullets.map((exp, i) => (<div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 5 }}>
                    {exp.role} · {exp.company}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {exp.bullets.map((b, j) => (<div key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--t1)', background: 'var(--bg2)', borderRadius: 6, padding: '6px 10px' }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
                        <span style={{ flex: 1 }}>{b}</span>
                        <button onClick={() => navigator.clipboard.writeText(b)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 11, flexShrink: 0 }} title="Copy">Copy</button>
                      </div>))}
                  </div>
                </div>))}
            </div>)}

          {/* Improved skills */}
          {(improvements.skills_technical || improvements.skills_professional) && (<div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Improved Skills
              </div>
              {improvements.skills_technical && (<SuggestionBlock label="Technical Skills" content={improvements.skills_technical} copyText={improvements.skills_technical} compact/>)}
              {improvements.skills_professional && (<SuggestionBlock label="Professional Skills" content={improvements.skills_professional} copyText={improvements.skills_professional} compact/>)}
            </div>)}

          {/* Missing keywords */}
          {(improvements.keyword_additions?.length || 0) > 0 && (<div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Missing Keywords (add these to boost ATS)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {improvements.keyword_additions.map((k, i) => (<span key={i} style={{
                        padding: '4px 10px', borderRadius: 100,
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 11.5, fontWeight: 600,
                    }}>{k}</span>))}
              </div>
            </div>)}
        </div>
      </div>);
    };
    return (<>
      {!shouldShowAssets ? (<div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }} className="animate-fade-in">
          <div style={{
                background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '40px',
                boxShadow: 'var(--shadow-xl)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)', pointerEvents: 'none' }}/>
            <div style={{ fontSize: 44, marginBottom: 16 }}>💼</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 10 }}>
              AI Asset Generation Studio
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 24px' }}>
              Select a primary document from your Secure Mobile Vault. {teacher.name}'s AI Resume Model will analyze it, compile SDE sections, and generate your resume, CV, and custom roadmap quests.
            </p>

            {/* Dummy Vault Upload Feature */}
            <div style={{
                background: 'rgba(79, 70, 229, 0.03)',
                border: '1px dashed rgba(99, 102, 241, 0.4)',
                borderRadius: 14,
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: 20,
                maxWidth: 460,
                margin: '0 auto 20px'
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span>📤</span> Upload Document to Vault
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.4, marginBottom: 12 }}>
                Simulate uploading an old resume or document to secure database storage in your Mobile Vault.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" placeholder="e.g. senior_developer_resume_2025.pdf" value={uploadDocName} onChange={(e) => setUploadDocName(e.target.value)} style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg3)',
                color: 'var(--t1)',
                fontSize: 12.5,
                width: '100%',
                outline: 'none'
            }}/>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg3)',
                color: 'var(--t1)',
                fontSize: 12.5,
                flex: 1,
                outline: 'none'
            }}>
                    <option value="resume">Resume / CV</option>
                    <option value="certification">Certification</option>
                    <option value="hackathon">Hackathon Project</option>
                    <option value="internship">Internship Certificate</option>
                  </select>
                  
                  <button onClick={handleUploadToVault} disabled={!uploadDocName.trim()} className="btn-primary" style={{
                padding: '8px 16px',
                fontSize: 12.5,
                borderRadius: 8,
                cursor: uploadDocName.trim() ? 'pointer' : 'not-allowed',
                opacity: uploadDocName.trim() ? 1 : 0.6
            }}>
                    Upload & Sync
                  </button>
                </div>
              </div>
            </div>

            {/* Selectable Synced Vault Items list */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', textAlign: 'left', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>📁 Select Secure Vault Document</span>
                <span style={{ color: 'var(--green)' }}>● SECURE HASH ACTIVE</span>
              </div>
              {vaultItems.length === 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 'demo-resume-draft', title: 'college_resume_draft.pdf', type: 'resume' },
                    { id: 'demo-cert', title: 'java_basic_cert.pdf', type: 'certification' }
                ].map(item => {
                    const isSelected = selectedVaultItemId === item.id;
                    return (<div key={item.id} onClick={() => !generating && setSelectedVaultItemId(item.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--t1)',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            padding: '8px 12px', borderRadius: 8,
                            background: isSelected ? 'rgba(79,70,229,0.08)' : 'var(--bg3)',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            transition: 'all 0.15s'
                        }}>
                        <span style={{ fontSize: 14 }}>{isSelected ? '🟢' : '⚪'}</span>
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.title}</span>
                        <span style={{ fontSize: 9.5, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>{item.type}</span>
                      </div>);
                })}
                </div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vaultItems.map(item => {
                    const isSelected = selectedVaultItemId === item.id;
                    return (<div key={item.id} onClick={() => !generating && setSelectedVaultItemId(item.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--t1)',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            padding: '8px 12px', borderRadius: 8,
                            background: isSelected ? 'rgba(79,70,229,0.08)' : 'var(--bg3)',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            transition: 'all 0.15s'
                        }}>
                        <span style={{ fontSize: 14 }}>{isSelected ? '🟢' : '⚪'}</span>
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.title}</span>
                        <span style={{ fontSize: 9.5, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>{item.item_type}</span>
                      </div>);
                })}
                </div>)}
            </div>

            {generating ? (<div style={{ maxWidth: 360, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--t2)', marginBottom: 8 }}>
                  <span>
                    {genProgress < 25 ? 'Analyzing Vault contents with Groq...' :
                    genProgress < 55 ? 'ML model compiling SDE resume & CV...' :
                        genProgress < 80 ? 'Mapping skills to target roadmap...' :
                            'Deploying learning quests to pipeline...'}
                  </span>
                  <span>{genProgress}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ height: '100%', width: `${genProgress}%`, background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 3, transition: 'width 0.25s ease' }}/>
                </div>
              </div>) : (<button onClick={handleGenerateAIAssets} className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto', padding: '12px 28px', fontSize: 13.5, gap: 8 }}>
                <span>✨</span> Generate My AI Resume, CV & Quests
              </button>)}
          </div>
        </div>) : (<div style={{ maxWidth: 1280, margin: '0 auto' }} className="animate-fade-in">
          <div className="page-header">
            <h1>Resume &amp; ATS</h1>
            <p>Upload your existing resume for AI analysis, or build a new one from scratch with live ATS scoring.</p>
          </div>

          {/* Locked Generated Assets Display */}
          <div style={{
                background: 'var(--bg2)',
                border: isRoadmapCompleted ? '1.5px solid var(--green)' : '1.5px dashed var(--accent)',
                borderRadius: 20,
                padding: 24,
                marginBottom: 30,
                boxShadow: 'var(--shadow-md)',
                position: 'relative'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                  📂 Generated AI Career Assets
                </h3>
                {isRoadmapCompleted ? (<span style={{ fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>
                    🔓 Unlocked — All developer assets are live and recruiter-accessible!
                  </span>) : (<span style={{ fontSize: 11.5, color: 'var(--coral)', fontWeight: 600 }}>
                    🔒 Locked — Complete Roadmap Quests to unlock sharing &amp; export privileges.
                  </span>)}
              </div>
              {isRoadmapCompleted ? (<span style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)', color: 'var(--green)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>
                  Assets Live &amp; Unlocked
                </span>) : (<span style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--coral)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>
                  Gamified Lock Active
                </span>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {[
                { title: 'My SDE Resume', type: 'Professional PDF', icon: '📄', canAction: isRoadmapCompleted },
                { title: 'My Professional CV', type: 'Curriculum Vitae', icon: '📝', canAction: isRoadmapCompleted },
                { title: 'My SDE Web Portfolio', type: 'Live Deployment', icon: '🌐', canAction: true }
            ].map(asset => (<div key={asset.title} style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                    opacity: asset.canAction ? 1 : 0.65
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {asset.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{asset.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{asset.type}</div>
                    </div>
                    {!isRoadmapCompleted && !asset.canAction && (<div style={{ position: 'absolute', top: 12, right: 12, fontSize: 12 }} title="Asset Locked">
                        🔒
                      </div>)}
                    {isRoadmapCompleted && (<div style={{ position: 'absolute', top: 12, right: 12, fontSize: 12, color: 'var(--green)' }} title="Asset Unlocked">
                        ✓
                      </div>)}
                  </div>

                  {asset.canAction && (<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>PORTFOLIO THEME</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setPortfolioTheme('modern')} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, border: 'none', background: portfolioTheme === 'modern' ? 'var(--accent)' : 'var(--bg2)', color: portfolioTheme === 'modern' ? 'white' : 'var(--t2)', cursor: 'pointer', fontWeight: 600 }}>Modern</button>
                          <button onClick={() => setPortfolioTheme('advanced')} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, border: 'none', background: portfolioTheme === 'advanced' ? 'var(--accent)' : 'var(--bg2)', color: portfolioTheme === 'advanced' ? 'white' : 'var(--t2)', cursor: 'pointer', fontWeight: 600 }}>Advanced</button>
                        </div>
                      </div>
                      <button onClick={() => setShowPortfolioPreview(true)} className="btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', padding: '5px', fontSize: 11.5 }}>
                        👁 Preview Custom Theme
                      </button>
                    </div>)}
                </div>))}
            </div>
          </div>

          {/* Tab strip */}
          <div style={{
                display: 'flex', gap: 4,
                background: 'var(--bg3)', padding: 4,
                borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                marginBottom: 22, width: 'fit-content',
            }}>
            {TABS.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} type="button" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 18px', border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    background: tab === t.id ? 'var(--bg2)' : 'transparent',
                    color: tab === t.id ? 'var(--t1)' : 'var(--t3)',
                    boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s',
                }}>
                <span>{t.icon}</span>
                {t.label}
              </button>))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 18, fontStyle: 'italic' }}>
            {TABS.find((t) => t.id === tab)?.hint}
          </div>

          {/* Upload tab */}
          {tab === 'upload' && <ResumeUpload_1.default />}

          {/* Build tab */}
          {tab === 'build' && (<>
              <BuildActions />

              {/* Error banners */}
              {downloadError && (<div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--coral-light)', border: '1px solid var(--coral)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--coral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚠ {downloadError}</span>
                  <button onClick={() => setDownloadError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 16 }}>×</button>
                </div>)}
              {improveError && (<div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--amber)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚠ {improveError}</span>
                  <button onClick={() => setImproveError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', fontSize: 16 }}>×</button>
                </div>)}

              {loaded ? (<>
                  <ResumeForm_1.default initialData={initialData ?? (0, ResumeForm_types_1.emptyFormData)()} onSave={handleSave}/>
                  <ImprovementPanel />
                </>) : (<div style={{ textAlign: 'center', padding: 60, color: 'var(--t3)' }}>
                  <div style={{ fontSize: 22, marginBottom: 12 }}>⟳</div>
                  Loading your resume…
                </div>)}
            </>)}
        </div>)}

      {/* SDE Web Portfolio Live Theme Preview Drawer */}
      {showPortfolioPreview && (<div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                display: 'flex', justifyContent: 'flex-end', zIndex: 9999,
                backdropFilter: 'blur(8px)'
            }} className="animate-fade-in">
          <div style={{
                width: 'min(760px, 90vw)',
                height: '100vh',
                background: portfolioTheme === 'modern' ? '#09090b' : '#1e1e24',
                color: portfolioTheme === 'modern' ? '#f4f4f5' : '#f8f8f2',
                fontFamily: portfolioTheme === 'advanced' ? 'var(--font-mono)' : 'var(--font-body)',
                borderLeft: '1px solid var(--border)',
                boxShadow: 'var(--shadow-2xl)',
                padding: 30,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
            }}>
            {/* Header controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0, color: portfolioTheme === 'modern' ? '#a5b4fc' : 'var(--accent)' }}>
                  👤 Web Portfolio Live Preview
                </h2>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                  Simulated deployment matching: <strong>{portfolioTheme.toUpperCase()} THEME</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button onClick={() => setPortfolioTheme(t => t === 'modern' ? 'advanced' : 'modern')} className="btn-ghost btn-sm" style={{ fontSize: 11 }}>
                  🔄 Switch Theme
                </button>
                <button onClick={() => setShowPortfolioPreview(false)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 22 }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Portfolio Content Mock */}
            <div style={{
                border: portfolioTheme === 'modern' ? '1px solid rgba(255,255,255,0.08)' : '2px solid #50fa7b',
                background: portfolioTheme === 'modern' ? 'rgba(255,255,255,0.02)' : '#282a36',
                borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16
            }}>
              {/* Profile Intro */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
                <h1 style={{
                fontSize: 26, fontWeight: 900, margin: 0,
                fontFamily: 'var(--font-display)',
                color: portfolioTheme === 'modern' ? '#fff' : '#50fa7b'
            }}>
                  {initialData?.fullName || "Candidate Display Name"}
                </h1>
                <p style={{ fontSize: 14, color: portfolioTheme === 'modern' ? '#cbd5e1' : '#ff79c6', fontWeight: 600, margin: '4px 0 0' }}>
                  💻 Java Backend Software Developer Candidate
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 10, background: 'rgba(5,150,105,0.15)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(5,150,105,0.3)' }}>
                    ✓ AI-MATCH SDE VERIFIED
                  </span>
                  <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 10, background: 'rgba(124,106,247,0.15)', color: '#a5b4fc', fontWeight: 700, border: '1px solid rgba(124,106,247,0.3)' }}>
                    🗄️ SECURE VAULT INDEX ACTIVE
                  </span>
                </div>
              </div>

              {/* Bio summary */}
              <div>
                <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--t3)', marginBottom: 6 }}>
                  Professional Profile Summary
                </h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, color: portfolioTheme === 'modern' ? '#94a3b8' : '#f8f8f2' }}>
                  {initialData?.summary || "AI-generated profile summary loading from synced Certifications, Projects, and Academics..."}
                </p>
              </div>

              {/* Verified Documents Checklist */}
              <div>
                <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--t3)', marginBottom: 10 }}>
                  📂 Synced Vault Evidence &amp; Verification Hashes
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vaultItems.length === 0 ? (<div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>
                      No items currently synced in Secure Vault.
                    </div>) : (vaultItems.map(item => (<div key={item.id} style={{
                    background: portfolioTheme === 'modern' ? 'rgba(255,255,255,0.03)' : '#44475a',
                    border: portfolioTheme === 'modern' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #6272a4',
                    borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: portfolioTheme === 'modern' ? '#fff' : '#f8f8f2' }}>{item.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
                            Source: {item.organization_name || 'Self Upload'} · Type: {item.item_type.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#50fa7b', fontFamily: 'var(--font-mono)' }}>
                            ✓ SHA-256 SIGNED
                          </span>
                          <div style={{ fontSize: 8.5, color: 'var(--t4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                            ID: 0x{(item.id || '9b2a').substring(0, 8)}...
                          </div>
                        </div>
                      </div>)))}
                </div>
              </div>

              {/* Skills breakdown radar */}
              {initialData && initialData.skills && initialData.skills.technical && (<div>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--t3)', marginBottom: 8 }}>
                    ⚙️ Technical Core Competencies
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {initialData.skills.technical.split(',').map((skill, idx) => (<span key={idx} style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 6,
                        background: portfolioTheme === 'modern' ? 'rgba(79,70,229,0.15)' : '#6272a4',
                        color: portfolioTheme === 'modern' ? '#8b8bf5' : '#8be9fd',
                        border: portfolioTheme === 'modern' ? '1px solid rgba(79,70,229,0.3)' : '1px solid #44475a',
                        fontWeight: 600
                    }}>
                        {skill.trim()}
                      </span>))}
                  </div>
                </div>)}
            </div>

            {/* Locked Action / Live Index Notification */}
            {isRoadmapCompleted ? (<div style={{
                    background: 'rgba(5,150,105,0.06)',
                    border: '1.5px dashed var(--green)',
                    borderRadius: 16,
                    padding: 16,
                    textAlign: 'center',
                    marginTop: 'auto'
                }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>✓ Live Index Compiled</div>
                <p style={{ fontSize: 11.5, color: 'var(--t2)', margin: '4px 0 0' }}>
                  Your portfolio is currently live and indexed. Recruiters can view your verified credentials.
                </p>
              </div>) : (<div style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1.5px dashed var(--coral)',
                    borderRadius: 16,
                    padding: 16,
                    textAlign: 'center',
                    marginTop: 'auto'
                }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--coral)' }}>🔒 Live Deployment Gated</div>
                <p style={{ fontSize: 11.5, color: 'var(--t2)', margin: '4px 0 0' }}>
                  Complete the daily roadmap quests inside the <strong>Quests</strong> tab to unlock recruiter visibility and live index compilation.
                </p>
              </div>)}
          </div>
        </div>)}
    </>);
}
// ── Reusable suggestion block ─────────────────────────────────────────────────
function SuggestionBlock({ label, content, copyText, compact = false }) {
    const [copied, setCopied] = (0, react_1.useState)(false);
    function copy() {
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (<div style={{ marginBottom: compact ? 8 : 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>{label}</div>
      <div style={{
            background: 'var(--bg2)', borderRadius: 8,
            padding: compact ? '8px 12px' : '12px 14px',
            fontSize: 13, color: 'var(--t1)', lineHeight: 1.6,
            border: '1px solid var(--border)',
            position: 'relative',
        }}>
        {content}
        <button onClick={copy} style={{
            position: 'absolute', top: 8, right: 8,
            background: copied ? 'var(--green-light)' : 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 6, cursor: 'pointer',
            fontSize: 11, fontWeight: 600,
            color: copied ? 'var(--green)' : 'var(--t2)',
            padding: '3px 8px',
        }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>);
}
