import { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | PinIT Career OS - AI-Powered Career Platform',
  description: 'Access your secure biometrics credentials vault, complete socratic learning quests, simulate AI-driven mock interviews, and manage your Career DNA portfolio.',
  keywords: ['Career OS', 'PinIT', 'AI Mock Interview', 'Socratic Quests', 'Secure Biometrics Vault', 'ATS Scan', 'Technical Recruitment'],
  openGraph: {
    title: 'Sign In | PinIT Career OS',
    description: 'Empowering candidate journeys with AI-driven career roadmaps, real-time Socratic learning, and automated recruiter search matching.',
    type: 'website',
  }
};

export default function LoginPage() {
  return (
    <main className="landing-page">
      {/* Global Embedded Stylesheet for Vanilla CSS Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .landing-page {
          min-height: 100vh;
          background-color: #07090e;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .blur-glow-1 {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, rgba(79,70,229,0) 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .blur-glow-2 {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(5,150,105,0.08) 0%, rgba(5,150,105,0) 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .landing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(11, 15, 25, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 10;
        }

        .landing-logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .landing-logo-box {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          color: white;
          box-shadow: 0 4px 12px rgba(79,70,229,0.25);
          transition: transform 0.2s;
        }

        .landing-logo-box:hover {
          transform: scale(1.05);
        }

        .logo-text {
          font-family: inherit;
          font-size: 17px;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.5px;
        }

        .signup-nav-link {
          font-size: 12.5px;
          font-weight: 600;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.15s;
        }

        .signup-nav-link:hover {
          color: #f8fafc;
        }

        .landing-main {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 16px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: center;
          z-index: 10;
        }

        @media (min-width: 576px) {
          .landing-main {
            padding: 40px 24px;
            gap: 48px;
          }
        }

        @media (min-width: 992px) {
          .landing-main {
            grid-template-columns: 1.2fr 1fr;
            padding: 80px 24px;
            gap: 64px;
          }
        }

        .copy-column {
          text-align: left;
        }

        @media (max-width: 575px) {
          .copy-column {
            display: none;
          }
        }

        .promo-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(79, 70, 229, 0.08);
          border: 1px solid rgba(79, 70, 229, 0.18);
          color: #a5b4fc;
          border-radius: 9999px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
          font-family: monospace;
        }

        .h1-title {
          font-size: 2.3rem;
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -1px;
          margin: 0 0 16px;
          background: linear-gradient(to right, #a5b4fc, #c084fc, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @media (min-width: 576px) {
          .h1-title {
            font-size: 3.3rem;
          }
        }

        .p-subtitle {
          font-size: 14.5px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 32px;
          max-width: 540px;
        }

        .proposition-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 576px) {
          .proposition-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .prop-card {
          display: flex;
          gap: 16px;
          text-align: left;
        }

        .prop-icon-box {
          width: 44px;
          height: 44px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }

        .prop-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 4px;
        }

        .prop-desc {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .glass-card {
          width: 100%;
          max-width: 420px;
          justify-self: center;
          background: rgba(10, 15, 26, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        @media (min-width: 576px) {
          .glass-card {
            padding: 32px;
          }
        }

        .glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(79, 70, 229, 0.4), transparent);
        }

        .card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .card-title {
          font-size: 19px;
          font-weight: 850;
          color: #f8fafc;
          margin: 0 0 4px;
        }

        .card-subtitle {
          font-size: 11.5px;
          color: #64748b;
          margin: 0;
        }

        .landing-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(11, 15, 25, 0.2);
          backdrop-filter: blur(8px);
          font-size: 11.5px;
          color: #64748b;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          gap: 12px;
          z-index: 10;
        }

        @media (min-width: 576px) {
          .landing-footer {
            flex-direction: row;
            gap: 0;
          }
        }

        .footer-links {
          display: flex;
          gap: 16px;
        }

        .footer-link {
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s;
        }

        .footer-link:hover {
          color: #94a3b8;
        }
      ` }} />

      {/* Decorative Blur Spheres */}
      <div className="blur-glow-1"></div>
      <div className="blur-glow-2"></div>

      {/* Landing Header */}
      <header className="landing-header">
        <Link href="/" className="landing-logo-link">
          <div className="landing-logo-box">Pi</div>
          <span className="logo-text">PinIT Careers</span>
        </Link>
        <Link href="/signup" className="signup-nav-link">
          Create account →
        </Link>
      </header>

      {/* Main Container */}
      <div className="landing-main">
        {/* Left Section: Copy & Value Propositions */}
        <section className="copy-column">
          <span className="promo-badge">
            ⚡ Next-Gen Career OS
          </span>
          <h1 className="h1-title">
            Empowering Careers <br />with AI Orchestration.
          </h1>
          <p className="p-subtitle">
            Access your secure mobile credentials vault, perform socratic learning quests, and qualify for placement matching using our unified diagnostic system.
          </p>

          <div className="proposition-grid">
            {[
              {
                icon: '🎙️',
                title: 'Technical Mock Interviews',
                desc: 'Simulate HR coding runs and live reviews using real-time lip-synced humanoid avatars.'
              },
              {
                icon: '🗺️',
                title: 'Socratic Quest Training',
                desc: 'Structured quest curriculum modules matching custom skills and streak challenges.'
              },
              {
                icon: '🔐',
                title: 'Sentinel Trust Registry',
                desc: 'Import verified achievements from your phone vault via cryptographic SHA-256 signatures.'
              },
              {
                icon: '⚡',
                title: 'Unified Career DNA',
                desc: 'Track placement portfolios, recruiter visibility metrics, and ATS score analytics.'
              }
            ].map((prop, idx) => (
              <div className="prop-card" key={idx}>
                <div className="prop-icon-box">{prop.icon}</div>
                <div>
                  <h3 className="prop-title">{prop.title}</h3>
                  <p className="prop-desc">{prop.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Section: Glassmorphic Login Card */}
        <section className="glass-card">
          <div className="card-header">
            <h2 className="card-title">Account Sign In</h2>
            <p className="card-subtitle">Select your method below to proceed</p>
          </div>

          {/* Render Client LoginForm component */}
          <LoginForm />
        </section>
      </div>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <p>© 2026 PinIT Careers. All rights reserved.</p>
        <div className="footer-links">
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-link">Terms of Service</Link>
        </div>
      </footer>
    </main>
  );
}
