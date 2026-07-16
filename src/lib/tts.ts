/**
 * Unified Text-to-Speech Utility for PinIT Career OS
 * Runs local neural network engines directly on the main thread for Incognito compatibility.
 */

// ── Voice Mappings ──────────────────────────────────────────────────────────
const KOKORO_VOICE_MAP: Record<string, string> = {
  // Mentors (2)
  priya:    'af_heart',   // Warm, sweet US Female (Career Mentor)
  anish:    'am_liam',    // Clear, friendly US Male (Career Mentor)

  // Teachers (4)
  kashyap:  'am_fenrir',   // Clean US Male (matching sora.glb)
  karthic:  'am_liam',     // Clear, friendly US Male (matching sora.glb)
  maya:     'bf_emma',     // Professional UK Female (matching yuki.glb)
  divya:    'af_nicole',   // Creative US Female (matching mika.glb)
  
  // Legacy Teachers / Fallbacks
  aisha:    'af_sky',     // Friendly US Female
  rohan:    'am_fenrir',  // Clean US Male

  // Interviewers (7)
  vikram:   'bm_lewis',   // Serious UK Male (Strict & Time-conscious)
  shalini:  'bf_isabella',// Professional UK Female (Silent Observer)
  aditya:   'am_adam',    // Wise US Male (System Design Purist)
  neha:     'af_bella',   // Energetic US Female (High-Stress Driller)
  rajesh:   'am_liam',    // Friendly US Male (Legacy Defender)
  sneha:    'af_sarah',   // Warm, socratic US Female (Empathy-First Socratic)
  abhijit:  'bm_george',  // UK Male (Bored Executive)
};

const KITTEN_VOICE_MAP: Record<string, string> = {
  // Mentors (2)
  priya:    'Bella',
  anish:    'Hugo',

  // Teachers (4)
  kashyap:  'Jasper',
  karthic:  'Bruno',
  maya:     'Luna',
  divya:    'Rosie',
  
  // Legacy Teachers / Fallbacks
  aisha:    'Luna',
  rohan:    'Jasper',

  // Interviewers (7)
  vikram:   'Bruno',
  shalini:  'Luna',
  aditya:   'Hugo',
  neha:     'Kiki',
  rajesh:   'Leo',
  sneha:    'Bella',
  abhijit:  'Jasper',
};

// ── Active audio references ──────────────────────────────────────────────────
let activeAudio: HTMLAudioElement | null = null;
let globalAudioCtx: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

function getAudioContext(sampleRate = 24000): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('Web Audio not available server-side');
  }
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

// ── Preloaded Speech Cache ───────────────────────────────────────────────────
interface PreloadedAudio {
  text: string;
  teacherId: string;
  buffer: Float32Array;
  sampleRate: number;
}
let preloadedAudio: PreloadedAudio | null = null;

/**
 * Post-processes the input text to inject natural pauses (commas, ellipses)
 * and pacing hints that make local neural TTS (Kokoro/Kitten) sound highly human and realistic.
 */
export function enhanceTextIntonation(text: string): string {
  let enhanced = text;

  // Add pauses before conjunctions to make it sound conversational and natural
  enhanced = enhanced.replace(/\b(but|because|although|however|therefore)\b/gi, ', $1');
  
  // Replace double hyphens or colons with natural conversational pauses
  enhanced = enhanced.replace(/\s*--\s*/g, '... ');
  enhanced = enhanced.replace(/:\s+/g, '... ');

  // Clean up any double punctuation errors
  enhanced = enhanced.replace(/,\s*,/g, ',');
  enhanced = enhanced.replace(/\.\.\.\s*\./g, '...');
  
  return enhanced;
}

export function preloadTTS() {
  // No-op: Render Cloud backend is always preloaded
}

/**
 * Pre-generates the audio buffer for the next slide's dialogue silently in the background.
 */
export async function preloadNextSpeech(text: string, teacherId: string) {
  // Disabled to save CPU
}

