// hooks/useFlexibleBodyMovement.js
// 🎭 FULL-BODY FLEXIBLE MOVEMENT SYSTEM
// ✅ All bone control
// ✅ Realistic posture
// ✅ Natural weight distribution
// ✅ Flexible spine
// ✅ T-pose correction

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const deg = THREE.MathUtils.degToRad;
const lerp = (a, b, t) => a + (b - a) * t;

// Complete skeleton bone list with VRM naming
const FULL_SKELETON = {
  // Core
  hips: 'Armature|Hips',
  spine: 'Armature|Spine',
  spine1: 'Armature|Spine1',
  spine2: 'Armature|Spine2',
  chest: 'Armature|Chest',
  neck: 'Armature|Neck',
  head: 'Armature|Head',

  // Left Arm (T-pose fix: arms down naturally)
  leftShoulder: 'Armature|LeftShoulder',
  leftUpperArm: 'Armature|LeftUpperArm',
  leftLowerArm: 'Armature|LeftForeArm',
  leftHand: 'Armature|LeftHand',
  leftThumbProximal: 'Armature|LeftThumbProximal',
  leftThumbIntermediate: 'Armature|LeftThumbIntermediate',
  leftIndexProximal: 'Armature|LeftIndexProximal',
  leftIndexIntermediate: 'Armature|LeftIndexIntermediate',
  leftIndexDistal: 'Armature|LeftIndexDistal',
  leftMiddleProximal: 'Armature|LeftMiddleProximal',
  leftMiddleIntermediate: 'Armature|LeftMiddleIntermediate',
  leftMiddleDistal: 'Armature|LeftMiddleDistal',
  leftRingProximal: 'Armature|LeftRingProximal',
  leftRingIntermediate: 'Armature|LeftRingIntermediate',
  leftRingDistal: 'Armature|LeftRingDistal',
  leftLittleProximal: 'Armature|LeftLittleProximal',
  leftLittleIntermediate: 'Armature|LeftLittleIntermediate',
  leftLittleDistal: 'Armature|LeftLittleDistal',

  // Right Arm (T-pose fix: arms down naturally)
  rightShoulder: 'Armature|RightShoulder',
  rightUpperArm: 'Armature|RightUpperArm',
  rightLowerArm: 'Armature|RightForeArm',
  rightHand: 'Armature|RightHand',
  rightThumbProximal: 'Armature|RightThumbProximal',
  rightThumbIntermediate: 'Armature|RightThumbIntermediate',
  rightIndexProximal: 'Armature|RightIndexProximal',
  rightIndexIntermediate: 'Armature|RightIndexIntermediate',
  rightIndexDistal: 'Armature|RightIndexDistal',
  rightMiddleProximal: 'Armature|RightMiddleProximal',
  rightMiddleIntermediate: 'Armature|RightMiddleIntermediate',
  rightMiddleDistal: 'Armature|RightMiddleDistal',
  rightRingProximal: 'Armature|RightRingProximal',
  rightRingIntermediate: 'Armature|RightRingIntermediate',
  rightRingDistal: 'Armature|RightRingDistal',
  rightLittleProximal: 'Armature|RightLittleProximal',
  rightLittleIntermediate: 'Armature|RightLittleIntermediate',
  rightLittleDistal: 'Armature|RightLittleDistal',

  // Left Leg
  leftUpperLeg: 'Armature|LeftUpperLeg',
  leftLowerLeg: 'Armature|LeftLowerLeg',
  leftFoot: 'Armature|LeftFoot',
  leftToes: 'Armature|LeftToes',

  // Right Leg
  rightUpperLeg: 'Armature|RightUpperLeg',
  rightLowerLeg: 'Armature|RightLowerLeg',
  rightFoot: 'Armature|RightFoot',
  rightToes: 'Armature|RightToes',
};

