'use client';
import { api } from '@/lib/api/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, useMarkRead } from '@/lib/api/hooks';

const TYPE_META: Record<string, { icon:string; color:string; bg:string }> = {
  success: { icon:'✓', color:'var(--green)',  bg:'var(--green-light)'  },
  warning: { icon:'⚠', color:'var(--amber)',  bg:'var(--amber-light)'  },
  danger:  { icon:'✗', color:'var(--coral)',  bg:'var(--coral-light)'  },
  info:    { icon:'◎', color:'var(--accent)', bg:'var(--accent-light)' },
};

const SOURCE_FALLBACK: Record<string,string> = {
  recruiter:'applications', opportunities:'/applications', exam:'/vault',
  mission:'/missions', resume:'/resume', learn:'/learn', trust:'/profile',
  vault:'/vault', interview:'/interview', parent:'/profile',
  consultant:'/profile', payment:'/pricing', attendance:'/attendance',
};

interface Notif { id:string; title:string; message:string; type:string; source:string; is_read:boolean; created_at:string; action_url:string|null; }

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all'|'unread'>('all');
  const { data: notifData, isLoading } = useNotifications();
  const markReadMutation = useMarkRead();
  const router = useRouter();
  const notifs = (notifData as unknown as Notif[]) || [];

  async function markAllRead() { await api.post('/api/notifications/mark-all-read', {}); }
  function getActionUrl(n: Notif) { return n.action_url || SOURCE_FALLBACK[n.source] || null; }
  function handleClick(n: Notif) {
    if (!n.is_read) markReadMutation.mutate(n.id);
    const url = getActionUrl(n);
    if (url) router.push(url);
  }
  function timeAgo(ts: string) {
    const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs;
  const unread    = notifs.filter(n => !n.is_read).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position:"relative", zIndex:1 }}>
          <h1 className="page-hero-title">🔔 Notifications</h1>
          <p className="page-hero-sub">System alerts, mission updates, recruiter activity, and platform events</p>
        </div>
      </div>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 4 }}>
            🔔 Notifications
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13, margin: 0 }}>
            {unread > 0
              ? <><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{unread} unread</span> — click any to jump to the relevant page</>
              : 'All caught up — no unread notifications'
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setFilter(f => f === 'all' ? 'unread' : 'all')}
            className="btn-ghost btn-sm"
            style={{ borderColor: filter === 'unread' ? 'var(--accent)' : undefined, color: filter === 'unread' ? 'var(--accent)' : undefined }}>
            {filter === 'all' ? '🔵 Unread Only' : '📋 Show All'}
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-ghost btn-sm">✓ Mark All Read</button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="empty-state-enhanced">
          <div className="empty-icon-lg">🎉</div>
          <div className="empty-title">{filter === 'unread' ? 'All caught up!' : 'No notifications yet'}</div>
          <div className="empty-desc">Notifications appear when missions are evaluated, exams are completed, or recruiters view your profile.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayed.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            const actionUrl = getActionUrl(n);
            const clickable = !!actionUrl || !n.is_read;
            return (
              <div key={n.id}
                onClick={() => handleClick(n)}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={e => { if (clickable && (e.key === 'Enter' || e.key === ' ')) handleClick(n); }}
                style={{
                  display: 'flex', gap: 14, padding: '14px 18px',
                  background: n.is_read ? 'var(--bg3)' : 'var(--bg2)',
                  border: `1px solid ${n.is_read ? 'var(--border)' : 'var(--border2)'}`,
                  borderRadius: 12,
                  cursor: clickable ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  opacity: n.is_read ? 0.75 : 1,
                }}
                onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLElement).style.borderColor = meta.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = n.is_read ? 'var(--border)' : 'var(--border2)'; }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: meta.bg, border: `1px solid ${meta.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: meta.color, fontWeight: 800, fontFamily: 'var(--font-mono)',
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: 'var(--t1)' }}>{n.title}</span>
                    {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />}
                    <span style={{ fontSize: 10, color: 'var(--t4)', marginLeft: 'auto', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {n.message && <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: n.source ? 6 : 0 }}>{n.message}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {n.source && <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>{n.source}</span>}
                    {actionUrl && (
                      <span style={{ fontSize: 10, color: meta.color, fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: 'auto' }}>
                        → {actionUrl}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
