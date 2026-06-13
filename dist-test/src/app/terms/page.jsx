'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TermsPage;
const link_1 = __importDefault(require("next/link"));
function TermsPage() {
    return (<main style={{
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
        }}/>

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
        <link_1.default href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
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
        </link_1.default>
        <link_1.default href="/login" style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#94a3b8',
            textDecoration: 'none',
            transition: 'color 0.15s'
        }}>
          Back to Sign In →
        </link_1.default>
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
            background: 'linear-gradient(to right, #a5b4fc, #34d399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-display)'
        }}>📜 Terms of Service</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--t4)', fontFamily: 'var(--font-mono)', marginBottom: '32px' }}>
            Last Updated: June 12, 2026
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.6', color: 'var(--t2)' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>1. Acceptance of Terms</h2>
              <p>
                By accessing or using the PinIT Career OS web application, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not access or use the application.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>2. Account Responsibility &amp; Academic Integrity</h2>
              <p>
                You are responsible for maintaining the confidentiality of your credentials. You agree that all socratic coding quests, exams, and diagnostic assessments will be completed by you personally. Attempting to bypass exam tab-switching checks or upload fabricated validation proofs will result in immediate Trust Score deductions or account suspension.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>3. Cryptographic Signature Service</h2>
              <p>
                The Sentinel verification service is provided as-is. We guarantee that the SHA-256 hashes generated by our platform are unique to the inputs provided, but the verification status depends on the validity of external organizational credentials uploaded to your Secure Vault.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>4. Premium Services</h2>
              <p>
                Access to certain socratic quests, live mock assessment interviews, and specialized recruiter filters may require purchase. All payments processed via Razorpay are subject to their respective terms and conditions.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>5. Modifications &amp; Contact</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the platform constitutes agreement to the updated terms. If you have questions about these terms, please contact us at our <link_1.default href="/contact" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Contact Page</link_1.default>.
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
    </main>);
}
