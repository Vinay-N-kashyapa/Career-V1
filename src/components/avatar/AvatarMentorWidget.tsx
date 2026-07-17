import { useState, useEffect, useRef, useCallback } from 'react';
import { usePersonalAvatarMemory }    from './hooks/usePersonalAvatarMemory';
import { useFacialEmotionDetection }  from './hooks/useFacialEmotionDetection';
import * as THREE from 'three';
import { speakWithAvatar, stopSpeaking } from '@/lib/tts';
import { toast } from '@/lib/store/useAppStore';


type AnimState = 'idle'|'listening'|'thinking'|'talking'|'wave'|'nod'|'shrug';

class AvatarScene {
  renderer!: THREE.WebGLRenderer; scene!: THREE.Scene; camera!: THREE.PerspectiveCamera;
  head?: THREE.Object3D; neck?: THREE.Object3D; spine?: THREE.Object3D;
  leftShoulder?: THREE.Object3D; rightShoulder?: THREE.Object3D;
  leftArm?: THREE.Object3D; rightArm?: THREE.Object3D;
  animState: AnimState='idle'; animT=0; talkPhase=0; disposed=false; raf?: number;
  clock=new THREE.Clock();

  isVRM = false;
  faceMeshes: THREE.Mesh[] = [];
  morphMaps: Map<THREE.Mesh, Record<string, number>> = new Map();
  vowelTimer = 0;
  nextVowelTime = 0.11;
  currentVowel = 'silence';
  currentInfluences: Record<string, number> = { A: 0, I: 0, U: 0, E: 0, O: 0 };
  proceduralMouth?: THREE.Mesh;

  init(canvas: HTMLCanvasElement, teacherId: string){
    if (typeof window !== 'undefined') {
      (window as any).mentorAvatarScene = this;
    }
    const w=canvas.clientWidth||280, h=canvas.clientHeight||360;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.setSize(w,h,false);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.setClearColor(0x000000,0);
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(28,w/h,0.01,20);
    // Position closer (Z=1.7 instead of 2.8) and look at face center (Y=1.43) to make the avatar look big and fill the viewport
    this.camera.position.set(0,1.43,1.7);
    this.camera.lookAt(0,1.43,0);
    this.scene.add(new THREE.AmbientLight(0xffffff,0.6));
    const key=new THREE.DirectionalLight(0xffffff,1.4);
    key.position.set(1.5,3,2); this.scene.add(key);
    this.tryLoadVRM(teacherId).catch(()=>this.buildProceduralAvatar());
    this.loop();
  }

