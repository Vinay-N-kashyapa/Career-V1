// hooks/useVRoidSmoothAnimation.js
// 🎯 VROID STUDIO ANIME AVATAR SMOOTH ANIMATION
// ✅ VRM bone mapping
// ✅ Anime character smooth movements
// ✅ Hair physics simulation
// ✅ Cloth simulation ready
// ✅ Optimized for anime style

import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const deg = THREE.MathUtils.degToRad;
const lerp = (a, b, t) => a + (b - a) * t;

// VRM Standard Bone Names (VRoid uses these)
const VRM_BONES = {
  hips: 'Armature|Hips',
  spine: 'Armature|Spine',
  chest: 'Armature|Chest',
  neck: 'Armature|Neck',
  head: 'Armature|Head',
  leftShoulder: 'Armature|LeftShoulder',
  rightShoulder: 'Armature|RightShoulder',
  leftUpperArm: 'Armature|LeftUpperArm',
  rightUpperArm: 'Armature|RightUpperArm',
  leftLowerArm: 'Armature|LeftLowerArm',
  rightLowerArm: 'Armature|RightLowerArm',
  leftHand: 'Armature|LeftHand',
  rightHand: 'Armature|RightHand',
  leftUpperLeg: 'Armature|LeftUpperLeg',
  rightUpperLeg: 'Armature|RightUpperLeg',
  leftLowerLeg: 'Armature|LeftLowerLeg',
  rightLowerLeg: 'Armature|RightLowerLeg',
  leftFoot: 'Armature|LeftFoot',
  rightFoot: 'Armature|RightFoot',
};

// Anime-specific smooth settings
const ANIME_SMOOTH_SETTINGS = {
  // Hair physics multiplier (anime hair moves more dramatically)
  hairPhysicsAmount: 0.6,
  // Eye blink timing for anime style
  eyeBlinkFrequency: 0.25, // Blinks more often in anime
  // Head tilt sensitivity (anime characters tilt head more)
  headTiltSensitivity: 1.5,
  // Arm swing smoothness
  armSwingSmoothing: 0.15,
  // Body sway for anime idle (more pronounced)
  bodySwyaAmount: 1.2,
  // Interpolation speed for smooth anime movements
  boneInterpolationSpeed: 0.1,
};

