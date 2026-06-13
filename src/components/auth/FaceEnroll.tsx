'use client';
// components/auth/FaceEnroll.tsx
// Reusable face enrollment via webcam.
// Used by: Profile > Security, Onboarding (optional step)
//
// Captures 5 frames, averages the face descriptors, sends to /api/auth/face/enroll.
// face-api.js must be loaded in the parent page (use the Script component).

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';

interface Props {
  onSuccess?: () => void;
  onCancel?:  () => void;
}

type EnrollState = 'idle' | 'loading_model' | 'ready' | 'capturing' | 'processing' | 'success' | 'error';

export default function FaceEnroll({ onSuccess, onCancel }: Props) {
  const videoRef                    = useRef<HTMLVideoElement>(null);
  const streamRef                   = useRef<MediaStream | null>(null);
  const [state,      setState]      = useState<EnrollState>('idle');
  const [message,    setMessage]    = useState('');
  const [captured,   setCaptured]   = useState(0);  // 0..5 frames captured
  const [faceBox,    setFaceBox]    = useState<any>(null);
  const [faceLoaded, setFaceLoaded] = useState(false);
  const descriptorsRef              = useRef<number[][]>([]);
  const captureIntervalRef          = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
  }

  async function startEnrollment() {
    setState('loading_model');
    setMessage('Loading face detection models...');
    descriptorsRef.current = [];
    setCaptured(0);

    try {
      const fapi = (window as any).faceapi;
      if (!fapi) throw new Error('face-api.js not loaded yet. Try again in a moment.');

      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await fapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await fapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
      await fapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setFaceLoaded(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setState('ready');
      setMessage('Look directly at the camera. Hold still while we capture.');
      // Auto-start capturing after a short delay
      setTimeout(() => captureFrames(), 1500);
    } catch (e: any) {
      setState('error');
      setMessage(e.name === 'NotAllowedError'
        ? 'Camera access denied. Allow camera access in your browser settings.'
        : e.message || 'Failed to start camera');
    }
  }

  function captureFrames() {
    setState('capturing');
    setMessage('Capturing face... hold still (0/5)');
    const fapi = (window as any).faceapi;

    captureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || descriptorsRef.current.length >= 5) return;
      const result = await fapi
        .detectSingleFace(videoRef.current, new fapi.TinyFaceDetectorOptions({ scoreThreshold: 0.6 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (result) {
        setFaceBox(result.detection.box);
        descriptorsRef.current.push(Array.from(result.descriptor));
        const count = descriptorsRef.current.length;
        setCaptured(count);
        setMessage(`Capturing face... hold still (${count}/5)`);

        if (count >= 5) {
          clearInterval(captureIntervalRef.current!);
          setFaceBox(null);
          await submitDescriptors();
        }
      } else {
        setFaceBox(null);
        setMessage('Face not visible — look at the camera with good lighting');
      }
    }, 800);
  }

  async function submitDescriptors() {
    setState('processing');
    setMessage('Enrolling face...');
    stopCamera();

    try {
      // Get a challenge nonce first
      const nonceR = await fetch('/api/auth/face/challenge', { credentials: 'include' });
      const { nonce } = await nonceR.json();

      const r = await fetch('/api/auth/face/enroll', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptors: descriptorsRef.current, nonce }),
      });
      const d = await r.json();

      if (r.ok && d.ok) {
        setState('success');
        setMessage('Face enrolled! You can now log in using your face.');
        onSuccess?.();
      } else {
        setState('error');
        setMessage(d.error || 'Enrollment failed. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  useEffect(() => () => stopCamera(), []);

  const vidW = 280, vidH = 210;
  const showVideo = state === 'ready' || state === 'capturing' || state === 'loading_model';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"
        strategy="lazyOnload"
        onLoad={() => setFaceLoaded(true)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 4 }}>
        {/* Camera viewport */}
        <div style={{
          width: vidW, height: vidH, borderRadius: 14, overflow: 'hidden',
          border: `2px solid ${state === 'success' ? 'var(--green)' : faceBox ? 'var(--accent)' : 'var(--border)'}`,
          position: 'relative', background: 'var(--bg3)',
          transition: 'border-color 0.3s',
        }}>
          <video ref={videoRef} width={vidW} height={vidH} muted playsInline
            style={{ display: showVideo ? 'block' : 'none', objectFit: 'cover', transform: 'scaleX(-1)' }} />

          {/* Face box */}
          {faceBox && showVideo && (
            <div style={{
              position: 'absolute',
              left: vidW - faceBox.x - faceBox.width,
              top: faceBox.y,
              width: faceBox.width, height: faceBox.height,
              border: '2px solid var(--green)',
              borderRadius: 8, pointerEvents: 'none',
              boxShadow: '0 0 0 2px rgba(5,150,105,0.3)',
            }} />
          )}

          {/* Progress bar overlay */}
          {state === 'capturing' && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${(captured / 5) * 100}%`, background: 'var(--green)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* States */}
          {state === 'idle' && (
            <div style={SC}><div style={{ fontSize: 36, opacity: 0.25 }}>👤</div></div>
          )}
          {state === 'loading_model' && (
            <div style={SC}><div style={{ fontSize: 22, animation: 'spin 1s linear infinite' }}>⬡</div></div>
          )}
          {state === 'processing' && (
            <div style={SC}><div style={{ fontSize: 22, animation: 'spin 1s linear infinite' }}>⬡</div><div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Processing...</div></div>
          )}
          {state === 'success' && (
            <div style={{ ...SC, background: 'rgba(5,150,105,0.15)' }}><div style={{ fontSize: 36, color: 'var(--green)' }}>✓</div><div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>Enrolled!</div></div>
          )}
          {state === 'error' && (
            <div style={SC}><div style={{ fontSize: 32 }}>⚠️</div></div>
          )}
        </div>

        {/* Frame count dots */}
        {(state === 'capturing' || state === 'success') && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < captured ? 'var(--green)' : 'var(--border)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        )}

        {/* Message */}
        <div style={{ fontSize: 13, color: state === 'error' ? 'var(--coral)' : state === 'success' ? 'var(--green)' : 'var(--t2)', textAlign: 'center', lineHeight: 1.5, maxWidth: vidW }}>
          {message || 'Click below to set up face login'}
        </div>

        {/* Actions */}
        {state === 'idle' && (
          <button onClick={startEnrollment} className="btn-primary" style={{ width: '100%' }}>
            📷 Start Face Enrollment
          </button>
        )}
        {(state === 'ready' || state === 'capturing') && (
          <button onClick={() => { stopCamera(); setState('idle'); setCaptured(0); setMessage(''); }} className="btn-ghost" style={{ width: '100%' }}>
            Cancel
          </button>
        )}
        {state === 'error' && (
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={() => { setState('idle'); setMessage(''); }} className="btn-primary" style={{ flex: 1 }}>Try Again</button>
            {onCancel && <button onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>}
          </div>
        )}
        {state === 'success' && (
          <button onClick={onCancel || (() => {})} className="btn-primary" style={{ width: '100%' }}>Done ✓</button>
        )}

        {state === 'idle' && (
          <div style={{ fontSize: 11, color: 'var(--t4)', textAlign: 'center', lineHeight: 1.5 }}>
            We capture 5 frames and store an encrypted template — not a photo. Your face never leaves your account.
          </div>
        )}
      </div>
    </>
  );
}

const SC: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: 4,
};
