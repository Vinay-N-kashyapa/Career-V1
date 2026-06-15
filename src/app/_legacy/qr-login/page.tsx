'use client';
// app/qr-login/page.tsx
// 100% Serverless client-side QR login via Firestore real-time session document broker.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/hooks/useAuth';

type QRStatus = 'loading' | 'ready' | 'scanned' | 'confirmed' | 'expired';

// ── Tab 1: QR Code ───────────────────────────────────────────────────

function QRTab() {
  const router                      = useRouter();
  const { login }                   = useAuth();
  const [token,    setToken]        = useState<string | null>(null);
  const [qrUrl,    setQrUrl]        = useState<string | null>(null);
  const [status,   setStatus]       = useState<QRStatus>('loading');
  const [timeLeft, setTimeLeft]     = useState(300);
  const [message,  setMessage]      = useState('');
  const [localIP,  setLocalIP]      = useState('');
  const [showIPInput, setShowIPInput] = useState(false);
  const [isLocalSimulation, setIsLocalSimulation] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // Detect if we're on localhost — phone can't reach localhost
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  function buildPhoneURL(qrToken: string): string {
    if (localIP.trim()) {
      // User provided their local IP — phone can reach this
      return `http://${localIP.trim()}:3000/qr-confirm?token=${qrToken}`;
    }
    if (isLocalhost) {
      // Fallback: use localhost — ONLY works if phone is the same device
      return `${window.location.origin}/qr-confirm?token=${qrToken}`;
    }
    // Production or LAN hostname — works directly
    return `${window.location.origin}/qr-confirm?token=${qrToken}`;
  }

  const createQR = useCallback(async () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setStatus('loading'); setTimeLeft(300); setToken(null); setQrUrl(null); setMessage('');
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
      const qrToken = data.id;
      setToken(qrToken);

      const phoneUrl = buildPhoneURL(qrToken);
      // Use QR server API to render the QR (free CDN, works offline-ish via cache)
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(phoneUrl)}&bgcolor=ffffff&color=4f46e5&margin=10&format=svg`);
      setStatus('ready');

      // Listen for updates using Supabase Realtime Channels
      const channel = supabase
        .channel(`qr-login-${qrToken}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'qr_login_sessions',
            filter: `id=eq.${qrToken}`,
          },
          async (payload) => {
            const row = payload.new as any;
            if (!row) return;

            if (row.status === 'scanned') {
              setStatus('scanned');
              setMessage('Phone scanned — confirm login on your phone');
            } else if (row.status === 'confirmed') {
              if (row.email && row.password) {
                setStatus('confirmed');
                setMessage('Logged in!');
                try {
                  // Sign in to Supabase Auth on the web client
                  await login(row.email, row.password);
                  // Clean up the session doc
                  await supabase.from('qr_login_sessions').delete().eq('id', qrToken);
                  setTimeout(() => router.push('/dashboard'), 1200);
                } catch (err: any) {
                  setStatus('expired');
                  setMessage('Login failed: ' + (err.message || 'Check credentials'));
                }
              }
            } else if (row.status === 'expired') {
              setStatus('expired');
              setMessage('QR session expired.');
            }
          }
        )
        .subscribe();

      unsubRef.current = () => {
        supabase.removeChannel(channel);
      };
    } catch (e: any) {
      console.warn('Firestore write failed, falling back to local simulation for QR login:', e);
      const mockToken = 'mock-sim-' + Math.random().toString(36).substring(2, 11);
      setToken(mockToken);
      setIsLocalSimulation(true);

      const phoneUrl = buildPhoneURL(mockToken);
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(phoneUrl)}&bgcolor=ffffff&color=4f46e5&margin=10&format=svg`);
      setStatus('ready');
      setMessage('Local simulation mode active (No Firebase Broker)');

      localStorage.setItem(`qr_session_${mockToken}`, JSON.stringify({
        status: 'ready',
        createdAt: Date.now(),
        expiresAt: Date.now() + 300 * 1000,
      }));
    }
  }, [localIP, login, router]);

  useEffect(() => {
    createQR();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [createQR]);

  // Listen for local simulation updates (when on same origin/browser)
  useEffect(() => {
    if (!token || !isLocalSimulation) return;

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === `qr_session_${token}`) {
        try {
          const val = e.newValue ? JSON.parse(e.newValue) : null;
          if (!val) return;
          
          if (val.status === 'scanned') {
            setStatus('scanned');
            setMessage('Phone scanned — confirm login on your phone');
          } else if (val.status === 'confirmed') {
            if (val.email && val.password) {
              setStatus('confirmed');
              setMessage('Logged in!');
              try {
                await login(val.email, val.password);
                localStorage.removeItem(`qr_session_${token}`);
                setTimeout(() => router.push('/dashboard'), 1200);
              } catch (err: any) {
                setStatus('expired');
                setMessage('Login failed: ' + (err.message || 'Check credentials'));
              }
            }
          }
        } catch (err) {}
      }
    };

    const interval = setInterval(async () => {
      const valStr = localStorage.getItem(`qr_session_${token}`);
      if (!valStr) return;
      try {
        const val = JSON.parse(valStr);
        if (val.status === 'scanned' && status === 'ready') {
          setStatus('scanned');
          setMessage('Phone scanned — confirm login on your phone');
        } else if (val.status === 'confirmed' && status !== 'confirmed') {
          if (val.email && val.password) {
            setStatus('confirmed');
            setMessage('Logged in!');
            try {
              await login(val.email, val.password);
              localStorage.removeItem(`qr_session_${token}`);
              clearInterval(interval);
              setTimeout(() => router.push('/dashboard'), 1200);
            } catch (err: any) {
              setStatus('expired');
              setMessage('Login failed: ' + (err.message || 'Check credentials'));
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
  }, [token, isLocalSimulation, status, login, router]);

  // Countdown
  useEffect(() => {
    if (status !== 'ready' && status !== 'scanned') return;
    const t = setInterval(() => setTimeLeft(l => {
      if (l <= 1) { setStatus('expired'); clearInterval(t); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [status]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs    = String(timeLeft % 60).padStart(2, '0');

  return (
    <div style={{ textAlign: 'center' }}>
      {/* ⚠ Localhost warning — phone can't reach localhost */}
      {isLocalhost && (
        <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'10px 12px', marginBottom:12, textAlign:'left' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--amber)', marginBottom:4 }}>📡 Phone scan needs your laptop IP</div>
          {!showIPInput ? (
            <div style={{ fontSize:11, color:'var(--t2)', lineHeight:1.5 }}>
              Running on localhost — phones can't reach that.{' '}
              <button onClick={() => setShowIPInput(true)} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>
                Set your laptop IP →
              </button>
              <div style={{ fontSize:10, color:'var(--t4)', marginTop:3, fontFamily:'var(--font-mono)' }}>
                Windows: ipconfig | findstr IPv4 &nbsp;·&nbsp; Mac: ipconfig getifaddr en0
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:6 }}>
              <span style={{ fontSize:11, color:'var(--t3)', whiteSpace:'nowrap' }}>http://</span>
              <input value={localIP} onChange={e => setLocalIP(e.target.value)} placeholder="192.168.1.105" style={{ flex:1, padding:'4px 8px', borderRadius:5, border:'1px solid var(--border)', background:'var(--bg2)', fontSize:11, fontFamily:'var(--font-mono)', color:'var(--t1)' }} />
              <span style={{ fontSize:11, color:'var(--t3)', whiteSpace:'nowrap' }}>:3000</span>
              <button onClick={() => { setShowIPInput(false); if (token) { const u = buildPhoneURL(token); setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(u)}&bgcolor=ffffff&color=4f46e5&margin=10&format=svg`); } else createQR(); }} className="btn-ghost btn-sm" style={{ fontSize:11 }}>Apply</button>
            </div>
          )}
        </div>
      )}
      {/* QR box */}
      <div style={{
        width: 220, height: 220, margin: '0 auto 16px',
        borderRadius: 16, overflow: 'hidden',
        border: `2px solid ${status === 'confirmed' ? 'var(--green)' : status === 'scanned' ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        transition: 'border-color 0.3s',
      }}>
        {status === 'loading' && <div style={S.qrCenter}><div style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}>⬡</div><div style={S.qrLabel}>Generating...</div></div>}
        {(status === 'ready' || status === 'scanned') && qrUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={qrUrl} alt="QR Code" style={{ width: '100%', height: '100%', display: 'block' }} />
        )}
        {status === 'scanned' && (
          <div style={{ ...S.qrOverlay, background: 'rgba(79,70,229,0.88)' }}>
            <div style={{ fontSize: 32 }}>📱</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Phone scanned!</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Confirm on your phone</div>
          </div>
        )}
        {status === 'confirmed' && (
          <div style={{ ...S.qrOverlay, background: 'rgba(5,150,105,0.92)' }}>
            <div style={{ fontSize: 36 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Verified!</div>
          </div>
        )}
        {status === 'expired' && (
          <div style={{ ...S.qrCenter, cursor: 'pointer' }} onClick={createQR}>
            <div style={{ fontSize: 28, opacity: 0.4 }}>⟳</div>
            <div style={S.qrLabel}>Tap to refresh</div>
          </div>
        )}
      </div>

      {/* Status row */}
      <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8, fontFamily: 'var(--font-mono)', minHeight: 18 }}>
        {status === 'ready'     && `Expires in ${minutes}:${secs}`}
        {status === 'scanned'   && '📱 Confirm biometric on your phone'}
        {status === 'confirmed' && '✓ Redirecting...'}
        {status === 'expired'   && (message || 'QR expired')}
        {status === 'loading'   && ''}
      </div>

      {/* Progress bar */}
      {(status === 'ready' || status === 'scanned') && (
        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(timeLeft / 300) * 100}%`, background: 'var(--accent)', transition: 'width 1s linear', borderRadius: 2 }} />
        </div>
      )}

      {status === 'expired' && (
        <button onClick={createQR} className="btn-primary" style={{ width: '100%', marginBottom: 12 }}>Generate New QR</button>
      )}

      {/* How it works */}
      <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', textAlign: 'left', marginTop: 8 }}>
        <div style={S.stepsTitle}>How it works</div>
        {[
          'Open the PinIT app or browser on your phone',
          'Scan this QR code with your camera',
          'Confirm with Face ID or fingerprint',
          'This browser logs in automatically',
        ].map((s, i) => (
          <div key={i} style={S.step}>
            <span style={S.stepNum}>{i + 1}</span> {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function QRLoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={S.logo}>Pi</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--t1)' }}>PinIT Careers</span>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, textAlign: 'center', color: 'var(--t1)', marginBottom: 4 }}>
          Quick Login
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 20 }}>Scan QR to log in instantly</div>

        <div style={{ marginBottom: 16 }}>
          <QRTab />
        </div>

        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--t3)', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Password login</Link>
          {' · '}
          <Link href="/signup" style={{ color: 'var(--t2)', textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const S = {
  logo: { width:38, height:38, background:'linear-gradient(135deg,var(--accent),var(--purple))', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:'white', boxShadow:'0 4px 14px rgba(79,70,229,.3)' } as const,
  qrCenter: { width:'100%', height:'100%', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', gap:8, background:'var(--bg3)' },
  qrOverlay: { position:'absolute' as const, inset:0, display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', gap:8, color:'white' },
  qrLabel: { fontSize:11, color:'var(--t3)' },
  stepsTitle: { fontSize:10.5, fontWeight:600, color:'var(--t3)', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:8, fontFamily:'var(--font-mono)' },
  step: { display:'flex', gap:8, alignItems:'center', marginBottom:5, fontSize:12, color:'var(--t2)' },
  stepNum: { width:18, height:18, borderRadius:'50%', background:'var(--accent-light)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 },
};
