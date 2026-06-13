'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProfilePage;
// apps/web/src/app/profile/page.tsx
// Added: NotificationPreferences component in the Preferences tab.
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/api/client");
const react_query_1 = require("@tanstack/react-query");
const hooks_1 = require("@/lib/api/hooks");
const useAppStore_1 = require("@/lib/store/useAppStore");
const link_1 = __importDefault(require("next/link"));
const dynamic_1 = __importDefault(require("next/dynamic"));
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const NotificationPreferences_1 = __importDefault(require("@/components/ui/NotificationPreferences"));
const FaceEnroll = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('@/components/auth/FaceEnroll'))), { ssr: false });
// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
    const [faceEnrolled, setFaceEnrolled] = (0, react_1.useState)(null);
    const [showEnroll, setShowEnroll] = (0, react_1.useState)(false);
    const { logout } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        fetch('/api/auth/face/enrolled', { credentials: 'include' })
            .then(r => r.json()).then(d => setFaceEnrolled(d.enrolled)).catch(() => setFaceEnrolled(false));
    }, []);
    async function removeEnrollment() {
        await fetch('/api/auth/face/enroll', { method: 'DELETE', credentials: 'include' });
        setFaceEnrolled(false);
        setShowEnroll(false);
    }
    async function handleLogout() { await logout(); router.push('/login'); }
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="page-hero-title">👤 My Profile</h1>
          <p className="page-hero-sub">Manage your account, preferences, security settings, and notification preferences</p>
        </div>
      </div>

      <div style={CS.card}>
        <div style={CS.cardTitle}>🔒 Password</div>
        <link_1.default href="/reset-password" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost btn-sm">Change Password →</button>
        </link_1.default>
      </div>
      <div style={CS.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={CS.cardTitle}>👤 Face Login</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
              {faceEnrolled === null && 'Checking…'}
              {faceEnrolled === false && 'Login to PinIT using just your face — no password needed.'}
              {faceEnrolled === true && 'Your face is enrolled. Login with your webcam or phone camera.'}
            </div>
          </div>
          {faceEnrolled === true && !showEnroll && (<span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'rgba(5,150,105,0.12)', padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap', border: '1px solid rgba(5,150,105,0.25)' }}>
              ✓ Active
            </span>)}
        </div>
        {!showEnroll && (<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowEnroll(true)} className="btn-ghost btn-sm">
              {faceEnrolled ? '↺ Re-enroll Face' : '+ Set up Face Login'}
            </button>
            <link_1.default href="/qr-login?tab=face" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost btn-sm">Test Face Login →</button>
            </link_1.default>
            {faceEnrolled && (<button onClick={removeEnrollment} className="btn-ghost btn-sm" style={{ color: 'var(--coral)' }}>✕ Remove</button>)}
          </div>)}
        {showEnroll && (<div style={{ marginTop: 12 }}>
            <FaceEnroll onSuccess={() => { setFaceEnrolled(true); setShowEnroll(false); }} onCancel={() => setShowEnroll(false)}/>
          </div>)}
      </div>
      <div style={CS.card}>
        <div style={CS.cardTitle}>📱 QR Login</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.5 }}>
          Scan a QR code on another device. Confirm with your phone — no typing needed.
        </div>
        <link_1.default href="/qr-login" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost btn-sm">Open QR Login →</button>
        </link_1.default>
      </div>
      <div style={{ ...CS.card, borderColor: 'rgba(239,68,68,0.2)' }}>
        <div style={{ ...CS.cardTitle, color: 'var(--coral)' }}>⚠ Danger Zone</div>
        <button onClick={handleLogout} className="btn-ghost btn-sm" style={{ color: 'var(--coral)', borderColor: 'rgba(239,68,68,0.2)' }}>
          ⏻ Sign Out of All Devices
        </button>
      </div>
    </div>);
}
const CS = {
    card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20 },
    cardTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' },
};
const TEACHERS = [
    { id: 'priya', name: 'Ms. Priya', emoji: '👩‍💼', style: 'Friendly & encouraging' },
    { id: 'aisha', name: 'Ms. Aisha', emoji: '👩‍🏫', style: 'Structured & methodical' },
    { id: 'rohan', name: 'Mr. Rohan', emoji: '👨‍💻', style: 'Energetic & tech-focused' },
    { id: 'vikram', name: 'Mr. Vikram', emoji: '👨‍⚖️', style: 'Strict & results-driven' },
];
const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', desc: 'Visible to all approved recruiters' },
    { value: 'recruiters_only', label: 'Recruiters Only', desc: 'Only approved recruiters can see you' },
    { value: 'institution_only', label: 'Institution Only', desc: 'Only your linked institution can see you' },
    { value: 'private', label: 'Private', desc: 'Hidden from all external searches' },
];
// ── Main page ─────────────────────────────────────────────────────────────────
function ProfilePage() {
    const { user, logout } = (0, AuthContext_1.useAuth)();
    const cOS = (0, CareerOSContext_1.useCareerOS)();
    const router = (0, navigation_1.useRouter)();
    const qc = (0, react_query_1.useQueryClient)();
    const [teacherId, setTeacherId] = (0, react_1.useState)(user?.selectedTeacherId || 'priya');
    const [visibility, setVisibility] = (0, react_1.useState)('recruiters_only');
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [tab, setTab] = (0, react_1.useState)('profile');
    if (!user)
        return null;
    const initials = (user.displayName || 'U')[0].toUpperCase();
    async function saveTeacher() {
        setSaving(true);
        try {
            await client_1.api.patch('/api/auth/teacher', { teacherId });
            await client_1.api.patch('/api/auth/profile', { selectedTeacherId: teacherId });
            qc.invalidateQueries({ queryKey: hooks_1.KEYS.me });
            useAppStore_1.toast.success('Saved!', 'Your AI teacher has been updated.');
        }
        catch { }
        finally {
            setSaving(false);
        }
    }
    async function saveVisibility() {
        setSaving(true);
        try {
            await client_1.api.patch('/api/recruiter/visibility', { visibility });
            useAppStore_1.toast.success('Saved!', 'Visibility updated.');
        }
        catch { }
        finally {
            setSaving(false);
        }
    }
    return (<div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Profile card */}
      <div style={{ background: 'linear-gradient(135deg,var(--bg2),var(--bg3))', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-display)' }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--t1)', marginBottom: 3 }}>{user.displayName}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{user.username}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 100, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
              {user.role}
            </span>
            <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 100, background: 'var(--bg3)', color: 'var(--t3)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
              {user.subscription_tier || 'free'} plan
            </span>
          </div>
        </div>
        <link_1.default href="/pricing" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button className="btn-ghost btn-sm">⭐ Upgrade</button>
        </link_1.default>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 20, width: 'fit-content' }}>
        {['profile', 'preferences', 'security'].map(t => (<button key={t} onClick={() => setTab(t)} style={{
                padding: '7px 18px', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)',
                background: tab === t ? 'var(--bg2)' : 'transparent',
                color: tab === t ? 'var(--t1)' : 'var(--t3)',
                boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
            }}>{t}</button>))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Visibility */}
          <div style={CS.card}>
            <div style={CS.cardTitle}>🔍 Recruiter Visibility</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {VISIBILITY_OPTIONS.map(opt => (<button key={opt.value} onClick={() => setVisibility(opt.value)} style={{
                    padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                    border: `1.5px solid ${visibility === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: visibility === opt.value ? 'var(--accent-light)' : 'var(--bg2)',
                    cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: visibility === opt.value ? 700 : 500, color: visibility === opt.value ? 'var(--accent)' : 'var(--t1)', marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{opt.desc}</div>
                </button>))}
            </div>
            <button onClick={saveVisibility} disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : 'Save Visibility'}
            </button>
          </div>
        </div>)}

      {/* Preferences tab */}
      {tab === 'preferences' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* AI Teacher selector */}
          <div style={CS.card}>
            <div style={CS.cardTitle}>🤖 AI Teacher / Mentor</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {TEACHERS.map(t => (<button key={t.id} onClick={() => setTeacherId(t.id)} style={{ padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                    border: `1.5px solid ${teacherId === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: teacherId === t.id ? 'var(--accent-light)' : 'var(--bg2)',
                    cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{t.emoji}</div>
                  <div style={{ fontSize: 12.5, fontWeight: teacherId === t.id ? 700 : 500, color: teacherId === t.id ? 'var(--accent)' : 'var(--t1)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t.style}</div>
                </button>))}
            </div>
            <button onClick={saveTeacher} disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : 'Save Teacher'}
            </button>
          </div>

          {/* Career Builder Tab Visibility Toggle */}
          <div style={CS.card}>
            <div style={CS.cardTitle}>🛠 Career Builder Visibility</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.5 }}>
              By default, once you complete all quest roadmap milestones, the Career Builder tab is automatically hidden from the sidebar to keep your workspace clean. You can toggle it back to visible here anytime.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Show Career Builder Tab</span>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                  {cOS.forceShowCareerBuilder ? 'Always visible in sidebar' : 'Automatically hidden when quests are completed'}
                </div>
              </div>
              <button onClick={() => {
                cOS.setForceShowCareerBuilder(!cOS.forceShowCareerBuilder);
                useAppStore_1.toast.success(cOS.forceShowCareerBuilder ? 'Tab Hidden' : 'Tab Visible', `Career Builder tab has been set to ${cOS.forceShowCareerBuilder ? 'hidden' : 'visible'}.`);
            }} style={{
                background: cOS.forceShowCareerBuilder ? 'var(--accent)' : 'var(--bg2)',
                color: cOS.forceShowCareerBuilder ? 'white' : 'var(--t2)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: cOS.forceShowCareerBuilder ? '0 4px 12px rgba(79,70,229,0.2)' : 'none',
                transition: 'all 0.15s ease'
            }}>
                {cOS.forceShowCareerBuilder ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Notification Preferences — wired in */}
          <NotificationPreferences_1.default />
        </div>)}

      {/* Security tab */}
      {tab === 'security' && <SecurityTab />}
    </div>);
}
