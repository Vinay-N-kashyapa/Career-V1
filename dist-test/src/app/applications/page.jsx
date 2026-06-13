'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyApplicationsPage;
// app/applications/page.tsx
//
// Closes the student-journey loop identified in WORKFLOW_AUDIT §3 step 10:
// "Track applications — no UI; student can't see Applied to 4 jobs, 1 shortlisted, 0 rejected".
//
// Read-only view of every application the student has submitted, with status,
// timeline, and a clear next-action where applicable.
//
// Backed by GET /api/opportunities/applications (now JOINs opportunity data).
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
const NextStepCard_1 = __importDefault(require("@/components/ui/NextStepCard"));
// Visual + UX metadata per status. Single source of truth so the funnel summary,
// the row pill, and the timeline all agree.
const STATUS_META = {
    applied: { label: 'Applied', color: 'var(--t2)', emoji: '📤', order: 1, nextAction: 'Waiting for the recruiter to review.' },
    viewed: { label: 'Viewed', color: 'var(--accent)', emoji: '👁', order: 2, nextAction: 'Recruiter has seen your profile.' },
    shortlisted: { label: 'Shortlisted', color: 'var(--teal)', emoji: '⭐', order: 3, nextAction: 'You may be contacted soon. Check Notifications.' },
    interview_scheduled: { label: 'Interview Scheduled', color: 'var(--purple)', emoji: '🎙', order: 4, nextAction: 'Practice with Interview AI before the date.' },
    offered: { label: 'Offered', color: 'var(--green)', emoji: '🎉', order: 5, nextAction: 'Respond directly to the recruiter.' },
    rejected: { label: 'Rejected', color: 'var(--coral)', emoji: '✕', order: 6, nextAction: 'Review ATS gaps on your Resume — keep going.' },
    withdrawn: { label: 'Withdrawn', color: 'var(--t4)', emoji: '↩', order: 7 },
};
function MyApplicationsPage() {
    const [apps, setApps] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)('');
    const [filter, setFilter] = (0, react_1.useState)('active');
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        (async () => {
            try {
                const d = await client_1.api.get('/api/opportunities/applications');
                if (!cancelled)
                    setApps(d.applications || []);
            }
            catch (e) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : 'Failed to load applications');
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);
    // Funnel counts — drives the summary strip
    const funnel = (0, react_1.useMemo)(() => {
        const counts = {
            applied: 0, viewed: 0, shortlisted: 0, interview_scheduled: 0, offered: 0, rejected: 0, withdrawn: 0,
        };
        for (const a of apps)
            counts[a.status]++;
        return counts;
    }, [apps]);
    const visible = (0, react_1.useMemo)(() => {
        if (filter === 'all')
            return apps;
        if (filter === 'active')
            return apps.filter(a => !['rejected', 'withdrawn'].includes(a.status));
        return apps.filter(a => a.status === filter);
    }, [apps, filter]);
    const activeCount = apps.filter(a => !['rejected', 'withdrawn'].includes(a.status)).length;
    return (<div style={{ maxWidth: 980, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-hero-title">📋 My Applications</h1>
          <p className="page-hero-sub">Every job and internship you've applied to — track status, see what's next, learn from rejections.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Funnel summary */}
      {!loading && apps.length > 0 && (<div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: 16,
                marginBottom: 16,
                boxShadow: 'var(--shadow-sm)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: 12,
            }}>
          <FunnelStat label="Total" value={apps.length} color="var(--t1)"/>
          <FunnelStat label="Active" value={activeCount} color="var(--accent)"/>
          <FunnelStat label="Shortlisted" value={funnel.shortlisted} color="var(--teal)"/>
          <FunnelStat label="Interviews" value={funnel.interview_scheduled} color="var(--purple)"/>
          <FunnelStat label="Offers" value={funnel.offered} color="var(--green)"/>
        </div>)}

      {/* Filter pills */}
      {!loading && apps.length > 0 && (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <FilterPill label="Active" count={activeCount} active={filter === 'active'} onClick={() => setFilter('active')}/>
          <FilterPill label="All" count={apps.length} active={filter === 'all'} onClick={() => setFilter('all')}/>
          <FilterPill label="Shortlisted" count={funnel.shortlisted} active={filter === 'shortlisted'} onClick={() => setFilter('shortlisted')}/>
          <FilterPill label="Interview" count={funnel.interview_scheduled} active={filter === 'interview_scheduled'} onClick={() => setFilter('interview_scheduled')}/>
          <FilterPill label="Offered" count={funnel.offered} active={filter === 'offered'} onClick={() => setFilter('offered')}/>
          <FilterPill label="Rejected" count={funnel.rejected} active={filter === 'rejected'} onClick={() => setFilter('rejected')}/>
        </div>)}

      {/* List */}
      {loading && (<div style={emptyStyle}>Loading your applications…</div>)}

      {!loading && apps.length === 0 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={emptyStyle}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 6 }}>No applications yet</h3>
            <p style={{ color: 'var(--t3)', fontSize: 13 }}>
              Once you apply to an opportunity, it'll show up here so you can track every step from "applied" to "offered".
            </p>
          </div>
          <NextStepCard_1.default eyebrow="Recommended next" icon="🎯" color="var(--accent)" title="Browse Opportunities" description="See jobs and internships matched to your skills, ATS score, and target role." href="/opportunities" ctaLabel="Browse →"/>
          <NextStepCard_1.default eyebrow="Or first" icon="📄" color="var(--teal)" title="Polish your resume" description="Recruiters scan ATS scores in 6 seconds. A higher score = more matches." href="/resume" ctaLabel="Open Resume →"/>
        </div>)}

      {!loading && apps.length > 0 && visible.length === 0 && (<div style={emptyStyle}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔎</div>
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>No applications match this filter.</p>
        </div>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(a => <ApplicationCard key={a.id} app={a}/>)}
      </div>
    </div>);
}
// ── Sub-components ──────────────────────────────────────────────────
function ApplicationCard({ app }) {
    const meta = STATUS_META[app.status];
    const stipend = app.stipend_min && app.stipend_max
        ? `₹${app.stipend_min.toLocaleString()} – ₹${app.stipend_max.toLocaleString()}`
        : app.stipend_max
            ? `up to ₹${app.stipend_max.toLocaleString()}`
            : null;
    return (<div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${meta.color}`,
            borderRadius: 'var(--radius-xl)',
            padding: 16,
            boxShadow: 'var(--shadow-sm)',
        }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
            {app.title || <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>Opportunity removed</span>}
          </h3>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
            {app.org_name && <span>{app.org_name}</span>}
            {app.org_name && app.location_type && <span style={{ color: 'var(--t4)' }}> · </span>}
            {app.location_type && <span style={{ textTransform: 'capitalize' }}>{app.location_type}</span>}
            {stipend && <><span style={{ color: 'var(--t4)' }}> · </span><span>{stipend}</span></>}
            {app.duration_weeks && <><span style={{ color: 'var(--t4)' }}> · </span><span>{app.duration_weeks}wk</span></>}
          </div>
        </div>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 100,
            background: 'var(--bg3)',
            border: `1px solid ${meta.color}`,
            color: meta.color,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
        }}>
          <span>{meta.emoji}</span> {meta.label}
        </div>
      </div>

      {app.required_skills && app.required_skills.length > 0 && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {app.required_skills.slice(0, 6).map(s => (<span key={s} className="skill-tag" style={{ fontSize: 10 }}>{s}</span>))}
          {app.required_skills.length > 6 && <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{app.required_skills.length - 6} more</span>}
        </div>)}

      {meta.nextAction && (<div style={{
                fontSize: 12,
                color: 'var(--t2)',
                padding: '8px 12px',
                background: 'var(--bg3)',
                borderRadius: 'var(--radius)',
                marginBottom: 8,
                borderLeft: `2px solid ${meta.color}`,
            }}>
          <span style={{ fontWeight: 600, color: meta.color }}>Next: </span>
          {meta.nextAction}
          {app.status === 'interview_scheduled' && <a href="/interview" style={{ marginLeft: 6, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Practice →</a>}
          {app.status === 'rejected' && <a href="/resume" style={{ marginLeft: 6, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Improve Resume →</a>}
        </div>)}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
        <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
        {app.updated_at && app.updated_at !== app.applied_at && (<span>Updated {new Date(app.updated_at).toLocaleDateString()}</span>)}
      </div>
    </div>);
}
function FunnelStat({ label, value, color }) {
    return (<div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</div>
    </div>);
}
function FilterPill({ label, count, active, onClick }) {
    return (<button onClick={onClick} style={{
            padding: '6px 12px',
            borderRadius: 100,
            border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: active ? 'var(--accent-light)' : 'var(--bg2)',
            color: active ? 'var(--accent)' : 'var(--t2)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
        }}>
      {label}
      <span style={{ fontSize: 10, color: active ? 'var(--accent)' : 'var(--t4)' }}>{count}</span>
    </button>);
}
const emptyStyle = {
    textAlign: 'center',
    padding: '60px 24px',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    color: 'var(--t2)',
    fontSize: 13,
};
