'use client';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useCareerProfile } from '@/lib/hooks/useCareerProfile';
import { useNotifications } from '@/lib/api/hooks';
import { useAppStore, toast } from '@/lib/store/useAppStore';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import PinsBadge from '@/components/pins/PinsBadge';
import LiteChatInterface from '@/components/ui/LiteChatInterface';
import { speakWithAvatar, stopSpeaking } from '@/lib/tts';
import { HomeTab, ExamsTab, ResultsTab, NotesTab, NotificationsTab, ContactTab } from '@/components/dsai/AcademicTabs';
import { ExamEngine, ExamStartModal } from '@/components/_legacy/dsai/ExamEngine.jsx';
import { ToastProvider } from '@/lib/context/ToastContext';
import { useBatches } from '@/lib/context/BatchContext';

// Lazy-load avatar to avoid SSR issues with Three.js / VRoid
const AvatarMentorWidget = lazy(() => import('@/components/avatar/AvatarMentorWidget'));

// HelpBot removed - consolidated into GlobalAvatar AI Mentor

const TEACHER_CONFIG: Record<string, { name: string; color: string; emoji: string }> = {
  priya:  { name: 'Ms. Priya',  color: '#4f46e5', emoji: '👩‍💼' },
  anish:  { name: 'Mr. Anish',  color: '#0891b2', emoji: '👨‍💼' },
};

// ── Tour slide definitions ────────────────────────────────────────────────────
const TOUR_SLIDES = [
  {
    emoji: '👋',
    title: 'Welcome to PinIT Career OS!',
    text: "Hey there! 🎉 Welcome aboard! I'm your personal AI Career Mentor. This is your Career OS — everything you need to land your dream engineering role. Let me give you a quick tour of what's here!",
  },
  {
    emoji: '🏠',
    title: 'Home Dashboard',
    text: "This is your **Home Dashboard** — your mission control! You can see your live Career Score, daily streak, XP level, and my personalised daily recommendations here. Check it every morning! 🌅",
  },
  {
    emoji: '🛠️',
    title: 'Career Builder',
    text: "The **Career Builder** is where you create your smart resume and generate a custom learning roadmap based on your target engineering role. Start here to set your direction! 🎯",
  },
  {
    emoji: '🗺',
    title: 'Quests',
    text: "**Quests** are your guided coding challenges and theory lessons. Complete them in order to unlock new skills and boost your Career DNA score. Think of them as your daily training missions! 💪",
  },
  {
    emoji: '⚡',
    title: 'Daily Missions',
    text: "**Daily Missions** give you 5 fresh micro-challenges every single day, built around your weak spots. Complete at least one each day to keep your streak alive and earn Pins! 🔥",
  },
  {
    emoji: '🎙',
    title: 'AI Interview',
    text: "The **AI Interview** simulates a real 4-round technical interview with AI recruiters like Mr. Vikram and Ms. Neha. Practice here until the real thing feels easy! 🎤",
  },
  {
    emoji: '🧬',
    title: 'Career Twin',
    text: "**Career Twin** maps your current skills against your dream role and shows exactly what's missing — your personal skills gap analyser! Fix the gaps and watch your scores climb. 📈",
  },
  {
    emoji: '🔬',
    title: 'Career DNA',
    text: "**Career DNA** gives you a deep breakdown of 9 career competencies — your strength radar, learning velocity, and personalised growth plan. See where you shine! ✨",
  },
  {
    emoji: '🎯',
    title: 'Opportunities',
    text: "**Opportunities** shows AI-matched job listings ranked by how well your verified skills actually fit each role. The stronger your scores, the higher you rank in recruiter searches! 🚀",
  },
  {
    emoji: '💬',
    title: 'Group Discussion',
    text: "**Group Discussion** lets you practice SDE boardroom debates with up to 14 AI avatars — perfect for building communication confidence and handling pressure! 🏆",
  },
  {
    emoji: '🚀',
    title: "You're All Set!",
    text: "That's the full tour! Start by heading to **Quests** for your first coding lesson, or check out **Daily Missions** to earn your first streak. I'm always here in the corner if you need me! 💙",
  },
];

// ── Activity type labels ──────────────────────────────────────────────────────
const ACTIVITY_LABELS: Record<string, string> = {
  quest: 'quest',
  exam: 'coding exam',
  mission: 'daily mission',
  interview: 'AI interview',
  gd: 'Group Discussion',
};

