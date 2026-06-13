'use client';
import { useState } from 'react';

type PortalRole = 'admin' | 'recruiter' | 'consultant';

interface RequirementItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'future';
  fileLink?: string;
  fileLabel?: string;
  notes?: string;
}

const REQUIREMENTS_DATA: Record<PortalRole, RequirementItem[]> = {
  admin: [
    {
      id: 'adm-rbac',
      title: 'User Management & Role-Based Access (RBAC)',
      description: 'System-wide user registry with capabilities to search, paginate, filter, and dynamically reassign roles.',
      status: 'completed',
      fileLink: '/admin',
      fileLabel: 'Admin Control Panel',
      notes: 'Implemented in user table view with inline dropdown role modifiers.'
    },
    {
      id: 'adm-override',
      title: 'Manual Audit & Score Overrides',
      description: 'Allows administrators to adjust student metrics (Trust, ATS, DNA) with a mandatory log audit reason.',
      status: 'completed',
      fileLink: '/admin',
      fileLabel: 'Score Override Modal',
      notes: 'Linked directly inside the Users Manager tab.'
    },
    {
      id: 'adm-fraud',
      title: 'Integrity Monitoring & Fraud Detection',
      description: 'Tracks abnormal activity, such as tab-switching during exams, or suspicious score spikes.',
      status: 'completed',
      fileLink: '/admin',
      fileLabel: 'Fraud Alerts Tab',
      notes: 'Active triggers flag students on the Fraud board for moderator review.'
    },
    {
      id: 'adm-audit',
      title: 'CSV Compliance Audit Exports',
      description: 'Logs all administrative actions (overrides, suspensions) and generates a downloadable CSV audit trail.',
      status: 'completed',
      fileLink: '/admin',
      fileLabel: 'Audit Logs Tab',
      notes: 'Audit entries saved in Firestore and downloadable via "Export Log CSV" action.'
    },
    {
      id: 'adm-bcast',
      title: 'Broadcast Announcement System',
      description: 'Allows bulk dispatching of notifications to students or specific target roles.',
      status: 'completed',
      fileLink: '/admin',
      fileLabel: 'Broadcast Tab',
      notes: 'Broadcasts populate student dashboard notifications immediately.'
    },
    {
      id: 'adm-billing',
      title: 'Subscription & SaaS Billing Manager',
      description: 'Control service tiers, payment configurations, and plan quotas.',
      status: 'completed',
      fileLink: '/pricing',
      fileLabel: 'Pins & Plans Panel',
      notes: 'Allows checking credit balance (pins) and upgrading/unlocking pro features.'
    }
  ],
  recruiter: [
    {
      id: 'rec-search',
      title: 'Talent Pool Sourcing & Boolean Filter',
      description: 'Filter candidates by domain keywords, skills, minimum ATS matches, and Trust scores.',
      status: 'completed',
      fileLink: '/recruiter',
      fileLabel: 'Candidates Tab',
      notes: 'Fetches active student profiles with visibility metrics.'
    },
    {
      id: 'rec-ats',
      title: 'Applicant Tracking System (ATS) Pipeline',
      description: 'Kanban/pipeline state tracker for candidate applications (Applied, Shortlisted, Selected, Rejected).',
      status: 'completed',
      fileLink: '/recruiter',
      fileLabel: 'Applications Tab',
      notes: 'Updates Firestore status records and propagates progress to candidate dashboards.'
    },
    {
      id: 'rec-jobs',
      title: 'Active Job Openings Manager',
      description: 'Allows posting, editing, and deleting job offers. Synced directly to student opportunities feed.',
      status: 'completed',
      fileLink: '/recruiter',
      fileLabel: 'Active Jobs Tab',
      notes: 'Add job form collects title, department, salary, and requirements.'
    },
    {
      id: 'rec-invite',
      title: 'Interview Scheduler',
      description: 'Book interview slots (video, phone, in-person) directly from the candidate screening drawer.',
      status: 'completed',
      fileLink: '/recruiter',
      fileLabel: 'Candidates -> Drawer',
      notes: 'Invites are dispatched to the student immediately.'
    },
    {
      id: 'rec-brand',
      title: 'Company Branding Profile',
      description: 'Allows editing recruiter company profile fields (tagline, industry, headquarters, about).',
      status: 'completed',
      fileLink: '/recruiter',
      fileLabel: 'Company Profile Tab',
      notes: 'Autofills brand details for all associated job postings.'
    },
    {
      id: 'rec-parse',
      title: 'AI Resume Screening & Keyword Matcher',
      description: 'Compares candidate qualifications against job requirements to calculate compliance.',
      status: 'completed',
      fileLink: '/resume',
      fileLabel: 'Resume & ATS Panel',
      notes: 'Calculates the ATS match percentage and highlights missing keywords.'
    }
  ],
  consultant: [
    {
      id: 'con-crm',
      title: 'Student CRM Progression Pipeline',
      description: 'Kanban view of linked students categorized by document collection, visa tracking, and pre-departure stages.',
      status: 'completed',
      fileLink: '/consultant',
      fileLabel: 'CRM Pipeline Board',
      notes: 'Tracks student progress phases cleanly in standard stages.'
    },
    {
      id: 'con-verify',
      title: 'Document & Vault Verification Workflow',
      description: 'Review student certificate uploads. Approving items directly increases student trust credentials.',
      status: 'completed',
      fileLink: '/consultant',
      fileLabel: 'Student CRM -> Verify',
      notes: 'Approved documents trigger a +5 boost to the student\'s Trust Quotient.'
    },
    {
      id: 'con-session',
      title: '1:1 Mentorship Session Scheduler',
      description: 'Schedule video call slots with virtual links, syncs directly to the student\'s command center.',
      status: 'completed',
      fileLink: '/consultant',
      fileLabel: 'Sessions Tab',
      notes: 'Mentorship meetings are propagated to student notifications immediately.'
    },
    {
      id: 'con-tasks',
      title: 'Checklist Task Manager',
      description: 'Add specific target checklists for students with priority badges (high, medium, low) and deadlines.',
      status: 'completed',
      fileLink: '/consultant',
      fileLabel: 'CRM Board -> Tasks',
      notes: 'Allows checking off pipeline milestones dynamically.'
    },
    {
      id: 'con-stats',
      title: 'Pipeline Conversion Analytics',
      description: 'Visual statistics on conversion rates, visa approval ratings, and active student metrics.',
      status: 'completed',
      fileLink: '/consultant',
      fileLabel: 'CRM -> Analytics',
      notes: 'Reflects total linked students, visa approvals, and revenue metrics.'
    }
  ]
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<PortalRole>('admin');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
          ⚙️ Platform Configuration & Requirements
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: 0 }}>
          Manage global API settings and track placement portal requirements, features, and target goal integrations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        
        {/* Left Column: Requirements Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Tabs Menu */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg3)', 
            padding: 4, 
            borderRadius: 12, 
            border: '1px solid var(--border)', 
            gap: 4 
          }}>
            {(['admin', 'recruiter', 'consultant'] as const).map(role => (
              <button
                key={role}
                onClick={() => setActiveTab(role)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  textTransform: 'capitalize',
                  background: activeTab === role ? 'var(--bg2)' : 'transparent',
                  color: activeTab === role ? 'var(--t1)' : 'var(--t3)',
                  boxShadow: activeTab === role ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {role === 'admin' ? '🛡️ Admin' : role === 'recruiter' ? '🔍 Recruiter' : '🗂️ Consultant'} Requirements
              </button>
            ))}
          </div>

          {/* Requirements List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REQUIREMENTS_DATA[activeTab].map(req => (
              <div 
                key={req.id} 
                style={{ 
                  background: 'var(--card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 14, 
                  padding: '16px 20px',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>{req.title}</div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    background: req.status === 'completed' ? 'var(--green-light)' : 'var(--amber-light)',
                    color: req.status === 'completed' ? 'var(--green)' : 'var(--amber)',
                    border: req.status === 'completed' ? '1px solid rgba(5,150,105,0.15)' : '1px solid rgba(217,119,6,0.15)'
                  }}>
                    {req.status === 'completed' ? '✓ Active' : '⚡ In Progress'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: '0 0 10px' }}>
                  {req.description}
                </p>

                {/* Footer Details */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  fontSize: 11, 
                  borderTop: '1px solid var(--border)', 
                  paddingTop: 10,
                  marginTop: 10
                }}>
                  <div style={{ color: 'var(--t3)' }}>
                    Note: <span style={{ color: 'var(--t2)' }}>{req.notes}</span>
                  </div>
                  {req.fileLink && (
                    <a 
                      href={req.fileLink} 
                      style={{ 
                        color: 'var(--accent)', 
                        textDecoration: 'none', 
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      Open {req.fileLabel} ➔
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Platform Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* API Keys */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              🔌 API Key Configurations
            </div>
            <p style={{ color: 'var(--t2)', fontSize: 11.5, lineHeight: 1.5, marginBottom: 14 }}>
              Integrations are driven securely via variables specified in the system config environment.
            </p>
            {[
              ['ANTHROPIC_API_KEY', 'Claude Sonnet 4'],
              ['GROQ_API_KEY', 'Llama 3 Instruct'],
              ['ELEVENLABS_API_KEY', 'ElevenLabs Speech'],
              ['DATABASE_URL', 'PostgreSQL Main DB']
            ].map(([k, desc]) => (
              <div key={k} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '8px 10px', 
                background: 'var(--bg3)', 
                borderRadius: 8, 
                fontSize: 11, 
                marginBottom: 4 
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--t1)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--t3)' }}>{desc}</div>
                </div>
                <span style={{ color: 'var(--green)', fontSize: 9, fontFamily: 'var(--font-mono)' }}>● Connected</span>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              ⚡ Portal Quick Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['/admin', 'Admin Command Center'],
                ['/recruiter', 'Recruiter Candidate Sourcing'],
                ['/consultant', 'Consultant Student CRM'],
                ['/dashboard', 'Student Command Center']
              ].map(([href, label]) => (
                <a 
                  key={href} 
                  href={href} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: '8px 12px', 
                    background: 'var(--glass)', 
                    borderRadius: 8, 
                    textDecoration: 'none', 
                    color: 'var(--t1)', 
                    fontSize: 12, 
                    border: '1px solid var(--border)', 
                    transition: 'all 0.15s' 
                  }}
                >
                  <span style={{ color: 'var(--accent)' }}>→</span>{label}
                </a>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
