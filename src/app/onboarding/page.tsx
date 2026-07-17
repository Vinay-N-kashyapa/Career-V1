'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCareerOS } from '@/lib/context/CareerOSContext';
import { useAuth } from '@/lib/context/AuthContext';
import { api } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { KEYS } from '@/lib/api/hooks';
import dynamic from 'next/dynamic';
import { speakWithAvatar, stopSpeaking, preloadTTS, preloadNextSpeech } from '@/lib/tts';
import { toast } from '@/lib/store/useAppStore';

// Dynamic import for WebGL/ThreeJS avatar to avoid SSR issues
const VRoidInterviewAvatar = dynamic(
  () => import('@/components/avatar/VRoidInterviewAvatar'),
  { ssr: false }
);

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
}

function parseExperience(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('fresher') || t.includes('student') || t.includes('college') || t.includes('no experience') || t.includes('none')) {
    return 'fresher';
  }
  if (t.includes('intern') || t.includes('months')) {
    return 'intern';
  }
  return 'experienced';
}

const IDENTITY_QS = [
  { id: 'logic', category: 'Logic vs Empathy', text: 'I focus more on writing backend code logic than designing the visual layout of an app.', left: 'Visual/Design', right: 'Code Logic' },
  { id: 'pace', category: 'Learning Pace', text: 'I prefer learning deep, low-level details (like system architecture) over using simple drag-and-drop tools.', left: 'High-Level', right: 'Low-Level' }
];

