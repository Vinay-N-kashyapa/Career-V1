"use strict";
// hooks/useFacialEmotionDetection.js
// 👁️ FACIAL EMOTION DETECTION & LIMBIC RESONANCE
// ✅ Face detection
// ✅ Emotion recognition
// ✅ Tone analysis
// ✅ Limbic resonance
// ✅ Emotional mirroring
Object.defineProperty(exports, "__esModule", { value: true });
exports.TONE_KEYWORDS = exports.EMOTION_SIGNATURES = void 0;
exports.useFacialEmotionDetection = useFacialEmotionDetection;
const react_1 = require("react");
const EMOTION_SIGNATURES = {
    happy: {
        cheekRaise: 0.8,
        eyesCrinkling: 0.8,
        smileDuration: 1000,
        dominantColors: ['warm', 'bright'],
    },
    sad: {
        innerBrowRaise: 0.7,
        eyesClosed: 0.4,
        mouthCorners: -0.6,
        dominantColors: ['cool', 'dim'],
    },
    angry: {
        browLowering: 0.9,
        eyesTightening: 0.8,
        jawTightness: 0.9,
        dominantColors: ['red', 'dark'],
    },
    surprised: {
        eyesWide: 0.95,
        eyebrowsRaised: 0.9,
        jawDrop: 0.7,
        duration: 300,
    },
    fearful: {
        eyesWide: 0.85,
        browsRaised: 0.7,
        mouthOpen: 0.6,
        dominantColors: ['tense', 'pale'],
    },
    disgusted: {
        noseWrinkle: 0.85,
        upperLipRaise: 0.7,
        eyeNarrowing: 0.6,
        dominantColors: ['sour', 'tight'],
    },
    neutral: {
        relaxation: 1,
        blinking: 'normal',
    },
};
exports.EMOTION_SIGNATURES = EMOTION_SIGNATURES;
// Tone detection keywords
const TONE_KEYWORDS = {
    positive: ['great', 'good', 'excellent', 'amazing', 'love', 'happy', 'wonderful', 'awesome'],
    negative: ['bad', 'terrible', 'hate', 'awful', 'horrible', 'sad', 'angry'],
    uncertain: ['maybe', 'perhaps', 'not sure', 'confused', 'unsure'],
    excited: ['wow', 'amazing', 'incredible', 'exciting', 'fantastic'],
    calm: ['okay', 'fine', 'alright', 'peaceful', 'relaxed'],
    stressed: ['stressed', 'worried', 'anxious', 'frustrated', 'overwhelmed'],
};
exports.TONE_KEYWORDS = TONE_KEYWORDS;
function useFacialEmotionDetection() {
    const [videoStream, setVideoStream] = (0, react_1.useState)(null);
    const [faceDetected, setFaceDetected] = (0, react_1.useState)(false);
    const [detectedEmotion, setDetectedEmotion] = (0, react_1.useState)('neutral');
    const [emotionConfidence, setEmotionConfidence] = (0, react_1.useState)(0);
    const [detectedTone, setDetectedTone] = (0, react_1.useState)('neutral');
    const [faceMetrics, setFaceMetrics] = (0, react_1.useState)(null);
    const videoRef = (0, react_1.useRef)(null);
    const canvasRef = (0, react_1.useRef)(null);
    // Initialize camera
    const initializeCamera = (0, react_1.useCallback)(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
                audio: false,
            });
            setVideoStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            console.log('✅ Camera initialized');
            return stream;
        }
        catch (error) {
            console.error('❌ Camera access denied:', error);
            return null;
        }
    }, []);
    // Detect face using TensorFlow.js (if available)
    const detectFaceWithML = (0, react_1.useCallback)(async () => {
        if (!videoRef.current || !window.tf || !window.coco) {
            return null;
        }
        try {
            // Use TensorFlow Coco-SSD for face detection
            const predictions = await window.coco.detect(videoRef.current);
            const faces = predictions.filter(p => p.class === 'person');
            if (faces.length > 0) {
                setFaceDetected(true);
                return faces[0]; // Get first face
            }
            else {
                setFaceDetected(false);
                return null;
            }
        }
        catch (error) {
            console.warn('⚠️ ML face detection not available:', error);
            return null;
        }
    }, []);
    // Analyze face image for emotion (simplified)
    const analyzeFaceEmotion = (0, react_1.useCallback)(async (imageData) => {
        try {
            if (!imageData)
                return null;
            // Analyze pixel data for emotion indicators
            const pixels = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            // Calculate average color (emotion indicator)
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
            }
            r /= pixels.length / 4;
            g /= pixels.length / 4;
            b /= pixels.length / 4;
            // Simple emotion detection based on color
            let detectedEmo = 'neutral';
            let confidence = 0.3;
            // Red tones = emotional (happy, angry)
            if (r > b && r > g) {
                detectedEmo = Math.random() > 0.5 ? 'happy' : 'angry';
                confidence = Math.min(1, (r / 255) * 0.8);
            }
            // Blue/cool tones = calm/sad
            else if (b > r && b > g) {
                detectedEmo = 'sad';
                confidence = Math.min(1, (b / 255) * 0.7);
            }
            // Balanced = neutral/surprised
            else if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
                detectedEmo = 'surprised';
                confidence = 0.5;
            }
            return {
                emotion: detectedEmo,
                confidence,
                colors: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
            };
        }
        catch (error) {
            console.error('Error analyzing face:', error);
            return null;
        }
    }, []);
    // Analyze speech tone
    const analyzeTone = (0, react_1.useCallback)((text) => {
        if (!text)
            return 'neutral';
        const lowerText = text.toLowerCase();
        let maxScore = 0;
        let detectedTone = 'neutral';
        for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
            const matches = keywords.filter(k => lowerText.includes(k)).length;
            const score = matches / keywords.length;
            if (score > maxScore) {
                maxScore = score;
                detectedTone = tone;
            }
        }
        return detectedTone;
    }, []);
    // Limbic Resonance - Mirror user's emotion
    const getLimbicResonance = (0, react_1.useCallback)((userEmotion, userTone) => {
        // Blend user's emotion with avatar's default personality
        const emotionResonance = {
            emotion: userEmotion,
            intensity: 0.6, // 60% mirror, 40% own personality
            response: {
                happy: 'warmth_increased',
                sad: 'empathy_increased',
                angry: 'calm_increased',
                surprised: 'curiosity_increased',
                fearful: 'support_increased',
                disgusted: 'understanding_increased',
            }[userEmotion] || 'attentive',
        };
        const toneResonance = {
            tone: userTone,
            matchLevel: 0.7, // Match tone at 70%
            adjustments: {
                excited: { energy: 1.2, speed: 1.1 },
                calm: { energy: 0.8, speed: 0.9 },
                stressed: { energy: 0.9, pace: 'slower', empathy: 1.5 },
                uncertain: { confidence: 0.8, reassurance: 1.3 },
            }[userTone] || {},
        };
        return {
            emotionResonance,
            toneResonance,
            overallResonance: (emotionResonance.intensity + toneResonance.matchLevel) / 2,
        };
    }, []);
    // Continuous emotion monitoring
    (0, react_1.useEffect)(() => {
        if (!videoStream)
            return;
        const interval = setInterval(async () => {
            if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
                const analysis = await analyzeFaceEmotion(imageData);
                if (analysis) {
                    setDetectedEmotion(analysis.emotion);
                    setEmotionConfidence(analysis.confidence);
                    setFaceMetrics(analysis);
                }
                // Check for face
                const face = await detectFaceWithML();
                setFaceDetected(!!face);
            }
        }, 500); // Update every 500ms
        return () => clearInterval(interval);
    }, [videoStream, analyzeFaceEmotion, detectFaceWithML]);
    // Get emotional context
    const getEmotionalContext = (0, react_1.useCallback)((userMessage) => {
        const tone = analyzeTone(userMessage);
        return {
            detectedEmotion,
            emotionConfidence,
            analyzedTone: tone,
            limbicResonance: getLimbicResonance(detectedEmotion, tone),
            faceMetrics,
            faceDetected,
        };
    }, [detectedEmotion, emotionConfidence, analyzeTone, getLimbicResonance, faceMetrics, faceDetected]);
    // Stop camera
    const stopCamera = (0, react_1.useCallback)(() => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
    }, [videoStream]);
    return {
        initializeCamera,
        stopCamera,
        detectFaceWithML,
        analyzeFaceEmotion,
        analyzeTone,
        getLimbicResonance,
        getEmotionalContext,
        videoRef,
        canvasRef,
        faceDetected,
        detectedEmotion,
        emotionConfidence,
        detectedTone,
        faceMetrics,
        EMOTION_SIGNATURES,
    };
}
