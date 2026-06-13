'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--t1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, rgba(79,70,229,0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Landing Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(11, 15, 25, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(79,70,229,0.25)'
          }}>Pi</div>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc' }}>PinIT Careers</span>
        </Link>
        <Link href="/login" style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#94a3b8',
          textDecoration: 'none',
          transition: 'color 0.15s'
        }}>
          Back to Sign In →
        </Link>
      </header>

      {/* Content Area */}
      <div style={{
        flex: 1,
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '60px 24px',
        zIndex: 10
      }}>
        <div style={{
          background: 'rgba(10, 15, 26, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: '10px',
            background: 'linear-gradient(to right, #a5b4fc, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-display)'
          }}>🔒 Privacy Policy</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--t4)', fontFamily: 'var(--font-mono)', marginBottom: '32px' }}>
            Last Updated: June 12, 2026
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.6', color: 'var(--t2)' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us when creating an account, uploading files to your Secure Vault, and completing socratic quests. This includes your username, email address, password, resume text, and verification records.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>2. Cryptographic Hashes &amp; Sentinel Registry</h2>
              <p>
                To provide verified skill claims, our Sentinel system generates SHA-256 hashes of your certifications, credentials, and coding quest completion records. Only the cryptographic hashes and timestamps are stored on the verification registry. Your raw document data remains privately stored and encrypted.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>3. Real-time Recruiter Access Controls</h2>
              <p>
                You retain complete, real-time control over who can view your parsed resume details and portfolio items. Recruiter access permissions can be enabled or revoked instantly from your Sentinel dashboard.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>4. Data Protection &amp; AI Processing</h2>
              <p>
                Your data is processed locally and in secure Supabase and Firebase clouds. We use local and API-driven LLM models to analyze skill gaps and generate socratic challenges. Your personal credentials are never sold or used to train third-party public models.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>5. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding this Privacy Policy, please visit our <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Contact Page</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '11.5px',
        color: '#64748b'
      }}>
        © 2026 PinIT Careers. All rights reserved.
      </footer>
    </main>
  );
}
