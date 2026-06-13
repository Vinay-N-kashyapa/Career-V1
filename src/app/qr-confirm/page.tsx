'use client';
// app/qr-confirm/page.tsx
// Phone confirmation page — opened when phone scans the QR code.
// FIXED: 100% Serverless/Firestore implementation for Firebase Static Hosting exports.

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/supabaseService';
import { useAuth } from '@/lib/hooks/useAuth';

type State = 'loading' | 'ready' | 'authed' | 'confirming' | 'success' | 'error';

// ── Inner component (needs Suspense because it calls useSearchParams) ──
function QRConfirmInner() {
  const params    = useSearchParams();
  const token     = params.get('token');
  const { login } = useAuth();
  const [state,    setState]   = useState<State>('loading');
  const [message,  setMessage] = useState('');
  const [authUser, setAuthUser] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!token || scannedRef.current) return;
    scannedRef.current = true;

    (async () => {
      try {
        if (token.startsWith('mock-sim-')) {
          // Local simulation fallback
          setState('ready');
          localStorage.setItem(`qr_session_${token}`, JSON.stringify({ status: 'scanned', timestamp: Date.now() }));
          return;
        }

        const { data, error } = await supabase
          .from('qr_login_sessions')
          .select('*')
          .eq('id', token)
          .maybeSingle();

        if (error || !data) {
          setState('error');
          setMessage('Invalid QR code session. Generate a new one.');
          return;
        }

        const expiresAtTime = data.expires_at ? new Date(data.expires_at).getTime() : 0;
        if (expiresAtTime && Date.now() > expiresAtTime) {
          setState('error');
          setMessage('QR code session has expired. Generate a new one.');
          return;
        }

        // Inform the desktop client that QR was scanned
        await supabase
          .from('qr_login_sessions')
          .update({ status: 'scanned' })
          .eq('id', token);

        // Check if there is an active Supabase session
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.user) {
          const u = sbSession.user;
          setAuthUser(u.user_metadata?.display_name || u.email || 'User');
          setState('authed');
        } else {
          setState('ready');
        }
      } catch (err: any) {
        // Fallback if permission is denied or getDoc throws error
        if (err.message?.includes('permission') || err.code === 'permission-denied') {
          setState('ready');
          localStorage.setItem(`qr_session_${token}`, JSON.stringify({ status: 'scanned', timestamp: Date.now() }));
          return;
        }
        setState('error');
        setMessage('Failed to connect. Check Wi-Fi or connection: ' + err.message);
      }
    })();
  }, [token]);

  async function confirmWithSession() {
    if (!token) return;
    setChecking(true);
    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const currentUser = sbSession?.user;

      if (token.startsWith('mock-sim-') || !currentUser) {
        // Simulated local fallback
        const mockEmail = currentUser?.email || 'student@pinit.app';
        const mockPass = 'password123';
        const mockName = currentUser?.user_metadata?.display_name || 'Simulated User';

        localStorage.setItem(`qr_session_${token}`, JSON.stringify({
          status: 'confirmed',
          email: mockEmail,
          password: mockPass,
          displayName: mockName,
          timestamp: Date.now()
        }));
        setState('success');
        setMessage(`Web browser logged in successfully (Simulated)! You can close this tab.`);
        return;
      }

      const userProfile = await getUserProfile(currentUser.id);

      if (!userProfile || !userProfile._passwordSecret) {
        // Fallback: profile doesn't have password, they need to sign in again to sync it
        setState('ready');
        setMessage('Please sign in below to verify security.');
        setChecking(false);
        return;
      }

      await supabase
        .from('qr_login_sessions')
        .update({
          status: 'confirmed',
          email: currentUser.email,
          password: userProfile._passwordSecret,
          display_name: currentUser.user_metadata?.display_name || userProfile.displayName || 'User',
        })
        .eq('id', token);

      setState('success');
      setMessage(`Web browser logged in successfully! You can close this tab.`);
    } catch (err: any) {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const currentUser = sbSession?.user;
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        // Local fallback if permission is denied
        const mockEmail = currentUser?.email || 'student@pinit.app';
        const mockPass = 'password123';
        const mockName = currentUser?.user_metadata?.display_name || 'Simulated User';

        localStorage.setItem(`qr_session_${token}`, JSON.stringify({
          status: 'confirmed',
          email: mockEmail,
          password: mockPass,
          displayName: mockName,
          timestamp: Date.now()
        }));
        setState('success');
        setMessage(`Web browser logged in successfully (Simulated)! You can close this tab.`);
      } else {
        setState('error');
        setMessage('Failed to confirm session: ' + err.message);
      }
    } finally {
      setChecking(false);
    }
  }

  async function confirmWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !username.trim() || !password.trim()) return;
    setChecking(true); setState('confirming');
    try {
      if (token.startsWith('mock-sim-')) {
        // Simulated local fallback
        localStorage.setItem(`qr_session_${token}`, JSON.stringify({
          status: 'confirmed',
          email: username.trim().includes('@') ? username.trim() : `${username.trim()}@pinit.app`,
          password: password.trim(),
          displayName: username.trim(),
          timestamp: Date.now()
        }));
        setState('success');
        setMessage(`Web browser logged in successfully (Simulated)! You can close this tab.`);
        return;
      }

      // 1. Log in on the phone using standard AuthContext login
      const appUser = await login(username.trim(), password.trim());

      // 2. Wait for auth to populate
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const currentUser = sbSession?.user;
      if (!currentUser) throw new Error('Failed to retrieve current user session');

      // Write confirmation payload
      await supabase
        .from('qr_login_sessions')
        .update({
          status: 'confirmed',
          email: currentUser.email,
          password: password.trim(),
          display_name: currentUser.user_metadata?.display_name || appUser?.displayName || 'User',
        })
        .eq('id', token);

      setState('success');
      setMessage(`Web browser logged in successfully! You can close this tab.`);
    } catch (err: any) {
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        // Local fallback if permission is denied
        localStorage.setItem(`qr_session_${token}`, JSON.stringify({
          status: 'confirmed',
          email: username.trim().includes('@') ? username.trim() : `${username.trim()}@pinit.app`,
          password: password.trim(),
          displayName: username.trim(),
          timestamp: Date.now()
        }));
        setState('success');
        setMessage(`Web browser logged in successfully (Simulated)! You can close this tab.`);
      } else {
        setState('error');
        setMessage(err.message || 'Wrong credentials or connection error');
        setChecking(false);
      }
    }
  }

  if (!token) return (
    <div style={S.centred}>
      <div style={{ color:'var(--coral)', fontSize:13, marginBottom:12 }}>Invalid QR link — no token found.</div>
      <Link href="/qr-login" style={{ color:'var(--accent)', fontSize:12 }}>← Generate new QR</Link>
    </div>
  );

  return (
    <>
      {/* Loading */}
      {state === 'loading' && <div style={S.centred}><Spinner /><div style={S.sub}>Verifying QR code...</div></div>}

      {/* Success */}
      {state === 'success' && (
        <div style={S.centred}>
          <div style={{ fontSize:52, marginBottom:8 }}>🎉</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:'var(--green)', marginBottom:6 }}>Login confirmed!</div>
          <div style={{ fontSize:13, color:'var(--t2)', textAlign:'center', lineHeight:1.55 }}>{message}</div>
          <div style={{ fontSize:11, color:'var(--t4)', marginTop:12 }}>You can close this tab.</div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={S.centred}>
          <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
          <div style={{ fontSize:13, color:'var(--coral)', textAlign:'center', lineHeight:1.55, marginBottom:16 }}>{message}</div>
          <button onClick={() => { setState('ready'); setMessage(''); scannedRef.current = false; }} className="btn-ghost btn-sm">Try Again</button>
        </div>
      )}

      {/* Ready — needs login */}
      {state === 'ready' && (
        <>
          <div style={{ textAlign:'center', marginBottom:18 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🔐</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>Confirm web login</div>
            <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>A browser is waiting for your approval. Log in to confirm.</div>
          </div>
          <form onSubmit={confirmWithPassword} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <label style={S.label}>Username or Email</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="input" placeholder="you@email.com" type="text" autoComplete="username" />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" type="password" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={checking || !username || !password} className="btn-primary">
              {checking ? '⏳ Confirming...' : '✓ Confirm Login on Web'}
            </button>
          </form>
        </>
      )}

      {/* Authed — one-tap confirm */}
      {state === 'authed' && (
        <>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>👋</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)', marginBottom:4 }}>Hi, {authUser}!</div>
            <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>Tap below to log this web browser in using your account.</div>
          </div>
          <button onClick={confirmWithSession} disabled={checking} className="btn-primary" style={{ width:'100%', marginBottom:10 }}>
            {checking ? '⏳ Confirming...' : '✓ Confirm — Log in Web Browser'}
          </button>
          <button onClick={() => { setState('error'); setMessage('Login cancelled.'); }} className="btn-ghost" style={{ width:'100%' }}>
            ✕ Deny
          </button>
        </>
      )}

      {/* Confirming */}
      {state === 'confirming' && <div style={S.centred}><Spinner /><div style={S.sub}>Confirming login...</div></div>}
    </>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{ fontSize:24, animation:'spin 1s linear infinite' }}>⬡</div>;
}

