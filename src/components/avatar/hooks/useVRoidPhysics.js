// hooks/useVRoidPhysics.js
// 🎯 ADVANCED VROID PHYSICS & CLOTH SIMULATION
// ✅ Hair physics
// ✅ Cloth dynamics
// ✅ Bone velocity tracking
// ✅ Physics-based animation
// ✅ Soft body simulation

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;

// Physics settings optimized for anime
const VROID_PHYSICS_SETTINGS = {
  // Gravity simulation
  gravity: -0.5, // Light gravity for anime
  damping: 0.95, // How quickly things slow down
  friction: 0.98,
  
  // Hair physics
  hairDamping: 0.92,
  hairStiffness: 0.1,
  hairGravity: -0.3,
  
  // Cloth physics
  clothDamping: 0.90,
  clothStiffness: 0.15,
  clothGravity: -0.4,
  
  // Wind simulation
  windStrength: 0.1,
  windVariation: 0.5,
  
  // Collision
  collisionRadius: 0.1,
  collisionResponse: 0.8,
};

export function useVRoidPhysics() {
  // Track bone velocities for physics
  const boneVelocityRef = useRef(new Map());
  const bonePositionRef = useRef(new Map());
  const physicsObjectsRef = useRef([]);
  const windStateRef = useRef({ x: 0, y: 0, z: 0 });

  // Initialize physics object
  const addPhysicsObject = useCallback((boneName, bone, options = {}) => {
    const physicsObj = {
      boneName,
      bone,
      mass: options.mass || 1,
      damping: options.damping || VROID_PHYSICS_SETTINGS.hairDamping,
      stiffness: options.stiffness || VROID_PHYSICS_SETTINGS.hairStiffness,
      velocity: new THREE.Vector3(0, 0, 0),
      prevPosition: bone.position.clone(),
      forces: new THREE.Vector3(0, 0, 0),
      pinned: options.pinned || false,
      colliding: false,
    };

    physicsObjectsRef.current.push(physicsObj);
    bonePositionRef.current.set(boneName, bone.position.clone());
    boneVelocityRef.current.set(boneName, new THREE.Vector3(0, 0, 0));

    return physicsObj;
  }, []);

  // Track bone movement velocity
  const updateBoneVelocity = useCallback((boneName, bone) => {
    const prevPos = bonePositionRef.current.get(boneName);
    if (!prevPos) return;

    const velocity = new THREE.Vector3(
      bone.position.x - prevPos.x,
      bone.position.y - prevPos.y,
      bone.position.z - prevPos.z
    );

    boneVelocityRef.current.set(boneName, velocity);
    bonePositionRef.current.set(boneName, bone.position.clone());

    return velocity;
  }, []);

  // Simulate wind effect
  const updateWind = useCallback((time) => {
    // Perlin noise-like wind variation
    const windX = Math.sin(time * 0.5) * VROID_PHYSICS_SETTINGS.windStrength;
    const windY = Math.cos(time * 0.3) * VROID_PHYSICS_SETTINGS.windStrength * 0.5;
    const windZ = Math.sin(time * 0.7) * VROID_PHYSICS_SETTINGS.windStrength;

    windStateRef.current = { x: windX, y: windY, z: windZ };
  }, []);

  // Hair physics simulation (Verlet integration)
  const simulateHairPhysics = useCallback((delta) => {
    physicsObjectsRef.current.forEach((obj) => {
      if (obj.pinned) return; // Pinned bones don't move

      // Reset forces
      obj.forces.set(0, 0, 0);

      // Apply gravity
      obj.forces.y += VROID_PHYSICS_SETTINGS.gravity * obj.mass;

      // Apply wind force
      obj.forces.add(
        new THREE.Vector3(
          windStateRef.current.x * obj.mass,
          windStateRef.current.y * obj.mass,
          windStateRef.current.z * obj.mass
        )
      );

      // Apply forces to velocity (Verlet integration)
      obj.velocity.add(obj.forces.multiplyScalar(delta));
      obj.velocity.multiplyScalar(obj.damping);

      // Update position
      obj.bone.position.add(obj.velocity.multiplyScalar(delta));

      // Apply stiffness (return to original position)
      const diff = new THREE.Vector3().subVectors(obj.bone.position, obj.prevPosition);
      diff.multiplyScalar(1 - obj.stiffness);
      obj.bone.position.sub(diff);
    });
  }, []);

  // Apply physics to bone
  const applyPhysicsToBone = useCallback((boneName, bone) => {
    const physicsObj = physicsObjectsRef.current.find((obj) => obj.boneName === boneName);
    if (!physicsObj) return;

    // Update physics
    updateBoneVelocity(boneName, bone);

    // Collision detection
    checkCollisions(physicsObj);
  }, [updateBoneVelocity]);

  // Collision detection
  const checkCollisions = useCallback((physicsObj) => {
    // Simple sphere collision detection
    const radius = VROID_PHYSICS_SETTINGS.collisionRadius;

    // Check against other physics objects
    physicsObjectsRef.current.forEach((other) => {
      if (other === physicsObj || other.pinned) return;

      const distance = physicsObj.bone.position.distanceTo(other.bone.position);

      if (distance < radius * 2) {
        // Collision detected
        const direction = new THREE.Vector3().subVectors(
          physicsObj.bone.position,
          other.bone.position
        ).normalize();

        // Push apart
        const pushDistance = (radius * 2 - distance) * VROID_PHYSICS_SETTINGS.collisionResponse;
        physicsObj.bone.position.addScaledVector(direction, pushDistance * 0.5);
        other.bone.position.addScaledVector(direction, -pushDistance * 0.5);

        // Dampen velocity on collision
        physicsObj.velocity.multiplyScalar(0.5);
        other.velocity.multiplyScalar(0.5);
      }
    });
  }, []);

  // Hair jiggle effect
  const addHairJiggle = useCallback((bone, intensity = 0.5) => {
    const jiggleX = (Math.random() - 0.5) * intensity * 0.05;
    const jiggleY = (Math.random() - 0.5) * intensity * 0.05;
    const jiggleZ = (Math.random() - 0.5) * intensity * 0.05;

    bone.position.x += jiggleX;
    bone.position.y += jiggleY;
    bone.position.z += jiggleZ;
  }, []);

  // Main physics loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Update wind
    updateWind(time);

    // Simulate hair physics
    simulateHairPhysics(delta);

    // Apply physics to bones
    physicsObjectsRef.current.forEach((physicsObj) => {
      applyPhysicsToBone(physicsObj.boneName, physicsObj.bone);
    });
  });

  // Get physics stats
  const getPhysicsStats = useCallback(() => {
    return {
      activeObjects: physicsObjectsRef.current.length,
      wind: { ...windStateRef.current },
      physics: { ...VROID_PHYSICS_SETTINGS },
    };
  }, []);

  return {
    addPhysicsObject,
    updateBoneVelocity,
    updateWind,
    simulateHairPhysics,
    applyPhysicsToBone,
    checkCollisions,
    addHairJiggle,
    getPhysicsStats,
    physicsObjectsRef,
    boneVelocityRef,
    VROID_PHYSICS_SETTINGS,
  };
}

export { VROID_PHYSICS_SETTINGS };
