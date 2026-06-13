// hooks/useSmoothFacialAnimation.js
// 🎯 SMOOTH FACIAL ANIMATIONS
// ✅ Lip sync with phonemes
// ✅ Eye blink animations
// ✅ Facial expressions
// ✅ Mouth movements
// ✅ Natural transitions

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const deg = THREE.MathUtils.degToRad;
const lerp = (a, b, t) => a + (b - a) * t;

// ── Phoneme Shapes ──
const PHONEME_SHAPES = {
  // Vowels
  'a': { jaw: 0.7, lipRound: 0.0, lipStretch: 0.6 },
  'e': { jaw: 0.5, lipRound: 0.0, lipStretch: 0.8 },
  'i': { jaw: 0.3, lipRound: 0.0, lipStretch: 0.9 },
  'o': { jaw: 0.8, lipRound: 0.9, lipStretch: 0.2 },
  'u': { jaw: 0.6, lipRound: 1.0, lipStretch: 0.0 },

  // Consonants
  'm': { jaw: 0.0, lipRound: 0.3, lipStretch: 0.0, lipsClosed: true },
  'p': { jaw: 0.2, lipRound: 0.3, lipStretch: 0.0, lipsClosed: true },
  'b': { jaw: 0.2, lipRound: 0.3, lipStretch: 0.0, lipsClosed: true },
  'f': { jaw: 0.1, lipRound: 0.0, lipStretch: 0.5, lowerLip: 0.3 },
  'v': { jaw: 0.2, lipRound: 0.0, lipStretch: 0.5, lowerLip: 0.3 },
  'th': { jaw: 0.3, lipRound: 0.0, lipStretch: 0.4, tongue: 0.5 },
  's': { jaw: 0.2, lipRound: 0.0, lipStretch: 0.7 },
  'z': { jaw: 0.2, lipRound: 0.0, lipStretch: 0.7 },
  'sh': { jaw: 0.1, lipRound: 0.4, lipStretch: 0.3 },
  'ch': { jaw: 0.3, lipRound: 0.2, lipStretch: 0.4 },
  'l': { jaw: 0.2, lipRound: 0.1, lipStretch: 0.6, tongue: 0.3 },
  'r': { jaw: 0.3, lipRound: 0.6, lipStretch: 0.2 },
  'n': { jaw: 0.1, lipRound: 0.0, lipStretch: 0.0, lipsClosed: true },
  'ng': { jaw: 0.1, lipRound: 0.0, lipStretch: 0.0, lipsClosed: true },
  'y': { jaw: 0.4, lipRound: 0.7, lipStretch: 0.3 },
  'w': { jaw: 0.5, lipRound: 0.8, lipStretch: 0.1 },
  'h': { jaw: 0.4, lipRound: 0.0, lipStretch: 0.3 },

  // Silence
  'silence': { jaw: 0.0, lipRound: 0.0, lipStretch: 0.0 },
};

