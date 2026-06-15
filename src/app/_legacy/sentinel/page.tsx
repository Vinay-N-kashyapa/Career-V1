'use client';
import { useState } from 'react';
import PinsGate from '@/components/pins/PinsGate';
import { useCareerOS } from '@/lib/context/CareerOSContext';

const DOC_LAYERS = [
  { layer: 'SHA-256 Hash', purpose: 'Exact identity verification', icon: '🔐', color: 'var(--accent)' },
  { layer: 'OCR Fingerprint', purpose: 'Text extraction checks', icon: '📝', color: 'var(--blue)' },
  { layer: 'Semantic Embedding', purpose: 'Meaning recognition', icon: '🧠', color: 'var(--purple)' },
  { layer: 'Session Watermark', purpose: 'Access tracing signature', icon: '💧', color: 'var(--teal)' },
  { layer: 'Lineage Graph', purpose: 'Ownership tracking chain', icon: '🔗', color: 'var(--amber)' },
];

export default function SentinelPage() {
  const { earnPins } = useCareerOS();
  const [tab, setTab] = useState<'access' | 'fingerprint' | 'verify' | 'tester'>('access');
  const [permissions, setPermissions] = useState({
    resume: true,
    cv: false,
    portfolio: true
  });
  
  // Recruiter Access Tester States (TempAccessFace and TempAccess from APK)
  const [testKey, setTestKey] = useState('');
  const [testerStep, setTesterStep] = useState<'init' | 'biometric' | 'scan' | 'view'>('init');
  const [testMessage, setTestMessage] = useState('');
  const [logs, setLogs] = useState([
    { id: 1, company: 'Google Inc.', role: 'Senior SDE Recruiter', resource: 'Resume PDF', time: '2 hours ago', status: 'Granted' },
    { id: 2, company: 'Stripe', role: 'Staff SDE Lead', resource: 'SDE Portfolio', time: '1 day ago', status: 'Granted' },
    { id: 3, company: 'Amazon Web Services', role: 'Talent Acquisition', resource: 'Professional CV', time: '3 days ago', status: 'Blocked' },
    { id: 4, company: 'Microsoft', role: 'HR Sourcer', resource: 'Resume PDF', time: '5 days ago', status: 'Granted' }
  ]);

  const togglePermission = (key: 'resume' | 'cv' | 'portfolio') => {
    setPermissions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Update simulated logs based on toggle
      if (!next[key]) {
        setLogs(l => [
          {
            id: Date.now(),
            company: 'Security Sentinel',
            role: 'Policy Override',
            resource: key.toUpperCase(),
            time: 'Just now',
            status: 'Access Revoked'
          },
          ...l
        ]);
      } else {
        setLogs(l => [
          {
            id: Date.now(),
            company: 'Security Sentinel',
            role: 'Policy Override',
            resource: key.toUpperCase(),
            time: 'Just now',
            status: 'Access Granted'
          },
          ...l
        ]);
      }
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>🔐 Sentinel Privacy &amp; Security</h1>
        <p>Manage cryptographic document signatures and track/toggle recruiter access permissions in real-time.</p>
      </div>

      {/* Cryptographic DNA layer tags */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, marginBottom: 14, color: 'var(--t1)' }}>🧬 Document DNA Layers</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {DOC_LAYERS.map((l) => (
            <div key={l.layer} style={{ background: 'var(--bg3)', border: `1px solid var(--border)`, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{l.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: l.color, marginBottom: 4 }}>{l.layer}</div>
              <div style={{ fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.3 }}>{l.purpose}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 5, width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'access', label: '🔐 Recruiter Access control' },
          { id: 'tester', label: '🔑 Recruiter Key Simulator' },
          { id: 'fingerprint', label: '🧬 DNA Fingerprint' },
          { id: 'verify', label: '✓ Verify Integrity' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none',
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--t2)',
              cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Access Tab Content */}
      {tab === 'access' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24 }}>
          {/* Permission Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 14 }}>
                Document Visibility Controls
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'resume', label: 'SDE Resume PDF', desc: 'Main recruitment profile file.' },
                  { key: 'cv', label: 'Professional CV', desc: 'Extended biographical work summary.' },
                  { key: 'portfolio', label: 'SDE Web Portfolio', desc: 'Verified live demo project boards.' }
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>{item.desc}</div>
                    </div>
                    
                    <button
                      onClick={() => togglePermission(item.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: (permissions as any)[item.key] ? 'var(--accent-light)' : 'rgba(220,38,38,0.08)',
                        color: (permissions as any)[item.key] ? 'var(--accent)' : 'var(--coral)',
                        fontWeight: 700,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {(permissions as any)[item.key] ? '🟢 ALLOWED' : '🔴 DENIED'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span>🔐 Recruiter Query Audit Logs</span>
              <span style={{ color: 'var(--teal)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>● ACTIVE LEDGER</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
              {logs.map(log => (
                <div key={log.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{log.company}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{log.role} queried {log.resource}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: log.status.includes('Blocked') || log.status.includes('Revoked') ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)',
                      color: log.status.includes('Blocked') || log.status.includes('Revoked') ? 'var(--coral)' : 'var(--green)',
                      padding: '2px 8px',
                      borderRadius: 6
                    }}>
                      {log.status}
                    </span>
                    <div style={{ fontSize: 9, color: 'var(--t4)', marginTop: 4 }}>{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fingerprint Tab Content */}
      {tab === 'fingerprint' && (
        <div style={{
          background: 'var(--bg2)',
          border: '1px dashed var(--border)',
          borderRadius: 24,
          padding: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>
            Add Cryptographic Document Fingerprint
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Generate immutable cryptographic identity hashes for SDE certificates and transcripts. Watermarks file blocks dynamically.
          </p>
          <button className="btn-primary" style={{ display: 'inline-flex' }}>
            Choose File to Register Fingerprint
          </button>
        </div>
      )}

      {/* Verify Tab Content */}
      {tab === 'verify' && (
        <div style={{
          background: 'var(--bg2)',
          border: '1px dashed var(--border)',
          borderRadius: 24,
          padding: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>
            Audit Document Authenticity
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Upload a local file copy to verify its SHA-256 signatures against the active blockchain ledger hashes on file.
          </p>
          <button className="btn-primary" style={{ display: 'inline-flex' }}>
            Upload and Audit Document
          </button>
        </div>
      )}

      {/* Recruiter Simulator Tester Tab Content */}
      {tab === 'tester' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 10 }}>
            🔑 Recruiter Temporary Access Link Simulator
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 20 }}>
            Simulate a recruiter entering your temporary view key to access your secure document index. Tests the biometric face recognition handshakes.
          </p>

          {testerStep === 'init' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380 }} className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Enter Temporary Recruiter Key</label>
                <input 
                  className="form-input" 
                  value={testKey} 
                  onChange={e => setTestKey(e.target.value.toUpperCase())} 
                  placeholder="e.g. TEMP-9X2F"
                />
              </div>
              <button 
                onClick={() => {
                  if (!testKey.trim()) {
                    setTestMessage('Please enter a key.');
                    return;
                  }
                  setTestMessage('');
                  setTesterStep('biometric');
                }} 
                className="btn-primary"
                style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: 12.5 }}
              >
                Validate Recruiter Session ➔
              </button>
              {testMessage && <div style={{ fontSize: 11, color: 'var(--coral)' }}>{testMessage}</div>}
            </div>
          )}

          {testerStep === 'biometric' && (
            <div style={{ textAlign: 'center', padding: '30px 10px' }} className="animate-fade-in">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Recruiter Biometric Handshake</h3>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', maxWidth: 360, margin: '6px auto 16px', lineHeight: 1.4 }}>
                Recruiter face verification active. The session requires matching the recruiter's face descriptors to authorize access.
              </p>
              <button 
                onClick={() => {
                  setTesterStep('scan');
                  setTimeout(() => {
                    setTesterStep('view');
                  }, 2000);
                }} 
                className="btn-primary"
                style={{ display: 'inline-flex', padding: '9px 18px', fontSize: 12 }}
              >
                Simulate Recruiter Face Scan
              </button>
            </div>
          )}

          {testerStep === 'scan' && (
            <div style={{
              borderRadius: 16, background: '#111', padding: 30,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, border: '1px solid var(--accent)'
            }} className="animate-fade-in">
              <div style={{ fontSize: 28, animation: 'pulse 1s infinite' }}>👤</div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Verifying Recruiter Face ID...</div>
              <div style={{ height: 3, width: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '60%', background: 'var(--accent)', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
              </div>
            </div>
          )}

          {testerStep === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>👩‍💼</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>Google Recruiter Session</div>
                    <div style={{ fontSize: 9.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Session Token: {testKey} (SHA-256 verified)</div>
                  </div>
                </div>
                <button 
                  onClick={() => { setTesterStep('init'); setTestKey(''); }} 
                  className="btn-ghost btn-sm"
                  style={{ fontSize: 11, color: 'var(--coral)' }}
                >
                  Revoke & Exit
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {[
                  { key: 'resume', label: 'SDE Resume PDF', icon: '📄' },
                  { key: 'cv', label: 'Professional CV', icon: '📝' },
                  { key: 'portfolio', label: 'SDE Web Portfolio', icon: '🌐' }
                ].map(doc => {
                  const allowed = (permissions as any)[doc.key];
                  return (
                    <div 
                      key={doc.key} 
                      style={{
                        background: 'var(--bg3)',
                        border: `1px solid ${allowed ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`,
                        borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                        opacity: allowed ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{doc.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{doc.label}</div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: allowed ? 'var(--green)' : 'var(--coral)' }}>
                            {allowed ? '✓ ACCESSIBLE' : '🔒 LOCKED'}
                          </span>
                        </div>
                      </div>
                      
                      {allowed ? (
                        <button 
                          onClick={() => alert(`Simulating file decryption & download for secure ${doc.label}`)}
                          className="btn-primary btn-sm" 
                          style={{ width: '100%', justifyContent: 'center', padding: '4px', fontSize: 11 }}
                        >
                          Decrypt & View
                        </button>
                      ) : (
                        <button 
                          disabled 
                          className="btn-ghost btn-sm" 
                          style={{ width: '100%', justifyContent: 'center', padding: '4px', fontSize: 11, cursor: 'not-allowed' }}
                        >
                          Request Permission
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