  async tryLoadVRM(teacherId: string){
    const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
    const {DRACOLoader}=await import('three/examples/jsm/loaders/DRACOLoader.js');
    const loader=new GLTFLoader();
    const dracoLoader=new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    
    // Choose model paths based on selected teacherId
    let paths: string[] = [];
    const id = teacherId.toLowerCase();
    if (id === 'priya' || id === 'sneha') {
      paths = ['/avatar/hana.vrm', '/avatar/yuki.vrm'];
    } else if (id === 'anish' || id === 'rajesh') {
      paths = ['/avatar/riku.vrm', '/avatar/akira.vrm'];
    } else if (id === 'aisha' || id === 'maya') {
      paths = ['/avatar/yuki.vrm', '/avatar/rei.vrm'];
    } else if (id === 'rohan') {
      paths = ['/avatar/akira.vrm', '/avatar/riku.vrm'];
    } else if (id === 'divya' || id === 'karthic' || id === 'aditya') {
      paths = ['/avatar/sora.vrm', '/avatar/kaito.vrm'];
    } else if (id === 'kashyap' || id === 'neha') {
      paths = ['/avatar/mika.vrm', '/avatar/yuki.vrm'];
    } else if (id === 'vikram' || id === 'abhijit') {
      paths = ['/avatar/kaito.vrm', '/avatar/riku.vrm'];
    } else if (id === 'shalini') {
      paths = ['/avatar/rei.vrm', '/avatar/yuki.vrm'];
    } else {
      paths = ['/avatar/hana.vrm', '/avatar/yuki.vrm', '/avatar/mika.vrm'];
    }

    const loadAttempt = (idx: number): Promise<void> => {
      if (idx >= paths.length) return Promise.reject(new Error("No VRMs found"));
      return new Promise<void>((resolve, reject) => {
        const resolvedPath = paths[idx].replace('.vrm', '.glb');
        loader.load(resolvedPath, gltf => {
          this.scene.add(gltf.scene);
          this.isVRM = true;
          this.faceMeshes = [];
          this.morphMaps.clear();
          gltf.scene.traverse((obj: any) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
              if (obj.morphTargetDictionary) {
                const keys = Object.keys(obj.morphTargetDictionary);
                const mouthKeys = keys.filter(k => {
                  const kl = k.toLowerCase();
                  return kl === 'a' || kl === 'i' || kl === 'u' || kl === 'e' || kl === 'o' ||
                         kl.includes('fcl_mth') || kl.includes('mouth') || kl.includes('mth_') ||
                         kl === 'あ' || kl === 'い' || kl === 'う' || kl === 'え' || kl === 'お' ||
                         kl === 'aa' || kl === 'ih' || kl === 'ou' || kl === 'ee' || kl === 'oh';
                });
                const hasMouth = mouthKeys.length >= 3;
                const isFaceMeshName = obj.name.toLowerCase().includes('face') || obj.name.toLowerCase().includes('head');
                if (hasMouth && (isFaceMeshName || this.faceMeshes.length === 0)) {
                  this.faceMeshes.push(obj);
                  console.log("VRoidMentorWidget: Face Mesh identified:", obj.name, keys);
                }
              }
            }

            if (obj.isBone || obj.type === 'Bone') {
              const nameLower = obj.name.toLowerCase();
              
              // Check for Head and Neck
              if (nameLower.includes('head') && !nameLower.includes('hair') && !nameLower.includes('forehead')) {
                this.head = obj;
              }
              if (nameLower.includes('neck')) {
                this.neck = obj;
              }
              if (nameLower.includes('spine') || nameLower.includes('chest') || nameLower.includes('upperchest')) {
                this.spine = obj;
              }

              // Check for Shoulders
              if (nameLower.includes('shoulder') || nameLower.includes('clavicle')) {
                if (nameLower.includes('left') || nameLower.includes('_l_') || nameLower.startsWith('l_') || nameLower.includes('bip_l') || nameLower.endsWith('_l') || nameLower.endsWith('.l')) {
                  this.leftShoulder = obj;
                } else if (nameLower.includes('right') || nameLower.includes('_r_') || nameLower.startsWith('r_') || nameLower.includes('bip_r') || nameLower.endsWith('_r') || nameLower.endsWith('.r')) {
                  this.rightShoulder = obj;
                }
              }

              // Check for Upper Arms
              const isArm = (nameLower.includes('arm') || nameLower.includes('upperarm')) && 
                            !nameLower.includes('forearm') && 
                            !nameLower.includes('lowerarm') && 
                            !nameLower.includes('hand') && 
                            !nameLower.includes('finger') &&
                            !nameLower.includes('shoulder') &&
                            !nameLower.includes('clavicle');

              if (isArm || nameLower.includes('upperarm')) {
                if (nameLower.includes('left') || nameLower.includes('_l_') || nameLower.startsWith('l_') || nameLower.includes('bip_l') || nameLower.endsWith('_l') || nameLower.endsWith('.l')) {
                  this.leftArm = obj;
                } else if (nameLower.includes('right') || nameLower.includes('_r_') || nameLower.startsWith('r_') || nameLower.includes('bip_r') || nameLower.endsWith('_r') || nameLower.endsWith('.r')) {
                  this.rightArm = obj;
                }
              }
            }
          });

          // Resolve morph indices for vowels A, I, U, E, O for all face meshes
          if (this.faceMeshes.length > 0) {
            this.faceMeshes.forEach(mesh => {
              if (mesh.morphTargetDictionary) {
                const dict = mesh.morphTargetDictionary;
                const vowels = ['A', 'I', 'U', 'E', 'O'];
                const meshMorphMap: Record<string, number> = {};
                vowels.forEach(v => {
                  const foundKey = Object.keys(dict).find(k => {
                    const kl = k.toLowerCase();
                    const isVowelMatch = (vowel: string) => {
                      const vl = vowel.toLowerCase();
                      if (kl === vl || 
                          kl === `fcl_mth_${vl}` || 
                          kl === `mouth_${vl}`) {
                        return true;
                      }
                      if (kl.endsWith(`_${vl}`) || kl.endsWith(`.${vl}`)) {
                        return true;
                      }
                      if (kl.includes(`blendshape.${vl}`) || kl.includes(`preset.${vl}`)) {
                        return true;
                      }
                      if (vowel === 'A' && (kl === 'あ' || kl === 'aa' || kl === 'open' || kl === 'mouth_open' || kl === 'mouthopen')) return true;
                      if (vowel === 'I' && (kl === 'い' || kl === 'ih' || kl === 'ii')) return true;
                      if (vowel === 'U' && (kl === 'う' || kl === 'ou' || kl === 'uu')) return true;
                      if (vowel === 'E' && (kl === 'え' || kl === 'ee')) return true;
                      if (vowel === 'O' && (kl === 'お' || kl === 'oh' || kl === 'oo')) return true;
                      
                      return false;
                    };
                    return isVowelMatch(v);
                  });
                  if (foundKey) {
                    meshMorphMap[v] = dict[foundKey];
                    console.log(`VRoidMentorWidget: Mapped vowel ${v} to morph target index: ${dict[foundKey]} (key: "${foundKey}") on mesh "${mesh.name}"`);
                  } else {
                    console.warn(`VRoidMentorWidget: Could not map morph target for vowel ${v} on mesh "${mesh.name}"`);
                  }
                });
                this.morphMaps.set(mesh, meshMorphMap);
              }
            });
          } else {
            console.warn("VRoidMentorWidget: No face meshes with morph target dictionary found!");
          }
          this.centerCameraOnHead();
          resolve();
        }, undefined, () => {
          loadAttempt(idx + 1).then(resolve).catch(reject);
        });
      });
    };

    return loadAttempt(0);
  }

  buildProceduralAvatar(){
    this.isVRM = false;
    const g=new THREE.Group();
    const mat=(c:number,r=0.4,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    const SKIN=0xf5c8a8, SHIRT=0x4f5fa8, HAIR=0x1a1008, PANT=0x2c2c3e;
    const spine=new THREE.Group(); spine.position.y=1.22; this.spine=spine; g.add(spine);
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(0.14,0.36,8,12),mat(SHIRT,0.7)); torso.position.y=0; spine.add(torso);
    const neck=new THREE.Group(); neck.position.set(0,0.24,0); spine.add(neck); this.neck=neck;
    neck.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.065,0.12,12),mat(SKIN,0.5)),{position:new THREE.Vector3(0,0.06,0)}));
    const head=new THREE.Group(); head.position.y=0.18; neck.add(head); this.head=head;
    const skull=new THREE.Mesh(new THREE.SphereGeometry(0.13,24,20),mat(SKIN,0.45)); skull.scale.set(1,1.08,0.97); head.add(skull);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(0.135,24,20),mat(HAIR,0.8)); hair.position.y=0.04; head.add(hair);
    [[-0.048,0],[0.048,0]].forEach(([x])=>{
      const ew=new THREE.Mesh(new THREE.SphereGeometry(0.028,16,12),mat(0xffffff,0.1)); ew.position.set(x,0.02,0.114); head.add(ew);
      const ei=new THREE.Mesh(new THREE.SphereGeometry(0.018,16,12),mat(0x3a5fc8,0.3)); ei.position.set(x,0.02,0.127); head.add(ei);
    });

    // Add a simple mouth mesh to the procedural head
    const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.05, 4, 8), mat(0x9b1c1c, 0.5));
    mouth.position.set(0, -0.04, 0.125);
    mouth.rotation.z = Math.PI / 2;
    head.add(mouth);
    this.proceduralMouth = mouth;

    [[-0.2,0.18],[0.2,0.18]].forEach(([x])=>{
      const sh=new THREE.Mesh(new THREE.SphereGeometry(0.07,12,10),mat(SHIRT,0.7)); sh.position.set(x,0,0); spine.add(sh);
    });
    const makeArm=(side:number)=>{
      const ag=new THREE.Group(); ag.position.set(side*0.2,0.18,0); spine.add(ag);
      if(side<0) this.leftArm=ag; else this.rightArm=ag;
      const ua=new THREE.Mesh(new THREE.CapsuleGeometry(0.055,0.22,6,8),mat(SHIRT,0.7));
      ua.position.set(side*0.1,-0.14,0); ua.rotation.z=side*-0.25; ag.add(ua);
    };
    makeArm(-1); makeArm(1);
    const pelvis=new THREE.Mesh(new THREE.CapsuleGeometry(0.13,0.06,8,10),mat(PANT,0.8)); pelvis.position.y=1.01; g.add(pelvis);
    [[-0.08],[0.08]].forEach(([x])=>{
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(0.065,0.38,6,10),mat(PANT,0.8)); leg.position.set(x,0.78,0); g.add(leg);
      const shoe=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.055,0.18),mat(0x1a1a1a,0.9)); shoe.position.set(x,0.55,0.025); g.add(shoe);
    });
    this.scene.add(g);
    this.centerCameraOnHead();
  }

  centerCameraOnHead() {
    if (!this.camera) return;
    let headPos = new THREE.Vector3(0, 1.43, 0);
    if (this.head) {
      this.head.updateMatrixWorld(true);
      const temp = new THREE.Vector3();
      this.head.getWorldPosition(temp);
      if (temp.y > 0.3) {
        headPos.copy(temp);
      }
    }
    // Zoom in closer (Z distance 1.2 instead of 1.7) to make the avatar larger and easier to see
    this.camera.position.set(headPos.x, headPos.y - 0.05, headPos.z + 1.2);
    this.camera.lookAt(headPos.x, headPos.y - 0.05, headPos.z);
    console.log("AvatarScene: Camera dynamically centered on head:", headPos);
  }

  setState(s:AnimState){ if(this.animState===s) return; this.animState=s; this.animT=0; }

  loop(){
    if(this.disposed) return;
    this.raf=requestAnimationFrame(()=>this.loop());
    const dt=this.clock.getDelta(), et=this.clock.getElapsedTime();
    this.animT+=dt;

    // 1. Natural Breathing & Gentle Idle Swaying
    const breath = Math.sin(et * 1.5);
    const breathingSpineX = breath * 0.008;
    const breathingShoulderZ = breath * 0.004;

    const swayX = Math.sin(et * 0.5) * 0.006;
    const swayZ = Math.sin(et * 0.35) * 0.008;

    if (this.spine) {
      this.spine.rotation.x = breathingSpineX + swayX;
      this.spine.rotation.z = swayZ;
    }

    if (this.leftShoulder) {
      this.leftShoulder.rotation.z = -breathingShoulderZ;
    }
    if (this.rightShoulder) {
      this.rightShoulder.rotation.z = breathingShoulderZ;
    }

    // 2. Head & Neck look-around sways
    if (this.head) {
      const s = this.animState;
      if (s === 'idle') {
        // Subtle desynchronized look-around sway to prevent robotic U-shape patterns
        this.head.rotation.y = Math.sin(et * 0.13) * 0.035 + Math.cos(et * 0.07) * 0.015;
        this.head.rotation.x = Math.cos(et * 0.11) * 0.018 + Math.sin(et * 0.05) * 0.007 + 0.015;
        this.head.rotation.z = Math.sin(et * 0.08) * 0.008;
        if (this.neck) {
          this.neck.rotation.y = Math.sin(et * 0.13) * 0.01;
        }
      } else if (s === 'nod') {
        this.head.rotation.x = Math.sin(this.animT * 6.5) * 0.16 + 0.02;
        this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.1);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.1);
      } else if (s === 'thinking') {
        // Slow thinking posture with subtle desynchronized head drift
        const targetX = 0.05 + Math.sin(et * 0.6) * 0.01;
        const targetY = 0.12 + Math.cos(et * 0.5) * 0.015;
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, targetX, 0.08);
        this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, targetY, 0.08);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0.08, 0.08);
      } else if (s === 'shrug') {
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, -0.05, 0.08);
        this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.08);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.08);
      } else {
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.02, 0.08);
        this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.08);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.08);
      }

      if (s === 'talking') {
        this.talkPhase += 0.18;
        this.head.rotation.x += Math.sin(this.talkPhase) * 0.015;
        this.head.rotation.y += Math.sin(this.talkPhase * 0.5) * 0.01;
      }
    }

    // 3. Left & Right Arm rotations:
    const defaultLeftZ = this.isVRM ? -1.25 : 0;
    const defaultRightZ = this.isVRM ? 1.25 : 0;

    if (this.leftArm) {
      let targetLeftZ = defaultLeftZ;
      let targetLeftX = 0;

      if (this.animState === 'wave') {
        targetLeftZ = Math.PI * 0.7 + Math.sin(et * 6) * 0.22;
      } else if (this.animState === 'shrug') {
        targetLeftZ = defaultLeftZ + 0.25;
      } else if (this.animState === 'talking') {
        targetLeftZ = defaultLeftZ + Math.sin(et * 2) * 0.04;
      } else {
        targetLeftZ += Math.sin(et * 1.5) * 0.015;
      }

      this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, targetLeftZ, 0.08);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, targetLeftX, 0.08);
    }

    if (this.rightArm) {
      let targetRightZ = defaultRightZ;
      let targetRightX = 0;

      if (this.animState === 'thinking') {
        targetRightZ = -1.05;
        targetRightX = 0.4;
      } else if (this.animState === 'shrug') {
        targetRightZ = defaultRightZ - 0.25;
      } else if (this.animState === 'talking') {
        targetRightZ = defaultRightZ - 0.3 + Math.sin(et * 4) * 0.12;
        targetRightX = 0.2 + Math.cos(et * 4) * 0.06;
      } else {
        targetRightZ -= Math.sin(et * 1.5) * 0.015;
      }

      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, targetRightZ, 0.08);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, targetRightX, 0.08);
    }

    // 4. Lip Sync & Mouth articulators:
    if (this.faceMeshes.length > 0) {
      const isTalking = this.animState === 'talking';
      if (isTalking) {
        this.vowelTimer += dt;
        if (this.vowelTimer > this.nextVowelTime) {
          this.vowelTimer = 0;
          this.nextVowelTime = 0.08 + Math.random() * 0.08; // Variable syllable duration
          const speechVowels = ['A', 'A', 'I', 'U', 'E', 'O', 'O', 'silence'];
          this.currentVowel = speechVowels[Math.floor(Math.random() * speechVowels.length)];
        }
      } else {
        this.currentVowel = 'silence';
      }

      const vowels = ['A', 'I', 'U', 'E', 'O'];
      vowels.forEach(v => {
        const targetValue = (v === this.currentVowel) ? (v === 'A' || v === 'O' ? 0.85 : 0.55) : 0.0;
        const currentVal = this.currentInfluences[v] || 0;
        const newVal = THREE.MathUtils.lerp(currentVal, targetValue, 0.32);
        this.currentInfluences[v] = newVal;

        this.faceMeshes.forEach(mesh => {
          const meshMorphMap = this.morphMaps.get(mesh);
          if (meshMorphMap) {
            const idx = meshMorphMap[v];
            if (idx !== undefined && mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[idx] = newVal;
            }
          }
        });
      });
    }

    if (this.proceduralMouth) {
      const isTalking = this.animState === 'talking';
      // Syllabic envelope: combine low and high frequencies to mimic natural talking pacing
      const targetScaleY = isTalking ? (0.6 + Math.abs(Math.sin(et * 8)) * 1.2 + Math.sin(et * 19) * 0.4) : 0.1;
      this.proceduralMouth.scale.y = THREE.MathUtils.lerp(this.proceduralMouth.scale.y, targetScaleY, 0.3);
    }

    this.renderer.render(this.scene,this.camera);
  }

  resize(w:number,h:number){
    if (!this.camera || !this.renderer) return;
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }
  dispose(){
    this.disposed=true;
    if(this.raf) cancelAnimationFrame(this.raf);
    if(this.renderer) this.renderer.dispose();
  }
}

