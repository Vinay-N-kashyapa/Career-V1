// hooks/useVRoidExpressions.js
// 🎯 VROID STUDIO ANIME BLEND SHAPE OPTIMIZATION
// ✅ VRM expression morphing
// ✅ Anime-style blinks
// ✅ Mouth shapes for speech
// ✅ Eye expressions
// ✅ Smooth blending

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

const lerp = (a, b, t) => a + (b - a) * t;

// VRM Standard Expression Names (VRoid compatible)
const VRM_EXPRESSIONS = {
  // Eye expressions
  blink: 'blink',
  blinkLeft: 'blink_left',
  blinkRight: 'blink_right',
  lookUp: 'look_up',
  lookDown: 'look_down',
  lookLeft: 'look_left',
  lookRight: 'look_right',
  happy: 'happy',
  angry: 'angry',
  sad: 'sad',
  relaxed: 'relaxed',
  
  // Mouth expressions for lip-sync
  aa: 'aa',
  ih: 'ih',
  ou: 'ou',
  ee: 'ee',
  oh: 'oh',
};

// Anime-optimized expression settings
const ANIME_EXPRESSION_SETTINGS = {
  // Blink duration (shorter for anime)
  blinkDuration: 0.12,
  // Blink interval (more frequent in anime)
  blinkInterval: 3.5,
  // Expression blend speed (smooth anime transitions)
  expressionBlendSpeed: 0.15,
  // Mouth movement amplitude
  mouthAmplitude: 0.8,
};

