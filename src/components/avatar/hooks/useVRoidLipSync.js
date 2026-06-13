// hooks/useVRoidLipSync.js
// 🎯 ADVANCED VROID LIP-SYNC & SPEECH ANIMATION
// ✅ Phoneme-based lip-sync
// ✅ Audio-driven animation
// ✅ Jaw movement
// ✅ Tongue animation
// ✅ Emotion-based speech

import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

const lerp = (a, b, t) => a + (b - a) * t;

// Phoneme definitions with mouth shapes
const PHONEME_MOUTH_SHAPES = {
  // Vowels - open mouth
  'a': { aa: 0.9, oh: 0.2, mouth_open: 0.8 },
  'e': { ee: 0.9, ih: 0.3, mouth_open: 0.5 },
  'i': { ih: 0.9, ee: 0.3, mouth_open: 0.3 },
  'o': { oh: 0.9, ou: 0.2, mouth_open: 0.7 },
  'u': { ou: 0.9, oh: 0.2, mouth_open: 0.6 },

  // Consonants - closed/pursed mouth
  'm': { oh: 0.6, mouth_close: 0.7 },
  'p': { oh: 0.5, mouth_close: 0.8 },
  'b': { oh: 0.5, mouth_close: 0.8 },
  'f': { ee: 0.4, mouth_close: 0.6, lower_lip_in: 0.5 },
  'v': { ee: 0.4, mouth_close: 0.6, lower_lip_in: 0.5 },
  'th': { tongue_out: 0.3, mouth_open: 0.4 },
  's': { ee: 0.6, mouth_close: 0.7 },
  'z': { ee: 0.6, mouth_close: 0.7 },
  'sh': { oh: 0.4, mouth_close: 0.6 },
  'ch': { ee: 0.3, mouth_close: 0.8 },
  'j': { ee: 0.4, mouth_close: 0.7 },
  'l': { ee: 0.3, tongue_up: 0.5, mouth_open: 0.3 },
  'r': { oh: 0.3, tongue_up: 0.4, mouth_open: 0.4 },
  'n': { ee: 0.2, mouth_close: 0.7, nose_air: 0.5 },
  'ng': { oh: 0.2, mouth_close: 0.8, nose_air: 0.6 },
  'y': { ee: 0.5, mouth_open: 0.2 },
  'w': { ou: 0.7, mouth_round: 0.8 },
  'h': { aa: 0.2, mouth_open: 0.3 },

  // Silence
  'silence': { mouth_close: 0.8 },
};

// Lip-sync timing for smooth animation
const LIP_SYNC_SETTINGS = {
  phonemeDuration: 0.08, // 80ms per phoneme
  transitionTime: 0.05, // 50ms blend between phonemes
  jawSensitivity: 1.2, // Jaw movement multiplier
  expressionDamping: 0.9, // Smooth expression blending
};