// ── Build congratulations message from event payload ─────────────────────────
function buildCongratMessage(detail: any, profile: any): { headline: string; body: string; tip: string } {
  const label = ACTIVITY_LABELS[detail.type] || 'activity';
  const score = typeof detail.score === 'number' ? detail.score : null;
  const passed = detail.passed !== false;

  const weakAreas = Array.isArray(profile?.weak_areas) && profile.weak_areas.length > 0 
    ? profile.weak_areas 
    : ['System Design Concepts', 'API Gateways', 'Concurrency Controls'];
  const focusImprove = weakAreas[0];
  const secondaryImprove = weakAreas[1] || 'Unit Testing Coverage';

  let headline = '';
  let body = '';
  let tip = '';

  if (detail.type === 'interview') {
    const verdict = detail.verdict || (passed ? 'Hire' : 'No Hire');
    headline = verdict === 'Hire'
      ? `🏆 Hire Verdict — Outstanding!`
      : `💪 No Hire — But You're Growing!`;
    
    const strengthStr = Array.isArray(detail.strengths) && detail.strengths[0]
      ? detail.strengths[0]
      : "your dynamic problem-solving approach and STAR format answers";
      
    const improveStr = Array.isArray(detail.improvements) && detail.improvements[0]
      ? detail.improvements[0]
      : focusImprove;

    body = score !== null
      ? verdict === 'Hire'
        ? `You scored ${score}% in the SDE interview! You did exceptionally well on ${strengthStr}.`
        : `You scored ${score}% this round. You did well on ${strengthStr}, showing solid promise.`
      : `Your SDE interview evaluation is in. You demonstrated strong capability in ${strengthStr}.`;
    tip = `Where you can improve: Focus on refining your skills in "${improveStr}" for the next round.`;
  } else if (detail.type === 'gd') {
    headline = passed ? `🎤 Great Boardroom Session!` : `💬 GD Session Complete!`;
    
    const strengthStr = Array.isArray(detail.strengths) && detail.strengths[0]
      ? detail.strengths[0]
      : "articulating your ideas and structural points clearly";
      
    const improveStr = Array.isArray(detail.improvements) && detail.improvements[0]
      ? detail.improvements[0]
      : secondaryImprove;

    body = score !== null
      ? passed
        ? `You scored ${score}% in the boardroom debate! You did really well on ${strengthStr}.`
        : `You scored ${score}%. You did well on ${strengthStr}, but need a bit more practice.`
      : `Your boardroom debate is complete! You did well on ${strengthStr}.`;
    tip = `Where you can improve: Try to assert your points and work on "${improveStr}" under peer pressure.`;
  } else if (detail.type === 'exam') {
    headline = `🧑‍💻 Exam Passed — Excellent!`;
    body = `You passed the coding exam! Your compiler outputs and algorithmic efficiency are top-tier.`;
    tip = `For your next challenge, study up on ${focusImprove} to close your remaining skill gaps!`;
  } else if (detail.type === 'mission') {
    headline = `⚡ Daily Mission Complete!`;
    body = `Great job on completing today's Daily Mission! Resolving these daily micro-exercises keeps your streak active and builds consistent practice.`;
    tip = `To strengthen your profile, continue practicing coding templates and address your key focus area: ${focusImprove}.`;
  } else {
    // quest
    headline = `🗺 Quest Complete — Well Done!`;
    const wellDoneTopic = detail.title ? `Quest "${detail.title}"` : 'your active coding Quest';
    body = score && score >= 80
      ? `You aced ${wellDoneTopic} with a score of ${score}%! Your syntax execution and logical reasoning are excellent.`
      : `You successfully finished ${wellDoneTopic}! Every completed lesson reinforces your skills and brings you closer to your target role.`;
    tip = `To continue improving, let's focus on your roadmap weak spot: ${focusImprove}.`;
  }

  return { headline, body, tip };
}

const TOUR_STEP_ROUTES: Record<number, string> = {
  0: '/dashboard',
  1: '/dashboard',
  2: '/career-builder',
  3: '/quests',
  4: '/missions',
  5: '/interview',
  6: '/career-twin',
  7: '/career-dna',
  8: '/opportunities',
  9: '/group-discussion',
  10: '/dashboard',
};

