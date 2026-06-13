'use client';
// PinsHistory — shows recent pin transactions
import { useCareerOS, PinTransaction } from '@/lib/context/CareerOSContext';

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

interface Props { limit?: number; }

export default function PinsHistory({ limit = 10 }: Props) {
  const { pinHistory } = useCareerOS();
  const shown = pinHistory.slice(0, limit);

  if (!shown.length) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--t3)', fontSize: 13 }}>
        No pin transactions yet. Complete missions to start earning!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {shown.map(tx => (
        <div key={tx.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: tx.type === 'earn' ? 'var(--green-light)' : 'var(--coral-light)',
            border: `1px solid ${tx.type === 'earn' ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            {tx.type === 'earn' ? '⬆' : '⬇'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tx.reason}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
              {timeAgo(tx.timestamp)}
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13,
            color: tx.type === 'earn' ? 'var(--green)' : 'var(--coral)',
            flexShrink: 0,
          }}>
            {tx.type === 'earn' ? '+' : '-'}{tx.amount} ⚡
          </div>
        </div>
      ))}
    </div>
  );
}