interface CareerProfile {
  ats_score?: number; trust_score?: number; career_dna_score?: number;
  mission_streak?: number; weak_areas?: string[]; [key: string]: unknown;
}
interface MLRec { content_type: string; type: string; label: string; icon: string; relevance: number; }
interface Props {
  userId?: string;
  careerProfile?: CareerProfile;
  teacherId?: string;
  minimized?: boolean;
  setMinimized?: (m: boolean) => void;
  showSpeechBubble?: boolean;
  setShowSpeechBubble?: (s: boolean) => void;
  onboardingStep?: number;
  setOnboardingStep?: (s: number) => void;
  activeQuest?: any;
  onlyAvatar?: boolean;
  speaking?: boolean;
  speechText?: string;
  onTabShift?: (path: string) => void;
  onEnlarge?: (enlarged: boolean) => void;
  isEnlarged?: boolean;
}




// Autocorrelation Pitch Detector (YIN-based thresholding approach)
function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // Silent frame

  // Trim silent ends of the frame
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.002;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) > thres) { r1 = i; break; }
  }
  for (let i = SIZE - 1; i >= SIZE / 2; i--) {
    if (Math.abs(buffer[i]) > thres) { r2 = i; break; }
  }

  const buf = buffer.subarray(r1, r2);
  const len = buf.length;
  if (len < 256) return -1; // Not enough samples

  // Autocorrelation calculation
  const c = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  // Find peak
  let d = 0;
  while (d < len - 1 && c[d] > c[d + 1]) d++;
  
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < len; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  if (maxpos <= 0) return -1;

  const T0 = maxpos;
  const pitch = sampleRate / T0;
  
  if (pitch >= 75 && pitch <= 350) {
    return pitch;
  }
  return -1;
}

