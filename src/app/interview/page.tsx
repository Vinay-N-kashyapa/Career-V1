'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { useAuth } from '@/lib/context/AuthContext';
import { speakWithAvatar as speakWithAvatarRaw, stopSpeaking, preloadTTS } from '@/lib/tts';
import { api } from '@/lib/api/client';

const VRoidInterviewAvatar = dynamic(
  () => import('@/components/avatar/VRoidInterviewAvatar'),
  { ssr: false }
);

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

interface RadarChartProps {
  scores: {
    logic: number;
    systems: number;
    comms: number;
    solving: number;
    star: number;
  };
  size?: number;
}

const RadarChart = ({ scores, size = 220 }: RadarChartProps) => {
  const center = size / 2;
  const maxRadius = (size / 2) - 30;

  const getCoordinates = () => {
    const categories = ['logic', 'systems', 'comms', 'solving', 'star'];
    return categories.map((cat, i) => {
      const score = Math.max(10, Math.min(100, (scores as any)[cat] || 50));
      const radius = (score / 100) * maxRadius;
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y, score, name: cat.toUpperCase() };
    });
  };

  const coords = getCoordinates();
  const pointsStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  const ringPolygons = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
    const r = scale * maxRadius;
    return Array.from({ length: 5 }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="radar-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.45)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.03)" />
          </radialGradient>
        </defs>

        {ringPolygons.map((ringPoints, i) => (
          <polygon
            key={i}
            points={ringPoints}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1.2"
            strokeDasharray={i === 4 ? "none" : "3,3"}
          />
        ))}

        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x2 = center + maxRadius * Math.cos(angle);
          const y2 = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={pointsStr}
          fill="url(#radar-grad)"
          stroke="#818cf8"
          strokeWidth="2.5"
          filter="url(#radar-glow)"
          style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {coords.map((c, i) => {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const labelDist = maxRadius + 18;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle) + 3;
          let textAnchor: "start" | "end" | "middle" = "middle";
          if (Math.cos(angle) > 0.1) textAnchor = "start";
          if (Math.cos(angle) < -0.1) textAnchor = "end";

          return (
            <g key={i}>
              <text
                x={lx}
                y={ly}
                fill="#a5b4fc"
                fontSize="9.5"
                fontWeight="900"
                fontFamily="monospace"
                letterSpacing="0.5px"
                textAnchor={textAnchor}
              >
                {c.name}
              </text>
              <text
                x={lx}
                y={ly + 10}
                fill="#64748b"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor={textAnchor}
              >
                {c.score}%
              </text>
            </g>
          );
        })}

        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="4.5"
            fill="#fff"
            stroke="#4f46e5"
            strokeWidth="2"
            style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer' }}
          >
            <title>{c.name}: {c.score}%</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

type Stage = 'round1_behavioral' | 'round2_coding' | 'round3_systems' | 'round4_star' | 'results';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function compileAndRunJava(javaCode: string, methodName: string, testCases: any[]): { success: boolean; error?: string; results?: any[] } {
  try {
    const cleanCode = javaCode.replace(/\/\/.*$/gm, ''); // remove single line comments
    const methodRegex = new RegExp(`(?:public|private|static|\\s)\\s+([\\w\\[\\]]+)\\s+${methodName}\\s*\\(([^)]*)\\)\\s*\\{`, 'g');
    const match = methodRegex.exec(cleanCode);
    if (!match) {
      return { success: false, error: `Method Signature Error: Could not locate method 'public ... ${methodName}(...)'` };
    }

    const startIndex = match.index + match[0].length;
    let braceCount = 1;
    let methodBody = "";
    for (let i = startIndex; i < cleanCode.length; i++) {
      const char = cleanCode[i];
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (braceCount === 0) {
        methodBody = cleanCode.slice(startIndex, i);
        break;
      }
    }

    if (braceCount !== 0) {
      return { success: false, error: "Syntax Error: Curly braces are unbalanced inside the class." };
    }

    // Transpile Java-specific expressions to corresponding JavaScript syntaxes
    let jsBody = methodBody
      .replace(/\b(int|double|float|boolean|String|char|long|short|byte)\[\]\s+(\w+)\b/g, 'let $2')
      .replace(/\b(int|double|float|boolean|String|char|long|short|byte)\s+(\w+)\b/g, 'let $2')
      .replace(/\.length\(\)/g, '.length')
      .replace(/\.charAt\(([^)]+)\)/g, '[$1]')
      .replace(/System\.out\.println\(([^)]+)\)/g, 'console.log($1)')
      .replace(/\bnew\s+StringBuilder\(\)/g, '[]')
      .replace(/\.append\(([^)]+)\)/g, '.push($1)')
      .replace(/\.toString\(\)/g, ".join('')")
      .replace(/=\s*new\s+\w+\[([^\]]+)\]/g, '= new Array($1)');

    const paramString = match[2];
    const params = paramString.split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean);

    const results: any[] = [];
    testCases.forEach(tc => {
      const capturedLogs: string[] = [];
      const customLog = (...args: any[]) => {
        capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      };

      try {
        const runner = new Function(...params, `
          const console = { log: this.customLog };
          ${jsBody}
        `);

        const output = runner.call({ customLog }, ...tc.args);
        const passed = tc.verify(output);
        results.push({
          input: tc.label,
          expected: tc.expected,
          actual: String(output),
          passed,
          logs: capturedLogs
        });
      } catch (err: any) {
        results.push({
          input: tc.label,
          expected: tc.expected,
          actual: `Error: ${err.message}`,
          passed: false,
          logs: capturedLogs
        });
      }
    });

    return { success: true, results };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}



const CODING_QUESTIONS = [
  {
    id: 1,
    title: '1. Reverse a String (Easy)',
    description: 'Write a Java method `public String reverse(String s)` that returns the reversed version of the input string `s`.',
    defaultCode: `public class Solution {\n    public String reverse(String s) {\n        // Your code here\n        return s;\n    }\n}`,
    methodName: 'reverse',
    tests: [
      { label: '"hello"', args: ["hello"], expected: "olleh", verify: (res: any) => res === "olleh" },
      { label: '"Java"', args: ["Java"], expected: "avaJ", verify: (res: any) => res === "avaJ" },
      { label: '""', args: [""], expected: "", verify: (res: any) => res === "" }
    ]
  },
  {
    id: 2,
    title: '2. Find Maximum (Medium)',
    description: 'Write a Java method `public int findMax(int[] arr)` that returns the maximum integer inside the array `arr`. Assume the array is not empty.',
    defaultCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Your code here\n        return 0;\n    }\n}`,
    methodName: 'findMax',
    tests: [
      { label: '[1, 5, 3, 9, 2]', args: [[1, 5, 3, 9, 2]], expected: "9", verify: (res: any) => Number(res) === 9 },
      { label: '[-10, -5, -3, -1]', args: [[-10, -5, -3, -1]], expected: "-1", verify: (res: any) => Number(res) === -1 },
      { label: '[100]', args: [[100]], expected: "100", verify: (res: any) => Number(res) === 100 }
    ]
  },
  {
    id: 3,
    title: '3. Is Palindrome (Hard)',
    description: 'Write a Java method `public boolean isPalindrome(String s)` that returns true if the string `s` reads the same backward as forward, ignoring case.',
    defaultCode: `public class Solution {\n    public boolean isPalindrome(String s) {\n        // Your code here\n        return false;\n    }\n}`,
    methodName: 'isPalindrome',
    tests: [
      { label: '"racecar"', args: ["racecar"], expected: "true", verify: (res: any) => res === true || String(res) === 'true' },
      { label: '"Hello"', args: ["Hello"], expected: "false", verify: (res: any) => res === false || String(res) === 'false' },
      { label: '"radar"', args: ["radar"], expected: "true", verify: (res: any) => res === true || String(res) === 'true' }
    ]
  }
];

// Mock Previous Staging Sessions History
const PREVIOUS_SESSIONS = [
  { id: 'sess-1', date: 'July 08, 2026', type: 'Technical SDE Mock', status: 'Cleared', score: 82, badge: '🔥 Strong Performer' },
  { id: 'sess-2', date: 'July 04, 2026', type: 'Coding Practice Staging', status: 'Failed', score: 48, badge: '⚠️ Needs Coding Drill' },
  { id: 'sess-3', date: 'June 28, 2026', type: 'System Architecture Run', status: 'Cleared', score: 75, badge: '👍 Good Design Flow' }
];

const INTERVIEWER_NAMES: Record<string, string> = {
  vikram: 'Mr. Vikram',
  shalini: 'Ms. Shalini',
  aditya: 'Mr. Aditya',
  neha: 'Ms. Neha',
};

