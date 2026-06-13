'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ToastManager;
// apps/web/src/components/ui/ToastManager.tsx
// THE ONE toast implementation. Replaces:
//   src/components/contexts/ToastContext.jsx
//   src/components/dsai/ToastContext.jsx
//   src/lib/context/ToastContext.jsx
// All three are now dead — import toast from @/lib/store/useAppStore
const react_1 = require("react");
const useAppStore_1 = require("@/lib/store/useAppStore");
const COLORS = {
    success: { bg: 'var(--green-light)', border: 'var(--green)', icon: '✓' },
    error: { bg: 'var(--red-light)', border: 'var(--coral)', icon: '✕' },
    info: { bg: 'var(--blue-light)', border: 'var(--blue)', icon: 'ℹ' },
    warning: { bg: 'var(--amber-light)', border: 'var(--amber)', icon: '⚠' },
};
function ToastItem({ id, type, title, message }) {
    const remove = (0, useAppStore_1.useAppStore)(s => s.removeToast);
    const style = COLORS[type] || COLORS.info;
    // Auto-dismiss after 4 seconds
    (0, react_1.useEffect)(() => {
        const t = setTimeout(() => remove(id), 4000);
        return () => clearTimeout(t);
    }, [id, remove]);
    return (<div onClick={() => remove(id)} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: style.bg, border: `1px solid ${style.border}`,
            borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
            minWidth: 260, maxWidth: 360, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.2s ease',
        }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: style.border, flexShrink: 0 }}>
        {style.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{title}</div>
        {message && <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>{message}</div>}
      </div>
    </div>);
}
function ToastManager() {
    const toasts = (0, useAppStore_1.useAppStore)(s => s.toasts);
    if (!toasts.length)
        return null;
    return (<>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
      <div style={{
            position: 'fixed', bottom: 20, right: 20,
            display: 'flex', flexDirection: 'column', gap: 8,
            zIndex: 9999,
        }}>
        {toasts.map(t => <ToastItem key={t.id} {...t}/>)}
      </div>
    </>);
}
