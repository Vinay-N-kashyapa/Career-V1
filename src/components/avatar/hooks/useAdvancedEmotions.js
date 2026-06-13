// hooks/useAdvancedEmotions.js
// 🎯 ADVANCED EMOTION & MICRO-EXPRESSION SYSTEM
// ✅ Complex emotions
// ✅ Emotion blending
// ✅ Micro-expressions
// ✅ Emotional transitions
// ✅ Subtle facial signals

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

const lerp = (a, b, t) => a + (b - a) * t;

// ── Emotion Definitions ──
const EMOTIONS = {
  happy: {
    expressions: { mouthSmile: 0.9, eyeSquint: 0.8, cheekPuff: 0.7 },
    energy: 0.8,
    blinkRate: 1,
  },
  sad: {
    expressions: { mouthFrown: 0.9, eyeDown: 0.7, innerBrowRaise: 0.8 },
    energy: 0.3,
    blinkRate: 1.5,
  },
  angry: {
    expressions: { mouthFrown: 0.7, eyeNarrow: 0.9, browDown: 1 },
    energy: 0.9,
    blinkRate: 0.5,
  },
  surprised: {
    expressions: { eyeWide: 1, mouthOpen: 0.8, browRaise: 1 },
    energy: 0.7,
    blinkRate: 2,
  },
  confused: {
    expressions: { eyeNarrow: 0.6, browRaise: 0.7, mouthOpen: 0.4 },
    energy: 0.5,
    blinkRate: 1.2,
  },
  neutral: {
    expressions: { eyeOpen: 1, mouthNeutral: 0.5 },
    energy: 0.5,
    blinkRate: 1,
  },
  fear: {
    expressions: { eyeWide: 0.9, mouthOpen: 0.7, browRaise: 0.8 },
    energy: 0.9,
    blinkRate: 3,
  },
  disgust: {
    expressions: { mouthFrown: 0.8, noseWrinkle: 0.8, eyeNarrow: 0.6 },
    energy: 0.6,
    blinkRate: 1.3,
  },
};

// ── Micro-Expression Library ──
const MICRO_EXPRESSIONS = {
  doubt: { duration: 0.5, expressions: { eyeNarrow: 0.3, browFurrow: 0.2 } },
  recognition: { duration: 0.4, expressions: { eyeWide: 0.2, browRaise: 0.15 } },
  concentration: { duration: 0.6, expressions: { eyeNarrow: 0.4, browFurrow: 0.3 } },
  realization: { duration: 0.5, expressions: { eyeWide: 0.4, browRaise: 0.3 } },
  uncertainty: { duration: 0.7, expressions: { mouthOpen: 0.2, eyeNarrow: 0.2 } },
  agreement: { duration: 0.4, expressions: { eyeSmile: 0.2, mouthSmile: 0.15 } },
  disapproval: { duration: 0.5, expressions: { mouthFrown: 0.2, eyeNarrow: 0.25 } },
  contempt: { duration: 0.6, expressions: { mouthSmirk: 0.3, eyeNarrow: 0.3 } },
};

