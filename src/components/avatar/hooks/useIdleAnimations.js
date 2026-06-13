// hooks/useIdleAnimations.js
// 🎯 ADVANCED IDLE ANIMATIONS
// ✅ Natural breathing patterns
// ✅ Subtle micro-movements
// ✅ Realistic fidgeting
// ✅ Weight shifting
// ✅ Eye movement patterns

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const deg = THREE.MathUtils.degToRad;
const lerp = (a, b, t) => a + (b - a) * t;
const sine = (t) => Math.sin(t * Math.PI * 2);
const random = () => Math.random() * 2 - 1;

export function useIdleAnimations() {
  const timeRef = useRef(0);
  const bonesRef = useRef({});
  const blendShapesRef = useRef({});
  const idleStateRef = useRef({
    breathingPhase: 0,
    swayPhase: 0,
    fidgetType: 'none',
    fidgetTime: 0,
    eyeLookX: 0,
    eyeLookY: 0,
    headTiltAmount: 0,
  });

  // ── Advanced Breathing Patterns ──
  const updateBreathing = (time) => {
    // Realistic breathing: 12-20 breaths per minute = 0.2-0.33 Hz
    const breathingFrequency = 0.15; // ~9 breaths per minute
    const breathAmount = sine(time * breathingFrequency) * 0.5;

    // Chest expansion
    if (bonesRef.current.chest) {
      bonesRef.current.chest.scale.z = 1 + breathAmount * 0.05;
      bonesRef.current.chest.scale.x = 1 + breathAmount * 0.02;
    }

    // Subtle spine movement
    if (bonesRef.current.spine) {
      bonesRef.current.spine.rotation.x = deg(breathAmount * 1);
    }

    // Shoulder rise/fall
    if (bonesRef.current.leftShoulder) {
      bonesRef.current.leftShoulder.position.y = breathAmount * 0.02;
    }
    if (bonesRef.current.rightShoulder) {
      bonesRef.current.rightShoulder.position.y = breathAmount * 0.02;
    }

    return breathAmount;
  };

  // ── Natural Swaying ──
  const updateSway = (time) => {
    // Slow, natural sway: 0.3-0.5 Hz
    const swayX = sine(time * 0.3) * 3; // Side to side
    const swayZ = sine(time * 0.25 + 1) * 2; // Forward/backward

    // Hip sway
    if (bonesRef.current.hips) {
      bonesRef.current.hips.rotation.z = deg(swayX);
      bonesRef.current.hips.rotation.x = deg(swayZ * 0.5);
    }

    // Spine follow
    if (bonesRef.current.spine) {
      bonesRef.current.spine.rotation.z = deg(swayX * 0.7);
      bonesRef.current.spine.rotation.x = deg(swayZ * 0.3);
    }

    // Chest follow
    if (bonesRef.current.chest) {
      bonesRef.current.chest.rotation.z = deg(swayX * 0.5);
    }

    // Head sway
    if (bonesRef.current.head) {
      bonesRef.current.head.rotation.z = deg(swayX * 0.3);
    }

    // Slight weight shift on legs
    if (bonesRef.current.leftUpperLeg) {
      bonesRef.current.leftUpperLeg.rotation.z = deg(swayX > 0 ? -1 : 0);
    }
    if (bonesRef.current.rightUpperLeg) {
      bonesRef.current.rightUpperLeg.rotation.z = deg(swayX < 0 ? 1 : 0);
    }
  };

  // ── Micro-fidgeting ──
  const updateFidgeting = (time) => {
    // Random fidget every 5-10 seconds
    const fidgetInterval = 7;
    const fidgetPhase = time % fidgetInterval;

    if (fidgetPhase < 0.5) {
      // Finger twitching
      if (blendShapesRef.current.fingersTwitch) {
        const twitch = Math.sin(time * 8) * 0.3;
        blendShapesRef.current.fingersTwitch.value = Math.max(0, twitch);
      }

      // Hand tension
      if (bonesRef.current.leftHand) {
        bonesRef.current.leftHand.rotation.z = deg(Math.sin(time * 6) * 2);
      }
      if (bonesRef.current.rightHand) {
        bonesRef.current.rightHand.rotation.z = deg(Math.sin(time * 6 + 1) * 2);
      }
    } else if (fidgetPhase < 1.5) {
      // Hair touch
      if (blendShapesRef.current.hairTouch) {
        const touchAmount = Math.sin((fidgetPhase - 0.5) * Math.PI) * 0.4;
        blendShapesRef.current.hairTouch.value = touchAmount;
      }

      // Arm adjustment
      if (bonesRef.current.leftUpperArm) {
        const adjustment = Math.sin((fidgetPhase - 0.5) * Math.PI) * 5;
        bonesRef.current.leftUpperArm.rotation.x = deg(adjustment);
      }
    } else if (fidgetPhase < 2.5) {
      // Neck stretch
      if (bonesRef.current.neck) {
        const stretch = Math.sin((fidgetPhase - 1.5) * Math.PI) * 3;
        bonesRef.current.neck.rotation.x = deg(stretch);
      }

      // Shoulder roll
      if (bonesRef.current.leftShoulder) {
        const roll = Math.sin((fidgetPhase - 1.5) * Math.PI) * 4;
        bonesRef.current.leftShoulder.rotation.z = deg(roll);
      }
    }
  };

  // ── Natural Eye Movement ──
  const updateEyeMovement = (time) => {
    // Eyes look around naturally every 3-5 seconds
    const lookInterval = 4;
    const lookPhase = (time % lookInterval) / lookInterval;

    let targetX = 0;
    let targetY = 0;

    if (lookPhase < 0.3) {
      // Look forward
      targetX = 0;
      targetY = 0;
    } else if (lookPhase < 0.5) {
      // Look right
      targetX = 15;
      targetY = 5;
    } else if (lookPhase < 0.7) {
      // Look left
      targetX = -15;
      targetY = -5;
    } else if (lookPhase < 0.85) {
      // Look down
      targetX = 0;
      targetY = -10;
    }

    // Smooth lerp to target
    idleStateRef.current.eyeLookX = lerp(idleStateRef.current.eyeLookX, targetX, 0.1);
    idleStateRef.current.eyeLookY = lerp(idleStateRef.current.eyeLookY, targetY, 0.1);

    // Apply eye rotation
    if (bonesRef.current.eyeLeft) {
      bonesRef.current.eyeLeft.rotation.y = deg(idleStateRef.current.eyeLookX);
      bonesRef.current.eyeLeft.rotation.x = deg(idleStateRef.current.eyeLookY);
    }
    if (bonesRef.current.eyeRight) {
      bonesRef.current.eyeRight.rotation.y = deg(idleStateRef.current.eyeLookX);
      bonesRef.current.eyeRight.rotation.x = deg(idleStateRef.current.eyeLookY);
    }
  };

  // ── Occasional Head Tilt ──
  const updateHeadTilt = (time) => {
    // Head tilts slightly every 8-10 seconds
    const tiltInterval = 9;
    const tiltPhase = (time % tiltInterval) / tiltInterval;

    let targetTilt = 0;
    if (tiltPhase < 0.4) {
      targetTilt = 0;
    } else if (tiltPhase < 0.6) {
      targetTilt = Math.sin((tiltPhase - 0.4) * Math.PI * 5) * 5;
    } else if (tiltPhase < 0.8) {
      targetTilt = Math.sin((tiltPhase - 0.6) * Math.PI * 5) * -3;
    } else {
      targetTilt = 0;
    }

    idleStateRef.current.headTiltAmount = lerp(idleStateRef.current.headTiltAmount, targetTilt, 0.1);

    if (bonesRef.current.head) {
      bonesRef.current.head.rotation.z = deg(idleStateRef.current.headTiltAmount);
    }
  };

  // ── Blink Pattern ──
  const updateBlinking = (time) => {
    // Natural blink: every 3-5 seconds, 0.1-0.15 second duration
    const blinkInterval = 4;
    const blinkPhase = (time % blinkInterval) / blinkInterval;

    let blinkAmount = 0;
    if (blinkPhase < 0.05) {
      // Closing
      blinkAmount = blinkPhase * 20;
    } else if (blinkPhase < 0.1) {
      // Closed
      blinkAmount = 1;
    } else if (blinkPhase < 0.15) {
      // Opening
      blinkAmount = 1 - (blinkPhase - 0.1) * 20;
    }

    if (blendShapesRef.current.eyeBlinkLeft) {
      blendShapesRef.current.eyeBlinkLeft.value = blinkAmount;
    }
    if (blendShapesRef.current.eyeBlinkRight) {
      blendShapesRef.current.eyeBlinkRight.value = blinkAmount;
    }
  };

  // Main animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;

    updateBreathing(timeRef.current);
    updateSway(timeRef.current);
    updateFidgeting(timeRef.current);
    updateEyeMovement(timeRef.current);
    updateHeadTilt(timeRef.current);
    updateBlinking(timeRef.current);
  });

  return {
    bonesRef,
    blendShapesRef,
    timeRef,
    idleStateRef,
  };
}

export { };