// Global floating avatar component with tab tour, activity congrats, and proper minimize handling
function GlobalAvatar({ user, profile, refreshProfile }: { user: any; profile: any; refreshProfile?: () => void }) {
  const cOS = useCareerOS();
  const pathname = usePathname();
  const router = useRouter();
  const cleanPath = pathname?.replace(/\/$/, '') || '';

  const {
    onboardingStep, setOnboardingStep,
    resumeGenerated, roadmapGenerated,
    completedQuests, javaTestPassed
  } = cOS;

  const [mounted, setMounted] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);

  // ── Tour state ─────────────────────────────────────────────────────────────
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // ── Congratulations state ──────────────────────────────────────────────────
  const [celebEvent, setCelebEvent] = useState<any>(null);
  const celebTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenCelebRef = useRef<any>(null);

  const teacherId = profile?.guidanceMentorId || 'priya';
  const teacher = TEACHER_CONFIG[teacherId] || TEACHER_CONFIG.priya;

  const isLessonOrDetail = cleanPath === '/quests/lesson' || (cleanPath.startsWith('/quests/') && cleanPath !== '/quests/teacher-select' && cleanPath !== '/quests');
  const isInterview = cleanPath === '/interview' || cleanPath.startsWith('/interview/');
  const isGroupDiscussion = cleanPath === '/group-discussion' || cleanPath.startsWith('/group-discussion/');
  const isMissions = cleanPath === '/missions' || cleanPath.startsWith('/missions/');

  const shouldHideVisually = (isLessonOrDetail || isInterview || isGroupDiscussion || isMissions) && !celebEvent && !tourActive;

  useEffect(() => { setMounted(true); }, []);

  // ── Trigger tab tour 2s after first post-onboarding /dashboard visit ──────
  useEffect(() => {
    if (!mounted) return;
    if (onboardingStep < 3) return;
    if (pathname !== '/dashboard') return;
    const tourKey = `pinit_${user?.id}_tour_shown`;
    if (typeof window === 'undefined') return;

    const justOnboarded = sessionStorage.getItem('pinit_just_onboarded') === 'true';
    const alreadyShown = localStorage.getItem(tourKey);

    if (alreadyShown && !justOnboarded) return;

    // Clear the just_onboarded flag and tour shown status so it runs cleanly
    if (justOnboarded) {
      sessionStorage.removeItem('pinit_just_onboarded');
      localStorage.removeItem(tourKey);
    }

    const t = setTimeout(() => {
      setTourActive(true);
      setTourStep(0);
      setMinimized(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [mounted, onboardingStep, pathname, user?.id]);

  // ── Listen for activity completion events ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      // Fetch latest profile state from database
      refreshProfile?.();
      // Clear any running auto-dismiss timer
      if (celebTimerRef.current) clearTimeout(celebTimerRef.current);
      setCelebEvent(detail);
      setMinimized(false); // pop the avatar open
      // Auto-dismiss after 14 seconds
      celebTimerRef.current = setTimeout(() => setCelebEvent(null), 14000);
    };
    window.addEventListener('pinit:activity_complete', handler);
    return () => window.removeEventListener('pinit:activity_complete', handler);
  }, [refreshProfile]);

  // Speak tour slide out loud and automatically switch pages to show corresponding tab
  useEffect(() => {
    if (tourActive && TOUR_SLIDES[tourStep]) {
      const slide = TOUR_SLIDES[tourStep];
      const speechText = slide.text.replace(/\*\*/g, '').replace(/🎉|🏠|🛠️|🗺|⚡|🎙|🧬|🔬|🎯|💬|🚀|👋|🌅|✨|💙/g, '');
      
      stopSpeaking();
      speakWithAvatar(speechText, teacherId, () => {}, () => {});

      const targetRoute = TOUR_STEP_ROUTES[tourStep];
      if (targetRoute && pathname !== targetRoute) {
        router.push(targetRoute);
      }
    }
  }, [tourActive, tourStep, teacherId, router, pathname]);

  // Speak congratulations out loud when a celebration triggers (ensuring only once per event object)
  useEffect(() => {
    if (celebEvent && celebEvent !== spokenCelebRef.current) {
      spokenCelebRef.current = celebEvent;
      const msg = buildCongratMessage(celebEvent, profile);
      const textToSpeak = `Well done! ${msg.body} ${msg.tip}`;
      const cleanText = textToSpeak.replace(/\*\*/g, '').replace(/🎉|🏆|💪|🧑‍💻|⚡|🔥|🗺|🎤|💬/g, '');
      
      stopSpeaking();
      speakWithAvatar(cleanText, teacherId, () => {}, () => {});
    }
  }, [celebEvent, teacherId, profile]);



  // Sync tutorial steps based on current path and state changes
  useEffect(() => {
    if (roadmapGenerated && onboardingStep < 4) {
      setOnboardingStep(4);
    } else if (onboardingStep === 1 && pathname === '/career-twin') {
      setOnboardingStep(2);
    }
  }, [pathname, onboardingStep, roadmapGenerated, setOnboardingStep]);

  if (!mounted) return null;

  // ── Tour navigation helpers ───────────────────────────────────────────────
  const dismissTour = () => {
    setTourActive(false);
    stopSpeaking();
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`pinit_${user.id}_tour_shown`, 'true');
    }
  };
  const nextTourSlide = () => {
    if (tourStep >= TOUR_SLIDES.length - 1) {
      dismissTour();
    } else {
      setTourStep(s => s + 1);
    }
  };

  // ── Determine dialogue text ───────────────────────────────────────────────
  let dialogueText = '';
  let showButton = false;
  let buttonText = '';
  let onButtonClick = () => {};

  if (!tourActive && !celebEvent) {
    if (onboardingStep === 0) {
      dialogueText = "Welcome! I am your AI Career Mentor. Let's build your career profile, compile your credentials, and design a socratic learning roadmap to qualify for top engineering roles!";
      showButton = true;
      buttonText = "Let's Begin!";
      onButtonClick = () => setOnboardingStep(1);
    } else if (onboardingStep === 1) {
      dialogueText = "Welcome to the Command Center Dashboard! This panel tracks your XP progression, consistency streak, and Career DNA. To start, click on the 'Career Twin' tab to initialize your digital twin profile!";
    } else if (onboardingStep === 2) {
      dialogueText = "We are in the Career Twin studio. Map your current skills against your desired engineering track. When you are ready, return to the Dashboard and choose a Trajectory to build your custom quest roadmap!";
    } else if (onboardingStep === 3 || onboardingStep === 4) {
      if (!roadmapGenerated) {
        dialogueText = "Select your target SDE trajectory on the Dashboard page below to compile your custom quest roadmap!";
      } else {
        dialogueText = "Your custom quest roadmap is compiled! Head to the 'Quests' tab to begin learning or the 'Missions' tab to solve daily gap-closure challenges!";
      }
    } else if (onboardingStep === 5) {
      dialogueText = "Excellent job! You are progressing nicely. Keep completing quests to build your Career DNA and Vault documents!";
    } else {
      // ── Post-onboarding: Context-aware tab guide ──
      const TAB_GUIDES: Record<string, string> = {
        '/dashboard': "🏠 **Home Dashboard** — Your command center! Here you can see your Career Score (combines DNA, Trust, and Quest metrics), active mission streak, XP tier progression, and AI-personalised next-step recommendations. Keep your streak alive by completing daily missions!",
        '/quests': "🗺 **Quests** — Your socratic learning path! Each quest is a guided coding challenge or theory lesson. Complete quests in order to unlock the next module. Spend Pins to access premium quests. Your progress here directly boosts your Career Score!",
        '/career-twin': "🧬 **Career Twin** — Take the onboarding assessment to map your Current Self against your Future Self (target role). I'll calculate an alignment percentage and identify exactly which skills, certifications, and experiences you need to bridge the gap!",
        '/missions': "⚡ **Daily Missions** — Every day, 5 personalised micro-challenges are generated based on your skill gaps and career trajectory. Complete them to maintain your streak, earn XP and Trust points, and use the Custom Skill Trainer to request missions on any topic you want to master!",
        '/career-dna': "🔬 **Career DNA** — A deep diagnostic of your professional genome. View skill radar charts, competency breakdowns, learning velocity metrics, and personalised growth recommendations derived from all your Career OS activity!",
        '/opportunities': "🎯 **Opportunities** — AI-matched job listings ranked by how closely your actual verified skills match each role's requirements. Higher Career Scores and Trust metrics push you higher in recruiter search results!",
        '/notifications': "🔔 **Notifications** — System alerts for quest completions, streak milestones, recruiter views, and new mission assignments. Check here to stay updated on your career progress!",
        '/pricing': "⚡ **Pins & Plans** — Pins are your in-app currency earned through daily logins, quest completions, and mission streaks. Spend Pins to unlock premium AI features like advanced quests!",
        '/profile': "👤 **Profile** — Manage your account settings, select your AI mentor personality (Priya, Aisha, Rohan, or Vikram), configure notification preferences, and view your cumulative career statistics!",
        '/vault': "🗂️ **Vault** — Your secure document storage. Upload certifications, project evidence, and course badges. These feed into your Trust Score calculation to verify your profile!",
      };

      const matchedGuide = Object.entries(TAB_GUIDES).find(([path]) => pathname.startsWith(path));
      if (matchedGuide) {
        dialogueText = matchedGuide[1];
      } else {
        dialogueText = "🧬 Your Career OS is fully operational! Navigate to any tab and I'll explain how it works. Track your trust index, complete daily missions, launch custom skill training, or explore recruiter-matched opportunities. Ask me anything!";
      }
    }
  }

  // Centered vs Docked Styles
  const isCentered = onboardingStep === 0;

  // ── Congratulations Card ──────────────────────────────────────────────────
  const CongratCard = () => {
    if (!celebEvent) return null;
    const msg = buildCongratMessage(celebEvent, profile);
    const passed = celebEvent.passed !== false;
    return (
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 20,
        background: passed
          ? 'linear-gradient(145deg, rgba(5,150,105,0.97) 0%, rgba(16,185,129,0.97) 100%)'
          : 'linear-gradient(145deg, rgba(79,70,229,0.97) 0%, rgba(124,58,237,0.97) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 18px',
        gap: 10,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
        boxShadow: passed
          ? '0 0 30px rgba(5,150,105,0.5), inset 0 1px 1px rgba(255,255,255,0.2)'
          : '0 0 30px rgba(79,70,229,0.5), inset 0 1px 1px rgba(255,255,255,0.2)',
      }}>
        {/* Animated burst */}
        <div style={{ fontSize: 36, animation: 'bounce 0.6s ease infinite alternate', lineHeight: 1 }}>
          {passed ? '🎉' : '💪'}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 900,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '-0.3px',
        }}>
          {msg.headline}
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.88)',
          textAlign: 'center',
          lineHeight: 1.55,
          fontFamily: 'var(--font-sans)',
        }}>
          {msg.body}
        </div>
        {/* Score pill */}
        {typeof celebEvent.score === 'number' && (
          <div style={{
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 20,
            padding: '3px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
          }}>
            {celebEvent.score}% score
          </div>
        )}
        <div style={{
          fontSize: 10.5,
          color: 'rgba(255,255,255,0.75)',
          textAlign: 'center',
          lineHeight: 1.45,
          fontStyle: 'italic',
          padding: '0 4px',
        }}>
          💡 {msg.tip}
        </div>
        <button
          onClick={() => {
            setCelebEvent(null);
            stopSpeaking();
          }}
          style={{
            marginTop: 4,
            background: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 20,
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '5px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            transition: 'background 0.2s',
          }}
        >
          Thanks, {teacher.name.split(' ')[1] || teacher.name}! ✓
        </button>
      </div>
    );
  };

  // ── Tour Overlay ──────────────────────────────────────────────────────────
  const TourOverlay = () => {
    if (!tourActive) return null;
    const slide = TOUR_SLIDES[tourStep];
    const isLast = tourStep === TOUR_SLIDES.length - 1;
    return (
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 20,
        background: 'linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 18px',
        gap: 10,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        {/* slide emoji */}
        <div style={{ fontSize: 32, lineHeight: 1, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>
          {slide.emoji}
        </div>
        {/* slide counter */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--t4)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          {tourStep + 1} / {TOUR_SLIDES.length}
        </div>
        {/* progress bar */}
        <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            width: `${((tourStep + 1) / TOUR_SLIDES.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--teal))',
            borderRadius: 2,
            transition: 'width 0.35s ease',
          }} />
        </div>
        {/* title */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 900,
          color: 'var(--t1)',
          textAlign: 'center',
          letterSpacing: '-0.3px',
        }}>
          {slide.title}
        </div>
        {/* body */}
        <div style={{
          fontSize: 11.5,
          color: 'var(--t2)',
          textAlign: 'center',
          lineHeight: 1.6,
          fontFamily: 'var(--font-sans)',
        }}>
          {slide.text}
        </div>
        {/* buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4, width: '100%' }}>
          <button
            onClick={dismissTour}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: 'var(--t3)',
              fontSize: 10.5,
              fontWeight: 600,
              padding: '7px 0',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'background 0.2s',
            }}
          >
            Skip Tour
          </button>
          <button
            onClick={nextTourSlide}
            style={{
              flex: 2,
              background: 'linear-gradient(90deg, var(--accent) 0%, var(--purple) 100%)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '7px 0',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 2px 12px rgba(79,70,229,0.4)',
              transition: 'opacity 0.2s',
            }}
          >
            {isLast ? "Let's Go! 🚀" : 'Next →'}
          </button>
        </div>
      </div>
    );
  };

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
      {minimized && !shouldHideVisually && (
        <button
          onClick={() => setMinimized(false)}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
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
            opacity: 0.75,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.75';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
          title={`Open ${teacher.name}`}
        >
          {teacher.emoji}
        </button>
      )}

      {/* Main Avatar Container */}
      {!shouldHideVisually && (
        <div
          onMouseEnter={(e) => {
            if (!isEnlarged && !isCentered) {
              e.currentTarget.style.opacity = '1';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEnlarged && !isCentered) {
              e.currentTarget.style.opacity = '0.75';
            }
          }}
          style={isEnlarged ? {
            position: 'fixed',
            bottom: '12.5%',
            right: '12.5%',
            width: '75%',
            height: '75%',
            zIndex: 1000,
            borderRadius: 24,
            overflow: 'visible',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 50px rgba(79,70,229,0.4)',
            border: '3.5px solid var(--accent)',
            background: 'var(--bg2)',
            transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            display: minimized ? 'none' : 'block',
          } : isCentered ? {
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
            transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            display: minimized ? 'none' : 'block',
          } : {
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            height: 420,
            zIndex: 100,
            borderRadius: 20,
            overflow: 'visible',
            boxShadow: 'var(--shadow-xl)',
            border: '1.5px solid var(--border)',
            background: 'var(--bg2)',
            transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            display: minimized ? 'none' : 'block',
            opacity: 0.75,
          }}
        >
          {/* Relative wrapper so overlays can be positioned inside */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
                  showSpeechBubble={tourActive || !!celebEvent ? false : showSpeechBubble}
                  setShowSpeechBubble={setShowSpeechBubble}
                  onboardingStep={onboardingStep}
                  setOnboardingStep={setOnboardingStep}
                  onTabShift={(path) => router.push(path)}
                  onEnlarge={(val) => setIsEnlarged(val)}
                />

              </Suspense>
            </div>

            {/* Tour Overlay — rendered on top of the 3D widget */}
            <TourOverlay />

            {/* Congratulations Overlay */}
            <CongratCard />
          </div>
        </div>
      )}
    </>
  );
}


type NavLeaf  = { href: string; icon: string; label: string; badge?: boolean };
type NavGroup = { label: string; icon: string; children: NavLeaf[] };
type NavNode  = NavLeaf | NavGroup;
type NavSection = { section: string; items: NavNode[] };

const isGroup = (n: NavNode): n is NavGroup => 'children' in n;

// ── Student: Redesigned Active V1 tabs ──
const STUDENT_NAV: NavSection[] = [
  { section: 'PinIT Career OS', items: [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/portfolio', icon: '👤', label: 'Portfolio' },
    { href: '/projects', icon: '💼', label: 'Industry Projects' },
    { href: '/internships', icon: '🏢', label: 'Internship Tracker' },
    { href: '/learning', icon: '📖', label: 'Learning Roadmap' },
    { href: '/placement', icon: '🎯', label: 'Placement Predictor' },
    { href: '/passport', icon: '🎫', label: 'Skill Passport' },
    { href: '/quests', icon: '🗺', label: 'Quests' },
    { href: '/career-dna', icon: '🧬', label: 'Career DNA' },
    { href: '/interview', icon: '🎙', label: 'AI Interview' },
    { href: '/missions', icon: '⚡', label: 'Missions' },
    { href: '/career-twin', icon: '🧬', label: 'Career Twin' },
    { href: '/group-discussion', icon: '💬', label: 'GD Practice' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/documents', icon: '📂', label: 'Document Vault' }
  ]}
];

const RIGHT_NAV: { id: string; href?: string; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'exams', icon: '📝', label: 'My Exams' },
  { id: 'results', icon: '📊', label: 'My Results' },
  { id: 'notes', icon: '📚', label: 'Study Notes' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'contact', icon: '💬', label: 'Contact Admin' },
  
  // Shifted student services:
  { id: 'services', href: '/services', icon: '💼', label: 'Student Services' },
  // Shifted student experience:
  { id: 'library', href: '/library', icon: '📚', label: 'Library Center' },
  { id: 'hostel', href: '/hostel', icon: '🏢', label: 'Hostel Hub' },
  { id: 'transport', href: '/transport', icon: '🚌', label: 'Transit Desk' },
  { id: 'events', href: '/events', icon: '🎉', label: 'Campus Events' },
  { id: 'grievances', href: '/grievances', icon: '⚖️', label: 'Grievance Desk' },
  // Shifted from Faculty studio:
  { id: 'mentors', href: '/profile', icon: '👩‍🏫', label: 'My Mentors' },
  { id: 'research', href: '/research', icon: '🔬', label: 'Research Desk' },
  // Shifted career intelligence:
  { id: 'ats', href: '/applications', icon: '📄', label: 'ATS Pipeline' },
  { id: 'internship', href: '/opportunities', icon: '🎯', label: 'Internships' },
  // Shifted operations:
  { id: 'finance', href: '/finance', icon: '💳', label: 'Finance & Fees' },
  { id: 'infrastructure', href: '/maintenance', icon: '🔧', label: 'Infrastructure' },
  // Shifted intelligence center:
  { id: 'advisor', href: '/advisor', icon: '🧠', label: 'AI Academic Advisor' }
];

const ADMIN_NAV: NavSection[] = [
  { section: 'PinIT Career OS', items: [
    { href: '/admin', icon: '🏠', label: 'Dashboard' },
    { label: 'Campus Core', icon: '🎓', children: [
      { href: '/admissions', icon: '🎟️', label: 'Admissions' },
      { href: '/admin/students', icon: '🧑‍🎓', label: 'Students Directory' },
      { href: '/admin/exams', icon: '📝', label: 'Exam Manager' },
      { href: '/admin', icon: '📄', label: 'Document Vault' },
      { href: '/admin', icon: '💼', label: 'Student Services' }
    ]},
    { label: 'Student Experience', icon: '🎒', children: [
      { href: '/admin', icon: '📚', label: 'Library' },
      { href: '/admin', icon: '🏢', label: 'Hostel Desk' },
      { href: '/admin', icon: '🚌', label: 'Transport' },
      { href: '/admin', icon: '🎉', label: 'Events Registry' },
      { href: '/admin', icon: '🔔', label: 'Broadcast Admin' },
      { href: '/admin', icon: '⚖️', label: 'Grievance Review' }
    ]},
    { label: 'Faculty Studio', icon: '👨‍🏫', children: [
      { href: '/admin/teacher', icon: '👩‍🏫', label: 'Faculty Manager' },
      { href: '/admin', icon: '🔬', label: 'Research Projects' },
      { href: '/quests/teacher-select', icon: '🗺', label: 'Quest Selector' },
      { href: '/admin', icon: '💼', label: 'HR & Clock Logs' }
    ]},
    { label: 'Career Intelligence', icon: '🚀', children: [
      { href: '/career-dna', icon: '🧬', label: 'Career DNA' },
      { href: '/career-builder', icon: '🛠️', label: 'Resume Builder' },
      { href: '/recruiter', icon: '🔍', label: 'ATS Pipelines' },
      { href: '/interview', icon: '🎙', label: 'AI Interview' },
      { href: '/missions', icon: '⚡', label: 'Coding Missions' },
      { href: '/quests', icon: '🗺', label: 'Coding Quests' },
      { href: '/crm', icon: '💼', label: 'Company CRM' }
    ]},
    { label: 'Campus Operations', icon: '🏢', children: [
      { href: '/admin', icon: '💳', label: 'Finance Console' },
      { href: '/admin', icon: '🛒', label: 'Procurement PO' },
      { href: '/admin', icon: '📦', label: 'Asset Management' },
      { href: '/admin', icon: '🔧', label: 'Infrastructure Maintenance' }
    ]},
    { label: 'Administration', icon: '⚙', children: [
      { href: '/admin', icon: '👥', label: 'Users & Roles' },
      { href: '/university', icon: '🏫', label: 'Multi-campus Select' }
    ]},
    { label: 'Intelligence Center', icon: '📊', children: [
      { href: '/analytics', icon: '📊', label: 'Analytics' },
      { href: '/university', icon: '📋', label: 'Annual Reports' },
      { href: '/advisor', icon: '🧠', label: 'AI Advisor Logs' }
    ]},
    { label: 'Enterprise', icon: '🌐', children: [
      { href: '/integrations', icon: '🔌', label: 'API Integrations' },
      { href: '/admin/settings', icon: '⚡', label: 'Migration Wizard' },
      { href: '/admin/settings', icon: '🔑', label: 'API Gateway keys' }
    ]}
  ]}
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
  '/career-builder': 'Career Builder',
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

const PUBLIC_PATHS = ['/', '/signup', '/reset-password', '/qr-login', '/qr-confirm', '/onboarding', '/privacy', '/terms', '/contact', '/admissions'];

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

function DsaiAcademicTabWrapper({ tab, student, onStartExam, examCheckLoading }: any) {
  const academicStudent = {
    name: student?.displayName || 'demo',
    registerNumber: student?.registerNumber || 'BGS2024001',
    batch: student?.batch || 'Batch 4',
  };
  switch (tab) {
    case 'home':
      return <HomeTab student={academicStudent} onStartExam={onStartExam} examCheckLoading={examCheckLoading} />;
    case 'exams':
      return <ExamsTab student={academicStudent} onStartExam={onStartExam} examCheckLoading={examCheckLoading} />;
    case 'results':
      return <ResultsTab student={academicStudent} />;
    case 'notes':
      return <NotesTab student={academicStudent} />;
    case 'notifications':
      return <NotificationsTab student={academicStudent} />;
    case 'contact':
      return <ContactTab student={academicStudent} />;
    default:
      return null;
  }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname              = usePathname();
  const router                = useRouter();
  const { user, loading, logout } = useAuth();
  const { profile, refresh: refreshProfile } = useCareerProfile();
  const { data: notifData }   = useNotifications();
  const wsConnected           = useAppStore(s => s.wsConnected);
  const { colorMap }          = useBatches();

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
    onboardingStep,
    isLoaded,
  } = cOS;

  const isRedirectingRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [liteUiMode, setLiteUiMode] = useState(false);
  const [isGdCall, setIsGdCall] = useState(false);
  const [isRoleplayParamActive, setIsRoleplayParamActive] = useState(false);

  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [activeAcademicTab, setActiveAcademicTab] = useState<string | null>(null);
  const [pendingExam, setPendingExam] = useState<any>(null);
  const [examScreen, setExamScreen] = useState<'dashboard' | 'exam-start' | 'exam'>('dashboard');
  const [examCheckLoading, setExamCheckLoading] = useState(false);

  useEffect(() => {
    setActiveAcademicTab(null);
  }, [pathname]);

  const handleStartExamRequest = async (examSchedule: any) => {
    setExamCheckLoading(true);
    const { DB: dsaiDB } = await import('@/lib/dsaiFirebase');
    try {
      const results = await dsaiDB.getAll('exam_results');
      const alreadyDone = results.find(
        (r: any) => r.registerNumber === (user?.registerNumber || 'BGS2024001') && r.examScheduleId === examSchedule.id
      );
      if (alreadyDone) {
        toast.warning('Attempt Blocked', 'You have already attempted this exam.');
        return;
      }
      setPendingExam(examSchedule);
      setExamScreen('exam-start');
    } catch (err: any) {
      toast.error('Error checking exam', err.message);
    } finally {
      setExamCheckLoading(false);
    }
  };

  const handleExamFinished = async (result: any) => {
    setPendingExam(null);
    setExamScreen('dashboard');
  };

  // Global Study notebook states for Quests & Lessons
  const [questId, setQuestId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesContent, setNotesContent] = useState('');

  // Extract questId from pathname or query params dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get('questId') || window.location.pathname.split('/').pop() || null;
      setQuestId(qId);
    }
  }, [pathname]);

  // Dynamically observe search parameter changes for the group discussion call or roleplay active state to toggle full screen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkCallAndRoleplay = () => {
      const activeCall = window.location.pathname.startsWith('/group-discussion') && window.location.search.includes('call=true');
      setIsGdCall(activeCall);

      const activeRoleplay = window.location.pathname.startsWith('/missions') && window.location.search.includes('roleplay=true');
      setIsRoleplayParamActive(activeRoleplay);
    };
    checkCallAndRoleplay();
    window.addEventListener('popstate', checkCallAndRoleplay);
    const interval = setInterval(checkCallAndRoleplay, 200);
    return () => {
      window.removeEventListener('popstate', checkCallAndRoleplay);
      clearInterval(interval);
    };
  }, [pathname]);

  // Load notes dynamically when questId changes
  useEffect(() => {
    if (questId) {
      const saved = localStorage.getItem(`pinit_lesson_notes_${questId}`);
      setNotesContent(saved || '');
    } else {
      setNotesContent('');
    }
  }, [questId]);

  const handleNotesChange = (text: string) => {
    setNotesContent(text);
    if (questId) {
      localStorage.setItem(`pinit_lesson_notes_${questId}`, text);
    }
  };

  const handleSnapshotCode = () => {
    if (typeof window === 'undefined') return;
    const code = (window as any).__activeSlideCode;
    const slideNum = (window as any).__activeSlideNum || 1;
    if (code) {
      const updatedNotes = notesContent + `\n\n[Code Snapshot - Slide ${slideNum}]:\n\`\`\`java\n${code}\n\`\`\`\n`;
      handleNotesChange(updatedNotes);
      toast.success("Snapshot Saved", "Slide code has been added to your notes!");
    } else {
      toast.error("No Code", "This slide does not contain a code snippet.");
    }
  };

  const cleanPath = pathname?.replace(/\/$/, '') || '';
  const isLessonOrDetail = cleanPath === '/quests/lesson' || (cleanPath.startsWith('/quests/') && cleanPath !== '/quests/teacher-select' && cleanPath !== '/quests');
  const isGroupDiscussionCall = isGdCall;
  const isRoleplayActive = isRoleplayParamActive;
  const effectiveFocusMode = focusMode || isLessonOrDetail || isGroupDiscussionCall || isRoleplayActive;

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      try {
        const saved = localStorage.getItem(`pinit_${user.id}_lite_ui_mode`);
        if (saved) {
          setLiteUiMode(JSON.parse(saved));
        }
      } catch {}
    }
  }, [user]);

  const isPublic    = pathname === '/' || PUBLIC_PATHS.filter(p => p !== '/').some(p => pathname.startsWith(p));
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

  // Reset redirecting ref on pathname or user change
  useEffect(() => {
    isRedirectingRef.current = false;
  }, [pathname, user]);

  // Redirect students who have not completed onboarding (onboardingStep < 3) to /onboarding
  // Guarded by context loading state (isLoaded) to prevent race conditions during page reload
  useEffect(() => {
    if (!loading && isLoaded && user && isStudent && !isPublic && pathname !== '/onboarding') {
      if (onboardingStep < 3) {
        if (isRedirectingRef.current) return;
        isRedirectingRef.current = true;
        console.warn("[AppShell] Redirecting to /onboarding because onboardingStep is:", onboardingStep);
        router.push('/onboarding');
      }
    }
  }, [user, loading, isLoaded, isStudent, isPublic, onboardingStep, router, pathname]);

  // Redirect unauthenticated users to /
  useEffect(() => {
    if (!loading && user === null && !isPublic) {
      router.push('/?login=true');
    }
  }, [user, loading, isPublic, router]);

  const isOnboarding = pathname === '/onboarding';
  if (isPublic || isOnboarding) return <>{children}</>;

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
        onClick={() => {
          setActiveAcademicTab(null);
        }}
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
        className={`sidebar${collapsed || effectiveFocusMode ? ' collapsed' : ''}${mobileOpen ? ' open' : ''}`}
        style={{
          width: effectiveFocusMode ? 0 : (collapsed ? '68px' : 'var(--sidebar-w)'),
          borderRight: effectiveFocusMode ? 'none' : '1px solid var(--border)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), border 0.25s',
          overflow: 'hidden'
        }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <Link
            href="/dashboard"
            onClick={() => setActiveAcademicTab(null)}
            style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10 }}
          >
            <div className="logo-mark">Pi</div>
            {!collapsed && !effectiveFocusMode && (
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
            return (
              <div key={sec.section}>
                {!collapsed && !effectiveFocusMode && <div className="nav-section-label">{sec.section}</div>}
                {sec.items.map(item =>
                  isGroup(item)
                    ? <NavGroupHeader key={item.label} group={item} />
                    : <NavLink key={item.href} {...item} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {BOTTOM_NAV.map(it => <NavLink key={it.href} {...it} />)}

          {collapsed && !effectiveFocusMode && (
            <button onClick={() => { setCollapsed(false); setRightCollapsed(true); }} className="nav-item" style={{ justifyContent:'center', marginTop:6 }} title="Expand (⌘[)">
              <span className="nav-icon">›</span>
            </button>
          )}

          {!collapsed && !effectiveFocusMode && isStudent && (
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

          {!collapsed && !effectiveFocusMode && !cOS.demoTabsUnlocked && (
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

          {!collapsed && !effectiveFocusMode && (
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
              <button onClick={() => logout().then(() => router.push('/'))}
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
        <header className="topbar" style={{ display: (isLessonOrDetail || isGroupDiscussionCall || isRoleplayActive) ? 'none' : 'flex' }}>
          {/* Mobile burger */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="mobile-menu-btn"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t2)', fontSize:18, padding:4, borderRadius:6, display:'none' }}>
            ☰
          </button>

          {/* If focusMode is active, allow returning with a floating action bar brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {effectiveFocusMode && (
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
          {isStudent && !effectiveFocusMode && (
            <div className="topbar-scores" style={{ display:'flex', gap:6, alignItems:'center' }}>
              {[
                { icon:'Career', val:careerScore, color:'var(--teal)' },
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
            {/* Lite UI Mode Toggle Button */}
            {isStudent && (
              <button 
                onClick={() => setLiteUiMode(prev => {
                  const next = !prev;
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(`pinit_${user.id}_lite_ui_mode`, JSON.stringify(next));
                  }
                  toast.info(next ? 'Lite Mode Active 💬' : 'Cockpit Mode Active 🖥️', next ? 'Guided conversational UI loaded.' : 'Standard telemetry graphs restored.');
                  return next;
                })} 
                title={liteUiMode ? 'Switch to Cockpit Dashboard' : 'Switch to Conversational Lite UI'}
                style={{
                  background: liteUiMode ? 'rgba(20,184,166,0.1)' : 'var(--bg3)', 
                  border: liteUiMode ? '1px solid rgba(20,184,166,0.3)' : '1px solid var(--border)', 
                  borderRadius: '50%', width: 28, height: 28, display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  fontSize: 12, outline: 'none', transition: 'all 0.15s ease'
                }}
              >
                {liteUiMode ? '💬' : '🖥️'}
              </button>
            )}

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
                title={effectiveFocusMode ? 'Deactivate Focus Mode' : 'Activate Focus Mode'}
                style={{
                  background: effectiveFocusMode ? 'rgba(220,38,38,0.1)' : 'var(--bg3)', 
                  border: effectiveFocusMode ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--border)', 
                  borderRadius: 20, padding: '3px 12px', display: 'flex', 
                  alignItems: 'center', gap: 4, cursor: 'pointer',
                  fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: effectiveFocusMode ? 'var(--coral)' : 'var(--t2)', outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🤫</span> {!effectiveFocusMode && <span style={{ fontSize: 10 }}>Focus</span>}
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
            padding: (isGroupDiscussionCall || isRoleplayActive) ? '20px' : (isLessonOrDetail ? '0px' : (effectiveFocusMode ? '40px 60px' : '20px 24px')),
            maxWidth: (isGroupDiscussionCall || isRoleplayActive) ? '95%' : (isLessonOrDetail ? '100%' : (effectiveFocusMode ? 960 : '100%')),
            margin: (isLessonOrDetail || isGroupDiscussionCall || isRoleplayActive) ? '0 auto' : (effectiveFocusMode ? '0 auto' : '0'),
            width: '100%',
            transition: 'padding 0.25s, max-width 0.25s'
          }}
        >
          {isStudent && activeAcademicTab ? (
            examScreen === 'exam' ? (
              <ToastProvider>
                <ExamEngine
                  exam={pendingExam}
                  student={{
                    name: user?.displayName || 'demo',
                    registerNumber: user?.registerNumber || 'BGS2024001',
                    batch: user?.batch || 'Batch 4',
                  }}
                  onFinish={handleExamFinished}
                />
              </ToastProvider>
            ) : (
              <>
                <DsaiAcademicTabWrapper tab={activeAcademicTab} student={user} onStartExam={handleStartExamRequest} examCheckLoading={examCheckLoading} />
                {pendingExam && examScreen === 'exam-start' && (
                  <ToastProvider>
                    <ExamStartModal
                      exam={pendingExam}
                      student={{
                        name: user?.displayName || 'demo',
                        registerNumber: user?.registerNumber || 'BGS2024001',
                        batch: user?.batch || 'Batch 4',
                      }}
                      onConfirm={() => setExamScreen('exam')}
                      onCancel={() => { setPendingExam(null); setExamScreen('dashboard'); }}
                    />
                  </ToastProvider>
                )}
              </>
            )
          ) : liteUiMode && pathname === '/dashboard' && isStudent ? (
            <LiteChatInterface />
          ) : (
            children
          )}
        </main>
      </div>

      {/* Right Sidebar */}
      {isStudent && !effectiveFocusMode && (
        <aside
          className={`sidebar right-sidebar${rightCollapsed ? ' collapsed' : ''}`}
          style={{
            width: rightCollapsed ? '68px' : '215px',
            background: 'var(--bg-sidebar)',
            borderLeft: '1px solid var(--border)',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), border 0.25s',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            boxShadow: '-2px 0 12px rgba(37,99,235,0.04)',
            zIndex: 10
          }}
        >
          {/* Header */}
          {!rightCollapsed ? (
            <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)' }}>BGS Academic</div>
              <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Portal</div>
            </div>
          ) : (
            <div style={{ padding: '16px 0 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#2563eb' }}>
              BGS
            </div>
          )}

          {/* Student Info Card */}
          {!rightCollapsed ? (
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(37,99,235,0.04), var(--bg2))', textAlign: 'center' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 20, color: 'white', border: '2px solid var(--bg-sidebar)', boxShadow: '0 2px 10px rgba(37,99,235,0.15)', overflow: 'hidden' }}>
                👤
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'demo'}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 6, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || 'demo'}</div>
              {(() => {
                const batchName = (user as any)?.batch || 'Batch 4';
                const batchColor = colorMap[batchName] || '#2563eb';
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${batchColor}15`, border: `1px solid ${batchColor}30`, borderRadius: 20, padding: '3px 10px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: batchColor, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: batchColor }}>{batchName}</span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.1)' }}>
                👤
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav style={{ flex: 1, padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {RIGHT_NAV.map(item => {
              const active = item.href ? isPathActive(pathname, item.href) : activeAcademicTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.href) {
                      setActiveAcademicTab(null);
                      router.push(item.href);
                    } else {
                      setActiveAcademicTab(item.id);
                    }
                    setRightCollapsed(false);
                    setCollapsed(true);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: rightCollapsed ? 'center' : 'flex-start',
                    gap: rightCollapsed ? 0 : 9,
                    padding: '9px 10px',
                    background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                    borderRadius: 9,
                    cursor: 'pointer',
                    color: active ? '#1d4ed8' : 'var(--t2)',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    transition: 'all 0.15s',
                    outline: 'none',
                    textAlign: 'left',
                    flexShrink: 0
                  }}
                  title={item.label}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  {!rightCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Collapse Toggle Button */}
          <div style={{ padding: '8px 7px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => {
                const next = !rightCollapsed;
                setRightCollapsed(next);
                if (!next) {
                  setCollapsed(true);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 10px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                cursor: 'pointer',
                color: 'var(--t3)',
                fontSize: 14,
                outline: 'none'
              }}
            >
              {rightCollapsed ? '‹' : '›'}
            </button>
          </div>
        </aside>
      )}

      {isStudent && (
        <GlobalAvatar user={user} profile={profile} refreshProfile={refreshProfile} />
      )}

      {/* Global Study Notebook Drawer for Active Quests / Lessons */}
      {isLessonOrDetail && (
        <>
          {/* Floating Study Notes Toggle Button */}
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 99999, // Render at top-level z-index
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'transform 0.2s',
              outline: 'none'
            }}
            title="Open Study Notes Drawer"
          >
            {notesOpen ? '✖' : '📓'}
          </button>

          {/* Slide-out Study Notes Drawer */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: notesOpen ? 0 : -340,
            width: 320,
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid var(--border)',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
            zIndex: 99998,
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--t1)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span>📓</span> Study Notebook
              </h3>
              <button
                onClick={() => setNotesOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--t3)', fontSize: 13, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.4, margin: 0 }}>
              Take notes during this quest. They are saved to local storage and carry over between lecture slides and coding assignments automatically!
            </p>

            {pathname === '/quests/lesson' && (
              <button
                onClick={handleSnapshotCode}
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  color: 'var(--t2)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  outline: 'none'
                }}
              >
                📷 Snapshot Slide Code
              </button>
            )}

            <textarea
              value={notesContent}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Start typing your study notes here..."
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 12,
                color: 'var(--t1)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        </>
      )}

    </div>
  );
}