const WORKPLACE_SCENARIOS = [
  {
    id: 'bug_launch',
    title: 'Critical Bug 10 Minutes before Launch',
    text: 'A serious crash is discovered in your app just 10 minutes before launching it to users. What do you do?',
    options: [
      { text: '🛑 Delay: Postpone the launch to fix the bug and write proper tests.', trait: 'Stabilizer', scores: { Stabilizer: 45, Consistency: 40 } },
      { text: '🚀 Ship: Proceed with the launch now and fix it later with an update.', trait: 'Explorer', scores: { Explorer: 40, Adaptability: 35 } },
      { text: '✂️ Downgrade: Temporarily disable the broken feature and launch the clean core.', trait: 'PatternHunter', scores: { PatternHunter: 40, StrategicThinking: 40 } }
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, refresh } = useAuth();
  const cOS = useCareerOS();

  useEffect(() => {
    preloadTTS();
    const introText = "Welcome to your personal diagnostic assessment! First, are you a college student, a fresh graduate, or a working professional?";
    preloadNextSpeech(introText, 'priya');
  }, []);

  // Screen/Route States: 'CHOOSE_GUIDE' | 'INTENT_SELECTION' | 'SLIDER' | 'EXPRESS_FORM' | 'DEEP_CHAT' | 'IDENTITY_QUESTIONS' | 'WORKPLACE_SIMULATION' | 'SPEECH_ASSESSMENT' | 'BLUEPRINT_REVEAL'
  const [activeScreen, setActiveScreen] = useState<'CHOOSE_GUIDE' | 'INTENT_SELECTION' | 'SLIDER' | 'EXPRESS_FORM' | 'DEEP_CHAT' | 'IDENTITY_QUESTIONS' | 'WORKPLACE_SIMULATION' | 'SPEECH_ASSESSMENT' | 'BLUEPRINT_REVEAL'>('CHOOSE_GUIDE');
  
  const activeScreenRef = useRef(activeScreen);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  const stopAvatarSpeaking = () => {
    stopSpeaking();
    setIsAvatarSpeaking(false);
    isSpeakingRef.current = false;
    setAnimState('idle');
  };

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      // Autoplay Block and Permission Warning detector
      const checkAudioAutoplay = async () => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioCtx.state === 'suspended') {
            toast.warning(
              "🔊 Sound / Audio Blocked",
              "Chrome has blocked sound for this site. Click the settings icon next to the URL, turn 'Sound' to ON, and click anywhere to unmute!"
            );
          }
        } catch (e) {
          console.log("AudioContext check failed:", e);
        }
      };
      
      const statusTimer = setTimeout(checkAudioAutoplay, 1500);

      // Check microphone permission
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName })
          .then(status => {
            if (status.state === 'denied') {
              toast.info(
                "🎤 Microphone Access Blocked",
                "Please click the lock/settings icon in the browser address bar and enable 'Microphone' to use voice dictation!"
              );
            }
          })
          .catch(e => console.log('Permission check failed:', e));
      }

      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        clearTimeout(statusTimer);
      };
    }
  }, []);
  
  // Common States
  const [animState, setAnimState] = useState<'idle' | 'talking' | 'listening' | 'thinking' | 'wave' | 'nod' | 'shrug'>('wave');
  const [zoom, setZoom] = useState(1.65);
  const [isMuted, setIsMuted] = useState(false);
  const [useNeural, setUseNeural] = useState(true);
  const [recognizing, setRecognizing] = useState(false);

  // Voice Analytics States
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);
  const [voiceConfidence, setVoiceConfidence] = useState<number | null>(null);
  const [voiceArticulation, setVoiceArticulation] = useState<number | null>(null);
  const [voiceArchetype, setVoiceArchetype] = useState<string | null>(null);

  // Screen 02: Potential Slider States
  const [currentAbility, setCurrentAbility] = useState(30);
  const [targetAmbition, setTargetAmbition] = useState(85);

  // Screen 03: Express Form States
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [trajectory, setTrajectory] = useState<'java_sde' | 'react_frontend' | 'devops_cloud'>('react_frontend');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Chat/Deep Diagnostics States
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepRef = useRef(currentStep);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [studentType, setStudentType] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [accessReason, setAccessReason] = useState('');
  const [codingExperience, setCodingExperience] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');

  // Screen 04-07 States
  const [currentIdentityQ, setCurrentIdentityQ] = useState(0);
  const [identityScores, setIdentityScores] = useState<Record<string, number>>({ logic: 50, pace: 50 });
  const [currentScenario, setCurrentScenario] = useState(0);
  const [simulationScores, setSimulationScores] = useState<Record<string, number>>({ PatternHunter: 0, Stabilizer: 0, SocialIQ: 0, Explorer: 0 });
  const [speechState, setSpeechState] = useState<'ready' | 'calibrating' | 'calibrated' | 'recording' | 'recorded'>('ready');
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [computedArchetype, setComputedArchetype] = useState('Pattern Hunter');
  const [selectedMentor, setSelectedMentor] = useState<'priya' | 'anish'>('priya');

  // Syncing & Parsing States
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [parserLogs, setParserLogs] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriberRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechTimersRef = useRef<any[]>([]);

  const clearSpeechTimers = () => {
    speechTimersRef.current.forEach(timer => clearTimeout(timer));
    speechTimersRef.current = [];
  };

  const scheduleSpeech = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      if (speechTimersRef.current) {
        speechTimersRef.current = speechTimersRef.current.filter(t => t !== timer);
      }
      callback();
    }, delay);
    speechTimersRef.current.push(timer);
    return timer;
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Intent Selection Voice Greeting
  const intentGreeting = "Welcome to PinIT Career OS. I am your guidance mentor. Before we begin, do you want to continue with the Express Route to upload your resume in 1 minute, or the Deep Evolution path for a 15-minute diagnostic assessment?";

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      clearSpeechTimers();
      stopAvatarSpeaking();
    };
  }, []);

  // Voice greeting triggers on transition to INTENT_SELECTION
  useEffect(() => {
    if (activeScreen === 'INTENT_SELECTION') {
      const timer = scheduleSpeech(() => {
        speakReply(intentGreeting);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [activeScreen, selectedMentor]);

  // Native Speech TTS
  const speakReply = (text: string) => {
    clearSpeechTimers();
    stopVoiceListening();
    isSpeakingRef.current = true;
    setIsAvatarSpeaking(true);

    speakWithAvatar(
      text,
      selectedMentor,
      () => setAnimState('talking'),
      () => {
        setAnimState('idle');
        isSpeakingRef.current = false;
        setIsAvatarSpeaking(false);
      },
      isMuted,
      useNeural
    );
  };

  // Helper to convert recorded audio blob to Float32 PCM at 16kHz mono (required by Whisper)
  const getAudioRawData = async (blob: Blob): Promise<Float32Array> => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const arrayBuf = await blob.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);
    const channelData = decoded.getChannelData(0);
    await audioCtx.close();
    return channelData;
  };

  // Lazy-load in-browser Whisper transcriber pipeline from CDN (Webpack-bypass)
  const loadInBrowserTranscriber = async () => {
    if (transcriberRef.current) return transcriberRef.current;
    try {
      const dynamicImport = new Function('url', 'return import(url)');
      const { pipeline, env } = await dynamicImport('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      env.allowLocalModels = false;
      const pipelineInstance = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
      transcriberRef.current = pipelineInstance;
      return pipelineInstance;
    } catch (err) {
      console.error("In-browser transcriber load failed:", err);
      return null;
    }
  };

  // Voice Speech Recording using MediaRecorder & Groq Whisper
  const startVoiceListening = async () => {
    if (typeof window === 'undefined') return;

    if (isListeningRef.current) {
      stopVoiceListening();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          isListeningRef.current = false;
          setRecognizing(false);
          setAnimState('idle');
          return;
        }

        setAnimState('thinking');
        let transcript = '';
        
        // 1. Try Groq Whisper online STT first for maximum accuracy
        try {
          const keysStr = process.env.GROQ_API_KEYS || '';
          let keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
          const singleKey = process.env.GROQ_API_KEY;
          if (singleKey && !keys.includes(singleKey)) {
            keys.push(singleKey);
          }

          for (const key of keys) {
            try {
              const formData = new FormData();
              formData.append('file', audioBlob, 'speech.webm');
              formData.append('model', 'whisper-large-v3');
              formData.append('language', 'en');

              const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${key}`
                },
                body: formData
              });

              if (res.ok) {
                const data = await res.json();
                transcript = (data.text || '').trim();
                console.log("[Online STT] Transcribed via Groq Whisper:", transcript);
                break;
              } else {
                throw new Error(`Whisper transcription failed: ${res.status}`);
              }
            } catch (err: any) {
              console.warn(`[Online STT Failover] Key failed: ${key.slice(0, 10)}... Error: ${err.message}`);
            }
          }
        } catch (err) {
          console.warn("[Online STT] Groq Whisper failed or was blocked, falling back to In-Browser Offline Whisper:", err);
        }

        // 2. Fallback to In-Browser Offline Whisper STT
        if (!transcript) {
          try {
            const audioRaw = await getAudioRawData(audioBlob);
            const transcriber = await loadInBrowserTranscriber();
            if (transcriber) {
              const output = await transcriber(audioRaw, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
              });
              transcript = (output.text || '').trim();
              console.log("[In-Browser Offline STT] Transcribed:", transcript);
            }
          } catch (offlineErr) {
            console.error("[Offline STT] In-browser transcription failed:", offlineErr);
          }
        }
          
          if (transcript) {
            if (activeScreenRef.current === 'INTENT_SELECTION' && speechStartTime) {
              const duration = (Date.now() - speechStartTime) / 1000;
              const words = transcript.split(/\s+/).filter(Boolean).length;
              const wpm = duration > 0 ? (words / duration) * 60 : 125;

              const fillerRegex = /\b(um|uh|like|basically|actually|so|ah)\b/gi;
              const fillerCount = (transcript.match(fillerRegex) || []).length;

              let confidence = 100 - fillerCount * 12;
              if (wpm < 80) confidence -= 15;
              if (wpm > 180) confidence -= 10;
              confidence = Math.max(40, Math.min(100, Math.round(confidence)));

              let articulation = 90 - fillerCount * 8;
              if (wpm >= 110 && wpm <= 150) articulation += 10;
              articulation = Math.max(50, Math.min(100, Math.round(articulation)));

              let archetype = 'Direct Builder';
              if (wpm > 135 && fillerCount <= 1) {
                archetype = 'Expressive Communicator';
              } else if (wpm < 95 && fillerCount <= 2) {
                archetype = 'Reflective Analyst';
              }

              setVoiceConfidence(confidence);
              setVoiceArticulation(articulation);
              setVoiceArchetype(archetype);

              if (archetype === 'Reflective Analyst') {
                setComputedArchetype('Stabilizer');
              } else if (archetype === 'Expressive Communicator') {
                setComputedArchetype('Social IQ');
              }
            }
            handleUserAnswer(transcript);
          } else {
            triggerAutoRestart();
          }
      };

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpokenTime = Date.now();
      let hasSpoken = false;
      const recordingStartTime = Date.now();
      let noiseFloorSum = 0;
      let noiseFloorSamples = 0;

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        const recordingDuration = Date.now() - recordingStartTime;

        // Auto-stop recording if it exceeds 7 seconds (fail-safe timeout)
        if (recordingDuration > 7000) {
          stopVoiceListening();
          return;
        }

        // Calibrate noise floor for the first 350ms
        if (recordingDuration < 350) {
          noiseFloorSum += average;
          noiseFloorSamples++;
          requestAnimationFrame(checkSilence);
          return;
        }

        const calculatedNoiseFloor = noiseFloorSamples > 0 ? (noiseFloorSum / noiseFloorSamples) : 5;
        const dynamicThreshold = Math.max(8, calculatedNoiseFloor + 12);

        if (average > dynamicThreshold) { 
          lastSpokenTime = Date.now();
          hasSpoken = true;
        }

        const silenceDuration = Date.now() - lastSpokenTime;

        if ((hasSpoken && silenceDuration > 1800) || (!hasSpoken && silenceDuration > 5000)) {
          stopVoiceListening();
        } else {
          requestAnimationFrame(checkSilence);
        }
      };

      mediaRecorder.start();
      isListeningRef.current = true;
      setRecognizing(true);
      setAnimState('listening');
      setSpeechStartTime(Date.now());

      requestAnimationFrame(checkSilence);

    } catch (err) {
      console.error("Microphone setup failed:", err);
      toast.error("Microphone Blocked", "Please enable microphone permissions in your browser settings to continue.");
    }
  };

  const stopVoiceListening = () => {
    isListeningRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecognizing(false);
    setAnimState('idle');
  };

  const triggerAutoRestart = () => {
    if (
      (activeScreenRef.current === 'INTENT_SELECTION' || activeScreenRef.current === 'DEEP_CHAT') &&
      !isSpeakingRef.current
    ) {
      setTimeout(() => {
        if (
          (activeScreenRef.current === 'INTENT_SELECTION' || activeScreenRef.current === 'DEEP_CHAT') &&
          !isSpeakingRef.current
        ) {
          startVoiceListening();
        }
      }, 500);
    }
  };

  // Transition to Deep Route Chatflow
  const startDeepDiagnostics = () => {
    clearSpeechTimers();
    setActiveScreen('DEEP_CHAT');
    setAnimState('nod');
    const introText = "Welcome to your personal diagnostic assessment! First, are you a college student, a fresh graduate, or a working professional?";
    setMessages([
      {
        id: 'welcome_deep',
        sender: 'ai',
        text: introText,
        timestamp: Date.now()
      }
    ]);
    scheduleSpeech(() => {
      speakReply(introText);
    }, 500);
  };

  // Handle chatbot answers (Deep Path)
  const handleUserAnswer = (text: string) => {
    if (!text.trim()) return;

    if (activeScreen === 'INTENT_SELECTION') {
      const lower = text.toLowerCase();
      if (lower.includes('express') || lower.includes('one minute') || lower.includes('resume') || lower.includes('fast')) {
        setActiveScreen('EXPRESS_FORM');
        return;
      }
      if (lower.includes('deep') || lower.includes('evolution') || lower.includes('diagnostic') || lower.includes('fifteen') || lower.includes('graph')) {
        startDeepDiagnostics();
        return;
      }
      if (lower.includes('repeat') || lower.includes('again') || lower.includes('ask again') || lower.includes('speak')) {
        speakReply(intentGreeting);
        return;
      }
      if (lower.includes('back') || lower.includes('change') || lower.includes('guide')) {
        stopAvatarSpeaking();
        setActiveScreen('CHOOSE_GUIDE');
        return;
      }
      // Default fallback: receive whatever input the user speaks and route directly to Deep Diagnostics
      startDeepDiagnostics();
      return;
    }

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setAnimState('thinking');

    scheduleSpeech(() => {
      const step = currentStepRef.current;
      if (step === 0) {
        setStudentType(text);
        setCurrentStep(1);
        setAnimState('nod');
        const aiReply = "Got it! Next, what is your dream job? Do you want to build websites, work with clouds, or build software?";
        setMessages(prev => [...prev, {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now()
        }]);
        speakReply(aiReply);
      } else if (step === 1) {
        setTargetGoal(text);
        setCurrentStep(2);
        setAnimState('nod');
        const aiReply = "Nice choice. Why did you join today? Are you looking for a job, wanting to learn new skills, or preparing for an interview?";
        setMessages(prev => [...prev, {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now()
        }]);
        speakReply(aiReply);
      } else if (step === 2) {
        setAccessReason(text);
        setCurrentStep(3);
        setAnimState('nod');
        const aiReply = "Understood. Next question: How much coding experience do you have? Are you a beginner, intermediate, or advanced coder?";
        setMessages(prev => [...prev, {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now()
        }]);
        speakReply(aiReply);
      } else if (step === 3) {
        setCodingExperience(text);
        setCurrentStep(4);
        setAnimState('nod');
        const aiReply = "Understood. How do you prefer to learn? Do you like reading articles, watching videos, or writing code hands-on?";
        setMessages(prev => [...prev, {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now()
        }]);
        speakReply(aiReply);
      } else if (step === 4) {
        setLearningStyle(text);
        setCurrentStep(5);
        setAnimState('nod');
        const aiReply = "Last question: How many hours per week can you dedicate to learning? Five hours, ten hours, or more?";
        setMessages(prev => [...prev, {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now()
        }]);
        speakReply(aiReply);
      } else if (step === 5) {
        setWeeklyHours(text);
        setCurrentStep(6);
        setAnimState('nod');
        const aiReply = "Fantastic! Next, let's load your Identity Discovery slides to establish your cognitive styles.";
        setMessages(prev => [...prev, {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now()
        }]);
        speakReply(aiReply);

        scheduleSpeech(() => {
          setActiveScreen('IDENTITY_QUESTIONS');
          setAnimState('idle');
        }, 1500);
      }
    }, 1000);
  };

  // Complete Onboarding: Sync to database & generate dynamic quest roadmap
  const handleOnboardingComplete = async (profileType: string, goalRole: string, reason: string, finalArch?: string) => {
    setSyncing(true);
    setSyncProgress(10);
    setSyncStatus('Registering student trajectory...');

    const userId = user?.id || 'guest';
    const modulesKey = `pinit_${userId}_roadmap_modules`;

    const goalLower = goalRole.toLowerCase();
    let selectedPath: 'java_sde' | 'react_frontend' | 'devops_cloud' = 'java_sde';
    let targetRoleLabel = 'Software Engineer';
    let skillsList = 'Java Standard Library, OOP Principles, Spring Boot REST, SQL Databases, System Design';

    if (goalLower.includes('design') || goalLower.includes('ux') || goalLower.includes('ui') || goalLower.includes('front') || goalLower.includes('react')) {
      selectedPath = 'react_frontend';
      targetRoleLabel = 'UI/UX Designer';
      skillsList = 'React Hooks, NextJS SSR, Vanilla CSS, Zustand State, TypeScript Types';
    } else if (goalLower.includes('devops') || goalLower.includes('cloud') || goalLower.includes('aws') || goalLower.includes('pipeline') || goalLower.includes('docker')) {
      selectedPath = 'devops_cloud';
      targetRoleLabel = 'DevOps Engineer';
      skillsList = 'Docker Containers, CI/CD Pipelines, AWS Cloud Services, Prometheus & Grafana, Kubernetes Orchestration';
    }

    setTimeout(() => {
      setSyncProgress(40);
      setSyncStatus('Initializing Career Builder configuration...');
    }, 600);

    setTimeout(() => {
      setSyncProgress(75);
      setSyncStatus('Synchronizing credential vault with cryptographic Sentinel registry...');
    }, 1200);

    setTimeout(async () => {
      setSyncProgress(100);
      setSyncStatus('Activating Command Center dashboard...');

      try {
        // Calculate QT1 and QT2 scores dynamically
        const computedQT1 = Math.floor(Math.random() * (85 - 65 + 1)) + 65; // e.g. 65 to 85 (Credentials index)
        const computedQT2 = Math.floor(Math.random() * (95 - 70 + 1)) + 70; // e.g. 70 to 95 (Cognitive index)

        const payload = {
          guidanceMentorId: selectedMentor,
          onboardingStep: 3, // Set to STATE_3 (Blueprint Generated)
          onboardingAnswers: {
            role: targetRoleLabel,
            education: profileType,
            skills: finalArch ? `Archetype: ${finalArch}. Skills: ${skillsList}` : skillsList,
            experience: parseExperience(profileType),
            hasCompleted: true,
            codingExperience,
            learningStyle,
            weeklyHours,
            accessReason: reason,
            qt1_score: computedQT1,
            qt2_score: computedQT2,
            mindset_archetype: finalArch || 'Pattern Hunter'
          },
          roadmapGenerated: true
        };

        await api.post('/api/auth/onboarding', payload);
        
        // Force refresh user profile session inside AuthContext
        await refresh();

        // Seed simulated Vault items in local storage
        const dummyVaultItems = [
          {
            id: 'vault_resume_' + Date.now(),
            title: 'Professional Software Engineer Resume',
            item_type: 'resume',
            organization_name: 'Verified PDF Portal',
            description: 'Extracted skills: React, TypeScript, Node.js, SQL. Initial experience rating: Intern/Junior SDE.',
            verified: true,
            ai_confidence_score: 92,
            skill_tags: ['React', 'TypeScript', 'Node.js', 'SQL'],
            is_public: true,
            used_in_resume: true,
            used_in_portfolio: true
          },
          {
            id: 'vault_cert_' + Date.now(),
            title: 'Sentinel Cryptographic Systems Certification',
            item_type: 'certification',
            organization_name: 'Sentinel Academic Registry',
            description: 'Credential demonstrating capability in cloud services and secure routing.',
            verified: true,
            ai_confidence_score: 95,
            skill_tags: ['Docker', 'System Design', 'CI/CD'],
            is_public: true,
            used_in_resume: true,
            used_in_portfolio: false
          }
        ];
        cOS.setVaultItems(dummyVaultItems);
        
        // Sync context state locally
        cOS.setOnboarding({
          role: targetRoleLabel,
          education: profileType,
          skills: finalArch ? `Archetype: ${finalArch}. Skills: ${skillsList}` : skillsList,
          experience: parseExperience(profileType),
          codingExperience,
          learningStyle,
          weeklyHours,
          accessReason: reason
        }, true);
        cOS.setOnboardingStep(3); // Update master state to 3
        cOS.setResumeGenerated(false); // Deep route doesn't generate resume automatically
        
        // Generate baseline roadmap based on trajectory
        const skillsArray = skillsList.split(',').map(s => s.trim());
        await cOS.generateFusedRoadmap(skillsArray, ['Docker', 'System Design']); // default gaps
        
        await qc.invalidateQueries({ queryKey: KEYS.me });
        toast.success('Onboarding Complete! 🚀', 'Your diagnostic blueprint is active.');
        sessionStorage.setItem('pinit_just_onboarded', 'true');
        router.push('/dashboard');
      } catch (err) {
        console.error("Onboarding sync failure", err);
        setSyncing(false);
        toast.error('Sync failed', 'Please check your connection and try again.');
      }
    }, 1800);
  };

  // Express Path: Submit Form & Trigger Resume Parsing
  const handleExpressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college || !degree || !uploadedFile) {
      toast.error('Details Required', 'Please fill in all academic details and upload a resume PDF.');
      return;
    }

    setSyncing(true);
    setSyncProgress(5);
    setSyncStatus('Initializing resume upload...');
    setParserLogs(['[1/5] Establising secure tunnel to parser gateway...', '[1/5] Ready for stream...']);

    // Simulate PDF parsing logs over time
    const logTimeline = [
      { progress: 20, status: 'Uploading PDF to Sentinel sandbox...', log: '[2/5] Transmitting payload bytes: ' + (uploadedFile.size / 1024).toFixed(1) + ' KB' },
      { progress: 45, status: 'Parsing PDF text layers & structural layout...', log: '[3/5] Extracting OCR layers. Detected font maps, structural columns, and header fields.' },
      { progress: 70, status: 'Analyzing skills and cross-checking gaps...', log: '[4/5] Extracting skill nodes. Matched: Git, SQL, Java, React. Detected gaps: Docker, CI/CD, Kubernetes.' },
      { progress: 90, status: 'Initializing Human Graph blueprint...', log: '[5/5] Mapping credentials OCR to Sentinel registry. Security signatures generated.' },
      { progress: 100, status: 'Finalizing setup...', log: '[5/5] Success: Profile generated with 0% Initial Trust Score.' }
    ];

    logTimeline.forEach((t, i) => {
      setTimeout(() => {
        setSyncProgress(t.progress);
        setSyncStatus(t.status);
        setParserLogs(prev => [...prev, t.log]);
      }, (i + 1) * 600);
    });

    setTimeout(async () => {
      // API call to upload resume and get structured resume properties
      try {
        const userId = user?.id || 'guest';
        const trajectoryLabel = trajectory === 'java_sde' ? 'Java Backend SDE' : trajectory === 'react_frontend' ? 'React Frontend Web SDE' : 'DevOps Cloud Engineer';
        
        let skillsList = '';
        let weakAreas: string[] = [];
        if (trajectory === 'java_sde') {
          skillsList = 'Java Standard Library, OOP Principles, Spring Boot REST, SQL Databases, System Design';
          weakAreas = ['Docker', 'System Design', 'Microservices'];
        } else if (trajectory === 'react_frontend') {
          skillsList = 'React Hooks, NextJS SSR, Vanilla CSS, Zustand State, TypeScript Types';
          weakAreas = ['Webpack', 'React Performance', 'Testing Library'];
        } else {
          skillsList = 'Docker Containers, CI/CD Pipelines, AWS Cloud Services, Prometheus & Grafana, Kubernetes Orchestration';
          weakAreas = ['Kubernetes Security', 'Terraform IaC', 'Linux Scripting'];
        }

        // Pack and transmit real PDF resume file payload
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('userId', userId);
        formData.append('trajectory', trajectory);
        await api.post('/api/resume/upload', formData);

        // Save Auth profile onboarding answers
        const computedQT1 = Math.floor(Math.random() * (85 - 65 + 1)) + 65; // e.g. 65 to 85 (Credentials index)
        const computedQT2 = Math.floor(Math.random() * (95 - 70 + 1)) + 70; // e.g. 70 to 95 (Cognitive index)

        const payload = {
          onboardingStep: 3, // Set to STATE_3 (Blueprint Generated)
          onboardingAnswers: {
            role: trajectoryLabel,
            education: `${degree} at ${college}`,
            skills: skillsList,
            experience: 'fresher',
            hasCompleted: true,
            qt1_score: computedQT1,
            qt2_score: computedQT2,
            mindset_archetype: 'Pattern Hunter' // Default for express path
          },
          roadmapGenerated: true
        };

        await api.post('/api/auth/onboarding', payload);
        
        // Force refresh user profile session inside AuthContext
        await refresh();

        // Seed simulated Vault items in local storage
        const dummyVaultItems = [
          {
            id: 'vault_resume_' + Date.now(),
            title: uploadedFile ? uploadedFile.name : 'Uploaded Resume.pdf',
            item_type: 'resume',
            organization_name: college || 'Verified Academic Portal',
            description: `Extracted skills: ${skillsList}. Initial experience rating: Fresher.`,
            verified: true,
            ai_confidence_score: 89,
            skill_tags: skillsList.split(',').map(s => s.trim()),
            is_public: true,
            used_in_resume: true,
            used_in_portfolio: true
          }
        ];
        cOS.setVaultItems(dummyVaultItems);

        // Save to CareerOSContext local states
        cOS.setOnboarding({
          role: trajectoryLabel,
          education: `${degree} at ${college}`,
          skills: skillsList,
          experience: 'fresher'
        }, true);
        cOS.setOnboardingStep(3); // Update onboardingStep to 3
        cOS.setResumeGenerated(true); // Flag resume uploaded
        
        // Generate Quest modules
        const skillsArray = skillsList.split(',').map(s => s.trim());
        await cOS.generateFusedRoadmap(skillsArray, weakAreas);

        await qc.invalidateQueries({ queryKey: KEYS.me });
        toast.success('Express Onboarding Complete! ⚡', 'Unlock your dashboard and provisional job matches.');
        sessionStorage.setItem('pinit_just_onboarded', 'true');
        router.push('/dashboard');
      } catch (err) {
        console.error('Express onboarding failure', err);
        setSyncing(false);
        toast.error('Sync failed', 'Please check your connection and try again.');
      }
    }, 3800);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        toast.info('Resume Selected', `${file.name} ready for analysis.`);
      } else {
        toast.error('Invalid File Type', 'Please upload a PDF document.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        toast.info('Resume Selected', `${file.name} ready for analysis.`);
      } else {
        toast.error('Invalid File Type', 'Please upload a PDF document.');
      }
    }
  };

  // Slider React Dialogue triggers
  const getSliderDialogue = () => {
    const gap = targetAmbition - currentAbility;
    if (gap <= 0) return "You seem extremely confident in your current capabilities! ✦ Let's put them to test inside our Monaco workspace.";
    if (gap > 60) return `A verification gap of ${gap}% requires intensive socratic quests, unit testing sandboxes, and certifications upload to achieve. Let's construct a target blueprint.`;
    return `An active gap of ${gap}% is highly manageable. Let's close it using targeted micro-missions and Daily Quests!`;
  };

  return (
    <div style={{ height: '100vh', background: '#030508', color: '#f1f5f9', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body), sans-serif' }}>
      
      {/* Preload VRoid avatar in background by overlaying mentor selection */}
      {activeScreen === 'CHOOSE_GUIDE' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#030508', color: '#f1f5f9', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '60px 24px' }}>
          {/* Dynamic Background Mesh Orbits */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '95%', width: '95%', margin: '0 auto', zIndex: 10, textAlign: 'center' }}>
            {/* Logo Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
              <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>Pi</div>
              <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>PinIT Career OS</span>
            </div>

            <div style={{ marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, display: 'block', marginBottom: 12 }}>
                Staging Environment Setup
              </span>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
                Choose Your Guidance Mentor
              </h1>
              <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                Select the personal AI guide that will calibrate your career roadmap, analyze your communication DNA, and lead your socratic assessments.
              </p>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 48 }}>
              {/* Ms. Priya */}
              <div 
                onClick={() => {
                  setSelectedMentor('priya');
                  startDeepDiagnostics();

                }}
                style={{
                  background: 'rgba(10, 15, 26, 0.4)',
                  border: '1.5px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 24,
                  padding: 36,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(79, 70, 229, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 20 }}>👩‍💼</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>Ms. Priya</h2>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 16 }}>
                  Full-Stack Systems Mentor
                </span>
                <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  Specialized in systems design, databases, backend infrastructure, and interview preparation. Prefers analytical structure and deep socratic drilling.
                </p>
              </div>

              {/* Mr. Anish */}
              <div 
                onClick={() => {
                  setSelectedMentor('anish');
                  startDeepDiagnostics();

                }}
                style={{
                  background: 'rgba(10, 15, 26, 0.4)',
                  border: '1.5px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 24,
                  padding: 36,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--teal)';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 20 }}>👨‍💼</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>Mr. Akash</h2>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 16 }}>
                  Interactive UX & Frontend Engineer
                </span>
                <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  Specialized in React, Next.js, responsive layouts, user experience, design systems, and rapid prototyping. Focuses on visual feedback and hands-on building.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dynamic Background Mesh Orbits */}
      <div style={{ position: 'absolute', top: '-15%', left: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none' }} />

      {/* Top Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(10,15,26,0.3)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14 }}>Pi</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>PinIT Career OS</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100, padding: '4px 12px' }}>
            {activeScreen === 'INTENT_SELECTION' ? 'STAGE 01: INTENT SELECTION' : 'STAGE 02: PROFILE GENERATION'}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '80fr 20fr', maxWidth: '95%', width: '95%', margin: '0 auto', padding: '12px 24px 24px 24px', gap: 24, zIndex: 5, overflow: 'hidden' }}>
        
        {/* Left Column: VRoid Mentor Viewport */}
        <section style={{ background: 'rgba(10, 15, 26, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {selectedMentor === 'anish' ? (
              <VRoidInterviewAvatar teacherId="kashyap" animState={animState} zoom={zoom} />
            ) : (
              <VRoidInterviewAvatar teacherId="priya" animState={animState} zoom={zoom} />
            )}
            
            {/* Audio Wave Listening Overlay */}
            {animState === 'listening' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,70,229,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="mic-wave-bar" style={{ width: 4, height: 20, background: 'var(--accent)', borderRadius: 2, animation: `pulse-height 1s ease-in-out infinite alternate ${i * 0.15}s` }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>Listening... Speak now</div>
              </div>
            )}
          </div>

          {/* Floating Controls Overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'rgba(10,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '6px 12px', backdropFilter: 'blur(10px)', zIndex: 12 }}>
            <button onClick={() => setZoom(z => Math.min(2.2, z + 0.1))} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '4px 8px' }} title="Zoom In">🔍+</button>
            <button onClick={() => setZoom(z => Math.max(1.1, z - 0.1))} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '4px 8px' }} title="Zoom Out">🔍-</button>
            <button onClick={() => setIsMuted(m => !m)} style={{ background: 'none', border: 'none', color: isMuted ? '#f87171' : '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '4px 8px' }} title={isMuted ? "Unmute Voice" : "Mute Voice"}>
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button 
              onClick={() => {
                if (!useNeural && !window.confirm("WARNING: Running Custom Neural TTS (Kitten) is resource-heavy and requires a steady internet connection. Proceed?")) {
                  return;
                }
                setUseNeural(!useNeural);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: useNeural ? '#10b981' : '#94a3b8',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title={useNeural ? "Disable Kitten Voice" : "Enable Kitten Voice"}
            >
              {useNeural ? '🎙️ Neural' : '🔇 Silent'}
            </button>
          </div>
        </section>

        {/* Right Column: Screen panels */}
        <section style={{ display: 'flex', flexDirection: 'column', background: 'rgba(10, 15, 26, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', minHeight: 0 }}>
          
          {/* Active Screen Rendering */}

          {/* SCREEN 01: INTENT SELECTION */}
          {activeScreen === 'INTENT_SELECTION' && (
            <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
                  Choose Your Staging Track
                </h2>
                <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  The staging sandbox is initialized. Select your diagnostic track to calculate your career blueprint.
                </p>
              </div>

              {/* Selection cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                
                {/* Express Route Card */}
                <div 
                  onClick={() => setActiveScreen('EXPRESS_FORM')}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Express Route (1 Min)</h3>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                    Upload resume PDF directly to extract baseline skills.
                  </p>
                </div>

                {/* Deep Diagnostic Card */}
                <div 
                  onClick={startDeepDiagnostics}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>🔬</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Deep Evolution (15 Min)</h3>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                    Complete full diagnostic profiling and assessments.
                  </p>
                </div>

              </div>

              {/* Real-time Voice Analytics Card */}
              {voiceConfidence !== null && (
                <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1.5px solid rgba(79, 70, 229, 0.2)', borderRadius: 14, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>🎙️ Realtime Voice DNA:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <span style={{ color: '#94a3b8' }}>Confidence Index:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 700 }}>{voiceConfidence}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <span style={{ color: '#94a3b8' }}>Articulation Score:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 700 }}>{voiceArticulation}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <span style={{ color: '#94a3b8' }}>Vocal Archetype:</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{voiceArchetype}</span>
                  </div>
                </div>
              )}

              {/* Utility buttons: Go Back and Repeat Voice */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={() => {
                    stopAvatarSpeaking();
                    setActiveScreen('CHOOSE_GUIDE');
                  }}
                  style={{
                    height: 38,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    color: '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  ← Change Guide
                </button>
                <button
                  onClick={() => {
                    speakReply(intentGreeting);
                  }}
                  style={{
                    height: 38,
                    background: 'rgba(79, 70, 229, 0.15)',
                    border: '1px solid rgba(79, 70, 229, 0.3)',
                    borderRadius: 10,
                    color: '#a5b4fc',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.15)';
                  }}
                >
                  🎙️ Repeat Voice
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopAvatarSpeaking();
                  handleOnboardingComplete(
                    'Self-Taught / Other Learner',
                    'Software Engineer',
                    'To close skill gaps & earn XP',
                    'Pattern Hunter'
                  );
                }}
                style={{
                  marginTop: 16,
                  height: 40,
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
                  border: '1.5px dashed rgba(79, 70, 229, 0.35)',
                  borderRadius: 10,
                  color: 'var(--accent)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-mono)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.35)';
                }}
              >
                ⏩ Skip Onboarding (Complete Setup)
              </button>
            </div>
          )}

          {/* SCREEN 02: POTENTIAL SLIDER */}
          {activeScreen === 'SLIDER' && (
            <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
              <button 
                onClick={() => setActiveScreen('INTENT_SELECTION')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, alignSelf: 'flex-start', marginBottom: 20 }}
              >
                ← Go Back
              </button>

              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginBottom: 8, letterSpacing: '-0.5px' }}>
                  Define Your Evolution Gap
                </h2>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  Slide to indicate your estimated current skill level compared to your dream placement ambition. This initializes the roadmap density calculations.
                </p>
              </div>

              {/* Slider Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                
                {/* Current Skill Ability */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Current Technical Ability</span>
                    <span style={{ color: 'var(--accent)' }}>{currentAbility}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="80" 
                    value={currentAbility}
                    onChange={(e) => setCurrentAbility(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 4 }}>
                    <span>Novice</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                  </div>
                </div>

                {/* Target Career Ambition */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Target Career Ambition</span>
                    <span style={{ color: 'var(--teal)' }}>{targetAmbition}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="60" 
                    max="100" 
                    value={targetAmbition}
                    onChange={(e) => setTargetAmbition(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--teal)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 4 }}>
                    <span>Competent (60%)</span>
                    <span>Top-Tier (85%)</span>
                    <span>Legendary (100%)</span>
                  </div>
                </div>

              </div>

              {/* Calculations Box */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 18, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>The Verification Gap:</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--coral)', fontFamily: 'var(--font-mono)' }}>
                    {targetAmbition - currentAbility}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${targetAmbition - currentAbility}%`, background: 'linear-gradient(90deg, var(--coral), var(--accent))', borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, lineHeight: 1.5, fontStyle: 'italic' }}>
                  {getSliderDialogue()}
                </p>
              </div>

              <button
                onClick={startDeepDiagnostics}
                style={{
                  width: '100%',
                  height: 46,
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Proceed to Diagnostic Questionnaire
              </button>
            </div>
          )}

          {/* SCREEN 03: EXPRESS FORM & RESUME PARSER */}
          {activeScreen === 'EXPRESS_FORM' && (
            <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <button 
                onClick={() => setActiveScreen('INTENT_SELECTION')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11, alignSelf: 'flex-start', marginBottom: 14 }}
              >
                ← Go Back
              </button>

              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', marginBottom: 6, letterSpacing: '-0.5px' }}>
                  Express Staging setup
                </h2>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>
                  Provide your target trajectory & academic demographics. Then drag & drop your resume PDF to verify.
                </p>
              </div>

              <form onSubmit={handleExpressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Trajectory Selector */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Target SDE Trajectory</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { id: 'react_frontend', label: 'React Frontend', emoji: '⚛️' },
                      { id: 'java_sde', label: 'Java Backend', emoji: '☕' },
                      { id: 'devops_cloud', label: 'DevOps Cloud', emoji: '☁️' }
                    ].map(t => (
                      <div
                        key={t.id}
                        onClick={() => setTrajectory(t.id as any)}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: `1.5px solid ${trajectory === t.id ? 'var(--accent)' : 'rgba(255,255,255,0.04)'}`,
                          background: trajectory === t.id ? 'rgba(79, 70, 229, 0.08)' : 'rgba(255,255,255,0.01)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{t.emoji}</div>
                        <div>{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* College Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>College Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apex Institute" 
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      style={{ width: '100%', height: 38, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0 12px', fontSize: 12.5, color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Degree Major</label>
                    <input 
                      type="text" 
                      placeholder="e.g. B.Tech CSE" 
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      style={{ width: '100%', height: 38, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0 12px', fontSize: 12.5, color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    height: 110,
                    borderRadius: 12,
                    border: `1.5px dashed ${dragOver ? 'var(--accent)' : uploadedFile ? 'var(--teal)' : 'rgba(255,255,255,0.1)'}`,
                    background: dragOver ? 'rgba(79, 70, 229, 0.04)' : uploadedFile ? 'rgba(20, 184, 166, 0.02)' : 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect}
                    accept="application/pdf"
                    style={{ display: 'none' }} 
                  />
                  
                  {uploadedFile ? (
                    <>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>{uploadedFile.name}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Click or drag to change files</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📥</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>Drag & Drop Resume PDF here</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>or click to browse local files</div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!college || !degree || !uploadedFile}
                  style={{
                    width: '100%',
                    height: 42,
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: (!college || !degree || !uploadedFile) ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    marginTop: 6
                  }}
                >
                  Analyze Resume & Launch OS
                </button>
              </form>
            </div>
          )}

          {/* SCREEN 04: DEEP ASSESSMENT CHAT */}
          {activeScreen === 'DEEP_CHAT' && (
            <>
              {/* Chat Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: animState === 'talking' ? '#10b981' : '#6366f1', animation: animState === 'talking' ? 'ping 1.5s infinite' : 'none' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedMentor === 'priya' ? 'Ms. Priya' : 'Mr. Akash'}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{animState === 'talking' ? 'Speaking...' : animState === 'listening' ? 'Listening...' : animState === 'thinking' ? 'Analyzing...' : 'Online'}</div>
                </div>
              </div>

              {/* Chat Timeline */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((m) => {
                  const isAi = m.sender === 'ai';
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isAi ? 'flex-start' : 'flex-end', animation: 'fadeInUp 0.3s ease forwards' }}>
                      <div style={{
                        maxWidth: '85%',
                        padding: '12px 16px',
                        borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        background: isAi ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        border: isAi ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        color: '#f8fafc',
                        fontSize: 13,
                        lineHeight: 1.5,
                        boxShadow: isAi ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)'
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Console (Voice-to-Option Selections) */}
              <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                    {getOptionsForStep().map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={isAvatarSpeaking || animState === 'talking'}
                        onClick={() => handleUserAnswer(opt)}
                        style={{
                          padding: '12px 20px',
                          borderRadius: 14,
                          background: 'rgba(79, 70, 229, 0.1)',
                          border: '1.5px solid rgba(79, 70, 229, 0.3)',
                          color: '#a5b4fc',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: (isAvatarSpeaking || animState === 'talking') ? 'not-allowed' : 'pointer',
                          opacity: (isAvatarSpeaking || animState === 'talking') ? 0.5 : 1,
                          transition: 'all 0.2s',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {(isAvatarSpeaking || animState === 'talking') && (
                    <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                      Please listen to your mentor before answering...
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SCREEN 04: IDENTITY DISCOVERY SLIDERS */}
          {activeScreen === 'IDENTITY_QUESTIONS' && (
            <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
                <span>Identity Discovery</span>
                <span>Slide {currentIdentityQ + 1} of {IDENTITY_QS.length}</span>
              </div>
              
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                  {IDENTITY_QS[currentIdentityQ].category}
                </h3>
                <p style={{ fontSize: 15, color: '#f8fafc', lineHeight: 1.6, fontWeight: 600 }}>
                  {IDENTITY_QS[currentIdentityQ].text}
                </p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={identityScores[IDENTITY_QS[currentIdentityQ].id]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setIdentityScores(prev => ({ ...prev, [IDENTITY_QS[currentIdentityQ].id]: val }));
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 12, fontWeight: 700 }}>
                  <span>← {IDENTITY_QS[currentIdentityQ].left}</span>
                  <span>{identityScores[IDENTITY_QS[currentIdentityQ].id]}%</span>
                  <span>{IDENTITY_QS[currentIdentityQ].right} →</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (currentIdentityQ < IDENTITY_QS.length - 1) {
                    setCurrentIdentityQ(prev => prev + 1);
                  } else {
                    setActiveScreen('WORKPLACE_SIMULATION');
                  }
                }}
                style={{
                  width: '100%', height: 44,
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
                  border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)'
                }}
              >
                {currentIdentityQ < IDENTITY_QS.length - 1 ? 'Save & Slide Next' : 'Proceed to Simulations'}
              </button>
            </div>
          )}

          {/* SCREEN 05: WORKPLACE SIMULATIONS */}
          {activeScreen === 'WORKPLACE_SIMULATION' && (
            <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
                <span>Workplace Simulation</span>
                <span>Card {currentScenario + 1} of {WORKPLACE_SCENARIOS.length}</span>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
                  {WORKPLACE_SCENARIOS[currentScenario].title}
                </h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                  {WORKPLACE_SCENARIOS[currentScenario].text}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {WORKPLACE_SCENARIOS[currentScenario].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Record scores
                      setSimulationScores(prev => {
                        const updated = { ...prev };
                        Object.entries(opt.scores).forEach(([trait, val]) => {
                          updated[trait] = (updated[trait] || 0) + (val as number);
                        });
                        return updated;
                      });

                      if (currentScenario < WORKPLACE_SCENARIOS.length - 1) {
                        setCurrentScenario(prev => prev + 1);
                      } else {
                        setActiveScreen('SPEECH_ASSESSMENT');
                      }
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#f8fafc',
                      fontSize: 12.5,
                      fontWeight: 650,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(79, 70, 229, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 06: SPEECH CALIBRATION & ASSESSMENT */}
          {activeScreen === 'SPEECH_ASSESSMENT' && (
            <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
                <span>Vocal Assessment</span>
                <span style={{ color: 'var(--accent)' }}>Microphone Active</span>
              </div>
              
              {speechState === 'ready' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>Microphone Calibration</h3>
                  <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
                    We calibrate background acoustics and regional accent variations to prevent scoring penalties. Click below to run a 3-second noise test.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSpeechState('calibrating');
                      setAnimState('wave');
                      let p = 0;
                      const iv = setInterval(() => {
                        p += 20;
                        setCalibrationProgress(p);
                        if (p >= 100) {
                          clearInterval(iv);
                          setSpeechState('calibrated');
                          setAnimState('idle');
                        }
                      }, 600);
                    }}
                    style={{
                      padding: '10px 24px',
                      background: 'rgba(79, 70, 229, 0.1)',
                      border: '1.5px solid var(--accent)',
                      borderRadius: 12,
                      color: 'var(--accent)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Run Acoustic Calibration
                  </button>
                </div>
              )}

              {speechState === 'calibrating' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1.5s linear infinite' }}>⬡</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>Calibrating...</h3>
                  <div style={{ width: 140, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, margin: '16px auto', overflow: 'hidden' }}>
                    <div style={{ width: `${calibrationProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b' }}>Checking ambient frequency thresholds.</p>
                </div>
              )}

              {(speechState === 'calibrated' || speechState === 'recording' || speechState === 'recorded') && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                    Spoken Prompt
                  </h3>
                  <p style={{ fontSize: 15, color: '#f8fafc', lineHeight: 1.5, fontWeight: 600, marginBottom: 20 }}>
                    "Please introduce yourself and explain your target software career goals."
                  </p>

                  <div style={{
                    minHeight: 100,
                    background: '#070913',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#34d399',
                    marginBottom: 20,
                    textAlign: 'left'
                  }}>
                    <span style={{ color: '#64748b', display: 'block', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 8 }}>
                      STT TRANSCRIPT
                    </span>
                    {speechTranscript || (speechState === 'recording' ? 'Listening... Speak now...' : 'Click Record and start speaking...')}
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (speechState === 'recording') {
                          // Stop
                          setSpeechState('recorded');
                          setAnimState('idle');
                          if (recognitionRef.current) recognitionRef.current.stop();
                        } else {
                          // Start
                          setSpeechState('recording');
                          setSpeechTranscript('');
                          setAnimState('listening');
                          
                          if (typeof window !== 'undefined') {
                            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                            if (SpeechRecognition) {
                              const rec = new SpeechRecognition();
                              rec.continuous = true;
                              rec.interimResults = false;
                              rec.lang = 'en-US';
                              rec.onresult = (e: any) => {
                                const chunk = e.results[e.results.length - 1]?.[0]?.transcript;
                                if (chunk) {
                                  setSpeechTranscript(prev => prev + ' ' + chunk);
                                }
                              };
                              rec.onerror = () => setSpeechState('recorded');
                              rec.onend = () => setSpeechState('recorded');
                              recognitionRef.current = rec;
                              rec.start();
                            } else {
                              // Simulate typing placeholder if STT not supported
                              setTimeout(() => {
                                setSpeechTranscript("Hello! My name is Alex, and my goal is to become a React Frontend Developer to design premium user interfaces.");
                                setSpeechState('recorded');
                                setAnimState('idle');
                              }, 3000);
                            }
                          }
                        }
                      }}
                      style={{
                        flex: 1, height: 42,
                        background: speechState === 'recording' ? '#dc2626' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${speechState === 'recording' ? '#dc2626' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {speechState === 'recording' ? '⏹ Stop Recording' : '🎙️ Record Answer'}
                    </button>

                    <button
                      type="button"
                      disabled={speechState !== 'recorded' && !speechTranscript}
                      onClick={() => {
                        // Compute primary archetype
                        let maxTrait = 'Pattern Hunter';
                        let maxVal = -1;
                        Object.entries(simulationScores).forEach(([trait, val]) => {
                          if (val > maxVal) {
                            maxVal = val;
                            maxTrait = trait;
                          }
                        });
                        
                        // Map key to clean archetype names
                        const archetypeMap: Record<string, string> = {
                          PatternHunter: 'Pattern Hunter',
                          Stabilizer: 'Stabilizer',
                          SocialIQ: 'Social IQ',
                          Explorer: 'Explorer'
                        };
                        const selectedArch = archetypeMap[maxTrait] || 'Pattern Hunter';
                        setComputedArchetype(selectedArch);
                        
                        setActiveScreen('BLUEPRINT_REVEAL');
                        setAnimState('nod');
                        speakReply(`Congratulations! I have mapped your traits. Let's reveal your SDE Potential mapping and diagnostic blueprint.`);
                      }}
                      style={{
                        flex: 1, height: 42,
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
                        border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer',
                        opacity: (speechState !== 'recorded' && !speechTranscript) ? 0.5 : 1
                      }}
                    >
                      Complete & Grade
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 07: DIAGNOSTIC BLUEPRINT REVEAL */}
          {activeScreen === 'BLUEPRINT_REVEAL' && (
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--teal)', padding: '3px 8px', borderRadius: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                  Diagnostic Blueprint Generated
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', marginTop: 8, letterSpacing: '-0.6px' }}>
                  Engineering Mindset Blueprint
                </h2>
                <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Your cognitive profiles, decision styles, and speech fluency have been processed into your 10-dimension Potential Graph.
                </p>
              </div>

              {/* Archetype Description Box */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>Mindset Characteristics:</h4>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                  Your SDE Potential Map combines logical system architecture, user empathy, risk-resilient engineering, and collaborative communication into a balanced index. This telemetry acts as the foundation for your 30-day readiness roadmap.
                </p>
              </div>

              {/* Trait Gauges Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Problem Solving', score: computedArchetype === 'Pattern Hunter' ? 88 : 74 },
                  { label: 'Execution Velocity', score: computedArchetype === 'Explorer' ? 85 : 70 },
                  { label: 'System Consistency', score: computedArchetype === 'Stabilizer' ? 90 : 72 },
                  { label: 'Communication DNA', score: computedArchetype === 'Social IQ' ? 86 : 76 }
                ].map(trait => (
                  <div key={trait.label} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>{trait.label}</span>
                      <span style={{ color: 'var(--accent)' }}>{trait.score}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${trait.score}%`, background: 'var(--accent)', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 🧑‍💼 Choose Dashboard Mentor Selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.6px', fontFamily: 'var(--font-mono)' }}>
                  Choose Your Dashboard VRoid Guide (Locked After Onboarding)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div 
                    onClick={() => setSelectedMentor('priya')}
                    style={{
                      background: selectedMentor === 'priya' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1.5px solid ${selectedMentor === 'priya' ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: 24 }}>👩‍💼</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedMentor === 'priya' ? '#a5b4fc' : '#f8fafc' }}>Ms. Priya</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Warm, encouraging, structured steps.</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setSelectedMentor('anish')}
                    style={{
                      background: selectedMentor === 'anish' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1.5px solid ${selectedMentor === 'anish' ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: 24 }}>👨‍💼</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedMentor === 'anish' ? '#a5b4fc' : '#f8fafc' }}>Mr. Anish</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>High accountability, metrics-focused.</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOnboardingComplete(studentType, targetGoal, accessReason, computedArchetype)}
                style={{
                  width: '100%', height: 44,
                  background: 'linear-gradient(135deg, var(--teal) 0%, var(--accent) 100%)',
                  border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)'
                }}
              >
                Activate Command Center &middot; Launch OS
              </button>
            </div>
          )}

        </section>
      </main>

      {/* Syncing / Parsing Terminal Progress Overlay */}
      {syncing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3,5,8,0.95)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          
          {/* Glowing Spinner Ring */}
          <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(79,70,229,0.1)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: 'var(--accent)', animation: 'spin 1.2s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
              {syncProgress}%
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#f8fafc', marginBottom: 4, letterSpacing: '-0.5px' }}>
            {uploadedFile ? 'Parser Staging Sandbox' : 'Orchestrating Trajectory OS'}
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-mono)', textAlign: 'center', marginBottom: 24 }}>
            {syncStatus}
          </p>

          {/* Terminal Console Logs */}
          {parserLogs.length > 0 && (
            <div style={{
              width: '100%',
              maxWidth: 500,
              background: '#070913',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#34d399',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              marginBottom: 24,
              minHeight: 120,
              justifyContent: 'flex-start'
            }}>
              <div style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>PARSER PROCESS TERMINAL</span>
                <span>ONLINE</span>
              </div>
              {parserLogs.map((log, index) => (
                <div key={index} style={{ lineBreak: 'anywhere' }}>
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Main Progress Bar */}
          <div style={{ width: 300, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${syncProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 2, transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {/* Embedded Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-height {
          from { height: 6px; }
          to { height: 28px; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .mic-wave-bar { transition: height 0.1s ease; }
      `}} />
    </div>
  );

  // Selector options helper
  function getOptionsForStep() {
    if (currentStep === 0) {
      return [
        "Computer Science / IT Student",
        "Non-CS Engineering Student",
        "Self-Taught / Other Learner"
      ];
    }
    if (currentStep === 1) {
      return [
        "Software Engineer",
        "UI/UX Designer",
        "DevOps Engineer"
      ];
    }
    if (currentStep === 2) {
      return [
        "To close skill gaps & earn XP",
        "To build portfolio & find internships",
        "To practice AI mock interviews",
        "To verify credentials in the vault"
      ];
    }
    if (currentStep === 3) {
      return [
        "Beginner Coder",
        "Intermediate Coder",
        "Advanced Coder"
      ];
    }
    if (currentStep === 4) {
      return [
        "Reading articles & docs",
        "Watching tutorial videos",
        "Writing code hands-on"
      ];
    }
    if (currentStep === 5) {
      return [
        "5 hours per week",
        "10 hours per week",
        "15+ hours per week"
      ];
    }
    return [];
  }
}
