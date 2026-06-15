'use client';
// Premium Career Assets Studio
import { useState, useEffect } from 'react';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { toast } from '@/lib/store/useAppStore';
import Link from 'next/link';

import PinsGate from '@/components/pins/PinsGate';
import PinsEarnNotice from '@/components/pins/PinsEarnNotice';

export default function CareerAssetsStudioPage() {
  const { vaultItems, updateVaultItem, addXp, spendPins, canAfford } = useCareerOS();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeAsset, setActiveAsset] = useState<'ats' | 'onepage' | 'linkedin' | 'cover' | 'portfolio'>('ats');
  const [template, setTemplate] = useState<'minimal' | 'executive' | 'creative' | 'ats-pure'>('ats-pure');

  // Select all items by default on load
  useEffect(() => {
    if (vaultItems.length > 0) {
      setSelectedIds(vaultItems.map(it => it.id));
    }
  }, [vaultItems]);

  function handleToggle(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function triggerGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      
      // Update selected items in central context to reflect they are actively utilized
      selectedIds.forEach(id => {
        updateVaultItem(id, { 
          used_in_resume: true,
          used_in_portfolio: activeAsset === 'portfolio' || activeAsset === 'ats'
        });
      });

      addXp(30, 'ATS Assets Package Generated');
    }, 1800);
  }

  // Define styling dynamically based on selected template
  const getTemplateStyle = () => {
    switch (template) {
      case 'minimal':
        return {
          fontFamily: 'var(--font-body)',
          color: '#e2e8f0',
          borderLeft: '4px solid var(--teal)',
          background: 'rgba(20, 184, 166, 0.03)',
          fontStyle: 'normal'
        };
      case 'executive':
        return {
          fontFamily: 'var(--font-display)',
          color: '#f8fafc',
          borderLeft: '4px solid var(--blue)',
          background: 'rgba(59, 130, 246, 0.05)',
          textTransform: 'uppercase' as const
        };
      case 'creative':
        return {
          fontFamily: 'var(--font-display)',
          color: '#a5f3fc',
          borderLeft: '4px solid var(--purple)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.04) 100%)',
          textShadow: '0 0 10px rgba(139,92,246,0.3)'
        };
      case 'ats-pure':
      default:
        return {
          fontFamily: 'var(--font-mono)',
          color: '#cbd5e1',
          borderLeft: '4px solid var(--accent)',
          background: 'rgba(79, 70, 229, 0.04)'
        };
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position:"relative", zIndex:1 }}>
          <h1 className="page-hero-title">💼 Career Assets Studio</h1>
          <p className="page-hero-sub">Generate ATS-optimised cover letters, LinkedIn bios, and career documents</p>
        </div>
      </div>

      
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Career Assets Studio
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: 13 }}>
          Deploy Vault documents instantly to automatically generate ATS-optimized Resumes, Portfolios, and Cover Letters.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Select from Vault list */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
            🗄️ Step 1 — Select From Vault
          </div>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16 }}>
            Pick the verified certifications, projects, and internships to include in your generated documents.
          </p>

          {/* Empty Vault CTA */}
          {vaultItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--card)', borderRadius: 14, border: '1px dashed var(--border)', marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🗄️</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Your Vault is Empty</div>
              <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4, marginBottom: 12 }}>
                You must add certificates or projects to your secure Vault before building resumes.
              </p>
              <Link href="/vault" className="btn-primary btn-sm" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                + Add Documents in Vault
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {vaultItems.map(item => (
                <label key={item.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '12px 14px', 
                  background: selectedIds.includes(item.id) ? 'var(--bg3)' : 'var(--bg)', 
                  border: `1.5px solid ${selectedIds.includes(item.id) ? 'var(--accent)' : 'var(--border)'}`, 
                  borderRadius: 12, 
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleToggle(item.id)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span>{item.organization_name || 'Personal Project'}</span>
                      {item.verified && <span style={{ color: 'var(--green)' }}>✓ Verified</span>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {vaultItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Template selector */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>
                  🎨 Select Resume Template
                </label>
                <select 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value as any)} 
                  className="form-input" 
                  style={{ fontSize: 12.5, height: 36, padding: '4px 8px' }}
                >
                  <option value="ats-pure">Pure ATS Monospace (Highly Recommended)</option>
                  <option value="minimal">Minimal Teal Clean</option>
                  <option value="executive">Executive Classic Blue</option>
                  <option value="creative">Creative Pink-Purple Gradient</option>
                </select>
              </div>

              <PinsGate featureKey="career_assets" onUnlocked={triggerGenerate}>
              <button onClick={triggerGenerate} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={generating || selectedIds.length === 0}>
                {generating ? '🧬 Constructing Assets...' : '✨ Generate Career Assets'}
              </button>
            </PinsGate>
            </div>
          )}
        </div>

        {/* Right Side: Interactive generated assets tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Asset selectors */}
          {generated && (
            <div style={{ display: 'flex', gap: 6, background: 'var(--bg3)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content', flexWrap: 'wrap' }}>
              {[
                { id: 'ats', label: 'ATS Resume', icon: '🎯' },
                { id: 'onepage', label: 'One-Page', icon: '📄' },
                { id: 'linkedin', label: 'LinkedIn', icon: '🔗' },
                { id: 'cover', label: 'Cover Letter', icon: '✉️' },
                { id: 'portfolio', label: 'Living Portfolio', icon: '👁' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveAsset(tab.id as any)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: activeAsset === tab.id ? 'var(--bg2)' : 'transparent',
                  color: activeAsset === tab.id ? 'var(--t1)' : 'var(--t3)',
                  boxShadow: activeAsset === tab.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.12s'
                }}>
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Generated preview viewport */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, minHeight: 480, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            
            {/* If not generated yet */}
            {!generated && !generating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Ready for Generation</h3>
                <p style={{ fontSize: 12.5, color: 'var(--t2)', maxWidth: 360, margin: '0 auto 20px' }}>
                  Select the verified evidence documents from your Vault and click generate to build your entire job application package.
                </p>
                <button onClick={triggerGenerate} className="btn-primary" disabled={selectedIds.length === 0}>
                  → Generate Assets
                </button>
              </div>
            )}

            {/* If generating */}
            {generating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, animation: 'spin 1.2s linear infinite', marginBottom: 14 }}>🧬</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>AI Structuring Engine Running...</h3>
                <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0 }}>Reading vault metadata, generating summaries, and optimizing keyword tags.</p>
              </div>
            )}

            {/* Displaying generated asset */}
            {generated && !generating && (() => {
              switch (activeAsset) {
                case 'ats':
                  const tStyle = getTemplateStyle();
                  return (
                    <div style={{ padding: 24, fontSize: 13, color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Ashwanth Kumar</h2>
                          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>React SDE & AI Enthusiast | ashwanth@pinit.app | +91 98765 43210</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.2)' }}>ATS Match: 94%</span>
                      </div>
                      
                      {/* Styled Section per Template selection */}
                      <div style={{ padding: '12px 16px', borderRadius: 10, ...tStyle }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                          AI Summary Profile ({template.toUpperCase()} Mode)
                        </div>
                        <p style={{ lineHeight: 1.6, margin: 0, fontSize: 12 }}>
                          Aggressive and highly focused Developer with extensive experience in React frontend engineering, real-time Firestore database architectures, and verified deployments. Confirmed cloud expertise with official AWS credentials.
                        </p>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>Selected Vault Assets</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {vaultItems.filter(itm => selectedIds.includes(itm.id)).map(itm => (
                            <div key={itm.id} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                              <strong style={{ fontSize: 12, color: 'var(--t1)' }}>{itm.title}</strong>
                              <div style={{ fontSize: 11, color: 'var(--t2)' }}>Issued by {itm.organization_name || 'Verified Issuer'}</div>
                              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                {itm.skill_tags.map(s => (
                                  <span key={s} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--bg2)', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{s}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <button className="btn-primary btn-sm">⬇ Download PDF Resume</button>
                        <button className="btn-ghost btn-sm" onClick={() => addXp(15, 'ATS Keywords re-targeted')}>✨ Retarget ATS Keywords</button>
                      </div>
                    </div>
                  );
                case 'onepage':
                  return (
                    <div style={{ padding: 24, fontSize: 13, color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Ashwanth Kumar</h2>
                        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>BCA Student · SDE Aspirant</span>
                      </div>
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                          <div>
                            <strong style={{ fontSize: 11, color: 'var(--accent)', display: 'block', marginBottom: 4 }}>SKILLS</strong>
                            {['React', 'Next.js', 'AWS', 'Python', 'ML'].map(s => <div key={s} style={{ fontSize: 11.5 }}>• {s}</div>)}
                          </div>
                          <div>
                            <strong style={{ fontSize: 11, color: 'var(--accent)', display: 'block', marginBottom: 4 }}>EVIDENCE HIGHLIGHTS</strong>
                            {vaultItems.filter(itm => selectedIds.includes(itm.id)).slice(0, 3).map(itm => (
                              <div key={itm.id} style={{ fontSize: 11.5, marginBottom: 6 }}>
                                <strong style={{ color: 'var(--t1)' }}>{itm.title}</strong>
                                <div style={{ fontSize: 10, color: 'var(--t3)' }}>({itm.organization_name || 'Self-published'})</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button className="btn-primary btn-sm" style={{ width: 'fit-content', marginTop: 12 }}>⬇ Download One-Page PDF</button>
                    </div>
                  );
                case 'linkedin':
                  return (
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Generated Profile Summary</div>
                      <div style={{ background: 'var(--bg3)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', fontSize: 12.5, lineHeight: 1.6, color: 'var(--t1)' }}>
                        🚀 Passionate Developer specializing in scale Frontend UI systems and automated intelligence platforms. Powered by verified achievements: {vaultItems.filter(itm => selectedIds.includes(itm.id)).map(itm => itm.title).join(', ') || 'verified projects'}. Bridging the gap from code design to high-impact products!
                      </div>
                      <button onClick={() => {
                        navigator.clipboard.writeText("Passionate Developer specializing in scale Frontend UI systems...");
                        toast.success('📋 Copied to Clipboard', 'LinkedIn bio ready to paste.');
                      }} className="btn-primary btn-sm" style={{ width: 'fit-content' }}>
                        📋 Copy Summary
                      </button>
                    </div>
                  );
                case 'cover':
                  return (
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Generated Cover Letter</div>
                      <div style={{ background: 'var(--bg3)', padding: 18, borderRadius: 14, border: '1px solid var(--border)', fontSize: 12, lineHeight: 1.6, color: 'var(--t1)', height: 260, overflowY: 'auto', fontFamily: 'monospace' }}>
                        Dear Hiring Team,<br /><br />
                        I am writing to express my strong interest in the SDE position. As a verified candidate within the PINIT Operating System, my skills have been rigorously modeled and verified through real behavioral evidence.<br /><br />
                        My PINIT secure vault lists verified evidence including:<br />
                        {vaultItems.filter(itm => selectedIds.includes(itm.id)).map(itm => `• ${itm.title} (${itm.organization_name || 'Verified'})\n`)}
                        This validates my capacity to deploy secure, scaling interfaces.<br /><br />
                        Thank you for your time.<br /><br />
                        Sincerely,<br />
                        Ashwanth Kumar
                      </div>
                      <button onClick={() => {
                        navigator.clipboard.writeText("Dear Hiring Team...");
                        toast.success('📋 Copied to Clipboard', 'Cover letter copied.');
                      }} className="btn-primary btn-sm" style={{ width: 'fit-content' }}>
                        📋 Copy Cover Letter
                      </button>
                    </div>
                  );
                case 'portfolio':
                  return (
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Living Portfolio Website Mockup</div>
                        <span style={{ fontSize: 10, color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 10 }}>● Live Auto-Updating</span>
                      </div>

                      {/* Mockup website frame */}
                      <div style={{ border: '2.5px solid var(--border2)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', background: 'var(--bg3)' }}>
                        {/* Header toolbar */}
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)' }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                          <span style={{ fontSize: 9.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginLeft: 16 }}>ashwanth.pinit.me</span>
                        </div>
                        {/* Landing content */}
                        <div style={{ padding: 20, textAlign: 'center', background: 'var(--bg2)' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>AK</div>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Ashwanth Kumar</h4>
                          <p style={{ fontSize: 10.5, color: 'var(--t3)', margin: '2px 0 12px' }}>Verified SDE Aspirant Portfolio</p>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', maxWidth: 280, margin: '0 auto' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Verified Accomplishments</div>
                            {vaultItems.filter(itm => selectedIds.includes(itm.id)).map(itm => (
                              <div key={itm.id} style={{ fontSize: 10, padding: '6px 8px', background: 'var(--bg3)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                🏆 {itm.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <button className="btn-primary btn-sm" style={{ width: 'fit-content' }} onClick={() => addXp(20, 'Portfolio Deployed Live')}>👁 Deploy Live Portfolio</button>
                    </div>
                  );
                default:
                  return null;
              }
            })()}

          </div>

        </div>

      </div>

    </div>
  );
}