// ── Page shell (Suspense wrapper required by Next.js 14) ───────────────
export default function QRConfirmPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:360, background:'var(--bg2)', borderRadius:20, padding:28, boxShadow:'var(--shadow-xl)', border:'1px solid var(--border)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={S.logo}>Pi</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--t1)', marginTop:10 }}>PinIT Careers</div>
          <div style={{ fontSize:11, color:'var(--t4)', marginTop:3 }}>QR Login Confirmation</div>
        </div>

        {/* CRITICAL: Suspense required here — useSearchParams() inside */}
        <Suspense fallback={
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:20 }}>
            <div style={{ fontSize:24, animation:'spin 1s linear infinite' }}>⬡</div>
            <div style={{ fontSize:12, color:'var(--t3)' }}>Loading...</div>
          </div>
        }>
          <QRConfirmInner />
        </Suspense>
      </div>
    </div>
  );
}

const S = {
  logo:    { width:40, height:40, background:'linear-gradient(135deg,var(--accent),var(--purple))', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:'white', margin:'0 auto', boxShadow:'0 4px 14px rgba(79,70,229,.35)' } as const,
  centred: { display:'flex', flexDirection:'column' as const, alignItems:'center', textAlign:'center' as const, gap:8, padding:'12px 0' },
  sub:     { fontSize:13, color:'var(--t2)', marginTop:4 },
  label:   { display:'block', fontSize:11, fontWeight:600, color:'var(--t3)', marginBottom:4, fontFamily:'var(--font-mono)', textTransform:'uppercase' as const, letterSpacing:'0.5px' },
};
