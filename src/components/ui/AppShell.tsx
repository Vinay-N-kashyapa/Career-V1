'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useCareerProfile } from '@/lib/hooks/useCareerProfile';
import { useNotifications } from '@/lib/api/hooks';
import { useAppStore, toast } from '@/lib/store/useAppStore';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import PinsBadge from '@/components/pins/PinsBadge';

// Lazy-load avatar to avoid SSR issues with Three.js / VRoid
const AvatarMentorWidget = lazy(() => import('@/components/avatar/AvatarMentorWidget'));

// HelpBot removed - consolidated into GlobalAvatar AI Mentor

const TEACHER_CONFIG: Record<string, { name: string; color: string; emoji: string }> = {
  priya:  { name: 'Ms. Priya',  color: '#4f46e5', emoji: '👩‍💼' },
  aisha:  { name: 'Ms. Aisha',  color: '#7c3aed', emoji: '👩‍🏫' },
  rohan:  { name: 'Mr. Rohan',  color: '#0891b2', emoji: '👨‍💻' },
  vikram: { name: 'Mr. Vikram', color: '#059669', emoji: '👨‍⚖️' },
};

// Global floating avatar component with gamified onboarding tutorial and proper minimize handling
function GlobalAvatar({ user, profile }: { user: any; profile: any }) {
  const cOS = useCareerOS();
  const pathname = usePathname();
  const { 
    onboardingStep, setOnboardingStep, 
    resumeGenerated, roadmapGenerated, 
    completedQuests, javaTestPassed 
  } = cOS;

  const [mounted, setMounted] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Sync tutorial steps based on current path and state changes
  useEffect(() => {
    if (onboardingStep === 1 && pathname === '/resume') {
      setOnboardingStep(2);
    }
    if (onboardingStep === 2 && resumeGenerated) {
      setOnboardingStep(3);
    }
    if (onboardingStep === 3 && pathname === '/career-builder') {
      setOnboardingStep(4);
    }
  }, [pathname, onboardingStep, resumeGenerated, setOnboardingStep]);

  if (!mounted) return null;

  const teacherId = user?.selectedTeacherId || 'priya';
  const teacher = TEACHER_CONFIG[teacherId] || TEACHER_CONFIG.priya;

  // Determine dialogue text based on onboardingStep + current tab context
  let dialogueText = '';
  let showButton = false;
  let buttonText = '';
  let onButtonClick = () => {};

  if (onboardingStep === 0) {
    dialogueText = "Welcome! I am your AI Career Mentor. Let's build your career profile, compile your credentials, and design a socratic learning roadmap to qualify for top engineering roles!";
    showButton = true;
    buttonText = "Let's Begin!";
    onButtonClick = () => setOnboardingStep(1);
  } else if (onboardingStep === 1) {
    dialogueText = "Welcome to the Command Center Dashboard! This panel tracks your XP progression, consistency streak, and recruiter visibility index. To begin, click on the 'Resume Builder' tab (2nd tab) to import credentials from your Secure Vault!";
  } else if (onboardingStep === 2) {
    dialogueText = "We are in the Resume & ATS Studio. Select a document from your Secure Vault to let AI parse your credentials. This compiles your resume, CV, and portfolio, and detects skill gaps to populate your roadmap!";
  } else if (onboardingStep === 3) {
    dialogueText = "Excellent! Your professional assets are compiled but currently locked. Let's go to the 'Career Builder' tab (3rd tab) next to configure your target role path and generate your quest roadmap!";
  } else if (onboardingStep === 4) {
    if (!roadmapGenerated) {
      dialogueText = "Welcome to the Career Builder. Select your target path (e.g. Backend Developer, ML Engineer) and click 'Generate Roadmap' to compile custom quests that match the role requirements!";
    } else {
      dialogueText = "Your milestone roadmap is ready! Head to the 'Quests' tab (4th tab) to take socratic lectures and coding challenges, or the 'Daily Missions' tab (7th tab) to close your parsed skill gaps!";
    }
  } else if (onboardingStep === 5) {
    if (!javaTestPassed) {
      dialogueText = "Excellent job completing your quests! I've unlocked the 'AI Interviews' tab (5th tab) for a verbal mock coding simulation. Select a mentor (Priya, Aisha, Rohan, or Vikram) to begin your assessment!";
    } else {
      dialogueText = "Congratulations on passing the technical interview assessment! I have unlocked your public portfolio deployment, cryptographic Trust registry (Sentinel), and the full recruiter matching engine!";
    }
  } else {
    // ── Post-onboarding: Context-aware tab guide ──
    // The avatar now dynamically explains the current tab the user is viewing
    const TAB_GUIDES: Record<string, string> = {
      '/dashboard': "🏠 **Home Dashboard** — Your command center! Here you can see your Career Score (combines ATS, Trust, and DNA metrics), active mission streak, XP tier progression, and AI-personalised next-step recommendations. Keep your streak alive by completing daily missions!",
      '/resume': "📄 **Resume Builder** — Import documents from your Secure Vault, or upload a resume manually. My AI engine will parse it for ATS keyword coverage, identify gaps like Docker or CI/CD, and auto-generate targeted quests. Switch between Upload (AI analysis) and Build (form editor with live ATS scoring) tabs!",
      '/career-builder': "🛠 **Career Builder** — Select your dream role trajectory (e.g. Java Backend Engineer at Swiggy) and I'll compile a custom quest roadmap with prerequisite modules. Each quest unlocks the next, building your skills systematically toward your target position!",
      '/quests': "🗺 **Quests** — Your socratic learning path! Each quest is a guided coding challenge or theory lesson. Complete quests in order to unlock the next module. Spend Pins to access premium quests. Your progress here directly boosts your Career Score and unlocks the Interview tab!",
      '/interview': "🎙 **AI Interviews** — Face a live mock technical interview with your selected AI mentor. I'll evaluate your verbal responses, code solutions, and system design thinking across multiple stages (Welcome → Coding → Complexity → Scenario → Verdict). Pass to unlock portfolio deployment!",
      '/career-twin': "🧬 **Career Twin** — Take the onboarding assessment to map your Current Self against your Future Self (target role). I'll calculate an alignment percentage and identify exactly which skills, certifications, and experiences you need to bridge the gap!",
      '/missions': "⚡ **Daily Missions** — Every day, 5 personalised micro-challenges are generated based on your resume gaps and career trajectory. Complete them to maintain your streak, earn XP and Trust points, and use the Custom Skill Trainer to request missions on any topic you want to master!",
      '/sentinel': "🔐 **Sentinel** — Your cryptographic trust registry. Every verified credential, completed quest, and passed interview is hashed and timestamped here. Recruiters can independently verify your achievements through SHA-256 signed evidence chains!",
      '/career-dna': "🔬 **Career DNA** — A deep diagnostic of your professional genome. View skill radar charts, competency breakdowns, learning velocity metrics, and personalised growth recommendations derived from all your Career OS activity!",
      '/opportunities': "🎯 **Opportunities** — AI-matched job listings ranked by how closely your actual verified skills match each role's requirements. Higher Career Scores and Trust metrics push you higher in recruiter search results and unlock priority application slots!",
      '/notifications': "🔔 **Notifications** — System alerts for quest completions, streak milestones, recruiter views, gap analysis results, and new mission assignments. Check here to stay updated on your career progress!",
      '/pricing': "⚡ **Pins & Plans** — Pins are your in-app currency earned through daily logins, quest completions, and mission streaks. Spend Pins to unlock premium AI features like Resume Enhance, advanced quests, and priority recruiter visibility!",
      '/profile': "👤 **Profile** — Manage your account settings, select your AI mentor personality (Priya, Aisha, Rohan, or Vikram), configure notification preferences, and view your cumulative career statistics!",
      '/vault': "🗂️ **Vault** — Your secure document storage. Upload certifications, project evidence, and course badges. These feed into your Trust Score calculation and can be imported directly into the Resume Builder for AI analysis!",
    };

    // Match the current pathname to a guide entry
    const matchedGuide = Object.entries(TAB_GUIDES).find(([path]) => pathname.startsWith(path));
    
    if (matchedGuide) {
      dialogueText = matchedGuide[1];
    } else {
      dialogueText = "🧬 Your Career OS is fully operational! Navigate to any tab and I'll explain how it works. Track your trust index, complete daily missions, launch custom skill training, or explore recruiter-matched opportunities. Ask me anything!";
    }
  }

  // Centered vs Docked Styles
  const isCentered = onboardingStep === 0;

  return (
    <>
      {/* Backdrop overlay when centered */}
      {isCentered && !minimized && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          transition: 'all 0.5s'
        }} />
      )}

      {/* Minimized Trigger Button */}
      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: teacher.color,
            border: '2px solid var(--accent)',
            cursor: 'pointer',
            fontSize: 26,
            boxShadow: `0 4px 20px ${teacher.color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          title={`Open ${teacher.name}`}
        >
          {teacher.emoji}
        </button>
      )}

      {/* Main Avatar Container */}
      <div 
        style={isCentered ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          height: 520,
          zIndex: 1000,
          borderRadius: 24,
          overflow: 'visible',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(79,70,229,0.3)',
          border: '3px solid var(--accent)',
          background: 'var(--bg2)',
          transition: 'opacity 0.25s ease',
          display: minimized ? 'none' : 'block',
        } : {
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 320,
          height: 420,
          zIndex: 100,
          borderRadius: 20,
          overflow: 'visible',
          boxShadow: 'var(--shadow-xl)',
          border: '1.5px solid var(--border)',
          background: 'var(--bg2)',
          transition: 'opacity 0.25s ease',
          display: minimized ? 'none' : 'block',
        }}
      >
        {/* 3D WebGL / VRoid Avatar Mentor Container */}
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: isCentered ? 20 : 18 }}>
          <Suspense fallback={
            <div style={{ width: '100%', height: '100%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
              Loading mentor...
            </div>
          }>
            <AvatarMentorWidget
              userId={user?.id}
              careerProfile={profile || undefined}
              teacherId={teacherId}
              minimized={minimized}
              setMinimized={setMinimized}
              showSpeechBubble={showSpeechBubble}
              setShowSpeechBubble={setShowSpeechBubble}
              onboardingStep={onboardingStep}
              setOnboardingStep={setOnboardingStep}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

type NavLeaf  = { href: string; icon: string; label: string; badge?: boolean };
type NavGroup = { label: string; icon: string; children: NavLeaf[] };
type NavNode  = NavLeaf | NavGroup;
type NavSection = { section: string; items: NavNode[] };

const isGroup = (n: NavNode): n is NavGroup => 'children' in n;

// ── Student: 10 Redesigned Fused tabs ──
const STUDENT_NAV: NavSection[] = [
  { section: 'Career OS', items: [
    { href: '/dashboard',      icon: '🏠', label: 'Home' },
    { href: '/resume',         icon: '📄', label: 'Resume Builder' },
    { href: '/career-builder', icon: '🛠', label: 'Career Builder' },
    { href: '/quests',         icon: '🗺', label: 'Quests' },
    { href: '/interview',      icon: '🎙', label: 'AI Interviews' },
    { href: '/career-twin',    icon: '🧬', label: 'Career Twin' },
    { href: '/missions',       icon: '⚡', label: 'Missions' },
    { href: '/sentinel',       icon: '🔐', label: 'Sentinel' },
    { href: '/career-dna',     icon: '🔬', label: 'Career DNA' },
    { href: '/opportunities',  icon: '🎯', label: 'Opportunities' },
  ]},
];

const ADMIN_NAV: NavSection[] = [
  { section: 'Admin', items: [
    { href: '/admin',        icon: '⬡',   label: 'Overview'      },
    { label: 'Education', icon: '🎓', children: [
      { href: '/admin/exams',    icon: '📝',  label: 'Exam Engine' },
      { href: '/admin/teacher',  icon: '👩‍🏫', label: 'Teachers'   },
      { href: '/admin/students', icon: '🧑‍🎓', label: 'Students'   },
    ]},
    { href: '/analytics',  icon: '📊', label: 'Analytics'  },
    { href: '/attendance', icon: '📸', label: 'Attendance' },
  ]},
];

const RECRUITER_NAV: NavSection[] = [
  { section: 'Hiring', items: [
    { href: '/recruiter', icon: '🔍', label: 'Candidates' },
    { href: '/analytics', icon: '📊', label: 'Analytics'  },
  ]},
];

const PARENT_NAV: NavSection[] = [
  { section: 'Family', items: [
    { href: '/parent', icon: '👨‍👩‍👧', label: 'My Children' },
  ]},
];

const CONSULTANT_NAV: NavSection[] = [
  { section: 'CRM', items: [
    { href: '/consultant', icon: '🗂', label: 'Student CRM' },
    { href: '/analytics',  icon: '📊', label: 'Analytics'   },
  ]},
];

const BOTTOM_NAV: NavLeaf[] = [
  { href: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
  { href: '/pricing',       icon: '⚡', label: 'Pins & Plans'            },
  { href: '/profile',       icon: '👤', label: 'Profile'                    },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Home',          '/resume':        'Resume & ATS',
  '/career-assets': 'Career Assets', '/career-dna':   'Career DNA',    '/trust':         'Trust Score',
  '/career-twin':   'Career Twin',   '/missions':      'Daily Missions',
  '/learn':         'Learn',         '/exam':          'Exams',
  '/interview':     'Interview AI',  '/personality':   'Personality',
  '/vault':         'Vault',         '/opportunities': 'Opportunities',
  '/analytics':     'Analytics',     '/sentinel':      'Sentinel',
  '/recruiter':     'Candidates',    '/admin':         'Admin Panel',
  '/admin/exams':   'Exam Manager',  '/admin/teacher': 'Teacher Panel',
  '/admin/students':'Students',      '/consultant':    'Student CRM',
  '/attendance':    'Attendance',    '/parent':        'Parent Portal',
  '/pricing':       'Pins & Plans','/profile':      'Profile',
  '/notifications': 'Notifications', '/leaderboard':   'Leaderboard',
  '/applications':  'My Applications',
  '/quests':        'Career Quests',
  '/qr-confirm':    'Confirm QR Login',
  '/onboarding':    'Setup',         '/qr-login':      'QR Login',
  '/reset-password':'Reset Password',
};

const PUBLIC_PATHS = ['/login', '/signup', '/reset-password', '/qr-login', '/qr-confirm', '/onboarding', '/privacy', '/terms', '/contact'];

function getNav(role: string): NavSection[] {
  if (['admin','superadmin'].includes(role)) return ADMIN_NAV;
  if (role === 'recruiter')  return RECRUITER_NAV;
  if (role === 'parent')     return PARENT_NAV;
  if (role === 'consultant') return CONSULTANT_NAV;
  return STUDENT_NAV;
}

function isPathActive(pathname: string, href: string) {
  if (href === '/') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname              = usePathname();
  const router                = useRouter();
  const { user, loading, logout } = useAuth();
  const { profile }           = useCareerProfile();
  const { data: notifData }   = useNotifications();
  const wsConnected           = useAppStore(s => s.wsConnected);

  // Unified Career OS Context nervous system
  const cOS = useCareerOS();
  const { 
    careerScore, 
    dnaScore, 
    trustScore, 
    missionStreak, 
    onboardingAnswers, 
    vaultItems, 
    completedMissions, 
    jdMissingSkills,
    theme,
    focusMode,
    toggleTheme,
    toggleFocusMode,
    pins,
  } = cOS;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isPublic    = pathname === '/' || PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const unread      = Array.isArray(notifData) ? notifData.filter((n: any) => !n.is_read).length : 0;
  const isStudent   = !['admin','superadmin','recruiter','parent','consultant'].includes(user?.role || '');
  const pageTitle   = PAGE_TITLES[pathname] || 'PinIT';

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const nav = getNav(user?.role || 'student');
    const next: Record<string, boolean> = {};
    nav.forEach(sec => {
      sec.items.forEach(item => {
        if (isGroup(item) && item.children.some(c => isPathActive(pathname, c.href))) {
          next[item.label] = true;
        }
      });
    });
    setOpenGroups(prev => ({ ...prev, ...next }));
  }, [pathname, user?.role]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === '[' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCollapsed(c => !c); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Redirect students who have not completed onboarding to /onboarding
  useEffect(() => {
    if (!loading && user && isStudent && !isPublic) {
      let hasCompleted = onboardingAnswers?.hasCompleted;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`pinit_${user.id}_onboarding_answers`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.hasCompleted !== undefined) {
              hasCompleted = parsed.hasCompleted;
            }
          }
        } catch {}
      }
      if (!hasCompleted) {
        router.push('/onboarding');
      }
    }
  }, [user, loading, isStudent, isPublic, onboardingAnswers?.hasCompleted, router]);

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!loading && user === null && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, isPublic, router]);

  if (isPublic) return <>{children}</>;

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12, animation:'spin 1s linear infinite' }}>⬡</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)' }}>Loading...</div>
      </div>
    </div>
  );

  if (user === null) {
    return null;
  }

  const nav = getNav(user.role || 'student');
  const toggleGroup = (label: string) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  function NavLink({ href, icon, label, badge, indent = false }: NavLeaf & { indent?: boolean }) {
    const active = isPathActive(pathname, href);
    return (
      <Link
        href={href}
        className={`nav-item${active ? ' active' : ''}`}
        style={indent && !collapsed ? { paddingLeft: 32 } : undefined}
      >
        <span className="nav-icon">{icon}</span>
        {!collapsed && <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>}
        {!collapsed && badge && unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
        {collapsed && badge && unread > 0 && (
          <span style={{ position:'absolute', top:5, right:5, width:7, height:7, borderRadius:'50%', background:'var(--coral)', border:'2px solid var(--bg2)' }} />
        )}
      </Link>
    );
  }

  function NavGroupHeader({ group }: { group: NavGroup }) {
    const open = !!openGroups[group.label];
    const hasActiveChild = group.children.some(c => isPathActive(pathname, c.href));

    if (collapsed) {
      return (
        <>
          {group.children.map(c => <NavLink key={c.href} {...c} />)}
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() => toggleGroup(group.label)}
          className={`nav-item${hasActiveChild ? ' active' : ''}`}
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="nav-icon">{group.icon}</span>
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{group.label}</span>
          <span style={{ fontSize: 10, color: 'var(--t4)', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▸</span>
        </button>
        {open && group.children.map(c => <NavLink key={c.href} {...c} indent />)}
      </>
    );
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
          zIndex:199, backdropFilter:'blur(3px)',
        }} />
      )}

      {/* ── Sidebar (Distraction-Free Focus mode transition) ── */}
      <aside 
        className={`sidebar${collapsed || focusMode ? ' collapsed' : ''}${mobileOpen ? ' open' : ''}`}
        style={{
          width: focusMode ? 0 : (collapsed ? '68px' : 'var(--sidebar-w)'),
          borderRight: focusMode ? 'none' : '1px solid var(--border)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), border 0.25s',
          overflow: 'hidden'
        }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/dashboard" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10 }}>
            <div className="logo-mark">Pi</div>
            {!collapsed && !focusMode && (
              <div>
                <div className="logo-text">PinIT</div>
                <div className="logo-sub">Career OS</div>
              </div>
            )}
          </Link>
          {!collapsed && !focusMode && (
            <button onClick={() => setCollapsed(true)} title="Collapse (⌘[)"
              style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--t4)', fontSize:18, padding:'2px 6px', borderRadius:6, lineHeight:1 }}>
              ‹
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {nav.map(sec => {
            const filteredItems = sec.items.filter(item => {
              if (isGroup(item)) return true;
              if (isStudent) {
                const unlocked = cOS.unlockedTabs || [];
                if (!unlocked.includes(item.href)) return false;
                if (item.href === '/career-builder') {
                  const isRoadmapCompleted = cOS.completedQuests.length >= 3 || cOS.javaTestPassed || cOS.onboardingStep >= 5;
                  if (isRoadmapCompleted && !cOS.forceShowCareerBuilder) {
                    return false;
                  }
                }
                return true;
              }
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.section}>
                {!collapsed && !focusMode && <div className="nav-section-label">{sec.section}</div>}
                {filteredItems.map(item =>
                  isGroup(item)
                    ? <NavGroupHeader key={item.label} group={item} />
                    : <NavLink key={item.href} {...item} />
                )}
              </div>
            );
          })}

          {/* Setup Progress Widget - only visible if not collapsed, not in focus mode, and role is student */}
          {!collapsed && !focusMode && isStudent && (() => {
            const step1 = onboardingAnswers.hasCompleted ? 25 : 0;
            const step2 = vaultItems.length >= 3 ? 25 : 0;
            const step3 = completedMissions.length >= 1 ? 25 : 0;
            const step4 = jdMissingSkills.length > 0 ? 25 : 0;
            const totalProgress = step1 + step2 + step3 + step4;

            let nextStepText = "Complete Onboarding";
            let nextStepHref = "/career-twin";
            if (step1 === 0) {
              nextStepText = "🧬 Onboard Career Twin";
              nextStepHref = "/career-twin";
            } else if (step2 === 0) {
              nextStepText = "🗄️ Upload 3 Vault Assets";
              nextStepHref = "/vault";
            } else if (step3 === 0) {
              nextStepText = "⚡ Clear First SDE Mission";
              nextStepHref = "/missions";
            } else if (step4 === 0) {
              nextStepText = "🎯 Match Your First Job";
              nextStepHref = "/opportunities";
            } else {
              nextStepText = "🚀 Career OS Fully Active!";
              nextStepHref = "/dashboard";
            }

            return (
              <div style={{
                margin: '20px 14px 10px',
                padding: 14,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--t3)', fontFamily: 'var(--font-mono)', justifyContent: 'space-between' }}>
                  <span>Setup Progress</span>
                  <span style={{ color: 'var(--accent)' }}>{totalProgress}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalProgress}%`, background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 3, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>
                  Next: <Link href={nextStepHref} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>{nextStepText}</Link>
                </div>
              </div>
            );
          })()}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {BOTTOM_NAV.map(it => <NavLink key={it.href} {...it} />)}

          {collapsed && !focusMode && (
            <button onClick={() => setCollapsed(false)} className="nav-item" style={{ justifyContent:'center', marginTop:6 }} title="Expand (⌘[)">
              <span className="nav-icon">›</span>
            </button>
          )}

          {!collapsed && !focusMode && isStudent && (
            <Link href="/pricing" style={{ textDecoration: 'none', display: 'block', marginTop: 4 }}>
              <div style={{
                padding: '7px 10px', borderRadius: 9,
                background: pins < 20 ? 'rgba(220,38,38,0.08)' : 'rgba(79,70,229,0.06)',
                border: `1px solid ${pins < 20 ? 'rgba(220,38,38,0.2)' : 'rgba(79,70,229,0.15)'}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: pins < 20 ? 'var(--coral)' : 'var(--accent)', lineHeight: 1 }}>{pins.toLocaleString()} pins</div>
                  <div style={{ fontSize: 9, color: 'var(--t4)', marginTop: 1 }}>{pins < 20 ? '⚠ Low — tap to buy' : 'Click to buy more'}</div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>+</span>
              </div>
            </Link>
          )}

          {!collapsed && !focusMode && !cOS.demoTabsUnlocked && (
            <button
              onClick={() => {
                cOS.setDemoTabsUnlocked(true);
                toast.success('Demo Bypass Activated 🔓', 'All modules unlocked for evaluation.');
              }}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '7px 10px',
                borderRadius: 9,
                background: 'rgba(79,70,229,0.08)',
                border: '1px solid rgba(79,70,229,0.25)',
                color: 'var(--accent)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span>🔓</span> Unlock All Tabs (Demo)
            </button>
          )}

          {!collapsed && !focusMode && (
            <div style={{
              display:'flex', alignItems:'center', gap:9, padding:'9px 10px', marginTop:6,
              borderRadius:9, border:'1px solid var(--border)', background:'var(--bg3)',
            }}>
              <div style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,var(--accent),var(--purple))',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, color:'#fff',
              }}>
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.displayName}
                </div>
                <div style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--font-mono)', textTransform:'capitalize' }}>
                  {user.role}
                </div>
              </div>
              <button onClick={() => logout().then(() => router.push('/login'))}
                title="Logout"
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t4)', fontSize:14, padding:4, borderRadius:6, flexShrink:0 }}>
                ⏻
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          {/* Mobile burger */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="mobile-menu-btn"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t2)', fontSize:18, padding:4, borderRadius:6, display:'none' }}>
            ☰
          </button>

          {/* If focusMode is active, allow returning with a floating action bar brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {focusMode && (
              <div 
                onClick={toggleFocusMode}
                title="Exit Focus Mode"
                style={{ 
                  width: 24, height: 24, borderRadius: 6, 
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 10, fontWeight: 800, color: 'white', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', marginRight: 6
                }}
              >
                Pi
              </div>
            )}
            <div className="topbar-title">{pageTitle}</div>
          </div>
          
          <div className="topbar-spacer" />

          {/* Score pills — connected to live CareerOSContext (simpler view in Focus mode) */}
          {isStudent && !focusMode && (
            <div className="topbar-scores" style={{ display:'flex', gap:6, alignItems:'center' }}>
              {[
                { icon:'ATS', val:careerScore, color:'var(--teal)'   },
                { icon:'DNA', val:dnaScore,    color:'var(--purple)' },
                { icon:'🛡',  val:trustScore,  color:'var(--green)'  },
              ].map(p => (
                <div key={p.icon} style={{
                  display:'flex', alignItems:'center', gap:5, padding:'3px 9px',
                  borderRadius:20, background:'var(--bg3)', border:'1px solid var(--border)',
                  fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'var(--t1)',
                }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }} />
                  {p.icon} <span style={{ color:p.color }}>{Math.round(p.val)}</span>
                </div>
              ))}
              
              {/* Vault Quick-link Icon */}
              <Link href="/vault" title="Vault Secure Area" style={{
                display:'flex', alignItems:'center', gap:4, padding:'3px 9px',
                borderRadius:20, background:'var(--bg3)', border:'1px solid var(--accent)',
                fontSize:11, textDecoration:'none', color:'var(--t1)', fontWeight:600,
                fontFamily: 'var(--font-mono)'
              }}>
                🗄️ Vault
              </Link>

              {missionStreak > 0 && (
                <div style={{
                  padding:'3px 9px', borderRadius:20,
                  background:'var(--amber-light)', border:'1px solid #fde68a',
                  fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'var(--amber)',
                }}>
                  🔥{missionStreak}d
                </div>
              )}

              {/* Pin Balance */}
              <PinsBadge size="sm" showLink />
            </div>
          )}

          {/* Theme Switcher & Focus Mode Toggles Control Group */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'} 
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)', 
                borderRadius: '50%', width: 28, height: 28, display: 'flex', 
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: 12, outline: 'none'
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Focus Mode Toggle Button (Invisible Mode) - Only for students */}
            {isStudent && (
              <button 
                onClick={toggleFocusMode} 
                title={focusMode ? 'Deactivate Focus Mode' : 'Activate Focus Mode'}
                style={{
                  background: focusMode ? 'rgba(220,38,38,0.1)' : 'var(--bg3)', 
                  border: focusMode ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--border)', 
                  borderRadius: 20, padding: '3px 12px', display: 'flex', 
                  alignItems: 'center', gap: 4, cursor: 'pointer',
                  fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: focusMode ? 'var(--coral)' : 'var(--t2)', outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🤫</span> {!focusMode && <span style={{ fontSize: 10 }}>Focus</span>}
              </button>
            )}
          </div>

          {/* WS dot */}
          <div title={wsConnected ? 'Live data' : 'Connecting...'} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{
              width:6, height:6, borderRadius:'50%',
              background: 'var(--green)',
              display:'inline-block',
              boxShadow: '0 0 0 2px rgba(5,150,105,0.25)',
              transition:'all 0.3s',
            }} />
          </div>

          {/* Bell */}
          <Link href="/notifications" style={{ position:'relative', color:'var(--t2)', textDecoration:'none', padding:6, borderRadius:8, display:'flex', alignItems:'center' }}>
            🔔
            {unread > 0 && (
              <span style={{
                position:'absolute', top:2, right:2,
                minWidth:14, height:14, borderRadius:7,
                background:'var(--coral)', color:'white',
                fontSize:9, fontWeight:700, fontFamily:'var(--font-mono)',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid var(--bg2)', padding:'0 3px',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </header>

        {/* Content */}
        <main 
          className="page-content animate-fade-in"
          style={{
            padding: focusMode ? '40px 60px' : '20px 24px',
            maxWidth: focusMode ? 960 : '100%',
            margin: focusMode ? '0 auto' : '0',
            width: '100%',
            transition: 'padding 0.25s, max-width 0.25s'
          }}
        >
          {children}
        </main>
      </div>

      {/* Global Avatar — floats bottom-right across all pages */}
      {isStudent && <GlobalAvatar user={user} profile={profile} />}

    </div>
  );
}