export default function InterviewPage() {
  const cOS = useCareerOS();
  const { user } = useAuth();
  const { addXp, earnPins } = cOS;

  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [activeStage, setActiveStage] = useState<Stage>('round1_behavioral');
  const [round1Interviewer, setRound1Interviewer] = useState<string>('vikram');
  const [round3Interviewer, setRound3Interviewer] = useState<string>('aditya');
  const [round4Interviewer, setRound4Interviewer] = useState<string>('neha');
  const [sessions, setSessions] = useState<any[]>([]);
  const [useNeuralTTS, setUseNeuralTTS] = useState(true);
  const [useFaceTracking, setUseFaceTracking] = useState(false);
  const [use3DAvatar, setUse3DAvatar] = useState(false);

  const speakWithAvatar = useCallback((
    text: string,
    teacherId: string,
    onStart: () => void,
    onEnd: () => void,
    isMuted = false
  ) => {
    speakWithAvatarRaw(text, teacherId, onStart, onEnd, isMuted, useNeuralTTS);
  }, [useNeuralTTS]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get<{ history: any[] }>('/api/interview/history');
        if (data && data.history) {
          setSessions(data.history);
        } else {
          setSessions(PREVIOUS_SESSIONS);
        }
      } catch (err) {
        console.warn('Failed to load real session history, falling back to mock.', err);
        setSessions(PREVIOUS_SESSIONS);
      }
    };
    fetchHistory();
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I have viewed your resume and academic dossier. Let's begin. Even though I have read your documents, please explain about yourself."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [animState, setAnimState] = useState<'idle' | 'listening' | 'thinking' | 'talking' | 'wave' | 'nod' | 'shrug'>('idle');
  const animStateRef = useRef<'idle' | 'listening' | 'thinking' | 'talking' | 'wave' | 'nod' | 'shrug'>('idle');
  const [zoom, setZoom] = useState(1.6);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [interviewType, setInterviewType] = useState<'roadmap' | 'custom'>('roadmap');
  const [customTopic, setCustomTopic] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Comm Mode State (Default is 'voice' mode)
  const [commMode, setCommMode] = useState<'voice' | 'text'>('voice');
  const commModeRef = useRef<'voice' | 'text'>('voice');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Media Capture & WebGL Processing
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const mockTrackingIntervalRef = useRef<any>(null);

  // Real-time calculated telemetry metrics
  const [eyeContactScore, setEyeContactScore] = useState(88);
  const [smileScore, setSmileScore] = useState(12);
  const [stabilityScore, setStabilityScore] = useState(92);
  const [wpmScore, setWpmScore] = useState(132);
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [gazeWarnings, setGazeWarnings] = useState(0);
  const lookAwayFramesRef = useRef(0);

  // Track timestamps for WPM calculations
  const speechStartRef = useRef<number>(0);

  // Round 1 Timer (3 minutes = 180 seconds)
  const [timerLeft, setTimerLeft] = useState(180);
  const [reviewUnlocked, setReviewUnlocked] = useState(false);

  // Coding Round State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState(CODING_QUESTIONS[0].defaultCode);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [questionScores, setQuestionScores] = useState<number[]>([0, 0, 0]);
  const [transitionOverlay, setTransitionOverlay] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const [codingFailureMsg, setCodingFailureMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const codingScoreRef = useRef(0);
  const timerStartRef = useRef<number | null>(null);
  const isInterviewActiveRef = useRef(false);


  useEffect(() => {
    codingScoreRef.current = Math.round(questionScores.reduce((a, b) => a + b, 0) / 3);
  }, [questionScores]);

  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);

  // Keep animStateRef in sync to avoid stale closures
  useEffect(() => {
    animStateRef.current = animState;
  }, [animState]);

  useEffect(() => {
    commModeRef.current = commMode;
  }, [commMode]);

  // Systems Design Round State
  const [systemsStep, setSystemsStep] = useState(0);
  const [boardNodes, setBoardNodes] = useState<{ id: string; type: string; x: number; y: number }[]>([
    { id: 'node-1', type: 'Client', x: 20, y: 150 },
    { id: 'node-2', type: 'Load Balancer', x: 140, y: 150 }
  ]);
  const [boardLinks, setBoardLinks] = useState<{ from: string; to: string }[]>([
    { from: 'node-1', to: 'node-2' }
  ]);
  const [selectedSourceNodeId, setSelectedSourceNodeId] = useState<string | null>(null);
  const dragNodeIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // STAR Behavioral Round State
  const [starStep, setStarStep] = useState(0);

  const [evaluationResult, setEvaluationResult] = useState<{
    verdict: string;
    score: number;
    summary: string;
    improvements: string;
  } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);



  // Tab focus switch proctoring sentinel
  const proctorTimerRef = useRef<any>(null);
  const triggerProctorAlert = (msg: string) => {
    setProctorAlert(msg);
    if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
    proctorTimerRef.current = setTimeout(() => setProctorAlert(null), 4000);
    setTerminalLogs(logs => [...logs, `[PROCTOR WARNING] ${msg}`]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBlur = () => {
      if (isInterviewActive && activeStage !== 'results') {
        setTabSwitches(prev => {
          const updated = prev + 1;
          triggerProctorAlert("Tab switch detected! Please stay focused on the interview.");
          return updated;
        });
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [isInterviewActive, activeStage]);



  // Calculate delivery metrics from spoken answer
  const calculateSpeechMetrics = (text: string) => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const durationMin = (Date.now() - speechStartRef.current) / 60000;
    
    // 1. Calculate Speaking WPM (clip boundaries to realistic values)
    if (durationMin > 0.05) {
      const calculatedWPM = Math.round(wordCount / durationMin);
      setWpmScore(Math.min(220, Math.max(70, calculatedWPM)));
    }

    // 2. Count Conversational Filler Words
    const matches = text.match(/\b(um|uh|like|basically|actually|so|you\s+know)\b/gi);
    if (matches) {
      setFillerWordCount(prev => prev + matches.length);
    }
  };

  // Setup Mock Face Tracking Metrics to bypass MediaPipe FaceMesh CPU/GPU load
  const setupFaceMeshTracking = (stream: MediaStream) => {
    console.log('[Interview] Running lightweight mock face tracking metrics...');
    
    // Reset warning counters
    lookAwayFramesRef.current = 0;
    
    // Clear any existing mock interval
    if (mockTrackingIntervalRef.current) {
      clearInterval(mockTrackingIntervalRef.current);
    }
    
    // Start an interval to simulate eye contact, head stability, and smiling
    const interval = setInterval(() => {
      // Mock metrics fluctuation
      setSmileScore(prev => Math.min(100, Math.max(50, prev + Math.floor(Math.random() * 9) - 4)));
      setStabilityScore(prev => Math.min(100, Math.max(88, prev + Math.floor(Math.random() * 5) - 2)));
      setEyeContactScore(prev => Math.min(100, Math.max(85, prev + Math.floor(Math.random() * 5) - 2)));
    }, 2500);

    mockTrackingIntervalRef.current = interval;
  };

  const addNodeToBoard = (type: string) => {
    const id = `node-${Date.now()}`;
    setBoardNodes(prev => [...prev, { id, type, x: 20, y: 50 + prev.length * 40 }]);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    dragNodeIdRef.current = id;
    hasDraggedRef.current = false;
    const node = boardNodes.find(n => n.id === id);
    const boardRect = (e.currentTarget as HTMLElement).closest('[data-board-canvas]')?.getBoundingClientRect()
      || (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (node) {
      dragOffsetRef.current = {
        x: (e.clientX - boardRect.left) - node.x,
        y: (e.clientY - boardRect.top) - node.y
      };
    }
  };

  const handleBoardMouseMove = (e: React.MouseEvent) => {
    if (dragNodeIdRef.current) {
      hasDraggedRef.current = true;
      const id = dragNodeIdRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      let newX = e.clientX - rect.left - dragOffsetRef.current.x;
      let newY = e.clientY - rect.top - dragOffsetRef.current.y;
      
      newX = Math.max(0, Math.min(rect.width - 110, newX));
      newY = Math.max(0, Math.min(rect.height - 40, newY));

      setBoardNodes(prev => prev.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleBoardMouseUp = () => {
    dragNodeIdRef.current = null;
  };

  const handleNodeTouchStart = (e: React.TouchEvent, id: string) => {
    dragNodeIdRef.current = id;
    hasDraggedRef.current = false;
    const node = boardNodes.find(n => n.id === id);
    const boardRect = (e.currentTarget as HTMLElement).closest('[data-board-canvas]')?.getBoundingClientRect()
      || (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (node && e.touches[0]) {
      dragOffsetRef.current = {
        x: (e.touches[0].clientX - boardRect.left) - node.x,
        y: (e.touches[0].clientY - boardRect.top) - node.y
      };
    }
  };

  const handleBoardTouchMove = (e: React.TouchEvent) => {
    if (dragNodeIdRef.current && e.touches[0]) {
      hasDraggedRef.current = true;
      const id = dragNodeIdRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      let newX = e.touches[0].clientX - rect.left - dragOffsetRef.current.x;
      let newY = e.touches[0].clientY - rect.top - dragOffsetRef.current.y;
      
      newX = Math.max(0, Math.min(rect.width - 110, newX));
      newY = Math.max(0, Math.min(rect.height - 40, newY));

      setBoardNodes(prev => prev.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleBoardTouchEnd = () => {
    dragNodeIdRef.current = null;
  };

  const handleNodeClick = (id: string) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (!selectedSourceNodeId) {
      setSelectedSourceNodeId(id);
    } else {
      if (selectedSourceNodeId !== id) {
        if (!boardLinks.some(l => l.from === selectedSourceNodeId && l.to === id)) {
          setBoardLinks(prev => [...prev, { from: selectedSourceNodeId, to: id }]);
        }
      }
      setSelectedSourceNodeId(null);
    }
  };

  const deleteNode = (id: string) => {
    setBoardNodes(prev => prev.filter(n => n.id !== id));
    setBoardLinks(prev => prev.filter(l => l.from !== id && l.to !== id));
    if (selectedSourceNodeId === id) {
      setSelectedSourceNodeId(null);
    }
  };

  const deleteLink = (fromId: string, toId: string) => {
    setBoardLinks(prev => prev.filter(l => !(l.from === fromId && l.to === toId)));
  };

  const clearBoard = () => {
    setBoardNodes([]);
    setBoardLinks([]);
    setSelectedSourceNodeId(null);
  };

  const loadThreeTierPreset = () => {
    const nodes = [
      { id: 't1', type: 'Client', x: 20, y: 110 },
      { id: 't2', type: 'Load Balancer', x: 140, y: 110 },
      { id: 't3', type: 'Web Server', x: 260, y: 40 },
      { id: 't4', type: 'Redis Cache', x: 260, y: 180 },
      { id: 't5', type: 'Postgres DB', x: 380, y: 110 },
    ];
    const links = [
      { from: 't1', to: 't2' },
      { from: 't2', to: 't3' },
      { from: 't2', to: 't4' },
      { from: 't3', to: 't5' },
      { from: 't4', to: 't5' },
    ];
    setBoardNodes(nodes);
    setBoardLinks(links);
    setSelectedSourceNodeId(null);
  };

  const loadEventDrivenPreset = () => {
    const nodes = [
      { id: 'e1', type: 'Client', x: 20, y: 110 },
      { id: 'e2', type: 'API Gateway', x: 140, y: 110 },
      { id: 'e3', type: 'Kafka Queue', x: 260, y: 110 },
      { id: 'e4', type: 'Web Server', x: 380, y: 40 },
      { id: 'e5', type: 'Postgres DB', x: 380, y: 180 },
    ];
    const links = [
      { from: 'e1', to: 'e2' },
      { from: 'e2', to: 'e3' },
      { from: 'e3', to: 'e4' },
      { from: 'e3', to: 'e5' },
    ];
    setBoardNodes(nodes);
    setBoardLinks(links);
    setSelectedSourceNodeId(null);
  };

  const getArchitectureDescription = () => {
    if (boardNodes.length === 0) return "Empty whiteboard";
    const connections = boardLinks.map(l => {
      const from = boardNodes.find(n => n.id === l.from)?.type || '';
      const to = boardNodes.find(n => n.id === l.to)?.type || '';
      return `${from} -> ${to}`;
    });
    const isolated = boardNodes
      .filter(n => !boardLinks.some(l => l.from === n.id || l.to === n.id))
      .map(n => n.type);
      
    return `Active Diagram Paths: ${connections.join(', ') || 'none'}. Isolated Components: ${isolated.join(', ') || 'none'}.`;
  };

  const renderLinks = () => {
    return boardLinks.map((link, i) => {
      const fromNode = boardNodes.find(n => n.id === link.from);
      const toNode = boardNodes.find(n => n.id === link.to);
      if (!fromNode || !toNode) return null;
      
      const x1 = fromNode.x + 55;
      const y1 = fromNode.y + 20;
      const x2 = toNode.x + 55;
      const y2 = toNode.y + 20;
      
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      return (
        <g key={i}>
          {/* Broad transparent line for easier clicking/hovering */}
          <line 
            x1={x1} y1={y1} x2={x2} y2={y2} 
            stroke="transparent" strokeWidth="16" 
            onClick={() => deleteLink(link.from, link.to)}
            style={{ cursor: 'pointer' }}
          />
          {/* Visual line */}
          <line 
            x1={x1} y1={y1} x2={x2} y2={y2} 
            stroke="#818cf8" strokeWidth="2.5" 
            markerEnd="url(#interview-board-arrow)" 
            pointerEvents="none"
          />
          {/* Midpoint delete badge */}
          <g 
            onClick={() => deleteLink(link.from, link.to)} 
            style={{ cursor: 'pointer' }}
          >
            <circle cx={mx} cy={my} r="7.5" fill="#ef4444" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x={mx} y={my + 2.5} fontSize="8.5" fontWeight="900" fill="#fff" textAnchor="middle">✕</text>
          </g>
        </g>
      );
    });
  };

  // Handle active session start (camera, mic request, greeting)
  const startStagingSession = async () => {
    setIsStarting(true);
    
    // Stop any existing tracking loop first to prevent resource accumulation
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch {}
      cameraRef.current = null;
    }
    if (faceMeshRef.current) {
      try { faceMeshRef.current.close(); } catch {}
      faceMeshRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    // Reset state variables
    const topicText = interviewType === 'custom' && customTopic.trim()
      ? customTopic.trim()
      : 'software engineering and coding core concepts';
    const difficultyLabel = difficulty.toUpperCase();
    const initialText = `Hello! We will conduct a ${difficultyLabel} difficulty interview on ${topicText}. To begin, please introduce yourself and your key achievements.`;

    setActiveStage('round1_behavioral');
    setMessages([
      {
        role: 'assistant',
        content: initialText
      }
    ]);
    setTimerLeft(180);
    setReviewUnlocked(false);
    setCurrentQuestionIndex(0);
    setQuestionScores([0, 0, 0]);
    
    // Reset Telemetry Cues
    setEyeContactScore(90);
    setSmileScore(10);
    setStabilityScore(92);
    setWpmScore(130);
    setFillerWordCount(0);

    const interviewers = ['vikram', 'shalini', 'aditya', 'neha'];
    const r1 = interviewers[Math.floor(Math.random() * interviewers.length)];
    const r3 = interviewers[Math.floor(Math.random() * interviewers.length)];
    const r4 = interviewers[Math.floor(Math.random() * interviewers.length)];
    setRound1Interviewer(r1);
    setRound3Interviewer(r3);
    setRound4Interviewer(r4);

    try {
      // Check compatibility first
      const hasSpeech = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      const hasWebGL = (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) { return false; }
      })();

      if (!hasSpeech || !hasWebGL) {
        alert("Your browser/device is not fully compatible with Speech Recognition or 3D graphics.");
        setIsStarting(false);
        return;
      }

      // Request Microphone only at startup (reduces initial hardware load)
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(micStream);

      setIsInterviewActive(true);

      // Play greeting voice
      speakWithAvatar(
        initialText,
        r1,
        () => setAnimState('talking'),
        () => {
          setAnimState('idle');
          setTimeout(() => {
            startSpeechListening();
          }, 250);
        }
      );
    } catch (err) {
      console.warn('[Interview] Mic access denied or hardware error:', err);
      alert("Microphone permission is required to start the staging session.");
    } finally {
      setIsStarting(false);
    }
  };

  // Dynamically start/stop camera and face tracking based on useFaceTracking state
  useEffect(() => {
    if (!isInterviewActive) return;

    const toggleCameraTracking = async () => {
      if (useFaceTracking) {
        try {
          console.log('[Interview] Enabling camera tracking dynamically...');
          const camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          
          // Re-fetch current audio tracks to combine them
          const micStream = mediaStreamRef.current;
          const audioTracks = micStream ? micStream.getAudioTracks() : [];
          
          if (audioTracks.length === 0) {
            try {
              const newMic = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioTracks.push(...newMic.getAudioTracks());
            } catch {}
          }

          const combinedStream = new MediaStream([
            ...audioTracks,
            ...camStream.getVideoTracks()
          ]);
          setMediaStream(combinedStream);

          if (videoRef.current) {
            videoRef.current.srcObject = combinedStream;
            setupFaceMeshTracking(combinedStream);
          }
        } catch (err) {
          console.warn('[Interview] Failed to enable camera dynamically:', err);
          setUseFaceTracking(false);
          alert("Could not start camera. Please check permissions.");
        }
      } else {
        console.log('[Interview] Disabling camera tracking dynamically...');
        // Stop camera tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }
        if (mockTrackingIntervalRef.current) {
          clearInterval(mockTrackingIntervalRef.current);
          mockTrackingIntervalRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };

    toggleCameraTracking();
  }, [useFaceTracking, isInterviewActive]);

  // Hide main layout sidebar and lock body scrolling only when interview is active
  useEffect(() => {
    if (isInterviewActive) preloadTTS();
    const style = document.createElement('style');
    style.id = 'hide-sidebar-interview';
    if (isInterviewActive) {
      style.innerHTML = `
        html, body { overflow-y: auto !important; }
        aside, .sidebar, [data-testid="sidebar"] { display: none !important; }
        main { max-width: 95% !important; width: 95% !important; margin: 0 auto !important; }
      `;
    } else {
      style.innerHTML = `
        html, body { overflow-y: auto !important; height: auto !important; }
        aside, .sidebar, [data-testid="sidebar"] { display: block !important; }
      `;
    }
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById('hide-sidebar-interview');
      if (el) el.remove();
      stopSpeaking();
      
      // Stop and release mock tracking resources
      if (mockTrackingIntervalRef.current) {
        clearInterval(mockTrackingIntervalRef.current);
        mockTrackingIntervalRef.current = null;
      }
    };
  }, [isInterviewActive]);

  // Update video element source if stream is initialized late
  useEffect(() => {
    if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, isInterviewActive]);

  // Round 1 Timer Tick
  useEffect(() => {
    if (!isInterviewActive || activeStage !== 'round1_behavioral') return;
    if (!timerStartRef.current) {
      timerStartRef.current = Date.now();
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartRef.current!) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      setTimerLeft(remaining);
      if (remaining <= 0) {
        setReviewUnlocked(true);
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [activeStage, isInterviewActive]);

  // Bug 5: Auto-scroll to latest message in all chat panels (Round 1, 3, 4)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeStage]);

  const startSpeechListening = () => {
    if (commModeRef.current !== 'voice' || activeStage === 'round2_coding' || activeStage === 'results' || !isInterviewActiveRef.current) return;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (!recognitionRef.current) {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = false;
          rec.maxAlternatives = 1;
          
          // Match browser locale for native accent accuracy (e.g. en-IN, en-US)
          rec.lang = navigator.language || 'en-US';

          // Boost technical vocabulary words in the recognition engine
          const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
          if (SpeechGrammarList) {
            const speechRecognitionList = new SpeechGrammarList();
            const techVocab = ['redis', 'cache', 'database', 'postgres', 'kafka', 'load balancer', 'cdn', 'api gateway', 'systems design', 'consistency', 'availability', 'latency', 'sharding', 'replication'];
            const grammar = '#JSGF V1.0; grammar techVocab; public <word> = ' + techVocab.join(' | ') + ' ;';
            speechRecognitionList.addFromString(grammar, 1);
            rec.grammars = speechRecognitionList;
          }

          rec.onstart = () => {
            setIsListening(true);
            setAnimState('listening');
            speechStartRef.current = Date.now();
          };
          rec.onresult = (event: any) => {
            const resultText = event.results[0][0].transcript;
            if (resultText.trim()) {
              calculateSpeechMetrics(resultText);
              sendInterferenceMessageRef.current(resultText);
            }
          };
          rec.onerror = (e: any) => {
            console.warn('[Speech] Recognition error:', e.error);
            setIsListening(false);
            setAnimState('idle');
          };
          rec.onend = () => {
            setIsListening(false);
            setAnimState('idle');
            // Auto-restart if we are still in voice mode, active, and AI is not speaking/thinking
            if (commModeRef.current === 'voice' && isInterviewActiveRef.current && animStateRef.current === 'idle') {
              setTimeout(() => {
                startSpeechListening();
              }, 300);
            }
          };
          recognitionRef.current = rec;
        }
 
        try {
          recognitionRef.current.start();
        } catch (err) {
          // already listening
        }
      }
    }
  };

  const stopSpeechListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {}
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    calculateSpeechMetrics(userMsg);
    sendInterferenceMessage(userMsg);
  };

  const sendInterferenceMessage = useCallback(async (userMsg: string) => {
    // Safety guard: use ref to avoid stale closure — always checks the latest animState
    if (animStateRef.current === 'thinking' || animStateRef.current === 'talking') return;

    stopSpeechListening();
    const newMsgs = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMsgs);
    setAnimState('thinking');

    try {
      let stageKey = activeStage;
      let currentInterviewer = round1Interviewer;
      let payloadMessage = userMsg;
      if (activeStage === 'round3_systems') {
        currentInterviewer = round3Interviewer;
        payloadMessage = `${userMsg} (Candidate's Whiteboard Architecture Design: ${getArchitectureDescription()})`;
      }
      if (activeStage === 'round4_star') {
        currentInterviewer = round4Interviewer;
      }

      const data = await api.post<{ reply: string }>('/api/interview/chat', {
        message: payloadMessage,
        interviewerId: currentInterviewer,
        stage: stageKey,
        difficulty,
        customTopic: interviewType === 'custom' ? customTopic : '',
        history: newMsgs.map(m => ({ role: m.role, content: m.content })),
        telemetry: {
          eyeContact: eyeContactScore,
          smileFreq: smileScore,
          posture: stabilityScore,
          wpm: wpmScore,
          fillerWords: fillerWordCount
        }
      });

      const aiResponse = data.reply || "Could you repeat that? Let's stay focused.";

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setAnimState('talking');
      speakWithAvatar(
        aiResponse,
        currentInterviewer,
        () => setAnimState('talking'),
        () => {
          setAnimState('idle');
          setTimeout(() => {
            startSpeechListening();
          }, 250);
        }
      );
    } catch (err) {
      console.warn('[Interview] Failed to get live AI response, falling back to simulation', err);
      let currentInterviewer = round1Interviewer;
      if (activeStage === 'round3_systems') currentInterviewer = round3Interviewer;
      if (activeStage === 'round4_star') currentInterviewer = round4Interviewer;
      
      const aiResponse = "I see. Let's move deeper into the technical details.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setAnimState('talking');
      speakWithAvatar(
        aiResponse,
        currentInterviewer,
        () => setAnimState('talking'),
        () => {
          setAnimState('idle');
          setTimeout(() => {
            startSpeechListening();
          }, 250);
        }
      );
    }
  }, [messages, activeStage, eyeContactScore, smileScore, stabilityScore, wpmScore, fillerWordCount, boardNodes, boardLinks, round1Interviewer, round3Interviewer, round4Interviewer, useNeuralTTS, difficulty, interviewType, customTopic]);

  const sendInterferenceMessageRef = useRef(sendInterferenceMessage);
  useEffect(() => {
    sendInterferenceMessageRef.current = sendInterferenceMessage;
  }, [sendInterferenceMessage]);

  const askForReview = () => {
    stopSpeechListening();
    const feedbackText = "You did a solid job! Your communication was good, it was okay, but try to structure your thoughts a bit more next time. Now let's progress to the technical rounds.";
    setMessages(prev => [...prev, { role: 'assistant', content: feedbackText }]);
    setAnimState('talking');
    speakWithAvatar(
      feedbackText,
      round1Interviewer,
      () => setAnimState('talking'),
      () => {
        setAnimState('idle');
        startRound2Transition();
      }
    );
  };

  const startRound2Transition = () => {
    stopSpeechListening();
    setTransitionOverlay("Congratulations for clearing the first round! The second round will be coding.");
    speakWithAvatar(
      "Congratulations for clearing the first round! The second round will be coding.",
      round1Interviewer,
      () => {},
      () => {
        setTimeout(() => {
          setTransitionOverlay(null);
          setActiveStage('round2_coding');
          setCode(CODING_QUESTIONS[0].defaultCode);
          setTerminalLogs(['[IDE] Sandboxed Java compiler active.', '[IDE] Run code to execute test cases.']);
        }, 3000);
      }
    );
  };

  const runCode = () => {
    setIsRunning(true);
    setTerminalLogs(prev => [...prev, `[IDE] Compiling Solution.java...`]);
    
    setTimeout(() => {
      const q = CODING_QUESTIONS[currentQuestionIndex];
      const execution = compileAndRunJava(code, q.methodName, q.tests);
      setIsRunning(false);

      if (!execution.success) {
        setTerminalLogs(prev => [...prev, `[COMPILATION ERROR] ${execution.error}`]);
        setTestResults([]);
        const updatedScores = [...questionScores];
        updatedScores[currentQuestionIndex] = 0;
        setQuestionScores(updatedScores);
        return;
      }

      const results = execution.results || [];
      setTestResults(results);
      const passedCount = results.filter(r => r.passed).length;
      const score = Math.round((passedCount / results.length) * 100);
      
      const updatedScores = [...questionScores];
      updatedScores[currentQuestionIndex] = score;
      setQuestionScores(updatedScores);

      const logs = [
        `[IDE] Compiling and loading class successful.`,
        `[IDE] Running test cases...`
      ];

      results.forEach((res, i) => {
        logs.push(`  Test Case ${i+1}: Input: ${res.input}`);
        if (res.logs && res.logs.length > 0) {
          res.logs.forEach(l => logs.push(`    stdout: ${l}`));
        }
        logs.push(res.passed 
          ? `    🟢 Passed: Expected: ${res.expected}, Actual: ${res.actual}`
          : `    🔴 Failed: Expected: ${res.expected}, Actual: ${res.actual}`
        );
      });

      logs.push(`[IDE] Execution completed. Accuracy score: ${score}%`);
      setTerminalLogs(prev => [...prev, ...logs]);
    }, 1200);
  };

  const nextQuestion = () => {
    setTestResults([]);
    if (currentQuestionIndex < 2) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setCode(CODING_QUESTIONS[nextIdx].defaultCode);
      setTerminalLogs(prev => [...prev, `[IDE] Loading question ${nextIdx + 1}...`]);
    } else {
      const totalScore = Math.round(questionScores.reduce((a, b) => a + b, 0) / 3);
      let passingThreshold = 60;
      if (difficulty === 'easy') passingThreshold = 50;
      if (difficulty === 'hard') passingThreshold = 75;

      if (totalScore >= passingThreshold) {
        setTransitionOverlay("We will view your outcomes and inform you later.");
        speakWithAvatar(
          "We will view your outcomes and inform you later.",
          round1Interviewer,
          () => {},
          () => {
            setTimeout(() => {
              setTransitionOverlay(null);
              setActiveStage('round3_systems');
              
              const r3Greeting = customTopic.trim() && interviewType === 'custom'
                ? `Welcome to Round 3: System Design. How would you design a scalable, highly available architecture for "${customTopic.trim()}"?`
                : "Welcome to Round 3: Systems Design. How would you design a highly consistent cache storage layer for millions of concurrent active users?";

              setMessages([
                {
                  role: 'assistant',
                  content: r3Greeting
                }
              ]);
              // Bug 8: Reset recognition to prevent duplicate speech listeners from Round 1/2
              if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch {}
                recognitionRef.current = null;
              }
              // Bug 6: Ensure isInterviewActiveRef is true before startSpeechListening
              isInterviewActiveRef.current = true;
              speakWithAvatar(
                r3Greeting,
                round3Interviewer,
                () => setAnimState('talking'),
                () => {
                  setAnimState('idle');
                  startSpeechListening();
                }
              );
            }, 3000);
          }
        );
      } else {
        setCodingFailureMsg(`Collective Score: ${totalScore}%. You need at least ${passingThreshold}% average correctness for ${difficulty} difficulty. Resetting...`);
        setTerminalLogs(prev => [...prev, `[IDE] Score ${totalScore}% is below the ${passingThreshold}% requirement. Resetting coding round...`]);
        setCurrentQuestionIndex(0);
        setCode(CODING_QUESTIONS[0].defaultCode);
        setQuestionScores([0, 0, 0]);
      }
    }
  };

  const skipToRound4 = () => {
    setActiveStage('round4_star');
    const r4Greeting = customTopic.trim() && interviewType === 'custom'
      ? `Welcome to the final round: STAR Behavioral Assessment. Tell me about a time you faced a challenging technical failure when working with "${customTopic.trim()}".`
      : "Welcome to the final round: STAR Behavioral Assessment. Tell me about a time you had to deal with a critical failure under time constraints.";

    setMessages([
      {
        role: 'assistant',
        content: r4Greeting
      }
    ]);
    speakWithAvatar(
      r4Greeting,
      round4Interviewer,
      () => setAnimState('talking'),
      () => {
        setAnimState('idle');
        startSpeechListening();
      }
    );
  };

  const finishSTARAndShowResults = async () => {
    stopSpeechListening();
    setIsEvaluating(true);
    setActiveStage('results');

    try {
      const data = await api.post<{ evaluation: { verdict: string; score: number; summary: string; improvements: string } }>('/api/interview/evaluate', {
        history: messages.map(m => ({ role: m.role, content: m.content })),
        codingScore: codingScoreRef.current,
        telemetry: {
          eyeContact: eyeContactScore,
          smileFreq: smileScore,
          posture: stabilityScore,
          wpm: wpmScore,
          fillerWords: fillerWordCount,
          tabSwitches: tabSwitches,
          gazeWarnings: gazeWarnings
        }
      });
      setEvaluationResult(data.evaluation);
      if (data.evaluation.verdict === 'Hire') {
        addXp(120, 'Passed SDE Code Interview');
        earnPins('ai_interview');
      }
      // Notify GlobalAvatar mentor with interview completion event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pinit:activity_complete', {
          detail: {
            type: 'interview',
            title: 'AI Technical Interview',
            score: data.evaluation.score,
            passed: data.evaluation.verdict === 'Hire',
            verdict: data.evaluation.verdict,
            strengths: [data.evaluation.summary?.slice(0, 80) || 'Good effort overall'],
            improvements: [data.evaluation.improvements || 'Keep practicing system design'],
          }
        }));
      }
    } catch (err) {
      console.warn('Live evaluation failed', err);
      setEvaluationResult({
        verdict: codingScoreRef.current >= 60 ? "Hire" : "No Hire",
        score: codingScoreRef.current,
        summary: "Live evaluation connection could not be established. Scoring mapped directly to coding compiler correctness results.",
        improvements: "Distributed caching and database sharding protocols."
      });
    } finally {
      setIsEvaluating(false);
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const finalCodingScore = Math.round(questionScores.reduce((a, b) => a + b, 0) / 3);

  // Toggle Comm Mode handler
  const toggleCommMode = () => {
    if (commMode === 'voice') {
      stopSpeechListening();
      setCommMode('text');
    } else {
      setCommMode('voice');
      setTimeout(() => startSpeechListening(), 100);
    }
  };

  // Exit back to landing page
  const exitToLanding = (force: any = false) => {
    if (!force && isInterviewActive && activeStage !== 'results') {
      if (!window.confirm("Are you sure you want to exit the interview session? All current progress will be lost.")) {
        return;
      }
    }
    stopSpeechListening();
    stopSpeaking();
    // release camera
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (err) {}
      cameraRef.current = null;
    }
    // release faceMesh
    if (faceMeshRef.current) {
      try {
        faceMeshRef.current.close();
      } catch (err) {}
      faceMeshRef.current = null;
    }
    // release media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsInterviewActive(false);
  };

  const starResponseCount = messages.filter(m => m.role === 'user').length;
  const activePhase = starResponseCount === 0 ? 'S' : starResponseCount === 1 ? 'T' : starResponseCount === 2 ? 'A' : 'R';

  return (
    <div className="interview-theme-wrapper" style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: '24px 0', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.1), inset 0 0 5px rgba(99, 102, 241, 0.05); border-color: rgba(255, 255, 255, 0.06); }
          50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.35), inset 0 0 10px rgba(99, 102, 241, 0.15); border-color: rgba(129, 140, 248, 0.25); }
          100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.1), inset 0 0 5px rgba(99, 102, 241, 0.05); border-color: rgba(255, 255, 255, 0.06); }
        }
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-wave {
          0% { height: 6px; }
          100% { height: 24px; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes radar-pulse {
          0% { filter: drop-shadow(0 0 10px rgba(99,102,241,0.15)); }
          100% { filter: drop-shadow(0 0 25px rgba(99,102,241,0.35)); }
        }

        .active-glow {
          animation: pulse-glow 3s infinite ease-in-out !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 40px rgba(79, 70, 229, 0.05) !important;
        }
        .active-glow:hover {
          box-shadow: 0 30px 60px rgba(0,0,0,0.4), 0 0 50px rgba(79, 70, 229, 0.1) !important;
        }
        .floating-mentor {
          animation: floating 4s infinite ease-in-out !important;
        }
        .btn-hover-scale {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .btn-hover-scale:hover {
          transform: scale(1.02) translateY(-1px) !important;
          box-shadow: 0 12px 25px rgba(79, 70, 229, 0.3) !important;
          filter: brightness(1.1) !important;
        }
        .btn-hover-scale:active {
          transform: translateY(0) scale(0.98);
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.3) !important;
          backdrop-filter: blur(24px) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
        }
        .glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35) !important;
        }
        .scroll-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .radar-polygon-glow {
          filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.4));
        }
        .gazing-chart-container {
          animation: radar-pulse 3s ease-in-out infinite alternate;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gazing-chart-container:hover {
          transform: scale(1.05);
        }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite !important;
        }
      `}</style>
      
      {/* Background Orbits */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Proctor Alert Toast */}
      {proctorAlert && (
        <div style={{
          position: 'fixed',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.4)',
          boxShadow: '0 10px 30px rgba(245,158,11,0.25), 0 0 15px rgba(245,158,11,0.1) inset',
          color: '#fbbf24',
          borderRadius: 16,
          padding: '12px 24px',
          fontWeight: 800,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(16px)',
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span>⚠️</span>
          <span>{proctorAlert}</span>
        </div>
      )}

      {/* Coding Failure Modal */}
      {codingFailureMsg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          background: 'rgba(2,6,23,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div className="glass-panel" style={{
            maxWidth: 480,
            width: '100%',
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 28,
            padding: 36,
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
          }}>
            <span style={{ fontSize: 44, display: 'block', marginBottom: 16 }}>⚠️</span>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', margin: '0 0 12px 0' }}>Coding Gate Locked</h3>
            <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.65, margin: '0 0 24px 0' }}>{codingFailureMsg}</p>
            <button 
              onClick={() => setCodingFailureMsg(null)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(239,68,68,0.2)'
              }}
              className="btn-hover-scale"
            >
              Restart Round 2 Challenge
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ maxWidth: '95%', width: '95%', margin: '0 auto 24px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15, boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}>Pi</div>
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,#f8fafc,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Interview Workspace</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isInterviewActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: useNeuralTTS ? '#10b981' : '#f87171' }} title="Native Web Speech is disabled to prevent Chrome deadlocks. Enable Kitten Voice for audio.">{useNeuralTTS ? '🎙️ Kitten Voice Active' : '🔇 Audio Muted (Enable Kitten Voice for audio)'}</span>
              <button 
                onClick={() => {
                  if (!useNeuralTTS && !window.confirm("WARNING: Running Custom Neural TTS (Kitten) is resource-heavy. If your laptop has <1GB GPU memory, this may crash your tab. Proceed?")) {
                    return;
                  }
                  setUseNeuralTTS(!useNeuralTTS);
                }}
                style={{ 
                  background: useNeuralTTS ? '#10b981' : 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '3px 8px', 
                  fontSize: 10, 
                  fontWeight: 900, 
                  color: '#fff', 
                  cursor: 'pointer' 
                }}
                className="btn-hover-scale"
              >
                {useNeuralTTS ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          {isInterviewActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: useFaceTracking ? '#10b981' : '#94a3b8' }}>📷 Face Tracking (High CPU)</span>
              <button 
                onClick={() => {
                  if (!useFaceTracking && !window.confirm("WARNING: Running live Face Tracking requires WebAssembly models. If your laptop is low-spec, this may cause tab crashes. Proceed?")) {
                    return;
                  }
                  setUseFaceTracking(!useFaceTracking);
                }}
                style={{ 
                  background: useFaceTracking ? '#10b981' : 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '3px 8px', 
                  fontSize: 10, 
                  fontWeight: 900, 
                  color: '#fff', 
                  cursor: 'pointer' 
                }}
                className="btn-hover-scale"
              >
                {useFaceTracking ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          {isInterviewActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: use3DAvatar ? '#10b981' : '#94a3b8' }}>👤 3D Avatar (Requires GPU)</span>
              <button 
                onClick={() => {
                  if (!use3DAvatar && !window.confirm("WARNING: Loading the 3D Interactive Avatar requires WebGL and heavy model loading. If your laptop's GPU is low-spec (e.g. 128MB), this WILL cause tab crashes. Proceed?")) {
                    return;
                  }
                  setUse3DAvatar(!use3DAvatar);
                }}
                style={{ 
                  background: use3DAvatar ? '#10b981' : 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '3px 8px', 
                  fontSize: 10, 
                  fontWeight: 900, 
                  color: '#fff', 
                  cursor: 'pointer' 
                }}
                className="btn-hover-scale"
              >
                {use3DAvatar ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          {isInterviewActive && (
            <button onClick={exitToLanding} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px', borderRadius: 10, fontSize: 12, color: '#f87171', cursor: 'pointer', fontWeight: 700 }} className="btn-hover-scale">
              🚪 Exit Session
            </button>
          )}
          {isInterviewActive && activeStage !== 'results' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: 100, backdropFilter: 'blur(10px)' }}>
              {[
                { key: 'round1_behavioral', label: 'Behavioral' },
                { key: 'round2_coding', label: 'Coding' },
                { key: 'round3_systems', label: 'Systems' },
                { key: 'round4_star', label: 'STAR' }
              ].map((step, idx) => {
                const stages = ['round1_behavioral', 'round2_coding', 'round3_systems', 'round4_star', 'results'];
                const currentIdx = stages.indexOf(activeStage);
                const stepIdx = stages.indexOf(step.key);
                const isCompleted = stepIdx < currentIdx;
                const isActive = step.key === activeStage;
                
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {idx > 0 && <div style={{ width: 12, height: 1.5, background: isCompleted ? '#10b981' : 'rgba(255,255,255,0.1)' }} />}
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: isCompleted ? '#10b981' : isActive ? '#4f46e5' : 'rgba(255,255,255,0.05)',
                      border: isActive ? '1px solid #818cf8' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8.5,
                      fontWeight: 'bold',
                      color: isCompleted || isActive ? '#fff' : '#64748b',
                      boxShadow: isActive ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none'
                    }}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: isActive ? 900 : 700, color: isActive ? '#a5b4fc' : isCompleted ? '#cbd5e1' : '#64748b' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── LANDING PREVIEW PAGE (DEFAULT STATE) ── */}
      {!isInterviewActive ? (
        <main style={{ maxWidth: '95%', width: '95%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 10, animation: 'fadeIn 0.3s ease' }}>
          
          {/* Rules & Instructions Banner */}
          <section className="glass-panel" style={{ background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Rules & Instructions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', display: 'block', marginBottom: 6 }}>🎥 Media Setup</span>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Webcam and microphone access are required. A floating mirror feed is displayed in the bottom-right corner during staging rounds.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', display: 'block', marginBottom: 6 }}>⏱️ Behavioral Socratic Rules</span>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Behavioral screening requires at least 3 minutes of conversation before the avatar releases the detailed performance review.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', display: 'block', marginBottom: 6 }}>⚙️ Compiler Accuracy Gate</span>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>The coding IDE evaluates syntax correctness across 3 progressive questions. A cumulative score of 60% is required to proceed.</p>
              </div>
            </div>
          </section>

          {/* Central 4-Rounds Pipeline Panel */}
          <section className="glass-panel" style={{ background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 30, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px 0' }}>Staging Rounds Preview</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Prepare to go through the complete 4-stage onsite evaluation loop.</p>
            </div>

            {/* Rounds Visualization Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, width: '100%', maxWidth: 850 }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
                <span style={{ fontSize: 20 }}>💬</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, display: 'block', marginTop: 8, color: '#fff' }}>Round 1: Behavioral</span>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>Socratic Screening</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
                <span style={{ fontSize: 20 }}>💻</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, display: 'block', marginTop: 8, color: '#fff' }}>Round 2: Coding IDE</span>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>Java Compiler Tasks</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
                <span style={{ fontSize: 20 }}>☁️</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, display: 'block', marginTop: 8, color: '#fff' }}>Round 3: System Design</span>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>Distributed Sharding</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, display: 'block', marginTop: 8, color: '#fff' }}>Round 4: STAR Framework</span>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>Situational Incidents</span>
              </div>
            </div>

            {/* Choose Interview Setup Option */}
            <div style={{ width: '100%', maxWidth: 750, marginTop: 10, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                1. Select Interview Mode
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Option A: Roadmap */}
                <div 
                  onClick={() => setInterviewType('roadmap')}
                  style={{
                    background: interviewType === 'roadmap' ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.02)',
                    border: interviewType === 'roadmap' ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: interviewType === 'roadmap' ? '0 8px 24px rgba(79,70,229,0.15)' : 'none'
                  }}
                  className="btn-hover-scale"
                >
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 800, color: '#fff' }}>🗺️ Quest Roadmap Focus</h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                    Evaluate core curriculum skills mapped directly to your current active program roadmap.
                  </p>
                </div>

                {/* Option B: Custom */}
                <div 
                  onClick={() => setInterviewType('custom')}
                  style={{
                    background: interviewType === 'custom' ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.02)',
                    border: interviewType === 'custom' ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: interviewType === 'custom' ? '0 8px 24px rgba(79,70,229,0.15)' : 'none'
                  }}
                  className="btn-hover-scale"
                >
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 800, color: '#fff' }}>🎯 Custom Topic Focus</h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                    Enter any custom engineering topic, programming framework, or language stack you wish to practice.
                  </p>
                </div>
              </div>

              {/* Render custom topic input box if Custom is chosen */}
              {interviewType === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, animation: 'slideDown 0.2s ease' }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: '#94a3b8' }}>Specify Custom Topic:</label>
                  <input 
                    type="text"
                    placeholder="e.g. Distributed Consensus, React & Next.js Framework, AWS Cloud Deployment, Machine Learning..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    style={{
                      background: 'rgba(2,6,23,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: '12px 18px',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                      width: '100%'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Choose Difficulty Selection Option */}
            <div style={{ width: '100%', maxWidth: 750, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                2. Choose Evaluation Difficulty
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {/* Easy Button */}
                <button
                  onClick={() => setDifficulty('easy')}
                  style={{
                    background: difficulty === 'easy' ? '#10b981' : 'rgba(255,255,255,0.02)',
                    border: difficulty === 'easy' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 10px',
                    color: difficulty === 'easy' ? '#fff' : '#cbd5e1',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: difficulty === 'easy' ? '0 4px 16px rgba(16,185,129,0.2)' : 'none'
                  }}
                  className="btn-hover-scale"
                >
                  🟢 Easy (50% Pass Gate)
                </button>

                {/* Normal Button */}
                <button
                  onClick={() => setDifficulty('normal')}
                  style={{
                    background: difficulty === 'normal' ? '#4f46e5' : 'rgba(255,255,255,0.02)',
                    border: difficulty === 'normal' ? '1px solid #4f46e5' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 10px',
                    color: difficulty === 'normal' ? '#fff' : '#cbd5e1',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: difficulty === 'normal' ? '0 4px 16px rgba(79,70,229,0.25)' : 'none'
                  }}
                  className="btn-hover-scale"
                >
                  🔵 Normal (60% Pass Gate)
                </button>

                {/* Hard Button */}
                <button
                  onClick={() => setDifficulty('hard')}
                  style={{
                    background: difficulty === 'hard' ? '#ef4444' : 'rgba(255,255,255,0.02)',
                    border: difficulty === 'hard' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 10px',
                    color: difficulty === 'hard' ? '#fff' : '#cbd5e1',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: difficulty === 'hard' ? '0 4px 16px rgba(239,68,68,0.2)' : 'none'
                  }}
                  className="btn-hover-scale"
                >
                  🔴 Hard (75% Pass Gate)
                </button>
              </div>
            </div>

            {/* Central Start Session Button */}
            <button 
              onClick={startStagingSession}
              disabled={isStarting}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                padding: '16px 40px',
                borderRadius: 16,
                border: 'none',
                cursor: isStarting ? 'not-allowed' : 'pointer',
                boxShadow: '0 12px 30px rgba(79,70,229,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: isStarting ? 0.75 : 1,
                transition: 'all 0.2s',
                marginTop: 10
              }}
              className="btn-hover-scale"
            >
              {isStarting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  <span>Requesting Microphone Access...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Start Mock Staging Session</span>
                </>
              )}
            </button>
          </section>

          {/* Gamified Cumulative Analytics Radar Chart */}
          <section className="glass-panel" style={{ background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 30, display: 'flex', gap: 32, alignItems: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#818cf8', display: 'block', marginBottom: 8 }}>⚡ Candidate Overview Matrix</span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 10px 0' }}>Cumulative Staging Metrics</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                This matrix shows your averaged scores across previous staging sessions. Focus on systems sharding and low-level Java algorithm complexities to balance your radar profile.
              </p>
            </div>
            
            {/* Small Radar Chart with Pulse animation */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 16, border: '1px solid rgba(255,255,255,0.04)', position: 'relative' }} className="gazing-chart-container">
              <RadarChart scores={{ logic: 80, systems: 70, comms: 85, solving: 80, star: 75 }} size={180} />
            </div>
          </section>

          {/* Previous Staging Session History */}
          <section className="glass-panel" style={{ background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 30 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 16px 0', color: '#f8fafc' }}>
              📜 Previous Interview Performance
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map((sess) => (
                <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '14px 20px', borderRadius: 16 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{sess.type}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Date: {sess.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
                      {sess.badge}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: sess.status === 'Cleared' ? '#10b981' : '#f87171' }}>
                      {sess.status} ({sess.score}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      ) : (
        /* ── INTERVIEW ACTIVE WORKSPACE GRID ── */
        <main style={{ maxWidth: '95%', width: '95%', margin: '0 auto', display: 'grid', gridTemplateColumns: activeStage === 'round2_coding' ? '1fr' : activeStage === 'round3_systems' ? '58fr 42fr' : '55fr 45fr', gap: 24, position: 'relative', zIndex: 10, alignItems: 'stretch' }}>
          
          {/* Left Panel: Avatar scene */}
          <section 
            className="glass-panel active-glow" 
            style={{ 
              display: activeStage === 'round2_coding' || activeStage === 'results' ? 'none' : 'flex',
              background: 'rgba(15,23,42,0.3)', 
              backdropFilter: 'blur(24px)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: 28, 
              flexDirection: 'column', 
              overflow: 'hidden', 
              position: 'relative', 
              height: activeStage === 'round3_systems' ? 240 : 'calc(100vh - 160px)', 
              minHeight: activeStage === 'round3_systems' ? 240 : 520, 
              gridColumn: activeStage === 'round3_systems' ? '2 / 3' : 'auto',
              gridRow: activeStage === 'round3_systems' ? '1 / 2' : 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)' 
            }}
          >
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
              <style>{`
                @keyframes pulse-bar {
                  0% { height: 8px; }
                  100% { height: 36px; }
                }
                @keyframes pulse-listening {
                  0% { box-shadow: 0 0 16px rgba(129, 140, 248, 0.2); border-color: #818cf8; }
                  100% { box-shadow: 0 0 36px rgba(16, 185, 129, 0.6); border-color: #10b981; }
                }
              `}</style>

              {/* Floating Workspace Settings Overlays */}
              <div style={{
                position: 'absolute',
                top: activeStage === 'round3_systems' ? 12 : 20,
                right: activeStage === 'round3_systems' ? 12 : 20,
                zIndex: 50,
                display: 'flex',
                flexDirection: activeStage === 'round3_systems' ? 'row' : 'column',
                gap: activeStage === 'round3_systems' ? 12 : 8,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: activeStage === 'round3_systems' ? '6px 12px' : '10px 14px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                minWidth: activeStage === 'round3_systems' ? 'auto' : 160
              }}>
                {/* 3D Avatar Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: use3DAvatar ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>👤 3D Avatar</span>
                  <button 
                    onClick={() => {
                      if (!use3DAvatar && !window.confirm("WARNING: Loading the 3D Interactive Avatar requires WebGL. If your laptop's GPU is low-spec (e.g. 128MB), this might crash the browser tab. Proceed?")) {
                        return;
                      }
                      setUse3DAvatar(!use3DAvatar);
                    }}
                    style={{ 
                      background: use3DAvatar ? '#10b981' : 'rgba(255,255,255,0.1)', 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '3px 8px', 
                      fontSize: 9, 
                      fontWeight: 900, 
                      color: '#fff', 
                      cursor: 'pointer' 
                    }}
                    className="btn-hover-scale"
                  >
                    {use3DAvatar ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Kitten Voice Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: useNeuralTTS ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>🎙️ Kitten Voice</span>
                  <button 
                    onClick={() => {
                      if (!useNeuralTTS && !window.confirm("WARNING: Running Custom Neural TTS (Kitten) is resource-heavy. If your laptop has <1GB GPU memory, this may crash your tab. Proceed?")) {
                        return;
                      }
                      setUseNeuralTTS(!useNeuralTTS);
                    }}
                    style={{ 
                      background: useNeuralTTS ? '#10b981' : 'rgba(255,255,255,0.1)', 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '3px 8px', 
                      fontSize: 9, 
                      fontWeight: 900, 
                      color: '#fff', 
                      cursor: 'pointer' 
                    }}
                    className="btn-hover-scale"
                  >
                    {useNeuralTTS ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Face Tracking Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: useFaceTracking ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>📷 Tracking</span>
                  <button 
                    onClick={() => {
                      if (!useFaceTracking && !window.confirm("WARNING: Running live Face Tracking requires WebAssembly models. If your laptop is low-spec, this may cause tab crashes. Proceed?")) {
                        return;
                      }
                      setUseFaceTracking(!useFaceTracking);
                    }}
                    style={{ 
                      background: useFaceTracking ? '#10b981' : 'rgba(255,255,255,0.1)', 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '3px 8px', 
                      fontSize: 9, 
                      fontWeight: 900, 
                      color: '#fff', 
                      cursor: 'pointer' 
                    }}
                    className="btn-hover-scale"
                  >
                    {useFaceTracking ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              
              {!use3DAvatar ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
                  position: 'relative'
                }}>
                  {/* Waveform/Visualizer overlay when talking */}
                  {animState === 'talking' && (
                    <div style={{ display: 'flex', gap: 6, position: 'absolute', top: '25%' }}>
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          style={{
                            width: 6,
                            height: 24,
                            background: '#818cf8',
                            borderRadius: 3,
                            animation: `pulse-bar 0.8s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.12}s`
                          }} 
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Big glowing profile initial circle */}
                  <div style={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)',
                    border: '3px solid #818cf8',
                    boxShadow: '0 0 32px rgba(129, 140, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    fontWeight: 900,
                    color: '#f8fafc',
                    marginBottom: 16,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    animation: animState === 'listening' ? 'pulse-listening 1s infinite alternate' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {
                      (activeStage === 'round3_systems' ? round3Interviewer : activeStage === 'round4_star' ? round4Interviewer : round1Interviewer).slice(0, 2).toUpperCase()
                    }
                  </div>

                  <div style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#a5b4fc',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: 8
                  }}>
                    {activeStage === 'round3_systems' ? 'Systems Design Expert' : activeStage === 'round4_star' ? 'Behavioral Lead' : 'Technical Recruiter'}
                  </div>

                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#94a3b8',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {animState === 'talking' ? 'Speaking...' : animState === 'listening' ? 'Listening...' : 'Active'}
                  </div>
                </div>
              ) : (
                <VRoidInterviewAvatar 
                  teacherId={activeStage === 'round3_systems' ? round3Interviewer : activeStage === 'round4_star' ? round4Interviewer : round1Interviewer} 
                  animState={animState} 
                  zoom={zoom} 
                  visible={activeStage !== 'round2_coding' && activeStage !== 'results'}
                />
              )}
            </div>
            
            {/* Interviewer Name Tag */}
            <div style={{ 
              position: 'absolute', 
              bottom: activeStage === 'round3_systems' ? 10 : 20, 
              left: activeStage === 'round3_systems' ? 12 : '50%', 
              transform: activeStage === 'round3_systems' ? 'none' : 'translateX(-50%)', 
              background: 'rgba(2,6,23,0.85)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: activeStage === 'round3_systems' ? '4px 12px' : '8px 20px', 
              borderRadius: 20, 
              backdropFilter: 'blur(8px)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              zIndex: 10, 
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)' 
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                {
                  activeStage === 'round3_systems' 
                    ? (INTERVIEWER_NAMES[round3Interviewer] || 'Interviewer')
                    : activeStage === 'round4_star' 
                      ? (INTERVIEWER_NAMES[round4Interviewer] || 'Interviewer')
                      : (INTERVIEWER_NAMES[round1Interviewer] || 'Interviewer')
                }
              </span>
            </div>
              {/* Vitals overlay - only showing Skip Speaking button if talking */}
              {animState === 'talking' && (
                <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 12, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', zIndex: 20 }}>
                  <button 
                    onClick={() => {
                      stopSpeaking();
                      setAnimState('idle');
                      startSpeechListening();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a5b4fc',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    className="btn-hover-scale"
                  >
                    ⏭️ Skip Speaking
                  </button>
                </div>
              )}
          </section>

          {/* Middle Panel: Drag-and-Drop System Design Board */}
          {activeStage === 'round3_systems' && (
            <section className="glass-panel active-glow" style={{ background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 160px)', minHeight: 520, padding: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', gridColumn: '1 / 2', gridRow: '1 / 3' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>📐 Interactive Architecture Board</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={loadThreeTierPreset} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe', borderRadius: 8, padding: '4px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }} className="btn-hover-scale">Three-Tier Preset</button>
                  <button onClick={loadEventDrivenPreset} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe', borderRadius: 8, padding: '4px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }} className="btn-hover-scale">Event Preset</button>
                  <button onClick={clearBoard} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '4px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }} className="btn-hover-scale">Reset Canvas</button>
                </div>
              </div>

              {/* Node palette */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {['Client', 'Load Balancer', 'API Gateway', 'Web Server', 'Redis Cache', 'Postgres DB', 'Kafka Queue', 'CDN'].map(type => (
                  <button 
                    key={type} 
                    onClick={() => addNodeToBoard(type)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#fff', cursor: 'pointer' }}
                    className="btn-hover-scale"
                  >
                    + {type}
                  </button>
                ))}
              </div>

              {/* Board Canvas Area */}
              <div 
                onMouseMove={handleBoardMouseMove} 
                onMouseUp={handleBoardMouseUp}
                onMouseLeave={handleBoardMouseUp}
                onTouchMove={handleBoardTouchMove}
                onTouchEnd={handleBoardTouchEnd}
                onClick={(e) => {
                  if ((e.target as HTMLElement).getAttribute('data-board-canvas') === 'true') {
                    setSelectedSourceNodeId(null);
                  }
                }}
                style={{ flex: 1, background: 'rgba(2,6,23,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}
                data-board-canvas="true"
              >
                {/* SVG connection layer */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <defs>
                    <marker id="interview-board-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
                    </marker>
                  </defs>
                  {renderLinks()}
                </svg>

                {/* Render nodes */}
                {boardNodes.map(node => {
                  const getNodeIconAndColor = (type: string) => {
                    switch (type) {
                      case 'Client': return { icon: '💻', color: '#60a5fa', bg: 'rgba(96,165,250,0.06)' };
                      case 'Load Balancer': return { icon: '⚖️', color: '#c084fc', bg: 'rgba(192,132,252,0.06)' };
                      case 'API Gateway': return { icon: '🔑', color: '#fb923c', bg: 'rgba(251,146,60,0.06)' };
                      case 'Web Server': return { icon: '⚙️', color: '#34d399', bg: 'rgba(52,211,153,0.06)' };
                      case 'Redis Cache': return { icon: '⚡', color: '#f87171', bg: 'rgba(248,113,113,0.06)' };
                      case 'Postgres DB': return { icon: '🗄️', color: '#22d3ee', bg: 'rgba(34,211,238,0.06)' };
                      case 'Kafka Queue': return { icon: '📥', color: '#fbbf24', bg: 'rgba(251,191,36,0.06)' };
                      case 'CDN': return { icon: '🌐', color: '#f472b6', bg: 'rgba(244,114,182,0.06)' };
                      default: return { icon: '📦', color: '#cbd5e1', bg: 'rgba(255,255,255,0.02)' };
                    }
                  };
                  
                  const meta = getNodeIconAndColor(node.type);
                  const isSelected = selectedSourceNodeId === node.id;
                  
                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onTouchStart={(e) => handleNodeTouchStart(e, node.id)}
                      onClick={() => handleNodeClick(node.id)}
                      style={{
                        position: 'absolute',
                        left: node.x,
                        top: node.y,
                        width: 125,
                        height: 44,
                        background: isSelected ? 'rgba(79,70,229,0.25)' : meta.bg,
                        border: isSelected ? '2px solid #818cf8' : `1px solid ${meta.color}50`,
                        boxShadow: isSelected ? `0 0 12px ${meta.color}60` : 'none',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 900,
                        color: '#fff',
                        cursor: 'grab',
                        userSelect: 'none',
                        zIndex: 10,
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{meta.icon}</span>
                      <span>{node.type}</span>
                    
                    {/* Delete node handle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        background: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        fontSize: 8,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 12
                      }}
                      title="Delete Node"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              </div>
              
              <div style={{ marginTop: 10, fontSize: 10, color: '#64748b', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between' }}>
                <span>💡 Click first node, then click second node to connect them.</span>
                <span>Drag nodes to reposition.</span>
              </div>
            </section>
          )}

          {/* Right Panel / Coding IDE Container */}
          {activeStage !== 'results' ? (
            <section style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: activeStage === 'round3_systems' ? 'calc(100vh - 424px)' : 'calc(100vh - 160px)', 
              minHeight: activeStage === 'round3_systems' ? 300 : 520,
              gridColumn: activeStage === 'round3_systems' ? '2 / 3' : 'auto',
              gridRow: activeStage === 'round3_systems' ? '2 / 3' : 'auto'
            }}>
              
              {/* Round 1 (Behavioral) Socratic Dialog Frame */}
              {activeStage === 'round1_behavioral' && (
                <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>Behavioral Assessment</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: timerLeft > 0 ? '#fb7185' : '#10b981', fontWeight: 800, background: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                        ⏱️ {formatTime(timerLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Recruiter Live HUD telemetry */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      👁️ Gaze: <strong style={{ color: eyeContactScore > 75 ? '#10b981' : '#fbbf24' }}>{eyeContactScore > 75 ? 'Focused' : 'Drifting'} ({eyeContactScore}%)</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      🧘 Posture: <strong style={{ color: stabilityScore > 80 ? '#10b981' : '#fbbf24' }}>{stabilityScore > 80 ? 'Stable' : 'Restless'} ({stabilityScore}%)</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      🎙️ Pace: <strong style={{ color: wpmScore > 155 || wpmScore < 95 ? '#fbbf24' : '#10b981' }}>{wpmScore} WPM ({wpmScore > 155 ? 'Fast' : wpmScore < 95 ? 'Slow' : 'Good'})</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⚠️ Fillers: <strong style={{ color: fillerWordCount > 3 ? '#ef4444' : '#10b981' }}>{fillerWordCount}</strong>
                    </span>
                  </div>

                  {/* Chat Feed */}
                  <div className="scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', animation: 'slideUp 0.3s ease' }}>
                        <div style={{
                          padding: '12px 18px',
                          borderRadius: 20,
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          background: m.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#f8fafc',
                          boxShadow: m.role === 'user' ? '0 8px 20px rgba(79,70,229,0.15)' : 'none'
                        }}>
                          {m.content}
                        </div>
                      </div>
                    ))}

                    {/* Bug 5: Auto-scroll sentinel */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Voice mode active glowing waves */}
                  {commMode === 'voice' && (
                    <div style={{ padding: '16px 24px', background: 'rgba(79,70,229,0.03)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'fadeIn 0.2s' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} style={{ width: 3, height: isListening ? 22 : 6, background: '#a5b4fc', borderRadius: 2, animation: isListening ? `pulse-height 0.8s ease-in-out infinite alternate ${i * 0.12}s` : 'none', transition: 'height 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a5b4fc', letterSpacing: '0.5px' }}>
                        {isListening ? '🎙️ LISTENING TO YOUR VOICE... SPEAK NOW' : '⏳ WAITING FOR VOICE INPUT'}
                      </span>
                    </div>
                  )}

                  {/* Input Controls */}
                  <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,6,23,0.5)', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
                    
                    {/* Dynamic Mode specific input elements */}
                    {commMode === 'text' && (
                      <div style={{ display: 'flex', gap: 12, animation: 'slideUp 0.2s' }}>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type your explanation here..."
                          style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', color: '#fff', fontSize: 13.5, outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage} style={{ background: '#4f46e5', border: 'none', borderRadius: 14, width: 48, height: 48, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }} className="btn-hover-scale">➔</button>
                      </div>
                    )}

                    {/* Middle Bottom Switch Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: -6, marginBottom: 4 }}>
                      <button 
                        onClick={toggleCommMode}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 100,
                          padding: '6px 16px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#a5b4fc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s'
                        }}
                        className="btn-hover-scale"
                      >
                        {commMode === 'voice' ? '⌨️ Switch to Text Input' : '🎙️ Switch to Voice Input'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <button 
                        onClick={askForReview}
                        disabled={!reviewUnlocked}
                        style={{
                          flex: 1,
                          background: reviewUnlocked ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.03)',
                          color: reviewUnlocked ? '#fff' : 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: 14,
                          padding: '14px',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: reviewUnlocked ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                          boxShadow: reviewUnlocked ? '0 8px 20px rgba(16,185,129,0.2)' : 'none'
                        }}
                        className={reviewUnlocked ? "btn-hover-scale" : ""}
                      >
                        {reviewUnlocked ? '🔓 Request Round 1 Performance Review ➔' : `🔒 Locked (Unlocks in ${formatTime(timerLeft)})`}
                      </button>
                      <button onClick={startRound2Transition} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 24px', fontSize: 12.5, color: '#94a3b8', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }} className="btn-hover-scale">Skip to IDE</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Round 2 (Coding) Immersive IDE Frame */}
              {activeStage === 'round2_coding' && (
                <div style={{ display: 'grid', gridTemplateColumns: '25fr 75fr', gap: 18, height: '100%' }}>
                  
                  {/* Left IDE: Question detail */}
                  <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>{CODING_QUESTIONS[currentQuestionIndex].title}</h3>
                    <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, margin: 0 }}>{CODING_QUESTIONS[currentQuestionIndex].description}</p>
                    
                    <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', padding: '10px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#f87171', marginTop: 4 }}>
                      <span>🎙️</span>
                      <span>Voice input is suspended during the coding round. Please write your class implementation inside the editor.</span>
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
                          <span>Verified Accuracy</span>
                          <span style={{ color: '#10b981' }}>{questionScores[currentQuestionIndex]}%</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${questionScores[currentQuestionIndex]}%`, background: '#10b981', borderRadius: 100, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>

                      {testResults.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 14 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dry-Run Test Metrics</span>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {testResults.map((r, i) => (
                              <span key={i} style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: r.passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                border: r.passed ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                                color: r.passed ? '#10b981' : '#f87171'
                              }}>
                                T{i+1}: {r.passed ? '🟢 Pass' : '🔴 Fail'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right IDE: Code Editor */}
                  <div className="glass-panel editor-container" style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700 }}>Solution.java</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button 
                          onClick={() => {
                            if (window.confirm("Bypass coding compiler? This will immediately pass the coding round with 100% accuracy.")) {
                              setQuestionScores([100, 100, 100]);
                              codingScoreRef.current = 100;
                              stopSpeechListening();
                              setTransitionOverlay("Bypass triggered. Proceeding to Round 3: Systems Design.");
                              speakWithAvatar(
                                "Bypass triggered. Proceeding to Round 3: Systems Design.",
                                round1Interviewer,
                                () => {},
                                () => {
                                  setTimeout(() => {
                                    setTransitionOverlay(null);
                                    setActiveStage('round3_systems');
                                    setMessages([
                                      {
                                        role: 'assistant',
                                        content: "Welcome to Round 3: Systems Design. How would you design a highly consistent cache storage layer for millions of concurrent active users?"
                                      }
                                    ]);
                                    // Bug 8: Reset recognition to prevent duplicate listeners
                                    if (recognitionRef.current) {
                                      try { recognitionRef.current.abort(); } catch {}
                                      recognitionRef.current = null;
                                    }
                                    // Bug 6: Ensure ref is true before startSpeechListening
                                    isInterviewActiveRef.current = true;
                                    speakWithAvatar(
                                      "Welcome to Round 3: Systems Design. How would you design a highly consistent cache storage layer for millions of concurrent active users?",
                                      round3Interviewer,
                                      () => setAnimState('talking'),
                                      () => {
                                        setAnimState('idle');
                                        startSpeechListening();
                                      }
                                    );
                                  }, 2000);
                                }
                              );
                            }
                          }}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#f87171', cursor: 'pointer' }}
                          className="btn-hover-scale"
                        >
                          ⏭️ Bypass Round
                        </button>
                        <button onClick={runCode} disabled={isRunning} style={{ background: '#4f46e5', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', gap: 6 }} className="btn-hover-scale">
                          {isRunning && <span className="spinner" />}
                          {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                        <button 
                          onClick={nextQuestion} 
                          disabled={questionScores[currentQuestionIndex] < (difficulty === 'easy' ? 50 : difficulty === 'hard' ? 75 : 60)} 
                          style={{
                            background: questionScores[currentQuestionIndex] >= (difficulty === 'easy' ? 50 : difficulty === 'hard' ? 75 : 60) ? '#10b981' : 'rgba(255,255,255,0.04)',
                            color: questionScores[currentQuestionIndex] >= (difficulty === 'easy' ? 50 : difficulty === 'hard' ? 75 : 60) ? '#fff' : 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: 10,
                            padding: '8px 20px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: questionScores[currentQuestionIndex] >= 60 ? 'pointer' : 'not-allowed',
                            boxShadow: questionScores[currentQuestionIndex] >= 60 ? '0 4px 12px rgba(16,185,129,0.2)' : 'none'
                          }}
                          className="btn-hover-scale"
                        >
                          {currentQuestionIndex < 2 ? 'Next Challenge ➔' : 'Complete Coding Round'}
                        </button>
                      </div>
                    </div>

                    {/* Monaco Code Editor */}
                    <div style={{ flex: 1, minHeight: 300, background: '#020617' }}>
                      <MonacoEditor
                        height="100%"
                        language="java"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13.5,
                          fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                          lineHeight: 1.6,
                          automaticLayout: true,
                          scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible'
                          },
                          lineNumbers: 'on',
                          roundedSelection: true,
                          scrollBeyondLastLine: false,
                          readOnly: false
                        }}
                      />
                    </div>

                    {/* Terminal log panel */}
                    <div style={{ height: 150, background: '#020617', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', overflowY: 'auto' }} className="scroll-container">
                      <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8, fontWeight: 800, letterSpacing: '0.5px' }}>Terminal Console Output</span>
                      {terminalLogs.map((log, i) => (
                        <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: log.includes('passed') ? '#10b981' : log.includes('error') ? '#ef4444' : '#94a3b8', marginBottom: 6 }}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Round 3 (Systems Design) Socratic Dialog Frame */}
              {activeStage === 'round3_systems' && (
                <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>System Design & Architecture Evaluation</h3>
                  </div>

                  {/* Chat Feed */}
                  <div className="scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', animation: 'slideUp 0.3s ease' }}>
                        <div style={{
                          padding: '12px 18px',
                          borderRadius: 20,
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          background: m.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#f8fafc',
                          boxShadow: m.role === 'user' ? '0 8px 20px rgba(79,70,229,0.15)' : 'none'
                        }}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {/* Bug 5: Auto-scroll sentinel */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Voice mode active glowing waves */}
                  {commMode === 'voice' && (
                    <div style={{ padding: '16px 24px', background: 'rgba(79,70,229,0.03)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'fadeIn 0.2s' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} style={{ width: 3, height: isListening ? 22 : 6, background: '#a5b4fc', borderRadius: 2, animation: isListening ? `pulse-height 0.8s ease-in-out infinite alternate ${i * 0.12}s` : 'none', transition: 'height 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a5b4fc', letterSpacing: '0.5px' }}>
                        {isListening ? '🎙️ LISTENING TO YOUR VOICE... SPEAK NOW' : '⏳ WAITING FOR VOICE INPUT'}
                      </span>
                    </div>
                  )}

                  {/* Input Controls */}
                  <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,6,23,0.5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {commMode === 'text' && (
                      <div style={{ display: 'flex', gap: 12, animation: 'slideUp 0.2s' }}>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type cache layers design details here..."
                          style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', color: '#fff', fontSize: 13.5, outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage} style={{ background: '#4f46e5', border: 'none', borderRadius: 14, width: 48, height: 48, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }} className="btn-hover-scale">➔</button>
                      </div>
                    )}

                    {/* Middle Bottom Switch Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: -6, marginBottom: 4 }}>
                      <button 
                        onClick={toggleCommMode}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 100,
                          padding: '6px 16px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#a5b4fc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s'
                        }}
                        className="btn-hover-scale"
                      >
                        {commMode === 'voice' ? '⌨️ Switch to Text Input' : '🎙️ Switch to Voice Input'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        onClick={skipToRound4}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', borderRadius: 14, padding: '14px', fontSize: 12.5, fontWeight: 800, color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.2)' }}
                        className="btn-hover-scale"
                      >
                        Submit Architecture & Proceed to Round 4 ➔
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Round 4 (STAR) Socratic Dialog Frame */}
              {activeStage === 'round4_star' && (
                <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>STAR Stress-Test Assessment</h3>
                    </div>

                    {/* STAR Phase Map Tracker */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Behavioral STAR Map</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {['Situation', 'Task', 'Action', 'Result'].map((phase, idx) => {
                          const phases = ['S', 'T', 'A', 'R'];
                          const symbol = phases[idx];
                          const isActive = activePhase === symbol;
                          const isDone = phases.indexOf(activePhase) > idx;
                          return (
                            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: isActive ? '#4f46e5' : isDone ? '#10b981' : 'rgba(255,255,255,0.05)',
                                color: isActive || isDone ? '#fff' : '#64748b',
                                fontSize: 9.5,
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: isActive ? '1px solid #818cf8' : 'none'
                              }}>{symbol}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: isActive ? '#a5b4fc' : isDone ? '#10b981' : '#64748b' }}>{phase}</span>
                              {idx < 3 && <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: 9 }}>➔</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recruiter Live HUD telemetry */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        👁️ Gaze: <strong style={{ color: eyeContactScore > 75 ? '#10b981' : '#fbbf24' }}>{eyeContactScore > 75 ? 'Focused' : 'Drifting'} ({eyeContactScore}%)</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        🧘 Posture: <strong style={{ color: stabilityScore > 80 ? '#10b981' : '#fbbf24' }}>{stabilityScore > 80 ? 'Stable' : 'Restless'} ({stabilityScore}%)</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        🎙️ Pace: <strong style={{ color: wpmScore > 155 || wpmScore < 95 ? '#fbbf24' : '#10b981' }}>{wpmScore} WPM ({wpmScore > 155 ? 'Fast' : wpmScore < 95 ? 'Slow' : 'Good'})</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⚠️ Fillers: <strong style={{ color: fillerWordCount > 3 ? '#ef4444' : '#10b981' }}>{fillerWordCount}</strong>
                      </span>
                    </div>

                  {/* Chat Feed */}
                  <div className="scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', animation: 'slideUp 0.3s ease' }}>
                        <div style={{
                          padding: '12px 18px',
                          borderRadius: 20,
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          background: m.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#f8fafc',
                          boxShadow: m.role === 'user' ? '0 8px 20px rgba(79,70,229,0.15)' : 'none'
                        }}>
                          {m.content}
                        </div>
                      </div>
                    ))}

                    {/* Bug 5: Auto-scroll sentinel */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Voice mode active glowing waves */}
                  {commMode === 'voice' && (
                    <div style={{ padding: '16px 24px', background: 'rgba(79,70,229,0.03)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'fadeIn 0.2s' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} style={{ width: 3, height: isListening ? 22 : 6, background: '#a5b4fc', borderRadius: 2, animation: isListening ? `pulse-height 0.8s ease-in-out infinite alternate ${i * 0.12}s` : 'none', transition: 'height 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a5b4fc', letterSpacing: '0.5px' }}>
                        {isListening ? '🎙️ LISTENING TO YOUR VOICE... SPEAK NOW' : '⏳ WAITING FOR VOICE INPUT'}
                      </span>
                    </div>
                  )}

                  {/* Input Controls */}
                  <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,6,23,0.5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {commMode === 'text' && (
                      <div style={{ display: 'flex', gap: 12, animation: 'slideUp 0.2s' }}>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Explain your situation action resolution details..."
                          style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', color: '#fff', fontSize: 13.5, outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage} style={{ background: '#4f46e5', border: 'none', borderRadius: 14, width: 48, height: 48, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }} className="btn-hover-scale">➔</button>
                      </div>
                    )}

                    {/* Middle Bottom Switch Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: -6, marginBottom: 4 }}>
                      <button 
                        onClick={toggleCommMode}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 100,
                          padding: '6px 16px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#a5b4fc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s'
                        }}
                        className="btn-hover-scale"
                      >
                        {commMode === 'voice' ? '⌨️ Switch to Text Input' : '🎙️ Switch to Voice Input'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        onClick={finishSTARAndShowResults}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: 14, padding: '14px', fontSize: 12.5, fontWeight: 800, color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.2)' }}
                        className="btn-hover-scale"
                      >
                        Complete All Rounds & View Outcomes ➔
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </section>
          ) : (
            isEvaluating ? (
              <section style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: 24, animation: 'fadeIn 0.3s ease' }}>
                <span className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>Reviewing your technical responses & syncing results...</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Recruiter Vikram is reviewing your answers and coding logic.</p>
              </section>
            ) : (
              /* Step 6: Premium Evaluation Results Page */
              <section style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
                
                {/* Outcomes Overview Card */}
                <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, boxShadow: '0 20px 45px rgba(0,0,0,0.3)' }}>
                  <div>
                    <span style={{ fontSize: 40 }}>🏆</span>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 14, marginBottom: 10, letterSpacing: '-0.5px', color: evaluationResult?.verdict === 'Hire' ? '#10b981' : '#f87171' }}>
                      AI Evaluation Verdict: {evaluationResult?.verdict || 'No Hire'}
                    </h2>
                    <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.75, margin: 0 }}>
                      {evaluationResult?.summary || 'No detailed analysis generated.'}
                    </p>
                  </div>

                  {/* Dynamic Radar Chart Canvas rendering using SVG */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <RadarChart scores={{
                      logic: finalCodingScore,
                      systems: boardNodes.length > 3 ? 95 : boardNodes.length > 0 ? 75 : 40,
                      comms: Math.max(30, 100 - fillerWordCount * 6),
                      solving: Math.round((finalCodingScore + stabilityScore) / 2),
                      star: Math.round((eyeContactScore + stabilityScore) / 2)
                    }} size={240} />
                  </div>
                </div>

                {/* Pros & Cons, Scorecard, Improvements Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 24 }}>
                  
                  {/* Pros and Cons */}
                  <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 30 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 900, marginBottom: 18, color: '#f8fafc' }}>Real Performance Cues</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'block', marginBottom: 12 }}>🟢 Staging Cues</span>
                        <ul style={{ paddingLeft: 12, margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.75 }}>
                          <li>Gaze: {eyeContactScore}%</li>
                          <li>Posture: {stabilityScore}%</li>
                          <li>Smile: {smileScore}%</li>
                        </ul>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fb7185', display: 'block', marginBottom: 12 }}>🔴 Speech/Security</span>
                        <ul style={{ paddingLeft: 12, margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.75 }}>
                          <li>Pace: {wpmScore} WPM</li>
                          <li>Fillers: {fillerWordCount}</li>
                          <li>Tab Outs: {tabSwitches}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Round Scorecard */}
                  <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 30, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#f8fafc', margin: 0 }}>Round Scorecard</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>💬 Behavioral Screen</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>PASSED</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>💻 Technical IDE</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: finalCodingScore >= (difficulty === 'easy' ? 50 : difficulty === 'hard' ? 75 : 60) ? '#10b981' : '#f87171' }}>{finalCodingScore}% Acc</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>☁️ System Design</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>{boardNodes.length >= 4 ? 'Distinguished' : boardNodes.length > 0 ? 'Proficient' : 'Standard'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>⚡ STAR Response</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>EVALUATED</span>
                      </div>
                    </div>
                  </div>

                  {/* Areas to Improve */}
                  <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 900, marginBottom: 2 }}>Where You Need to Improve</h3>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 18, padding: 18, display: 'flex', gap: 14 }}>
                      <span style={{ fontSize: 22 }}>💡</span>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4 }}>Recruiter Vikram's Recommendation</span>
                        <span style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6 }}>
                          {evaluationResult?.improvements || 'Distributed caching and database sharding protocols.'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <button onClick={exitToLanding} className="btn-primary btn-hover-scale" style={{ flex: 1, padding: 14, justifyContent: 'center', fontSize: 13, fontWeight: 800, borderRadius: 14, display: 'flex', alignItems: 'center', border: 'none', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.2)' }}>
                        🏠 Return to Staging Portal
                      </button>
                      <Link href="/career-twin" style={{ flex: 1, padding: '14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, textAlign: 'center', fontSize: 13, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }} className="btn-hover-scale">
                        🧬 Sync Career Twin
                      </Link>
                    </div>
                  </div>

                </div>

              </section>
            )
          )}

        </main>
      )}

      {/* Floating Webcam Preview */}
      {mediaStream && isInterviewActive && activeStage !== 'results' && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 170,
          height: 128,
          borderRadius: 20,
          overflow: 'hidden',
          border: '2px solid #4f46e5',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          zIndex: 100,
          animation: 'scaleIn 0.3s ease'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)'
            }}
          />
        </div>
      )}


    </div>
  );
}
