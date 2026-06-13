import { useState, useEffect, useRef, useCallback } from 'react';
import { usePersonalAvatarMemory }    from './hooks/usePersonalAvatarMemory';
import { useFacialEmotionDetection }  from './hooks/useFacialEmotionDetection';
import * as THREE from 'three';
import { speakWithAvatar, stopSpeaking } from '@/lib/tts';

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
    const loader=new GLTFLoader();
    
    // Choose model paths based on selected teacherId
    let paths: string[] = [];
    if (teacherId === 'rohan') {
      paths = ['/avatar/akira.vrm', '/avatar/riku.vrm', '/avatar/mentor.vrm'];
    } else if (teacherId === 'vikram') {
      paths = ['/avatar/riku.vrm', '/avatar/akira.vrm', '/avatar/mentor.vrm'];
    } else if (teacherId === 'aisha') {
      paths = ['/avatar/aisha.vrm', '/avatar/mentor.vrm', '/avatar/akira.vrm', '/avatar/riku.vrm'];
    } else {
      paths = ['/avatar/priya.vrm', '/avatar/mentor.vrm', '/avatar/akira.vrm', '/avatar/riku.vrm'];
    }

    const loadAttempt = (idx: number): Promise<void> => {
      if (idx >= paths.length) return Promise.reject(new Error("No VRMs found"));
      return new Promise<void>((resolve, reject) => {
        loader.load(paths[idx], gltf => {
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
        this.head.rotation.y = Math.sin(et * 0.3) * 0.06;
        this.head.rotation.x = Math.sin(et * 0.2) * 0.03 + 0.02;
        this.head.rotation.z = Math.sin(et * 0.15) * 0.02;
        if (this.neck) {
          this.neck.rotation.y = Math.sin(et * 0.3) * 0.02;
        }
      } else if (s === 'nod') {
        this.head.rotation.x = Math.sin(this.animT * 6.5) * 0.16 + 0.02;
        this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.1);
        this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.1);
      } else if (s === 'thinking') {
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.05, 0.08);
        this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0.12, 0.08);
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
        if (this.vowelTimer > 0.11) {
          this.vowelTimer = 0;
          const vowels = ['A', 'I', 'U', 'E', 'O', 'silence', 'silence'];
          this.currentVowel = vowels[Math.floor(Math.random() * vowels.length)];
        }
      } else {
        this.currentVowel = 'silence';
      }

      const vowels = ['A', 'I', 'U', 'E', 'O'];
      vowels.forEach(v => {
        const targetValue = (v === this.currentVowel) ? (v === 'A' || v === 'O' ? 0.8 : 0.5) : 0.0;
        const currentVal = this.currentInfluences[v] || 0;
        const newVal = THREE.MathUtils.lerp(currentVal, targetValue, 0.28);
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
      const targetScaleY = isTalking ? 1.2 + Math.sin(et * 16) * 1.0 : 0.1;
      this.proceduralMouth.scale.y = THREE.MathUtils.lerp(this.proceduralMouth.scale.y, targetScaleY, 0.25);
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
}: Props) {
  const [input,          setInput]          = useState('');
  const [messages,       setMessages]       = useState<Array<{ role: string; content: string }>>([]);
  const [loading,        setLoading]        = useState(false);
  const [speaking,       setSpeaking]       = useState(false);
  const [localMinimized, setLocalMinimized] = useState(false);
  const [mlRecs,         setMlRecs]         = useState<MLRec[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef  = useRef<AvatarScene | null>(null);
  const [aiState, setAiState] = useState<AnimState>('idle');

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
      name: userId, goals: [`Improve ATS score from ${careerProfile.ats_score||0} to 80+`],
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
        ? `Hi! I'm ${teacher.name}. Your ATS score is ${score}/100 — let's build it together. What shall we work on?`
        : `Welcome back! ATS ${score}/100 · 🔥 ${streak}-day streak. How can I help today?`;
      setMessages([{ role: 'assistant', content: g }]);
    }
  }, [careerProfile, activeQuest, teacher.name]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Build ML-powered quick prompts
  const quickPrompts = [
    `📊 How do I improve my ATS from ${careerProfile?.ats_score||0}?`,
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
  }, [input, loading, careerProfile, teacherId, memory, emotionAI]);

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
  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Background Speech Recognition for Wake Words
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;
    let shouldListen = true;

    const startListening = () => {
      if (!shouldListen) return;
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // single-shot restarted onend is more cross-browser robust
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setRecognizing(true);
        };

        recognition.onresult = (e: any) => {
          // Prevent the avatar's own voice from triggering if speaking or loading
          if (speakingRef.current || loadingRef.current) {
            console.log("Speech recognition ignored: AI is speaking or loading.");
            return;
          }

          const transcript = e.results[0]?.[0]?.transcript;
          if (!transcript) return;

          const text = transcript.trim().toLowerCase();
          const activeTeacherKey = teacherId.toLowerCase();
          
          // Match wake word: "priya", "hey priya", "hi priya" or active teacher names
          const matchesWakeWord = 
            text.includes('priya') || 
            text.includes(activeTeacherKey) ||
            text.includes('hey ' + activeTeacherKey) ||
            text.includes('hi ' + activeTeacherKey) ||
            text.includes('hey priya') ||
            text.includes('hi priya');

          if (matchesWakeWord) {
            console.log("Wake word detected:", transcript);
            
            // Maximize widget
            setIsMinimized(false);

            // Clean wake word prefix from query
            const wakeWordRegex = new RegExp(`^(hey\\s+priya|hi\\s+priya|priya|hey\\s+${activeTeacherKey}|hi\\s+${activeTeacherKey}|${activeTeacherKey})\\b\\s*,?\\s*`, 'i');
            const cleaned = transcript.replace(wakeWordRegex, '').trim();

            if (cleaned.length > 0) {
              // Send the query immediately
              sendMessage(cleaned);
            } else {
              // Just wake word, speak greeting
              const greeting = `Yes, I am listening! How can I help you today?`;
              setMessages(prev => [...prev, { role: 'assistant', content: greeting }]);
              speakReply(greeting);
            }
          }
        };

        recognition.onerror = (err: any) => {
          // Log but don't disrupt continuous restart loop (except if denied)
          if (err.error === 'not-allowed') {
            console.warn("Speech recognition access denied.");
            shouldListen = false;
          }
        };

        recognition.onend = () => {
          setRecognizing(false);
          if (shouldListen) {
            // Restart after short delay
            setTimeout(startListening, 400);
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
  }, [teacherId, setIsMinimized, sendMessage]);

  // Auto-close (minimize) timer when not responding/speaking
  useEffect(() => {
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
  }, [loading, speaking, isMinimized, input, setIsMinimized]);

  if (isMinimized) {
    return (
      <button onClick={() => setIsMinimized(false)} style={{
        position:'fixed', bottom:24, right:24, zIndex:100,
        width:58, height:58, borderRadius:'50%',
        background: teacher.color, border:'none', cursor:'pointer',
        fontSize:26, boxShadow:`0 4px 20px ${teacher.color}60`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }} title={`Open ${teacher.name}`}>
        {teacher.emoji}
      </button>
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
        <div className="mentor-controls" style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setIsMinimized(true)} className="minimize-btn" title="Minimize">_</button>
        </div>
      </div>

      {/* 3D WebGL Avatar Viewport - fixed height so there's plenty of space for chat */}
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

      {/* Socratic Chat Panel Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
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
      </div>

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
}