// Bone constraints and ranges
const BONE_CONSTRAINTS = {
  spine: { x: [-30, 30], y: [-20, 20], z: [-25, 25] },
  spine1: { x: [-25, 25], y: [-15, 15], z: [-20, 20] },
  spine2: { x: [-20, 20], y: [-15, 15], z: [-15, 15] },
  chest: { x: [-15, 15], y: [-10, 10], z: [-10, 10] },
  neck: { x: [-30, 30], y: [-40, 40], z: [-20, 20] },
  head: { x: [-25, 25], y: [-60, 60], z: [-20, 20] },
  leftUpperArm: { x: [-90, 160], y: [-90, 90], z: [-90, 90] },
  rightUpperArm: { x: [-90, 160], y: [-90, 90], z: [-90, 90] },
  leftLowerArm: { x: [0, 140], y: [-90, 90], z: [-90, 0] },
  rightLowerArm: { x: [0, 140], y: [-90, 90], z: [0, 90] },
  leftHand: { x: [-45, 45], y: [-40, 40], z: [-40, 40] },
  rightHand: { x: [-45, 45], y: [-40, 40], z: [-40, 40] },
  leftUpperLeg: { x: [-120, 120], y: [-40, 40], z: [-40, 40] },
  rightUpperLeg: { x: [-120, 120], y: [-40, 40], z: [-40, 40] },
  leftLowerLeg: { x: [0, 130], y: [0, 0], z: [0, 0] },
  rightLowerLeg: { x: [0, 130], y: [0, 0], z: [0, 0] },
};