export function stopSpeaking() {
  if (activeAudio) {
    try { activeAudio.pause(); } catch {}
    activeAudio = null;
  }
  if (activeSource) {
    try { activeSource.stop(); } catch {}
    activeSource = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
  activeUtterance = null;
}

export function detectVibe(text: string): 'happy' | 'motivational' | 'teaching' | 'neutral' {
  const lower = text.toLowerCase();
  
  if (/\b(congrats|congratulations|great|awesome|excellent|brilliant|correct|success|perfect|wonderful|wow|hurray|nice job|spot on|superb|well done|outstanding|delighted|perfectly)\b/i.test(lower)) {
    return 'happy';
  }
  if (/\b(try again|incorrect|wrong|mistake|no worries|don't worry|keep going|almost|close but|let's fix|correcting|no problem|improve|don't give up|never give up|challenge|fail|failure|bad results|difficult)\b/i.test(lower)) {
    return 'motivational';
  }
  if (/\b(define|definition|explanation|concept|learn|tutorial|study|exercise|syntax|code|theory|fundamental|architect|module|lesson|training|teaching)\b/i.test(lower)) {
    return 'teaching';
  }
  return 'neutral';
}

function playCloudAudioUrl(url: string, onStart: () => void, onEnd: () => void) {
  if (activeAudio) {
    try { activeAudio.pause(); } catch {}
  }
  const audio = new Audio(url);
  activeAudio = audio;
  audio.onplay = () => onStart();
  audio.onended = () => {
    activeAudio = null;
    onEnd();
  };
  audio.onerror = () => {
    activeAudio = null;
    onEnd();
  };
  audio.play().catch(() => {
    activeAudio = null;
    onEnd();
  });
}

function fallbackWebSpeech(
  cleanText: string,
  teacherId: string,
  onStart: () => void,
  onEnd: () => void,
  vibe: 'happy' | 'motivational' | 'teaching' | 'neutral' = 'neutral'
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.log('[TTS] Simulating audio timing to protect system resources (no speech synth)...');
    onStart();
    const estimatedDuration = Math.min(6000, Math.max(1800, cleanText.length * 48));
    setTimeout(onEnd, estimatedDuration);
    return;
  }

  // Cancel any currently speaking utterances
  try {
    window.speechSynthesis.cancel();
  } catch {}

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Set up events
  utterance.onstart = () => onStart();
  utterance.onend = () => onEnd();
  utterance.onerror = () => onEnd();

  const speak = () => {
    const voices = window.speechSynthesis.getVoices();
    const isFemale = !['anish', 'rohan', 'vikram', 'aditya', 'rajesh', 'abhijit'].includes(teacherId.toLowerCase());
    
    let voice = voices.find(v => 
      v.lang.startsWith('en') && 
      (isFemale ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('google us') : 
                 v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('google uk'))
    );

    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en'));
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = vibe === 'happy' ? 1.05 : vibe === 'motivational' ? 0.95 : 1.0;
    utterance.pitch = isFemale ? 1.1 : 0.95;

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
  }
}

let isNeuralReady = true;

export async function generateTTSAudio(text: string, teacherId: string, vibe = 'neutral'): Promise<{ buffer: Float32Array; sampleRate: number }> {
  const response = await fetch('https://pinit-backend-v8pd.onrender.com/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice: KOKORO_VOICE_MAP[teacherId] || 'af_heart',
      speed: 1.0
    })
  });

  if (!response.ok) {
    throw new Error(`Render TTS server returned status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const ctx = getAudioContext();
  const audioBuf = await ctx.decodeAudioData(arrayBuffer);
  const buffer = audioBuf.getChannelData(0);
  return { buffer, sampleRate: audioBuf.sampleRate };
}

export async function speakWithAvatar(
  text: string,
  teacherId: string,
  onStart: () => void,
  onEnd: () => void,
  isMuted = false,
  useNeural = true
) {
  stopSpeaking();
  if (isMuted || !text) return;

  let sanitized = text
    .replace(/^\[.*?\]:\s?/, '')
    .replace(/^[a-zA-Z\s\.\-]+:\s?/, '');

  sanitized = sanitized
    .replace(/\*.*?\*/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '');

  const cleanText = sanitized.replace(/[✦🤖👋🎯💼🔐🔬⚡✨✓⬡*`_#]/g, '').trim();
  if (!cleanText) return;

  const enhancedText = enhanceTextIntonation(cleanText);
  const vibe = detectVibe(enhancedText);

  // Local Web Worker (Kokoro / KittenTTS Nano) - Offline, browser-native execution
  if (useNeural && isNeuralReady) {
    try {
      // Race worker generation against a 15.0s timeout to prevent hanging the UI
      const workerPromise = generateTTSAudio(enhancedText, teacherId, vibe);
      const timeoutPromise = new Promise<{ buffer: Float32Array; sampleRate: number }>((_, reject) =>
        setTimeout(() => reject(new Error('Neural TTS timeout')), 15000)
      );

      const { buffer, sampleRate } = await Promise.race([workerPromise, timeoutPromise]);
      const ctx = getAudioContext(sampleRate);
      const audioBuf = ctx.createBuffer(1, buffer.length, sampleRate);
      audioBuf.copyToChannel(buffer as any, 0);

      const source = ctx.createBufferSource();
      activeSource = source;
      source.buffer = audioBuf;

      source.connect(ctx.destination);
      source.onended = () => {
        if (activeSource === source) activeSource = null;
        onEnd();
      };
      onStart();
      source.start(0);
      return;
    } catch (err: any) {
      console.warn('[TTS] Render Cloud TTS generation failed, falling back to Web Speech Synthesis:', err.message);
    }
  }

  // Fallback: Safe simulated timing
  fallbackWebSpeech(enhancedText, teacherId, onStart, onEnd, vibe);
}

// Auto-initialize background worker & preload TTS engine immediately on script load
if (typeof window !== 'undefined') {
  preloadTTS();
}