const TEACHER_CONFIG: Record<string, { name: string; color: string; emoji: string }> = {
  priya:  { name: 'Ms. Priya',  color: '#4f46e5', emoji: '👩‍💼' },
  aisha:  { name: 'Ms. Aisha',  color: '#7c3aed', emoji: '👩‍🏫' },
  rohan:  { name: 'Mr. Rohan',  color: '#0891b2', emoji: '👨‍💻' },
  vikram: { name: 'Mr. Vikram', color: '#059669', emoji: '👨‍⚖️' },
};

export default function AvatarMentorWidget({
  userId = 'guest',
  careerProfile,
  teacherId = 'priya',
  minimized,
  setMinimized,
  showSpeechBubble,
  setShowSpeechBubble,
  onboardingStep,
  setOnboardingStep,
  activeQuest,
  onlyAvatar = false,
  speaking: externalSpeaking,
  speechText,
  onTabShift,
  onEnlarge,
  isEnlarged = false,
}: Props) {
  const [input,          setInput]          = useState('');
  const [messages,       setMessages]       = useState<Array<{ role: string; content: string }>>([]);
  const [loading,        setLoading]        = useState(false);
  const [speaking,       setSpeaking]       = useState(false);
  const [localMinimized, setLocalMinimized] = useState(false);
  const [mlRecs,         setMlRecs]         = useState<MLRec[]>([]);
  const [voiceFreq,      setVoiceFreq]      = useState<number | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isConversing,   setIsConversing]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef  = useRef<AvatarScene | null>(null);
  const [aiState, setAiState] = useState<AnimState>('idle');

  const pitchHistoryRef = useRef<number[]>([]);
  const voiceFreqRef = useRef<number | null>(null);

  useEffect(() => {
    voiceFreqRef.current = voiceFreq;
  }, [voiceFreq]);

  // Sync voice print on load
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const saved = localStorage.getItem(`pinit_${userId}_voice_print_freq`);
      if (saved) {
        setVoiceFreq(parseFloat(saved));
      }
    }
  }, [userId]);

  // Single persistent background pitch tracker for speaker validation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let interval: any = null;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(s => {
        stream = s;
        const SpeechAudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new SpeechAudioContext();
        const source = audioCtx.createMediaStreamSource(s);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const dataArray = new Float32Array(analyser.fftSize);

        interval = setInterval(() => {
          if (!analyser || !audioCtx) return;
          analyser.getFloatTimeDomainData(dataArray);
          const p = detectPitch(dataArray, audioCtx.sampleRate);
          if (p > 70 && p < 350) {
            pitchHistoryRef.current.push(p);
            if (pitchHistoryRef.current.length > 25) {
              pitchHistoryRef.current.shift(); // keep sliding window of last 2.5 seconds
            }
          }
        }, 100);
      })
      .catch(err => {
        console.warn("Background microphone pitch tracking failed to start:", err);
      });

    return () => {
      if (interval) clearInterval(interval);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, []);

  const startVoiceRegistration = async () => {
    if (typeof window === 'undefined') return;
    setIsRecordingVoice(true);
    toast.info("Voice Registration Started 🎙️", "Please speak clearly for 2.5 seconds...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      const pitches: number[] = [];

      const interval = setInterval(() => {
        analyser.getFloatTimeDomainData(dataArray);
        const pitch = detectPitch(dataArray, audioCtx.sampleRate);
        if (pitch > 0) {
          pitches.push(pitch);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();
        setIsRecordingVoice(false);

        const validPitches = pitches.filter(p => p > 70 && p < 350);
        if (validPitches.length > 0) {
          // Sort and slice out top and bottom 20% to remove outliers
          const sorted = [...validPitches].sort((a, b) => a - b);
          const startIdx = Math.floor(sorted.length * 0.2);
          const endIdx = Math.ceil(sorted.length * 0.8);
          const corePitches = sorted.slice(startIdx, endIdx);
          
          const finalPitches = corePitches.length > 0 ? corePitches : validPitches;
          const avg = finalPitches.reduce((a, b) => a + b, 0) / finalPitches.length;
          const rounded = Math.round(avg);
          localStorage.setItem(`pinit_${userId}_voice_print_freq`, rounded.toString());
          setVoiceFreq(rounded);
          toast.success("Voice Signature Registered! 🔐", `Owner voice print locked at ${rounded}Hz.`);
          speakReply(`Voice print registered successfully at ${rounded} Hertz! Voice command lock is now active.`);
        } else {
          toast.error("Registration Failed", "No clear voice pitch detected. Please try again in a quiet room.");
        }
      }, 2500);

    } catch (err) {
      console.warn("Failed voice registration:", err);
      toast.error("Microphone Error", "Could not access microphone for voice registration.");
      setIsRecordingVoice(false);
    }
  };

  // Voice recognition & Subtitle states

  const [recognizing, setRecognizing] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [subtitleRole, setSubtitleRole] = useState<'user' | 'assistant' | 'system' | null>(null);
  const recognitionRef = useRef<any>(null);

  const isMinimized = minimized !== undefined ? minimized : localMinimized;
  const setIsMinimized = setMinimized !== undefined ? setMinimized : setLocalMinimized;

  // Initialize 3D Viewport on mount and reload when teacherId changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new AvatarScene();
    sceneRef.current = scene;
    try {
      scene.init(canvasRef.current, teacherId);
      scene.setState('wave');
    } catch (e) {
      console.warn("Failed to initialize WebGL avatar scene:", e);
    }
    const timer = setTimeout(() => {
      try {
        scene.setState('idle');
      } catch {}
    }, 2800);
    
    const ro = new ResizeObserver(e => {
      const el = e[0];
      if (el) scene.resize(el.contentRect.width, el.contentRect.height);
    });
    ro.observe(canvasRef.current);
    
    return () => {
      clearTimeout(timer);
      ro.disconnect();
      scene.dispose();
    };
  }, [teacherId, isMinimized]);

  // Sync AI state animations
  useEffect(() => {
    sceneRef.current?.setState(aiState);
  }, [aiState]);

  // Drive AI state animation from chat lifecycle
  useEffect(() => {
    if (loading) {
      setAiState('thinking');
    } else if (speaking) {
      setAiState('talking');
    } else {
      setAiState('idle');
    }
  }, [loading, speaking]);

  // Sync speaking state from props if provided
  useEffect(() => {
    if (externalSpeaking !== undefined) {
      setSpeaking(externalSpeaking);
    }
  }, [externalSpeaking]);

  // Silence speech on minimize
  useEffect(() => {
    if (isMinimized) {
      stopSpeaking();
      setSpeaking(false);
    }
  }, [isMinimized]);

  const memory    = usePersonalAvatarMemory(userId);
  const emotionAI = useFacialEmotionDetection();
  const teacher   = TEACHER_CONFIG[teacherId] || TEACHER_CONFIG.priya;

  // Load avatar context + ML recommendations on mount
  useEffect(() => {
    if (userId === 'guest') return;
    fetch('/api/avatar/context', { credentials: 'include' })
      .then(r => r.json())
      .then(({ avatarMemory, mlRecommendations }) => {
        if (avatarMemory?.conversationHistory?.length) memory.importMemory(avatarMemory);
        if (mlRecommendations?.length) setMlRecs(mlRecommendations);
      })
      .catch(() => {});
  }, [userId]);

  // Sync career profile to avatar memory
  useEffect(() => {
    if (!careerProfile || userId === 'guest') return;
    memory.storePersonalInfo({
      name: userId, goals: [`Improve Career Score from ${careerProfile.ats_score||0} to 80+`],
      occupation: 'student', interests: careerProfile.weak_areas||[],
      preferences: { atsScore: careerProfile.ats_score, trustScore: careerProfile.trust_score, dnaScore: careerProfile.career_dna_score, streak: careerProfile.mission_streak, teacherId },
    });
    fetch('/api/avatar/memory', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory.exportMemory()), credentials: 'include',
    }).catch(() => {});
  }, [careerProfile, userId, teacherId]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Greeting on mount
  useEffect(() => {
    if (messages.length > 0) return;
    if (activeQuest) {
      const g = `Hello! I am ${teacher.name}, your mentor for this quest: "${activeQuest.title}". We will cover: ${activeQuest.desc}. What questions do you have about this topic?`;
      setMessages([{ role: 'assistant', content: g }]);
    } else if (careerProfile) {
      const score  = careerProfile?.ats_score||0;
      const streak = careerProfile?.mission_streak||0;
      const g = score < 50
        ? `Hi! I'm ${teacher.name}. Your Career Score is ${score}/100 — let's build it together. What shall we work on?`
        : `Welcome back! Score ${score}/100 · 🔥 ${streak}-day streak. How can I help today?`;
      setMessages([{ role: 'assistant', content: g }]);
    }
  }, [careerProfile, activeQuest, teacher.name]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Build ML-powered quick prompts
  const quickPrompts = [
    `📊 How do I improve my Career Score from ${careerProfile?.ats_score||0}?`,
    '🎯 What missions should I do today?',
    '📚 What should I study next?',
    '💼 Am I ready for job interviews?',
    ...mlRecs.slice(0,2).map(r => `${r.icon} Show me ${r.label.toLowerCase()} options`),
  ].slice(0, 5);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setMessages(prev => {
      // Limit local chat memory length
      if (prev.length > 50) return prev.slice(prev.length - 50);
      return prev;
    });
    setSubtitle(msg);
    setSubtitleRole('user');

    // ── Client-side navigation & conversational command parser ──
    const lower = msg.toLowerCase();

    // 1. Exit conversational mode check
    if (isConversing && (lower.includes('bye') || lower.includes('goodbye') || lower.includes('stop talking') || lower.includes('minimize') || lower.includes('close'))) {
      setIsConversing(false);
      if (onEnlarge) onEnlarge(false);
      const exitReply = `Goodbye! Let me know whenever you want to talk again.`;
      setMessages(prev => [...prev, { role: 'assistant', content: exitReply }]);
      await speakReply(exitReply);
      return;
    }

    // 2. Priority check check
    if (lower.includes('priority') || lower.includes('what to do') || lower.includes('preyourrity') || lower.includes('preyourity')) {
      const recommendation = (() => {
        const streak = careerProfile?.mission_streak || 0;
        const trust = careerProfile?.trust_score || 0;
        const vault = careerProfile?.vault_count || 0;

        if (streak === 0) {
          return {
            title: "Start your daily mission streak",
            desc: "Complete one mission today to start building your streak, which directly raises your Career DNA score.",
            targetPath: "/missions",
            tab: "Missions"
          };
        }
        if (trust < 50) {
          return {
            title: "Build your Trust Score",
            desc: "Verify a skill or add a document to your vault to make your profile visible to active SDE recruiters.",
            targetPath: "/vault",
            tab: "Vault"
          };
        }
        if (vault === 0) {
          return {
            title: "Add your first vault document",
            desc: "Upload certifications or project proof to verify your skills and raise your trust index.",
            targetPath: "/vault",
            tab: "Vault"
          };
        }
        return {
          title: "Maintain your daily streak",
          desc: "Today's missions are ready. Complete a challenge to build your consistency metric.",
          targetPath: "/missions",
          tab: "Missions"
        };
      })();

      const reply = `Your top career priority right now is to ${recommendation.title}. ${recommendation.desc} Shifting you to the ${recommendation.tab} tab now.`;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      await speakReply(reply);
      if (onTabShift) {
        setTimeout(() => {
          onTabShift(recommendation.targetPath);
        }, 1200);
      }
      return;
    }

    // 3. Start Quest / Start Mission check
    if (lower.includes('start mission') || lower.includes('begin mission') || lower.includes('play mission')) {
      const reply = "Sure, starting your daily boardroom crisis roleplay mission now! Loading Socratic simulation.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      await speakReply(reply);
      if (onTabShift) {
        setTimeout(() => {
          onTabShift('/missions?roleplay=true');
        }, 800);
      }
      return;
    }

    if (lower.includes('start quest') || lower.includes('begin quest') || lower.includes('play quest')) {
      const reply = "Sure! Opening your custom quest learning roadmap now. Select a quest module to begin.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      await speakReply(reply);
      if (onTabShift) {
        setTimeout(() => {
          onTabShift('/quests');
        }, 800);
      }
      return;
    }

    // 4. Conversational talk mode check
    if (lower.includes('talk with u') || lower.includes('want to talk') || lower.includes('chat with u') || lower.includes('talk to you')) {
      setIsConversing(true);
      if (onEnlarge) onEnlarge(true);
      const talkReply = `Yes, I am here! What do you want to talk about? Let me help you prepare for SDE roleplays, or brainstorm your next system design concepts. Just speak up, I am listening!`;
      setMessages(prev => [...prev, { role: 'assistant', content: talkReply }]);
      await speakReply(talkReply);
      return;
    }

    const isNavigation = 
      lower.includes('shift') || 
      lower.includes('switch') || 
      lower.includes('swap') || 
      lower.includes('go to') || 
      lower.includes('navigate') || 
      lower.includes('open') || 
      lower.includes('show');

    if (isNavigation) {
      let targetPath = '';
      let tabName = '';

      if (lower.includes('home') || lower.includes('dashboard')) {
        targetPath = '/dashboard';
        tabName = 'Home Dashboard';
      } else if (lower.includes('career-builder') || lower.includes('builder') || lower.includes('roadmap') || lower.includes('resume')) {
        targetPath = '/career-builder';
        tabName = 'Career Builder';
      } else if (lower.includes('quest') || lower.includes('learn')) {
        targetPath = '/quests';
        tabName = 'Quests';
      } else if (lower.includes('mission') || lower.includes('daily')) {
        targetPath = '/missions';
        tabName = 'Daily Missions';
      } else if (lower.includes('interview') || lower.includes('mock')) {
        targetPath = '/interview';
        tabName = 'AI Interview';
      } else if (lower.includes('twin')) {
        targetPath = '/career-twin';
        tabName = 'Career Twin';
      } else if (lower.includes('dna')) {
        targetPath = '/career-dna';
        tabName = 'Career DNA';
      } else if (lower.includes('opportunit') || lower.includes('job')) {
        targetPath = '/opportunities';
        tabName = 'Opportunities';
      } else if (lower.includes('discussion') || lower.includes('boardroom') || lower.includes('debate')) {
        targetPath = '/group-discussion';
        tabName = 'Group Discussion';
      } else if (lower.includes('vault') || lower.includes('document')) {
        targetPath = '/vault';
        tabName = 'Vault';
      } else if (lower.includes('pricing') || lower.includes('plan') || lower.includes('pin')) {
        targetPath = '/pricing';
        tabName = 'Pins & Plans';
      } else if (lower.includes('profile') || lower.includes('settings')) {
        targetPath = '/profile';
        tabName = 'Profile';
      } else if (lower.includes('notification')) {
        targetPath = '/notifications';
        tabName = 'Notifications';
      }

      if (targetPath) {
        const confirmation = `Sure! Shifting you to the ${tabName} tab now.`;
        setMessages(prev => [...prev, { role: 'assistant', content: confirmation }]);
        await speakReply(confirmation);
        if (onTabShift) {
          setTimeout(() => {
            onTabShift(targetPath);
          }, 800);
        }
        return; // Complete local intercept, bypass server call
      }
    }


    setLoading(true);

    const emotionalCtx = emotionAI.getEmotionalContext(msg);
    const historyForAPI = memory.getConversationContext(10)
      .map((c: { userMessage?: string; avatarResponse?: string; role?: string; content?: string }) =>
        c.userMessage
          ? [{ role:'user', content:c.userMessage }, { role:'assistant', content:c.avatarResponse }]
          : [{ role:c.role, content:c.content }]
      ).flat().filter((m: {content?:string}) => m.content);

    try {
      const res = await fetch('/api/avatar/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: msg,
          history: historyForAPI,
          teacherId,
          careerContext: { ...careerProfile, activeQuest }
        }),
      });
      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      memory.storeConversation(msg, reply, { emotion: emotionalCtx.detectedEmotion, engagement: 0.8 });
      await speakReply(reply);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, careerProfile, teacherId, memory, emotionAI, onTabShift]);


  async function speakReply(text: string) {
    setSubtitle(text);
    setSubtitleRole('assistant');
    speakWithAvatar(
      text,
      teacherId,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );
  }

  // Keep track of latest speaking/loading states in refs to avoid stale closures in SpeechRecognition handlers
  const speakingRef = useRef(speaking);
  const loadingRef = useRef(loading);
  const conversingRef = useRef(isConversing);
  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    conversingRef.current = isConversing;
  }, [isConversing]);


  // Background Speech Recognition for Wake Words with Echo Gate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Echo Gate: Disable speech recognition while AI is speaking or loading to prevent feedback loops
    if (speaking || loading) {
      setRecognizing(false);
      return;
    }

    let recognition: any = null;
    let shouldListen = true;

    const startListening = () => {
      if (!shouldListen) return;
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        // Auto-match browser locale for native accent accuracy (e.g., en-IN, en-US, en-GB)
        recognition.lang = navigator.language || 'en-US';

        // Grammar List: weight recognition probabilities for critical vocabulary
        const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
        if (SpeechGrammarList) {
          const speechRecognitionList = new SpeechGrammarList();
          const vocab = ['priya', 'kashyap', 'karthic', 'maya', 'divya', 'sentinel', 'pinit', 'socratic', 'verify', 'exam'];
          const grammar = '#JSGF V1.0; grammar vocab; public <word> = ' + vocab.join(' | ') + ' ;';
          speechRecognitionList.addFromString(grammar, 1);
          recognition.grammars = speechRecognitionList;
        }

        recognition.onstart = () => {
          setRecognizing(true);
        };

        recognition.onresult = (e: any) => {
          // Double guard against AI voice capture
          if (speakingRef.current || loadingRef.current) return;

          const transcript = e.results[0]?.[0]?.transcript;
          if (!transcript) return;

          // ── Owner Voice Signature Lock Check ──
          if (voiceFreqRef.current) {
            const validPitches = pitchHistoryRef.current.slice(-12);
            if (validPitches.length > 0) {
              const sorted = [...validPitches].sort((a, b) => a - b);
              const startIdx = Math.floor(sorted.length * 0.2);
              const endIdx = Math.ceil(sorted.length * 0.8);
              const corePitches = sorted.slice(startIdx, endIdx);
              const finalPitches = corePitches.length > 0 ? corePitches : validPitches;
              const avgPitch = finalPitches.reduce((a, b) => a + b, 0) / finalPitches.length;
              const diff = Math.abs(avgPitch - voiceFreqRef.current) / voiceFreqRef.current;
              console.log(`[Voice Lock] Stored: ${voiceFreqRef.current}Hz | trim avg: ${avgPitch.toFixed(1)}Hz | Diff: ${(diff * 100).toFixed(1)}%`);

              if (diff > 0.30) {
                console.warn("[Voice Lock] Voice mismatch.");
                toast.error("Voice Lock Refused 🔐", "Speaker signature mismatch. Command ignored.");
                speakReply("Voice signature mismatch. I can only follow commands from my registered owner.");
                return;
              }
            } else {
              toast.error("Verification Timed Out 🔐", "Please speak clearly closer to your microphone.");
              speakReply("Sorry, I could not verify your voice signature. Please try again.");
              return;
            }
          }

          const text = transcript.trim().toLowerCase();
          const activeTeacherKey = teacherId.toLowerCase();
          
          // If we are in active conversation mode, send everything directly without requiring the wake word
          if (conversingRef.current) {
            console.log("[Conversing] Direct speech parsed:", transcript);
            sendMessage(transcript);
            return;
          }

          // Fuzzy phoneme matching for teacher names and default wake word (Priya)
          const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
          const fuzzyMatchPriya = /\b(priya|preya|pria|prea|freeya|freya|riya)\b/i.test(cleanText);
          const fuzzyMatchKashyap = /\b(kashyap|kash|cash\s*up|catch\s*up|ketchup)\b/i.test(cleanText);
          const fuzzyMatchKarthic = /\b(karthic|karthik|kartik|nega|negga)\b/i.test(cleanText);
          const fuzzyMatchMaya = /\b(maya|maia|mya)\b/i.test(cleanText);
          const fuzzyMatchDivya = /\b(divya|divia)\b/i.test(cleanText);

          let matchedWakeWord = false;
          let matchedTeacherKey = '';
          
          if (fuzzyMatchPriya) {
            matchedWakeWord = true;
            matchedTeacherKey = 'priya';
          } else if (fuzzyMatchKashyap) {
            matchedWakeWord = true;
            matchedTeacherKey = 'kashyap';
          } else if (fuzzyMatchKarthic) {
            matchedWakeWord = true;
            matchedTeacherKey = 'karthic';
          } else if (fuzzyMatchMaya) {
            matchedWakeWord = true;
            matchedTeacherKey = 'maya';
          } else if (fuzzyMatchDivya) {
            matchedWakeWord = true;
            matchedTeacherKey = 'divya';
          }

          if (matchedWakeWord) {
            console.log("Fuzzy wake word detected:", transcript, "Matched teacher:", matchedTeacherKey);
            setIsMinimized(false);

            // Strip fuzzy wake word prefixes cleanly from query
            const cleaned = transcript
              .replace(/\b(hey|hi|hello)\b/gi, '')
              .replace(new RegExp(`\\b(${matchedTeacherKey}|priya|preya|pria|prea|freeya|freya|riya|kashyap|kash|cash\\s*up|catch\\s*up|ketchup|karthic|karthik|kartik|nega|negga|maya|maia|mya|divya|divia)\\b`, 'gi'), '')
              .trim();

            if (cleaned.length > 0) {
              sendMessage(cleaned);
            } else {
              const greeting = `Yes, I am listening! How can I help you today?`;
              setMessages(prev => [...prev, { role: 'assistant', content: greeting }]);
              speakReply(greeting);
            }
          }
        };

        recognition.onerror = (err: any) => {
          if (err.error === 'not-allowed') {
            console.warn("Speech recognition access denied.");
            shouldListen = false;
          }
        };

        recognition.onend = () => {
          setRecognizing(false);
          if (shouldListen) {
            setTimeout(startListening, 300);
          }
        };

        recognition.start();
      } catch (err) {
        console.error("Speech recognition startup error:", err);
      }
    };

    startListening();

    return () => {
      shouldListen = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [teacherId, setIsMinimized, sendMessage, speaking, loading]);

  // Auto-close (minimize) timer when not responding/speaking
  useEffect(() => {
    if (onlyAvatar) return;
    if (minimized === false) return;
    // If minimized, do nothing
    if (isMinimized) return;

    // If AI is currently loading or speaking, do not close, and clear any timer
    if (loading || speaking) return;

    // If the user has typed something, don't close
    if (input.trim().length > 0) return;

    // Otherwise, set a timeout to close/minimize the widget after 8 seconds of silence/inactivity
    console.log("Starting auto-close timer...");
    const timer = setTimeout(() => {
      console.log("Auto-close timer expired. Minimizing widget.");
      setIsMinimized(true);
    }, 8000); // 8 seconds of inactivity

    return () => {
      clearTimeout(timer);
    };
  }, [loading, speaking, isMinimized, input, setIsMinimized, onlyAvatar]);

  if (isMinimized && !onlyAvatar) {
    return (
      <button 
        onClick={() => setIsMinimized(false)} 
        style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:100,
          width:58, height:58, borderRadius:'50%',
          background: teacher.color, border:'none', cursor:'pointer',
          fontSize:26, boxShadow:`0 4px 20px ${teacher.color}60`,
          display:'flex', alignItems:'center', justifyContent:'center',
          opacity: 0.75,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateX(-50%) scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; }}
        title={`Open ${teacher.name}`}
      >
        {teacher.emoji}
      </button>
    );
  }

  const renderChatPanel = (
    <div style={{ flex: isEnlarged ? 1.4 : 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
      {/* Messages List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 8,
                maxWidth: '85%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {!isUser && (
                <span style={{ fontSize: 20, marginTop: 4, flexShrink: 0 }}>
                  {teacher.emoji}
                </span>
              )}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  background: isUser ? teacher.color : 'var(--bg3)',
                  color: isUser ? '#ffffff' : 'var(--t1)',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', alignItems: 'center', color: 'var(--t3)', fontSize: 12, paddingLeft: 28 }}>
            <span>{teacher.emoji}</span>
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 16px', display: 'flex', gap: 4, alignItems: 'center'
            }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)', animation: 'pulse 1.2s infinite ease-in-out' }}></span>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)', animation: 'pulse 1.2s infinite ease-in-out 0.2s' }}></span>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)', animation: 'pulse 1.2s infinite ease-in-out 0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Suggestion Prompts */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        overflowX: 'auto',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg3)',
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {quickPrompts.map((promptText, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              const cleanedText = promptText.replace(/^[^a-zA-Z0-9]+/, '').trim();
              sendMessage(cleanedText);
            }}
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: 'var(--bg2)',
              color: 'var(--t2)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            className="quick-prompt-pill"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        style={{
          display: 'flex',
          gap: 8,
          padding: 10,
          borderTop: '1px solid var(--border)',
          background: 'var(--bg2)',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${teacher.name} a question...`}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'var(--bg3)',
            color: 'var(--t1)',
            fontSize: 12.5,
            outline: 'none',
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? teacher.color : 'var(--bg3)',
            color: input.trim() && !loading ? '#ffffff' : 'var(--t3)',
            border: 'none',
            borderRadius: '50%',
            width: 34,
            height: 34,
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s',
            boxShadow: input.trim() && !loading ? `0 2px 8px ${teacher.color}40` : 'none',
          }}
        >
          ➔
        </button>
      </form>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .quick-prompt-pill:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          background: var(--accent-light) !important;
        }
      `}</style>
    </div>
  );

  if (onlyAvatar) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {aiState !== 'idle' && (
          <div style={{
            position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
            padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)',
            color: aiState === 'talking' ? '#a5b4fc' : aiState === 'thinking' ? '#fde68a' : '#86efac',
            backdropFilter: 'blur(4px)', fontFamily: 'var(--font-mono)', zIndex: 10
          }}>
            {aiState === 'talking' ? '🎙 Speaking' : aiState === 'thinking' ? '💭 Thinking' : aiState === 'listening' ? '👂 Listening' : aiState === 'wave' ? '👋 Hi there' : '✓ Active'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="avatar-mentor-widget" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg2)' }}>
      {/* Header */}
      <div className="mentor-header" style={{ background: `linear-gradient(135deg, ${teacher.color}, ${teacher.color}cc)`, flexShrink: 0, padding: '12px 16px' }}>
        <div className="mentor-info">
          <span className="mentor-emoji" style={{ fontSize: '28px', marginRight: '4px' }}>{teacher.emoji}</span>
          <div>
            <p className="mentor-name" style={{ fontSize: '14px' }}>{teacher.name}</p>
            <p className="mentor-subtitle" style={{ fontSize: '10.5px' }}>Career Mentor {speaking ? '🔊' : ''} · {mlRecs.length > 0 ? `${mlRecs.length} ML tips` : 'AI powered'}</p>
          </div>
        </div>
        <div className="mentor-controls" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {voiceFreq ? (
            <span 
              onClick={() => {
                if (confirm("Reset voice lock signature?")) {
                  localStorage.removeItem(`pinit_${userId}_voice_print_freq`);
                  setVoiceFreq(null);
                  toast.info("Voice Lock Reset", "Owner voice lock is now disabled.");
                }
              }}
              style={{ fontSize: 9, background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: 4, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              title="Voice lock active. Click to reset."
            >
              🔐 Voice Lock
            </span>
          ) : (
            <span 
              onClick={startVoiceRegistration}
              style={{ fontSize: 9, background: isRecordingVoice ? 'var(--coral)' : 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              title="Click to register your voice print signature"
            >
              {isRecordingVoice ? '🎙️ Speaking...' : '🎙️ Register Voice'}
            </span>
          )}
          <button onClick={() => setIsMinimized(true)} className="minimize-btn" title="Minimize">_</button>
        </div>
      </div>

      {isEnlarged ? (
        /* Horizontal Split Pane for Enlarged View */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          {/* Left Column: Avatar Canvas */}
          <div style={{ position: 'relative', flex: 1.1, background: 'var(--bg3)', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            {aiState !== 'idle' && (
              <div style={{
                position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
                padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)',
                color: aiState === 'talking' ? '#a5b4fc' : aiState === 'thinking' ? '#fde68a' : '#86efac',
                backdropFilter: 'blur(4px)', fontFamily: 'var(--font-mono)'
              }}>
                {aiState === 'talking' ? '🎙 Speaking' : aiState === 'thinking' ? '💭 Thinking' : aiState === 'listening' ? '👂 Listening' : aiState === 'wave' ? '👋 Hi there' : '✓ Active'}
              </div>
            )}
          </div>

          {/* Right Column: Chat Panel */}
          {renderChatPanel}
        </div>
      ) : (
        /* Vertical Stack Pane for Default/Docked View */
        <>
          {/* 3D WebGL Avatar Viewport - top */}
          <div style={{ position: 'relative', height: 200, background: 'var(--bg3)', overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            {aiState !== 'idle' && (
              <div style={{
                position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
                padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)',
                color: aiState === 'talking' ? '#a5b4fc' : aiState === 'thinking' ? '#fde68a' : '#86efac',
                backdropFilter: 'blur(4px)', fontFamily: 'var(--font-mono)'
              }}>
                {aiState === 'talking' ? '🎙 Speaking' : aiState === 'thinking' ? '💭 Thinking' : aiState === 'listening' ? '👂 Listening' : aiState === 'wave' ? '👋 Hi there' : '✓ Active'}
              </div>
            )}
          </div>
          {/* Chat Panel - bottom */}
          {renderChatPanel}
        </>
      )}
    </div>
  );

}
