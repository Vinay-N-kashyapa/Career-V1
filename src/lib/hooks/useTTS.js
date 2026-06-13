// hooks/useTTS.js — ElevenLabs + browser Web Speech fallback
import { useRef, useCallback } from 'react';

export function useTTS() {
  const audioRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const speakingRef = useRef(false);

  const stop = useCallback(() => {
    speakingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    synthRef.current?.cancel();
  }, []);

  const speak = useCallback(async (text, teacherId = 'priya') => {
    if (!text?.trim()) return;
    stop();
    speakingRef.current = true;

    // Strip markdown for TTS
    const plain = text
      .replace(/[*_`#>~]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 900);

    // Try ElevenLabs via backend
    // Note: we use raw fetch here because the api client only handles JSON
    // responses, but TTS returns an audio blob.
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: plain, teacherId }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (res.ok && speakingRef.current) {
        const blob = await res.blob();
        if (blob.size > 100) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          await new Promise((resolve) => {
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            audio.play().catch(resolve);
          });
          return;
        }
      }
    } catch (_) {
      // Fall through to browser TTS
    }

    if (!speakingRef.current) return;

    // Browser Web Speech API fallback
    const synth = synthRef.current;
    if (!synth) return;
    const utt = new SpeechSynthesisUtterance(plain);
    utt.rate  = 0.92;
    utt.pitch = (teacherId === 'priya' || teacherId === 'aisha') ? 1.1 : 0.88;
    utt.lang  = 'en-US';
    utt.volume = 1;

    // Try to pick a suitable voice
    const voices = synth.getVoices();
    const isFemale = teacherId === 'priya' || teacherId === 'aisha';
    const preferred = voices.find(v =>
      isFemale
        ? /female|woman|zira|samantha|karen|tessa/i.test(v.name)
        : /male|man|david|alex|daniel|rishi/i.test(v.name)
    );
    if (preferred) utt.voice = preferred;

    await new Promise((resolve) => {
      utt.onend   = resolve;
      utt.onerror = resolve;
      synth.speak(utt);
    });
  }, [stop]);

  return { speak, stop };
}
