'use client';
// PinsGate — wraps any feature button/action that requires pins.
// Shows cost badge and blocks action if insufficient balance.
// Usage:
//   <PinsGate featureKey="ai_interview" onUnlocked={startInterview}>
//     <button className="btn-primary">Start AI Interview</button>
//   </PinsGate>

import { useState } from 'react';
import Link from 'next/link';
import { useCareerOS, PIN_COSTS } from '@/lib/context/CareerOSContext';

interface Props {
  featureKey: string;
  onUnlocked: () => void;
  children: React.ReactNode;
  /** Wrap children or render a full gated button */
  mode?: 'wrap' | 'button';
  buttonLabel?: string;
  buttonClass?: string;
  disabled?: boolean;
}

export default function PinsGate({ featureKey, onUnlocked, children, mode = 'wrap', buttonLabel, buttonClass, disabled }: Props) {
  const { pins, spendPins, canAfford } = useCareerOS();
  const [showConfirm, setShowConfirm] = useState(false);
  const meta = PIN_COSTS[featureKey];

  if (!meta) {
    // No cost — pass through
    return <>{children}</>;
  }

  const affordable = canAfford(featureKey);

  function handleClick() {
    if (disabled) return;
    if (!affordable) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    const ok = spendPins(featureKey);
    if (ok) onUnlocked();
  }

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        {/* Cost tag above the action */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: affordable ? 'var(--accent)' : 'var(--coral)',
          background: affordable ? 'var(--accent-light)' : 'var(--coral-light)',
          border: `1px solid ${affordable ? 'rgba(79,70,229,0.2)' : 'rgba(220,38,38,0.2)'}`,
          padding: '2px 8px', borderRadius: 10,
        }}>
          <span>⚡</span>
          <span>{meta.cost} pins</span>
          {!affordable && <span style={{ fontSize: 9 }}>· Need {meta.cost - pins} more</span>}
        </div>

        {/* The actual action element, click-intercepted */}
        <div onClick={handleClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, width: '100%' }}>
          {children}
        </div>
      </div>

      {/* Confirm / Insufficient modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '28px 32px', maxWidth: 400, width: '100%',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{meta.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
                {affordable ? `Use ${meta.cost} Pins?` : 'Insufficient Pins'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
                {affordable
                  ? `This will use ${meta.cost} of your ${pins} pins to unlock ${meta.label}.`
                  : `You need ${meta.cost} pins for ${meta.label}. You have ${pins} pins. Earn more by completing missions and sessions, or buy a pin pack.`
                }
              </p>
            </div>

            {/* Pin balance indicator */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10,
              border: '1px solid var(--border)', marginBottom: 18,
            }}>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>Your balance</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: affordable ? 'var(--accent)' : 'var(--coral)' }}>
                ⚡ {pins} pins
              </span>
            </div>

            {affordable ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleConfirm} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  ⚡ Confirm ({meta.cost} cr)
                </button>
                <button onClick={() => setShowConfirm(false)} className="btn-ghost" style={{ flexShrink: 0 }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>
                  Ways to earn pins:
                </div>
                {[
                  { icon: '⚡', text: 'Complete daily missions (+10 cr each)' },
                  { icon: '📝', text: 'Pass an exam (+25 cr)' },
                  { icon: '🎙', text: 'Complete a study session (+5 cr)' },
                  { icon: '💳', text: 'Buy a pin pack on the Pricing page' },
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--t2)' }}>
                    <span>{tip.icon}</span><span>{tip.text}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <Link href="/pricing" style={{ textDecoration: 'none', flex: 1 }}>
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>💳 Buy Pins</button>
                  </Link>
                  <Link href="/missions" style={{ textDecoration: 'none', flex: 1 }}>
                    <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>⚡ Earn Free</button>
                  </Link>
                </div>
                <button onClick={() => setShowConfirm(false)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
