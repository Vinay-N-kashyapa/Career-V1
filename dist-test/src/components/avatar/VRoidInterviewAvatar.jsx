'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VRoidInterviewAvatar;
const react_1 = require("react");
const THREE = __importStar(require("three"));
class AvatarScene {
    constructor() {
        this.animState = 'idle';
        this.animT = 0;
        this.talkPhase = 0;
        this.disposed = false;
        this.clock = new THREE.Clock();
        this.isVRM = false;
        this.morphMap = {};
        this.vowelTimer = 0;
        this.currentVowel = 'silence';
        this.currentInfluences = { A: 0, I: 0, U: 0, E: 0, O: 0 };
    }
    init(canvas, teacherId) {
        const w = canvas.clientWidth || 280;
        const h = canvas.clientHeight || 360;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(w, h, false);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.setClearColor(0x000000, 0);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(28, w / h, 0.01, 20);
        // Zoomed in closer for the interview view (Z = 1.6 instead of 2.8) to show details
        this.camera.position.set(0, 1.43, 1.6);
        this.camera.lookAt(0, 1.43, 0);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.set(1.5, 3, 2);
        this.scene.add(key);
        this.tryLoadVRM(teacherId).catch(() => this.buildProceduralAvatar());
        this.loop();
    }
    async tryLoadVRM(teacherId) {
        const { GLTFLoader } = await Promise.resolve().then(() => __importStar(require('three/examples/jsm/loaders/GLTFLoader.js')));
        const loader = new GLTFLoader();
        // Map teacherId to available VRM paths in order of preference
        let paths = [];
        if (teacherId === 'rohan') {
            paths = ['/avatar/akira.vrm', '/avatar/riku.vrm', '/avatar/mentor.vrm'];
        }
        else if (teacherId === 'vikram') {
            paths = ['/avatar/riku.vrm', '/avatar/akira.vrm', '/avatar/mentor.vrm'];
        }
        else if (teacherId === 'aisha') {
            paths = ['/avatar/aisha.vrm', '/avatar/mentor.vrm', '/avatar/akira.vrm', '/avatar/riku.vrm'];
        }
        else {
            paths = ['/avatar/priya.vrm', '/avatar/mentor.vrm', '/avatar/akira.vrm', '/avatar/riku.vrm'];
        }
        const loadAttempt = (idx) => {
            if (idx >= paths.length)
                return Promise.reject(new Error("No VRMs found"));
            return new Promise((resolve, reject) => {
                loader.load(paths[idx], gltf => {
                    this.scene.add(gltf.scene);
                    this.isVRM = true;
                    this.morphMap = {};
                    gltf.scene.traverse((obj) => {
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
                                if (hasMouth && (isFaceMeshName || !this.faceMesh)) {
                                    this.faceMesh = obj;
                                    console.log("VRoidInterviewAvatar: Face Mesh identified:", obj.name, keys);
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
                            if (nameLower.includes('left') || nameLower.includes('_l_') || nameLower.startsWith('l_') || nameLower.includes('bip_l')) {
                                this.leftShoulder = obj;
                            }
                            else if (nameLower.includes('right') || nameLower.includes('_r_') || nameLower.startsWith('r_') || nameLower.includes('bip_r')) {
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
                            if (nameLower.includes('left') || nameLower.includes('_l_') || nameLower.startsWith('l_') || nameLower.includes('bip_l')) {
                                this.leftArm = obj;
                            }
                            else if (nameLower.includes('right') || nameLower.includes('_r_') || nameLower.startsWith('r_') || nameLower.includes('bip_r')) {
                                this.rightArm = obj;
                            }
                        }
                    });
                    // Resolve morph indices for vowels A, I, U, E, O
                    if (this.faceMesh && this.faceMesh.morphTargetDictionary) {
                        const dict = this.faceMesh.morphTargetDictionary;
                        const vowels = ['A', 'I', 'U', 'E', 'O'];
                        vowels.forEach(v => {
                            const foundKey = Object.keys(dict).find(k => {
                                const kl = k.toLowerCase();
                                const isVowelMatch = (vowel) => {
                                    const vl = vowel.toLowerCase();
                                    if (kl === vl ||
                                        kl === `fcl_mth_${vl}` ||
                                        kl === `mouth_${vl}` ||
                                        kl.includes(`mouth_${vl}`) ||
                                        kl.includes(`mth_${vl}`) ||
                                        kl.endsWith(`_${vl}`) ||
                                        kl.endsWith(`.${vl}`) ||
                                        kl.includes(`blendshape.${vl}`) ||
                                        kl.includes(`preset.${vl}`)) {
                                        return true;
                                    }
                                    if (vowel === 'A' && (kl === 'あ' || kl === 'aa' || kl.includes('mouth_open') || kl.includes('mouthopen') || kl === 'open'))
                                        return true;
                                    if (vowel === 'I' && (kl === 'い' || kl === 'ih' || kl === 'ii'))
                                        return true;
                                    if (vowel === 'U' && (kl === 'う' || kl === 'ou' || kl === 'uu'))
                                        return true;
                                    if (vowel === 'E' && (kl === 'え' || kl === 'ee'))
                                        return true;
                                    if (vowel === 'O' && (kl === 'お' || kl === 'oh' || kl === 'oo'))
                                        return true;
                                    return false;
                                };
                                return isVowelMatch(v);
                            });
                            if (foundKey) {
                                this.morphMap[v] = dict[foundKey];
                                console.log(`VRoidInterviewAvatar: Mapped vowel ${v} to morph target index: ${dict[foundKey]} (key: "${foundKey}")`);
                            }
                            else {
                                console.warn(`VRoidInterviewAvatar: Could not map morph target for vowel ${v}`);
                            }
                        });
                    }
                    else {
                        console.warn("VRoidInterviewAvatar: No face mesh with morph target dictionary found!");
                    }
                    resolve();
                }, undefined, () => {
                    loadAttempt(idx + 1).then(resolve).catch(reject);
                });
            });
        };
        return loadAttempt(0);
    }
    buildProceduralAvatar() {
        this.isVRM = false;
        const g = new THREE.Group();
        const mat = (c, r = 0.4, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
        const SKIN = 0xf5c8a8, SHIRT = 0x4f5fa8, HAIR = 0x1a1008, PANT = 0x2c2c3e;
        const spine = new THREE.Group();
        spine.position.y = 1.22;
        this.spine = spine;
        g.add(spine);
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.36, 8, 12), mat(SHIRT, 0.7));
        torso.position.y = 0;
        spine.add(torso);
        const neck = new THREE.Group();
        neck.position.set(0, 0.24, 0);
        spine.add(neck);
        this.neck = neck;
        neck.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 12), mat(SKIN, 0.5)), { position: new THREE.Vector3(0, 0.06, 0) }));
        const head = new THREE.Group();
        head.position.y = 0.18;
        neck.add(head);
        this.head = head;
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 20), mat(SKIN, 0.45));
        skull.scale.set(1, 1.08, 0.97);
        head.add(skull);
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 20), mat(HAIR, 0.8));
        hair.position.y = 0.04;
        head.add(hair);
        [[-0.048, 0], [0.048, 0]].forEach(([x]) => {
            const ew = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), mat(0xffffff, 0.1));
            ew.position.set(x, 0.02, 0.114);
            head.add(ew);
            const ei = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), mat(0x3a5fc8, 0.3));
            ei.position.set(x, 0.02, 0.127);
            head.add(ei);
        });
        const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.05, 4, 8), mat(0x9b1c1c, 0.5));
        mouth.position.set(0, -0.04, 0.125);
        mouth.rotation.z = Math.PI / 2;
        head.add(mouth);
        this.proceduralMouth = mouth;
        [[-0.2, 0.18], [0.2, 0.18]].forEach(([x]) => {
            const sh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(SHIRT, 0.7));
            sh.position.set(x, 0, 0);
            spine.add(sh);
        });
        const makeArm = (side) => {
            const ag = new THREE.Group();
            ag.position.set(side * 0.2, 0.18, 0);
            spine.add(ag);
            if (side < 0)
                this.leftArm = ag;
            else
                this.rightArm = ag;
            const ua = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 6, 8), mat(SHIRT, 0.7));
            ua.position.set(side * 0.1, -0.14, 0);
            ua.rotation.z = side * -0.25;
            ag.add(ua);
        };
        makeArm(-1);
        makeArm(1);
        const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.06, 8, 10), mat(PANT, 0.8));
        pelvis.position.y = 1.01;
        g.add(pelvis);
        [[-0.08], [0.08]].forEach(([x]) => {
            const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.38, 6, 10), mat(PANT, 0.8));
            leg.position.set(x, 0.78, 0);
            g.add(leg);
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.18), mat(0x1a1a1a, 0.9));
            shoe.position.set(x, 0.55, 0.025);
            g.add(shoe);
        });
        this.scene.add(g);
    }
    setState(s) {
        if (this.animState === s)
            return;
        this.animState = s;
        this.animT = 0;
    }
    loop() {
        if (this.disposed)
            return;
        this.raf = requestAnimationFrame(() => this.loop());
        const dt = this.clock.getDelta();
        const et = this.clock.getElapsedTime();
        this.animT += dt;
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
        if (this.leftShoulder)
            this.leftShoulder.rotation.z = -breathingShoulderZ;
        if (this.rightShoulder)
            this.rightShoulder.rotation.z = breathingShoulderZ;
        // 2. Head & Neck look-around sways
        if (this.head) {
            const s = this.animState;
            if (s === 'idle') {
                this.head.rotation.y = Math.sin(et * 0.3) * 0.06;
                this.head.rotation.x = Math.sin(et * 0.2) * 0.03 + 0.02;
                this.head.rotation.z = Math.sin(et * 0.15) * 0.02;
                if (this.neck)
                    this.neck.rotation.y = Math.sin(et * 0.3) * 0.02;
            }
            else if (s === 'nod') {
                this.head.rotation.x = Math.sin(this.animT * 6.5) * 0.16 + 0.02;
                this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.1);
                this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.1);
            }
            else if (s === 'thinking') {
                this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.05, 0.08);
                this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0.12, 0.08);
                this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0.08, 0.08);
            }
            else if (s === 'shrug') {
                this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, -0.05, 0.08);
                this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.08);
                this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, 0.08);
            }
            else {
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
        // 3. Arm rotations
        const defaultLeftZ = this.isVRM ? -1.25 : 0;
        const defaultRightZ = this.isVRM ? 1.25 : 0;
        if (this.leftArm) {
            let targetLeftZ = defaultLeftZ;
            let targetLeftX = 0;
            if (this.animState === 'wave') {
                targetLeftZ = Math.PI * 0.7 + Math.sin(et * 6) * 0.22;
            }
            else if (this.animState === 'shrug') {
                targetLeftZ = defaultLeftZ + 0.25;
            }
            else if (this.animState === 'talking') {
                targetLeftZ = defaultLeftZ + Math.sin(et * 2) * 0.04;
            }
            else {
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
            }
            else if (this.animState === 'shrug') {
                targetRightZ = defaultRightZ - 0.25;
            }
            else if (this.animState === 'talking') {
                targetRightZ = defaultRightZ - 0.3 + Math.sin(et * 4) * 0.12;
                targetRightX = 0.2 + Math.cos(et * 4) * 0.06;
            }
            else {
                targetRightZ -= Math.sin(et * 1.5) * 0.015;
            }
            this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, targetRightZ, 0.08);
            this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, targetRightX, 0.08);
        }
        // 4. Lip Sync & Morph targets
        if (this.faceMesh) {
            const isTalking = this.animState === 'talking';
            if (isTalking) {
                this.vowelTimer += dt;
                if (this.vowelTimer > 0.11) {
                    this.vowelTimer = 0;
                    const vowels = ['A', 'I', 'U', 'E', 'O', 'silence', 'silence'];
                    this.currentVowel = vowels[Math.floor(Math.random() * vowels.length)];
                }
            }
            else {
                this.currentVowel = 'silence';
            }
            const vowels = ['A', 'I', 'U', 'E', 'O'];
            vowels.forEach(v => {
                const targetValue = (v === this.currentVowel) ? (v === 'A' || v === 'O' ? 0.8 : 0.5) : 0.0;
                const currentVal = this.currentInfluences[v] || 0;
                const newVal = THREE.MathUtils.lerp(currentVal, targetValue, 0.28);
                this.currentInfluences[v] = newVal;
                const idx = this.morphMap[v];
                if (idx !== undefined && this.faceMesh.morphTargetInfluences) {
                    this.faceMesh.morphTargetInfluences[idx] = newVal;
                }
            });
        }
        if (this.proceduralMouth) {
            const isTalking = this.animState === 'talking';
            const targetScaleY = isTalking ? 1.2 + Math.sin(et * 16) * 1.0 : 0.1;
            this.proceduralMouth.scale.y = THREE.MathUtils.lerp(this.proceduralMouth.scale.y, targetScaleY, 0.25);
        }
        this.renderer.render(this.scene, this.camera);
    }
    resize(w, h) {
        if (!this.camera || !this.renderer)
            return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
    }
    dispose() {
        this.disposed = true;
        if (this.raf)
            cancelAnimationFrame(this.raf);
        if (this.renderer)
            this.renderer.dispose();
    }
}
function VRoidInterviewAvatar({ teacherId = 'priya', animState = 'idle', zoom = 1.6 }) {
    const canvasRef = (0, react_1.useRef)(null);
    const sceneRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!canvasRef.current)
            return;
        const scene = new AvatarScene();
        sceneRef.current = scene;
        try {
            scene.init(canvasRef.current, teacherId);
            scene.setState(animState);
            if (scene.camera) {
                scene.camera.position.z = zoom;
            }
        }
        catch (e) {
            console.warn("Failed to initialize WebGL avatar scene:", e);
        }
        const ro = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry && sceneRef.current) {
                sceneRef.current.resize(entry.contentRect.width, entry.contentRect.height);
            }
        });
        ro.observe(canvasRef.current);
        return () => {
            ro.disconnect();
            scene.dispose();
        };
    }, [teacherId]);
    (0, react_1.useEffect)(() => {
        if (sceneRef.current) {
            sceneRef.current.setState(animState);
        }
    }, [animState]);
    (0, react_1.useEffect)(() => {
        if (sceneRef.current && sceneRef.current.camera) {
            sceneRef.current.camera.position.z = zoom;
        }
    }, [zoom]);
    return (<div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }}/>
    </div>);
}
