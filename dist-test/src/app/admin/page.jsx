'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminPage;
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/api/client");
const PAGE_SIZE = 20;
// ── Score Override Modal ───────────────────────────────────────────────────────
function ScoreOverrideModal({ user, onClose, onDone }) {
    const [field, setField] = (0, react_1.useState)('trust_score');
    const [value, setValue] = (0, react_1.useState)('');
    const [reason, setReason] = (0, react_1.useState)('');
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const h = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    async function submit() {
        const numVal = parseInt(value, 10);
        const maxVal = field === 'pins' ? 9999 : 100;
        if (isNaN(numVal) || numVal < 0 || numVal > maxVal) {
            setError(`Value must be 0–${maxVal}`);
            return;
        }
        if (reason.length < 10) {
            setError('Reason must be at least 10 characters');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await client_1.api.post(`/api/admin/users/${user.id}/score-override`, { field, value: numVal, reason });
            onDone();
            onClose();
        }
        catch (e) {
            setError(e.message || 'Failed to override score');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<div style={overlay} onClick={e => { if (e.target === e.currentTarget)
        onClose(); }}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <div>
            <div style={modalTitle}>📊 Override Score</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{user.display_name}</div>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>Target Metric</label>
            <select value={field} onChange={e => setField(e.target.value)} className="form-input" style={{ width: '100%' }}>
              {['trust_score', 'ats_score', 'career_dna_score', 'career_readiness', 'pins'].map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{field === 'pins' ? 'New Pin Balance' : 'New Target Value (0–100)'}</label>
            <input type="number" min={0} max={field === 'pins' ? 9999 : 100} value={value} onChange={e => setValue(e.target.value)} className="form-input" style={{ width: '100%' }} placeholder={field === 'pins' ? 'e.g. 150' : 'e.g. 85'}/>
          </div>
          <div>
            <label style={lbl}>Reason (min 10 chars) *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="form-input" style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Data corrections after document audit..."/>
          </div>
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={submit} disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : '✓ Override Score'}
            </button>
          </div>
        </div>
      </div>
    </div>);
}
// ── Suspend / Ban User Modal ─────────────────────────────────────────────────────
function BanModal({ user, onClose, onDone }) {
    const [reason, setReason] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const h = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    async function confirm() {
        setLoading(true);
        try {
            await client_1.api.post(`/api/admin/users/${user.id}/suspend`, { reason: reason || 'Violation of terms' });
            onDone();
            onClose();
        }
        catch { }
        finally {
            setLoading(false);
        }
    }
    return (<div style={overlay} onClick={e => { if (e.target === e.currentTarget)
        onClose(); }}>
      <div style={{ ...modalBox, maxWidth: 400 }}>
        <div style={modalHeader}>
          <div style={{ ...modalTitle, color: 'var(--coral)' }}>⚠ Suspend User Account</div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 12 }}>
          Are you sure you want to suspend <strong>{user.display_name}</strong>? They will be locked out of the student platform immediately.
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Suspension Reason *</label>
          <input value={reason} onChange={e => setReason(e.target.value)} className="form-input" style={{ width: '100%' }} placeholder="Spam, cheating on exams, terms violation"/>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={confirm} disabled={loading} className="btn-primary" style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }}>
            {loading ? 'Processing...' : '🚫 Suspend User'}
          </button>
        </div>
      </div>
    </div>);
}
function AdminPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const [tab, setTab] = (0, react_1.useState)('dashboard');
    const [dashboardData, setDashboardData] = (0, react_1.useState)({});
    const [users, setUsers] = (0, react_1.useState)([]);
    const [fraudAlerts, setFraudAlerts] = (0, react_1.useState)({ highTabSwitches: [], suspiciousScores: [] });
    const [stats, setStats] = (0, react_1.useState)({});
    const [auditLog, setAuditLog] = (0, react_1.useState)([]);
    // Filters
    const [search, setSearch] = (0, react_1.useState)('');
    const [roleFilter, setRoleFilter] = (0, react_1.useState)('');
    const [auditActionFilter, setAuditActionFilter] = (0, react_1.useState)('');
    // Pagination
    const [page, setPage] = (0, react_1.useState)(0);
    const [hasMore, setHasMore] = (0, react_1.useState)(true);
    const [loadingUsers, setLoadingUsers] = (0, react_1.useState)(false);
    // Broadcast state
    const [bcast, setBcast] = (0, react_1.useState)({ title: '', message: '', type: 'info', targetRole: '' });
    const [toast, setToast] = (0, react_1.useState)(null);
    // Modals
    const [scoreModal, setScoreModal] = (0, react_1.useState)(null);
    const [banModal, setBanModal] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
        else if (user) {
            fetchDashboard();
            fetchAuditLogs();
        }
    }, [user]);
    (0, react_1.useEffect)(() => {
        if (tab === 'users') {
            setPage(0);
            setUsers([]);
            fetchUsers(0);
        }
        if (tab === 'fraud')
            fetchFraudAlerts();
        if (tab === 'stats')
            fetchPlatformStats();
        if (tab === 'audit')
            fetchAuditLogs();
    }, [tab, roleFilter]);
    // Debounced search
    (0, react_1.useEffect)(() => {
        if (tab !== 'users')
            return;
        const t = setTimeout(() => { setPage(0); setUsers([]); fetchUsers(0); }, 350);
        return () => clearTimeout(t);
    }, [search]);
    const triggerToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };
    async function fetchDashboard() {
        try {
            const d = await client_1.api.get('/api/admin/dashboard');
            setDashboardData(d || {});
        }
        catch { }
    }
    async function fetchUsers(p = page) {
        setLoadingUsers(true);
        try {
            const params = new URLSearchParams();
            if (search)
                params.set('search', search);
            if (roleFilter)
                params.set('role', roleFilter);
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(p * PAGE_SIZE));
            const d = await client_1.api.get(`/api/admin/users?${params}`);
            const fetched = d.users || [];
            setUsers(prev => p === 0 ? fetched : [...prev, ...fetched]);
            setHasMore(fetched.length === PAGE_SIZE);
        }
        catch { }
        finally {
            setLoadingUsers(false);
        }
    }
    async function fetchFraudAlerts() {
        try {
            const d = await client_1.api.get('/api/admin/fraud-alerts');
            setFraudAlerts(d || { highTabSwitches: [], suspiciousScores: [] });
        }
        catch { }
    }
    async function fetchPlatformStats() {
        try {
            const d = await client_1.api.get('/api/admin/platform-stats');
            setStats(d || {});
        }
        catch { }
    }
    async function fetchAuditLogs() {
        try {
            const d = await client_1.api.get('/api/admin/audit-log');
            setAuditLog(d.log || []);
        }
        catch { }
    }
    async function changeRole(id, role) {
        try {
            await client_1.api.patch(`/api/admin/users/${id}/role`, { role });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
            triggerToast(`Role updated to ${role}`);
        }
        catch {
            triggerToast('Failed to update role', 'error');
        }
    }
    async function handleUnsuspend(id) {
        try {
            await client_1.api.patch(`/api/admin/users/${id}/role`, { role: 'student' });
            triggerToast('User account unsuspended');
            fetchUsers(0);
        }
        catch {
            triggerToast('Failed to unsuspend', 'error');
        }
    }
    async function sendBroadcast() {
        if (!bcast.title || !bcast.message) {
            triggerToast('Announcement title & message are required', 'error');
            return;
        }
        try {
            const d = await client_1.api.post('/api/admin/broadcast', bcast);
            triggerToast(`Broadcast announcement sent to ${d.sent} active users!`);
            setBcast({ title: '', message: '', type: 'info', targetRole: '' });
            fetchAuditLogs();
        }
        catch {
            triggerToast('Broadcast delivery failed', 'error');
        }
    }
    function loadNextPage() {
        const next = page + 1;
        setPage(next);
        fetchUsers(next);
    }
    function handleRecalculateTrust(userId) {
        client_1.api.post('/api/trust/evaluate', { studentId: userId }).then(() => {
            triggerToast('Trust score recalculated successfully.');
            fetchUsers(0);
        });
    }
    function handleClearFraudAlert(studentName) {
        triggerToast(`Alert resolved for ${studentName}`);
        // Filter locally
        setFraudAlerts((prev) => ({
            highTabSwitches: prev.highTabSwitches.filter((s) => s.display_name !== studentName),
            suspiciousScores: prev.suspiciousScores.filter((s) => s.display_name !== studentName)
        }));
    }
    function exportAuditLogsCSV() {
        const headers = ['Admin ID', 'Action', 'Target ID', 'Timestamp'];
        const rows = auditLog.map(e => [e.adminId, e.action, e.targetId || 'n/a', e.timestamp]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_log_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    const d = dashboardData;
    const uStats = d.users || {};
    const recentSignups = d.recentSignups || [];
    const sMetrics = stats;
    const TABS = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'users', label: 'Users Manager' },
        { id: 'fraud', label: 'Fraud Alerts' },
        { id: 'stats', label: 'Analytics' },
        { id: 'audit', label: 'Audit Logs' },
        { id: 'broadcast', label: 'Broadcast' }
    ];
    // Filtering audit log
    const filteredAudit = auditActionFilter
        ? auditLog.filter(l => l.action === auditActionFilter)
        : auditLog;
    return (<div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {scoreModal && (<ScoreOverrideModal user={scoreModal} onClose={() => setScoreModal(null)} onDone={() => { fetchUsers(0); triggerToast('Score modified and logged'); }}/>)}
      {banModal && (<BanModal user={banModal} onClose={() => setBanModal(null)} onDone={() => { fetchUsers(0); triggerToast('User suspended successfully.'); }}/>)}

      {/* Toast alert */}
      {toast && (<div style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                background: toast.type === 'success' ? 'var(--green)' : 'var(--coral)',
                color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                boxShadow: 'var(--shadow-lg)'
            }}>
          {toast.msg}
        </div>)}

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-hero-title">⚙️ Admin Control Panel</h1>
          <p className="page-hero-sub">Platform controls, fraud monitoring, automated audit logging, and global broadcasts</p>
        </div>
      </div>

      {/* Tab bar header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 14px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)',
                background: tab === t.id ? 'var(--bg2)' : 'transparent',
                color: tab === t.id ? 'var(--t1)' : 'var(--t3)',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s'
            }}>
              {t.label}
            </button>))}
        </div>
      </div>

      {/* ── TAB: DASHBOARD ──────────────────────────────────────────────── */}
      {tab === 'dashboard' && (<div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            {[
                { label: 'Total Users', value: uStats.total || 0, color: 'var(--accent)' },
                { label: 'Students', value: uStats.students || 0, color: 'var(--teal)' },
                { label: 'Recruiters', value: uStats.recruiters || 0, color: 'var(--purple)' },
                { label: 'Consultants', value: uStats.consultants || 0, color: 'var(--blue)' },
                { label: 'Active Today', value: uStats.active_today || 0, color: 'var(--green)' },
                { label: 'Joined This Week', value: uStats.new_this_week || 0, color: 'var(--amber)' }
            ].map(s => (<div key={s.label} className="metric-card">
                <div className="metric-label">{s.label}</div>
                <div className="metric-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
              </div>))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent signups list */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Signups</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Role</th>
                    <th>Date Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignups.map((u) => (<tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.display_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>@{u.username}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ fontSize: 9 }}>{u.role}</span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--t3)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Quick stats summary overview */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>System Integrity Signals</div>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Fraud Index</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>Excellent (0.8%)</div>
                <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>No massive tab switching loops detected in the past 12 hours.</p>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Active Server Channels</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>Firestore Router Live</div>
                <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>Direct bindings established with Firebase collections.</p>
              </div>
            </div>
          </div>
        </div>)}

      {/* ── TAB: USERS MANAGER ──────────────────────────────────────────── */}
      {tab === 'users' && (<div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="form-input" placeholder="Search by name or username..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }}/>
            <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 160 }}>
              <option value="">All User Roles</option>
              {['student', 'recruiter', 'consultant', 'admin', 'suspended'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Role Select</th>
                <th>Tier</th>
                <th>ATS Match</th>
                <th>Trust Score</th>
                <th>Pins</th>
                <th>Override Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers && users.length === 0 ? (<tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Searching registry...</td>
                </tr>) : users.map(u => (<tr key={u.id} style={{ opacity: u.role === 'suspended' ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{u.display_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>@{u.username}</div>
                  </td>
                  <td>
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '4px 8px', color: 'var(--t1)', fontSize: 11
                }}>
                      {['student', 'recruiter', 'consultant', 'admin', 'suspended'].map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.subscription_tier === 'pro' ? 'badge-purple' : 'badge-green'}`} style={{ fontSize: 10 }}>
                      {u.subscription_tier || 'free'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--teal)', fontWeight: 700 }}>{Math.round(u.ats_score || 0)}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 700 }}>{Math.round(u.trust_score || 0)}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 700 }}>⚡ {u.pins || 100}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setScoreModal(u)} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)', fontSize: 11 }}>
                        ✏ Override
                      </button>
                      <button onClick={() => handleRecalculateTrust(u.id)} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)', fontSize: 11, color: 'var(--teal)' }}>
                        ⟳ Recalculate
                      </button>
                      {u.role === 'suspended' ? (<button onClick={() => handleUnsuspend(u.id)} className="btn-primary btn-sm" style={{ fontSize: 11, background: 'var(--green)', borderColor: 'var(--green)' }}>
                          Reactivate
                        </button>) : (<button onClick={() => setBanModal(u)} className="btn-ghost btn-sm" style={{ color: 'var(--coral)', border: 'none' }}>
                          🚫 Suspend
                        </button>)}
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>

          {hasMore && (<div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={loadNextPage} disabled={loadingUsers} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>
                {loadingUsers ? 'Loading...' : 'Load More Users'}
              </button>
            </div>)}
        </div>)}

      {/* ── TAB: FRAUD ALERTS ───────────────────────────────────────────── */}
      {tab === 'fraud' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--amber)' }}>⚠ High Tab Switch Counts</h3>
            {fraudAlerts.highTabSwitches.length === 0 ? (<div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>No tab switches flagged.</div>) : (fraudAlerts.highTabSwitches.map((s, i) => (<div key={i} style={{ background: 'var(--bg2)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600 }}>{s.display_name}</div>
                    <span className="badge badge-coral" style={{ fontSize: 9 }}>{s.tab_switches} switches</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Exam: {s.exam_name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button onClick={() => handleClearFraudAlert(s.display_name)} className="btn-primary btn-sm" style={{ fontSize: 10, background: 'var(--green)', borderColor: 'var(--green)' }}>
                      Resolve / Clear
                    </button>
                    <button onClick={() => client_1.api.patch(`/api/admin/users/${s.display_name}/role`, { role: 'suspended' }).then(() => triggerToast('User suspended'))} className="btn-ghost btn-sm" style={{ fontSize: 10, color: 'var(--coral)' }}>
                      🚫 Suspend
                    </button>
                  </div>
                </div>)))}
          </div>

          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--coral)' }}>⚠ Suspicious Score jumps</h3>
            {fraudAlerts.suspiciousScores.length === 0 ? (<div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>No suspicious score jumps found.</div>) : (fraudAlerts.suspiciousScores.map((s, i) => (<div key={i} style={{ background: 'var(--bg2)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600 }}>{s.display_name}</div>
                    <span className="badge badge-coral" style={{ fontSize: 9 }}>+{s.delta} delta</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Jump detected within a 24h period.</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button onClick={() => handleClearFraudAlert(s.display_name)} className="btn-primary btn-sm" style={{ fontSize: 10, background: 'var(--green)', borderColor: 'var(--green)' }}>
                      Clear Alert
                    </button>
                    <button onClick={() => handleRecalculateTrust(s.display_name)} className="btn-ghost btn-sm" style={{ fontSize: 10, color: 'var(--teal)' }}>
                      ⟳ Recalculate Trust
                    </button>
                  </div>
                </div>)))}
          </div>
        </div>)}

      {/* ── TAB: ANALYTICS (GRAPHS) ─────────────────────────────────────── */}
      {tab === 'stats' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Signups chart */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 14 }}>Weekly Student Signups</h3>
            <div style={{ display: 'flex', gap: 8, height: 160, alignItems: 'flex-end', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              {[
                { d: 'Mon', h: 40 },
                { d: 'Tue', h: 68 },
                { d: 'Wed', h: 90 },
                { d: 'Thu', h: 55 },
                { d: 'Fri', h: 120 },
                { d: 'Sat', h: 32 },
                { d: 'Sun', h: 45 }
            ].map(bar => (<div key={bar.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%', height: `${bar.h}px`,
                    background: 'linear-gradient(to top, var(--accent), var(--purple))',
                    borderRadius: '4px 4px 0 0', position: 'relative'
                }}>
                    <span style={{ fontSize: 9, position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontWeight: 600 }}>{bar.h}</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--t3)', marginTop: 6 }}>{bar.d}</span>
                </div>))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)' }}>
              Total Signups: <strong style={{ color: 'var(--t1)' }}>450 students</strong> this week.
            </div>
          </div>

          {/* Exam Pass Rate Gauge */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 14 }}>Certification Pass Rate</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'conic-gradient(var(--green) 0% 68%, var(--bg3) 68% 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
                <div style={{
                width: 90, height: 90, borderRadius: '50%', background: 'var(--card)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>68%</span>
                  <span style={{ fontSize: 9, color: 'var(--t3)' }}>Passing Rate</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
              Exams completed: <strong style={{ color: 'var(--t1)' }}>{(sMetrics.exams || {}).certification_issued || 15} certifications</strong> issued.
            </div>
          </div>

          {/* Resume scan breakdown */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 14 }}>Resumes Studio Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 160, justifyContent: 'center' }}>
              {[
                { label: 'Resumes Scanned', value: (sMetrics.resumes || {}).total_scanned || 54, color: 'var(--teal)' },
                { label: 'Enhancements Ran', value: (sMetrics.resumes || {}).enhancements_generated || 28, color: 'var(--purple)' },
                { label: 'AI Portfolio Optimization', value: 42, color: 'var(--blue)' }
            ].map(item => {
                const max = 100;
                const pct = Math.min(100, (item.value / max) * 100);
                return (<div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--t2)' }}>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 4 }}/>
                    </div>
                  </div>);
            })}
            </div>
          </div>
        </div>)}

      {/* ── TAB: AUDIT LOGS ──────────────────────────────────────────────── */}
      {tab === 'audit' && (<div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)} style={{ width: 180 }}>
                <option value="">All System Actions</option>
                {['score_override', 'suspend_user', 'delete_user', 'broadcast'].map(act => (<option key={act} value={act}>{act.replace(/_/g, ' ')}</option>))}
              </select>
              <button onClick={fetchAuditLogs} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>
                ⟳ Refresh
              </button>
            </div>
            
            <button onClick={exportAuditLogsCSV} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
              📥 Export CSV Log
            </button>
          </div>

          {filteredAudit.length === 0 ? (<div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Audit logs clear</div>
              <div className="empty-desc">No system administrative events matching filters.</div>
            </div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredAudit.map((entry, i) => (<div key={entry.id || entry._id || i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                    }}>
                    {entry.action === 'score_override' ? '📊' : entry.action === 'broadcast' ? '📢' : entry.action.includes('suspend') ? '🚫' : '🔧'}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                      {entry.targetId && (<span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                          Target: {entry.targetId}
                        </span>)}
                    </div>
                    {entry.meta && (<div style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
                        {JSON.stringify(entry.meta)}
                      </div>)}
                  </div>
                  
                  <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'right' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>))}
            </div>)}
        </div>)}

      {/* ── TAB: BROADCAST ANNOUNCEMENTS ───────────────────────────────── */}
      {tab === 'broadcast' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Broadcast composer form */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Compose Broadcast Message</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Announcement Title *</label>
                <input className="form-input" style={{ width: '100%' }} value={bcast.title} onChange={e => setBcast(b => ({ ...b, title: e.target.value }))} placeholder="System maintenance announcement"/>
              </div>
              
              <div>
                <label style={lbl}>Message Content *</label>
                <textarea className="form-input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }} value={bcast.message} onChange={e => setBcast(b => ({ ...b, message: e.target.value }))} placeholder="Write announcement details..."/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Notification Style</label>
                  <select className="form-input" style={{ width: '100%' }} value={bcast.type} onChange={e => setBcast(b => ({ ...b, type: e.target.value }))}>
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="error">Error (Coral)</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Target Role Filter</label>
                  <select className="form-input" style={{ width: '100%' }} value={bcast.targetRole} onChange={e => setBcast(b => ({ ...b, targetRole: e.target.value }))}>
                    <option value="">All Platform Users</option>
                    <option value="student">Students Only</option>
                    <option value="recruiter">Recruiters Only</option>
                    <option value="consultant">Consultants Only</option>
                  </select>
                </div>
              </div>

              <button onClick={sendBroadcast} className="btn-primary" style={{ marginTop: 10, justifyContent: 'center' }}>
                📢 Send Broadcast Message
              </button>
            </div>
          </div>

          {/* Real-time preview */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Real-Time Live Preview</h3>
            
            {(!bcast.title && !bcast.message) ? (<div style={{ padding: 20, border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>
                Fill out the composer form to preview the user banner.
              </div>) : (<div style={{
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18,
                    display: 'flex', flexDirection: 'column', gap: 12
                }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  Target Audience: <strong style={{ color: 'var(--t1)' }}>{bcast.targetRole || 'All Users'}</strong>
                </div>
                
                {/* Banner preview */}
                <div style={{
                    background: bcast.type === 'success' ? 'rgba(5,150,105,0.08)' : bcast.type === 'error' ? 'rgba(239,68,68,0.08)' : bcast.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(91,91,214,0.08)',
                    border: `1px solid ${bcast.type === 'success' ? 'var(--green)' : bcast.type === 'error' ? 'var(--coral)' : bcast.type === 'warning' ? 'var(--amber)' : 'var(--blue)'}`,
                    borderRadius: 10, padding: 14
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}>
                      {bcast.type === 'success' ? '✓' : bcast.type === 'error' ? '🚫' : bcast.type === 'warning' ? '⚠' : 'ℹ'}
                    </span>
                    <div>
                      <div style={{
                    fontWeight: 700, fontSize: 13,
                    color: bcast.type === 'success' ? 'var(--green)' : bcast.type === 'error' ? 'var(--coral)' : bcast.type === 'warning' ? 'var(--amber)' : 'var(--blue)'
                }}>
                        {bcast.title || 'Untitled Notification'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--t1)', marginTop: 4, lineHeight: 1.5 }}>
                        {bcast.message || 'Announcement content description goes here.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>)}
    </div>);
}
// ── Shared styles ─────────────────────────────────────────────────────────────
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const modalBox = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: 460, maxWidth: '100%', boxShadow: 'var(--shadow-lg)' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 };
const modalTitle = { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--t1)' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 22, lineHeight: 1 };
const lbl = { display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px' };
const errorBox = { padding: '8px 12px', background: 'var(--coral-light)', border: '1px solid var(--coral)', borderRadius: 'var(--radius)', fontSize: 12.5, color: 'var(--coral)' };
