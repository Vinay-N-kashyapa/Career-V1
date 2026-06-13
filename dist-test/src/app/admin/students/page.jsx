'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminStudentsPage;
// app/admin/students/page.tsx
//
// Real student roster — replaces the 8-line redirect identified in WORKFLOW_AUDIT §3.
// Backed entirely by existing /api/admin/users?role=student endpoint;
// no schema or backend changes needed.
const react_1 = require("react");
const AuthContext_1 = require("@/lib/context/AuthContext");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/api/client");
const PAGE_SIZE = 25;
function AdminStudentsPage() {
    const { user } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const [rows, setRows] = (0, react_1.useState)([]);
    const [total, setTotal] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [search, setSearch] = (0, react_1.useState)('');
    const [minAts, setMinAts] = (0, react_1.useState)('');
    const [minTrust, setMinTrust] = (0, react_1.useState)('');
    const [minDna, setMinDna] = (0, react_1.useState)('');
    const [sortKey, setSortKey] = (0, react_1.useState)('created');
    const [sortDir, setSortDir] = (0, react_1.useState)('desc');
    const [page, setPage] = (0, react_1.useState)(0);
    // RBAC — redirect non-admins
    (0, react_1.useEffect)(() => {
        if (user && !['admin', 'superadmin'].includes(user.role)) {
            router.replace('/dashboard');
        }
    }, [user, router]);
    // Fetch when search or pagination changes (filter thresholds apply client-side)
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const p = new URLSearchParams();
                p.set('role', 'student');
                p.set('limit', String(PAGE_SIZE));
                p.set('offset', String(page * PAGE_SIZE));
                if (search.trim())
                    p.set('search', search.trim());
                const d = await client_1.api.get(`/api/admin/users?${p}`);
                if (cancelled)
                    return;
                setRows(d.users || []);
                setTotal(d.total || 0);
            }
            catch (e) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : 'Failed to load roster');
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [search, page]);
    // Reset to first page when search changes
    (0, react_1.useEffect)(() => { setPage(0); }, [search]);
    // ── Client-side filtering + sorting ──
    const filtered = (0, react_1.useMemo)(() => {
        let r = rows;
        if (minAts)
            r = r.filter(x => (x.ats_score ?? 0) >= Number(minAts));
        if (minTrust)
            r = r.filter(x => (x.trust_score ?? 0) >= Number(minTrust));
        if (minDna)
            r = r.filter(x => (x.career_dna_score ?? 0) >= Number(minDna));
        const sorter = {
            name: (a, b) => (a.display_name || '').localeCompare(b.display_name || ''),
            ats: (a, b) => (a.ats_score ?? 0) - (b.ats_score ?? 0),
            dna: (a, b) => (a.career_dna_score ?? 0) - (b.career_dna_score ?? 0),
            trust: (a, b) => (a.trust_score ?? 0) - (b.trust_score ?? 0),
            streak: (a, b) => (a.mission_streak ?? 0) - (b.mission_streak ?? 0),
            created: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            active: (a, b) => new Date(a.last_active_at || 0).getTime() - new Date(b.last_active_at || 0).getTime(),
        };
        const sorted = [...r].sort(sorter[sortKey]);
        return sortDir === 'desc' ? sorted.reverse() : sorted;
    }, [rows, minAts, minTrust, minDna, sortKey, sortDir]);
    function toggleSort(key) {
        if (sortKey === key)
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    }
    async function changeRole(id, role) {
        if (!confirm(`Change role to "${role}"? This will remove the user from the student roster.`))
            return;
        try {
            await client_1.api.patch(`/api/admin/users/${id}/role`, { role });
            setRows(rs => rs.filter(r => r.id !== id));
            setTotal(t => Math.max(0, t - 1));
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to change role');
        }
    }
    async function banUser(id, name) {
        const reason = prompt(`Ban "${name}"? Enter the reason (logged for audit):`);
        if (!reason)
            return;
        try {
            await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ reason }),
            });
            setRows(rs => rs.filter(r => r.id !== id));
            setTotal(t => Math.max(0, t - 1));
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to ban');
        }
    }
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return (<div style={{ maxWidth: 1280, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Student Roster</h1>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>
            Manage students, change roles, ban accounts. {total > 0 && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>· {total} total</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin" className="btn-ghost btn-sm">← Back to Admin</a>
          <a href="/admin/exams" className="btn-ghost btn-sm">Exam Manager →</a>
        </div>
      </div>

      {/* Filters */}
      <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 14,
            marginBottom: 16,
            boxShadow: 'var(--shadow-sm)',
        }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
          <input placeholder="Search by name, username, register number..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle}/>
          <input type="number" min={0} max={100} placeholder="Min ATS" value={minAts} onChange={e => setMinAts(e.target.value)} style={inputStyle}/>
          <input type="number" min={0} max={100} placeholder="Min DNA" value={minDna} onChange={e => setMinDna(e.target.value)} style={inputStyle}/>
          <input type="number" min={0} max={100} placeholder="Min Trust" value={minTrust} onChange={e => setMinTrust(e.target.value)} style={inputStyle}/>
        </div>
        {(minAts || minDna || minTrust) && (<div style={{ marginTop: 8, fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
            Filters applied to current page only · {filtered.length} of {rows.length} match
            <button onClick={() => { setMinAts(''); setMinDna(''); setMinTrust(''); }} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>clear</button>
          </div>)}
      </div>

      {/* Error / Loading */}
      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>⚠ {error}</div>}

      {/* Table */}
      <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
        }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                <Th label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left"/>
                <Th label="Register" col={null} sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left"/>
                <Th label="ATS" col="ats" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="DNA" col="dna" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Trust" col="trust" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Streak" col="streak" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Joined" col="created" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Active" col="active" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={9} style={{ padding: 36, textAlign: 'center', color: 'var(--t3)' }}>Loading roster…</td></tr>)}
              {!loading && filtered.length === 0 && (<tr><td colSpan={9} style={{ padding: 36, textAlign: 'center', color: 'var(--t3)' }}>
                  {rows.length === 0 ? 'No students found.' : 'No students match the current filters.'}
                </td></tr>)}
              {!loading && filtered.map(r => (<tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--t1)' }}>{r.display_name || '—'}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>@{r.username}</div>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t2)' }}>
                    {r.register_number || <span style={{ color: 'var(--t4)' }}>—</span>}
                  </td>
                  <ScoreCell value={r.ats_score}/>
                  <ScoreCell value={r.career_dna_score}/>
                  <ScoreCell value={r.trust_score}/>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: (r.mission_streak ?? 0) > 0 ? 'var(--amber)' : 'var(--t4)' }}>
                    {(r.mission_streak ?? 0) > 0 ? `🔥${r.mission_streak}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                    {r.last_active_at ? relativeTime(r.last_active_at) : <span style={{ color: 'var(--t4)' }}>never</span>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => changeRole(r.id, 'teacher')} title="Promote to teacher" style={iconBtnStyle}>↑</button>
                    <button onClick={() => banUser(r.id, r.display_name)} title="Ban user" style={{ ...iconBtnStyle, color: 'var(--coral)' }}>✕</button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (<div style={{
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg3)',
                borderTop: '1px solid var(--border)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--t3)',
            }}>
            <div>Page {page + 1} of {totalPages} · Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost btn-sm">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages} className="btn-ghost btn-sm">Next →</button>
            </div>
          </div>)}
      </div>
    </div>);
}
// ── Sub-components ──────────────────────────────────────────────────
function Th({ label, col, sortKey, sortDir, onClick, align = 'center', }) {
    const active = col && sortKey === col;
    return (<th onClick={col ? () => onClick(col) : undefined} style={{
            padding: '10px 12px',
            textAlign: align,
            fontSize: 10.5,
            color: active ? 'var(--accent)' : 'var(--t3)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            cursor: col ? 'pointer' : 'default',
            userSelect: 'none',
        }}>
      {label}
      {active && <span style={{ marginLeft: 4 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </th>);
}
function ScoreCell({ value }) {
    const v = value ?? 0;
    const color = v >= 80 ? 'var(--green)' : v >= 60 ? 'var(--amber)' : v >= 30 ? 'var(--t2)' : 'var(--t4)';
    return (<td style={{
            padding: '10px 12px',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color,
        }}>
      {value === null ? <span style={{ color: 'var(--t4)', fontWeight: 400 }}>—</span> : Math.round(v)}
    </td>);
}
function relativeTime(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(ms / 1000);
    if (sec < 60)
        return `${sec}s ago`;
    if (sec < 3600)
        return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400)
        return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 86400 * 7)
        return `${Math.floor(sec / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
}
// ── Styles ──────────────────────────────────────────────────────────
const inputStyle = {
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg3)',
    color: 'var(--t1)',
    fontSize: 12.5,
    outline: 'none',
};
const iconBtnStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--t3)',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 13,
    marginLeft: 4,
};
