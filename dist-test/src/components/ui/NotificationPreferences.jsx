// ── NotificationPreferences.tsx ───────────────────────────────────────────────
// Drop this component into apps/web/src/app/profile/page.tsx.
//
// USAGE: Add <NotificationPreferences /> as a new tab or section inside the
//        existing profile page, alongside SecurityTab, PersonalInfoTab, etc.
//
// The component saves to PATCH /api/auth/profile → { notification_prefs: {...} }
// which the auth route already handles (updates the users table JSON column).
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotificationPreferences;
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
const DEFAULTS = {
    opportunities: true,
    mission_reminders: true,
    score_changes: true,
    recruiter_contact: true,
    weekly_digest: true,
    exam_reminders: true,
};
const PREFS_META = [
    { key: 'opportunities', label: 'New Opportunities', desc: 'When a job or internship matching your profile is posted', icon: '💼' },
    { key: 'mission_reminders', label: 'Mission Reminders', desc: 'Daily reminder to complete your missions and maintain your streak', icon: '🔥' },
    { key: 'score_changes', label: 'Score Updates', desc: 'When your ATS, Trust, or Career DNA score changes significantly', icon: '📊' },
    { key: 'recruiter_contact', label: 'Recruiter Contact', desc: 'When a recruiter shortlists or sends you a contact request', icon: '👔' },
    { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Sunday summary of your week — streak, score movement, top missions', icon: '📬' },
    { key: 'exam_reminders', label: 'Exam Reminders', desc: 'Reminders 24h and 1h before a scheduled exam', icon: '📝' },
];
function NotificationPreferences() {
    const [prefs, setPrefs] = (0, react_1.useState)(DEFAULTS);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [saved, setSaved] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        (async () => {
            try {
                const d = await client_1.api.get('/api/auth/me');
                if (d.user?.notification_prefs) {
                    setPrefs({ ...DEFAULTS, ...d.user.notification_prefs });
                }
            }
            catch { }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    async function save() {
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            await client_1.api.patch('/api/auth/profile', { notification_prefs: prefs });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        }
        finally {
            setSaving(false);
        }
    }
    function toggle(key) {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    }
    const enabledCount = Object.values(prefs).filter(Boolean).length;
    return (<div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '20px 22px',
        }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
            🔔 Notification Preferences
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            {enabledCount} of {PREFS_META.length} notification types enabled
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Saved</span>}
          {error && <span style={{ fontSize: 12, color: 'var(--coral)' }}>⚠ {error}</span>}
          <button onClick={save} disabled={saving} className="btn-primary" style={{ fontSize: 13 }}>
            {saving ? '⟳ Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {loading ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(6)].map((_, i) => (<div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius)' }}/>))}
        </div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PREFS_META.map(p => (<div key={p.key} onClick={() => toggle(p.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                    borderRadius: 'var(--radius)', cursor: 'pointer',
                    background: prefs[p.key] ? 'var(--accent-light)' : 'transparent',
                    border: `1px solid ${prefs[p.key] ? 'var(--accent)' : 'transparent'}`,
                    transition: 'all 0.12s',
                }}>
              {/* Icon */}
              <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, color: prefs[p.key] ? 'var(--t1)' : 'var(--t2)' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.45 }}>{p.desc}</div>
              </div>

              {/* Toggle */}
              <div style={{
                    width: 44, height: 24, borderRadius: 12, flexShrink: 0, position: 'relative',
                    background: prefs[p.key] ? 'var(--accent)' : 'var(--bg3)',
                    border: `2px solid ${prefs[p.key] ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all 0.2s',
                }}>
                <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: prefs[p.key] ? 22 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}/>
              </div>
            </div>))}
        </div>)}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <button onClick={() => setPrefs(Object.fromEntries(PREFS_META.map(p => [p.key, true])))} className="btn-ghost btn-sm">
          Enable all
        </button>
        <button onClick={() => setPrefs(Object.fromEntries(PREFS_META.map(p => [p.key, false])))} className="btn-ghost btn-sm">
          Disable all
        </button>
      </div>
    </div>);
}