export function useFlexibleBodyMovement(vrmModel) {
  const bonesMapRef = useRef(new Map());
  const boneRotationRef = useRef(new Map());
  const bodyStateRef = useRef({
    posture: 'standing', // standing, sitting, crouching
    weight: 'center', // center, left, right
    flexibility: 1, // 0-1 scale
  });

  const [bodyReady, setBodyReady] = useState(false);

  // Initialize body with T-pose fix
  const initializeBody = useCallback(() => {
    if (!vrmModel) return;

    try {
      vrmModel.scene.traverse((node) => {
        for (const [boneName, vrmName] of Object.entries(FULL_SKELETON)) {
          if (node.name === vrmName || node.name.includes(boneName)) {
            bonesMapRef.current.set(boneName, node);
            boneRotationRef.current.set(boneName, { x: 0, y: 0, z: 0 });
          }
        }
      });

      // Fix T-pose by rotating arms down naturally
      fixTPose();
      setBodyReady(true);
      console.log('✅ Full body initialized with', bonesMapRef.current.size, 'bones');
    } catch (error) {
      console.error('❌ Error initializing body:', error);
    }
  }, [vrmModel]);

  // Fix T-pose (arms naturally down instead of spread)
  const fixTPose = useCallback(() => {
    // Rotate shoulders to natural position
    const leftShoulder = bonesMapRef.current.get('leftShoulder');
    const rightShoulder = bonesMapRef.current.get('rightShoulder');

    if (leftShoulder) {
      leftShoulder.rotation.z = deg(-10); // Slight tilt
    }
    if (rightShoulder) {
      rightShoulder.rotation.z = deg(10); // Slight tilt
    }

    // Arms down naturally
    const leftUpperArm = bonesMapRef.current.get('leftUpperArm');
    const rightUpperArm = bonesMapRef.current.get('rightUpperArm');

    if (leftUpperArm) {
      leftUpperArm.rotation.z = deg(-5); // Arms down
      leftUpperArm.rotation.x = deg(0);
    }
    if (rightUpperArm) {
      rightUpperArm.rotation.z = deg(5); // Arms down
      rightUpperArm.rotation.x = deg(0);
    }
  }, []);

  // Update bone rotation with constraints
  const updateBoneRotation = useCallback((boneName, targetRotation, smooth = 0.1) => {
    const bone = bonesMapRef.current.get(boneName);
    if (!bone) return;

    const constraints = BONE_CONSTRAINTS[boneName];
    const current = boneRotationRef.current.get(boneName) || { x: 0, y: 0, z: 0 };

    // Apply constraints
    const clampRotation = (value, min, max) => Math.max(min, Math.min(max, value));

    const constrained = {
      x: constraints ? deg(clampRotation(targetRotation.x || 0, constraints.x[0], constraints.x[1])) : targetRotation.x || 0,
      y: constraints ? deg(clampRotation(targetRotation.y || 0, constraints.y[0], constraints.y[1])) : targetRotation.y || 0,
      z: constraints ? deg(clampRotation(targetRotation.z || 0, constraints.z[0], constraints.z[1])) : targetRotation.z || 0,
    };

    // Smooth interpolation
    const newRotation = {
      x: lerp(current.x, constrained.x, smooth),
      y: lerp(current.y, constrained.y, smooth),
      z: lerp(current.z, constrained.z, smooth),
    };

    boneRotationRef.current.set(boneName, newRotation);
    bone.rotation.x = newRotation.x;
    bone.rotation.y = newRotation.y;
    bone.rotation.z = newRotation.z;
  }, []);

  // Body bending (left-right movement)
  const bendBodyLeftRight = useCallback((direction, intensity = 0.5) => {
    // Spine curvature for bending
    const bendAmount = direction * intensity * 25; // -25 to +25 degrees

    // Bend at multiple spine points for realistic curve
    updateBoneRotation('spine', { z: bendAmount * 0.3 });
    updateBoneRotation('spine1', { z: bendAmount * 0.4 });
    updateBoneRotation('spine2', { z: bendAmount * 0.3 });
    updateBoneRotation('chest', { z: bendAmount * 0.2 });

    // Shift hips opposite to upper body
    const hips = bonesMapRef.current.get('hips');
    if (hips) {
      hips.position.x = -direction * intensity * 0.05;
    }
  }, [updateBoneRotation]);

  // Forward/backward bending
  const bendBodyForwardBackward = useCallback((direction, intensity = 0.5) => {
    const bendAmount = direction * intensity * 30; // -30 to +30 degrees

    updateBoneRotation('spine', { x: bendAmount * 0.3 });
    updateBoneRotation('spine1', { x: bendAmount * 0.4 });
    updateBoneRotation('spine2', { x: bendAmount * 0.3 });
    updateBoneRotation('chest', { x: bendAmount * 0.2 });
    updateBoneRotation('neck', { x: bendAmount * -0.3 }); // Counter-balance head
  }, [updateBoneRotation]);

  // Hand clap animation
  const clap = useCallback((intensity = 1, duration = 0.5) => {
    const steps = 10;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const progress = i / steps;
        const clapAmount = Math.sin(progress * Math.PI) * intensity;

        // Bring hands together
        updateBoneRotation('leftLowerArm', { x: deg(-90 * clapAmount), y: deg(45 * clapAmount) });
        updateBoneRotation('rightLowerArm', { x: deg(-90 * clapAmount), y: deg(-45 * clapAmount) });

        // Hand positions come together
        updateBoneRotation('leftHand', { x: deg(45 * clapAmount) });
        updateBoneRotation('rightHand', { x: deg(45 * clapAmount) });
      }, stepDuration * i * 1000);
    }
  }, [updateBoneRotation]);

  // Arm swinging (walking motion)
  const armSwing = useCallback((direction = 1, intensity = 0.5) => {
    const swingAmount = direction * intensity * 45; // -45 to +45 degrees

    // Left arm swings opposite to right
    updateBoneRotation('leftUpperArm', { x: swingAmount });
    updateBoneRotation('leftLowerArm', { x: Math.max(0, swingAmount * 0.5) });

    // Right arm swings
    updateBoneRotation('rightUpperArm', { x: -swingAmount });
    updateBoneRotation('rightLowerArm', { x: Math.max(0, -swingAmount * 0.5) });
  }, [updateBoneRotation]);

  // Shoulder shrug
  const shrug = useCallback((intensity = 1, direction = 1) => {
    const shrugAmount = intensity * 20 * direction;

    updateBoneRotation('leftShoulder', { y: deg(-5 * direction), z: deg(15 * intensity) });
    updateBoneRotation('rightShoulder', { y: deg(5 * direction), z: deg(-15 * intensity) });

    // Neck slightly tilts
    updateBoneRotation('neck', { z: deg(10 * intensity * direction) });
  }, [updateBoneRotation]);

  // Full body rotation
  const rotateBody = useCallback((yawAngle) => {
    const hips = bonesMapRef.current.get('hips');
    if (hips) {
      hips.rotation.y = deg(yawAngle);
    }

    // Upper body follows
    updateBoneRotation('spine', { y: deg(yawAngle * 0.3) });
    updateBoneRotation('chest', { y: deg(yawAngle * 0.2) });
  }, [updateBoneRotation]);

  // Get bone reference
  const getBone = useCallback((boneName) => bonesMapRef.current.get(boneName), []);

  // Get all bones
  const getAllBones = useCallback(() => Object.fromEntries(bonesMapRef.current), []);

  return {
    initializeBody,
    updateBoneRotation,
    bendBodyLeftRight,
    bendBodyForwardBackward,
    clap,
    armSwing,
    shrug,
    rotateBody,
    getBone,
    getAllBones,
    fixTPose,
    bonesMapRef,
    bodyReady,
    bodyStateRef,
    BONE_CONSTRAINTS,
  };
}

export { FULL_SKELETON, BONE_CONSTRAINTS };
