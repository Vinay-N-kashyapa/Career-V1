'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

type LoginMode = 'password' | 'qr';
type QRStatus = 'loading' | 'ready' | 'scanned' | 'confirmed' | 'expired';

function getRedirectPath(email: string | null | undefined, role: string | null | undefined): string {
  const emailLower = email?.toLowerCase() || '';
  const roleLower = role?.toLowerCase() || '';
  if (emailLower === 'admin@pinit.in' || roleLower === 'admin' || roleLower === 'superadmin') {
    return '/admin';
  }
  if (emailLower === 'rec@pinit.in' || roleLower === 'recruiter') {
    return '/recruiter';
  }
  if (emailLower === 'con@pinit.in' || roleLower === 'consultant') {
    return '/consultant';
  }
  return '/dashboard';
}

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  // Mode state
  const [mode, setMode] = useState<LoginMode>('password');

  // Credentials State
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // QR Session State
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<QRStatus>('loading');
  const [timeLeft, setTimeLeft] = useState(300);
  const [qrMessage, setQrMessage] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [isLocalSimulation, setIsLocalSimulation] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // Generate QR Session
  const createQRSession = useCallback(async () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setQrStatus('loading');
    setTimeLeft(300);
    setQrToken(null);
    setQrUrl(null);
    setQrMessage('');
    setIsLocalSimulation(false);

    try {
      const { data, error } = await supabase
        .from('qr_login_sessions')
        .insert({
          status: 'ready',
          expires_at: new Date(Date.now() + 300 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      const token = data.id;
      setQrToken(token);

      // Point the QR URL to the phone confirmation landing page
      const phoneUrl = `${window.location.origin}/qr-confirm?token=${token}`;
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(phoneUrl)}&bgcolor=ffffff&color=4f46e5&margin=10&format=svg`);
      setQrStatus('ready');

      // Listen for updates using Supabase Realtime Channels
      const channel = supabase
        .channel(`qr-login-${token}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'qr_login_sessions',
            filter: `id=eq.${token}`,
          },
          async (payload) => {
            const row = payload.new as any;
            if (!row) return;

            if (row.status === 'scanned') {
              setQrStatus('scanned');
              setQrMessage('Phone scanned — verifying biometrics...');
            } else if (row.status === 'confirmed') {
              if (row.email && row.password) {
                setQrStatus('confirmed');
                setQrMessage('Biometrics Confirmed! Logging in...');
                try {
                  const appUser = await login(row.email, row.password);
                  await supabase.from('qr_login_sessions').delete().eq('id', token);
                  const dest = getRedirectPath(appUser?.email, appUser?.role);
                  setTimeout(() => router.push(dest), 1000);
                } catch (err: any) {
                  setQrStatus('expired');
                  setQrMessage('Authentication failed: ' + (err.message || 'Check credentials'));
                }
              }
            } else if (row.status === 'expired') {
              setQrStatus('expired');
              setQrMessage('Session expired.');
            }
          }
        )
        .subscribe();

      unsubRef.current = () => {
        supabase.removeChannel(channel);
      };
    } catch (e: any) {
      console.warn('Firebase broker write failed, falling back to local simulation:', e);
      const mockToken = 'mock-sim-' + Math.random().toString(36).substring(2, 11);
      setQrToken(mockToken);
      setIsLocalSimulation(true);

      const phoneUrl = `${window.location.origin}/qr-confirm?token=${mockToken}`;
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(phoneUrl)}&bgcolor=ffffff&color=4f46e5&margin=10&format=svg`);
      setQrStatus('ready');
      setQrMessage('Local simulation mode active (No Firebase Broker)');

      localStorage.setItem(`qr_session_${mockToken}`, JSON.stringify({
        status: 'ready',
        createdAt: Date.now(),
        expiresAt: Date.now() + 300 * 1000,
      }));
    }
  }, [login, router]);

  // Handle mode toggle
  useEffect(() => {
    if (mode === 'qr') {
      createQRSession();
    } else {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    }
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [mode, createQRSession]);

  // Countdown timer for QR
  useEffect(() => {
    if (mode !== 'qr' || (qrStatus !== 'ready' && qrStatus !== 'scanned')) return;
    const t = setInterval(() => {
      setTimeLeft(l => {
        if (l <= 1) {
          setQrStatus('expired');
          clearInterval(t);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, qrStatus]);

  // Listen for local simulation updates (when on same origin/browser)
  useEffect(() => {
    if (!qrToken || !isLocalSimulation) return;

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === `qr_session_${qrToken}`) {
        try {
          const val = e.newValue ? JSON.parse(e.newValue) : null;
          if (!val) return;
          
          if (val.status === 'scanned') {
            setQrStatus('scanned');
            setQrMessage('Phone scanned — verifying biometrics...');
          } else if (val.status === 'confirmed') {
            if (val.email && val.password) {
              setQrStatus('confirmed');
              setQrMessage('Biometrics Confirmed! Logging in...');
              try {
                const appUser = await login(val.email, val.password);
                localStorage.removeItem(`qr_session_${qrToken}`);
                const dest = getRedirectPath(appUser?.email, appUser?.role);
                setTimeout(() => router.push(dest), 1000);
              } catch (err: any) {
                setQrStatus('expired');
                setQrMessage('Authentication failed: ' + (err.message || 'Check credentials'));
              }
            }
          }
        } catch (err) {
          console.error("Error parsing storage value:", err);
        }
      }
    };

    const interval = setInterval(async () => {
      const valStr = localStorage.getItem(`qr_session_${qrToken}`);
      if (!valStr) return;
      try {
        const val = JSON.parse(valStr);
        if (val.status === 'scanned' && qrStatus === 'ready') {
          setQrStatus('scanned');
          setQrMessage('Phone scanned — verifying biometrics...');
        } else if (val.status === 'confirmed' && qrStatus !== 'confirmed') {
          if (val.email && val.password) {
            setQrStatus('confirmed');
            setQrMessage('Biometrics Confirmed! Logging in...');
            try {
              const appUser = await login(val.email, val.password);
              localStorage.removeItem(`qr_session_${qrToken}`);
              clearInterval(interval);
              const dest = getRedirectPath(appUser?.email, appUser?.role);
              setTimeout(() => router.push(dest), 1000);
            } catch (err: any) {
              setQrStatus('expired');
              setQrMessage('Authentication failed: ' + (err.message || 'Check credentials'));
            }
          }
        }
      } catch (err) {}
    }, 1000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [qrToken, isLocalSimulation, qrStatus, login, router]);

  // Simulate mobile scan & biometric confirmation
  const handleSimulateMobileScan = async () => {
    if (!qrToken) return;
    setSimulating(true);
    setQrStatus('scanned');
    setQrMessage('Biometric scanner activated on phone...');

    const testUserEmail = form.username.includes('@') ? form.username : `${form.username || 'student'}@pinit.app`;
    const testUserPass = form.password || 'password123';

    if (isLocalSimulation) {
      localStorage.setItem(`qr_session_${qrToken}`, JSON.stringify({
        status: 'scanned',
        timestamp: Date.now()
      }));
    }

    setTimeout(async () => {
      try {
        if (isLocalSimulation) {
          localStorage.setItem(`qr_session_${qrToken}`, JSON.stringify({
            status: 'confirmed',
            email: testUserEmail,
            password: testUserPass,
            displayName: 'Simulated Biometric User',
            timestamp: Date.now()
          }));
          
          setQrStatus('confirmed');
          setQrMessage('Biometrics Confirmed! Logging in...');
          try {
            const appUser = await login(testUserEmail, testUserPass);
            localStorage.removeItem(`qr_session_${qrToken}`);
            const dest = getRedirectPath(appUser?.email, appUser?.role);
            setTimeout(() => router.push(dest), 1000);
          } catch (err: any) {
            setQrStatus('expired');
            setQrMessage('Authentication failed: ' + (err.message || 'Check credentials'));
          }
        } else {
          await supabase
            .from('qr_login_sessions')
            .update({
              status: 'confirmed',
              email: testUserEmail,
              password: testUserPass,
              display_name: 'Simulated Biometric User'
            })
            .eq('id', qrToken);
        }
      } catch (err: any) {
        console.warn('Simulation update failed, trying direct local login fallback:', err);
        setQrStatus('confirmed');
        setQrMessage('Biometrics Confirmed (Local Fallback)! Logging in...');
        try {
          const appUser = await login(testUserEmail, testUserPass);
          const dest = getRedirectPath(appUser?.email, appUser?.role);
          setTimeout(() => router.push(dest), 1000);
        } catch (subErr: any) {
          setQrStatus('expired');
          setQrMessage('Simulation failed: ' + subErr.message);
        }
      } finally {
        setSimulating(false);
      }
    }, 1500);
  };

  // Submit Password Form
  async function submitPasswordForm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const appUser = await login(form.username, form.password);
      const dest = getRedirectPath(appUser?.email, appUser?.role);
      router.push(dest);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <div style={{ width: '100%' }}>
      {/* Tab Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 4,
        padding: 4,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        marginBottom: 24
      }}>
        <button 
          id="btn-tab-pwd"
          type="button" 
          onClick={() => { setMode('password'); setError(''); }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: mode === 'password' ? 'var(--accent)' : 'transparent',
            color: mode === 'password' ? 'white' : 'var(--t3)'
          }}
        >
          Password Sign-in
        </button>
        <button 
          id="btn-tab-qr"
          type="button" 
          onClick={() => { setMode('qr'); setError(''); }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: mode === 'qr' ? 'var(--accent)' : 'transparent',
            color: mode === 'qr' ? 'white' : 'var(--t3)'
          }}
        >
          Scan Mobile QR
        </button>
      </div>

      {/* MODE 1: PASSWORD LOGIN */}
      {mode === 'password' && (
        <form onSubmit={submitPasswordForm} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Username / Email</label>
            <input 
              id="input-username"
              type="text" 
              placeholder="Enter your username or email"
              value={form.username} 
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="form-input"
              autoComplete="username" 
              required 
              autoFocus 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: 11 }}>Password</label>
              <Link 
                id="link-forgot-pwd"
                href="/reset-password" 
                style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-group">
              <input 
                id="input-password"
                type={showPwd ? 'text' : 'password'} 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="form-input"
                style={{ paddingRight: 40 }}
                autoComplete="current-password" 
                required 
              />
              <button 
                id="btn-toggle-pwd"
                type="button" 
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'var(--t3)'
                }}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Quick Demo Login Shortcuts */}
          <div style={{
            padding: 16,
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--t3)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 10,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              ⚡ Quick Demo Shortcuts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Admin', email: 'admin@pinit.in' },
                { label: 'Recruiter', email: 'rec@pinit.in' },
                { label: 'Consultant', email: 'con@pinit.in' },
                { label: 'Student', email: 'student@pinit.in' }
              ].map(demo => (
                <button
                  id={`btn-shortcut-${demo.label.toLowerCase()}`}
                  key={demo.label}
                  type="button"
                  onClick={() => {
                    setForm({ username: demo.email, password: '111111' });
                    setError('');
                  }}
                  style={{
                    padding: '8px 4px',
                    background: 'rgba(10, 15, 26, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: 'var(--t2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(10, 15, 26, 0.6)';
                  }}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, fontSize: 12, marginBottom: 0 }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button 
            id="btn-submit-pwd"
            type="submit" 
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13.5, fontWeight: 700, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? '⏳ Logging in...' : 'Sign In →'}
          </button>
        </form>
      )}

      {/* MODE 2: QR LOGIN SCAN */}
      {mode === 'qr' && (
        <div style={{ textAlign: 'center' }} className="animate-fade-in">
          <div style={{
            width: 220,
            height: 220,
            margin: '0 auto 16px',
            borderRadius: 16,
            overflow: 'hidden',
            border: `2px solid ${
              qrStatus === 'confirmed' 
                ? 'var(--green)' 
                : qrStatus === 'scanned' 
                ? 'var(--accent)' 
                : 'rgba(255,255,255,0.08)'
            }`,
            background: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
          }}>
            {qrStatus === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--t3)' }}>
                <div style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}>⬡</div>
                <div style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}>Generating QR...</div>
              </div>
            )}
            {(qrStatus === 'ready' || qrStatus === 'scanned') && qrUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrUrl} alt="Secure QR Session Code" style={{ width: '100%', height: '100%', display: 'block' }} />
            )}
            {qrStatus === 'scanned' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'rgba(79, 70, 229, 0.9)',
                color: 'white',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }}>
                <span style={{ fontSize: 30 }}>📱</span>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>Scanned!</div>
                <div style={{ fontSize: 10, opacity: 0.9 }}>Verifying biometrics...</div>
              </div>
            )}
            {qrStatus === 'confirmed' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'rgba(16, 185, 129, 0.9)',
                color: 'white',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }}>
                <span style={{ fontSize: 30 }}>✓</span>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>Verified!</div>
              </div>
            )}
            {qrStatus === 'expired' && (
              <div 
                id="btn-refresh-qr"
                onClick={createQRSession}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: 'var(--t3)'
                }}
              >
                <span style={{ fontSize: 24 }}>⟳</span>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Tap to Refresh</div>
              </div>
            )}
          </div>

          {/* Timer / Message Row */}
          <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)', minHeight: 20, marginBottom: 16 }}>
            {qrStatus === 'ready' && `Scan via phone · Expires in ${minutes}:${secs}`}
            {(qrStatus === 'scanned' || qrStatus === 'confirmed') && qrMessage}
            {qrStatus === 'expired' && (qrMessage || 'Session expired')}
          </div>

          {/* Phone Scan Simulation Trigger */}
          {(qrStatus === 'ready' || qrStatus === 'scanned') && (
            <button 
              id="btn-simulate-scan"
              type="button" 
              onClick={handleSimulateMobileScan}
              disabled={simulating}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(79, 70, 229, 0.15)',
                border: '1px solid rgba(79, 70, 229, 0.3)',
                color: 'var(--accent)',
                borderRadius: 10,
                cursor: 'pointer',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.15)'}
            >
              {simulating ? '⏳ Scanning Biometrics...' : '📱 Simulate Biometric Phone Scan'}
            </button>
          )}

          {/* Simulated credentials sync fields */}
          {qrStatus === 'ready' && (
            <div style={{
              padding: 12,
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              textAlign: 'left',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                Biometric Sync Payload
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input 
                  id="input-sync-email"
                  placeholder="Sync Email" 
                  value={form.username} 
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="form-input"
                  style={{ fontSize: 11, padding: '6px 10px' }}
                />
                <input 
                  id="input-sync-pwd"
                  type="password" 
                  placeholder="Sync Password" 
                  value={form.password} 
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input"
                  style={{ fontSize: 11, padding: '6px 10px' }}
                />
              </div>
            </div>
          )}

          {qrStatus === 'expired' && (
            <button 
              id="btn-new-qr"
              onClick={createQRSession} 
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 13, fontWeight: 700 }}
            >
              Generate New QR
            </button>
          )}
        </div>
      )}
    </div>
  );
}