// ── Facial Expressions ──
const FACIAL_EXPRESSIONS = {
  // Happy expression
  happy: {
    duration: 0.5,
    keyframes: [
      {
        time: 0,
        blendShapes: {
          eyeSquintLeft: 0,
          eyeSquintRight: 0,
          mouthSmile: 0,
          cheekPuff: 0,
        },
      },
      {
        time: 0.25,
        blendShapes: {
          eyeSquintLeft: 0.8,
          eyeSquintRight: 0.8,
          mouthSmile: 0.9,
          cheekPuff: 0.7,
        },
      },
      {
        time: 0.5,
        blendShapes: {
          eyeSquintLeft: 0.6,
          eyeSquintRight: 0.6,
          mouthSmile: 0.7,
          cheekPuff: 0.5,
        },
      },
    ],
  },

  // Sad expression
  sad: {
    duration: 0.5,
    keyframes: [
      {
        time: 0,
        blendShapes: {
          eyeBrowInnerUp: 0,
          eyeBrowDown: 0,
          mouthFrown: 0,
        },
      },
      {
        time: 0.25,
        blendShapes: {
          eyeBrowInnerUp: 0.8,
          eyeBrowDown: 0.7,
          mouthFrown: 0.9,
        },
      },
      {
        time: 0.5,
        blendShapes: {
          eyeBrowInnerUp: 0.5,
          eyeBrowDown: 0.4,
          mouthFrown: 0.6,
        },
      },
    ],
  },

  // Surprised expression
  surprised: {
    duration: 0.4,
    keyframes: [
      {
        time: 0,
        blendShapes: {
          eyeWide: 0,
          mouthOpen: 0,
          eyeBrowUp: 0,
        },
      },
      {
        time: 0.2,
        blendShapes: {
          eyeWide: 0.9,
          mouthOpen: 0.8,
          eyeBrowUp: 1.0,
        },
      },
      {
        time: 0.4,
        blendShapes: {
          eyeWide: 0.5,
          mouthOpen: 0.3,
          eyeBrowUp: 0.6,
        },
      },
    ],
  },

  // Angry expression
  angry: {
    duration: 0.5,
    keyframes: [
      {
        time: 0,
        blendShapes: {
          eyeBrowInnerUp: 0,
          eyeBrowDown: 0,
          mouthFrown: 0,
          eyeNarrow: 0,
        },
      },
      {
        time: 0.25,
        blendShapes: {
          eyeBrowInnerUp: 0.9,
          eyeBrowDown: 1.0,
          mouthFrown: 0.8,
          eyeNarrow: 0.9,
        },
      },
      {
        time: 0.5,
        blendShapes: {
          eyeBrowInnerUp: 0.7,
          eyeBrowDown: 0.8,
          mouthFrown: 0.6,
          eyeNarrow: 0.7,
        },
      },
    ],
  },

  // Confused expression
  confused: {
    duration: 0.4,
    keyframes: [
      {
        time: 0,
        blendShapes: {
          eyeBrowInnerUp: 0,
          eyeNarrow: 0,
          mouthOpen: 0,
        },
      },
      {
        time: 0.2,
        blendShapes: {
          eyeBrowInnerUp: 0.7,
          eyeNarrow: 0.6,
          mouthOpen: 0.4,
        },
      },
      {
        time: 0.4,
        blendShapes: {
          eyeBrowInnerUp: 0.5,
          eyeNarrow: 0.4,
          mouthOpen: 0.2,
        },
      },
    ],
  },
};

// ── Eye Blink Animation ──
const BLINK_ANIMATION = {
  duration: 0.15,
  keyframes: [
    { time: 0, blendShapes: { eyeBlinkLeft: 0, eyeBlinkRight: 0 } },
    { time: 0.075, blendShapes: { eyeBlinkLeft: 1, eyeBlinkRight: 1 } },
    { time: 0.15, blendShapes: { eyeBlinkLeft: 0, eyeBlinkRight: 0 } },
  ],
};

