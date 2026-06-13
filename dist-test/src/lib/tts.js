"use strict";
/**
 * Unified Text-to-Speech Utility for PinIT Career OS
 * Supports ElevenLabs premium voice streaming with a native Web Speech API fallback.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopSpeaking = stopSpeaking;
exports.speakWithAvatar = speakWithAvatar;
const ELEVENLABS_VOICES = {
    priya: '21m00Tcm4TlvDq8ikWAM', // Rachel (Friendly, encouraging female)
    aisha: 'EXAVITQu4vr4xnSDxMaL', // Bella (Clear, structured female)
    rohan: 'ErXwobaYiN019PkySvjV', // Antoni (Energetic tech male)
    vikram: 'pNInz6obpgHsBs27GrYr' // Adam (Deep, results-driven male)
};
let activeAudio = null;
/**
 * Stops any current speech synthesis or audio playbacks.
 */
function stopSpeaking() {
    if (activeAudio) {
        try {
            activeAudio.pause();
            activeAudio.currentTime = 0;
        }
        catch { }
        activeAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}
/**
 * Synthesizes and plays the provided text using ElevenLabs (if API key is present)
 * or falls back to Web Speech API.
 *
 * @param text The text message to speak.
 * @param teacherId The ID of the teacher avatar (priya, aisha, rohan, vikram).
 * @param onStart Callback triggered when speaking starts.
 * @param onEnd Callback triggered when speaking ends.
 * @param isMuted If true, suppresses speech playback.
 */
async function speakWithAvatar(text, teacherId, onStart, onEnd, isMuted = false) {
    stopSpeaking();
    if (isMuted || !text)
        return;
    // Strip emojis and markdown characters from the voice text
    const cleanText = text.replace(/[✦🤖👋🎯💼🔐🔬⚡✨✓⬡*`_#\[\]()]/g, '');
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    if (apiKey) {
        try {
            const voiceId = ELEVENLABS_VOICES[teacherId] || ELEVENLABS_VOICES.priya;
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: cleanText.slice(0, 400),
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`ElevenLabs returned status ${response.status}`);
            }
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            activeAudio = audio;
            audio.onplay = () => {
                onStart();
            };
            audio.onended = () => {
                onEnd();
                URL.revokeObjectURL(audioUrl);
                if (activeAudio === audio)
                    activeAudio = null;
            };
            audio.onerror = () => {
                onEnd();
                URL.revokeObjectURL(audioUrl);
                if (activeAudio === audio)
                    activeAudio = null;
            };
            await audio.play();
            return;
        }
        catch (err) {
            console.warn("ElevenLabs TTS request failed, falling back to Web Speech Synthesis:", err);
        }
    }
    // Fallback: Client-Side Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const isFemale = teacherId === 'priya' || teacherId === 'aisha';
        const preferredVoice = voices.find(v => v.name.includes(isFemale ? 'Female' : 'Male') ||
            v.lang.startsWith('en'));
        if (preferredVoice)
            utterance.voice = preferredVoice;
        utterance.rate = 1.02;
        utterance.onstart = () => onStart();
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
        window.speechSynthesis.speak(utterance);
    }
    else {
        // Basic timeout fallback if WebSpeech is not supported
        onStart();
        setTimeout(() => onEnd(), Math.max(2000, cleanText.length * 45));
    }
}
