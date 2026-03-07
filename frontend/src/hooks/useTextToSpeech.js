import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for text-to-speech
 * Supports: auto-play, voice selection, rate control, mute toggle,
 * queue system, pause/resume, visual state tracking.
 */
export function useTextToSpeech({
  defaultLang = 'en-US',
  defaultRate = 1.0,
  defaultPitch = 1.0,
} = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(defaultRate);
  const [pitch, setPitch] = useState(defaultPitch);
  const [lang, setLang] = useState(defaultLang);
  const [progress, setProgress] = useState(0); // 0-1 for visual waveform
  const [isSupported, setIsSupported] = useState(true);

  const queueRef = useRef([]);
  const currentUtteranceRef = useRef(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const progressIntervalRef = useRef(null);
  const onEndCallbackRef = useRef(null);

  // Check support
  useEffect(() => {
    if (!synth) {
      setIsSupported(false);
    }
  }, [synth]);

  // Load available voices
  useEffect(() => {
    if (!synth) return;

    const loadVoices = () => {
      const available = synth.getVoices();
      setVoices(available);
      if (!selectedVoice && available.length > 0) {
        // Try to find a good default voice
        const preferred = available.find(v => v.lang.startsWith(lang) && v.localService) 
          || available.find(v => v.lang.startsWith(lang))
          || available.find(v => v.default)
          || available[0];
        setSelectedVoice(preferred);
      }
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      if (synth) synth.onvoiceschanged = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synth, lang]);

  const clearProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(0);
  }, []);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0 || !synth) {
      setIsSpeaking(false);
      clearProgressTracking();
      return;
    }

    const { text, onEnd } = queueRef.current.shift();

    if (isMuted) {
      onEnd?.();
      processQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (selectedVoice) utterance.voice = selectedVoice;

    currentUtteranceRef.current = utterance;
    onEndCallbackRef.current = onEnd;

    // Simulate progress
    const estimatedDuration = (text.length / 15) * 1000 / rate; // rough estimate
    let startTime = Date.now();

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(elapsed / estimatedDuration, 0.95));
      }, 50);
    };

    utterance.onend = () => {
      clearProgressTracking();
      setProgress(1);
      setTimeout(() => setProgress(0), 200);
      onEnd?.();
      currentUtteranceRef.current = null;
      onEndCallbackRef.current = null;
      processQueue();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.warn('TTS error:', event.error);
      }
      clearProgressTracking();
      currentUtteranceRef.current = null;
      onEndCallbackRef.current = null;
      processQueue();
    };

    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);

    synth.speak(utterance);
  }, [synth, isMuted, lang, rate, pitch, selectedVoice, clearProgressTracking]);

  const speak = useCallback((text, onEnd = null) => {
    if (!synth || !text) return;

    queueRef.current.push({ text, onEnd });

    if (!synth.speaking && !synth.pending) {
      processQueue();
    }
  }, [synth, processQueue]);

  const speakImmediate = useCallback((text, onEnd = null) => {
    if (!synth || !text) return;

    // Cancel everything and speak immediately
    synth.cancel();
    queueRef.current = [];
    clearProgressTracking();

    queueRef.current.push({ text, onEnd });
    processQueue();
  }, [synth, clearProgressTracking, processQueue]);

  const pause = useCallback(() => {
    if (synth?.speaking) {
      synth.pause();
      setIsPaused(true);
    }
  }, [synth]);

  const resume = useCallback(() => {
    if (synth?.paused) {
      synth.resume();
      setIsPaused(false);
    }
  }, [synth]);

  const stop = useCallback(() => {
    if (synth) {
      synth.cancel();
      queueRef.current = [];
      clearProgressTracking();
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
      onEndCallbackRef.current = null;
    }
  }, [synth, clearProgressTracking]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev && synth?.speaking) {
        synth.cancel();
        queueRef.current = [];
        clearProgressTracking();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, [synth, clearProgressTracking]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, resume, pause]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
      clearProgressTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    speak,
    speakImmediate,
    pause,
    resume,
    stop,
    toggleMute,
    togglePause,
    isSpeaking,
    isPaused,
    isMuted,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    lang,
    setLang,
    progress,
  };
}
