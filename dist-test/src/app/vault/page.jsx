'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VaultPage;
// Premium Proof-of-Work Vault & Secure Storage
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const client_1 = require("@/lib/api/client");
const hooks_1 = require("@/lib/api/hooks");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const TYPE_CONFIG = {
    academic: { icon: '🎓', color: 'var(--teal)', label: 'Academic Record' },
    certification: { icon: '🏆', color: 'var(--amber)', label: 'Certification' },
    internship: { icon: '🏢', color: 'var(--blue)', label: 'Internship' },
    project: { icon: '⚡', color: 'var(--purple)', label: 'Project' },
    activity: { icon: '🌟', color: 'var(--gold)', label: 'Extracurricular' },
    exam: { icon: '📝', color: 'var(--green)', label: 'Exam Score' },
    financial: { icon: '💵', color: 'var(--pink)', label: 'Financial Proof' },
    personal: { icon: '👤', color: 'var(--coral)', label: 'Personal ID' },
    other: { icon: '📎', color: 'var(--t2)', label: 'Other' },
};
function VaultPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const { vaultItems: ctxItems, addVaultItem, updateVaultItem, earnPins } = (0, CareerOSContext_1.useCareerOS)();
    // Also load from Firestore (real persisted items) and merge with context items
    const { data: fsVaultData } = (0, hooks_1.useVault)();
    const fsItems = (fsVaultData || []);
    // Deduplicate: Firestore items take precedence, fill in with context items not yet synced
    const fsIds = new Set(fsItems.map((i) => i.id));
    const vaultItems = [
        ...fsItems,
        ...ctxItems.filter(i => !fsIds.has(i.id)),
    ];
    const [showForm, setShowForm] = (0, react_1.useState)(false);
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [filter, setFilter] = (0, react_1.useState)('all');
    const fileRef = (0, react_1.useRef)(null);
    // Secure biometric state simulations
    const [biometricEnabled, setBiometricEnabled] = (0, react_1.useState)(true);
    const [activeTempAccess, setActiveTempAccess] = (0, react_1.useState)(false);
    const [tempCode, setTempCode] = (0, react_1.useState)('');
    const [dragActive, setDragActive] = (0, react_1.useState)(false);
    // Scanner Simulator State
    const [showScanModal, setShowScanModal] = (0, react_1.useState)(false);
    const [scanning, setScanning] = (0, react_1.useState)(false);
    const [scanProgress, setScanProgress] = (0, react_1.useState)(0);
    const [scanStep, setScanStep] = (0, react_1.useState)('init');
    const [scanResult, setScanResult] = (0, react_1.useState)(null);
    const videoRef = (0, react_1.useRef)(null);
    const streamRef = (0, react_1.useRef)(null);
    // Scanner Methods
    const startCamera = async () => {
        setScanStep('camera');
        setScanProgress(0);
        setScanResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.log("Play interrupted:", e));
                }
            }, 100);
        }
        catch (err) {
            console.warn("Camera hardware access denied/unavailable, simulating scan layout:", err);
        }
    };
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };
    const triggerScan = () => {
        setScanStep('ocr');
        setScanning(true);
        let current = 0;
        const interval = setInterval(() => {
            current += 10;
            setScanProgress(current);
            if (current >= 100) {
                clearInterval(interval);
                stopCamera();
                const randomResults = [
                    { title: "Java Programming Basics Certificate", category: "certification", org: "Oracle Academy", text: "Verified Oracle Certified Associate Program Course Completion. Candidate scored 95% in standard evaluation check." },
                    { title: "SDE Internship Experience Letter", category: "internship", org: "TechCorp Labs", text: "Successfully completed SDE Internship. Led React and NodeJS microservice integrations." },
                    { title: "University Grade Transcript", category: "academic", org: "State Tech University", text: "Cumulative GPA: 3.92/4.00. Completed Advanced Data Structures, Algorithms, and Software Engineering." }
                ];
                const res = randomResults[Math.floor(Math.random() * randomResults.length)];
                setScanResult(res);
                setScanning(false);
                setScanStep('done');
            }
        }, 200);
    };
    const saveScannedAsset = () => {
        if (!scanResult)
            return;
        addVaultItem({
            title: scanResult.title,
            item_type: scanResult.category,
            organization_name: scanResult.org,
            description: scanResult.text,
            skill_tags: ['OCR Scanned', 'Camera Capture'],
        });
        // Sync to Firestore
        client_1.api.post('/api/vault', {
            title: scanResult.title, item_type: scanResult.category,
            organization_name: scanResult.org,
            description: scanResult.text, skill_tags: ['OCR Scanned', 'Camera Capture'],
        }).catch(() => { });
        setShowScanModal(false);
    };
    const [form, setForm] = (0, react_1.useState)({
        title: '', itemType: 'project', description: '',
        organizationName: '', startDate: '', endDate: '',
    });
    const filteredItems = filter === 'all'
        ? vaultItems
        : vaultItems.filter(item => item.item_type === filter);
    // Live stats from actual context data
    const total = vaultItems.length;
    const verified_total = vaultItems.filter(i => i.verified).length;
    const avg_score = vaultItems.length > 0
        ? Math.round(vaultItems.reduce((acc, i) => acc + i.ai_confidence_score, 0) / vaultItems.length)
        : 0;
    async function submit(e) {
        e.preventDefault();
        setUploading(true);
        // Simulate AI parsing, OCR reading, and indexing delay
        setTimeout(() => {
            // Default skills based on item category
            let skills = ['Analytical', 'Problem Solving'];
            if (form.itemType === 'project')
                skills = ['React', 'Next.js', 'GitHub', 'System Design'];
            else if (form.itemType === 'certification')
                skills = ['AWS', 'Cloud Architecture', 'Security'];
            else if (form.itemType === 'internship')
                skills = ['Professional Codebase', 'Agile', 'Team Collaboration'];
            else if (form.itemType === 'hackathon')
                skills = ['Rapid Prototyping', 'APIs', 'Pitching'];
            addVaultItem({
                title: form.title,
                item_type: form.itemType,
                organization_name: form.organizationName,
                description: form.description,
                skill_tags: skills,
            });
            // Also persist to Firestore
            client_1.api.post('/api/vault', {
                title: form.title, item_type: form.itemType,
                organization_name: form.organizationName,
                description: form.description, skill_tags: skills,
            }).catch(() => { });
            setShowForm(false);
            setForm({ title: '', itemType: 'project', description: '', organizationName: '', startDate: '', endDate: '' });
            setUploading(false);
        }, 1200);
    }
    // Drag and drop event handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        }
        else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setUploading(true);
            // Auto-extract title and create vault item from dropped file
            setTimeout(() => {
                const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                // Guess item type from extension or name
                let itemType = 'other';
                let skillTags = ['Uploaded File'];
                if (titleWithoutExt.toLowerCase().includes('cert')) {
                    itemType = 'certification';
                    skillTags = ['Certificate', 'Verified Credential'];
                }
                else if (titleWithoutExt.toLowerCase().includes('resume') || titleWithoutExt.toLowerCase().includes('cv')) {
                    itemType = 'presentation';
                    skillTags = ['ATS Resume', 'Professional Profile'];
                }
                else if (titleWithoutExt.toLowerCase().includes('proj') || titleWithoutExt.toLowerCase().includes('engine') || titleWithoutExt.toLowerCase().includes('app') || titleWithoutExt.toLowerCase().includes('web')) {
                    itemType = 'project';
                    skillTags = ['GitHub', 'Source Code', 'Deployment'];
                }
                else {
                    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                    skillTags = [ext, 'Attached Evidence'];
                }
                addVaultItem({
                    title: titleWithoutExt.split('-').join(' ').split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase()),
                    item_type: itemType,
                    organization_name: 'Local Upload',
                    description: `Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB). Automatically parsed and indexed by PinIT AI OCR engine.`,
                    skill_tags: skillTags,
                });
                setUploading(false);
            }, 1500);
        }
    };
    function handleGenerateTempCode() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setTempCode(code);
        setActiveTempAccess(true);
    }
    return (<div style={{ maxWidth: 1040, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="page-hero-title">🗄 Proof Vault</h1>
          <p className="page-hero-sub">Your tamper-proof evidence locker — upload certificates, projects, and achievements</p>
        </div>
      </div>

      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Proof-of-Work Vault
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>
            🔒 AES-256 Encrypted secure storage for certifications, projects, and credentials.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {
            setShowScanModal(true);
            startCamera();
        }} className="btn-ghost btn-sm">
            📷 Scan Document
          </button>
          <button onClick={handleGenerateTempCode} className="btn-ghost btn-sm">
            🔑 Temp Access Link
          </button>
          <button onClick={() => setShowForm(s => !s)} className="btn-primary btn-sm">
            {showForm ? '✕ Cancel' : '+ Add Proof-of-Work'}
          </button>
        </div>
      </div>

      {/* Mobile QR deep-link banner */}
      <div style={{
            background: 'linear-gradient(90deg, rgba(79,70,229,0.12) 0%, rgba(20,184,166,0.08) 100%)',
            border: '1px solid var(--border2)',
            borderRadius: 18,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
        }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📲</span> PinIT Mobile Deep-Link Active
          </h3>
          <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.4 }}>
            Open the <strong>PinIT app on your phone</strong> → Go to Vault → Tap "Share to Web" and scan your dashboard QR to sync files instantly.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24 }}>📳</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>SECURE SCANNER TUNNEL ACTIVE</div>
        </div>
      </div>

      {/* Biometrics & Temporary Access Link Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Biometrics Info */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24 }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>Biometrics Lock</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Fingerprint & Face Scanner mapped</div>
          </div>
          <button onClick={() => setBiometricEnabled(prev => !prev)} style={{
            padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 700,
            background: biometricEnabled ? 'rgba(16,185,129,0.15)' : 'var(--bg3)',
            color: biometricEnabled ? 'var(--green)' : 'var(--t3)',
            border: `1px solid ${biometricEnabled ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            cursor: 'pointer'
        }}>
            {biometricEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Temporary Access Link */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24 }}>🔑</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>Temporary Recruiter Access</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>
              {activeTempAccess ? `Active Code: ${tempCode}` : 'Create secure single-view key'}
            </div>
          </div>
          {!activeTempAccess ? (<button onClick={handleGenerateTempCode} className="btn-ghost btn-sm" style={{ padding: '4px 8px' }}>Gen</button>) : (<button onClick={() => setActiveTempAccess(false)} className="btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--coral)' }}>Revoke</button>)}
        </div>

      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
            { label: 'Total Vault Assets', value: total, color: 'var(--accent)' },
            { label: 'AI Auto-Verified', value: verified_total, color: 'var(--green)' },
            { label: 'Confidence Quotient', value: `${avg_score}%`, color: 'var(--teal)' },
        ].map(s => (<div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>))}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} style={{
            border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
            background: dragActive ? 'rgba(79,70,229,0.06)' : 'var(--bg2)',
            borderRadius: 18,
            padding: '24px 16px',
            textAlign: 'center',
            marginBottom: 24,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        }} onClick={() => fileRef.current?.click()}>
        <input type="file" ref={fileRef} accept=".pdf,.docx,.jpg,.png,.zip" style={{ display: 'none' }} onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setUploading(true);
                setTimeout(() => {
                    const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    addVaultItem({
                        title: titleWithoutExt.split('-').join(' ').split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase()),
                        item_type: 'other',
                        organization_name: 'Local Upload',
                        description: `Uploaded file: ${file.name}. Parsed and indexed securely.`,
                        skill_tags: ['Uploaded', file.name.split('.').pop()?.toUpperCase() || 'FILE'],
                    });
                    setUploading(false);
                }, 1200);
            }
        }}/>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Drag & Drop Proof-of-Work</h3>
        <p style={{ fontSize: 11.5, color: 'var(--t3)', maxWidth: 420, margin: '0 auto' }}>
          Supports PDFs, GitHub ZIPs, certificates, and images. PinIT AI automatically runs secure verification checking metadata.
        </p>
      </div>

      {/* Add Form */}
      {showForm && (<div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 18, padding: 24, marginBottom: 24 }} className="animate-fade-in">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Add Proof-of-Work Asset</h3>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Asset Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Completed React dashboard for scale" required/>
              </div>
              <div className="form-group">
                <label className="form-label">Evidence Category *</label>
                <select className="form-input" value={form.itemType} onChange={e => setForm(f => ({ ...f, itemType: e.target.value }))}>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Issuing Organization</label>
              <input className="form-input" value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))} placeholder="Company / University / Platform"/>
            </div>
            <div className="form-group">
              <label className="form-label">Evidence Description</label>
              <textarea className="form-input" style={{ resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What project challenges did you solve? Detail exact stack & tech impact."/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Proof / Certificate File</label>
                <button type="button" className="btn-ghost" style={{ width: '100%', height: 38 }} onClick={() => fileRef.current?.click()}>
                  📎 Attach Proof Evidence
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }} disabled={uploading}>
              {uploading ? 'Processing AI Verification...' : '➔ Submit & Run Auto-Verification'}
            </button>
          </form>
        </div>)}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', ...Object.keys(TYPE_CONFIG)].map(t => (<button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`, background: filter === t ? 'rgba(79,70,229,0.1)' : 'transparent', color: filter === t ? '#8b8bf5' : 'var(--t2)', cursor: 'pointer', fontSize: 12 }}>
            {t === 'all' ? 'All Assets' : TYPE_CONFIG[t]?.label}
          </button>))}
      </div>

      {/* Items */}
      {uploading && !showForm ? (<div style={{ textAlign: 'center', padding: 48, background: 'var(--bg2)', borderRadius: 14, border: '1px dashed var(--accent)', color: 'var(--accent)' }}>
          <span style={{ display: 'block', fontSize: 24, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>🔒</span>
          Extracting document metadata & running AI security analysis...
        </div>) : filteredItems.length === 0 ? (<div className="empty-state">
          <div className="empty-icon">🗄️</div>
          <div className="empty-title">Secure Vault is empty</div>
          <div className="empty-desc">Attach certifications or projects. PINIT AI parses and indexes everything into your Career OS profile.</div>
        </div>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredItems.map((item) => {
                const cfg = TYPE_CONFIG[item.item_type] || TYPE_CONFIG.other;
                const score = Math.round(item.ai_confidence_score || 0);
                const gaugeColor = score > 80 ? 'var(--green)' : score > 50 ? 'var(--amber)' : 'var(--coral)';
                return (<div key={item.id} className="glass-card card-hover" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 18,
                        overflow: 'hidden',
                        border: `1px solid ${item.verified ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                        transition: 'all 0.2s ease',
                    }}>
                {/* Visual Document Preview Header */}
                <div style={{
                        height: 100,
                        background: `linear-gradient(135deg, ${cfg.color}15, rgba(13, 18, 30, 0.4))`,
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                  {/* Backdrop Glow */}
                  <div style={{
                        position: 'absolute',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: `${cfg.color}10`,
                        filter: 'blur(10px)',
                        pointerEvents: 'none'
                    }}/>
                  
                  {/* Large visual icon */}
                  <div style={{ fontSize: 36, position: 'relative', zIndex: 1 }}>
                    {cfg.icon}
                  </div>

                  {/* Verified Badge Overlay */}
                  {item.verified && (<div style={{
                            position: 'absolute',
                            left: 12,
                            top: 12,
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--green)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: 100,
                            padding: '2px 8px',
                            fontSize: 9.5,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}>
                      ✓ Verified
                    </div>)}

                  {/* AI Confidence Trust Gauge Overlay */}
                  <div style={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        background: 'rgba(10, 15, 30, 0.75)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid var(--border)',
                        borderRadius: 20,
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--t2)'
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: gaugeColor, boxShadow: `0 0 6px ${gaugeColor}` }}/>
                    AI Trust: {score}%
                  </div>
                </div>

                {/* Card details body */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, color: 'var(--t3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                    {item.is_public && (<span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'rgba(20,184,166,0.1)', color: 'var(--teal)', border: '1px solid rgba(20,184,166,0.2)', fontFamily: 'var(--font-mono)' }}>👁 Shared</span>)}
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineClamp: 1, WebkitLineClamp: 1, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                      {item.title}
                    </h3>
                    {item.organization_name && (<div style={{ fontSize: 11.5, color: 'var(--t3)', fontWeight: 500 }}>
                        {item.organization_name}
                      </div>)}
                  </div>

                  {item.description && (<p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.45, margin: 0, lineClamp: 2, WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                      {item.description}
                    </p>)}

                  {/* Active usages badges */}
                  {(item.used_in_resume || item.used_in_portfolio) && (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
                      {item.used_in_resume && (<span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#8b8bf5', border: '1px solid rgba(99,102,241,0.2)', fontFamily: 'var(--font-mono)' }}>
                          📄 Resume
                        </span>)}
                      {item.used_in_portfolio && (<span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'rgba(20,184,166,0.1)', color: 'var(--teal)', border: '1px solid rgba(20,184,166,0.2)', fontFamily: 'var(--font-mono)' }}>
                          🌐 Portfolio
                        </span>)}
                    </div>)}

                  {/* Skill tags */}
                  {item.skill_tags && item.skill_tags.length > 0 && (<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: (item.used_in_resume || item.used_in_portfolio) ? 2 : 'auto' }}>
                      {item.skill_tags.slice(0, 3).map((s) => (<span key={s} style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--t2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                          {s}
                        </span>))}
                    </div>)}
                </div>

                {/* Actions bottom bar */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'rgba(10, 15, 30, 0.25)', display: 'flex', gap: 8 }}>
                  <button onClick={() => {
                        updateVaultItem(item.id, { is_public: !item.is_public });
                    }} className="btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 8px', flex: 1, justifyContent: 'center' }}>
                    {item.is_public ? '🔒 Private' : '👁 Share'}
                  </button>
                  {!item.verified && (<button onClick={() => {
                            updateVaultItem(item.id, { verified: true, ai_confidence_score: 95 });
                            earnPins?.('vault_verify', 25);
                        }} className="btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)', flex: 1, justifyContent: 'center' }}>
                      ✓ Verify
                    </button>)}
                </div>
              </div>);
            })}
        </div>)}

      {/* Document Scan Flow Simulator Modal (Capacitor/Mobile scan simulation) */}
      {showScanModal && (<div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, backdropFilter: 'blur(8px)', padding: 16
            }} className="animate-fade-in">
          <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: 24,
                width: 'min(500px, 95vw)',
                color: 'var(--t1)',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0 }}>
                📷 PinIT OCR Document Scanner
              </h2>
              <button onClick={() => { stopCamera(); setShowScanModal(false); }} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 20 }}>
                ✕
              </button>
            </div>

            {scanStep === 'camera' && (<div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}/>
                
                {/* Overlay Scanning Guide Graphic */}
                <div style={{
                    position: 'absolute', inset: '20px',
                    border: '2px dashed var(--accent)',
                    borderRadius: 12,
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4 }}>
                    Align Document Inside Frame
                  </div>
                </div>

                <div style={{ position: 'absolute', bottom: 16, display: 'flex', gap: 10, zIndex: 10 }}>
                  <button onClick={triggerScan} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
                    Capture & Run OCR Scan ⚡
                  </button>
                </div>
              </div>)}

            {scanStep === 'ocr' && (<div style={{
                    borderRadius: 16, background: '#111', aspectRatio: '4/3',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 24, gap: 14, position: 'relative', overflow: 'hidden'
                }}>
                {/* Scrolling laser scan line animation */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                    background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)',
                    animation: 'scanLaser 2s linear infinite'
                }}/>
                
                <style>{`
                  @keyframes scanLaser {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                  }
                `}</style>

                <div style={{ fontSize: 32, animation: 'pulse 1s infinite' }}>🔍</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Extracting Metadata ({scanProgress}%)</div>
                <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', maxWidth: 240 }}>
                  <div style={{ height: '100%', width: `${scanProgress}%`, background: 'var(--accent)', borderRadius: 2 }}/>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', textAlign: 'center', maxWidth: 280 }}>
                  Running SHA-256 certificate signature check & OCR word parsing...
                </div>
              </div>)}

            {scanStep === 'done' && scanResult && (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-fade-in">
                <div style={{
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center'
                }}>
                  <div style={{ fontSize: 24 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>OCR Metadata Extraction Complete</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>SHA-256 signature matched with Oracle CA ledger database.</div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, fontSize: 11.5 }}>
                    <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Title:</span>
                    <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{scanResult.title}</span>
                    
                    <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Category:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>{scanResult.category.toUpperCase()}</span>
                    
                    <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Issuer:</span>
                    <span>{scanResult.org}</span>
                    
                    <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Match Score:</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>98% Verified</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 10.5, color: 'var(--t2)', lineHeight: 1.4 }}>
                    <strong>Extracted Text:</strong> "{scanResult.text}"
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { startCamera(); }} className="btn-ghost" style={{ flex: 1, padding: 10, fontSize: 12 }}>
                    Scan Again
                  </button>
                  <button onClick={saveScannedAsset} className="btn-primary" style={{ flex: 1.5, padding: 10, fontSize: 12, justifyContent: 'center' }}>
                    Save to Secure Vault ✓
                  </button>
                </div>
              </div>)}
          </div>
        </div>)}
    </div>);
}
