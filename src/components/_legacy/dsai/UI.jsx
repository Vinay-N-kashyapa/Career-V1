import React from 'react';
import ReactDOM from 'react-dom';

/* ── Button ── */
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style }) {
  const variantStyles = {
    primary:   { background: 'var(--accent)',   color: 'white' },
    success:   { background: 'var(--success)',  color: 'white' },
    danger:    { background: 'var(--danger)',    color: 'white' },
    warning:   { background: 'var(--warning)',  color: 'white' },
    secondary: { background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    gold:      { background: 'var(--gold)', color: '#000', fontWeight: 700 },
  };
  const sizeStyles = {
    sm: { padding: '6px 14px',  fontSize: 12 },
    md: { padding: '9px 18px',  fontSize: 13 },
    lg: { padding: '12px 24px', fontSize: 15 },
    xl: { padding: '15px 32px', fontSize: 16 },
  };
  // FIX: no useState for hover — use CSS onMouseEnter/Leave directly (no re-render)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontWeight: 600, borderRadius: 8, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s', fontFamily: 'var(--font-main)',
        transform: 'translateY(0)',
        ...variantStyles[variant], ...sizeStyles[size], ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── Input ── */
export function Input({ label, id, error, className = '', ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </label>
      )}
      <input id={id} {...props} style={{ width: '100%', ...props.style }} />
      {error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--danger-light)' }}>{error}</p>}
    </div>
  );
}

/* ── Select ── */
export function Select({ label, id, children, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </label>
      )}
      <select id={id} {...props} style={{ width: '100%', ...props.style }}>
        {children}
      </select>
      {error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--danger-light)' }}>{error}</p>}
    </div>
  );
}

/* ── Textarea ── */
export function Textarea({ label, id, rows = 4, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </label>
      )}
      <textarea id={id} rows={rows} {...props} style={{ width: '100%', resize: 'vertical', ...props.style }} />
      {error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--danger-light)' }}>{error}</p>}
    </div>
  );
}

/* ── Card ── */
export function Card({ children, style, className = '', onClick, hoverable }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        cursor: onClick || hoverable ? 'pointer' : 'default',
        transition: 'var(--transition)',
        boxShadow: '0 1px 8px rgba(37,99,235,0.07)',
        ...style
      }}
      className={className}
      onMouseEnter={hoverable ? e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; } : undefined}
      onMouseLeave={hoverable ? e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Modal — uses Portal to render at body root, escaping all parent contexts ── */
export function Modal({ open, onClose, title, children, wide }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !mounted) return null;

  const overlay = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: wide ? '840px' : '540px',
          maxHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {/* Header — always visible, never scrolls */}
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
            background: '#ffffff',
            borderRadius: '16px 16px 0 0',
          }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: '#94a3b8', flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
            >✕</button>
          </div>
        )}

        {/* Body — scrollable, fills remaining height */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: title ? '20px 22px 24px' : '22px',
        }}>
          {children}
        </div>
      </div>
    </div>
  );

  // Portal: render at document.body, completely outside admin layout tree
  return ReactDOM.createPortal(overlay, document.body);
}

/* ── Spinner ── */
export function Spinner({ size = 24, color = 'var(--accent)' }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid transparent`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
  );
}

/* ── Loading Page ── */
export function LoadingPage({ text = 'Loading...' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Spinner size={40} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{text}</p>
    </div>
  );
}

/* ── Stat Card ── */
export function StatCard({ value, label, icon, color = 'var(--accent)' }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }}>
      {icon && <div style={{ fontSize: 28, width: 48, height: 48, background: `${color}20`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>}
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Section Header ── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Tab Bar ── */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto', flexShrink: 0 }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${active === tab.id ? 'var(--accent)' : 'transparent'}`,
            color: active === tab.id ? 'var(--accent-light)' : 'var(--text-muted)',
            fontWeight: active === tab.id ? 700 : 500,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── Badge ── */
export function Badge({ children, type = 'info' }) {
  return <span className={`badge ${type}`}>{children}</span>;
}

/* ── Empty State ── */
export function EmptyState({ icon, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon || '📭'}</div>
      <div className="empty-text">{text}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ── Confirm Modal ── */
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Btn>
      </div>
    </Modal>
  );
}