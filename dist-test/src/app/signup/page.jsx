'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignupPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const useAuth_1 = require("@/lib/hooks/useAuth");
const ROLES = [
    { value: 'student', label: 'Student', icon: '🎓', desc: 'Complete quests, Java coding, AI interviews' },
    { value: 'recruiter', label: 'Recruiter', icon: '🔍', desc: 'Find placement-ready candidates' },
    { value: 'admin', label: 'Admin', icon: '⚙️', desc: 'Manage quests, exams, and platform settings' }
];
function SignupPage() {
    const { signup } = (0, useAuth_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    // Form State
    const [form, setForm] = (0, react_1.useState)({ username: '', displayName: '', password: '', role: 'student' });
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    async function handleRegister(e) {
        e.preventDefault();
        if (!form.username || !form.displayName || !form.password) {
            setError('Please fill out all credentials.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Sign up user using standard AuthContext
            await signup({
                username: form.username,
                displayName: form.displayName,
                password: form.password,
                role: form.role
            });
            // Redirect to onboarding/dashboard
            router.push('/dashboard?onboard=true');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Signup failed');
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Brand Logo */}
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
            width: 42,
            height: 42,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            alignContent: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            fontWeight: 800,
            color: 'white',
            boxShadow: '0 6px 16px rgba(79,70,229,0.3)',
        }}>Pi</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.5px' }}>PinIT Career OS</span>
          </div>
          <div className="auth-title">Create Account</div>
          <div className="auth-sub">Choose your role and register below</div>
        </div>

        <form onSubmit={handleRegister} className="animate-fade-in">
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Username</label>
            <input className="form-input" placeholder="lowercase, no spaces (e.g. janesmith)" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} required style={{ padding: '8px 12px', fontSize: 12.5 }}/>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Display Name</label>
            <input className="form-input" placeholder="Your full name" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required style={{ padding: '8px 12px', fontSize: 12.5 }}/>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Password</label>
            <input className="form-input" type="password" placeholder="6+ characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} style={{ padding: '8px 12px', fontSize: 12.5 }}/>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Choose Account Role</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ROLES.map(r => (<label key={r.value} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 'var(--radius)', cursor: 'pointer',
                border: `1.5px solid ${form.role === r.value ? 'var(--accent)' : 'var(--border)'}`,
                background: form.role === r.value ? 'var(--accent-light)' : 'var(--bg3)',
                transition: 'all 0.15s',
            }}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => setForm(f => ({ ...f, role: r.value }))} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}/>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: form.role === r.value ? 'var(--accent)' : 'var(--t1)' }}>{r.label}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--t3)' }}>{r.desc}</div>
                  </div>
                  {form.role === r.value && (<span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 11 }}>✓</span>)}
                </label>))}
            </div>
          </div>

          {error && (<div className="alert alert-danger" style={{ marginBottom: 14, fontSize: 11.5 }}>
              ⚠️ {error}
            </div>)}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 13, marginTop: 4 }} disabled={loading}>
            {loading ? '⏳ Creating Account...' : 'Register Account ✓'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5, color: 'var(--t3)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          Already have an account?{' '}
          <link_1.default href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</link_1.default>
        </div>
      </div>
    </div>);
}