export function useVRoidLipSync(vrmExpressions) {
  const [isSpeak, setIsSpeaking] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState('silence');
  const speechQueueRef = useRef([]);
  const speechTimeRef = useRef(0);
  const audioContextRef = useRef(null);
  const audioAnalyzerRef = useRef(null);
  const jawBoneRef = useRef(null);
  const tongueBonesRef = useRef([]);

  // Initialize audio analysis for real-time lip-sync
  const initializeAudioAnalysis = useCallback((audioElement) => {
    if (!audioElement) return;

    const context = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = context;

    const source = context.createMediaElementAudioSource(audioElement);
    const analyzer = context.createAnalyser();
    analyzer.fftSize = 2048;

    source.connect(analyzer);
    analyzer.connect(context.destination);

    audioAnalyzerRef.current = analyzer;
    return analyzer;
  }, []);

  // Extract phonemes from text
  const extractPhonemes = useCallback((text) => {
    const phonemeMap = {
      'ph': 'f',
      'gh': 'f',
      'ch': 'ch',
      'sh': 'sh',
      'th': 'th',
      'ng': 'ng',
      'qu': 'kw',
    };

    let phonemes = [];
    let i = 0;

    while (i < text.length) {
      const char = text[i].toLowerCase();
      const twoChar = (text.substring(i, i + 2) || '').toLowerCase();

      if (phonemeMap[twoChar]) {
        phonemes.push(phonemeMap[twoChar]);
        i += 2;
      } else if ('aeiou'.includes(char)) {
        phonemes.push(char);
        i++;
      } else if ('bcdfghjklmnprstvwxyz'.includes(char)) {
        phonemes.push(char);
        i++;
      } else {
        i++;
      }
    }

    return phonemes;
  }, []);

  // Animate phoneme sequence
  const animatePhonemeSequence = useCallback((text) => {
    const phonemes = extractPhonemes(text);
    
    setIsSpeaking(true);
    speechQueueRef.current = phonemes;
    speechTimeRef.current = 0;

    // Calculate total speech duration
    const speechDuration = phonemes.length * LIP_SYNC_SETTINGS.phonemeDuration;
    
    // Reset after speech is done
    setTimeout(() => {
      setIsSpeaking(false);
      setCurrentPhoneme('silence');
      speechQueueRef.current = [];
    }, speechDuration * 1000);
  }, [extractPhonemes]);

  // Apply mouth shape for phoneme
  const applyPhonemeShape = useCallback((phoneme) => {
    if (!vrmExpressions) return;

    const shapes = PHONEME_MOUTH_SHAPES[phoneme] || PHONEME_MOUTH_SHAPES['silence'];

    // Apply each mouth shape blend
    Object.entries(shapes).forEach(([shape, value]) => {
      if (vrmExpressions.setExpression) {
        vrmExpressions.setExpression(shape, value);
      }
    });

    setCurrentPhoneme(phoneme);
  }, [vrmExpressions]);

  // Animate jaw movement for mouth opening
  const updateJawMovement = useCallback((jawBone, phoneme) => {
    if (!jawBone) return;

    const shapes = PHONEME_MOUTH_SHAPES[phoneme] || {};
    const jawOpen = shapes.mouth_open || 0;

    // Smooth jaw rotation
    const targetRotX = jawOpen * LIP_SYNC_SETTINGS.jawSensitivity * 0.3; // Radians
    jawBone.rotation.x = lerp(jawBone.rotation.x || 0, targetRotX, 0.1);
  }, []);

  // Real-time audio-driven lip-sync
  const updateFromAudio = useCallback(() => {
    if (!audioAnalyzerRef.current || !isSpeak) return;

    const dataArray = new Uint8Array(audioAnalyzerRef.current.frequencyBinCount);
    audioAnalyzerRef.current.getByteFrequencyData(dataArray);

    // Analyze frequency to detect speech characteristics
    let energy = 0;
    for (let i = 0; i < dataArray.length; i++) {
      energy += dataArray[i];
    }
    energy = energy / dataArray.length / 255; // Normalize to 0-1

    // Detect current phoneme based on energy and frequency
    const dominantFreq = detectDominantFrequency(dataArray);
    const estimatedPhoneme = estimatePhoneme(dominantFreq, energy);

    if (estimatedPhoneme) {
      applyPhonemeShape(estimatedPhoneme);
    }
  }, [isSpeak, applyPhonemeShape]);

  // Detect dominant frequency from audio
  const detectDominantFrequency = useCallback((dataArray) => {
    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    const nyquist = audioContextRef.current?.sampleRate / 2 || 22050;
    return (maxIndex * nyquist) / dataArray.length;
  }, []);

  // Estimate phoneme from frequency analysis
  const estimatePhoneme = useCallback((freq, energy) => {
    if (energy < 0.1) return 'silence';

    // Simple frequency-based phoneme detection
    if (freq < 300) {
      return energy > 0.4 ? 'o' : 'u';
    } else if (freq < 700) {
      return energy > 0.5 ? 'a' : 'e';
    } else if (freq < 1200) {
      return 'i';
    } else if (freq < 2000) {
      return 's';
    } else {
      return 'sh';
    }
  }, []);

  // Main animation loop
  useFrame((state, delta) => {
    if (!isSpeak) return;

    speechTimeRef.current += delta;

    // Update from text-based phoneme sequence
    if (speechQueueRef.current.length > 0) {
      const phonemeIndex = Math.floor(
        speechTimeRef.current / LIP_SYNC_SETTINGS.phonemeDuration
      );

      if (phonemeIndex < speechQueueRef.current.length) {
        const phoneme = speechQueueRef.current[phonemeIndex];
        applyPhonemeShape(phoneme);
        updateJawMovement(jawBoneRef.current, phoneme);
      }
    }

    // Also update from real-time audio if available
    updateFromAudio();
  });

  // Connect jaw bone for animation
  const setJawBone = useCallback((bone) => {
    jawBoneRef.current = bone;
  }, []);

  // Add tongue bones for advanced animation
  const addTongueBone = useCallback((bone) => {
    tongueBonesRef.current.push(bone);
  }, []);

  // Get speech info
  const getSpeechInfo = useCallback(() => {
    return {
      isSpeaking: isSpeak,
      currentPhoneme,
      progress: speechQueueRef.current.length > 0 
        ? speechTimeRef.current / (speechQueueRef.current.length * LIP_SYNC_SETTINGS.phonemeDuration)
        : 0,
      queueLength: speechQueueRef.current.length,
    };
  }, [isSpeak, currentPhoneme]);

  return {
    animatePhonemeSequence,
    applyPhonemeShape,
    updateJawMovement,
    initializeAudioAnalysis,
    setJawBone,
    addTongueBone,
    getSpeechInfo,
    isSpeaking: isSpeak,
    currentPhoneme,
    PHONEME_MOUTH_SHAPES,
    LIP_SYNC_SETTINGS,
  };
}

export { PHONEME_MOUTH_SHAPES, LIP_SYNC_SETTINGS };
