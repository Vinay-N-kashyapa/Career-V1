'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';

function ResetForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') || '';

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch { setError('Could not send reset email. Try again.'); }
    finally { setLoading(false); }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { token, password, confirmPassword: confirm });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) { setError(err.message || 'Reset failed. Link may be expired.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:44, height:44, background:'linear-gradient(135deg, var(--accent), var(--purple))', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'white', boxShadow:'0 6px 20px rgba(79,70,229,0.35)' }}>Pi</div>
            <span style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--t1)', letterSpacing:'-0.5px' }}>PinIT</span>
          </div>
          <div className="auth-title">{token ? 'Set New Password' : 'Reset Password'}</div>
          <div className="auth-sub">{token ? 'Enter your new password below' : 'We\'ll send you a reset link'}</div>
        </div>

        {success && (
          <div className="alert alert-success" style={{ marginBottom:16 }}>
            <span>✓</span> Password reset! Redirecting to login...
          </div>
        )}

        {sent && !token && (
          <div className="alert alert-success" style={{ marginBottom:16 }}>
            <span>✓</span> If that account exists, a reset link has been sent to {email}. Check your inbox.
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom:14 }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Request reset form */}
        {!token && !sent && (
          <form onSubmit={requestReset}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <button type="submit" className="btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:14 }}
              disabled={loading}>
              {loading ? '⏳ Sending...' : 'Send Reset Link →'}
            </button>
          </form>
        )}

        {/* New password form */}
        {token && !success && (
          <form onSubmit={doReset}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="min 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="repeat new password"
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {/* Strength indicator */}
            {password && (
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:3, borderRadius:3, background: password.length >= i*3 ? (i<=2?'var(--amber)':i===3?'var(--teal)':'var(--green)') : 'var(--bg3)', transition:'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize:10.5, color:'var(--t3)' }}>
                  {password.length < 8 ? 'Too short' : password.length < 12 ? 'Fair' : password.length < 16 ? 'Good' : 'Strong ✓'}
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:14 }}
              disabled={loading}>
              {loading ? '⏳ Resetting...' : 'Reset Password →'}
            </button>
          </form>
        )}

        <div style={{ textAlign:'center', marginTop:18, fontSize:12.5, color:'var(--t3)' }}>
          <Link href="/login" style={{ color:'var(--accent)', fontWeight:500, textDecoration:'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card">Loading...</div></div>}>
      <ResetForm />
    </Suspense>
  );
}