export function useSmoothFacialAnimation() {
  const blendShapesRef = useRef({});
  const currentExpressionRef = useRef('neutral');
  const timeRef = useRef(0);
  const blinkTimeRef = useRef(0);
  const shouldBlinkRef = useRef(true);
  const nextBlinkTimeRef = useRef(Math.random() * 3 + 2); // 2-5 seconds
  const currentPhonemeRef = useRef('silence');
  const phonemeTimeRef = useRef(0);

  // Interpolate between blend shape values
  const interpolateBlendShape = (fromValue, toValue, progress) => {
    return lerp(fromValue, toValue, progress);
  };

  // Apply blend shape to face
  const applyBlendShape = (name, value) => {
    if (blendShapesRef.current[name]) {
      blendShapesRef.current[name].value = Math.max(0, Math.min(1, value));
    }
  };

  // Set phoneme for lip sync
  const setPhoneme = (phoneme) => {
    if (PHONEME_SHAPES[phoneme]) {
      currentPhonemeRef.current = phoneme;
      phonemeTimeRef.current = 0;

      const shape = PHONEME_SHAPES[phoneme];
      
      // Apply jaw movement
      if (shape.jaw !== undefined) {
        applyBlendShape('jawOpen', shape.jaw);
      }

      // Apply lip shapes
      if (shape.lipRound !== undefined) {
        applyBlendShape('mouthRound', shape.lipRound);
      }
      if (shape.lipStretch !== undefined) {
        applyBlendShape('mouthStretch', shape.lipStretch);
      }
      if (shape.lipsClosed !== undefined) {
        applyBlendShape('mouthClose', shape.lipsClosed ? 1 : 0);
      }
      if (shape.lowerLip !== undefined) {
        applyBlendShape('mouthLowerDown', shape.lowerLip);
      }
      if (shape.tongue !== undefined) {
        applyBlendShape('tongueOut', shape.tongue);
      }
    }
  };

  // Set facial expression
  const setExpression = (expressionName) => {
    if (FACIAL_EXPRESSIONS[expressionName]) {
      currentExpressionRef.current = expressionName;
      timeRef.current = 0;
    }
  };

  // Trigger blink
  const blink = () => {
    blinkTimeRef.current = 0;
  };

  // Automatic blinking
  useFrame((state, delta) => {
    blinkTimeRef.current += delta;
    timeRef.current += delta;
    phonemeTimeRef.current += delta;

    // Handle automatic blinking
    nextBlinkTimeRef.current -= delta;
    if (nextBlinkTimeRef.current <= 0 && shouldBlinkRef.current) {
      blink();
      nextBlinkTimeRef.current = Math.random() * 3 + 2; // 2-5 seconds between blinks
    }

    // Apply blink animation
    if (blinkTimeRef.current < BLINK_ANIMATION.duration) {
      const blinkProgress = blinkTimeRef.current / BLINK_ANIMATION.duration;
      for (let i = 0; i < BLINK_ANIMATION.keyframes.length - 1; i++) {
        const kf1 = BLINK_ANIMATION.keyframes[i];
        const kf2 = BLINK_ANIMATION.keyframes[i + 1];
        const kfProgress = blinkProgress * 2 - i;

        if (kfProgress >= 0 && kfProgress <= 1) {
          Object.entries(kf2.blendShapes).forEach(([name, value]) => {
            const fromValue = kf1.blendShapes[name];
            const interpolated = interpolateBlendShape(fromValue, value, kfProgress);
            applyBlendShape(name, interpolated);
          });
          break;
        }
      }
    }

    // Apply expression animation
    const expression = FACIAL_EXPRESSIONS[currentExpressionRef.current];
    if (expression) {
      const exprProgress = (timeRef.current % expression.duration) / expression.duration;

      for (let i = 0; i < expression.keyframes.length - 1; i++) {
        const kf1 = expression.keyframes[i];
        const kf2 = expression.keyframes[i + 1];
        const kfProgress = (exprProgress * expression.duration - kf1.time) / (kf2.time - kf1.time);

        if (kfProgress >= 0 && kfProgress <= 1) {
          Object.entries(kf2.blendShapes).forEach(([name, value]) => {
            const fromValue = kf1.blendShapes[name];
            const interpolated = interpolateBlendShape(fromValue, value, kfProgress);
            applyBlendShape(name, interpolated);
          });
          break;
        }
      }
    }
  });

  return {
    setPhoneme,
    setExpression,
    blink,
    blendShapesRef,
    currentExpression: currentExpressionRef.current,
    currentPhoneme: currentPhonemeRef.current,
    availableExpressions: Object.keys(FACIAL_EXPRESSIONS),
    availablePhonemes: Object.keys(PHONEME_SHAPES),
  };
}

export { PHONEME_SHAPES, FACIAL_EXPRESSIONS, BLINK_ANIMATION };