export function useAdvancedEmotions() {
  const emotionStateRef = useRef({
    currentEmotion: 'neutral',
    targetEmotion: 'neutral',
    blendProgress: 0,
    blendDuration: 0.5,
    emotionStrength: 1,
    expressionValues: {},
    microExpressions: [],
    emotionHistory: [],
  });

  const blendShapesRef = useRef({});

  // Set primary emotion
  const setEmotion = useCallback((emotionName, duration = 0.5, strength = 1) => {
    if (EMOTIONS[emotionName]) {
      emotionStateRef.current.targetEmotion = emotionName;
      emotionStateRef.current.currentEmotion = emotionName;
      emotionStateRef.current.blendDuration = duration;
      emotionStateRef.current.blendProgress = 0;
      emotionStateRef.current.emotionStrength = strength;

      // Track emotion history
      emotionStateRef.current.emotionHistory.push({
        emotion: emotionName,
        timestamp: Date.now(),
        strength,
      });
    }
  }, []);

  // Blend two emotions
  const blendEmotions = useCallback((emotion1, emotion2, blend = 0.5, duration = 0.5) => {
    if (EMOTIONS[emotion1] && EMOTIONS[emotion2]) {
      const e1 = EMOTIONS[emotion1].expressions;
      const e2 = EMOTIONS[emotion2].expressions;

      const blended = {};
      Object.keys(e1).forEach((key) => {
        blended[key] = lerp(e1[key] || 0, e2[key] || 0, blend);
      });

      emotionStateRef.current.expressionValues = blended;
    }
  }, []);

  // Add micro-expression
  const addMicroExpression = useCallback((microExprName) => {
    if (MICRO_EXPRESSIONS[microExprName]) {
      const microExpr = {
        ...MICRO_EXPRESSIONS[microExprName],
        id: Math.random(),
        startTime: 0,
        completed: false,
      };

      emotionStateRef.current.microExpressions.push(microExpr);
    }
  }, []);

  // Get emotion intensity
  const getEmotionIntensity = useCallback(() => {
    const emotion = EMOTIONS[emotionStateRef.current.currentEmotion];
    return emotion ? emotion.energy * emotionStateRef.current.emotionStrength : 0;
  }, []);

  // Get emotional energy (affects body movement)
  const getEmotionalEnergy = useCallback(() => {
    const emotion = EMOTIONS[emotionStateRef.current.currentEmotion];
    return emotion ? emotion.energy : 0.5;
  }, []);

  // Get blink rate multiplier
  const getBlinkRate = useCallback(() => {
    const emotion = EMOTIONS[emotionStateRef.current.currentEmotion];
    return emotion ? emotion.blinkRate : 1;
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    const emotionState = emotionStateRef.current;

    // Blend emotion
    if (emotionState.blendProgress < emotionState.blendDuration) {
      emotionState.blendProgress += delta;
      const progress = Math.min(1, emotionState.blendProgress / emotionState.blendDuration);

      const currentEmotion = EMOTIONS[emotionState.currentEmotion];
      const targetEmotion = EMOTIONS[emotionState.targetEmotion];

      if (currentEmotion && targetEmotion) {
        // Blend expressions
        Object.keys(targetEmotion.expressions).forEach((key) => {
          const fromValue = currentEmotion.expressions[key] || 0;
          const toValue = targetEmotion.expressions[key] || 0;
          emotionState.expressionValues[key] = lerp(fromValue, toValue, progress);
        });
      }
    }

    // Update micro-expressions
    emotionState.microExpressions.forEach((microExpr) => {
      microExpr.startTime += delta;
      const progress = microExpr.startTime / microExpr.duration;

      if (progress < 1) {
        // Apply micro-expression with ease-in-out
        const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        Object.entries(microExpr.expressions).forEach(([key, value]) => {
          emotionState.expressionValues[key] = 
            (emotionState.expressionValues[key] || 0) + value * easeProgress * 0.5;
        });
      } else {
        microExpr.completed = true;
      }
    });

    // Remove completed micro-expressions
    emotionState.microExpressions = emotionState.microExpressions.filter((m) => !m.completed);

    // Apply expression values to blend shapes
    Object.entries(emotionState.expressionValues).forEach(([key, value]) => {
      if (blendShapesRef.current[key]) {
        blendShapesRef.current[key].value = Math.max(0, Math.min(1, value));
      }
    });
  });

  // Get emotion history
  const getEmotionHistory = useCallback((limit = 10) => {
    return emotionStateRef.current.emotionHistory.slice(-limit);
  }, []);

  return {
    setEmotion,
    blendEmotions,
    addMicroExpression,
    getEmotionIntensity,
    getEmotionalEnergy,
    getBlinkRate,
    getEmotionHistory,
    blendShapesRef,
    emotionStateRef,
    availableEmotions: Object.keys(EMOTIONS),
    availableMicroExpressions: Object.keys(MICRO_EXPRESSIONS),
  };
}

export { EMOTIONS, MICRO_EXPRESSIONS };