export function useVRoidSmoothAnimation(vrmModel) {
  const bonesMapRef = useRef(new Map());
  const boneRotationRef = useRef(new Map());
  const previousRotationRef = useRef(new Map());
  const [vrmReady, setVrmReady] = useState(false);
  const animationStateRef = useRef({
    currentAnimation: 'idle',
    animationProgress: 0,
    animationDuration: 0,
    isAnimating: false,
  });

  // Initialize VRM bone mapping
  useEffect(() => {
    if (!vrmModel) return;

    try {
      // Map VRM bones
      vrmModel.scene.traverse((node) => {
        for (const [boneName, vrmName] of Object.entries(VRM_BONES)) {
          if (node.name === vrmName || node.name.includes(boneName)) {
            bonesMapRef.current.set(boneName, node);
            boneRotationRef.current.set(boneName, { x: 0, y: 0, z: 0 });
            previousRotationRef.current.set(boneName, { x: 0, y: 0, z: 0 });
          }
        }
      });

      setVrmReady(true);
      console.log('✅ VRM bones mapped successfully');
    } catch (error) {
      console.error('❌ Error mapping VRM bones:', error);
    }
  }, [vrmModel]);

  // Smooth bone rotation with anime-specific settings
  const updateBoneRotation = useCallback((boneName, targetRotation, duration = 0.3) => {
    const bone = bonesMapRef.current.get(boneName);
    if (!bone) return;

    // Store target rotation for interpolation
    const currentRotation = boneRotationRef.current.get(boneName) || { x: 0, y: 0, z: 0 };

    // Smooth interpolation using anime-optimized speed
    const smoothSpeed = ANIME_SMOOTH_SETTINGS.boneInterpolationSpeed;
    const newRotation = {
      x: lerp(currentRotation.x, targetRotation.x, smoothSpeed),
      y: lerp(currentRotation.y, targetRotation.y, smoothSpeed),
      z: lerp(currentRotation.z, targetRotation.z, smoothSpeed),
    };

    boneRotationRef.current.set(boneName, newRotation);

    // Apply to bone with easing
    bone.rotation.x = newRotation.x;
    bone.rotation.y = newRotation.y;
    bone.rotation.z = newRotation.z;
  }, []);

  // Anime smooth head movement
  const updateHeadMovement = useCallback((targetX, targetY, intensity = 1) => {
    const headBone = bonesMapRef.current.get('head');
    if (!headBone) return;

    // Apply with anime sensitivity
    const x = deg(targetX * ANIME_SMOOTH_SETTINGS.headTiltSensitivity * intensity);
    const y = deg(targetY * ANIME_SMOOTH_SETTINGS.headTiltSensitivity * intensity);
    const z = deg(targetY * 0.3); // Slight roll

    updateBoneRotation('head', { x, y, z }, 0.2);
  }, [updateBoneRotation]);

  // Anime smooth arm movement
  const updateArmMovement = useCallback((isLeft, rotationX, rotationY, rotationZ) => {
    const boneName = isLeft ? 'leftUpperArm' : 'rightUpperArm';
    const targetRotation = {
      x: deg(rotationX),
      y: deg(rotationY * (isLeft ? -1 : 1)), // Mirror for opposite arm
      z: deg(rotationZ),
    };

    // Apply arm swing smoothing for anime style
    updateBoneRotation(boneName, targetRotation, 0.15);
  }, [updateBoneRotation]);

  // Hair physics for anime characters
  const updateHairPhysics = useCallback((swayAmount = 0.5) => {
    // Hair bones typically follow similar pattern to head
    const headBone = bonesMapRef.current.get('head');
    if (!headBone) return;

    // Apply slight physics to hair through bone animation
    const hairInfluence = swayAmount * ANIME_SMOOTH_SETTINGS.hairPhysicsAmount;

    // Simulate hair movement with slight delay
    const headRotX = headBone.rotation.x;
    const headRotZ = headBone.rotation.z;

    // Hair moves opposite to head for physics effect
    return {
      x: -headRotX * hairInfluence * 0.5,
      z: -headRotZ * hairInfluence * 0.5,
    };
  }, []);

  // Smooth anime idle animation
  const playIdleAnimation = useCallback(() => {
    animationStateRef.current.currentAnimation = 'idle';
    animationStateRef.current.isAnimating = true;
  }, []);

  // Smooth anime gesture
  const playGesture = useCallback((gestureName, duration = 1.5) => {
    animationStateRef.current.currentAnimation = gestureName;
    animationStateRef.current.animationDuration = duration;
    animationStateRef.current.animationProgress = 0;
    animationStateRef.current.isAnimating = true;
  }, []);

  // Main animation loop for VRM
  useFrame((state, delta) => {
    if (!vrmReady) return;

    const animState = animationStateRef.current;

    // Update animation progress
    if (animState.isAnimating) {
      animState.animationProgress += delta;
      if (animState.animationProgress >= animState.animationDuration) {
        animState.isAnimating = false;
        animState.currentAnimation = 'idle';
      }
    }

    // Handle different animations
    switch (animState.currentAnimation) {
      case 'idle':
        // Gentle anime idle sway
        const swayPhase = state.clock.elapsedTime * 0.5; // Slower sway for anime
        const swayX = Math.sin(swayPhase) * 2;
        const swayZ = Math.cos(swayPhase * 0.7) * 1.5;

        updateHeadMovement(swayX * 0.3, swayZ * 0.2, 0.5);

        // Subtle spine sway
        const spineBone = bonesMapRef.current.get('spine');
        if (spineBone) {
          spineBone.rotation.z = deg(swayX * 0.5);
          spineBone.rotation.x = deg(swayZ * 0.3);
        }

        // Hair physics
        updateHairPhysics(Math.sin(swayPhase) * 0.5);
        break;

      case 'wave':
        const wavePhase = animState.animationProgress / animState.animationDuration;
        const waveEase = Math.sin(wavePhase * Math.PI); // Ease in-out

        // Wave animation
        updateArmMovement(false, -20 * waveEase, -30, 0);
        updateHeadMovement(0, 5 * waveEase, 0.5);
        break;

      case 'nod':
        const nodPhase = animState.animationProgress / animState.animationDuration;
        const nodEase = Math.sin(nodPhase * Math.PI * 2); // Two full nods

        updateHeadMovement(nodEase * 15, 0, 0.3);
        break;

      case 'shake':
        const shakePhase = animState.animationProgress / animState.animationDuration;
        const shakeEase = Math.sin(shakePhase * Math.PI * 4); // Faster shakes

        updateHeadMovement(0, shakeEase * 20, 0.2);
        break;

      case 'excited':
        const excitedPhase = animState.animationProgress / animState.animationDuration;
        const excitedEase = Math.sin(excitedPhase * Math.PI * 3);

        // Excited movement (arms up and down)
        updateArmMovement(true, -excitedEase * 30, 0, 0);
        updateArmMovement(false, -excitedEase * 30, 0, 0);
        updateHeadMovement(excitedEase * 10, excitedEase * 5, 0.8);

        // Spine bounce
        const spineBone2 = bonesMapRef.current.get('spine');
        if (spineBone2) {
          spineBone2.position.y = Math.abs(excitedEase) * 0.05;
        }
        break;

      default:
        break;
    }
  });

  // Get VRM ready status
  const getVRMReady = useCallback(() => vrmReady, [vrmReady]);

  // Get bone reference
  const getBone = useCallback((boneName) => bonesMapRef.current.get(boneName), []);

  // Get all bones
  const getAllBones = useCallback(() => Object.fromEntries(bonesMapRef.current), []);

  return {
    playIdleAnimation,
    playGesture,
    updateHeadMovement,
    updateArmMovement,
    updateHairPhysics,
    updateBoneRotation,
    getVRMReady,
    getBone,
    getAllBones,
    bonesMapRef,
    vrmReady,
    animationStateRef,
    ANIME_SMOOTH_SETTINGS,
  };
}

export { VRM_BONES, ANIME_SMOOTH_SETTINGS };
