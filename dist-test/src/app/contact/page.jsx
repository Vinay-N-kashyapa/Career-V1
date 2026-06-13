'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContactPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
function ContactPage() {
    const [formData, setFormData] = (0, react_1.useState)({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message)
            return;
        setLoading(true);
        // Simulate API request
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1200);
    };
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
            background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, rgba(124,58,237,0) 70%)',
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
            maxWidth: '540px',
            width: '100%',
            margin: '0 auto',
            padding: '60px 24px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center'
        }}>
        <div style={{
            background: 'rgba(10, 15, 26, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            width: '100%'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: '10px',
            background: 'linear-gradient(to right, #c084fc, #34d399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-display)',
            textAlign: 'center'
        }}>📧 Contact Us</h1>
          <p style={{ fontSize: '13px', color: 'var(--t3)', textAlign: 'center', marginBottom: '32px' }}>
            Have a question, feedback, or need help with credential verification? Send us a message!
          </p>

          {submitted ? (<div style={{
                textAlign: 'center',
                padding: '30px 0',
                animation: 'fadeIn 0.4s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Message Sent!</h2>
              <p style={{ fontSize: '13px', color: 'var(--t3)', lineHeight: '1.6', marginBottom: '24px' }}>
                Thank you for contacting us. Our AI Career support team has received your inquiry and will respond to you via email shortly.
              </p>
              <button onClick={() => setSubmitted(false)} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '10px 20px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'background 0.2s'
            }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')} onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}>
                Send Another Message
              </button>
            </div>) : (<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" required placeholder="Your full name" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" required placeholder="yourname@example.com" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}/>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" placeholder="How can we help you?" className="form-input" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}/>
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea required rows={4} placeholder="Type your message here..." className="form-input" style={{ resize: 'vertical', minHeight: '100px' }} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}/>
              </div>

              <button type="submit" disabled={loading} style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px'
            }} onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')} onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}>
                {loading ? 'Sending message...' : 'Send Message →'}
              </button>
            </form>)}
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