export function useVRoidExpressions(vrmModel) {
  const expressionManagerRef = useRef(null);
  const expressionStateRef = useRef(new Map());
  const [vrmExpressionsReady, setVrmExpressionsReady] = useState(false);

  // Initialize VRM expressions
  const initializeExpressions = useCallback(() => {
    if (!vrmModel || !vrmModel.expressionManager) {
      console.warn('⚠️ No VRM expression manager found');
      return false;
    }

    expressionManagerRef.current = vrmModel.expressionManager;

    // Initialize all expression states to 0
    Object.values(VRM_EXPRESSIONS).forEach((expr) => {
      if (vrmModel.expressionManager[expr] !== undefined) {
        expressionStateRef.current.set(expr, 0);
      }
    });

    setVrmExpressionsReady(true);
    console.log('✅ VRM expressions initialized');
    return true;
  }, [vrmModel]);

  // Set expression value (0-1)
  const setExpression = useCallback((expressionName, value) => {
    const manager = expressionManagerRef.current;
    if (!manager) return;

    const clampedValue = Math.max(0, Math.min(1, value));
    expressionStateRef.current.set(expressionName, clampedValue);

    // Apply to VRM
    if (manager[expressionName] !== undefined) {
      manager[expressionName].value = clampedValue;
    }
  }, []);

  // Blend between two expressions smoothly
  const blendExpressions = useCallback((expr1, expr2, blend) => {
    const val1 = expressionStateRef.current.get(expr1) || 0;
    const val2 = expressionStateRef.current.get(expr2) || 0;

    setExpression(expr1, lerp(val1, 1 - blend, 0.1));
    setExpression(expr2, lerp(val2, blend, 0.1));
  }, [setExpression]);

  // Perform blink
  const blink = useCallback((duration = ANIME_EXPRESSION_SETTINGS.blinkDuration) => {
    // Quick blink animation
    const steps = 10;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const blinkAmount = Math.sin(progress * Math.PI); // Smooth curve

      setTimeout(() => {
        setExpression(VRM_EXPRESSIONS.blink, blinkAmount);
      }, stepDuration * i * 1000);
    }
  }, [setExpression]);

  // Anime-style quick double blink
  const doubleBlink = useCallback(() => {
    blink(ANIME_EXPRESSION_SETTINGS.blinkDuration * 0.8);
    setTimeout(() => {
      blink(ANIME_EXPRESSION_SETTINGS.blinkDuration * 0.8);
    }, 300);
  }, [blink]);

  // Set facial expression (happy, sad, etc.)
  const setFacialExpression = useCallback((expressionType, intensity = 1) => {
    const expressionMap = {
      happy: { expression: VRM_EXPRESSIONS.happy, value: 0.8 * intensity },
      sad: { expression: VRM_EXPRESSIONS.sad, value: 0.7 * intensity },
      angry: { expression: VRM_EXPRESSIONS.angry, value: 0.9 * intensity },
      relaxed: { expression: VRM_EXPRESSIONS.relaxed, value: 0.6 * intensity },
    };

    // Reset all expressions first
    Object.values(VRM_EXPRESSIONS).forEach((expr) => {
      setExpression(expr, 0);
    });

    // Apply selected expression
    if (expressionMap[expressionType]) {
      setExpression(expressionMap[expressionType].expression, expressionMap[expressionType].value);
    }
  }, [setExpression]);

  // Mouth shapes for lip-sync (phoneme-based)
  const setMouthShape = useCallback((phoneme) => {
    // Reset mouth
    Object.keys(VRM_EXPRESSIONS).forEach((key) => {
      if (key.match(/^(aa|ih|ou|ee|oh)$/)) {
        setExpression(VRM_EXPRESSIONS[key], 0);
      }
    });

    // Apply mouth shape based on phoneme
    const mouthMap = {
      'a': { expr: VRM_EXPRESSIONS.aa, val: 0.8 },
      'e': { expr: VRM_EXPRESSIONS.ee, val: 0.7 },
      'i': { expr: VRM_EXPRESSIONS.ih, val: 0.7 },
      'o': { expr: VRM_EXPRESSIONS.oh, val: 0.8 },
      'u': { expr: VRM_EXPRESSIONS.ou, val: 0.8 },
      'm': { expr: VRM_EXPRESSIONS.oh, val: 0.6 }, // Closed mouth
      'p': { expr: VRM_EXPRESSIONS.oh, val: 0.5 }, // Slightly closed
    };

    if (mouthMap[phoneme]) {
      setExpression(mouthMap[phoneme].expr, mouthMap[phoneme].val * ANIME_EXPRESSION_SETTINGS.mouthAmplitude);
    }
  }, [setExpression]);

  // Set eye look direction
  const setEyeLook = useCallback((direction) => {
    // Reset all look expressions
    ['lookUp', 'lookDown', 'lookLeft', 'lookRight'].forEach((dir) => {
      setExpression(VRM_EXPRESSIONS[dir], 0);
    });

    // Apply direction
    const lookMap = {
      up: { expr: VRM_EXPRESSIONS.lookUp, val: 0.8 },
      down: { expr: VRM_EXPRESSIONS.lookDown, val: 0.8 },
      left: { expr: VRM_EXPRESSIONS.lookLeft, val: 0.8 },
      right: { expr: VRM_EXPRESSIONS.lookRight, val: 0.8 },
    };

    if (lookMap[direction]) {
      setExpression(lookMap[direction].expr, lookMap[direction].val);
    }
  }, [setExpression]);

  // Automatic blinking
  useFrame((state) => {
    // Auto blink every N seconds
    const blinkCycle = ANIME_EXPRESSION_SETTINGS.blinkInterval;
    const t = state.clock.elapsedTime % blinkCycle;
    const blinkStart = blinkCycle - ANIME_EXPRESSION_SETTINGS.blinkDuration;

    if (t > blinkStart) {
      // Blink phase
      const blinkPhase = (t - blinkStart) / ANIME_EXPRESSION_SETTINGS.blinkDuration;
      const blinkAmount = Math.sin(blinkPhase * Math.PI);
      setExpression(VRM_EXPRESSIONS.blink, blinkAmount);
    } else if (t < 0.05) {
      // Open eyes
      setExpression(VRM_EXPRESSIONS.blink, 0);
    }
  });

  // Get current expression value
  const getExpressionValue = useCallback((expressionName) => {
    return expressionStateRef.current.get(expressionName) || 0;
  }, []);

  // Get all expressions
  const getAllExpressions = useCallback(() => {
    return Object.fromEntries(expressionStateRef.current);
  }, []);

  return {
    initializeExpressions,
    setExpression,
    blendExpressions,
    blink,
    doubleBlink,
    setFacialExpression,
    setMouthShape,
    setEyeLook,
    getExpressionValue,
    getAllExpressions,
    vrmExpressionsReady,
    expressionStateRef,
    ANIME_EXPRESSION_SETTINGS,
  };
}

export { VRM_EXPRESSIONS, ANIME_EXPRESSION_SETTINGS };
